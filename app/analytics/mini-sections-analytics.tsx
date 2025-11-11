// Level 3: Mini-Sections Analytics
import PieChart, { PieChartColors20 } from '@/components/PieChart';
import PieChartLegend, { LegendItem } from '@/components/PieChartLegend';
import { getSection } from '@/functions/details';
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

interface MiniSectionExpense {
  _id: string;
  name: string;
  totalExpense: number;
}

const MiniSectionsAnalytics: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.projectId as string;
  const projectName = params.projectName as string;
  const sectionId = params.sectionId as string;
  const sectionName = params.sectionName as string;
  const materialUsed = params.materialUsed as string;

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const colors = PieChartColors20;

  const [miniSections, setMiniSections] = useState<MiniSectionExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMiniSectionExpenses();
  }, [sectionId, materialUsed]);

  const loadMiniSectionExpenses = async () => {
    try {
      setLoading(true);

      // Fetch mini-sections for this section
      const miniSectionsData = await getSection(sectionId);
      
      const parsedMaterialUsed = materialUsed
        ? JSON.parse(Array.isArray(materialUsed) ? materialUsed[0] : materialUsed)
        : [];

      // Calculate expenses per mini-section
      const miniSectionExpenses: MiniSectionExpense[] = miniSectionsData.map((miniSection: any) => {
        const miniSectionMaterials = parsedMaterialUsed.filter(
          (material: any) => material.miniSectionId === miniSection._id
        );

        const totalExpense = miniSectionMaterials.reduce(
          (sum: number, material: any) => sum + (material.cost || 0),
          0
        );

        return {
          _id: miniSection._id,
          name: miniSection.name,
          totalExpense,
        };
      });

      // Filter mini-sections with expenses > 0
      const activeMiniSections = miniSectionExpenses.filter((ms) => ms.totalExpense > 0);
      setMiniSections(activeMiniSections);

      // Animate
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error loading mini-section expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalExpense = miniSections.reduce((sum, ms) => sum + ms.totalExpense, 0);

  // Transform to pie data
  const pieData = miniSections.map((miniSection, index) => ({
    key: miniSection._id,
    value: miniSection.totalExpense,
    svg: {
      fill: colors[index % colors.length].primary,
      gradientId: `gradient_${miniSection._id}`,
    },
    name: miniSection.name,
    formattedBudget: formatCurrency(miniSection.totalExpense),
    percentage: ((miniSection.totalExpense / totalExpense) * 100).toFixed(1),
    description: `${miniSection.name} expenses`,
  }));

  const legendData: LegendItem[] = pieData.map((item, index) => ({
    key: item.key,
    name: item.name,
    value: item.formattedBudget,
    percentage: item.percentage,
    color: colors[index % colors.length].primary,
    description: item.description,
  }));

  const handleMiniSectionPress = (miniSectionId: string, miniSectionName: string) => {
    router.push({
      pathname: '/analytics/materials-analytics',
      params: {
        projectId,
        projectName,
        sectionId,
        sectionName,
        miniSectionId,
        miniSectionName,
        materialUsed,
      },
    });
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
              <Text style={styles.projectName}>{sectionName}</Text>
              <Text style={styles.projectSubtitle}>Mini-Section Expenses</Text>
            </View>
          </View>
        </View>

        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbText}>{projectName}</Text>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          <Text style={styles.breadcrumbText}>{sectionName}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={[styles.statBox, styles.statBoxPrimary]}>
            <Text style={styles.statValue}>{miniSections.length}</Text>
            <Text style={styles.statLabel}>Active Mini-Sections</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxSecondary]}>
            <Text style={styles.statValue}>{formatCurrency(totalExpense)}</Text>
            <Text style={styles.statLabel}>Total Expenses</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading mini-section expenses...</Text>
          </View>
        ) : miniSections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="grid-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Mini-Section Data</Text>
            <Text style={styles.emptySubtitle}>
              No materials have been used in any mini-sections yet
            </Text>
          </View>
        ) : (
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <View style={styles.heading}>
              <Text style={styles.title}>Mini-Section Expenses</Text>
              <Text style={styles.subtitle}>Material Usage by Mini-Section</Text>
            </View>

            <View style={styles.chartContainer}>
              <PieChart
                data={pieData}
                colors={colors}
                size={280}
                enableAnimation={true}
                enableHover={true}
                labelType="amount"
                onSlicePress={handleMiniSectionPress}
                centerContent={{
                  label: 'TOTAL EXPENSES',
                  value: formatCurrency(totalExpense),
                  subtitle: `${miniSections.length} Mini-Section${miniSections.length > 1 ? 's' : ''}`,
                }}
              />
            </View>

            <PieChartLegend
              items={legendData}
              onItemClick={handleMiniSectionPress}
              showPercentage={true}
              showDescription={false}
              layout="vertical"
            />
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MiniSectionsAnalytics;

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
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    gap: 8,
  },
  breadcrumbText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  statsSection: {
    marginTop: 10,
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
});
