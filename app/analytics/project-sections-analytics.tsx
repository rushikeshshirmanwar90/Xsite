// Level 2: Project Sections Analytics
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

interface SectionExpense {
  _id: string;
  name: string;
  type: string;
  totalExpense: number;
}

const ProjectSectionsAnalytics: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.projectId as string;
  const projectName = params.projectName as string;
  const sectionsData = params.sections as string;
  const materialAvailable = params.materialAvailable as string;
  const materialUsed = params.materialUsed as string; // Keep for future use

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const colors = PieChartColors20;

  const [sections, setSections] = useState<SectionExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [totalUsed, setTotalUsed] = useState(0);

  useEffect(() => {
    loadSectionExpenses();
  }, [sectionsData, materialUsed, materialAvailable]);

  const loadSectionExpenses = () => {
    try {
      setLoading(true);

      const parsedSections = JSON.parse(
        Array.isArray(sectionsData) ? sectionsData[0] : sectionsData
      );
      
      const parsedMaterialUsed = materialUsed
        ? JSON.parse(Array.isArray(materialUsed) ? materialUsed[0] : materialUsed)
        : [];

      const parsedMaterialAvailable = materialAvailable
        ? JSON.parse(Array.isArray(materialAvailable) ? materialAvailable[0] : materialAvailable)
        : [];

      // Calculate totals for available and used
      const availableTotal = parsedMaterialAvailable.reduce(
        (sum: number, material: any) => sum + (material.totalCost || material.cost || 0),
        0
      );
      const usedTotal = parsedMaterialUsed.reduce(
        (sum: number, material: any) => sum + (material.totalCost || material.cost || 0),
        0
      );

      setTotalAvailable(availableTotal);
      setTotalUsed(usedTotal);

      // Calculate expenses per section from MaterialUsed (allocated materials)
      const sectionExpenses: SectionExpense[] = parsedSections.map((section: any) => {
        const sectionMaterials = parsedMaterialUsed.filter(
          (material: any) =>
            material.sectionId === section._id || material.sectionId === section.sectionId
        );

        const totalExpense = sectionMaterials.reduce(
          (sum: number, material: any) => sum + (material.totalCost || material.cost || 0),
          0
        );

        return {
          _id: section._id || section.sectionId,
          name: section.name,
          type: section.type,
          totalExpense,
        };
      });

      // Show all sections (even with 0 expense) to indicate available vs used
      setSections(sectionExpenses);

      // Animate
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error loading section expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalExpense = sections.reduce((sum, section) => sum + section.totalExpense, 0);

  // Transform to pie data
  const pieData = sections.map((section, index) => ({
    key: section._id,
    value: section.totalExpense,
    svg: {
      fill: colors[index % colors.length].primary,
      gradientId: `gradient_${section._id}`,
    },
    name: section.name,
    formattedBudget: formatCurrency(section.totalExpense),
    percentage: ((section.totalExpense / totalExpense) * 100).toFixed(1),
    description: section.type,
  }));

  const legendData: LegendItem[] = pieData.map((item, index) => ({
    key: item.key,
    name: item.name,
    value: item.formattedBudget,
    percentage: item.percentage,
    color: colors[index % colors.length].primary,
    description: item.description,
  }));

  const handleSectionPress = (sectionId: string, sectionName: string) => {
    const section = sections.find((s) => s._id === sectionId);
    if (section) {
      router.push({
        pathname: '/analytics/mini-sections-analytics',
        params: {
          projectId,
          projectName,
          sectionId: section._id,
          sectionName: section.name,
          materialUsed,
        },
      });
    }
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
              <Text style={styles.projectName}>{projectName}</Text>
              <Text style={styles.projectSubtitle}>Material Allocation by Section</Text>
            </View>
          </View>
        </View>

        {/* Material Status Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Material Status</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.summaryLabel}>Available (Not Allocated)</Text>
            </View>
            <Text style={styles.summaryValue}>{formatCurrency(totalAvailable)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.summaryLabel}>Used (Allocated)</Text>
            </View>
            <Text style={styles.summaryValue}>{formatCurrency(totalUsed)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total Material Value</Text>
            <Text style={styles.summaryTotalValue}>{formatCurrency(totalAvailable + totalUsed)}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={[styles.statBox, styles.statBoxPrimary]}>
            <Text style={styles.statValue}>{sections.filter(s => s.totalExpense > 0).length}</Text>
            <Text style={styles.statLabel}>Sections with Materials</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxSecondary]}>
            <Text style={styles.statValue}>{formatCurrency(totalExpense)}</Text>
            <Text style={styles.statLabel}>Total Allocated</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading section data...</Text>
          </View>
        ) : sections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="layers-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Sections Found</Text>
            <Text style={styles.emptySubtitle}>
              This project doesn't have any sections yet
            </Text>
          </View>
        ) : sections.filter(s => s.totalExpense > 0).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Materials Allocated</Text>
            <Text style={styles.emptySubtitle}>
              Materials have been imported but not yet allocated to any sections.
              Use the "Add Usage" feature to allocate materials to sections.
            </Text>
          </View>
        ) : (
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <View style={styles.heading}>
              <Text style={styles.title}>Section Material Usage</Text>
              <Text style={styles.subtitle}>Allocated Materials by Section</Text>
            </View>

            <View style={styles.chartContainer}>
              <PieChart
                data={pieData.filter(p => p.value > 0)}
                colors={colors}
                size={280}
                enableAnimation={true}
                enableHover={true}
                labelType="amount"
                onSlicePress={handleSectionPress}
                centerContent={{
                  label: 'TOTAL USED',
                  value: formatCurrency(totalExpense),
                  subtitle: `${sections.filter(s => s.totalExpense > 0).length} Section${sections.filter(s => s.totalExpense > 0).length > 1 ? 's' : ''}`,
                }}
              />
            </View>

            <PieChartLegend
              items={legendData}
              onItemClick={handleSectionPress}
              showPercentage={true}
              showDescription={true}
              layout="vertical"
            />
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProjectSectionsAnalytics;

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
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  projectSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  statsSection: {
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  statBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 15,
    elevation: 6,
  },
  statBoxPrimary: {
    borderWidth: 3,
    borderColor: '#5DADE2',
  },
  statBoxSecondary: {
    borderWidth: 3,
    borderColor: '#EC7063',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#95A5A6',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 24,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 25,
    elevation: 12,
  },
  heading: {
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2C3E50',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#95A5A6',
    fontWeight: '500',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 20,
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '700',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
    marginTop: 8,
    paddingTop: 12,
  },
  summaryTotalLabel: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '700',
  },
  summaryTotalValue: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '800',
  },
});
