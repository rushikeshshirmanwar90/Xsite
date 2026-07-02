// Other Cost Analytics Page
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

interface OtherCostDetail {
  _id: string;
  title: string;
  description?: string;
  amount: number;
  addedByName?: string;
  date?: string;
}

const OtherCostAnalytics: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectName = params.projectName as string;
  const sectionName = params.sectionName as string;
  const otherCostsData = params.otherCosts as string;

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const colors = PieChartColors20;

  const [details, setDetails] = useState<OtherCostDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOtherCostDetails();
  }, [otherCostsData]);

  const loadOtherCostDetails = () => {
    try {
      setLoading(true);

      const parsed: OtherCostDetail[] = otherCostsData
        ? JSON.parse(Array.isArray(otherCostsData) ? otherCostsData[0] : otherCostsData)
        : [];

      // Keep only entries with a positive amount
      const cleaned = parsed.filter((entry) => (entry.amount ?? 0) > 0);

      setDetails(cleaned);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error loading other cost details:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalExpense = details.reduce((sum, entry) => sum + (entry.amount || 0), 0);

  // Sort by amount (highest first) for the chart
  const sorted = [...details].sort((a, b) => b.amount - a.amount);

  const pieData = sorted.map((entry, index) => ({
    key: entry._id,
    value: entry.amount,
    svg: {
      fill: colors[index % colors.length].primary,
      gradientId: `gradient_oc_${entry._id}`,
    },
    name: entry.title,
    formattedBudget: formatCurrency(entry.amount),
    percentage: totalExpense > 0 ? ((entry.amount / totalExpense) * 100).toFixed(1) : '0',
    description: entry.description || '',
  }));

  const legendData: LegendItem[] = pieData.map((item, index) => ({
    key: item.key,
    name: item.name,
    value: item.formattedBudget,
    percentage: item.percentage,
    color: colors[index % colors.length].primary,
    description: item.description,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#3A78B5" />
            </TouchableOpacity>
            <View style={styles.projectInfo}>
              <Text style={styles.projectName}>Other Costs</Text>
              <Text style={styles.projectSubtitle}>Other Cost Breakdown</Text>
            </View>
          </View>
        </View>

        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbText}>{projectName}</Text>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          <Text style={styles.breadcrumbText}>{sectionName}</Text>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          <Text style={styles.breadcrumbText}>Other Costs</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3A78B5" />
            <Text style={styles.loadingText}>Loading other cost details...</Text>
          </View>
        ) : details.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Other Costs Found</Text>
            <Text style={styles.emptySubtitle}>
              No other cost entries were recorded for this section.
            </Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Total Expense Card */}
            <View style={styles.totalCard}>
              <View style={styles.totalIconContainer}>
                <Ionicons name="receipt" size={32} color="#3A78B5" />
              </View>
              <View style={styles.totalInfo}>
                <Text style={styles.totalLabel}>TOTAL OTHER COSTS</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalExpense)}</Text>
                <Text style={styles.totalSubtext}>
                  {details.length} {details.length === 1 ? 'entry' : 'entries'}
                </Text>
              </View>
            </View>

            {/* Pie Chart */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeading}>
                <Text style={styles.chartTitle}>Other Cost Distribution</Text>
                <Text style={styles.chartSubtitle}>Sorted by highest cost</Text>
              </View>

              <View style={styles.chartContainer}>
                <PieChart
                  data={pieData}
                  colors={colors}
                  size={260}
                  enableAnimation={true}
                  enableHover={true}
                  labelType="amount"
                  centerContent={{
                    label: 'TOTAL',
                    value: formatCurrency(totalExpense),
                    subtitle: `${details.length} Item${details.length > 1 ? 's' : ''}`,
                  }}
                />
              </View>

              <PieChartLegend
                items={legendData}
                showPercentage={true}
                showDescription={true}
                layout="vertical"
              />
            </View>

            <Text style={styles.sectionTitle}>Other Cost Breakdown</Text>

            {/* Detail Cards */}
            {sorted.map((entry) => (
              <View key={entry._id} style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="cash-outline" size={24} color="#3A78B5" />
                  </View>
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailTitle} numberOfLines={1}>{entry.title}</Text>
                    {!!entry.addedByName && (
                      <Text style={styles.detailSubtitle}>Added by {entry.addedByName}</Text>
                    )}
                  </View>
                  <Text style={styles.detailCost}>{formatCurrency(entry.amount)}</Text>
                </View>

                {!!entry.description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionText}>{entry.description}</Text>
                  </View>
                )}

                {!!entry.date && (
                  <View style={styles.detailFooter}>
                    <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
                    <Text style={styles.dateText}>
                      Added: {new Date(entry.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
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

export default OtherCostAnalytics;

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
    marginRight: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  projectSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  breadcrumbText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  totalCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  totalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  totalInfo: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3A78B5',
    marginBottom: 4,
  },
  totalSubtext: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  chartHeading: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailInfo: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  detailSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  detailCost: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3A78B5',
    marginLeft: 8,
  },
  descriptionContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  descriptionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  detailFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dateText: {
    fontSize: 12,
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
