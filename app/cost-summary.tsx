import ContractorReportGenerator from '@/app/components/contractor/ContractorReportGenerator';
import CostSummarySkeleton from '@/components/CostSummarySkeleton';
import { isAdmin, useUser } from '@/hooks/useUser';
import { getClientId } from '@/functions/clientId';
import apiClient from '@/utils/axiosConfig';
import { fetchMaterialStockRows, MaterialStockRow } from '@/utils/materialStockReport';
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

// Single theme accent (app-wide primary blue) — every category uses the same
// color, only the icon glyph differs.
const THEME_COLOR = '#3A78B5';
const THEME_BG = '#EAF0FE';

const CATEGORY_META = {
  material:   { label: 'Materials',   icon: 'cube',          color: THEME_COLOR, bg: THEME_BG },
  contractor: { label: 'Contractors', icon: 'people',        color: THEME_COLOR, bg: THEME_BG },
  equipment:  { label: 'Equipment',   icon: 'hardware-chip', color: THEME_COLOR, bg: THEME_BG },
  other:      { label: 'Other Costs', icon: 'cash',          color: THEME_COLOR, bg: THEME_BG },
} as const;

const COLLAPSED_ROW_LIMIT = 6;

const fmtCurrency = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`;

const fmtPct = (part: number, whole: number) => {
  if (whole <= 0 || part <= 0) return '0%';
  const pct = (part / whole) * 100;
  return pct < 1 ? '<1%' : `${Math.round(pct)}%`;
};

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
  grandTotal: number;
  expanded: boolean;
  onToggle: () => void;
  onGenerateReport: () => void;
  isGeneratingReport: boolean;
}> = ({ category, grandTotal, expanded, onToggle, onGenerateReport, isGeneratingReport }) => {
  const meta = CATEGORY_META[category.key];
  const [showAll, setShowAll] = useState(false);
  const share = grandTotal > 0 ? (category.total / grandTotal) * 100 : 0;
  const visibleRows = showAll ? category.rows : category.rows.slice(0, COLLAPSED_ROW_LIMIT);
  const hiddenCount = category.rows.length - visibleRows.length;

  return (
    <View style={cardStyles.card}>
      <TouchableOpacity style={cardStyles.headerRow} activeOpacity={0.75} onPress={onToggle}>
        <View style={[cardStyles.iconWrap, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon as any} size={21} color={meta.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={cardStyles.label}>{category.label}</Text>
          <Text style={cardStyles.countText}>
            {category.count} {category.count === 1 ? 'entry' : 'entries'} · {fmtPct(category.total, grandTotal)} of total
          </Text>
        </View>
        <View style={cardStyles.amountCol}>
          <Text style={cardStyles.amount}>{fmtCurrency(category.total)}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
        </View>
      </TouchableOpacity>

      {/* Share of the project total */}
      <View style={cardStyles.shareTrack}>
        <View style={[cardStyles.shareFill, { width: `${share}%`, backgroundColor: meta.color }]} />
      </View>

      {expanded && (
        <View style={cardStyles.breakdown}>
          {category.rows.length === 0 ? (
            <Text style={cardStyles.emptyRowText}>No entries recorded yet.</Text>
          ) : (
            <>
              {visibleRows.map((row, i) => (
                <View key={`${row.name}-${i}`} style={[cardStyles.breakdownRow, i > 0 && cardStyles.breakdownRowBorder]}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={cardStyles.rowName} numberOfLines={1}>{row.name}</Text>
                    {row.sub ? <Text style={cardStyles.rowSub} numberOfLines={1}>{row.sub}</Text> : null}
                  </View>
                  <Text style={cardStyles.rowAmount}>{fmtCurrency(row.amount)}</Text>
                </View>
              ))}
              {category.rows.length > COLLAPSED_ROW_LIMIT && (
                <TouchableOpacity style={cardStyles.showAllBtn} activeOpacity={0.7} onPress={() => setShowAll(v => !v)}>
                  <Text style={[cardStyles.showAllText, { color: meta.color }]}>
                    {showAll ? 'Show less' : `Show ${hiddenCount} more`}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <TouchableOpacity
            style={[cardStyles.reportBtn, { borderColor: meta.color }]}
            activeOpacity={0.75}
            onPress={onGenerateReport}
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? (
              <ActivityIndicator size="small" color={meta.color} />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={16} color={meta.color} />
                <Text style={[cardStyles.reportBtnText, { color: meta.color }]}>Generate PDF Report</Text>
              </>
            )}
          </TouchableOpacity>
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
  const [materialStockRows, setMaterialStockRows] = useState<MaterialStockRow[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [otherCostEntries, setOtherCostEntries] = useState<any[]>([]);
  const [contractorList, setContractorList] = useState<any[]>([]);

  // ── Fetchers (each isolated so one failure doesn't blank the whole page) ────
  const fetchMaterialsSummary = async (): Promise<CategorySummary> => {
    const meta = CATEGORY_META.material;
    const base: CategorySummary = { key: 'material', ...meta, total: 0, count: 0, rows: [] };
    try {
      const clientId = await getClientId();
      if (!clientId) return base;
      // Same loader as the material screen's stock report, so the PDF (incl.
      // vendors) matches it exactly.
      const stockRows = await fetchMaterialStockRows(projectId, clientId);
      setMaterialStockRows(stockRows);

      const rows: BreakdownRow[] = stockRows
        .slice()
        .sort((a, b) => b.totalCost - a.totalCost)
        .map(g => ({ name: g.name, sub: `${g.totalImported} ${g.unit} bought · ${g.totalUsed} ${g.unit} used`, amount: g.totalCost }));

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
          {/* ── Total cost used vs. total project cost (budget) ──────────────── */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Cost Used</Text>
            <Text style={styles.totalAmount}>{fmtCurrency(grandTotal)}</Text>

            {budget > 0 && (
              <View style={styles.budgetBlock}>
                <View style={styles.budgetBarTrack}>
                  <View
                    style={[
                      styles.budgetBarFill,
                      { width: `${budgetPct}%`, backgroundColor: isOverBudget ? '#DC2626' : THEME_COLOR },
                    ]}
                  />
                </View>
                <View style={styles.budgetLabelRow}>
                  <Text style={styles.budgetPctText}>{((grandTotal / budget) * 100).toFixed(1)}% used</Text>
                  <Text style={[styles.budgetStatus, { color: isOverBudget ? '#DC2626' : THEME_COLOR }]}>
                    {isOverBudget
                      ? `${fmtCurrency(grandTotal - budget)} over`
                      : `${fmtCurrency(budget - grandTotal)} left`}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.projectCostRow}>
              <Text style={styles.projectCostLabel}>Total Project Cost</Text>
              <Text style={styles.projectCostAmount}>{budget > 0 ? fmtCurrency(budget) : 'Not set'}</Text>
            </View>

            {/* Legend — amount and share for every category */}
            <View style={styles.legendGrid}>
              {categories.map(c => (
                <View key={c.key} style={styles.legendItem}>
                  <View style={styles.legendLabelRow}>
                    <View style={[styles.legendDot, { backgroundColor: CATEGORY_META[c.key].color }]} />
                    <Text style={styles.legendLabel} numberOfLines={1}>{c.label}</Text>
                    <Text style={styles.legendPct}>{fmtPct(c.total, grandTotal)}</Text>
                  </View>
                  <Text style={styles.legendAmount} numberOfLines={1}>{fmtCurrency(c.total)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Category breakdown ─────────────────────────────────────────── */}
          <Text style={styles.sectionHeading}>Breakdown</Text>
          {categories.map((cat) => (
            <CategoryCard
              key={cat.key}
              category={cat}
              grandTotal={grandTotal}
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
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
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 1 },
  scrollContent: { padding: 16 },

  // Total card
  totalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  totalLabel: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  totalAmount: { fontSize: 32, fontWeight: '800', color: '#0F172A', letterSpacing: -0.8, marginTop: 2, fontVariant: ['tabular-nums'] },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 18, rowGap: 14 },
  legendItem: { width: '50%', paddingRight: 10 },
  legendLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { flexShrink: 1, fontSize: 12.5, color: '#475569', fontWeight: '600' },
  legendPct: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  legendAmount: { fontSize: 15.5, fontWeight: '700', color: '#0F172A', marginTop: 3, marginLeft: 14, fontVariant: ['tabular-nums'] },
  budgetBlock: { marginTop: 14 },
  projectCostRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  projectCostLabel: { fontSize: 13.5, fontWeight: '600', color: '#475569' },
  projectCostAmount: { fontSize: 16, fontWeight: '800', color: '#0F172A', fontVariant: ['tabular-nums'] },
  budgetBarTrack: { height: 8, borderRadius: 4, backgroundColor: '#F1F5F9', overflow: 'hidden' },
  budgetBarFill: { height: '100%', borderRadius: 4 },
  budgetLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 7 },
  budgetStatus: { fontSize: 13, fontWeight: '700' },
  budgetPctText: { fontSize: 12.5, fontWeight: '600', color: '#64748B' },

  sectionHeading: { fontSize: 16, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2, marginBottom: 12 },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15.5, fontWeight: '700', color: '#0F172A' },
  countText: { fontSize: 12, color: '#64748B', marginTop: 2 },
  amountCol: { alignItems: 'flex-end', gap: 2 },
  amount: { fontSize: 16.5, fontWeight: '800', color: '#0F172A', fontVariant: ['tabular-nums'] },
  shareTrack: { height: 4, borderRadius: 2, backgroundColor: '#F1F5F9', marginTop: 14, overflow: 'hidden' },
  shareFill: { height: '100%', borderRadius: 2 },
  breakdown: { marginTop: 12 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  breakdownRowBorder: { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  rowName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  rowSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  rowAmount: { fontSize: 14, fontWeight: '700', color: '#1F2937', fontVariant: ['tabular-nums'] },
  showAllBtn: { paddingVertical: 10, alignItems: 'center' },
  showAllText: { fontSize: 13, fontWeight: '700' },
  emptyRowText: { fontSize: 13, color: '#94A3B8', paddingVertical: 12, textAlign: 'center' },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  reportBtnText: { fontSize: 13.5, fontWeight: '700' },
});
