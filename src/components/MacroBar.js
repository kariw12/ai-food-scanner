import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

const MACRO_COLORS = {
  protein: '#0A84FF',
  carbs: '#FFD60A',
  fat: '#FF9F0A',
};

export default function MacroBar({ label, consumed, goal, type }) {
  const progress = Math.min(consumed / goal, 1);
  const color = MACRO_COLORS[type] || COLORS.accent;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.values}>
          <Text style={[styles.consumed, { color }]}>{Math.round(consumed)}</Text>
          <Text style={styles.slash}> / {goal}g</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
  },
  values: {
    fontSize: FONTS.small,
  },
  consumed: {
    fontWeight: '600',
  },
  slash: {
    color: COLORS.textSecondary,
  },
  track: {
    height: 6,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
