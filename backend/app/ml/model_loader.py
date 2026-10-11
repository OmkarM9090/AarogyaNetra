"""Loaders for the three shipped ML artifacts.

Each loader is defensive: it returns a ``ModelArtifact`` with
``available=False`` and a ``load_error`` message instead of raising, so the
API can start and serve everything except the affected condition.

Artifacts (under ``Settings.model_dir``):
  diabetes/diabetes_model.pkl + diabetes_scaler.pkl      (sklearn GBC)
  hypertension/hypertension_model.pkl + _scaler.pkl      (XGBoost)
  anemia/best.pt (YOLO) + anemia_mobilenetv2.h5 (TF)     (optional deps)
"""
from __future__ import annotations

import logging
import os
import sys
from dataclasses import dataclass, field
from typing import Any

import joblib
import numpy as np

from app.core.config import get_settings
from app.ml.feature_maps import FEATURE_MAPS

logger = logging.getLogger("aarogyanetra.ml")


def _install_loss_shim() -> None:
    """The diabetes pkl references a module named ``_loss``.

    It was pickled in an environment where ``sklearn._loss._loss`` (the C
    extension) was imported under that bare name. Re-create the alias before
    unpickling.
    """
    if "_loss" not in sys.modules:
        try:
            import sklearn._loss._loss as _loss_c  # noqa: WPS433

            sys.modules["_loss"] = _loss_c
        except Exception:  # noqa: BLE001 — shim is best-effort
            logger.warning("Could not install _loss shim for model loading")


def _version_from_file(path: str) -> str:
    """Derive a stable version string from the artifact (mtime-based)."""
    try:
        mtime = int(os.path.getmtime(path))
        return f"artifact-{mtime}"
    except OSError:
        return "unknown"


@dataclass
class ModelArtifact:
    """A loaded (or failed-to-load) model plus its metadata."""

    condition: str
    available: bool = False
    model: Any = None
    scaler: Any = None
    feature_names: list[str] = field(default_factory=list)
    version: str = "unknown"
    classes: list[Any] = field(default_factory=list)
    load_error: str | None = None
    detector: Any = None  # YOLO model for anemia (optional)
    classifier: Any = None  # MobileNetV2 TF model for anemia (optional)

    def metadata(self) -> dict[str, Any]:
        return {
            "condition": self.condition,
            "available": self.available,
            "version": self.version,
            "featureCount": len(self.feature_names),
            "featureNames": self.feature_names,
            "classes": [str(c) for c in self.classes],
            "error": self.load_error,
            "loadedAt": _now_iso(),
        }


def _now_iso() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _auto_feature_names(model: Any, condition: str) -> list[str]:
    """Use feature_names_in_ if present, otherwise the canonical map.

    ``n_features_in_`` may be an int (sklearn) or an array; handle both.
    """
    raw_names = list(getattr(model, "feature_names_in_", []) or [])
    n_features = getattr(model, "n_features_in_", None)
    expected = int(n_features) if isinstance(n_features, (int, np.integer)) else len(raw_names)
    if raw_names and len(raw_names) == expected and expected > 0:
        return raw_names
    return list(FEATURE_MAPS[condition])


def _scaler_means(scaler: Any) -> list[float] | None:
    mean = getattr(scaler, "mean_", None)
    if mean is None:
        return None
    return [float(m) for m in np.asarray(mean).ravel()]


def load_diabetes() -> ModelArtifact:
    settings = get_settings()
    model_path = os.path.join(settings.model_dir, "diabetes", "diabetes_model.pkl")
    scaler_path = os.path.join(settings.model_dir, "diabetes", "diabetes_scaler.pkl")
    artifact = ModelArtifact(condition="diabetes")
    if not (os.path.exists(model_path) and os.path.exists(scaler_path)):
        artifact.load_error = f"artifacts missing at {settings.model_dir}/diabetes"
        logger.warning("diabetes model unavailable: %s", artifact.load_error)
        return artifact
    try:
        _install_loss_shim()
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
        artifact.model = model
        artifact.scaler = scaler
        artifact.feature_names = _auto_feature_names(model, "diabetes")
        artifact.classes = [int(c) for c in np.asarray(model.classes_).ravel()]
        artifact.version = _version_from_file(model_path)
        artifact.available = True
        logger.info(
            "diabetes model loaded (%s, %d features, classes=%s)",
            type(model).__name__,
            len(artifact.feature_names),
            artifact.classes,
        )
    except Exception as exc:  # noqa: BLE001
        artifact.load_error = str(exc)
        logger.exception("diabetes model failed to load")
    return artifact


def load_hypertension() -> ModelArtifact:
    settings = get_settings()
    model_path = os.path.join(settings.model_dir, "hypertension", "hypertension_model.pkl")
    scaler_path = os.path.join(settings.model_dir, "hypertension", "hypertension_scaler.pkl")
    artifact = ModelArtifact(condition="hypertension")
    if not (os.path.exists(model_path) and os.path.exists(scaler_path)):
        artifact.load_error = f"artifacts missing at {settings.model_dir}/hypertension"
        logger.warning("hypertension model unavailable: %s", artifact.load_error)
        return artifact
    try:
        try:
            import xgboost  # noqa: F401
        except ImportError as exc:
            raise RuntimeError("xgboost is required to load the hypertension model") from exc
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
        artifact.model = model
        artifact.scaler = scaler
        artifact.feature_names = _auto_feature_names(model, "hypertension")
        artifact.classes = [int(c) for c in np.asarray(model.classes_).ravel()]
        artifact.version = _version_from_file(model_path)
        artifact.available = True
        logger.info(
            "hypertension model loaded (%s, %d features, classes=%s)",
            type(model).__name__,
            len(artifact.feature_names),
            artifact.classes,
        )
    except Exception as exc:  # noqa: BLE001
        artifact.load_error = str(exc)
        logger.exception("hypertension model failed to load")
    return artifact


def load_anemia() -> ModelArtifact:
    """Load YOLO eye detector + MobileNetV2 classifier (optional heavy deps)."""
    settings = get_settings()
    yolo_path = os.path.join(settings.model_dir, "anemia", "best.pt")
    h5_path = os.path.join(settings.model_dir, "anemia", "anemia_mobilenetv2.h5")
    artifact = ModelArtifact(condition="anemia")
    missing = []
    if not os.path.exists(yolo_path):
        missing.append("best.pt")
    if not os.path.exists(h5_path):
        missing.append("anemia_mobilenetv2.h5")
    if missing:
        artifact.load_error = f"artifacts missing: {', '.join(missing)}"
        logger.warning("anemia model unavailable: %s", artifact.load_error)
        return artifact

    errors: list[str] = []
    try:
        from ultralytics import YOLO

        artifact.detector = YOLO(yolo_path)
    except Exception as exc:  # noqa: BLE001
        errors.append(f"yolo: {exc}")
    try:
        import tensorflow as tf

        artifact.classifier = tf.keras.models.load_model(h5_path)
    except Exception as exc:  # noqa: BLE001
        errors.append(f"mobilenet: {exc}")

    if artifact.detector is not None and artifact.classifier is not None:
        artifact.version = _version_from_file(yolo_path)
        artifact.available = True
        logger.info("anemia model loaded (YOLO + MobileNetV2)")
    else:
        artifact.load_error = "; ".join(errors) or "heavy dependencies (torch/ultralytics/tensorflow) missing"
        logger.warning("anemia model unavailable: %s", artifact.load_error)
    return artifact


LOADERS = {
    "diabetes": load_diabetes,
    "hypertension": load_hypertension,
    "anemia": load_anemia,
}
