import { Colors } from '@/constants/theme';
import { isAdmin, useUser } from '@/hooks/useUser';
import apiClient from '@/utils/axiosConfig';
import { SKELETON_COLORS } from '@/components/common/skeletonTheme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Skeleton } from 'moti/skeleton';
import React, { useEffect, useState } from 'react';
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

// ─── Types ─────────────────────────────────────────────────────────────────────
type IoniconName = keyof typeof Ionicons.glyphMap;

interface ContractorPayment {
  _id?: string;
  amount: number;
  paymentDate?: string;
  paymentType?: string;
  notes?: string;
}

interface ContractorRecord {
  _id: string;
  staffId?: { firstName?: string; lastName?: string; email?: string; phoneNumber?: string | number } | string;
  contractType?: string;
  paymentSchedule?: string;
  totalAmount?: number;   // agreed contract amount
  usedAmount?: number;    // value of work done so far
  totalPaid?: number;     // paid to the contractor so far
  payments?: ContractorPayment[];
  status?: 'active' | 'completed';
  createdAt?: string;
  commitment?: { status?: string; commitmentDate?: string; amountDue?: number } | null;
}

// ─── Tokens ────────────────────────────────────────────────────────────────────
// Same palette as the Cost Summary screen. Ratios are against white.
const INK = '#0F172A';                  // 17.9:1
const SECONDARY = Colors.textSecondary; // #64748B, 4.8:1
const ACCENT = Colors.primary;          // #3A78B5, 4.6:1

// From this system text size up, label/value rows stack so amounts never truncate
const LARGE_TEXT_SCALE = 1.3;

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  daily: 'Daily Payment',
  weekly: 'Weekly Payment',
  monthly: 'Monthly Payment',
  advance: 'Advance',
  final: 'Final Payment',
};

const SCHEDULE_LABELS: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

