import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Modal, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import CalorieRing from '../components/CalorieRing';
import MacroBar from '../components/MacroBar';
import MealItem from '../components/MealItem';
import WeekCalendar from '../components/WeekCalendar';
import WeightGraph from '../components/WeightGraph';
import WeightLogItem from '../components/WeightLogItem';
import { useDate } from '../context/DateContext';
import {
  getLogsForDate, getTodayString, getUserProfile, deleteFoodEntry,
  getBodyData, saveBodyData, getWeightLogs, saveWeightEntry,
} from '../storage/storageService';
import { COLORS, FONTS } from '../constants/theme';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { selectedDate, setSelectedDate } = useDate();
  const [weekOffset, setWeekOffset] = useState(0);
  const [logs, setLogs] = useState([]);
  const [profile, setProfile] = useState({ dailyCalorieGoal: 2000, dailyProteinGoal: 150, dailyCarbsGoal: 250, dailyFatGoal: 65 });
  const [weightLogs, setWeightLogs] = useState([]);
  const [bodyData, setBodyData] = useState(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedDate])
  );

  async function loadData() {
    const [todayLogs, userProfile, wLogs, bData] = await Promise.all([
      getLogsForDate(selectedDate),
      getUserProfile(),
      getWeightLogs(),
      getBodyData(),
    ]);
    setLogs(todayLogs);
    setProfile(userProfile);
    setWeightLogs(wLogs);
    setBodyData(bData);
  }

  async function handleDelete(id) {
    await deleteFoodEntry(id);
    loadData();
  }

  async function handleLogWeight() {
    const w = parseFloat(weightInput);
    if (!w || w <= 0) return;
    const unit = bodyData?.weightUnit || 'kg';
    await saveWeightEntry({ date: selectedDate, weight: w, unit });
    // Update body data weight to the most recent log
    const updatedLogs = await getWeightLogs();
    if (updatedLogs.length > 0 && bodyData) {
      const mostRecent = updatedLogs[updatedLogs.length - 1];
      await saveBodyData({ ...bodyData, weight: mostRecent.weight });
    }
    setWeightInput('');
    setShowWeightModal(false);
    loadData();
  }

  const totals = logs.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein: acc.protein + (e.protein || 0),
      carbs: acc.carbs + (e.carbs || 0),
      fat: acc.fat + (e.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const today = getTodayString();
  const isToday = selectedDate === today;
  const dateLabel = isToday
    ? 'Today'
    : (() => {
        const d = new Date(selectedDate + 'T00:00:00');
        const yesterday = new Date(today + 'T00:00:00');
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      })();

  const selectedDateLog = weightLogs.find(l => l.date === selectedDate);
  const weightUnit = bodyData?.weightUnit || 'kg';

  function weightBtnLabel() {
    if (selectedDateLog) return isToday ? 'Edit Today' : `Edit ${dateLabel}`;
    return isToday ? '+ Log Today' : `+ Log ${dateLabel}`;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{dateLabel}</Text>

        <WeekCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          weekOffset={weekOffset}
          onChangeWeek={offset => offset <= 0 && setWeekOffset(offset)}
        />

        {/* Weight card */}
        <View style={styles.weightCard}>
          <View style={styles.weightHeader}>
            <Text style={styles.sectionTitle}>Weight</Text>
            <TouchableOpacity style={styles.logWeightBtn} onPress={() => {
              setWeightInput(selectedDateLog ? String(selectedDateLog.weight) : '');
              setShowWeightModal(true);
            }}>
              <Text style={styles.logWeightBtnText}>{weightBtnLabel()}</Text>
            </TouchableOpacity>
          </View>

          {weightLogs.length === 0 ? (
            <Text style={styles.weightEmpty}>Log your weight daily to track progress</Text>
          ) : (
            <WeightGraph data={weightLogs} />
          )}
        </View>

        <View style={styles.ringCard}>
          <CalorieRing consumed={Math.round(totals.calories)} goal={profile.dailyCalorieGoal} size={200} />
          <View style={styles.goalRow}>
            <Text style={styles.goalText}>Goal: {profile.dailyCalorieGoal} kcal</Text>
          </View>
        </View>

        <View style={styles.macroCard}>
          <MacroBar label="Protein" consumed={totals.protein} goal={profile.dailyProteinGoal} type="protein" />
          <MacroBar label="Carbs" consumed={totals.carbs} goal={profile.dailyCarbsGoal} type="carbs" />
          <MacroBar label="Fat" consumed={totals.fat} goal={profile.dailyFatGoal} type="fat" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Logs</Text>
          <Text style={styles.mealCount}>{logs.length + (selectedDateLog ? 1 : 0)} logged</Text>
        </View>

        {selectedDateLog && (
          <WeightLogItem entry={selectedDateLog} />
        )}

        {logs.length === 0 && !selectedDateLog ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No logs yet</Text>
            <Text style={styles.emptyHint}>
              {isToday ? 'Tap Scan to analyze your food' : 'Nothing was logged on this day'}
            </Text>
          </View>
        ) : (
          logs.map(entry => (
            <MealItem key={entry.id} entry={entry} onDelete={handleDelete} onPress={() => navigation.navigate('FoodDetail', { entry })} />
          ))
        )}
      </ScrollView>

      <Modal visible={showWeightModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log Weight</Text>
            <Text style={styles.modalDate}>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>

            <View style={styles.modalInputRow}>
              <TextInput
                style={styles.modalInput}
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="decimal-pad"
                placeholder="75.0"
                placeholderTextColor={COLORS.textTertiary}
                autoFocus
                selectTextOnFocus
              />
              <Text style={styles.modalUnit}>{weightUnit}</Text>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowWeightModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleLogWeight}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: FONTS.large, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  ringCard: { backgroundColor: COLORS.card, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16 },
  goalRow: { marginTop: 16 },
  goalText: { fontSize: FONTS.small, color: COLORS.textSecondary },
  macroCard: { backgroundColor: COLORS.card, borderRadius: 20, padding: 16, marginBottom: 16 },
  weightCard: { backgroundColor: COLORS.card, borderRadius: 20, padding: 16, marginBottom: 24 },
  weightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  logWeightBtn: {
    backgroundColor: COLORS.accentDim,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logWeightBtnText: { fontSize: FONTS.small, fontWeight: '600', color: COLORS.accent },
  weightEmpty: { fontSize: FONTS.small, color: COLORS.textTertiary, paddingVertical: 16, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: FONTS.title, fontWeight: '600', color: COLORS.textPrimary },
  mealCount: { fontSize: FONTS.small, color: COLORS.textSecondary },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: FONTS.body, color: COLORS.textSecondary, fontWeight: '500' },
  emptyHint: { fontSize: FONTS.small, color: COLORS.textTertiary, marginTop: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: COLORS.card, borderRadius: 24, padding: 24, width: '85%', maxWidth: 340 },
  modalTitle: { fontSize: FONTS.title, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  modalDate: { fontSize: FONTS.small, color: COLORS.textSecondary, marginBottom: 20 },
  modalInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20 },
  modalInput: { flex: 1, minWidth: 0, fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, padding: 0, outlineWidth: 0 },
  modalUnit: { fontSize: FONTS.body, color: COLORS.textSecondary, marginLeft: 8 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  cancelBtnText: { fontSize: FONTS.body, fontWeight: '600', color: COLORS.textSecondary },
  saveBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: COLORS.accent },
  saveBtnText: { fontSize: FONTS.body, fontWeight: '700', color: '#000' },
});
