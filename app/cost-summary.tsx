import ContractorReportGenerator from '@/app/components/contractor/ContractorReportGenerator';
import CostSummarySkeleton from '@/components/CostSummarySkeleton';
import { isAdmin, useUser } from '@/hooks/useUser';
import { getClientId } from '@/functions/clientId';
import apiClient from '@/utils/axiosConfig';
import { PDFReportGenerator } from '@/utils/pdfReportGenerator';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Types ─────────────────────────────────────────────────────────────────────
interface BreakdownRow {
  name: string;
  sub?: string;
  amount: number;
}

interface CategorySummary {
  key: 'material' | 'contractor' | 'equipment' | 'other';
  label: string;
  icon: string;
  total: number;
  count: number;
  rows: BreakdownRow[];
}

// Single theme accent (matches the shared Header / app-wide primary blue) —
// every category uses the same color, only the icon glyph differs.
const THEME_COLOR = '#3A78B5';
const THEME_BG = '#EAF0FE';

const CATEGORY_META = {
  material:   { label: 'Materials',   icon: 'cube' },
  contractor: { label: 'Contractors', icon: 'people' },
  equipment:  { label: 'Equipment',   icon: 'hardware-chip' },
  other:      { label: 'Other Costs', icon: 'cash' },
} as const;

