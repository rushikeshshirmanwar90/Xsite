// Level 3: Mini-Sections Analytics
import PieChart, { PieChartColors20 } from '@/components/PieChart';
import PieChartLegend, { LegendItem } from '@/components/PieChartLegend';
import { getSection } from '@/functions/details';
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

interface BuildingLaborExpense {
  _id: string;
  type: string;
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
  const materialAvailable = params.materialAvailable as string;
  const laborsData = params.labors as string;
  const equipmentsData = params.equipments as string;

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const colors = PieChartColors20;

  const [miniSections, setMiniSections] = useState<MiniSectionExpense[]>([]);
  const [equipmentExpenses, setEquipmentExpenses] = useState<EquipmentExpense[]>([]);
  const [buildingLaborExpenses, setBuildingLaborExpenses] = useState<BuildingLaborExpense[]>([]);
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
      const miniSectionsData = await getSection(sectionId);
      console.log('   - Mini-sections from API:', miniSectionsData.length);
      if (miniSectionsData.length > 0) {
        console.log('   - Mini-section IDs:', miniSectionsData.map((ms: any) => ms._id));
        console.log('   - Mini-section names:', miniSectionsData.map((ms: any) => ms.name));
      }
      
      const parsedMaterialUsed = materialUsed
        ? JSON.parse(Array.isArray(materialUsed) ? materialUsed[0] : materialUsed)
        : [];

      // Parse materialAvailable from params
      const parsedMaterialAvailable = materialAvailable
        ? JSON.parse(Array.isArray(materialAvailable) ? materialAvailable[0] : materialAvailable)
        : [];

      // Parse labors from params
      const parsedLabors = laborsData
        ? JSON.parse(Array.isArray(laborsData) ? laborsData[0] : laborsData)
        : [];

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
      let effectiveMiniSections = miniSectionsData;
      if (miniSectionsData.length === 0) {
        console.log('\n⚠️ ========== NO MINI-SECTIONS FOUND ==========');
        console.log('⚠️ Creating virtual mini-section for section-level data');
        console.log('⚠️ Virtual mini-section will use sectionId:', sectionId);
        effectiveMiniSections = [{
          _id: sectionId,
          name: sectionName || 'Section',
          // This virtual mini-section will capture all section-level expenses
        }] as any[];
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
      console.log('📍 Mini-sections:', miniSectionsData.map(ms => ({ id: ms._id, name: ms.name })));

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
        const equipmentResponse = await axios.get<{
          success: boolean;
          data: any[];
        }>(`${domain}/api/equipment`, {
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
        const isBuildingLevel = labor.miniSectionId === 'no-mini-section' && labor.sectionId === sectionId;
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
        console.log(`   - Is virtual mini-section: ${miniSection._id === sectionId}`);
        console.log(`   - Section ID to match: ${sectionId}`);
        
        // SIMPLIFIED LOGIC: If this is a virtual mini-section (no real mini-sections exist),
        // just include ALL materials/labor regardless of sectionId
        const isVirtualMiniSection = miniSection._id === sectionId;
        
        // Calculate used materials cost
        const miniSectionUsedMaterials = parsedMaterialUsed.filter(
          (material: any) => {
            if (isVirtualMiniSection) {
              // For virtual mini-section, be very forgiving:
              // Include if: has matching sectionId, OR has no sectionId, OR if there's only one section (include everything)
              const hasSectionId = material.sectionId === sectionId;
              const hasNoSectionId = !material.sectionId;
              const matches = hasSectionId || hasNoSectionId;
              console.log(`     - Material "${material.name}": sectionId="${material.sectionId}", matches=${matches}, cost=₹${material.totalCost || material.cost || 0}`);
              return matches;
            }
            // For real mini-sections, match by miniSectionId
            const matches = material.miniSectionId === miniSection._id;
            console.log(`     - Material "${material.name}": miniSectionId="${material.miniSectionId}", matches=${matches}`);
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
            if (isVirtualMiniSection) {
              // For virtual mini-section, be very forgiving
              const hasSectionId = material.sectionId === sectionId;
              const hasNoSectionId = !material.sectionId;
              const matches = hasSectionId || hasNoSectionId;
              console.log(`     - Available material "${material.name}": sectionId="${material.sectionId}", matches=${matches}, cost=₹${material.totalCost || material.cost || 0}`);
              return matches;
            }
            // For real mini-sections, match by miniSectionId
            // CRITICAL FIX: MaterialAvailable often doesn't have miniSectionId OR sectionId set
            // If both are missing, include the material (it's unassigned and available to all)
            const hasMiniSectionId = material.miniSectionId === miniSection._id;
            const hasNoMiniSectionId = !material.miniSectionId || material.miniSectionId === 'undefined';
            const hasSectionId = material.sectionId === sectionId;
            const hasNoSectionId = !material.sectionId;
            
            // Match if: 
            // 1. Has matching miniSectionId, OR
            // 2. (No miniSectionId AND has matching sectionId), OR
            // 3. (No miniSectionId AND no sectionId - unassigned material)
            const matches = hasMiniSectionId || (hasNoMiniSectionId && (hasSectionId || hasNoSectionId));
            console.log(`     - Available material "${material.name}": miniSectionId="${material.miniSectionId}", sectionId="${material.sectionId}", matches=${matches}, cost=₹${material.totalCost || material.cost || 0}`);
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
            
            if (isVirtualMiniSection) {
              // For virtual mini-section, match by sectionId only
              const hasSectionId = labor.sectionId === sectionId;
              console.log(`     - Labor "${labor.type}": sectionId="${labor.sectionId}", matches=${hasSectionId}, cost=₹${labor.totalCost || 0}`);
              return hasSectionId;
            }
            // For real mini-sections, match by miniSectionId
            const hasMiniSectionId = labor.miniSectionId === miniSection._id;
            const hasNoMiniSectionId = !labor.miniSectionId || labor.miniSectionId === 'undefined';
            const hasSectionId = labor.sectionId === sectionId;
            
            // Match if: 
            // 1. Has matching miniSectionId, OR
            // 2. (No miniSectionId AND has matching sectionId)
            const matches = hasMiniSectionId || (hasNoMiniSectionId && hasSectionId);
            console.log(`     - Labor "${labor.type}": miniSectionId="${labor.miniSectionId}", sectionId="${labor.sectionId}", matches=${matches}, cost=₹${labor.totalCost || 0}`);
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
      
      // Set equipment expenses separately
      setEquipmentExpenses(sectionEquipmentCosts);
      
      // Set building-level labor expenses separately
      setBuildingLaborExpenses(buildingLaborCosts);

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
  const totalExpense = totalMiniSectionExpense + totalEquipmentExpense + totalBuildingLaborExpense;
  
  const totalUsedMaterials = miniSections.reduce((sum, ms) => sum + ms.usedMaterialsCost, 0);
  const totalAvailableMaterials = miniSections.reduce((sum, ms) => sum + ms.availableMaterialsCost, 0);
  const totalLaborCost = miniSections.reduce((sum, ms) => sum + ms.laborCost, 0) + totalBuildingLaborExpense;

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

  const pieData = [...miniSectionPieData, ...equipmentPieData, ...buildingLaborPieData];

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

            {/* Custom Legend with Separators */}
            <View style={styles.legendContainer}>
              {/* Mini-Sections Legend */}
              {miniSectionLegendData.length > 0 && (
                <View style={styles.legendSection}>
                  <Text style={styles.legendSectionTitle}>Mini-Sections</Text>
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
                    </TouchableOpacity>
                  ))}
                </View>
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
});