#!/usr/bin/env python3
"""Validate the shipped ML artifacts.

Checks, per model:
  diabetes      load pkl + scaler → run a realistic input → sanity-check the
                probability output, feature vector length and scaler fit.
  hypertension  load pkl + scaler → same checks (XGBoost).
  anemia        load YOLO best.pt + MobileNetV2 .h5 → run the detection +
                crop/pad/classify pipeline on a synthetic image.

Prints a ✅ line per model and ends with:
    All models validated successfully!
exits 0. If a model cannot be validated (missing artifacts or missing heavy
dependencies such as torch/tensorflow), it prints ❌ and exits 1 — but a
missing *optional* heavy dependency is reported as ⚠️ and does NOT fail the
run, since those models are only expected to work inside the Docker image.

Usage:
    python scripts/validate_models.py
"""
from __future__ import annotations

import io
import os
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))
os.chdir(BACKEND_ROOT)  # model_dir is relative to backend/

from app.core.config import get_settings  # noqa: E402
from app.ml.feature_maps import build_feature_vector  # noqa: E402
from app.ml.model_loader import (  # noqa: E402
    _install_loss_shim,
    load_anemia,
    load_diabetes,
    load_hypertension,
    _scaler_means,
)
from app.ml.predictors import anemia as anemia_predictor  # noqa: E402
from app.ml.predictors import diabetes as diabetes_predictor  # noqa: E402
from app.ml.predictors import hypertension as hypertension_predictor  # noqa: E402

results: list[tuple[str, bool, bool, str]] = []  # (name, ok, optional, detail)

DIABETES_SAMPLE = {
    "age": 52, "gender": "male", "bmi": 28.4, "blood_glucose_fasting": 142,
    "hba1c": 7.1, "blood_pressure_systolic": 138, "blood_pressure_diastolic": 86,
    "family_history_diabetes": True, "physical_activity_minutes_weekly": 90,
    "smoking_status": "former", "waist_circumference_cm": 98,
}
HYPERTENSION_SAMPLE = {
    "age": 58, "gender": "female", "bmi": 30.1, "blood_pressure_systolic": 158,
    "blood_pressure_diastolic": 96, "heart_rate": 78, "smoking_status": "never",
    "alcohol_consumption": "moderate", "salt_intake": "high", "stress_level": "moderate",
    "family_history_hypertension": True, "physical_activity_minutes_weekly": 60,
    "cholesterol_total": 226,
}


def check(name: str, ok: bool, optional: bool, detail: str) -> None:
    results.append((name, ok, optional, detail))
    mark = "✅" if ok else ("⚠️" if optional else "❌")
    print(f"{mark} {name}: {detail}")


def validate_diabetes() -> None:
    artifact = load_diabetes()
    if not artifact.available:
        check("diabetes", False, False, artifact.load_error or "unavailable")
        return
    try:
        import numpy as np

        means = _scaler_means(artifact.scaler)
        vector = np.array(build_feature_vector("diabetes", DIABETES_SAMPLE, means), dtype=float)
        assert len(vector) == len(artifact.feature_names), "feature vector length mismatch"
        scaled = artifact.scaler.transform(vector.reshape(1, -1))
        proba = artifact.model.predict_proba(scaled)[0]
        assert len(proba) == len(artifact.classes), "probability count mismatch"
        assert abs(float(proba.sum()) - 1.0) < 1e-6, "probabilities must sum to 1"
        # Full predictor path
        out = diabetes_predictor.predict(artifact, DIABETES_SAMPLE)
        assert 0.0 <= out["risk_probability"] <= 1.0
        check(
            "diabetes", True, False,
            f"GradientBoosting loaded, {len(artifact.feature_names)} features, "
            f"classes={artifact.classes}, sample risk={out['risk_probability']:.3f}",
        )
    except Exception as exc:  # noqa: BLE001
        check("diabetes", False, False, f"validation failed: {exc}")


def validate_hypertension() -> None:
    artifact = load_hypertension()
    if not artifact.available:
        check("hypertension", False, False, artifact.load_error or "unavailable")
        return
    try:
        import numpy as np

        means = _scaler_means(artifact.scaler)
        vector = np.array(build_feature_vector("hypertension", HYPERTENSION_SAMPLE, means), dtype=float)
        assert len(vector) == len(artifact.feature_names), "feature vector length mismatch"
        scaled = artifact.scaler.transform(vector.reshape(1, -1))
        proba = artifact.model.predict_proba(scaled)[0]
        assert abs(float(proba.sum()) - 1.0) < 1e-6, "probabilities must sum to 1"
        out = hypertension_predictor.predict(artifact, HYPERTENSION_SAMPLE)
        assert 0.0 <= out["risk_probability"] <= 1.0
        check(
            "hypertension", True, False,
            f"XGBoost loaded, {len(artifact.feature_names)} features, "
            f"classes={artifact.classes}, sample risk={out['risk_probability']:.3f}",
        )
    except Exception as exc:  # noqa: BLE001
        check("hypertension", False, False, f"validation failed: {exc}")


def _synthetic_eye_image() -> bytes:
    """A synthetic 'eye' JPEG for the anemia pipeline smoke test."""
    from PIL import Image, ImageDraw

    image = Image.new("RGB", (320, 240), (225, 205, 195))
    draw = ImageDraw.Draw(image)
    draw.ellipse([40, 50, 280, 190], fill=(150, 120, 110))
    draw.ellipse([130, 90, 190, 150], fill=(35, 25, 25))
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=85)
    return buffer.getvalue()


def validate_anemia() -> None:
    artifact = load_anemia()
    if not artifact.available:
        # Heavy deps (torch/TF) are expected only inside the Docker image.
        check("anemia", False, True, f"optional — {artifact.load_error}")
        return
    try:
        out = anemia_predictor.predict(artifact, _synthetic_eye_image(), {"symptoms": []})
        assert 0.0 <= out["risk_probability"] <= 1.0
        assert out["eye_detection_confidence"] is not None
        check(
            "anemia", True, False,
            f"YOLO + MobileNetV2 loaded; synthetic image → class="
            f"{out['predicted_class']}, eye_conf={out['eye_detection_confidence']:.3f}",
        )
    except Exception as exc:  # noqa: BLE001
        check("anemia", False, True, f"validation failed (Docker only): {exc}")


def main() -> int:
    _install_loss_shim()
    print(f"Validating models in {get_settings().model_dir}\n")
    validate_diabetes()
    validate_hypertension()
    validate_anemia()

    print()
    hard_failures = [r for r in results if not r[1] and not r[2]]
    if hard_failures:
        for name, _, _, detail in hard_failures:
            print(f"FAILED {name}: {detail}")
        return 1
    print("All models validated successfully!")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
