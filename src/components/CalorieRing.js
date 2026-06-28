import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, FONTS } from '../constants/theme';

export default function CalorieRing({ consumed, goal, size = 200 }) {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / goal, 1);
  const strokeDashoffset = circumference * (1 - progress);

  const remaining = Math.max(goal - consumed, 0);
  const overGoal = consumed > goal;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.cardBorder}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={overGoal ? COLORS.danger : COLORS.accent}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.consumedText}>{consumed}</Text>
        <Text style={styles.label}>kcal eaten</Text>
        <Text style={[styles.remainingText, overGoal && styles.overText]}>
          {overGoal ? `+${consumed - goal} over` : `${remaining} left`}
        </Text>
      </View>
    </View>
  );
}

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
  consumedText: {
    fontSize: FONTS.large,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  label: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  remainingText: {
    fontSize: FONTS.small,
    color: COLORS.accent,
    marginTop: 4,
    fontWeight: '600',
  },
  overText: {
    color: COLORS.danger,
  },
});
