import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../constants/theme';
import { calculateMacros } from '../services/aiService';
import { saveBodyData, saveUserProfile, setOnboardingComplete } from '../storage/storageService';

const GOALS = [
  { key: 'maintaining', label: 'Maintain', desc: 'Keep your current weight' },
  { key: 'bulking', label: 'Bulk', desc: 'Build muscle and gain weight' },
  { key: 'cutting', label: 'Cut', desc: 'Lose fat and lean down' },
];

const ACTIVITY_LEVELS = [
  { key: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { key: 'light', label: 'Lightly Active', desc: '1–2 days/week' },
  { key: 'moderate', label: 'Moderately Active', desc: '3–5 days/week' },
  { key: 'very', label: 'Very Active', desc: '6–7 days/week' },
];

export default function OnboardingScreen({ navigation }) {
  const [step, setStep] = useState(0);

  const [gender, setGender] = useState(null);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [activity, setActivity] = useState(null);

  const [goal, setGoal] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calcError, setCalcError] = useState(null);

  function canAdvanceStep0() {
    return !!(gender && weight && age && heightCm && activity);
  }

  async function handleCalculate() {
    if (!goal) return;
    setLoading(true);
    setCalcError(null);
    try {
      const macros = await calculateMacros({
        weightKg: parseFloat(weight),
        heightCm: parseFloat(heightCm),
        age,
        gender,
        goal,
        activity,
      });
      setResult(macros);
    } catch (e) {
      console.error('calculateMacros error:', e);
      setCalcError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleFinish() {
    await Promise.all([
      saveBodyData({
        weight: parseFloat(weight),
        weightUnit: 'kg',
        heightCm: parseFloat(heightCm),
        age: parseInt(age) || 25,
        gender,
        goal,
        activity,
      }),
      saveUserProfile({
        dailyCalorieGoal: result.dailyCalorieGoal,
        dailyProteinGoal: result.dailyProteinGoal,
        dailyCarbsGoal: result.dailyCarbsGoal,
        dailyFatGoal: result.dailyFatGoal,
      }),
      setOnboardingComplete(),
    ]);
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          <View style={styles.progress}>
            {[0, 1].map(i => (
              <View key={i} style={[styles.dot, step >= i && styles.dotActive]} />
            ))}
          </View>

          {/* STEP 0: Body info */}
          {step === 0 && (
            <View>
              <Text style={styles.title}>Your Body</Text>
              <Text style={styles.subtitle}>This helps calculate your personalised targets</Text>

              <Text style={styles.label}>Gender</Text>
              <View style={styles.row}>
                {['male', 'female'].map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.toggleBtn, gender === g && styles.toggleBtnActive]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.toggleText, gender === g && styles.toggleTextActive]}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                placeholder="25"
                placeholderTextColor={COLORS.textTertiary}
              />

              <Text style={styles.label}>Weight (kg)</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { flex: 1, minWidth: 0 }]}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                  placeholder="75"
                  placeholderTextColor={COLORS.textTertiary}
                />
              </View>

              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="decimal-pad"
                placeholder="175"
                placeholderTextColor={COLORS.textTertiary}
              />

              <Text style={styles.label}>Activity Level</Text>
              <View style={styles.activityGrid}>
                {ACTIVITY_LEVELS.map(a => (
                  <TouchableOpacity
                    key={a.key}
                    style={[styles.activityCard, activity === a.key && styles.activityCardActive]}
                    onPress={() => setActivity(a.key)}
                  >
                    <Text style={[styles.activityLabel, activity === a.key && styles.activityLabelActive]}>{a.label}</Text>
                    <Text style={styles.activityDesc}>{a.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.nextBtn, { marginTop: 32 }, !canAdvanceStep0() && styles.btnDisabled]}
                onPress={() => setStep(1)}
                disabled={!canAdvanceStep0()}
              >
                <Text style={styles.nextBtnText}>Next</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 1: Goal + calculate */}
          {step === 1 && (
            <View>
              <Text style={styles.title}>Your Goal</Text>
              <Text style={styles.subtitle}>What are you working towards?</Text>

              {GOALS.map(g => (
                <TouchableOpacity
                  key={g.key}
                  style={[styles.goalCard, goal === g.key && styles.goalCardActive]}
                  onPress={() => { setGoal(g.key); setResult(null); }}
                >
                  <Text style={[styles.goalLabel, goal === g.key && styles.goalLabelActive]}>{g.label}</Text>
                  <Text style={styles.goalDesc}>{g.desc}</Text>
                </TouchableOpacity>
              ))}

              {!result && (
                <View>
                  <View style={styles.row}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => setStep(0)} disabled={loading}>
                      <Text style={styles.backBtnText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.nextBtn, { flex: 1 }, (!goal || loading) && styles.btnDisabled]}
                      onPress={handleCalculate}
                      disabled={!goal || loading}
                    >
                      {loading
                        ? <ActivityIndicator color="#000" />
                        : <Text style={styles.nextBtnText}>Calculate My Targets</Text>
                      }
                    </TouchableOpacity>
                  </View>
                  {calcError && (
                    <Text style={styles.errorText}>{calcError}</Text>
                  )}
                </View>
              )}

              {result && (
                <View style={styles.resultCard}>
                  <Text style={styles.resultTitle}>Your Daily Targets</Text>
                  <View style={styles.macroGrid}>
                    <MacroResult label="Calories" value={result.dailyCalorieGoal} unit="kcal" color={COLORS.accent} />
                    <MacroResult label="Protein" value={result.dailyProteinGoal} unit="g" color="#0A84FF" />
                    <MacroResult label="Carbs" value={result.dailyCarbsGoal} unit="g" color="#FFD60A" />
                    <MacroResult label="Fat" value={result.dailyFatGoal} unit="g" color="#FF9F0A" />
                  </View>

                  <TouchableOpacity style={styles.nextBtn} onPress={handleFinish}>
                    <Text style={styles.nextBtnText}>Start Tracking</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.recalcBtn} onPress={() => setResult(null)}>
                    <Text style={styles.recalcText}>Change goal</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MacroResult({ label, value, unit, color }) {
  return (
    <View style={styles.macroResultCell}>
      <Text style={[styles.macroResultValue, { color }]}>{value} {unit}</Text>
      <Text style={styles.macroResultLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 48, flexGrow: 1 },
  progress: { flexDirection: 'row', gap: 8, marginBottom: 36 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.cardBorder },
  dotActive: { backgroundColor: COLORS.accent, width: 24 },
  title: { fontSize: FONTS.large, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: FONTS.body, color: COLORS.textSecondary, marginBottom: 32, lineHeight: 22 },
  label: { fontSize: FONTS.small, color: COLORS.textSecondary, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    color: COLORS.textPrimary,
    fontSize: FONTS.body,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  row: { flexDirection: 'row', gap: 12, marginTop: 32 },
  inputRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  unitLabel: { fontSize: FONTS.body, color: COLORS.textSecondary, fontWeight: '600', width: 28 },
  activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  activityCard: {
    flexBasis: '47%', flexGrow: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  activityCardActive: { borderColor: COLORS.accent, borderWidth: 2 },
  activityLabel: { fontSize: FONTS.small, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  activityLabelActive: { color: COLORS.accent },
  activityDesc: { fontSize: FONTS.tiny, color: COLORS.textSecondary },
  toggleBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  toggleBtnActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  toggleText: { fontSize: FONTS.body, fontWeight: '600', color: COLORS.textSecondary },
  toggleTextActive: { color: '#000' },
  goalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  goalCardActive: { borderColor: COLORS.accent, borderWidth: 2 },
  goalLabel: { fontSize: FONTS.title, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  goalLabelActive: { color: COLORS.accent },
  goalDesc: { fontSize: FONTS.small, color: COLORS.textSecondary },
  nextBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnText: { fontSize: FONTS.body, fontWeight: '700', color: '#000' },
  btnDisabled: { opacity: 0.4 },
  backBtn: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  backBtnText: { fontSize: FONTS.body, fontWeight: '600', color: COLORS.textSecondary },
  resultCard: { marginTop: 24 },
  resultTitle: { fontSize: FONTS.title, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  macroResultCell: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  macroResultValue: { fontSize: FONTS.title, fontWeight: '700', marginBottom: 4 },
  macroResultLabel: { fontSize: FONTS.small, color: COLORS.textSecondary },
  recalcBtn: { alignItems: 'center', paddingVertical: 14 },
  errorText: { color: COLORS.danger, fontSize: FONTS.small, marginTop: 12, textAlign: 'center' },
  recalcText: { fontSize: FONTS.body, color: COLORS.textSecondary },
});
