// Level 3: Mini-Sections Analytics
import PieChart, { PieChartColors20 } from '@/components/PieChart';
import PieChartLegend, { LegendItem } from '@/components/PieChartLegend';
import { getClientId } from '@/functions/clientId';
import { getSection } from '@/functions/details';
import { getProject } from '@/functions/project';
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
  usedMaterialsCost: number;
  availableMaterialsCost: number;
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
  }, [sectionId, materialUsed, projectId]);

  const loadMiniSectionExpenses = async () => {
    try {
      setLoading(true);

      // Fetch mini-sections for this section
      const miniSectionsData = await getSection(sectionId);
      
      const parsedMaterialUsed = materialUsed
        ? JSON.parse(Array.isArray(materialUsed) ? materialUsed[0] : materialUsed)
        : [];

      // Get clientId and fetch project data to get MaterialAvailable
      const clientId = await getClientId();
      let projectMaterialsAvailable: any[] = [];
      
      if (clientId && projectId) {
        try {
          const projectData = await getProject(projectId, clientId);
          projectMaterialsAvailable = projectData?.MaterialAvailable || [];
          
      // Debug logging
      console.log('🔍 Project MaterialAvailable:', projectMaterialsAvailable.length, 'items');
      if (projectMaterialsAvailable.length > 0) {
        console.log('📋 Sample MaterialAvailable item:', projectMaterialsAvailable[0]);
        console.log('🔑 Available fields in first material:', Object.keys(projectMaterialsAvailable[0]));
      }
      console.log('🎯 Looking for sectionId:', sectionId);
      console.log('📍 Mini-sections:', miniSectionsData.map(ms => ({ id: ms._id, name: ms.name })));
        } catch (error) {
          console.error('Error fetching project data:', error);
        }
      }

      // Calculate expenses per mini-section
      const miniSectionExpenses: MiniSectionExpense[] = miniSectionsData.map((miniSection: any) => {
        // Calculate used materials cost
        const miniSectionUsedMaterials = parsedMaterialUsed.filter(
          (material: any) => material.miniSectionId === miniSection._id
        );

        const usedMaterialsCost = miniSectionUsedMaterials.reduce(
          (sum: number, material: any) => sum + (material.totalCost || material.cost || 0),
          0
        );

        // Calculate available materials cost for this mini-section
        // Try different possible field names for mini-section association
        let miniSectionAvailableMaterials = projectMaterialsAvailable.filter(
          (material: any) => material.miniSectionId === miniSection._id
        );

        // If no materials found by miniSectionId, try sectionId
        if (miniSectionAvailableMaterials.length === 0) {
          miniSectionAvailableMaterials = projectMaterialsAvailable.filter(
            (material: any) => material.sectionId === sectionId
          );
        }

        // If still no materials found, check if materials are not assigned to specific mini-sections
        // In that case, distribute them equally among all mini-sections in this section
        if (miniSectionAvailableMaterials.length === 0) {
          const unassignedMaterials = projectMaterialsAvailable.filter(
            (material: any) => !material.miniSectionId && !material.sectionId
          );
          
          if (unassignedMaterials.length > 0) {
            // Distribute unassigned materials equally among mini-sections
            const miniSectionCount = miniSectionsData.length;
            miniSectionAvailableMaterials = unassignedMaterials.map(material => ({
              ...material,
              // Divide cost equally among mini-sections
              cost: (material.cost || 0) / miniSectionCount,
              totalCost: (material.totalCost || 0) / miniSectionCount,
            }));
          }
        }

        const availableMaterialsCost = miniSectionAvailableMaterials.reduce(
          (sum: number, material: any) => {
            const cost = material.totalCost || material.cost || 0;
            console.log(`💰 Adding available material cost: ${material.name} = ${cost}`);
            return sum + cost;
          },
          0
        );

        const totalExpense = usedMaterialsCost + availableMaterialsCost;

        console.log(`📊 Mini-section ${miniSection.name}:`, {
          usedMaterialsCost,
          availableMaterialsCost,
          totalExpense,
          availableMaterialsCount: miniSectionAvailableMaterials.length
        });

        return {
          _id: miniSection._id,
          name: miniSection.name,
          totalExpense,
          usedMaterialsCost,
          availableMaterialsCost,
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
  const totalUsedMaterials = miniSections.reduce((sum, ms) => sum + ms.usedMaterialsCost, 0);
  const totalAvailableMaterials = miniSections.reduce((sum, ms) => sum + ms.availableMaterialsCost, 0);

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
    description: `${miniSection.name} expenses (Used: ${formatCurrency(miniSection.usedMaterialsCost)}, Available: ${formatCurrency(miniSection.availableMaterialsCost)})`,
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

        {/* Material Breakdown Stats */}
        {(totalUsedMaterials > 0 || totalAvailableMaterials > 0) && (
          <View style={styles.breakdownStatsSection}>
            <View style={styles.breakdownStatBox}>
              <View style={styles.breakdownStatItem}>
                <View style={styles.breakdownStatIconContainer}>
                  <Ionicons name="cube-outline" size={18} color="#8B5CF6" />
                </View>
                <View style={styles.breakdownStatInfo}>
                  <Text style={styles.breakdownStatLabel}>Used Materials</Text>
                  <Text style={styles.breakdownStatValue}>{formatCurrency(totalUsedMaterials)}</Text>
                </View>
              </View>
              <View style={styles.breakdownStatItem}>
                <View style={styles.breakdownStatIconContainer}>
                  <Ionicons name="layers-outline" size={18} color="#10B981" />
                </View>
                <View style={styles.breakdownStatInfo}>
                  <Text style={styles.breakdownStatLabel}>Available Materials</Text>
                  <Text style={styles.breakdownStatValue}>{formatCurrency(totalAvailableMaterials)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

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
              No materials have been used or made available in any mini-sections yet
            </Text>
          </View>
        ) : (
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <View style={styles.heading}>
              <Text style={styles.title}>Mini-Section Expenses</Text>
              <Text style={styles.subtitle}>Material Costs by Mini-Section (Used + Available)</Text>
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
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statBox: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statBoxPrimary: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  statBoxSecondary: {
    backgroundColor: '#FEF7F0',
    borderColor: '#FED7AA',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  breakdownStatsSection: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  breakdownStatBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breakdownStatIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  breakdownStatInfo: {
    flex: 1,
  },
  breakdownStatLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  breakdownStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  heading: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
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
