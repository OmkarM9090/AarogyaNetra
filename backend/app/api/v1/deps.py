"""Shared FastAPI dependencies."""
from __future__ import annotations

import jwt

from fastapi import Depends, Header
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.core.envelope import ERR_UNAUTHORIZED, ApiError
from app.core.security import decode_token


async def get_current_user_id(authorization: str | None = Header(default=None)) -> str:
    """Extract and validate the Bearer access token → user id.

    All auth failures map to 401 ``unauthorized`` so the mobile client can
    trigger its refresh flow.
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise ApiError(ERR_UNAUTHORIZED, "Missing Authorization bearer token.", status=401)
    token = authorization[7:].strip()
    try:
        payload = decode_token(token, expected_type="access")
    except jwt.PyJWTError:
        raise ApiError(ERR_UNAUTHORIZED, "Invalid or expired access token.", status=401)
    return str(payload["sub"])


async def require_db(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Convenience dependency: (user_id, db) for protected endpoints."""
    return user_id, db
