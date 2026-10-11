"""Scan orchestration: persist scan → run model → persist prediction.

Flow:
  1. Insert the scan document (status=processing).
  2. For anemia, store the eye image in GridFS.
  3. Run the registered model via the condition predictor.
  4. Build the camelCase PredictionResult (recommendations + key metrics +
     disclaimer) and insert it.
  5. Mark the scan completed (or failed on error) — the error propagates to
     the API as a unified envelope.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.envelope import ApiError
from app.core.medical import MEDICAL_DISCLAIMER
from app.ml.model_registry import get_registry
from app.ml.predictors import anemia as anemia_predictor
from app.ml.predictors import diabetes as diabetes_predictor
from app.ml.predictors import hypertension as hypertension_predictor
from app.ml.risk import risk_level_for, score_from_probability
from app.services import recommendation_engine

logger = logging.getLogger("aarogyanetra.scans")

SCAN_COLLECTION = "scans"
PREDICTION_COLLECTION = "predictions"
IMAGE_COLLECTION = "eye_images"  # {filename, bytes, contentType, uploadedAt}

PREDICTORS = {
    "diabetes": diabetes_predictor,
    "hypertension": hypertension_predictor,
    "anemia": anemia_predictor,
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _clean_payload(payload: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in payload.items() if v is not None}


def _key_metrics(condition: str, payload: dict[str, Any], predicted_class: Any) -> dict[str, dict]:
    metrics: dict[str, dict] = {}
    if condition == "diabetes":
        if payload.get("blood_glucose_fasting") is not None:
            metrics["blood_glucose_fasting"] = {
                "label": "Fasting glucose",
                "value": payload["blood_glucose_fasting"],
                "unit": "mg/dL",
            }
        if payload.get("hba1c") is not None:
            metrics["hba1c"] = {"label": "HbA1c", "value": payload["hba1c"], "unit": "%"}
        sys_b = payload.get("blood_pressure_systolic")
        dia_b = payload.get("blood_pressure_diastolic")
        if sys_b is not None and dia_b is not None:
            metrics["blood_pressure"] = {
                "label": "Blood pressure",
                "value": f"{sys_b}/{dia_b}",
                "unit": "mmHg",
            }
        if payload.get("bmi") is not None:
            metrics["bmi"] = {"label": "BMI", "value": payload["bmi"], "unit": "kg/m²"}
    elif condition == "hypertension":
        sys_b = payload.get("blood_pressure_systolic")
        dia_b = payload.get("blood_pressure_diastolic")
        if sys_b is not None and dia_b is not None:
            metrics["blood_pressure"] = {
                "label": "Blood pressure",
                "value": f"{sys_b}/{dia_b}",
                "unit": "mmHg",
            }
        if payload.get("heart_rate") is not None:
            metrics["heart_rate"] = {"label": "Heart rate", "value": payload["heart_rate"], "unit": "bpm"}
        if payload.get("cholesterol_total") is not None:
            metrics["cholesterol_total"] = {
                "label": "Total cholesterol",
                "value": payload["cholesterol_total"],
                "unit": "mg/dL",
            }
        if payload.get("bmi") is not None:
            metrics["bmi"] = {"label": "BMI", "value": payload["bmi"], "unit": "kg/m²"}
    elif condition == "anemia":
        metrics["severity"] = {
            "label": "Detected category",
            "value": str(predicted_class),
            "unit": "",
        }
    return metrics


def _build_prediction(
    user_id: str,
    scan_id: str,
    condition: str,
    payload: dict[str, Any],
    model_output: dict[str, Any],
    model_version: str,
    image_path: str | None,
) -> dict[str, Any]:
    risk_score = score_from_probability(model_output["risk_probability"])
    risk_level = risk_level_for(risk_score)
    recommendations = recommendation_engine.generate_recommendations(
        condition, payload, risk_score, model_output["predicted_class"]
    )
    prediction: dict[str, Any] = {
        "_id": uuid.uuid4().hex,
        "userId": user_id,
        "scanId": scan_id,
        "condition": condition,
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "confidence": model_output["confidence"],
        "modelVersion": model_version,
        "inputFeatures": _clean_payload(payload),
        "outputRaw": {
            "classProbabilities": model_output["class_probabilities"],
            "predictedClass": model_output["predicted_class"],
        },
        "recommendations": recommendations,
        "keyMetrics": _key_metrics(condition, payload, model_output["predicted_class"]),
        "disclaimer": MEDICAL_DISCLAIMER,
        "createdAt": _now(),
    }
    if model_output.get("feature_importance"):
        prediction["featureImportance"] = model_output["feature_importance"]
    if condition == "anemia":
        prediction["eyeDetectionConfidence"] = model_output.get("eye_detection_confidence")
    if image_path:
        prediction["imagePath"] = image_path
    return prediction


async def submit_scan(
    db: AsyncIOMotorDatabase,
    user_id: str,
    condition: str,
    payload: dict[str, Any],
    image_bytes: bytes | None = None,
) -> tuple[dict[str, Any], dict[str, Any]]:
    """Run one scan end-to-end. Returns (public_scan, public_prediction)."""
    scan_id = uuid.uuid4().hex
    now = _now()
    scans = db[SCAN_COLLECTION]

    scan_doc = {
        "_id": scan_id,
        "userId": user_id,
        "scanType": condition,
        "status": "processing",
        "scanData": _clean_payload(payload),
        "imagePath": None,
        "createdAt": now,
        "updatedAt": now,
    }
    await scans.insert_one(scan_doc)

    try:
        # ── Anemia: persist the eye image (uploads ≤ 5 MB cap) ──────
        image_path: str | None = None
        if condition == "anemia" and image_bytes:
            image_path = f"scans/{scan_id}/eye.jpg"
            await db[IMAGE_COLLECTION].insert_one(
                {
                    "filename": image_path,
                    "userId": user_id,
                    "bytes": image_bytes,
                    "contentType": "image/jpeg",
                    "uploadedAt": _now(),
                }
            )
            await scans.update_one(
                {"_id": scan_id}, {"$set": {"imagePath": image_path}}
            )

        # ── Run the model ───────────────────────────────────────────
        registry = get_registry()
        artifact = registry.get(condition)
        predictor = PREDICTORS[condition]
        if condition == "anemia":
            if not image_bytes:
                raise ApiError("invalid_upload", "eye_image is required for anemia screening.", status=400)
            model_output = predictor.predict(artifact, image_bytes, payload)
        else:
            model_output = predictor.predict(artifact, payload)

        # ── Persist the prediction ──────────────────────────────────
        prediction_doc = _build_prediction(
            user_id, scan_id, condition, payload, model_output, artifact.version, image_path
        )
        await db[PREDICTION_COLLECTION].insert_one(prediction_doc)

        await scans.update_one(
            {"_id": scan_id},
            {"$set": {"status": "completed", "predictionId": prediction_doc["_id"], "updatedAt": _now()}},
        )
        logger.info(
            "scan completed user=%s condition=%s scan=%s risk=%.1f",
            user_id, condition, scan_id, prediction_doc["riskScore"],
        )
        public_prediction = {k: v for k, v in prediction_doc.items() if k != "_id"}
        public_prediction["id"] = prediction_doc["_id"]
        public_scan = await _public_scan(db, scan_id)
        return public_scan, public_prediction

    except Exception:
        await scans.update_one(
            {"_id": scan_id},
            {"$set": {"status": "failed", "updatedAt": _now()}},
        )
        raise


async def _public_scan(db: AsyncIOMotorDatabase, scan_id: str) -> dict[str, Any]:
    doc = await db[SCAN_COLLECTION].find_one({"_id": scan_id})
    return _public_scan_doc(db, doc)


async def _public_scan_doc(db: AsyncIOMotorDatabase, doc: dict[str, Any]) -> dict[str, Any]:
    if doc is None:
        return {}
    out = {
        "id": doc["_id"],
        "userId": doc.get("userId"),
        "scanType": doc.get("scanType"),
        "status": doc.get("status"),
        "scanData": doc.get("scanData", {}),
        "imagePath": doc.get("imagePath"),
        "createdAt": doc.get("createdAt").isoformat() if isinstance(doc.get("createdAt"), datetime) else doc.get("createdAt"),
    }
    if doc.get("predictionId"):
        pred = await db[PREDICTION_COLLECTION].find_one({"_id": doc["predictionId"]})
        if pred is not None:
            out["prediction"] = _public_prediction(pred)
    else:
        out["prediction"] = None
    return out


def _public_prediction(doc: dict[str, Any]) -> dict[str, Any]:
    out = {k: v for k, v in doc.items() if k != "_id"}
    out["id"] = doc["_id"]
    if isinstance(out.get("createdAt"), datetime):
        out["createdAt"] = out["createdAt"].isoformat()
    return out


async def get_scan(db: AsyncIOMotorDatabase, scan_id: str, user_id: str) -> dict[str, Any]:
    doc = await db[SCAN_COLLECTION].find_one({"_id": scan_id, "userId": user_id})
    if doc is None:
        from app.core.envelope import ERR_NOT_FOUND

        raise ApiError(ERR_NOT_FOUND, "Scan not found.", status=404)
    return await _public_scan_doc(db, doc)


async def list_scans(db: AsyncIOMotorDatabase, user_id: str, skip: int, limit: int) -> dict[str, Any]:
    scans = db[SCAN_COLLECTION]
    total = await scans.count_documents({"userId": user_id})
    cursor = scans.find({"userId": user_id}).sort("createdAt", -1).skip(skip).limit(limit)
    docs = [await _public_scan_doc(db, d) async for d in cursor]
    return {"items": docs, "total": total}
