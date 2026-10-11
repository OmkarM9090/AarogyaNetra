/**
 * Prediction feature types.
 */
export type {
  AnemiaInput,
  AnemiaSymptom,
  DiabetesInput,
  HypertensionInput,
  PredictionResult,
} from '../../shared/types/prediction';
export { ANEMIA_SYMPTOMS } from '../../shared/types/prediction';
export type { RiskLevel, RiskSummary } from '../../shared/types/health';

/** Result-screen navigation params (shared by all stacks). */
export interface ConditionResultParams {
  condition: 'diabetes' | 'hypertension' | 'anemia';
  predictionId?: string;
  scanId?: string;
}
