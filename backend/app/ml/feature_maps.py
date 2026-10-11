"""Canonical feature vectors for the trained models.

The shipped ``.pkl`` artifacts were pickled from plain NumPy arrays, so
``feature_names_in_`` is empty. The order below is the training-time column
order (it matches the mobile form payloads exactly). If a model is ever
retrained, re-validate with ``scripts/validate_models.py``.

Categoricals use fixed ordinal encodings:
  gender          male=1 / female=0
  smoking_status  never=0 / former=1 / current=2
  alcohol         none=0 / moderate=1 / heavy=2
  salt_intake     low=0 / moderate=1 / high=2
  stress_level    low=0 / moderate=1 / high=2
  *_history_*     True=1 / False=0
"""
from __future__ import annotations

from typing import Any

DIABETES_FEATURES: list[str] = [
    "age",
    "gender",
    "bmi",
    "blood_glucose_fasting",
    "hba1c",
    "blood_pressure_systolic",
    "blood_pressure_diastolic",
    "family_history_diabetes",
    "physical_activity_minutes_weekly",
    "smoking_status",
    "waist_circumference_cm",
]

HYPERTENSION_FEATURES: list[str] = [
    "age",
    "gender",
    "bmi",
    "blood_pressure_systolic",
    "blood_pressure_diastolic",
    "heart_rate",
    "cholesterol_total",
    "smoking_status",
    "alcohol_consumption",
    "salt_intake",
    "stress_level",
    "family_history_hypertension",
    "physical_activity_minutes_weekly",
]

FEATURE_MAPS: dict[str, list[str]] = {
    "diabetes": DIABETES_FEATURES,
    "hypertension": HYPERTENSION_FEATURES,
}

_ENCODERS: dict[str, dict[str, float]] = {
    "gender": {"male": 1.0, "female": 0.0},
    "smoking_status": {"never": 0.0, "former": 1.0, "current": 2.0},
    "alcohol_consumption": {"none": 0.0, "moderate": 1.0, "heavy": 2.0},
    "salt_intake": {"low": 0.0, "moderate": 1.0, "high": 2.0},
    "stress_level": {"low": 0.0, "moderate": 1.0, "high": 2.0},
}


def _encode(name: str, value: Any, missing_default: float) -> float:
    """Resolve one feature value to a float.

    - categorical → ordinal encoding
    - bool → 1/0
    - numeric → float(value)
    - missing (None) → ``missing_default`` (scaler mean, so the feature is
      neutral after standardization)
    """
    if value is None:
        return missing_default
    if name in _ENCODERS:
        return _ENCODERS[name].get(str(value).lower(), missing_default)
    if isinstance(value, bool):
        return 1.0 if value else 0.0
    return float(value)


def build_feature_vector(
    condition: str,
    payload: dict[str, Any],
    scaler_means: list[float] | None = None,
) -> list[float]:
    """Build the model input vector for ``condition`` from a snake_case payload.

    ``scaler_means`` lets missing optional features impute to the training
    mean (zero after scaling). Falls back to 0.0 when not provided.
    """
    names = FEATURE_MAPS[condition]
    means = scaler_means or []
    vector: list[float] = []
    for i, name in enumerate(names):
        default = means[i] if i < len(means) else 0.0
        vector.append(_encode(name, payload.get(name), default))
    return vector
