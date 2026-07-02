import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState, useRef } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import apiClient from '@/utils/axiosConfig';

interface ContractorFormModalProps {
  visible: boolean;
  onClose: () => void;
  projectId: string;
  clientId: string;
  sectionId?: string;
  onSuccess?: () => void;
  contractorToEdit?: any;
}

const contractCategories = [
  'Civil / Structural Works',
  'Electrical Works',
  'Plumbing & Sanitary Works',
  'Finishing Works',
  'Mechanical & HVAC Works',
  'Fire Fighting & Safety Works',
  'External & Infrastructure Works',
  'Waterproofing & Treatment Works',
  'Site Management & Support Staff',
  'Equipment Operators',
  'Security & Housekeeping',
  'RCC contractor',
  'Other Works',
];

const paymentScheduleOptions = [
  { value: 'daily', label: 'Daily', icon: 'today-outline', desc: 'Paid every day' },
  { value: 'weekly', label: 'Weekly', icon: 'calendar-outline', desc: 'Paid every week' },
  { value: 'monthly', label: 'Monthly', icon: 'calendar-number-outline', desc: 'Paid every month' },
];

export const ContractorFormModal: React.FC<ContractorFormModalProps> = ({
  visible,
  onClose,
  projectId,
  clientId,
  sectionId,
  onSuccess,
  contractorToEdit,
}) => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentSchedule, setPaymentSchedule] = useState('weekly');
  const [submitting, setSubmitting] = useState(false);

  // Dropdown UI states
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Animations
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fetch staff list for the client
      fetchStaff();

      if (contractorToEdit) {
        const sId = contractorToEdit.staffId?._id || contractorToEdit.staffId;
        setSelectedStaffId(sId || '');
        setSelectedCategory(contractorToEdit.contractType || '');
        setAmount(contractorToEdit.totalAmount ? contractorToEdit.totalAmount.toString() : '');
        setPaymentSchedule(contractorToEdit.paymentSchedule || 'weekly');
      } else {
        setSelectedStaffId('');
        setSelectedCategory('');
        setAmount('');
        setPaymentSchedule('weekly');
      }

      // Slide up and fade in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0.6,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.back(0.5)),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide down and fade out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: Dimensions.get('window').height,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Reset state on close
      setSelectedStaffId('');
      setSelectedCategory('');
      setAmount('');
      setPaymentSchedule('weekly');
      setShowStaffDropdown(false);
      setShowCategoryDropdown(false);
    }
  }, [visible, contractorToEdit]);

  const fetchStaff = async () => {
    if (!clientId) return;
    try {
      setLoadingStaff(true);
      const res = await apiClient.get(`/api/staff?clientId=${clientId}`);
      const data = (res.data as any)?.data || [];
      setStaffList(data);
    } catch (error) {
      console.error('Failed to fetch staff in ContractorFormModal:', error);
      Alert.alert('Error', 'Failed to load staff list.');
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedStaffId) {
      Alert.alert('Required', 'Please select a staff member.');
      return;
    }
    
    if (!selectedCategory || !selectedCategory.trim()) {
      Alert.alert('Required', 'Please select or enter a contractor category.');
      return;
    }
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid contract amount.');
      return;
    }

    try {
      setSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      let res;
      if (contractorToEdit) {
        const payload = {
          contractorId: contractorToEdit._id,
          action: 'edit_contractor',
          contractType: selectedCategory.trim(),
          totalAmount: Number(amount),
          paymentSchedule,
        };
        console.log('Sending Edit Contractor payload:', payload);
        res = await apiClient.patch('/api/contractor', payload);
      } else {
        const payload = {
          projectId,
          sectionId: sectionId || undefined,
          staffId: selectedStaffId,
          contractType: selectedCategory.trim(),
          totalAmount: Number(amount),
          paymentSchedule,
        };
        console.log('Sending Assign Contractor payload:', payload);
        res = await apiClient.post('/api/contractor', payload);
      }

      if ((res.data as any)?.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', contractorToEdit ? 'Contractor updated successfully!' : 'Contractor assigned successfully!');
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        throw new Error((res.data as any)?.message || 'Failed to save contractor');
      }
    } catch (error: any) {
      console.error('Failed to save contractor:', error);
      Alert.alert('Error', error?.response?.data?.message || error.message || 'Failed to save contractor');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStaffObj = staffList.find(s => s._id === selectedStaffId);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop press to close */}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdrop}
          onPress={handleClose}
        />

        {/* Modal content sheet */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Grab handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{contractorToEdit ? 'Edit Contractor' : 'Assign Contractor'}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close-circle" size={28} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.formContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Staff selection */}
            <Text style={styles.inputLabel}>SELECT STAFF MEMBER</Text>
            <TouchableOpacity
              activeOpacity={contractorToEdit ? 1 : 0.7}
              disabled={!!contractorToEdit}
              style={[
                styles.dropdownSelector,
                showStaffDropdown && styles.dropdownActive,
                contractorToEdit && styles.disabledDropdownSelector
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowStaffDropdown(!showStaffDropdown);
                setShowCategoryDropdown(false);
              }}
            >
              {loadingStaff ? (
                <ActivityIndicator size="small" color="#3A78B5" style={{ marginRight: 8 }} />
              ) : null}
              <Text style={[styles.selectorText, !selectedStaffId && styles.selectorPlaceholderText]}>
                {selectedStaffObj
                  ? `${selectedStaffObj.firstName} ${selectedStaffObj.lastName} (${selectedStaffObj.role})`
                  : contractorToEdit?.staffId
                  ? `${contractorToEdit.staffId.firstName} ${contractorToEdit.staffId.lastName} (${contractorToEdit.staffId.role || 'Contractor'})`
                  : 'Select Staff Member'}
              </Text>
              {!contractorToEdit && (
                <Ionicons
                  name={showStaffDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#64748B"
                />
              )}
            </TouchableOpacity>

            {showStaffDropdown && (
              <View style={styles.dropdownListContainer}>
                {staffList.length === 0 ? (
                  <View style={styles.dropdownItem}>
                    <Text style={styles.emptyText}>No staff members found</Text>
                  </View>
                ) : (
                  <ScrollView
                    style={styles.dropdownListScrollView}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                  >
                    {staffList.map((staff) => (
                      <TouchableOpacity
                        key={staff._id}
                        style={[
                          styles.dropdownItem,
                          selectedStaffId === staff._id && styles.dropdownItemSelected,
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedStaffId(staff._id);
                          setShowStaffDropdown(false);
                        }}
                      >
                        <View>
                          <Text style={styles.staffNameText}>
                            {staff.firstName} {staff.lastName}
                          </Text>
                          <Text style={styles.staffMetaText}>{staff.role} • {staff.phoneNumber}</Text>
                        </View>
                        {selectedStaffId === staff._id && (
                          <Ionicons name="checkmark" size={18} color="#3A78B5" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {/* Category / contractType selection */}
            <Text style={styles.inputLabel}>CONTRACT TYPE / CATEGORY</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={selectedCategory}
                onChangeText={setSelectedCategory}
                placeholder="Select from list or type custom category"
                placeholderTextColor="#94A3B8"
                autoCapitalize="words"
                onFocus={() => setShowCategoryDropdown(true)}
              />
              <TouchableOpacity
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                style={styles.dropdownToggle}
              >
                <Ionicons
                  name={showCategoryDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            {showCategoryDropdown && (
              <View style={styles.dropdownListContainer}>
                <ScrollView
                  style={styles.dropdownListScrollView}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                >
                  {contractCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.dropdownItem,
                        selectedCategory === cat && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedCategory(cat);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <Text style={styles.categoryText}>{cat}</Text>
                      {selectedCategory === cat && (
                        <Ionicons name="checkmark" size={18} color="#3A78B5" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Amount input */}
            <Text style={styles.inputLabel}>CONTRACT AMOUNT (₹)</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="Enter total payable amount"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Payment Schedule selection */}
            <Text style={styles.inputLabel}>PAYMENT SCHEDULE</Text>
            <View style={styles.scheduleContainer}>
              {paymentScheduleOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.scheduleOption,
                    paymentSchedule === option.value && styles.scheduleOptionSelected,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPaymentSchedule(option.value);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={paymentSchedule === option.value ? '#3A78B5' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.scheduleLabel,
                      paymentSchedule === option.value && styles.scheduleLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.scheduleDesc,
                      paymentSchedule === option.value && styles.scheduleDescSelected,
                    ]}
                  >
                    {option.desc}
                  </Text>
                  {paymentSchedule === option.value && (
                    <View style={styles.scheduleCheck}>
                      <Ionicons name="checkmark-circle" size={18} color="#3A78B5" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Action button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>{contractorToEdit ? 'Update Contract' : 'Assign Contract'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    minHeight: '50%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
  },
  dragHandle: {
    width: 48,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  closeButton: {
    padding: 2,
  },
  formContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownActive: {
    borderColor: '#3A78B5',
    backgroundColor: '#FFFFFF',
  },
  disabledDropdownSelector: {
    opacity: 0.7,
    backgroundColor: '#E2E8F0',
    borderColor: '#CBD5E1',
  },
  selectorText: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  selectorPlaceholderText: {
    color: '#94A3B8',
  },
  dropdownListContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  dropdownListScrollView: {
    maxHeight: 200,
    width: '100%',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemSelected: {
    backgroundColor: '#EAF0FE',
  },
  staffNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  staffMetaText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    width: '100%',
    paddingVertical: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    paddingVertical: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3A78B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scheduleContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  scheduleOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  scheduleOptionSelected: {
    borderColor: '#3A78B5',
    backgroundColor: '#EAF0FE',
  },
  scheduleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 6,
  },
  scheduleLabelSelected: {
    color: '#1E40AF',
  },
  scheduleDesc: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
  scheduleDescSelected: {
    color: '#3A78B5',
  },
  scheduleCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: 14,
    fontWeight: '500',
  },
  dropdownToggle: {
    padding: 4,
  },
});
