import { domain } from '@/lib/domain';
import { getClientId } from '@/functions/clientId';
import { ProjectSection } from '@/types/project';
import { isAdmin, isStaff, StaffUser, useUser } from '@/hooks/useUser';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '@/utils/axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PDFReportGenerator } from '@/utils/pdfReportGenerator';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Enable LayoutAnimation on Android (no-op on the new architecture, harmless otherwise).
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const OPTION_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  material:          { icon: 'cube',           color: '#7C3AED', bg: '#FAF5FF', label: 'Material'           },
  contractor:        { icon: 'people',         color: '#16A34A', bg: '#F0FDF4', label: 'Contractor'         },
  equipmentCost:     { icon: 'hardware-chip',  color: '#2563EB', bg: '#EAF0FE', label: 'Equipment'          },
  otherCost:         { icon: 'cash',           color: '#E11D48', bg: '#FFF1F2', label: 'Other'              },
  report:            { icon: 'bar-chart',      color: '#F59E0B', bg: '#FEF0E3', label: 'Cost Report'        },
};

const MATERIAL_SUB_OPTIONS = [
  { key: 'available', icon: 'cube-outline',      color: '#7C3AED', bg: '#FAF5FF', label: 'Material Available', desc: 'View all imported materials' },
  { key: 'used',      icon: 'construct-outline', color: '#D97706', bg: '#FFFBEB', label: 'Material Used',      desc: 'View material consumption' },
  { key: 'analysis',  icon: 'bar-chart-outline', color: '#3A78B5', bg: '#EAF0FE', label: 'Analysis',           desc: 'Stock levels & cost breakdown PDF' },
];

const REPORT_SUB_OPTIONS = [
  { key: 'materialAnalysis', icon: 'cube-outline',         color: '#7C3AED', bg: '#FAF5FF', label: 'Material Analysis Report',  desc: 'Stock levels, costs & usage breakdown' },
  { key: 'equipmentCost',    icon: 'hardware-chip-outline', color: '#3A78B5', bg: '#EAF0FE', label: 'Equipment Cost Report',      desc: 'Equipment expenses & details' },
  { key: 'contractor',       icon: 'people-outline',        color: '#16A34A', bg: '#F0FDF4', label: 'Contractor Report',          desc: 'Labour & contractor summary' },
  { key: 'otherCost',        icon: 'cash-outline',          color: '#E11D48', bg: '#FFF1F2', label: 'Other Cost Report',          desc: 'Miscellaneous expenses' },
];

// ─── Report Generation Overlay ────────────────────────────────────────────────
const REPORT_STAGES = [
  'Collecting data…',
  'Analyzing records…',
  'Building layout…',
  'Finalizing report…',
];

