"""User account management (register / login / refresh / profile)."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.envelope import (
    ApiError,
    ERR_EMAIL_TAKEN,
    ERR_INVALID_CREDENTIALS,
    ERR_UNAUTHORIZED,
)
from app.core.security import create_token_pair, hash_password, verify_password

COLLECTION = "users"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _public_user(doc: dict) -> dict:
    """Shape a users document into the mobile User contract (camelCase)."""
    dob = doc.get("dateOfBirth")
    return {
        "id": doc["_id"],
        "email": doc.get("email"),
        "fullName": doc.get("fullName", ""),
        "phone": doc.get("phone"),
        "dateOfBirth": dob.isoformat() if isinstance(dob, datetime) else dob,
        "gender": doc.get("gender"),
        "bloodGroup": doc.get("bloodGroup"),
        "heightCm": doc.get("heightCm"),
        "weightKg": doc.get("weightKg"),
        "medicalHistory": doc.get("medicalHistory", []),
        "disclaimerAcknowledged": bool(doc.get("disclaimerAcknowledged", False)),
        "createdAt": _iso(doc.get("createdAt")),
        "updatedAt": _iso(doc.get("updatedAt")),
    }


def _iso(value) -> str | None:
    if isinstance(value, datetime):
        return value.isoformat()
    return value


async def register_user(db: AsyncIOMotorDatabase, data: dict) -> tuple[dict, dict]:
    """Create an account. Returns (public_user, token_pair)."""
    email = data["email"].lower()
    users = db[COLLECTION]
    existing = await users.find_one({"email": email})
    if existing is not None:
        raise ApiError(ERR_EMAIL_TAKEN, "An account with this email already exists.", status=409)

    now = _now()
    doc = {
        "_id": uuid.uuid4().hex,
        "email": email,
        "passwordHash": hash_password(data["password"]),
        "fullName": data["fullName"],
        "phone": data.get("phone"),
        "dateOfBirth": data.get("dateOfBirth"),
        "gender": data.get("gender"),
        "bloodGroup": data.get("bloodGroup"),
        "heightCm": data.get("heightCm"),
        "weightKg": data.get("weightKg"),
        "medicalHistory": [],
        "disclaimerAcknowledged": False,
        "createdAt": now,
        "updatedAt": now,
    }
    await users.insert_one(doc)
    return _public_user(doc), create_token_pair(doc["_id"])


async def authenticate(db: AsyncIOMotorDatabase, email: str, password: str) -> tuple[dict, dict]:
    """Validate credentials. Returns (public_user, token_pair)."""
    users = db[COLLECTION]
    doc = await users.find_one({"email": email.lower()})
    if doc is None or not verify_password(password, doc.get("passwordHash", "")):
        raise ApiError(ERR_INVALID_CREDENTIALS, "Invalid email or password.", status=401)
    return _public_user(doc), create_token_pair(doc["_id"])


async def get_user(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    doc = await db[COLLECTION].find_one({"_id": user_id})
    if doc is None:
        raise ApiError(ERR_UNAUTHORIZED, "Account not found.", status=401)
    return _public_user(doc)


async def get_user_doc(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    doc = await db[COLLECTION].find_one({"_id": user_id})
    if doc is None:
        raise ApiError(ERR_UNAUTHORIZED, "Account not found.", status=401)
    return doc


async def update_profile(db: AsyncIOMotorDatabase, user_id: str, updates: dict) -> dict:
    """Apply a partial profile update (only provided fields)."""
    allowed = {
        "fullName", "phone", "dateOfBirth", "gender", "bloodGroup",
        "heightCm", "weightKg", "medicalHistory", "disclaimerAcknowledged",
    }
    sets = {k: v for k, v in updates.items() if k in allowed and v is not None}
    if not sets:
        return await get_user(db, user_id)
    sets["updatedAt"] = _now()
    await db[COLLECTION].update_one({"_id": user_id}, {"$set": sets})
    return await get_user(db, user_id)


async def verify_refresh(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    """Refresh endpoint: confirm the account still exists, issue a new pair."""
    return await get_user(db, user_id)
