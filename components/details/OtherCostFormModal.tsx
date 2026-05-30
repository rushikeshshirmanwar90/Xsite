import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { OtherCostEntry } from '@/types/otherCost';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (entries: OtherCostEntry[], message: string) => void;
}

const SAFE_BOTTOM = Platform.OS === 'ios' ? 34 : 20;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_SWIPE = SCREEN_WIDTH - 40 - 54 - 10;

const OtherCostFormModal: React.FC<Props> = ({ visible, onClose, onSubmit }) => {
  // ── Form fields ────────────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // ── Entries list ───────────────────────────────────────────────────────────
  const [entries, setEntries] = useState<OtherCostEntry[]>([]);
  const entriesRef = useRef<OtherCostEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // ── Swipe ──────────────────────────────────────────────────────────────────
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const [swipeDone, setSwipeDone] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  // ── Pulse animation while swipe bar is visible ─────────────────────────────
  useEffect(() => {
    if (entries.length > 0 && !showAddForm) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      const shimmer = Animated.loop(
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })
      );
      pulse.start();
      shimmer.start();
      return () => { pulse.stop(); shimmer.stop(); };
    }
  }, [entries.length, showAddForm]);

  // ── Swipe handlers ─────────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy * 2),
      onPanResponderGrant: () => {
        setSwipeDone(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, g) => {
        const p = Math.max(0, Math.min(g.dx / MAX_SWIPE, 1));
        swipeAnim.setValue(p);
        if (p >= 0.7 && !swipeDone) {
          setSwipeDone(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      },
      onPanResponderRelease: (_, g) => {
        const p = g.dx / MAX_SWIPE;
        if (p >= 0.7) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Animated.spring(swipeAnim, { toValue: 1, speed: 20, bounciness: 2, useNativeDriver: false }).start(() => {
            handleFinalSubmit();
          });
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          Animated.spring(swipeAnim, { toValue: 0, speed: 12, bounciness: 8, useNativeDriver: false }).start();
          setSwipeDone(false);
        }
      },
    })
  ).current;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setTitle('');
    setAmount('');
    setDescription('');
  };

  const resetAll = () => {
    resetForm();
    setEntries([]);
    entriesRef.current = [];
    setShowAddForm(false);
    setSwipeDone(false);
    swipeAnim.setValue(0);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const handleAddEntry = () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a cost name');
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Required', 'Please enter a valid amount');
      return;
    }

    const entry: OtherCostEntry = {
      title: title.trim(),
      amount: amountNum,
      description: description.trim() || undefined,
    };

    setEntries((prev) => {
      const next = [...prev, entry];
      entriesRef.current = next;
      return next;
    });

    resetForm();
    setShowAddForm(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const removeEntry = (index: number) => {
    Alert.alert('Remove', `Remove "${entries[index].title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          setEntries((prev) => {
            const next = prev.filter((_, i) => i !== index);
            entriesRef.current = next;
            return next;
          }),
      },
    ]);
  };

  const handleFinalSubmit = () => {
    const current = entriesRef.current;
    if (current.length === 0) {
      Alert.alert('Error', 'Please add at least one cost entry');
      return;
    }
    onSubmit(current, 'Other costs added successfully');
    resetAll();
    onClose();
  };

  const isReady = title.trim().length > 0 && parseFloat(amount) > 0;
  const grandTotal = entries.reduce((s, e) => s + e.amount, 0);
  const showForm = entries.length === 0 || showAddForm;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {showAddForm && entries.length > 0 && (
                <TouchableOpacity
                  onPress={() => { resetForm(); setShowAddForm(false); }}
                  style={styles.backBtn}
                >
                  <Ionicons name="arrow-back" size={22} color="#374151" />
                </TouchableOpacity>
              )}
              <Text style={styles.headerTitle}>Add Other Cost</Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: SAFE_BOTTOM + 130 }]}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Added entries summary ── */}
            {entries.length > 0 && (
              <View style={[styles.section, styles.firstSection]}>
                <Text style={styles.sectionTitle}>Added ({entries.length})</Text>
                {entries.map((e, i) => (
                  <View key={i} style={styles.entryRow}>
                    <View style={styles.entryIconBox}>
                      <Ionicons name="receipt-outline" size={18} color="#6366F1" />
                    </View>
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryTitle} numberOfLines={1}>{e.title}</Text>
                      {e.description ? (
                        <Text style={styles.entryDesc} numberOfLines={1}>{e.description}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.entryAmount}>₹{e.amount.toLocaleString('en-IN')}</Text>
                    <TouchableOpacity onPress={() => removeEntry(i)} style={styles.removeBtn}>
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* ── Add another button ── */}
            {entries.length > 0 && !showAddForm && (
              <TouchableOpacity
                style={styles.addAnotherBtn}
                onPress={() => {
                  setShowAddForm(true);
                  setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={20} color="#10B981" />
                <Text style={styles.addAnotherText}>Add Another Cost</Text>
              </TouchableOpacity>
            )}

            {/* ── Form ── */}
            {showForm && (
              <View style={[styles.section, entries.length === 0 && styles.firstSection]}>
                <Text style={styles.sectionTitle}>Cost Details</Text>
                <View style={styles.inputCard}>

                  {/* Cost Name */}
                  <Text style={styles.inputLabel}>COST NAME *</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.textInput}
                      value={title}
                      onChangeText={setTitle}
                      placeholder="e.g. JCB hired, Generator fuel, Site rent"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="sentences"
                      returnKeyType="next"
                    />
                  </View>

                  {/* Amount */}
                  <Text style={[styles.inputLabel, { marginTop: 18 }]}>COST AMOUNT (₹) *</Text>
                  <View style={styles.inputRow}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      style={styles.textInput}
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="0"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      returnKeyType="next"
                    />
                  </View>

                  {/* Description */}
                  <Text style={[styles.inputLabel, { marginTop: 18 }]}>DESCRIPTION (optional)</Text>
                  <View style={[styles.inputRow, { minHeight: 80, alignItems: 'flex-start', paddingTop: 10 }]}>
                    <TextInput
                      style={[styles.textInput, { textAlignVertical: 'top' }]}
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Any additional details..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* ── Footer: Add Cost button ── */}
          {showForm && isReady && (
            <View style={[styles.footer, { paddingBottom: SAFE_BOTTOM + 8 }]}>
              <TouchableOpacity style={styles.addBtn} onPress={handleAddEntry} activeOpacity={0.8}>
                <Ionicons name="add-circle-outline" size={20} color="#10B981" />
                <Text style={styles.addBtnText}>Add Cost Entry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Grand total ── */}
          {entries.length > 0 && !showAddForm && (
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <View style={styles.grandTotalDivider} />
              <Text style={styles.grandTotalValue}>₹{grandTotal.toLocaleString('en-IN')}</Text>
            </View>
          )}

          {/* ── Swipe to submit ── */}
          {entries.length > 0 && !showAddForm && (
            <View style={[styles.swipeFooter, { paddingBottom: SAFE_BOTTOM + 8 }]}>
              <View style={styles.swipeTrack} {...panResponder.panHandlers}>
                {/* Fill */}
                <Animated.View
                  style={[
                    styles.swipeFill,
                    {
                      width: swipeAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'], extrapolate: 'clamp' }),
                      backgroundColor: swipeAnim.interpolate({
                        inputRange: [0, 0.5, 0.7, 1],
                        outputRange: ['rgba(99,102,241,0.15)', 'rgba(99,102,241,0.25)', 'rgba(16,185,129,0.3)', 'rgba(16,185,129,0.4)'],
                        extrapolate: 'clamp',
                      }),
                    },
                  ]}
                />
                {/* Shimmer */}
                <Animated.View
                  style={[
                    styles.shimmerWrap,
                    { opacity: swipeAnim.interpolate({ inputRange: [0, 0.15], outputRange: [1, 0], extrapolate: 'clamp' }) },
                  ]}
                >
                  {[0, 1, 2].map((i) => (
                    <Animated.View
                      key={i}
                      style={{
                        opacity: shimmerAnim.interpolate({
                          inputRange: [0, 0.33 * i, 0.33 * i + 0.15, 0.33 * i + 0.33, 1],
                          outputRange: [0.15, 0.15, 0.5, 0.15, 0.15],
                          extrapolate: 'clamp',
                        }),
                      }}
                    >
                      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.5)" />
                    </Animated.View>
                  ))}
                </Animated.View>
                {/* Button */}
                <Animated.View
                  style={[
                    styles.swipeButton,
                    {
                      transform: [{ translateX: swipeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, MAX_SWIPE], extrapolate: 'clamp' }) }],
                      backgroundColor: swipeAnim.interpolate({
                        inputRange: [0, 0.65, 0.7, 1],
                        outputRange: ['#6366F1', '#6366F1', '#10B981', '#10B981'],
                        extrapolate: 'clamp',
                      }),
                    },
                  ]}
                >
                  <Animated.View style={{ opacity: swipeAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0], extrapolate: 'clamp' }) }}>
                    <View style={{ flexDirection: 'row' }}>
                      <Ionicons name="chevron-forward" size={22} color="#FFF" style={{ marginRight: -8 }} />
                      <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.6)" style={{ marginLeft: -8 }} />
                    </View>
                  </Animated.View>
                  <Animated.View
                    style={[
                      styles.checkOverlay,
                      { opacity: swipeAnim.interpolate({ inputRange: [0, 0.65, 0.7, 1], outputRange: [0, 0, 1, 1], extrapolate: 'clamp' }) },
                    ]}
                  >
                    <Ionicons name="checkmark" size={28} color="#FFF" />
                  </Animated.View>
                </Animated.View>
                {/* Label */}
                <View style={styles.swipeLabel}>
                  <Animated.Text
                    style={[styles.swipeText, { opacity: swipeAnim.interpolate({ inputRange: [0, 0.3], outputRange: [1, 0], extrapolate: 'clamp' }) }]}
                  >
                    Swipe to Submit ({entries.length})
                  </Animated.Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default OtherCostFormModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    marginRight: 10,
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    flexGrow: 1,
  },
  section: {
    marginBottom: 16,
  },
  firstSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Added entries list
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  entryIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  entryInfo: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  entryDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  entryAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    flexShrink: 0,
  },
  removeBtn: {
    padding: 4,
    flexShrink: 0,
  },
  // Add another
  addAnotherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#BBF7D0',
    borderStyle: 'dashed',
    gap: 8,
  },
  addAnotherText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  // Input card
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: 12,
    fontWeight: '500',
  },
  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#10B981',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  // Grand total
  grandTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  grandTotalLabel: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  grandTotalDivider: {
    width: 2,
    height: 20,
    backgroundColor: '#D1D5DB',
    borderRadius: 1,
  },
  grandTotalValue: {
    fontSize: 26,
    color: '#111827',
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  // Swipe
  swipeFooter: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  swipeTrack: {
    backgroundColor: '#1E293B',
    borderRadius: 32,
    height: 64,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'flex-start',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  swipeFill: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    borderRadius: 32,
  },
  shimmerWrap: {
    position: 'absolute',
    left: 68, top: 0, bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    zIndex: 1,
  },
  swipeButton: {
    position: 'absolute',
    left: 5, top: 5,
    width: 54, height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  checkOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeLabel: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  swipeText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
