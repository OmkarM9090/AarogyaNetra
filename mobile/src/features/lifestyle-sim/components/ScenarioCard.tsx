/**
 * ScenarioCard — one-click preset scenarios ("lose 5 kg", "smoke-free
 * year", …) that apply a lifestyle parameter bundle.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '../../../shared/theme';
import type { LifestyleParams } from '../services/whatIfEngine';

export interface Scenario {
  id: string;
  title: string;
  icon: string;
  desc: string;
  patch: Partial<LifestyleParams>;
}

export const PRESET_SCENARIOS: Scenario[] = [
  {
    id: 'exercise',
    title: 'Walk 30 min daily',
    icon: '🚶',
    desc: '+120 min/week brisk walking',
    patch: { exerciseMins: 150 },
  },
  {
    id: 'sugar',
    title: 'Cut added sugar',
    icon: '🍬',
    desc: '−40 g sugar per day',
    patch: { sugarGrams: 10 },
  },
  {
    id: 'salt',
    title: 'Lower salt intake',
    icon: '🧂',
    desc: 'Under 5 g salt per day',
    patch: { sodiumGrams: 3 },
  },
  {
    id: 'iron',
    title: 'Iron-rich meals',
    icon: '🥬',
    desc: '6+ iron-rich servings/week',
    patch: { ironServings: 6 },
  },
  {
    id: 'stress',
    title: 'Stress management',
    icon: '🧘',
    desc: 'Yoga / meditation routine',
    patch: { stressLevel: 2 },
  },
];

interface ScenarioCardProps {
  scenario: Scenario;
  onApply: (patch: Partial<LifestyleParams>) => void;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, onApply }) => (
  <Pressable
    style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    onPress={() => onApply(scenario.patch)}
  >
    <Text style={styles.icon}>{scenario.icon}</Text>
    <View style={{ flex: 1 }}>
      <Text style={styles.title}>{scenario.title}</Text>
      <Text style={styles.desc}>{scenario.desc}</Text>
    </View>
    <Text style={styles.apply}>Apply →</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    ...Typography.bodySmall,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  desc: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  apply: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '800',
  },
});
