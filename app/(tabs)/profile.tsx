import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Types
interface CompanyInfo {
    name: string;
    logo: string;
    owner: {
        name: string;
        designation: string;
        phone: string;
        email: string;
    };
    address: string;
    establishedYear: string;
    website: string;
    gstNumber: string;
}

interface ProjectStats {
    totalOngoingProjects: number;
    totalStaffAssigned: number;
    totalAmountSpent: number;
    projectWiseExpenses: ProjectExpense[];
    monthlyExpenses: MonthlyExpense[];
}

interface ProjectExpense {
    projectName: string;
    amountSpent: number;
    budget: number;
    status: 'active' | 'completed' | 'planning';
}

interface MonthlyExpense {
    month: string;
    amount: number;
}

// Dummy company data
const companyInfo: CompanyInfo = {
    name: "BuildTech Construction Pvt. Ltd.",
    logo: "https://via.placeholder.com/120x120/3B82F6/FFFFFF?text=BT",
    owner: {
        name: "Rajesh Mehta",
        designation: "Managing Director",
        phone: "+91 98765 43210",
        email: "rajesh.mehta@buildtech.com"
    },
    address: "Plot No. 15, Industrial Area, Pune, Maharashtra 411057",
    establishedYear: "2018",
    website: "www.buildtech.com",
    gstNumber: "27ABCDE1234F1Z5"
};

// Dummy project statistics
const projectStats: ProjectStats = {
    totalOngoingProjects: 8,
    totalStaffAssigned: 24,
    totalAmountSpent: 2450000, // 24.5 Lakhs
    projectWiseExpenses: [
        { projectName: "Manthan Tower A", amountSpent: 650000, budget: 850000, status: 'active' },
        { projectName: "Skyline Apartments B", amountSpent: 520000, budget: 600000, status: 'active' },
        { projectName: "Metro Plaza Complex", amountSpent: 180000, budget: 1200000, status: 'planning' },
        { projectName: "Green Valley Villas", amountSpent: 780000, budget: 900000, status: 'active' },
        { projectName: "Urban Heights", amountSpent: 320000, budget: 450000, status: 'completed' },
    ],
    monthlyExpenses: [
        { month: "Jan", amount: 280000 },
        { month: "Feb", amount: 320000 },
        { month: "Mar", amount: 450000 },
        { month: "Apr", amount: 380000 },
        { month: "May", amount: 520000 },
        { month: "Jun", amount: 410000 },
    ]
};

// Stats Card Component
interface StatsCardProps {
    title: string;
    value: string;
    subtitle?: string;
    icon: string;
    gradient: string[];
    iconColor: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, icon, gradient, iconColor }) => {
    return (
        <View style={styles.statsCard}>
            <LinearGradient
                colors={gradient}
                style={styles.statsCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.statsCardContent}>
                    <View style={styles.statsCardHeader}>
                        <View style={styles.statsIconContainer}>
                            <Ionicons name={icon as any} size={24} color={iconColor} />
                        </View>
                        <Text style={styles.statsTitle}>{title}</Text>
                    </View>

                    <Text style={styles.statsValue}>{value}</Text>
                    {subtitle && <Text style={styles.statsSubtitle}>{subtitle}</Text>}
                </View>
            </LinearGradient>
        </View>
    );
};

// Project Expense Item Component
interface ProjectExpenseItemProps {
    project: ProjectExpense;
}

