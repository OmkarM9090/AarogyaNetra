"""Anemia predictor: YOLO eye detection → crop/pad → MobileNetV2.

Pipeline (server-side, per Phase 3 spec):
  1. Open the uploaded eye image (JPEG/PNG bytes).
  2. YOLO detects the eye region. No detection → hard error
     ``no_eye_detected`` (422) — the mobile UI shows "No eye region detected".
  3. Crop the eye box, pad to a square, resize to 224×224.
  4. MobileNetV2 (.h5) scores the crop. The output head is auto-detected:
     - 1 unit  → regression (estimated hemoglobin g/dL) → mapped to a
       severity class with clinical cutoffs.
     - 2+ units → classification; later classes are assumed more severe
       (ordinal), which drives the 0-100 risk score.
"""
from __future__ import annotations

import io
import logging
from typing import Any

import numpy as np
from PIL import Image

from app.core.envelope import ApiError, ERR_NO_EYE_DETECTED, ERR_UPLOAD_INVALID
from app.ml.model_loader import ModelArtifact

logger = logging.getLogger("aarogyanetra.ml.anemia")

INPUT_SIZE = 224
# ImageNet normalization for MobileNetV2
_IMAGENET_MEAN = np.array([123.68, 116.78, 103.94], dtype=np.float32)

# Hb (g/dL) severity cutoffs used when the head is a regression.
# (mild 10-12, moderate 8-10, severe < 8 — standard adult thresholds,
# midpoint 12.5 g/dL between typical male/female lower normals)
HB_CUTOFFS = [(12.5, "normal"), (10.0, "mild"), (8.0, "moderate")]
SEVERITY_ORDER = ["normal", "mild", "moderate", "severe"]


def _fail(code: str, message: str, status: int) -> None:
    raise ApiError(code, message, status=status)


def _detect_eye(detector: Any, image: Image.Image) -> tuple[tuple[float, float, float, float], float]:
    """Run YOLO; return (bbox_xywh, confidence). Raises no_eye_detected."""
    results = detector(image, verbose=False)
    if not results:
        _fail(ERR_NO_EYE_DETECTED, "No eye region detected", 422)
    boxes = getattr(results[0], "boxes", None)
    if boxes is None or len(boxes) == 0:
        _fail(ERR_NO_EYE_DETECTED, "No eye region detected", 422)

    best_box = None
    best_conf = 0.0
    for box in boxes:
        try:
            conf = float(box.conf[0]) if box.conf is not None else 0.0
        except Exception:  # noqa: BLE001
            conf = 0.0
        # Prefer a class literally named "eye" when labels exist.
        labels = getattr(results[0], "names", None) or {}
        cls_id = int(box.cls[0]) if box.cls is not None else 0
        cls_name = str(labels.get(cls_id, "")).lower()
        prefer = 1.0 if "eye" in cls_name or "pupil" in cls_name or "iris" in cls_name else 0.5
        score = conf * prefer
        if score > best_conf:
            best_conf = score
            best_box = box

    if best_box is None:
        _fail(ERR_NO_EYE_DETECTED, "No eye region detected", 422)
    x1, y1, x2, y2 = (float(v) for v in best_box.xyxy[0])
    return (x1, y1, x2, y2), max(best_conf, float(best_box.conf[0]) if best_box.conf is not None else 0.0)


def _crop_pad_resize(image: Image.Image, bbox: tuple[float, float, float, float]) -> np.ndarray:
    """Crop the eye box, pad to a square (max extent), resize 224×224 RGB float."""
    w, h = image.size
    x1, y1, x2, y2 = bbox
    x1 = max(0.0, min(x1, w))
    y1 = max(0.0, min(y1, h))
    x2 = max(0.0, min(x2, w))
    y2 = max(0.0, min(y2, h))
    if x2 - x1 < 8 or y2 - y1 < 8:
        _fail(ERR_NO_EYE_DETECTED, "No eye region detected", 422)

    box = image.crop((int(x1), int(y1), int(x2), int(y2))).convert("RGB")
    bw, bh = box.size
    side = max(bw, bh)
    canvas = Image.new("RGB", (side, side), (255, 255, 255))
    canvas.paste(box, ((side - bw) // 2, (side - bh) // 2))
    resized = canvas.resize((INPUT_SIZE, INPUT_SIZE), Image.BILINEAR)
    arr = np.asarray(resized, dtype=np.float32)
    return arr - _IMAGENET_MEAN


def _regression_to_severity(hb: float) -> tuple[str, float]:
    for cutoff, label in HB_CUTOFFS:
        if hb >= cutoff:
            return label, 1.0
    return "severe", 1.0


def predict(artifact: ModelArtifact, image_bytes: bytes, payload: dict[str, Any]) -> dict[str, Any]:
    if not image_bytes:
        _fail(ERR_UPLOAD_INVALID, "eye_image is empty", 400)

    try:
        image = Image.open(io.BytesIO(image_bytes))
        image.load()
    except Exception as exc:  # noqa: BLE001
        _fail(ERR_UPLOAD_INVALID, f"Could not read the uploaded image: {exc}", 400)

    if artifact.detector is None or artifact.classifier is None:
        raise ApiError(
            "model_unavailable",
            "The anemia screening model is currently unavailable. Please try again later.",
            status=503,
        )

    bbox, eye_conf = _detect_eye(artifact.detector, image)
    tensor = _crop_pad_resize(image, bbox)
    batch = tensor[np.newaxis, ...]

    output = np.asarray(artifact.classifier.predict(batch))
    output = output.reshape(-1)

    if output.shape[0] == 1:
        # Regression head: estimated hemoglobin (g/dL).
        hb = float(np.clip(output[0], 4.0, 20.0))
        severity, _ = _regression_to_severity(hb)
        severity_index = SEVERITY_ORDER.index(severity)
        class_probabilities = {label: (1.0 if label == severity else 0.0) for label in SEVERITY_ORDER}
        predicted_class = severity
        risk_probability = severity_index / (len(SEVERITY_ORDER) - 1)
    else:
        # Classification head: ordinal severity (later = worse).
        if output.max() > 0:
            class_probabilities = {
                str(i): float(p) for i, p in enumerate(output)
            }
            # Remap numeric labels to ordinal severity names when counts match.
            if len(output) == len(SEVERITY_ORDER):
                class_probabilities = {
                    name: float(output[i]) for i, name in enumerate(SEVERITY_ORDER)
                }
            predicted_class = SEVERITY_ORDER[int(np.argmax(output))] if len(output) == len(SEVERITY_ORDER) else int(np.argmax(output))
            risk_probability = float(np.argmax(output)) / max(len(output) - 1, 1)
        else:
            class_probabilities = {str(i): 0.0 for i in range(len(output))}
            predicted_class = 0
            risk_probability = 0.0

    return {
        "class_probabilities": class_probabilities,
        "predicted_class": predicted_class,
        "confidence": round(float(eye_conf), 4),
        "risk_probability": round(float(risk_probability), 4),
        "eye_detection_confidence": round(float(eye_conf), 4),
        "feature_importance": [],
    }
