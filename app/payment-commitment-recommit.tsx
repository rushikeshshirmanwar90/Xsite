import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { toast } from 'sonner-native';
import apiClient from '@/utils/axiosConfig';
import CommitmentDateModal from '@/components/common/CommitmentDateModal';

/**
 * Deep-link target for the "payment overdue" push notification. Renders
 * straight from the notification's own data payload (no wait on a fetch,
 * so it shows something useful even offline), and lets the admin set the
 * next commitment date in one tap.
 */
export default function PaymentCommitmentRecommitScreen() {
  const params = useLocalSearchParams();
  const commitmentId = (params.commitmentId as string) || '';
  const entityType = (params.entityType as string) || '';
  const projectId = (params.projectId as string) || '';
  const clientId = (params.clientId as string) || '';
  const projectName = (params.projectName as string) || '';
  const entityLabel = (params.entityLabel as string) || 'Payment';
  const amountDue = Number(params.amountDue) || 0;

  const [showDateModal, setShowDateModal] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const goToEntity = () => {
    if (entityType === 'contractor') {
      router.replace({ pathname: '/contractor', params: { projectId, clientId, projectName } });
    } else {
      router.replace({ pathname: '/details', params: { projectId, clientId, projectName } });
    }
  };

  const handleConfirm = async (isoDate: string) => {
    if (!commitmentId) {
      toast.error('Missing commitment reference — open the project to set a new date.');
      return;
    }
    try {
      setSaving(true);
      const res = await apiClient.patch('/api/payment-commitment', {
        commitmentId,
        action: 'recommit',
        newCommitmentDate: isoDate,
      });
      if ((res.data as any)?.success !== false) {
        toast.success('New commitment date set');
        setSaved(true);
      } else {
        throw new Error((res.data as any)?.message || 'Failed to set new date');
      }
    } catch (error: any) {
      console.error('Failed to recommit payment date:', error);
      toast.error(error?.response?.data?.message || error.message || 'Failed to set new date');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goToEntity} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Overdue</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="alert-circle" size={40} color="#EF4444" />
        </View>

        <Text style={styles.title}>{entityLabel}</Text>
        {!!projectName && <Text style={styles.subtitle}>{projectName}</Text>}

        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount due</Text>
          <Text style={styles.amountValue}>
            ₹{amountDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        {saved ? (
          <View style={styles.savedCard}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.savedText}>New commitment date set.</Text>
            <TouchableOpacity style={styles.doneBtn} onPress={goToEntity} activeOpacity={0.8}>
              <Text style={styles.doneBtnText}>Back to project</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.setDateBtn, saving && styles.setDateBtnDisabled]}
            onPress={() => setShowDateModal(true)}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="alarm-outline" size={18} color="#fff" />
                <Text style={styles.setDateBtnText}>Set New Commitment Date</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <CommitmentDateModal
        visible={showDateModal}
        value=""
        onConfirm={handleConfirm}
        onClose={() => setShowDateModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
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
    width: 34,
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 8,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  amountCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#EF4444',
  },
  setDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3A78B5',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
  },
  setDateBtnDisabled: {
    opacity: 0.6,
  },
  setDateBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  savedCard: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 20,
  },
  savedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
  doneBtn: {
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
