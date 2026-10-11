/**
 * AnemiaResultScreen — anemia-specific detail view (includes the
 * eye-detection confidence from the YOLO stage).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';

import { Card } from '../../../shared/components/ui/Card';
import { useHealthStore } from '../../../shared/store/useHealthStore';
import { useLanguage } from '../../../shared/i18n';
import { Colors, Typography } from '../../../shared/theme';
import { ConditionResultView } from '../components/ConditionResultView';
import type { ConditionResultParams } from '../types';

export const AnemiaResultScreen: React.FC = () => {
  const route = useRoute();
  const params = (route.params ?? {}) as ConditionResultParams;
  const latest = useHealthStore(s => s.latestPredictions.anemia);
  const { t } = useLanguage();

  const extraContent =
    latest?.eyeDetectionConfidence != null ? (
      <Card style={styles.eyeCard}>
        <Text style={styles.eyeTitle}>👁️ Eye region detection</Text>
        <Text style={styles.eyeText}>
          {t('eye_scan_label')}: the AI located the eye region with{' '}
          {Math.round(latest.eyeDetectionConfidence * 100)}% confidence before running the
          anemia classifier.
        </Text>
      </Card>
    ) : null;

  return (
    <ConditionResultView
      condition="anemia"
      predictionId={params.predictionId}
      fallback={latest}
      extraContent={extraContent}
    />
  );
};

const styles = StyleSheet.create({
  eyeCard: {
    padding: 16,
  },
  eyeTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  eyeText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});