const ProjectExpenseItem: React.FC<ProjectExpenseItemProps> = ({ project }) => {
    const progressPercentage = Math.min((project.amountSpent / project.budget) * 100, 100);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return '#10B981';
            case 'completed': return '#3B82F6';
            case 'planning': return '#F59E0B';
            default: return '#6B7280';
        }
    };

    const formatCurrency = (amount: number): string => {
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)}L`;
        }
        return `₹${(amount / 1000).toFixed(0)}K`;
    };

    return (
        <View style={styles.projectExpenseItem}>
            <View style={styles.projectHeader}>
                <Text style={styles.projectName} numberOfLines={1}>{project.projectName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(project.status) }]}>
                        {project.status.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.expenseDetails}>
                <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Spent: </Text>
                    <Text style={styles.amountSpent}>{formatCurrency(project.amountSpent)}</Text>
                    <Text style={styles.amountTotal}>/ {formatCurrency(project.budget)}</Text>
                </View>

                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{progressPercentage.toFixed(0)}%</Text>
                </View>

            </View>
        </View>
    );
};

// Main Profile Component
const CompanyProfile: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'projects'>('overview');

    const formatCurrency = (amount: number): string => {
        if (amount >= 10000000) {
            return `₹${(amount / 10000000).toFixed(1)} Cr`;
        }
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)} L`;
        }
        return `₹${(amount / 1000).toFixed(0)}K`;
    };

    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            // Navigation will be handled automatically by the AuthContext and layout
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <SafeAreaView
            style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header with Company Info */}
                <LinearGradient
                    colors={['#3B82F6', '#8B5CF6', '#EC4899']}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerOverlay}>
                        <View style={styles.companyInfoSection}>
                            {/* Company Logo */}
                            <View style={styles.logoContainer}>
                                <View style={styles.logoWrapper}>
                                    <Text style={styles.logoText}>BT</Text>
                                </View>
                                <View style={styles.logoRing} />
                            </View>

                            {/* Company Details */}
                            <View style={styles.companyDetails}>
                                <Text style={styles.companyName}>{companyInfo.name}</Text>
                                <Text style={styles.establishedText}>Est. {companyInfo.establishedYear}</Text>

                                <View style={styles.ownerInfo}>
                                    <Text style={styles.ownerName}>{companyInfo.owner.name}</Text>
                                    <Text style={styles.ownerDesignation}>{companyInfo.owner.designation}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Contact Information */}
                        <View style={styles.contactSection}>
                            <View style={styles.contactItem}>
                                <Ionicons name="call" size={16} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.contactText}>{companyInfo.owner.phone}</Text>
                            </View>
                            <View style={styles.contactItem}>
                                <Ionicons name="mail" size={16} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.contactText}>{companyInfo.owner.email}</Text>
                            </View>
                            <View style={styles.contactItem}>
                                <Ionicons name="globe" size={16} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.contactText}>{companyInfo.website}</Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                {/* Statistics Cards */}
                <View style={styles.statsSection}>
                    <Text style={styles.sectionTitle}>Business Overview</Text>
                    <View style={styles.statsGrid}>
                        <StatsCard
                            title="Ongoing Projects"
                            value={projectStats.totalOngoingProjects.toString()}
                            subtitle="Active sites"
                            icon="construct"
                            gradient={['#EBF8FF', '#BFDBFE']}
                            iconColor="#3B82F6"
                        />
                        <StatsCard
                            title="Total Staff"
                            value={projectStats.totalStaffAssigned.toString()}
                            subtitle="Assigned members"
                            icon="people"
                            gradient={['#ECFDF5', '#BBF7D0']}
                            iconColor="#10B981"
                        />
                        <StatsCard
                            title="Total Investment"
                            value={formatCurrency(projectStats.totalAmountSpent)}
                            subtitle="Across all projects"
                            icon="trending-up"
                            gradient={['#FEF3C7', '#FDE68A']}
                            iconColor="#F59E0B"
                        />
                        <StatsCard
                            title="Average per Project"
                            value={formatCurrency(projectStats.totalAmountSpent / projectStats.totalOngoingProjects)}
                            subtitle="Investment ratio"
                            icon="calculator"
                            gradient={['#F3E8FF', '#DDD6FE']}
                            iconColor="#8B5CF6"
                        />
                    </View>
                </View>

                {/* Tab Navigation */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
                        onPress={() => setActiveTab('overview')}
                    >
                        <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
                            Overview
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'projects' && styles.activeTab]}
                        onPress={() => setActiveTab('projects')}
                    >
                        <Text style={[styles.tabText, activeTab === 'projects' && styles.activeTabText]}>
                            Project Expenses
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Tab Content */}
                {activeTab === 'overview' ? (
                    <View style={styles.overviewContent}>
                        {/* Company Information */}
                        <View style={styles.infoCard}>
                            <Text style={styles.cardTitle}>Company Information</Text>
                            <View style={styles.infoGrid}>
                                <View style={styles.infoItem}>
                                    <Ionicons name="location" size={20} color="#6B7280" />
                                    <View style={styles.infoTextContainer}>
                                        <Text style={styles.infoLabel}>Address</Text>
                                        <Text style={styles.infoValue}>{companyInfo.address}</Text>
                                    </View>
                                </View>

                                <View style={styles.infoItem}>
                                    <Ionicons name="document-text" size={20} color="#6B7280" />
                                    <View style={styles.infoTextContainer}>
                                        <Text style={styles.infoLabel}>GST Number</Text>
                                        <Text style={styles.infoValue}>{companyInfo.gstNumber}</Text>
                                    </View>
                                </View>

                                <View style={styles.infoItem}>
                                    <Ionicons name="calendar" size={20} color="#6B7280" />
                                    <View style={styles.infoTextContainer}>
                                        <Text style={styles.infoLabel}>Established</Text>
                                        <Text style={styles.infoValue}>{companyInfo.establishedYear}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Monthly Expenses Chart */}
                        <View style={styles.chartCard}>
                            <Text style={styles.cardTitle}>Monthly Expenses (Last 6 Months)</Text>
                            <View style={styles.chartContainer}>
                                {projectStats.monthlyExpenses.map((expense, index) => {
                                    const maxAmount = Math.max(...projectStats.monthlyExpenses.map(e => e.amount));
                                    const height = (expense.amount / maxAmount) * 120;

                                    return (
                                        <View key={index} style={styles.chartBar}>
                                            <Text style={styles.chartAmount}>{formatCurrency(expense.amount)}</Text>
                                            <View style={styles.barContainer}>
                                                <LinearGradient
                                                    colors={['#3B82F6', '#8B5CF6']}
                                                    style={[styles.bar, { height }]}
                                                    start={{ x: 0, y: 1 }}
                                                    end={{ x: 0, y: 0 }}
                                                />
                                            </View>
                                            <Text style={styles.chartMonth}>{expense.month}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={styles.projectsContent}>
                        <View style={styles.projectExpensesCard}>
                            <Text style={styles.cardTitle}>Project-wise Expenses</Text>
                            <Text style={styles.cardSubtitle}>
                                Total spent: {formatCurrency(projectStats.totalAmountSpent)}
                            </Text>

                            <View style={styles.projectExpensesList}>
                                {projectStats.projectWiseExpenses.map((project, index) => (
                                    <ProjectExpenseItem key={index} project={project} />
                                ))}
                            </View>
                        </View>
                    </View>
                )}

                <TouchableOpacity onPress={handleLogout} >
                    <Text>Logout</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerOverlay: {
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 20,
        padding: 20,
    },
    companyInfoSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logoContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    logoWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    logoText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
    },
    logoRing: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        top: -10,
        left: -10,
    },
    companyDetails: {
        alignItems: 'center',
    },
    companyName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 4,
    },
    establishedText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 12,
    },
    ownerInfo: {
        alignItems: 'center',
    },
    ownerName: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
        marginBottom: 2,
    },
    ownerDesignation: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    contactSection: {
        gap: 8,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    contactText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        marginLeft: 8,
    },
    statsSection: {
        padding: 20,
        paddingTop: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statsCard: {
        width: (width - 52) / 2,
        borderRadius: 16,
        overflow: 'hidden',
    },
    statsCardGradient: {
        padding: 16,
        minHeight: 120,
    },
    statsCardContent: {
        flex: 1,
    },
    statsCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    statsIconContainer: {
        marginRight: 8,
    },
    statsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        flex: 1,
    },
    statsValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    statsSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#3B82F6',
        fontWeight: '600',
    },
    overviewContent: {
        padding: 20,
    },
    infoCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
    },
    infoGrid: {
        gap: 16,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        color: '#111827',
        lineHeight: 20,
    },
    chartCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 180,
    },
    chartBar: {
        alignItems: 'center',
        flex: 1,
    },
    chartAmount: {
        fontSize: 11,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    barContainer: {
        height: 120,
        justifyContent: 'flex-end',
        width: 24,
    },
    bar: {
        width: 24,
        borderRadius: 12,
        minHeight: 8,
    },
    chartMonth: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 8,
        fontWeight: '500',
    },
    projectsContent: {
        padding: 20,
    },
    projectExpensesCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    projectExpensesList: {
        gap: 16,
    },
    projectExpenseItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 16,
    },
    projectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    projectName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
        marginRight: 12,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    expenseDetails: {
        gap: 8,
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    amountLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    amountSpent: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    amountTotal: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        marginRight: 12,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#3B82F6',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6B7280',
        minWidth: 35,
        textAlign: 'right',
    },
});

export default CompanyProfile;