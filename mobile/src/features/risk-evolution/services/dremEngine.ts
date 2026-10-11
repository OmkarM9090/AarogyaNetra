/**
 * dremEngine — Dynamic Risk Evolution Modeling.
 *
 * Monte-Carlo trajectory simulation using an Ornstein-Uhlenbeck
 * (mean-reverting) process per condition. Pure on-device math; the
 * baseline comes from the latest real backend prediction.
 */
import type { Condition } from '../../../shared/types/health';

export interface TrajectoryData {
  months: number[];
  median: number[]; // 0-100
  p25: number[];
  p75: number[];
  p5: number[];
  p95: number[];
}

export interface DREMTrajectory {
  horizonMonths: 6 | 12;
  trajectories: Record<Condition, TrajectoryData>;
}

export type DREMHorizon = 6 | 12;

const NUM_SIMULATIONS = 120;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function gaussianRandom(mean: number, stddev: number): number {
  const u1 = Math.max(Math.random(), 1e-6);
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + stddev * z;
}

/**
 * Ornstein-Uhlenbeck path: dx = θ(μ − x)dt + σ dW, clamped to [0, 1].
 */
function ornsteinUhlenbeck(x0: number, theta: number, mu: number, sigma: number, n: number): number[] {
  const path = [x0];
  let x = x0;
  const dt = 1;
  for (let i = 0; i < n; i++) {
    const drift = theta * (mu - x) * dt;
    const diffusion = sigma * Math.sqrt(dt) * gaussianRandom(0, 1);
    x = clamp(x + drift + diffusion, 0, 1);
    path.push(parseFloat(x.toFixed(4)));
  }
  return path;
}

/** Disease-specific dynamics (0-1 risk space). */
const DISEASE_PARAMS: Record<Condition, { theta: number; muOffset: number; sigma: number }> = {
  hypertension: { theta: 0.05, muOffset: 0.02, sigma: 0.03 },
  diabetes: { theta: 0.04, muOffset: 0.015, sigma: 0.025 },
  anemia: { theta: 0.06, muOffset: 0.01, sigma: 0.035 },
};

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = clamp((p / 100) * (sorted.length - 1), 0, sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const frac = idx - lo;
  return sorted[lo] * (1 - frac) + sorted[hi] * frac;
}

/**
 * Simulate risk trajectories for one condition.
 * @param baseline0to1 current risk score in 0-1
 */
export function generateTrajectory(baseline0to1: number, condition: Condition, horizon: DREMHorizon): TrajectoryData {
  const params = DISEASE_PARAMS[condition];
  const steps = horizon;
  const months = Array.from({ length: steps + 1 }, (_, i) => i);
  const start = clamp(baseline0to1, 0.01, 0.99);
  const mu = clamp(start + params.muOffset * steps, 0.01, 0.99);

  const perStep: number[][] = months.map(() => []);
  for (let s = 0; s < NUM_SIMULATIONS; s++) {
    const path = ornsteinUhlenbeck(start, params.theta, mu, params.sigma, steps);
    path.forEach((v, i) => perStep[i].push(v));
  }

  const quantile = (p: number) =>
    perStep.map((arr) => Math.round(percentile([...arr].sort((a, b) => a - b), p) * 100));

  return {
    months,
    median: quantile(50),
    p25: quantile(25),
    p75: quantile(75),
    p5: quantile(5),
    p95: quantile(95),
  };
}

export function generateDREMTrajectory(
  baselines: Record<Condition, number>, // 0-1
  horizon: DREMHorizon,
): DREMTrajectory {
  return {
    horizonMonths: horizon,
    trajectories: {
      diabetes: generateTrajectory(baselines.diabetes, 'diabetes', horizon),
      hypertension: generateTrajectory(baselines.hypertension, 'hypertension', horizon),
      anemia: generateTrajectory(baselines.anemia, 'anemia', horizon),
    },
  };
}
