"""Unified API response envelope.

Success:  {"success": true,  "data": ..., "timestamp": "2026-01-01T00:00:00Z"}
Error:    {"success": false, "error": {"code", "message", "details"}, "timestamp": ...}

Every HTTP response from the API uses exactly one of these two shapes.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

# ── Well-known error codes ────────────────────────────────────────────────────
ERR_VALIDATION = "validation_error"
ERR_UNAUTHORIZED = "unauthorized"
ERR_INVALID_CREDENTIALS = "invalid_credentials"
ERR_EMAIL_TAKEN = "email_already_registered"
ERR_NOT_FOUND = "not_found"
ERR_MODEL_UNAVAILABLE = "model_unavailable"
ERR_NO_EYE_DETECTED = "no_eye_detected"
ERR_RATE_LIMITED = "rate_limited"
ERR_UPLOAD_INVALID = "invalid_upload"
ERR_INTERNAL = "internal_error"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def success(data: Any) -> dict[str, Any]:
    """Build a success envelope."""
    return {"success": True, "data": data, "timestamp": _now_iso()}


def error(code: str, message: str, details: dict[str, Any] | None = None) -> dict[str, Any]:
    """Build an error envelope body."""
    body: dict[str, Any] = {"success": False, "timestamp": _now_iso()}
    err: dict[str, Any] = {"code": code, "message": message}
    if details:
        err["details"] = details
    body["error"] = err
    return body


class ApiError(Exception):
    """Domain error translated to the unified error envelope.

    ``status`` maps to the HTTP status code; ``code`` is the stable machine
    readable code; ``details`` carries field-level or extra context.
    """

    def __init__(
        self,
        code: str,
        message: str,
        status: int = 400,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status = status
        self.details = details or {}


def raise_api_error(
    code: str, message: str, status: int = 400, details: dict[str, Any] | None = None
) -> None:
    """Raise an ApiError (never returns)."""
    raise ApiError(code, message, status=status, details=details)
