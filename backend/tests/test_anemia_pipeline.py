"""Anemia predictor unit tests with stubbed YOLO/MobileNetV2 (no torch/TF)."""
from types import SimpleNamespace

import numpy as np
import pytest

from app.core.envelope import ApiError
from app.ml.model_loader import ModelArtifact
from app.ml.predictors import anemia as anemia_predictor


def _jpeg_bytes() -> bytes:
    from PIL import Image

    image = Image.new("RGB", (320, 240), (220, 200, 190))
    buffer = __import__("io").BytesIO()
    image.save(buffer, format="JPEG")
    return buffer.getvalue()


def _artifact(detector, output: np.ndarray) -> ModelArtifact:
    return ModelArtifact(
        condition="anemia",
        available=True,
        detector=detector,
        classifier=SimpleNamespace(predict=lambda batch: output[np.newaxis, :]),
    )


class FakeBox:
    def __init__(self, xyxy, conf, cls):
        self.xyxy = [np.array(xyxy, dtype=float)]
        self.conf = np.array([conf])
        self.cls = np.array([cls])


class FakeDetector:
    """Mimics ultralytics YOLO results."""

    def __init__(self, boxes):
        # boxes: list of (xyxy, conf, cls) tuples
        self._boxes = [FakeBox(xyxy, conf, cls) for xyxy, conf, cls in boxes]

    def __call__(self, image, verbose=False):
        result = SimpleNamespace(boxes=self._boxes, names={0: "eye"})
        return [result]


def test_no_eye_region_detected_error():
    detector = FakeDetector(boxes=[])  # empty boxes list
    artifact = _artifact(detector, np.array([0.9, 0.1]))
    with pytest.raises(ApiError) as excinfo:
        anemia_predictor.predict(artifact, _jpeg_bytes(), {"symptoms": []})
    assert excinfo.value.code == "no_eye_detected"
    assert "No eye region detected" in excinfo.value.message
    assert excinfo.value.status == 422


def test_binary_classification_output():
    detector = FakeDetector(boxes=[([40.0, 50.0, 280.0, 190.0], 0.87, 0)])
    artifact = _artifact(detector, np.array([0.2, 0.8]))  # class 0 / class 1
    out = anemia_predictor.predict(artifact, _jpeg_bytes(), {"symptoms": ["fatigue"]})
    assert out["predicted_class"] == 1
    assert out["risk_probability"] == pytest.approx(1.0, abs=1e-6)
    assert out["eye_detection_confidence"] == pytest.approx(0.87)
    assert set(out["class_probabilities"]) == {"0", "1"}


def test_four_class_severity_output():
    detector = FakeDetector(boxes=[([40.0, 50.0, 280.0, 190.0], 0.9, 0)])
    artifact = _artifact(detector, np.array([0.05, 0.1, 0.2, 0.65]))  # normal..severe
    out = anemia_predictor.predict(artifact, _jpeg_bytes(), {"symptoms": []})
    assert out["predicted_class"] == "severe"
    assert out["class_probabilities"]["severe"] == pytest.approx(0.65)
    assert 0.0 < out["risk_probability"] <= 1.0


def test_regression_head_maps_to_severity():
    detector = FakeDetector(boxes=[([40.0, 50.0, 280.0, 190.0], 0.91, 0)])
    artifact = _artifact(detector, np.array([9.0]))  # Hb 9.0 g/dL → moderate
    out = anemia_predictor.predict(artifact, _jpeg_bytes(), {"symptoms": []})
    assert out["predicted_class"] == "moderate"


def test_invalid_image_rejected():
    detector = FakeDetector(boxes=[([40.0, 50.0, 280.0, 190.0], 0.9, 0)])
    artifact = _artifact(detector, np.array([0.5, 0.5]))
    with pytest.raises(ApiError) as excinfo:
        anemia_predictor.predict(artifact, b"not-an-image", {"symptoms": []})
    assert excinfo.value.code == "invalid_upload"
