import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Sample project data with construction materials
const projectData = [
  {
    id: 1,
    name: "Manthan Tower A",
    status: "active",
    progress: 98,
    budget: 66300000,
    spent: 66300000,
    endDate: "2025-06-30",
    priority: "high",
    materials: {
      concrete: 850,
      steel: 120,
      brick: 300,
      cement: 200,
      sand: 150
    }
  },
  {
    id: 2,
    name: "Skyline Apartments B",
    status: "active",
    progress: 45,
    budget: 120000000,
    spent: 54000000,
    endDate: "2025-12-15",
    priority: "medium",
    materials: {
      concrete: 600,
      steel: 80,
      brick: 250,
      cement: 150,
      sand: 100
    }
  },
  {
    id: 3,
    name: "Metro Plaza Complex",
    status: "planning",
    progress: 15,
    budget: 95000000,
    spent: 14250000,
    endDate: "2026-08-01",
    priority: "low",
    materials: {
      concrete: 200,
      steel: 30,
      brick: 80,
      cement: 50,
      sand: 40
    }
  },
  {
    id: 4,
    name: "Green Valley Villas",
    status: "active",
    progress: 92,
    budget: 75000000,
    spent: 69000000,
    endDate: "2024-11-30",
    priority: "high",
    materials: {
      concrete: 750,
      steel: 100,
      brick: 280,
      cement: 180,
      sand: 130
    }
  },
  {
    id: 5,
    name: "Heritage Residency",
    status: "completed",
    progress: 100,
    budget: 65000000,
    spent: 63500000,
    endDate: "2024-08-01",
    priority: "medium",
    materials: {
      concrete: 700,
      steel: 95,
      brick: 260,
      cement: 170,
      sand: 120
    }
  },
  {
    id: 6,
    name: "Tech Park Phase 1",
    status: "planning",
    progress: 5,
    budget: 150000000,
    spent: 7500000,
    endDate: "2026-12-01",
    priority: "medium",
    materials: {
      concrete: 100,
      steel: 15,
      brick: 40,
      cement: 25,
      sand: 20
    }
  }
];

// Simple icon components using Text
const TrendingUpIcon = ({ color = "#0EA5E9", size = 20 }: { color?: string; size?: number }) => (
  <Text style={{ color, fontSize: size, fontWeight: 'bold' }}>📈</Text>
);

const ClockIcon = ({ color = "#F59E0B", size = 20 }: { color?: string; size?: number }) => (
  <Text style={{ color, fontSize: size }}>🕒</Text>
);

const CheckCircleIcon = ({ color = "#10B981", size = 20 }: { color?: string; size?: number }) => (
  <Text style={{ color, fontSize: size }}>✅</Text>
);

const AlertTriangleIcon = ({ color = "#EF4444", size = 20 }: { color?: string; size?: number }) => (
  <Text style={{ color, fontSize: size }}>⚠️</Text>
);



const DownloadIcon = ({ color = "#0EA5E9", size = 20 }: { color?: string; size?: number }) => (
  <Text style={{ color, fontSize: size }}>📥</Text>
);

interface Project {
  id: number;
  name: string;
  status: string;
  progress: number;
  budget: number;
  spent: number;
  endDate: string;
  priority: string;
  materials: {
    concrete: number;
    steel: number;
    brick: number;
    cement: number;
    sand: number;
  };
}

