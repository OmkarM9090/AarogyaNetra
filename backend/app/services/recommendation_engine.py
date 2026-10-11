"""Recommendation engine — deterministic, rule-based guidance.

This is NOT simulated data: every recommendation is derived from the user's
actual submitted values and the model's risk output. The engine exists on the
backend so all clients (mobile, future web) share identical guidance logic.

Each recommendation: {category, title, description, priority}
priority ∈ info | moderate | urgent
"""
from __future__ import annotations

from typing import Any

from app.ml.risk import risk_level_for

MedRec = dict[str, Any]


def _rec(category: str, title: str, description: str, priority: str = "info") -> MedRec:
    return {"category": category, "title": title, "description": description, "priority": priority}


# ── Diabetes ──────────────────────────────────────────────────────────────────
def _diabetes(payload: dict[str, Any], risk_score: float, risk_level: str) -> list[MedRec]:
    recs: list[MedRec] = []
    glucose = float(payload.get("blood_glucose_fasting") or 0)
    hba1c = float(payload.get("hba1c") or 0)
    bmi = float(payload.get("bmi") or 0)
    activity = int(payload.get("physical_activity_minutes_weekly") or 0)
    smoking = payload.get("smoking_status")

    if risk_level in ("high", "critical"):
        recs.append(_rec(
            "medical",
            "See a doctor soon",
            "Your risk score is in the high range. Book an appointment with a qualified "
            "healthcare professional for proper blood tests (HbA1c, fasting glucose) and "
            "a full evaluation.",
            "urgent",
        ))
    if glucose >= 126:
        recs.append(_rec(
            "medical",
            "Fasting glucose is in the diabetic range",
            f"Your fasting glucose of {glucose:.0f} mg/dL is at or above 126 mg/dL, which is "
            "typically considered the diabetic range. A clinician should confirm this with "
            "repeat testing.",
            "urgent" if glucose >= 200 else "moderate",
        ))
    elif glucose >= 100:
        recs.append(_rec(
            "medical",
            "Fasting glucose is elevated",
            f"Your fasting glucose of {glucose:.0f} mg/dL sits in the impaired range (100-125 "
            "mg/dL). Discuss this with your doctor and consider repeat testing.",
            "moderate",
        ))
    if hba1c >= 6.5:
        recs.append(_rec(
            "medical",
            "HbA1c indicates persistent elevation",
            f"An HbA1c of {hba1c:.1f}% is at or above 6.5%, the usual diagnostic threshold. "
            "Please get this verified by a healthcare professional.",
            "urgent",
        ))
    elif hba1c >= 5.7:
        recs.append(_rec(
            "lifestyle",
            "HbA1c in the pre-diabetes range",
            f"Your HbA1c of {hba1c:.1f}% is in the 5.7-6.4% range, often associated with "
            "pre-diabetes. Small, consistent changes can move this number.",
            "moderate",
        ))
    if bmi >= 25:
        recs.append(_rec(
            "lifestyle",
            "Focus on healthy weight",
            f"With a BMI of {bmi:.1f}, even a 5-10% weight reduction can meaningfully lower "
            "diabetes risk. Aim for a balanced diet rich in vegetables, whole grains and "
            "lean protein, and limit sugary drinks.",
            "moderate",
        ))
    if activity < 150:
        recs.append(_rec(
            "lifestyle",
            "Move a little more each week",
            f"You reported {activity} minutes of activity weekly. Aiming for 150+ minutes of "
            "moderate activity (e.g. brisk walking) is associated with lower diabetes risk.",
            "moderate" if risk_level != "low" else "info",
        ))
    if smoking == "current":
        recs.append(_rec(
            "lifestyle",
            "Consider quitting tobacco",
            "Smoking increases diabetes complications and overall cardiovascular risk. "
            "Talking to a clinician about quit support can make a big difference.",
            "moderate",
        ))
    if not recs:
        recs.append(_rec(
            "lifestyle",
            "Keep it up",
            "Your current profile suggests a low diabetes risk. Keep up regular activity, a "
            "balanced diet, and routine check-ups.",
            "info",
        ))
    return recs


