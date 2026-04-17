// Building-Level Labor Analytics Page
import PieChart, { PieChartColors20 } from '@/components/PieChart';
import PieChartLegend, { LegendItem } from '@/components/PieChartLegend';
import { formatCurrency } from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LaborDetail {
  _id: string;
  type: string;
  category: string;
  count: number;
  perLaborCost: number;
  totalCost: number;
  addedAt: string;
  notes?: string;
}

const BuildingLaborAnalytics: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.projectId as string;
  const projectName = params.projectName as string;
  const sectionId = params.sectionId as string;
  const sectionName = params.sectionName as string;
  const laborsData = params.labors as string;

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const colors = PieChartColors20;

  const [laborDetails, setLaborDetails] = useState<LaborDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBuildingLaborDetails();
  }, [laborsData]);

  const loadBuildingLaborDetails = async () => {
    try {
      setLoading(true);

      console.log('\n🔍 ========== BUILDING LABOR ANALYTICS DEBUG ==========');
      console.log('🔍 Building Labor Analytics - Loading details');
      console.log('   - SectionId:', sectionId);
      console.log('   - SectionName:', sectionName);
      console.log('   - ProjectId:', projectId);

      // Parse labors from params
      const parsedLabors = laborsData
        ? JSON.parse(Array.isArray(laborsData) ? laborsData[0] : laborsData)
        : [];

      console.log('   - Total labor entries:', parsedLabors.length);

      // Filter for building-level labor only (miniSectionId="no-mini-section")
      const buildingLabor = parsedLabors.filter((labor: any) => {
        const isActive = labor.status === 'active' || !labor.status;
        const isBuildingLevel = labor.miniSectionId === 'no-mini-section' && labor.sectionId === sectionId;
        
        console.log(`   - Labor "${labor.type}": miniSectionId="${labor.miniSectionId}", sectionId="${labor.sectionId}", isBuilding=${isBuildingLevel}, active=${isActive}`);
        
        return isActive && isBuildingLevel;
      });

      console.log('   - Building-level labor entries:', buildingLabor.length);

      // Transform to LaborDetail format
      const details: LaborDetail[] = buildingLabor.map((labor: any) => ({
        _id: labor._id,
        type: labor.type,
        category: labor.category,
        count: labor.count,
        perLaborCost: labor.perLaborCost,
        totalCost: labor.totalCost,
        addedAt: labor.addedAt || labor.createdAt,
        notes: labor.notes,
      }));

      setLaborDetails(details);

      // Animate
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error loading building labor details:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalExpense = laborDetails.reduce((sum, labor) => sum + labor.totalCost, 0);
  const totalWorkers = laborDetails.reduce((sum, labor) => sum + labor.count, 0);

  // Sort labors by cost (highest first) for pie chart
  const sortedLabors = [...laborDetails].sort((a, b) => b.totalCost - a.totalCost);
  
  // Transform labors to pie data
  const laborPieData = sortedLabors.map((labor, index) => ({
    key: labor._id,
    value: labor.totalCost,
    svg: {
      fill: colors[index % colors.length].primary,
      gradientId: `gradient_${labor._id}`,
    },
    name: `${labor.category} - ${labor.type}`,
    formattedBudget: formatCurrency(labor.totalCost),
    percentage: (labor.totalCost / totalExpense * 100).toFixed(1),
    description: `${labor.count} worker${labor.count !== 1 ? 's' : ''}`,
  }));

  // Create legend data for labors
  const laborLegendData: LegendItem[] = laborPieData.map((item, index) => ({
    key: item.key,
    name: item.name,
    value: item.formattedBudget,
    percentage: item.percentage,
    color: colors[index % colors.length].primary,
    description: item.description,
  }));

  // Get labor icon and color based on category
  const getLaborIconAndColor = (category: string) => {
    const categoryMap: { [key: string]: { icon: keyof typeof Ionicons.glyphMap, color: string } } = {
      'Civil / Structural Works': { icon: 'hammer-outline', color: '#EF4444' },
      'Electrical Works': { icon: 'flash-outline', color: '#F59E0B' },
      'Plumbing & Sanitary Works': { icon: 'water-outline', color: '#3B82F6' },
      'Finishing Works': { icon: 'brush-outline', color: '#EC4899' },
      'Mechanical & HVAC Works': { icon: 'thermometer-outline', color: '#F97316' },
      'Fire Fighting & Safety Works': { icon: 'flame-outline', color: '#DC2626' },
      'External & Infrastructure Works': { icon: 'leaf-outline', color: '#65A30D' },
      'Waterproofing & Treatment Works': { icon: 'shield-outline', color: '#10B981' },
      'Site Management & Support Staff': { icon: 'people-outline', color: '#1E40AF' },
      'Equipment Operators': { icon: 'car-outline', color: '#7C2D12' },
      'Security & Housekeeping': { icon: 'shield-checkmark-outline', color: '#374151' }
    };

    return categoryMap[category] || { icon: 'people-outline', color: '#10B981' };
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#3B82F6" />
            </TouchableOpacity>
            <View style={styles.projectInfo}>
              <Text style={styles.projectName}>General Building Labor</Text>
              <Text style={styles.projectSubtitle}>Labor Breakdown</Text>
            </View>
          </View>
        </View>

        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbText}>{projectName}</Text>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          <Text style={styles.breadcrumbText}>{sectionName}</Text>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          <Text style={styles.breadcrumbText}>General Building Labor</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Loading labor details...</Text>
          </View>
        ) : laborDetails.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Building Labor Found</Text>
            <Text style={styles.emptySubtitle}>
              No general building labor entries found for this section.
            </Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Total Expense Card */}
            <View style={styles.totalCard}>
              <View style={styles.totalIconContainer}>
                <Ionicons name="people" size={32} color="#10B981" />
              </View>
              <View style={styles.totalInfo}>
                <Text style={styles.totalLabel}>TOTAL EXPENSE</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalExpense)}</Text>
                <Text style={styles.totalSubtext}>
                  {laborDetails.length} {laborDetails.length === 1 ? 'entry' : 'entries'} • {totalWorkers} {totalWorkers === 1 ? 'worker' : 'workers'}
                </Text>
              </View>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="people-outline" size={20} color="#10B981" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statLabel}>Total Workers</Text>
                  <Text style={[styles.statValue, { color: '#10B981' }]}>{totalWorkers}</Text>
                </View>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="cash-outline" size={20} color="#F59E0B" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statLabel}>Labor Cost</Text>
                  <Text style={[styles.statValue, { color: '#F59E0B' }]}>{formatCurrency(totalExpense)}</Text>
                </View>
              </View>
            </View>

            {/* Labor Breakdown Section */}
            <View style={styles.section}>
              {/* Pie Chart for Labor */}
              <View style={styles.chartCard}>
                <View style={styles.chartHeading}>
                  <Text style={styles.chartTitle}>Labor Cost Distribution</Text>
                  <Text style={styles.chartSubtitle}>Sorted by highest cost</Text>
                </View>
                
                <View style={styles.chartContainer}>
                  <PieChart
                    data={laborPieData}
                    colors={colors}
                    size={260}
                    enableAnimation={true}
                    enableHover={true}
                    labelType="amount"
                    centerContent={{
                      label: 'TOTAL LABOR',
                      value: formatCurrency(totalExpense),
                      subtitle: `${laborDetails.length} Labor Type${laborDetails.length > 1 ? 's' : ''}`
                    }}
                  />
                </View>

                <PieChartLegend
                  items={laborLegendData}
                  showPercentage={true}
                  showDescription={true}
                  layout="vertical"
                />
              </View>

              <Text style={styles.sectionTitle}>Labor Breakdown</Text>
            </View>

            {/* Labor Cards */}
            {sortedLabors.map((labor, index) => {
              const { icon, color } = getLaborIconAndColor(labor.category);
              
              return (
                <View key={labor._id} style={styles.laborCard}>
                  <View style={styles.laborHeader}>
                    <View style={[styles.laborIcon, { backgroundColor: `${color}15` }]}>
                      <Ionicons name={icon} size={24} color={color} />
                    </View>
                    <View style={styles.laborInfo}>
                      <Text style={styles.laborType}>{labor.type}</Text>
                      <Text style={styles.laborCategory}>{labor.category}</Text>
                    </View>
                    <Text style={[styles.laborCost, { color }]}>{formatCurrency(labor.totalCost)}</Text>
                  </View>

                  <View style={styles.laborDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Workers:</Text>
                      <Text style={styles.detailValue}>{labor.count}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Per Worker Cost:</Text>
                      <Text style={styles.detailValue}>{formatCurrency(labor.perLaborCost)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Total Cost:</Text>
                      <Text style={[styles.detailValue, styles.totalCostValue]}>
                        {formatCurrency(labor.totalCost)}
                      </Text>
                    </View>
                  </View>

                  {labor.notes && (
                    <View style={styles.notesContainer}>
                      <Text style={styles.notesLabel}>Notes:</Text>
                      <Text style={styles.notesText}>{labor.notes}</Text>
                    </View>
                  )}

                  <View style={styles.laborFooter}>
                    <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
                    <Text style={styles.dateText}>
                      Added: {new Date(labor.addedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>
              );
            })}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default BuildingLaborAnalytics;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F3F7',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  projectSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  breadcrumbText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  totalCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  totalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  totalInfo: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  totalSubtext: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statIconContainer: {
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  chartHeading: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  laborCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  laborHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  laborIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  laborInfo: {
    flex: 1,
  },
  laborType: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  laborCategory: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  laborCost: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  laborDetails: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  totalCostValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  notesContainer: {
    backgroundColor: '#FEF7F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  notesLabel: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  laborFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});