const ReportGeneratingOverlay: React.FC<{ visible: boolean; label: string }> = ({ visible, label }) => {
  // Every animation here uses useNativeDriver: true — zero JS thread cost
  const spinAnim    = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(48)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current; // replaces progressAnim
  const [stageIdx, setStageIdx] = useState(0);

  useEffect(() => {
    if (!visible) {
      fadeAnim.setValue(0);
      slideAnim.setValue(48);
      shimmerAnim.setValue(0);
      spinAnim.stopAnimation();    spinAnim.setValue(0);
      pulseAnim.stopAnimation();   pulseAnim.setValue(1);
      shimmerAnim.stopAnimation();
      setStageIdx(0);
      return;
    }

    setStageIdx(0);

    // Entrance
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
    ]).start();

    // Icon spin — native driver
    const spin = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1300, easing: Easing.linear, useNativeDriver: true })
    );
    spin.start();

    // Ring pulse — native driver
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 750, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 750, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    pulse.start();

    // Shimmer slide — native driver (translateX, no JS thread cost unlike width)
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    );
    shimmer.start();

    // Stage text cycling — lightweight setState, not animation
    const iv = setInterval(() => setStageIdx(s => (s + 1) % REPORT_STAGES.length), 1100);

    return () => { spin.stop(); pulse.stop(); shimmer.stop(); clearInterval(iv); };
  }, [visible]);

  const rotate       = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const shimmerX     = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [-180, 280] });

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[rStyles.backdrop, { opacity: fadeAnim }]}>
        <Animated.View style={[rStyles.card, { transform: [{ translateY: slideAnim }] }]}>

          {/* Animated icon ring */}
          <Animated.View style={[rStyles.iconRing, { transform: [{ scale: pulseAnim }] }]}>
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Ionicons name="bar-chart" size={40} color="#3A78B5" />
            </Animated.View>
            <View style={rStyles.iconOrbitDot} />
          </Animated.View>

          <Text style={rStyles.title}>Generating Report</Text>
          <Text style={rStyles.subtitle}>{label}</Text>

          {/* Shimmer track — all native driver, no JS thread cost */}
          <View style={rStyles.progressTrack}>
            <View style={rStyles.progressBase} />
            <Animated.View style={[rStyles.shimmerLine, { transform: [{ translateX: shimmerX }] }]} />
          </View>

          {/* Stage text */}
          <Text style={rStyles.stageText}>{REPORT_STAGES[stageIdx]}</Text>

          {/* Step dots */}
          <View style={rStyles.dotsRow}>
            {REPORT_STAGES.map((_, i) => (
              <View key={i} style={[rStyles.dot, stageIdx === i && rStyles.dotActive]} />
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const getSectionIcon = (type: string, isCompleted: boolean = false) => {
  if (isCompleted) return 'checkmark-circle';
  switch (type?.toLowerCase()) {
    case 'building':
    case 'buildings': return 'business';
    case 'rowhouse':  return 'home';
    default:          return 'grid';
  }
};

type SectionOption = {
  key: string;
  label: string;
  icon: string;
  onPress: () => void;
};

// ─── Section Accordion Card ────────────────────────────────────────────────────
const SectionAccordionItem: React.FC<{
  section: ProjectSection;
  index: number;
  isExpanded: boolean;
  isCompleted: boolean;
  isLoadingCompletion: boolean;
  options: SectionOption[];
  onToggle: () => void;
}> = ({ section, index, isExpanded, isCompleted, isLoadingCompletion, options, onToggle }) => {
  const chevron  = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(chevron, {
      toValue: isExpanded ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  const rotate = chevron.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const statusColor = isCompleted ? '#16A34A' : '#3A78B5';
  const statusBg    = isCompleted ? '#F0FDF4' : '#EAF0FE';
  const accentColor = isCompleted ? '#22C55E' : '#3A78B5';

  return (
    <Animated.View style={[styles.sectionCard, { transform: [{ scale: scaleAnim }] }]}>
      {/* Solid accent strip on left — hidden when expanded */}
      {!isExpanded && (
        <View style={[styles.sectionAccentStrip, { backgroundColor: accentColor }]} />
      )}

      {/* Card header */}
      <TouchableOpacity
        style={styles.sectionHeaderRow}
        activeOpacity={0.85}
        onPress={handlePress}
      >
        {/* Icon */}
        <View style={[styles.sectionIconWrap, { backgroundColor: statusBg }]}>
          {isLoadingCompletion ? (
            <ActivityIndicator size="small" color={statusColor} />
          ) : (
            <Ionicons
              name={getSectionIcon(section.type, isCompleted) as any}
              size={22}
              color={statusColor}
            />
          )}
        </View>

        {/* Info */}
        <View style={styles.sectionInfo}>
          <Text style={styles.sectionName} numberOfLines={1}>{section.name}</Text>
          <View style={styles.sectionMeta}>
            <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusPillText, { color: statusColor }]}>
                {isCompleted ? 'Completed' : 'In Progress'}
              </Text>
            </View>
          </View>
        </View>

        {/* Chevron */}
        <Animated.View style={[styles.chevronWrap, { transform: [{ rotate }] }]}>
          <View style={styles.chevronCircle}>
            <Ionicons name="chevron-down" size={16} color="#3A78B5" />
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* Expanded options */}
      {isExpanded && (
        <View style={styles.optionsContainer}>
          <View style={styles.optionsDivider} />
          <View style={styles.optionsGrid}>
            {options.map((option) => {
              const cfg = OPTION_CONFIG[option.key] || { icon: 'ellipsis-horizontal', color: '#3A78B5', bg: '#EAF0FE', label: option.label };
              return (
                <TouchableOpacity
                  key={option.key}
                  style={styles.optionChip}
                  activeOpacity={0.75}
                  onPress={option.onPress}
                >
                  <View style={[styles.optionChipIcon, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
                  </View>
                  <Text style={styles.optionChipLabel}>{cfg.label}</Text>
                  <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </Animated.View>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const ProjectSections = () => {
  const params = useLocalSearchParams();
  const { id, name, sectionData, materialAvailable, materialUsed, contractorId, contractorType, userId } = params;

  const [sections, setSections]       = useState<ProjectSection[]>([]);
  const [showAddModal, setShowAddModal]   = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionType, setNewSectionType] = useState('building');
  const [isAdding, setIsAdding]           = useState(false);
  const [projectCompleted, setProjectCompleted]   = useState(false);
  const [isUpdatingProjectCompletion, setIsUpdatingProjectCompletion] = useState(false);
  const [sectionCompletions, setSectionCompletions] = useState<{ [key: string]: boolean }>({});
  const [isLoadingSectionCompletions, setIsLoadingSectionCompletions] = useState(false);
  const [generatingStockReport, setGeneratingStockReport] = useState(false);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [resolvedClientId, setResolvedClientId]   = useState<string>('');
  // Centered popup for Material / Cost Report sub-options
  const [optionPopup, setOptionPopup] = useState<{ type: 'material' | 'report'; section: ProjectSection } | null>(null);
  const [contractorList, setContractorList]             = useState<any[]>([]);
  const [showContractorPicker, setShowContractorPicker] = useState(false);
  const [selectedForReport, setSelectedForReport]       = useState<Set<string>>(new Set());
  const [isGeneratingReport, setIsGeneratingReport]     = useState(false);
  const [reportGenerating, setReportGenerating]   = useState(false);
  const [reportGeneratingLabel, setReportGeneratingLabel] = useState('');

  // Permission helpers
  const { user } = useUser();
  const userIsAdmin = isAdmin(user);
  const staffPermissions: string[] = isStaff(user) ? ((user as StaffUser).permissions || []) : [];
  const hasPermission = (permission: string) => userIsAdmin || staffPermissions.includes(permission);

  // FAB pulse
  const fabPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fabPulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(fabPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    (async () => {
      try { setResolvedClientId((await getClientId()) || ''); } catch { setResolvedClientId(''); }
    })();
  }, []);

  useEffect(() => {
    console.log('🔍 [DEBUG] projectCompleted state changed to:', projectCompleted);
  }, [projectCompleted, name]);

  useEffect(() => {
    console.log('🔍 [DEBUG] sectionCompletions state changed:', sectionCompletions);
  }, [sectionCompletions, sections]);

  useEffect(() => {
    if (sectionData) {
      const parsedData = JSON.parse(Array.isArray(sectionData) ? sectionData[0] : sectionData);
      setSections(parsedData);
    }
  }, [sectionData]);

  useEffect(() => {
    if (sections && sections.length > 0 && id) fetchSectionCompletionStatus();
  }, [sections, id]);

  useEffect(() => {
    console.log('Project sections received materials:', {
      materialAvailableCount: materialAvailable ? JSON.parse(Array.isArray(materialAvailable) ? materialAvailable[0] : materialAvailable).length : 0,
      materialUsedCount: materialUsed ? JSON.parse(Array.isArray(materialUsed) ? materialUsed[0] : materialUsed).length : 0,
    });
  }, [materialAvailable, materialUsed]);

  useEffect(() => {
    if (id) fetchProjectCompletionStatus();
  }, [id]);

  // ── Navigation helpers ──────────────────────────────────────────────────────
  const goToMaterials = (section: ProjectSection, tab: 'imported' | 'used') => {
    router.push({
      pathname: tab === 'used' ? '../material-used' : '../material-available',
      params: {
        projectId: id as string,
        projectName: name as string,
        sectionId: section._id || section.sectionId,
        sectionName: section.name,
        materialAvailable: materialAvailable as string,
        materialUsed: materialUsed as string,
      },
    });
  };

  const goToContractor = (section: ProjectSection) => {
    if (contractorId && contractorType && userId) {
      router.push({
        pathname: '../labor',
        params: {
          projectId: id as string, projectName: name as string,
          sectionId: section._id || section.sectionId, sectionName: section.name,
          contractorId: contractorId as string, contractorType: contractorType as string, userId: userId as string,
        },
      });
      return;
    }
    router.push({
      pathname: '../contractor',
      params: {
        projectId: id as string, projectName: name as string,
        sectionId: section._id || section.sectionId, sectionName: section.name,
        clientId: resolvedClientId,
      },
    });
  };

  const goToEquipment = (section: ProjectSection) => {
    router.push({
      pathname: '../equipment',
      params: {
        projectId: id as string, projectName: name as string,
        sectionId: section._id || section.sectionId, sectionName: section.name,
      },
    });
  };

  const goToOtherCost = () => {
    router.push({ pathname: '../other-cost', params: { projectId: id as string, projectName: name as string } });
  };

  const goToCostSummary = () => {
    router.push({ pathname: '../cost-summary', params: { projectId: id as string, projectName: name as string } });
  };

  const handleReportOption = async (key: string, section: ProjectSection) => {
    setOptionPopup(null);

    const opt = REPORT_SUB_OPTIONS.find(o => o.key === key);
    setReportGeneratingLabel(opt?.label ?? 'Report');

    await new Promise(r => setTimeout(r, 120));
    setReportGenerating(true);

    switch (key) {
      case 'materialAnalysis': {
        await handleGenerateStockReport();
        setReportGenerating(false);
        break;
      }
      case 'equipmentCost': {
        try {
          const res = await apiClient.get('/api/equipment', {
            params: {
              projectId: id as string,
              projectSectionId: section._id || section.sectionId,
              status: 'active'
            }
          });
          const equipmentList = res.data?.data || [];
          if (equipmentList.length === 0) {
            toast.error('No equipment costs recorded for this section.');
            setReportGenerating(false);
            break;
          }
          
          let userName = 'Admin';
          try {
            const userDetailsString = await AsyncStorage.getItem('user');
            if (userDetailsString) {
              const ud = JSON.parse(userDetailsString);
              userName = ud.firstName && ud.lastName ? `${ud.firstName} ${ud.lastName}` : ud.firstName || ud.name || ud.username || 'Admin';
            }
          } catch {}

          const pdfGen = new PDFReportGenerator({}, { name: userName });
          const sectionTitle = section?.name ? `${name} - ${section.name}` : (name as string || 'Project');
          await pdfGen.generateEquipmentCostReport(equipmentList, sectionTitle);
        } catch (error: any) {
          toast.error(error?.message || 'Failed to generate equipment report. Please try again.');
        } finally {
          setReportGenerating(false);
        }
        break;
      }
      case 'otherCost': {
        try {
          const res = await apiClient.get('/api/otherCost', {
            params: {
              entityType: 'project',
              entityId: id as string,
              useStandalone: true,
            }
          });
          const rawEntries = res.data?.data?.otherCostEntries || [];
          if (rawEntries.length === 0) {
            toast.error('No other costs recorded for this project.');
            setReportGenerating(false);
            break;
          }
          
          let userName = 'Admin';
          try {
            const userDetailsString = await AsyncStorage.getItem('user');
            if (userDetailsString) {
              const ud = JSON.parse(userDetailsString);
              userName = ud.firstName && ud.lastName ? `${ud.firstName} ${ud.lastName}` : ud.firstName || ud.name || ud.username || 'Admin';
            }
          } catch {}

          const pdfGen = new PDFReportGenerator({}, { name: userName });
          await pdfGen.generateOtherCostReport(rawEntries, (name as string || 'Project'));
        } catch (error: any) {
          toast.error(error?.message || 'Failed to generate other cost report. Please try again.');
        } finally {
          setReportGenerating(false);
        }
        break;
      }
      case 'contractor': {
        try {
          // Wait another 300ms after overlay mounts so its entrance animation
          // finishes on the UI thread before the network call starts.
          await new Promise(r => setTimeout(r, 300));
          const res = await apiClient.get('/api/contractor', {
            params: { projectId: id as string, includeCompleted: true },
          });
          setContractorList((res.data as any).data || []);
        } catch {
          setContractorList([]);
        } finally {
          setReportGenerating(false);
          setSelectedForReport(new Set());
          setTimeout(() => setShowContractorPicker(true), 320);
        }
        break;
      }
    }
  };

  // ── Contractor picker helpers ────────────────────────────────────────────────
  const getContractorDisplayName = (c: any) => {
    const s = c.staffId;
    if (!s) return 'Contractor';
    if (typeof s === 'string') return s;
    return [s.firstName, s.lastName].filter(Boolean).join(' ') || 'Contractor';
  };

  const allPickerSelected = contractorList.length > 0 && selectedForReport.size === contractorList.length;
  const toggleSelectAll = () => setSelectedForReport(
    allPickerSelected ? new Set() : new Set(contractorList.map((c: any) => c._id))
  );
  const toggleContractorSelection = (id_: string) => setSelectedForReport(prev => {
    const next = new Set(prev);
    next.has(id_) ? next.delete(id_) : next.add(id_);
    return next;
  });

  const fmtCurrency = (v: number) => `₹${v.toLocaleString('en-IN')}`;
  const fmtDateRpt  = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }); } catch { return d; }
  };

  const paymentRowsHTML = (payments: any[]) => {
    if (!payments?.length) return '';
    const byDate: Record<string, any[]> = {};
    payments.forEach(p=>{ const k=new Date(p.paymentDate).toDateString();(byDate[k]=byDate[k]||[]).push(p); });
    return Object.entries(byDate).sort(([a],[b])=>new Date(a).getTime()-new Date(b).getTime()).map(([date,ps])=>{
      const dayTotal=ps.reduce((s,p)=>s+p.amount,0);
      return `<tr style="background:#059669;"><td colspan="3" style="padding:10px;color:white;font-weight:600;font-size:13px;">💰 ${fmtDateRpt(date)} — Paid: ${fmtCurrency(dayTotal)}</td></tr>`
        +ps.map(p=>`<tr style="background:#f0fdf4;"><td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;"><span style="background:#dcfce7;color:#166534;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;">${(p.paymentType||'payment').toUpperCase()}</span></td><td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;">${p.notes||'Payment recorded'}</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:right;font-weight:600;color:#059669;font-size:12px;">${fmtCurrency(p.amount)}</td></tr>`).join('');
    }).join('');
  };

  const buildReportHTML = (selected: any[]) => {
    const now = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' } as any);
    const totalAmount = selected.reduce((s,c)=>s+(c.totalAmount||0),0);
    const totalPaid   = selected.reduce((s,c)=>s+(c.totalPaid||0),0);
    const css = `body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:20px;background:#fff;color:#1e293b;line-height:1.4;}table{width:100%;border-collapse:collapse;margin-bottom:16px;background:white;box-shadow:0 1px 3px rgba(0,0,0,0.1);}th{background:#374151;color:white;padding:10px 12px;text-align:left;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;}td{padding:10px;border:1px solid #e2e8f0;font-size:13px;}.no-data{text-align:center;padding:30px;color:#64748b;font-style:italic;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:16px;}.section-title{font-size:15px;font-weight:700;color:#1e293b;margin:20px 0 10px 0;padding:10px 14px;background:#f1f5f9;border-left:4px solid #3A78B5;border-radius:4px;}.summary-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:16px;}.summary-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;text-align:center;}.summary-card h3{margin:0 0 6px 0;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;}.summary-card p{margin:0;font-size:16px;font-weight:700;color:#1e293b;}.footer{margin-top:40px;padding:16px;background:#f8fafc;border-radius:8px;text-align:center;font-size:12px;color:#64748b;}`;
    const sections = selected.map(c=>{
      const staffName = getContractorDisplayName(c);
      const contractName = c.contractType || 'Contract';
      return `<div style="margin-bottom:36px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:#3A78B5;padding:16px 20px;color:white;">
          <div style="font-size:18px;font-weight:700;">${contractName}</div>
          <div style="font-size:13px;opacity:0.85;margin-top:3px;">${staffName}</div>
        </div>
        <div style="padding:16px 20px;">
          <div class="summary-grid"><div class="summary-card"><h3>Total Amount</h3><p>${fmtCurrency(c.totalAmount||0)}</p></div><div class="summary-card"><h3>Paid Amount</h3><p style="color:#059669;">${fmtCurrency(c.totalPaid||0)}</p></div></div>
          <div class="section-title">Transaction Details</div>
          ${(c.payments||[]).length?`<table><thead><tr><th>Type</th><th>Notes</th><th style="text-align:right;">Amount</th></tr></thead><tbody>${paymentRowsHTML(c.payments)}</tbody></table>`:'<div class="no-data">No transactions recorded.</div>'}
        </div></div>`;
    }).join('');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Contractor Report</title><style>${css}.main-header{text-align:center;margin-bottom:24px;padding:20px;background:#3A78B5;color:white;border-radius:12px;}.main-header h1{margin:0 0 6px 0;font-size:24px;font-weight:700;}.main-header p{margin:3px 0;font-size:13px;opacity:0.9;}</style></head><body>
      <div class="main-header"><h1>Contractor Report</h1><p><strong>${name as string}</strong></p><p>${selected.length} Contractor${selected.length!==1?'s':''} selected</p><p>Generated: ${now}</p></div>
      ${selected.length>1?`<div style="margin-bottom:24px;"><h2 style="font-size:16px;font-weight:700;margin-bottom:12px;">Project Summary</h2><div class="summary-grid"><div class="summary-card"><h3>Total Amount</h3><p>${fmtCurrency(totalAmount)}</p></div><div class="summary-card"><h3>Paid Amount</h3><p style="color:#059669;">${fmtCurrency(totalPaid)}</p></div></div></div>`:''}
      ${sections}
      <div class="footer"><p><strong>Construction Management System</strong></p><p>Generated: ${new Date().toISOString()}</p></div>
    </body></html>`;
  };

  const generateReportDirectly = async () => {
    const selected = contractorList.filter((c: any) => selectedForReport.has(c._id));
    if (!selected.length) return;
    setShowContractorPicker(false);
    setIsGeneratingReport(true);
    try {
      const html = buildReportHTML(selected);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Contractor Report — ${name as string}`, UTI: 'com.adobe.pdf' });
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

  const getSectionOptions = (section: ProjectSection): SectionOption[] => {
    const options: SectionOption[] = [];
    if (hasPermission('addMaterial') || hasPermission('addMaterialUsage'))
      options.push({ key: 'material',      label: 'Material',    icon: 'cube-outline',          onPress: () => setOptionPopup({ type: 'material', section }) });
    if (hasPermission('contractor'))
      options.push({ key: 'contractor',    label: 'Contractor',  icon: 'people-outline',        onPress: () => goToContractor(section) });
    if (hasPermission('addEquipmentCost'))
      options.push({ key: 'equipmentCost', label: 'Equipment',   icon: 'hardware-chip-outline', onPress: () => goToEquipment(section) });
    if (hasPermission('addOtherCost'))
      options.push({ key: 'otherCost',     label: 'Other',       icon: 'cash-outline',          onPress: () => goToOtherCost() });
    if (hasPermission('generateReport'))
      options.push({ key: 'report',        label: 'Cost Report', icon: 'bar-chart-outline',     onPress: () => setOptionPopup({ type: 'report', section }) });
    return options;
  };

  const handleMaterialSubOption = (key: string, section: ProjectSection) => {
    setOptionPopup(null);
    if (key === 'available') {
      goToMaterials(section, 'imported');
    } else if (key === 'used') {
      goToMaterials(section, 'used');
    } else if (key === 'analysis') {
      router.push({
        pathname: '../analytics/mini-sections-analytics',
        params: {
          projectId: id as string,
          projectName: name as string,
          sectionId: section._id || section.sectionId,
          sectionName: section.name,
          materialUsed: materialUsed as string,
          materialAvailable: materialAvailable as string,
        },
      });
    }
  };

  const getFilteredMaterialSubOptions = () => MATERIAL_SUB_OPTIONS.filter(opt => {
    if (opt.key === 'available') return hasPermission('addMaterial');
    if (opt.key === 'used')      return hasPermission('addMaterialUsage');
    if (opt.key === 'analysis')  return hasPermission('generateReport');
    return userIsAdmin;
  });

  const toggleSection = (sectionKey: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(240, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
    setExpandedSectionId(prev => (prev === sectionKey ? null : sectionKey));
  };

  // ── Add section ─────────────────────────────────────────────────────────────
  const handleAddSection = async () => {
    if (!newSectionName.trim()) { toast.error('Please enter a section name'); return; }
    setIsAdding(true);
    try {
      const payload = { projectId: id, name: newSectionName.trim() };
      let res;
      if      (newSectionType === 'building')  res = await apiClient.post(`/api/building`, payload);
      else if (newSectionType === 'rowhouse')  res = await apiClient.post(`/api/rowHouse`, payload);
      else                                     res = await apiClient.post(`/api/otherSection`, payload);

      if (res && (res.status === 200 || res.status === 201)) {
        let newSectionData: any = null;
        const rd = res.data as Record<string, any>;
        if (rd._id || rd.sectionId)   newSectionData = rd;
        else if (rd.section)          newSectionData = rd.section;
        else if (rd.data)             newSectionData = rd.data;
        else if (rd.building)         newSectionData = rd.building;
        else if (rd.rowHouse)         newSectionData = rd.rowHouse;
        else if (rd.otherSection)     newSectionData = rd.otherSection;

        const formattedSection: ProjectSection = {
          _id: newSectionData?._id || `temp-${Date.now()}`,
          sectionId: newSectionData?.sectionId || newSectionData?._id || `temp-${Date.now()}`,
          name: newSectionData?.name || newSectionName.trim(),
          type: newSectionType === 'building' ? 'Buildings' : (newSectionType === 'rowhouse' ? 'rowhouse' : 'other'),
          ...(newSectionData || {}),
        };
        setSections([...sections, formattedSection]);
        setShowAddModal(false);
        setNewSectionName('');
        setNewSectionType('building');
        toast.success('Section added successfully');
      } else {
        toast.error('Failed to add section');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to add section');
    } finally {
      setIsAdding(false);
    }
  };

  // ── Completion helpers ───────────────────────────────────────────────────────
  const isValidMongoId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

  const fetchSectionCompletionStatus = async () => {
    if (!sections || sections.length === 0 || !id) return;
    setIsLoadingSectionCompletions(true);
    const completionStates: { [key: string]: boolean } = {};
    for (const section of sections) {
      const sectionId = section.sectionId || section._id;
      if (!sectionId || !isValidMongoId(sectionId)) { completionStates[sectionId] = false; continue; }
      try {
        const response = await apiClient.get(
          `${domain}/api/completion?updateType=project-section&id=${sectionId}&projectId=${id}`,
          { timeout: 10000 }
        );
        const rd = response.data as { success?: boolean; data?: { isCompleted?: boolean } };
        completionStates[sectionId] = rd.success && rd.data ? Boolean(rd.data.isCompleted) : false;
      } catch { completionStates[sectionId] = false; }
    }
    setSectionCompletions(completionStates);
    setIsLoadingSectionCompletions(false);
  };

  const buildSpecsKey = (specs: any) => {
    if (!specs || typeof specs !== 'object' || Object.keys(specs).length === 0) return '';
    return Object.keys(specs).sort().filter(k => specs[k] !== null && specs[k] !== undefined && specs[k] !== '').map(k => `${k}:${specs[k]}`).join('|');
  };

  const fetchMaterialStockRows = async () => {
    const clientId = await getClientId();
    const projectId = id as string;
    if (!clientId || !projectId) throw new Error('Missing project or client information');
    const REPORT_LIMIT = 5000;
    const qs = Object.entries({ projectId, clientId, page: 1, limit: REPORT_LIMIT, sortBy: 'createdAt', sortOrder: 'desc' })
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
    const [avRes, usedRes] = await Promise.all([apiClient.get(`/api/material?${qs}`), apiClient.get(`/api/material-usage?${qs}`)]);
    const avData   = avRes.data   as any;
    const usedData = usedRes.data as any;
    const avList   = avData.MaterialAvailable   || avData.materials   || [];
    const usedList = usedData.MaterialUsed || usedData.materials || [];
    const grouped: { [key: string]: { name: string; unit: string; specs: Record<string, any>; currentlyAvailable: number; totalUsed: number; importedCost: number; purchasers: Set<string> } } = {};
    const getGroup = (n: string, u: string, s: any) => {
      const key = `${n}-${u}-${buildSpecsKey(s)}`;
      if (!grouped[key]) grouped[key] = { name: n, unit: u, specs: s || {}, currentlyAvailable: 0, totalUsed: 0, importedCost: 0, purchasers: new Set() };
      return grouped[key];
    };
    const resolveCost = (m: any, qty: number) => m.totalCost !== undefined && m.totalCost !== null ? Number(m.totalCost) : Number(m.perUnitCost ?? m.cost ?? 0) * qty;
    avList.forEach((m: any)   => { const qty = Number(m.qnt || 0); const g = getGroup(m.name, m.unit, m.specs); g.currentlyAvailable += qty; g.importedCost += resolveCost(m, qty); });
    usedList.forEach((m: any) => { const qty = Number(m.qnt || 0); const g = getGroup(m.name, m.unit, m.specs); g.totalUsed += qty;          g.importedCost += resolveCost(m, qty); });
    try {
      const { domain } = await import('@/lib/domain');
      const { getAuthHeaders } = await import('@/utils/axiosConfig');
      const actRes = await fetch(`${domain}/api/materialActivity?projectId=${projectId}&activity=imported&clientId=${clientId}&limit=5000`, { method: 'GET', headers: { ...getAuthHeaders() } });
      if (actRes.ok) {
        const actData = await actRes.json();
        const activities = actData.data?.activities || actData.activities || [];
        activities.forEach((act: any) => {
          const userName = act.user?.fullName;
          if (!userName) return;
          (act.materials || []).forEach((m: any) => { const key = `${m.name}-${m.unit}-${buildSpecsKey(m.specs)}`; if (grouped[key]) grouped[key].purchasers.add(userName); });
        });
      }
    } catch { /* non-fatal */ }
    return Object.values(grouped).map(g => {
      const totalImported = g.currentlyAvailable + g.totalUsed;
      return { name: g.name, specs: g.specs, unit: g.unit, totalImported, totalUsed: g.totalUsed, currentlyAvailable: g.currentlyAvailable, perUnitCost: totalImported > 0 ? g.importedCost / totalImported : 0, totalCost: g.importedCost, purchasedBy: Array.from(g.purchasers) };
    });
  };

  const handleGenerateStockReport = async () => {
    if (generatingStockReport) return;
    setGeneratingStockReport(true);
    try {
      const rows = await fetchMaterialStockRows();
      if (rows.length === 0) { toast.error('No materials found to generate a stock report'); return; }
      let userName = 'Admin';
      try {
        const userDetailsString = await AsyncStorage.getItem('user');
        if (userDetailsString) {
          const ud = JSON.parse(userDetailsString);
          userName = ud.firstName && ud.lastName ? `${ud.firstName} ${ud.lastName}` : ud.firstName || ud.name || ud.username || 'Admin';
        }
      } catch {}
      const pdfGen = new PDFReportGenerator({}, { name: userName });
      await pdfGen.generateMaterialStockReport(rows, (name as string) || 'Project');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to generate stock report. Please try again.');
    } finally {
      setGeneratingStockReport(false);
    }
  };

  const toggleProjectCompletion = async () => {
    if (isUpdatingProjectCompletion) return;
    if (!id || !isValidMongoId(id as string)) { toast.error('Invalid project ID.'); return; }
    setIsUpdatingProjectCompletion(true);
    try {
      const response = await apiClient.patch(`/api/completion`, { updateType: 'project', id }, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 });
      const rd = response.data as { success?: boolean; data?: { isCompleted?: boolean }; message?: string };
      if (rd.success) {
        const newStatus = rd.data?.isCompleted;
        setProjectCompleted(typeof newStatus === 'boolean' ? newStatus : !projectCompleted);
        toast.success(rd.message || `Project ${newStatus ? 'completed' : 'reopened'} successfully`);
      } else throw new Error(rd.message || 'Failed to update project completion');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Unknown error';
      toast.error(`Failed to update project completion: ${msg}`);
    } finally {
      setIsUpdatingProjectCompletion(false);
    }
  };

  const fetchProjectCompletionStatus = async () => {
    if (!id || !isValidMongoId(id as string)) { setProjectCompleted(false); return; }
    try {
      const response = await apiClient.get(`${domain}/api/completion?updateType=project&id=${id}`, { timeout: 10000 });
      const rd = response.data as { success?: boolean; data?: { isCompleted?: boolean } };
      setProjectCompleted(rd.success && rd.data ? Boolean(rd.data.isCompleted) : false);
    } catch { setProjectCompleted(false); }
  };

  const completedCount = Object.values(sectionCompletions).filter(Boolean).length;
  const totalCount     = sections.length;
  const progressPct    = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* ── Header (white, flat) ────────────────────────────────────────────── */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
            {/* Back */}
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={22} color="#475569" />
            </TouchableOpacity>

            {/* Title block */}
            <View style={styles.headerCenter}>
              <Text style={styles.headerProjectName} numberOfLines={1}>{name}</Text>
              <Text style={styles.headerSubtitle}>Project Sections</Text>
            </View>

            {/* Add section */}
            <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.reportBtn} activeOpacity={0.8}>
              <Ionicons name="add" size={22} color="#3A78B5" />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          {totalCount > 0 && (
            <View style={styles.progressBlock}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>{completedCount} of {totalCount} sections completed</Text>
                <Text style={styles.progressPct}>{Math.round(progressPct)}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
              </View>
            </View>
          )}
        </SafeAreaView>
      </View>

      {/* ── Section List ─────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary pills */}
        {totalCount > 0 && (
          <View style={styles.summaryRow}>
            <View style={[styles.summaryPill, { backgroundColor: '#EAF0FE' }]}>
              <Ionicons name="layers" size={14} color="#3A78B5" />
              <Text style={[styles.summaryPillText, { color: '#3A78B5' }]}>{totalCount} Sections</Text>
            </View>
            <View style={[styles.summaryPill, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
              <Text style={[styles.summaryPillText, { color: '#16A34A' }]}>{completedCount} Done</Text>
            </View>
            <View style={[styles.summaryPill, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="time" size={14} color="#D97706" />
              <Text style={[styles.summaryPillText, { color: '#D97706' }]}>{totalCount - completedCount} Pending</Text>
            </View>
          </View>
        )}

        {sections && sections.length > 0 ? (
          sections.map((section, index) => {
            const sectionId  = section.sectionId || section._id;
            const isCompleted = sectionCompletions[sectionId] || false;
            const isLoadingCompletion = isLoadingSectionCompletions && !Object.prototype.hasOwnProperty.call(sectionCompletions, sectionId);
            const sectionKey = sectionId || String(index);
            const isExpanded = expandedSectionId === sectionKey;
            return (
              <SectionAccordionItem
                key={section._id || index}
                section={section}
                index={index}
                isExpanded={isExpanded}
                isCompleted={isCompleted}
                isLoadingCompletion={isLoadingCompletion}
                options={getSectionOptions(section)}
                onToggle={() => toggleSection(sectionKey)}
              />
            );
          })
        ) : (
          /* Empty state */
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="folder-open" size={48} color="#3A78B5" />
            </View>
            <Text style={styles.emptyTitle}>No Sections Yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first section to start organizing this project's materials and work areas.
            </Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.85}>
              <View style={styles.emptyAddBtnInner}>
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.emptyAddBtnText}>Add First Section</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Cost Summary entry — full project cost overview */}
        {(userIsAdmin || hasPermission('generateReport')) && (
          <TouchableOpacity style={summaryBtnStyles.card} activeOpacity={0.8} onPress={goToCostSummary}>
            <View style={summaryBtnStyles.iconWrap}>
              <Ionicons name="pie-chart" size={22} color="#3A78B5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={summaryBtnStyles.title}>Cost Summary</Text>
              <Text style={summaryBtnStyles.desc}>Materials, contractors, equipment & other costs</Text>
            </View>
            <View style={summaryBtnStyles.chevronCircle}>
              <Ionicons name="chevron-forward" size={16} color="#3A78B5" />
            </View>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── FAB ──────────────────────────────────────────────────────────────── */}
      {sections.length > 0 && (
        <Animated.View style={[styles.fab, { transform: [{ scale: fabPulse }] }]}>
          <TouchableOpacity onPress={() => setShowAddModal(true)} activeOpacity={0.85} style={styles.fabInner}>
            <View style={styles.fabSolid}>
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Animated report generation overlay */}
      <ReportGeneratingOverlay visible={reportGenerating} label={reportGeneratingLabel} />

      {/* ── Centered popup: Material / Cost Report sub-options ───────────────── */}
      <Modal
        visible={optionPopup !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setOptionPopup(null)}
      >
        <TouchableOpacity
          style={popupStyles.backdrop}
          activeOpacity={1}
          onPress={() => setOptionPopup(null)}
        >
          <TouchableOpacity activeOpacity={1} style={popupStyles.card} onPress={() => {}}>
            {optionPopup && (() => {
              const isMat = optionPopup.type === 'material';
              const cfg   = OPTION_CONFIG[isMat ? 'material' : 'report'];
              const items = isMat ? getFilteredMaterialSubOptions() : REPORT_SUB_OPTIONS;
              const onSelect = isMat
                ? (key: string) => handleMaterialSubOption(key, optionPopup.section)
                : (key: string) => handleReportOption(key, optionPopup.section);
              return (
                <>
                  <View style={popupStyles.header}>
                    <View style={[popupStyles.headerIcon, { backgroundColor: cfg.bg }]}>
                      <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={popupStyles.title}>{cfg.label}</Text>
                      <Text style={popupStyles.subtitle} numberOfLines={1}>{optionPopup.section.name}</Text>
                    </View>
                    <TouchableOpacity style={popupStyles.closeBtn} onPress={() => setOptionPopup(null)}>
                      <Ionicons name="close" size={20} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  {items.map((sub, i) => (
                    <View key={sub.key}>
                      {i > 0 && <View style={popupStyles.sep} />}
                      <TouchableOpacity
                        style={popupStyles.item}
                        activeOpacity={0.75}
                        onPress={() => onSelect(sub.key)}
                      >
                        <View style={[popupStyles.itemIcon, { backgroundColor: sub.bg }]}>
                          <Ionicons name={sub.icon as any} size={18} color={sub.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={popupStyles.itemLabel}>{sub.label}</Text>
                          <Text style={popupStyles.itemDesc}>{sub.desc}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={15} color="#CBD5E1" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              );
            })()}
          </TouchableOpacity>
        </TouchableOpacity>
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

            <TouchableOpacity style={pickerStyles.selectAllRow} activeOpacity={0.7} onPress={toggleSelectAll}>
              <View style={[pickerStyles.checkbox, allPickerSelected && pickerStyles.checkboxChecked]}>
                {allPickerSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={pickerStyles.selectAllText}>Select All ({contractorList.length})</Text>
            </TouchableOpacity>

            <View style={pickerStyles.dividerLine} />

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {contractorList.map((c: any) => {
                const staffName = getContractorDisplayName(c);
                const contractName = c.contractType || 'Contract';
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
                      <Text style={pickerStyles.avatarText}>{contractName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={pickerStyles.cardText}>
                      <View style={pickerStyles.nameRow}>
                        <Text style={pickerStyles.contractorName} numberOfLines={1}>{contractName}</Text>
                        <View style={[pickerStyles.statusPill, done ? pickerStyles.statusDone : pickerStyles.statusActive]}>
                          <Text style={[pickerStyles.statusPillText, done ? pickerStyles.statusDoneText : pickerStyles.statusActiveText]}>
                            {done ? 'DONE' : 'ACTIVE'}
                          </Text>
                        </View>
                      </View>
                      <Text style={pickerStyles.contractorMeta}>
                        {staffName} · {fmtCurrency(c.totalAmount || 0)} budget
                        {outstanding > 0 ? ` · ${fmtCurrency(outstanding)} due` : ' · Settled'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <View style={{ height: 16 }} />
            </ScrollView>

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

      {/* Report generating overlay */}
      {isGeneratingReport && (
        <View style={pickerStyles.generatingOverlay}>
          <View style={pickerStyles.generatingCard}>
            <Ionicons name="document-text" size={40} color="#3A78B5" />
            <Text style={pickerStyles.generatingTitle}>Generating PDF...</Text>
            <Text style={pickerStyles.generatingSubtitle}>Fetching work logs & building report</Text>
          </View>
        </View>
      )}

      {/* ── Add Section Modal ─────────────────────────────────────────────────── */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Modal handle */}
            <View style={styles.modalHandle} />

            {/* Modal header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add New Section</Text>
                <Text style={styles.modalSubtitle}>Organize your project into sections</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Name input */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Section Name <Text style={{ color: '#EF4444' }}>*</Text></Text>
              <View style={styles.modalInputWrap}>
                <Ionicons name="bookmark-outline" size={18} color="#3A78B5" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g., Tower A, Building 1, Wing B"
                  placeholderTextColor="#94A3B8"
                  value={newSectionName}
                  onChangeText={setNewSectionName}
                  autoFocus
                />
              </View>
            </View>

            {/* Type selector */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Section Type</Text>
              <View style={styles.typeRow}>
                {[
                  { key: 'building',  label: 'Building',  icon: 'business'  },
                  { key: 'other',     label: 'Other',     icon: 'grid'      },
                ].map(t => (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.typeChip, newSectionType === t.key && styles.typeChipActive]}
                    onPress={() => setNewSectionType(t.key)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={t.icon as any} size={18} color={newSectionType === t.key ? '#3A78B5' : '#64748B'} />
                    <Text style={[styles.typeChipText, newSectionType === t.key && styles.typeChipTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddModal(false)} disabled={isAdding}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalAddBtn, isAdding && { opacity: 0.6 }]} onPress={handleAddSection} disabled={isAdding}>
                <View style={styles.modalAddBtnInner}>
                  {isAdding
                    ? <ActivityIndicator size="small" color="#FFFFFF" />
                    : <><Ionicons name="add-circle" size={18} color="#FFFFFF" /><Text style={styles.modalAddText}>Add Section</Text></>}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header:             { backgroundColor: '#FFFFFF', paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerInner:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  backBtn:            { width: 40, height: 40, borderRadius: 13, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  headerCenter:       { flex: 1 },
  headerProjectName:  { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  headerSubtitle:     { fontSize: 12.5, color: '#64748B', marginTop: 2, fontWeight: '500' },
  reportBtn:          { width: 40, height: 40, borderRadius: 13, backgroundColor: '#EAF0FE', borderWidth: 1, borderColor: '#E0E7FF', justifyContent: 'center', alignItems: 'center' },

  // Progress
  progressBlock:      { paddingHorizontal: 16, marginTop: 14 },
  progressLabelRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  progressLabel:      { fontSize: 12, color: '#64748B', fontWeight: '500' },
  progressPct:        { fontSize: 12, fontWeight: '800', color: '#3A78B5' },
  progressTrack:      { height: 8, backgroundColor: '#EAF0FE', borderRadius: 99, overflow: 'hidden' },
  progressFill:       { height: '100%', borderRadius: 99, backgroundColor: '#3A78B5' },

  // Scroll
  scrollView:         { flex: 1 },
  scrollContent:      { padding: 16, paddingTop: 20 },

  // Summary pills
  summaryRow:         { flexDirection: 'row', gap: 8, marginBottom: 16 },
  summaryPill:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99 },
  summaryPillText:    { fontSize: 12, fontWeight: '700' },

  // Section card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEF2F8',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
    flexDirection: 'column',
  },
  sectionAccentStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  sectionHeaderRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingLeft: 20, paddingRight: 16, gap: 12 },
  indexBadge:         { width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  indexBadgeText:     { fontSize: 12, fontWeight: '800' },
  sectionIconWrap:    { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  sectionInfo:        { flex: 1 },
  sectionName:        { fontSize: 16, fontWeight: '700', color: '#0F172A', letterSpacing: -0.2 },
  sectionMeta:        { flexDirection: 'row', marginTop: 5, gap: 6 },
  statusPill:         { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  statusDot:          { width: 6, height: 6, borderRadius: 3 },
  statusPillText:     { fontSize: 11, fontWeight: '700' },
  chevronWrap:        { width: 32, height: 32 },
  chevronCircle:      { width: 32, height: 32, borderRadius: 11, backgroundColor: '#EAF0FE', justifyContent: 'center', alignItems: 'center' },

  // Options
  optionsContainer:   { paddingHorizontal: 16, paddingBottom: 14 },
  optionsDivider:     { height: 1, backgroundColor: '#F1F5F9', marginBottom: 10 },
  optionsGrid:        { gap: 8 },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEF2F8',
  },
  optionChipIcon:     { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  optionChipLabel:    { flex: 1, fontSize: 14, fontWeight: '600', color: '#334155' },

  // Empty state
  emptyState:         { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyIconWrap:      { width: 100, height: 100, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 20, backgroundColor: '#EAF0FE', borderWidth: 1, borderColor: '#E0E7FF' },
  emptyTitle:         { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 8, letterSpacing: -0.3 },
  emptySubtitle:      { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, maxWidth: '80%', marginBottom: 28 },
  emptyAddBtn:        { borderRadius: 14, overflow: 'hidden' },
  emptyAddBtnInner:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 28, backgroundColor: '#3A78B5' },
  emptyAddBtnText:    { fontSize: 15, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },

  // Completion button
  completionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  completionBtnDone:      { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' },
  completionBtnText:      { fontSize: 15, fontWeight: '700', color: '#3A78B5' },
  completionBtnTextDone:  { color: '#16A34A' },

  // FAB
  fab:      { position: 'absolute', bottom: 32, right: 24 },
  fabInner: { borderRadius: 20, overflow: 'hidden', shadowColor: '#3A78B5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 10 },
  fabSolid: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#3A78B5' },

  // Modal
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  modalSheet:     { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12 },
  modalHandle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 20 },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalTitle:     { fontSize: 20, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  modalSubtitle:  { fontSize: 13, color: '#64748B', marginTop: 3 },
  modalCloseBtn:  { width: 34, height: 34, borderRadius: 11, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  modalInputGroup: { marginBottom: 20 },
  modalInputLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  modalInputWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4 },
  modalInput:      { flex: 1, fontSize: 15, color: '#0F172A', paddingVertical: 12 },
  typeRow:         { flexDirection: 'row', gap: 10 },
  typeChip: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
  },
  typeChipActive:     { backgroundColor: '#EAF0FE', borderColor: '#3A78B5' },
  typeChipText:       { fontSize: 12, fontWeight: '600', color: '#64748B' },
  typeChipTextActive: { color: '#3A78B5' },
  // Report sub-options
  reportOptionsGrid:   { gap: 10, marginBottom: 8 },
  reportOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF2F8',
  },
  reportOptionIcon:    { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  reportOptionText:    { flex: 1 },
  reportOptionLabel:   { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  reportOptionDesc:    { fontSize: 12, color: '#64748B', fontWeight: '500' },

  modalActions:    { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelBtn:  { flex: 1, paddingVertical: 15, backgroundColor: '#F8FAFC', borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  modalAddBtn:     { flex: 1.5, borderRadius: 14, overflow: 'hidden' },
  modalAddBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, backgroundColor: '#3A78B5' },
  modalAddText:    { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});

// ─── Material sub-dropdown styles ─────────────────────────────────────────────
const popupStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,18,38,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 26,
  },
  card: {
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 4,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title:    { fontSize: 16.5, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 },
  subtitle: { fontSize: 12.5, color: '#64748B', marginTop: 1, fontWeight: '500' },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sep: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  itemDesc:  { fontSize: 11.5, color: '#94A3B8', marginTop: 1 },
});

// ─── Cost Summary entry card styles ───────────────────────────────────────────
const summaryBtnStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EAF0FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  desc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#EAF0FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProjectSections;

// ─── Report Overlay Styles ─────────────────────────────────────────────────────
const rStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,18,38,0.70)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.18,
    shadowRadius: 48,
    elevation: 24,
  },
  iconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EAF0FE',
    borderWidth: 3,
    borderColor: '#C4D8FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
    position: 'relative',
  },
  iconOrbitDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F59E0B',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 19,
  },
  progressTrack: {
    width: '100%',
    height: 9,
    backgroundColor: '#EAF0FE',
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBase: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: '100%',
    backgroundColor: '#C4D8FC',
    borderRadius: 99,
  },
  shimmerLine: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: 80,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 99,
  },
  stageText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 20,
    letterSpacing: 0.1,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  dotActive: {
    width: 26,
    backgroundColor: '#3A78B5',
  },
});

const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(10,18,38,0.55)', justifyContent: 'flex-end' },
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
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 18 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A', letterSpacing: -0.4 },
  subtitle: { fontSize: 13, color: '#64748B', fontWeight: '500', marginTop: 3 },
  closeBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  selectAllRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4 },
  selectAllText: { fontSize: 14, fontWeight: '700', color: '#3A78B5' },
  dividerLine: { height: 1, backgroundColor: '#E2E8F0', marginBottom: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  checkboxChecked: { backgroundColor: '#3A78B5', borderColor: '#3A78B5' },
  contractorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 14, marginBottom: 8 },
  contractorRowSelected: { backgroundColor: '#EAF0FE', borderColor: '#C4D8FC' },
  cardText: { flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EAF0FE', borderWidth: 1, borderColor: '#C4D8FC', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#3A78B5' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' },
  contractorName: { fontSize: 14, fontWeight: '700', color: '#0F172A', flex: 1 },
  contractorMeta: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  statusPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  statusActive: { backgroundColor: '#DCFCE7' },
  statusDone: { backgroundColor: '#E0E7FF' },
  statusPillText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  statusActiveText: { color: '#15803D' },
  statusDoneText: { color: '#4338CA' },
  footer: { paddingTop: 12, borderTopWidth: 1, borderColor: '#E2E8F0' },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3A78B5', borderRadius: 14, paddingVertical: 15 },
  generateBtnDisabled: { backgroundColor: '#CBD5E1' },
  generateBtnText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  generatingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,18,38,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  generatingCard: { backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', gap: 12, width: 240, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 20 },
  generatingTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  generatingSubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', fontWeight: '500' },
});
