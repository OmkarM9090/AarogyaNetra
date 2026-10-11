/**
 * whatIfEngine — the labeled on-device What-If simulation.
 */
import {
  DEFAULT_LIFESTYLE,
  runWhatIfSimulation,
} from '../../../src/features/lifestyle-sim/services/whatIfEngine';

const BASELINE = { diabetes: 50, hypertension: 40, anemia: 30 };

describe('whatIfEngine', () => {
  test('returns modified risks and deltas for all three conditions', () => {
    const result = runWhatIfSimulation(BASELINE, DEFAULT_LIFESTYLE);
    expect(Object.keys(result.modifiedRisks).sort()).toEqual(['anemia', 'diabetes', 'hypertension']);
    expect(Object.keys(result.deltas).sort()).toEqual(['anemia', 'diabetes', 'hypertension']);
    for (const v of Object.values(result.modifiedRisks)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  test('default lifestyle changes nothing', () => {
    const result = runWhatIfSimulation(BASELINE, DEFAULT_LIFESTYLE);
    for (const c of ['diabetes', 'hypertension', 'anemia'] as const) {
      expect(result.deltas[c]).toBeCloseTo(0, 5);
    }
  });

  test('more exercise lowers diabetes & hypertension risk', () => {
    const result = runWhatIfSimulation(BASELINE, { ...DEFAULT_LIFESTYLE, exerciseMins: 150 });
    expect(result.deltas.diabetes).toBeLessThan(0);
    expect(result.deltas.hypertension).toBeLessThan(0);
  });

  test('more sugar raises diabetes risk', () => {
    const result = runWhatIfSimulation(BASELINE, { ...DEFAULT_LIFESTYLE, sugarGrams: 150 });
    expect(result.deltas.diabetes).toBeGreaterThan(0);
  });

  test('more sodium raises hypertension risk', () => {
    const result = runWhatIfSimulation(BASELINE, { ...DEFAULT_LIFESTYLE, sodiumGrams: 12 });
    expect(result.deltas.hypertension).toBeGreaterThan(0);
  });

  test('risks are clamped to 0-100', () => {
    const result = runWhatIfSimulation(
      { diabetes: 99, hypertension: 99, anemia: 99 },
      { ...DEFAULT_LIFESTYLE, exerciseMins: 300, sugarGrams: 0, sodiumGrams: 0, stressLevel: 0 },
    );
    for (const v of Object.values(result.modifiedRisks)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});
