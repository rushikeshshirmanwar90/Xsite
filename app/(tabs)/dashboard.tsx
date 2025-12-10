import PieChart, { PieChartColors20 } from '@/components/PieChart';
import PieChartLegend, { LegendItem } from '@/components/PieChartLegend';
import { getClientId } from '@/functions/clientId';
import { getProjectData } from '@/functions/project';
import { Project } from '@/types/project';
import { formatCurrency, transformProjectDataToPieSlices } from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AnalyticsDashboard: React.FC = () => {
  const router = useRouter();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const colors = PieChartColors20;

  // State management
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Performance optimization
  const isLoadingRef = React.useRef(false);
  const lastLoadTimeRef = React.useRef<number>(0);
  const DEBOUNCE_DELAY = 500;

  // Calculate total material value (both available and used)
  const calculateTotalMaterialValue = (project: Project): number => {
    const availableTotal = (project.MaterialAvailable || []).reduce(
      (sum, m) => sum + (m.cost || 0), 0
    );
    const usedTotal = (project.MaterialUsed || []).reduce(
      (sum, m) => sum + (m.cost || 0), 0
    );
    return availableTotal + usedTotal;
  };

  // Calculate available (not yet allocated) materials
  const calculateAvailableMaterials = (project: Project): number => {
    if (!project.MaterialAvailable || project.MaterialAvailable.length === 0) {
      return 0;
    }
    return project.MaterialAvailable.reduce((total, material) => {
      return total + (material.cost || 0);
    }, 0);
  };

  // Calculate used (allocated) materials
  const calculateUsedMaterials = (project: Project): number => {
    if (!project.MaterialUsed || project.MaterialUsed.length === 0) {
      return 0;
    }
    return project.MaterialUsed.reduce((total, material) => {
      return total + (material.cost || 0);
    }, 0);
  };

  // Transform projects to analytics format
  const transformedProjectData = projects.map(project => {
    const available = calculateAvailableMaterials(project);
    const used = calculateUsedMaterials(project);
    const total = available + used;

    return {
      _id: project._id || '',
      name: project.name,
      budgetUsed: total,
      available,
      used,
      description: `📦 Available: ${formatCurrency(available)}  •  🔨 Used: ${formatCurrency(used)}`,
      status: 'active' as const,
    };
  });

  // Filter only projects with budget used > 0
  const activeProjects = transformedProjectData.filter(p => p.budgetUsed > 0);

  // Transform project data using utility function
  const pieData = transformProjectDataToPieSlices(activeProjects, colors);

  // Calculate total budget
  const totalBudget = activeProjects.reduce((sum, project) => sum + project.budgetUsed, 0);

  // Calculate statistics
  const totalProjects = projects.length;
  const projectsWithMaterials = activeProjects.length;
  const projectsWithoutMaterials = totalProjects - projectsWithMaterials;

  // Calculate totals for all projects
  const totalAvailable = transformedProjectData.reduce((sum, p) => sum + p.available, 0);
  const totalUsed = transformedProjectData.reduce((sum, p) => sum + p.used, 0);

  // Fetch projects data
  const fetchProjects = async (showLoadingState = true) => {
    // Prevent duplicate calls
    if (isLoadingRef.current) {
      console.log('⏸️ Skipping fetch - already loading');
      return;
    }

    // Debounce
    const now = Date.now();
    if (now - lastLoadTimeRef.current < DEBOUNCE_DELAY) {
      console.log('⏸️ Skipping fetch - debounced');
      return;
    }
    lastLoadTimeRef.current = now;

    try {
      isLoadingRef.current = true;
      if (showLoadingState) {
        setLoading(true);
      }
      setError(null);

      const clientId = await getClientId();
      if (!clientId) {
        throw new Error('Client ID not found');
      }

      const projectData = await getProjectData(clientId);
      const projectsArray = Array.isArray(projectData) ? projectData : [];

      console.log('Dashboard - Fetched projects:', projectsArray.length);
      setProjects(projectsArray);
    } catch (err: any) {
      console.error('Failed to fetch projects:', err);
      setError(err?.message || 'Failed to load projects');
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  };

  // Pull to refresh handler
  const onRefresh = async () => {
    // Prevent multiple refresh calls
    if (refreshing || isLoadingRef.current) {
      return;
    }

    setRefreshing(true);
    try {
      await fetchProjects(false);
    } finally {
      setRefreshing(false);
    }
  };

  // Prepare legend data
  const legendData: LegendItem[] = pieData.map((item, index) => ({
    key: item.key,
    name: item.name,
    value: item.formattedBudget,
    percentage: item.percentage,
    color: colors[index % colors.length].primary,
    description: item.description,
  }));

  // Handle slice/legend press - Navigate to project sections analytics (Level 2)
  const handlePress = (projectId: string, projectName: string) => {
    const project = projects.find(p => p._id === projectId);
    if (project) {
      router.push({
        pathname: '/analytics/project-sections-analytics',
        params: {
          projectId: project._id ?? '',
          projectName: project.name,
          sections: JSON.stringify(project.section || []),
          materialAvailable: JSON.stringify(project.MaterialAvailable || []),
          materialUsed: JSON.stringify(project.MaterialUsed || [])
        }
      });
    }
  };

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Initialize fade animation
  useEffect(() => {
    if (!loading && projects.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, projects]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
            title="Pull to refresh"
            titleColor="#64748B"
          />
        }
      >
        {/* Main Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.projectInfo}>
              <Text style={styles.projectName}>Analysis Dashboard</Text>
              <Text style={styles.projectSubtitle}>Financial Overview</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.refreshButton, (refreshing || loading) && { opacity: 0.5 }]}
            onPress={onRefresh}
            disabled={refreshing || loading}
          >
            <Ionicons
              name={refreshing ? "sync" : "refresh"}
              size={22}
              color={(refreshing || loading) ? "#94A3B8" : "#3B82F6"}
            />
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={[styles.statBox, styles.statBoxPrimary]}>
            <Text style={styles.statValue}>{projectsWithMaterials}</Text>
            <Text style={styles.statLabel}>Ongoing Projects</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxSecondary]}>
            <Text style={styles.statValue}>{projectsWithoutMaterials}</Text>
            <Text style={styles.statLabel}>Completed Projects</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxTertiary]}>
            <Text style={styles.statValue}>{totalProjects}</Text>
            <Text style={styles.statLabel}>Total Projects</Text>
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Animated.View style={{
              transform: [{
                rotate: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })
              }]
            }}>
              <Ionicons name="sync" size={48} color="#3B82F6" />
            </Animated.View>
            <Text style={styles.loadingText}>Loading projects...</Text>
            <Text style={[styles.loadingText, { fontSize: 12, marginTop: 4 }]}>Please wait...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, loading && { opacity: 0.5 }]}
              onPress={() => fetchProjects()}
              disabled={loading}
            >
              <Text style={styles.retryButtonText}>
                {loading ? 'Loading...' : 'Retry'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : activeProjects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="pie-chart-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Material Data</Text>
            <Text style={styles.emptySubtitle}>
              Import materials to your projects to see budget analytics
            </Text>
          </View>
        ) : (
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <View style={styles.heading}>
              <Text style={styles.title}>Project Budget Analysis</Text>
              <Text style={styles.subtitle}>Material Expenses Overview</Text>
            </View>

            <View style={styles.chartContainer}>
              <PieChart
                data={pieData}
                colors={colors}
                size={280}
                enableAnimation={true}
                enableHover={true}
                labelType="amount"
                onSlicePress={handlePress}
                centerContent={{
                  label: 'TOTAL EXPENSES',
                  value: formatCurrency(totalBudget),
                  subtitle: `${activeProjects.length} Project${activeProjects.length > 1 ? 's' : ''}`
                }}
              />
            </View>

            <PieChartLegend
              items={legendData}
              onItemClick={handlePress}
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

export default AnalyticsDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F3F7',
  },
  scrollView: {
    flex: 1,
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  chartContainer: {
    alignItems: 'center',
    marginVertical: 20,
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
    padding: 12,
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
  statBoxTertiary: {
    borderWidth: 3,
    borderColor: '#F39C12',
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
});
