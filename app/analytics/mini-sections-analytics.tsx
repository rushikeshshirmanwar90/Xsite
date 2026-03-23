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
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { domain } from '@/lib/domain';

interface MiniSectionExpense {
  _id: string;
  name: string;
  totalExpense: number;
  usedMaterialsCost: number;
  availableMaterialsCost: number;
  laborCost: number; // Remove equipment cost from mini-sections
}

interface EquipmentExpense {
  _id: string;
  name: string;
  totalCost: number;
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
  const [equipmentExpenses, setEquipmentExpenses] = useState<EquipmentExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);

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

      // Get clientId and fetch project data to get MaterialAvailable and Labor data
      const clientId = await getClientId();
      let projectMaterialsAvailable: any[] = [];
      let projectLaborData: any[] = [];
      
      if (clientId && projectId) {
        try {
          const projectData = await getProject(projectId, clientId);
          projectMaterialsAvailable = projectData?.MaterialAvailable || [];
          projectLaborData = projectData?.Labors || []; // Get labor data from project
          
      // Debug logging
      console.log('🔍 Project MaterialAvailable:', projectMaterialsAvailable.length, 'items');
      console.log('👷 Project Labor data:', projectLaborData.length, 'entries');
      if (projectMaterialsAvailable.length > 0) {
        console.log('📋 Sample MaterialAvailable item:', projectMaterialsAvailable[0]);
        console.log('🔑 Available fields in first material:', Object.keys(projectMaterialsAvailable[0]));
      }
      if (projectLaborData.length > 0) {
        console.log('👷 Sample Labor item:', projectLaborData[0]);
        console.log('🔑 Labor fields:', Object.keys(projectLaborData[0]));
      }
      console.log('🎯 Looking for sectionId:', sectionId);
      console.log('📍 Mini-sections:', miniSectionsData.map(ms => ({ id: ms._id, name: ms.name })));
        } catch (error) {
          console.error('Error fetching project data:', error);
        }
      }

      // Fetch equipment costs separately (not linked to mini-sections)
      let sectionEquipmentCosts: EquipmentExpense[] = [];
      try {
        console.log('🔧 Fetching equipment costs for section:', sectionId);
        const equipmentResponse = await axios.get<{
          success: boolean;
          data: {
            equipment: any[];
          };
        }>(`${domain}/api/equipment`, {
          params: {
            projectId: projectId,
            projectSectionId: sectionId
          }
        });

        if (equipmentResponse.data && equipmentResponse.data.success) {
          const equipment = equipmentResponse.data.data.equipment || [];
          console.log('✅ Equipment data loaded:', equipment.length, 'items');
          
          // Group equipment by type/name and calculate total costs
          const equipmentGroups: { [key: string]: number } = {};
          
          equipment.forEach((item: any) => {
            if (item.status === 'active' || !item.status) {
              const equipmentName = item.name || item.type || 'Unknown Equipment';
              equipmentGroups[equipmentName] = (equipmentGroups[equipmentName] || 0) + (item.totalCost || 0);
            }
          });
          
          // Convert to array format
          sectionEquipmentCosts = Object.entries(equipmentGroups).map(([name, cost]) => ({
            _id: `equipment_${name.replace(/\s+/g, '_')}`,
            name: name,
            totalCost: cost
          }));
          
          console.log('🔧 Equipment expenses:', sectionEquipmentCosts);
        }
      } catch (error) {
        console.error('Error fetching equipment costs:', error);
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
        // Include materials that are explicitly assigned to this mini-section OR section-level materials
        let miniSectionAvailableMaterials = projectMaterialsAvailable.filter(
          (material: any) => material.miniSectionId === miniSection._id
        );

        // If no materials found by miniSectionId, include section-level materials
        if (miniSectionAvailableMaterials.length === 0) {
          // Get materials assigned to this section but not to specific mini-sections
          const sectionLevelMaterials = projectMaterialsAvailable.filter(
            (material: any) => material.sectionId === sectionId && !material.miniSectionId
          );
          
          // If there are section-level materials, distribute them among mini-sections
          if (sectionLevelMaterials.length > 0 && miniSectionsData.length > 0) {
            miniSectionAvailableMaterials = sectionLevelMaterials.map(material => ({
              ...material,
              // Divide cost equally among mini-sections for display purposes
              cost: (material.cost || 0) / miniSectionsData.length,
              totalCost: (material.totalCost || 0) / miniSectionsData.length,
            }));
          }
        }

        // If still no materials, check for unassigned materials at project level
        if (miniSectionAvailableMaterials.length === 0) {
          const unassignedMaterials = projectMaterialsAvailable.filter(
            (material: any) => !material.miniSectionId && !material.sectionId
          );
          
          if (unassignedMaterials.length > 0 && miniSectionsData.length > 0) {
            // Distribute unassigned materials equally among mini-sections for display
            miniSectionAvailableMaterials = unassignedMaterials.map(material => ({
              ...material,
              cost: (material.cost || 0) / miniSectionsData.length,
              totalCost: (material.totalCost || 0) / miniSectionsData.length,
            }));
          }
        }

        // Calculate available materials cost (for display purposes only, not included in expenses)
        const availableMaterialsCost = miniSectionAvailableMaterials.reduce(
          (sum: number, material: any) => {
            const cost = material.totalCost || material.cost || 0;
            console.log(`💰 Available material (for display): ${material.name} = ${cost}`);
            return sum + cost;
          },
          0
        );

        // Calculate labor cost for this mini-section
        const miniSectionLaborEntries = projectLaborData.filter(
          (labor: any) => labor.miniSectionId === miniSection._id && (labor.status === 'active' || !labor.status)
        );

        const laborCost = miniSectionLaborEntries.reduce(
          (sum: number, labor: any) => sum + (labor.totalCost || 0),
          0
        );

        console.log(`👷 Mini-section ${miniSection.name} labor:`, {
          laborEntries: miniSectionLaborEntries.length,
          laborCost: laborCost,
          laborDetails: miniSectionLaborEntries.map(l => ({ type: l.type, cost: l.totalCost }))
        });

        // Calculate total expense - only include used materials and labor costs
        // Equipment costs are handled separately since they're not linked to mini-sections
        const totalExpense = usedMaterialsCost + laborCost;

        console.log(`📊 Mini-section ${miniSection.name}:`, {
          usedMaterialsCost,
          availableMaterialsCost,
          laborCost,
          totalExpense: totalExpense, // Used materials + labor only
          availableMaterialsCount: miniSectionAvailableMaterials.length,
          laborEntriesCount: miniSectionLaborEntries.length,
          note: 'Equipment costs handled separately'
        });

        return {
          _id: miniSection._id,
          name: miniSection.name,
          totalExpense,
          usedMaterialsCost,
          availableMaterialsCost,
          laborCost,
        };
      });

      // Filter mini-sections with actual expenses > 0 (only used materials + labor)
      const activeMiniSections = miniSectionExpenses.filter((ms) => ms.usedMaterialsCost > 0 || ms.laborCost > 0);
      setMiniSections(activeMiniSections);
      
      // Set equipment expenses separately
      setEquipmentExpenses(sectionEquipmentCosts);

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

  const totalMiniSectionExpense = miniSections.reduce((sum, ms) => sum + ms.totalExpense, 0);
  const totalEquipmentExpense = equipmentExpenses.reduce((sum, eq) => sum + eq.totalCost, 0);
  const totalExpense = totalMiniSectionExpense + totalEquipmentExpense;
  
  const totalUsedMaterials = miniSections.reduce((sum, ms) => sum + ms.usedMaterialsCost, 0);
  const totalAvailableMaterials = miniSections.reduce((sum, ms) => sum + ms.availableMaterialsCost, 0);
  const totalLaborCost = miniSections.reduce((sum, ms) => sum + ms.laborCost, 0);

  // Transform to pie data - combine mini-sections and single equipment slice
  const miniSectionPieData = miniSections.map((miniSection, index) => ({
    key: miniSection._id,
    value: miniSection.totalExpense,
    svg: {
      fill: colors[index % colors.length].primary,
      gradientId: `gradient_${miniSection._id}`,
    },
    name: miniSection.name,
    formattedBudget: formatCurrency(miniSection.totalExpense),
    percentage: ((miniSection.totalExpense / totalExpense) * 100).toFixed(1),
    description: `Materials: ${formatCurrency(miniSection.usedMaterialsCost)} | Labor: ${formatCurrency(miniSection.laborCost)}`,
  }));

  // Single equipment slice (merged all equipment)
  const equipmentPieData = totalEquipmentExpense > 0 ? [{
    key: 'equipment_total',
    value: totalEquipmentExpense,
    svg: {
      fill: colors[miniSections.length % colors.length].primary,
      gradientId: `gradient_equipment_total`,
    },
    name: 'Equipment Cost',
    formattedBudget: formatCurrency(totalEquipmentExpense),
    percentage: ((totalEquipmentExpense / totalExpense) * 100).toFixed(1),
    description: `Total Equipment Costs`,
  }] : [];

  const pieData = [...miniSectionPieData, ...equipmentPieData];

  const legendData: LegendItem[] = pieData.map((item, index) => ({
    key: item.key,
    name: item.name,
    value: item.formattedBudget,
    percentage: item.percentage,
    color: colors[index % colors.length].primary,
    description: item.description,
  }));

  const handleMiniSectionPress = (miniSectionId: string, miniSectionName: string) => {
    // Handle equipment click separately
    if (miniSectionId === 'equipment_total') {
      setShowEquipmentModal(true);
      return;
    }
    
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

        {/* Material, Equipment & Labor Breakdown Stats */}
        {(totalUsedMaterials > 0 || totalAvailableMaterials > 0 || totalEquipmentExpense > 0 || totalLaborCost > 0) && (
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
              <View style={styles.breakdownStatItem}>
                <View style={styles.breakdownStatIconContainer}>
                  <Ionicons name="construct-outline" size={18} color="#F59E0B" />
                </View>
                <View style={styles.breakdownStatInfo}>
                  <Text style={styles.breakdownStatLabel}>Equipment Costs</Text>
                  <Text style={styles.breakdownStatValue}>{formatCurrency(totalEquipmentExpense)}</Text>
                </View>
              </View>
              <View style={styles.breakdownStatItem}>
                <View style={styles.breakdownStatIconContainer}>
                  <Ionicons name="people-outline" size={18} color="#EF4444" />
                </View>
                <View style={styles.breakdownStatInfo}>
                  <Text style={styles.breakdownStatLabel}>Labor Costs</Text>
                  <Text style={styles.breakdownStatValue}>{formatCurrency(totalLaborCost)}</Text>
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
        ) : (miniSections.length === 0 && equipmentExpenses.length === 0) ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="grid-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Actual Expenses</Text>
            <Text style={styles.emptySubtitle}>
              No materials have been used, no equipment costs incurred, and no labor costs recorded in any mini-sections yet
            </Text>
          </View>
        ) : (
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <View style={styles.heading}>
              <Text style={styles.title}>Mini-Section Actual Expenses</Text>
              <Text style={styles.subtitle}>Used Materials + Equipment + Labor Costs</Text>
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
                  subtitle: `${miniSections.length} Mini-Section${miniSections.length > 1 ? 's' : ''} (Materials + Equipment + Labor)`,
                }}
              />
            </View>

            <PieChartLegend
              items={legendData}
              onItemClick={handleMiniSectionPress}
              showPercentage={true}
              showDescription={true}
              layout="vertical"
            />
          </Animated.View>
        )}
      </ScrollView>
      
      {/* Equipment Breakdown Modal */}
      <Modal
        visible={showEquipmentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEquipmentModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Equipment Cost Breakdown</Text>
            <TouchableOpacity 
              onPress={() => setShowEquipmentModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalStats}>
              <Text style={styles.modalTotalLabel}>Total Equipment Cost</Text>
              <Text style={styles.modalTotalValue}>{formatCurrency(totalEquipmentExpense)}</Text>
            </View>
            
            {equipmentExpenses.map((equipment, index) => (
              <View key={equipment._id} style={styles.modalEquipmentItem}>
                <View style={styles.modalEquipmentHeader}>
                  <Ionicons name="construct" size={20} color="#F59E0B" />
                  <Text style={styles.modalEquipmentName}>{equipment.name}</Text>
                </View>
                <Text style={styles.modalEquipmentCost}>{formatCurrency(equipment.totalCost)}</Text>
                <Text style={styles.modalEquipmentPercentage}>
                  {((equipment.totalCost / totalEquipmentExpense) * 100).toFixed(1)}%
                </Text>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    flexDirection: 'column',
    gap: 12,
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
  equipmentBreakdownContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  equipmentBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  equipmentName: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
    marginLeft: 6,
  },
  equipmentCost: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F0F3F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalStats: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalTotalLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 8,
  },
  modalTotalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F59E0B',
  },
  modalEquipmentItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalEquipmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalEquipmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
  },
  modalEquipmentCost: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
    marginRight: 8,
  },
  modalEquipmentPercentage: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});
