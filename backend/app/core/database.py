"""Async MongoDB (Motor) connection management.

- ``connect_mongo`` retries the initial handshake (Mongo may still be
  starting in docker-compose) and then ensures indexes.
- ``get_db`` is the FastAPI dependency yielding the database handle.
"""
from __future__ import annotations

import asyncio
import logging
from typing import AsyncIterator, Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings

logger = logging.getLogger("aarogyanetra.db")

_client: Optional[AsyncIOMotorClient] = None


async def connect_mongo() -> AsyncIOMotorDatabase:
    """Connect with retries, then create indexes. Stores the client globally."""
    global _client
    settings = get_settings()

    last_error: Exception | None = None
    for attempt in range(1, settings.mongo_connect_retries + 1):
        try:
            client = AsyncIOMotorClient(
                settings.mongo_uri,
                serverSelectionTimeoutMS=5000,
                uuidRepresentation="standard",
            )
            await client.admin.command("ping")
            _client = client
            db: AsyncIOMotorDatabase = client[settings.mongo_db]
            await ensure_indexes(db)
            logger.info("MongoDB connected: %s (attempt %d)", settings.mongo_db, attempt)
            return db
        except Exception as exc:  # noqa: BLE001 — surface any driver error
            last_error = exc
            logger.warning(
                "MongoDB connection attempt %d/%d failed: %s",
                attempt,
                settings.mongo_connect_retries,
                exc,
            )
            if attempt < settings.mongo_connect_retries:
                await asyncio.sleep(settings.mongo_retry_delay_seconds)

    raise RuntimeError(f"Could not connect to MongoDB: {last_error}")


def get_mongo_client() -> AsyncIOMotorClient:
    if _client is None:
        raise RuntimeError("MongoDB client not initialized — call connect_mongo() first")
    return _client


def get_mongo_db() -> AsyncIOMotorDatabase:
    settings = get_settings()
    return get_mongo_client()[settings.mongo_db]


async def close_mongo() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
        logger.info("MongoDB connection closed")


async def get_db() -> AsyncIterator[AsyncIOMotorDatabase]:
    """FastAPI dependency: yields the DB, raises a clear error if not connected."""
    if _client is None:
        from app.core.envelope import ApiError, ERR_INTERNAL

        raise ApiError(ERR_INTERNAL, "Database not ready", status=503)
    yield get_mongo_db()


async def ensure_indexes(db: AsyncIOMotorDatabase) -> None:
    """Create the indexes the app relies on (idempotent)."""
    await db.users.create_index("email", unique=True)
    await db.scans.create_index([("userId", 1), ("createdAt", -1)])
    await db.scans.create_index("scanId")
    await db.predictions.create_index([("userId", 1), ("createdAt", -1)])
    await db.predictions.create_index("scanId")
    await db.health_records.create_index([("userId", 1), ("createdAt", -1)])
    await db.eye_images.create_index("filename", unique=True)
