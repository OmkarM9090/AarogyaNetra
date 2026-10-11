/**
 * HypertensionResultScreen — hypertension-specific detail view.
 */
import React from 'react';
import { useRoute } from '@react-navigation/native';

import { useHealthStore } from '../../../shared/store/useHealthStore';
import { bpCategoryLabel } from '../../../shared/constants/medical';
import { ConditionResultView } from '../components/ConditionResultView';
import type { ConditionResultParams } from '../types';

export const HypertensionResultScreen: React.FC = () => {
  const route = useRoute();
  const params = (route.params ?? {}) as ConditionResultParams;
  const latest = useHealthStore(s => s.latestPredictions.hypertension);

  let extraNote: string | undefined;
  const sys = latest?.inputFeatures?.blood_pressure_systolic;
  const dia = latest?.inputFeatures?.blood_pressure_diastolic;
  if (typeof sys === 'number' && typeof dia === 'number') {
    extraNote = `Reported BP ${sys}/${dia} mmHg is in the ${bpCategoryLabel(sys, dia)} category (AHA).`;
  }

  return (
    <ConditionResultView
      condition="hypertension"
      predictionId={params.predictionId}
      fallback={latest}
      extraNote={extraNote}
    />
  );
};
