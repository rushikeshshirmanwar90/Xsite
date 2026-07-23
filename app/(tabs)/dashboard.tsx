import { ChartCardSkeleton } from '@/components/common/AnalyticsDashboardSkeleton';
import PieChart, { PieChartColors20 } from '@/components/PieChart';
import PieChartLegend, { LegendItem } from '@/components/PieChartLegend';
import { getClientId } from '@/functions/clientId';
import { getProjectData } from '@/functions/project';
import { getSection } from '@/functions/details';
import { useUser } from '@/hooks/useUser';
import { Project } from '@/types/project';
import { formatCurrency, transformProjectDataToPieSlices } from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '@/utils/axiosConfig';
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

const SLAB_ORDINALS = ['First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth'];
const slabSortOrder = (name: string): number => {
  const lower = (name || '').toLowerCase();
  if (lower === 'foundation') return 0;
  if (lower === 'terrace') return 9999;
  const idx = SLAB_ORDINALS.findIndex(o => lower === `${o.toLowerCase()} slab`);
  return idx !== -1 ? idx + 1 : 1000;
};
const sortMiniSections = <T extends { name?: string }>(sections: T[]): T[] =>
  [...sections].sort((a, b) => slabSortOrder(a.name || '') - slabSortOrder(b.name || ''));

// A row house holds no phases of its own — its work lives on nested buildings,
// which are shown to users as "House N".
const isRowHouseType = (type?: string) => {
  const t = (type || '').toLowerCase();
  return t === 'rowhouse' || t === 'row house' || t === 'row-house';
};
const toHouseLabel = (name?: string) =>
  (name || '').replace(/buildings?/i, 'House').trim() || (name || '');
