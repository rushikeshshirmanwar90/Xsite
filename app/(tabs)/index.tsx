// App.tsx
import ProjectCard from '@/components/ProjectCard';
import { getClientId } from '@/functions/clientId';
import { getProjectData } from '@/functions/project';
import { domain } from '@/lib/domain';
import { generateInitials } from '@/lib/functions';
import { styles } from "@/style/adminHome";
import { Project } from '@/types/project';
import { StaffMembers } from '@/types/staff';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Main App Component
const Index: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [staffMembers, setStaffMembers] = useState<StaffMembers[]>([]);
    const [clientId, setClientId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch project data function
    const fetchProjectData = async (showLoadingState = true) => {
        try {
            if (showLoadingState) {
                setLoading(true);
            }
            setError(null);
            
            const clientId = await getClientId();
            setClientId(clientId);
            
            if (clientId) {
                const projectData = await getProjectData(clientId);
                setProjects(Array.isArray(projectData) ? projectData : []);
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
            setError('Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    };

    // Initial data fetch
    useEffect(() => {
        fetchProjectData();
    }, []);

    // Pull to refresh handler
    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchProjectData(false); // Don't show loading state during refresh
        } finally {
            setRefreshing(false);
        }
    };


    const router = useRouter();

    // Fetch project data

    // Fetch staff data
    useEffect(() => {
        const getStaffData = async () => {
            try {
                const res = await axios.get(`${domain}/api/staff`);
                const data = (res.data as any)?.data || [];
                const filterData = data.map((item: any) => {
                    return {
                        fullName: `${item.firstName} ${item.lastName}`,
                        _id: item._id,
                    }
                });
                setStaffMembers(filterData);
            } catch (error) {
                console.error('Failed to fetch staff data:', error);
            }
        };

        getStaffData();
    }, [clientId]);

    const handleViewDetails = (project: Project) => {
        console.log('Navigating to project with materials:', {
            projectId: project._id,
            materialAvailableCount: project.MaterialAvailable?.length || 0,
            materialUsedCount: project.MaterialUsed?.length || 0,
            sectionsCount: project.section?.length || 0
        });
        
        const sections = project.section || [];
        
        // If only one section, navigate directly to details
        if (sections.length === 1) {
            const section = sections[0];
            console.log('Single section found - navigating directly to details:', section.name);
            
            router.push({
                pathname: '/details',
                params: {
                    projectId: project._id ?? '',
                    projectName: project.name,
                    sectionId: section._id || section.sectionId,
                    sectionName: section.name,
                    materialAvailable: JSON.stringify(project.MaterialAvailable || []),
                    materialUsed: JSON.stringify(project.MaterialUsed || [])
                }
            });
        } else if (sections.length > 1) {
            // Multiple sections - show section selection page
            console.log('Multiple sections found - showing section selection');
            
            router.push({
                pathname: '/project-sections',
                params: { 
                    id: project._id ?? '',
                    name: project.name, 
                    sectionData: JSON.stringify(sections),
                    materialAvailable: JSON.stringify(project.MaterialAvailable || []),
                    materialUsed: JSON.stringify(project.MaterialUsed || [])
                }
            });
        } else {
            // No sections - show empty state or create section option
            console.log('No sections found - showing section selection with empty state');
            
            router.push({
                pathname: '/project-sections',
                params: { 
                    id: project._id ?? '',
                    name: project.name, 
                    sectionData: JSON.stringify([]),
                    materialAvailable: JSON.stringify(project.MaterialAvailable || []),
                    materialUsed: JSON.stringify(project.MaterialUsed || [])
                }
            });
        }
    };

    // Company configuration
    const COMPANY_CONFIG = {
        name: "Company Name",
        subtitle: "Project Management Dashboard"
    };
    const companyInitials = generateInitials(COMPANY_CONFIG.name);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <View style={styles.fixedHeader}>
                <View style={styles.userInfo}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{companyInitials}</Text>
                    </View>
                    <View style={styles.userDetails}>
                        <Text style={styles.userName}>{COMPANY_CONFIG.name}</Text>
                        <Text style={styles.userSubtitle}>{COMPANY_CONFIG.subtitle}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.notificationButton}
                    onPress={() => router.push('/notification')}
                >
                    <Ionicons name="notifications" size={22} color="#1F2937" />
                    {/* {projectStats.overdueProjects > 0 && <View style={styles.notificationDot} />} */}
                </TouchableOpacity>
            </View>


            {/* Section Header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My Projects</Text>
                <View style={styles.sectionDivider} />
            </View>

            <ScrollView 
                style={styles.projectsList}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#3B82F6']} // Android
                        tintColor="#3B82F6" // iOS
                        title="Pull to refresh"
                        titleColor="#64748B"
                    />
                }
            >
                {loading ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.loadingText}>Loading projects...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => fetchProjectData()}
                        >
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={{ marginBottom: 24 }} >
                        {projects && projects.length > 0 ? (
                            projects.map((project, index) => (
                                <View key={index} style={{ marginBottom: 10 }}  >
                                    <ProjectCard
                                        key={project._id}
                                        project={project}
                                        onViewDetails={handleViewDetails}
                                    />
                                </View>
                            ))
                        ) : (
                            <View style={styles.centerContainer}>
                                <Text style={styles.emptyText}>No projects found</Text>
                                <Text style={styles.emptySubText}>Tap &quot;Add Project&quot; to create your first project</Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default Index;