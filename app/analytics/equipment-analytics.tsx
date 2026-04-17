// Equipment Cost Analytics Page
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

interface EquipmentDetail {
  _id: string;
  name?: string;
  type: string;
  category: string;
  quantity: number;
  perUnitCost: number;
  totalCost: number;
  costType?: 'rental' | 'purchase' | 'lease';
  rentalPeriod?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  rentalDuration?: number;
  specifications?: {
    model?: string;
    brand?: string;
    capacity?: string;
    fuelType?: string;
  };
  usageDate?: string;
  createdAt: string;
  notes?: string;
}

const EquipmentAnalytics: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.projectId as string;
  const projectName = params.projectName as string;
  const sectionId = params.sectionId as string;
  const sectionName = params.sectionName as string;
  const equipmentsData = params.equipments as string;

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const colors = PieChartColors20;

  const [equipmentDetails, setEquipmentDetails] = useState<EquipmentDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEquipmentDetails();
  }, [equipmentsData]);

  const loadEquipmentDetails = async () => {
    try {
      setLoading(true);

      console.log('\n🔍 ========== EQUIPMENT ANALYTICS DEBUG ==========');
      console.log('🔍 Equipment Analytics - Loading details');
      console.log('   - SectionId:', sectionId);
      console.log('   - SectionName:', sectionName);
      console.log('   - ProjectId:', projectId);

      // Try to fetch from API first
      try {
        const { domain } = await import('@/lib/domain');
        const axios = (await import('axios')).default;

        const equipmentResponse = await axios.get<{
          success: boolean;
          data: any[];
        }>(`${domain}/api/equipment`, {
          params: {
            projectId: projectId,
            projectSectionId: sectionId,
          }
        });

        if (equipmentResponse.data && equipmentResponse.data.success) {
          const allEquipment = equipmentResponse.data.data || [];
          console.log('   - Equipment from API:', allEquipment.length);

          // Filter for active equipment in this section
          const sectionEquipment = allEquipment.filter((equipment: any) => {
            const isActive = equipment.status === 'active' || !equipment.status;
            const hasSectionId = equipment.sectionId === sectionId || equipment.projectSectionId === sectionId;
            const hasNoSectionId = !equipment.sectionId && !equipment.projectSectionId;
            return isActive && (hasSectionId || hasNoSectionId);
          });

          console.log('   - Filtered equipment:', sectionEquipment.length);

          // Transform to EquipmentDetail format
          const details: EquipmentDetail[] = sectionEquipment.map((equipment: any) => ({
            _id: equipment._id,
            name: equipment.name,
            type: equipment.type,
            category: equipment.category,
            quantity: equipment.quantity,
            perUnitCost: equipment.perUnitCost,
            totalCost: equipment.totalCost,
            costType: equipment.costType,
            rentalPeriod: equipment.rentalPeriod,
            rentalDuration: equipment.rentalDuration,
            specifications: equipment.specifications,
            usageDate: equipment.usageDate,
            createdAt: equipment.createdAt,
            notes: equipment.notes,
          }));

          setEquipmentDetails(details);
        }
      } catch (apiError) {
        console.error('Error fetching from API:', apiError);
        
        // Fallback to params if API fails
        if (equipmentsData) {
          const parsedEquipments = JSON.parse(Array.isArray(equipmentsData) ? equipmentsData[0] : equipmentsData);
          
          const sectionEquipment = parsedEquipments.filter((equipment: any) => {
            const isActive = equipment.status === 'active' || !equipment.status;
            const hasSectionId = equipment.sectionId === sectionId || equipment.projectSectionId === sectionId;
            const hasNoSectionId = !equipment.sectionId && !equipment.projectSectionId;
            return isActive && (hasSectionId || hasNoSectionId);
          });

          setEquipmentDetails(sectionEquipment);
        }
      }

      // Animate
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error loading equipment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalExpense = equipmentDetails.reduce((sum, equipment) => sum + equipment.totalCost, 0);
  const totalQuantity = equipmentDetails.reduce((sum, equipment) => sum + equipment.quantity, 0);

  // Sort equipment by cost (highest first) for pie chart
  const sortedEquipment = [...equipmentDetails].sort((a, b) => b.totalCost - a.totalCost);
  
  // Transform equipment to pie data
  const equipmentPieData = sortedEquipment.map((equipment, index) => ({
    key: equipment._id,
    value: equipment.totalCost,
    svg: {
      fill: colors[index % colors.length].primary,
      gradientId: `gradient_${equipment._id}`,
    },
    name: equipment.name || equipment.type,
    formattedBudget: formatCurrency(equipment.totalCost),
    percentage: (equipment.totalCost / totalExpense * 100).toFixed(1),
    description: `${equipment.quantity} unit${equipment.quantity !== 1 ? 's' : ''}`,
  }));

  // Create legend data for equipment
  const equipmentLegendData: LegendItem[] = equipmentPieData.map((item, index) => ({
    key: item.key,
    name: item.name,
    value: item.formattedBudget,
    percentage: item.percentage,
    color: colors[index % colors.length].primary,
    description: item.description,
  }));

  // Get equipment icon and color based on category
  const getEquipmentIconAndColor = (category: string) => {
    const categoryMap: { [key: string]: { icon: keyof typeof Ionicons.glyphMap, color: string } } = {
      'Earthmoving & Excavation Equipment': { icon: 'construct-outline', color: '#8B5CF6' },
      'Material Handling & Lifting': { icon: 'arrow-up-outline', color: '#10B981' },
      'Concrete & Paving Equipment': { icon: 'cube-outline', color: '#F59E0B' },
      'Hauling & Transport Vehicles': { icon: 'car-outline', color: '#EF4444' },
      'Specialty & Finishing Equipment': { icon: 'settings-outline', color: '#6366F1' },
    };

    return categoryMap[category] || { icon: 'construct-outline', color: '#F59E0B' };
  };

  const getCostTypeDisplay = (equipment: EquipmentDetail) => {
    if (equipment.costType === 'rental' && equipment.rentalPeriod && equipment.rentalDuration) {
      return `Rental - ${equipment.rentalDuration} ${equipment.rentalPeriod}`;
    }
    return equipment.costType || 'Purchase';
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
              <Text style={styles.projectName}>Equipment Cost</Text>
              <Text style={styles.projectSubtitle}>Equipment Breakdown</Text>
            </View>
          </View>
        </View>

        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbText}>{projectName}</Text>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          <Text style={styles.breadcrumbText}>{sectionName}</Text>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          <Text style={styles.breadcrumbText}>Equipment Cost</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text style={styles.loadingText}>Loading equipment details...</Text>
          </View>
        ) : equipmentDetails.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="construct-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Equipment Found</Text>
            <Text style={styles.emptySubtitle}>
              No equipment entries found for this section.
            </Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Total Expense Card */}
            <View style={styles.totalCard}>
              <View style={styles.totalIconContainer}>
                <Ionicons name="construct" size={32} color="#F59E0B" />
              </View>
              <View style={styles.totalInfo}>
                <Text style={styles.totalLabel}>TOTAL EXPENSE</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalExpense)}</Text>
                <Text style={styles.totalSubtext}>
                  {equipmentDetails.length} {equipmentDetails.length === 1 ? 'item' : 'items'} • {totalQuantity} {totalQuantity === 1 ? 'unit' : 'units'}
                </Text>
              </View>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="layers-outline" size={20} color="#F59E0B" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statLabel}>Total Items</Text>
                  <Text style={[styles.statValue, { color: '#F59E0B' }]}>{equipmentDetails.length}</Text>
                </View>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#FEF7F0' }]}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="cash-outline" size={20} color="#F97316" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statLabel}>Equipment Cost</Text>
                  <Text style={[styles.statValue, { color: '#F97316' }]}>{formatCurrency(totalExpense)}</Text>
                </View>
              </View>
            </View>

            {/* Equipment Breakdown Section */}
            <View style={styles.section}>
              {/* Pie Chart for Equipment */}
              <View style={styles.chartCard}>
                <View style={styles.chartHeading}>
                  <Text style={styles.chartTitle}>Equipment Cost Distribution</Text>
                  <Text style={styles.chartSubtitle}>Sorted by highest cost</Text>
                </View>
                
                <View style={styles.chartContainer}>
                  <PieChart
                    data={equipmentPieData}
                    colors={colors}
                    size={260}
                    enableAnimation={true}
                    enableHover={true}
                    labelType="amount"
                    centerContent={{
                      label: 'TOTAL EQUIPMENT',
                      value: formatCurrency(totalExpense),
                      subtitle: `${equipmentDetails.length} Item${equipmentDetails.length > 1 ? 's' : ''}`
                    }}
                  />
                </View>

                <PieChartLegend
                  items={equipmentLegendData}
                  showPercentage={true}
                  showDescription={true}
                  layout="vertical"
                />
              </View>

              <Text style={styles.sectionTitle}>Equipment Breakdown</Text>
            </View>

            {/* Equipment Cards */}
            {sortedEquipment.map((equipment, index) => {
              const { icon, color } = getEquipmentIconAndColor(equipment.category);
              
              return (
                <View key={equipment._id} style={styles.equipmentCard}>
                  <View style={styles.equipmentHeader}>
                    <View style={[styles.equipmentIcon, { backgroundColor: `${color}15` }]}>
                      <Ionicons name={icon} size={24} color={color} />
                    </View>
                    <View style={styles.equipmentInfo}>
                      <Text style={styles.equipmentType}>{equipment.name || equipment.type}</Text>
                      <Text style={styles.equipmentCategory}>{equipment.category}</Text>
                    </View>
                    <Text style={[styles.equipmentCost, { color }]}>{formatCurrency(equipment.totalCost)}</Text>
                  </View>

                  <View style={styles.equipmentDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Quantity:</Text>
                      <Text style={styles.detailValue}>{equipment.quantity}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Per Unit Cost:</Text>
                      <Text style={styles.detailValue}>{formatCurrency(equipment.perUnitCost)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Total Cost:</Text>
                      <Text style={[styles.detailValue, styles.totalCostValue]}>
                        {formatCurrency(equipment.totalCost)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Type:</Text>
                      <Text style={styles.detailValue}>{getCostTypeDisplay(equipment)}</Text>
                    </View>
                    
                    {equipment.specifications && (
                      <>
                        {equipment.specifications.model && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Model:</Text>
                            <Text style={styles.detailValue}>{equipment.specifications.model}</Text>
                          </View>
                        )}
                        {equipment.specifications.brand && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Brand:</Text>
                            <Text style={styles.detailValue}>{equipment.specifications.brand}</Text>
                          </View>
                        )}
                        {equipment.specifications.capacity && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Capacity:</Text>
                            <Text style={styles.detailValue}>{equipment.specifications.capacity}</Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>

                  {equipment.notes && (
                    <View style={styles.notesContainer}>
                      <Text style={styles.notesLabel}>Notes:</Text>
                      <Text style={styles.notesText}>{equipment.notes}</Text>
                    </View>
                  )}

                  <View style={styles.equipmentFooter}>
                    <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
                    <Text style={styles.dateText}>
                      Added: {new Date(equipment.createdAt).toLocaleDateString('en-IN', {
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

export default EquipmentAnalytics;

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
    backgroundColor: '#FEF3C7',
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
    color: '#F59E0B',
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
  equipmentCard: {
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
  equipmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  equipmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentType: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  equipmentCategory: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  equipmentCost: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  equipmentDetails: {
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
    color: '#F59E0B',
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
  equipmentFooter: {
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
