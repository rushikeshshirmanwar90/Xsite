import AddProjectModal from '@/components/AddProjectModel';
import { getClientId } from '@/functions/clientId';
import { isAdmin, useUser } from '@/hooks/useUser';
import { useSimpleNotifications } from '@/hooks/useSimpleNotifications';
import { domain } from '@/lib/domain';
import { Project as BaseProject, ProjectSection } from '@/types/project';
import { StaffMembers } from '@/types/staff';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    FlatList,
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
    const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
    const router = useRouter();
    
    // Notification service
    const { sendProjectNotification } = useSimpleNotifications();
    
    // Loading animations for project operations
    const projectLoadingAnimation = useRef(new Animated.Value(0)).current;
    const deleteLoadingAnimation = useRef(new Animated.Value(0)).current;
    
    // Edit project state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingProject, setEditingProject] = useState<BaseProject | null>(null);
    const [editProjectName, setEditProjectName] = useState('');
    const [editProjectAddress, setEditProjectAddress] = useState('');
    const [editProjectBudget, setEditProjectBudget] = useState('');
    const [editProjectDescription, setEditProjectDescription] = useState('');
    const [editAssignedStaff, setEditAssignedStaff] = useState<StaffMembers[]>([]);
    const [updatingProject, setUpdatingProject] = useState(false);

    // Get user role for access control
    const { user, userType } = useUser();
    const userIsAdmin = isAdmin(user);

    // Performance optimization
    const isLoadingRef = React.useRef(false);
    const lastLoadTimeRef = React.useRef<number>(0);
    const DEBOUNCE_DELAY = 500;

    // Function to start project loading animation
    const startProjectLoadingAnimation = () => {
        setAddingProject(true);
        Animated.loop(
            Animated.timing(projectLoadingAnimation, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            })
        ).start();
    };

    // Function to stop project loading animation
    const stopProjectLoadingAnimation = () => {
        setAddingProject(false);
        projectLoadingAnimation.stopAnimation();
        projectLoadingAnimation.setValue(0);
    };

    // Function to start delete loading animation
    const startDeleteLoadingAnimation = (projectId: string) => {
        setDeletingProjectId(projectId);
        Animated.loop(
            Animated.timing(deleteLoadingAnimation, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            })
        ).start();
    };

    // Function to stop delete loading animation
    const stopDeleteLoadingAnimation = () => {
        setDeletingProjectId(null);
        deleteLoadingAnimation.stopAnimation();
        deleteLoadingAnimation.setValue(0);
    };

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

            const fetchedClientId = await getClientId();
            const clientId = fetchedClientId || '';
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
                const res = await axios.get(`${domain}/api/staff?clientId=${clientId}`);
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
            // Start loading animation
            startProjectLoadingAnimation();
            
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

                // Handle the actual API response structure: { success: true, data: { _id: ... } }
                let projectId = null;
                let projectData = null;

                if (createdProject.success && createdProject.data) {
                    // New API format: { success: true, data: { _id: ... } }
                    projectData = createdProject.data;
                    projectId = projectData._id;
                    console.log('✅ Using new API response format');
                } else if (createdProject.project) {
                    // Alternative format: { project: { _id: ... } }
                    projectData = createdProject.project;
                    projectId = projectData._id;
                    console.log('✅ Using project wrapper format');
                } else if (createdProject._id) {
                    // Direct format: { _id: ... }
                    projectData = createdProject;
                    projectId = createdProject._id;
                    console.log('✅ Using direct format');
                }

                const projectName = newProject.name;

                console.log('📦 Extracted project data:', projectData);
                console.log('📦 Extracted project ID:', projectId);
                console.log('📦 Project ID type:', typeof projectId);
                console.log('📦 Project ID valid?', !!projectId);

                // Validate project ID
                if (!projectId) {
                    console.error('❌ No project ID found in response');
                    console.error('❌ Full response:', JSON.stringify(res.data, null, 2));
                    Alert.alert('Error', 'Project created but ID not found. Please refresh and try again.');
                    return;
                }

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
                                    hasOnlyOneBuilding: newProject.hasOnlyOneBuilding,
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

                // Handle single building creation if checkbox was checked
                if (newProject.hasOnlyOneBuilding && projectId) {
                    console.log('🏢 Creating single building for project...');
                    
                    try {
                        const buildingPayload = {
                            projectId: projectId,
                            name: projectName, // Use same name as project
                            clientId: clientId
                        };

                        console.log('📤 Building payload:', buildingPayload);

                        const buildingResponse = await axios.post(`${domain}/api/building`, buildingPayload);
                        
                        console.log('✅ Building created successfully:', buildingResponse.data);

                        // Verify building was created
                        if (buildingResponse.status === 200 || buildingResponse.status === 201) {
                            console.log('✅ Building creation confirmed');

                            // Log building creation activity
                            if (userInfo) {
                                try {
                                    const buildingActivityPayload = {
                                        user: userInfo,
                                        clientId,
                                        projectId,
                                        projectName,
                                        activityType: 'section_created',
                                        category: 'section',
                                        action: 'create',
                                        description: `Created building "${projectName}" automatically`,
                                        message: 'Building created automatically for single-building project',
                                        date: new Date().toISOString(),
                                        metadata: {
                                            sectionType: 'Buildings',
                                            sectionName: projectName,
                                            autoCreated: true,
                                        },
                                    };

                                    await axios.post(`${domain}/api/activity`, buildingActivityPayload);
                                    console.log('✅ Building creation activity logged');
                                } catch (buildingActivityError: any) {
                                    console.error('❌ Error logging building creation activity:', buildingActivityError);
                                }
                            }

                            console.log('🏢 Single building created successfully');
                            
                            // Add a small delay to ensure database consistency
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        } else {
                            throw new Error(`Building creation failed with status: ${buildingResponse.status}`);
                        }
                    } catch (buildingError: any) {
                        console.error('❌ Error creating single building:', buildingError);
                        console.error('❌ Building error response:', buildingError?.response?.data);
                        console.error('❌ Building error status:', buildingError?.response?.status);
                        
                        // Show error and don't navigate if building creation fails
                        Alert.alert('Error', 'Failed to create building. Please try creating it manually from the project page.');
                        
                        // Still refresh the projects list and close modal
                        console.log('🔄 Refreshing projects list...');
                        await fetchProjectsData(false);
                        console.log('✅ Projects list refreshed');
                        setShowAddModal(false);
                        return; // Exit early, don't navigate
                    }
                }

                // 🔔 Send project creation notification
                try {
                    console.log('🔔 Sending project creation notification...');
                    const notificationSent = await sendProjectNotification({
                        projectId: projectId,
                        activityType: 'project_created',
                        staffName: userInfo?.fullName || 'Admin',
                        projectName: projectName,
                        details: `Created new project "${projectName}"${newProject.budget ? ` with budget ₹${Number(newProject.budget).toLocaleString('en-IN')}` : ''}`,
                        category: 'project',
                        message: newProject.description || undefined,
                    });

                    console.log('🔔 Project creation notification result:', notificationSent);
                    
                    if (notificationSent) {
                        console.log('✅ Project creation notification sent successfully');
                    } else {
                        console.log('⚠️ Project creation notification failed');
                    }
                } catch (notificationError: any) {
                    console.error('❌ Error sending project creation notification:', notificationError);
                    // Don't fail the whole operation if notification fails
                }

                // Now update UI after all operations are complete
                console.log('🔄 Refreshing projects list...');
                await fetchProjectsData(false);
                console.log('✅ Projects list refreshed');

                // Close modal
                setShowAddModal(false);
                
                // Navigate based on checkbox state
                if (newProject.hasOnlyOneBuilding) {
                    // Navigate directly to manage project page for single building projects
                    console.log('🔄 Navigating to manage project page...');
                    console.log('   - Project ID:', projectId);
                    console.log('   - Project Name:', projectName);
                    console.log('   - Project ID type:', typeof projectId);
                    console.log('   - Project ID length:', projectId?.length);
                    console.log('   - Client ID:', clientId);
                    
                    // Ensure projectId is a string
                    const projectIdString = String(projectId);
                    
                    Alert.alert('Success', 'Project and building created successfully!', [
                        {
                            text: 'OK',
                            onPress: () => {
                                console.log('🔄 Starting navigation...');
                                console.log('   - Using Project ID:', projectIdString);
                                console.log('   - Using Client ID:', clientId);
                                
                                try {
                                    // Ensure we have both required parameters
                                    if (!projectIdString || !clientId) {
                                        console.error('❌ Missing required navigation parameters');
                                        console.error('   - Project ID:', projectIdString);
                                        console.error('   - Client ID:', clientId);
                                        Alert.alert('Error', 'Missing required data for navigation. Please find your project in the list and tap "Add Details".');
                                        return;
                                    }

                                    router.push({
                                        pathname: '/manage_project/[id]',
                                        params: {
                                            id: projectIdString,
                                            name: projectName,
                                            sectionData: JSON.stringify([]), // Pass empty array to force fresh fetch
                                            clientId: clientId, // Ensure clientId is passed
                                            forceRefresh: 'true' // Add flag to indicate fresh data needed
                                        }
                                    });
                                    console.log('✅ Navigation initiated successfully');
                                } catch (navError) {
                                    console.error('❌ Navigation error:', navError);
                                    Alert.alert('Error', 'Failed to navigate to project page. Please find your project in the list and tap "Add Details".');
                                }
                            }
                        }
                    ]);
                } else {
                    // Show success message and stay on projects list for multi-section projects
                    Alert.alert('Success', 'Project added successfully!');
                }
            } else {
                console.error('Failed to add project: Unexpected response status');
                Alert.alert('Error', 'Failed to add project. Please try again.');
            }
        } catch (error) {
            console.error('Failed to add project:', error);
            Alert.alert('Error', 'Failed to add project. Please try again.');
        } finally {
            // Stop loading animation
            stopProjectLoadingAnimation();
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
                sectionData: JSON.stringify(sectionData || []),
                clientId: clientId // Ensure clientId is always passed
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
        // Set currently assigned staff
        setEditAssignedStaff(project.assignedStaff || []);
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

            // Track changes for activity logging
            const changedData: Array<{ field: string; oldValue: any; newValue: any }> = [];
            
            // Check for name change
            if (editProjectName.trim() !== editingProject.name) {
                changedData.push({
                    field: 'name',
                    oldValue: editingProject.name,
                    newValue: editProjectName.trim()
                });
            }
            
            // Check for address change
            if (editProjectAddress.trim() !== editingProject.address) {
                changedData.push({
                    field: 'address',
                    oldValue: editingProject.address,
                    newValue: editProjectAddress.trim()
                });
            }
            
            // Check for budget change
            const newBudget = Number(editProjectBudget);
            if (newBudget !== editingProject.budget) {
                changedData.push({
                    field: 'budget',
                    oldValue: editingProject.budget,
                    newValue: newBudget
                });
            }
            
            // Check for description change
            const newDescription = editProjectDescription.trim();
            const oldDescription = editingProject.description || '';
            if (newDescription !== oldDescription) {
                changedData.push({
                    field: 'description',
                    oldValue: oldDescription,
                    newValue: newDescription
                });
            }
            
            const updatePayload = {
                name: editProjectName.trim(),
                address: editProjectAddress.trim(),
                budget: newBudget,
                description: newDescription,
                assignedStaff: editAssignedStaff,
                clientId,
                user: userInfo // Include user info for activity logging
            };

            console.log('📝 Updating project:', editingProject._id, updatePayload);
            console.log('📊 Detected changes:', changedData);

            const response = await axios.put(
                `${domain}/api/project/${editingProject._id}`,
                updatePayload
            );

            console.log('✅ Project updated:', response.data);

            if (response.status === 200) {
                // Log project update activity if there were changes
                if (changedData.length > 0 && clientId && userInfo && editingProject._id) {
                    try {
                        console.log('🔄 Logging project update activity...');
                        
                        // Import the activity logger
                        const { logProjectUpdated } = await import('@/utils/activityLogger');
                        
                        await logProjectUpdated(
                            editingProject._id, // Now TypeScript knows this is not undefined
                            editProjectName.trim(), // Use new name
                            changedData,
                            `Project details updated by ${userInfo.fullName}`
                        );
                        
                        console.log('✅ Project update activity logged successfully');
                    } catch (activityError: any) {
                        console.error('❌ Error logging project update activity:', activityError);
                        // Don't fail the entire operation if activity logging fails
                    }
                }

                // Log staff assignment changes
                const originalStaff = editingProject.assignedStaff || [];
                const newStaff = editAssignedStaff;
                
                // Find newly assigned staff
                const addedStaff = newStaff.filter(staff => 
                    !originalStaff.some(original => original._id === staff._id)
                );
                
                // Find removed staff
                const removedStaff = originalStaff.filter(staff => 
                    !newStaff.some(newStaffMember => newStaffMember._id === staff._id)
                );

                console.log(`📊 Staff changes detected:`);
                console.log(`   - Added: ${addedStaff.length} staff members`);
                console.log(`   - Removed: ${removedStaff.length} staff members`);

                // Validate required data before logging activities
                if (!clientId) {
                    console.error('❌ Cannot log activities: clientId is missing');
                } else if (!userInfo) {
                    console.error('❌ Cannot log activities: userInfo is missing');
                } else if (!editingProject._id) {
                    console.error('❌ Cannot log activities: project ID is missing');
                } else {
                    // Log staff assignments
                    for (const staff of addedStaff) {
                        try {
                            console.log(`🔄 Logging staff assignment for: ${staff.fullName}`);

                            const staffPayload = {
                                user: userInfo,
                                clientId,
                                projectId: editingProject._id, // Now TypeScript knows this is not undefined
                                projectName: editProjectName.trim(),
                                activityType: 'staff_assigned',
                                category: 'staff',
                                action: 'assign',
                                description: `Assigned ${staff.fullName} to project "${editProjectName.trim()}"`,
                                message: 'Assigned during project update',
                                date: new Date().toISOString(),
                                metadata: {
                                    staffName: staff.fullName,
                                    staffId: staff._id,
                                    assignedDuring: 'project_update'
                                },
                            };

                            const response = await axios.post(`${domain}/api/activity`, staffPayload);
                            console.log(`✅ Staff assignment logged successfully: ${staff.fullName}`, response.status);
                        } catch (error: any) {
                            console.error(`❌ Error logging staff assignment for ${staff.fullName}:`, error);
                            // Don't fail the entire operation if activity logging fails
                        }
                    }

                    // Log staff removals
                    for (const staff of removedStaff) {
                        try {
                            console.log(`🔄 Logging staff removal for: ${staff.fullName}`);

                            const staffPayload = {
                                user: userInfo,
                                clientId,
                                projectId: editingProject._id, // Now TypeScript knows this is not undefined
                                projectName: editProjectName.trim(),
                                activityType: 'staff_removed',
                                category: 'staff',
                                action: 'remove',
                                description: `Removed ${staff.fullName} from project "${editProjectName.trim()}"`,
                                message: 'Removed during project update',
                                date: new Date().toISOString(),
                                metadata: {
                                    staffName: staff.fullName,
                                    staffId: staff._id,
                                    removedDuring: 'project_update'
                                },
                            };

                            const response = await axios.post(`${domain}/api/activity`, staffPayload);
                            console.log(`✅ Staff removal logged successfully: ${staff.fullName}`, response.status);
                        } catch (error: any) {
                            console.error(`❌ Error logging staff removal for ${staff.fullName}:`, error);
                            // Don't fail the entire operation if activity logging fails
                        }
                    }
                }

                // 🔔 Send project update notification
                try {
                    console.log('🔔 Sending project update notification...');
                    
                    // Create a summary of changes for the notification
                    let changesSummary = '';
                    if (changedData.length > 0) {
                        const changeDescriptions = changedData.map(change => {
                            switch (change.field) {
                                case 'name':
                                    return `Name: "${change.oldValue}" → "${change.newValue}"`;
                                case 'budget':
                                    return `Budget: ₹${Number(change.oldValue).toLocaleString('en-IN')} → ₹${Number(change.newValue).toLocaleString('en-IN')}`;
                                case 'address':
                                    return 'Address updated';
                                case 'description':
                                    return 'Description updated';
                                default:
                                    return `${change.field} changed`;
                            }
                        });
                        changesSummary = changeDescriptions.join(', ');
                    }

                    const notificationSent = await sendProjectNotification({
                        projectId: editingProject._id,
                        activityType: 'project_updated',
                        staffName: userInfo?.fullName || 'Admin',
                        projectName: editProjectName.trim(),
                        details: `Updated project "${editProjectName.trim()}"${changesSummary ? `: ${changesSummary}` : ''}`,
                        category: 'project',
                        message: changedData.length > 0 ? `${changedData.length} field${changedData.length > 1 ? 's' : ''} updated` : undefined,
                    });

                    console.log('🔔 Project update notification result:', notificationSent);
                    
                    if (notificationSent) {
                        console.log('✅ Project update notification sent successfully');
                    } else {
                        console.log('⚠️ Project update notification failed');
                    }
                } catch (notificationError: any) {
                    console.error('❌ Error sending project update notification:', notificationError);
                    // Don't fail the whole operation if notification fails
                }

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

            // Start delete loading animation
            startDeleteLoadingAnimation(project._id!);

            const response = await axios.delete(`${domain}/api/project/${project._id}`);

            console.log('✅ Project deleted:', response.data);

            if (response.status === 200) {
                // 🔔 Send project deletion notification
                try {
                    console.log('🔔 Sending project deletion notification...');
                    
                    // Get user data for notification
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

                    const notificationSent = await sendProjectNotification({
                        projectId: project._id,
                        activityType: 'project_deleted',
                        staffName: userInfo?.fullName || 'Admin',
                        projectName: project.name,
                        details: `Deleted project "${project.name}"`,
                        category: 'project',
                        message: 'Project and all associated data have been permanently removed',
                    });

                    console.log('🔔 Project deletion notification result:', notificationSent);
                    
                    if (notificationSent) {
                        console.log('✅ Project deletion notification sent successfully');
                    } else {
                        console.log('⚠️ Project deletion notification failed');
                    }
                } catch (notificationError: any) {
                    console.error('❌ Error sending project deletion notification:', notificationError);
                    // Don't fail the whole operation if notification fails
                }

                Alert.alert('Success', 'Project deleted successfully');
                await fetchProjectsData(false); // Refresh the list
            } else {
                throw new Error('Failed to delete project');
            }
        } catch (error: any) {
            console.error('❌ Error deleting project:', error);
            Alert.alert('Error', error?.response?.data?.message || 'Failed to delete project');
        } finally {
            // Stop delete loading animation
            stopDeleteLoadingAnimation();
        }
    };

    // Staff selection functions for edit modal
    const handleEditStaffSelection = (staff: StaffMembers) => {
        const isSelected = editAssignedStaff.some(member => member._id === staff._id);

        if (isSelected) {
            // Remove staff member
            setEditAssignedStaff(editAssignedStaff.filter(member => member._id !== staff._id));
        } else {
            // Add staff member
            setEditAssignedStaff([...editAssignedStaff, staff]);
        }
    };

    const isEditStaffSelected = (staff: StaffMembers) => {
        return editAssignedStaff.some(member => member._id === staff._id);
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
                        style={[styles.addButton, addingProject && styles.addButtonDisabled]}
                        onPress={() => setShowAddModal(true)}
                        activeOpacity={0.8}
                        disabled={addingProject}
                    >
                        <LinearGradient
                            colors={addingProject ? ['#9CA3AF', '#6B7280'] : ['#3B82F6', '#8B5CF6']}
                            style={styles.addButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {addingProject ? (
                                <Animated.View
                                    style={{
                                        transform: [{
                                            rotate: projectLoadingAnimation.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0deg', '360deg']
                                            })
                                        }]
                                    }}
                                >
                                    <Ionicons name="sync" size={22} color="white" />
                                </Animated.View>
                            ) : (
                                <Ionicons name="add-circle" size={22} color="white" />
                            )}
                            <Text style={styles.addButtonText}>
                                {addingProject ? 'Adding Project...' : 'Add New Project'}
                            </Text>
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
                                            style={[
                                                styles.deleteButton,
                                                deletingProjectId === project._id && styles.deleteButtonDisabled
                                            ]}
                                            onPress={() => handleDeleteProject(project)}
                                            disabled={deletingProjectId === project._id}
                                        >
                                            {deletingProjectId === project._id ? (
                                                <Animated.View
                                                    style={{
                                                        transform: [{
                                                            rotate: deleteLoadingAnimation.interpolate({
                                                                inputRange: [0, 1],
                                                                outputRange: ['0deg', '360deg']
                                                            })
                                                        }]
                                                    }}
                                                >
                                                    <Ionicons name="sync" size={18} color="#9CA3AF" />
                                                </Animated.View>
                                            ) : (
                                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                            )}
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

                        {/* Staff Assignment */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Assign Staff ({editAssignedStaff.length} selected)</Text>
                            <View style={styles.editStaffScrollableContainer}>
                                <ScrollView 
                                    style={styles.editStaffInnerScrollView}
                                    showsVerticalScrollIndicator={true}
                                    nestedScrollEnabled={true}
                                >
                                    {staffMembers.length > 0 ? (
                                        staffMembers.map((staff, index) => (
                                            <TouchableOpacity
                                                key={`${staff._id}-${index}`}
                                                style={styles.staffItem}
                                                onPress={() => handleEditStaffSelection(staff)}
                                                activeOpacity={0.7}
                                            >
                                                <View style={styles.staffItemContent}>
                                                    <View style={[
                                                        styles.checkbox,
                                                        isEditStaffSelected(staff) && styles.checkboxSelected
                                                    ]}>
                                                        {isEditStaffSelected(staff) && (
                                                            <Ionicons name="checkmark" size={18} color="#fff" />
                                                        )}
                                                    </View>
                                                    <View style={styles.staffInfo}>
                                                        <Text style={styles.staffName}>
                                                            {staff.fullName}
                                                        </Text>
                                                        <Text style={styles.staffStatus}>
                                                            {isEditStaffSelected(staff) ? 'Assigned' : 'Available'}
                                                        </Text>
                                                    </View>
                                                    <View style={[
                                                        styles.selectionIndicator,
                                                        isEditStaffSelected(staff) && styles.selectionIndicatorSelected
                                                    ]}>
                                                        <Ionicons
                                                            name={isEditStaffSelected(staff) ? "checkmark-circle" : "ellipse-outline"}
                                                            size={24}
                                                            color={isEditStaffSelected(staff) ? "#10B981" : "#D1D5DB"}
                                                        />
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        <View style={styles.noStaffContainer}>
                                            <Ionicons name="people-outline" size={32} color="#9CA3AF" />
                                            <Text style={styles.noStaffText}>No staff members available</Text>
                                            <Text style={styles.noStaffSubText}>Please add staff members first</Text>
                                        </View>
                                    )}
                                </ScrollView>
                            </View>
                            {staffMembers.length > 3 && (
                                <Text style={styles.scrollHint}>
                                    Scroll to see all {staffMembers.length} staff members
                                </Text>
                            )}
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
    addButtonDisabled: {
        shadowOpacity: 0.1,
        elevation: 2,
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
    deleteButtonDisabled: {
        backgroundColor: '#F3F4F6',
        borderColor: '#E5E7EB',
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
    editStaffScrollableContainer: {
        height: 200, // Fixed height for scrollable area
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        marginTop: 8,
        marginBottom: 8,
    },
    editStaffInnerScrollView: {
        flex: 1,
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
    // Staff Assignment Styles
    staffFlatListContent: {
        paddingVertical: 8,
        paddingHorizontal: 4,
        flexGrow: 1,
    },
    staffItem: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
        marginVertical: 4,
        marginHorizontal: 4,
    },
    staffItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    staffInfo: {
        flex: 1,
        gap: 2,
    },
    staffName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    staffStatus: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    selectionIndicator: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectionIndicatorSelected: {
        // Additional styling if needed
    },
    noStaffContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        paddingHorizontal: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    noStaffText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 12,
    },
    noStaffSubText: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 4,
        textAlign: 'center',
    },
    scrollHint: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
        fontStyle: 'italic',
    },
});

export default ProjectScreen;
