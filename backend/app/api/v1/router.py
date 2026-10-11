"""Aggregates all v1 routers under /api/v1."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.endpoints import auth, health, health_records, predictions, scans

api_v1_router = APIRouter()
api_v1_router.include_router(health.router)
api_v1_router.include_router(auth.router)
api_v1_router.include_router(scans.router)
api_v1_router.include_router(predictions.router)
api_v1_router.include_router(health_records.router)
