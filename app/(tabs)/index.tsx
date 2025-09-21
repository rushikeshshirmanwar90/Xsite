// App.tsx
import AddProjectModal from '@/components/AddProjectModel';
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
    Alert,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';



// Main App Component
const Index: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [staffMembers, setStaffMembers] = useState<StaffMembers[]>([]);
    const [clientId, setClientId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [addingProject, setAddingProject] = useState(false);

    // !! fetching clientId
    useEffect(() => {
        const fetchProjectData = async () => {
            const clientId = await getClientId();
            setClientId(clientId)

            const res = await axios.get(`${domain}/api/project?clientId=${clientId}`);
            setProjects(res.data)
            setLoading(false)
        }
        fetchProjectData()
    }, [loading]);


    const router = useRouter();

    // Fetch project data

    // Fetch staff data
    useEffect(() => {
        const getStaffData = async () => {
            const res = await axios.get(`${domain}/api/staff`);
            const data = res.data.data;
            const filterData = data.map((item: any) => {
                return {
                    fullName: `${item.firstName} ${item.lastName}`,
                    _id: item._id,
                }
            })
            setStaffMembers(filterData);
        };

        getStaffData();
    }, [clientId]);

    const handleViewDetails = (project: Project) => {
        // Navigate to the details page outside the (tabs) group
        router.push({
            pathname: '../details',
            params: {
                projectId: project._id,
                projectData: JSON.stringify(project) // Pass entire project as string
            }
        });
    };

    const handleAddProject = async (newProject: Project) => {

        try {
            setAddingProject(true);


            const clientId = await getClientId();
            setClientId(clientId)
            const payload = {
                ...newProject,
                clientId
            }

            const res = await axios.post(`${domain}/api/project`, payload)
            if (res) {
                console.log("data added successfully")
            } else {
                console.log("something went wrong")
            }
            setProjects(prevProjects => [...prevProjects, payload]);

            // Close the modal
            setShowAddModal(false);

            Alert.alert('Success', 'Project added successfully!');
        } catch (error) {
            console.error('Failed to add project:', error);
            Alert.alert('Error', 'Failed to add project. Please try again.');
        } finally {
            setAddingProject(false);
        }
    };

    // Company configuration
    const COMPANY_CONFIG = {
        name: "Sharda Constructions",
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
                        {/* <Text style={styles.dateText}>{currentDate}</Text> */}
                    </View>
                </View>
                <TouchableOpacity style={styles.notificationButton}
                    onPress={() => router.push('/notification')}
                >
                    <Ionicons name="notifications" size={22} color="#1F2937" />
                    {/* {projectStats.overdueProjects > 0 && <View style={styles.notificationDot} />} */}
                </TouchableOpacity>
            </View>

            {/*             
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Construction Materials</Text>
                <Text style={styles.headerSubtitle}>Project Management</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowAddModal(true)}
                    disabled={addingProject}
                >
                    <LinearGradient
                        colors={['#3B82F6', '#8B5CF6']}
                        style={styles.addButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="add" size={20} color="white" />
                        <Text style={styles.addButtonText}>
                            {addingProject ? 'Adding...' : 'Add Project'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View> */}

            <ScrollView style={styles.projectsList}>
                {loading ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.loadingText}>Loading projects...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => {
                                if (clientId) {
                                    setError(null);
                                    setLoading(true);
                                    getProjectData(clientId)
                                        .then(res => {
                                            setProjects(Array.isArray(res) ? res : []);
                                            setError(null);
                                        })
                                        .catch(err => {
                                            console.error('Retry failed:', err);
                                            setError('Failed to fetch projects');
                                        })
                                        .finally(() => setLoading(false));
                                }
                            }}
                        >
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : projects && projects.length > 0 ? (
                    projects.map((project) => (
                        <ProjectCard
                            key={project._id}
                            project={project}
                            onViewDetails={handleViewDetails}
                        />
                    ))
                ) : (
                    <View style={styles.centerContainer}>
                        <Text style={styles.emptyText}>No projects found</Text>
                        <Text style={styles.emptySubText}>Tap &quot;Add Project&quot; to create your first project</Text>
                    </View>
                )}
            </ScrollView>

            <AddProjectModal
                staffMembers={staffMembers}
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddProject}
            />
        </SafeAreaView>
    );
};

export default Index;