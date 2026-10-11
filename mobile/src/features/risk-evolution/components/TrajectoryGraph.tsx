/**
 * TrajectoryGraph — lightweight SVG trajectory renderer (median line +
 * 5-95% band) with no chart-kit dependency.
 */
import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg';

import { Colors } from '../../../shared/theme';
import type { TrajectoryData } from '../types';

const { width: SCREEN_W } = Dimensions.get('window');
const WIDTH = SCREEN_W - 96;
const HEIGHT = 170;
const PAD = 18;

interface TrajectoryGraphProps {
  data: TrajectoryData;
  color: string;
}

export const TrajectoryGraph: React.FC<TrajectoryGraphProps> = ({ data, color }) => {
  const { bandPath, medianPath, points } = useMemo(() => {
    const n = data.months.length;
    const x = (i: number) => PAD + (i / Math.max(1, n - 1)) * (WIDTH - PAD * 2);
    const y = (v: number) => HEIGHT - PAD - (v / 100) * (HEIGHT - PAD * 2);

    const toLine = (arr: number[]) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const upper = data.p95.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const lower = [...data.p5].reverse().map((v, i) => `L${x(n - 1 - i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const band = `${upper} ${lower} Z`;

    return {
      bandPath: band,
      medianPath: toLine(data.median),
      points: data.median.map((v, i) => ({ cx: x(i), cy: y(v) })),
    };
  }, [data]);

  return (
    <View style={styles.wrap}>
      <Svg width={WIDTH} height={HEIGHT}>
        {/* gridlines at 0/25/50/75/100 */}
        {[0, 25, 50, 75, 100].map((g) => {
          const y = HEIGHT - PAD - (g / 100) * (HEIGHT - PAD * 2);
          return (
            <Line key={g} x1={PAD} x2={WIDTH - PAD} y1={y} y2={y} stroke={Colors.surfaceBorder} strokeWidth={0.6} />
          );
        })}
        <Path d={bandPath} fill={color} opacity={0.12} />
        <Path d={medianPath} fill="none" stroke={color} strokeWidth={3} />
        {points.map((p, i) => (
          <Path key={i} d={`M${p.cx},${p.cy} m-3,0 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0`} fill={color} />
        ))}
        {data.months.map((m, i) =>
          m % Math.ceil(data.months.length / 6) === 0 ? (
            <SvgText
              key={m}
              x={PAD + (i / Math.max(1, data.months.length - 1)) * (WIDTH - PAD * 2)}
              y={HEIGHT - 4}
              fontSize={9}
              fill={Colors.textTertiary}
              textAnchor="middle"
            >
              {m === 0 ? 'Now' : `M${m}`}
            </SvgText>
          ) : null,
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
});
