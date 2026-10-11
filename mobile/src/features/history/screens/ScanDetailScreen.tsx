/**
 * ScanDetailScreen — full report for one scan (its prediction embedded).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { AppParamList } from '../../../app/navigation/types';

import { Button } from '../../../shared/components/ui/Button';
import { Card } from '../../../shared/components/ui/Card';
import { ScreenWrapper } from '../../../shared/components/layout/ScreenWrapper';
import { EmptyState } from '../../../shared/components/feedback/EmptyState';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import { useApi } from '../../../shared/hooks/useApi';
import { predictionService } from '../../prediction/services/predictionService';
import { DisclaimerBanner } from '../../prediction/components/DisclaimerBanner';
import { RiskGauge } from '../../prediction/components/RiskGauge';
import { VitalDisplay } from '../../prediction/components/VitalDisplay';
import { RecommendationCard } from '../../prediction/components/RecommendationCard';
import { CONDITION_META } from '../../../shared/utils/healthUtils';
import { riskLevelColor, riskLevelLabel } from '../../../shared/utils/healthUtils';
import { formatDateTime } from '../../../shared/utils/dateUtils';
import { Colors, Spacing, Typography } from '../../../shared/theme';

export const ScanDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp<AppParamList>>();
  const scanId = (route.params as { scanId?: string } | undefined)?.scanId ?? '';

  const { data: scan, isLoading, error, refetch } = useApi(
    React.useCallback(() => predictionService.getScanDetail(scanId).catch(() => null), [scanId]),
    [scanId],
  );

  if (isLoading) {
    return (
      <ScreenWrapper>
        <LoadingSpinner fullScreen label="Loading scan…" />
      </ScreenWrapper>
    );
  }

  if (error || !scan) {
    return (
      <ScreenWrapper scroll>
        <EmptyState
          icon="⚠️"
          title="Scan not found"
          description={error?.message ?? 'This scan could not be loaded.'}
          action={<Button title="🔄 Retry" variant="outline" style={{ marginTop: Spacing.lg }} onPress={refetch} />}
        />
      </ScreenWrapper>
    );
  }

  const meta = CONDITION_META[scan.scanType];
  const pred = scan.prediction;

  return (
    <ScreenWrapper scroll>
      <View style={styles.wrap}>
        <DisclaimerBanner />

        <Card variant="elevated" style={styles.headerCard}>
          <Text style={styles.scanTitle}>
            {meta.icon} {meta.label} scan
          </Text>
          <Text style={styles.when}>{formatDateTime(scan.createdAt)} · {scan.status}</Text>
        </Card>

        {pred ? (
          <>
            <Card style={styles.gaugeCard}>
              <View style={styles.gaugeCenter}>
                <RiskGauge score={pred.riskScore} riskLevel={pred.riskLevel} size={140} strokeWidth={13} label="Risk score" />
                <Text style={[styles.level, { color: riskLevelColor(pred.riskLevel) }]}>
                  {riskLevelLabel(pred.riskLevel)} risk · {Math.round(pred.confidence * 100)}% confidence
                </Text>
              </View>
            </Card>

            {Object.keys(pred.keyMetrics ?? {}).length > 0 ? (
              <View style={styles.vitalsRow}>
                {Object.entries(pred.keyMetrics).map(([k, m]) => (
                  <VitalDisplay key={k} label={m.label ?? k} value={m.value} unit={m.unit} color={meta.color} />
                ))}
              </View>
            ) : null}

            {pred.recommendations?.length ? (
              <>
                <Text style={styles.section}>Recommendations</Text>
                {pred.recommendations.map((r, i) => (
                  <RecommendationCard key={i} recommendation={r} />
                ))}
              </>
            ) : null}

            <Button
              title={`Open ${meta.label} result view →`}
              fullWidth
              onPress={() =>
                navigation.navigate('ConditionResult', {
                  condition: scan.scanType,
                  predictionId: pred.id,
                  scanId: scan.id,
                })
              }
            />
          </>
        ) : (
          <Card>
            <Text style={styles.noPred}>No prediction attached to this scan yet.</Text>
          </Card>
        )}

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
  headerCard: {
    gap: 3,
  },
  scanTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  when: {
    ...Typography.bodySmall,
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
    ...Typography.h4,
    fontWeight: '800',
  },
  vitalsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  section: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  noPred: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
