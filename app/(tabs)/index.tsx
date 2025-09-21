// App.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

// Types
interface Project {
    id: number;
    name: string;
    address: string;
    assignedStaff: string;
    status: 'active' | 'planning' | 'completed';
    startDate: string;
    endDate: string;
    progress: number;
    totalMaterials: number;
    materialsReceived: number;
    materialsIssued: number;
    priority: 'high' | 'medium' | 'low';
    budget: number;
    spent: number;
    recentActivities: Activity[];
}

interface Activity {
    type: 'received' | 'issued' | 'ordered';
    material: string;
    quantity: string;
    date: string;
}

interface ProjectStats {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    averageProgress: number;
    totalBudget: number;
    totalSpent: number;
    highPriorityProjects: number;
    overdueProjects: number;
}

// Utility functions
const generateInitials = (companyName: string): string => {
    if (!companyName) return 'XX';
    
    const words = companyName
        .split(/[\s\-_&]+/)
        .filter(word => word.length > 0)
        .map(word => word.trim());
    
    if (words.length === 0) return 'XX';
    
    if (words.length === 1) {
        const word = words[0];
        return word.length >= 2 ? word.substring(0, 2).toUpperCase() : word.toUpperCase();
    }
    
    const skipWords = ['and', 'the', 'of', 'in', 'at', 'on', '&'];
    const significantWords = words.filter(word => 
        !skipWords.includes(word.toLowerCase()) && word.length > 0
    );
    
    if (significantWords.length === 0) {
        return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
    }
    
    return significantWords
        .slice(0, 2)
        .map(word => word[0])
        .join('')
        .toUpperCase();
};

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const isProjectOverdue = (endDate: string, progress: number): boolean => {
    const today = new Date();
    const projectEndDate = new Date(endDate);
    const daysRemaining = Math.ceil((projectEndDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    // Consider overdue if less than 30 days remaining and progress < 80%
    return daysRemaining < 30 && progress < 80 && progress < 100;
};

const calculateProjectStats = (projects: Project[]): ProjectStats => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const averageProgress = totalProjects > 0 
        ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / totalProjects) 
        : 0;
    const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
    const totalSpent = projects.reduce((acc, p) => acc + p.spent, 0);
    const highPriorityProjects = projects.filter(p => p.priority === 'high').length;
    const overdueProjects = projects.filter(p => isProjectOverdue(p.endDate, p.progress)).length;

    return {
        totalProjects,
        activeProjects,
        completedProjects,
        averageProgress,
        totalBudget,
        totalSpent,
        highPriorityProjects,
        overdueProjects
    };
};

// Company configuration
const COMPANY_CONFIG = {
    name: "Sharda Constructions",
    subtitle: "Project Management Dashboard"
};

