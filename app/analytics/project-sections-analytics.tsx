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
  const materialUsed = params.materialUsed as string;
  const laborsData = params.labors as string;
  const equipmentsData = params.equipments as string; // Add equipment data

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const colors = PieChartColors20;

  const [sections, setSections] = useState<SectionExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [totalUsed, setTotalUsed] = useState(0);
  const [totalLabor, setTotalLabor] = useState(0);
  const [totalEquipment, setTotalEquipment] = useState(0); // Add total equipment state
  const [totalImported, setTotalImported] = useState(0); // Add total imported materials state
  const [parsedEquipments, setParsedEquipments] = useState<any[]>([]); // Add state for equipment data

  useEffect(() => {
    loadSectionExpenses();
  }, [sectionsData, materialUsed, materialAvailable, laborsData, equipmentsData]);

  const loadSectionExpenses = async () => {
    try {
      setLoading(true);

      console.log('🔍 Project Sections Analytics - Loading expenses');
      console.log('   - Sections data:', sectionsData ? 'Present' : 'Missing');
      console.log('   - Material used:', materialUsed ? 'Present' : 'Missing');
      console.log('   - Material available:', materialAvailable ? 'Present' : 'Missing');
      console.log('   - Labors data:', laborsData ? 'Present' : 'Missing');
      console.log('   - Equipments data:', equipmentsData ? 'Present' : 'Missing');

      const parsedSections = JSON.parse(
        Array.isArray(sectionsData) ? sectionsData[0] : sectionsData
      );
      
      const parsedMaterialUsed = materialUsed
        ? JSON.parse(Array.isArray(materialUsed) ? materialUsed[0] : materialUsed)
        : [];

      const parsedMaterialAvailable = materialAvailable
        ? JSON.parse(Array.isArray(materialAvailable) ? materialAvailable[0] : materialAvailable)
        : [];

      const parsedLabors = laborsData
        ? JSON.parse(Array.isArray(laborsData) ? laborsData[0] : laborsData)
        : [];

      // Try to fetch equipment data from API if not available in params
      let parsedEquipments = [];
      if (equipmentsData) {
        try {
          parsedEquipments = JSON.parse(Array.isArray(equipmentsData) ? equipmentsData[0] : equipmentsData);
          console.log('   - Equipment data parsed from params:', parsedEquipments.length);
          if (parsedEquipments.length > 0) {
            console.log('   - Sample equipment from params:', JSON.stringify(parsedEquipments[0], null, 2));
          }
        } catch (error) {
          console.error('   - Error parsing equipment data from params:', error);
        }
      }

      // ALWAYS try to fetch from API as equipment data is often not in project object
      console.log('🔧 Fetching equipment data from API...');
      try {
        const { domain } = await import('@/lib/domain');
        const axios = (await import('axios')).default;
        
        const equipmentResponse = await axios.get<{
          success: boolean;
          data: any[];
        }>(`${domain}/api/equipment`, {
          params: {
            projectId: projectId,
          }
        });

        console.log('   - Equipment API response received');
        console.log('   - Response success:', equipmentResponse.data?.success);

        if (equipmentResponse.data && equipmentResponse.data.success) {
          const apiEquipments = equipmentResponse.data.data || [];
          console.log('✅ Equipment data fetched from API:', apiEquipments.length, 'items');
          
          if (apiEquipments.length > 0) {
            console.log('   - Sample equipment from API:', JSON.stringify(apiEquipments[0], null, 2));
            // Use API data if it has more items or if params data is empty
            if (apiEquipments.length > parsedEquipments.length) {
              parsedEquipments = apiEquipments;
              console.log('   - Using API equipment data (more complete)');
            }
          }
        } else {
          console.warn('⚠️ Equipment API returned no data or failed');
        }
      } catch (error) {
        console.error('❌ Error fetching equipment from API:', error);
        console.error('   - Error details:', error instanceof Error ? error.message : String(error));
      }

      // Store parsed equipment data in state for use in other functions
      setParsedEquipments(parsedEquipments);

      console.log('   - Parsed sections:', parsedSections.length);
      console.log('   - Parsed material used:', parsedMaterialUsed.length);
      console.log('   - Parsed material available:', parsedMaterialAvailable.length);
      console.log('   - Parsed labors:', parsedLabors.length);
      console.log('   - Parsed equipments:', parsedEquipments.length);

      // Calculate totals for available, used, labor, and equipment
      const totalImportedMaterials = parsedMaterialAvailable.reduce(
        (sum: number, material: any) => sum + (material.totalCost || material.cost || 0),
        0
      );
      const usedTotal = parsedMaterialUsed.reduce(
        (sum: number, material: any) => sum + (material.totalCost || material.cost || 0),
        0
      );
      // Available = Imported - Used (remaining materials)
      const availableTotal = Math.max(0, totalImportedMaterials - usedTotal);
      const laborTotal = parsedLabors.reduce(
        (sum: number, labor: any) => sum + (labor.totalCost || 0),
        0
      );
      const equipmentTotal = parsedEquipments.reduce(
        (sum: number, equipment: any) => {
          // Try multiple possible cost field names
          const cost = equipment.totalCost || equipment.cost || equipment.amount || equipment.price || 0;
          const isActive = equipment.status === 'active' || equipment.status === 'Active' || !equipment.status;
          if (isActive && cost > 0) {
            console.log(`   - Adding equipment "${equipment.name || equipment.type || equipment.equipmentName}": ₹${cost} (status: ${equipment.status || 'undefined'})`);
          }
          return sum + (isActive ? cost : 0);
        },
        0
      );

      setTotalImported(totalImportedMaterials);
      setTotalAvailable(availableTotal);
      setTotalUsed(usedTotal);
      setTotalLabor(laborTotal);
      setTotalEquipment(equipmentTotal);

      console.log('   - Total imported materials:', totalImportedMaterials);
      console.log('   - Total used materials:', usedTotal);
      console.log('   - Total available materials (Imported - Used):', availableTotal);
      console.log('   - Total labor:', laborTotal);
      console.log('   - Total equipment:', equipmentTotal);
      console.log('   - Grand total expenses:', usedTotal + laborTotal + equipmentTotal);

      // Debug material calculation
      console.log('📊 MATERIAL CALCULATION BREAKDOWN:');
      console.log(`   - Materials Imported: ₹${totalImportedMaterials} (${parsedMaterialAvailable.length} items)`);
      console.log(`   - Materials Used: ₹${usedTotal} (${parsedMaterialUsed.length} items)`);
      console.log(`   - Materials Available (Remaining): ₹${availableTotal}`);
      console.log(`   - Formula: Available = Imported - Used = ₹${totalImportedMaterials} - ₹${usedTotal} = ₹${availableTotal}`);
      if (parsedEquipments.length > 0) {
        console.log('   - Equipment items:');
        parsedEquipments.forEach((eq: any, idx: number) => {
          const cost = eq.totalCost || eq.cost || eq.amount || eq.price || 0;
          const status = eq.status || 'undefined';
          const name = eq.name || eq.type || eq.equipmentName || 'Unknown';
          console.log(`     ${idx + 1}. ${name}: sectionId="${eq.sectionId}", projectSectionId="${eq.projectSectionId}", status="${status}", cost=₹${cost}`);
          console.log(`        - Available cost fields: totalCost=${eq.totalCost}, cost=${eq.cost}, amount=${eq.amount}, price=${eq.price}`);
          console.log(`        - All fields:`, Object.keys(eq));
        });
        console.log(`   - Total equipment cost calculated: ₹${equipmentTotal}`);
      } else {
        console.log('   - No equipment data found');
        console.log('   - Equipment params received:', equipmentsData ? 'Yes' : 'No');
        if (equipmentsData) {
          console.log('   - Equipment params type:', typeof equipmentsData);
          console.log('   - Equipment params length:', Array.isArray(equipmentsData) ? equipmentsData.length : 'Not array');
          console.log('   - Equipment params content preview:', equipmentsData.substring ? equipmentsData.substring(0, 200) : 'Not string');
        }
      }

      // Calculate expenses per section from MaterialUsed + Labor + Equipment
      const sectionExpenses: SectionExpense[] = parsedSections.map((section: any) => {
        const sectionMaterials = parsedMaterialUsed.filter(
          (material: any) =>
            material.sectionId === section._id || material.sectionId === section.sectionId
        );

        const materialExpense = sectionMaterials.reduce(
          (sum: number, material: any) => sum + (material.totalCost || material.cost || 0),
          0
        );

        // Calculate labor costs for this section
        const sectionLabors = parsedLabors.filter(
          (labor: any) =>
            labor.sectionId === section._id || labor.sectionId === section.sectionId
        );

        const laborExpense = sectionLabors.reduce(
          (sum: number, labor: any) => sum + (labor.totalCost || 0),
          0
        );

        // Calculate equipment costs for this section
        const sectionEquipments = parsedEquipments.filter(
          (equipment: any) => {
            const isActive = equipment.status === 'active' || !equipment.status;
            if (!isActive) {
              console.log(`   - Equipment "${equipment.name || equipment.type}" skipped (status: ${equipment.status})`);
              return false;
            }
            
            // Match if: has matching sectionId/projectSectionId, OR has no section assignment
            const hasSectionId = equipment.sectionId === section._id || equipment.sectionId === section.sectionId || 
                                equipment.projectSectionId === section._id || equipment.projectSectionId === section.sectionId;
            const hasNoSectionId = !equipment.sectionId && !equipment.projectSectionId;
            
            // For unassigned equipment, distribute it across all sections
            const matches = hasSectionId || hasNoSectionId;
            
            console.log(`   - Equipment "${equipment.name || equipment.type}": sectionId="${equipment.sectionId}", projectSectionId="${equipment.projectSectionId}", matches=${matches}, totalCost=₹${equipment.totalCost || equipment.cost || equipment.amount || equipment.price || 0}`);
            return matches;
          }
        );

        const equipmentExpense = sectionEquipments.reduce(
          (sum: number, equipment: any) => {
            const cost = equipment.totalCost || equipment.cost || equipment.amount || equipment.price || 0;
            return sum + cost;
          },
          0
        );

        const totalExpense = materialExpense + laborExpense + equipmentExpense;

        return {
          _id: section._id || section.sectionId,
          name: section.name,
          type: section.type,
          totalExpense,
        };
      });

      console.log('   - Section expenses calculated:');
      sectionExpenses.forEach(section => {
        // Find the materials, labor, and equipment for this section to show breakdown
        const sectionMaterials = parsedMaterialUsed.filter(
          (material: any) => material.sectionId === section._id
        );
        const sectionLabors = parsedLabors.filter(
          (labor: any) => labor.sectionId === section._id
        );
        const sectionEquipments = parsedEquipments.filter(
          (equipment: any) => {
            const isActive = equipment.status === 'active' || !equipment.status;
            const hasSectionId = equipment.sectionId === section._id || equipment.projectSectionId === section._id;
            const hasNoSectionId = !equipment.sectionId && !equipment.projectSectionId;
            return isActive && (hasSectionId || hasNoSectionId);
          }
        );
        
        const materialCost = sectionMaterials.reduce((sum: number, m: any) => sum + (m.totalCost || m.cost || 0), 0);
        const laborCost = sectionLabors.reduce((sum: number, l: any) => sum + (l.totalCost || 0), 0);
        const equipmentCost = sectionEquipments.reduce((sum: number, e: any) => sum + (e.totalCost || e.cost || 0), 0);
        
        console.log(`     * ${section.name}: ₹${section.totalExpense} (Materials: ₹${materialCost}, Labor: ₹${laborCost}, Equipment: ₹${equipmentCost})`);
      });

      // Show all sections (even with 0 expense) to indicate available vs used
      setSections(sectionExpenses);

      // If we have expenses but no sections have them, it means sectionId doesn't match
      const totalSectionExpenses = sectionExpenses.reduce((sum, s) => sum + s.totalExpense, 0);
      const totalActualExpenses = usedTotal + laborTotal + equipmentTotal;
      
      if (totalActualExpenses > 0 && totalSectionExpenses === 0) {
        console.warn('⚠️ WARNING: Expenses exist but not assigned to any sections!');
        console.warn('   This means sectionId in materials/labor/equipment does not match section IDs');
        console.warn('   Section IDs:', parsedSections.map((s: any) => s._id || s.sectionId));
        console.warn('   Material sectionIds:', [...new Set(parsedMaterialUsed.map((m: any) => m.sectionId))]);
        console.warn('   Labor sectionIds:', [...new Set(parsedLabors.map((l: any) => l.sectionId))]);
        console.warn('   Equipment sectionIds:', [...new Set(parsedEquipments.map((e: any) => e.sectionId || e.projectSectionId))]);
      }

      // Check if equipment costs are missing despite having equipment data
      if (parsedEquipments.length > 0 && equipmentTotal === 0) {
        console.warn('⚠️ WARNING: Equipment data exists but total cost is ₹0!');
        console.warn('   Check if equipment items have totalCost or cost fields');
        console.warn('   Check if equipment status is "active"');
      }

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
    description: `${section.type} (Materials + Labor + Equipment)`,
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
      console.log('🔍 Project Sections - Navigating to mini-sections with data:', {
        sectionId: section._id,
        sectionName: section.name,
        materialAvailable: materialAvailable ? 'Present' : 'Missing',
        materialUsed: materialUsed ? 'Present' : 'Missing',
        labors: laborsData ? 'Present' : 'Missing',
        equipments: equipmentsData ? 'Present' : 'Missing',
      });
      router.push({
        pathname: '/analytics/mini-sections-analytics',
        params: {
          projectId,
          projectName,
          sectionId: section._id,
          sectionName: section.name,
          materialAvailable, // Pass materialAvailable to next level
          materialUsed,
          labors: laborsData,
          equipments: JSON.stringify(parsedEquipments), // Pass the fetched equipment data
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
              <Text style={styles.projectSubtitle}>Expenses by Section (Materials + Labor + Equipment)</Text>
            </View>
          </View>
        </View>

        {/* Material, Labor & Equipment Status Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Expenses Breakdown</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.summaryLabel}>Materials Used</Text>
            </View>
            <Text style={styles.summaryValue}>{formatCurrency(totalUsed)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.summaryLabel}>Labor Costs</Text>
            </View>
            <Text style={styles.summaryValue}>{formatCurrency(totalLabor)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryDot, { backgroundColor: '#8B5CF6' }]} />
              <Text style={styles.summaryLabel}>Equipment Costs</Text>
            </View>
            <Text style={styles.summaryValue}>{formatCurrency(totalEquipment)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total Expenses</Text>
            <Text style={styles.summaryTotalValue}>{formatCurrency(totalUsed + totalLabor + totalEquipment)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.summaryLabel}>Materials Available (Remaining)</Text>
            </View>
            <Text style={[styles.summaryValue, { color: totalAvailable > 0 ? '#10B981' : '#6B7280' }]}>
              {formatCurrency(totalAvailable)}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={[styles.statBox, styles.statBoxPrimary]}>
            <Text style={styles.statValue}>{sections.filter(s => s.totalExpense > 0).length}</Text>
            <Text style={styles.statLabel}>Active Sections</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxSecondary]}>
            <Text style={styles.statValue}>{formatCurrency(totalExpense)}</Text>
            <Text style={styles.statLabel}>Total Expenses</Text>
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
        ) : (totalUsed + totalLabor + totalEquipment) === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Expenses Recorded</Text>
            <Text style={styles.emptySubtitle}>
              No materials have been allocated, no labor has been added, and no equipment has been assigned yet.
              Start by importing materials, adding labor, or assigning equipment to see the breakdown.
            </Text>
            <View style={{ marginTop: 20, padding: 15, backgroundColor: '#FEF3C7', borderRadius: 10 }}>
              <Text style={{ fontSize: 12, color: '#92400E', textAlign: 'center' }}>
                Debug Info:{'\n'}
                Sections: {sections.length}{'\n'}
                Materials Imported: ₹{totalImported}{'\n'}
                Materials Used: ₹{totalUsed}{'\n'}
                Materials Available (Remaining): ₹{totalAvailable}{'\n'}
                Labor: ₹{totalLabor}{'\n'}
                Equipment: ₹{totalEquipment}{'\n'}
                Total Expenses: ₹{totalUsed + totalLabor + totalEquipment}{'\n'}
                Sections with expenses: {sections.filter(s => s.totalExpense > 0).length}
              </Text>
            </View>
          </View>
        ) : (
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <View style={styles.heading}>
              <Text style={styles.title}>Section Expenses</Text>
              <Text style={styles.subtitle}>Materials + Labor + Equipment by Section</Text>
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
                  label: 'TOTAL EXPENSES',
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
