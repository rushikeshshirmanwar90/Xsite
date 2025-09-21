import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
// import { BarChart } from 'react-native-chart-kit';
import * as Linking from 'expo-linking';

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
  achievements: string[];
  specializations: string[];
  branchOffices: BranchOffice[];
}

interface BranchOffice {
  city: string;
  address: string;
  manager: string;
  phone: string;
  projectsCount: number;
}

interface Certification {
  name: string;
  status: 'Active' | 'Pending' | 'Expired';
}

interface ProjectStats {
  ongoingProjects: number;
  totalStaff: number;
  totalAmountSpent: number;
}

interface ProjectExpense {
  projectName: string;
  amountSpent: number;
  totalBudget: number;
}

interface MonthlyExpense {
  month: string;
  amount: number;
}

const EnhancedBuilderProfile: React.FC = () => {
  const scheme = useColorScheme();
  const [activeTab, setActiveTab] = useState<'company' | 'branches' | 'expenses'>('company');

  // ✅ Static data memoized for performance
  const companyInfo = useMemo<CompanyInfo>(
    () => ({
      name: 'Sharda Constructions Pvt. Ltd.',
      owner: 'Mr. Rakesh Sharma',
      address: 'Plot No. 45, Industrial Area, MIDC, Nagpur, Maharashtra, 440016',
      gstNumber: '27AABCS1234K1Z9',
      panNumber: 'AABCS1234K',
      reraNumber: 'P50500012345',
      website: 'https://shardaconstructions.com',
      achievements: [
        'ISO 9001:2015 Certified',
        'Best Builder Award 2023',
        'Completed 50+ projects successfully',
      ],
      specializations: ['Residential', 'Commercial', 'Industrial', 'Smart Cities'],
      branchOffices: [
        {
          city: 'Pune',
          address: 'Magarpatta City, Hadapsar, Pune',
          manager: 'Mr. Anil Patil',
          phone: '+91 9876543210',
          projectsCount: 12,
        },
        {
          city: 'Mumbai',
          address: 'Bandra Kurla Complex, Mumbai',
          manager: 'Ms. Priya Mehta',
          phone: '+91 9988776655',
          projectsCount: 8,
        },
      ],
    }),
    []
  );

  const certifications = useMemo<Certification[]>(
    () => [
      { name: 'ISO 9001', status: 'Active' },
      { name: 'ISO 14001', status: 'Pending' },
      { name: 'OHSAS 18001', status: 'Expired' },
    ],
    []
  );

  const projectStats = useMemo<ProjectStats>(
    () => ({
      ongoingProjects: 15,
      totalStaff: 120,
      totalAmountSpent: 45000000,
    }),
    []
  );

  const monthlyExpenses = useMemo<MonthlyExpense[]>(
    () => [
      { month: 'Apr', amount: 500000 },
      { month: 'May', amount: 750000 },
      { month: 'Jun', amount: 600000 },
      { month: 'Jul', amount: 900000 },
      { month: 'Aug', amount: 850000 },
      { month: 'Sep', amount: 950000 },
    ],
    []
  );

  const projectExpenses = useMemo<ProjectExpense[]>(
    () => [
      { projectName: 'Skyline Residency', amountSpent: 12000000, totalBudget: 15000000 },
      { projectName: 'Sunrise Towers', amountSpent: 8000000, totalBudget: 12000000 },
      { projectName: 'Industrial Shed', amountSpent: 5000000, totalBudget: 8000000 },
    ],
    []
  );

  // ✅ Utility functions
  const formatCurrency = useCallback(
    (amount: number) => `₹${amount.toLocaleString('en-IN')}`,
    []
  );

  // ✅ UI Components
  const StatsCard: React.FC<{ icon: keyof typeof Ionicons.glyphMap; label: string; value: string }> = ({
    icon,
    label,
    value,
  }) => (
    <LinearGradient colors={['#E0EAFC', '#CFDEF3']} style={styles.statsCard}>
      <Ionicons name={icon} size={24} color="#1E3A8A" />
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsLabel}>{label}</Text>
    </LinearGradient>
  );

  const CertificationBadge: React.FC<{ cert: Certification }> = ({ cert }) => (
    <View style={styles.certBadge}>
      <Text style={styles.certText}>{cert.name}</Text>
      <MaterialIcons
        name={
          cert.status === 'Active'
            ? 'check-circle'
            : cert.status === 'Pending'
            ? 'hourglass-empty'
            : 'cancel'
        }
        size={16}
        color={cert.status === 'Active' ? 'green' : cert.status === 'Pending' ? 'orange' : 'red'}
      />
    </View>
  );

  const BranchOfficeCard: React.FC<{ branch: BranchOffice }> = ({ branch }) => (
    <View style={styles.branchCard}>
      <Text style={styles.branchTitle}>{branch.city}</Text>
      <Text style={styles.branchText}>{branch.address}</Text>
      <Text style={styles.branchText}>Manager: {branch.manager}</Text>
      <Text style={styles.branchText}>📞 {branch.phone}</Text>
      <Text style={styles.branchText}>Projects: {branch.projectsCount}</Text>
    </View>
  );

  const ProjectExpenseItem: React.FC<{ project: ProjectExpense }> = ({ project }) => {
    const progress = (project.amountSpent / project.totalBudget) * 100;
    return (
      <View style={styles.projectItem}>
        <Text style={styles.projectName}>{project.projectName}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.projectAmount}>
          {formatCurrency(project.amountSpent)} / {formatCurrency(project.totalBudget)}
        </Text>
      </View>
    );
  };

  // ✅ Contact actions
  const handleCall = () => Linking.openURL('tel:+919876543210');
  const handleMail = () => Linking.openURL('mailto:info@shardaconstructions.com');
  const handleWeb = () => Linking.openURL(companyInfo.website);

  return (
    <ScrollView style={[styles.container, { backgroundColor: scheme === 'dark' ? '#111827' : '#fff' }]}>
      {/* Header */}
      <LinearGradient colors={['#3b82f6', '#1e40af']} style={styles.header}>
        <Text style={styles.companyName}>{companyInfo.name}</Text>
        <View style={styles.ownerContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{companyInfo.owner[0]}</Text>
          </View>
          <View>
            <Text style={styles.ownerName}>{companyInfo.owner}</Text>
            <Text style={styles.ownerRole}>Managing Director</Text>
          </View>
        </View>
        <View style={styles.contactContainer}>
          <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
            <Ionicons name="call" size={16} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton} onPress={handleMail}>
            <Ionicons name="mail" size={16} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton} onPress={handleWeb}>
            <FontAwesome5 name="globe" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['company', 'branches', 'expenses'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'company' && (
        <View style={styles.contentContainer}>
          <View style={styles.statsRow}>
            <StatsCard icon="briefcase" label="Ongoing Projects" value={String(projectStats.ongoingProjects)} />
            <StatsCard icon="people" label="Total Staff" value={String(projectStats.totalStaff)} />
            <StatsCard icon="cash" label="Amount Spent" value={formatCurrency(projectStats.totalAmountSpent)} />
          </View>

          <Text style={styles.sectionTitle}>Company Details</Text>
          <Text style={styles.infoText}>📍 {companyInfo.address}</Text>
          <Text style={styles.infoText}>GST: {companyInfo.gstNumber}</Text>
          <Text style={styles.infoText}>PAN: {companyInfo.panNumber}</Text>
          <Text style={styles.infoText}>RERA: {companyInfo.reraNumber}</Text>

          <Text style={styles.sectionTitle}>Certifications</Text>
          <View style={styles.certContainer}>
            {certifications.map((cert, index) => (
              <CertificationBadge key={index} cert={cert} />
            ))}
          </View>
        </View>
      )}

      {activeTab === 'branches' && (
        <FlatList
          data={companyInfo.branchOffices}
          keyExtractor={(item, index) => `${item.city}-${index}`}
          renderItem={({ item }) => <BranchOfficeCard branch={item} />}
          contentContainerStyle={styles.contentContainer}
        />
      )}

      {/* {activeTab === 'expenses' && (
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Monthly Expenses</Text>
          <BarChart
            data={{
              labels: monthlyExpenses.map((m) => m.month),
              datasets: [{ data: monthlyExpenses.map((m) => m.amount) }],
            }}
            width={width - 32}
            height={220}
            yAxisLabel="₹"
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#f9fafb',
              backgroundGradientTo: '#f3f4f6',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            }}
            style={{ borderRadius: 8, marginVertical: 8 }}
          />
          <Text style={styles.sectionTitle}>Project Expenses</Text>
          {projectExpenses.map((project, idx) => (
            <ProjectExpenseItem key={idx} project={project} />
          ))}
        </View>
      )} */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16 },
  companyName: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 8 },
  ownerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { backgroundColor: 'white', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  avatarText: { color: '#1e40af', fontWeight: 'bold' },
  ownerName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  ownerRole: { color: '#E0E7FF', fontSize: 12 },
  contactContainer: { flexDirection: 'row', marginTop: 8 },
  contactButton: { backgroundColor: '#2563eb', padding: 8, borderRadius: 8, marginRight: 8 },
  tabContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: 8, backgroundColor: '#F3F4F6' },
  tab: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20 },
  activeTab: { backgroundColor: '#2563eb' },
  tabText: { color: '#374151' },
  activeTabText: { color: 'white', fontWeight: 'bold' },
  contentContainer: { padding: 16 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  statsCard: { width: CARD_WIDTH, borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 12 },
  statsValue: { fontWeight: 'bold', fontSize: 18 },
  statsLabel: { color: '#4B5563', fontSize: 12 },
  sectionTitle: { fontWeight: 'bold', fontSize: 16, marginTop: 12 },
  infoText: { color: '#374151', marginVertical: 2 },
  certContainer: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 },
  certBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 16, paddingHorizontal: 8, paddingVertical: 4, marginRight: 8, marginBottom: 8 },
  certText: { marginRight: 4 },
  branchCard: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8, marginBottom: 8 },
  branchTitle: { fontWeight: 'bold', marginBottom: 4 },
  branchText: { color: '#374151' },
  projectItem: { marginVertical: 8 },
  projectName: { fontWeight: 'bold', marginBottom: 4 },
  progressBar: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressFill: { backgroundColor: '#3b82f6', height: 8 },
  projectAmount: { fontSize: 12, color: '#374151', marginTop: 4 },
});

export default EnhancedBuilderProfile;
