import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  useColorScheme,
  Animated,
  RefreshControl,
  Alert,
  Share,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface CompanyInfo {
  name: string;
  owner: string;
  address: string;
  gstNumber: string;
  panNumber: string;
  reraNumber: string;
  website: string;
  phone: string;
  email: string;
  founded: string;
  achievements: Achievement[];
  specializations: string[];
  branchOffices: BranchOffice[];
  socialMedia: SocialMedia;
}

interface Achievement {
  title: string;
  year: string;
  description: string;
  icon: string;
}

interface SocialMedia {
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
}

interface BranchOffice {
  city: string;
  address: string;
  manager: string;
  phone: string;
  projectsCount: number;
  establishedYear: string;
  specialization: string;
}

interface Certification {
  name: string;
  status: 'Active' | 'Pending' | 'Expired';
  validUntil?: string;
  certifyingBody: string;
}

interface ProjectStats {
  ongoingProjects: number;
  completedProjects: number;
  totalStaff: number;
  totalAmountSpent: number;
  clientSatisfaction: number;
  safetyRecord: number;
}

interface ProjectExpense {
  projectName: string;
  amountSpent: number;
  totalBudget: number;
  completion: number;
  status: 'On Track' | 'Delayed' | 'Ahead of Schedule';
}

interface MonthlyExpense {
  month: string;
  amount: number;
  budget: number;
}

