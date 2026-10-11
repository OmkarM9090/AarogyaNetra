/**
 * DiabetesResultScreen — diabetes-specific detail view.
 */
import React from 'react';
import { useRoute } from '@react-navigation/native';

import { useHealthStore } from '../../../shared/store/useHealthStore';
import { hba1cCategoryLabel } from '../../../shared/constants/medical';
import { ConditionResultView } from '../components/ConditionResultView';
import type { ConditionResultParams } from '../types';

export const DiabetesResultScreen: React.FC = () => {
  const route = useRoute();
  const params = (route.params ?? {}) as ConditionResultParams;
  const latest = useHealthStore(s => s.latestPredictions.diabetes);

  let extraNote: string | undefined;
  const hba1c = latest?.inputFeatures?.hba1c;
  if (typeof hba1c === 'number') {
    extraNote = `Reported HbA1c ${hba1c.toFixed(1)}% is in the ${hba1cCategoryLabel(hba1c).toLowerCase()} range (ADA).`;
  }

  return (
    <ConditionResultView
      condition="diabetes"
      predictionId={params.predictionId}
      fallback={latest}
      extraNote={extraNote}
    />
  );
};