const fmtCurrency = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`;

const fmtDate = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const contractorName = (c: ContractorRecord | null, fallback: string) => {
  const s = c?.staffId;
  if (s && typeof s === 'object') {
    const name = [s.firstName, s.lastName].filter(Boolean).join(' ');
    if (name) return name;
  }
  return fallback || 'Contractor';
};

// ─── Small building blocks ─────────────────────────────────────────────────────
// A label on the leading side and its value on the trailing side, stacked at large text sizes
const InfoRow: React.FC<{
  label: string;
  value: string;
  largeText: boolean;
  valueStyle?: object;
  first?: boolean;
}> = ({ label, value, largeText, valueStyle, first }) => (
  <View style={[styles.infoRow, largeText && styles.infoRowStacked, !first && styles.rowDivider]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
  </View>
);

const SectionHeading: React.FC<{ title: string; trailing?: string }> = ({ title, trailing }) => (
  <View style={styles.sectionHeadingRow}>
    <Text style={styles.sectionHeading} accessibilityRole="header">{title}</Text>
    {trailing ? <Text style={styles.sectionTrailing}>{trailing}</Text> : null}
  </View>
);

const DetailsSkeleton: React.FC = () => (
  <View accessible accessibilityLabel="Loading contractor details">
    <Skeleton.Group show>
      <View style={styles.card}>
        <Skeleton colors={SKELETON_COLORS} width={110} height={26} radius={13} />
        <View style={{ height: 18 }} />
        <Skeleton colors={SKELETON_COLORS} width="100%" height={10} radius={5} />
        {[0, 1, 2].map(i => (
          <View key={i} style={styles.skeletonRow}>
            <Skeleton colors={SKELETON_COLORS} width={120} height={15} />
            <Skeleton colors={SKELETON_COLORS} width={90} height={15} />
          </View>
        ))}
      </View>
      {[0, 1].map(i => (
        <View key={i} style={styles.card}>
          <Skeleton colors={SKELETON_COLORS} width="45%" height={17} />
          <View style={{ height: 14 }} />
          <Skeleton colors={SKELETON_COLORS} width="100%" height={15} />
          <View style={{ height: 10 }} />
          <Skeleton colors={SKELETON_COLORS} width="80%" height={15} />
        </View>
      ))}
    </Skeleton.Group>
  </View>
);

// ─── Screen ────────────────────────────────────────────────────────────────────
const ContractorDetails = () => {
  const params = useLocalSearchParams();
  const contractorId = params.contractorId as string;
  const projectId = params.projectId as string;
  const projectName = (params.projectName as string) || 'Project';
  // Passed from the list so the header shows the name before the data arrives
  const nameFromList = (params.contractorName as string) || '';

  // Contract money is admin-only, same as the Cost Summary it opens from
  const { user, loading: userLoading } = useUser();
  const userIsAdmin = isAdmin(user);

  useEffect(() => {
    if (userLoading) return;
    if (!userIsAdmin) {
      toast.error('Contractor details are available to admins only.');
      router.back();
    }
  }, [userLoading, userIsAdmin]);

  const { fontScale } = useWindowDimensions();
  const largeText = fontScale >= LARGE_TEXT_SCALE;

  const hasIds = !!contractorId && !!projectId;
  const [loading, setLoading] = useState(hasIds);
  const [refreshing, setRefreshing] = useState(false);
  const [contractor, setContractor] = useState<ContractorRecord | null>(null);
  const [status, setStatus] = useState<'ok' | 'not-found' | 'failed'>('ok');

  // The API lists contracts per project, so load the project's list and pick this one.
  // Always fetched fresh so payments made elsewhere show up here.
  const loadContractor = async () => {
    try {
      const res = await apiClient.get('/api/contractor', { params: { projectId } });
      const list: ContractorRecord[] = (res.data as any)?.data || [];
      const found = list.find(c => String(c._id) === String(contractorId)) || null;
      setContractor(found);
      setStatus(found ? 'ok' : 'not-found');
    } catch {
      setStatus('failed');
    }
  };

  useEffect(() => {
    if (!hasIds) return;
    let cancelled = false;
    // loadContractor only sets state after the request resolves, never synchronously
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadContractor().finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractorId, projectId]);

  const reload = async () => {
    setLoading(true);
    await loadContractor();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContractor();
    setRefreshing(false);
  };

  const openLink = async (url: string, failMessage: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      toast.error(failMessage);
    }
  };

  const name = contractorName(contractor, nameFromList);

  // ── Full-screen states ───────────────────────────────────────────────────────
  const renderState = (icon: IoniconName, title: string, body: string, action: { label: string; onPress: () => void }) => (
    <View style={styles.stateContainer}>
      <View style={styles.stateIcon}>
        <Ionicons name={icon} size={30} color={Colors.errorText} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateBody}>{body}</Text>
      <Pressable
        style={({ pressed }) => [styles.stateButton, pressed && styles.stateButtonPressed]}
        onPress={action.onPress}
        accessibilityRole="button"
      >
        <Text style={styles.stateButtonText}>{action.label}</Text>
      </Pressable>
    </View>
  );

  const renderContent = () => {
    if (loading || userLoading || !userIsAdmin) {
      return <View style={styles.scrollContent}><DetailsSkeleton /></View>;
    }
    if (!hasIds) {
      return renderState('alert-circle-outline', 'No contractor selected', 'Go back and choose a contractor.', {
        label: 'Go Back', onPress: () => router.back(),
      });
    }
    if (status === 'failed') {
      return renderState('cloud-offline-outline', "Couldn't load this contractor", 'Check your connection, then try again.', {
        label: 'Try Again', onPress: reload,
      });
    }
    if (status === 'not-found' || !contractor) {
      return renderState('person-remove-outline', 'Contractor not found', 'This contract may have been removed from the project.', {
        label: 'Go Back', onPress: () => router.back(),
      });
    }

    // ── Figures ────────────────────────────────────────────────────────────────
    const contractAmount = Number(contractor.totalAmount || 0);
    const paid = Number(contractor.totalPaid || 0);
    const workDone = Number(contractor.usedAmount || 0);
    const remaining = contractAmount - paid;
    const unpaidWork = Math.max(0, workDone - paid);
    const paidPct = contractAmount > 0 ? Math.min(100, (paid / contractAmount) * 100) : 0;
    const isCompleted = contractor.status === 'completed';
    const paidInFull = contractAmount > 0 && remaining <= 0;

    const payments = (contractor.payments || [])
      .slice()
      .sort((a, b) => new Date(b.paymentDate || 0).getTime() - new Date(a.paymentDate || 0).getTime());
    const lastPayment = payments[0];

    const commitment = contractor.commitment;
    const commitmentActive = !!commitment && ['pending', 'reminded', 'overdue'].includes(commitment.status || '');
    const commitmentOverdue = commitment?.status === 'overdue';

    const staff = typeof contractor.staffId === 'object' ? contractor.staffId : undefined;
    const phone = staff?.phoneNumber ? String(staff.phoneNumber) : '';
    const email = staff?.email || '';

    const remainingLabel = remaining < 0 ? 'Paid Over Contract' : 'Remaining';
    const remainingValue = remaining < 0 ? fmtCurrency(-remaining) : fmtCurrency(remaining);
    const remainingColor = remaining < 0 ? Colors.errorText : paidInFull ? Colors.successText : INK;

    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ACCENT]} tintColor={ACCENT} />}
      >
        {/* ── Contract statement: amount − paid = remaining ───────────────── */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View style={[styles.statusPill, isCompleted ? styles.statusPillDone : styles.statusPillActive]}>
              <Ionicons
                name={isCompleted ? 'checkmark-circle' : 'time-outline'}
                size={14}
                color={isCompleted ? Colors.successText : Colors.primaryDark}
              />
              <Text style={[styles.statusPillText, { color: isCompleted ? Colors.successText : Colors.primaryDark }]}>
                {isCompleted ? 'Completed' : 'Active'}
              </Text>
            </View>
            {contractor.contractType ? (
              <Text style={styles.contractType} numberOfLines={2}>{contractor.contractType}</Text>
            ) : null}
          </View>

          <View
            style={styles.progressTrack}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Contract paid"
            accessibilityValue={{ min: 0, max: 100, now: Math.round(paidPct) }}
          >
            <View
              style={[
                styles.progressFill,
                { width: `${paidPct}%`, backgroundColor: paidInFull ? Colors.successText : ACCENT },
              ]}
            />
          </View>
          <Text style={styles.progressCaption}>
            {contractAmount > 0 ? `${Math.round(paidPct)}% of the contract paid` : 'No contract amount set'}
          </Text>

          <View style={styles.statement}>
            <InfoRow first label="Contract Amount" value={fmtCurrency(contractAmount)} largeText={largeText} />
            <InfoRow label="Paid" value={fmtCurrency(paid)} largeText={largeText} />
            <View style={[styles.totalRow, largeText && styles.infoRowStacked]}>
              <Text style={styles.totalLabel}>{remainingLabel}</Text>
              <View style={styles.totalValueWrap}>
                {paidInFull && remaining === 0 && (
                  <Ionicons name="checkmark-circle" size={18} color={Colors.successText} />
                )}
                {remaining < 0 && <Ionicons name="alert-circle" size={18} color={Colors.errorText} />}
                <Text style={[styles.totalValue, { color: remainingColor }]}>
                  {paidInFull && remaining === 0 ? 'Paid in Full' : remainingValue}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Payment promised for a later date ─────────────────────────────── */}
        {commitmentActive && commitment && (
          <View
            style={[styles.notice, commitmentOverdue ? styles.noticeOverdue : styles.noticeDue]}
            accessibilityRole={commitmentOverdue ? 'alert' : undefined}
          >
            <Ionicons
              name={commitmentOverdue ? 'alert-circle' : 'calendar-outline'}
              size={18}
              color={commitmentOverdue ? Colors.errorText : Colors.warningText}
            />
            <Text style={[styles.noticeText, { color: commitmentOverdue ? Colors.errorText : Colors.warningText }]}>
              {commitmentOverdue
                ? `Payment overdue since ${fmtDate(commitment.commitmentDate)}`
                : `Payment due ${fmtDate(commitment.commitmentDate)}`}
              {commitment.amountDue ? ` · ${fmtCurrency(commitment.amountDue)}` : ''}
            </Text>
          </View>
        )}

        {/* ── Work done against payments ─────────────────────────────────────── */}
        <SectionHeading title="Work" />
        <View style={styles.card}>
          <InfoRow first label="Work Done" value={fmtCurrency(workDone)} largeText={largeText} />
          <InfoRow
            label="Unpaid Work"
            value={fmtCurrency(unpaidWork)}
            largeText={largeText}
            valueStyle={unpaidWork > 0 ? { color: Colors.warningText } : undefined}
          />
          <Text style={styles.cardFootnote}>Unpaid work is work done that hasn&apos;t been paid for yet.</Text>
        </View>

        {/* ── Contract terms ─────────────────────────────────────────────────── */}
        <SectionHeading title="Contract" />
        <View style={styles.card}>
          <InfoRow first label="Contract Type" value={contractor.contractType || 'Not set'} largeText={largeText} />
          <InfoRow
            label="Payment Schedule"
            value={SCHEDULE_LABELS[contractor.paymentSchedule || ''] || 'Not set'}
            largeText={largeText}
          />
          <InfoRow label="Started" value={fmtDate(contractor.createdAt) || 'Unknown'} largeText={largeText} />
          <InfoRow
            label="Last Payment"
            value={lastPayment ? fmtDate(lastPayment.paymentDate) || 'Date not recorded' : 'None yet'}
            largeText={largeText}
          />
        </View>

        {/* ── Contact ────────────────────────────────────────────────────────── */}
        {(phone || email) && (
          <>
            <SectionHeading title="Contact" />
            <View style={styles.card}>
              {phone ? (
                <Pressable
                  style={({ pressed }) => [styles.linkRow, pressed && styles.pressedFade]}
                  onPress={() => openLink(`tel:${phone}`, "Couldn't start a call on this device.")}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${name}, ${phone}`}
                >
                  <View style={styles.linkIcon}><Ionicons name="call-outline" size={18} color={ACCENT} /></View>
                  <Text style={styles.linkText} numberOfLines={1}>{phone}</Text>
                  <Text style={styles.linkAction}>Call</Text>
                </Pressable>
              ) : null}
              {email ? (
                <Pressable
                  style={({ pressed }) => [styles.linkRow, !!phone && styles.rowDivider, pressed && styles.pressedFade]}
                  onPress={() => openLink(`mailto:${email}`, "Couldn't open an email app on this device.")}
                  accessibilityRole="button"
                  accessibilityLabel={`Email ${name}, ${email}`}
                >
                  <View style={styles.linkIcon}><Ionicons name="mail-outline" size={18} color={ACCENT} /></View>
                  <Text style={styles.linkText} numberOfLines={1}>{email}</Text>
                  <Text style={styles.linkAction}>Email</Text>
                </Pressable>
              ) : null}
            </View>
          </>
        )}

        {/* ── Payment history, newest first ──────────────────────────────────── */}
        <SectionHeading
          title="Payments"
          trailing={payments.length > 0 ? `${payments.length} · ${fmtCurrency(paid)}` : undefined}
        />
        <View style={styles.card}>
          {payments.length === 0 ? (
            <Text style={styles.emptyText}>No payments recorded yet.</Text>
          ) : (
            payments.map((p, i) => {
              const typeLabel = PAYMENT_TYPE_LABELS[p.paymentType || ''] || 'Payment';
              const date = fmtDate(p.paymentDate);
              return (
                <View
                  key={p._id || `${p.paymentDate}-${i}`}
                  style={[styles.paymentRow, largeText && styles.infoRowStacked, i > 0 && styles.rowDivider]}
                  accessible
                  accessibilityLabel={`${typeLabel}, ${fmtCurrency(p.amount)}${date ? `, ${date}` : ''}${p.notes ? `, ${p.notes}` : ''}`}
                >
                  <View style={styles.paymentText}>
                    <Text style={styles.paymentType}>{typeLabel}</Text>
                    {date ? <Text style={styles.paymentMeta}>{date}</Text> : null}
                    {p.notes ? <Text style={styles.paymentNotes} numberOfLines={3}>{p.notes}</Text> : null}
                  </View>
                  <Text style={styles.paymentAmount}>{fmtCurrency(p.amount)}</Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header — same shape as the Cost Summary header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={22} color="#475569" />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} numberOfLines={1} accessibilityRole="header">{name}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>Contractor · {projectName}</Text>
        </View>
      </View>

      {renderContent()}
    </SafeAreaView>
  );
};

export default ContractorDetails;

// ─── Styles ────────────────────────────────────────────────────────────────────
// Type follows the iOS default text styles: Title 3 20, Headline 17, Subhead 15, Footnote 13.
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' },
  backBtnPressed: { backgroundColor: Colors.border },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: INK, letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 13, color: SECONDARY, marginTop: 1 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: Colors.borderLight },
  pressedFade: { opacity: 0.6 },

  // Statement card
  statusRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, minHeight: 26, borderRadius: 13 },
  statusPillActive: { backgroundColor: Colors.primaryLight },  // #295E94 text, 5.7:1
  statusPillDone: { backgroundColor: Colors.successLight },    // #047857 text
  statusPillText: { fontSize: 13, fontWeight: '700' },
  contractType: { flexShrink: 1, fontSize: 15, fontWeight: '500', color: SECONDARY },
  progressTrack: { height: 10, borderRadius: 5, backgroundColor: Colors.fill, overflow: 'hidden', marginTop: 18 },
  progressFill: { height: '100%', borderRadius: 5 },
  progressCaption: { fontSize: 13, fontWeight: '600', color: SECONDARY, marginTop: 8, fontVariant: ['tabular-nums'] },
  statement: { marginTop: 10 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingTop: 14,
    marginTop: 2,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
  },
  totalLabel: { fontSize: 17, fontWeight: '700', color: INK },
  totalValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  totalValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, fontVariant: ['tabular-nums'] },

  // Label / value rows
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, minHeight: 44, paddingVertical: 10 },
  infoRowStacked: { flexDirection: 'column', alignItems: 'flex-start', gap: 4 },
  infoLabel: { flexShrink: 1, fontSize: 15, color: SECONDARY },
  infoValue: { flexShrink: 1, fontSize: 17, fontWeight: '600', color: INK, textAlign: 'right', fontVariant: ['tabular-nums'] },
  cardFootnote: { fontSize: 13, lineHeight: 18, color: SECONDARY, marginTop: 6 },

  // Section headings
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginTop: 8, marginBottom: 10 },
  sectionHeading: { fontSize: 20, fontWeight: '700', color: INK, letterSpacing: -0.3 },
  sectionTrailing: { fontSize: 13, fontWeight: '600', color: SECONDARY, fontVariant: ['tabular-nums'] },

  // Commitment notice
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, marginBottom: 16, borderRadius: 14, borderWidth: 1 },
  noticeDue: { backgroundColor: Colors.warningLight, borderColor: '#FBE3B4' },
  noticeOverdue: { backgroundColor: Colors.errorLight, borderColor: Colors.errorBorder },
  noticeText: { flex: 1, fontSize: 15, lineHeight: 20, fontWeight: '600' },

  // Contact
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 },
  linkIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  linkText: { flex: 1, fontSize: 15, color: INK },
  linkAction: { fontSize: 15, fontWeight: '600', color: ACCENT },

  // Payment history
  paymentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  paymentText: { flex: 1, alignSelf: 'stretch' },
  paymentType: { fontSize: 15, fontWeight: '600', color: INK },
  paymentMeta: { fontSize: 13, color: SECONDARY, marginTop: 2 },
  paymentNotes: { fontSize: 13, lineHeight: 18, color: SECONDARY, marginTop: 4 },
  paymentAmount: { fontSize: 15, fontWeight: '700', color: Colors.successText, fontVariant: ['tabular-nums'] },
  emptyText: { fontSize: 15, color: SECONDARY, paddingVertical: 6 },

  // Skeleton
  skeletonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },

  // Full-screen states
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 48 },
  stateIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stateTitle: { fontSize: 20, fontWeight: '700', color: INK, textAlign: 'center', marginBottom: 6 },
  stateBody: { fontSize: 15, lineHeight: 21, color: SECONDARY, textAlign: 'center', maxWidth: 300 },
  stateButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateButtonPressed: { backgroundColor: Colors.primaryDark },
  stateButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
