import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Types
interface Project {
  id: string;
  name: string;
}

interface BuildingSection {
  id: string;
  name: string;
  budgetAllocated: number;
  budgetUsed: number;
  progress: number;
  color: string;
  daysCompleted: number;
  daysRequired: number;
}

interface MaterialItem {
  id: string;
  name: string;
  category: string;
  sectionId: string;
  totalQuantity: number;
  usedQuantity: number;
  wastedQuantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

// Mock Data
const mockProjects: Project[] = [
  { id: '1', name: 'Residential Complex A' },
  { id: '2', name: 'Commercial Building B' },
];

const mockBuildingSections: BuildingSection[] = [
  {
    id: '1',
    name: 'Foundation',
    budgetAllocated: 500000,
    budgetUsed: 350000,
    progress: 70,
    color: '#4CAF50',
    daysCompleted: 14,
    daysRequired: 20,
  },
  {
    id: '2',
    name: 'Ground Floor',
    budgetAllocated: 800000,
    budgetUsed: 400000,
    progress: 50,
    color: '#2196F3',
    daysCompleted: 10,
    daysRequired: 25,
  },
];

const mockMaterials: MaterialItem[] = [
  {
    id: '1',
    name: 'Concrete',
    category: 'Structural',
    sectionId: '1',
    totalQuantity: 100,
    usedQuantity: 70,
    wastedQuantity: 5,
    unit: 'm³',
    unitCost: 5000,
    totalCost: 500000,
  },
  {
    id: '2',
    name: 'Steel Rebar',
    category: 'Structural',
    sectionId: '1',
    totalQuantity: 500,
    usedQuantity: 350,
    wastedQuantity: 20,
    unit: 'kg',
    unitCost: 65,
    totalCost: 32500,
  },
  {
    id: '3',
    name: 'Bricks',
    category: 'Masonry',
    sectionId: '2',
    totalQuantity: 2000,
    usedQuantity: 1000,
    wastedQuantity: 50,
    unit: 'pcs',
    unitCost: 8,
    totalCost: 16000,
  },
];

export default function BuildingSectionDetails() {
  const { projectId, sectionId } = useLocalSearchParams();
  const project = mockProjects.find((p) => p.id === projectId);
  const section = mockBuildingSections.find((s) => s.id === sectionId);
  const materials = mockMaterials.filter((material) => material.sectionId === sectionId);

  if (!project || !section) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Section not found</Text>
      </View>
    );
  }

  const handleMaterialPress = (materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      router.push({
        pathname: '/material-details/[id]',
        params: { 
          id: material.id,
          materialName: material.name,
          sectionId: section.id
        }
      });
    }
  };

  const totalMaterialCost = materials.reduce((sum, material) => sum + material.totalCost, 0);
  const totalUsedQuantity = materials.reduce((sum, material) => sum + material.usedQuantity, 0);
  const totalWastedQuantity = materials.reduce((sum, material) => sum + material.wastedQuantity, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.sectionName}>{section.name}</Text>
            <Text style={styles.projectName}>{project.name}</Text>
          </View>
        </View>

        {/* Section Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                ${(section.budgetAllocated / 1000).toFixed(0)}k
              </Text>
              <Text style={styles.statLabel}>Allocated</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                ${(section.budgetUsed / 1000).toFixed(0)}k
              </Text>
              <Text style={styles.statLabel}>Used</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{section.progress}%</Text>
              <Text style={styles.statLabel}>Progress</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${section.progress}%`,
                  backgroundColor: section.color,
                },
              ]}
            />
          </View>

          {/* Days Progress */}
          <View style={styles.daysProgress}>
            <Text style={styles.daysProgressText}>
              {section.daysCompleted} of {section.daysRequired} days completed
            </Text>
            <View style={styles.daysProgressBarContainer}>
              <View
                style={[
                  styles.daysProgressBar,
                  {
                    width: `${(section.daysCompleted / section.daysRequired) * 100}%`,
                    backgroundColor: section.color,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Materials Overview */}
        <View style={styles.materialsOverview}>
          <Text style={styles.sectionTitle}>Materials Overview</Text>
          <View style={styles.materialsStats}>
            <View style={styles.materialStat}>
              <Text style={styles.materialStatValue}>
                ${totalMaterialCost.toLocaleString()}
              </Text>
              <Text style={styles.materialStatLabel}>Total Cost</Text>
            </View>
            <View style={styles.materialStat}>
              <Text style={styles.materialStatValue}>
                {totalUsedQuantity} units
              </Text>
              <Text style={styles.materialStatLabel}>Total Used</Text>
            </View>
            <View style={styles.materialStat}>
              <Text style={[styles.materialStatValue, { color: '#FF5722' }]}>
                {totalWastedQuantity} units
              </Text>
              <Text style={styles.materialStatLabel}>Total Wasted</Text>
            </View>
          </View>
        </View>

        {/* Materials List */}
        <View style={styles.materialsSection}>
          <Text style={styles.sectionTitle}>Materials Details</Text>
          {materials.map((material) => {
            const wastePercentage = material.totalQuantity > 0 
              ? (material.wastedQuantity / material.totalQuantity) * 100 
              : 0;
            
            return (
              <TouchableOpacity
                key={material.id}
                style={styles.materialCard}
                onPress={() => handleMaterialPress(material.id)}
              >
                <View style={styles.materialHeader}>
                  <View style={styles.materialInfo}>
                    <Text style={styles.materialName}>{material.name}</Text>
                    <Text style={styles.materialCategory}>{material.category}</Text>
                  </View>
                  <View style={[styles.materialStatusDot, { backgroundColor: section.color }]} />
                </View>

                <View style={styles.materialStats}>
                  <View style={styles.materialStat}>
                    <Text style={styles.materialStatValue}>
                      {material.totalQuantity} {material.unit}
                    </Text>
                    <Text style={styles.materialStatLabel}>Total</Text>
                  </View>
                  <View style={styles.materialStat}>
                    <Text style={styles.materialStatValue}>
                      {material.usedQuantity} {material.unit}
                    </Text>
                    <Text style={styles.materialStatLabel}>Used</Text>
                  </View>
                  <View style={styles.materialStat}>
                    <Text style={[styles.materialStatValue, { color: '#FF5722' }]}>
                      {material.wastedQuantity} {material.unit}
                    </Text>
                    <Text style={styles.materialStatLabel}>Wasted</Text>
                  </View>
                </View>

                {/* Usage Progress Bar */}
                <View style={styles.usageProgress}>
                  <Text style={styles.usageProgressText}>
                    Usage: {Math.round((material.usedQuantity / material.totalQuantity) * 100)}%
                  </Text>
                  <View style={styles.usageProgressBarContainer}>
                    <View
                      style={[
                        styles.usageProgressBar,
                        {
                          width: `${(material.usedQuantity / material.totalQuantity) * 100}%`,
                          backgroundColor: section.color,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Waste Indicator */}
                {wastePercentage > 0 && (
                  <View style={styles.wasteIndicator}>
                    <Ionicons name="alert-circle" size={16} color="#FF5722" />
                    <Text style={styles.wasteText}>
                      {wastePercentage.toFixed(1)}% waste (${(material.wastedQuantity * material.unitCost).toLocaleString()} lost)
                    </Text>
                  </View>
                )}

                <View style={styles.materialCost}>
                  <Text style={styles.materialCostLabel}>Total Cost:</Text>
                  <Text style={styles.materialCostValue}>
                    ${material.totalCost.toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  sectionName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  projectName: {
    fontSize: 14,
    color: '#ccc',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#2a3f5f',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  daysProgress: {
    marginTop: 8,
  },
  daysProgressText: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 4,
  },
  daysProgressBarContainer: {
    height: 4,
    backgroundColor: '#2a3f5f',
    borderRadius: 2,
    overflow: 'hidden',
  },
  daysProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  materialsOverview: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  materialsStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  materialStat: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  materialStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  materialStatLabel: {
    fontSize: 11,
    color: '#ccc',
    textAlign: 'center',
  },
  materialsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  materialCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a3f5f',
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  materialCategory: {
    fontSize: 12,
    color: '#ccc',
  },
  materialStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  materialStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  usageProgress: {
    marginBottom: 12,
  },
  usageProgressText: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 4,
  },
  usageProgressBarContainer: {
    height: 4,
    backgroundColor: '#2a3f5f',
    borderRadius: 2,
    overflow: 'hidden',
  },
  usageProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  wasteIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a1f1f',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  wasteText: {
    fontSize: 12,
    color: '#FF5722',
    marginLeft: 8,
    flex: 1,
  },
  materialCost: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a3f5f',
  },
  materialCostLabel: {
    fontSize: 14,
    color: '#ccc',
  },
  materialCostValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  errorText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 50,
  },
});
