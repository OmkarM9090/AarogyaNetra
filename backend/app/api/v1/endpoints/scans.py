"""Scan submission + read endpoints.

POST /scans/diabetes          (JSON snake_case)
POST /scans/hypertension      (JSON snake_case)
POST /scans/anemia            (multipart: eye_image file + form fields)
GET  /scans?page&pageSize     (paginated, embedded predictions)
GET  /scans/{scan_id}         (detail, embedded prediction)
"""
from __future__ import annotations

import json

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile

from app.api.v1.deps import get_current_user_id
from app.core.config import get_settings
from app.core.database import get_db
from app.core.envelope import ERR_UPLOAD_INVALID, ApiError, success
from app.core.rate_limit import enforce_prediction_rate_limit
from app.schemas.scans import AnemiaScanForm, DiabetesScanRequest, HypertensionScanRequest
from app.services import scan_service

router = APIRouter(prefix="/scans", tags=["scans"])


async def _submit(user_id: str, condition: str, payload: dict, db, image_bytes: bytes | None = None):
    enforce_prediction_rate_limit(user_id)
    _, prediction = await scan_service.submit_scan(db, user_id, condition, payload, image_bytes)
    return success(prediction)


@router.post("/diabetes")
async def scan_diabetes(
    payload: DiabetesScanRequest,
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_db),
):
    return await _submit(user_id, "diabetes", payload.model_dump(), db)


@router.post("/hypertension")
async def scan_hypertension(
    payload: HypertensionScanRequest,
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_db),
):
    return await _submit(user_id, "hypertension", payload.model_dump(), db)


@router.post("/anemia")
async def scan_anemia(
    eye_image: UploadFile = File(...),
    age: int = Form(..., ge=1, le=120),
    gender: str = Form(...),
    symptoms: str = Form(default="[]"),
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_db),
):
    settings = get_settings()
    image_bytes = await eye_image.read()
    if len(image_bytes) == 0:
        raise ApiError(ERR_UPLOAD_INVALID, "eye_image file is empty.", status=400)
    if len(image_bytes) > settings.max_upload_bytes:
        raise ApiError(
            ERR_UPLOAD_INVALID,
            f"Image exceeds the {settings.max_upload_mb} MB upload limit.",
            status=400,
        )
    if eye_image.content_type not in ("image/jpeg", "image/jpg", "image/png", "image/webp"):
        raise ApiError(ERR_UPLOAD_INVALID, "eye_image must be a JPEG or PNG photo.", status=400)

    try:
        symptoms_list = json.loads(symptoms)
        if not isinstance(symptoms_list, list):
            symptoms_list = []
    except json.JSONDecodeError:
        symptoms_list = []

    form = AnemiaScanForm(age=age, gender=gender, symptoms=symptoms_list)  # type: ignore[arg-type]
    return await _submit(user_id, "anemia", form.model_dump(), db, image_bytes)


@router.get("")
async def list_scans(
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_db),
):
    data = await scan_service.list_scans(db, user_id, (page - 1) * pageSize, pageSize)
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


@router.get("/{scan_id}")
async def scan_detail(
    scan_id: str,
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_db),
):
    scan = await scan_service.get_scan(db, scan_id, user_id)
    return success(scan)
