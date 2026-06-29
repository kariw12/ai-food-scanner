import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

export default function MealItem({ entry, onDelete, onPress }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      {entry.imageUri ? (
        <Image source={{ uri: entry.imageUri }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.placeholderEmoji}>🍽️</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{entry.foodName}</Text>
        <Text style={styles.macros}>
          P: {entry.protein}g  C: {entry.carbs}g  F: {entry.fat}g
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.calories}>{entry.calories}</Text>
        <Text style={styles.kcal}>kcal</Text>
        {onDelete && (
          <TouchableOpacity onPress={() => onDelete(entry.id)} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
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
  image: {
    width: 52,
    height: 52,
    borderRadius: 8,
    marginRight: 12,
  },
  imagePlaceholder: {
    backgroundColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: FONTS.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  macros: {
    fontSize: FONTS.tiny,
    color: COLORS.textSecondary,
  },
  right: {
    alignItems: 'flex-end',
  },
  calories: {
    fontSize: FONTS.body,
    fontWeight: '700',
    color: COLORS.accent,
  },
  kcal: {
    fontSize: FONTS.tiny,
    color: COLORS.textSecondary,
  },
  deleteBtn: {
    marginTop: 4,
    padding: 4,
  },
  deleteText: {
    fontSize: FONTS.small,
    color: COLORS.textTertiary,
  },
});
