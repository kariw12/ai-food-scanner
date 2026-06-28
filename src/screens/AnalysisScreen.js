import { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { analyzeFoodImage } from '../services/aiService';
import { saveFoodEntry } from '../storage/storageService';
import { useDate } from '../context/DateContext';
import { COLORS, FONTS } from '../constants/theme';

export default function AnalysisScreen({ route, navigation }) {
  const { imageUri } = route.params;
  const { selectedDate } = useDate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  useEffect(() => { runAnalysis(); }, []);

  async function runAnalysis() {
    try {
      setLoading(true);
      setError(null);
      const data = await analyzeFoodImage(imageUri);
      setResult(data);
      setCalories(String(data.calories ?? ''));
      setProtein(String(data.protein ?? ''));
      setCarbs(String(data.carbs ?? ''));
      setFat(String(data.fat ?? ''));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function toDataUrl(uri) {
    if (typeof window !== 'undefined' && (uri.startsWith('blob:') || uri.startsWith('data:'))) {
      const blob = await fetch(uri).then(r => r.blob());
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
    return uri;
  }

  async function handleLog() {
    if (!result) return;
    setSaving(true);
    try {
      const persistentUri = await toDataUrl(imageUri);
      await saveFoodEntry({
        id: Date.now().toString(),
        date: selectedDate,
        timestamp: new Date().toISOString(),
        imageUri: persistentUri,
        foodName: result.foodName,
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        servingSize: result.servingSize,
      });
      navigation.navigate('MainTabs', { screen: 'Home' });
    } catch (e) {
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analysis</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: imageUri }} style={styles.image} />

        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={COLORS.accent} size="large" />
            <Text style={styles.loadingText}>Analyzing your food...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Analysis failed</Text>
            <Text style={styles.errorMsg}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={runAnalysis}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {result && !loading && (
          <>
            <View style={styles.resultCard}>
              <Text style={styles.foodName}>{result.foodName}</Text>
              {result.servingSize && <Text style={styles.serving}>{result.servingSize}</Text>}

              <View style={styles.calorieRow}>
                <TextInput
                  style={styles.calorieNum}
                  value={calories}
                  onChangeText={setCalories}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
                <Text style={styles.calorieLabel}>kcal</Text>
              </View>

              <View style={styles.macrosGrid}>
                <EditableMacroCell label="Protein" value={protein} onChange={setProtein} color="#0A84FF" />
                <EditableMacroCell label="Carbs" value={carbs} onChange={setCarbs} color="#FFD60A" />
                <EditableMacroCell label="Fat" value={fat} onChange={setFat} color="#FF9F0A" />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.logBtn, saving && styles.logBtnDisabled]}
              onPress={handleLog}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.logBtnText}>Log This Meal</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.discardBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.discardText}>Discard</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function EditableMacroCell({ label, value, onChange, color }) {
  return (
    <View style={styles.macroCell}>
      <View style={styles.macroCellRow}>
        <TextInput
          style={[styles.macroInput, { color }]}
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          selectTextOnFocus
        />
        <Text style={[styles.macroUnit, { color }]}>g</Text>
      </View>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: FONTS.body, color: COLORS.accent },
  headerTitle: { fontSize: FONTS.body, fontWeight: '600', color: COLORS.textPrimary },
  content: { padding: 16, paddingBottom: 40 },
  image: { width: '100%', height: 240, borderRadius: 16, marginBottom: 16, backgroundColor: COLORS.card },
  loadingCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 32, alignItems: 'center' },
  loadingText: { fontSize: FONTS.body, color: COLORS.textSecondary, marginTop: 16 },
  errorCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 24, alignItems: 'center' },
  errorTitle: { fontSize: FONTS.title, fontWeight: '600', color: COLORS.danger, marginBottom: 8 },
  errorMsg: { fontSize: FONTS.small, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 16 },
  retryBtn: { borderWidth: 1, borderColor: COLORS.accent, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 },
  retryText: { color: COLORS.accent, fontWeight: '600' },
  resultCard: { backgroundColor: COLORS.card, borderRadius: 20, padding: 20, marginBottom: 16 },
  foodName: { fontSize: FONTS.title, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  serving: { fontSize: FONTS.small, color: COLORS.textSecondary, marginBottom: 16 },
  calorieRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  calorieNum: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.accent,
    padding: 0,
    width: 120,
    textAlign: 'right',
    outlineWidth: 0,
    backgroundColor: 'transparent',
  },
  calorieLabel: { fontSize: FONTS.body, color: COLORS.textSecondary, marginLeft: 6, marginTop: 10 },
  macrosGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  macroCell: { alignItems: 'flex-start' },
  macroCellRow: { flexDirection: 'row', alignItems: 'center' },
  macroInput: {
    fontSize: FONTS.title,
    fontWeight: '700',
    padding: 0,
    width: 44,
    outlineWidth: 0,
    backgroundColor: 'transparent',
  },
  macroUnit: {
    fontSize: FONTS.title,
    fontWeight: '700',
  },
  macroLabel: { fontSize: FONTS.small, color: COLORS.textSecondary, marginTop: 2 },
  logBtn: { backgroundColor: COLORS.accent, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  logBtnDisabled: { opacity: 0.6 },
  logBtnText: { fontSize: FONTS.body, fontWeight: '700', color: '#000' },
  discardBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  discardText: { fontSize: FONTS.body, color: COLORS.textSecondary, fontWeight: '600' },
});
