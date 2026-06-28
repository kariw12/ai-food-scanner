import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getUserProfile, saveUserProfile, getBodyData, saveBodyData, resetOnboarding, saveWeightEntry, getTodayString } from '../storage/storageService';
import { calculateMacros } from '../services/aiService';
import { COLORS, FONTS } from '../constants/theme';

const GOALS = [
  { key: 'maintaining', label: 'Maintain' },
  { key: 'bulking', label: 'Bulk' },
  { key: 'cutting', label: 'Cut' },
];

const ACTIVITY_LEVELS = [
  { key: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { key: 'light', label: 'Lightly Active', desc: '1–2 days/week' },
  { key: 'moderate', label: 'Moderately Active', desc: '3–5 days/week' },
  { key: 'very', label: 'Very Active', desc: '6–7 days/week' },
];

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725,
};

function calculateMacrosLocally({ weightKg, heightCm, age, gender, goal, activity }) {
  const a = parseInt(age) || 25;
  const bmr = gender === 'male'
    ? 10 * weightKg + 6.25 * heightCm - 5 * a + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * a - 161;
  const multiplier = ACTIVITY_MULTIPLIERS[activity] || 1.55;
  const tdee = bmr * multiplier;
  const calories = Math.round(goal === 'bulking' ? tdee + 400 : goal === 'cutting' ? tdee - 400 : tdee);
  const proteinG = Math.round(goal === 'bulking' ? weightKg * 2.2 : goal === 'cutting' ? weightKg * 2.0 : weightKg * 1.6);
  const fatG = Math.round((calories * 0.25) / 9);
  const carbsG = Math.round((calories - proteinG * 4 - fatG * 9) / 4);
  return { dailyCalorieGoal: calories, dailyProteinGoal: proteinG, dailyCarbsGoal: Math.max(carbsG, 0), dailyFatGoal: fatG };
}

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState({
    dailyCalorieGoal: '2000',
    dailyProteinGoal: '150',
    dailyCarbsGoal: '250',
    dailyFatGoal: '65',
  });
  const [bodyData, setBodyData] = useState({
    weight: '', weightUnit: 'kg', heightCm: '', age: '', gender: null, goal: null, activity: null,
  });
  const [calculating, setCalculating] = useState(false);
  const [saved, setSaved] = useState(false);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function loadData() {
    const [p, body] = await Promise.all([getUserProfile(), getBodyData()]);
    setProfile({
      dailyCalorieGoal: String(p.dailyCalorieGoal),
      dailyProteinGoal: String(p.dailyProteinGoal),
      dailyCarbsGoal: String(p.dailyCarbsGoal),
      dailyFatGoal: String(p.dailyFatGoal),
    });
    if (body) {
      setBodyData({
        weight: String(body.weight || ''),
        weightUnit: body.weightUnit || 'kg',
        heightCm: String(Math.round(body.heightCm || 0)),
        age: String(body.age || ''),
        gender: body.gender || null,
        goal: body.goal || null,
        activity: body.activity || null,
      });
    }
  }

  async function handleRecalculate() {
    if (!bodyData.gender || !bodyData.goal || !bodyData.weight || !bodyData.heightCm) {
      Alert.alert('Missing Info', 'Please fill in weight, height, gender and goal.');
      return;
    }
    setCalculating(true);
    const weightKg = parseFloat(bodyData.weight);
    const params = {
      weightKg,
      heightCm: parseFloat(bodyData.heightCm),
      age: bodyData.age,
      gender: bodyData.gender,
      goal: bodyData.goal,
      activity: bodyData.activity,
    };

    try {
      const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
      let macros;
      if (apiKey) {
        macros = await calculateMacros(params);
      } else {
        macros = calculateMacrosLocally(params);
      }
      const parsedProfile = {
        dailyCalorieGoal: macros.dailyCalorieGoal,
        dailyProteinGoal: macros.dailyProteinGoal,
        dailyCarbsGoal: macros.dailyCarbsGoal,
        dailyFatGoal: macros.dailyFatGoal,
      };
      const parsedWeight = parseFloat(bodyData.weight) || 0;
      await Promise.all([
        saveUserProfile(parsedProfile),
        saveBodyData({
          weight: parsedWeight,
          weightUnit: 'kg',
          heightCm: parseFloat(bodyData.heightCm) || 0,
          age: parseInt(bodyData.age) || 25,
          gender: bodyData.gender,
          goal: bodyData.goal,
          activity: bodyData.activity,
        }),
        parsedWeight > 0 && saveWeightEntry({
          date: getTodayString(),
          weight: parsedWeight,
          unit: bodyData.weightUnit,
        }),
      ]);
      setProfile({
        dailyCalorieGoal: String(macros.dailyCalorieGoal),
        dailyProteinGoal: String(macros.dailyProteinGoal),
        dailyCarbsGoal: String(macros.dailyCarbsGoal),
        dailyFatGoal: String(macros.dailyFatGoal),
      });
      Alert.alert('Targets updated!', macros.summary || 'Your daily targets have been saved.');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setCalculating(false);
    }
  }

  async function handleResetOnboarding() {
    await resetOnboarding();
    navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
  }

  async function handleSave() {
    const parsedProfile = {
      dailyCalorieGoal: parseInt(profile.dailyCalorieGoal) || 2000,
      dailyProteinGoal: parseInt(profile.dailyProteinGoal) || 150,
      dailyCarbsGoal: parseInt(profile.dailyCarbsGoal) || 250,
      dailyFatGoal: parseInt(profile.dailyFatGoal) || 65,
    };
    const parsedBody = {
      weight: parseFloat(bodyData.weight) || 0,
      weightUnit: 'kg',
      heightCm: parseFloat(bodyData.heightCm) || 0,
      age: parseInt(bodyData.age) || 25,
      gender: bodyData.gender,
      goal: bodyData.goal,
      activity: bodyData.activity,
    };
    await Promise.all([saveUserProfile(parsedProfile), saveBodyData(parsedBody)]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Profile</Text>

          {/* Body & Goal */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Body & Goal</Text>

            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.row}>
              {['male', 'female'].map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.toggleBtn, bodyData.gender === g && styles.toggleBtnActive]}
                  onPress={() => setBodyData(b => ({ ...b, gender: g }))}
                >
                  <Text style={[styles.toggleText, bodyData.gender === g && styles.toggleTextActive]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Age</Text>
            <TextInput
              style={styles.input}
              value={bodyData.age}
              onChangeText={v => setBodyData(b => ({ ...b, age: v }))}
              keyboardType="number-pad"
              placeholder="25"
              placeholderTextColor={COLORS.textTertiary}
            />

            <Text style={styles.fieldLabel}>Weight (kg)</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1, minWidth: 0 }]}
                value={bodyData.weight}
                onChangeText={v => setBodyData(b => ({ ...b, weight: v }))}
                keyboardType="decimal-pad"
                placeholder="75"
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>

            <Text style={styles.fieldLabel}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              value={bodyData.heightCm}
              onChangeText={v => setBodyData(b => ({ ...b, heightCm: v }))}
              keyboardType="decimal-pad"
              placeholder="175"
              placeholderTextColor={COLORS.textTertiary}
            />

            <Text style={styles.fieldLabel}>Goal</Text>
            <View style={styles.goalRow}>
              {GOALS.map(g => (
                <TouchableOpacity
                  key={g.key}
                  style={[styles.goalBtn, bodyData.goal === g.key && styles.goalBtnActive]}
                  onPress={() => setBodyData(b => ({ ...b, goal: g.key }))}
                >
                  <Text style={[styles.goalText, bodyData.goal === g.key && styles.goalTextActive]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Activity Level</Text>
            <View style={styles.activityGrid}>
              {ACTIVITY_LEVELS.map(a => (
                <TouchableOpacity
                  key={a.key}
                  style={[styles.activityCard, bodyData.activity === a.key && styles.activityCardActive]}
                  onPress={() => setBodyData(b => ({ ...b, activity: a.key }))}
                >
                  <Text style={[styles.activityLabel, bodyData.activity === a.key && styles.activityLabelActive]}>{a.label}</Text>
                  <Text style={styles.activityDesc}>{a.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.recalcBtn, calculating && styles.btnDisabled]}
              onPress={handleRecalculate}
              disabled={calculating}
            >
              {calculating
                ? <ActivityIndicator color="#000" />
                : <Text style={styles.recalcText}>Recalculate Targets</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Daily Goals */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Targets</Text>
            <Text style={styles.hint}>Recalculate above or edit manually</Text>
            <GoalInput label="Calories" unit="kcal" value={profile.dailyCalorieGoal}
              onChange={v => setProfile(p => ({ ...p, dailyCalorieGoal: v }))} />
            <GoalInput label="Protein" unit="g" value={profile.dailyProteinGoal}
              onChange={v => setProfile(p => ({ ...p, dailyProteinGoal: v }))} />
            <GoalInput label="Carbs" unit="g" value={profile.dailyCarbsGoal}
              onChange={v => setProfile(p => ({ ...p, dailyCarbsGoal: v }))} />
            <GoalInput label="Fat" unit="g" value={profile.dailyFatGoal}
              onChange={v => setProfile(p => ({ ...p, dailyFatGoal: v }))} />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saved && styles.saveBtnSuccess]}
            onPress={handleSave}
          >
            <Text style={styles.saveBtnText}>{saved ? 'Saved!' : 'Save Settings'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetBtn} onPress={handleResetOnboarding}>
            <Text style={styles.resetBtnText}>Restart Onboarding (test)</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function GoalInput({ label, unit, value, onChange }) {
  return (
    <View style={styles.goalInputRow}>
      <Text style={styles.goalInputLabel}>{label}</Text>
      <View style={styles.goalInputRight}>
        <TextInput
          style={styles.goalInput}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholderTextColor={COLORS.textTertiary}
        />
        <Text style={styles.goalUnit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: FONTS.large, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 24 },
  section: { backgroundColor: COLORS.card, borderRadius: 20, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: FONTS.body, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  hint: { fontSize: FONTS.small, color: COLORS.textSecondary, marginBottom: 12 },
  fieldLabel: { fontSize: FONTS.small, color: COLORS.textSecondary, marginTop: 12, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    padding: 12,
    color: COLORS.textPrimary,
    fontSize: FONTS.body,
  },
  row: { flexDirection: 'row', gap: 10 },
  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  unitLabel: { fontSize: FONTS.body, color: COLORS.textSecondary, fontWeight: '600', marginLeft: 8, width: 28 },
  activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  activityCard: {
    flexBasis: '47%', flexGrow: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  activityCardActive: { borderColor: COLORS.accent, borderWidth: 2 },
  activityLabel: { fontSize: FONTS.small, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  activityLabelActive: { color: COLORS.accent },
  activityDesc: { fontSize: FONTS.tiny, color: COLORS.textSecondary },
  toggleBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1,
    borderColor: COLORS.cardBorder, alignItems: 'center', backgroundColor: COLORS.inputBg,
  },
  toggleBtnActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  toggleText: { fontSize: FONTS.small, fontWeight: '600', color: COLORS.textSecondary },
  toggleTextActive: { color: '#000' },
  goalRow: { flexDirection: 'row', gap: 8 },
  goalBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
    borderColor: COLORS.cardBorder, alignItems: 'center', backgroundColor: COLORS.inputBg,
  },
  goalBtnActive: { borderColor: COLORS.accent, borderWidth: 2 },
  goalText: { fontSize: FONTS.small, fontWeight: '600', color: COLORS.textSecondary },
  goalTextActive: { color: COLORS.accent, fontWeight: '700' },
  recalcBtn: {
    marginTop: 16, backgroundColor: COLORS.accent,
    borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  recalcText: { color: '#000', fontWeight: '700', fontSize: FONTS.body },
  btnDisabled: { opacity: 0.4 },
  goalInputRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder,
  },
  goalInputLabel: { fontSize: FONTS.body, color: COLORS.textPrimary },
  goalInputRight: { flexDirection: 'row', alignItems: 'center' },
  goalInput: {
    backgroundColor: COLORS.inputBg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    color: COLORS.textPrimary, fontSize: FONTS.body, minWidth: 70, textAlign: 'right',
  },
  goalUnit: { fontSize: FONTS.small, color: COLORS.textSecondary, marginLeft: 6, width: 28 },
  saveBtn: { backgroundColor: COLORS.accent, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnSuccess: { backgroundColor: COLORS.accentDim },
  saveBtnText: { fontSize: FONTS.body, fontWeight: '700', color: '#000' },
  resetBtn: { alignItems: 'center', paddingVertical: 20 },
  resetBtnText: { fontSize: FONTS.small, color: COLORS.textTertiary },
});
