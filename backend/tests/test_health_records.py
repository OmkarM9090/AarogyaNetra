"""Health records CRUD."""
from datetime import datetime, timezone


async def test_health_record_lifecycle(client, auth_headers):
    # create
    res = await client.post(
        "/api/v1/health/records",
        json={
            "type": "bp",
            "value": 128,
            "unit": "mmHg",
            "notes": "morning",
            "measuredAt": datetime.now(timezone.utc).isoformat(),
        },
        headers=auth_headers,
    )
    assert res.status_code == 201
    rec = res.json()["data"]
    assert rec["type"] == "bp"
    assert rec["value"] == 128

    # list
    res = await client.get("/api/v1/health/records", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["data"]["total"] == 1

    # detail
    res = await client.get(f"/api/v1/health/records/{rec['id']}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["data"]["id"] == rec["id"]

    # update
    res = await client.put(
        f"/api/v1/health/records/{rec['id']}",
        json={"value": 132, "notes": "after lunch"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["data"]["value"] == 132
    assert res.json()["data"]["notes"] == "after lunch"

    # delete
    res = await client.delete(f"/api/v1/health/records/{rec['id']}", headers=auth_headers)
    assert res.status_code == 204
    res = await client.get(f"/api/v1/health/records/{rec['id']}", headers=auth_headers)
    assert res.status_code == 404


async def test_health_record_type_filter(client, auth_headers):
    for t in ("bp", "glucose"):
        await client.post(
            "/api/v1/health/records",
            json={"type": t, "value": 1, "unit": "x",
                  "measuredAt": "2026-10-01T08:00:00Z"},
            headers=auth_headers,
        )
    res = await client.get("/api/v1/health/records", headers=auth_headers, params={"type": "bp"})
    data = res.json()["data"]
    assert data["total"] == 1
    assert data["items"][0]["type"] == "bp"


async def test_health_record_requires_auth(client):
    res = await client.get("/api/v1/health/records")
    assert res.status_code == 401


async def test_health_record_value_range_validation(client, auth_headers):
    res = await client.post(
        "/api/v1/health/records",
        json={"type": "bp", "value": -5, "unit": "mmHg",
              "measuredAt": "2026-10-01T08:00:00Z"},
        headers=auth_headers,
    )
    assert res.status_code == 422
