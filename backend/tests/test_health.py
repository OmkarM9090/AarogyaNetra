"""Health endpoints."""


async def test_health(client):
    res = await client.get("/api/v1/health")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["status"] == "ok"
    assert "timestamp" in body


async def test_health_models(client):
    res = await client.get("/api/v1/health/models")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["total"] == 3
    assert set(data["models"].keys()) == {"diabetes", "hypertension", "anemia"}
    for meta in data["models"].values():
        assert "available" in meta and "version" in meta and "condition" in meta
