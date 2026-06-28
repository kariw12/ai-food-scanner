import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Defs, LinearGradient, Stop, Path, Line, Text as SvgText, G } from 'react-native-svg';
import { COLORS, FONTS } from '../constants/theme';

const H = 130;
const PAD = { top: 10, bottom: 24, left: 44, right: 8 };

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

export default function WeightGraph({ data }) {
  const [width, setWidth] = useState(0);

  const entries = (data || []).slice(-30);
  if (entries.length < 2) return null;

  const weights = entries.map(e => e.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  const innerW = Math.max(width - PAD.left - PAD.right, 1);
  const innerH = H - PAD.top - PAD.bottom;

  const toX = i => PAD.left + (i / (entries.length - 1)) * innerW;
  const toY = w => PAD.top + (1 - (w - minW) / range) * innerH;

  const pts = width > 0
    ? entries.map((e, i) => `${toX(i)},${toY(e.weight)}`).join(' ')
    : '';

  const fillPath = width > 0
    ? `M ${toX(0)},${toY(entries[0].weight)} ` +
      entries.slice(1).map((e, i) => `L ${toX(i + 1)},${toY(e.weight)}`).join(' ') +
      ` L ${toX(entries.length - 1)},${PAD.top + innerH} L ${toX(0)},${PAD.top + innerH} Z`
    : '';

  const yTicks = [
    { value: maxW, y: toY(maxW) },
    { value: round1((maxW + minW) / 2), y: toY((maxW + minW) / 2) },
    { value: minW, y: toY(minW) },
  ];

  const latest = entries[entries.length - 1];
  const prev = entries[entries.length - 2];
  const diff = round1(latest.weight - prev.weight);
  const trendColor = diff < 0 ? COLORS.accent : diff > 0 ? COLORS.danger : COLORS.textSecondary;
  const trendLabel = diff === 0 ? '—' : `${diff > 0 ? '+' : ''}${diff}`;

  return (
    <View>
      <View style={styles.topRow}>
        <View style={styles.latestWeight}>
          <Text style={styles.latestNum}>{latest.weight}</Text>
          <Text style={styles.latestUnit}>{latest.unit}</Text>
        </View>
        <Text style={[styles.trend, { color: trendColor }]}>{trendLabel} {latest.unit}</Text>
      </View>

      <View onLayout={e => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={H}>
            <Defs>
              <LinearGradient id="wfill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={COLORS.accent} stopOpacity="0.2" />
                <Stop offset="1" stopColor={COLORS.accent} stopOpacity="0" />
              </LinearGradient>
            </Defs>

            {/* Y-axis grid lines and labels */}
            {yTicks.map(({ value, y }) => (
              <G key={value}>
                <Line
                  x1={PAD.left}
                  y1={y}
                  x2={width - PAD.right}
                  y2={y}
                  stroke={COLORS.cardBorder}
                  strokeWidth={1}
                  strokeDasharray="3,4"
                />
                <SvgText
                  x={PAD.left - 6}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill={COLORS.textTertiary}
                >
                  {value}
                </SvgText>
              </G>
            ))}

            <Path d={fillPath} fill="url(#wfill)" />
            <Polyline
              points={pts}
              fill="none"
              stroke={COLORS.accent}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {entries.map((e, i) => {
              const isLast = i === entries.length - 1;
              return (
                <Circle
                  key={e.date}
                  cx={toX(i)}
                  cy={toY(e.weight)}
                  r={isLast ? 4.5 : 2.5}
                  fill={isLast ? COLORS.accent : COLORS.accentDim}
                />
              );
            })}
          </Svg>
        )}
      </View>

      <View style={[styles.xLabels, { paddingLeft: PAD.left }]}>
        <Text style={styles.xLabel}>{fmtDate(entries[0].date)}</Text>
        <Text style={styles.xLabel}>{fmtDate(latest.date)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 },
  latestWeight: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  latestNum: { fontSize: 36, fontWeight: '700', color: COLORS.textPrimary },
  latestUnit: { fontSize: FONTS.body, color: COLORS.textSecondary },
  trend: { fontSize: FONTS.small, fontWeight: '600', marginBottom: 4 },
  xLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  xLabel: { fontSize: FONTS.tiny, color: COLORS.textTertiary },
});
