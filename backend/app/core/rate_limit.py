"""In-memory sliding-window rate limiter for prediction endpoints.

Single-process limiter (the API runs as one uvicorn worker per container).
Limit: ``predictions_rate_limit_per_minute`` requests per user per minute.
"""
from __future__ import annotations

import time
from collections import defaultdict, deque

from app.core.config import get_settings
from app.core.envelope import ERR_RATE_LIMITED, ApiError


class SlidingWindowLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, key: str, limit: int, window_seconds: int = 60) -> bool:
        now = time.monotonic()
        dq = self._hits[key]
        while dq and now - dq[0] > window_seconds:
            dq.popleft()
        if len(dq) >= limit:
            return False
        dq.append(now)
        return True


_limiter = SlidingWindowLimiter()


def enforce_prediction_rate_limit(user_id: str) -> None:
    """Raise 429 when the per-user predictions budget is exhausted."""
    settings = get_settings()
    if not _limiter.allow(f"predictions:{user_id}", settings.predictions_rate_limit_per_minute):
        raise ApiError(
            ERR_RATE_LIMITED,
            "Too many prediction requests. Please wait a minute and try again.",
            status=429,
        )