const EnhancedBuilderProfile: React.FC = () => {
  const scheme = useColorScheme();
  const [activeTab, setActiveTab] = useState<'company' | 'branches' | 'expenses' | 'performance'>('company');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  }, []);

  const isDark = scheme === 'dark';
  const colors = {
    background: isDark ? '#111827' : '#FFFFFF',
    surface: isDark ? '#1F2937' : '#F9FAFB',
    surfaceElevated: isDark ? '#374151' : '#FFFFFF',
    text: isDark ? '#F9FAFB' : '#111827',
    textSecondary: isDark ? '#D1D5DB' : '#6B7280',
    border: isDark ? '#374151' : '#E5E7EB',
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  };

  // Enhanced static data
  const companyInfo = useMemo<CompanyInfo>(
    () => ({
      name: 'Sharda Constructions Pvt. Ltd.',
      owner: 'Mr. Rakesh Sharma',
      address: 'Plot No. 45, Industrial Area, MIDC, Nagpur, Maharashtra, 440016',
      gstNumber: '27AABCS1234K1Z9',
      panNumber: 'AABCS1234K',
      reraNumber: 'P50500012345',
      website: 'https://shardaconstructions.com',
      phone: '+91 98765 43210',
      email: 'info@shardaconstructions.com',
      founded: '1995',
      achievements: [
        {
          title: 'ISO 9001:2015 Certified',
          year: '2023',
          description: 'Quality Management System Certification',
          icon: 'ribbon',
        },
        {
          title: 'Best Builder Award',
          year: '2023',
          description: 'Maharashtra Construction Excellence Award',
          icon: 'trophy',
        },
        {
          title: 'Green Building Pioneer',
          year: '2022',
          description: 'First LEED Platinum project in region',
          icon: 'leaf',
        },
        {
          title: '50+ Projects Milestone',
          year: '2021',
          description: 'Successfully completed 50+ residential & commercial projects',
          icon: 'business',
        },
      ],
      specializations: ['Residential Complexes', 'Commercial Buildings', 'Industrial Projects', 'Smart Cities', 'Green Buildings'],
      socialMedia: {
        linkedin: 'https://linkedin.com/company/shardaconstructions',
        facebook: 'https://facebook.com/shardaconstructions',
        instagram: 'https://instagram.com/shardaconstructions',
      },
      branchOffices: [
        {
          city: 'Pune',
          address: 'Magarpatta City, Hadapsar, Pune - 411013',
          manager: 'Mr. Anil Patil',
          phone: '+91 98765 43211',
          projectsCount: 12,
          establishedYear: '2010',
          specialization: 'Residential & IT Parks',
        },
        {
          city: 'Mumbai',
          address: 'Bandra Kurla Complex, Mumbai - 400051',
          manager: 'Ms. Priya Mehta',
          phone: '+91 99887 76655',
          projectsCount: 8,
          establishedYear: '2015',
          specialization: 'High-rise Commercial',
        },
        {
          city: 'Nashik',
          address: 'MIDC Area, Ambad, Nashik - 422010',
          manager: 'Mr. Suresh Joshi',
          phone: '+91 97654 32109',
          projectsCount: 6,
          establishedYear: '2018',
          specialization: 'Industrial Projects',
        },
      ],
    }),
    []
  );

  const certifications = useMemo<Certification[]>(
    () => [
      { name: 'ISO 9001:2015', status: 'Active', validUntil: '2026-12-31', certifyingBody: 'Bureau Veritas' },
      { name: 'ISO 14001:2015', status: 'Pending', certifyingBody: 'DNV GL' },
      { name: 'OHSAS 18001', status: 'Expired', validUntil: '2023-06-30', certifyingBody: 'TUV SUD' },
      { name: 'IGBC Green Pro', status: 'Active', validUntil: '2025-08-15', certifyingBody: 'IGBC' },
    ],
    []
  );

  const projectStats = useMemo<ProjectStats>(
    () => ({
      ongoingProjects: 15,
      completedProjects: 52,
      totalStaff: 120,
      totalAmountSpent: 450000000,
      clientSatisfaction: 4.8,
      safetyRecord: 99.2,
    }),
    []
  );

  const monthlyExpenses = useMemo<MonthlyExpense[]>(
    () => [
      { month: 'Apr', amount: 5000000, budget: 5200000 },
      { month: 'May', amount: 7500000, budget: 7000000 },
      { month: 'Jun', amount: 6000000, budget: 6500000 },
      { month: 'Jul', amount: 9000000, budget: 8500000 },
      { month: 'Aug', amount: 8500000, budget: 9000000 },
      { month: 'Sep', amount: 9500000, budget: 9200000 },
    ],
    []
  );

  const projectExpenses = useMemo<ProjectExpense[]>(
    () => [
      { 
        projectName: 'Skyline Residency', 
        amountSpent: 120000000, 
        totalBudget: 150000000, 
        completion: 80,
        status: 'On Track'
      },
      { 
        projectName: 'Sunrise Towers', 
        amountSpent: 80000000, 
        totalBudget: 120000000, 
        completion: 67,
        status: 'Delayed'
      },
      { 
        projectName: 'Industrial Shed Complex', 
        amountSpent: 50000000, 
        totalBudget: 80000000, 
        completion: 75,
        status: 'Ahead of Schedule'
      },
      { 
        projectName: 'Smart City Plaza', 
        amountSpent: 200000000, 
        totalBudget: 280000000, 
        completion: 85,
        status: 'On Track'
      },
    ],
    []
  );

  // Utility functions
  const formatCurrency = useCallback(
    (amount: number) => `₹${(amount / 10000000).toFixed(1)}Cr`,
    []
  );

  const formatCurrencyFull = useCallback(
    (amount: number) => `₹${amount.toLocaleString('en-IN')}`,
    []
  );

  const toggleCardExpansion = useCallback((cardId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const shareProfile = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out ${companyInfo.name} - Leading construction company with 50+ successful projects!\n${companyInfo.website}`,
        title: 'Company Profile',
      });
    } catch (error) {
      console.log(error);
    }
  }, [companyInfo]);

  // Enhanced UI Components
  const AnimatedStatsCard: React.FC<{ 
    icon: keyof typeof Ionicons.glyphMap; 
    label: string; 
    value: string; 
    subtitle?: string;
    color?: string;
    delay?: number;
  }> = ({ icon, label, value, subtitle, color = colors.primary, delay = 0 }) => {
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(animValue, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.statsCard,
          { 
            backgroundColor: colors.surfaceElevated,
            transform: [{
              scale: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              })
            }],
            opacity: animValue,
          }
        ]}
      >
        <LinearGradient 
          colors={[`${color}20`, `${color}10`]} 
          style={styles.statsCardGradient}
        >
          <View style={[styles.statsIconContainer, { backgroundColor: color }]}>
            <Ionicons name={icon} size={24} color="white" />
          </View>
          <Text style={[styles.statsValue, { color: colors.text }]}>{value}</Text>
          <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>{label}</Text>
          {subtitle && (
            <Text style={[styles.statsSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
          )}
        </LinearGradient>
      </Animated.View>
    );
  };

  const EnhancedCertificationBadge: React.FC<{ cert: Certification }> = ({ cert }) => {
    const getStatusColor = () => {
      switch (cert.status) {
        case 'Active': return colors.success;
        case 'Pending': return colors.warning;
        case 'Expired': return colors.error;
      }
    };

    return (
      <TouchableOpacity 
        style={[styles.certBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => Alert.alert(cert.name, `Status: ${cert.status}\nCertifying Body: ${cert.certifyingBody}${cert.validUntil ? `\nValid Until: ${cert.validUntil}` : ''}`)}
        activeOpacity={0.7}
      >
        <Text style={[styles.certText, { color: colors.text }]}>{cert.name}</Text>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
      </TouchableOpacity>
    );
  };

  const EnhancedBranchOfficeCard: React.FC<{ branch: BranchOffice; index: number }> = ({ branch, index }) => {
    const isExpanded = expandedCards.has(`branch-${index}`);
    
    return (
      <Animated.View
        style={[
          styles.branchCard,
          { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          {
            transform: [{
              translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => toggleCardExpansion(`branch-${index}`)}
          activeOpacity={0.7}
        >
          <View style={styles.branchCardHeader}>
            <View style={styles.branchHeaderLeft}>
              <View style={[styles.branchIconContainer, { backgroundColor: colors.primary }]}>
                <Ionicons name="business" size={20} color="white" />
              </View>
              <View>
                <Text style={[styles.branchTitle, { color: colors.text }]}>{branch.city}</Text>
                <Text style={[styles.branchSubtitle, { color: colors.textSecondary }]}>
                  Since {branch.establishedYear}
                </Text>
              </View>
            </View>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={colors.textSecondary} 
            />
          </View>
          
          {isExpanded && (
            <Animated.View style={styles.branchCardContent}>
              <Text style={[styles.branchText, { color: colors.text }]}>
                <Ionicons name="location" size={16} color={colors.primary} /> {branch.address}
              </Text>
              <Text style={[styles.branchText, { color: colors.text }]}>
                <Ionicons name="person" size={16} color={colors.primary} /> Manager: {branch.manager}
              </Text>
              <Text style={[styles.branchText, { color: colors.text }]}>
                <Ionicons name="call" size={16} color={colors.primary} /> {branch.phone}
              </Text>
              <Text style={[styles.branchText, { color: colors.text }]}>
                <Ionicons name="briefcase" size={16} color={colors.primary} /> {branch.projectsCount} Active Projects
              </Text>
              <Text style={[styles.branchText, { color: colors.text }]}>
                <Ionicons name="star" size={16} color={colors.primary} /> {branch.specialization}
              </Text>
              
              <View style={styles.branchActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={() => Linking.openURL(`tel:${branch.phone}`)}
                >
                  <Ionicons name="call" size={16} color="white" />
                  <Text style={styles.actionButtonText}>Call</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const ProjectExpenseChart: React.FC<{ project: ProjectExpense; index: number }> = ({ project, index }) => {
    const progress = (project.amountSpent / project.totalBudget) * 100;
    const getStatusColor = () => {
      switch (project.status) {
        case 'On Track': return colors.success;
        case 'Delayed': return colors.error;
        case 'Ahead of Schedule': return colors.primary;
      }
    };

    return (
      <Animated.View
        style={[
          styles.projectItem,
          { backgroundColor: colors.surfaceElevated, borderColor: colors.border }
        ]}
      >
        <View style={styles.projectHeader}>
          <Text style={[styles.projectName, { color: colors.text }]}>{project.projectName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusBadgeText}>{project.status}</Text>
          </View>
        </View>
        
        <View style={styles.projectMetrics}>
          <Text style={[styles.completionText, { color: colors.textSecondary }]}>
            {project.completion}% Complete
          </Text>
          <Text style={[styles.projectAmount, { color: colors.text }]}>
            {formatCurrency(project.amountSpent)} / {formatCurrency(project.totalBudget)}
          </Text>
        </View>
        
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: getStatusColor(),
                width: `${progress}%` 
              }
            ]} 
          />
        </View>
      </Animated.View>
    );
  };

  const AchievementCard: React.FC<{ achievement: Achievement; index: number }> = ({ achievement, index }) => (
    <Animated.View
      style={[
        styles.achievementCard,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
        {
          transform: [{
            scale: scaleAnim,
          }],
          opacity: fadeAnim,
        }
      ]}
    >
      <View style={[styles.achievementIconContainer, { backgroundColor: colors.primary }]}>
        <Ionicons name={achievement.icon as any} size={24} color="white" />
      </View>
      <View style={styles.achievementContent}>
        <Text style={[styles.achievementTitle, { color: colors.text }]}>{achievement.title}</Text>
        <Text style={[styles.achievementYear, { color: colors.primary }]}>{achievement.year}</Text>
        <Text style={[styles.achievementDescription, { color: colors.textSecondary }]}>
          {achievement.description}
        </Text>
      </View>
    </Animated.View>
  );

  // Contact actions
  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`tel:${companyInfo.phone}`);
  };
  
  const handleMail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`mailto:${companyInfo.email}`);
  };
  
  const handleWeb = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(companyInfo.website);
  };

  const handleSocialMedia = (platform: keyof SocialMedia) => {
    const url = companyInfo.socialMedia[platform];
    if (url) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Linking.openURL(url);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={isDark ? '#111827' : '#FFFFFF'} 
      />
      
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Enhanced Header */}
        <LinearGradient colors={['#3B82F6', '#1E40AF', '#1E3A8A']} style={styles.header}>
          <Animated.View
            style={[
              styles.headerContent,
              {
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  })
                }],
                opacity: fadeAnim,
              }
            ]}
          >
            <View style={styles.headerTop}>
              <Text style={styles.companyName}>{companyInfo.name}</Text>
              <TouchableOpacity onPress={shareProfile} style={styles.shareButton}>
                <Ionicons name="share-social" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.ownerContainer}>
              <LinearGradient colors={['#FFFFFF', '#F3F4F6']} style={styles.avatar}>
                <Text style={styles.avatarText}>{companyInfo.owner.split(' ').map(n => n[0]).join('')}</Text>
              </LinearGradient>
              <View style={styles.ownerInfo}>
                <Text style={styles.ownerName}>{companyInfo.owner}</Text>
                <Text style={styles.ownerRole}>Managing Director</Text>
                <Text style={styles.foundedText}>Est. {companyInfo.founded}</Text>
              </View>
            </View>
            
            <View style={styles.contactContainer}>
              <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
                <Ionicons name="call" size={18} color="white" />
                <Text style={styles.contactButtonText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactButton} onPress={handleMail}>
                <Ionicons name="mail" size={18} color="white" />
                <Text style={styles.contactButtonText}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactButton} onPress={handleWeb}>
                <FontAwesome5 name="globe" size={16} color="white" />
                <Text style={styles.contactButtonText}>Website</Text>
              </TouchableOpacity>
            </View>

            {/* Social Media */}
            <View style={styles.socialContainer}>
              {companyInfo.socialMedia.linkedin && (
                <TouchableOpacity onPress={() => handleSocialMedia('linkedin')}>
                  <FontAwesome5 name="linkedin" size={20} color="white" />
                </TouchableOpacity>
              )}
              {companyInfo.socialMedia.facebook && (
                <TouchableOpacity onPress={() => handleSocialMedia('facebook')}>
                  <FontAwesome5 name="facebook" size={20} color="white" />
                </TouchableOpacity>
              )}
              {companyInfo.socialMedia.instagram && (
                <TouchableOpacity onPress={() => handleSocialMedia('instagram')}>
                  <FontAwesome5 name="instagram" size={20} color="white" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Enhanced Tabs */}
        <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
          {[
            { key: 'company', label: 'Company', icon: 'business' },
            { key: 'branches', label: 'Branches', icon: 'location' },
            { key: 'expenses', label: 'Projects', icon: 'analytics' },
            { key: 'performance', label: 'Performance', icon: 'trophy' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && [styles.activeTab, { backgroundColor: colors.primary }]
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.key as any);
              }}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={16} 
                color={activeTab === tab.key ? 'white' : colors.textSecondary} 
              />
              <Text style={[
                styles.tabText,
                { color: colors.textSecondary },
                activeTab === tab.key && { color: 'white', fontWeight: '600' }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.contentContainer}>
          {activeTab === 'company' && (
            <Animated.View style={{ opacity: fadeAnim }}>
              {/* Stats Row */}
              <View style={styles.statsRow}>
                <AnimatedStatsCard 
                  icon="briefcase" 
                  label="Ongoing Projects" 
                  value={String(projectStats.ongoingProjects)}
                  subtitle="Active"
                  delay={100}
                />
                <AnimatedStatsCard 
                  icon="checkmark-done" 
                  label="Completed" 
                  value={String(projectStats.completedProjects)}
                  subtitle="Success"
                  color={colors.success}
                  delay={200}
                />
              </View>
              
              <View style={styles.statsRow}>
                <AnimatedStatsCard 
                  icon="people" 
                  label="Total Staff" 
                  value={String(projectStats.totalStaff)}
                  subtitle="Professionals"
                  color={colors.warning}
                  delay={300}
                />
                <AnimatedStatsCard 
                  icon="trending-up" 
                  label="Investment" 
                  value={formatCurrency(projectStats.totalAmountSpent)}
                  subtitle="Portfolio"
                  color="#8B5CF6"
                  delay={400}
                />
              </View>

              {/* Company Details */}
              <View style={[styles.section, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  <Ionicons name="information-circle" size={20} color={colors.primary} /> Company Details
                </Text>
                
                <View style={styles.detailRow}>
                  <Ionicons name="location" size={16} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.text }]}>{companyInfo.address}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="document-text" size={16} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.text }]}>GST: {companyInfo.gstNumber}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="card" size={16} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.text }]}>PAN: {companyInfo.panNumber}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.text }]}>RERA: {companyInfo.reraNumber}</Text>
                </View>
              </View>

              {/* Specializations */}
              <View style={[styles.section, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  <Ionicons name="construct" size={20} color={colors.primary} /> Specializations
                </Text>
                <View style={styles.specializationContainer}>
                  {companyInfo.specializations.map((spec, index) => (
                    <View key={index} style={[styles.specializationTag, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                      <Text style={[styles.specializationText, { color: colors.primary }]}>{spec}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Achievements */}
              <View style={[styles.section, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  <Ionicons name="trophy" size={20} color={colors.primary} /> Achievements
                </Text>
                {companyInfo.achievements.map((achievement, index) => (
                  <AchievementCard key={index} achievement={achievement} index={index} />
                ))}
              </View>

              {/* Certifications */}
              <View style={[styles.section, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  <Ionicons name="ribbon" size={20} color={colors.primary} /> Certifications
                </Text>
                <View style={styles.certContainer}>
                  {certifications.map((cert, index) => (
                    <EnhancedCertificationBadge key={index} cert={cert} />
                  ))}
                </View>
              </View>
            </Animated.View>
          )}

          {activeTab === 'branches' && (
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>
                <Ionicons name="business" size={20} color={colors.primary} /> Our Locations ({companyInfo.branchOffices.length})
              </Text>
              {companyInfo.branchOffices.map((branch, index) => (
                <EnhancedBranchOfficeCard key={index} branch={branch} index={index} />
              ))}
            </Animated.View>
          )}

          {activeTab === 'expenses' && (
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>
                <Ionicons name="analytics" size={20} color={colors.primary} /> Project Portfolio
              </Text>
              
              {/* Monthly Expenses Chart */}
              <View style={[styles.section, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.subsectionTitle, { color: colors.text }]}>Monthly Investment Trend</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartContainer}>
                  {monthlyExpenses.map((expense, index) => {
                    const isOverBudget = expense.amount > expense.budget;
                    const percentage = (expense.amount / expense.budget) * 100;
                    
                    return (
                      <View key={index} style={styles.monthlyBarContainer}>
                        <View style={styles.monthlyBar}>
                          <View 
                            style={[
                              styles.monthlyBarFill,
                              { 
                                height: `${Math.min(percentage, 100)}%`,
                                backgroundColor: isOverBudget ? colors.warning : colors.primary 
                              }
                            ]} 
                          />
                        </View>
                        <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>{expense.month}</Text>
                        <Text style={[styles.monthValue, { color: colors.text }]}>
                          {formatCurrency(expense.amount)}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Project Expenses */}
              <View style={[styles.section, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.subsectionTitle, { color: colors.text }]}>Active Projects</Text>
                {projectExpenses.map((project, index) => (
                  <ProjectExpenseChart key={index} project={project} index={index} />
                ))}
              </View>
            </Animated.View>
          )}

          {activeTab === 'performance' && (
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>
                <Ionicons name="analytics" size={20} color={colors.primary} /> Performance Metrics
              </Text>

              {/* Performance Stats */}
              <View style={styles.statsRow}>
                <AnimatedStatsCard 
                  icon="star" 
                  label="Client Rating" 
                  value={`${projectStats.clientSatisfaction}/5.0`}
                  subtitle="Satisfaction"
                  color={colors.success}
                  delay={100}
                />
                <AnimatedStatsCard 
                  icon="shield-checkmark" 
                  label="Safety Record" 
                  value={`${projectStats.safetyRecord}%`}
                  subtitle="Incident Free"
                  color={colors.warning}
                  delay={200}
                />
              </View>

              {/* Performance Indicators */}
              <View style={[styles.section, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.subsectionTitle, { color: colors.text }]}>Key Performance Indicators</Text>
                
                <View style={styles.kpiContainer}>
                  <View style={styles.kpiItem}>
                    <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Project Success Rate</Text>
                    <View style={styles.kpiBarContainer}>
                      <View style={[styles.kpiBar, { backgroundColor: colors.border }]}>
                        <View style={[styles.kpiBarFill, { width: '96%', backgroundColor: colors.success }]} />
                      </View>
                      <Text style={[styles.kpiValue, { color: colors.text }]}>96%</Text>
                    </View>
                  </View>

                  <View style={styles.kpiItem}>
                    <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>On-Time Delivery</Text>
                    <View style={styles.kpiBarContainer}>
                      <View style={[styles.kpiBar, { backgroundColor: colors.border }]}>
                        <View style={[styles.kpiBarFill, { width: '89%', backgroundColor: colors.primary }]} />
                      </View>
                      <Text style={[styles.kpiValue, { color: colors.text }]}>89%</Text>
                    </View>
                  </View>

                  <View style={styles.kpiItem}>
                    <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Budget Adherence</Text>
                    <View style={styles.kpiBarContainer}>
                      <View style={[styles.kpiBar, { backgroundColor: colors.border }]}>
                        <View style={[styles.kpiBarFill, { width: '92%', backgroundColor: colors.warning }]} />
                      </View>
                      <Text style={[styles.kpiValue, { color: colors.text }]}>92%</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Recent Performance Highlights */}
              <View style={[styles.section, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.subsectionTitle, { color: colors.text }]}>Recent Highlights</Text>
                <View style={styles.highlightsList}>
                  <View style={styles.highlightItem}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    <Text style={[styles.highlightText, { color: colors.text }]}>
                      Completed Skyline Residency Phase 1 ahead of schedule
                    </Text>
                  </View>
                  <View style={styles.highlightItem}>
                    <Ionicons name="trophy" size={20} color={colors.warning} />
                    <Text style={[styles.highlightText, { color: colors.text }]}>
                      Received Safety Excellence Award 2024
                    </Text>
                  </View>
                  <View style={styles.highlightItem}>
                    <Ionicons name="people" size={20} color={colors.primary} />
                    <Text style={[styles.highlightText, { color: colors.text }]}>
                      Expanded team to 120+ professionals
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  header: { 
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 24,
  },
  headerContent: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  companyName: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: 'white', 
    flex: 1,
    lineHeight: 30,
  },
  shareButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  ownerContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20,
  },
  avatar: { 
    borderRadius: 30, 
    width: 60, 
    height: 60, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarText: { 
    color: '#1E40AF', 
    fontWeight: 'bold', 
    fontSize: 18,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ownerRole: { 
    color: '#E0E7FF', 
    fontSize: 14,
    marginBottom: 2,
  },
  foundedText: {
    color: '#C7D2FE',
    fontSize: 12,
  },
  contactContainer: { 
    flexDirection: 'row', 
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  contactButton: { 
    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    marginRight: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  contactButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 20,
  },
  tabContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: { 
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 25,
    marginHorizontal: 2,
  },
  activeTab: { 
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tabText: { 
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  contentContainer: { 
    padding: 16,
  },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statsCard: { 
    width: CARD_WIDTH, 
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsCardGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statsValue: { 
    fontWeight: 'bold', 
    fontSize: 20,
    marginBottom: 4,
  },
  statsLabel: { 
    fontSize: 12,
    textAlign: 'center',
  },
  statsSubtitle: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: { 
    fontWeight: 'bold', 
    fontSize: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: { 
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  specializationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specializationTag: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  specializationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  achievementCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  achievementIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  achievementYear: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  certContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
  },
  certBadge: { 
    flexDirection: 'row', 
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    marginRight: 8, 
    marginBottom: 8,
  },
  certText: { 
    marginRight: 8,
    fontSize: 12,
    fontWeight: '500',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  branchCard: { 
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  branchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  branchHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  branchIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  branchTitle: { 
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  branchSubtitle: {
    fontSize: 12,
  },
  branchCardContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  branchText: {
    marginBottom: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  branchActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  chartContainer: {
    paddingVertical: 12,
  },
  monthlyBarContainer: {
    alignItems: 'center',
    marginRight: 20,
    width: 50,
  },
  monthlyBar: {
    height: 120,
    width: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 8,
  },
  monthlyBarFill: {
    width: '100%',
    borderRadius: 12,
  },
  monthLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
  },
  monthValue: {
    fontSize: 10,
    fontWeight: '600',
  },
  projectItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectName: { 
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  projectMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  completionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressBar: { 
    height: 8,
    borderRadius: 4, 
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { 
    height: 8,
    borderRadius: 4,
  },
  projectAmount: { 
    fontSize: 12,
    fontWeight: '600',
  },
  kpiContainer: {
    gap: 16,
  },
  kpiItem: {
    gap: 8,
  },
  kpiLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  kpiBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  kpiBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  kpiBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  highlightsList: {
    gap: 12,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default EnhancedBuilderProfile;