/**
 * RiskGauge — animated circular gauge displaying a 0-100 score.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Colors, Typography } from '../../../shared/theme';
import { riskLevelColor } from '../../../shared/utils/healthUtils';
import type { RiskLevel } from '../../../shared/types/health';

interface RiskGaugeProps {
  /** 0-100. */
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  riskLevel?: RiskLevel;
  showPercentage?: boolean;
  animate?: boolean;
  /** Override the automatic color. */
  color?: string;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  size = 120,
  strokeWidth = 10,
  label,
  riskLevel,
  showPercentage = true,
  animate = true,
  color,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const normalizedScore = Math.max(0, Math.min(100, score));
  const percentage = Math.round(normalizedScore);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gaugeColor = color || (riskLevel ? riskLevelColor(riskLevel) : Colors.primary);

  useEffect(() => {
    if (animate) {
      Animated.timing(animatedValue, {
        toValue: normalizedScore / 100,
        duration: 1200,
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(normalizedScore / 100);
    }
  }, [normalizedScore, animate]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={Colors.surfaceBorder} strokeWidth={strokeWidth} fill="transparent" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        {showPercentage && (
          <Text style={[styles.score, { color: gaugeColor }]}>{percentage}</Text>
        )}
        {label ? (
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    ...Typography.metricSmall,
    fontSize: 28,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
