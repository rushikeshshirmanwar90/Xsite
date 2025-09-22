import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../constants/theme';
import { Project, Activity } from '../../types/project';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

const AnalysisPage = () => {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  // Mock data for demonstration
  const mockProjects: Project[] = [
    {
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
    },
    {
      _id: '2',
      name: 'Green Valley Residency',
      address: 'Pune, Maharashtra',
      status: 'active',
      progress: 45,
      budget: 35000000,
      spent: 15750000,
      startDate: '2024-03-01',
      endDate: '2025-02-28',
      description: 'Eco-friendly residential complex with 200 units',
      assignedStaff: [],
    },
    {
      _id: '3',
      name: 'Tech Park Phase 2',
      address: 'Bangalore, Karnataka',
      status: 'active',
      progress: 90,
      budget: 80000000,
      spent: 72000000,
      startDate: '2023-06-01',
      endDate: '2024-09-30',
      description: 'Commercial office space expansion project',
      assignedStaff: [],
    },
  ];

  const mockMaterialStats = {
    materialsUsed: 1247,
    materialsWasted: 89,
    totalMaterials: 1336,
    wasteCost: 245000,
  };

  const mockMaterials = [
    {
      id: 1,
      name: 'Cement',
      used: 450,
      wasted: 25,
      unit: 'bags',
    },
    {
      id: 2,
      name: 'Steel',
      used: 120,
      wasted: 8,
      unit: 'tons',
    },
    {
      id: 3,
      name: 'Bricks',
      used: 15000,
      wasted: 1200,
      unit: 'pieces',
    },
    {
      id: 4,
      name: 'Sand',
      used: 85,
      wasted: 12,
      unit: 'cubic meters',
    },
  ];

  const mockActivities: Activity[] = [
    {
      id: 1,
      type: 'received',
      material: 'Cement',
      quantity: '50 bags',
      date: '2024-03-15',
    },
    {
      id: 2,
      type: 'issued',
      material: 'Steel',
      quantity: '5 tons',
      date: '2024-03-14',
    },
    {
      id: 3,
      type: 'ordered',
      material: 'Bricks',
      quantity: '2000 pieces',
      date: '2024-03-13',
    },
    {
      id: 4,
      type: 'received',
      material: 'Sand',
      quantity: '10 cubic meters',
      date: '2024-03-12',
    },
  ];

  const mockWasteAnalysis = [
    {
      category: 'Transportation',
      percentage: 35,
      cost: 85750,
    },
    {
      category: 'Storage',
      percentage: 25,
      cost: 61250,
    },
    {
      category: 'Handling',
      percentage: 20,
      cost: 49000,
    },
    {
      category: 'Over-ordering',
      percentage: 15,
      cost: 36750,
    },
    {
      category: 'Other',
      percentage: 5,
      cost: 12250,
    },
  ];

  // Find the selected project
  const project = mockProjects.find(p => p._id === id) || mockProjects[0];

  const StatCard = ({ title, value, subtitle, color, icon, trend }: any) => (
    <View style={[styles.statCard, { backgroundColor: '#ffffff' }]}>
      <View style={styles.statCardHeader}>
        <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        {trend && (
          <View style={[styles.trendBadge, { backgroundColor: trend > 0 ? '#10B981' : '#EF4444' }]}>
            <Text style={styles.trendText}>{trend > 0 ? '+' : ''}{trend}%</Text>
          </View>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  );

  const MaterialItem = ({ item }: any) => {
    const wastePercentage = (item.wasted / (item.used + item.wasted)) * 100;
    return (
      <View style={styles.materialItem}>
        <View style={styles.materialHeader}>
          <Text style={styles.materialName}>{item.name}</Text>
          <Text style={styles.materialWaste}>{wastePercentage.toFixed(1)}% waste</Text>
        </View>
        <View style={styles.materialDetails}>
          <Text style={styles.materialUsed}>Used: {item.used} {item.unit}</Text>
          <Text style={styles.materialTotal}>Wasted: {item.wasted} {item.unit}</Text>
        </View>
        <View style={styles.materialProgressBar}>
          <View
            style={[
              styles.materialProgressFill,
              { width: `${(item.used / (item.used + item.wasted)) * 100}%` as any },
            ]}
          />
        </View>
      </View>
    );
  };

  const ActivityItem = ({ activity }: any) => {
    const getActivityColor = (type: string) => {
      switch (type) {
        case 'received': return '#10B981';
        case 'issued': return '#0EA5E9';
        case 'ordered': return '#F59E0B';
        default: return '#64748B';
      }
    };

    return (
      <View style={styles.activityItem}>
        <View style={[styles.activityIcon, { backgroundColor: getActivityColor(activity.type) + '20' }]}>
          <Ionicons 
            name={activity.type === 'received' ? 'download' : activity.type === 'issued' ? 'send' : 'cart'} 
            size={20} 
            color={getActivityColor(activity.type)} 
          />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityText}>
            <Text style={{ fontWeight: 'bold' }}>{activity.material}</Text> {activity.quantity}
          </Text>
          <Text style={styles.activityDate}>{activity.date}</Text>
        </View>
      </View>
    );
  };

  const budgetPercentage = Math.round(((project.spent || 0) / (project.budget || 1)) * 100);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.fixedHeader}>
        <View style={styles.headerContent}>
          <View style={styles.headerBackContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color="#64748B" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>{project.name}</Text>
              <Text style={styles.headerSubtitle}>Detailed Analysis</Text>
            </View>
          </View>
          <View style={styles.headerIconContainer}>
            <Ionicons name="analytics" size={24} color="#0EA5E9" />
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollableContent} contentContainerStyle={styles.scrollableContentContainer}>
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          <TouchableOpacity 
            style={[styles.timeRangeButton, timeRange === 'week' && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange('week')}
          >
            <Text style={[styles.timeRangeText, timeRange === 'week' && styles.timeRangeTextActive]}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.timeRangeButton, timeRange === 'month' && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange('month')}
          >
            <Text style={[styles.timeRangeText, timeRange === 'month' && styles.timeRangeTextActive]}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.timeRangeButton, timeRange === 'quarter' && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange('quarter')}
          >
            <Text style={[styles.timeRangeText, timeRange === 'quarter' && styles.timeRangeTextActive]}>Quarter</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Materials Used"
            value={mockMaterialStats.materialsUsed}
            subtitle="Total materials"
            color="#0EA5E9"
            icon="cube"
            trend={15}
          />
          <StatCard
            title="Waste Cost"
            value={`₹${(mockMaterialStats.wasteCost / 1000).toFixed(0)}K`}
            subtitle="This month"
            color="#EF4444"
            icon="alert-circle"
            trend={-8}
          />
        </View>

        {/* Project Overview */}
        <View style={styles.projectOverviewCard}>
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewTitle}>Project Overview</Text>
            <Text style={styles.overviewProgress}>{project.progress}%</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Overall Progress</Text>
              <Text style={styles.progressValue}>{project.progress}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${project.progress}%` as any }]} />
            </View>
          </View>
          <View style={styles.budgetOverview}>
            <View style={styles.budgetCard}>
              <Text style={styles.budgetCardTitle}>Spent</Text>
              <Text style={styles.budgetCardValue}>₹{((project.spent || 0) / 1000000).toFixed(1)}M</Text>
            </View>
            <View style={styles.budgetCard}>
              <Text style={styles.budgetCardTitle}>Budget</Text>
              <Text style={styles.budgetCardValue}>₹{((project.budget || 0) / 1000000).toFixed(1)}M</Text>
            </View>
            <View style={styles.budgetCard}>
              <Text style={styles.budgetCardTitle}>Used</Text>
              <Text style={styles.budgetCardValue}>{budgetPercentage}%</Text>
            </View>
          </View>
        </View>

        {/* Materials Breakdown */}
        <View style={styles.materialsCard}>
          <View style={styles.materialsHeader}>
            <Text style={styles.materialsTitle}>Material Breakdown</Text>
            <Text style={styles.materialsSubtitle}>Usage and waste analysis</Text>
          </View>
          <View style={styles.materialsList}>
            {mockMaterials.map((item) => (
              <MaterialItem key={item.id} item={item} />
            ))}
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.activitiesCard}>
          <View style={styles.activitiesHeader}>
            <Text style={styles.activitiesTitle}>Recent Activities</Text>
          </View>
          <View style={styles.activitiesList}>
            {mockActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </View>
        </View>

        {/* Waste Analysis */}
        <View style={styles.wasteAnalysisCard}>
          <View style={styles.wasteAnalysisHeader}>
            <Text style={styles.wasteAnalysisTitle}>Waste Analysis</Text>
          </View>
          <View style={styles.wasteAnalysisList}>
            {mockWasteAnalysis.map((item, index) => (
              <View key={index} style={styles.wasteAnalysisItem}>
                <Text style={styles.wasteAnalysisCategory}>{item.category}</Text>
                <Text style={styles.wasteAnalysisPercentage}>{item.percentage}%</Text>
                <View style={styles.wasteAnalysisProgressBar}>
                  <View 
                    style={[styles.wasteAnalysisProgressFill, { width: `${item.percentage}%` as any }]} 
                  />
                </View>
                <Text style={styles.wasteAnalysisCost}>₹{item.cost.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  fixedHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerBackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  headerIconContainer: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 16,
  },
  scrollableContent: {
    flex: 1,
  },
  scrollableContentContainer: {
    padding: 20,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#0EA5E9',
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  timeRangeTextActive: {
    color: '#ffffff',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  projectOverviewCard: {
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
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  overviewProgress: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  progressValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  budgetOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  budgetCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  budgetCardValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  materialsCard: {
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
  materialsHeader: {
    marginBottom: 16,
  },
  materialsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  materialsSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  materialsList: {
    gap: 12,
  },
  materialItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  materialName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  materialWaste: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  materialDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  materialUsed: {
    fontSize: 12,
    color: '#64748B',
  },
  materialTotal: {
    fontSize: 12,
    color: '#EF4444',
  },
  materialProgressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  materialProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  activitiesCard: {
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
  activitiesHeader: {
    marginBottom: 16,
  },
  activitiesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  activitiesList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    color: '#64748B',
  },
  wasteAnalysisCard: {
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
  wasteAnalysisHeader: {
    marginBottom: 16,
  },
  wasteAnalysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  wasteAnalysisList: {
    gap: 12,
  },
  wasteAnalysisItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  wasteAnalysisCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  wasteAnalysisPercentage: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  wasteAnalysisProgressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  wasteAnalysisProgressFill: {
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 2,
  },
  wasteAnalysisCost: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});

export default AnalysisPage;
