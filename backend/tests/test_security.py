"""Security: token type enforcement + timing header."""
import jwt as pyjwt

from app.core.config import get_settings
from app.core.security import create_access_token, create_refresh_token

EMAIL = "sec@example.com"
PASSWORD = "Secret123"


async def test_refresh_token_cannot_be_used_as_access(client):
    await client.post(
        "/api/v1/auth/register",
        json={"email": EMAIL, "password": PASSWORD, "fullName": "Sec"},
    )
    refresh = create_refresh_token("some-user-id")
    res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {refresh}"})
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "unauthorized"


async def test_garbage_token_rejected(client):
    res = await client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not.a.jwt"})
    assert res.status_code == 401


async def test_expired_token_rejected(client):
    settings = get_settings()
    now = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
    payload = {
        "sub": "x", "type": "access",
        "exp": now - __import__("datetime").timedelta(minutes=5),
        "iat": now - __import__("datetime").timedelta(hours=2),
    }
    token = pyjwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401


async def test_request_id_header_present(client):
    res = await client.get("/api/v1/health")
    assert res.headers.get("X-Request-ID")


async def test_error_envelope_shape_on_404(client, auth_headers):
    res = await client.get("/api/v1/scans/nope", headers=auth_headers)
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "not_found"
    assert "message" in body["error"]
    assert "timestamp" in body
