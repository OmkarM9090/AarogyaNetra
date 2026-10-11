/**
 * Medical reference thresholds used for local validation and display.
 * Sources: AHA/ACC BP categories, ADA HbA1c categories, WHO hemoglobin cutoffs.
 * These are NOT used for diagnosis — the backend ML models produce the scores.
 */

export const Medical = {
  AGE_RANGE: { min: 1, max: 120 },
  BMI_RANGE: { min: 10, max: 60 },
  FASTING_GLUCOSE_RANGE: { min: 50, max: 500 }, // mg/dL
  HBA1C_RANGE: { min: 3, max: 15 }, // %
  BP_SYSTOLIC_RANGE: { min: 70, max: 250 }, // mmHg
  BP_DIASTOLIC_RANGE: { min: 40, max: 150 }, // mmHg
  HEART_RATE_RANGE: { min: 40, max: 200 }, // bpm
  CHOLESTEROL_RANGE: { min: 50, max: 1000 }, // mg/dL
  ACTIVITY_RANGE: { min: 0, max: 2000 }, // minutes/week
  WAIST_RANGE: { min: 40, max: 200 }, // cm
  HEIGHT_RANGE: { min: 90, max: 230 }, // cm
  WEIGHT_RANGE: { min: 20, max: 300 }, // kg

  /** AHA blood pressure categories (display only). */
  BP_CATEGORIES: [
    { label: 'Normal', maxSystolic: 120, maxDiastolic: 80 },
    { label: 'Elevated', maxSystolic: 130, maxDiastolic: 80 },
    { label: 'Stage 1', maxSystolic: 140, maxDiastolic: 90 },
    { label: 'Stage 2', maxSystolic: 180, maxDiastolic: 120 },
    { label: 'Crisis', maxSystolic: Infinity, maxDiastolic: Infinity },
  ],

  /** ADA HbA1c categories (display only). */
  HBA1C_CATEGORIES: [
    { label: 'Normal', max: 5.7 },
    { label: 'Prediabetes', max: 6.5 },
    { label: 'Diabetes range', max: Infinity },
  ],

  /** WHO hemoglobin anemia cutoffs (g/dL, display only). */
  HEMOGLOBIN_CUTOFFS: {
    female: { mild: 12.0, moderate: 11.0, severe: 8.0 },
    male: { mild: 13.0, moderate: 11.0, severe: 8.0 },
  },
};

/** AHA BP category label for a reading (display only). */
export function bpCategoryLabel(systolic: number, diastolic: number): string {
  for (const c of Medical.BP_CATEGORIES) {
    if (systolic < c.maxSystolic && diastolic < c.maxDiastolic) return c.label;
  }
  return 'Crisis';
}

/** ADA HbA1c category label (display only). */
export function hba1cCategoryLabel(hba1c: number): string {
  for (const c of Medical.HBA1C_CATEGORIES) {
    if (hba1c < c.max) return c.label;
  }
  return 'Diabetes range';
}
