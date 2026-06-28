import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  FOOD_LOGS: 'food_logs',
  USER_PROFILE: 'user_profile',
  API_KEY: 'anthropic_api_key',
  BODY_DATA: 'body_data',
  ONBOARDED: 'onboarded',
  WEIGHT_LOGS: 'weight_logs',
};

const DEFAULT_PROFILE = {
  dailyCalorieGoal: 2000,
  dailyProteinGoal: 150,
  dailyCarbsGoal: 250,
  dailyFatGoal: 65,
};

export async function saveApiKey(key) {
  await AsyncStorage.setItem(KEYS.API_KEY, key);
}

export async function getApiKey() {
  return AsyncStorage.getItem(KEYS.API_KEY);
}

export async function getUserProfile() {
  const raw = await AsyncStorage.getItem(KEYS.USER_PROFILE);
  return raw ? JSON.parse(raw) : DEFAULT_PROFILE;
}

export async function saveUserProfile(profile) {
  await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
}

export async function getBodyData() {
  const raw = await AsyncStorage.getItem(KEYS.BODY_DATA);
  return raw ? JSON.parse(raw) : null;
}

export async function saveBodyData(data) {
  await AsyncStorage.setItem(KEYS.BODY_DATA, JSON.stringify(data));
}

export async function hasCompletedOnboarding() {
  const val = await AsyncStorage.getItem(KEYS.ONBOARDED);
  return val === 'true';
}

export async function setOnboardingComplete() {
  await AsyncStorage.setItem(KEYS.ONBOARDED, 'true');
}

export async function resetOnboarding() {
  await AsyncStorage.removeItem(KEYS.ONBOARDED);
}

export async function getAllFoodLogs() {
  const raw = await AsyncStorage.getItem(KEYS.FOOD_LOGS);
  return raw ? JSON.parse(raw) : [];
}

export async function saveFoodEntry(entry) {
  const logs = await getAllFoodLogs();
  logs.unshift(entry);
  await AsyncStorage.setItem(KEYS.FOOD_LOGS, JSON.stringify(logs));
}

export async function deleteFoodEntry(id) {
  const logs = await getAllFoodLogs();
  const filtered = logs.filter(e => e.id !== id);
  await AsyncStorage.setItem(KEYS.FOOD_LOGS, JSON.stringify(filtered));
}

export async function getLogsForDate(dateStr) {
  const logs = await getAllFoodLogs();
  return logs.filter(e => e.date === dateStr);
}

export function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function getWeightLogs() {
  const raw = await AsyncStorage.getItem(KEYS.WEIGHT_LOGS);
  return raw ? JSON.parse(raw) : [];
}

export async function saveWeightEntry(entry) {
  const logs = await getWeightLogs();
  const idx = logs.findIndex(l => l.date === entry.date);
  if (idx >= 0) {
    logs[idx] = entry;
  } else {
    logs.push(entry);
  }
  logs.sort((a, b) => a.date.localeCompare(b.date));
  await AsyncStorage.setItem(KEYS.WEIGHT_LOGS, JSON.stringify(logs));
}