// Enhanced dummy data with more realistic details
const dummyProjects: Project[] = [
    {
        id: 1,
        name: "Manthan Tower A",
        address: "Baner Road, Pune, Maharashtra 411045",
        assignedStaff: "Rajesh Kumar",
        status: "active",
        startDate: "2024-01-15",
        endDate: "2025-06-30",
        progress: 98,
        totalMaterials: 156,
        materialsReceived: 124,
        materialsIssued: 89,
        priority: "high",
        budget: 66300000,
        spent: 66300000,
        recentActivities: [
            { type: "received", material: "Modular Bricks", quantity: "10,000 pcs", date: "2024-09-10" },
            { type: "issued", material: "Cement Bags", quantity: "150 bags", date: "2024-09-09" },
            { type: "ordered", material: "Steel Bars", quantity: "5 tons", date: "2024-09-08" }
        ]
    },
    {
        id: 2,
        name: "Skyline Apartments B",
        address: "Hinjewadi Phase 2, Pune, Maharashtra 411057",
        assignedStaff: "Priya Sharma",
        status: "active",
        startDate: "2024-03-01",
        endDate: "2025-12-15",
        progress: 45,
        totalMaterials: 203,
        materialsReceived: 189,
        materialsIssued: 156,
        priority: "medium",
        budget: 120000000,
        spent: 54000000,
        recentActivities: [
            { type: "received", material: "Ready Mix Concrete", quantity: "50 m³", date: "2024-09-12" },
            { type: "issued", material: "Sand", quantity: "25 m³", date: "2024-09-11" },
            { type: "ordered", material: "Tiles", quantity: "2,000 sq ft", date: "2024-09-10" }
        ]
    },
    {
        id: 3,
        name: "Metro Plaza Complex",
        address: "Wakad, Pune, Maharashtra 411057",
        assignedStaff: "Amit Patel",
        status: "planning",
        startDate: "2024-11-01",
        endDate: "2026-08-01",
        progress: 15,
        totalMaterials: 89,
        materialsReceived: 12,
        materialsIssued: 8,
        priority: "low",
        budget: 95000000,
        spent: 14250000,
        recentActivities: [
            { type: "ordered", material: "Foundation Steel", quantity: "15 tons", date: "2024-09-13" },
            { type: "received", material: "Survey Equipment", quantity: "1 set", date: "2024-09-12" }
        ]
    },
    {
        id: 4,
        name: "Green Valley Villas",
        address: "Kothrud, Pune, Maharashtra 411038",
        assignedStaff: "Sneha Reddy",
        status: "active",
        startDate: "2024-02-01",
        endDate: "2024-11-30",
        progress: 92,
        totalMaterials: 178,
        materialsReceived: 165,
        materialsIssued: 142,
        priority: "high",
        budget: 75000000,
        spent: 69000000,
        recentActivities: [
            { type: "issued", material: "Paint", quantity: "200 liters", date: "2024-09-13" },
            { type: "received", material: "Door Frames", quantity: "45 units", date: "2024-09-12" },
            { type: "issued", material: "Electrical Wires", quantity: "500 meters", date: "2024-09-11" }
        ]
    },
    {
        id: 5,
        name: "Heritage Residency",
        address: "Koregaon Park, Pune, Maharashtra 411001",
        assignedStaff: "Vikram Singh",
        status: "completed",
        startDate: "2023-05-01",
        endDate: "2024-08-01",
        progress: 100,
        totalMaterials: 245,
        materialsReceived: 245,
        materialsIssued: 245,
        priority: "medium",
        budget: 65000000,
        spent: 63500000,
        recentActivities: [
            { type: "issued", material: "Final Touch-up Paint", quantity: "50 liters", date: "2024-07-30" },
            { type: "received", material: "Cleaning Supplies", quantity: "1 set", date: "2024-07-28" }
        ]
    },
    {
        id: 6,
        name: "Tech Park Phase 1",
        address: "Magarpatta, Pune, Maharashtra 411013",
        assignedStaff: "Kavya Nair",
        status: "planning",
        startDate: "2025-01-01",
        endDate: "2026-12-01",
        progress: 5,
        totalMaterials: 320,
        materialsReceived: 15,
        materialsIssued: 0,
        priority: "medium",
        budget: 150000000,
        spent: 7500000,
        recentActivities: [
            { type: "ordered", material: "Site Survey Equipment", quantity: "2 sets", date: "2024-09-15" }
        ]
    }
];

// Project Card Component
interface ProjectCardProps {
    project: Project;
    onViewDetails: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onViewDetails }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return { bg: '#0EA5E9', text: '#ffffff', light: '#E0F2FE' };
            case 'planning': return { bg: '#8B5CF6', text: '#ffffff', light: '#EDE9FE' };
            case 'completed': return { bg: '#10B981', text: '#ffffff', light: '#D1FAE5' };
            default: return { bg: '#64748B', text: '#ffffff', light: '#F1F5F9' };
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return { bg: '#FEE2E2', text: '#DC2626', icon: 'alert-circle' };
            case 'medium': return { bg: '#FEF3C7', text: '#D97706', icon: 'time' };
            case 'low': return { bg: '#D1FAE5', text: '#10B981', icon: 'checkmark-circle' };
            default: return { bg: '#F1F5F9', text: '#64748B', icon: 'help-circle' };
        }
    };

    const statusColor = getStatusColor(project.status);
    const priorityColor = getPriorityColor(project.priority);
    const budgetProgress = (project.spent / project.budget) * 100;
    const isOverdue = isProjectOverdue(project.endDate, project.progress);
    
    // Calculate days remaining
    const today = new Date();
    const endDate = new Date(project.endDate);
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    return (
        <View style={[styles.card, isOverdue && styles.overdueCard]}>
            <View style={styles.cardHeader}>
                <View style={styles.cardHeaderTop}>
                    <View style={styles.badgeRow}>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                            <Text style={[styles.statusText, { color: statusColor.text }]}>
                                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                            </Text>
                        </View>
                        <View style={[styles.priorityBadge, { backgroundColor: priorityColor.bg }]}>
                            <Ionicons name={priorityColor.icon as any} size={10} color={priorityColor.text} />
                            <Text style={[styles.priorityText, { color: priorityColor.text }]}>
                                {project.priority.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.progressBadge}>
                        <Text style={styles.progressText}>{project.progress}%</Text>
                    </View>
                </View>
                <Text style={styles.projectTitle}>{project.name}</Text>
                {isOverdue && (
                    <View style={styles.overdueWarning}>
                        <Ionicons name="warning" size={14} color="#DC2626" />
                        <Text style={styles.overdueText}>
                            {daysRemaining < 0 ? 'Overdue' : `${daysRemaining} days remaining`}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <View style={[styles.iconContainer, { backgroundColor: statusColor.light }]}>
                        <Ionicons name="location" size={16} color={statusColor.bg} />
                    </View>
                    <Text style={styles.infoText} numberOfLines={2}>{project.address}</Text>
                </View>

                <View style={styles.infoRow}>
                    <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="person" size={16} color="#D97706" />
                    </View>
                    <Text style={styles.infoTextBold}>{project.assignedStaff}</Text>
                </View>

                <View style={styles.infoRow}>
                    <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
                        <Ionicons name="calendar" size={16} color="#7C3AED" />
                    </View>
                    <Text style={styles.infoText}>
                        {new Date(project.startDate).toLocaleDateString('en-IN')} - {new Date(project.endDate).toLocaleDateString('en-IN')}
                    </Text>
                </View>

                <View style={styles.budgetRow}>
                    <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
                        <Ionicons name="card" size={16} color="#10B981" />
                    </View>
                    <View style={styles.budgetInfo}>
                        <Text style={styles.budgetText}>
                            {formatCurrency(project.spent)} / {formatCurrency(project.budget)}
                        </Text>
                        <View style={styles.budgetProgressBar}>
                            <View style={[styles.budgetProgressFill, { 
                                width: `${Math.min(budgetProgress, 100)}%`,
                                backgroundColor: budgetProgress > 90 ? '#EF4444' : '#10B981'
                            }]} />
                        </View>
                    </View>
                </View>

                <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Project Progress</Text>
                        <Text style={[styles.progressValue, { color: statusColor.bg }]}>{project.progress}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { 
                            width: `${project.progress}%`,
                            backgroundColor: statusColor.bg 
                        }]} />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.viewButton, { backgroundColor: statusColor.bg }]}
                    onPress={() => onViewDetails(project)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.viewButtonText}>View Details</Text>
                    <Ionicons name="arrow-forward" size={16} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

