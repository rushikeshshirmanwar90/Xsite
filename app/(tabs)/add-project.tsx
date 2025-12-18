import AddProjectModal from '@/components/AddProjectModel';
import { getClientId } from '@/functions/clientId';
import { isAdmin, useUser } from '@/hooks/useUser';
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
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    
    // Edit project state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingProject, setEditingProject] = useState<BaseProject | null>(null);
    const [editProjectName, setEditProjectName] = useState('');
    const [editProjectAddress, setEditProjectAddress] = useState('');
    const [editProjectBudget, setEditProjectBudget] = useState('');
    const [editProjectDescription, setEditProjectDescription] = useState('');
    const [updatingProject, setUpdatingProject] = useState(false);

    // Get user role for access control
    const { user, userType } = useUser();
    const userIsAdmin = isAdmin(user);

    // Performance optimization
    const isLoadingRef = React.useRef(false);
    const lastLoadTimeRef = React.useRef<number>(0);
    const DEBOUNCE_DELAY = 500;

    // Fetch projects data function (extracted for reuse)
    const fetchProjectsData = async (showLoadingState = true) => {
        // Prevent duplicate calls
        if (isLoadingRef.current) {
            console.log('⏸️ Skipping fetch - already loading');
            return;
        }

        // Debounce
        const now = Date.now();
        if (now - lastLoadTimeRef.current < DEBOUNCE_DELAY) {
            console.log('⏸️ Skipping fetch - debounced');
            return;
        }
        lastLoadTimeRef.current = now;

        try {
            isLoadingRef.current = true;
            if (showLoadingState) {
                setLoading(true);
            }

            const clientId = await getClientId();
            setClientId(clientId);

            console.log('📝 Fetching projects for clientId:', clientId);
            const res = await axios.get(`${domain}/api/project?clientId=${clientId}`);

            console.log('📦 API Response:', JSON.stringify(res.data, null, 2));

            // ✅ FIXED: Handle new response structure
            const responseData = res.data as any;
            if (responseData.success && responseData.data) {
                // Extract projects from nested structure
                const projectsArray = responseData.data.projects || [];
                console.log('✅ Projects extracted:', projectsArray.length);
                setProjects(Array.isArray(projectsArray) ? projectsArray : []);
            } else {
                // Fallback for old response format
                console.log('⚠️ Using fallback response parsing');
                setProjects(Array.isArray(res.data) ? res.data : []);
            }
        } catch (error) {
            console.error('❌ Error fetching projects:', error);
            Alert.alert('Error', 'Failed to load projects');
            setProjects([]); // Set empty array on error
        } finally {
            isLoadingRef.current = false;
            setLoading(false);
        }
    };

    // Fetch projects data on mount
    useEffect(() => {
        fetchProjectsData();
    }, []);

    // Pull to refresh handler
    const onRefresh = async () => {
        // Prevent multiple refresh calls
        if (refreshing || isLoadingRef.current) {
            return;
        }

        setRefreshing(true);
        try {
            await fetchProjectsData(false);
        } finally {
            setRefreshing(false);
        }
    };

    // Fetch staff data
    useEffect(() => {
        const getStaffData = async () => {
            try {
                const res = await axios.get(`${domain}/api/staff`);
                const data = (res.data as any)?.data || [];
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
            
            // Get user data from AsyncStorage for activity logging
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const userString = await AsyncStorage.getItem('user');
            let userInfo = null;
            
            if (userString) {
                const userData = JSON.parse(userString);
                userInfo = {
                    userId: userData._id || userData.id || userData.clientId || 'unknown',
                    fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.name || userData.username || 'Unknown User',
                    email: userData.email || undefined,
                };
            }
            
            const payload = {
                ...newProject,
                clientId,
                user: userInfo, // Include user info for activity logging
            };

            console.log('📝 Creating project with payload:', payload);

            const res = await axios.post(`${domain}/api/project`, payload);

            console.log('✅ Project created, response:', res.data);
            console.log('✅ Response status:', res.status);

            if (res.status === 200 || res.status === 201) {
                console.log('✅ Status check passed, proceeding...');

                // Extract project ID from response
                const createdProject = res.data as any;
                console.log('📦 Created project data:', createdProject);

                // The API returns { project: { _id: ... } } so we need to access project._id
                const projectData = createdProject?.project || createdProject;
                const projectId = projectData?._id || projectData?.id || projectData?.projectId || createdProject?._id;
                const projectName = newProject.name;

                console.log('📦 Extracted project data:', projectData);
                console.log('📦 Extracted project ID:', projectId);

                console.log('📝 Logging project creation activity...');
                console.log('   - Project ID:', projectId);
                console.log('   - Project Name:', projectName);
                console.log('   - Has projectId?', !!projectId);

                // Log the activity DIRECTLY with axios BEFORE UI updates
                if (projectId) {
                    console.log('✅ Project ID exists, proceeding with activity logging...');

                    try {
                        // Get user data from AsyncStorage
                        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                        const userString = await AsyncStorage.getItem('user');

                        if (userString) {
                            const userData = JSON.parse(userString);

                            // Build user object
                            const user = {
                                userId: userData._id || userData.id || userData.clientId || 'unknown',
                                fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.name || userData.username || 'Unknown User',
                                email: userData.email || undefined,
                            };

                            console.log('\n🔄 Calling Activity API directly with axios...');
                            console.log('User:', user);
                            console.log('Client ID:', clientId);
                            console.log('Project ID:', projectId);
                            console.log('Project Name:', projectName);

                            // Build activity payload
                            const activityPayload = {
                                user,
                                clientId,
                                projectId,
                                projectName,
                                activityType: 'project_created',
                                category: 'project',
                                action: 'create',
                                description: `Created project "${projectName}"`,
                                date: new Date().toISOString(),
                                metadata: {
                                    address: newProject.address,
                                    budget: newProject.budget,
                                    description: newProject.description,
                                },
                            };

                            console.log('\n📝 Activity Payload:');
                            console.log(JSON.stringify(activityPayload, null, 2));
                            console.log('\n🌐 Sending POST request to:', `${domain}/api/activity`);
                            console.log('🌐 Domain value:', domain);
                            console.log('🌐 Full URL:', `${domain}/api/activity`);
                            console.log('🌐 Request will be sent NOW...');

                            // DIRECT AXIOS CALL TO ACTIVITY API
                            console.log('⏳ Making axios.post call...');
                            const activityResponse = await axios.post(
                                `${domain}/api/activity`,
                                activityPayload
                            );
                            console.log('⏳ axios.post call completed!');

                            console.log('\n✅ SUCCESS! Activity API Response:');
                            console.log('Status:', activityResponse.status);
                            console.log('Data:', JSON.stringify(activityResponse.data, null, 2));

                            // Log staff assignments
                            if (newProject.assignedStaff && newProject.assignedStaff.length > 0) {
                                console.log('\n🔄 Logging staff assignments...');

                                for (const staff of newProject.assignedStaff) {
                                    try {
                                        const staffPayload = {
                                            user,
                                            clientId,
                                            projectId,
                                            projectName,
                                            activityType: 'staff_assigned',
                                            category: 'staff',
                                            action: 'assign',
                                            description: `Assigned ${staff.fullName} to project "${projectName}"`,
                                            message: 'Assigned during project creation',
                                            date: new Date().toISOString(),
                                            metadata: {
                                                staffName: staff.fullName,
                                            },
                                        };

                                        console.log(`\n📝 Logging staff: ${staff.fullName}`);

                                        const staffResponse = await axios.post(
                                            `${domain}/api/activity`,
                                            staffPayload
                                        );

                                        console.log(`✅ Staff assignment logged: ${staff.fullName}`, staffResponse.status);
                                    } catch (staffError: any) {
                                        console.error(`❌ Error logging staff ${staff.fullName}:`, staffError?.response?.data || staffError.message);
                                    }
                                }
                            }
                        } else {
                            console.warn('⚠️ No user data in AsyncStorage, skipping activity log');
                        }
                    } catch (activityError: any) {
                        console.error('\n========================================');
                        console.error('❌ ACTIVITY LOGGING FAILED');
                        console.error('========================================');
                        console.error('Error Type:', activityError?.name);
                        console.error('Error Message:', activityError?.message);
                        console.error('Error Stack:', activityError?.stack);

                        if (activityError?.response) {
                            console.error('\n📡 Server Response:');
                            console.error('  Status:', activityError.response.status);
                            console.error('  Status Text:', activityError.response.statusText);
                            console.error('  Data:', JSON.stringify(activityError.response.data, null, 2));
                            console.error('  Headers:', activityError.response.headers);
                        } else if (activityError?.request) {
                            console.error('\n📡 Network Error:');
                            console.error('  Request was made but no response received');
                            console.error('  Request:', activityError.request);
                        } else {
                            console.error('\n⚠️ Unknown Error:', activityError);
                        }
                        console.error('========================================\n');
                        // Don't fail the whole operation if activity logging fails
                    }
                } else {
                    console.warn('⚠️ Project ID not found in response, skipping activity log');
                    console.warn('⚠️ Response data:', JSON.stringify(createdProject, null, 2));
                    console.warn('⚠️ Checked fields: _id, id, projectId');
                }

                // Now update UI after activity logging is complete
                console.log('🔄 Refreshing projects list...');
                await fetchProjectsData(false);
                console.log('✅ Projects list refreshed');

                // Close modal and show success message
                setShowAddModal(false);
                Alert.alert('Success', 'Project added successfully!');
            } else {
                console.error('Failed to add project: Unexpected response status');
                Alert.alert('Error', 'Failed to add project. Please try again.');
            }
        } catch (error) {
            console.error('Failed to add project:', error);
            Alert.alert('Error', 'Failed to add project. Please try again.');
        } finally {
            setAddingProject(false);
        }
    };

    const handleAddDetails = (projectId: string | undefined, name: string, sectionData: ProjectSection[] | undefined) => {
        console.log("clicked add details", { projectId, name, sectionData });

        if (!projectId) {
            console.error('Project ID is missing');
            Alert.alert('Error', 'Project ID is missing. Please try again.');
            return;
        }

        router.push({
            pathname: '/manage_project/[id]',
            params: {
                id: projectId,
                name: name,
                sectionData: JSON.stringify(sectionData || [])
            }
        });
    };

    // Handle edit project
    const handleEditProject = (project: BaseProject) => {
        if (!userIsAdmin) {
            Alert.alert('Access Denied', 'Only admins can edit projects');
            return;
        }

        setEditingProject(project);
        setEditProjectName(project.name);
        setEditProjectAddress(project.address);
        setEditProjectBudget(project.budget?.toString() || '');
        setEditProjectDescription(project.description || '');
        setShowEditModal(true);
    };

    // Handle update project
    const handleUpdateProject = async () => {
        if (!editingProject || !userIsAdmin) {
            Alert.alert('Error', 'Invalid project or insufficient permissions');
            return;
        }

        if (!editProjectName.trim()) {
            Alert.alert('Error', 'Project name is required');
            return;
        }

        if (!editProjectAddress.trim()) {
            Alert.alert('Error', 'Project address is required');
            return;
        }

        if (!editProjectBudget.trim() || isNaN(Number(editProjectBudget))) {
            Alert.alert('Error', 'Valid budget is required');
            return;
        }

        setUpdatingProject(true);
        try {
            const clientId = await getClientId();
            
            // Get user data from AsyncStorage for activity logging
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const userString = await AsyncStorage.getItem('user');
            let userInfo = null;
            
            if (userString) {
                const userData = JSON.parse(userString);
                userInfo = {
                    userId: userData._id || userData.id || userData.clientId || 'unknown',
                    fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.name || userData.username || 'Unknown User',
                    email: userData.email || undefined,
                };
            }
            
            const updatePayload = {
                name: editProjectName.trim(),
                address: editProjectAddress.trim(),
                budget: Number(editProjectBudget),
                description: editProjectDescription.trim(),
                clientId,
                user: userInfo // Include user info for activity logging
            };

            console.log('📝 Updating project:', editingProject._id, updatePayload);

            const response = await axios.put(
                `${domain}/api/project/${editingProject._id}`,
                updatePayload
            );

            console.log('✅ Project updated:', response.data);

            if (response.status === 200) {
                Alert.alert('Success', 'Project updated successfully');
                setShowEditModal(false);
                await fetchProjectsData(false); // Refresh the list
            } else {
                throw new Error('Failed to update project');
            }
        } catch (error: any) {
            console.error('❌ Error updating project:', error);
            Alert.alert('Error', error?.response?.data?.message || 'Failed to update project');
        } finally {
            setUpdatingProject(false);
        }
    };

    // Handle delete project
    const handleDeleteProject = (project: BaseProject) => {
        if (!userIsAdmin) {
            Alert.alert('Access Denied', 'Only admins can delete projects');
            return;
        }

        Alert.alert(
            'Delete Project',
            `Are you sure you want to delete "${project.name}"?\n\nThis action cannot be undone and will remove all associated data including materials, sections, and activities.`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => confirmDeleteProject(project),
                },
            ]
        );
    };

    // Confirm delete project
    const confirmDeleteProject = async (project: BaseProject) => {
        try {
            console.log('🗑️ Deleting project:', project._id);

            const response = await axios.delete(`${domain}/api/project/${project._id}`);

            console.log('✅ Project deleted:', response.data);

            if (response.status === 200) {
                Alert.alert('Success', 'Project deleted successfully');
                await fetchProjectsData(false); // Refresh the list
            } else {
                throw new Error('Failed to delete project');
            }
        } catch (error: any) {
            console.error('❌ Error deleting project:', error);
            Alert.alert('Error', error?.response?.data?.message || 'Failed to delete project');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleSection}>
                    <Text style={styles.headerTitle}>Manage All sites Projects</Text>
                    <Text style={styles.headerSubtitle}>
                        {projects.length} project{projects.length !== 1 ? 's' : ''}
                    </Text>
                </View>

                {userIsAdmin && (
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setShowAddModal(true)}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#3B82F6', '#8B5CF6']}
                            style={styles.addButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="add-circle" size={22} color="white" />
                            <Text style={styles.addButtonText}>Add New Project</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {!userIsAdmin && (
                    <View style={styles.viewOnlyBanner}>
                        <Ionicons name="lock-closed-outline" size={16} color="#64748B" />
                        <Text style={styles.viewOnlyText}>View Only - Contact admin to add projects</Text>
                    </View>
                )}
            </View>

            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#3B82F6']}
                        tintColor="#3B82F6"
                        title="Pull to refresh"
                        titleColor="#64748b"
                    />
                }
            >
                {loading ? (
                    <View style={styles.centered}>
                        <View style={{ alignItems: 'center', marginBottom: 16 }}>
                            <Ionicons name="sync" size={48} color="#3B82F6" />
                        </View>
                        <Text style={styles.loadingText}>Loading projects...</Text>
                        <Text style={[styles.loadingText, { fontSize: 12, marginTop: 4, color: '#94A3B8' }]}>Please wait...</Text>
                    </View>
                ) : projects.length === 0 ? (
                    <View style={styles.centered}>
                        <Ionicons name="folder-open-outline" size={64} color="#CBD5E1" />
                        <Text style={styles.emptyTitle}>No projects found</Text>
                        <Text style={styles.emptySubtitle}>
                            {userIsAdmin
                                ? 'Tap "Add New Project" to get started'
                                : 'No projects available. Contact your admin to add projects.'}
                        </Text>
                    </View>
                ) : (
                    projects.map((project) => (
                        <View key={project._id} style={styles.projectCard}>
                            <View style={styles.projectInfo}>
                                <Text style={styles.projectName}>{project.name}</Text>
                                <Text style={styles.projectAddress} numberOfLines={1}>
                                    {project.address}
                                </Text>
                            </View>
                            
                            <View style={styles.projectActions}>
                                {/* Admin Controls */}
                                {userIsAdmin && (
                                    <View style={styles.adminActions}>
                                        <TouchableOpacity
                                            style={styles.editButton}
                                            onPress={() => handleEditProject(project)}
                                        >
                                            <Ionicons name="create-outline" size={18} color="#059669" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDeleteProject(project)}
                                        >
                                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                                
                                <TouchableOpacity
                                    style={styles.detailsButton}
                                    onPress={() => project._id && handleAddDetails(project._id, project.name, project.section)}
                                >
                                    <Text style={styles.detailsButtonText}>Add Details</Text>
                                </TouchableOpacity>
                            </View>
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

            {/* Edit Project Modal */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowEditModal(false)}>
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Edit Project</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView style={styles.modalContent}>
                        {/* Project Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Project Name *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={editProjectName}
                                onChangeText={setEditProjectName}
                                placeholder="Enter project name"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* Address */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Address *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={editProjectAddress}
                                onChangeText={setEditProjectAddress}
                                placeholder="Enter project address"
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={2}
                            />
                        </View>

                        {/* Budget */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Budget *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={editProjectBudget}
                                onChangeText={setEditProjectBudget}
                                placeholder="Enter project budget"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="numeric"
                            />
                        </View>

                        {/* Description */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Description</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                value={editProjectDescription}
                                onChangeText={setEditProjectDescription}
                                placeholder="Enter project description"
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={4}
                            />
                        </View>
                    </ScrollView>

                    {/* Modal Footer */}
                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowEditModal(false)}
                            disabled={updatingProject}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveButton, updatingProject && styles.saveButtonDisabled]}
                            onPress={handleUpdateProject}
                            disabled={updatingProject}
                        >
                            <Text style={styles.saveButtonText}>
                                {updatingProject ? 'Updating...' : 'Update Project'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    titleSection: {
        marginBottom: 16,
        gap: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    addButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    addButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 10,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 15,
        letterSpacing: 0.3,
    },
    viewOnlyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 8,
    },
    viewOnlyText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748B',
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
        minHeight: 300,
    },
    loadingText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    emptySubtitle: {
        marginTop: 8,
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
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
    projectActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    adminActions: {
        flexDirection: 'row',
        gap: 6,
    },
    editButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    deleteButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FECACA',
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
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1F2937',
        backgroundColor: '#FFFFFF',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    modalFooter: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    saveButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default ProjectScreen;
