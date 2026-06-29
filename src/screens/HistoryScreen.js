import { useState, useCallback } from 'react';
import { View, Text, SectionList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import MealItem from '../components/MealItem';
import WeightLogItem from '../components/WeightLogItem';
import { getAllFoodLogs, getWeightLogs, deleteFoodEntry, getTodayString } from '../storage/storageService';
import { COLORS, FONTS } from '../constants/theme';

function formatDateLabel(dateStr) {
  const today = getTodayString();
  if (dateStr === today) return 'Today';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function groupByDate(foodLogs, weightLogs) {
  const map = {};

  for (const entry of foodLogs) {
    if (!map[entry.date]) map[entry.date] = [];
    map[entry.date].push({ ...entry, _type: 'food' });
  }

  for (const entry of weightLogs) {
    if (!map[entry.date]) map[entry.date] = [];
    map[entry.date].push({ ...entry, _type: 'weight', id: `weight-${entry.date}` });
  }

  return Object.keys(map)
    .sort((a, b) => b.localeCompare(a))
    .map(date => {
      const items = map[date];
      const kcal = items.filter(e => e._type === 'food').reduce((s, e) => s + (e.calories || 0), 0);
      return { date, title: formatDateLabel(date), data: items, total: kcal };
    });
}

export default function HistoryScreen() {
  const navigation = useNavigation();
  const [sections, setSections] = useState([]);

  useFocusEffect(useCallback(() => { loadLogs(); }, []));

  async function loadLogs() {
    const [food, weight] = await Promise.all([getAllFoodLogs(), getWeightLogs()]);
    setSections(groupByDate(food, weight));
  }

  async function handleDelete(id) {
    await deleteFoodEntry(id);
    loadLogs();
  }

  if (sections.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No history yet</Text>
          <Text style={styles.emptyHint}>Start logging meals or weight to see your history</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.total > 0 && (
              <Text style={styles.sectionTotal}>{Math.round(section.total)} kcal</Text>
            )}
          </View>
        )}
        renderItem={({ item }) =>
          item._type === 'weight'
            ? <WeightLogItem entry={item} />
            : <MealItem entry={item} onDelete={handleDelete} onPress={() => navigation.navigate('FoodDetail', { entry: item })} />
        }
        ListHeaderComponent={<Text style={styles.pageTitle}>History</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16, paddingBottom: 32 },
  pageTitle: { fontSize: FONTS.large, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 16, marginBottom: 8,
  },
  sectionTitle: { fontSize: FONTS.body, fontWeight: '600', color: COLORS.textSecondary },
  sectionTotal: { fontSize: FONTS.small, color: COLORS.accent, fontWeight: '600' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: FONTS.body, color: COLORS.textSecondary, fontWeight: '500' },
  emptyHint: { fontSize: FONTS.small, color: COLORS.textTertiary, marginTop: 4 },
});
