import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Project } from '../../types/project';


const Dashboard = () => {
    const [loading, setLoading] = useState(false);

    // Mock data for demonstration
    const mockProjects: Project[] = [
        {
            _id: '1',
            name: 'Skyline Tower',
            address: 'Mumbai, Maharashtra',
            status: 'active',
            progress: 75,
            budget: 50000000,
            spent: 37500000,
            startDate: '2024-01-15',
            endDate: '2024-12-31',
            description: 'A 45-story residential tower with modern amenities',
            assignedStaff: [],
        },
        {
            _id: '2',
            name: 'Green Valley Residency',
            address: 'Pune, Maharashtra',
            status: 'active',
            progress: 45,
            budget: 35000000,
            spent: 15750000,
            startDate: '2024-03-01',
            endDate: '2025-02-28',
            description: 'Eco-friendly residential complex with 200 units',
            assignedStaff: [],
        },
        {
            _id: '3',
            name: 'Tech Park Phase 2',
            address: 'Bangalore, Karnataka',
            status: 'active',
            progress: 90,
            budget: 80000000,
            spent: 72000000,
            startDate: '2023-06-01',
            endDate: '2024-09-30',
            description: 'Commercial office space expansion project',
            assignedStaff: [],
        },
    ];

    const StatCard = ({ title, value, subtitle, color, icon, trend }: any) => (
        <View style={[styles.statCard, { backgroundColor: '#ffffff' }]}>
            <View style={styles.statCardHeader}>
                <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
                    <Ionicons name={icon} size={20} color={color} />
                </View>
                {trend && (
                    <View style={[styles.trendBadge, { backgroundColor: trend > 0 ? '#10B981' : '#EF4444' }]}>
                        <Text style={styles.trendText}>{trend > 0 ? '+' : ''}{trend}%</Text>
                    </View>
                )}
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statSubtitle}>{subtitle}</Text>
        </View>
    );

    const ProjectCard = ({ project, onPress }: any) => {
        const budgetPercentage = Math.round(((project.spent || 0) / (project.budget || 1)) * 100);
        const formatCurrency = (amount: number) => {
            if (amount >= 10000000) {
                return `₹${(amount / 10000000).toFixed(1)}Cr`;
            } else if (amount >= 100000) {
                return `₹${(amount / 100000).toFixed(1)}L`;
            } else {
                return `₹${(amount / 1000).toFixed(1)}K`;
            }
        };

        return (
            <View style={styles.projectCard}>
                <View style={styles.projectCardHeader}>
                    <View style={styles.projectInfo}>
                        <Text style={styles.projectName}>{project.name}</Text>
                        <Text style={styles.projectLocation}>{project.address}</Text>
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: project.status === 'active' ? '#10B981' : '#64748B' }]} />
                </View>

                <View style={styles.projectProgress}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Progress</Text>
                        <Text style={styles.progressValue}>{project.progress}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${project.progress}%` as any }]} />
                    </View>
                </View>

                <View style={styles.projectBudget}>
                    <View style={styles.budgetHeader}>
                        <Text style={styles.budgetLabel}>Budget Used</Text>
                        <Text style={styles.budgetValue}>{budgetPercentage}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${budgetPercentage}%` as any, backgroundColor: '#0EA5E9' }]} />
                    </View>
                    <View style={styles.budgetAmounts}>
                        <View style={styles.budgetAmountItem}>
                            <Text style={styles.budgetAmountLabel}>Total Budget</Text>
                            <Text style={styles.budgetAmountValue}>{formatCurrency(project.budget || 0)}</Text>
                        </View>
                        <View style={styles.budgetAmountItem}>
                            <Text style={styles.budgetAmountLabel}>Used Amount</Text>
                            <Text style={styles.budgetAmountValue}>{formatCurrency(project.spent || 0)}</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity 
                    style={styles.viewDetailsButton} 
                    onPress={onPress}
                >
                    <Text style={styles.viewDetailsButtonText}>View Details</Text>
                    <Ionicons name="arrow-forward" size={16} color="#0EA5E9" />
                </TouchableOpacity>
            </View>
        );
    };

    const ProjectSelectionScreen = () => {
        const totalBudget = mockProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
        const totalSpent = mockProjects.reduce((sum, p) => sum + (p.spent || 0), 0);
        const budgetUsedPercentage = Math.round((totalSpent / totalBudget) * 100);

        return (
            <View style={styles.container}>
                <View style={styles.fixedHeader}>
                    <View style={styles.headerContent}>
                        <View>
                            <Text style={styles.headerTitle}>Project Analysis</Text>
                            <Text style={styles.headerSubtitle}>Select a project to view detailed analysis</Text>
                        </View>
                        <View style={styles.headerIconContainer}>
                            <Ionicons name="analytics" size={24} color="#0EA5E9" />
                        </View>
                    </View>

                    {/* Minimal Stats Overview - Very compact */}
                    <View style={styles.minimalOverviewContainer}>
                        <View style={styles.minimalStatsRow}>
                            <View style={styles.minimalStatItem}>
                                <Text style={styles.minimalStatValue}>{mockProjects.length}</Text>
                                <Text style={styles.minimalStatLabel}>Projects</Text>
                            </View>
                            <View style={styles.minimalStatItem}>
                                <Text style={styles.minimalStatValue}>₹{(totalBudget / 1000000).toFixed(1)}M</Text>
                                <Text style={styles.minimalStatLabel}>Budget</Text>
                            </View>
                            <View style={styles.minimalStatItem}>
                                <Text style={styles.minimalStatValue}>{budgetUsedPercentage}%</Text>
                                <Text style={styles.minimalStatLabel}>Used</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <ScrollView style={styles.scrollableContent} contentContainerStyle={styles.scrollableContentContainer}>
                    {/* Projects Section */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Your Projects</Text>
                        <View style={styles.sectionDivider} />
                    </View>

                    <View style={styles.projectsContainer}>
                        {mockProjects.map((project) => (
                            <ProjectCard
                                key={project._id}
                                project={project}
                                onPress={() => {
                                    // Navigate to analysis page
                                    router.push(`/analysis/${project._id}`);
                                }}
                            />
                        ))}
                    </View>
                </ScrollView>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0EA5E9" />
            </View>
        );
    }

    return <ProjectSelectionScreen />;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    fixedHeader: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 5,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 4,
    },
    headerIconContainer: {
        backgroundColor: '#F0F9FF',
        padding: 12,
        borderRadius: 16,
    },
    scrollableContent: {
        flex: 1,
    },
    scrollableContentContainer: {
        padding: 20,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    sectionDivider: {
        height: 2,
        backgroundColor: '#E5E7EB',
        borderRadius: 1,
        marginTop: 8,
    },
    projectsContainer: {
        gap: 16,
    },
    projectCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    projectCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    projectInfo: {
        flex: 1,
    },
    projectName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    projectLocation: {
        fontSize: 14,
        color: '#64748B',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    projectProgress: {
        marginBottom: 12,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    progressValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    progressBar: {
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 3,
    },
    projectBudget: {
        marginBottom: 12,
    },
    budgetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    budgetLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    budgetValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    statCard: {
        borderRadius: 16,
        padding: 16,
        flex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    statCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trendBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    trendText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#ffffff',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    statSubtitle: {
        fontSize: 13,
        color: '#64748B',
    },
    headerStatsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    combinedBudgetCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    budgetCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    budgetCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    budgetPercentageBadge: {
        backgroundColor: '#E0F2FE',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    budgetPercentageText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0EA5E9',
    },
    budgetCardContent: {
        gap: 8,
    },
    budgetRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    budgetProgressBar: {
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
        overflow: 'hidden',
        marginTop: 8,
    },
    budgetProgressFill: {
        height: '100%',
        backgroundColor: '#0EA5E9',
        borderRadius: 3,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    // Minimal Overview Styles - Very compact
    minimalOverviewContainer: {
        marginTop: 8,
        height: 60, // Fixed minimal height
    },
    minimalStatsRow: {
        flexDirection: 'row',
        gap: 8,
        height: '100%',
    },
    minimalStatItem: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 6,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    minimalStatValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 1,
    },
    minimalStatLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: '#6B7280',
    },
    budgetAmounts: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        gap: 16,
    },
    budgetAmountItem: {
        flex: 1,
    },
    budgetAmountLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: '#6B7280',
        marginBottom: 2,
    },
    budgetAmountValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1F2937',
    },
    viewDetailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F9FF',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#E0F2FE',
    },
    viewDetailsButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0EA5E9',
        marginRight: 8,
    },
});

export default Dashboard;