/**
 * whatIfEngine — What-If lifestyle simulation (the one SIMULATION allowed
 * to remain on-device, clearly labeled in the UI).
 *
 * Baseline risks come from the user's latest REAL backend predictions.
 * Each lifestyle parameter applies a clinically-calibrated multiplier
 * (<1 reduces risk, >1 increases it), mirroring the original engine.
 */
import type { Condition } from '../../../shared/types/health';

export interface LifestyleParams {
  exerciseMins: number;
  sugarGrams: number;
  sodiumGrams: number;
  ironServings: number;
  medicationAdherence: number;
  sleepHours: number;
  stressLevel: number;
}

export const DEFAULT_LIFESTYLE: LifestyleParams = {
  exerciseMins: 30,
  sugarGrams: 50,
  sodiumGrams: 5,
  ironServings: 3,
  medicationAdherence: 80,
  sleepHours: 7,
  stressLevel: 5,
};

export interface WhatIfResult {
  /** 0-100 per condition after the lifestyle change. */
  modifiedRisks: Record<Condition, number>;
  /** 0-100 delta (negative = improvement). */
  deltas: Record<Condition, number>;
}

type Risks3 = Record<Condition, number>;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function computeExerciseEffect(mins: number): Risks3 {
  const d = (mins - DEFAULT_LIFESTYLE.exerciseMins) / 60;
  return { hypertension: 1 - d * 0.15, diabetes: 1 - d * 0.2, anemia: 1 - d * 0.05 };
}

function computeSugarEffect(grams: number): Risks3 {
  const d = (grams - DEFAULT_LIFESTYLE.sugarGrams) / 100;
  return { hypertension: 1 + d * 0.08, diabetes: 1 + d * 0.25, anemia: 1 + d * 0.02 };
}

function computeSodiumEffect(grams: number): Risks3 {
  const d = (grams - DEFAULT_LIFESTYLE.sodiumGrams) / 5;
  return { hypertension: 1 + d * 0.3, diabetes: 1 + d * 0.05, anemia: 1 };
}

function computeIronEffect(servings: number): Risks3 {
  const d = (servings - DEFAULT_LIFESTYLE.ironServings) / 7;
  return { hypertension: 1, diabetes: 1, anemia: 1 - d * 0.35 };
}

function computeMedicationEffect(adherence: number): Risks3 {
  const d = (adherence - DEFAULT_LIFESTYLE.medicationAdherence) / 100;
  return { hypertension: 1 - d * 0.25, diabetes: 1 - d * 0.2, anemia: 1 - d * 0.15 };
}

function computeSleepEffect(hours: number): Risks3 {
  const deviation = Math.abs(hours - 7.5);
  const penalty = deviation > 1.5 ? (deviation - 1.5) * 0.1 : 0;
  const benefit = hours >= 6 && hours <= 9 ? (hours - DEFAULT_LIFESTYLE.sleepHours) / 5 : 0;
  return {
    hypertension: 1 + penalty - benefit * 0.1,
    diabetes: 1 + penalty - benefit * 0.12,
    anemia: 1 + penalty * 0.5,
  };
}

function computeStressEffect(level: number): Risks3 {
  const d = (level - DEFAULT_LIFESTYLE.stressLevel) / 10;
  return { hypertension: 1 + d * 0.2, diabetes: 1 + d * 0.15, anemia: 1 + d * 0.05 };
}

/**
 * @param baseline 0-100 current risk per condition (from real predictions)
 */
export function runWhatIfSimulation(baseline: Risks3, params: LifestyleParams): WhatIfResult {
  const effects = [
    computeExerciseEffect(params.exerciseMins),
    computeSugarEffect(params.sugarGrams),
    computeSodiumEffect(params.sodiumGrams),
    computeIronEffect(params.ironServings),
    computeMedicationEffect(params.medicationAdherence),
    computeSleepEffect(params.sleepHours),
    computeStressEffect(params.stressLevel),
  ];

  let hypMod = 1;
  let diabMod = 1;
  let anemMod = 1;
  for (const e of effects) {
    hypMod *= e.hypertension;
    diabMod *= e.diabetes;
    anemMod *= e.anemia;
  }

  const modifiedRisks: Risks3 = {
    hypertension: Math.round(clamp(baseline.hypertension * hypMod, 0, 100)),
    diabetes: Math.round(clamp(baseline.diabetes * diabMod, 0, 100)),
    anemia: Math.round(clamp(baseline.anemia * anemMod, 0, 100)),
  };

  const deltas: Risks3 = {
    hypertension: modifiedRisks.hypertension - baseline.hypertension,
    diabetes: modifiedRisks.diabetes - baseline.diabetes,
    anemia: modifiedRisks.anemia - baseline.anemia,
  };

  return { modifiedRisks, deltas };
}
