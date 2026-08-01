import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface BillingDateModalProps {
  visible: boolean;
  // ISO date string (YYYY-MM-DD) or '' when no date set
  value: string;
  onConfirm: (isoDate: string) => void;
  onClear: () => void;
  onClose: () => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

const toIso = (year: number, month: number, day: number) =>
  `${year}-${pad(month)}-${pad(day)}`;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const daysInMonth = (year: number, month: number) =>
  new Date(year, month, 0).getDate();

// Weekday index (0 = Sunday) the 1st of the month falls on
const firstWeekday = (year: number, month: number) =>
  new Date(year, month - 1, 1).getDay();

const isoToParts = (iso: string) => {
  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) return null;
  return { year: y, month: m, day: d };
};

/**
 * Billing date picker — a month calendar the user taps a day on. Uses a
 * self-contained grid rather than the native DateTimePicker because this modal
 * opens inside the full-screen Add Material modal, where the Android picker
 * dialog is unreliable; the grid also renders identically on both platforms.
 *
 * Any date can be picked, past or future — a bill may carry a future due date.
 */
const BillingDateModal: React.FC<BillingDateModalProps> = ({
  visible,
  value,
  onConfirm,
  onClear,
  onClose,
}) => {
  const today = new Date();
  const todayIso = toIso(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const [selected, setSelected] = useState('');
  // Month currently shown in the grid
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);

  // Re-sync with the saved value each time the modal opens
  useEffect(() => {
    if (!visible) return;
    const parts = value ? isoToParts(value) : null;
    if (parts) {
      setSelected(value);
      setViewYear(parts.year);
      setViewMonth(parts.month);
    } else {
      setSelected('');
      setViewYear(today.getFullYear());
      setViewMonth(today.getMonth() + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, value]);

  const goToPreviousMonth = () => {
    if (viewMonth === 1) {
      setViewYear(viewYear - 1);
      setViewMonth(12);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear(viewYear + 1);
      setViewMonth(1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // ISO date `offset` days from today (negative = past, positive = future)
  const isoFromToday = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return toIso(d.getFullYear(), d.getMonth() + 1, d.getDate());
  };

  // Jump the grid to a nearby date and select it in one tap
  const setQuickDate = (offset: number) => {
    const iso = isoFromToday(offset);
    const parts = isoToParts(iso)!;
    setViewYear(parts.year);
    setViewMonth(parts.month);
    setSelected(iso);
  };

  const QUICK_DATES: { label: string; offset: number }[] = [
    { label: 'Yesterday', offset: -1 },
    { label: 'Today', offset: 0 },
    { label: 'Tomorrow', offset: 1 },
  ];

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected);
    onClose();
  };

  // Leading blanks so the 1st lands under its weekday, then the month's days
  const leadingBlanks = firstWeekday(viewYear, viewMonth);
  const totalDays = daysInMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  // Pad the final row so the grid keeps a stable width
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons name="calendar-outline" size={18} color="#3A78B5" />
              </View>
              <Text style={styles.title}>Billing Date</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Pick the date on the vendor&apos;s bill for this purchase. A future
            date is fine if the bill is dated ahead.
          </Text>

          {/* Quick select chips */}
          <View style={styles.chipsRow}>
            {QUICK_DATES.map(({ label, offset }) => {
              const iso = isoFromToday(offset);
              const isActive = selected === iso;
              return (
                <TouchableOpacity
                  key={label}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setQuickDate(offset)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Month navigation */}
          <View style={styles.monthRow}>
            <TouchableOpacity
              style={styles.monthNavBtn}
              onPress={goToPreviousMonth}
              hitSlop={8}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color="#3A78B5" />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {MONTH_NAMES[viewMonth - 1]} {viewYear}
            </Text>
            <TouchableOpacity
              style={styles.monthNavBtn}
              onPress={goToNextMonth}
              hitSlop={8}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={18} color="#3A78B5" />
            </TouchableOpacity>
          </View>

          {/* Weekday header */}
          <View style={styles.weekRow}>
            {WEEKDAYS.map((day, index) => (
              <View key={index} style={styles.weekCell}>
                <Text style={styles.weekdayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Day grid */}
          <View style={styles.grid}>
            {cells.map((day, index) => {
              if (day === null) {
                return <View key={`blank-${index}`} style={styles.cell} />;
              }

              const iso = toIso(viewYear, viewMonth, day);
              const isSelected = iso === selected;
              const isToday = iso === todayIso;

              return (
                <TouchableOpacity
                  key={iso}
                  style={styles.cell}
                  onPress={() => setSelected(iso)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.dayPill,
                      isToday && !isSelected && styles.dayPillToday,
                      isSelected && styles.dayPillSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isToday && !isSelected && styles.dayTextToday,
                        isSelected && styles.dayTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            {value ? (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => { onClear(); onClose(); }}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            <TouchableOpacity
              style={[styles.confirmBtn, !selected && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={!selected}
            >
              <Text style={styles.confirmBtnText}>Set Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3A78B5',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3A78B5',
  },
  chipTextActive: {
    color: '#1E40AF',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  monthNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  weekCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayPillToday: {
    borderWidth: 1.5,
    borderColor: '#3A78B5',
  },
  dayPillSelected: {
    backgroundColor: '#3A78B5',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  dayTextToday: {
    color: '#3A78B5',
    fontWeight: '700',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  clearBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  confirmBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#3A78B5',
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#93C5FD',
    opacity: 0.7,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});

export default BillingDateModal;
