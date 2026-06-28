import { StyleSheet, Alert } from 'react-native';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS } from '../constants/theme';
export default function CameraScreen({ navigation }) {
  async function pickAndNavigate(useCamera) {
    const options = {
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    };

    let result;
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Camera access is required to take photos.');
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Photo library access is required.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets[0]) {
      navigation.navigate('Analysis', { imageUri: result.assets[0].uri });
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Log Food</Text>
        <Text style={styles.subtitle}>Take a photo or choose from your library</Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionCard} onPress={() => pickAndNavigate(true)}>
            <Ionicons name="camera-outline" size={32} color={COLORS.textSecondary} style={styles.optionIcon} />
            <Text style={styles.optionLabel}>Take Photo</Text>
            <Text style={styles.optionDesc}>Use your camera to snap your meal</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={() => pickAndNavigate(false)}>
            <Ionicons name="image-outline" size={32} color={COLORS.textSecondary} style={styles.optionIcon} />
            <Text style={styles.optionLabel}>Choose Photo</Text>
            <Text style={styles.optionDesc}>Pick a photo from your library</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: 24, justifyContent: 'flex-start', paddingTop: 32 },
  title: { fontSize: FONTS.large, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: FONTS.body, color: COLORS.textSecondary, marginBottom: 32 },
  optionsContainer: { gap: 16 },
  optionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  optionIcon: { marginBottom: 12 },
  optionLabel: { fontSize: FONTS.title, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  optionDesc: { fontSize: FONTS.small, color: COLORS.textSecondary },
});
