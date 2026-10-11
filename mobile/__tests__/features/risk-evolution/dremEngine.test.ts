/**
 * dremEngine — OU-simulated risk trajectories (0-100 scale).
 */
import {
  generateDREMTrajectory,
  generateTrajectory,
} from '../../../src/features/risk-evolution/services/dremEngine';

describe('dremEngine', () => {
  test('6-month horizon has 7 points (incl. month 0)', () => {
    const t = generateTrajectory(0.4, 'diabetes', 6);
    expect(t.months).toHaveLength(7);
    expect(t.months[0]).toBe(0);
    expect(t.months[6]).toBe(6);
    for (const series of [t.median, t.p25, t.p75, t.p5, t.p95]) {
      expect(series).toHaveLength(7);
    }
  });

  test('12-month horizon has 13 points', () => {
    const t = generateTrajectory(0.4, 'anemia', 12);
    expect(t.months).toHaveLength(13);
  });

  test('quantiles are ordered p5 ≤ p25 ≤ median ≤ p75 ≤ p95', () => {
    const t = generateTrajectory(0.5, 'hypertension', 12);
    for (let i = 0; i < t.months.length; i++) {
      expect(t.p5[i]).toBeLessThanOrEqual(t.p25[i]);
      expect(t.p25[i]).toBeLessThanOrEqual(t.median[i]);
      expect(t.median[i]).toBeLessThanOrEqual(t.p75[i]);
      expect(t.p75[i]).toBeLessThanOrEqual(t.p95[i]);
    }
  });

  test('values stay in 0-100', () => {
    const t = generateTrajectory(0.95, 'diabetes', 12);
    for (const v of [...t.p5, ...t.p95]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  test('baseline at month 0 equals the input (rounded)', () => {
    const t = generateTrajectory(0.4, 'diabetes', 6);
    expect(t.median[0]).toBeCloseTo(40, 0);
    expect(t.p25[0]).toBeCloseTo(40, 0);
    expect(t.p75[0]).toBeCloseTo(40, 0);
  });

  test('generateDREMTrajectory covers all conditions', () => {
    const d = generateDREMTrajectory({ diabetes: 0.3, hypertension: 0.2, anemia: 0.1 }, 6);
    expect(d.horizonMonths).toBe(6);
    expect(Object.keys(d.trajectories).sort()).toEqual(['anemia', 'diabetes', 'hypertension']);
  });
});
