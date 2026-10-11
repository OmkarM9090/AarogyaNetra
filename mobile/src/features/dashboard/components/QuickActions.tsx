/**
 * QuickActions — grid of feature shortcuts.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Spacing, Typography } from '../../../shared/theme';

interface QuickActionsProps {
  onScan: () => void;
  onHistory: () => void;
  onRiskForecast: () => void;
  onSimulation: () => void;
  scanCount: number;
}

const QuickCard: React.FC<{
  icon: string;
  label: string;
  desc: string;
  color: string;
  onPress: () => void;
}> = ({ icon, label, desc, color, onPress }) => {
  return (
    <View style={[styles.card, { borderColor: Colors.surfaceBorder }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.desc}>{desc}</Text>
      </TouchableOpacity>
    </View>
  );
};

export const QuickActions: React.FC<QuickActionsProps> = ({ onScan, onHistory, onRiskForecast, onSimulation, scanCount }) => (
  <View style={styles.grid}>
    <QuickCard
      icon="🩺"
      label="New health scan"
      desc="Diabetes · HTN · Anemia screening"
      color={Colors.primary}
      onPress={onScan}
    />
    <QuickCard
      icon="📊"
      label="Scan history"
      desc={`${scanCount} past scan${scanCount === 1 ? '' : 's'}`}
      color={Colors.secondary}
      onPress={onHistory}
    />
    <QuickCard
      icon="📈"
      label="Risk forecast"
      desc="6 / 12 month trajectories"
      color={Colors.warning}
      onPress={onRiskForecast}
    />
    <QuickCard
      icon="🧪"
      label="What-If simulation"
      desc="See how lifestyle changes help"
      color={Colors.anemia}
      onPress={onSimulation}
    />
  </View>
);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    borderRadius: 18,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    gap: 3,
  },
  icon: {
    fontSize: 26,
    marginBottom: 6,
  },
  label: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  desc: {
    ...Typography.caption,
    color: Colors.textTertiary,
    lineHeight: 16,
  },
});
