import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../constants/theme';

function MacroBox({ label, value, unit, color }) {
  return (
    <View style={styles.macroBox}>
      <Text style={[styles.macroValue, { color }]}>{value}<Text style={styles.macroUnit}>{unit}</Text></Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

export default function FoodDetailScreen({ route, navigation }) {
  const { entry } = route.params;

  const date = new Date(entry.date + 'T00:00:00');
  const dateLabel = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meal Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {entry.imageUri ? (
          <Image source={{ uri: entry.imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderEmoji}>🍽️</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.foodName}>{entry.foodName}</Text>
          {entry.servingSize ? (
            <Text style={styles.serving}>{entry.servingSize}</Text>
          ) : null}
          <Text style={styles.date}>{dateLabel}</Text>
        </View>

        <View style={styles.calorieCard}>
          <Text style={styles.calorieNum}>{entry.calories}</Text>
          <Text style={styles.calorieLabel}>kcal</Text>
        </View>

        <View style={styles.macroRow}>
          <MacroBox label="Protein" value={entry.protein} unit="g" color="#0A84FF" />
          <MacroBox label="Carbs" value={entry.carbs} unit="g" color="#FFD60A" />
          <MacroBox label="Fat" value={entry.fat} unit="g" color="#FF9F0A" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 60 },
  backText: { fontSize: FONTS.body, color: COLORS.accent, fontWeight: '600' },
  headerTitle: { fontSize: FONTS.body, fontWeight: '700', color: COLORS.textPrimary },
  content: { padding: 16, paddingBottom: 40 },
  image: {
    width: '100%',
    height: 280,
    borderRadius: 20,
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: '100%',
    height: 280,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  placeholderEmoji: { fontSize: 64 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  foodName: { fontSize: FONTS.large, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  serving: { fontSize: FONTS.small, color: COLORS.textSecondary, marginBottom: 4 },
  date: { fontSize: FONTS.small, color: COLORS.textTertiary },
  calorieCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  calorieNum: { fontSize: 52, fontWeight: '800', color: COLORS.accent, lineHeight: 56 },
  calorieLabel: { fontSize: FONTS.body, color: COLORS.textSecondary, fontWeight: '600' },
  macroRow: { flexDirection: 'row', gap: 10 },
  macroBox: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  macroValue: { fontSize: FONTS.title, fontWeight: '700', marginBottom: 4 },
  macroUnit: { fontSize: FONTS.small, fontWeight: '400' },
  macroLabel: { fontSize: FONTS.tiny, color: COLORS.textSecondary },
});
