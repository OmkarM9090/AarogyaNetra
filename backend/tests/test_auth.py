"""Auth flow: register / login / refresh / me."""

EMAIL = "auth@example.com"
PASSWORD = "Secret123"


async def _register(client, email=EMAIL, password=PASSWORD):
    return await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "fullName": "Auth Test",
            "gender": "male",
            "bloodGroup": "O+",
        },
    )


async def test_register_success(client):
    res = await _register(client)
    assert res.status_code == 201
    body = res.json()
    assert body["success"] is True
    data = body["data"]
    assert data["user"]["email"] == EMAIL
    assert data["user"]["disclaimerAcknowledged"] is False
    assert "accessToken" in data["tokens"]
    assert "refreshToken" in data["tokens"]
    assert "password" not in str(data)


async def test_register_duplicate_email(client):
    assert (await _register(client)).status_code == 201
    res = await _register(client)
    assert res.status_code == 409
    assert res.json()["success"] is False
    assert res.json()["error"]["code"] == "email_already_registered"


async def test_register_weak_password(client):
    res = await _register(client, email="weak@example.com", password="allletters")
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "validation_error"


async def test_register_future_dob_rejected(client):
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": "dob@example.com", "password": PASSWORD, "fullName": "X",
              "dateOfBirth": "2099-01-01T00:00:00Z"},
    )
    assert res.status_code == 422


async def test_login_success(client):
    await _register(client)
    res = await client.post("/api/v1/auth/login", json={"email": EMAIL, "password": PASSWORD})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["user"]["fullName"] == "Auth Test"
    assert "accessToken" in data["tokens"]


async def test_login_wrong_password(client):
    await _register(client)
    res = await client.post("/api/v1/auth/login", json={"email": EMAIL, "password": "Wrong123"})
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "invalid_credentials"


async def test_refresh_returns_new_pair(client):
    await _register(client)
    login = await client.post("/api/v1/auth/login", json={"email": EMAIL, "password": PASSWORD})
    refresh_token = login.json()["data"]["tokens"]["refreshToken"]

    res = await client.post("/api/v1/auth/refresh", json={"refreshToken": refresh_token})
    assert res.status_code == 200
    tokens = res.json()["data"]
    assert "accessToken" in tokens and "refreshToken" in tokens


async def test_refresh_rejects_access_token(client):
    await _register(client)
    login = await client.post("/api/v1/auth/login", json={"email": EMAIL, "password": PASSWORD})
    access_token = login.json()["data"]["tokens"]["accessToken"]
    res = await client.post("/api/v1/auth/refresh", json={"refreshToken": access_token})
    assert res.status_code == 401


async def test_me(client, test_user, auth_headers):
    res = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["data"]["id"] == test_user["id"]


async def test_me_requires_token(client):
    res = await client.get("/api/v1/auth/me")
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "unauthorized"


async def test_put_me_updates_profile(client, auth_headers):
    res = await client.put(
        "/api/v1/auth/me",
        headers=auth_headers,
        json={"phone": "+919812345678", "disclaimerAcknowledged": True},
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["phone"] == "+919812345678"
    assert data["disclaimerAcknowledged"] is True


async def test_put_me_ignores_unknown_fields(client, auth_headers):
    res = await client.put("/api/v1/auth/me", headers=auth_headers, json={"email": "hack@x.com"})
    assert res.status_code == 200
    # email is not in the updatable set — it must be unchanged
    me = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert me.json()["data"]["email"] != "hack@x.com"
