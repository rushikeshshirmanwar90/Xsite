import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import PieChart from '@/components/PieChart';
import { mockProjects } from '@/data/analytics';

export default function AnalyticsOverview() {
  const totalBudget = mockProjects.reduce((sum: number, project: { totalBudget: number }) => sum + project.totalBudget, 0);
  const totalUsed = mockProjects.reduce((sum, project) => sum + project.budgetUsed, 0);
  const pieChartData = mockProjects.map(project => ({
    id: project.id,
    value: project.budgetUsed,
    color: project.color,
    label: project.name,
  }));

  const handleProjectPress = (projectId: string) => {
    const project = mockProjects.find(p => p.id === projectId);
    if (project) {
      router.push({
        pathname: '/analysis/[id]',
        params: { id: project.id }
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Stats */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Portfolio Overview</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>${(totalBudget / 1000000).toFixed(1)}M</Text>
              <Text style={styles.statLabel}>Total Budget</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>${(totalUsed / 1000000).toFixed(1)}M</Text>
              <Text style={styles.statLabel}>Budget Used</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{mockProjects.length}</Text>
              <Text style={styles.statLabel}>Active Projects</Text>
            </View>
          </View>
        </View>

        {/* Main Pie Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Budget Utilization by Project</Text>
          <PieChart
            data={pieChartData}
            onSegmentPress={handleProjectPress}
            centerValue={`$${(totalUsed / 1000000).toFixed(1)}M`}
            centerText="Total Used"
          />
        </View>

        {/* Project Cards */}
        <View style={styles.projectsSection}>
          <Text style={styles.sectionTitle}>Project Details</Text>
          {mockProjects.map((project) => (
            <TouchableOpacity
              key={project.id}
              style={styles.projectCard}
              onPress={() => handleProjectPress(project.id)}
            >
              <View style={styles.projectHeader}>
                <View style={styles.projectInfo}>
                  <Text style={styles.projectName}>{project.name}</Text>
                  <Text style={styles.projectStatus}>
                    Status: {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: project.color }]} />
              </View>
              
              <View style={styles.projectStats}>
                <View style={styles.projectStat}>
                  <Text style={styles.projectStatValue}>
                    ${(project.budgetUsed / 1000).toFixed(0)}k
                  </Text>
                  <Text style={styles.projectStatLabel}>Used</Text>
                </View>
                <View style={styles.projectStat}>
                  <Text style={styles.projectStatValue}>
                    ${(project.totalBudget / 1000).toFixed(0)}k
                  </Text>
                  <Text style={styles.projectStatLabel}>Total</Text>
                </View>
                <View style={styles.projectStat}>
                  <Text style={styles.projectStatValue}>{project.progress}%</Text>
                  <Text style={styles.projectStatLabel}>Progress</Text>
                </View>
              </View>
              
              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${project.progress}%`,
                      backgroundColor: project.color,
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>
          ))}
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
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
  },
  chartSection: {
    padding: 20,
    backgroundColor: '#16213e',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  projectsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  projectCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a3f5f',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  projectStatus: {
    fontSize: 14,
    color: '#ccc',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  projectStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  projectStat: {
    alignItems: 'center',
  },
  projectStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 2,
  },
  projectStatLabel: {
    fontSize: 12,
    color: '#ccc',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#2a3f5f',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
});
