import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import { getTodayString } from '../storage/storageService';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getMondayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  return d;
}

function toLocalStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekDays(weekOffset) {
  const today = getTodayString();
  const monday = getMondayOfWeek(today);
  monday.setDate(monday.getDate() + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toLocalStr(d);
  });
}

function formatMonthLabel(days) {
  const first = new Date(days[0] + 'T00:00:00');
  const last = new Date(days[6] + 'T00:00:00');
  const opts = { month: 'short' };
  if (first.getMonth() === last.getMonth()) {
    return first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  return `${first.toLocaleDateString('en-US', opts)} – ${last.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
}

export default function WeekCalendar({ selectedDate, onSelectDate, weekOffset, onChangeWeek }) {
  const today = getTodayString();
  const days = getWeekDays(weekOffset);
  const isFutureWeek = weekOffset >= 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onChangeWeek(weekOffset - 1)} style={styles.arrow}>
          <Ionicons name="chevron-back" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{formatMonthLabel(days)}</Text>
        <TouchableOpacity
          onPress={() => onChangeWeek(weekOffset + 1)}
          style={styles.arrow}
          disabled={isFutureWeek}
        >
          <Ionicons name="chevron-forward" size={20} color={isFutureWeek ? COLORS.textTertiary : COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.daysRow}>
        {days.map((dateStr, i) => {
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === today;
          const isFuture = dateStr > today;
          const dayNum = new Date(dateStr + 'T00:00:00').getDate();

          return (
            <TouchableOpacity
              key={dateStr}
              style={styles.dayCol}
              onPress={() => !isFuture && onSelectDate(dateStr)}
              disabled={isFuture}
            >
              <Text style={[styles.dayLabel, isFuture && styles.futureText]}>
                {DAY_LABELS[i]}
              </Text>
              <View style={[
                styles.dayNum,
                isSelected && styles.dayNumSelected,
                isToday && !isSelected && styles.dayNumToday,
              ]}>
                <Text style={[
                  styles.dayNumText,
                  isSelected && styles.dayNumTextSelected,
                  isFuture && styles.futureText,
                ]}>
                  {dayNum}
                </Text>
              </View>
              {isToday && !isSelected && <View style={styles.todayDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  arrow: { padding: 4 },
  monthLabel: {
    fontSize: FONTS.small,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
    gap: 6,
  },
  dayLabel: {
    fontSize: FONTS.tiny,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  dayNum: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumSelected: {
    backgroundColor: COLORS.accent,
  },
  dayNumToday: {
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  dayNumText: {
    fontSize: FONTS.small,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dayNumTextSelected: {
    color: '#000',
  },
  futureText: {
    color: COLORS.textTertiary,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },
});
