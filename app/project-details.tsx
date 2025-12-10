import BarChart from '@/components/BarChart';
import { mockBuildingSections, mockProjects } from '@/data/analytics';
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

export default function ProjectDetails() {
  const { id } = useLocalSearchParams();
  const project = mockProjects.find(p => p.id === id);
  const buildingSections = mockBuildingSections.filter(section => section.projectId === id);

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Project not found</Text>
      </View>
    );
  }

  const barChartData = buildingSections.map(section => ({
    id: section.id,
    label: section.name,
    value: section.budgetUsed,
    maxValue: section.budgetAllocated,
    color: section.color,
    status: section.status,
  }));

  const handleSectionPress = (sectionId: string) => {
    const section = buildingSections.find(s => s.id === sectionId);
    if (section) {
      router.push({
        pathname: '/details',
        params: {
          projectId: project.id,
          sectionId: section.id,
          sectionName: section.name
        }
      });
    }
  };

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
            <Text style={styles.projectName}>{project.name}</Text>
            <Text style={styles.projectStatus}>
              Status: {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Project Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                ${(project.totalBudget / 1000000).toFixed(1)}M
              </Text>
              <Text style={styles.statLabel}>Total Budget</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                ${(project.budgetUsed / 1000000).toFixed(1)}M
              </Text>
              <Text style={styles.statLabel}>Budget Used</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{project.progress}%</Text>
              <Text style={styles.statLabel}>Progress</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
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
        </View>

        {/* Building Sections Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Budget by Building Section</Text>
          <BarChart
            data={barChartData}
            onBarPress={handleSectionPress}
            title="Building Sections Budget Analysis"
          />
        </View>

        {/* Building Sections List */}
        <View style={styles.sectionsSection}>
          <Text style={styles.sectionTitle}>Building Sections Details</Text>
          {buildingSections.map((section) => (
            <TouchableOpacity
              key={section.id}
              style={styles.sectionCard}
              onPress={() => handleSectionPress(section.id)}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionInfo}>
                  <Text style={styles.sectionName}>{section.name}</Text>
                  <Text style={styles.sectionStatus}>
                    {section.status.charAt(0).toUpperCase() + section.status.slice(1)}
                  </Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: section.color }]} />
              </View>

              <View style={styles.sectionStats}>
                <View style={styles.sectionStat}>
                  <Text style={styles.sectionStatValue}>
                    ${(section.budgetUsed / 1000).toFixed(0)}k
                  </Text>
                  <Text style={styles.sectionStatLabel}>Used</Text>
                </View>
                <View style={styles.sectionStat}>
                  <Text style={styles.sectionStatValue}>
                    ${(section.budgetAllocated / 1000).toFixed(0)}k
                  </Text>
                  <Text style={styles.sectionStatLabel}>Allocated</Text>
                </View>
                <View style={styles.sectionStat}>
                  <Text style={styles.sectionStatValue}>{section.progress}%</Text>
                  <Text style={styles.sectionStatLabel}>Progress</Text>
                </View>
              </View>

              <View style={styles.sectionProgress}>
                <Text style={styles.sectionProgressText}>
                  {section.daysCompleted}/{section.daysRequired} days
                </Text>
                <View style={styles.sectionProgressBarContainer}>
                  <View
                    style={[
                      styles.sectionProgressBar,
                      {
                        width: `${section.progress}%`,
                        backgroundColor: section.color,
                      },
                    ]}
                  />
                </View>
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
  projectName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  projectStatus: {
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
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  chartSection: {
    padding: 20,
    backgroundColor: '#16213e',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a3f5f',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  sectionStatus: {
    fontSize: 12,
    color: '#ccc',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sectionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionStat: {
    alignItems: 'center',
  },
  sectionStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 2,
  },
  sectionStatLabel: {
    fontSize: 11,
    color: '#ccc',
  },
  sectionProgress: {
    marginTop: 8,
  },
  sectionProgressText: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 4,
  },
  sectionProgressBarContainer: {
    height: 4,
    backgroundColor: '#2a3f5f',
    borderRadius: 2,
    overflow: 'hidden',
  },
  sectionProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  errorText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 50,
  },
});
