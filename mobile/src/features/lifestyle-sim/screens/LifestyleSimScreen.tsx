/**
 * LifestyleSimScreen — "What-If Simulation".
 *
 * Clearly labeled as a SIMULATION: sliders + presets project how lifestyle
 * changes would affect the user's latest REAL screening risks.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../shared/components/ui/Button';
import { Card } from '../../../shared/components/ui/Card';
import { ScreenWrapper } from '../../../shared/components/layout/ScreenWrapper';
import { EmptyState } from '../../../shared/components/feedback/EmptyState';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { AppParamList } from '../../../app/navigation/types';
import { Colors, Spacing, Typography } from '../../../shared/theme';
import { useLifestyleSim } from '../hooks/useLifestyleSim';
import type { LifestyleParams } from '../services/whatIfEngine';
import { ParameterSlider } from '../components/ParameterSlider';
import { ImpactChart } from '../components/ImpactChart';
import { PRESET_SCENARIOS, ScenarioCard } from '../components/ScenarioCard';

export const LifestyleSimScreen: React.FC = () => {
  const { params, setParam, reset, result, baseline, hasData } = useLifestyleSim();
  const navigation = useNavigation<NavigationProp<AppParamList>>();

  if (!hasData || !result) {
    return (
      <ScreenWrapper scroll>
        <EmptyState
          icon="🧪"
          title="Nothing to simulate yet"
          description="Complete a health scan first — the What-If simulator projects changes on top of your real results."
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
        <Card variant="accent" style={styles.banner}>
          <Text style={styles.bannerTitle}>🧪 What-If Simulation</Text>
          <Text style={styles.bannerText}>
            This is a simulation, not a prediction. Move the sliders to see how lifestyle
            changes would affect your latest screening risks.
          </Text>
        </Card>

        <Text style={styles.section}>Preset scenarios</Text>
        {PRESET_SCENARIOS.map((s) => (
          <ScenarioCard key={s.id} scenario={s} onApply={(patch) => { Object.entries(patch).forEach(([k, v]) => setParam(k as keyof LifestyleParams, v as number)); }} />
        ))}

        <Text style={styles.section}>Fine-tune</Text>
        <Card style={styles.sliderCard}>
          <ParameterSlider icon="🏃" label="Exercise (min/week)" value={params.exerciseMins} min={0} max={420} unit="min" onChange={v => setParam('exerciseMins', v)} />
          <ParameterSlider icon="🍬" label="Added sugar (g/day)" value={params.sugarGrams} min={0} max={200} unit="g" onChange={v => setParam('sugarGrams', v)} />
          <ParameterSlider icon="🧂" label="Salt (g/day)" value={params.sodiumGrams} min={0} max={20} unit="g" onChange={v => setParam('sodiumGrams', v)} />
          <ParameterSlider icon="🥬" label="Iron-rich servings (week)" value={params.ironServings} min={0} max={14} unit="servings" onChange={v => setParam('ironServings', v)} />
          <ParameterSlider icon="💊" label="Medication adherence" value={params.medicationAdherence} min={0} max={100} unit="%" onChange={v => setParam('medicationAdherence', v)} />
          <ParameterSlider icon="😴" label="Sleep (hours/night)" value={params.sleepHours} min={3} max={11} unit="h" onChange={v => setParam('sleepHours', v)} />
          <ParameterSlider icon="😰" label="Stress level" value={params.stressLevel} min={0} max={10} unit="/10" onChange={v => setParam('stressLevel', v)} />
        </Card>

        <ImpactChart baseline={baseline} result={result} />

        <Button title="↺ Reset to defaults" variant="outline" fullWidth onPress={reset} />

        <Text style={styles.disclaimer}>
          ⚠️ Simulation only — actual results depend on many individual factors. Discuss
          lifestyle changes with your doctor.
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
  banner: {
    gap: 4,
  },
  bannerTitle: {
    ...Typography.h4,
    color: Colors.primary,
    fontWeight: '800',
  },
  bannerText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  section: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  sliderCard: {
    padding: Spacing.lg,
  },
  disclaimer: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: Spacing.xs,
  },
});
