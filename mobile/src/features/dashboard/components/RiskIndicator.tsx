/**
 * RiskIndicator — one animated risk bar for a condition.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Colors, Typography } from '../../../shared/theme';
import { riskLevelColor, riskLevelLabel } from '../../../shared/utils/healthUtils';
import type { RiskSummaryEntry } from '../../../shared/types/health';

interface RiskIndicatorProps {
  entry: RiskSummaryEntry;
  icon: string;
  color: string;
}

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({ entry, icon, color }) => {
  const animWidth = useRef(new Animated.Value(0)).current;
  const pct = Math.round(entry.riskScore);

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: pct,
      duration: 900,
      useNativeDriver: false,
      delay: 250,
    }).start();
  }, [pct]);

  return (
    <View style={styles.row}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{entry.condition.charAt(0).toUpperCase() + entry.condition.slice(1)}</Text>
          <Text style={[styles.level, { color: riskLevelColor(entry.riskLevel) }]}>
            {riskLevelLabel(entry.riskLevel)} · {pct}%
          </Text>
        </View>
        <View style={styles.track}>
          <Animated.View
            style={[
              styles.fill,
              {
                backgroundColor: color,
                width: animWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        {entry.lastPredictedAt ? (
          <Text style={styles.when}>
            Last screened {new Date(entry.lastPredictedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  icon: {
    fontSize: 18,
    width: 24,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  level: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  track: {
    height: 7,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: 7,
    borderRadius: 4,
  },
  when: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 3,
  },
});
