/**
 * useRiskEvolution — compute DREM trajectories from the latest
 * real predictions, for the selected horizon.
 */
import { useEffect, useMemo, useState } from 'react';

import { useHealthStore } from '../../../shared/store/useHealthStore';
import type { DREMHorizon, DREMTrajectory } from '../types';
import { generateDREMTrajectory } from '../services/dremEngine';

export function useRiskEvolution() {
  const { latestPredictions, riskSummary } = useHealthStore();
  const [horizon, setHorizon] = useState<DREMHorizon>(6);

  const hasData =
    latestPredictions.diabetes !== null ||
    latestPredictions.hypertension !== null ||
    latestPredictions.anemia !== null;

  const baselines = useMemo(() => {
    const score = (cond: 'diabetes' | 'hypertension' | 'anemia'): number => {
      const latest = latestPredictions[cond];
      if (latest) return latest.riskScore / 100;
      const summary = riskSummary?.riskByCondition[cond];
      return summary ? summary.riskScore / 100 : 0;
    };
    return {
      diabetes: score('diabetes'),
      hypertension: score('hypertension'),
      anemia: score('anemia'),
    };
  }, [latestPredictions, riskSummary]);

  const trajectory: DREMTrajectory | null = useMemo(() => {
    if (!hasData) return null;
    return generateDREMTrajectory(baselines, horizon);
  }, [hasData, baselines, horizon]);

  useEffect(() => {
    // Trajectory generation is synchronous CPU work (120 sims × 3 conditions)
    // — trivial for modern devices.
  }, [trajectory]);

  return { trajectory, horizon, setHorizon, hasData, baselines };
}
