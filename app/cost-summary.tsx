import ContractorReportGenerator from '@/app/_components/contractor/ContractorReportGenerator';
import CostSummarySkeleton from '@/components/CostSummarySkeleton';
import { Colors } from '@/constants/theme';
import { getClientId } from '@/functions/clientId';
import { isAdmin, useUser } from '@/hooks/useUser';
import apiClient from '@/utils/axiosConfig';
import { fetchMaterialStockRows, MaterialStockRow } from '@/utils/materialStockReport';
import { PDFReportGenerator } from '@/utils/pdfReportGenerator';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

if (Platform.OS === 'android' && !(globalThis as any).nativeFabricUIManager && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type CategoryKey = 'material' | 'contractor' | 'equipment' | 'other';
type IoniconName = keyof typeof Ionicons.glyphMap;

interface BreakdownRow {
  // Set on rows that open a detail page (contractors)
  id?: string;
  name: string;
  sub?: string;
  amount: number;
}

interface CategorySummary {
  key: CategoryKey;
  label: string;
  total: number;
  count: number;
  rows: BreakdownRow[];
  // The request failed, so the total is unknown. Never show it as ₹0.
  failed?: boolean;
}

// ─── Tokens ────────────────────────────────────────────────────────────────────
// Light appearance only, like the rest of the app. Ratios are against white.
const INK = '#0F172A';                  // 17.9:1
const SECONDARY = Colors.textSecondary; // #64748B, 4.8:1
const ACCENT = Colors.primary;          // #3A78B5, 4.6:1
const TRACK = Colors.fill;              // #EEF2F7, the unspent part of the budget

// Each category gets one step of the brand blue. The same shade fills its
// segment in the spending bar and its icon tile, so the bar needs no separate
// legend. The lightest step holds 3.2:1 against the track, and white gaps
// separate neighbouring segments so shade is never the only cue.
const CATEGORY_META: Record<CategoryKey, { label: string; icon: IoniconName; noun: [string, string]; shade: string }> = {
  material:   { label: 'Materials',   icon: 'cube-outline',      noun: ['item', 'items'],             shade: '#173F69' },
  contractor: { label: 'Contractors', icon: 'people-outline',    noun: ['contractor', 'contractors'], shade: '#2B5F95' },
  equipment:  { label: 'Equipment',   icon: 'construct-outline', noun: ['entry', 'entries'],          shade: '#3A78B5' },
  other:      { label: 'Other Costs', icon: 'receipt-outline',   noun: ['expense', 'expenses'],       shade: '#4F8BC7' },
};

const COLLAPSED_ROW_LIMIT = 6;
// From this system text size up, side-by-side rows stack so amounts never truncate
const LARGE_TEXT_SCALE = 1.3;

const fmtCurrency = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`;

const fmtPct = (part: number, whole: number) => {
  if (whole <= 0 || part <= 0) return '0%';
  const pct = (part / whole) * 100;
  return pct < 1 ? '<1%' : `${Math.round(pct)}%`;
};

// Same thresholds and colors as the budget bar on the home page's project cards
const budgetTone = (pctUsed: number) =>
  pctUsed > 90 ? Colors.errorText : pctUsed > 70 ? Colors.warningText : Colors.successText;

// "materials", "materials and equipment", "materials, equipment and other costs"
const joinList = (items: string[]) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

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

// ─── Spending bar ──────────────────────────────────────────────────────────────
// One bar for the whole budget: a segment per category, the rest is unspent.
const SpendingBar: React.FC<{
  categories: CategorySummary[];
  scale: number;
  accessibilityLabel: string;
  pctUsed?: number;
}> = ({ categories, scale, accessibilityLabel, pctUsed }) => {
  const segments = categories.filter(c => !c.failed && c.total > 0);
  return (
    <View
      style={barStyles.track}
      accessible
      accessibilityRole={pctUsed !== undefined ? 'progressbar' : 'image'}
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={pctUsed !== undefined ? { min: 0, max: 100, now: Math.min(100, Math.round(pctUsed)) } : undefined}
    >
      {scale > 0 && segments.map((c, i) => (
        <View
          key={c.key}
          style={[
            barStyles.segment,
            { width: `${(c.total / scale) * 100}%`, backgroundColor: CATEGORY_META[c.key].shade },
            i > 0 && barStyles.segmentGap,
          ]}
        />
      ))}
    </View>
  );
};

// ─── Category card ─────────────────────────────────────────────────────────────
const CategoryCard: React.FC<{
  category: CategorySummary;
  grandTotal: number;
  expanded: boolean;
  largeText: boolean;
  onToggle: () => void;
  onGenerateReport: () => void;
  isGeneratingReport: boolean;
  // When set, rows with an id open a detail page
  onRowPress?: (row: BreakdownRow) => void;
}> = ({ category, grandTotal, expanded, largeText, onToggle, onGenerateReport, isGeneratingReport, onRowPress }) => {
  const meta = CATEGORY_META[category.key];
  const [showAll, setShowAll] = useState(false);
  const visibleRows = showAll ? category.rows : category.rows.slice(0, COLLAPSED_ROW_LIMIT);

  const iconTile = (
    <View style={[cardStyles.iconTile, { backgroundColor: meta.shade }]}>
      <Ionicons name={meta.icon} size={20} color="#FFFFFF" />
    </View>
  );

  // Failed request: say so, and don't offer a breakdown we don't have
  if (category.failed) {
    return (
      <View style={cardStyles.card}>
        <View style={cardStyles.headerRow} accessible accessibilityLabel={`${meta.label}, couldn't load`}>
          {iconTile}
          <View style={cardStyles.headerText}>
            <Text style={cardStyles.label}>{meta.label}</Text>
            <Text style={cardStyles.failedText}>Couldn&apos;t load</Text>
          </View>
          <Text style={cardStyles.amountUnknown}>—</Text>
        </View>
      </View>
    );
  }

  const noun = meta.noun[category.count === 1 ? 0 : 1];
  const countText = category.count === 0
    ? 'Nothing recorded yet'
    : `${category.count} ${noun} · ${fmtPct(category.total, grandTotal)} of total`;
  const amount = fmtCurrency(category.total);

  return (
    <View style={cardStyles.card}>
      <Pressable
        style={({ pressed }) => [cardStyles.headerRow, pressed && cardStyles.headerRowPressed]}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${meta.label}, ${amount}, ${countText}`}
        accessibilityHint={expanded ? 'Hides the breakdown' : 'Shows the breakdown'}
      >
        {iconTile}
        <View style={cardStyles.headerText}>
          <Text style={cardStyles.label}>{meta.label}</Text>
          <Text style={cardStyles.countText}>{countText}</Text>
          {largeText && <Text style={[cardStyles.amount, cardStyles.amountStacked]}>{amount}</Text>}
        </View>
        {!largeText && <Text style={cardStyles.amount}>{amount}</Text>}
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={SECONDARY} />
      </Pressable>

      {expanded && (
        <View style={[cardStyles.breakdown, largeText && cardStyles.breakdownUnindented]}>
          {category.rows.length === 0 ? (
            <Text style={cardStyles.emptyRowText}>
              Nothing recorded for this project yet. {meta.label} you add will show up here.
            </Text>
          ) : (
            <>
              {visibleRows.map((row, i) => {
                const rowLabel = `${row.name}, ${fmtCurrency(row.amount)}${row.sub ? `, ${row.sub}` : ''}`;
                const rowContent = (
                  <>
                    <View style={cardStyles.rowText}>
                      <Text style={cardStyles.rowName} numberOfLines={2}>{row.name}</Text>
                      {row.sub ? <Text style={cardStyles.rowSub} numberOfLines={2}>{row.sub}</Text> : null}
                    </View>
                    <Text style={cardStyles.rowAmount}>{fmtCurrency(row.amount)}</Text>
                  </>
                );
                const rowStyle = [cardStyles.row, largeText && cardStyles.rowStacked, i > 0 && cardStyles.rowDivider];

                // Contractors open their own page with the full contract and payments
                if (onRowPress && row.id) {
                  return (
                    <Pressable
                      key={row.id}
                      style={({ pressed }) => [...rowStyle, pressed && cardStyles.pressedFade]}
                      onPress={() => onRowPress(row)}
                      accessibilityRole="button"
                      accessibilityLabel={rowLabel}
                      accessibilityHint="Opens the contract, payments and contact details"
                    >
                      {rowContent}
                      {!largeText && <Ionicons name="chevron-forward" size={18} color={SECONDARY} />}
                    </Pressable>
                  );
                }

                return (
                  <View key={`${row.name}-${i}`} style={rowStyle} accessible accessibilityLabel={rowLabel}>
                    {rowContent}
                  </View>
                );
              })}

              {category.rows.length > COLLAPSED_ROW_LIMIT && (
                <Pressable
                  style={({ pressed }) => [cardStyles.textButton, pressed && cardStyles.pressedFade]}
                  onPress={() => setShowAll(v => !v)}
                  accessibilityRole="button"
                >
                  <Text style={cardStyles.textButtonLabel}>
                    {showAll ? 'Show Less' : `Show All ${category.rows.length}`}
                  </Text>
                </Pressable>
              )}

              <Pressable
                style={({ pressed }) => [cardStyles.reportButton, pressed && cardStyles.reportButtonPressed]}
                onPress={onGenerateReport}
                disabled={isGeneratingReport}
                accessibilityRole="button"
                accessibilityLabel={`Generate ${meta.label} PDF report`}
                accessibilityState={{ busy: isGeneratingReport, disabled: isGeneratingReport }}
              >
                {isGeneratingReport ? (
                  <>
                    <ActivityIndicator size="small" color={ACCENT} />
                    <Text style={cardStyles.reportButtonLabel}>Generating…</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="document-text-outline" size={18} color={ACCENT} />
                    <Text style={cardStyles.reportButtonLabel}>Generate PDF Report</Text>
                  </>
                )}
              </Pressable>
            </>
          )}
        </View>
      )}
    </View>
  );
};

// ─── Main screen ───────────────────────────────────────────────────────────────
const CostSummary = () => {
  const params = useLocalSearchParams();
  const projectId = params.projectId as string;
  const projectName = (params.projectName as string) || 'Project';

  // Cost figures are admin-only. The entry buttons are already hidden for
  // staff; this guard also bounces anyone reaching the screen directly.
  const { user, loading: userLoading } = useUser();
  const userIsAdmin = isAdmin(user);

  useEffect(() => {
    if (userLoading) return;
    if (!userIsAdmin) {
      toast.error('Cost Summary is available to admins only.');
      router.back();
    }
  }, [userLoading, userIsAdmin]);

  // Stack side-by-side rows at large system text sizes
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale >= LARGE_TEXT_SCALE;

  // Skip the expand animation when Reduce Motion is on
  const reduceMotion = useRef(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(v => { reduceMotion.current = v; }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', v => { reduceMotion.current = v; });
    return () => sub.remove();
  }, []);

  // Nothing to load without a project; the screen shows its "No project selected" state
  const [loading, setLoading] = useState(!!projectId);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [expandedKey, setExpandedKey] = useState<CategoryKey | null>(null);
  const [budget, setBudget] = useState<number>(0);
  const [budgetFailed, setBudgetFailed] = useState(false);
  const [generatingKey, setGeneratingKey] = useState<CategoryKey | null>(null);
  const [showContractorReport, setShowContractorReport] = useState(false);

  // Raw records kept alongside the display summaries. The PDF generators need
  // the original shapes, not the flattened breakdown rows shown on screen.
  const [materialStockRows, setMaterialStockRows] = useState<MaterialStockRow[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [otherCostEntries, setOtherCostEntries] = useState<any[]>([]);
  const [contractorList, setContractorList] = useState<any[]>([]);

  // ── Fetchers (each isolated so one failure doesn't blank the whole page) ────
  const baseSummary = (key: CategoryKey): CategorySummary => ({
    key, label: CATEGORY_META[key].label, total: 0, count: 0, rows: [],
  });

  const fetchMaterialsSummary = async (): Promise<CategorySummary> => {
    const base = baseSummary('material');
    try {
      const clientId = await getClientId();
      if (!clientId) return { ...base, failed: true };
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
      return { ...base, failed: true };
    }
  };

  const fetchContractorsSummary = async (): Promise<CategorySummary> => {
    const base = baseSummary('contractor');
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
            id: c._id ? String(c._id) : undefined,
            name: staffName,
            sub: `${c.contractType || 'Contract'} · Paid ${fmtCurrency(c.totalPaid || 0)}`,
            amount: c.usedAmount || 0,
          };
        })
        .sort((a, b) => b.amount - a.amount);
      return { ...base, total: rows.reduce((s, r) => s + r.amount, 0), count: rows.length, rows };
    } catch {
      return { ...base, failed: true };
    }
  };

  const fetchEquipmentSummary = async (): Promise<CategorySummary> => {
    const base = baseSummary('equipment');
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
        .map(([type, g]) => ({ name: type, sub: g.category || undefined, amount: g.cost }))
        .sort((a, b) => b.amount - a.amount);
      return { ...base, total: rows.reduce((s, r) => s + r.amount, 0), count: list.length, rows };
    } catch {
      return { ...base, failed: true };
    }
  };

  const fetchOtherCostSummary = async (): Promise<CategorySummary> => {
    const base = baseSummary('other');
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
      return { ...base, failed: true };
    }
  };

  const fetchBudget = async () => {
    try {
      const clientId = await getClientId();
      if (!clientId || !projectId) { setBudgetFailed(true); return; }
      const res = await apiClient.get(`/api/project/${projectId}`, { params: { clientId } });
      const rd: any = res.data;
      const project = rd?.project || rd?.data?.project || rd?.data || rd;
      setBudget(Number(project?.budget || 0));
      setBudgetFailed(false);
    } catch {
      setBudget(0);
      setBudgetFailed(true);
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

  const reload = async () => {
    setLoading(true);
    await loadSummary();
    setLoading(false);
  };

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    // loadSummary only sets state after its network calls resolve, never synchronously
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSummary().finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSummary();
    setRefreshing(false);
  };

  const toggleExpand = (key: CategoryKey) => {
    if (!reduceMotion.current) {
      LayoutAnimation.configureNext(
        LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
      );
    }
    setExpandedKey(prev => (prev === key ? null : key));
  };

  // ── Derived figures ──────────────────────────────────────────────────────────
  const loaded = categories.filter(c => !c.failed);
  const failedLabels = categories.filter(c => c.failed).map(c => c.label.toLowerCase());
  const allFailed = categories.length > 0 && loaded.length === 0;
  const grandTotal = loaded.reduce((s, c) => s + c.total, 0);
  const hasBudget = budget > 0;
  const pctUsed = hasBudget ? (grandTotal / budget) * 100 : 0;
  const isOverBudget = hasBudget && grandTotal > budget;
  // Bar spans the budget, or the total when spending passes it or no budget is set
  const barScale = hasBudget ? Math.max(budget, grandTotal) : grandTotal;

  const budgetLine = budgetFailed
    ? "Budget couldn't load"
    : hasBudget
      ? `of ${fmtCurrency(budget)} budget`
      : 'No budget set for this project';

  const spendingDescription = loaded
    .map(c => `${c.label} ${fmtCurrency(c.total)}`)
    .join(', ');
  const barLabel = hasBudget
    ? `Budget used, ${pctUsed.toFixed(1)} percent. ${spendingDescription}`
    : `Spending by category. ${spendingDescription}`;

  const openContractor = (row: BreakdownRow) => {
    if (!row.id) return;
    router.push({
      pathname: '/contractor-details',
      params: { contractorId: row.id, projectId, projectName, contractorName: row.name },
    } as any);
  };

  // ── Report generation ────────────────────────────────────────────────────────
  const handleGenerateReport = async (key: CategoryKey) => {
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
      toast.error(error?.message || "Couldn't generate the report. Try again.");
    } finally {
      setGeneratingKey(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
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
      return (
        <View style={styles.scrollContent}>
          <CostSummarySkeleton />
        </View>
      );
    }

    if (!projectId) {
      return renderState('alert-circle-outline', 'No project selected', 'Go back and choose a project to see its costs.', {
        label: 'Go Back', onPress: () => router.back(),
      });
    }

    if (allFailed) {
      return renderState('cloud-offline-outline', "Couldn't load costs", 'Check your connection, then try again.', {
        label: 'Try Again', onPress: reload,
      });
    }

    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ACCENT]} tintColor={ACCENT} />
        }
      >
        {/* ── Spent against budget ─────────────────────────────────────────── */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Total Spent</Text>
          <Text style={styles.heroAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
            {fmtCurrency(grandTotal)}
          </Text>
          <Text style={styles.heroBudget}>{budgetLine}</Text>

          <View style={styles.heroBar}>
            <SpendingBar
              categories={categories}
              scale={barScale}
              accessibilityLabel={barLabel}
              pctUsed={hasBudget ? pctUsed : undefined}
            />
          </View>

          {hasBudget && (
            <View style={[styles.heroStatusRow, largeText && styles.heroStatusRowStacked]}>
              <Text style={[styles.heroPct, { color: budgetTone(pctUsed) }]}>
                {pctUsed.toFixed(1)}% used
              </Text>
              {isOverBudget ? (
                <View style={styles.overBudget}>
                  <Ionicons name="alert-circle" size={15} color={Colors.errorText} />
                  <Text style={[styles.heroRemaining, { color: Colors.errorText }]}>
                    {fmtCurrency(grandTotal - budget)} over budget
                  </Text>
                </View>
              ) : (
                <Text style={styles.heroRemaining}>{fmtCurrency(budget - grandTotal)} left</Text>
              )}
            </View>
          )}
        </View>

        {/* Partial failure: the total above leaves these categories out */}
        {failedLabels.length > 0 && (
          <View style={styles.notice} accessibilityRole="alert">
            <Ionicons name="cloud-offline-outline" size={18} color={Colors.warningText} />
            <Text style={styles.noticeText}>
              {`Couldn't load ${joinList(failedLabels)}, so the total leaves ${failedLabels.length === 1 ? 'it' : 'them'} out. Pull down to try again.`}
            </Text>
          </View>
        )}

        {/* ── Category breakdown ─────────────────────────────────────────────── */}
        <Text style={styles.sectionHeading} accessibilityRole="header">Breakdown</Text>
        {categories.map((cat) => (
          <CategoryCard
            key={cat.key}
            category={cat}
            grandTotal={grandTotal}
            expanded={expandedKey === cat.key}
            largeText={largeText}
            onToggle={() => toggleExpand(cat.key)}
            onGenerateReport={() => handleGenerateReport(cat.key)}
            isGeneratingReport={generatingKey === cat.key}
            onRowPress={cat.key === 'contractor' ? openContractor : undefined}
          />
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header — white flat, matches the Project Sections header */}
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
          <Text style={styles.headerTitle} numberOfLines={1} accessibilityRole="header">Cost Summary</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{projectName}</Text>
        </View>
      </View>

      {renderContent()}

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
// Type follows the iOS default text styles: Large Title 34, Title 3 20,
// Headline 17, Subhead 15, Footnote 13.
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

  // Hero: spent against budget
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroLabel: { fontSize: 15, fontWeight: '600', color: SECONDARY },
  heroAmount: {
    fontSize: 34,
    fontWeight: '700',
    color: INK,
    letterSpacing: -0.8,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  heroBudget: { fontSize: 15, fontWeight: '500', color: SECONDARY, marginTop: 2, fontVariant: ['tabular-nums'] },
  heroBar: { marginTop: 18 },
  heroStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, gap: 12 },
  heroStatusRowStacked: { flexDirection: 'column', alignItems: 'flex-start', gap: 4 },
  heroPct: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  heroRemaining: { fontSize: 13, fontWeight: '600', color: SECONDARY, fontVariant: ['tabular-nums'] },
  overBudget: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  // Partial-failure notice
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    marginBottom: 16,
    borderRadius: 14,
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: '#FBE3B4',
  },
  noticeText: { flex: 1, fontSize: 15, lineHeight: 20, color: Colors.warningText },

  sectionHeading: { fontSize: 20, fontWeight: '700', color: INK, letterSpacing: -0.3, marginTop: 8, marginBottom: 12 },

  // Full-screen states (no project, nothing loaded)
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

const barStyles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    backgroundColor: TRACK,
    overflow: 'hidden',
  },
  // Tiny shares stay visible as a sliver
  segment: { height: '100%', minWidth: 3 },
  segmentGap: { borderLeftWidth: 2, borderLeftColor: Colors.surface },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden', // keeps the pressed highlight inside the rounded corners
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerRowPressed: { backgroundColor: '#F1F5F9' },
  iconTile: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  label: { fontSize: 17, fontWeight: '600', color: INK },
  countText: { fontSize: 13, color: SECONDARY, marginTop: 2 },
  amount: { fontSize: 17, fontWeight: '600', color: INK, fontVariant: ['tabular-nums'] },
  amountStacked: { marginTop: 4 },
  amountUnknown: { fontSize: 17, fontWeight: '600', color: SECONDARY },
  failedText: { fontSize: 13, fontWeight: '600', color: Colors.warningText, marginTop: 2 },

  // Expanded breakdown — indented under the category label to show it belongs to it
  breakdown: {
    paddingLeft: 70, // 16 padding + 42 tile + 12 gap
    paddingRight: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  breakdownUnindented: { paddingLeft: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowStacked: { flexDirection: 'column', alignItems: 'flex-start', gap: 4 },
  rowDivider: { borderTopWidth: 1, borderTopColor: Colors.borderLight },
  rowText: { flex: 1, alignSelf: 'stretch' },
  rowName: { fontSize: 15, fontWeight: '600', color: INK },
  rowSub: { fontSize: 13, color: SECONDARY, marginTop: 2 },
  rowAmount: { fontSize: 15, fontWeight: '600', color: INK, fontVariant: ['tabular-nums'] },
  emptyRowText: { fontSize: 15, lineHeight: 20, color: SECONDARY, paddingVertical: 14 },

  textButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  textButtonLabel: { fontSize: 15, fontWeight: '600', color: ACCENT },
  pressedFade: { opacity: 0.6 },

  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ACCENT,
  },
  reportButtonPressed: { backgroundColor: Colors.primaryLight },
  reportButtonLabel: { fontSize: 15, fontWeight: '600', color: ACCENT },
});
