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
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import apiClient from '@/utils/axiosConfig';
import { ContractorFormModal } from '@/components/details/ContractorFormModal';
import ContractorReportGenerator from './components/contractor/ContractorReportGenerator';
import Header from '@/components/details/Header';

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
  

  // Report generator state
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [selectedContractorForReport, setSelectedContractorForReport] = useState<any | null>(null);
  const [showProjectReport, setShowProjectReport] = useState(false);
  const [showContractorPicker, setShowContractorPicker] = useState(false);
  const [selectedForReport, setSelectedForReport] = useState<Set<string>>(new Set());
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

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

  const calculateOutstandingWorkValue = (contractor: any) => {
    const usedAmount = contractor.usedAmount || 0;
    const totalPaid = contractor.totalPaid || 0;
    return Math.max(0, usedAmount - totalPaid);
  };

  // Helper function to get staff display name
  const getStaffDisplayName = (contractor: any) => {
    return contractor.staffId
      ? `${contractor.staffId.firstName} ${contractor.staffId.lastName}`
      : 'Unknown Contractor';
  };

  const renderContractCard = (item: any) => {
    const totalPaid = item.totalPaid || 0;
    const remaining = item.totalAmount - totalPaid;
    const percentPaid = item.totalAmount > 0 ? Math.min(100, Math.max(0, (totalPaid / item.totalAmount) * 100)) : 0;
    const isActive = (item.status || 'active') === 'active';
    const name = getStaffDisplayName(item);
    const outstanding = calculateOutstandingWorkValue(item);
    const accentColor = isActive ? '#16A34A' : '#94A3B8';

    return (
      <View style={cStyles.card}>
        {/* Top row: identity + actions */}
        <View style={cStyles.cardTop}>
          <View style={cStyles.identityBlock}>
            <View style={cStyles.avatarWrap}>
              <Text style={cStyles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={cStyles.nameRow}>
                <View style={[cStyles.statusDot, { backgroundColor: accentColor }]} />
                <Text style={cStyles.personName} numberOfLines={1}>
                  {item.contractType}
                </Text>
              </View>
              <Text style={cStyles.contractMeta} numberOfLines={1}>
                {name}{item.paymentSchedule ? `  ·  ${item.paymentSchedule}` : ''}
              </Text>
            </View>
          </View>
          <View style={cStyles.actionIcons}>
            <TouchableOpacity onPress={() => handleEditContractPress(item)} activeOpacity={0.6} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="pencil-outline" size={17} color="#94A3B8" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteContractPress(item)} activeOpacity={0.6} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={17} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress bar */}
        <View style={cStyles.progressWrap}>
          <View style={cStyles.progressTrack}>
            <View style={[cStyles.progressFill, { width: `${percentPaid}%` as any, backgroundColor: accentColor }]} />
          </View>
          <Text style={cStyles.progressLabel}>{Math.round(percentPaid)}%</Text>
        </View>

        {/* Stats row */}
        <View style={cStyles.statsRow}>
          <View style={cStyles.statCol}>
            <Text style={cStyles.statLabel}>Budget</Text>
            <Text style={cStyles.statValue}>{formatCurrency(item.totalAmount)}</Text>
          </View>
          <View style={cStyles.statDivider} />
          <View style={cStyles.statCol}>
            <Text style={cStyles.statLabel}>Paid</Text>
            <Text style={[cStyles.statValue, totalPaid > 0 && { color: '#16A34A' }]}>{formatCurrency(totalPaid)}</Text>
          </View>
          <View style={cStyles.statDivider} />
          <View style={cStyles.statCol}>
            <Text style={cStyles.statLabel}>Remaining</Text>
            <Text style={[cStyles.statValue, { color: remaining <= 0 ? '#16A34A' : '#EF4444' }]}>
              {formatCurrency(Math.max(0, remaining))}
            </Text>
          </View>
        </View>

        {/* Action button */}
        <TouchableOpacity
          style={[cStyles.actionBtn, { backgroundColor: isActive ? '#3A78B5' : '#F1F5F9' }]}
          onPress={() => handleManagePress(item)}
          activeOpacity={0.8}
        >
          <Text style={[cStyles.actionBtnText, { color: isActive ? '#FFFFFF' : '#64748B' }]}>
            {isActive ? 'Payments & Logs' : 'View Details'}
          </Text>
          <Ionicons name="arrow-forward" size={15} color={isActive ? '#FFFFFF' : '#94A3B8'} />
        </TouchableOpacity>

        {/* Outstanding amount */}
        <View style={cStyles.outstandingRow}>
          <Text style={cStyles.outstandingLabel}>Outstanding</Text>
          <Text style={[cStyles.outstandingAmount, { color: outstanding > 0 ? '#F59E0B' : '#16A34A' }]}>
            {formatCurrency(outstanding)}
          </Text>
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

  // ── Checkbox helpers ─────────────────────────────────────────────────────────
  const toggleContractorSelection = (id: string) => {
    setSelectedForReport(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allSelected = contractors.length > 0 && selectedForReport.size === contractors.length;
  const toggleSelectAll = () => {
    setSelectedForReport(allSelected ? new Set() : new Set(contractors.map((c: any) => c._id)));
  };

  // ── Direct PDF generation (no intermediate preview) ──────────────────────────
  const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }); } catch { return d; }
  };

  const laborRowsHTML = (entries: any[]) => {
    if (!entries.length) return '';
    const byDate: Record<string, any[]> = {};
    entries.forEach(e => { const k = new Date(e.addedAt).toDateString(); (byDate[k] = byDate[k] || []).push(e); });
    return Object.entries(byDate).sort(([a],[b]) => new Date(a).getTime()-new Date(b).getTime()).map(([date, rows]) => {
      const dayTotal = rows.reduce((s,r) => s+r.totalCost, 0);
      return `<tr style="background:#1e293b;"><td colspan="4" style="padding:10px;color:white;font-weight:600;font-size:13px;">📅 ${fmtDate(date)} — Total: ${formatCurrency(dayTotal)}</td></tr>`
        + rows.map(r => `<tr style="background:#f8fafc;"><td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;">${r.type}</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;font-size:12px;">${r.count}</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:right;font-size:12px;">${formatCurrency(r.perLaborCost)}</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:right;font-weight:600;font-size:12px;">${formatCurrency(r.totalCost)}</td></tr>`).join('');
    }).join('');
  };

  const paymentRowsHTML = (payments: any[]) => {
    if (!payments?.length) return '';
    const byDate: Record<string, any[]> = {};
    payments.forEach(p => { const k = new Date(p.paymentDate).toDateString(); (byDate[k] = byDate[k] || []).push(p); });
    return Object.entries(byDate).sort(([a],[b]) => new Date(a).getTime()-new Date(b).getTime()).map(([date, ps]) => {
      const dayTotal = ps.reduce((s,p) => s+p.amount, 0);
      return `<tr style="background:#059669;"><td colspan="3" style="padding:10px;color:white;font-weight:600;font-size:13px;">💰 ${fmtDate(date)} — Paid: ${formatCurrency(dayTotal)}</td></tr>`
        + ps.map(p => `<tr style="background:#f0fdf4;"><td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;"><span style="background:#dcfce7;color:#166534;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;">${(p.paymentType||'payment').toUpperCase()}</span></td><td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;">${p.notes||'Payment recorded'}</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:right;font-weight:600;color:#059669;font-size:12px;">${formatCurrency(p.amount)}</td></tr>`).join('');
    }).join('');
  };

  const baseCSS = `body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:20px;background:#fff;color:#1e293b;line-height:1.4;}table{width:100%;border-collapse:collapse;margin-bottom:16px;background:white;box-shadow:0 1px 3px rgba(0,0,0,0.1);}th{background:#374151;color:white;padding:10px 12px;text-align:left;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;}td{padding:10px;border:1px solid #e2e8f0;font-size:13px;}.no-data{text-align:center;padding:30px;color:#64748b;font-style:italic;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:16px;}.section-title{font-size:15px;font-weight:700;color:#1e293b;margin:20px 0 10px 0;padding:10px 14px;background:#f1f5f9;border-left:4px solid #3A78B5;border-radius:4px;}.summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;}.summary-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;text-align:center;}.summary-card h3{margin:0 0 6px 0;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;}.summary-card p{margin:0;font-size:16px;font-weight:700;color:#1e293b;}.footer{margin-top:40px;padding:16px;background:#f8fafc;border-radius:8px;text-align:center;font-size:12px;color:#64748b;}`;

  const buildReportHTML = (selected: any[], laborMap: Record<string, any[]>) => {
    const now = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' } as any);
    const totalBudget = selected.reduce((s,c) => s+(c.totalAmount||0), 0);
    const totalPaid   = selected.reduce((s,c) => s+(c.totalPaid||0), 0);
    const totalWork   = selected.reduce((s,c) => s+(c.usedAmount||0), 0);

    const contractorSections = selected.map(c => {
      const name = getStaffDisplayName(c);
      const entries = laborMap[c._id] || [];
      const outstanding = Math.max(0, (c.usedAmount||0) - (c.totalPaid||0));
      const statusStyle = c.status==='completed' ? 'background:#dcfce7;color:#166534;' : 'background:#fef3c7;color:#92400e;';
      return `
        <div style="margin-bottom:36px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <div style="background:#3A78B5;padding:16px 20px;color:white;">
            <div style="font-size:18px;font-weight:700;">${name}</div>
            <div style="font-size:12px;opacity:0.85;margin-top:3px;">${c.contractType||'Contract'} &nbsp;•&nbsp; <span style="display:inline-block;${statusStyle}padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;text-transform:uppercase;">${c.status||'active'}</span></div>
          </div>
          <div style="padding:16px 20px;">
            <div class="summary-grid">
              <div class="summary-card"><h3>Budget</h3><p>${formatCurrency(c.totalAmount||0)}</p></div>
              <div class="summary-card"><h3>Work Done</h3><p>${formatCurrency(c.usedAmount||0)}</p></div>
              <div class="summary-card"><h3>Paid</h3><p style="color:#059669;">${formatCurrency(c.totalPaid||0)}</p></div>
              <div class="summary-card"><h3>Outstanding</h3><p style="color:${outstanding>0?'#dc2626':'#059669'};">${formatCurrency(outstanding)}</p></div>
            </div>
            <div class="section-title">Work Logs (Day-wise)</div>
            ${entries.length ? `<table><thead><tr><th>Worker Type</th><th style="text-align:center;">Count</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Total</th></tr></thead><tbody>${laborRowsHTML(entries)}</tbody></table>` : '<div class="no-data">No work logs recorded.</div>'}
            <div class="section-title">Payment History</div>
            ${(c.payments||[]).length ? `<table><thead><tr><th>Type</th><th>Notes</th><th style="text-align:right;">Amount</th></tr></thead><tbody>${paymentRowsHTML(c.payments)}</tbody></table>` : '<div class="no-data">No payments recorded.</div>'}
          </div>
        </div>`;
    }).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Contractor Report</title><style>${baseCSS}.main-header{text-align:center;margin-bottom:24px;padding:20px;background:#3A78B5;color:white;border-radius:12px;}.main-header h1{margin:0 0 6px 0;font-size:24px;font-weight:700;}.main-header p{margin:3px 0;font-size:13px;opacity:0.9;}</style></head><body>
      <div class="main-header"><h1>Contractor Report</h1><p><strong>${projectName}</strong></p><p>${selected.length} Contractor${selected.length!==1?'s':''} selected</p><p>Generated: ${now}</p></div>
      ${selected.length > 1 ? `<div style="margin-bottom:24px;"><h2 style="font-size:16px;font-weight:700;margin-bottom:12px;">Project Summary</h2><div class="summary-grid"><div class="summary-card"><h3>Total Budget</h3><p>${formatCurrency(totalBudget)}</p></div><div class="summary-card"><h3>Work Done</h3><p>${formatCurrency(totalWork)}</p></div><div class="summary-card"><h3>Total Paid</h3><p style="color:#059669;">${formatCurrency(totalPaid)}</p></div><div class="summary-card"><h3>Contractors</h3><p>${selected.length}</p></div></div></div>` : ''}
      ${contractorSections}
      <div class="footer"><p><strong>Construction Management System</strong></p><p>Generated: ${new Date().toISOString()}</p></div>
    </body></html>`;
  };

  const generateReportDirectly = async () => {
    const selected = contractors.filter((c: any) => selectedForReport.has(c._id));
    if (!selected.length) return;

    setShowContractorPicker(false);
    setIsGeneratingReport(true);

    try {
      // Fetch labor data for each selected contractor in parallel
      const laborMap: Record<string, any[]> = {};
      await Promise.allSettled(selected.map(async (c: any) => {
        const staffId = c.staffId?._id || c.staffId;
        try {
          const res = await apiClient.get('/api/labor', { params: { projectId, addedBy: staffId } });
          const r = res.data as any;
          laborMap[c._id] = r.success && r.data ? r.data.laborEntries || [] : [];
        } catch { laborMap[c._id] = []; }
      }));

      const html = buildReportHTML(selected, laborMap);
      const { uri } = await Print.printToFileAsync({ html, base64: false });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Contractor Report — ${projectName}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Report Ready', `PDF saved to: ${uri}`);
      }
      setSelectedForReport(new Set());
    } catch {
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header
        selectedSection={null}
        onSectionSelect={() => { }}
        totalCost={0}
        formatPrice={(price: number) => `₹${price.toLocaleString('en-IN')}`}
        getSectionName={() => sectionName || 'Unknown Section'}
        projectName={projectName}
        sectionName={sectionName}
        projectId={projectId}
        sectionId={sectionId}
        onShowSectionPrompt={() => { }}
        hideSection={true}
        onReportPress={contractors.length > 0 ? () => setShowContractorPicker(true) : undefined}
      />

      {/* Page heading row — fixed above the list so it never scrolls away */}
      <View style={pageBannerStyles.headingRow}>
        <View style={{ flex: 1 }}>
          <Text style={pageBannerStyles.headingTitle}>Contractor Management</Text>
        </View>
        <TouchableOpacity
          style={pageBannerStyles.addBtn}
          activeOpacity={0.75}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowAddModal(true);
          }}
        >
          <Ionicons name="add" size={17} color="#fff" />
          <Text style={pageBannerStyles.addBtnText}>Add Contractor</Text>
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3A78B5" />
          <Text style={styles.loadingText}>Loading contractors...</Text>
        </View>
      ) : (
        <FlatList
          data={contractors}
          keyExtractor={(item: any) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="people-outline" size={56} color="#C4D8FC" />
              </View>
              <Text style={styles.emptyTitle}>No Contractors Yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the green banner above to add your first contractor.
              </Text>
            </View>
          }
          renderItem={({ item }) => renderContractCard(item)}
        />
      )}


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

      {/* Manage Contractor Modal */}
      <Modal
        visible={selectedContractorForManage !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedContractorForManage(null)}
      >
        <View style={mStyles.overlay}>
          <View style={mStyles.sheet}>
            <View style={mStyles.handle} />

            {/* Header */}
            <View style={mStyles.header}>
              <View style={{ flex: 1 }}>
                <Text style={mStyles.title} numberOfLines={1}>
                  {selectedContractorForManage?.contractType || 'Contract'}
                </Text>
                <Text style={mStyles.subtitle} numberOfLines={1}>
                  {selectedContractorForManage?.staffId
                    ? `${selectedContractorForManage.staffId.firstName} ${selectedContractorForManage.staffId.lastName}`
                    : 'Contractor'}
                </Text>
              </View>
              <TouchableOpacity style={mStyles.closeBtn} onPress={() => setSelectedContractorForManage(null)} activeOpacity={0.7}>
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Status + action row */}
            {selectedContractorForManage && (
              <View style={mStyles.actionRow}>
                <View style={[mStyles.statusPill, selectedContractorForManage.status === 'completed' ? mStyles.pillDone : mStyles.pillActive]}>
                  <View style={[mStyles.pillDot, { backgroundColor: selectedContractorForManage.status === 'completed' ? '#94A3B8' : '#16A34A' }]} />
                  <Text style={[mStyles.pillText, { color: selectedContractorForManage.status === 'completed' ? '#64748B' : '#15803D' }]}>
                    {selectedContractorForManage.status === 'completed' ? 'Completed' : 'Active'}
                  </Text>
                </View>
                <View style={{ flex: 1 }} />
                {selectedContractorForManage.status === 'completed' ? (
                  <>
                    <TouchableOpacity style={mStyles.ghostBtn} onPress={() => { setSelectedContractorForReport(selectedContractorForManage); setShowReportGenerator(true); }} activeOpacity={0.7}>
                      <Ionicons name="download-outline" size={14} color="#64748B" />
                      <Text style={mStyles.ghostBtnText}>Report</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={mStyles.ghostBtn} onPress={() => handleReactivateContract(selectedContractorForManage)} activeOpacity={0.7}>
                      <Text style={mStyles.ghostBtnText}>Reactivate</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity style={mStyles.solidBtn} onPress={() => handleCompleteContract(selectedContractorForManage)} activeOpacity={0.7}>
                    <Text style={mStyles.solidBtnText}>Mark Complete</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Tab bar */}
            <View style={mStyles.tabBar}>
              <TouchableOpacity
                style={[mStyles.tab, activeTab === 'payments' && mStyles.tabActive]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('payments'); }}
                activeOpacity={0.8}
              >
                <Text style={[mStyles.tabText, activeTab === 'payments' && mStyles.tabTextActive]}>Payments</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[mStyles.tab, activeTab === 'logs' && mStyles.tabActive]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('logs'); }}
                activeOpacity={0.8}
              >
                <Text style={[mStyles.tabText, activeTab === 'logs' && mStyles.tabTextActive]}>Work Logs</Text>
              </TouchableOpacity>
            </View>

            {/* Payments tab */}
            {activeTab === 'payments' ? (
              <View style={{ flex: 1 }}>
                {selectedContractorForManage && (() => {
                  const totalPaid = selectedContractorForManage.totalPaid || 0;
                  const remaining = selectedContractorForManage.totalAmount - totalPaid;
                  return (
                    <View style={mStyles.summaryStrip}>
                      <View style={mStyles.summaryItem}>
                        <Text style={mStyles.summaryLabel}>Budget</Text>
                        <Text style={mStyles.summaryValue}>{formatCurrency(selectedContractorForManage.totalAmount)}</Text>
                      </View>
                      <View style={mStyles.summaryDivider} />
                      <View style={mStyles.summaryItem}>
                        <Text style={mStyles.summaryLabel}>Paid</Text>
                        <Text style={[mStyles.summaryValue, totalPaid > 0 && { color: '#16A34A' }]}>{formatCurrency(totalPaid)}</Text>
                      </View>
                      <View style={mStyles.summaryDivider} />
                      <View style={mStyles.summaryItem}>
                        <Text style={mStyles.summaryLabel}>Remaining</Text>
                        <Text style={[mStyles.summaryValue, { color: remaining < 0 ? '#EF4444' : '#0F172A' }]}>{formatCurrency(remaining)}</Text>
                      </View>
                    </View>
                  );
                })()}

                {selectedContractorForManage?.status !== 'completed' && (
                  <TouchableOpacity
                    style={mStyles.recordBtn}
                    onPress={() => handleOpenPaymentForm(selectedContractorForManage)}
                    activeOpacity={0.85}
                  >
                    <Text style={mStyles.recordBtnText}>Record Payment</Text>
                    <Ionicons name="add" size={18} color="#fff" />
                  </TouchableOpacity>
                )}

                <FlatList
                  data={selectedContractorForManage?.payments || []}
                  keyExtractor={(_, index) => index.toString()}
                  contentContainerStyle={mStyles.listPad}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={mStyles.emptyWrap}>
                      <Text style={mStyles.emptyTitle}>No payments yet</Text>
                      <Text style={mStyles.emptyDesc}>Payments you record will appear here.</Text>
                    </View>
                  }
                  renderItem={({ item }) => (
                    <View style={mStyles.paymentRow}>
                      <View style={{ flex: 1 }}>
                        <View style={mStyles.rowTopLine}>
                          <Text style={mStyles.paymentType}>{item.paymentType || 'payment'}</Text>
                          <Text style={mStyles.rowDate}>{formatDate(item.paymentDate)}</Text>
                        </View>
                        {item.notes ? <Text style={mStyles.rowNote} numberOfLines={1}>{item.notes}</Text> : null}
                      </View>
                      <Text style={mStyles.rowAmount}>{formatCurrency(item.amount)}</Text>
                    </View>
                  )}
                />
              </View>
            ) : (
              /* Work Logs tab */
              loadingLabor ? (
                <View style={mStyles.loadingWrap}>
                  <ActivityIndicator size="large" color="#0F172A" />
                </View>
              ) : (
                <FlatList
                  data={laborEntries}
                  keyExtractor={(item) => item._id}
                  contentContainerStyle={mStyles.listPad}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={mStyles.emptyWrap}>
                      <Text style={mStyles.emptyTitle}>No work logs yet</Text>
                      <Text style={mStyles.emptyDesc}>Worker entries from this contractor will appear here.</Text>
                    </View>
                  }
                  renderItem={({ item }) => (
                    <View style={mStyles.logRow}>
                      <View style={{ flex: 1 }}>
                        <View style={mStyles.rowTopLine}>
                          <Text style={mStyles.logWorkerType}>{item.type}</Text>
                          <Text style={mStyles.rowDate}>{formatDate(item.addedAt)}</Text>
                        </View>
                        <Text style={mStyles.rowNote}>{item.count} workers · {formatCurrency(item.perLaborCost)} each</Text>
                      </View>
                      <Text style={mStyles.rowAmount}>{formatCurrency(item.totalCost)}</Text>
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
        <View style={pStyles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={pStyles.sheet}
          >
            <View style={pStyles.handle} />

            {/* Header */}
            <View style={pStyles.header}>
              <View style={{ flex: 1 }}>
                <Text style={pStyles.title}>Record Payment</Text>
                {currentContractorForPayment && (
                  <Text style={pStyles.subtitle}>
                    {currentContractorForPayment.contractType}
                    {currentContractorForPayment.staffId
                      ? `  ·  ${currentContractorForPayment.staffId.firstName} ${currentContractorForPayment.staffId.lastName}`
                      : ''}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={pStyles.closeBtn}
                onPress={() => {
                  setShowRecordPaymentModal(false);
                  setCurrentContractorForPayment(null);
                  setPaymentAmount('');
                  setPaymentNotes('');
                  setPaymentType('weekly');
                }}
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={pStyles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Large amount input */}
              <View style={pStyles.amountBox}>
                <Text style={pStyles.currencySign}>₹</Text>
                <TextInput
                  style={pStyles.amountInput}
                  placeholder="0"
                  placeholderTextColor="#CBD5E1"
                  keyboardType="numeric"
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                />
              </View>

              {/* Quick-fill chips */}
              {currentContractorForPayment && (
                <View style={pStyles.chipsRow}>
                  <TouchableOpacity
                    style={pStyles.chip}
                    activeOpacity={0.75}
                    onPress={() => {
                      const v = calculateOutstandingWorkValue(currentContractorForPayment);
                      setPaymentAmount(v.toString());
                      setPaymentNotes(`Payment for outstanding work — ${formatCurrency(v)}`);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={pStyles.chipLabel}>Outstanding</Text>
                    <Text style={pStyles.chipValue}>{formatCurrency(calculateOutstandingWorkValue(currentContractorForPayment))}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={pStyles.chip}
                    activeOpacity={0.75}
                    onPress={() => {
                      const v = currentContractorForPayment.totalAmount - (currentContractorForPayment.totalPaid || 0);
                      setPaymentAmount(v.toString());
                      setPaymentNotes(`Final payment — ${formatCurrency(v)}`);
                      setPaymentType('final');
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={pStyles.chipLabel}>Remaining</Text>
                    <Text style={pStyles.chipValue}>{formatCurrency(currentContractorForPayment.totalAmount - (currentContractorForPayment.totalPaid || 0))}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Payment type pills */}
              <Text style={pStyles.fieldLabel}>Payment type</Text>
              <View style={pStyles.typePills}>
                {['daily', 'weekly', 'monthly', 'advance', 'final'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[pStyles.typePill, paymentType === type && pStyles.typePillActive]}
                    activeOpacity={0.75}
                    onPress={() => { setPaymentType(type); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  >
                    <Text style={[pStyles.typePillText, paymentType === type && pStyles.typePillTextActive]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Notes */}
              <Text style={pStyles.fieldLabel}>Note  <Text style={{ color: '#CBD5E1', fontWeight: '400' }}>(optional)</Text></Text>
              <TextInput
                style={pStyles.notesInput}
                placeholder="Add a note about this payment…"
                placeholderTextColor="#CBD5E1"
                multiline
                numberOfLines={3}
                value={paymentNotes}
                onChangeText={setPaymentNotes}
                textAlignVertical="top"
              />

              <View style={{ height: 24 }} />
            </ScrollView>

            {/* Footer */}
            <View style={pStyles.footer}>
              <TouchableOpacity
                style={pStyles.cancelBtn}
                onPress={() => {
                  setShowRecordPaymentModal(false);
                  setCurrentContractorForPayment(null);
                  setPaymentAmount('');
                  setPaymentNotes('');
                  setPaymentType('weekly');
                }}
                disabled={recordingPayment}
              >
                <Text style={pStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[pStyles.submitBtn, recordingPayment && { opacity: 0.6 }]}
                onPress={handleRecordPaymentSubmit}
                disabled={recordingPayment}
                activeOpacity={0.85}
              >
                {recordingPayment
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Text style={pStyles.submitText}>Record Payment</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Contractor Picker Modal — checkbox multi-select */}
      <Modal
        visible={showContractorPicker}
        animationType="slide"
        transparent
        onRequestClose={() => { setShowContractorPicker(false); setSelectedForReport(new Set()); }}
      >
        <View style={pickerStyles.overlay}>
          <View style={pickerStyles.sheet}>
            <View style={pickerStyles.handle} />

            {/* Header */}
            <View style={pickerStyles.header}>
              <View>
                <Text style={pickerStyles.title}>Select Contractors</Text>
                <Text style={pickerStyles.subtitle}>
                  {selectedForReport.size === 0 ? 'Tap to select' : `${selectedForReport.size} selected`}
                </Text>
              </View>
              <TouchableOpacity style={pickerStyles.closeBtn} onPress={() => { setShowContractorPicker(false); setSelectedForReport(new Set()); }}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Select All row */}
            <TouchableOpacity style={pickerStyles.selectAllRow} activeOpacity={0.7} onPress={toggleSelectAll}>
              <View style={[pickerStyles.checkbox, allSelected && pickerStyles.checkboxChecked]}>
                {allSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={pickerStyles.selectAllText}>Select All ({contractors.length})</Text>
            </TouchableOpacity>

            <View style={pickerStyles.dividerLine} />

            {/* Individual contractor rows */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {contractors.map((c: any) => {
                const name = getStaffDisplayName(c);
                const checked = selectedForReport.has(c._id);
                const done = c.status === 'completed';
                const outstanding = Math.max(0, (c.usedAmount || 0) - (c.totalPaid || 0));
                return (
                  <TouchableOpacity
                    key={c._id}
                    style={[pickerStyles.contractorRow, checked && pickerStyles.contractorRowSelected]}
                    activeOpacity={0.75}
                    onPress={() => toggleContractorSelection(c._id)}
                  >
                    <View style={[pickerStyles.checkbox, checked && pickerStyles.checkboxChecked]}>
                      {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <View style={pickerStyles.avatar}>
                      <Text style={pickerStyles.avatarText}>{(c.contractType || 'C').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={pickerStyles.cardText}>
                      <View style={pickerStyles.nameRow}>
                        <Text style={pickerStyles.contractorName} numberOfLines={1}>{c.contractType || 'Contract'}</Text>
                        <View style={[pickerStyles.statusPill, done ? pickerStyles.statusDone : pickerStyles.statusActive]}>
                          <Text style={[pickerStyles.statusPillText, done ? pickerStyles.statusDoneText : pickerStyles.statusActiveText]}>
                            {done ? 'DONE' : 'ACTIVE'}
                          </Text>
                        </View>
                      </View>
                      <Text style={pickerStyles.contractorMeta}>
                        {name} · {formatCurrency(c.totalAmount || 0)} budget
                        {outstanding > 0 ? ` · ₹${formatCurrency(outstanding)} due` : ' · Settled'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <View style={{ height: 16 }} />
            </ScrollView>

            {/* Footer generate button */}
            <View style={pickerStyles.footer}>
              <TouchableOpacity
                style={[pickerStyles.generateBtn, selectedForReport.size === 0 && pickerStyles.generateBtnDisabled]}
                activeOpacity={0.85}
                disabled={selectedForReport.size === 0}
                onPress={generateReportDirectly}
              >
                <Ionicons name="document-text" size={18} color="#fff" />
                <Text style={pickerStyles.generateBtnText}>
                  Generate PDF{selectedForReport.size > 0 ? ` (${selectedForReport.size})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Generating Overlay */}
      {isGeneratingReport && (
        <View style={pickerStyles.generatingOverlay}>
          <View style={pickerStyles.generatingCard}>
            <Ionicons name="document-text" size={40} color="#3A78B5" />
            <Text style={pickerStyles.generatingTitle}>Generating PDF...</Text>
            <Text style={pickerStyles.generatingSubtitle}>Fetching work logs & building report</Text>
          </View>
        </View>
      )}

      {/* Single Contractor Report Generator Modal */}
      {showReportGenerator && (
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
      )}

      {/* Project-wide All Contractors Report */}
      {showProjectReport && (
        <ContractorReportGenerator
          visible={showProjectReport}
          onClose={() => setShowProjectReport(false)}
          contractorData={null}
          allContractors={contractors}
          projectId={projectId}
          projectName={projectName}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#EAF0FE',
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
    backgroundColor: '#295E94',
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
    backgroundColor: '#EAF0FE',
    borderRadius: 8,
    paddingVertical: 8,
    gap: 6,
  },
  cardEditBtnText: {
    color: '#295E94',
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
    borderColor: '#3A78B5',
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
    backgroundColor: '#EAF0FE',
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
    backgroundColor: '#3A78B5',
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
    backgroundColor: '#EAF0FE',
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
  
});

const cStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  identityBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    marginRight: 12,
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitial: {
    fontSize: 17,
    fontWeight: '700',
    color: '#334155',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  personName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  contractMeta: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  actionIcons: {
    flexDirection: 'row',
    gap: 14,
    paddingTop: 2,
  },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    minWidth: 32,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#F1F5F9',
    alignSelf: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  outstandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  outstandingLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  outstandingAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
});

const mStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '88%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    flexShrink: 0,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pillActive: { backgroundColor: '#F0FDF4' },
  pillDone:   { backgroundColor: '#F1F5F9' },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 12, fontWeight: '600' },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ghostBtnText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  solidBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#3A78B5',
  },
  solidBtnText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  tabTextActive: { color: '#0F172A' },
  summaryStrip: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryDivider: { width: 1, backgroundColor: '#E2E8F0', marginVertical: 4 },
  summaryLabel: { fontSize: 10, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: '#3A78B5',
    paddingVertical: 13,
    borderRadius: 12,
  },
  recordBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  listPad: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyWrap: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#334155' },
  emptyDesc: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 18 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  paymentType: { fontSize: 13, fontWeight: '700', color: '#0F172A', textTransform: 'capitalize' },
  logWorkerType: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  rowDate: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  rowNote: { fontSize: 12, color: '#94A3B8' },
  rowAmount: { fontSize: 15, fontWeight: '700', color: '#0F172A', flexShrink: 0 },
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
    backgroundColor: '#EAF0FE',
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
    backgroundColor: '#295E94',
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
    borderBottomColor: '#3A78B5',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabButtonText: {
    color: '#3A78B5',
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
    backgroundColor: '#3A78B5',
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

const pStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.5)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    flexShrink: 0,
  },
  body: {
    paddingHorizontal: 20,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 16,
  },
  currencySign: {
    fontSize: 32,
    fontWeight: '300',
    color: '#94A3B8',
    marginRight: 6,
    marginTop: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 40,
    fontWeight: '700',
    color: '#0F172A',
    padding: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  chip: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 3,
  },
  chipLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 10,
  },
  typePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
  },
  typePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  typePillActive: {
    backgroundColor: '#3A78B5',
    borderColor: '#3A78B5',
  },
  typePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  typePillTextActive: {
    color: '#FFFFFF',
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 88,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3A78B5',
    alignItems: 'center',
  },
  submitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,18,38,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Select All row
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3A78B5',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 8,
  },
  // Checkbox
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#3A78B5',
    borderColor: '#3A78B5',
  },
  // Contractor rows
  contractorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  contractorRowSelected: {
    backgroundColor: '#EAF0FE',
    borderColor: '#C4D8FC',
  },
  cardText: {
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF0FE',
    borderWidth: 1,
    borderColor: '#C4D8FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3A78B5',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  contractorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  contractorMeta: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusDone: {
    backgroundColor: '#E0E7FF',
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  statusActiveText: {
    color: '#15803D',
  },
  statusDoneText: {
    color: '#4338CA',
  },
  // Footer
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3A78B5',
    borderRadius: 14,
    paddingVertical: 15,
  },
  generateBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  generateBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  // Generating overlay
  generatingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(10,18,38,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  generatingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    width: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  generatingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  generatingSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
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
