"""Risk thresholds shared by all predictors.

``risk_score`` is 0-100 (higher = more dangerous). Levels:
  low < 30 ≤ moderate < 60 ≤ high < 80 ≤ critical
"""
from __future__ import annotations

RISK_LEVELS = ("low", "moderate", "high", "critical")


def risk_level_for(score: float) -> str:
    if score < 30:
        return "low"
    if score < 60:
        return "moderate"
    if score < 80:
        return "high"
    return "critical"


def score_from_probability(probability: float) -> float:
    """0-1 model probability → 0-100 risk score (clamped)."""
    return round(max(0.0, min(1.0, probability)) * 100, 1)
