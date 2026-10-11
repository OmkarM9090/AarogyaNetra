"""Scan submission + reads (uses the real diabetes/hypertension models)."""
import pytest


def _assert_prediction_envelope(body):
    assert body["success"] is True
    assert "timestamp" in body
    p = body["data"]
    for key in (
        "id", "userId", "scanId", "condition", "riskScore", "riskLevel",
        "confidence", "modelVersion", "inputFeatures", "outputRaw",
        "recommendations", "keyMetrics", "disclaimer", "createdAt",
    ):
        assert key in p, f"missing {key}"
    assert 0 <= p["riskScore"] <= 100
    assert p["riskLevel"] in ("low", "moderate", "high", "critical")
    assert p["outputRaw"]["predictedClass"] is not None
    assert len(p["outputRaw"]["classProbabilities"]) >= 2
    assert isinstance(p["recommendations"], list) and p["recommendations"]
    for rec in p["recommendations"]:
        assert rec["priority"] in ("info", "moderate", "urgent")
        assert set(rec) >= {"category", "title", "description", "priority"}
    assert "educational purposes" in p["disclaimer"]


async def test_diabetes_scan_happy_path(client, auth_headers, sample_diabetes_input):
    res = await client.post("/api/v1/scans/diabetes", json=sample_diabetes_input, headers=auth_headers)
    assert res.status_code == 200, res.text
    _assert_prediction_envelope(res.json())
    p = res.json()["data"]
    assert p["condition"] == "diabetes"
    assert p["inputFeatures"]["age"] == 52


async def test_diabetes_scan_returns_recommendations_for_high_glucose(
    client, auth_headers, sample_diabetes_input
):
    sample_diabetes_input["blood_glucose_fasting"] = 210
    sample_diabetes_input["hba1c"] = 9.2
    res = await client.post("/api/v1/scans/diabetes", json=sample_diabetes_input, headers=auth_headers)
    assert res.status_code == 200
    p = res.json()["data"]
    titles = [r["title"].lower() for r in p["recommendations"]]
    assert any("glucose" in t for t in titles)
    urgent = [r for r in p["recommendations"] if r["priority"] == "urgent"]
    assert urgent, "high glucose should produce an urgent recommendation"


async def test_hypertension_scan_happy_path(client, auth_headers, sample_hypertension_input):
    res = await client.post(
        "/api/v1/scans/hypertension", json=sample_hypertension_input, headers=auth_headers
    )
    assert res.status_code == 200, res.text
    _assert_prediction_envelope(res.json())
    assert res.json()["data"]["condition"] == "hypertension"


async def test_anemia_scan_model_unavailable_in_test_sandbox(
    client, auth_headers, sample_anemia_form, sample_eye_image
):
    """Anemia needs torch/TF (Docker only) → expect a clean 503 envelope."""
    files = {"eye_image": ("eye.jpg", sample_eye_image, "image/jpeg")}
    form = {"age": "34", "gender": "female", "symptoms": '["fatigue"]'}
    res = await client.post("/api/v1/scans/anemia", data=form, files=files, headers=auth_headers)
    assert res.status_code in (503, 422)
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] in ("model_unavailable", "no_eye_detected")


async def test_anemia_rejects_wrong_content_type(client, auth_headers, sample_eye_image):
    files = {"eye_image": ("eye.txt", b"not-an-image", "text/plain")}
    form = {"age": "34", "gender": "female", "symptoms": "[]"}
    res = await client.post("/api/v1/scans/anemia", data=form, files=files, headers=auth_headers)
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "invalid_upload"


async def test_anemia_rejects_empty_image(client, auth_headers):
    files = {"eye_image": ("eye.jpg", b"", "image/jpeg")}
    form = {"age": "34", "gender": "female", "symptoms": "[]"}
    res = await client.post("/api/v1/scans/anemia", data=form, files=files, headers=auth_headers)
    assert res.status_code == 400


@pytest.mark.parametrize(
    "mutation",
    [
        {"blood_glucose_fasting": 999},      # > 500 mg/dL
        {"age": 0},                           # < 1
        {"blood_pressure_diastolic": 200},    # >= systolic + out of range
        {"smoking_status": "sometimes"},      # invalid enum
    ],
)
async def test_diabetes_validation_errors(client, auth_headers, sample_diabetes_input, mutation):
    sample_diabetes_input.update(mutation)
    res = await client.post("/api/v1/scans/diabetes", json=sample_diabetes_input, headers=auth_headers)
    assert res.status_code == 422
    body = res.json()
    assert body["error"]["code"] == "validation_error"
    assert body["error"]["details"]["fieldErrors"], "field errors should be listed"


async def test_scan_requires_auth(client, sample_diabetes_input):
    res = await client.post("/api/v1/scans/diabetes", json=sample_diabetes_input)
    assert res.status_code == 401


async def test_scan_list_and_detail(client, auth_headers, sample_diabetes_input):
    await client.post("/api/v1/scans/diabetes", json=sample_diabetes_input, headers=auth_headers)

    res = await client.get("/api/v1/scans", headers=auth_headers, params={"page": 1, "pageSize": 20})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["total"] == 1
    assert data["totalPages"] == 1
    scan = data["items"][0]
    assert scan["scanType"] == "diabetes"
    assert scan["status"] == "completed"
    assert scan["prediction"] is not None
    assert scan["prediction"]["condition"] == "diabetes"

    res = await client.get(f"/api/v1/scans/{scan['id']}", headers=auth_headers)
    assert res.status_code == 200
    detail = res.json()["data"]
    assert detail["id"] == scan["id"]
    assert detail["prediction"]["id"] == scan["prediction"]["id"]


async def test_scan_detail_404_for_foreign_user(db, client, auth_headers, sample_diabetes_input):
    res = await client.post("/api/v1/scans/diabetes", json=sample_diabetes_input, headers=auth_headers)
    scan_id = res.json()["data"]["scanId"]
    # A second user must not see the first user's scan.
    other = await client.post(
        "/api/v1/auth/register",
        json={"email": "other@example.com", "password": "Secret123", "fullName": "Other"},
    )
    other_headers = {
        "Authorization": f"Bearer {other.json()['data']['tokens']['accessToken']}"
    }
    res = await client.get(f"/api/v1/scans/{scan_id}", headers=other_headers)
    assert res.status_code == 404
