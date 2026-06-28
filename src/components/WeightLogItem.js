import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';

export default function WeightLogItem({ entry }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Ionicons name="barbell-outline" size={24} color={COLORS.accent} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>Weight Log</Text>
        <Text style={styles.sub}>Body weight recorded</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.weight}>{entry.weight}</Text>
        <Text style={styles.unit}>{entry.unit || 'kg'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: COLORS.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: FONTS.body, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  sub: { fontSize: FONTS.tiny, color: COLORS.textSecondary },
  right: { alignItems: 'flex-end' },
  weight: { fontSize: FONTS.body, fontWeight: '700', color: COLORS.accent },
  unit: { fontSize: FONTS.tiny, color: COLORS.textSecondary },
});
