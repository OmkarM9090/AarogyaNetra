"""Password hashing and JWT issuance/validation.

- Passwords: bcrypt (cost from Settings).
- JWT: HS256. Access tokens live 30 minutes, refresh tokens 7 days.
  The ``type`` claim distinguishes them so a refresh token can never be
  used as an access token (and vice versa).
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt

from app.core.config import get_settings


# ── Passwords ─────────────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    settings = get_settings()
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(settings.bcrypt_rounds)).decode(
        "utf-8"
    )


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


# ── JWT ───────────────────────────────────────────────────────────────────────
def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(user_id: str) -> str:
    settings = get_settings()
    now = _now()
    payload: dict[str, Any] = {
        "sub": user_id,
        "type": "access",
        "jti": uuid.uuid4().hex,
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(user_id: str) -> str:
    settings = get_settings()
    now = _now()
    payload: dict[str, Any] = {
        "sub": user_id,
        "type": "refresh",
        "jti": uuid.uuid4().hex,
        "iat": now,
        "exp": now + timedelta(days=settings.refresh_token_expire_days),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_token_pair(user_id: str) -> dict[str, str]:
    """Returns the API's camelCase token pair."""
    return {
        "accessToken": create_access_token(user_id),
        "refreshToken": create_refresh_token(user_id),
    }


def decode_token(token: str, expected_type: str = "access") -> dict[str, Any]:
    """Decode and validate a JWT.

    Raises ``jwt.PyJWTError`` subclasses on any problem (expired, bad
    signature, wrong type). Callers translate to ``ApiError(ERR_UNAUTHORIZED)``.
    """
    settings = get_settings()
    payload = jwt.decode(
        token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
    )
    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError(f"token type is {payload.get('type')!r}, expected {expected_type!r}")
    if not payload.get("sub"):
        raise jwt.InvalidTokenError("token missing subject")
    return payload
