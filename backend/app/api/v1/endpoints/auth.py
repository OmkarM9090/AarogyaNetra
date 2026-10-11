"""Auth endpoints: register / login / refresh / me (GET + PUT)."""
from __future__ import annotations

import jwt

from fastapi import APIRouter, Depends

from app.api.v1.deps import get_current_user_id
from app.core.database import get_db
from app.core.envelope import ERR_UNAUTHORIZED, ApiError, success
from app.core.security import create_token_pair, decode_token
from app.schemas.auth import LoginRequest, ProfileUpdateRequest, RefreshRequest, RegisterRequest
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=201)
async def register(payload: RegisterRequest, db=Depends(get_db)):
    user, tokens = await auth_service.register_user(db, payload.model_dump())
    return success({"user": user, "tokens": tokens})


@router.post("/login")
async def login(payload: LoginRequest, db=Depends(get_db)):
    user, tokens = await auth_service.authenticate(db, payload.email, payload.password)
    return success({"user": user, "tokens": tokens})


@router.post("/refresh")
async def refresh(payload: RefreshRequest, db=Depends(get_db)):
    try:
        claims = decode_token(payload.refreshToken, expected_type="refresh")
    except jwt.PyJWTError:
        raise ApiError(ERR_UNAUTHORIZED, "Invalid or expired refresh token.", status=401)
    user_id = str(claims["sub"])
    # The account must still exist.
    await auth_service.verify_refresh(db, user_id)
    return success(create_token_pair(user_id))


@router.get("/me")
async def me(user_id: str = Depends(get_current_user_id), db=Depends(get_db)):
    user = await auth_service.get_user(db, user_id)
    return success(user)


@router.put("/me")
async def update_me(
    payload: ProfileUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_db),
):
    user = await auth_service.update_profile(db, user_id, payload.model_dump(exclude_none=True))
    return success(user)
