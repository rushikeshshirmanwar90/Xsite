import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Colors } from '../../constants/theme';
import { Project, ProjectSection, MaterialUsage, BudgetAnalysis } from '../../types/project';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');

const AnalysisPage = () => {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  // Enhanced mock data with sections
  const mockProject: Project = {
    _id: '1',
    name: 'Skyline Tower',
    address: 'Mumbai, Maharashtra',
    status: 'active',
    progress: 75,
    budget: 50000000,
    spent: 37500000,
    startDate: '2024-01-15',
    endDate: '2024-12-31',
    description: 'A 45-story residential tower with modern amenities',
    assignedStaff: [],
    sections: [
      {
        id: 'foundation',
        name: 'Foundation',
        description: 'Building foundation and basement work',
        budget: 8000000,
        spent: 7500000,
        progress: 95,
        startDate: '2024-01-15',
        endDate: '2024-04-30',
        status: 'completed',
        materials: [
          {
            materialId: 'cement',
            name: 'Cement',
            plannedQuantity: 2000,
            usedQuantity: 1900,
            wastedQuantity: 100,
            unit: 'bags',
            costPerUnit: 350,
          },
          {
            materialId: 'steel',
            name: 'Steel Bars',
            plannedQuantity: 500,
            usedQuantity: 480,
            wastedQuantity: 20,
            unit: 'tons',
            costPerUnit: 65000,
          },
        ],
      },
      {
        id: 'structure',
        name: 'Super Structure',
        description: 'Main building structure and framework',
        budget: 15000000,
        spent: 12000000,
        progress: 80,
        startDate: '2024-03-01',
        endDate: '2024-08-31',
        status: 'in_progress',
        materials: [
          {
            materialId: 'concrete',
            name: 'Ready Mix Concrete',
            plannedQuantity: 3000,
            usedQuantity: 2400,
            wastedQuantity: 100,
            unit: 'cubic meters',
            costPerUnit: 4500,
          },
          {
            materialId: 'steel',
            name: 'Steel Beams',
            plannedQuantity: 800,
            usedQuantity: 640,
            wastedQuantity: 40,
            unit: 'tons',
            costPerUnit: 70000,
          },
        ],
      },
      {
        id: 'finishing',
        name: 'Finishing',
        description: 'Interior and exterior finishing work',
        budget: 12000000,
        spent: 6000000,
        progress: 50,
        startDate: '2024-07-01',
        endDate: '2024-11-30',
        status: 'in_progress',
        materials: [
          {
            materialId: 'tiles',
            name: 'Ceramic Tiles',
            plannedQuantity: 10000,
            usedQuantity: 5000,
            wastedQuantity: 200,
            unit: 'sq ft',
            costPerUnit: 85,
          },
          {
            materialId: 'paint',
            name: 'Premium Paint',
            plannedQuantity: 2000,
            usedQuantity: 1000,
            wastedQuantity: 50,
            unit: 'liters',
            costPerUnit: 450,
          },
        ],
      },
    ],
    materialUsage: [
      {
        id: 'cement',
        name: 'Cement',
        totalUsed: 1900,
        totalWasted: 100,
        totalOrdered: 2000,
        unit: 'bags',
        costPerUnit: 350,
        category: 'construction',
      },
      {
        id: 'steel',
        name: 'Steel',
        totalUsed: 1120,
        totalWasted: 60,
        totalOrdered: 1300,
        unit: 'tons',
        costPerUnit: 67500,
        category: 'construction',
      },
      {
        id: 'concrete',
        name: 'Concrete',
        totalUsed: 2400,
        totalWasted: 100,
        totalOrdered: 2500,
        unit: 'cubic meters',
        costPerUnit: 4500,
        category: 'construction',
      },
      {
        id: 'tiles',
        name: 'Tiles',
        totalUsed: 5000,
        totalWasted: 200,
        totalOrdered: 5200,
        unit: 'sq ft',
        costPerUnit: 85,
        category: 'finishing',
      },
    ],
  };

  // Mock budget analysis data
  const budgetAnalysis: BudgetAnalysis = {
    totalBudget: 50000000,
    totalSpent: 37500000,
    remainingBudget: 12500000,
    budgetUtilization: 75,
    projectedOverspend: 2500000,
    sectionBreakdown: [
      {
        sectionId: 'foundation',
        sectionName: 'Foundation',
        allocatedBudget: 8000000,
        spentBudget: 7500000,
        remainingBudget: 500000,
        utilizationPercentage: 94,
      },
      {
        sectionId: 'structure',
        sectionName: 'Super Structure',
        allocatedBudget: 15000000,
        spentBudget: 12000000,
        remainingBudget: 3000000,
        utilizationPercentage: 80,
      },
      {
        sectionId: 'finishing',
        sectionName: 'Finishing',
        allocatedBudget: 12000000,
        spentBudget: 6000000,
        remainingBudget: 6000000,
        utilizationPercentage: 50,
      },
    ],
  };

  // Helper functions
  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100000).toFixed(1)}L`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'in_progress':
        return '#0EA5E9';
      case 'delayed':
        return '#EF4444';
      default:
        return '#64748B';
    }
  };

  const getMaterialCategoryColor = (category: string) => {
    switch (category) {
      case 'construction':
        return '#0EA5E9';
      case 'finishing':
        return '#8B5CF6';
      case 'electrical':
        return '#F59E0B';
      case 'plumbing':
        return '#10B981';
      default:
        return '#64748B';
    }
  };

  // Header Component
  const ProjectHeader = () => (
    <View style={styles.projectHeader}>
      <View style={styles.headerContent}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#1F2937" />
          </TouchableOpacity>
          <View>
            <Text style={styles.projectTitle}>{mockProject.name}</Text>
            <Text style={styles.projectLocation}>{mockProject.address}</Text>
          </View>
        </View>
      </View>
      <View style={styles.projectMeta}>
        <View 
          style={[styles.statusBadge, { backgroundColor: getStatusColor(mockProject.status || '') }]}
        >
          <Text style={styles.statusText}>
            {mockProject.status?.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.projectDate}>
          {new Date(mockProject.startDate || '').toLocaleDateString()} - {new Date(mockProject.endDate || '').toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  // Overview Stats Component
  const OverviewStats = () => (
    <View style={styles.overviewContainer}>
      <Text style={styles.sectionTitle}>Project Overview</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: '#F0F9FF' }]}>
            <Ionicons name="wallet" size={20} color="#0EA5E9" />
          </View>
          <Text style={styles.statValue}>{formatCurrency(mockProject.budget || 0)}</Text>
          <Text style={styles.statLabel}>Total Budget</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="cash" size={20} color="#F59E0B" />
          </View>
          <Text style={styles.statValue}>{formatCurrency(mockProject.spent || 0)}</Text>
          <Text style={styles.statLabel}>Amount Spent</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="trending-up" size={20} color="#10B981" />
          </View>
          <Text style={styles.statValue}>{mockProject.progress}%</Text>
          <Text style={styles.statLabel}>Progress</Text>
        </View>
      </View>
    </View>
  );

  // Budget Progress Chart Component
  const BudgetProgressChart = () => (
    <View style={styles.chartContainer}>
      <Text style={styles.sectionTitle}>Budget vs Actual</Text>
      <View style={styles.budgetChart}>
        <View style={styles.budgetBars}>
          {budgetAnalysis.sectionBreakdown.map((section) => (
            <View key={section.sectionId} style={styles.budgetBarContainer}>
              <Text style={styles.budgetBarLabel}>{section.sectionName}</Text>
              <View style={styles.budgetBarBackground}>
                <View 
                  style={[
                    styles.budgetBarFill, 
                    { 
                      width: `${section.utilizationPercentage}%`,
                      backgroundColor: section.utilizationPercentage > 90 ? '#EF4444' : 
                                     section.utilizationPercentage > 75 ? '#F59E0B' : '#10B981'
                    }
                  ]}
                />
              </View>
              <Text style={styles.budgetBarValue}>
                {section.utilizationPercentage}% • {formatCurrency(section.spentBudget)}/{formatCurrency(section.allocatedBudget)}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.budgetSummary}>
          <View style={styles.budgetSummaryItem}>
            <Text style={styles.budgetSummaryLabel}>Total Budget</Text>
            <Text style={styles.budgetSummaryValue}>{formatCurrency(budgetAnalysis.totalBudget)}</Text>
          </View>
          <View style={styles.budgetSummaryItem}>
            <Text style={styles.budgetSummaryLabel}>Total Spent</Text>
            <Text style={styles.budgetSummaryValue}>{formatCurrency(budgetAnalysis.totalSpent)}</Text>
          </View>
          <View style={styles.budgetSummaryItem}>
            <Text style={styles.budgetSummaryLabel}>Remaining</Text>
            <Text style={styles.budgetSummaryValue}>{formatCurrency(budgetAnalysis.remainingBudget)}</Text>
          </View>
          <View style={styles.budgetSummaryItem}>
            <Text style={styles.budgetSummaryLabel}>Utilization</Text>
            <Text style={styles.budgetSummaryValue}>{budgetAnalysis.budgetUtilization}%</Text>
          </View>
          {budgetAnalysis.projectedOverspend && (
            <View style={styles.budgetSummaryItem}>
              <Text style={styles.budgetSummaryLabel}>Projected Overspend</Text>
              <Text style={[styles.budgetSummaryValue, { color: '#EF4444' }]}>
                {formatCurrency(budgetAnalysis.projectedOverspend)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  // Material Usage Overview Component
  const MaterialUsageOverview = () => (
    <View style={styles.chartContainer}>
      <Text style={styles.sectionTitle}>Material Usage Overview</Text>
      <View style={styles.materialGrid}>
        {mockProject.materialUsage?.map((material) => {
          const usagePercentage = (material.totalUsed / material.totalOrdered) * 100;
          const wastePercentage = (material.totalWasted / material.totalOrdered) * 100;
          
          return (
            <View key={material.id} style={styles.materialCard}>
              <View style={styles.materialHeader}>
                <Text style={styles.materialName}>{material.name}</Text>
                <View 
                  style={[styles.materialCategoryBadge, { backgroundColor: getMaterialCategoryColor(material.category) + '20' }]}
                >
                  <Text style={[styles.materialCategoryText, { color: getMaterialCategoryColor(material.category) }]}>
                    {material.category}
                  </Text>
                </View>
              </View>
              <View style={styles.materialStats}>
                <View style={styles.materialStat}>
                  <Text style={styles.materialStatValue}>{material.totalUsed}</Text>
                  <Text style={styles.materialStatLabel}>Used</Text>
                </View>
                <View style={styles.materialStat}>
                  <Text style={styles.materialStatValue}>{material.totalWasted}</Text>
                  <Text style={styles.materialStatLabel}>Wasted</Text>
                </View>
                <View style={styles.materialStat}>
                  <Text style={styles.materialStatValue}>{material.totalOrdered}</Text>
                  <Text style={styles.materialStatLabel}>Ordered</Text>
                </View>
              </View>
              <View style={styles.materialProgressBar}>
                <View style={styles.materialProgressBackground}>
                  <View 
                    style={[styles.materialProgressFill, { width: `${usagePercentage}%` }]}
                  />
                </View>
                <View style={styles.materialWasteBar}>
                  <View 
                    style={[styles.materialWasteFill, { width: `${wastePercentage}%` }]}
                  />
                </View>
              </View>
              <Text style={styles.materialProgressText}>
                {usagePercentage.toFixed(1)}% used • {wastePercentage.toFixed(1)}% wasted
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  // Project Sections Breakdown Component
  const ProjectSectionsBreakdown = () => (
    <View style={styles.sectionsContainer}>
      <Text style={styles.sectionTitle}>Project Sections</Text>
      <View style={styles.sectionsList}>
        {mockProject.sections?.map((section) => (
          <TouchableOpacity
            key={section.id}
            style={[
              styles.sectionCard,
              selectedSection === section.id && styles.sectionCardSelected
            ]}
            onPress={() => setSelectedSection(selectedSection === section.id ? null : section.id)}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionInfo}>
                <Text style={styles.sectionName}>{section.name}</Text>
                <Text style={styles.sectionDescription}>{section.description}</Text>
              </View>
              <View 
                style={[styles.sectionStatusBadge, { backgroundColor: getStatusColor(section.status) }]}
              >
                <Text style={styles.sectionStatusText}>
                  {section.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={styles.sectionProgress}>
              <View style={styles.sectionProgressHeader}>
                <Text style={styles.sectionProgressLabel}>Progress</Text>
                <Text style={styles.sectionProgressValue}>{section.progress}%</Text>
              </View>
              <View style={styles.sectionProgressBar}>
                <View 
                  style={[styles.sectionProgressFill, { width: `${section.progress}%` }]}
                />
              </View>
            </View>
            
            <View style={styles.sectionBudget}>
              <View style={styles.sectionBudgetHeader}>
                <Text style={styles.sectionBudgetLabel}>Budget</Text>
                <Text style={styles.sectionBudgetValue}>
                  {formatCurrency(section.spent)} / {formatCurrency(section.budget)}
                </Text>
              </View>
            </View>
            
            {selectedSection === section.id && (
              <View style={styles.sectionDetails}>
                <Text style={styles.sectionDetailsTitle}>Material Details</Text>
                <View style={styles.sectionMaterials}>
                  {section.materials.map((material) => {
                    const utilizationPercentage = (material.usedQuantity / material.plannedQuantity) * 100;
                    const wastePercentage = (material.wastedQuantity / material.plannedQuantity) * 100;
                    const totalCost = material.usedQuantity * material.costPerUnit;
                    const wasteCost = material.wastedQuantity * material.costPerUnit;
                    
                    return (
                      <View key={material.materialId} style={styles.sectionMaterialItem}>
                        <View style={styles.sectionMaterialInfo}>
                          <Text style={styles.sectionMaterialName}>{material.name}</Text>
                          <Text style={styles.sectionMaterialQuantity}>
                            {material.usedQuantity} / {material.plannedQuantity} {material.unit}
                          </Text>
                        </View>
                        <View style={styles.sectionMaterialStats}>
                          <Text style={styles.sectionMaterialCost}>
                            ₹{(totalCost / 100000).toFixed(1)}L
                          </Text>
                          <Text style={[styles.sectionMaterialWaste, { color: '#EF4444' }]}>
                            Waste: ₹{(wasteCost / 100000).toFixed(1)}L
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ProjectHeader />
      
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <OverviewStats />
        <BudgetProgressChart />
        <MaterialUsageOverview />
        <ProjectSectionsBreakdown />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  projectHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  projectLocation: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  projectMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  projectDate: {
    fontSize: 12,
    color: '#64748B',
  },
  backButton: {
    marginRight: 12,
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  overviewContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  budgetChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetBars: {
    flex: 1,
    marginRight: 16,
  },
  budgetBarContainer: {
    marginBottom: 16,
  },
  budgetBarLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  budgetBarBackground: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  budgetBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  budgetBarValue: {
    fontSize: 12,
    color: '#1F2937',
    marginTop: 4,
  },
  budgetSummary: {
    flex: 1,
  },
  budgetSummaryItem: {
    marginBottom: 16,
  },
  budgetSummaryLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  budgetSummaryValue: {
    fontSize: 12,
    color: '#1F2937',
  },
  materialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  materialCard: {
    flexBasis: width / 2 - 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  materialName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  materialCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  materialCategoryText: {
    fontSize: 12,
    color: '#64748B',
  },
  materialStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  materialStat: {
    alignItems: 'center',
  },
  materialStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  materialStatLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  materialProgressBar: {
    height: 4,
    flexDirection: 'row',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  materialProgressBackground: {
    flex: 1,
  },
  materialProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  materialWasteBar: {
    flex: 1,
    marginLeft: 8,
  },
  materialWasteFill: {
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 2,
  },
  materialProgressText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  sectionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionsList: {
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionCardSelected: {
    borderColor: '#0EA5E9',
    backgroundColor: '#F0F9FF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#64748B',
  },
  sectionStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sectionStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionProgress: {
    marginBottom: 12,
  },
  sectionProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionProgressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  sectionProgressValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sectionProgressBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  sectionProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  sectionBudget: {
    marginBottom: 12,
  },
  sectionBudgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionBudgetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  sectionBudgetValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sectionDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionMaterials: {
    gap: 12,
  },
  sectionMaterialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionMaterialInfo: {
    flex: 1,
  },
  sectionMaterialName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  sectionMaterialQuantity: {
    fontSize: 11,
    color: '#64748B',
  },
  sectionMaterialStats: {
    alignItems: 'flex-end',
  },
  sectionMaterialCost: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  sectionMaterialWaste: {
    fontSize: 11,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AnalysisPage;
