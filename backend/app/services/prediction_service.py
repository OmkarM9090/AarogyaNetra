"""Prediction reads: paginated list, detail, per-user risk summary."""
from __future__ import annotations

from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.envelope import ERR_NOT_FOUND, ApiError
from app.core.medical import MEDICAL_DISCLAIMER
from app.ml.risk import risk_level_for

COLLECTION = "predictions"
CONDITIONS = ("diabetes", "hypertension", "anemia")


def _public(doc: dict) -> dict:
    out = {k: v for k, v in doc.items() if k != "_id"}
    out["id"] = doc["_id"]
    if isinstance(out.get("createdAt"), datetime):
        out["createdAt"] = out["createdAt"].isoformat()
    return out


async def get_prediction(db: AsyncIOMotorDatabase, prediction_id: str, user_id: str) -> dict:
    doc = await db[COLLECTION].find_one({"_id": prediction_id, "userId": user_id})
    if doc is None:
        raise ApiError(ERR_NOT_FOUND, "Prediction not found.", status=404)
    return _public(doc)


async def list_predictions(
    db: AsyncIOMotorDatabase, user_id: str, skip: int, limit: int
) -> dict:
    coll = db[COLLECTION]
    total = await coll.count_documents({"userId": user_id})
    cursor = coll.find({"userId": user_id}).sort("createdAt", -1).skip(skip).limit(limit)
    items = [_public(d) async for d in cursor]
    return {"items": items, "total": total}


def _summary_entry(
    condition: str, latest: dict | None, fallback_version: str
) -> dict:
    if latest is None:
        return {
            "condition": condition,
            "riskScore": 0,
            "riskLevel": "low",
            "confidence": 0,
            "modelVersion": fallback_version,
            "lastPredictedAt": None,
        }
    created = latest.get("createdAt")
    return {
        "condition": condition,
        "riskScore": latest.get("riskScore", 0),
        "riskLevel": latest.get("riskLevel", risk_level_for(latest.get("riskScore", 0))),
        "confidence": latest.get("confidence", 0),
        "modelVersion": latest.get("modelVersion", fallback_version),
        "lastPredictedAt": created.isoformat() if isinstance(created, datetime) else created,
    }


async def get_risk_summary(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    """Latest prediction per condition + overall score (max of the latest)."""
    from app.ml.model_registry import get_registry

    registry = get_registry()
    status = registry.status()
    versions = {
        condition: status["models"].get(condition, {}).get("version", "unknown")
        for condition in CONDITIONS
    }

    latest: dict[str, dict | None] = {condition: None for condition in CONDITIONS}
    for condition in CONDITIONS:
        doc = (
            await db[COLLECTION]
            .find({"userId": user_id, "condition": condition})
            .sort("createdAt", -1)
            .limit(1)
            .to_list(length=1)
        )
        if doc:
            latest[condition] = doc[0]

    entries = {c: _summary_entry(c, latest[c], versions[c]) for c in CONDITIONS}
    overall = max(e["riskScore"] for e in entries.values())
    total_scans = await db["scans"].count_documents({"userId": user_id})

    return {
        "overallRiskScore": overall,
        "riskByCondition": entries,
        "totalScans": total_scans,
        "disclaimer": MEDICAL_DISCLAIMER,
    }
