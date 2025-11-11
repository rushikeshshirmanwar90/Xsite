// Level 4: Materials List for Mini-Section
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

interface MaterialUsed {
  _id: string;
  name: string;
  qnt: number;
  unit: string;
  cost: number;
  specs: Record<string, any>;
  addedAt?: string;
  createdAt?: string;
}

const MaterialsAnalytics: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectName = params.projectName as string;
  const sectionName = params.sectionName as string;
  const miniSectionId = params.miniSectionId as string;
  const miniSectionName = params.miniSectionName as string;
  const materialUsed = params.materialUsed as string;

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const [materials, setMaterials] = useState<MaterialUsed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterials();
  }, [miniSectionId, materialUsed]);

  const loadMaterials = () => {
    try {
      setLoading(true);

      const parsedMaterialUsed = materialUsed
        ? JSON.parse(Array.isArray(materialUsed) ? materialUsed[0] : materialUsed)
        : [];

      // Filter materials for this mini-section
      const miniSectionMaterials = parsedMaterialUsed.filter(
        (material: any) => material.miniSectionId === miniSectionId
      );

      setMaterials(miniSectionMaterials);

      // Animate
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalExpense = materials.reduce((sum, material) => sum + material.cost, 0);

  const getMaterialIcon = (materialName: string) => {
    const name = materialName.toLowerCase();
    if (name.includes('cement')) return 'cube-outline';
    if (name.includes('brick')) return 'square-outline';
    if (name.includes('steel') || name.includes('rod')) return 'barbell-outline';
    if (name.includes('sand')) return 'layers-outline';
    if (name.includes('paint')) return 'color-palette-outline';
    if (name.includes('tile')) return 'grid-outline';
    if (name.includes('pipe')) return 'ellipse-outline';
    if (name.includes('wood')) return 'leaf-outline';
    return 'cube-outline';
  };

  const getMaterialColor = (materialName: string) => {
    const name = materialName.toLowerCase();
    if (name.includes('cement')) return '#8B5CF6';
    if (name.includes('brick')) return '#EF4444';
    if (name.includes('steel') || name.includes('rod')) return '#6B7280';
    if (name.includes('sand')) return '#F59E0B';
    if (name.includes('paint')) return '#EC4899';
    if (name.includes('tile')) return '#06B6D4';
    if (name.includes('pipe')) return '#8B5CF6';
    if (name.includes('wood')) return '#84CC16';
    return '#3B82F6';
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
              <Text style={styles.projectName}>{miniSectionName}</Text>
              <Text style={styles.projectSubtitle}>Materials Used</Text>
            </View>
          </View>
        </View>

        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbText}>{projectName}</Text>
          <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
          <Text style={styles.breadcrumbText}>{sectionName}</Text>
          <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
          <Text style={styles.breadcrumbTextActive}>{miniSectionName}</Text>
        </View>

        {/* Total Expense Card */}
        <View style={styles.totalCard}>
          <View style={styles.totalIconContainer}>
            <Ionicons name="cash-outline" size={32} color="#10B981" />
          </View>
          <View style={styles.totalInfo}>
            <Text style={styles.totalLabel}>Total Material Expense</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalExpense)}</Text>
            <Text style={styles.totalSubtext}>{materials.length} material{materials.length > 1 ? 's' : ''} used</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading materials...</Text>
          </View>
        ) : materials.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Materials Used</Text>
            <Text style={styles.emptySubtitle}>
              No materials have been used in this mini-section yet
            </Text>
          </View>
        ) : (
          <Animated.View style={[styles.materialsContainer, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>Materials Breakdown</Text>
            {materials.map((material, index) => (
              <View key={material._id || index} style={styles.materialCard}>
                <View style={styles.materialHeader}>
                  <View
                    style={[
                      styles.materialIconContainer,
                      { backgroundColor: `${getMaterialColor(material.name)}20` },
                    ]}
                  >
                    <Ionicons
                      name={getMaterialIcon(material.name) as any}
                      size={24}
                      color={getMaterialColor(material.name)}
                    />
                  </View>
                  <View style={styles.materialInfo}>
                    <Text style={styles.materialName}>{material.name}</Text>
                    <Text style={styles.materialQuantity}>
                      {material.qnt} {material.unit}
                    </Text>
                  </View>
                  <View style={styles.materialCostContainer}>
                    <Text style={styles.materialCost}>{formatCurrency(material.cost)}</Text>
                    <Text style={styles.materialCostLabel}>Total Cost</Text>
                  </View>
                </View>

                {/* Specs */}
                {material.specs && Object.keys(material.specs).length > 0 && (
                  <View style={styles.specsContainer}>
                    <Text style={styles.specsTitle}>Specifications:</Text>
                    {Object.entries(material.specs).map(([key, value]) => (
                      <View key={key} style={styles.specRow}>
                        <Text style={styles.specKey}>{key}:</Text>
                        <Text style={styles.specValue}>{String(value)}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Date */}
                {(material.addedAt || material.createdAt) && (
                  <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
                    <Text style={styles.dateText}>
                      Added: {new Date(material.addedAt || material.createdAt!).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MaterialsAnalytics;

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
    gap: 6,
    flexWrap: 'wrap',
  },
  breadcrumbText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  breadcrumbTextActive: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '600',
  },
  totalCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  totalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  totalInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 4,
  },
  totalSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  materialsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  materialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  materialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  materialIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  materialQuantity: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  materialCostContainer: {
    alignItems: 'flex-end',
  },
  materialCost: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 2,
  },
  materialCostLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  specsContainer: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  specsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  specRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  specKey: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginRight: 8,
    textTransform: 'capitalize',
  },
  specValue: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '500',
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 11,
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
