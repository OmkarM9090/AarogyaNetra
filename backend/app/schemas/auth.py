"""Auth request schemas (Pydantic v2, camelCase — mirrors the mobile types)."""
from __future__ import annotations

import re
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

Gender = Literal["male", "female"]
BloodGroup = Literal["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"]


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    fullName: str = Field(min_length=1, max_length=120)
    phone: str | None = Field(default=None, max_length=20)
    dateOfBirth: datetime | None = None
    gender: Gender | None = None
    bloodGroup: BloodGroup | None = None
    heightCm: float | None = Field(default=None, ge=30, le=250)
    weightKg: float | None = Field(default=None, ge=1, le=400)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
            raise ValueError("password must contain at least one letter and one number")
        return v

    @field_validator("dateOfBirth")
    @classmethod
    def dob_in_past(cls, v: datetime | None) -> datetime | None:
        if v is not None and v.date() > date.today():
            raise ValueError("dateOfBirth must be in the past")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class RefreshRequest(BaseModel):
    refreshToken: str = Field(min_length=1)


class ProfileUpdateRequest(BaseModel):
    fullName: str | None = Field(default=None, min_length=1, max_length=120)
    phone: str | None = Field(default=None, max_length=20)
    dateOfBirth: datetime | None = None
    gender: Gender | None = None
    bloodGroup: BloodGroup | None = None
    heightCm: float | None = Field(default=None, ge=30, le=250)
    weightKg: float | None = Field(default=None, ge=1, le=400)
    medicalHistory: list[str] | None = Field(default=None, max_length=50)
    disclaimerAcknowledged: bool | None = None

    @field_validator("dateOfBirth")
    @classmethod
    def dob_in_past(cls, v: datetime | None) -> datetime | None:
        if v is not None and v.date() > date.today():
            raise ValueError("dateOfBirth must be in the past")
        return v
