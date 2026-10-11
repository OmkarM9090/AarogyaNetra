"""Prediction reads: list / detail / summary."""


async def test_prediction_list_after_scan(client, auth_headers, sample_diabetes_input):
    await client.post("/api/v1/scans/diabetes", json=sample_diabetes_input, headers=auth_headers)
    res = await client.get("/api/v1/predictions", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["total"] == 1
    item = data["items"][0]
    assert item["condition"] == "diabetes"
    assert item["riskScore"] >= 0


async def test_prediction_detail(client, auth_headers, sample_diabetes_input):
    pred_id = (await client.post("/api/v1/scans/diabetes", json=sample_diabetes_input,
                                 headers=auth_headers)).json()["data"]["id"]
    res = await client.get(f"/api/v1/predictions/{pred_id}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["data"]["id"] == pred_id


async def test_prediction_detail_404(client, auth_headers):
    res = await client.get("/api/v1/predictions/doesnotexist", headers=auth_headers)
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "not_found"


async def test_risk_summary_empty(client, auth_headers):
    res = await client.get("/api/v1/predictions/summary", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["totalScans"] == 0
    assert data["overallRiskScore"] == 0
    assert set(data["riskByCondition"].keys()) == {"diabetes", "hypertension", "anemia"}
    assert data["riskByCondition"]["diabetes"]["lastPredictedAt"] is None
    assert "disclaimer" in data


async def test_risk_summary_reflects_latest_per_condition(
    client, auth_headers, sample_diabetes_input, sample_hypertension_input
):
    d = (await client.post("/api/v1/scans/diabetes", json=sample_diabetes_input,
                           headers=auth_headers)).json()["data"]
    h = (await client.post("/api/v1/scans/hypertension", json=sample_hypertension_input,
                           headers=auth_headers)).json()["data"]

    res = await client.get("/api/v1/predictions/summary", headers=auth_headers)
    data = res.json()["data"]
    assert data["totalScans"] == 2
    assert data["riskByCondition"]["diabetes"]["riskScore"] == d["riskScore"]
    assert data["riskByCondition"]["hypertension"]["riskScore"] == h["riskScore"]
    assert data["riskByCondition"]["diabetes"]["lastPredictedAt"] is not None
    assert data["overallRiskScore"] == max(d["riskScore"], h["riskScore"])
