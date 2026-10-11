"""Application settings — environment driven (12-factor).

All values can be overridden via environment variables or a `.env` file in
the backend working directory. See `.env.example`.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the AarogyaNetra API."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # ── App ────────────────────────────────────────────────────────
    app_name: str = "AarogyaNetra API"
    app_version: str = "1.0.0"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    # ── MongoDB ────────────────────────────────────────────────────
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db: str = "aarogya_netra"
    mongo_connect_retries: int = 3
    mongo_retry_delay_seconds: float = 2.0

    # ── Auth / JWT ─────────────────────────────────────────────────
    jwt_secret_key: str = "change-me-in-production-0123456789abcdef0123456789abcdef"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    bcrypt_rounds: int = 12

    # ── CORS ───────────────────────────────────────────────────────
    cors_origins: list[str] = ["*"]

    # ── Rate limiting (predictions) ────────────────────────────────
    predictions_rate_limit_per_minute: int = 100

    # ── ML models ──────────────────────────────────────────────────
    model_dir: str = "ml_models"
    max_upload_mb: int = 10

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
