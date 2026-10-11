"""Scan submission schemas (snake_case — mirrors the mobile form payloads)."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator

SmokingStatus = Literal["never", "former", "current"]
Gender = Literal["male", "female"]
AlcoholConsumption = Literal["none", "moderate", "heavy"]
SaltIntake = Literal["low", "moderate", "high"]
StressLevel = Literal["low", "moderate", "high"]
AnemiaSymptom = Literal[
    "fatigue", "pallor", "dizziness", "shortness_of_breath", "cold_hands", "brittle_nails"
]


class DiabetesScanRequest(BaseModel):
    age: int = Field(ge=1, le=120)
    gender: Gender
    bmi: float = Field(ge=10, le=60)
    blood_glucose_fasting: float = Field(ge=40, le=500, description="mg/dL")
    hba1c: float = Field(ge=3, le=20, description="%")
    blood_pressure_systolic: int = Field(ge=60, le=260)
    blood_pressure_diastolic: int = Field(ge=30, le=160)
    family_history_diabetes: bool
    physical_activity_minutes_weekly: int = Field(ge=0, le=30000)
    smoking_status: SmokingStatus
    waist_circumference_cm: float | None = Field(default=None, ge=40, le=200)

    @model_validator(mode="after")
    def bp_sane(self) -> "DiabetesScanRequest":
        if self.blood_pressure_diastolic >= self.blood_pressure_systolic:
            raise ValueError("diastolic pressure must be lower than systolic")
        return self


class HypertensionScanRequest(BaseModel):
    age: int = Field(ge=1, le=120)
    gender: Gender
    bmi: float = Field(ge=10, le=60)
    blood_pressure_systolic: int = Field(ge=60, le=260)
    blood_pressure_diastolic: int = Field(ge=30, le=160)
    heart_rate: int = Field(ge=20, le=250)
    smoking_status: SmokingStatus
    alcohol_consumption: AlcoholConsumption
    salt_intake: SaltIntake
    stress_level: StressLevel
    family_history_hypertension: bool
    physical_activity_minutes_weekly: int = Field(ge=0, le=30000)
    cholesterol_total: float | None = Field(default=None, ge=100, le=600)

    @model_validator(mode="after")
    def bp_sane(self) -> "HypertensionScanRequest":
        if self.blood_pressure_diastolic >= self.blood_pressure_systolic:
            raise ValueError("diastolic pressure must be lower than systolic")
        return self


class AnemiaScanForm(BaseModel):
    """Form fields for the multipart anemia upload."""

    age: int = Field(ge=1, le=120)
    gender: Gender
    symptoms: list[AnemiaSymptom] = Field(default_factory=list, max_length=6)

    @model_validator(mode="after")
    def symptoms_unique(self) -> "AnemiaScanForm":
        if len(set(self.symptoms)) != len(self.symptoms):
            raise ValueError("symptoms must be unique")
        return self
