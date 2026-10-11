"""Shared pytest fixtures.

- MongoDB is replaced by mongomock-motor (async-compatible in-memory Mongo).
- Real diabetes/hypertension models are loaded from ``ml_models/`` when the
  runtime deps are present; anemia stays unavailable in the test sandbox and
  exercises the graceful 503 path.
"""
from __future__ import annotations

import io
import sys
from pathlib import Path

import pytest
import pytest_asyncio
from mongomock_motor import AsyncMongoMockClient
from PIL import Image

# Make the backend importable when pytest runs from the repo root.
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import get_settings  # noqa: E402
from app.core.database import ensure_indexes, get_db  # noqa: E402
from app.core.envelope import ERR_UNAUTHORIZED  # noqa: E402
from app.main import create_app  # noqa: E402
from app.ml.model_registry import ModelRegistry  # noqa: E402
from app.services import auth_service  # noqa: E402

settings = get_settings()
settings.model_dir = str(BACKEND_ROOT / "ml_models")


# ── App / DB ──────────────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def mongo_client() -> AsyncMongoMockClient:
    return AsyncMongoMockClient()


@pytest_asyncio.fixture
async def db(mongo_client) -> AsyncMongoMockClient:  # type: ignore[valid-type]
    database = mongo_client[settings.mongo_db]
    await ensure_indexes(database)
    # Clean between tests.
    for name in await database.list_collection_names():
        await database[name].delete_many({})
    yield database


@pytest_asyncio.fixture
async def app(db):
    application = create_app()

    async def _override_get_db():
        yield db

    application.dependency_overrides[get_db] = _override_get_db
    yield application
    application.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client(app):
    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ── Model registry ────────────────────────────────────────────────────────────
@pytest.fixture(autouse=True)
def _registry(mongo_client):
    """Ensure the singleton registry is loaded (real models when possible)."""
    registry = ModelRegistry.instance()
    if not registry.loaded:
        registry.load_all()
    yield registry


# ── Auth fixtures ─────────────────────────────────────────────────────────────
@pytest_asyncio.fixture
async def test_user(app, db) -> dict:
    user, tokens = await auth_service.register_user(
        db,
        {
            "email": "test@example.com",
            "password": "Test1234",
            "fullName": "Test User",
            "gender": "female",
        },
    )
    user["tokens"] = tokens
    return user


@pytest_asyncio.fixture
async def auth_headers(test_user) -> dict:
    return {"Authorization": f"Bearer {test_user['tokens']['accessToken']}"}


# ── Sample inputs ─────────────────────────────────────────────────────────────
@pytest.fixture
def sample_diabetes_input() -> dict:
    return {
        "age": 52,
        "gender": "male",
        "bmi": 28.4,
        "blood_glucose_fasting": 142,
        "hba1c": 7.1,
        "blood_pressure_systolic": 138,
        "blood_pressure_diastolic": 86,
        "family_history_diabetes": True,
        "physical_activity_minutes_weekly": 90,
        "smoking_status": "former",
        "waist_circumference_cm": 98,
    }


@pytest.fixture
def sample_hypertension_input() -> dict:
    return {
        "age": 58,
        "gender": "female",
        "bmi": 30.1,
        "blood_pressure_systolic": 158,
        "blood_pressure_diastolic": 96,
        "heart_rate": 78,
        "smoking_status": "never",
        "alcohol_consumption": "moderate",
        "salt_intake": "high",
        "stress_level": "moderate",
        "family_history_hypertension": True,
        "physical_activity_minutes_weekly": 60,
        "cholesterol_total": 226,
    }


@pytest.fixture
def sample_anemia_form() -> dict:
    return {
        "age": 34,
        "gender": "female",
        "symptoms": ["fatigue", "pallor", "dizziness"],
    }


def _make_jpeg(width: int = 320, height: int = 240, color: tuple = (220, 200, 190)) -> bytes:
    image = Image.new("RGB", (width, height), color)
    # Draw a simple ellipse to look eye-like for YOLO-free tests.
    from PIL import ImageDraw

    draw = ImageDraw.Draw(image)
    draw.ellipse([40, 60, width - 40, height - 60], fill=(120, 90, 80))
    draw.ellipse([width // 2 - 30, height // 2 - 30, width // 2 + 30, height // 2 + 30], fill=(30, 20, 20))
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=85)
    return buffer.getvalue()


@pytest.fixture
def sample_eye_image() -> bytes:
    return _make_jpeg()
