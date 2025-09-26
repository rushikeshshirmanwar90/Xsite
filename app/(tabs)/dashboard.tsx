import PieChart, { PieChartColors20 } from '@/components/PieChart';
import PieChartLegend, { LegendItem } from '@/components/PieChartLegend';
import { projectData } from '@/data/analytics';
import { formatCurrency, transformProjectDataToPieSlices } from '@/utils/analytics';
import { useRouter } from 'expo-router';

import React from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AnalyticsDashboard: React.FC = () => {
  const router = useRouter();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const colors = PieChartColors20;

  // Transform project data using utility function
  const pieData = transformProjectDataToPieSlices(projectData, colors);

  // Calculate total budget
  const totalBudget = projectData.reduce((sum, project) => sum + project.budgetUsed, 0);

  // Prepare legend data
  const legendData: LegendItem[] = pieData.map((item, index) => ({
    key: item.key,
    name: item.name,
    value: item.formattedBudget,
    percentage: item.percentage,
    color: colors[index % colors.length].primary,
    description: item.description,
  }));

  // Handle slice/legend press
  const handlePress = (projectId: string, projectName: string) => {
    const payload = JSON.stringify({ projectId, projectName });
    router.push({ pathname: '/project_details/[data]', params: { 'data': payload } })
  };

  // Initialize fade animation
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SafeAreaView>


        {/* Main Header - Fixed */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.projectInfo}>
              <Text style={styles.projectName}>Analysis Dashboard</Text>
            </View>
          </View>
        </View>



        {/* Enhanced Stats Section */}
        <View style={styles.statsSection}>
          <View style={[styles.statBox, styles.statBoxPrimary]}>
            <Text style={styles.statValue}>{projectData.length}</Text>
            <Text style={styles.statLabel}>Ongoing Projects</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxSecondary]}>
            <Text style={styles.statValue}>2</Text>
            <Text style={styles.statLabel}>Completed Project</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxTertiary]}>
            <Text style={styles.statValue}>5
            </Text>
            <Text style={styles.statLabel}>Total Project</Text>
          </View>
        </View>

        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
          <View style={styles.heading}>
            <Text style={styles.title}>Ongoing Projects</Text>
            <Text style={styles.subtitle}>Financial Overview</Text>
          </View>

          {/* Optimized Pie Chart Component */}
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
                label: 'OVERALL BUDGET',
                value: formatCurrency(totalBudget),
                subtitle: `${projectData.length} Projects`
              }}
            />
          </View>

          {/* Optimized Legend Component */}
          <PieChartLegend
            items={legendData}
            onItemClick={handlePress}
            showPercentage={true}
            showDescription={true}
            layout="vertical"
          />
        </Animated.View>


      </SafeAreaView>
    </ScrollView>
  );
};

export default AnalyticsDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F3F7',
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
    fontWeight: 'condensed',
    color: '#2C3E50',
    letterSpacing: 3,
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
    zIndex: 1000,
    marginBottom: 10
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
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
  chartContainer: {
    alignItems: 'center',
    marginVertical: 2,
    position: 'relative',
  },
  statsSection: {
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    backgroundColor: '#FFFFFF',
    padding: 8,
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
  statIcon: {
    marginBottom: 8,
  },
  statEmoji: {
    fontSize: 24,
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
  insightsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 15,
    elevation: 6,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F7',
  },
  insightLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  insightValue: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '600',
  },
});