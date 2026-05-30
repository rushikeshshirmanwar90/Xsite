import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import apiClient from '@/utils/axiosConfig';
import { ContractorFormModal } from '@/components/details/ContractorFormModal';
import ContractorReportGenerator from './components/contractor/ContractorReportGenerator';

interface LaborEntry {
  _id: string;
  type: string;
  category: string;
  count: number;
  perLaborCost: number;
  totalCost: number;
  addedAt: string;
}

export default function ContractorScreen() {
  const params = useLocalSearchParams();
  const projectId = (params.projectId as string) || '';
  const projectName = (params.projectName as string) || 'Project Details';
  const clientId = (params.clientId as string) || '';
  const sectionId = (params.sectionId as string) || '';
  const sectionName = (params.sectionName as string) || '';

  const [contractors, setContractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modals visibility states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedContractorForManage, setSelectedContractorForManage] = useState<any | null>(null);
  const [contractorToEdit, setContractorToEdit] = useState<any | null>(null);
  const [laborEntries, setLaborEntries] = useState<LaborEntry[]>([]);
  const [loadingLabor, setLoadingLabor] = useState(false);

  // Tab & Payout specific states
  const [activeTab, setActiveTab] = useState<'payments' | 'logs'>('payments');
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState('weekly');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [currentContractorForPayment, setCurrentContractorForPayment] = useState<any | null>(null);
  
  // Dropdown/Collapse states for grouped contractors
  const [expandedStaff, setExpandedStaff] = useState<Set<string>>(new Set());

  // Report generator state
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [selectedContractorForReport, setSelectedContractorForReport] = useState<any | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchContractors();
    }
  }, [projectId]);

  const fetchContractors = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/api/contractor`, {
        params: {
          projectId: projectId,
          includeCompleted: true // Include completed contracts
        }
      });
      const data = (res.data as any).data || [];
      setContractors(data);
      
      // Dynamically update manage modal state if currently open
      if (selectedContractorForManage) {
        const updated = data.find((c: any) => c._id === selectedContractorForManage._id);
        if (updated) {
          setSelectedContractorForManage(updated);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch contractors:', err);
      // Handle 404 gracefully - it just means no contractors exist for this project yet
      if (err?.response?.status === 404) {
        setContractors([]);
      } else {
        Alert.alert('Error', 'Failed to load contractors list.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchContractorLabor = async (contractor: any) => {
    try {
      setLoadingLabor(true);
      const staffId = contractor.staffId?._id || contractor.staffId;
      console.log('Fetching labor entries added by contractor staff:', staffId);
      
      const res = await apiClient.get('/api/labor', {
        params: {
          projectId: projectId,
          addedBy: staffId
        }
      });
      
      const result = res.data;
      if (result.success && result.data) {
        setLaborEntries(result.data.laborEntries || []);
      } else {
        setLaborEntries([]);
      }
    } catch (err) {
      console.error('Failed to fetch contractor labor entries:', err);
      Alert.alert('Error', 'Failed to load worker logs.');
    } finally {
      setLoadingLabor(false);
    }
  };

  const handleManagePress = (contractor: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedContractorForManage(contractor);
    setActiveTab('payments');
    fetchContractorLabor(contractor);
  };

  const handleCompleteContract = async (contractor: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const totalPaid = contractor.totalPaid || 0;
    const remaining = contractor.totalAmount - totalPaid;
    
    if (remaining > 0) {
      Alert.alert(
        'Complete Contract',
        `Outstanding balance is ${formatCurrency(remaining)}. How would you like to proceed?`,
        [
          {
            text: 'Record Final Payout & Complete',
            onPress: () => handleFinalPaymentAndComplete(contractor, remaining),
            style: 'default',
          },
          {
            text: 'Just Mark Completed',
            onPress: () => updateContractStatus(contractor._id, 'completed'),
            style: 'default',
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else {
      Alert.alert(
        'Complete Contract',
        'Are you sure you want to complete this contract?',
        [
          {
            text: 'Yes, Complete',
            onPress: () => updateContractStatus(contractor._id, 'completed'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handleFinalPaymentAndComplete = async (contractor: any, amount: number) => {
    try {
      setLoadingLabor(true);
      const res = await apiClient.patch('/api/contractor', {
        contractorId: contractor._id,
        action: 'add_payment',
        amount: amount,
        paymentType: 'final',
        notes: 'Final automated contract completion payout.',
      });
      
      if ((res.data as any).success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Contract successfully finalized with final payout!');
        await fetchContractors();
      } else {
        throw new Error((res.data as any).message || 'Failed to complete contract');
      }
    } catch (err: any) {
      console.error('Failed to complete contract with final payment:', err);
      Alert.alert('Error', err?.response?.data?.message || err.message || 'Failed to complete contract');
    } finally {
      setLoadingLabor(false);
    }
  };

  const updateContractStatus = async (contractorId: string, status: 'active' | 'completed') => {
    try {
      setLoadingLabor(true);
      const res = await apiClient.patch('/api/contractor', {
        contractorId,
        action: 'update_status',
        status,
      });
      
      if ((res.data as any).success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', `Contract status updated to ${status}!`);
        await fetchContractors();
      } else {
        throw new Error((res.data as any).message || 'Failed to update contract status');
      }
    } catch (err: any) {
      console.error('Failed to update contract status:', err);
      Alert.alert('Error', err?.response?.data?.message || err.message || 'Failed to update status');
    } finally {
      setLoadingLabor(false);
    }
  };

  const handleReactivateContract = (contractor: any) => {
    Alert.alert(
      'Reactivate Contract',
      'Are you sure you want to mark this contract as Active again?',
      [
        {
          text: 'Yes, Reactivate',
          onPress: () => updateContractStatus(contractor._id, 'active'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleEditContractPress = (contractor: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setContractorToEdit(contractor);
    setSelectedContractorForManage(null);
  };

  const handleDeleteContractPress = (contractor: any) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete Contract',
      `Are you sure you want to delete the contract for ${
        contractor.staffId
          ? `${contractor.staffId.firstName} ${contractor.staffId.lastName}`
          : 'Unknown Contractor'
      } (${contractor.contractType})? This cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => performDeleteContract(contractor._id),
        },
      ]
    );
  };

  const performDeleteContract = async (contractorId: string) => {
    try {
      setLoading(true);
      const res = await apiClient.delete(`/api/contractor?contractorId=${contractorId}`);
      if ((res.data as any).success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Contract deleted successfully.');
        setSelectedContractorForManage(null);
        await fetchContractors();
      } else {
        throw new Error((res.data as any).message || 'Failed to delete contract');
      }
    } catch (err: any) {
      console.error('Failed to delete contract:', err);
      Alert.alert('Error', err?.response?.data?.message || err.message || 'Failed to delete contract');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate outstanding work value (usedAmount - totalPaid)
  const calculateOutstandingWorkValue = (contractor: any) => {
    const usedAmount = contractor.usedAmount || 0;
    const totalPaid = contractor.totalPaid || 0;
    return Math.max(0, usedAmount - totalPaid);
  };

  // Helper function to group contractors by staff
  const groupContractorsByStaff = () => {
    const grouped: { [key: string]: any[] } = {};
    
    console.log('Grouping contractors:', contractors.length, 'contractors found');
    
    contractors.forEach(contractor => {
      // Use staffId._id if it's populated, otherwise use staffId directly
      const staffId = contractor.staffId?._id || contractor.staffId;
      const staffKey = staffId ? staffId.toString() : 'unknown';
      
      console.log('Processing contractor:', contractor._id, 'staffKey:', staffKey, 'staffId:', contractor.staffId);
      
      if (!grouped[staffKey]) {
        grouped[staffKey] = [];
      }
      grouped[staffKey].push(contractor);
    });
    
    console.log('Grouped result:', Object.keys(grouped).length, 'groups created');
    console.log('Groups:', Object.entries(grouped).map(([key, contracts]) => ({ key, count: contracts.length })));
    
    return grouped;
  };

  // Helper function to toggle staff expansion
  const toggleStaffExpansion = (staffId: string) => {
    const newExpanded = new Set(expandedStaff);
    if (newExpanded.has(staffId)) {
      newExpanded.delete(staffId);
    } else {
      newExpanded.add(staffId);
    }
    setExpandedStaff(newExpanded);
  };

  // Helper function to get staff display name
  const getStaffDisplayName = (contractor: any) => {
    return contractor.staffId
      ? `${contractor.staffId.firstName} ${contractor.staffId.lastName}`
      : 'Unknown Contractor';
  };

  // Function to render individual contract card
  const renderContractCard = (item: any, isGrouped = false) => {
    const totalPaid = item.totalPaid || 0;
    const remainingPayment = item.totalAmount - totalPaid;
    const percentPaid = item.totalAmount > 0 ? Math.min(100, Math.max(0, (totalPaid / item.totalAmount) * 100)) : 0;
    const status = item.status || 'active';
    
    let progressColor = '#3B82F6';
    if (percentPaid > 85) progressColor = '#8B5CF6';
    else if (percentPaid > 50) progressColor = '#2563EB';

    return (
      <View style={[styles.card, isGrouped && styles.groupedCard]}>
        {!isGrouped && (
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {getStaffDisplayName(item).charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <Text style={styles.contractorName} numberOfLines={1}>{getStaffDisplayName(item)}</Text>
                  <View style={[
                    styles.statusBadge, 
                    status === 'completed' ? styles.statusCompleted : styles.statusActive
                  ]}>
                    <Text style={[
                      styles.statusText,
                      status === 'completed' ? styles.statusTextCompleted : styles.statusTextActive
                    ]}>
                      {status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.contractType}>
                  {item.contractType}
                  {item.paymentSchedule ? ` • ${item.paymentSchedule.charAt(0).toUpperCase() + item.paymentSchedule.slice(1)} Payment` : ''}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => handleManagePress(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.manageButtonText}>Manage</Text>
              <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {isGrouped && (
          <View style={styles.groupedCardHeader}>
            <Text style={styles.contractTypeTitle}>{item.contractType}</Text>
            <View style={styles.groupedCardActions}>
              <View style={[
                styles.statusBadge, 
                status === 'completed' ? styles.statusCompleted : styles.statusActive
              ]}>
                <Text style={[
                  styles.statusText,
                  status === 'completed' ? styles.statusTextCompleted : styles.statusTextActive
                ]}>
                  {status.toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.manageButtonSmall}
                onPress={() => handleManagePress(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.manageButtonTextSmall}>Manage</Text>
                <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Paid Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Budget Paid ({formatCurrency(totalPaid)} of {formatCurrency(item.totalAmount)})</Text>
            <Text style={styles.progressValue}>{percentPaid.toFixed(0)}%</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${percentPaid}%`, backgroundColor: progressColor }]} />
          </View>
        </View>

        {/* Financial Stats */}
        <View style={styles.financialStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>BUDGET</Text>
            <Text style={[styles.statValue, { color: '#1E293B' }]}>
              {formatCurrency(item.totalAmount)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>PAID</Text>
            <Text style={[styles.statValue, { color: '#4F46E5' }]}>
              {formatCurrency(totalPaid)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>REMAINING</Text>
            <Text style={[styles.statValue, { color: remainingPayment < 0 ? '#EF4444' : '#16A34A' }]}>
              {formatCurrency(remainingPayment)}
            </Text>
          </View>
        </View>

        {/* Logged Work Done Value with Payment Deduction */}
        <View style={styles.workDoneContainer}>
          <Ionicons name="construct-outline" size={15} color="#475569" />
          <Text style={styles.workDoneText}>
            Worker Log Value: <Text style={{ fontWeight: '700', color: '#1E293B' }}>{formatCurrency(item.usedAmount || 0)}</Text>
            {item.totalPaid > 0 && (
              <>
                <Text style={{ color: '#EF4444' }}> - {formatCurrency(item.totalPaid)}</Text>
                <Text style={{ fontWeight: '700', color: '#059669' }}> = {formatCurrency(calculateOutstandingWorkValue(item))}</Text>
              </>
            )}
          </Text>
        </View>

        {/* Quick Actions: Edit & Delete */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={styles.cardEditBtn}
            onPress={() => handleEditContractPress(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil-outline" size={16} color="#4F46E5" />
            <Text style={styles.cardEditBtnText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardDeleteBtn}
            onPress={() => handleDeleteContractPress(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
            <Text style={styles.cardDeleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleOpenPaymentForm = (contractor: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Store contractor for payment processing
    setCurrentContractorForPayment(contractor);
    
    // Auto-fill payment amount with outstanding work value (usedAmount - totalPaid)
    const outstandingWorkValue = calculateOutstandingWorkValue(contractor);
    setPaymentAmount(outstandingWorkValue.toString());
    
    // Set default payment type and notes
    setPaymentType('weekly');
    setPaymentNotes(`Payment for work done - Outstanding Work Value: ${formatCurrency(outstandingWorkValue)}`);
    
    // Close current management modal first
    setSelectedContractorForManage(null);
    
    // Small delay to ensure smooth transition, then open payment form
    setTimeout(() => {
      setShowRecordPaymentModal(true);
    }, 100);
  };

  const handleRecordPaymentSubmit = async () => {
    if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      Alert.alert('Required', 'Please enter a valid payment amount.');
      return;
    }
    
    if (!currentContractorForPayment) {
      Alert.alert('Error', 'Unable to identify contractor. Please try again.');
      return;
    }

    // ✅ NEW: Validate payment amount against outstanding work value
    const enteredAmount = Number(paymentAmount);
    const outstandingWorkValue = calculateOutstandingWorkValue(currentContractorForPayment);
    const totalBudget = currentContractorForPayment.totalAmount || 0;
    const totalPaid = currentContractorForPayment.totalPaid || 0;
    const remainingBudget = totalBudget - totalPaid;

    // Check if payment exceeds outstanding work value
    if (enteredAmount > outstandingWorkValue && outstandingWorkValue > 0) {
      Alert.alert(
        'Payment Amount Exceeds Outstanding Work',
        `The payment amount ${formatCurrency(enteredAmount)} exceeds the outstanding work value of ${formatCurrency(outstandingWorkValue)}.\n\nOutstanding work value is calculated as: Work Done (${formatCurrency(currentContractorForPayment.usedAmount || 0)}) - Already Paid (${formatCurrency(totalPaid)}) = ${formatCurrency(outstandingWorkValue)}\n\nWould you like to proceed anyway?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Proceed Anyway',
            style: 'destructive',
            onPress: () => proceedWithPayment(),
          },
        ]
      );
      return;
    }

    // Check if payment exceeds remaining budget
    if (enteredAmount > remainingBudget && remainingBudget > 0) {
      Alert.alert(
        'Payment Exceeds Remaining Budget',
        `The payment amount ${formatCurrency(enteredAmount)} exceeds the remaining contract budget of ${formatCurrency(remainingBudget)}.\n\nTotal Budget: ${formatCurrency(totalBudget)}\nAlready Paid: ${formatCurrency(totalPaid)}\nRemaining: ${formatCurrency(remainingBudget)}\n\nWould you like to proceed anyway?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Proceed Anyway',
            style: 'destructive',
            onPress: () => proceedWithPayment(),
          },
        ]
      );
      return;
    }

    // If validations pass, proceed with payment
    await proceedWithPayment();
  };

  // ✅ NEW: Separate function to handle the actual payment processing
  const proceedWithPayment = async () => {
    if (!currentContractorForPayment) {
      Alert.alert('Error', 'Unable to identify contractor. Please try again.');
      return;
    }
    
    try {
      setRecordingPayment(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const res = await apiClient.patch('/api/contractor', {
        contractorId: currentContractorForPayment._id,
        action: 'add_payment',
        amount: Number(paymentAmount),
        paymentType: paymentType,
        notes: paymentNotes,
      });
      
      if ((res.data as any).success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Show detailed success message
        const paidAmount = Number(paymentAmount);
        
        Alert.alert(
          'Payment Recorded Successfully!', 
          `Payment of ${formatCurrency(paidAmount)} has been recorded.\n\nThe outstanding work value will be updated in the display.`
        );
        
        // Reset form and state
        setPaymentAmount('');
        setPaymentNotes('');
        setPaymentType('weekly');
        setCurrentContractorForPayment(null);
        setShowRecordPaymentModal(false);
        
        // Refresh list
        await fetchContractors();
      } else {
        throw new Error((res.data as any).message || 'Failed to record payment');
      }
    } catch (err: any) {
      console.error('Failed to record payment:', err);
      Alert.alert('Error', err?.response?.data?.message || err.message || 'Failed to record payment');
    } finally {
      setRecordingPayment(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>Contractor Management</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{projectName}</Text>
        </View>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading contractors...</Text>
        </View>
      ) : (
        <View>
          <FlatList
          data={Object.entries(groupContractorsByStaff())}
          keyExtractor={([staffId]) => staffId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="people-outline" size={48} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No Contractors Assigned</Text>
              <Text style={styles.emptySubtitle}>
                Add contractors to manage their budgets and worker logs for this project.
              </Text>
            </View>
          }
          renderItem={({ item: [staffId, contractorGroup] }) => {
            console.log('Rendering group:', staffId, 'with', contractorGroup.length, 'contracts');
            
            const isExpanded = expandedStaff.has(staffId);
            const contractCount = contractorGroup.length;
            const firstContractor = contractorGroup[0];
            const staffName = getStaffDisplayName(firstContractor);

            console.log('Staff name:', staffName, 'isExpanded:', isExpanded);

            // Calculate totals for the staff member
            const totalBudget = contractorGroup.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
            const totalPaid = contractorGroup.reduce((sum, c) => sum + (c.totalPaid || 0), 0);
            const totalUsedAmount = contractorGroup.reduce((sum, c) => sum + (c.usedAmount || 0), 0);

            // Always render grouped with dropdown (as requested by user)
            return (
              <View style={styles.groupContainer}>
                {/* Staff Header */}
                <TouchableOpacity
                  style={styles.staffHeader}
                  onPress={() => {
                    console.log('Toggling expansion for staffId:', staffId);
                    toggleStaffExpansion(staffId);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.staffHeaderLeft}>
                    <View style={styles.avatarContainer}>
                      <Text style={styles.avatarText}>
                        {staffName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.staffName}>{staffName}</Text>
                      <Text style={styles.contractCount}>
                        {contractorGroup.length} Contract{contractorGroup.length > 1 ? 's' : ''} • Total Budget: {formatCurrency(totalBudget)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.staffHeaderRight}>
                    <Text style={styles.totalPaidText}>{formatCurrency(totalPaid)} Paid</Text>
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#64748B" 
                    />
                  </View>
                </TouchableOpacity>

                {/* Expanded Contracts */}
                {isExpanded && (
                  <View style={styles.expandedContracts}>
                    {contractorGroup.map((contractor, index) => (
                      <View key={contractor._id} style={styles.contractWrapper}>
                        {renderContractCard(contractor, true)}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          }}
        />
        </View>
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowAddModal(true);
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
        <Text style={styles.fabText}>Add Contractor</Text>
      </TouchableOpacity>

      {/* Add Contractor Modal */}
      <ContractorFormModal
        visible={showAddModal || contractorToEdit !== null}
        onClose={() => {
          setShowAddModal(false);
          setContractorToEdit(null);
        }}
        projectId={projectId}
        clientId={clientId}
        sectionId={sectionId || undefined}
        contractorToEdit={contractorToEdit}
        onSuccess={async () => {
          await fetchContractors();
          if (!contractorToEdit) {
            router.push({
              pathname: '/labor',
              params: {
                projectId,
                projectName,
                sectionId,
                sectionName,
              }
            });
          }
        }}
      />

      {/* Manage Contractor / Payouts & Worker Logs Modal */}
      <Modal
        visible={selectedContractorForManage !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedContractorForManage(null)}
      >
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContainer}>
            <StatusBar style="dark" backgroundColor="transparent" translucent={true} />
            {/* Header */}
            <View style={modalStyles.header}>
            <TouchableOpacity
              style={modalStyles.backButton}
              onPress={() => setSelectedContractorForManage(null)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={26} color="#374151" />
            </TouchableOpacity>
            
            <View style={modalStyles.headerTitleContainer}>
              <Text style={modalStyles.headerTitle}>Contractor Dashboard</Text>
              <Text style={modalStyles.headerSubtitle}>
                {selectedContractorForManage?.staffId
                  ? `${selectedContractorForManage.staffId.firstName} ${selectedContractorForManage.staffId.lastName}`
                  : 'Contractor'}
              </Text>
            </View>

            {/* Complete / Reactivate Button in Header */}
            {selectedContractorForManage && (
              <View style={modalStyles.headerActions}>
                {selectedContractorForManage.status === 'completed' ? (
                  <>
                    <TouchableOpacity 
                      style={[modalStyles.statusActionButton, modalStyles.downloadBtn]} 
                      onPress={() => {
                        setSelectedContractorForReport(selectedContractorForManage);
                        setShowReportGenerator(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="download-outline" size={16} color="#FFFFFF" />
                      <Text style={modalStyles.statusActionText}>Report</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[modalStyles.statusActionButton, modalStyles.reactivateBtn]} 
                      onPress={() => handleReactivateContract(selectedContractorForManage)}
                      activeOpacity={0.7}
                    >
                      <Text style={modalStyles.statusActionText}>Reactivate</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity 
                    style={[modalStyles.statusActionButton, modalStyles.completeBtn]} 
                    onPress={() => handleCompleteContract(selectedContractorForManage)}
                    activeOpacity={0.7}
                  >
                    <Text style={modalStyles.statusActionText}>Complete</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Segmented Tab Selector */}
          <View style={modalStyles.tabContainer}>
            <TouchableOpacity
              style={[modalStyles.tabButton, activeTab === 'payments' && modalStyles.activeTabButton]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('payments');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="card-outline" size={18} color={activeTab === 'payments' ? '#3B82F6' : '#64748B'} style={{ marginRight: 6 }} />
              <Text style={[modalStyles.tabButtonText, activeTab === 'payments' && modalStyles.activeTabButtonText]}>
                Payments History
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[modalStyles.tabButton, activeTab === 'logs' && modalStyles.activeTabButton]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('logs');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="construct-outline" size={18} color={activeTab === 'logs' ? '#3B82F6' : '#64748B'} style={{ marginRight: 6 }} />
              <Text style={[modalStyles.tabButtonText, activeTab === 'logs' && modalStyles.activeTabButtonText]}>
                Worker Logs
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Contents */}
          {activeTab === 'payments' ? (
            <View style={{ flex: 1 }}>
              {/* Financial mini summary inside modal */}
              {selectedContractorForManage && (() => {
                const totalPaid = selectedContractorForManage.totalPaid || 0;
                const remaining = selectedContractorForManage.totalAmount - totalPaid;
                return (
                  <View style={modalStyles.summaryCard}>
                    <View style={modalStyles.summaryRow}>
                      <View>
                        <Text style={modalStyles.summaryLabel}>TOTAL BUDGET</Text>
                        <Text style={modalStyles.summaryValue}>{formatCurrency(selectedContractorForManage.totalAmount)}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={modalStyles.summaryLabel}>REMAINING BUDGET</Text>
                        <Text style={[modalStyles.summaryValue, { color: remaining < 0 ? '#EF4444' : '#16A34A' }]}>
                          {formatCurrency(remaining)}
                        </Text>
                      </View>
                    </View>

                    {selectedContractorForManage.status !== 'completed' && (
                      <TouchableOpacity
                        style={modalStyles.addPaymentBtn}
                        onPress={() => handleOpenPaymentForm(selectedContractorForManage)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="cash-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={modalStyles.addPaymentBtnText}>Record Payout / Payment</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })()}

              {/* Payments List */}
              <FlatList
                data={selectedContractorForManage?.payments || []}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={modalStyles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={modalStyles.emptyState}>
                    <View style={modalStyles.emptyIconContainer}>
                      <Ionicons name="card-outline" size={48} color="#94A3B8" />
                    </View>
                    <Text style={modalStyles.emptyTitle}>No Payments Recorded</Text>
                    <Text style={modalStyles.emptySubtitle}>
                      Record periodic payouts given to the contractor for labor/work.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => {
                  let typeColor = '#3B82F6';
                  let typeBg = '#EFF6FF';
                  if (item.paymentType === 'weekly') { typeColor = '#4F46E5'; typeBg = '#EEF2FF'; }
                  else if (item.paymentType === 'monthly') { typeColor = '#8B5CF6'; typeBg = '#F5F3FF'; }
                  else if (item.paymentType === 'advance') { typeColor = '#D97706'; typeBg = '#FEF3C7'; }
                  else if (item.paymentType === 'final') { typeColor = '#059669'; typeBg = '#D1FAE5'; }

                  return (
                    <View style={modalStyles.paymentCard}>
                      <View style={modalStyles.paymentHeader}>
                        <View style={[modalStyles.paymentTypeBadge, { backgroundColor: typeBg }]}>
                          <Text style={[modalStyles.paymentTypeText, { color: typeColor }]}>
                            {item.paymentType ? item.paymentType.toUpperCase() : 'PAYMENT'}
                          </Text>
                        </View>
                        <Text style={modalStyles.paymentDateText}>{formatDate(item.paymentDate)}</Text>
                      </View>
                      
                      <View style={modalStyles.paymentDetailsRow}>
                        <Text style={modalStyles.paymentNotes} numberOfLines={2}>
                          {item.notes || 'Payout recorded successfully'}
                        </Text>
                        <Text style={modalStyles.paymentAmountText}>{formatCurrency(item.amount)}</Text>
                      </View>
                    </View>
                  );
                }}
              />
            </View>
          ) : (
            /* Worker Logs Tab */
            loadingLabor ? (
              <View style={modalStyles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={modalStyles.loadingText}>Loading worker logs...</Text>
              </View>
            ) : (
              <FlatList
                data={laborEntries}
                keyExtractor={(item) => item._id}
                contentContainerStyle={modalStyles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={modalStyles.emptyState}>
                    <View style={modalStyles.emptyIconContainer}>
                      <Ionicons name="construct-outline" size={48} color="#94A3B8" />
                    </View>
                    <Text style={modalStyles.emptyTitle}>No Worker Logs Recorded</Text>
                    <Text style={modalStyles.emptySubtitle}>
                      This contractor has not logged any workers or labor entries for this project yet.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={modalStyles.logCard}>
                    <View style={modalStyles.logCardHeader}>
                      <View style={modalStyles.logTypeRow}>
                        <View style={modalStyles.typeIconBadge}>
                          <Ionicons name="person" size={16} color="#4F46E5" />
                        </View>
                        <Text style={modalStyles.logType}>{item.type}</Text>
                      </View>
                      <Text style={modalStyles.logDate}>{formatDate(item.addedAt)}</Text>
                    </View>
                    
                    <View style={modalStyles.logStats}>
                      <View style={modalStyles.logStatItem}>
                        <Text style={modalStyles.logStatLabel}>COUNT</Text>
                        <Text style={modalStyles.logStatValue}>{item.count}</Text>
                      </View>
                      <View style={modalStyles.logStatDivider} />
                      <View style={modalStyles.logStatItem}>
                        <Text style={modalStyles.logStatLabel}>RATE / WORKER</Text>
                        <Text style={modalStyles.logStatValue}>{formatCurrency(item.perLaborCost)}</Text>
                      </View>
                      <View style={modalStyles.logStatDivider} />
                      <View style={modalStyles.logStatItem}>
                        <Text style={modalStyles.logStatLabel}>TOTAL COST</Text>
                        <Text style={[modalStyles.logStatValue, { color: '#4F46E5', fontWeight: '700' }]}>
                          {formatCurrency(item.totalCost)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              />
            )
          )}
          </View>
        </View>
      </Modal>

      {/* Record Payment Form Modal */}
      <Modal
        visible={showRecordPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowRecordPaymentModal(false);
          setCurrentContractorForPayment(null);
          setPaymentAmount('');
          setPaymentNotes('');
          setPaymentType('weekly');
        }}
      >
        <View style={modalStyles.recordOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={modalStyles.recordContainer}
          >
            {/* Grab handle */}
            <View style={styles.dragHandle} />

            {/* Header */}
            <View style={styles.modalFormHeader}>
              <View>
                <Text style={styles.modalFormHeaderTitle}>Record Payout</Text>
                {currentContractorForPayment && (
                  <Text style={styles.modalFormHeaderSubtitle}>
                    {currentContractorForPayment.staffId
                      ? `${currentContractorForPayment.staffId.firstName} ${currentContractorForPayment.staffId.lastName}`
                      : 'Contractor'} - {currentContractorForPayment.contractType}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => {
                setShowRecordPaymentModal(false);
                setCurrentContractorForPayment(null);
                setPaymentAmount('');
                setPaymentNotes('');
                setPaymentType('weekly');
              }}>
                <Ionicons name="close-circle" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.formContent} 
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Amount input */}
              <Text style={styles.inputLabel}>PAYMENT AMOUNT (₹)</Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="Enter payout amount"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                />
              </View>
              
              {/* Info about outstanding work value */}
              {currentContractorForPayment && (
                <View style={styles.infoContainer}>
                  <Ionicons name="information-circle-outline" size={16} color="#3B82F6" />
                  <Text style={styles.infoText}>
                    Total Work Done: {formatCurrency(currentContractorForPayment.usedAmount || 0)} | Outstanding: {formatCurrency(calculateOutstandingWorkValue(currentContractorForPayment))}
                  </Text>
                </View>
              )}

              {/* Quick Amount Options */}
              {currentContractorForPayment && (
                <View style={styles.quickAmountContainer}>
                  <Text style={styles.quickAmountLabel}>QUICK AMOUNT OPTIONS</Text>
                  <View style={styles.quickAmountButtons}>
                    <TouchableOpacity
                      style={styles.quickAmountBtn}
                      onPress={() => {
                        const outstandingWork = calculateOutstandingWorkValue(currentContractorForPayment);
                        setPaymentAmount(outstandingWork.toString());
                        setPaymentNotes(`Payment for outstanding work - ${formatCurrency(outstandingWork)}`);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="construct-outline" size={16} color="#4F46E5" />
                      <Text style={styles.quickAmountBtnText}>Outstanding Work</Text>
                      <Text style={styles.quickAmountValue}>{formatCurrency(calculateOutstandingWorkValue(currentContractorForPayment))}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.quickAmountBtn}
                      onPress={() => {
                        const remainingAmount = currentContractorForPayment.totalAmount - (currentContractorForPayment.totalPaid || 0);
                        setPaymentAmount(remainingAmount.toString());
                        setPaymentNotes(`Final payment - Remaining contract amount: ${formatCurrency(remainingAmount)}`);
                        setPaymentType('final');
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="cash-outline" size={16} color="#059669" />
                      <Text style={styles.quickAmountBtnText}>Remaining Amount</Text>
                      <Text style={styles.quickAmountValue}>{formatCurrency(currentContractorForPayment.totalAmount - (currentContractorForPayment.totalPaid || 0))}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Payment Type selection */}
              <Text style={styles.inputLabel}>PAYMENT SCHEDULE / TYPE</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.dropdownSelector, showTypeDropdown && styles.dropdownActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowTypeDropdown(!showTypeDropdown);
                }}
              >
                <Text style={styles.selectorText}>
                  {paymentType ? paymentType.toUpperCase() : 'Select Payout Type'}
                </Text>
                <Ionicons
                  name={showTypeDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>

              {showTypeDropdown && (
                <View style={styles.dropdownListContainer}>
                  {['daily', 'weekly', 'monthly', 'advance', 'final'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.dropdownItem,
                        paymentType === type && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setPaymentType(type);
                        setShowTypeDropdown(false);
                      }}
                    >
                      <Text style={styles.categoryText}>{type.toUpperCase()}</Text>
                      {paymentType === type && (
                        <Ionicons name="checkmark" size={18} color="#3B82F6" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Notes input */}
              <Text style={styles.inputLabel}>PAYMENT DESCRIPTION / NOTES</Text>
              <View style={[styles.amountInputContainer, { height: 100, alignItems: 'flex-start', paddingTop: 10 }]}>
                <TextInput
                  style={[styles.amountInput, { textAlignVertical: 'top' }]}
                  placeholder="e.g. Week 4 labor logs clearing payment or advance given"
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                  value={paymentNotes}
                  onChangeText={setPaymentNotes}
                />
              </View>
              
              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Actions */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowRecordPaymentModal(false);
                  setCurrentContractorForPayment(null);
                  setPaymentAmount('');
                  setPaymentNotes('');
                  setPaymentType('weekly');
                }}
                disabled={recordingPayment}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleRecordPaymentSubmit}
                disabled={recordingPayment}
              >
                {recordingPayment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Record Payment</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Contractor Report Generator Modal */}
      <ContractorReportGenerator
        visible={showReportGenerator}
        onClose={() => {
          setShowReportGenerator(false);
          setSelectedContractorForReport(null);
        }}
        contractorData={selectedContractorForReport}
        projectId={projectId}
        projectName={projectName}
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748B',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Extra padding for FAB
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
  },
  contractorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  contractType: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  manageButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  financialStats: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusCompleted: {
    backgroundColor: '#E0E7FF',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#15803D',
  },
  statusTextCompleted: {
    color: '#4338CA',
  },
  workDoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  workDoneText: {
    fontSize: 12,
    color: '#64748B',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: '10%',
    right: '10%',
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  cardEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingVertical: 8,
    gap: 6,
  },
  cardEditBtnText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '600',
  },
  cardDeleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingVertical: 8,
    gap: 6,
  },
  cardDeleteBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Record Payment Modal Form Styles ────────────────────────────────────
  dragHandle: {
    width: 48,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalFormHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalFormHeaderSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  formContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
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
    borderColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
  },
  selectorText: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
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
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    marginBottom: 40,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
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
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
  },
  quickAmountContainer: {
    marginTop: 16,
  },
  quickAmountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  quickAmountButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAmountBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  quickAmountBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  quickAmountValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  
  // ── Grouped Contractor Styles ────────────────────────────────────
  groupContainer: {
    marginBottom: 16,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  staffHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  staffHeaderRight: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  contractCount: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  totalPaidText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  expandedContracts: {
    marginTop: 8,
    paddingLeft: 8,
  },
  contractWrapper: {
    marginBottom: 8,
  },
  groupedCard: {
    marginLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  groupedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  contractTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  groupedCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  manageButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  manageButtonTextSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
  },
});

const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '80%',
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: '20%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 20, // Extra padding for visual spacing
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    minHeight: 70, // Increased height for better spacing
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748B',
  },
  listContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  logDate: {
    fontSize: 13,
    color: '#64748B',
  },
  logStats: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  logStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  logStatDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  logStatLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  logStatValue: {
    fontSize: 13,
    color: '#334155',
  },
  statusActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  completeBtn: {
    backgroundColor: '#059669',
  },
  reactivateBtn: {
    backgroundColor: '#4F46E5',
  },
  downloadBtn: {
    backgroundColor: '#10B981',
  },
  statusActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#3B82F6',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabButtonText: {
    color: '#3B82F6',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  addPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 10,
  },
  addPaymentBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paymentTypeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  paymentDateText: {
    fontSize: 12,
    color: '#64748B',
  },
  paymentDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  paymentNotes: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  paymentAmountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  recordOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  recordContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
  },
});
