/**
 * Shared health domain types — mirror of the backend medical schemas.
 */

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export type Condition = 'diabetes' | 'hypertension' | 'anemia';

export const CONDITIONS: Condition[] = ['diabetes', 'hypertension', 'anemia'];

export interface VitalDisplay {
  label: string;
  value: string | number;
  unit: string;
}

export interface Recommendation {
  category: string;
  title: string;
  description: string;
  priority: 'info' | 'moderate' | 'urgent';
}

export interface FeatureImportance {
  feature: string;
  contribution: number; // 0-1
  description?: string;
}

export interface RiskSummaryEntry {
  condition: Condition;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  confidence: number; // 0-1
  modelVersion: string;
  lastPredictedAt: string | null;
}

export interface RiskSummary {
  overallRiskScore: number; // 0-100
  riskByCondition: Record<Condition, RiskSummaryEntry>;
  totalScans: number;
  disclaimer: string;
}
