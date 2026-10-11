"""Recommendation engine unit tests (no HTTP)."""
from app.services.recommendation_engine import generate_recommendations


def _payload(**overrides):
    base = {
        "age": 50,
        "gender": "male",
        "bmi": 24.0,
        "blood_glucose_fasting": 95,
        "hba1c": 5.4,
        "blood_pressure_systolic": 120,
        "blood_pressure_diastolic": 78,
        "family_history_diabetes": False,
        "physical_activity_minutes_weekly": 220,
        "smoking_status": "never",
    }
    base.update(overrides)
    return base


def test_low_risk_diabetes_gets_positive_message():
    recs = generate_recommendations("diabetes", _payload(), 10.0, 0)
    assert recs
    assert all(r["priority"] == "info" for r in recs)


def test_high_glucose_triggers_urgent_medical_rec():
    recs = generate_recommendations("diabetes", _payload(blood_glucose_fasting=180), 75.0, 1)
    urgent = [r for r in recs if r["priority"] == "urgent"]
    assert any(r["category"] == "medical" for r in urgent)


def test_hba1c_range_mapping():
    pre = generate_recommendations("diabetes", _payload(hba1c=6.0), 20.0, 0)
    assert any("pre-diabetes" in r["title"].lower() for r in pre)
    diag = generate_recommendations("diabetes", _payload(hba1c=7.0), 80.0, 1)
    assert any(r["priority"] == "urgent" for r in diag)


def test_high_salt_hypertension_recommendation():
    recs = generate_recommendations("hypertension", {
        "age": 60, "gender": "female", "bmi": 27.0,
        "blood_pressure_systolic": 150, "blood_pressure_diastolic": 95,
        "heart_rate": 80, "smoking_status": "never", "alcohol_consumption": "none",
        "salt_intake": "high", "stress_level": "low",
        "family_history_hypertension": False, "physical_activity_minutes_weekly": 200,
    }, 65.0, 1)
    assert any("salt" in r["title"].lower() for r in recs)


def test_anemia_critical_urgent_cbc():
    recs = generate_recommendations("anemia", {"symptoms": ["fatigue"]}, 90.0, "severe")
    assert any(
        r["priority"] == "urgent" and "blood count" in r["description"].lower() for r in recs
    )


def test_recommendation_shape():
    recs = generate_recommendations("diabetes", _payload(), 10.0, 0)
    for rec in recs:
        assert set(rec.keys()) == {"category", "title", "description", "priority"}
        assert rec["priority"] in ("info", "moderate", "urgent")
