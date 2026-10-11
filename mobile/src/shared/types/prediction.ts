/**
 * Prediction domain types — mirror of the backend predictions collection.
 */

import type { Condition, FeatureImportance, Recommendation, RiskLevel } from './health';

export interface PredictionResult {
  id: string;
  userId: string;
  /** The scan this prediction belongs to (needed to open the result hub). */
  scanId: string;
  condition: Condition;
  /** 0-100, higher = more dangerous. */
  riskScore: number;
  riskLevel: RiskLevel;
  /** 0-1 model confidence. */
  confidence: number;
  modelVersion: string;
  inputFeatures: Record<string, number | string | boolean>;
  outputRaw: {
    classProbabilities: Record<string, number>;
    predictedClass: string | number;
  };
  featureImportance?: FeatureImportance[];
  recommendations: Recommendation[];
  /** Present only for anemia scans. */
  eyeDetectionConfidence?: number | null;
  keyMetrics: Record<string, { value: string | number; unit: string; label: string }>;
  disclaimer: string;
  createdAt: string;
}

export interface DiabetesInput {
  age: number;
  gender: 'male' | 'female';
  bmi: number;
  bloodGlucoseFasting: number; // mg/dL
  hba1c: number; // %
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  familyHistoryDiabetes: boolean;
  physicalActivityMinutesWeekly: number;
  smokingStatus: 'never' | 'former' | 'current';
  waistCircumferenceCm?: number;
}

export interface HypertensionInput {
  age: number;
  gender: 'male' | 'female';
  bmi: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heartRate: number;
  cholesterolTotal?: number;
  smokingStatus: 'never' | 'former' | 'current';
  alcoholConsumption: 'none' | 'moderate' | 'heavy';
  saltIntake: 'low' | 'moderate' | 'high';
  stressLevel: 'low' | 'moderate' | 'high';
  familyHistoryHypertension: boolean;
  physicalActivityMinutesWeekly: number;
}

export type AnemiaSymptom =
  | 'fatigue'
  | 'pallor'
  | 'dizziness'
  | 'shortness_of_breath'
  | 'cold_hands'
  | 'brittle_nails';

export const ANEMIA_SYMPTOMS: { value: AnemiaSymptom; label: string; icon: string }[] = [
  { value: 'fatigue', label: 'Fatigue / tiredness', icon: '😮‍💨' },
  { value: 'pallor', label: 'Pale skin or lips', icon: '🌗' },
  { value: 'dizziness', label: 'Dizziness / light-headedness', icon: '💫' },
  { value: 'shortness_of_breath', label: 'Shortness of breath', icon: '🫁' },
  { value: 'cold_hands', label: 'Cold hands or feet', icon: '🧊' },
  { value: 'brittle_nails', label: 'Brittle nails', icon: '💅' },
];

export interface AnemiaInput {
  age: number;
  gender: 'male' | 'female';
  symptoms: AnemiaSymptom[];
}
