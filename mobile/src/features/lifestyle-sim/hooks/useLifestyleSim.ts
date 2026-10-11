/**
 * useLifestyleSim — state for the What-If simulation: params + live result.
 */
import { useCallback, useMemo, useState } from 'react';

import { useHealthStore } from '../../../shared/store/useHealthStore';
import type { Condition } from '../../../shared/types/health';
import { DEFAULT_LIFESTYLE, runWhatIfSimulation, type LifestyleParams, type WhatIfResult } from '../services/whatIfEngine';

export function useLifestyleSim() {
  const { latestPredictions, riskSummary } = useHealthStore();
  const [params, setParams] = useState<LifestyleParams>({ ...DEFAULT_LIFESTYLE });

  const hasData =
    latestPredictions.diabetes !== null ||
    latestPredictions.hypertension !== null ||
    latestPredictions.anemia !== null;

  const baseline = useMemo<Record<Condition, number>>(() => {
    const score = (cond: Condition): number => {
      const latest = latestPredictions[cond];
      if (latest) return latest.riskScore;
      const s = riskSummary?.riskByCondition[cond];
      return s ? s.riskScore : 0;
    };
    return {
      diabetes: score('diabetes'),
      hypertension: score('hypertension'),
      anemia: score('anemia'),
    };
  }, [latestPredictions, riskSummary]);

  const result: WhatIfResult | null = useMemo(() => {
    if (!hasData) return null;
    return runWhatIfSimulation(baseline, params);
  }, [hasData, baseline, params]);

  const setParam = useCallback((key: keyof LifestyleParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => setParams({ ...DEFAULT_LIFESTYLE }), []);

  return { params, setParam, reset, result, baseline, hasData };
}
