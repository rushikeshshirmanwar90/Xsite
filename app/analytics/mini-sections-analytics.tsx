// Level 3: Mini-Sections Analytics
import AnalyticsDashboardSkeleton from '@/components/common/AnalyticsDashboardSkeleton';
import PieChart, { PieChartColors20 } from '@/components/PieChart';
import PieChartLegend, { LegendItem } from '@/components/PieChartLegend';
import { getSection } from '@/functions/details';
import { getClientId } from '@/functions/clientId';
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
import apiClient from '@/utils/axiosConfig';
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

interface BuildingLaborExpense {
  _id: string;
  type: string;
  totalCost: number;
}

interface OtherCostExpense {
  _id: string;
  title: string;
  totalCost: number;
}

interface OtherCostDetail {
  _id: string;
  title: string;
  description?: string;
  amount: number;
  addedByName?: string;
  date?: string;
}

const MiniSectionsAnalytics: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.projectId as string;
  const projectName = params.projectName as string;
  const sectionId = params.sectionId as string;
  const sectionName = params.sectionName as string;
  const materialUsed = params.materialUsed as string;
  const materialAvailable = params.materialAvailable as string;
  const laborsData = params.labors as string;
  const equipmentsData = params.equipments as string;

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const colors = PieChartColors20;

  const [miniSections, setMiniSections] = useState<MiniSectionExpense[]>([]);
  const [equipmentExpenses, setEquipmentExpenses] = useState<EquipmentExpense[]>([]);
  const [buildingLaborExpenses, setBuildingLaborExpenses] = useState<BuildingLaborExpense[]>([]);
  const [otherCostExpenses, setOtherCostExpenses] = useState<OtherCostExpense[]>([]);
  const [otherCostDetails, setOtherCostDetails] = useState<OtherCostDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMiniSectionExpenses();
  }, [sectionId, materialUsed, materialAvailable, laborsData, equipmentsData, projectId]);

  const loadMiniSectionExpenses = async () => {
    try {
      setLoading(true);

      console.log('\n🔍 ========== MINI-SECTIONS ANALYTICS DEBUG ==========');
      console.log('🔍 Mini-Sections Analytics - Loading expenses');
      console.log('   - SectionId:', sectionId);
      console.log('   - SectionName:', sectionName);
      console.log('   - ProjectId:', projectId);
      console.log('   - Material used param:', materialUsed ? 'Present' : 'Missing');
      console.log('   - Material available param:', materialAvailable ? 'Present' : 'Missing');
      console.log('   - Labors param:', laborsData ? 'Present' : 'Missing');
      console.log('   - Equipments param:', equipmentsData ? 'Present' : 'Missing');

      // Fetch mini-sections for this section
      let sectionAliases = [sectionId];
      let projectFallbackMaterialUsed: any[] = [];
      let projectFallbackMaterialAvailable: any[] = [];
      let projectFallbackLabors: any[] = [];
      try {
        const clientId = await getClientId();
        const projectRes = await apiClient.get(`/api/project/${projectId}?clientId=${clientId}`);
        const projectData = projectRes.data?.project || projectRes.data?.data?.project || projectRes.data?.data || projectRes.data;
        if (projectData) {
          if (projectData.section && Array.isArray(projectData.section)) {
            const matchedSec = projectData.section.find((sec: any) =>
              String(sec._id) === String(sectionId) || String(sec.sectionId) === String(sectionId)
            );
            if (matchedSec) {
              if (matchedSec._id) sectionAliases.push(String(matchedSec._id));
              if (matchedSec.sectionId) sectionAliases.push(String(matchedSec.sectionId));
              sectionAliases = [...new Set(sectionAliases)].filter(id => id && id.length === 24);
              console.log('   ✅ Resolved parent section ID aliases:', sectionAliases);
            }
          }
          // Cache full project arrays as fallback for when params are not JSON arrays
          if (Array.isArray(projectData.MaterialUsed)) projectFallbackMaterialUsed = projectData.MaterialUsed;
          if (Array.isArray(projectData.MaterialAvailable)) projectFallbackMaterialAvailable = projectData.MaterialAvailable;
          if (Array.isArray(projectData.Labors)) projectFallbackLabors = projectData.Labors;
          console.log('   📦 Project API fallback ready:', {
            materialUsed: projectFallbackMaterialUsed.length,
            materialAvailable: projectFallbackMaterialAvailable.length,
            labors: projectFallbackLabors.length,
          });
        }
      } catch (aliasError) {
        console.warn('   ⚠️ Failed to resolve section aliases:', aliasError);
      }

      console.log('   - About to call getSection API for all aliases:', sectionAliases);
      const miniSectionsDataArrays = await Promise.all(
          sectionAliases.map(alias => getSection(alias))
      );
      
      const combinedMiniSectionsData: any[] = [];
      const combinedIds = new Set();
      for (const arr of miniSectionsDataArrays) {
          for (const ms of arr) {
              if (ms && ms._id && !combinedIds.has(ms._id)) {
                  combinedIds.add(ms._id);
                  combinedMiniSectionsData.push(ms);
              }
          }
      }
      const miniSectionsData = combinedMiniSectionsData;

      console.log('   - Mini-sections from API:', miniSectionsData.length);
      if (miniSectionsData.length > 0) {
        console.log('   - Mini-section IDs:', miniSectionsData.map((ms: any) => ms._id));
        console.log('   - Mini-section names:', miniSectionsData.map((ms: any) => ms.name));
      }
      
      const tryParseArray = (param: string | undefined | null): any[] => {
        if (!param) return [];
        try {
          const val = Array.isArray(param) ? param[0] : param;
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      };

      let parsedMaterialUsed = tryParseArray(materialUsed);
      if (parsedMaterialUsed.length === 0 && projectFallbackMaterialUsed.length > 0) {
        parsedMaterialUsed = projectFallbackMaterialUsed;
        console.log('   📦 Using materialUsed from project API (param was empty/not an array)');
      }

      let parsedMaterialAvailable = tryParseArray(materialAvailable);
      if (parsedMaterialAvailable.length === 0 && projectFallbackMaterialAvailable.length > 0) {
        parsedMaterialAvailable = projectFallbackMaterialAvailable;
        console.log('   📦 Using materialAvailable from project API (param was empty/not an array)');
      }

      let parsedLabors = tryParseArray(laborsData);
      if (parsedLabors.length === 0 && projectFallbackLabors.length > 0) {
        parsedLabors = projectFallbackLabors;
        console.log('   📦 Using labors from project API (param was empty/not an array)');
      }

      // CRITICAL FIX: Filter out materials/labor that belong to other sections!
      // This is necessary because the previous screen might pass ALL project materials
      parsedMaterialUsed = parsedMaterialUsed.filter((m: any) => sectionAliases.includes(m.sectionId));
      parsedMaterialAvailable = parsedMaterialAvailable.filter((m: any) => sectionAliases.includes(m.sectionId));
      parsedLabors = parsedLabors.filter((l: any) => sectionAliases.includes(l.sectionId));

      console.log('\n📊 PARSED DATA:');
      console.log('   - Parsed material used:', parsedMaterialUsed.length);
      if (parsedMaterialUsed.length > 0) {
        console.log('   - Sample MaterialUsed:', JSON.stringify(parsedMaterialUsed[0], null, 2));
        console.log('   - ALL MaterialUsed items:');
        parsedMaterialUsed.forEach((m: any, idx: number) => {
          console.log(`     ${idx + 1}. ${m.name}: sectionId=${m.sectionId}, miniSectionId=${m.miniSectionId}, cost=₹${m.cost || 0}, totalCost=₹${m.totalCost || 0}`);
        });
      }
      
      console.log('   - Parsed material available:', parsedMaterialAvailable.length);
      if (parsedMaterialAvailable.length > 0) {
        console.log('   - Sample MaterialAvailable:', JSON.stringify(parsedMaterialAvailable[0], null, 2));
        console.log('   - ALL MaterialAvailable items:');
        parsedMaterialAvailable.forEach((m: any, idx: number) => {
          console.log(`     ${idx + 1}. ${m.name}: sectionId=${m.sectionId}, miniSectionId=${m.miniSectionId}, cost=₹${m.cost || 0}, totalCost=₹${m.totalCost || 0}`);
        });
      }
      
      console.log('   - Parsed labors:', parsedLabors.length);
      if (parsedLabors.length > 0) {
        console.log('   - Sample Labor:', JSON.stringify(parsedLabors[0], null, 2));
        console.log('   - ALL Labor items:');
        parsedLabors.forEach((l: any, idx: number) => {
          console.log(`     ${idx + 1}. ${l.type}: sectionId=${l.sectionId}, miniSectionId=${l.miniSectionId}, status=${l.status}, totalCost=₹${l.totalCost || 0}`);
        });
      }
      
      // CRITICAL FIX: Extract unique mini-section IDs from materials/labor data
      // Materials/labor may have mini-section IDs in the sectionId field (legacy bug)
      const materialMiniSectionIds = [...new Set([
        ...parsedMaterialUsed.map((m: any) => m.miniSectionId).filter(Boolean),
        ...parsedMaterialUsed.map((m: any) => m.sectionId).filter(Boolean), // Legacy: sectionId might contain mini-section ID
      ])];
      const laborMiniSectionIds = [...new Set([
        ...parsedLabors.map((l: any) => l.miniSectionId).filter(Boolean),
        ...parsedLabors.map((l: any) => l.sectionId).filter(Boolean), // Legacy: sectionId might contain mini-section ID
      ])];
      const allDataMiniSectionIds = [...new Set([...materialMiniSectionIds, ...laborMiniSectionIds])]
        .filter(id => 
          id !== 'no-mini-section' && // Exclude special string
          id !== 'undefined' && // Exclude undefined string
          !sectionAliases.includes(id) && // Exclude the section ID itself
          id.length === 24 // MongoDB ObjectId is 24 characters
        );
      
      console.log('\n🔍 ========== MINI-SECTION ID EXTRACTION ==========');
      console.log('   - Mini-section IDs from materials:', materialMiniSectionIds);
      console.log('   - Mini-section IDs from labor:', laborMiniSectionIds);
      console.log('   - All unique mini-section IDs in data:', allDataMiniSectionIds);
      console.log('   - Fetched mini-section IDs from API:', miniSectionsData.map((ms: any) => ms._id));
      
      // Find IDs that are NOT in the fetched mini-sections (these need to be fetched individually)
      const fetchedIds = miniSectionsData.map((ms: any) => ms._id);
      const missingIds = allDataMiniSectionIds.filter(id => !fetchedIds.includes(id));
      
      console.log('   - Missing mini-section IDs (need to fetch):', missingIds);
      
      // Fetch missing mini-sections individually
      let additionalMiniSections: any[] = [];
      if (missingIds.length > 0) {
        console.log('   - Fetching missing mini-sections individually...');
        for (const id of missingIds) {
          try {
            const miniSection = await apiClient.get<{
              success: boolean;
              message: string;
              data: any[];
            }>(`/api/mini-section?id=${id}`);
            if (miniSection.data?.success && miniSection.data?.data) {
              additionalMiniSections.push(...miniSection.data.data);
              console.log(`   ✅ Fetched mini-section: ${id} - ${miniSection.data.data[0]?.name || 'Unknown'}`);
            }
          } catch (error: any) {
            console.warn(`   ⚠️ Could not fetch mini-section ${id}:`, error?.response?.data?.message || error.message);
            console.warn(`   → This mini-section was deleted or doesn't exist. Materials/labor still reference it.`);
          }
        }
      }
      
      // Combine fetched and additional mini-sections
      const allMiniSections = [...miniSectionsData, ...additionalMiniSections];
      console.log('   - Total mini-sections (fetched + additional):', allMiniSections.length);
      if (allMiniSections.length > 0) {
        console.log('   - All mini-section IDs:', allMiniSections.map((ms: any) => ms._id));
        console.log('   - All mini-section names:', allMiniSections.map((ms: any) => ms.name));
      }
      
      // If no mini-sections were found, log the orphaned materials/labor
      if (allMiniSections.length === 0 && (parsedMaterialUsed.length > 0 || parsedLabors.length > 0)) {
        console.warn('\n⚠️ ========== ORPHANED DATA DETECTED ==========');
        console.warn('⚠️ Materials and labor exist but reference non-existent mini-sections');
        console.warn('⚠️ This means the mini-sections were deleted but materials/labor were not cleaned up');
        console.warn('⚠️ Referenced mini-section IDs:', missingIds);
        console.warn('⚠️ SOLUTION: Either restore the mini-sections or reassign the materials/labor');
        console.warn('⚠️ ================================================\n');
      }
      
      // Calculate RAW totals (no filtering) for debugging
      const rawUsedTotal = parsedMaterialUsed.reduce((sum: number, m: any) => sum + (m.totalCost || m.cost || 0), 0);
      const rawAvailableTotal = parsedMaterialAvailable.reduce((sum: number, m: any) => sum + (m.totalCost || m.cost || 0), 0);
      const rawLaborTotal = parsedLabors.reduce((sum: number, l: any) => sum + (l.totalCost || 0), 0);
      
      console.log('\n💰 RAW TOTALS (before filtering):');
      console.log(`   - Total MaterialUsed: ₹${rawUsedTotal}`);
      console.log(`   - Total MaterialAvailable: ₹${rawAvailableTotal}`);
      console.log(`   - Total Labor: ₹${rawLaborTotal}`);

      // CRITICAL FIX: If no mini-sections exist, create a virtual one for the section itself
      // This handles cases where materials/labor are assigned to section but not mini-sections
      let effectiveMiniSections = allMiniSections;
      if (allMiniSections.length === 0) {
        console.log('\n⚠️ ========== NO MINI-SECTIONS FOUND ==========');
        console.log('⚠️ Creating virtual mini-section for section-level data');
        console.log('⚠️ Virtual mini-section will use sectionId:', sectionId);
        
        // Create virtual mini-sections for orphaned data
        // Group materials/labor by their sectionId to create separate virtual mini-sections
        const orphanedSectionIds = [...new Set([
          ...parsedMaterialUsed.map((m: any) => m.sectionId).filter((id: string) => id && !sectionAliases.includes(id)),
          ...parsedLabors.map((l: any) => l.sectionId).filter((id: string) => id && !sectionAliases.includes(id) && id !== 'no-mini-section'),
        ])];
        
        if (orphanedSectionIds.length > 0) {
          console.log('⚠️ Found orphaned data with sectionIds:', orphanedSectionIds);
          console.log('⚠️ Creating virtual mini-sections for orphaned data...');
          
          effectiveMiniSections = orphanedSectionIds.map((id, index) => ({
            _id: id,
            name: `Deleted Mini-Section ${index + 1}`,
            isVirtual: true,
            isOrphaned: true,
          })) as any[];
        } else {
          // No orphaned data, create a single virtual mini-section for the section
          effectiveMiniSections = [{
            _id: sectionId,
            name: sectionName || 'Section',
            isVirtual: true,
          }] as any[];
        }
      }
      console.log('   - Effective mini-sections to process:', effectiveMiniSections.length);
      console.log('   - Effective mini-section IDs:', effectiveMiniSections.map((ms: any) => ms._id));
      console.log('   - Effective mini-section names:', effectiveMiniSections.map((ms: any) => ms.name));

      // Use parsed data directly instead of fetching from API
      const projectMaterialsAvailable = parsedMaterialAvailable;
      const projectLaborData = parsedLabors;
      
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
      console.log('📍 Mini-sections:', allMiniSections.map(ms => ({ id: ms._id, name: ms.name })));

      // Fetch equipment costs - ALWAYS try to fetch, even if it fails
      console.log('\n🔧 ========== EQUIPMENT PROCESSING ==========');
      console.log('   - Starting equipment fetch...');
      console.log('   - ProjectId:', projectId);
      console.log('   - SectionId:', sectionId);
      
      let sectionEquipmentCosts: EquipmentExpense[] = [];
      
      // Try to parse equipment from params first
      const parsedEquipments = equipmentsData
        ? JSON.parse(Array.isArray(equipmentsData) ? equipmentsData[0] : equipmentsData)
        : [];
      
      console.log('   - Parsed equipments from params:', parsedEquipments.length);
      
      // CRITICAL: Equipment data is usually NOT in Project object, so always try API first
      try {
        console.log('🔧 Fetching equipment costs from API');
        console.log('   - ProjectId:', projectId);
        console.log('   - SectionId:', sectionId);
        
        // Try fetching by projectId only first (more permissive)
        // CRITICAL FIX: Don't filter by status - get ALL equipment
        const equipmentResponse = await apiClient.get<{
          success: boolean;
          data: any[];
        }>(`/api/equipment`, {
          params: {
            projectId: projectId,
            projectSectionId: sectionId,
            // Don't filter by status - we want all equipment including active
          }
        });

        console.log('   - API Response received');
        console.log('   - Response success:', equipmentResponse.data?.success);
        console.log('   - Response data:', equipmentResponse.data?.data ? 'Present' : 'Missing');

        if (equipmentResponse.data && equipmentResponse.data.success) {
          const allEquipment = equipmentResponse.data.data || [];
          console.log('✅ Equipment data loaded from API:', allEquipment.length, 'items');
          
          // Calculate RAW total (before filtering)
          const rawEquipmentTotal = allEquipment.reduce((sum: number, e: any) => sum + (e.totalCost || 0), 0);
          console.log('💰 RAW Equipment Total (before filtering): ₹' + rawEquipmentTotal);
          
          if (allEquipment.length > 0) {
            console.log('   - Sample equipment from API:', JSON.stringify(allEquipment[0], null, 2));
            console.log('   - Equipment fields:', Object.keys(allEquipment[0]));
            console.log('   - All equipment sectionIds:', [...new Set(allEquipment.map((e: any) => e.sectionId || e.projectSectionId || 'undefined'))]);
            console.log('   - All equipment items:');
            allEquipment.forEach((e: any, idx: number) => {
              console.log(`     ${idx + 1}. ${e.name || e.type}: sectionId="${e.sectionId}", projectSectionId="${e.projectSectionId}", status="${e.status}", totalCost=₹${e.totalCost || 0}`);
            });
          } else {
            console.warn('   ⚠️ NO EQUIPMENT FOUND for projectId:', projectId);
            console.warn('   - This means no equipment exists in the database for this project');
            console.warn('   - Please add equipment from the Equipment page first');
          }
          
          // Filter equipment for this section (or unassigned equipment)
          const sectionEquipment = allEquipment.filter((equipment: any) => {
            const isActive = equipment.status === 'active' || !equipment.status;
            if (!isActive) {
              console.log(`   - Equipment "${equipment.name || equipment.type}" skipped (status: ${equipment.status})`);
              return false;
            }
            
            // Match if: has matching sectionId/projectSectionId, OR has no section assignment
            const hasSectionId = equipment.sectionId === sectionId || equipment.projectSectionId === sectionId;
            const hasNoSectionId = !equipment.sectionId && !equipment.projectSectionId;
            const matches = hasSectionId || hasNoSectionId;
            
            console.log(`   - Equipment "${equipment.name || equipment.type}": sectionId="${equipment.sectionId}", projectSectionId="${equipment.projectSectionId}", matches=${matches}, totalCost=₹${equipment.totalCost || 0}`);
            return matches;
          });
          
          console.log('   - Filtered equipment for this section:', sectionEquipment.length);
          
          // Group equipment by type/name and calculate total costs
          const equipmentGroups: { [key: string]: number } = {};
          
          sectionEquipment.forEach((item: any) => {
            const equipmentName = item.name || item.type || 'Unknown Equipment';
            equipmentGroups[equipmentName] = (equipmentGroups[equipmentName] || 0) + (item.totalCost || 0);
          });
          
          console.log('   - Equipment groups:', equipmentGroups);
          
          // Convert to array format
          sectionEquipmentCosts = Object.entries(equipmentGroups).map(([name, cost]) => ({
            _id: `equipment_${name.replace(/\s+/g, '_')}`,
            name: name,
            totalCost: cost
          }));
          
          console.log('🔧 Equipment expenses from API:', sectionEquipmentCosts);
        }
      } catch (error) {
        console.error('❌ Error fetching equipment costs from API:', error);
        
        // Fallback to params if API fails
        if (parsedEquipments.length > 0) {
          console.log('🔧 Falling back to equipment data from params');
          
          // Filter equipment for this section and group by type/name
          const sectionEquipment = parsedEquipments.filter(
            (equipment: any) => {
              const matches = equipment.sectionId === sectionId || equipment.projectSectionId === sectionId || (!equipment.sectionId && !equipment.projectSectionId);
              console.log(`   - Equipment "${equipment.name || equipment.type}": sectionId=${equipment.sectionId}, projectSectionId=${equipment.projectSectionId}, matches=${matches}`);
              return matches;
            }
          );
          
          console.log('   - Filtered equipment for this section:', sectionEquipment.length);
          
          const equipmentGroups: { [key: string]: number } = {};
          
          sectionEquipment.forEach((item: any) => {
            const isActive = item.status === 'active' || !item.status;
            console.log(`   - Processing equipment "${item.name || item.type}": status=${item.status}, isActive=${isActive}, cost=${item.totalCost || item.cost || 0}`);
            if (isActive) {
              const equipmentName = item.name || item.type || 'Unknown Equipment';
              equipmentGroups[equipmentName] = (equipmentGroups[equipmentName] || 0) + (item.totalCost || item.cost || 0);
            }
          });
          
          console.log('   - Equipment groups:', equipmentGroups);
          
          sectionEquipmentCosts = Object.entries(equipmentGroups).map(([name, cost]) => ({
            _id: `equipment_${name.replace(/\s+/g, '_')}`,
            name: name,
            totalCost: cost
          }));
          
          console.log('🔧 Equipment expenses from params:', sectionEquipmentCosts);
        }
      }

      // ========== OTHER COST PROCESSING ==========
      console.log('\n💵 ========== OTHER COST PROCESSING ==========');
      let sectionOtherCosts: OtherCostExpense[] = [];
      let sectionOtherCostDetails: OtherCostDetail[] = [];
      try {
        const otherCostResponse = await apiClient.get(`/api/otherCost`, {
          params: {
            entityType: 'project',
            entityId: projectId,
            useStandalone: true,
          },
        });
        if (otherCostResponse.data?.success) {
          const entries = otherCostResponse.data?.data?.otherCostEntries || [];
          console.log('   - Other cost entries from API (project-wide):', entries.length);

          // Keep only active (non-cancelled) entries belonging to the current section
          const activeEntries = entries.filter(
            (entry: any) => entry.status !== 'cancelled' &&
                            entry.sectionId &&
                            sectionAliases.includes(String(entry.sectionId))
          );

          // Per-entry details (for the detailed list)
          sectionOtherCostDetails = activeEntries.map((entry: any) => ({
            _id: String(entry._id),
            title: entry.title || 'Other Cost',
            description: entry.description || '',
            amount: entry.amount ?? entry.totalCost ?? 0,
            addedByName: entry.addedByName || '',
            date: entry.addedAt || entry.createdAt || '',
          }));

          // Grouped by title (for the pie slice + total)
          const groups: { [key: string]: number } = {};
          activeEntries.forEach((entry: any) => {
            const key = entry.title || 'Other Cost';
            groups[key] = (groups[key] || 0) + (entry.amount ?? entry.totalCost ?? 0);
          });
          sectionOtherCosts = Object.entries(groups).map(([title, totalCost]) => ({
            _id: `other_cost_${title.replace(/\s+/g, '_')}`,
            title,
            totalCost,
          }));

          console.log('   - Active section other cost entries:', sectionOtherCostDetails.length);
          console.log('   - Grouped section other cost titles:', sectionOtherCosts.length);
        }
      } catch (ocError) {
        console.warn('⚠️ Could not fetch other costs:', ocError);
      }

      // ========== BUILDING-LEVEL LABOR PROCESSING ==========
      console.log('\n👷 ========== BUILDING-LEVEL LABOR PROCESSING ==========');
      console.log('   - Starting building-level labor separation...');
      console.log('   - Total labor entries:', parsedLabors.length);
      
      // Separate building-level labor (no sectionId) from section-specific labor
      const buildingLevelLabor = parsedLabors.filter((labor: any) => {
        const isActive = labor.status === 'active' || !labor.status;
        if (!isActive) {
          console.log(`   - Labor "${labor.type}" skipped (status: ${labor.status})`);
          return false;
        }
        
        // Building-level labor has miniSectionId="no-mini-section" (General Building Labor)
        // This means it's assigned to the section but not to any specific mini-section
        const isBuildingLevel = labor.miniSectionId === 'no-mini-section' && sectionAliases.includes(labor.sectionId);
        console.log(`   - Labor "${labor.type}": sectionId="${labor.sectionId}", miniSectionId="${labor.miniSectionId}", isBuilding-level=${isBuildingLevel}, totalCost=₹${labor.totalCost || 0}`);
        return isBuildingLevel;
      });
      
      console.log('   - Building-level labor entries found:', buildingLevelLabor.length);
      
      // Group building-level labor by type and calculate total costs
      const buildingLaborGroups: { [key: string]: number } = {};
      
      buildingLevelLabor.forEach((item: any) => {
        const laborType = item.type || 'Unknown Labor';
        buildingLaborGroups[laborType] = (buildingLaborGroups[laborType] || 0) + (item.totalCost || 0);
        console.log(`   - Adding building labor "${laborType}": ₹${item.totalCost || 0}`);
      });
      
      console.log('   - Building labor groups:', buildingLaborGroups);
      
      // Convert to array format
      const buildingLaborCosts: BuildingLaborExpense[] = Object.entries(buildingLaborGroups).map(([type, cost]) => ({
        _id: `building_labor_${type.replace(/\s+/g, '_')}`,
        type: type,
        totalCost: cost
      }));
      
      const totalBuildingLaborCost = buildingLaborCosts.reduce((sum, labor) => sum + labor.totalCost, 0);
      console.log('👷 Building-level labor expenses:', buildingLaborCosts.length, 'types');
      console.log('💰 Total Building-level Labor Cost: ₹' + totalBuildingLaborCost);
      
      if (totalBuildingLaborCost === 0) {
        console.log('   ℹ️ No building-level labor found (all labor is section-specific)');
      }

      // Calculate expenses per mini-section
      console.log('\n💰 ========== CALCULATING EXPENSES ==========');
      const miniSectionExpenses: MiniSectionExpense[] = effectiveMiniSections.map((miniSection: any) => {
        console.log(`\n📍 Processing mini-section: ${miniSection.name} (ID: ${miniSection._id})`);
        console.log(`   - Is virtual mini-section for section: ${miniSection._id === sectionId}`);
        console.log(`   - Is orphaned virtual mini-section: ${miniSection.isOrphaned || false}`);
        console.log(`   - Section ID to match: ${sectionId}`);
        
        // CRITICAL FIX: Distinguish between two types of virtual mini-sections:
        // 1. Virtual mini-section for the section itself (miniSection._id === sectionId)
        // 2. Orphaned virtual mini-sections (created for deleted mini-sections, miniSection.isOrphaned === true)
        const isVirtualForSection = sectionAliases.includes(miniSection._id);
        const isOrphanedVirtual = miniSection.isOrphaned === true;
        
        // Calculate used materials cost
        const miniSectionUsedMaterials = parsedMaterialUsed.filter(
          (material: any) => {
            if (isVirtualForSection) {
              // For virtual mini-section representing the section itself:
              // Include if: has matching sectionId, OR has no sectionId
              const hasSectionId = sectionAliases.includes(material.sectionId);
              const hasNoSectionId = !material.sectionId;
              const matches = hasSectionId || hasNoSectionId;
              console.log(`     - Material "${material.name}": sectionId="${material.sectionId}", matches=${matches}, cost=₹${material.totalCost || material.cost || 0}`);
              return matches;
            }
            // For orphaned virtual mini-sections OR real mini-sections:
            // Match by miniSectionId OR sectionId (legacy data has mini-section IDs in sectionId field)
            const matchesMiniSectionId = material.miniSectionId === miniSection._id;
            const matchesSectionId = material.sectionId === miniSection._id;
            const matches = matchesMiniSectionId || matchesSectionId;
            console.log(`     - Material "${material.name}": miniSectionId="${material.miniSectionId}", sectionId="${material.sectionId}", miniSection._id="${miniSection._id}", matchesMiniSectionId=${matchesMiniSectionId}, matchesSectionId=${matchesSectionId}, FINAL_MATCH=${matches}`);
            return matches;
          }
        );

        const usedMaterialsCost = miniSectionUsedMaterials.reduce(
          (sum: number, material: any) => sum + (material.totalCost || material.cost || 0),
          0
        );

        console.log(`   ✅ Used materials: ${miniSectionUsedMaterials.length} items, cost: ₹${usedMaterialsCost}`);

        // Calculate available materials cost for this section/mini-section
        // MaterialAvailable = Materials imported but not yet allocated/used
        
        let miniSectionAvailableMaterials = parsedMaterialAvailable.filter(
          (material: any) => {
            if (isVirtualForSection) {
              // For virtual mini-section representing the section itself
              const hasSectionId = sectionAliases.includes(material.sectionId);
              const hasNoSectionId = !material.sectionId;
              const matches = hasSectionId || hasNoSectionId;
              console.log(`     - Available material "${material.name}": sectionId="${material.sectionId}", matches=${matches}, cost=₹${material.totalCost || material.cost || 0}`);
              return matches;
            }
            // For orphaned virtual mini-sections OR real mini-sections:
            // Match by miniSectionId OR sectionId (legacy data)
            const matchesMiniSectionId = material.miniSectionId === miniSection._id;
            const matchesSectionId = material.sectionId === miniSection._id;
            const hasNoIds = !material.miniSectionId && !material.sectionId;
            const matches = matchesMiniSectionId || matchesSectionId || hasNoIds;
            console.log(`     - Available material "${material.name}": miniSectionId="${material.miniSectionId}", sectionId="${material.sectionId}", miniSection._id="${miniSection._id}", matches=${matches}, cost=₹${material.totalCost || material.cost || 0}`);
            return matches;
          }
        );

        // Calculate available materials cost (materials not yet used)
        // CRITICAL: Available should be the REMAINING after subtracting used
        let totalImportedMaterialsCost = miniSectionAvailableMaterials.reduce(
          (sum: number, material: any) => sum + (material.totalCost || material.cost || 0),
          0
        );
        
        // Available = Imported - Used
        let availableMaterialsCost = Math.max(0, totalImportedMaterialsCost - usedMaterialsCost);

        console.log(`   💰 Material costs breakdown:`);
        console.log(`      - Total Imported: ₹${totalImportedMaterialsCost} (${miniSectionAvailableMaterials.length} items)`);
        console.log(`      - Used (allocated): ₹${usedMaterialsCost} (${miniSectionUsedMaterials.length} items)`);
        console.log(`      - Available (Imported - Used): ₹${availableMaterialsCost}`);
        console.log(`      - Truly Available (Imported - Used): ₹${availableMaterialsCost}`);

        // Calculate labor cost for this mini-section
        console.log(`   - Checking labor entries...`);
        console.log(`   - Total labor entries available: ${projectLaborData.length}`);
        
        const miniSectionLaborEntries = projectLaborData.filter(
          (labor: any) => {
            const isActive = labor.status === 'active' || !labor.status;
            if (!isActive) {
              console.log(`     - Labor "${labor.type}" skipped (status: ${labor.status})`);
              return false;
            }
            
            // CRITICAL: Exclude building-level labor (miniSectionId="no-mini-section")
            const isBuildingLevel = labor.miniSectionId === 'no-mini-section';
            if (isBuildingLevel) {
              console.log(`     - Labor "${labor.type}" skipped (building-level labor, miniSectionId="no-mini-section")`);
              return false;
            }
            
            if (isVirtualForSection) {
              // For virtual mini-section representing the section itself:
              // Match by sectionId only
              const hasSectionId = labor.sectionId === sectionId;
              console.log(`     - Labor "${labor.type}": sectionId="${labor.sectionId}", matches=${hasSectionId}, cost=₹${labor.totalCost || 0}`);
              return hasSectionId;
            }
            // For orphaned virtual mini-sections OR real mini-sections:
            // Match by miniSectionId OR sectionId (legacy data has mini-section IDs in sectionId field)
            const matchesMiniSectionId = labor.miniSectionId === miniSection._id;
            const matchesSectionId = labor.sectionId === miniSection._id;
            const matches = matchesMiniSectionId || matchesSectionId;
            console.log(`     - Labor "${labor.type}": miniSectionId="${labor.miniSectionId}", sectionId="${labor.sectionId}", miniSection._id="${miniSection._id}", matchesMiniSectionId=${matchesMiniSectionId}, matchesSectionId=${matchesSectionId}, FINAL_MATCH=${matches}, cost=₹${labor.totalCost || 0}`);
            return matches;
          }
        );

        const laborCost = miniSectionLaborEntries.reduce(
          (sum: number, labor: any) => sum + (labor.totalCost || 0),
          0
        );

        console.log(`   ✅ Labor: ${miniSectionLaborEntries.length} entries, cost: ₹${laborCost}`);

        // Calculate total expense - only include used materials and labor costs
        // Equipment costs are handled separately since they're not linked to mini-sections
        const totalExpense = usedMaterialsCost + laborCost;

        console.log(`   � TOTAL EXPENSE for ${miniSection.name}: ₹${totalExpense}`);
        console.log(`      - Used Materials: ₹${usedMaterialsCost}`);
        console.log(`      - Labor: ₹${laborCost}`);
        console.log(`      - Available Materials (display only): ₹${availableMaterialsCost}`);

        return {
          _id: miniSection._id,
          name: miniSection.name,
          totalExpense,
          usedMaterialsCost,
          availableMaterialsCost,
          laborCost,
        };
      });

      console.log('\n📊 ========== EXPENSE CALCULATION COMPLETE ==========');
      console.log('Total mini-sections processed:', miniSectionExpenses.length);
      miniSectionExpenses.forEach((ms, idx) => {
        console.log(`  ${idx + 1}. ${ms.name}: ₹${ms.totalExpense} (Materials: ₹${ms.usedMaterialsCost}, Labor: ₹${ms.laborCost})`);
      });
      
      console.log('\n🔧 ========== EQUIPMENT SUMMARY ==========');
      console.log('Equipment expenses:', sectionEquipmentCosts.length, 'items');
      sectionEquipmentCosts.forEach((eq, idx) => {
        console.log(`  ${idx + 1}. ${eq.name}: ₹${eq.totalCost}`);
      });
      const totalEquipmentCost = sectionEquipmentCosts.reduce((sum, eq) => sum + eq.totalCost, 0);
      console.log(`Total Equipment Cost: ₹${totalEquipmentCost}`);
      
      if (totalEquipmentCost === 0) {
        console.warn(`\n⚠️ WARNING: Equipment cost is ₹0!`);
        console.warn(`   - Check if equipment exists in database`);
        console.warn(`   - Check equipment API response above`);
      }

      // Filter mini-sections with actual expenses > 0 (only used materials + labor)
      const activeMiniSections = miniSectionExpenses.filter((ms) => ms.usedMaterialsCost > 0 || ms.laborCost > 0);
      console.log('\n✅ Active mini-sections (with expenses > 0):', activeMiniSections.length);
      console.log('🔍 ================================================\n');
      
      setMiniSections(activeMiniSections);
      setEquipmentExpenses(sectionEquipmentCosts);
      setBuildingLaborExpenses(buildingLaborCosts);
      setOtherCostExpenses(sectionOtherCosts);
      setOtherCostDetails(sectionOtherCostDetails);

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
  const totalBuildingLaborExpense = buildingLaborExpenses.reduce((sum, labor) => sum + labor.totalCost, 0);
  const totalOtherCostExpense = otherCostExpenses.reduce((sum, oc) => sum + oc.totalCost, 0);
  const totalExpense = totalMiniSectionExpense + totalEquipmentExpense + totalBuildingLaborExpense + totalOtherCostExpense;

  const totalUsedMaterials = miniSections.reduce((sum, ms) => sum + ms.usedMaterialsCost, 0);
  const totalAvailableMaterials = miniSections.reduce((sum, ms) => sum + ms.availableMaterialsCost, 0);
  const totalLaborCost = miniSections.reduce((sum, ms) => sum + ms.laborCost, 0) + totalBuildingLaborExpense;

  // Transform to pie data - combine mini-sections and single equipment slice
  // CRITICAL: Only include mini-sections with expenses > 0 to avoid NaN in pie chart
  const miniSectionPieData = miniSections.filter(ms => ms.totalExpense > 0).map((miniSection, index) => ({
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

  // Single building-level labor slice (merged all building labor)
  const buildingLaborPieData = totalBuildingLaborExpense > 0 ? [{
    key: 'building_labor_total',
    value: totalBuildingLaborExpense,
    svg: {
      fill: colors[(miniSections.length + (totalEquipmentExpense > 0 ? 1 : 0)) % colors.length].primary,
      gradientId: `gradient_building_labor_total`,
    },
    name: 'General Building Labor',
    formattedBudget: formatCurrency(totalBuildingLaborExpense),
    percentage: ((totalBuildingLaborExpense / totalExpense) * 100).toFixed(1),
    description: `Building-Level Labor Costs`,
  }] : [];

  // Other cost slice
  const otherCostColorIndex = miniSections.length + (totalEquipmentExpense > 0 ? 1 : 0) + (totalBuildingLaborExpense > 0 ? 1 : 0);
  const otherCostPieData = totalOtherCostExpense > 0 ? [{
    key: 'other_cost_total',
    value: totalOtherCostExpense,
    svg: {
      fill: colors[otherCostColorIndex % colors.length].primary,
      gradientId: `gradient_other_cost_total`,
    },
    name: 'Other Cost',
    formattedBudget: formatCurrency(totalOtherCostExpense),
    percentage: ((totalOtherCostExpense / totalExpense) * 100).toFixed(1),
    description: `${otherCostExpenses.length} other cost entr${otherCostExpenses.length === 1 ? 'y' : 'ies'}`,
  }] : [];

  const pieData = [...miniSectionPieData, ...equipmentPieData, ...buildingLaborPieData, ...otherCostPieData];

  // Create legend data with separators
  const miniSectionLegendData: LegendItem[] = miniSectionPieData.map((item, index) => ({
    key: item.key,
    name: item.name,
    value: item.formattedBudget,
    percentage: item.percentage,
    color: colors[index % colors.length].primary,
    description: item.description,
  }));

  const equipmentLegendData: LegendItem[] = equipmentPieData.map((item) => ({
    key: item.key,
    name: item.name,
    value: item.formattedBudget,
    percentage: item.percentage,
    color: colors[miniSections.length % colors.length].primary,
    description: item.description,
  }));

  const buildingLaborLegendData: LegendItem[] = buildingLaborPieData.map((item) => ({
    key: item.key,
    name: item.name,
    value: item.formattedBudget,
    percentage: item.percentage,
    color: colors[(miniSections.length + (totalEquipmentExpense > 0 ? 1 : 0)) % colors.length].primary,
    description: item.description,
  }));

  const otherCostLegendData: LegendItem[] = otherCostPieData.map((item) => ({
    key: item.key,
    name: item.name,
    value: item.formattedBudget,
    percentage: item.percentage,
    color: colors[otherCostColorIndex % colors.length].primary,
    description: item.description,
  }));

  // ===== Other Cost Analysis (dedicated section) — break down by individual title =====
  const otherCostBreakdownPieData = [...otherCostExpenses]
    .filter((oc) => oc.totalCost > 0)
    .sort((a, b) => b.totalCost - a.totalCost)
    .map((oc, index) => ({
      key: oc._id,
      value: oc.totalCost,
      svg: {
        fill: colors[index % colors.length].primary,
        gradientId: `gradient_oc_breakdown_${oc._id}`,
      },
      name: oc.title,
      formattedBudget: formatCurrency(oc.totalCost),
      percentage: totalOtherCostExpense > 0
        ? ((oc.totalCost / totalOtherCostExpense) * 100).toFixed(1)
        : '0',
      description: '',
    }));

  const otherCostBreakdownLegendData: LegendItem[] = otherCostBreakdownPieData.map((item, index) => ({
    key: item.key,
    name: item.name,
    value: item.formattedBudget,
    percentage: item.percentage,
    color: colors[index % colors.length].primary,
    description: item.description,
  }));

  // Navigate to the dedicated Other Cost Analysis page
  const handleViewOtherCostAnalysis = () => {
    router.push({
      pathname: '/analytics/other-cost-analytics',
      params: {
        projectId,
        projectName,
        sectionId,
        sectionName,
        otherCosts: JSON.stringify(otherCostDetails),
      },
    });
  };

  const legendData: LegendItem[] = pieData.map((item, index) => ({
    key: item.key,
    name: item.name,
    value: item.formattedBudget,
    percentage: item.percentage,
    color: colors[index % colors.length].primary,
    description: item.description,
  }));

  const handleMiniSectionPress = (miniSectionId: string, miniSectionName: string) => {
    // Handle equipment click - navigate to dedicated page
    if (miniSectionId === 'equipment_total') {
      router.push({
        pathname: '/analytics/equipment-analytics',
        params: {
          projectId,
          projectName,
          sectionId,
          sectionName,
          equipments: equipmentsData,
        },
      });
      return;
    }
    
    // Other cost slice — navigate to dedicated Other Cost Analysis page
    if (miniSectionId === 'other_cost_total') {
      handleViewOtherCostAnalysis();
      return;
    }

    // Handle building-level labor click - navigate to dedicated page
    if (miniSectionId === 'building_labor_total') {
      router.push({
        pathname: '/analytics/building-labor-analytics',
        params: {
          projectId,
          projectName,
          sectionId,
          sectionName,
          labors: laborsData,
        },
      });
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#3A78B5" />
            </TouchableOpacity>
            <View style={styles.projectInfo}>
              <Text style={styles.projectName}>{sectionName}</Text>
              <Text style={styles.projectSubtitle}>Slab Expenses</Text>
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
            <Text style={styles.statLabel}>Active Slabs</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxSecondary]}>
            <Text style={styles.statValue}>{formatCurrency(totalExpense)}</Text>
            <Text style={styles.statLabel}>Total Expenses</Text>
          </View>
        </View>

        {/* Material, Equipment & Labor Breakdown Stats */}
        {(totalUsedMaterials > 0 || totalAvailableMaterials > 0 || totalEquipmentExpense > 0 || totalLaborCost > 0 || totalOtherCostExpense > 0) && (
          <View style={styles.breakdownStatsSection}>
            <View style={styles.breakdownStatBox}>
              <View style={styles.breakdownStatItem}>
                <View style={styles.breakdownStatIconContainer}>
                  <Ionicons name="cube-outline" size={18} color="#3A78B5" />
                </View>
                <View style={styles.breakdownStatInfo}>
                  <Text style={styles.breakdownStatLabel}>Used Materials</Text>
                  <Text style={styles.breakdownStatValue}>{formatCurrency(totalUsedMaterials)}</Text>
                </View>
              </View>
              {/* <View style={styles.breakdownStatItem}>
                <View style={styles.breakdownStatIconContainer}>
                  <Ionicons name="layers-outline" size={18} color="#10B981" />
                </View>
                <View style={styles.breakdownStatInfo}>
                  <Text style={styles.breakdownStatLabel}>Available Materials</Text>
                  <Text style={styles.breakdownStatValue}>{formatCurrency(totalAvailableMaterials)}</Text>
                </View>
              </View> */}
              <View style={styles.breakdownStatItem}>
                <View style={styles.breakdownStatIconContainer}>
                  <Ionicons name="people-outline" size={18} color="#EF4444" />
                </View>
                <View style={styles.breakdownStatInfo}>
                  <Text style={styles.breakdownStatLabel}>Labor Costs</Text>
                  <Text style={styles.breakdownStatValue}>{formatCurrency(totalLaborCost)}</Text>
                </View>
              </View>
              {totalOtherCostExpense > 0 && (
                <View style={styles.breakdownStatItem}>
                  <View style={styles.breakdownStatIconContainer}>
                    <Ionicons name="receipt-outline" size={18} color="#3A78B5" />
                  </View>
                  <View style={styles.breakdownStatInfo}>
                    <Text style={styles.breakdownStatLabel}>Other Costs</Text>
                    <Text style={styles.breakdownStatValue}>{formatCurrency(totalOtherCostExpense)}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {loading ? (
          <AnalyticsDashboardSkeleton />
        ) : (miniSections.length === 0 && equipmentExpenses.length === 0 && buildingLaborExpenses.length === 0 && otherCostExpenses.length === 0) || totalExpense === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="grid-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Expenses Found</Text>
            <Text style={styles.emptySubtitle}>
              No materials have been used, no equipment costs incurred, and no labor costs recorded in this section yet.
              {'\n\n'}
              Check the console logs for detailed debugging information about why expenses might not be showing.
            </Text>
            <View style={{ marginTop: 20, padding: 15, backgroundColor: '#FEF3C7', borderRadius: 10, width: '100%' }}>
              <Text style={{ fontSize: 12, color: '#92400E', textAlign: 'left', fontFamily: 'monospace' }}>
                Debug Info:{'\n'}
                Section ID: {sectionId}{'\n'}
                Section Name: {sectionName}{'\n'}
                Mini-Sections: {miniSections.length}{'\n'}
                Equipment: {equipmentExpenses.length}{'\n'}
                Building Labor: {buildingLaborExpenses.length}{'\n'}
                Total Expense: ₹{totalExpense}{'\n'}
                {'\n'}
                ⚠️ This section has no expenses.{'\n'}
                Materials/labor may be assigned to different sections.{'\n'}
                Check console for section ID mismatch details.
              </Text>
            </View>
          </View>
        ) : (
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <View style={styles.heading}>
              <Text style={styles.title}>Slab Expenses</Text>
              <Text style={styles.subtitle}>Used Materials + Labor Costs</Text>
            </View>

            <View style={styles.tapHint}>
              <Ionicons name="finger-print-outline" size={15} color="#3A78B5" />
              <Text style={styles.tapHintText}>Tap a slab to view its material & labor details</Text>
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
                  label: '',
                  value: formatCurrency(totalExpense),
                  subtitle: `${miniSections.length} Slab${miniSections.length > 1 ? 's' : ''}`,
                }}
              />
            </View>

            {/* Custom Legend with Separators */}
            <View style={styles.legendContainer}>
              {/* Mini-Sections Legend */}
              {miniSectionLegendData.length > 0 && (
                <View style={styles.legendSection}>
                  <Text style={styles.legendSectionTitle}>Slabs</Text>
                  {miniSectionLegendData.map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={styles.legendItem}
                      onPress={() => handleMiniSectionPress(item.key, item.name)}
                    >
                      <View style={[styles.legendColorIndicator, { backgroundColor: item.color }]} />
                      <View style={styles.legendTextContainer}>
                        <View style={styles.legendMainInfo}>
                          <Text style={styles.legendItemName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={styles.legendItemValue}>
                            {item.value}
                            {item.percentage && (
                              <Text style={styles.legendPercentageText}>
                                {' '}({item.percentage}%)
                              </Text>
                            )}
                          </Text>
                        </View>
                        {item.description && (
                          <View style={styles.legendDescriptionContainer}>
                            <Text style={styles.legendItemDescription} numberOfLines={2}>
                              {item.description}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#B0BEC5" style={{ alignSelf: 'center', marginLeft: 2 }} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Separator for Equipment */}
              {equipmentLegendData.length > 0 && miniSectionLegendData.length > 0 && (
                <View style={styles.legendSeparator}>
                  <View style={styles.legendSeparatorLine} />
                  <Text style={styles.legendSeparatorText}>Other Costs</Text>
                  <View style={styles.legendSeparatorLine} />
                </View>
              )}

              {/* Equipment Legend */}
              {equipmentLegendData.length > 0 && (
                <View style={styles.legendSection}>
                  {equipmentLegendData.map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={styles.legendItem}
                      onPress={() => handleMiniSectionPress(item.key, item.name)}
                    >
                      <View style={[styles.legendColorIndicator, { backgroundColor: item.color }]} />
                      <View style={styles.legendTextContainer}>
                        <View style={styles.legendMainInfo}>
                          <Text style={styles.legendItemName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={styles.legendItemValue}>
                            {item.value}
                            {item.percentage && (
                              <Text style={styles.legendPercentageText}>
                                {' '}({item.percentage}%)
                              </Text>
                            )}
                          </Text>
                        </View>
                        {item.description && (
                          <View style={styles.legendDescriptionContainer}>
                            <Text style={styles.legendItemDescription} numberOfLines={2}>
                              {item.description}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#B0BEC5" style={{ alignSelf: 'center', marginLeft: 2 }} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Building Labor Legend */}
              {buildingLaborLegendData.length > 0 && (
                <View style={styles.legendSection}>
                  {buildingLaborLegendData.map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={styles.legendItem}
                      onPress={() => handleMiniSectionPress(item.key, item.name)}
                    >
                      <View style={[styles.legendColorIndicator, { backgroundColor: item.color }]} />
                      <View style={styles.legendTextContainer}>
                        <View style={styles.legendMainInfo}>
                          <Text style={styles.legendItemName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={styles.legendItemValue}>
                            {item.value}
                            {item.percentage && (
                              <Text style={styles.legendPercentageText}>
                                {' '}({item.percentage}%)
                              </Text>
                            )}
                          </Text>
                        </View>
                        {item.description && (
                          <View style={styles.legendDescriptionContainer}>
                            <Text style={styles.legendItemDescription} numberOfLines={2}>
                              {item.description}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#B0BEC5" style={{ alignSelf: 'center', marginLeft: 2 }} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Other Cost Legend (total slice only) */}
              {otherCostLegendData.length > 0 && (
                <>
                  {(miniSectionLegendData.length > 0 || equipmentLegendData.length > 0 || buildingLaborLegendData.length > 0) && (
                    <View style={styles.legendSeparator}>
                      <View style={styles.legendSeparatorLine} />
                      <Text style={styles.legendSeparatorText}>Other Cost</Text>
                      <View style={styles.legendSeparatorLine} />
                    </View>
                  )}
                  <View style={styles.legendSection}>
                    {otherCostLegendData.map((item) => (
                      <TouchableOpacity
                        key={item.key}
                        style={styles.legendItem}
                        onPress={() => handleMiniSectionPress(item.key, item.name)}
                      >
                        <View style={[styles.legendColorIndicator, { backgroundColor: item.color }]} />
                        <View style={styles.legendTextContainer}>
                          <View style={styles.legendMainInfo}>
                            <Text style={styles.legendItemName} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={styles.legendItemValue}>
                              {item.value}
                              {item.percentage && (
                                <Text style={styles.legendPercentageText}>
                                  {' '}({item.percentage}%)
                                </Text>
                              )}
                            </Text>
                          </View>
                          {item.description && (
                            <View style={styles.legendDescriptionContainer}>
                              <Text style={styles.legendItemDescription} numberOfLines={2}>
                                {item.description}
                              </Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>
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
    padding: 12,
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
    marginBottom: 4,
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
    marginVertical: 8,
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
  // Custom Legend Styles
  legendContainer: {
    marginHorizontal: 6,
    marginTop: 4,
    marginBottom: 20,
  },
  legendSection: {
    marginBottom: 4,
  },
  legendSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    marginLeft: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  legendColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  legendTextContainer: {
    flex: 1,
  },
  legendMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  legendItemValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  legendPercentageText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  legendDescriptionContainer: {
    marginTop: 2,
  },
  legendItemDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  legendSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 8,
  },
  legendSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1',
  },
  legendSeparatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginHorizontal: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  // Other Cost Details Styles
  otherCostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  otherCostHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  otherCostHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  otherCostHeaderSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  otherCostViewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F5F3FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  otherCostViewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3A78B5',
  },
  otherCostItem: {
    backgroundColor: '#FAFAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EEF1F6',
  },
  otherCostItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  otherCostItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  otherCostItemAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3A78B5',
  },
  otherCostItemDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  otherCostItemMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 8,
  },
  otherCostMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  otherCostMetaText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
});