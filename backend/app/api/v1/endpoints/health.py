"""Liveness + model health endpoints (public)."""
from __future__ import annotations

import time

from fastapi import APIRouter, Depends

from app.core.config import get_settings
from app.core.database import _client
from app.core.envelope import success
from app.ml.model_registry import get_registry

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict:
    settings = get_settings()
    mongo_up = _client is not None
    return success(
        {
            "status": "ok",
            "app": settings.app_name,
            "version": settings.app_version,
            "database": "up" if mongo_up else "down",
        }
    )


@router.get("/health/models")
async def model_health() -> dict:
    """Registry metadata: which models are loaded, versions, feature counts."""
    status = get_registry().status()
    available = sum(1 for m in status["models"].values() if m["available"])
    return success(
        {
            "available": available,
            "total": len(status["models"]),
            "models": status["models"],
        }
    )
