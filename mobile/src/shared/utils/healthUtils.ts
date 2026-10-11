/**
 * Health display utilities — map backend risk values to UI concepts.
 */
import type { Condition, RiskLevel } from '../types/health';
import { Colors } from '../theme';

export const CONDITION_META: Record<Condition, { label: string; icon: string; color: string }> = {
  diabetes: { label: 'Diabetes', icon: '🩸', color: Colors.primary },
  hypertension: { label: 'Hypertension', icon: '❤️', color: '#ef4444' },
  anemia: { label: 'Anemia', icon: '👁️', color: '#f59e0b' },
};

export function riskLevelColor(level: RiskLevel): string {
  switch (level) {
    case 'low': return Colors.success;
    case 'moderate': return Colors.warning;
    case 'high': return '#f97316';
    case 'critical': return Colors.danger;
  }
}

export function riskLevelLabel(level: RiskLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

/**
 * Convert a 0-100 risk score to a 0-1 health score for gauges where
 * "higher is better" (health score = 100 - risk).
 */
export function healthScoreFromRisk(risk0to100: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - risk0to100)));
}

export function bmi(weightKg?: number | null, heightCm?: number | null): number | null {
  if (!weightKg || !heightCm) return null;
  const h = heightCm / 100;
  if (h <= 0) return null;
  const value = weightKg / (h * h);
  return Math.round(value * 10) / 10;
}
