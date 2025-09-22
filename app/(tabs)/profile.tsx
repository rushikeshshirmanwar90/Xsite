import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  useColorScheme,
  Animated,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface CompanyInfo {
  name: string;
  owner: string;
  founded: string;
  website: string;
  phone: string;
  email: string;
  // specializations: string[];
  branchOffices: BranchOffice[];
}

interface BranchOffice {
  city: string;
  manager: string;
  phone: string;
  projectsCount: number;
  establishedYear: string;
}

interface ProjectStats {
  ongoingProjects: number;
  completedProjects: number;
  totalStaff: number;
  totalRevenue: number;
  clientSatisfaction: number;
  safetyRecord: number;
}

const Profile: React.FC = () => {
  const scheme = useColorScheme();
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const isDark = scheme === 'dark';
  const colors = {
    background: isDark ? '#000000' : '#F8F9FA',
    surface: isDark ? '#1C1C1E' : '#F1F3F5',
    card: isDark ? '#2C2C2E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#8E8E93' : '#6B7280',
    border: isDark ? '#38383A' : '#E5E7EB',
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    accent: '#8B5CF6',
    shadow: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.08)',
    shadowMedium: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.12)',
  };

  const companyInfo = useMemo<CompanyInfo>(
    () => ({
      name: 'Sharda Constructions',
      owner: 'Rakesh Sharma',
      founded: '1995',
      website: 'shardaconstructions.com',
      phone: '+91 98765 43210',
      email: 'rakesh@shardaconstructions.com',
      // specializations: ['Residential', 'Commercial', 'Industrial', 'Smart Cities'],
      branchOffices: [
        {
          city: 'Pune',
          manager: 'Anil Patil',
          phone: '+91 98765 43211',
          projectsCount: 12,
          establishedYear: '2010',
        },
        {
          city: 'Mumbai',
          manager: 'Priya Mehta',
          phone: '+91 99887 76655',
          projectsCount: 8,
          establishedYear: '2015',
        },
        {
          city: 'Nashik',
          manager: 'Suresh Joshi',
          phone: '+91 97654 32109',
          projectsCount: 6,
          establishedYear: '2018',
        },
      ],
    }),
    []
  );

  const projectStats = useMemo<ProjectStats>(
    () => ({
      ongoingProjects: 15,
      completedProjects: 52,
      totalStaff: 120,
      totalRevenue: 450000000,
      clientSatisfaction: 4.8,
      safetyRecord: 99.2,
    }),
    []
  );

  const formatCurrency = useCallback(
    (amount: number) => `₹${(amount / 10000000).toFixed(1)}Cr`,
    []
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const MetricCard: React.FC<{ 
    icon: keyof typeof Ionicons.glyphMap; 
    value: string; 
    label: string;
    color?: string;
    trend?: string;
  }> = ({ icon, value, label, color = colors.primary, trend }) => (
    <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.metricIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={20} color="white" />
      </View>
      <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
      {trend && (
        <Text style={[styles.metricTrend, { color: colors.success }]}>{trend}</Text>
      )}
    </View>
  );

  const BranchCard: React.FC<{ branch: BranchOffice }> = ({ branch }) => (
    <TouchableOpacity 
      style={[styles.branchCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => Linking.openURL(`tel:${branch.phone}`)}
      activeOpacity={0.7}
    >
      <View style={styles.branchHeader}>
        <View style={[styles.branchIcon, { backgroundColor: colors.primary }]}>
          <Ionicons name="location" size={16} color="white" />
        </View>
        <View style={styles.branchInfo}>
          <Text style={[styles.branchCity, { color: colors.text }]}>{branch.city}</Text>
          <Text style={[styles.branchManager, { color: colors.textSecondary }]}>{branch.manager}</Text>
        </View>
        <View style={styles.branchMeta}>
          <View style={[styles.projectBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.projectBadgeText}>{branch.projectsCount}</Text>
          </View>
          <Ionicons name="call" size={16} color={colors.textSecondary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={colors.background} 
      />
      
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {companyInfo.owner.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.ownerName, { color: colors.text }]}>{companyInfo.owner}</Text>
              <Text style={[styles.companyName, { color: colors.textSecondary }]}>{companyInfo.name}</Text>
              <Text style={[styles.founded, { color: colors.textSecondary }]}>Since {companyInfo.founded}</Text>
            </View>
          </View>

          {/* Key Metrics */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricsRow}>
              <MetricCard 
                icon="business" 
                value={projectStats.ongoingProjects.toString()} 
                label="Active Projects"
                color={colors.success}
                trend="+3 this month"
              />
              <MetricCard 
                icon="checkmark-circle" 
                value={projectStats.completedProjects.toString()} 
                label="Completed"
                color={colors.primary}
              />
            </View>
            <View style={styles.metricsRow}>
              <MetricCard 
                icon="people" 
                value={projectStats.totalStaff.toString()} 
                label="Team Size"
                color={colors.accent}
              />
              <MetricCard 
                icon="trending-up" 
                value={formatCurrency(projectStats.totalRevenue)} 
                label="Total Revenue"
                color={colors.warning}
              />
            </View>
          </View>

          {/* Performance Indicators */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Performance</Text>
            <View style={styles.performanceGrid}>
              <View style={styles.performanceItem}>
                <View style={styles.performanceHeader}>
                  <Ionicons name="star" size={18} color={colors.warning} />
                  <Text style={[styles.performanceValue, { color: colors.text }]}>{projectStats.clientSatisfaction}</Text>
                </View>
                <Text style={[styles.performanceLabel, { color: colors.textSecondary }]}>Client Rating</Text>
              </View>
              <View style={styles.performanceItem}>
                <View style={styles.performanceHeader}>
                  <Ionicons name="shield-checkmark" size={18} color={colors.success} />
                  <Text style={[styles.performanceValue, { color: colors.text }]}>{projectStats.safetyRecord}%</Text>
                </View>
                <Text style={[styles.performanceLabel, { color: colors.textSecondary }]}>Safety Record</Text>
              </View>
            </View>
          </View>

          {/* Contact Information */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact</Text>
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => Linking.openURL(`tel:${companyInfo.phone}`)}
            >
              <Ionicons name="call" size={18} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.text }]}>{companyInfo.phone}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => Linking.openURL(`mailto:${companyInfo.email}`)}
            >
              <Ionicons name="mail" size={18} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.text }]}>{companyInfo.email}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => Linking.openURL(`https://${companyInfo.website}`)}
            >
              <Ionicons name="globe" size={18} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.text }]}>{companyInfo.website}</Text>
            </TouchableOpacity>
          </View>

          {/* Specializations */}
          {/* <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Specializations</Text>
            <View style={styles.specializationGrid}>
              {companyInfo.specializations.map((spec, index) => (
                <View 
                  key={index} 
                  style={[styles.specializationTag, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Text style={[styles.specializationText, { color: colors.text }]}>{spec}</Text>
                </View>
              ))}
            </View>/
          </View> */}

          {/* Branch Offices */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Branch Offices ({companyInfo.branchOffices.length})
            </Text>
            <View style={styles.branchesContainer}>
              {companyInfo.branchOffices.map((branch, index) => (
                <BranchCard key={index} branch={branch} />
              ))}
            </View>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '600',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    marginBottom: 2,
  },
  founded: {
    fontSize: 14,
  },
  metricsContainer: {
    marginBottom: 24,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    width: (width - 56) / 2,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
    textAlign: 'center',
  },
  metricTrend: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  performanceValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  performanceLabel: {
    fontSize: 13,
    textAlign: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  contactText: {
    fontSize: 16,
  },
  // specializationGrid: {
  //   flexDirection: 'row',
  //   flexWrap: 'wrap',
  //   gap: 8,
  // },
  // specializationTag: {
  //   paddingHorizontal: 16,
  //   paddingVertical: 8,
  //   borderRadius: 20,
  //   shadowColor: '#000',
  //   shadowOffset: {
  //     width: 0,
  //     height: 1,
  //   },
  //   shadowOpacity: 0.04,
  //   shadowRadius: 2,
  //   elevation: 1,
  // },
  // specializationText: {
  //   fontSize: 14,
  //   fontWeight: '500',
  // },
  branchesContainer: {
    gap: 12,
  },
  branchCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  branchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  branchIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  branchInfo: {
    flex: 1,
  },
  branchCity: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  branchManager: {
    fontSize: 14,
  },
  branchMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  projectBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
});

export default Profile;