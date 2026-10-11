"""Health record endpoints (manual vitals entries, camelCase)."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query

from app.api.v1.deps import get_current_user_id
from app.core.database import get_db
from app.core.envelope import ERR_NOT_FOUND, ApiError, success
from app.schemas.health_records import HealthRecordCreate, HealthRecordUpdate

router = APIRouter(prefix="/health/records", tags=["health-records"])
COLLECTION = "health_records"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _public(doc: dict) -> dict:
    out = {k: v for k, v in doc.items() if k != "_id"}
    out["id"] = doc["_id"]
    for key in ("measuredAt", "createdAt"):
        if isinstance(out.get(key), datetime):
            out[key] = out[key].isoformat()
    return out


@router.post("", status_code=201)
async def create_record(
    payload: HealthRecordCreate,
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_db),
):
    now = _now()
    doc = {
        "_id": uuid.uuid4().hex,
        "userId": user_id,
        "type": payload.type.lower(),
        "value": payload.value,
        "unit": payload.unit,
        "notes": payload.notes,
        "measuredAt": payload.measuredAt,
        "createdAt": now,
    }
    await db[COLLECTION].insert_one(doc)
    return success(_public(doc))


@router.get("")
async def list_records(
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    type: str | None = Query(default=None),
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_db),
):
    query = {"userId": user_id}
    if type:
        query["type"] = type.lower()
    coll = db[COLLECTION]
    total = await coll.count_documents(query)
    cursor = coll.find(query).sort("createdAt", -1).skip((page - 1) * pageSize).limit(pageSize)
    items = [_public(d) async for d in cursor]
    total_pages = (total + pageSize - 1) // pageSize if total else 0
    return success(
        {"items": items, "total": total, "page": page, "pageSize": pageSize, "totalPages": total_pages}
    )


@router.get("/{record_id}")
async def record_detail(
    record_id: str,
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_db),
):
    doc = await db[COLLECTION].find_one({"_id": record_id, "userId": user_id})
    if doc is None:
        raise ApiError(ERR_NOT_FOUND, "Health record not found.", status=404)
    return success(_public(doc))


@router.put("/{record_id}")
async def update_record(
    record_id: str,
    payload: HealthRecordUpdate,
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_db),
):
    doc = await db[COLLECTION].find_one({"_id": record_id, "userId": user_id})
    if doc is None:
        raise ApiError(ERR_NOT_FOUND, "Health record not found.", status=404)
    sets = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    result = await db[COLLECTION].find_one_and_update(
        {"_id": record_id, "userId": user_id}, {"$set": sets}, return_document=True
    )
    return success(_public(result))


@router.delete("/{record_id}", status_code=204)
async def delete_record(
    record_id: str,
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_db),
):
    result = await db[COLLECTION].delete_one({"_id": record_id, "userId": user_id})
    if result.deleted_count == 0:
        raise ApiError(ERR_NOT_FOUND, "Health record not found.", status=404)
    return None