const Dashboard = () => {
  const [selectedChart, setSelectedChart] = useState<'status' | 'materials'>('status');

  // Calculate stats
  const stats = useMemo(() => {
    const total = projectData.length;
    const ongoing = projectData.filter(p => p.status === 'active').length;
    const completed = projectData.filter(p => p.status === 'completed').length;
    const upcoming = projectData.filter(p => p.status === 'planning').length;
    
    // Check for delayed projects (projects ending within 30 days with <80% progress)
    const today = new Date();
    const delayed = projectData.filter(p => {
      const endDate = new Date(p.endDate);
      const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      return daysRemaining < 30 && p.progress < 80 && p.status === 'active';
    }).length;

    const totalBudget = projectData.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = projectData.reduce((sum, p) => sum + p.spent, 0);

    return {
      total,
      ongoing,
      completed,
      upcoming,
      delayed,
      totalBudget,
      totalSpent,
      budgetUtilization: ((totalSpent / totalBudget) * 100).toFixed(1)
    };
  }, []);

  // Calculate total materials used across all projects
  const materialStats = useMemo(() => {
    const totals = projectData.reduce((acc, project) => {
      acc.concrete += project.materials.concrete;
      acc.steel += project.materials.steel;
      acc.brick += project.materials.brick;
      acc.cement += project.materials.cement;
      acc.sand += project.materials.sand;
      return acc;
    }, { concrete: 0, steel: 0, brick: 0, cement: 0, sand: 0 });

    return [
      { name: 'Concrete', value: totals.concrete, color: '#EF4444', unit: 'tons' },
      { name: 'Steel', value: totals.steel, color: '#3B82F6', unit: 'tons' },
      { name: 'Brick', value: totals.brick, color: '#F59E0B', unit: 'thousands' },
      { name: 'Cement', value: totals.cement, color: '#10B981', unit: 'tons' },
      { name: 'Sand', value: totals.sand, color: '#8B5CF6', unit: 'tons' }
    ];
  }, []);

  // Pie chart data for project status
  const statusPieData = [
    { name: 'Ongoing', value: stats.ongoing, color: '#10B981' },
    { name: 'Completed', value: stats.completed, color: '#3B82F6' },
    { name: 'Upcoming', value: stats.upcoming, color: '#F59E0B' }
  ];

  // Budget utilization pie chart data
  const budgetPieData = [
    { name: 'Used', value: parseInt(stats.budgetUtilization), color: '#EF4444' },
    { name: 'Remaining', value: 100 - parseInt(stats.budgetUtilization), color: '#E5E7EB' }
  ];

  // Get top performing project
  const topProject = useMemo(() => {
    return projectData
      .filter(p => p.status === 'active')
      .sort((a, b) => b.progress - a.progress)[0];
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric'
    });
  };

  // Check if project is delayed
  const isDelayed = (endDate: string, progress: number) => {
    const today = new Date();
    const projectEndDate = new Date(endDate);
    const daysRemaining = Math.ceil((projectEndDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysRemaining < 30 && progress < 80;
  };

  // Download report function
  const downloadReport = () => {
    Alert.alert(
      "Download Report",
      "Report generation initiated. The report will be available in your downloads shortly.",
      [{ text: "OK", style: "default" }]
    );
  };

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = "#0EA5E9",
  }: {
    icon: React.ComponentType<{ color?: string; size?: number }>;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
  }) => (
    <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 4 }]}>
      <View style={styles.statCardHeader}>
        <Icon color={color} size={20} />
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const PieChartComponent = ({
    data,
    title,
    centerText,
  }: {
    data: { value: number; color: string; name: string; unit?: string }[];
    title: string;
    centerText?: string;
  }) => (
    <View style={styles.pieChartContainer}>
      <Text style={styles.pieChartTitle}>{title}</Text>
      <View style={styles.pieChartWrapper}>
        <Svg width="140" height="140" viewBox="0 0 140 140">
          {data.map((item, index) => {
            const total = data.reduce((sum, d) => sum + d.value, 0);
            if (total === 0) return null;

            const percentage = (item.value / total) * 100;
            const angle = (percentage / 100) * 360;
            const radius = 60;
            const centerX = 70;
            const centerY = 70;

            let cumulativeAngle = 0;
            for (let i = 0; i < index; i++) {
              cumulativeAngle += (data[i].value / total) * 360;
            }

            const startAngle = cumulativeAngle - 90;
            const endAngle = startAngle + angle;

            const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
            const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
            const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
            const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

            const largeArcFlag = angle > 180 ? 1 : 0;

            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              "Z",
            ].join(" ");

            return (
              <Path
                key={index}
                d={pathData}
                fill={item.color}
                stroke="white"
                strokeWidth="2"
              />
            );
          })}
        </Svg>
        {centerText && (
          <View style={styles.pieChartCenter}>
            <Text style={styles.pieChartCenterText}>{centerText}</Text>
          </View>
        )}
      </View>
      <View style={styles.pieChartLegend}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: item.color }]}
            />
            <Text style={styles.legendText}>
              {item.name} ({item.value}{item.unit ? ` ${item.unit}` : title.includes("Budget") ? "%" : ""})
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const ProgressBar = ({
    project,
  }: {
    project: Project;
  }) => {
    const isProjectDelayed = isDelayed(project.endDate, project.progress);
    const progressColor = isProjectDelayed ? "#EF4444" : "#10B981";

    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarHeader}>
          <Text style={styles.progressBarTitle} numberOfLines={1}>
            {project.name}
          </Text>
          <Text style={[styles.progressBarPercent, { color: progressColor }]}>
            {project.progress}%
          </Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${project.progress}%`,
                backgroundColor: progressColor,
              },
            ]}
          />
        </View>
      </View>
    );
  };

  const TimelineItem = ({
    project,
    isLast = false
  }: {
    project: Project;
    isLast?: boolean;
  }) => {
    const isProjectDelayed = isDelayed(project.endDate, project.progress);

    return (
      <View style={[styles.timelineItem, isLast && styles.timelineItemLast]}>
        <Text style={styles.timelineTitle} numberOfLines={1}>
          {project.name}
        </Text>
        <View style={styles.timelineRight}>
          <Text style={styles.timelineDate}>
            Completion: {formatDate(project.endDate)}
          </Text>
          {project.status === "completed" ? (
            <CheckCircleIcon color="#10B981" size={16} />
          ) : isProjectDelayed ? (
            <AlertTriangleIcon color="#EF4444" size={16} />
          ) : (
            <ClockIcon color="#F59E0B" size={16} />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics Dashboard</Text>
          <TouchableOpacity style={styles.downloadButton} onPress={downloadReport}>
            <DownloadIcon color="#0EA5E9" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Stats Cards */}
          <View style={styles.statsGrid}>
            <StatCard
              icon={TrendingUpIcon}
              title="Total Projects"
              value={stats.total}
              color="#0EA5E9"
            />
            <StatCard
              icon={ClockIcon}
              title="Ongoing"
              value={stats.ongoing}
              color="#10B981"
            />
            <StatCard
              icon={CheckCircleIcon}
              title="Completed"
              value={stats.completed}
              color="#3B82F6"
            />
            <StatCard
              icon={AlertTriangleIcon}
              title="Delayed"
              value={stats.delayed}
              color="#EF4444"
            />
          </View>

          {/* Chart Toggle Buttons */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                selectedChart === 'status' && styles.toggleButtonActive
              ]}
              onPress={() => setSelectedChart('status')}
            >
              <Text style={[
                styles.toggleButtonText,
                selectedChart === 'status' && styles.toggleButtonTextActive
              ]}>
                Project Status
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                selectedChart === 'materials' && styles.toggleButtonActive
              ]}
              onPress={() => setSelectedChart('materials')}
            >
              <Text style={[
                styles.toggleButtonText,
                selectedChart === 'materials' && styles.toggleButtonTextActive
              ]}>
                Materials Used
              </Text>
            </TouchableOpacity>
          </View>

          {/* Charts Section */}
          <View style={styles.chartsSection}>
            {selectedChart === 'status' ? (
              <>
                <PieChartComponent
                  data={statusPieData}
                  title="Project Status Distribution"
                />
                <PieChartComponent
                  data={budgetPieData}
                  title="Budget Utilization"
                  centerText={`${stats.budgetUtilization}%`}
                />
              </>
            ) : (
              <PieChartComponent
                data={materialStats}
                title="Construction Materials Overview"
              />
            )}
          </View>

          {/* Top Performing Project */}
          {topProject && (
            <View style={styles.topProjectCard}>
              <View style={styles.topProjectHeader}>
                <TrendingUpIcon color="#10B981" size={20} />
                <Text style={styles.topProjectLabel}>Top Performing Project</Text>
              </View>
              <Text style={styles.topProjectName}>{topProject.name}</Text>
              <Text style={styles.topProjectProgress}>{topProject.progress}% Complete</Text>
            </View>
          )}

          {/* Progress Bars */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Project Progress Overview</Text>
            {projectData
              .filter(p => p.status !== 'completed')
              .sort((a, b) => b.progress - a.progress)
              .map((project) => (
                <ProgressBar key={project.id} project={project} />
              ))}
          </View>

          {/* Timeline */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Project Timeline</Text>
            <View>
              {projectData
                .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
                .map((project, index, array) => (
                  <TimelineItem 
                    key={project.id} 
                    project={project} 
                    isLast={index === array.length - 1}
                  />
                ))}
            </View>
          </View>

          {/* Budget Summary */}
          <View style={styles.budgetSection}>
            <View style={styles.budgetCard}>
              <Text style={styles.budgetLabel}>Total Budget</Text>
              <Text style={styles.budgetValueGreen}>{formatCurrency(stats.totalBudget)}</Text>
            </View>
            <View style={styles.budgetCard}>
              <Text style={styles.budgetLabel}>Total Spent</Text>
              <Text style={styles.budgetValueRed}>{formatCurrency(stats.totalSpent)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    marginTop: StatusBar.currentHeight || 0,
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  downloadButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  content: {
    padding: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    width: (width - 72) / 2,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  toggleButtonTextActive: {
    color: '#1F2937',
    fontWeight: '600',
  },
  chartsSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  pieChartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  pieChartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  pieChartWrapper: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  pieChartCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieChartCenterText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  pieChartLegend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  topProjectCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  topProjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  topProjectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  topProjectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  topProjectProgress: {
    fontSize: 16,
    color: '#6B7280',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBarTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  progressBarPercent: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  timelineItemLast: {
    borderBottomWidth: 0,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  timelineRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 16,
  },
  timelineDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  budgetSection: {
    flexDirection: 'row',
    gap: 16,
  },
  budgetCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  budgetLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  budgetValueGreen: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  budgetValueRed: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
  },
});

export default Dashboard;