const houseNumber = (name?: string) => {
  const m = (name || '').match(/(\d+)/);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
};
const sortHousesAsc = <T extends { name?: string }>(list: T[]): T[] =>
  [...list].sort((a, b) => houseNumber(a.name) - houseNumber(b.name));

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

  // Segmented Tab and phases flow states.
  // Flow: projects → sections → phases. Row houses insert a "houses" level in
  // between (projects → sections → houses → phases) since their phases live on
  // the nested buildings, not on the row house section itself.
  const [activeTab, setActiveTab] = useState<'cost' | 'phases'>('cost');
  const [phasesSubPage, setPhasesSubPage] = useState<'projects' | 'sections' | 'houses' | 'phases'>('projects');
  const [phasesProjectId, setPhasesProjectId] = useState<string | null>(null);
  const [phasesSectionId, setPhasesSectionId] = useState<string | null>(null);
  const [phasesSectionName, setPhasesSectionName] = useState<string | null>(null);

  // Row house drill-down: the selected row house and its buildings ("houses").
  const [phasesRowHouseId, setPhasesRowHouseId] = useState<string | null>(null);
  const [phasesRowHouseName, setPhasesRowHouseName] = useState<string | null>(null);
  const [phasesBuildings, setPhasesBuildings] = useState<any[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  
  const [miniSections, setMiniSections] = useState<any[]>([]);
  const [trackers, setTrackers] = useState<any[]>([]);
  const [loadingPhases, setLoadingPhases] = useState(false);
  const [expandedMiniSectionId, setExpandedMiniSectionId] = useState<string | null>(null);

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
              const response = await apiClient.get(`/api/completion?updateType=project&id=${project._id}`);
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

  // Construction Phase Constants
  const SLAB_WORK_SUB_PHASES = [
    "Shuttering", "Reinforcement", "Electrical Conduits", "Plumbing Sleeves",
    "Inspection", "Concreting", "Curing", "De-shuttering", "Completed"
  ];
  const FLOOR_PHASES = [
    "Column Work", "Slab Work", "Brickwork", "Electrical Concealed", "Plumbing Concealed",
    "Plastering", "Waterproofing", "Flooring", "Putty", "Painting",
    "Doors & Windows", "Electrical Fixtures", "Plumbing Fixtures", "Finishing", "Completed"
  ];
  const FOUNDATION_PHASES = [
    "Excavation", "PCC", "Footing Reinforcement", "Footing Concrete", "Column Starter",
    "Plinth Beam", "Backfilling", "Compaction", "Foundation Complete"
  ];
  const TERRACE_PHASES = [
    "Slab Work", "Waterproofing", "Parapet Wall", "Water Tank Work", "Solar Installation",
    "Terrace Finishing", "Completed"
  ];

  const getPhaseNamesForSection = (sectionName: string): string[] => {
    const lower = (sectionName || '').toLowerCase();
    if (lower.includes("foundation")) return FOUNDATION_PHASES;
    if (lower.includes("terrace")) return TERRACE_PHASES;
    return FLOOR_PHASES;
  };

  // Enter a row house: load its buildings ("houses") and show the houses list.
  const enterRowHouse = async (rowHouseId: string, rowHouseName: string) => {
    setPhasesRowHouseId(rowHouseId);
    setPhasesRowHouseName(rowHouseName);
    // Clear any previously selected building so phases don't load prematurely.
    setPhasesSectionId(null);
    setPhasesSectionName(null);
    setPhasesBuildings([]);
    setPhasesSubPage('houses');

    setLoadingBuildings(true);
    try {
      const res = await apiClient.get(`/api/building?rowHouseId=${rowHouseId}`);
      const list = (res.data as any)?.data || [];
      const houses = sortHousesAsc(list).map((b: any) => ({
        _id: b._id,
        sectionId: b._id,
        name: toHouseLabel(b.name),
        type: 'Buildings',
      }));
      setPhasesBuildings(houses);
    } catch (err) {
      console.error('❌ Failed to load row house buildings:', err);
      setPhasesBuildings([]);
    } finally {
      setLoadingBuildings(false);
    }
  };

  const handleProjectSelect = (project: Project) => {
    if (!project._id) return;

    setPhasesProjectId(project._id);
    // Reset any lingering row house context from a previous project.
    setPhasesRowHouseId(null);
    setPhasesRowHouseName(null);
    const sections = project.section || [];

    if (sections.length === 1) {
      const singleSection = sections[0];
      const sectionId = singleSection.sectionId || singleSection._id || '';
      if (isRowHouseType(singleSection.type)) {
        // Single row house section → drill into its houses first.
        enterRowHouse(sectionId, singleSection.name);
      } else {
        // Direct redirection to the phases page if only 1 (non-row-house) section.
        setPhasesSectionId(sectionId);
        setPhasesSectionName(singleSection.name);
        setPhasesSubPage('phases');
      }
    } else {
      setPhasesSubPage('sections');
    }
  };

  const handleSectionSelect = (sectionId: string, sectionName: string, sectionType?: string) => {
    if (isRowHouseType(sectionType)) {
      // Row house → show its houses instead of (non-existent) phases.
      enterRowHouse(sectionId, sectionName);
      return;
    }
    setPhasesSectionId(sectionId);
    setPhasesSectionName(sectionName);
    setPhasesSubPage('phases');
  };

  // Select a building ("house") inside a row house → load that building's phases.
  const handleBuildingSelect = (buildingId: string, buildingName: string) => {
    setPhasesSectionId(buildingId);
    setPhasesSectionName(buildingName);
    setPhasesSubPage('phases');
  };

  const handlePhasesBackPress = () => {
    const project = projects.find(p => p._id === phasesProjectId);
    const sections = project?.section || [];
    const isSingleSectionProject = sections.length === 1;

    if (phasesSubPage === 'phases') {
      if (phasesRowHouseId) {
        // Inside a row house → go back to its houses list.
        setPhasesSectionId(null);
        setPhasesSectionName(null);
        setPhasesSubPage('houses');
      } else if (isSingleSectionProject) {
        // Single-section project → back to projects list.
        setPhasesProjectId(null);
        setPhasesSectionId(null);
        setPhasesSectionName(null);
        setPhasesSubPage('projects');
      } else {
        // Back to sections list.
        setPhasesSectionId(null);
        setPhasesSectionName(null);
        setPhasesSubPage('sections');
      }
    } else if (phasesSubPage === 'houses') {
      // Leaving the houses list: clear row house context.
      setPhasesRowHouseId(null);
      setPhasesRowHouseName(null);
      setPhasesBuildings([]);
      if (isSingleSectionProject) {
        // The row house was the project's only section → back to projects.
        setPhasesProjectId(null);
        setPhasesSubPage('projects');
      } else {
        setPhasesSubPage('sections');
      }
    } else if (phasesSubPage === 'sections') {
      setPhasesProjectId(null);
      setPhasesSubPage('projects');
    }
  };

  const loadPhases = async (projectId: string, sectionId: string) => {
    if (!projectId || !sectionId) {
      setMiniSections([]);
      setTrackers([]);
      return;
    }

    setLoadingPhases(true);
    try {
      const project = projects.find(p => p._id === projectId);
      const section = project?.section?.find(s => s._id === sectionId || s.sectionId === sectionId);
      const sectionName = section?.name || phasesSectionName || '';

      console.log(`🔍 Dashboard loading phases for Project: ${project?.name}, Section: ${sectionName}`);

      // 1. Fetch mini-sections
      const miniSecs = await getSection(sectionId);
      setMiniSections(sortMiniSections(miniSecs));

      // 2. Fetch tracker for each mini-section individually (keyed by miniSectionId)
      if (miniSecs.length > 0) {
        const trackerResults = await Promise.all(
          miniSecs.map(async (ms: any) => {
            try {
              const res = await apiClient.get(`/api/construction-tracker?miniSectionId=${ms._id}`);
              const data = (res.data as any);
              return data.success ? data.data : null;
            } catch {
              return null;
            }
          })
        );
        const loaded = trackerResults.filter(Boolean);
        setTrackers(loaded);
        console.log(`✅ Loaded ${loaded.length} trackers for ${miniSecs.length} mini-sections`);
      } else {
        setTrackers([]);
      }
    } catch (err) {
      console.error('❌ Failed to load building phases:', err);
      setTrackers([]);
      setMiniSections([]);
    } finally {
      setLoadingPhases(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'phases' && phasesProjectId && phasesSectionId) {
      loadPhases(phasesProjectId, phasesSectionId);
    } else {
      setMiniSections([]);
      setTrackers([]);
    }
  }, [activeTab, phasesProjectId, phasesSectionId]);

  // Pull to refresh handler
  const onRefresh = async () => {
    // Prevent multiple refresh calls
    if (refreshing || isLoadingRef.current) {
      return;
    }

    setRefreshing(true);
    try {
      await fetchProjects(false);
      if (activeTab === 'phases' && phasesProjectId && phasesSectionId) {
        await loadPhases(phasesProjectId, phasesSectionId);
      }
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
      
      // A row house has no mini-sections of its own (its work lives on nested
      // buildings), so it must always go through the sections analytics level.
      const singleSectionType = (sections[0]?.type || '').toLowerCase();
      const singleIsRowHouse = singleSectionType === 'rowhouse' || singleSectionType === 'row house' || singleSectionType === 'row-house';

      if (sections.length === 1 && !singleIsRowHouse) {
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

  const renderCostingPieChart = () => {
    return (
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        <View style={styles.heading}>
          <Text style={styles.title}>
            {showCompletedProjects ? 'Completed Projects' : 'Ongoing Projects'}
          </Text>
          <Text style={styles.subtitle}>
            {showCompletedProjects ? 'Completed Project Costs' : 'Active Project Costs'}
          </Text>
        </View>

        <View style={styles.tapHint}>
          <Ionicons name="finger-print-outline" size={15} color="#3A78B5" />
          <Text style={styles.tapHintText}>Tap a project to explore its section breakdown</Text>
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
    );
  };

  const renderPhasesProjectsList = () => {
    return (
      <View style={styles.phaseTrackerContainer}>
        <Text style={styles.sectionSubtitleHeader}>Select a Project</Text>
        {projects.map((project) => {
          const sections = project.section || [];
          return (
            <TouchableOpacity
              key={project._id}
              activeOpacity={0.7}
              onPress={() => handleProjectSelect(project)}
              style={styles.projectListCard}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.projectListName}>{project.name}</Text>
                <Text style={styles.projectListAddress} numberOfLines={1}>
                  {project.address || 'No address specified'}
                </Text>
                <Text style={styles.projectListSubText}>
                  {sections.length} {sections.length === 1 ? 'Section' : 'Sections'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderPhasesSectionsList = () => {
    const project = projects.find(p => p._id === phasesProjectId);
    const sections = project?.section || [];

    return (
      <View style={styles.phaseTrackerContainer}>
        {/* Back Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handlePhasesBackPress}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={18} color="#3A78B5" />
          <Text style={styles.backButtonText}>Back to Projects</Text>
        </TouchableOpacity>

        <Text style={styles.sectionSubtitleHeader}>Select a Section ({project?.name})</Text>
        {sections.map((section) => (
          <TouchableOpacity
            key={section._id || section.sectionId}
            activeOpacity={0.7}
            onPress={() => handleSectionSelect(section.sectionId || section._id, section.name, section.type)}
            style={styles.projectListCard}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.projectListName}>{section.name}</Text>
              <Text style={styles.projectListSubText}>
                {isRowHouseType(section.type)
                  ? 'Row House · tap to view houses'
                  : `Type: ${section.type || 'Standard'}`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderPhasesHousesList = () => {
    const project = projects.find(p => p._id === phasesProjectId);
    const sections = project?.section || [];
    const isSingleSectionProject = sections.length === 1;

    return (
      <View style={styles.phaseTrackerContainer}>
        {/* Back Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handlePhasesBackPress}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={18} color="#3A78B5" />
          <Text style={styles.backButtonText}>
            {isSingleSectionProject ? 'Back to Projects' : 'Back to Sections'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionSubtitleHeader}>Select a House ({phasesRowHouseName})</Text>

        {loadingBuildings ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="sync" size={36} color="#3A78B5" />
            <Text style={styles.loadingText}>Loading houses...</Text>
          </View>
        ) : phasesBuildings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="home-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Houses Found</Text>
            <Text style={styles.emptySubtitle}>
              Go to the project details page to add houses to this row house.
            </Text>
          </View>
        ) : (
          phasesBuildings.map((house) => (
            <TouchableOpacity
              key={house._id || house.sectionId}
              activeOpacity={0.7}
              onPress={() => handleBuildingSelect(house.sectionId || house._id, house.name)}
              style={styles.projectListCard}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.projectListName}>{house.name}</Text>
                <Text style={styles.projectListSubText}>Tap to view phases</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

  const renderBuildingPhasesTracker = () => {
    const project = projects.find(p => p._id === phasesProjectId);
    const sections = project?.section || [];
    const section = sections.find(s => s._id === phasesSectionId || s.sectionId === phasesSectionId);
    const sectionName = section?.name || phasesSectionName || 'Section';
    const isSingleSectionProject = sections.length === 1;
    // When drilled into a row house, the back target is the houses list.
    const backLabel = phasesRowHouseId
      ? 'Back to Houses'
      : (isSingleSectionProject ? 'Back to Projects' : 'Back to Sections');

    if (loadingPhases) {
      return (
        <View style={styles.phaseTrackerContainer}>
          {/* Back Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handlePhasesBackPress}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={18} color="#3A78B5" />
            <Text style={styles.backButtonText}>
              {backLabel}
            </Text>
          </TouchableOpacity>
          <View style={styles.loadingContainer}>
            <Ionicons name="sync" size={36} color="#3A78B5" />
            <Text style={styles.loadingText}>Loading building phases...</Text>
          </View>
        </View>
      );
    }

    if (miniSections.length === 0) {
      return (
        <View style={styles.phaseTrackerContainer}>
          {/* Back Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handlePhasesBackPress}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={18} color="#3A78B5" />
            <Text style={styles.backButtonText}>
              {backLabel}
            </Text>
          </TouchableOpacity>
          <View style={styles.emptyContainer}>
            <Ionicons name="construct-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Slabs Found</Text>
            <Text style={styles.emptySubtitle}>
              Go to the project details page to create and configure slabs for this section.
            </Text>
          </View>
        </View>
      );
    }

    // Calculate section-wide average progress
    const activeTrackers = trackers.filter(t => miniSections.some(ms => ms._id === t.miniSectionId));
    const sectionAverageProgress = miniSections.length > 0
      ? Math.round(miniSections.reduce((sum, ms) => {
          const t = trackers.find(track => track.miniSectionId === ms._id);
          return sum + (t?.overallProgress || 0);
        }, 0) / miniSections.length)
      : 0;

    return (
      <View style={styles.phaseTrackerContainer}>
        {/* Back Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handlePhasesBackPress}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={18} color="#3A78B5" />
          <Text style={styles.backButtonText}>
            {isSingleSectionProject ? "Back to Projects" : "Back to Sections"}
          </Text>
        </TouchableOpacity>
        {/* Section overall progress card */}
        <View style={styles.sectionProgressCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionProgressTitle}>{sectionName} Progress</Text>
              <Text style={styles.sectionProgressSubtitle}>Average completion across all floors/parts</Text>
            </View>
            <View style={styles.sectionPercentageBadge}>
              <Text style={styles.sectionPercentageText}>{sectionAverageProgress}%</Text>
            </View>
          </View>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${sectionAverageProgress}%` }]} />
          </View>
          <View style={styles.sectionStatsRow}>
            <Text style={styles.sectionStatText}>
              Total Slabs: <Text style={{ fontWeight: '700', color: '#1E293B' }}>{miniSections.length}</Text>
            </Text>
            <Text style={styles.sectionStatText}>
              Tracked: <Text style={{ fontWeight: '700', color: '#3A78B5' }}>{activeTrackers.length}</Text>
            </Text>
          </View>
        </View>

        {/* Mini-section accordion card list */}
        <Text style={styles.sectionSubtitleHeader}>Slabs & Phases</Text>
        {miniSections.map((miniSec) => {
          const tracker = trackers.find(t => t.miniSectionId === miniSec._id);
          const isExpanded = expandedMiniSectionId === miniSec._id;
          const progress = tracker?.overallProgress ?? 0;
          
          // Get the active phase
          let activePhaseName = 'Column Work';
          let activePhaseStatus = 'NOT_STARTED';

          if (tracker && tracker.phases.length > 0) {
            const linkedPhase = tracker.phases.find((p: any) => p._id === miniSec.activePhaseId);
            const activePhase = linkedPhase || tracker.phases.find((p: any) => p.name.toLowerCase().includes('column')) || tracker.phases[0];
            if (activePhase) {
              activePhaseName = activePhase.name;
              activePhaseStatus = activePhase.status;
            }
          }

          const STATUS_META: Record<string, { label: string; color: string }> = {
            NOT_STARTED: { label: 'Not Started', color: '#64748B' },
            IN_PROGRESS:  { label: 'In Progress',  color: '#2563EB' },
            ON_HOLD:      { label: 'On Hold',      color: '#D97706' },
            COMPLETED:    { label: 'Completed',    color: '#059669' },
          };

          const statusInfo = STATUS_META[activePhaseStatus] || STATUS_META.NOT_STARTED;

          // Default phases for display if tracker is not initialized in DB yet
          const phaseNames = tracker?.phases ? tracker.phases.map((p: any) => p.name) : getPhaseNamesForSection(sectionName);
          const phasesList = tracker?.phases || phaseNames.map((name: string, index: number) => ({
            _id: `default-${index}`,
            name,
            status: 'NOT_STARTED',
            progress: 0
          }));

          return (
            <View key={miniSec._id} style={styles.miniSecCard}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setExpandedMiniSectionId(isExpanded ? null : miniSec._id)}
                style={styles.miniSecHeader}
              >
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                    <Text style={styles.miniSecName}>{miniSec.name}</Text>
                    {miniSec.isCompleted && (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={12} color="#059669" />
                        <Text style={styles.completedBadgeText}>Finished</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.activePhaseSubtitle} numberOfLines={1}>
                    Phase: <Text style={{ fontWeight: '700', color: '#334155' }}>{activePhaseName}</Text> ({statusInfo.label})
                  </Text>
                </View>
                
                <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
                  <Text style={styles.miniSecProgressValue}>{progress}%</Text>
                  <Text style={styles.miniSecProgressLabel}>Overall Progress</Text>
                </View>

                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>

              {/* Progress bar under the header */}
              <View style={styles.miniSecProgressBarBg}>
                <View style={[styles.miniSecProgressBarFill, { width: `${progress}%` }]} />
              </View>

              {isExpanded && (
                <View style={styles.miniSecBody}>
                  <Text style={styles.phaseTimelineTitle}>Construction Timeline</Text>
                  <View style={styles.timelineContainer}>
                    {phasesList.map((phase: any, index: number) => {
                      const phaseStatus = phase.status || 'NOT_STARTED';
                      const phaseProgress = phase.progress || 0;
                      const phaseMeta = STATUS_META[phaseStatus] || STATUS_META.NOT_STARTED;
                      
                      const isPhaseCompleted = phaseStatus === 'COMPLETED';
                      const isPhaseInProgress = phaseStatus === 'IN_PROGRESS';
                      const isLastItem = index === phasesList.length - 1;

                      return (
                        <View key={phase._id || index} style={styles.timelineItem}>
                          {/* Left dot/line */}
                          <View style={styles.timelineLeftColumn}>
                            <View style={[
                              styles.timelineDot,
                              isPhaseCompleted && styles.timelineDotCompleted,
                              isPhaseInProgress && styles.timelineDotInProgress
                            ]}>
                              {isPhaseCompleted ? (
                                <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                              ) : isPhaseInProgress ? (
                                <View style={styles.innerDotInProgress} />
                              ) : null}
                            </View>
                            {!isLastItem && (
                              <View style={[
                                styles.timelineLine,
                                isPhaseCompleted && styles.timelineLineCompleted
                              ]} />
                            )}
                          </View>

                          {/* Right content */}
                          <View style={styles.timelineContent}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                              <Text style={[
                                styles.timelinePhaseName,
                                isPhaseCompleted && styles.timelinePhaseNameCompleted,
                                isPhaseInProgress && styles.timelinePhaseNameInProgress
                              ]}>
                                {phase.name}
                              </Text>
                              <View style={[
                                styles.phaseStatusPill,
                                { backgroundColor: phaseMeta.color + '15' }
                              ]}>
                                <Text style={[styles.phaseStatusText, { color: phaseMeta.color }]}>
                                  {isPhaseInProgress ? `${phaseProgress}% In Progress` : phaseMeta.label}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

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
      {/* Sticky top: Main Header + Segmented Tab Selector (stay pinned across all views) */}
      <View style={styles.stickyHeader}>
        {/* Main Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.projectInfo}>
              <Text style={styles.projectName}>Analysis Dashboard</Text>
              <Text style={styles.projectSubtitle}>
                {activeTab === 'phases' ? 'Building Phases' : 'Financial Overview'}
              </Text>
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
              color={(refreshing || loading) ? "#94A3B8" : "#3A78B5"}
            />
          </TouchableOpacity>
        </View>

        {/* Segmented Tab Selector */}
        <View style={styles.tabHeader}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'cost' && styles.activeTabButton]}
            onPress={() => setActiveTab('cost')}
          >
            <Ionicons name="pie-chart" size={16} color={activeTab === 'cost' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'cost' && styles.activeTabText]}>Cost Analysis</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'phases' && styles.activeTabButton]}
            onPress={() => setActiveTab('phases')}
          >
            <Ionicons name="construct" size={16} color={activeTab === 'phases' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'phases' && styles.activeTabText]}>Project Phases</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3A78B5']}
            tintColor="#3A78B5"
            title="Pull to refresh"
            titleColor="#64748B"
          />
        }
      >
        {/* Content Display */}
        {loading ? (
          <View style={{ paddingTop: 8 }}>
            <ChartCardSkeleton />
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
        ) : activeTab === 'phases' ? (
          // RENDER PHASES 3-PAGES FLOW
          phasesSubPage === 'projects' ? (
            renderPhasesProjectsList()
          ) : phasesSubPage === 'sections' ? (
            renderPhasesSectionsList()
          ) : phasesSubPage === 'houses' ? (
            renderPhasesHousesList()
          ) : (
            renderBuildingPhasesTracker()
          )
        ) : (
          // RENDER DEFAULT COST ANALYSIS
          <>
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

            {activeProjects.length === 0 ? (
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
              renderCostingPieChart()
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AnalyticsDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  stickyHeader: {
    backgroundColor: '#F8FAFC',
    zIndex: 10,
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
    color: '#1E293B',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
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
    backgroundColor: '#3A78B5',
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
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: '#EAF0FE',
    borderWidth: 1,
    borderColor: '#C4D8FC',
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 12,
  },
  tapHintText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#3A78B5',
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
    backgroundColor: '#3A78B5',
    borderRadius: 2,
  },
  statBoxPrimary: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statBoxSecondary: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statBoxTertiary: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  selectorBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  selectorWrapper: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  dropdownPicker: {
    height: 48,
    color: '#1E293B',
  },
  phaseTrackerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionProgressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionProgressTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionProgressSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  sectionPercentageBadge: {
    backgroundColor: '#3A78B5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  sectionPercentageText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3A78B5',
    borderRadius: 5,
  },
  sectionStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionStatText: {
    fontSize: 12,
    color: '#64748B',
  },
  sectionSubtitleHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
    marginTop: 4,
  },
  miniSecCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  miniSecHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  miniSecName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  completedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  activePhaseSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  miniSecProgressValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  miniSecProgressLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  miniSecProgressBarBg: {
    height: 4,
    backgroundColor: '#F1F5F9',
    width: '100%',
  },
  miniSecProgressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  miniSecBody: {
    padding: 16,
    backgroundColor: '#FAFBFD',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  phaseTimelineTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 50,
  },
  timelineLeftColumn: {
    alignItems: 'center',
    marginRight: 12,
    width: 16,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineDotCompleted: {
    backgroundColor: '#10B981',
  },
  timelineDotInProgress: {
    backgroundColor: '#EAF0FE',
    borderWidth: 2,
    borderColor: '#3A78B5',
  },
  innerDotInProgress: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3A78B5',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
    zIndex: 1,
  },
  timelineLineCompleted: {
    backgroundColor: '#10B981',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelinePhaseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  timelinePhaseNameCompleted: {
    color: '#0F172A',
    fontWeight: '700',
  },
  timelinePhaseNameInProgress: {
    color: '#3A78B5',
    fontWeight: '700',
  },
  phaseStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  phaseStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Segmented Tab Header ─────────────────────────────────────────────
  tabHeader: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 11,
    gap: 6,
  },
  activeTabButton: {
    backgroundColor: '#3A78B5',
    shadowColor: '#3A78B5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },

  // ── Back Button ──────────────────────────────────────────────────────
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#EAF0FE',
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C4D8FC',
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3A78B5',
  },

  // ── Project / Section List Cards ────────────────────────────────────
  projectListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  projectListName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  projectListAddress: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  projectListSubText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