# ── Hypertension ──────────────────────────────────────────────────────────────
def _hypertension(payload: dict[str, Any], risk_score: float, risk_level: str) -> list[MedRec]:
    recs: list[MedRec] = []
    sys = int(payload.get("blood_pressure_systolic") or 0)
    dia = int(payload.get("blood_pressure_diastolic") or 0)
    salt = payload.get("salt_intake")
    alcohol = payload.get("alcohol_consumption")
    activity = int(payload.get("physical_activity_minutes_weekly") or 0)
    bmi = float(payload.get("bmi") or 0)

    if risk_level in ("high", "critical"):
        recs.append(_rec(
            "medical",
            "See a doctor soon",
            "Your risk score is in the high range. A healthcare professional should confirm "
            "your blood pressure with repeated measurements and advise on next steps.",
            "urgent",
        ))
    if sys >= 180 or dia >= 120:
        recs.append(_rec(
            "medical",
            "Blood pressure is very high",
            f"Your reading of {sys}/{dia} mmHg is in the hypertensive-crisis range. If you "
            "also feel unwell (chest pain, shortness of breath, vision changes), seek "
            "urgent medical care.",
            "urgent",
        ))
    elif sys >= 140 or dia >= 90:
        recs.append(_rec(
            "medical",
            "Blood pressure is in the high range",
            f"Your reading of {sys}/{dia} mmHg is at or above the 140/90 mmHg stage-2 "
            "threshold. A clinician should evaluate this with repeated measurements.",
            "moderate",
        ))
    elif sys >= 130 or dia >= 80:
        recs.append(_rec(
            "medical",
            "Blood pressure is elevated",
            f"Your reading of {sys}/{dia} mmHg is elevated. Home monitoring and a clinician "
            "review are worthwhile.",
            "moderate",
        ))
    if salt == "high":
        recs.append(_rec(
            "lifestyle",
            "Cut back on salt",
            "High salt intake is one of the strongest modifiable drivers of blood pressure. "
            "Aim for under ~5 g of salt per day; watch packaged and restaurant food.",
            "moderate" if risk_level != "low" else "info",
        ))
    if alcohol == "heavy":
        recs.append(_rec(
            "lifestyle",
            "Reduce alcohol",
            "Regular heavy alcohol use raises blood pressure. Cutting back — or taking "
            "breaks — is associated with meaningful BP reduction.",
            "moderate",
        ))
    if bmi >= 25:
        recs.append(_rec(
            "lifestyle",
            "Weight management helps",
            f"With a BMI of {bmi:.1f}, losing a few kilograms can lower blood pressure "
            "noticeably. Combine diet quality with regular activity.",
            "moderate",
        ))
    if activity < 150:
        recs.append(_rec(
            "lifestyle",
            "Add regular aerobic activity",
            f"You reported {activity} minutes weekly. 150+ minutes of moderate aerobic "
            "activity is the standard target for BP control.",
            "moderate" if risk_level != "low" else "info",
        ))
    stress = payload.get("stress_level")
    if stress == "high":
        recs.append(_rec(
            "lifestyle",
            "Manage stress",
            "Chronic high stress contributes to elevated blood pressure. Prioritize sleep, "
            "breathing exercises, and regular breaks.",
            "info",
        ))
    if not recs:
        recs.append(_rec(
            "lifestyle",
            "Keep it up",
            "Your profile suggests low hypertension risk. Keep up the habits and monitor "
            "your blood pressure periodically.",
            "info",
        ))
    return recs


# ── Anemia ────────────────────────────────────────────────────────────────────
def _anemia(payload: dict[str, Any], risk_score: float, risk_level: str,
            predicted_class: Any) -> list[MedRec]:
    recs: list[MedRec] = []
    symptoms = payload.get("symptoms") or []

    if risk_level in ("high", "critical"):
        recs.append(_rec(
            "medical",
            "Get a hemoglobin test",
            "Your screening suggests a significant chance of anemia. Please see a doctor for "
            "a complete blood count (CBC) to confirm and find the cause.",
            "urgent",
        ))
    elif risk_level == "moderate":
        recs.append(_rec(
            "medical",
            "Consider checking your hemoglobin",
            "Your screening suggests possible anemia. A simple blood test (CBC) can confirm "
            "whether your hemoglobin is low.",
            "moderate",
        ))
    symptom_set = set(symptoms)
    if {"fatigue", "dizziness"} & symptom_set or len(symptoms) >= 3:
        recs.append(_rec(
            "medical",
            "Your reported symptoms deserve attention",
            "You reported several classic anemia symptoms (fatigue, dizziness, pallor, "
            "breathlessness, cold hands, brittle nails). Combined with this screening, a "
            "clinical check is recommended.",
            "moderate" if risk_level == "moderate" else "info",
        ))
    if risk_level != "low" or symptom_set:
        recs.append(_rec(
            "lifestyle",
            "Iron-rich foods and vitamin C",
            "Include iron-rich foods (lentils, spinach, beans, red meat, jaggery) and pair "
            "them with vitamin C for better absorption. Avoid tea/coffee right after meals "
            "as tannins block iron absorption.",
            "info",
        ))
    if not recs:
        recs.append(_rec(
            "lifestyle",
            "No major concern detected",
            "This screening did not flag anemia. Keep up a balanced diet and routine health "
            "checks.",
            "info",
        ))
    return recs


# ── Dispatcher ────────────────────────────────────────────────────────────────
def generate_recommendations(
    condition: str,
    payload: dict[str, Any],
    risk_score: float,
    predicted_class: Any,
) -> list[MedRec]:
    risk_level = risk_level_for(risk_score)
    if condition == "diabetes":
        return _diabetes(payload, risk_score, risk_level)
    if condition == "hypertension":
        return _hypertension(payload, risk_score, risk_level)
    if condition == "anemia":
        return _anemia(payload, risk_score, risk_level, predicted_class)
    return []
