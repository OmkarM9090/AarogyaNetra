/**
 * ConditionResultView — shared body for the per-condition result screens.
 * Renders gauge, key metrics, factors, recommendations + disclaimer.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../shared/components/ui/Button';
import { Card } from '../../../shared/components/ui/Card';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import { ScreenWrapper } from '../../../shared/components/layout/ScreenWrapper';
import { EmptyState } from '../../../shared/components/feedback/EmptyState';
import { useApi } from '../../../shared/hooks/useApi';
import { predictionService } from '../services/predictionService';
import { DisclaimerBanner } from './DisclaimerBanner';
import { RiskGauge } from './RiskGauge';
import { VitalDisplay } from './VitalDisplay';
import { RecommendationCard } from './RecommendationCard';
import { RiskFactorList } from './RiskFactorList';
import { CONDITION_META, riskLevelColor, riskLevelLabel } from '../../../shared/utils/healthUtils';
import { formatDateTime } from '../../../shared/utils/dateUtils';
import { Colors, Spacing, Typography } from '../../../shared/theme';
import type { Condition } from '../../../shared/types/health';
import type { PredictionResult } from '../types';

interface ConditionResultViewProps {
  condition: Condition;
  /** When given, the prediction is loaded by id. Otherwise `fallback` is used. */
  predictionId?: string;
  fallback?: PredictionResult | null;
  extraNote?: string;
  extraContent?: React.ReactNode;
}

export const ConditionResultView: React.FC<ConditionResultViewProps> = ({
  condition,
  predictionId,
  fallback,
  extraNote,
  extraContent,
}) => {
  const { data: byId, isLoading, error, refetch } = useApi<PredictionResult | null>(
    React.useCallback(
      () =>
        predictionId
          ? predictionService.getPredictionDetail(predictionId).catch(() => null)
          : Promise.resolve(null),
      [predictionId],
    ),
    [predictionId],
  );

  const prediction = predictionId ? byId : fallback;
  const meta = CONDITION_META[condition];

  if (predictionId && isLoading) {
    return (
      <ScreenWrapper>
        <LoadingSpinner fullScreen label={`Loading ${meta.label} result…`} />
      </ScreenWrapper>
    );
  }

  if (error || !prediction) {
    return (
      <ScreenWrapper scroll>
        <EmptyState
          icon="⚠️"
          title={`No ${meta.label} result found`}
          description={error?.message ?? 'This result could not be loaded.'}
          action={
            predictionId ? (
              <Button title="🔄 Retry" variant="outline" onPress={refetch} style={{ marginTop: Spacing.lg }} />
            ) : undefined
          }
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll>
      <View style={styles.wrap}>
        <DisclaimerBanner />

        <View style={styles.titleRow}>
          <Text style={styles.title}>
            {meta.icon} {meta.label} screening result
          </Text>
        </View>
        <Text style={styles.when}>{prediction.createdAt ? formatDateTime(prediction.createdAt) : ''}</Text>

        <Card variant="elevated" style={styles.gaugeCard}>
          <View style={styles.gaugeCenter}>
            <RiskGauge
              score={prediction.riskScore}
              riskLevel={prediction.riskLevel}
              size={160}
              strokeWidth={14}
              label="Risk score"
            />
            <Text style={[styles.level, { color: riskLevelColor(prediction.riskLevel) }]}>
              {riskLevelLabel(prediction.riskLevel)} risk
            </Text>
            <Text style={styles.conf}>
              Model confidence {Math.round(prediction.confidence * 100)}% · model {prediction.modelVersion}
            </Text>
          </View>
        </Card>

        {extraNote ? <Text style={styles.note}>{extraNote}</Text> : null}

        {Object.keys(prediction.keyMetrics ?? {}).length > 0 ? (
          <>
            <Text style={styles.section}>Key metrics</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vitalsRow}>
              {Object.entries(prediction.keyMetrics).map(([k, m]) => (
                <VitalDisplay
                  key={k}
                  label={m.label ?? k}
                  value={m.value}
                  unit={m.unit}
                  color={meta.color}
                />
              ))}
            </ScrollView>
          </>
        ) : null}

        {extraContent}

        {prediction.featureImportance?.length ? (
          <RiskFactorList title="What drove this score" factors={prediction.featureImportance} color={meta.color} />
        ) : null}

        {prediction.recommendations?.length ? (
          <>
            <Text style={styles.section}>Personalized recommendations</Text>
            {prediction.recommendations.map((r, i) => (
              <RecommendationCard key={i} recommendation={r} />
            ))}
          </>
        ) : null}

        <DisclaimerBanner compact />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  titleRow: {
    marginTop: Spacing.xs,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  when: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  gaugeCard: {
    padding: Spacing.xl,
  },
  gaugeCenter: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  level: {
    ...Typography.h3,
    fontWeight: '800',
  },
  conf: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  note: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  section: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  vitalsRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
});
