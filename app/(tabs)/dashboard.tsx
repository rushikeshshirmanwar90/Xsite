import PieChart, { PieChartColors20 } from '@/components/PieChart';
import PieChartLegend, { LegendItem } from '@/components/PieChartLegend';
import { getClientId } from '@/functions/clientId';
import { getProjectData } from '@/functions/project';
import { useUser } from '@/hooks/useUser';
import { domain } from '@/lib/domain';
import { Project } from '@/types/project';
import { formatCurrency, transformProjectDataToPieSlices } from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
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
  const { user } = useUser(); // Add user context for staff filtering
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const colors = PieChartColors20;

  // State management
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompletedProjects, setShowCompletedProjects] = useState(false); // Toggle between ongoing and completed

  // Performance optimization
  const isLoadingRef = React.useRef(false);
  const lastLoadTimeRef = React.useRef<number>(0);
  const DEBOUNCE_DELAY = 500;

  // Calculate available (not yet allocated) materials
  const calculateAvailableMaterials = (project: Project): number => {
    if (!project.MaterialAvailable || project.MaterialAvailable.length === 0) {
      return 0;
    }
    return project.MaterialAvailable.reduce((total, material) => {
      // Use totalCost field if available, otherwise fall back to cost
      return total + (material.totalCost || material.cost || 0);
    }, 0);
  };

  // Calculate used (allocated) materials
  const calculateUsedMaterials = (project: Project): number => {
    if (!project.MaterialUsed || project.MaterialUsed.length === 0) {
      return 0;
    }
    return project.MaterialUsed.reduce((total, material) => {
      // Use totalCost field if available, otherwise fall back to cost
      return total + (material.totalCost || material.cost || 0);
    }, 0);
  };

  // Calculate total labor costs
  const calculateLaborCosts = (project: Project): number => {
    if (!project.Labors || project.Labors.length === 0) {
      return 0;
    }
    return project.Labors.reduce((total: number, labor: any) => {
      // Use totalCost field which contains the actual labor cost
      return total + (labor.totalCost || 0);
    }, 0);
  };

  // Calculate labor costs by status
  const calculateLaborCostsByStatus = (project: Project, status: string = 'active'): number => {
    if (!project.Labors || project.Labors.length === 0) {
      return 0;
    }
    return project.Labors
      .filter((labor: any) => labor.status === status)
      .reduce((total: number, labor: any) => total + (labor.totalCost || 0), 0);
  };

  // Transform projects to analytics format
  const transformedProjectData = projects.map(project => {
    const available = calculateAvailableMaterials(project);
    const used = calculateUsedMaterials(project);
    const laborCosts = calculateLaborCosts(project);
    const activeLaborCosts = calculateLaborCostsByStatus(project, 'active');
    
    // ✅ FIXED: Use project.spent for actual money spent, not available + used
    const actualSpent = project.spent || 0;
    
    // ✅ For display purposes, show available, used, and labor values separately
    const totalMaterialValue = available + used; // This is for information only
    const totalProjectCost = actualSpent; // This includes both materials and labor

    return {
      _id: project._id || '',
      name: project.name,
      budgetUsed: actualSpent, // ✅ Use actual spending (includes materials + labor)
      available,
      used,
      laborCosts,
      activeLaborCosts,
      totalMaterialValue, // For information
      totalProjectCost, // Total project spending
      description: `Total Expenses: ${formatCurrency(actualSpent)}`,
      status: 'active' as const,
      isCompleted: project.isCompleted || false, // ✅ Add completion status from project
    };
  });

  // ✅ FIXED: Filter projects based on completion status, not budget
  // Ongoing projects = not completed (explicitly false)
  const ongoingProjects = transformedProjectData.filter(p => p.isCompleted === false);
  
  // Completed projects = marked as completed (explicitly true)
  const completedProjectsList = transformedProjectData.filter(p => p.isCompleted === true);
  
  // For pie chart, show either ongoing or completed projects based on toggle
  const activeProjects = showCompletedProjects ? completedProjectsList : ongoingProjects;
  
  // Debug logging
  console.log('Dashboard - Raw projects state:', projects.length);
  console.log('Dashboard - Transformed project data:', transformedProjectData.length);
  console.log('Dashboard - Ongoing projects (not completed with budget > 0):', ongoingProjects.length);
  console.log('Dashboard - Completed projects:', completedProjectsList.length);
  console.log('Dashboard - Active projects for pie chart:', activeProjects.length);
  
  console.log('\n🔍 DASHBOARD DEBUG - Raw Projects:');
  projects.forEach((project, index) => {
    console.log(`  ${index + 1}. ${project.name || 'Unnamed'}`);
    console.log(`     - _id: ${project._id}`);
    console.log(`     - spent: ${project.spent || 0}`);
    console.log(`     - isCompleted: ${project.isCompleted || false}`);
    console.log(`     - MaterialAvailable: ${project.MaterialAvailable?.length || 0} items`);
    console.log(`     - MaterialUsed: ${project.MaterialUsed?.length || 0} items`);
    console.log(`     - Labors: ${project.Labors?.length || 0} entries`);
    if (project.MaterialAvailable && project.MaterialAvailable.length > 0) {
      console.log(`     - Available items:`, project.MaterialAvailable.map(m => `${m.name}: cost=₹${m.cost || 0}, totalCost=₹${m.totalCost || 0}`));
    }
    if (project.MaterialUsed && project.MaterialUsed.length > 0) {
      console.log(`     - Used items:`, project.MaterialUsed.map(m => `${m.name}: cost=₹${m.cost || 0}, totalCost=₹${m.totalCost || 0}`));
    }
    if (project.Labors && project.Labors.length > 0) {
      console.log(`     - Labor entries:`, project.Labors.map((l: any) => `${l.type}: totalCost=₹${l.totalCost || 0}`));
    }
  });
  
  console.log('\n🔍 DASHBOARD DEBUG - Transformed Projects:');
  transformedProjectData.forEach((project, index) => {
    console.log(`  ${index + 1}. ${project.name}`);
    console.log(`     - Budget Used: ₹${project.budgetUsed}`);
    console.log(`     - Is Completed: ${project.isCompleted}`);
    console.log(`     - Materials Available: ₹${project.available}`);
    console.log(`     - Materials Used: ₹${project.used}`);
    console.log(`     - Labor Costs: ₹${project.laborCosts}`);
    console.log(`     - Active Labor: ₹${project.activeLaborCosts}`);
  });
  
  console.log('\n🔍 DASHBOARD DEBUG - Ongoing Projects:');
  ongoingProjects.forEach((project, index) => {
    console.log(`  ${index + 1}. ${project.name} - Total: ₹${project.budgetUsed}, Labor: ₹${project.laborCosts}`);
  });
  
  console.log('\n🔍 DASHBOARD DEBUG - Completed Projects:');
  completedProjectsList.forEach((project, index) => {
    console.log(`  ${index + 1}. ${project.name} - Total: ₹${project.budgetUsed}, Completed: ${project.isCompleted}`);
  });
  
  console.log(`\n🔍 DASHBOARD DEBUG - Render Decision:`);
  console.log(`  - Loading: ${loading}`);
  console.log(`  - Error: ${error}`);
  console.log(`  - Projects length: ${projects.length}`);
  console.log(`  - Ongoing projects length: ${ongoingProjects.length}`);
  console.log(`  - Completed projects length: ${completedProjectsList.length}`);
  console.log(`  - Active projects for chart: ${activeProjects.length}`);
  console.log(`  - Will show: ${loading ? 'LOADING' : error ? 'ERROR' : activeProjects.length === 0 ? 'NO DATA' : 'PIE CHART'}`);

  // Transform project data using utility function
  const pieData = transformProjectDataToPieSlices(activeProjects, colors);

  // Calculate total budget (includes both materials and labor)
  const totalBudget = activeProjects.reduce((sum, project) => sum + project.budgetUsed, 0);

  // Calculate statistics
  const totalProjects = projects.length;
  const projectsWithExpenses = ongoingProjects.length; // ✅ Ongoing projects (not completed)
  const projectsWithoutExpenses = completedProjectsList.length; // ✅ Completed projects

  // Calculate totals for all projects
  const totalAvailable = transformedProjectData.reduce((sum, p) => sum + p.available, 0);
  const totalUsed = transformedProjectData.reduce((sum, p) => sum + p.used, 0);
  const totalLaborCosts = transformedProjectData.reduce((sum, p) => sum + p.laborCosts, 0);
  const totalMaterialCosts = totalAvailable + totalUsed;
  const grandTotal = totalMaterialCosts + totalLaborCosts;

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

      // Check if user is staff and pass staffId for filtering
      const isStaff = user && 'role' in user;
      const staffId = isStaff ? user._id : undefined;
      const userRole = isStaff ? 'staff' : 'admin';
      
      console.log('🔍 Dashboard fetching projects:', {
        clientId,
        isStaff,
        staffId,
        userRole,
        willFilter: !!staffId
      });

      const projectData = await getProjectData(clientId, staffId, false, userRole); // ✅ CRITICAL FIX: Set excludeMaterials to FALSE to get material data for analytics
      
      // Handle the response structure from getProjectData
      const projectsArray: Project[] = Array.isArray(projectData) ? projectData : [];

      console.log('Dashboard - Fetched projects:', projectsArray.length);
      console.log('Dashboard - Project data structure:', typeof projectData);
      console.log('Dashboard - First project sample:', projectsArray[0] ? Object.keys(projectsArray[0]) : 'No projects');
      
      // ✅ Load completion status for all projects
      const projectsWithCompletion = await Promise.all(
        projectsArray.map(async (project) => {
          try {
            if (project._id) {
              const response = await axios.get(`${domain}/api/completion?updateType=project&id=${project._id}`);
              const responseData = response.data as any;
              if (responseData.success && responseData.data) {
                const completionStatus = Boolean(responseData.data.isCompleted);
                console.log(`📊 Dashboard - Project ${project.name}: isCompleted = ${completionStatus}`);
                return {
                  ...project,
                  isCompleted: completionStatus
                };
              }
            }
          } catch (error) {
            console.warn(`Could not load completion status for project ${project._id}:`, error);
          }
          console.log(`📊 Dashboard - Project ${project.name}: isCompleted = false (default)`);
          return { ...project, isCompleted: false };
        })
      );
      
      console.log('✅ Dashboard - Projects with completion status loaded:', projectsWithCompletion.length);
      console.log('📊 Dashboard - Completion status summary:', projectsWithCompletion.map(p => `${p.name}: ${p.isCompleted}`).join(', '));
      
      // Debug material data
      if (projectsWithCompletion.length > 0) {
        projectsWithCompletion.forEach((project, index) => {
          const availableCost = (project.MaterialAvailable || []).reduce((sum, m) => sum + (m.cost || 0), 0);
          const usedCost = (project.MaterialUsed || []).reduce((sum, m) => sum + (m.cost || 0), 0);
          const totalCost = availableCost + usedCost;
          
          console.log(`Dashboard - Project ${index + 1} (${project.name}):`);
          console.log(`  - Available materials: ${project.MaterialAvailable?.length || 0} items, cost: ${availableCost}`);
          console.log(`  - Used materials: ${project.MaterialUsed?.length || 0} items, cost: ${usedCost}`);
          console.log(`  - Total cost: ${totalCost}`);
          console.log(`  - Is Completed: ${project.isCompleted}`);
        });
      }
      
      setProjects(projectsWithCompletion);
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

  // Handle slice/legend press - Navigate to project sections analytics (Level 2) or directly to mini-sections if only one section
  const handlePress = (projectId: string, projectName: string) => {
    const project = projects.find(p => p._id === projectId);
    if (project) {
      console.log('\n🔍 ========== DASHBOARD NAVIGATION DEBUG ==========');
      console.log('🔍 Dashboard - Navigating to analytics for project:', projectName);
      console.log('   - Project data:', {
        _id: project._id,
        name: project.name,
        spent: project.spent,
        MaterialAvailable: project.MaterialAvailable?.length || 0,
        MaterialUsed: project.MaterialUsed?.length || 0,
        Labors: project.Labors?.length || 0,
        Equipments: (project as any).Equipments?.length || 0,
      });
      
      // Log actual data samples
      if (project.MaterialUsed && project.MaterialUsed.length > 0) {
        console.log('   - Sample MaterialUsed:', project.MaterialUsed[0]);
        console.log('   - MaterialUsed sectionIds:', [...new Set(project.MaterialUsed.map((m: any) => m.sectionId))]);
        console.log('   - MaterialUsed miniSectionIds:', [...new Set(project.MaterialUsed.map((m: any) => m.miniSectionId).filter(Boolean))]);
      }
      if (project.Labors && project.Labors.length > 0) {
        console.log('   - Sample Labor:', project.Labors[0]);
        console.log('   - Labor sectionIds:', [...new Set(project.Labors.map((l: any) => l.sectionId))]);
        console.log('   - Labor miniSectionIds:', [...new Set(project.Labors.map((l: any) => l.miniSectionId).filter(Boolean))]);
      }
      
      // Check if project has only one section
      const sections = project.section || [];
      console.log('   - Sections:', sections.length);
      if (sections.length > 0) {
        console.log('   - Section IDs:', sections.map(s => s._id || s.sectionId));
        console.log('   - Section names:', sections.map(s => s.name));
      }
      
      if (sections.length === 1) {
        // Navigate directly to mini-sections (Level 3) if only one section
        const singleSection = sections[0];
        console.log('🔍 Dashboard - Single section detected, navigating to mini-sections');
        console.log('   - Section ID:', singleSection._id || singleSection.sectionId);
        console.log('   - Section Name:', singleSection.name);
        console.log('   - Passing data:', {
          materialAvailable: project.MaterialAvailable?.length || 0,
          materialUsed: project.MaterialUsed?.length || 0,
          labors: project.Labors?.length || 0,
          equipments: (project as any).Equipments?.length || 0,
        });
        console.log('🔍 ================================================\n');
        router.push({
          pathname: '/analytics/mini-sections-analytics',
          params: {
            projectId: project._id ?? '',
            projectName: project.name,
            sectionId: singleSection._id || singleSection.sectionId || '',
            sectionName: singleSection.name || 'Section',
            materialAvailable: JSON.stringify(project.MaterialAvailable || []),
            materialUsed: JSON.stringify(project.MaterialUsed || []),
            labors: JSON.stringify(project.Labors || []),
            equipments: JSON.stringify((project as any).Equipments || []) // Equipment might not exist
          }
        });
      } else {
        // Navigate to project sections analytics (Level 2) if multiple sections
        console.log('🔍 Dashboard - Multiple sections, navigating to project-sections');
        console.log('   - Passing data:', {
          sections: sections.length,
          materialAvailable: project.MaterialAvailable?.length || 0,
          materialUsed: project.MaterialUsed?.length || 0,
          labors: project.Labors?.length || 0,
          equipments: (project as any).Equipments?.length || 0,
        });
        console.log('🔍 ================================================\n');
        router.push({
          pathname: '/analytics/project-sections-analytics',
          params: {
            projectId: project._id ?? '',
            projectName: project.name,
            sections: JSON.stringify(sections),
            materialAvailable: JSON.stringify(project.MaterialAvailable || []),
            materialUsed: JSON.stringify(project.MaterialUsed || []),
            labors: JSON.stringify(project.Labors || []),
            equipments: JSON.stringify((project as any).Equipments || []) // Equipment might not exist
          }
        });
      }
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
          <View style={{ flexDirection: 'row', gap: 8 }}>
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
            <TouchableOpacity
              style={[styles.refreshButton, { backgroundColor: '#FEF3C7' }]}
              onPress={async () => {
                console.log('\n🐛 MANUAL DEBUG TRIGGER');
                console.log('========================');
                try {
                  const clientId = await getClientId();
                  console.log('🔍 Client ID:', clientId);
                  
                  if (clientId) {
                    console.log('🔍 Calling fetchProjects...');
                    await fetchProjects(true);
                  } else {
                    console.log('❌ No client ID found!');
                  }
                } catch (err) {
                  console.log('❌ Debug error:', err);
                }
              }}
            >
              <Ionicons name="bug" size={22} color="#F59E0B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Section - Simplified */}
        <View style={styles.statsSection}>
          <TouchableOpacity 
            style={[
              styles.statBox, 
              styles.statBoxPrimary,
              !showCompletedProjects && styles.statBoxActive
            ]}
            onPress={() => setShowCompletedProjects(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.statValue}>{projectsWithExpenses}</Text>
            <Text style={styles.statLabel}>Ongoing Projects</Text>
            {!showCompletedProjects && (
              <View style={styles.activeIndicator} />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.statBox, 
              styles.statBoxSecondary,
              showCompletedProjects && styles.statBoxActive
            ]}
            onPress={() => setShowCompletedProjects(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.statValue}>{projectsWithoutExpenses}</Text>
            <Text style={styles.statLabel}>Completed Projects</Text>
            {showCompletedProjects && (
              <View style={styles.activeIndicator} />
            )}
          </TouchableOpacity>
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
            <Text style={styles.emptyTitle}>
              {showCompletedProjects ? 'No Completed Projects' : 'No Ongoing Projects'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {showCompletedProjects 
                ? 'Mark projects as complete to see their analytics here'
                : 'Add materials and labor to your projects to see budget analytics'}
            </Text>
          </View>
        ) : (
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <View style={styles.heading}>
              <Text style={styles.title}>
                {showCompletedProjects ? 'Completed Projects' : 'Ongoing Projects'}
              </Text>
              <Text style={styles.subtitle}>
                {showCompletedProjects ? 'Completed Project Costs' : 'Active Project Costs'}
              </Text>
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
                  label: showCompletedProjects ? 'COMPLETED EXPENSES' : 'ONGOING EXPENSES',
                  value: formatCurrency(totalBudget),
                  subtitle: `${activeProjects.length} Project${activeProjects.length > 1 ? 's' : ''}`
                }}
              />
            </View>

            <PieChartLegend
              items={legendData}
              onItemClick={handlePress}
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
    position: 'relative',
  },
  statBoxActive: {
    transform: [{ scale: 1.05 }],
    shadowOpacity: 0.15,
    elevation: 10,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 8,
    width: 30,
    height: 3,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
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
