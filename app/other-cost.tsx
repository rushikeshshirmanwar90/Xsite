import { IconRowCardListSkeleton } from '@/components/common/IconRowCardSkeleton';
import Header from '@/components/details/Header';
import OtherCostCard from '@/components/details/OtherCostCard';
import OtherCostFormModal from '@/components/details/OtherCostFormModal';
import { useAuth } from '@/contexts/AuthContext';
import { getClientId } from '@/functions/clientId';
import { OtherCost, OtherCostEntry } from '@/types/otherCost';
import apiClient from '@/utils/axiosConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

const OtherCostPage = () => {
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const projectId = params.projectId as string;
  const projectName = params.projectName as string;

  const [costEntries, setCostEntries] = useState<OtherCost[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cardAnimations = useRef<Animated.Value[]>([]).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const loadingAnim = useRef(new Animated.Value(0)).current;

  const startLoadingAnim = () => {
    setIsSubmitting(true);
    Animated.loop(
      Animated.timing(loadingAnim, { toValue: 1, duration: 900, useNativeDriver: true })
    ).start();
  };

  const stopLoadingAnim = () => {
    setIsSubmitting(false);
    loadingAnim.stopAnimation();
    loadingAnim.setValue(0);
  };

  const animateCards = (count: number) => {
    while (cardAnimations.length > 0) cardAnimations.pop();
    for (let i = 0; i < count; i++) cardAnimations.push(new Animated.Value(0));
    Animated.stagger(
      80,
      cardAnimations.map((a) =>
        Animated.timing(a, { toValue: 1, duration: 300, useNativeDriver: false })
      )
    ).start();
  };

  // ── Date grouping ──────────────────────────────────────────────────────────
  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getGroupedByDate = () => {
    const grouped: { [key: string]: OtherCost[] } = {};
    costEntries.forEach((e) => {
      const key = new Date(e.date).toDateString();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    });
    return Object.keys(grouped)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map((date) => ({ date, entries: grouped[date] }));
  };

  const totalCost = costEntries.reduce((s, e) => s + (e.totalCost ?? e.amount ?? 0), 0);
  const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`;

  // ── Fetch existing entries from backend ────────────────────────────────────
  const fetchOtherCosts = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const response = await apiClient.get('/api/otherCost', {
        params: {
          entityType: 'project',
          entityId: projectId,
          useStandalone: true,
        },
      });

      const result = response.data;
      if (result?.success && result?.data?.otherCostEntries) {
        const entries: OtherCost[] = result.data.otherCostEntries.map((e: any) => ({
          _id: e._id,
          // DB schema uses `title` and `amount` — keep both sets so card & totals work
          name: e.title || e.name,
          title: e.title || e.name,
          amount: e.amount,
          totalCost: e.amount,    // alias for card/total helpers
          description: e.description,
          status: e.status,
          date: e.addedAt || e.createdAt || new Date().toISOString(),
          sectionId: e.sectionId,
          addedBy: e.addedByName || e.addedBy,
          addedAt: e.addedAt,
          createdAt: e.createdAt,
          updatedAt: e.updatedAt,
        }));

        // Sort newest first
        entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setCostEntries(entries);
        animateCards(entries.length);
      }
    } catch (error: any) {
      console.error('Failed to fetch other costs:', error?.message);
    } finally {
      setLoading(false);
    }
  };

  // Load on mount
  useEffect(() => {
    fetchOtherCosts();
  }, [projectId]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleAddOtherCosts = async (entries: OtherCostEntry[], _message: string) => {
    try {
      startLoadingAnim();
      toast.loading('Adding costs...');

      const clientId = await getClientId();
      if (!clientId) throw new Error('Client ID not found');

      // Map form fields (title/amount) → backend fields (name/category/unitCost)
      const otherCostEntries = entries.map((e) => ({
        name: e.title,
        category: e.category || 'Miscellaneous',
        description: e.description || e.title,
        quantity: 1,
        unit: 'item',
        unitCost: e.amount,
        totalCost: e.amount,
        status: 'pending',
      }));

      // Other Cost applies to the whole project — no sectionId is stamped on the
      // entries, so it isn't tied to (or hidden from) any particular section.
      const requestData = {
        otherCostEntries,
        entityType: 'project',
        entityId: projectId,
        clientId,
        addedBy: user?._id,
        user: user
          ? {
              userId: user._id,
              fullName:
                user.firstName
                  ? `${user.firstName} ${user.lastName || ''}`.trim()
                  : 'Unknown User',
            }
          : undefined,
      };

      const response = await apiClient.post('/api/otherCost', requestData);
      const result = response.data;

      if (!result?.success) {
        throw new Error(result?.message || 'Failed to add other costs');
      }

      // Log to activity feed
      try {
        const { logOtherCostAdded } = await import('@/utils/activityLogger');
        await logOtherCostAdded(
          projectId,
          projectName || '',
          otherCostEntries,
          `Added ${entries.length} other cost ${entries.length === 1 ? 'entry' : 'entries'}`
        );
      } catch (actErr) {
        console.error('Activity log failed (non-critical):', actErr);
      }

      // Refresh list from backend so it reflects the real DB state
      await fetchOtherCosts();

      stopLoadingAnim();
      toast.dismiss();
      toast.success('Other costs added successfully');
    } catch (error: any) {
      stopLoadingAnim();
      toast.dismiss();
      toast.error(error?.message || 'Failed to add costs');
    }
  };

  const grouped = getGroupedByDate();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header
        selectedSection={null}
        onSectionSelect={() => {}}
        totalCost={totalCost}
        formatPrice={formatPrice}
        getSectionName={() => 'Other Costs'}
        projectName={projectName || 'Unknown Project'}
        sectionName="Other Costs"
        projectId={projectId || ''}
        onShowSectionPrompt={() => {}}
        hideSection={true}
        hideMenu={true}
      />

      {/* Form modal */}
      <OtherCostFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleAddOtherCosts}
      />

      {/* Page heading row — fixed above the scroll area so it never scrolls away */}
      <View style={pageBannerStyles.headingRow}>
        <View style={{ flex: 1 }}>
          <Text style={pageBannerStyles.headingTitle}>Other Costs</Text>
        </View>
        <TouchableOpacity
          style={pageBannerStyles.addBtn}
          activeOpacity={0.75}
          disabled={isSubmitting}
          onPress={() => setShowForm(true)}
        >
          {isSubmitting
            ? <Ionicons name="sync" size={16} color="#fff" />
            : <Ionicons name="add" size={17} color="#fff" />}
          <Text style={pageBannerStyles.addBtnText}>Add Cost</Text>
        </TouchableOpacity>
      </View>

      {/* Entries */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={{ paddingHorizontal: 4, paddingTop: 8 }}>
            <IconRowCardListSkeleton count={4} />
          </View>
        ) : grouped.length > 0 ? (
          grouped.map((group, groupIdx) => (
            <View key={group.date} style={styles.dateGroup}>
              {/* Date header */}
              <View style={styles.dateHeader}>
                <View style={styles.dateHeaderLeft}>
                  <Ionicons name="receipt-outline" size={14} color="#E11D48" />
                  <Text style={styles.dateHeaderCount}>
                    {group.entries.length} {group.entries.length === 1 ? 'Entry' : 'Entries'}
                  </Text>
                </View>
                <View style={styles.dateHeaderRight}>
                  <Text style={styles.dateHeaderText}>{formatDateHeader(group.date)}</Text>
                  <Ionicons name="calendar-outline" size={14} color="#64748B" />
                </View>
              </View>

              {/* Cards */}
              {group.entries.map((cost, idx) => (
                <OtherCostCard
                  key={`${group.date}-${cost._id}-${idx}`}
                  cost={cost}
                  animation={cardAnimations[groupIdx * 10 + idx] || new Animated.Value(1)}
                />
              ))}

              {/* Group subtotal */}
              <View style={styles.subtotal}>
                <Text style={styles.subtotalLabel}>Subtotal</Text>
                <Text style={styles.subtotalValue}>
                  ₹{group.entries.reduce((s, e) => s + (e.totalCost ?? e.amount ?? 0), 0).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#FECDD3" />
            <Text style={styles.emptyTitle}>No Other Costs Yet</Text>
            <Text style={styles.emptyDesc}>
              Tap the + button to record transportation, utilities, safety, or any miscellaneous
              project expenses.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Loading overlay */}
      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <Animated.View
              style={{
                transform: [{ rotate: loadingAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
                marginBottom: 14,
              }}
            >
              <Ionicons name="receipt" size={44} color="#E11D48" />
            </Animated.View>
            <Text style={styles.loadingTitle}>Adding Costs...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default OtherCostPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 8,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 11,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateHeaderCount: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  dateHeaderText: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
  subtotal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 4,
    gap: 8,
  },
  subtotalLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  subtotalValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
    minWidth: 220,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
});

const pageBannerStyles = StyleSheet.create({
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
  },
  headingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3A78B5',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    flexShrink: 0,
    shadowColor: '#3A78B5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
