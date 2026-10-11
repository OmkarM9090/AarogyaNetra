"""Diabetes risk predictor (sklearn GradientBoosting + StandardScaler)."""
from __future__ import annotations

from typing import Any

import numpy as np

from app.ml.feature_maps import build_feature_vector
from app.ml.model_loader import ModelArtifact, _scaler_means


def predict(artifact: ModelArtifact, payload: dict[str, Any]) -> dict[str, Any]:
    """Return raw model output as a stable dict.

    Output keys: ``class_probabilities`` (dict label->prob), ``predicted_class``,
    ``confidence``, ``feature_importance`` (list of {feature, contribution}).
    """
    model = artifact.model
    scaler = artifact.scaler
    means = _scaler_means(scaler)
    vector = np.array(build_feature_vector("diabetes", payload, means), dtype=float).reshape(1, -1)
    if scaler is not None:
        vector = scaler.transform(vector)

    proba = model.predict_proba(vector)[0]
    classes = np.asarray(model.classes_)
    class_probabilities = {str(c): float(p) for c, p in zip(classes, proba)}

    # Positive-class probability drives the risk score.
    positive = classes[-1] if classes[-1] in (1, "1", "positive", True) else classes[0]
    pos_index = int(list(classes).index(positive))
    risk_probability = float(proba[pos_index])

    predicted = int(classes[int(np.argmax(proba))])

    importance: list[dict[str, Any]] = []
    fi = getattr(model, "feature_importances_", None)
    if fi is not None:
        fi = np.asarray(fi, dtype=float)
        total = float(fi.sum()) or 1.0
        for name, value in zip(artifact.feature_names, fi):
            importance.append({"feature": name, "contribution": round(float(value / total), 4)})
        importance.sort(key=lambda item: item["contribution"], reverse=True)

    return {
        "class_probabilities": class_probabilities,
        "predicted_class": predicted,
        "confidence": round(float(risk_probability), 4),
        "risk_probability": risk_probability,
        "feature_importance": importance,
    }
