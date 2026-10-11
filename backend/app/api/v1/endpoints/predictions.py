"""Prediction read endpoints: list / detail / summary."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.v1.deps import get_current_user_id
from app.core.database import get_db
from app.core.envelope import success
from app.services import prediction_service

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.get("")
async def list_predictions(
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_db),
):
    data = await prediction_service.list_predictions(db, user_id, (page - 1) * pageSize, pageSize)
    total_pages = (data["total"] + pageSize - 1) // pageSize if data["total"] else 0
    return success(
        {
            "items": data["items"],
            "total": data["total"],
            "page": page,
            "pageSize": pageSize,
            "totalPages": total_pages,
        }
    )


@router.get("/summary")
async def risk_summary(
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_db),
):
    return success(await prediction_service.get_risk_summary(db, user_id))


@router.get("/{prediction_id}")
async def prediction_detail(
    prediction_id: str,
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_db),
):
    return success(await prediction_service.get_prediction(db, prediction_id, user_id))
