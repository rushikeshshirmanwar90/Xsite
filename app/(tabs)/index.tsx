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
    View,
    Image,
    TextInput
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
    image?: string; // Added image property
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
    subtitle: "Project Management"
};

// Enhanced dummy data with images
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
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
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
        image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
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
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
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
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
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
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
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
        image: "https://images.unsplash.com/photo-1577495508048-b635879837f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
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
            case 'active': return '#10B981';
            case 'planning': return '#F59E0B';
            case 'completed': return '#3B82F6';
            default: return '#6B7280';
        }
    };

    const statusColor = getStatusColor(project.status);
    const isOverdue = isProjectOverdue(project.endDate, project.progress);

    return (
        <TouchableOpacity 
            style={styles.projectCard}
            onPress={() => onViewDetails(project)}
            activeOpacity={0.9}
        >
            <View style={styles.cardImageContainer}>
                {project.image ? (
                    <Image 
                        source={{ uri: project.image }} 
                        style={styles.cardImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Ionicons name="business" size={40} color="#9CA3AF" />
                    </View>
                )}
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                    <Text style={styles.statusText}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </Text>
                </View>
                <TouchableOpacity style={styles.favoriteButton}>
                    <Ionicons name="heart-outline" size={20} color="white" />
                </TouchableOpacity>
            </View>

            <View style={styles.cardContent}>
                <Text style={styles.projectName} numberOfLines={1}>
                    {project.name}
                </Text>
                
                <Text style={styles.projectBudget}>
                    {formatCurrency(project.budget)}
                </Text>

                <View style={styles.addressRow}>
                    <Ionicons name="location-outline" size={14} color="#6B7280" />
                    <Text style={styles.projectAddress} numberOfLines={1}>
                        {project.address}
                    </Text>
                </View>

                <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Progress</Text>
                        <Text style={styles.progressValue}>{project.progress}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { 
                            width: `${project.progress}%`,
                            backgroundColor: statusColor 
                        }]} />
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.viewDetailsButton}
                    onPress={() => onViewDetails(project)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.viewDetailsText}>View Details</Text>
                    <Ionicons name="arrow-forward" size={16} color="#0EA5E9" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

// Main App Component
const Index: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>(dummyProjects);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const router = useRouter();
    const companyInitials = generateInitials(COMPANY_CONFIG.name);

    // Calculate stats using useMemo for performance
    const projectStats = useMemo(() => calculateProjectStats(projects), [projects]);

    const handleViewDetails = (project: Project) => {
        router.push({
            pathname: '../details',
            params: {
                projectId: project.id.toString(),
                projectData: JSON.stringify(project)
            }
        });
    };

    // Filter projects based on search query
    const filteredProjects = useMemo(() => {
        if (!searchQuery.trim()) {
            return projects;
        }
        return projects.filter(project =>
            project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.address.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [projects, searchQuery]);

    // Sort projects by priority and progress
    const sortedProjects = useMemo(() => {
        return [...filteredProjects].sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0) return priorityDiff;
            
            const statusOrder = { active: 3, planning: 2, completed: 1 };
            return statusOrder[b.status] - statusOrder[a.status];
        });
    }, [filteredProjects]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{companyInitials}</Text>
                    </View>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.companyName}>{COMPANY_CONFIG.name}</Text>
                        <Text style={styles.companySubtitle}>{COMPANY_CONFIG.subtitle}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.notificationButton}
                    onPress={() => router.push('/notification')}
                >
                    <Ionicons name="notifications-outline" size={24} color="#1F2937" />
                    {projectStats.overdueProjects > 0 && <View style={styles.notificationDot} />}
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search projects..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <TouchableOpacity style={styles.filterButton}>
                        <Ionicons name="options" size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            <ScrollView 
                style={styles.scrollableContent}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollableContentContainer}
            >
                {/* Stats Overview */}
                <View style={styles.statsOverview}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{projectStats.totalProjects}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{projectStats.activeProjects}</Text>
                        <Text style={styles.statLabel}>Active</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{projectStats.completedProjects}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{projectStats.averageProgress}%</Text>
                        <Text style={styles.statLabel}>Avg Progress</Text>
                    </View>
                </View>

                {/* Projects Grid */}
                <View style={styles.projectsGrid}>
                    {sortedProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onViewDetails={handleViewDetails}
                        />
                    ))}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.footerContent}>
                        <View style={styles.brandContainer}>
                            <View style={styles.brandIcon}>
                                <Ionicons name="diamond" size={16} color="white" />
                            </View>
                            <Text style={styles.brandText}>Powered by <Text style={styles.exponentorText}>Exponentor</Text></Text>
                        </View>
                        <Text style={styles.footerSubtext}>Professional Construction Management Solutions</Text>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        width: 44,
        height: 44,
        backgroundColor: '#0EA5E9',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    headerTextContainer: {
        flex: 1,
    },
    companyName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    companySubtitle: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    notificationButton: {
        width: 44,
        height: 44,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
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
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        marginLeft: 12,
    },
    filterButton: {
        padding: 4,
    },
    scrollableContent: {
        flex: 1,
    },
    scrollableContentContainer: {
        paddingBottom: 24,
    },
    statsOverview: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    projectsGrid: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    projectCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginHorizontal: 4,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
    },
    cardImageContainer: {
        height: 180,
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    favoriteButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardContent: {
        padding: 16,
    },
    projectName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    projectBudget: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0EA5E9',
        marginBottom: 8,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    projectAddress: {
        fontSize: 13,
        color: '#6B7280',
        marginLeft: 4,
        flex: 1,
    },
    progressContainer: {
        marginBottom: 16,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    progressLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    progressValue: {
        fontSize: 12,
        color: '#1F2937',
        fontWeight: '600',
    },
    progressBar: {
        height: 4,
        backgroundColor: '#F1F5F9',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    viewDetailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F8FAFC',
    },
    viewDetailsText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0EA5E9',
        marginRight: 6,
    },
    footer: {
        marginTop: 32,
        paddingHorizontal: 20,
        paddingVertical: 24,
        alignItems: 'center',
    },
    footerContent: {
        alignItems: 'center',
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    brandIcon: {
        width: 24,
        height: 24,
        backgroundColor: '#0EA5E9',
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    brandText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    exponentorText: {
        fontWeight: '700',
        color: '#1F2937',
    },
    footerSubtext: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
    },
});