import {
  CONDITION_META,
  bmi,
  healthScoreFromRisk,
  riskLevelColor,
  riskLevelLabel,
} from '../../src/shared/utils/healthUtils';
import type { RiskLevel } from '../../src/shared/types/health';

describe('healthUtils', () => {
  test('bmi computes and rounds to 0.1', () => {
    expect(bmi(70, 175)).toBe(22.9);
    expect(bmi(null, 175)).toBeNull();
    expect(bmi(70, 0)).toBeNull();
    expect(bmi(70, null)).toBeNull();
  });

  test('riskLevelLabel capitalizes', () => {
    expect(riskLevelLabel('low')).toBe('Low');
    expect(riskLevelLabel('critical')).toBe('Critical');
  });

  test('riskLevelColor returns distinct colors', () => {
    const levels: RiskLevel[] = ['low', 'moderate', 'high', 'critical'];
    const colors = levels.map(riskLevelColor);
    expect(new Set(colors).size).toBe(4);
  });

  test('healthScoreFromRisk inverts and clamps', () => {
    expect(healthScoreFromRisk(0)).toBe(100);
    expect(healthScoreFromRisk(50)).toBe(50);
    expect(healthScoreFromRisk(150)).toBe(0);
    expect(healthScoreFromRisk(-20)).toBe(100);
  });

  test('CONDITION_META covers all three conditions', () => {
    expect(Object.keys(CONDITION_META).sort()).toEqual(['anemia', 'diabetes', 'hypertension']);
    for (const meta of Object.values(CONDITION_META)) {
      expect(meta.label).toBeTruthy();
      expect(meta.icon).toBeTruthy();
      expect(meta.color).toMatch(/^#/);
    }
  });
});
