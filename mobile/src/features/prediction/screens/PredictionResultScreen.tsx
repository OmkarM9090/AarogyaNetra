/**
 * PredictionResultScreen — the hub result view.
 *
 * Loads a scan (with its attached prediction) by scanId from
 * GET /scans/{scan_id} and displays the primary result plus shortcuts to
 * the per-condition detail screens. Disclaimer is always shown.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { AppParamList } from '../../../app/navigation/types';

import { Button } from '../../../shared/components/ui/Button';
import { Card } from '../../../shared/components/ui/Card';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import { ScreenWrapper } from '../../../shared/components/layout/ScreenWrapper';
import { EmptyState } from '../../../shared/components/feedback/EmptyState';
import { useApi } from '../../../shared/hooks/useApi';
import { predictionService } from '../services/predictionService';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { DiseaseCard } from '../components/DiseaseCard';
import { RiskGauge } from '../components/RiskGauge';
import { VitalDisplay } from '../components/VitalDisplay';
import { RecommendationCard } from '../components/RecommendationCard';
import { RiskFactorList } from '../components/RiskFactorList';
import { useHealthStore } from '../../../shared/store/useHealthStore';
import { CONDITION_META, riskLevelColor, riskLevelLabel } from '../../../shared/utils/healthUtils';
import { formatDateTime } from '../../../shared/utils/dateUtils';
import { Colors, Spacing, Typography } from '../../../shared/theme';
import type { PredictionResult } from '../types';
import type { RiskSummary } from '../../../shared/types/health';
import type { ScanRecord } from '../../../shared/types/scan';

export const PredictionResultScreen: React.FC = () => {
  const route = useRoute();
  const scanId = (route.params as { scanId?: string } | undefined)?.scanId ?? '';
  const navigation = useNavigation<NavigationProp<AppParamList>>();
  const { riskSummary } = useHealthStore();

  const { data: scan, isLoading, error, refetch } = useApi<ScanRecord | null>(
    useCallback(() => predictionService.getScanDetail(scanId).catch(() => null), [scanId]),
    [scanId],
  );

  const [summary, setSummary] = useState<RiskSummary | null>(null);
  useEffect(() => {
    // The scan endpoint returns the attached prediction; the summary adds
    // the latest per-condition context for the hub view (best effort).
    predictionService
      .getRiskSummary()
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [scanId]);

  if (isLoading) {
    return (
      <ScreenWrapper>
        <LoadingSpinner fullScreen label="Loading your results…" />
      </ScreenWrapper>
    );
  }

  if (error || !scan) {
    return (
      <ScreenWrapper scroll>
        <EmptyState
          icon="⚠️"
          title="Unable to load this result"
          description={error?.message ?? 'The scan could not be found. It may have been deleted or the server is unreachable.'}
          action={
            <Button title="🔄 Retry" variant="outline" onPress={refetch} style={{ marginTop: Spacing.lg }} />
          }
        />
      </ScreenWrapper>
    );
  }

  const prediction: PredictionResult | null = scan.prediction ?? null;
  const meta = CONDITION_META[scan.scanType];

  return (
    <ScreenWrapper scroll>
      <View style={styles.wrap}>
        <DisclaimerBanner />
        <Text style={styles.when}>{scan.createdAt ? formatDateTime(scan.createdAt) : ''}</Text>

        {prediction ? (
          <>
            {/* Primary gauge */}
            <Card variant="elevated" style={styles.gaugeCard}>
              <View style={styles.gaugeRow}>
                <RiskGauge
                  score={prediction.riskScore}
                  riskLevel={prediction.riskLevel}
                  size={150}
                  strokeWidth={13}
                  label={`${meta.label} risk`}
                />
                <View style={styles.primaryMeta}>
                  <Text style={[styles.primaryLevel, { color: riskLevelColor(prediction.riskLevel) }]}>
                    {riskLevelLabel(prediction.riskLevel)} risk
                  </Text>
                  <Text style={styles.primaryConf}>
                    Model confidence {Math.round(prediction.confidence * 100)}%
                  </Text>
                  <Text style={styles.primaryModel}>
                    {meta.icon} {meta.label} screening · model {prediction.modelVersion}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Key metrics */}
            {Object.keys(prediction.keyMetrics ?? {}).length > 0 ? (
              <>
                <Text style={styles.section}>Key metrics</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.vitalsRow}
                >
                  {Object.entries(prediction.keyMetrics).map(([k, m]) => (
                    <VitalDisplay key={k} label={m.label ?? k} value={m.value} unit={m.unit} color={meta.color} />
                  ))}
                </ScrollView>
              </>
            ) : null}

            {/* Recommendations for the primary condition */}
            {prediction.recommendations?.length > 0 ? (
              <>
                <Text style={styles.section}>Recommendations</Text>
                {prediction.recommendations.slice(0, 3).map((r, i) => (
                  <RecommendationCard key={i} recommendation={r} />
                ))}
              </>
            ) : null}

            {prediction.featureImportance?.length ? (
              <RiskFactorList title={`Key factors — ${meta.label}`} factors={prediction.featureImportance} color={meta.color} />
            ) : null}
          </>
        ) : (
          <Card>
            <Text style={styles.noPred}>This scan is still being processed. Check back in a moment.</Text>
          </Card>
        )}

        {/* All-condition overview when the summary is available */}
        {summary ? (
          <>
            <Text style={styles.section}>Latest screening overview</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.diseaseRow}
            >
              {(['diabetes', 'hypertension', 'anemia'] as const).map((cond) => {
                const entry = summary.riskByCondition[cond];
                const cMeta = CONDITION_META[cond];
                return (
                  <DiseaseCard
                    key={cond}
                    name={cMeta.label}
                    icon={cMeta.icon}
                    riskLevel={entry?.riskLevel ?? 'low'}
                    riskScore={entry?.riskScore ?? 0}
                    confidence={entry?.confidence ?? 0}
                    keyMetric={{ label: 'Risk', value: Math.round(entry?.riskScore ?? 0), unit: '/100' }}
                    onPress={() =>
                      navigation.navigate('ConditionResult', { condition: cond, scanId: scan.id })
                    }
                  />
                );
              })}
            </ScrollView>
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
  when: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  gaugeCard: {
    padding: Spacing.xl,
  },
  gaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  primaryMeta: {
    flex: 1,
    gap: 4,
  },
  primaryLevel: {
    ...Typography.h3,
    fontWeight: '800',
  },
  primaryConf: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  primaryModel: {
    ...Typography.caption,
    color: Colors.textTertiary,
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
  diseaseRow: {
    paddingRight: Spacing.lg,
  },
  noPred: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
