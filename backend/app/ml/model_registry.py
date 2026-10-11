"""ModelRegistry — process-wide singleton owning all loaded models.

- ``load_all()`` runs every loader (gracefully — one broken model does not
  stop the others) and logs a metadata summary.
- ``get(condition)`` returns the artifact or raises ``ModelUnavailable``.
- ``register(condition, artifact)`` allows tests to inject stubs.
"""
from __future__ import annotations

import logging
import threading
from typing import Any

from app.core.envelope import ApiError, ERR_MODEL_UNAVAILABLE
from app.ml.model_loader import LOADERS, ModelArtifact

logger = logging.getLogger("aarogyanetra.ml")


class ModelRegistry:
    """Thread-safe singleton registry of model artifacts."""

    _instance: "ModelRegistry | None" = None
    _instance_lock = threading.Lock()

    def __init__(self) -> None:
        self._artifacts: dict[str, ModelArtifact] = {}
        self._loaded = False
        self._lock = threading.Lock()

    # ── Singleton access ────────────────────────────────────────────
    @classmethod
    def instance(cls) -> "ModelRegistry":
        if cls._instance is None:
            with cls._instance_lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    @classmethod
    def reset_instance(cls) -> None:
        """Testing helper: discard the singleton (e.g. between test runs)."""
        with cls._instance_lock:
            cls._instance = None

    # ── Loading ─────────────────────────────────────────────────────
    def load_all(self) -> dict[str, ModelArtifact]:
        with self._lock:
            self._artifacts.clear()
            for condition, loader in LOADERS.items():
                artifact = loader()
                self._artifacts[condition] = artifact
            self._loaded = True
        for artifact in self._artifacts.values():
            meta = artifact.metadata()
            if meta["available"]:
                logger.info("model metadata: %s", meta)
            else:
                logger.warning("model unavailable: %s -> %s", meta["condition"], meta["error"])
        return dict(self._artifacts)

    def register(self, condition: str, artifact: ModelArtifact) -> None:
        """Inject an artifact (used by tests and hot-reload)."""
        with self._lock:
            self._artifacts[condition] = artifact
            self._loaded = True

    # ── Access ──────────────────────────────────────────────────────
    @property
    def loaded(self) -> bool:
        return self._loaded

    def get(self, condition: str) -> ModelArtifact:
        if not self._loaded:
            self.load_all()
        artifact = self._artifacts.get(condition)
        if artifact is None or not artifact.available:
            reason = artifact.load_error if artifact else "unknown condition"
            raise ApiError(
                ERR_MODEL_UNAVAILABLE,
                f"The {condition} screening model is currently unavailable. Please try again later.",
                status=503,
                details={"reason": reason},
            )
        return artifact

    def status(self) -> dict[str, Any]:
        """Registry metadata for GET /health/models."""
        if not self._loaded:
            self.load_all()
        return {
            "loaded": self._loaded,
            "models": {
                condition: artifact.metadata()
                for condition, artifact in sorted(self._artifacts.items())
            },
        }


def get_registry() -> ModelRegistry:
    """FastAPI-friendly accessor."""
    return ModelRegistry.instance()
