"""Health record schemas (manual vitals entries, camelCase)."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

HealthRecordType = str  # 'bp' | 'glucose' | 'weight' | 'other' (free-form, lower-cased)


class HealthRecordCreate(BaseModel):
    type: str = Field(min_length=1, max_length=40, description="e.g. bp, glucose, weight")
    value: float = Field(ge=0, le=1_000_000)
    unit: str = Field(min_length=1, max_length=20, description="e.g. mmHg, mg/dL, kg")
    notes: str | None = Field(default=None, max_length=500)
    measuredAt: datetime


class HealthRecordUpdate(BaseModel):
    value: float | None = Field(default=None, ge=0, le=1_000_000)
    unit: str | None = Field(default=None, min_length=1, max_length=20)
    notes: str | None = Field(default=None, max_length=500)
    measuredAt: datetime | None = None