const fmtCurrency = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`;

const getUserName = async (): Promise<string> => {
  try {
    const userDetailsString = await AsyncStorage.getItem('user');
    if (userDetailsString) {
      const ud = JSON.parse(userDetailsString);
      return ud.firstName && ud.lastName ? `${ud.firstName} ${ud.lastName}` : ud.firstName || ud.name || ud.username || 'Admin';
    }
  } catch { /* non-fatal */ }
  return 'Admin';
};

// ─── Category Card ─────────────────────────────────────────────────────────────
const CategoryCard: React.FC<{
  category: CategorySummary;
  expanded: boolean;
  onToggle: () => void;
  onGenerateReport: () => void;
  isGeneratingReport: boolean;
}> = ({ category, expanded, onToggle, onGenerateReport, isGeneratingReport }) => {
  return (
    <View style={cardStyles.card}>
      {/* Card header */}
      <View style={cardStyles.headerRow}>
        <View style={cardStyles.iconWrap}>
          <Ionicons name={category.icon as any} size={22} color={THEME_COLOR} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={cardStyles.label}>{category.label}</Text>
          <Text style={cardStyles.countText}>
            {category.count} {category.count === 1 ? 'entry' : 'entries'}
          </Text>
        </View>
        <Text style={cardStyles.amount}>{fmtCurrency(category.total)}</Text>
      </View>

      {/* Actions */}
      <View style={cardStyles.actionsRow}>
        <TouchableOpacity style={cardStyles.actionBtn} activeOpacity={0.7} onPress={onToggle}>
          <Text style={cardStyles.actionBtnText}>{expanded ? 'Hide Details' : 'View Details'}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color={THEME_COLOR} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[cardStyles.actionBtn, cardStyles.reportBtn]}
          activeOpacity={0.7}
          onPress={onGenerateReport}
          disabled={isGeneratingReport}
        >
          {isGeneratingReport ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="document-text-outline" size={15} color="#FFFFFF" />
              <Text style={cardStyles.reportBtnText}>Generate Report</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Breakdown rows */}
      {expanded && (
        <View style={cardStyles.breakdown}>
          {category.rows.length === 0 ? (
            <Text style={cardStyles.emptyRowText}>No entries recorded yet.</Text>
          ) : (
            category.rows.map((row, i) => (
              <View key={`${row.name}-${i}`} style={[cardStyles.breakdownRow, i > 0 && cardStyles.breakdownRowBorder]}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={cardStyles.rowName} numberOfLines={1}>{row.name}</Text>
                  {row.sub ? <Text style={cardStyles.rowSub} numberOfLines={1}>{row.sub}</Text> : null}
                </View>
                <Text style={cardStyles.rowAmount}>{fmtCurrency(row.amount)}</Text>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
const CostSummary = () => {
  const params = useLocalSearchParams();
  const projectId = params.projectId as string;
  const projectName = (params.projectName as string) || 'Project';

  // Cost figures are admin-only. The entry button on project-sections is already
  // hidden for staff — this guard also bounces anyone reaching the screen directly.
  const { user, loading: userLoading } = useUser();
  const userIsAdmin = isAdmin(user);

  useEffect(() => {
    if (userLoading) return;
    if (!userIsAdmin) {
      toast.error('Cost Summary is available to admins only.');
      router.back();
    }
  }, [userLoading, userIsAdmin]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [budget, setBudget] = useState<number>(0);
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);
  const [showContractorReport, setShowContractorReport] = useState(false);

  // Raw records kept alongside the display summaries — the PDF generators need
  // the original shapes, not the flattened breakdown rows shown on screen.
  const [materialStockRows, setMaterialStockRows] = useState<any[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [otherCostEntries, setOtherCostEntries] = useState<any[]>([]);
  const [contractorList, setContractorList] = useState<any[]>([]);

  // ── Fetchers (each isolated so one failure doesn't blank the whole page) ────
  const buildSpecsKey = (specs: any) => {
    if (!specs || typeof specs !== 'object' || Object.keys(specs).length === 0) return '';
    return Object.keys(specs).sort().filter(k => specs[k] !== null && specs[k] !== undefined && specs[k] !== '').map(k => `${k}:${specs[k]}`).join('|');
  };

  const fetchMaterialsSummary = async (): Promise<CategorySummary> => {
    const meta = CATEGORY_META.material;
    const base: CategorySummary = { key: 'material', ...meta, total: 0, count: 0, rows: [] };
    try {
      const clientId = await getClientId();
      if (!clientId) return base;
      const qs = { projectId, clientId, page: 1, limit: 5000, sortBy: 'createdAt', sortOrder: 'desc' };
      const [avRes, usedRes] = await Promise.all([
        apiClient.get('/api/material', { params: qs }),
        apiClient.get('/api/material-usage', { params: qs }),
      ]);
      const avList: any[] = (avRes.data as any).MaterialAvailable || (avRes.data as any).materials || [];
      const usedList: any[] = (usedRes.data as any).MaterialUsed || (usedRes.data as any).materials || [];

      const resolveCost = (m: any, qty: number) =>
        m.totalCost !== undefined && m.totalCost !== null
          ? Number(m.totalCost)
          : Number(m.perUnitCost ?? m.cost ?? 0) * qty;

      // Group by name+unit+specs — same grouping the material stock PDF report uses
      const grouped: { [key: string]: { name: string; unit: string; specs: any; currentlyAvailable: number; totalUsed: number; importedCost: number } } = {};
      const getGroup = (n: string, u: string, s: any) => {
        const key = `${n}-${u}-${buildSpecsKey(s)}`;
        if (!grouped[key]) grouped[key] = { name: n, unit: u, specs: s || {}, currentlyAvailable: 0, totalUsed: 0, importedCost: 0 };
        return grouped[key];
      };
      avList.forEach((m: any) => { const qty = Number(m.qnt || 0); const g = getGroup(m.name, m.unit, m.specs); g.currentlyAvailable += qty; g.importedCost += resolveCost(m, qty); });
      usedList.forEach((m: any) => { const qty = Number(m.qnt || 0); const g = getGroup(m.name, m.unit, m.specs); g.totalUsed += qty; g.importedCost += resolveCost(m, qty); });

      const stockRows = Object.values(grouped).map(g => {
        const totalImported = g.currentlyAvailable + g.totalUsed;
        return {
          name: g.name,
          specs: g.specs,
          unit: g.unit,
          totalImported,
          totalUsed: g.totalUsed,
          currentlyAvailable: g.currentlyAvailable,
          perUnitCost: totalImported > 0 ? g.importedCost / totalImported : 0,
          totalCost: g.importedCost,
        };
      });
      setMaterialStockRows(stockRows);

      const rows: BreakdownRow[] = stockRows
        .slice()
        .sort((a, b) => b.totalCost - a.totalCost)
        .map(g => ({ name: g.name, sub: `${g.totalImported} ${g.unit}`, amount: g.totalCost }));

      return { ...base, total: rows.reduce((s, r) => s + r.amount, 0), count: rows.length, rows };
    } catch {
      return base;
    }
  };

  const fetchContractorsSummary = async (): Promise<CategorySummary> => {
    const meta = CATEGORY_META.contractor;
    const base: CategorySummary = { key: 'contractor', ...meta, total: 0, count: 0, rows: [] };
    try {
      const res = await apiClient.get('/api/contractor', { params: { projectId } });
      const list: any[] = (res.data as any)?.data || [];
      setContractorList(list);

      const rows: BreakdownRow[] = list
        .map((c) => {
          const s = c.staffId;
          const staffName = s && typeof s === 'object'
            ? [s.firstName, s.lastName].filter(Boolean).join(' ') || 'Contractor'
            : 'Contractor';
          return {
            name: staffName,
            sub: `${c.contractType || 'Contract'} • Paid ${fmtCurrency(c.totalPaid || 0)}`,
            amount: c.usedAmount || 0,
          };
        })
        .sort((a, b) => b.amount - a.amount);
      return { ...base, total: rows.reduce((s, r) => s + r.amount, 0), count: rows.length, rows };
    } catch {
      return base;
    }
  };

  const fetchEquipmentSummary = async (): Promise<CategorySummary> => {
    const meta = CATEGORY_META.equipment;
    const base: CategorySummary = { key: 'equipment', ...meta, total: 0, count: 0, rows: [] };
    try {
      const res = await apiClient.get('/api/equipment', { params: { projectId, status: 'active' } });
      const list: any[] = (res.data as any)?.data || [];
      setEquipmentList(list);

      // Group by equipment type so repeated entries roll up into one row
      const grouped: { [type: string]: { qty: number; cost: number; category: string } } = {};
      list.forEach((e) => {
        if (!grouped[e.type]) grouped[e.type] = { qty: 0, cost: 0, category: e.category || '' };
        grouped[e.type].qty += Number(e.quantity || 0);
        grouped[e.type].cost += Number(e.totalCost || 0);
      });
      const rows: BreakdownRow[] = Object.entries(grouped)
        .map(([type, g]) => ({ name: type, sub: g.category, amount: g.cost }))
        .sort((a, b) => b.amount - a.amount);
      return { ...base, total: rows.reduce((s, r) => s + r.amount, 0), count: list.length, rows };
    } catch {
      return base;
    }
  };

  const fetchOtherCostSummary = async (): Promise<CategorySummary> => {
    const meta = CATEGORY_META.other;
    const base: CategorySummary = { key: 'other', ...meta, total: 0, count: 0, rows: [] };
    try {
      const res = await apiClient.get('/api/otherCost', {
        params: { entityType: 'project', entityId: projectId, useStandalone: true },
      });
      const entries: any[] = (res.data as any)?.data?.otherCostEntries || [];
      setOtherCostEntries(entries);

      const rows: BreakdownRow[] = entries
        .map((e) => ({
          name: e.title || e.name || 'Expense',
          sub: e.description && e.description !== (e.title || e.name) ? e.description : undefined,
          amount: Number(e.amount || 0),
        }))
        .sort((a, b) => b.amount - a.amount);
      return { ...base, total: rows.reduce((s, r) => s + r.amount, 0), count: rows.length, rows };
    } catch {
      return base;
    }
  };

  const fetchBudget = async () => {
    try {
      const clientId = await getClientId();
      if (!clientId || !projectId) return;
      const res = await apiClient.get(`/api/project/${projectId}`, { params: { clientId } });
      const rd: any = res.data;
      const project = rd?.project || rd?.data?.project || rd?.data || rd;
      setBudget(Number(project?.budget || 0));
    } catch {
      setBudget(0);
    }
  };

  const loadSummary = async () => {
    const [materials, contractors, equipment, other] = await Promise.all([
      fetchMaterialsSummary(),
      fetchContractorsSummary(),
      fetchEquipmentSummary(),
      fetchOtherCostSummary(),
      fetchBudget(),
    ]);
    setCategories([materials, contractors, equipment, other]);
  };

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      await loadSummary();
      setLoading(false);
    })();
  }, [projectId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSummary();
    setRefreshing(false);
  };

  const toggleExpand = (key: string) => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
    );
    setExpandedKey(prev => (prev === key ? null : key));
  };

  const grandTotal = categories.reduce((s, c) => s + c.total, 0);
  const budgetPct = budget > 0 ? Math.min(100, (grandTotal / budget) * 100) : 0;
  const isOverBudget = budget > 0 && grandTotal > budget;

  // ── Report generation ────────────────────────────────────────────────────────
  const handleGenerateReport = async (key: CategorySummary['key']) => {
    if (generatingKey) return;

    if (key === 'contractor') {
      if (contractorList.length === 0) {
        toast.error('No contractors recorded for this project.');
        return;
      }
      setShowContractorReport(true);
      return;
    }

    setGeneratingKey(key);
    try {
      const userName = await getUserName();
      const pdfGen = new PDFReportGenerator({}, { name: userName });

      if (key === 'material') {
        if (materialStockRows.length === 0) { toast.error('No materials found to generate a report.'); return; }
        await pdfGen.generateMaterialStockReport(materialStockRows, projectName);
      } else if (key === 'equipment') {
        if (equipmentList.length === 0) { toast.error('No equipment costs recorded for this project.'); return; }
        await pdfGen.generateEquipmentCostReport(equipmentList, projectName);
      } else if (key === 'other') {
        if (otherCostEntries.length === 0) { toast.error('No other costs recorded for this project.'); return; }
        await pdfGen.generateOtherCostReport(otherCostEntries, projectName);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to generate report. Please try again.');
    } finally {
      setGeneratingKey(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header — white flat, matches Project Sections header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color="#475569" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>Cost Summary</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{projectName}</Text>
        </View>
        <View style={styles.headerIconWrap}>
          <Ionicons name="pie-chart" size={20} color={THEME_COLOR} />
        </View>
      </View>

      {loading || userLoading || !userIsAdmin ? (
        <View style={styles.scrollContent}>
          <CostSummarySkeleton />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME_COLOR]} tintColor={THEME_COLOR} />
          }
        >
          {/* Grand total card */}
          <View style={styles.totalCard}>
            <View style={styles.totalIconWrap}>
              <Ionicons name="wallet" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.totalLabel}>Total Project Cost</Text>
            <Text style={styles.totalAmount}>{fmtCurrency(grandTotal)}</Text>

            {budget > 0 ? (
              <>
                <View style={styles.budgetBarTrack}>
                  <View
                    style={[
                      styles.budgetBarFill,
                      { width: `${budgetPct}%`, backgroundColor: isOverBudget ? '#FCA5A5' : '#FFFFFF' },
                    ]}
                  />
                </View>
                <Text style={styles.totalSub}>
                  {budgetPct.toFixed(1)}% of {fmtCurrency(budget)} budget
                  {isOverBudget ? ` • ${fmtCurrency(grandTotal - budget)} over` : ''}
                </Text>
              </>
            ) : (
              <Text style={styles.totalSub}>Materials • Contractors • Equipment • Other</Text>
            )}
          </View>

          {/* Category cards */}
          {categories.map((cat) => (
            <CategoryCard
              key={cat.key}
              category={cat}
              expanded={expandedKey === cat.key}
              onToggle={() => toggleExpand(cat.key)}
              onGenerateReport={() => handleGenerateReport(cat.key)}
              isGeneratingReport={generatingKey === cat.key}
            />
          ))}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* Contractor report — reuses the same picker/generator used on the Contractor page */}
      {showContractorReport && (
        <ContractorReportGenerator
          visible={showContractorReport}
          onClose={() => setShowContractorReport(false)}
          contractorData={null}
          allContractors={contractorList}
          projectId={projectId}
          projectName={projectName}
        />
      )}
    </SafeAreaView>
  );
};

export default CostSummary;

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 1,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME_BG,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  scrollContent: {
    padding: 16,
  },
  totalCard: {
    backgroundColor: THEME_COLOR,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: THEME_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  totalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  totalAmount: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  totalSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 8,
  },
  budgetBarTrack: {
    width: '100%',
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginTop: 14,
    overflow: 'hidden',
  },
  budgetBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME_BG,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  countText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  amount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: THEME_BG,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME_COLOR,
  },
  reportBtn: {
    backgroundColor: THEME_COLOR,
  },
  reportBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  breakdown: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  breakdownRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  rowName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  rowSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  rowAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  emptyRowText: {
    fontSize: 13,
    color: '#94A3B8',
    paddingVertical: 12,
    textAlign: 'center',
  },
});
