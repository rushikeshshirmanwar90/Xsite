import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export type PaymentStatus = 'full' | 'partial' | 'unpaid';

interface PaymentStepProps {
  paymentStatus: PaymentStatus;
  amountPaid: string;
  totalCost: number;
  onPaymentStatusChange: (status: PaymentStatus) => void;
  onAmountPaidChange: (amount: string) => void;
  onBack: () => void;
  onClose: (skip?: boolean) => void;
}

const PAYMENT_OPTIONS: {
  key: PaymentStatus;
  label: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  bg: string;
}[] = [
  {
    key: 'full',
    label: 'Full Paid',
    description: 'Total amount has been paid',
    icon: 'checkmark-circle',
    color: '#10B981',
    bg: '#ECFDF5',
  },
  {
    key: 'partial',
    label: 'Partially Paid',
    description: 'Part of the amount has been paid',
    icon: 'time-outline',
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
  {
    key: 'unpaid',
    label: 'Unpaid',
    description: 'No payment has been made yet',
    icon: 'close-circle-outline',
    color: '#EF4444',
    bg: '#FEF2F2',
  },
];

const PaymentStep: React.FC<PaymentStepProps> = ({
  paymentStatus,
  amountPaid,
  totalCost,
  onPaymentStatusChange,
  onAmountPaidChange,
  onBack,
  onClose,
}) => {
  const paidNum = parseFloat(amountPaid) || 0;
  const overLimit = paymentStatus === 'partial' && paidNum > totalCost;

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Status</Text>
        <TouchableOpacity onPress={() => onClose(false)} style={styles.headerBtn}>
          <Ionicons name="close" size={22} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          How has this material purchase been paid?
        </Text>

        {/* Total cost card */}
        <View style={styles.totalCard}>
          <View>
            <Text style={styles.totalLabel}>Total Material Cost</Text>
            <Text style={styles.totalSub}>Sum of all materials in this batch</Text>
          </View>
          <Text style={styles.totalAmount}>
            ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        {/* Payment option cards */}
        <View style={styles.optionsGroup}>
          {PAYMENT_OPTIONS.map((opt) => {
            const selected = paymentStatus === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.optionCard,
                  selected && { borderColor: opt.color, backgroundColor: opt.bg },
                ]}
                onPress={() => onPaymentStatusChange(opt.key)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.optionIcon,
                    { backgroundColor: selected ? opt.color : '#E2E8F0' },
                  ]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={20}
                    color={selected ? '#fff' : '#64748B'}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text
                    style={[
                      styles.optionLabel,
                      selected && { color: opt.color },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={styles.optionDesc}>{opt.description}</Text>
                </View>
                {selected && (
                  <Ionicons name="checkmark-circle" size={20} color={opt.color} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Amount input — only for partial */}
        {paymentStatus === 'partial' && (
          <View style={[styles.amountCard, overLimit && styles.amountCardError]}>
            <Text style={styles.amountLabel}>Amount Paid (₹)</Text>
            <View style={[styles.amountRow, overLimit && styles.amountRowError]}>
              <Text style={styles.rupee}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amountPaid}
                onChangeText={onAmountPaidChange}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
              />
            </View>
            {overLimit && (
              <Text style={styles.errorText}>
                Amount paid cannot exceed total cost (₹
                {totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })})
              </Text>
            )}
            {!overLimit && paidNum > 0 && (
              <Text style={styles.remainText}>
                Remaining: ₹
                {(totalCost - paidNum).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: {
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginHorizontal: 8,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  totalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  totalSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  optionsGroup: {
    gap: 10,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  amountCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  amountCardError: {
    borderColor: '#EF4444',
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  amountRowError: {
    borderColor: '#EF4444',
  },
  rupee: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    padding: 0,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  remainText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
});

export default PaymentStep;
