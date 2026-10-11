/**
 * RiskEvolutionScreen — "Risk Forecast" (Dynamic Risk Evolution Modeling).
 *
 * Monte-Carlo projections seeded from the user's LATEST REAL predictions.
 * Clearly labeled as a statistical projection, not a medical forecast.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/components/ui/Card';
import { ScreenWrapper } from '../../../shared/components/layout/ScreenWrapper';
import { EmptyState } from '../../../shared/components/feedback/EmptyState';
import { Button } from '../../../shared/components/ui/Button';
import { useRiskEvolution } from '../hooks/useRiskEvolution';
import { RiskChart } from '../components/RiskChart';
import { TimeRangeSelector } from '../components/TimeRangeSelector';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { AppParamList } from '../../../app/navigation/types';
import { Colors, Spacing, Typography } from '../../../shared/theme';
import { CONDITION_META } from '../../../shared/utils/healthUtils';

export const RiskEvolutionScreen: React.FC = () => {
  const { trajectory, horizon, setHorizon, hasData } = useRiskEvolution();
  const navigation = useNavigation<NavigationProp<AppParamList>>();

  if (!hasData || !trajectory) {
    return (
      <ScreenWrapper scroll>
        <EmptyState
          icon="📈"
          title="No forecast available yet"
          description="Complete at least one health scan and the 6/12-month risk projections will appear here."
          action={
            <Button
              title="🩺 Start a scan"
              size="large"
              style={{ marginTop: Spacing.lg }}
              onPress={() => navigation.navigate('ScannerTab')}
            />
          }
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll>
      <View style={styles.wrap}>
        <Card style={styles.intro}>
          <Text style={styles.introTitle}>📈 Risk forecast (next {horizon} months)</Text>
          <Text style={styles.introText}>
            Statistical projection using your latest real screening results. Risk evolves
            probabilistically — this is an estimate for planning, not a diagnosis.
          </Text>
        </Card>

        <TimeRangeSelector value={horizon} onChange={setHorizon} />

        <RiskChart
          title={CONDITION_META.diabetes.label}
          icon={CONDITION_META.diabetes.icon}
          color={CONDITION_META.diabetes.color}
          data={trajectory.trajectories.diabetes}
        />
        <RiskChart
          title={CONDITION_META.hypertension.label}
          icon={CONDITION_META.hypertension.icon}
          color={CONDITION_META.hypertension.color}
          data={trajectory.trajectories.hypertension}
        />
        <RiskChart
          title={CONDITION_META.anemia.label}
          icon={CONDITION_META.anemia.icon}
          color={CONDITION_META.anemia.color}
          data={trajectory.trajectories.anemia}
        />

        <Text style={styles.disclaimer}>
          ⚠️ Projections are generated from stochastic models calibrated on population trends.
          Lifestyle changes (see What-If Simulation) are the most reliable way to influence your
          trajectory.
        </Text>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  intro: {
    gap: 4,
  },
  introTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  introText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  disclaimer: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 17,
  },
});
