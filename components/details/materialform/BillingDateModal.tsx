import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
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

const toIso = (day: number, month: number, year: number) =>
  `${year}-${pad(month)}-${pad(day)}`;

const isRealDate = (day: number, month: number, year: number) => {
  if (year < 2000 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
};

const BillingDateModal: React.FC<BillingDateModalProps> = ({
  visible,
  value,
  onConfirm,
  onClear,
  onClose,
}) => {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  // Pre-fill fields from the current value each time the modal opens
  useEffect(() => {
    if (!visible) return;
    if (value) {
      const [y, m, d] = value.split('-');
      setDay(d || '');
      setMonth(m || '');
      setYear(y || '');
    } else {
      setDay('');
      setMonth('');
      setYear('');
    }
  }, [visible, value]);

  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  const allFilled = day.length > 0 && month.length > 0 && year.length === 4;
  const valid = allFilled && isRealDate(dayNum, monthNum, yearNum);
  const showError = allFilled && !valid;

  const handleDayChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '').slice(0, 2);
    setDay(clean);
    if (clean.length === 2) monthRef.current?.focus();
  };

  const handleMonthChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '').slice(0, 2);
    setMonth(clean);
    if (clean.length === 2) yearRef.current?.focus();
  };

  const handleYearChange = (text: string) => {
    setYear(text.replace(/[^0-9]/g, '').slice(0, 4));
  };

  const setQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setDay(pad(d.getDate()));
    setMonth(pad(d.getMonth() + 1));
    setYear(String(d.getFullYear()));
  };

  const handleConfirm = () => {
    if (!valid) return;
    onConfirm(toIso(dayNum, monthNum, yearNum));
    onClose();
  };

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
            Enter the date on the vendor&apos;s bill for this purchase.
          </Text>

          {/* Quick select chips */}
          <View style={styles.chipsRow}>
            <TouchableOpacity style={styles.chip} onPress={() => setQuickDate(0)}>
              <Text style={styles.chipText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => setQuickDate(1)}>
              <Text style={styles.chipText}>Yesterday</Text>
            </TouchableOpacity>
          </View>

          {/* DD / MM / YYYY inputs */}
          <View style={styles.inputsRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Day</Text>
              <TextInput
                style={[styles.dateInput, showError && styles.dateInputError]}
                value={day}
                onChangeText={handleDayChange}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="DD"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <Text style={styles.separator}>/</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Month</Text>
              <TextInput
                ref={monthRef}
                style={[styles.dateInput, showError && styles.dateInputError]}
                value={month}
                onChangeText={handleMonthChange}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="MM"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <Text style={styles.separator}>/</Text>
            <View style={[styles.inputGroup, { flex: 1.5 }]}>
              <Text style={styles.inputLabel}>Year</Text>
              <TextInput
                ref={yearRef}
                style={[styles.dateInput, showError && styles.dateInputError]}
                value={year}
                onChangeText={handleYearChange}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="YYYY"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {showError && (
            <Text style={styles.errorText}>
              Please enter a valid date (e.g. 15/03/{new Date().getFullYear()}).
            </Text>
          )}

          {/* Actions */}
          <View style={styles.actionsRow}>
            {value ? (
              <TouchableOpacity style={styles.clearBtn} onPress={() => { onClear(); onClose(); }}>
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            <TouchableOpacity
              style={[styles.confirmBtn, !valid && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={!valid}
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
    gap: 14,
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
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3A78B5',
  },
  inputsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  inputGroup: {
    flex: 1,
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dateInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    backgroundColor: '#F8FAFC',
  },
  dateInputError: {
    borderColor: '#EF4444',
  },
  separator: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94A3B8',
    paddingBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
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
