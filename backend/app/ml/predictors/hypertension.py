"""Hypertension risk predictor (XGBoost + StandardScaler)."""
from __future__ import annotations

from typing import Any

import numpy as np

from app.ml.feature_maps import build_feature_vector
from app.ml.model_loader import ModelArtifact, _scaler_means


def predict(artifact: ModelArtifact, payload: dict[str, Any]) -> dict[str, Any]:
    model = artifact.model
    scaler = artifact.scaler
    means = _scaler_means(scaler)
    vector = np.array(build_feature_vector("hypertension", payload, means), dtype=float).reshape(1, -1)
    if scaler is not None:
        vector = scaler.transform(vector)

    proba = model.predict_proba(vector)[0]
    classes = np.asarray(model.classes_)
    class_probabilities = {str(c): float(p) for c, p in zip(classes, proba)}

    positive = classes[-1] if classes[-1] in (1, "1", "positive", True) else classes[0]
    pos_index = int(list(classes).index(positive))
    risk_probability = float(proba[pos_index])
    predicted = int(classes[int(np.argmax(proba))])

    importance: list[dict[str, Any]] = []
    fi = None
    booster = getattr(model, "get_booster", None)
    if booster is not None:
        try:
            fi = booster.get_score(importance_type="weight")
        except Exception:  # noqa: BLE001
            fi = None
    if fi:
        total = float(sum(fi.values())) or 1.0
        for feature, weight in sorted(fi.items(), key=lambda kv: kv[1], reverse=True):
            importance.append({"feature": feature, "contribution": round(weight / total, 4)})

    return {
        "class_probabilities": class_probabilities,
        "predicted_class": predicted,
        "confidence": round(float(risk_probability), 4),
        "risk_probability": risk_probability,
        "feature_importance": importance,
    }
