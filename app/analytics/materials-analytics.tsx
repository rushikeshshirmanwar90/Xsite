// Level 4: Materials List for Mini-Section
import { getClientId } from '@/functions/clientId';
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

interface MaterialUsed {
  _id: string;
  name: string;
  qnt: number;
  unit: string;
  cost?: number;
  totalCost?: number;
  specs: Record<string, any>;
  addedAt?: string;
  createdAt?: string;
}

interface LaborUsed {
  _id?: string;
  type: string;
  category: string;
  count: number;
  perLaborCost: number;
  totalCost: number;
  status?: string;
  addedAt?: Date;
  notes?: string;
  workDate?: Date;
  miniSectionId?: string;
  miniSectionName?: string;
  sectionId?: string;
}

const MaterialsAnalytics: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.projectId as string;
  const projectName = params.projectName as string;
  const sectionName = params.sectionName as string;
  const miniSectionId = params.miniSectionId as string;
  const miniSectionName = params.miniSectionName as string;
  const materialUsed = params.materialUsed as string;

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const [materials, setMaterials] = useState<MaterialUsed[]>([]);
  const [labors, setLabors] = useState<LaborUsed[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'materials' | 'labor'>('materials');

  useEffect(() => {
    loadMaterials();
  }, [miniSectionId, materialUsed, projectId]);

  // Helper function to consolidate materials with same name and specs
  const consolidateMaterials = (materials: MaterialUsed[]): MaterialUsed[] => {
    const consolidated: { [key: string]: MaterialUsed } = {};

    materials.forEach(material => {
      // Create a unique key based on name and specs
      const specsKey = JSON.stringify(material.specs || {});
      const key = `${material.name.toLowerCase()}-${specsKey}`;

      if (consolidated[key]) {
        // Merge with existing material
        consolidated[key] = {
          ...consolidated[key],
          qnt: consolidated[key].qnt + material.qnt,
          totalCost: (consolidated[key].totalCost || consolidated[key].cost || 0) + (material.totalCost || material.cost || 0),
          cost: undefined, // Clear individual cost since we're using totalCost
          // Keep the earliest date
          addedAt: consolidated[key].addedAt && material.addedAt 
            ? (new Date(consolidated[key].addedAt!) < new Date(material.addedAt!) 
               ? consolidated[key].addedAt 
               : material.addedAt)
            : consolidated[key].addedAt || material.addedAt,
          createdAt: consolidated[key].createdAt && material.createdAt 
            ? (new Date(consolidated[key].createdAt!) < new Date(material.createdAt!) 
               ? consolidated[key].createdAt 
               : material.createdAt)
            : consolidated[key].createdAt || material.createdAt,
        };
      } else {
        // Add new material
        consolidated[key] = {
          ...material,
          totalCost: material.totalCost || material.cost || 0,
          cost: undefined, // Clear individual cost since we're using totalCost
        };
      }
    });

    return Object.values(consolidated);
  };

  // Helper function to consolidate labors with same category and type
  const consolidateLabors = (labors: LaborUsed[]): LaborUsed[] => {
    const consolidated: { [key: string]: LaborUsed } = {};

    labors.forEach(labor => {
      // Create a unique key based on category and type
      const key = `${labor.category.toLowerCase()}-${labor.type.toLowerCase()}`;

      if (consolidated[key]) {
        // Merge with existing labor
        const existingLabor = consolidated[key];
        const totalCount = existingLabor.count + labor.count;
        const totalCost = existingLabor.totalCost + labor.totalCost;
        
        // Calculate weighted average per labor cost
        const weightedPerLaborCost = totalCost / totalCount;

        consolidated[key] = {
          ...consolidated[key],
          count: totalCount,
          totalCost: totalCost,
          perLaborCost: weightedPerLaborCost,
          // Keep the earliest date
          addedAt: consolidated[key].addedAt && labor.addedAt 
            ? (new Date(consolidated[key].addedAt!) < new Date(labor.addedAt!) 
               ? consolidated[key].addedAt 
               : labor.addedAt)
            : consolidated[key].addedAt || labor.addedAt,
          workDate: consolidated[key].workDate && labor.workDate 
            ? (new Date(consolidated[key].workDate!) < new Date(labor.workDate!) 
               ? consolidated[key].workDate 
               : labor.workDate)
            : consolidated[key].workDate || labor.workDate,
          // Combine notes if they exist
          notes: consolidated[key].notes && labor.notes 
            ? `${consolidated[key].notes}; ${labor.notes}`
            : consolidated[key].notes || labor.notes,
        };
      } else {
        // Add new labor
        consolidated[key] = { ...labor };
      }
    });

    return Object.values(consolidated);
  };

  const loadMaterials = async () => {
    try {
      setLoading(true);

      const parsedMaterialUsed = materialUsed
        ? JSON.parse(Array.isArray(materialUsed) ? materialUsed[0] : materialUsed)
        : [];

      // Filter materials for this mini-section
      const miniSectionMaterials = parsedMaterialUsed.filter(
        (material: any) => material.miniSectionId === miniSectionId
      );

      // Consolidate materials with same name and specs
      const consolidatedMaterials = consolidateMaterials(miniSectionMaterials);

      // Get clientId and fetch project data to get Labors field
      const clientId = await getClientId();
      if (!clientId) {
        console.error('❌ No clientId found');
        setMaterials(consolidatedMaterials);
        setLabors([]);
        return;
      }

      const projectData = await getProject(projectId, clientId);
      const projectLabors = projectData?.Labors || [];

      // Filter labors for this mini-section
      const miniSectionLabors = projectLabors.filter(
        (labor: any) => labor.miniSectionId === miniSectionId
      );

      // Consolidate labors with same category and type
      const consolidatedLabors = consolidateLabors(miniSectionLabors);

      setMaterials(consolidatedMaterials);
      setLabors(consolidatedLabors);

      // Animate
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error loading materials and labors:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalExpense = materials.reduce((sum, material) => sum + (material.totalCost || 0), 0);
  const totalLaborExpense = labors.reduce((sum, labor) => sum + (labor.totalCost || 0), 0);
  const grandTotal = totalExpense + totalLaborExpense;

  const getMaterialIcon = (materialName: string) => {
    const name = materialName.toLowerCase();
    if (name.includes('cement')) return 'cube-outline';
    if (name.includes('brick')) return 'square-outline';
    if (name.includes('steel') || name.includes('rod')) return 'barbell-outline';
    if (name.includes('sand')) return 'layers-outline';
    if (name.includes('paint')) return 'color-palette-outline';
    if (name.includes('tile')) return 'grid-outline';
    if (name.includes('pipe')) return 'ellipse-outline';
    if (name.includes('wood')) return 'leaf-outline';
    return 'cube-outline';
  };

  const getMaterialColor = (materialName: string) => {
    const name = materialName.toLowerCase();
    if (name.includes('cement')) return '#8B5CF6';
    if (name.includes('brick')) return '#EF4444';
    if (name.includes('steel') || name.includes('rod')) return '#6B7280';
    if (name.includes('sand')) return '#F59E0B';
    if (name.includes('paint')) return '#EC4899';
    if (name.includes('tile')) return '#06B6D4';
    if (name.includes('pipe')) return '#8B5CF6';
    if (name.includes('wood')) return '#84CC16';
    return '#3B82F6';
  };

  const getLaborIconAndColor = (category: string) => {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('civil') || categoryLower.includes('structural')) {
      return { icon: 'hammer-outline', color: '#EF4444' };
    }
    if (categoryLower.includes('electrical')) {
      return { icon: 'flash-outline', color: '#F59E0B' };
    }
    if (categoryLower.includes('plumbing') || categoryLower.includes('sanitary')) {
      return { icon: 'water-outline', color: '#3B82F6' };
    }
    if (categoryLower.includes('finishing')) {
      return { icon: 'brush-outline', color: '#EC4899' };
    }
    if (categoryLower.includes('hvac') || categoryLower.includes('mechanical')) {
      return { icon: 'thermometer-outline', color: '#F97316' };
    }
    if (categoryLower.includes('fire') || categoryLower.includes('safety')) {
      return { icon: 'flame-outline', color: '#DC2626' };
    }
    if (categoryLower.includes('external') || categoryLower.includes('infrastructure')) {
      return { icon: 'leaf-outline', color: '#65A30D' };
    }
    if (categoryLower.includes('waterproofing') || categoryLower.includes('treatment')) {
      return { icon: 'shield-outline', color: '#10B981' };
    }
    if (categoryLower.includes('management') || categoryLower.includes('support')) {
      return { icon: 'people-outline', color: '#1E40AF' };
    }
    if (categoryLower.includes('equipment') || categoryLower.includes('operator')) {
      return { icon: 'car-outline', color: '#7C2D12' };
    }
    if (categoryLower.includes('security') || categoryLower.includes('housekeeping')) {
      return { icon: 'shield-checkmark-outline', color: '#374151' };
    }
    
    return { icon: 'person-outline', color: '#6B7280' };
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
              <Text style={styles.projectName}>{miniSectionName}</Text>
              <Text style={styles.projectSubtitle}>Materials Used</Text>
            </View>
          </View>
        </View>

        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbText}>{projectName}</Text>
          <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
          <Text style={styles.breadcrumbText}>{sectionName}</Text>
          <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
          <Text style={styles.breadcrumbTextActive}>{miniSectionName}</Text>
        </View>

        {/* Total Expense Card */}
        <View style={styles.totalCard}>
          <View style={styles.totalIconContainer}>
            <Ionicons name="receipt-outline" size={24} color="#059669" />
          </View>
          <View style={styles.totalInfo}>
            <Text style={styles.totalLabel}>TOTAL EXPENSE</Text>
            <Text style={styles.totalValue}>{formatCurrency(grandTotal)}</Text>
            <Text style={styles.totalSubtext}>
              {materials.length} material{materials.length !== 1 ? 's' : ''} • {labors.length} labor{labors.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Expense Breakdown */}
        {(materials.length > 0 || labors.length > 0) && (
          <View style={styles.breakdownContainer}>
            <View style={styles.breakdownCard}>
              <TouchableOpacity 
                style={[styles.breakdownItem, activeTab === 'materials' && styles.breakdownItemActive]}
                onPress={() => setActiveTab('materials')}
              >
                <View style={styles.breakdownIconContainer}>
                  <Ionicons name="cube-outline" size={20} color="#8B5CF6" />
                </View>
                <View style={styles.breakdownInfo}>
                  <Text style={styles.breakdownLabel}>Materials</Text>
                  <Text style={styles.breakdownValue}>{formatCurrency(totalExpense)}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.breakdownItem, activeTab === 'labor' && styles.breakdownItemActive]}
                onPress={() => setActiveTab('labor')}
              >
                <View style={styles.breakdownIconContainer}>
                  <Ionicons name="people-outline" size={20} color="#F59E0B" />
                </View>
                <View style={styles.breakdownInfo}>
                  <Text style={styles.breakdownLabel}>Labor</Text>
                  <Text style={styles.breakdownValue}>{formatCurrency(totalLaborExpense)}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading materials and labor...</Text>
          </View>
        ) : materials.length === 0 && labors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Data Available</Text>
            <Text style={styles.emptySubtitle}>
              No materials or labor have been used in this mini-section yet
            </Text>
          </View>
        ) : (
          <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
            {/* Materials Section */}
            {activeTab === 'materials' && materials.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Materials Breakdown</Text>
                {materials.map((material, index) => (
                  <View key={material._id || index} style={styles.materialCard}>
                    <View style={styles.materialHeader}>
                      <View
                        style={[
                          styles.materialIconContainer,
                          { backgroundColor: `${getMaterialColor(material.name)}20` },
                        ]}
                      >
                        <Ionicons
                          name={getMaterialIcon(material.name) as any}
                          size={24}
                          color={getMaterialColor(material.name)}
                        />
                      </View>
                      <View style={styles.materialInfo}>
                        <Text style={styles.materialName}>{material.name}</Text>
                        <Text style={styles.materialQuantity}>
                          {material.qnt} {material.unit}
                        </Text>
                      </View>
                      <View style={styles.materialCostContainer}>
                        <Text style={styles.materialCost}>{formatCurrency(material.totalCost || 0)}</Text>
                        <Text style={styles.materialCostLabel}>Total Cost</Text>
                      </View>
                    </View>

                    {/* Specs */}
                    {material.specs && Object.keys(material.specs).length > 0 && (
                      <View style={styles.specsContainer}>
                        <Text style={styles.specsTitle}>Specifications:</Text>
                        {Object.entries(material.specs).map(([key, value]) => (
                          <View key={key} style={styles.specRow}>
                            <Text style={styles.specKey}>{key}:</Text>
                            <Text style={styles.specValue}>{String(value)}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Date */}
                    {(material.addedAt || material.createdAt) && (
                      <View style={styles.dateContainer}>
                        <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
                        <Text style={styles.dateText}>
                          Added: {new Date(material.addedAt || material.createdAt!).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Labor Section */}
            {activeTab === 'labor' && labors.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Labor Breakdown</Text>
                {labors.map((labor, index) => {
                  const { icon, color } = getLaborIconAndColor(labor.category);
                  return (
                    <View key={labor._id || index} style={styles.laborCard}>
                      <View style={styles.laborHeader}>
                        <View
                          style={[
                            styles.laborIconContainer,
                            { backgroundColor: `${color}20` },
                          ]}
                        >
                          <Ionicons
                            name={icon as any}
                            size={24}
                            color={color}
                          />
                        </View>
                        <View style={styles.laborInfo}>
                          <Text style={styles.laborCategory}>{labor.category}</Text>
                          <Text style={styles.laborType}>{labor.type}</Text>
                          <Text style={styles.laborDetails}>
                            {labor.count} laborer{labor.count !== 1 ? 's' : ''} • {formatCurrency(labor.perLaborCost)}/day avg
                          </Text>
                        </View>
                        <View style={styles.laborCostContainer}>
                          <Text style={styles.laborCost}>{formatCurrency(labor.totalCost)}</Text>
                          <Text style={styles.laborCostLabel}>Total Cost</Text>
                        </View>
                      </View>

                      {/* Notes */}
                      {labor.notes && (
                        <View style={styles.notesContainer}>
                          <Text style={styles.notesTitle}>Notes:</Text>
                          <Text style={styles.notesText}>{labor.notes}</Text>
                        </View>
                      )}

                      {/* Date */}
                      {(labor.addedAt || labor.workDate) && (
                        <View style={styles.dateContainer}>
                          <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
                          <Text style={styles.dateText}>
                            Added: {new Date(labor.addedAt || labor.workDate!).toLocaleDateString()}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Empty State for Active Tab */}
            {((activeTab === 'materials' && materials.length === 0) || 
              (activeTab === 'labor' && labors.length === 0)) && (
              <View style={styles.emptyTabContainer}>
                <Ionicons 
                  name={activeTab === 'materials' ? 'cube-outline' : 'people-outline'} 
                  size={64} 
                  color="#CBD5E1" 
                />
                <Text style={styles.emptyTitle}>
                  No {activeTab === 'materials' ? 'Materials' : 'Labor'} Data
                </Text>
                <Text style={styles.emptySubtitle}>
                  No {activeTab === 'materials' ? 'materials have been used' : 'labor has been assigned'} in this mini-section yet
                </Text>
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MaterialsAnalytics;

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
    gap: 6,
    flexWrap: 'wrap',
  },
  breadcrumbText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  breadcrumbTextActive: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '600',
  },
  totalCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  totalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  totalInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  totalSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  breakdownContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  breakdownCard: {
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
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  breakdownItemActive: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  breakdownIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  breakdownInfo: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  materialsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  materialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  materialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  materialIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  materialQuantity: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  materialCostContainer: {
    alignItems: 'flex-end',
  },
  materialCost: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 2,
  },
  materialCostLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  specsContainer: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  specsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  specRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  specKey: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginRight: 8,
    textTransform: 'capitalize',
  },
  specValue: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '500',
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  laborCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  laborHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  laborIconContainer: {
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
  laborCategory: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  laborType: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  laborDetails: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  laborCostContainer: {
    alignItems: 'flex-end',
  },
  laborCost: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F59E0B',
    marginBottom: 2,
  },
  laborCostLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  notesContainer: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '500',
    lineHeight: 16,
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
  emptyTabContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
});
