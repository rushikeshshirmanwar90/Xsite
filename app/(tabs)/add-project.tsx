import AddProjectModal from '@/components/AddProjectModel';
import { getClientId } from '@/functions/clientId';
import { domain } from '@/lib/domain';
import { Project as BaseProject, ProjectSection } from '@/types/project';
import { StaffMembers } from '@/types/staff';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';



const ProjectScreen: React.FC = () => {
    const [addingProject, setAddingProject] = useState(false);
    const [clientId, setClientId] = useState('');
    const [projects, setProjects] = useState<BaseProject[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [staffMembers, setStaffMembers] = useState<StaffMembers[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Fetch projects data
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const clientId = await getClientId();
                setClientId(clientId);
                const res = await axios.get(`${domain}/api/project?clientId=${clientId}`);
                setProjects(res.data);
            } catch (error) {
                console.error('Error fetching projects:', error);
                Alert.alert('Error', 'Failed to load projects');
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    // Fetch staff data
    useEffect(() => {
        const getStaffData = async () => {
            try {
                const res = await axios.get(`${domain}/api/staff`);
                const data = res.data.data;
                const filterData = data.map((item: any) => ({
                    fullName: `${item.firstName} ${item.lastName}`,
                    _id: item._id,
                }));
                setStaffMembers(filterData);
            } catch (error) {
                console.error('Error fetching staff:', error);
            }
        };

        getStaffData();
    }, [clientId]);
    const handleAddProject = async (newProject: BaseProject) => {
        try {
            setAddingProject(true);
            const clientId = await getClientId();
            const payload = {
                ...newProject,
                clientId,
            }

            const res = await axios.post(`${domain}/api/project`, payload);
            if (res) {
                setProjects(prev => [...prev, payload]);
                setShowAddModal(false);
                Alert.alert('Success', 'Project added successfully!');
            }
            console.error('Failed to add project:');
            Alert.alert('Error', 'Failed to add project. Please try again.');
        } finally {
            setAddingProject(false);
        }
    };

    const handleAddDetails = (projectId: string | undefined, name: string, sectionData: ProjectSection[] | undefined) => {
        if (!projectId) return;
        router.push({
            pathname: '/manage_project/[id]',
            params: { id: projectId, name: name, sectionData: JSON.stringify(sectionData) }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Manage All sites Projects</Text>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowAddModal(true)}
                >
                    <LinearGradient
                        colors={['#3B82F6', '#8B5CF6']}
                        style={styles.addButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="add" size={20} color="white" />
                        <Text style={styles.addButtonText}>Add New Project</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                {loading ? (
                    <View style={styles.centered}>
                        <Text>Loading projects...</Text>
                    </View>
                ) : projects.length === 0 ? (
                    <View style={styles.centered}>
                        <Text>No projects found</Text>
                    </View>
                ) : (
                    projects.map((project) => (
                        <View key={project._id} style={styles.projectCard}>
                            <View style={styles.projectInfo}>
                                <Text style={{ fontSize: 16, fontWeight: 600 }} >{project.name}</Text>
                                <Text style={styles.projectAddress} numberOfLines={1}>
                                    {project.address}
                                </Text>

                            </View>
                            <TouchableOpacity
                                style={styles.detailsButton}
                                onPress={() => project._id && handleAddDetails(project._id, project.name, project.section)}
                            >
                                <Text style={styles.detailsButtonText}>Add Details</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>

            <AddProjectModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddProject}
                staffMembers={staffMembers}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
    },
    addButton: {
        marginTop: 16,
    },
    addButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    addButtonText: {
        color: 'white',
        fontWeight: '500',
        marginLeft: 8,
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    projectCard: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    projectInfo: {
        flex: 1,
        marginRight: 12,
    },
    projectName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    projectAddress: {
        fontSize: 14,
        color: '#64748b',
    },
    detailsButton: {
        backgroundColor: '#e0f2fe',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    detailsButtonText: {
        color: '#0369a1',
        fontWeight: '500',
        fontSize: 14,
    },
});

export default ProjectScreen;