// Main App Component
const Index: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>(dummyProjects);
    const router = useRouter();
    const companyInitials = generateInitials(COMPANY_CONFIG.name);

    // Calculate stats using useMemo for performance
    const projectStats = useMemo(() => calculateProjectStats(projects), [projects]);
    
    // Get current date for header
    const currentDate = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const handleViewDetails = (project: Project) => {
        router.push({
            pathname: '../details',
            params: {
                projectId: project.id.toString(),
                projectData: JSON.stringify(project)
            }
        });
    };

    // Sort projects by priority and progress
    const sortedProjects = useMemo(() => {
        return [...projects].sort((a, b) => {
            // First sort by priority
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0) return priorityDiff;
            
            // Then by status (active first)
            const statusOrder = { active: 3, planning: 2, completed: 1 };
            return statusOrder[b.status] - statusOrder[a.status];
        });
    }, [projects]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Enhanced Fixed Header */}
            <View style={styles.fixedHeader}>
                <View style={styles.userInfo}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{companyInitials}</Text>
                    </View>
                    <View style={styles.userDetails}>
                        <Text style={styles.userName}>{COMPANY_CONFIG.name}</Text>
                        <Text style={styles.userSubtitle}>{COMPANY_CONFIG.subtitle}</Text>
                        {/* <Text style={styles.dateText}>{currentDate}</Text> */}
                    </View>
                </View>
                <TouchableOpacity style={styles.notificationButton}
                    onPress={() => router.push('/notification')}
                >
                    <Ionicons name="notifications" size={22} color="#1F2937" />
                    {projectStats.overdueProjects > 0 && <View style={styles.notificationDot} />}
                </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView 
                style={styles.scrollableContent}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollableContentContainer}
            >
                {/* Enhanced Stats Section */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{projectStats.totalProjects}</Text>
                        <Text style={styles.statLabel}>Total Projects</Text>
                        <View style={styles.statIconContainer}>
                            <Ionicons name="briefcase" size={20} color="#0EA5E9" />
                        </View>
                    </View>
                    
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{projectStats.activeProjects}</Text>
                        <Text style={styles.statLabel}>Active</Text>
                        <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
                            <Ionicons name="flash" size={20} color="#D97706" />
                        </View>
                    </View>
                    
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{projectStats.completedProjects}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                        <View style={[styles.statIconContainer, { backgroundColor: '#D1FAE5' }]}>
                            <Ionicons name="checkmark-done" size={20} color="#10B981" />
                        </View>
                    </View>
                </View>

                {/* Additional Stats Row */}
                <View style={styles.additionalStatsContainer}>
                    <View style={styles.additionalStatCard}>
                        <Text style={styles.additionalStatNumber}>{projectStats.averageProgress}%</Text>
                        <Text style={styles.additionalStatLabel}>Avg Progress</Text>
                    </View>
                    <View style={styles.additionalStatCard}>
                        <Text style={styles.additionalStatNumber}>₹{(projectStats.totalBudget / 10000000).toFixed(1)}Cr</Text>
                        <Text style={styles.additionalStatLabel}>Total Budget</Text>
                    </View>
                    <View style={styles.additionalStatCard}>
                        <Text style={[styles.additionalStatNumber, projectStats.overdueProjects > 0 && { color: '#DC2626' }]}>
                            {projectStats.overdueProjects}
                        </Text>
                        <Text style={styles.additionalStatLabel}>Overdue</Text>
                    </View>
                </View>

                {/* Section Header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Projects</Text>
                    <View style={styles.sectionDivider} />
                </View>

                {/* Projects List */}
                <View style={styles.projectsContainer}>
                    {sortedProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onViewDetails={handleViewDetails}
                        />
                    ))}
                    
                    {/* Enhanced Footer */}
                    <View style={styles.footer}>
                        <View style={styles.footerBrand}>
                            <View style={styles.brandContainer}>
                                <View style={styles.brandIconContainer}>
                                    <Ionicons name="diamond" size={20} color="#FFFFFF" />
                                </View>
                                <View style={styles.brandTextContainer}>
                                    <Text style={styles.footerText}>Powered by</Text>
                                    <Text style={styles.exponentorText}>Exponentor</Text>
                                </View>
                            </View>
                            <Text style={styles.footerSubtext}>Professional Real Estate Development Solutions</Text>
                            <Text style={styles.footerVersion}>Version 2.1.0 • Built for Scale</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Index;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    fixedHeader: {
        backgroundColor: '#FFFFFF',
        paddingLeft: 24,
        paddingRight: 16,
        paddingTop: 16,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        backgroundColor: '#0EA5E9',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
        letterSpacing: -0.3,
    },
    userSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
        letterSpacing: 0.2,
        marginBottom: 2,
    },
    dateText: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '400',
        letterSpacing: 0.1,
    },
    notificationButton: {
        width: 44,
        height: 44,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        position: 'relative',
    },
    notificationDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        backgroundColor: '#EF4444',
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    scrollableContent: {
        flex: 1,
    },
    scrollableContentContainer: {
        paddingBottom: 24,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingTop: 24,
        gap: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        position: 'relative',
    },
    statIconContainer: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 36,
        height: 36,
        backgroundColor: '#E0F2FE',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statNumber: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 4,
        letterSpacing: -1,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        textAlign: 'center',
    },
    additionalStatsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingTop: 16,
        gap: 12,
    },
    additionalStatCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    additionalStatNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    additionalStatLabel: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    sectionHeader: {
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 20,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    sectionDivider: {
        width: 40,
        height: 3,
        backgroundColor: '#0EA5E9',
        borderRadius: 2,
    },
    projectsContainer: {
        paddingHorizontal: 24,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
    },
    overdueCard: {
        borderColor: '#FEE2E2',
        borderWidth: 2,
    },
    cardHeader: {
        padding: 20,
        backgroundColor: '#FAFBFC',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    cardHeaderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    priorityText: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    progressBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#374151',
    },
    projectTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: -0.3,
    },
    overdueWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        padding: 8,
        backgroundColor: '#FEE2E2',
        borderRadius: 8,
        gap: 6,
    },
    overdueText: {
        fontSize: 12,
        color: '#DC2626',
        fontWeight: '600',
    },
    cardBody: {
        padding: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    infoText: {
        fontSize: 14,
        color: '#6B7280',
        flex: 1,
        lineHeight: 20,
        fontWeight: '400',
    },
    infoTextBold: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
        flex: 1,
    },
    budgetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    budgetInfo: {
        flex: 1,
    },
    budgetText: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '600',
        marginBottom: 4,
    },
    budgetProgressBar: {
        height: 4,
        backgroundColor: '#F1F5F9',
        borderRadius: 2,
        overflow: 'hidden',
    },
    budgetProgressFill: {
        height: '100%',
        borderRadius: 2,
    },
    progressContainer: {
        marginTop: 20,
        marginBottom: 20,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    progressValue: {
        fontSize: 13,
        fontWeight: '700',
    },
    progressBar: {
        height: 6,
        backgroundColor: '#F1F5F9',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    viewButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
        letterSpacing: 0.3,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 40,
        marginTop: 20,
    },
    footerBrand: {
        alignItems: 'center',
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#1F2937',
        borderRadius: 16,
        shadowColor: '#1F2937',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    brandIconContainer: {
        width: 32,
        height: 32,
        backgroundColor: '#0EA5E9',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    brandTextContainer: {
        alignItems: 'flex-start',
    },
    footerText: {
        fontSize: 10,
        fontWeight: '500',
        color: '#9CA3AF',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    exponentorText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    footerSubtext: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        fontWeight: '500',
        letterSpacing: 0.2,
        marginBottom: 8,
    },
    footerVersion: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'center',
        fontWeight: '400',
        letterSpacing: 0.3,
    },
});