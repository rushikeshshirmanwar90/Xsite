import AddSectionModal from '@/components/AddSection';
import { domain } from '@/lib/domain';
import { ProjectSection } from '@/types/project';
import { logSectionCreated, logSectionDeleted, logSectionUpdated } from '@/utils/activityLogger';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

const ManageProject = () => {
    const params = useLocalSearchParams();
    const { id, name, sectionData } = params;

    // State management
    const [sections, setSections] = useState<ProjectSection[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingSection, setEditingSection] = useState<ProjectSection | null>(null);
    const [editSectionName, setEditSectionName] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Performance optimization
    const isLoadingRef = React.useRef(false);
    const lastLoadTimeRef = React.useRef<number>(0);
    const DEBOUNCE_DELAY = 500;

    // Initialize sections from params
    useEffect(() => {
        try {
            const parsedSections: ProjectSection[] = JSON.parse(
                Array.isArray(sectionData) ? sectionData[0] : sectionData
            );
            setSections(parsedSections || []);
        } catch (error) {
            console.error('Error parsing section data:', error);
            setSections([]);
        } finally {
            setLoading(false);
        }
    }, [sectionData]);

    // Fetch sections from server
    const fetchSections = async (showLoadingState = true) => {
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

            // Extract project ID if it's an array
            const projectId = Array.isArray(id) ? id[0] : id;

            console.log('Fetching sections for project:', projectId);
            console.log('API URL:', `${domain}/api/project/${projectId}`);

            const res = await axios.get(`${domain}/api/project/${projectId}`);
            const projectData = res.data as any;

            console.log('Project data received:', projectData);

            if (projectData && projectData.section) {
                console.log('Sections found:', projectData.section.length);
                setSections(projectData.section);
            } else if (projectData && Array.isArray(projectData)) {
                // If the response is an array, find the project
                const project = projectData.find((p: any) => p._id === projectId);
                if (project && project.section) {
                    console.log('Sections found in array:', project.section.length);
                    setSections(project.section);
                }
            } else {
                console.warn('No sections found in response');
                setSections([]);
            }
        } catch (error: any) {
            console.error('Error fetching sections:', error);
            console.error('Error response:', error?.response?.data);
            console.error('Error status:', error?.response?.status);

            // Don't show error toast if it's a 404 - just keep the existing sections
            if (error?.response?.status !== 404) {
                toast.error('Failed to load sections');
            } else {
                console.warn('Project not found (404), keeping existing sections');
            }
        } finally {
            isLoadingRef.current = false;
            setLoading(false);
        }
    };

    // Pull to refresh handler
    const onRefresh = async () => {
        // Prevent multiple refresh calls
        if (refreshing || isLoadingRef.current) {
            return;
        }

        setRefreshing(true);
        try {
            // Reset the refs to allow fetch
            isLoadingRef.current = false;
            lastLoadTimeRef.current = 0;

            await fetchSections(false);
        } catch (error) {
            console.error('Error refreshing:', error);
        } finally {
            setRefreshing(false);
        }
    };

    // Handle section deletion
    const handleDeleteSection = async (section: ProjectSection) => {
        Alert.alert(
            'Delete Section',
            `Are you sure you want to delete "${section.name}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        let loadingToast: any = null;
                        const sectionId = section._id || section.sectionId; // Define outside try block

                        try {
                            loadingToast = toast.loading('Deleting section...');
                            let endpoint = '';

                            console.log('========================================');
                            console.log('DELETING SECTION - DEBUG INFO');
                            console.log('========================================');
                            console.log('Full section object:', JSON.stringify(section, null, 2));
                            console.log('section._id:', section._id);
                            console.log('section.sectionId:', section.sectionId);
                            console.log('Extracted sectionId:', sectionId);
                            console.log('Section type:', section.type);
                            console.log('Project ID:', id);
                            console.log('========================================');

                            // Determine the correct API endpoint based on section type
                            if (section.type === 'Buildings') {
                                endpoint = `${domain}/api/building?projectId=${id}&sectionId=${sectionId}`;
                            } else if (section.type === 'rowhouse') {
                                endpoint = `${domain}/api/rowHouse?projectId=${id}&sectionId=${sectionId}`;
                            } else {
                                endpoint = `${domain}/api/otherSection?projectId=${id}&sectionId=${sectionId}`;
                            }

                            console.log('Delete endpoint:', endpoint);

                            const res = await axios.delete(endpoint);

                            console.log('Delete response:', res.data);

                            toast.dismiss(loadingToast);

                            // Check if response is successful
                            const responseData = res.data as any;
                            if (res.status === 200 || responseData?.message || responseData?.deletedRowHouse !== undefined || responseData?.deletedOtherSection !== undefined) {
                                toast.success('Section deleted successfully!');

                                // Log activity
                                logSectionDeleted(
                                    id as string,
                                    name as string,
                                    sectionId,
                                    section.name,
                                    'Section deleted by user'
                                );

                                // Remove the section from the list immediately (optimistic update)
                                setSections(prevSections => {
                                    const updated = prevSections.filter(s => {
                                        const currentId = s._id || s.sectionId;
                                        return currentId !== sectionId;
                                    });
                                    console.log('Sections after delete:', updated.length);
                                    return updated;
                                });

                                console.log('✅ Section removed from list');
                            } else {
                                throw new Error('Unexpected response from server');
                            }
                        } catch (error: any) {
                            if (loadingToast) {
                                toast.dismiss(loadingToast);
                            }

                            console.error('Error deleting section:', error);
                            console.error('Error response:', error?.response?.data);
                            console.error('Error status:', error?.response?.status);

                            let errorMessage = 'Failed to delete section';

                            if (error?.response?.status === 404) {
                                errorMessage = 'Section not found. It may have been already deleted.';
                                toast.warning(errorMessage);

                                // Remove from list anyway since it's not found
                                setSections(prevSections => {
                                    return prevSections.filter(s => {
                                        const currentId = s._id || s.sectionId;
                                        return currentId !== sectionId;
                                    });
                                });

                                return; // Exit early, don't show error toast
                            } else if (error?.response?.status === 500) {
                                errorMessage = 'Server error. The section may have been deleted.';

                                // Remove from list anyway
                                setSections(prevSections => {
                                    return prevSections.filter(s => {
                                        const currentId = s._id || s.sectionId;
                                        return currentId !== sectionId;
                                    });
                                });
                            } else if (error?.response?.data?.error) {
                                errorMessage = error.response.data.error;
                            } else if (error?.response?.data?.message) {
                                errorMessage = error.response.data.message;
                            } else if (error?.message) {
                                errorMessage = error.message;
                            }

                            toast.error(errorMessage);
                        }
                    }
                }
            ]
        );
    };

    // Handle section editing - Open modal
    const handleEditSection = (section: ProjectSection) => {
        setEditingSection(section);
        setEditSectionName(section.name);
        setShowEditModal(true);
    };

    // Handle section update - Submit
    const handleUpdateSection = async () => {
        if (!editSectionName || !editSectionName.trim()) {
            toast.error('Section name cannot be empty');
            return;
        }

        if (!editingSection) return;

        const newName = editSectionName.trim();
        const sectionId = editingSection._id || editingSection.sectionId;

        let loadingToast: any = null;

        try {
            loadingToast = toast.loading('Updating section...');

            let endpoint = '';
            let payload: any = { name: newName };

            console.log('========================================');
            console.log('UPDATING SECTION - DEBUG INFO');
            console.log('========================================');
            console.log('Full section object:', JSON.stringify(editingSection, null, 2));
            console.log('Section type:', editingSection.type);
            console.log('Section type (typeof):', typeof editingSection.type);
            console.log('Section type === "Buildings":', editingSection.type === 'Buildings');
            console.log('Section type === "rowhouse":', editingSection.type === 'rowhouse');
            console.log('Section type === "other":', editingSection.type === 'other');
            console.log('Section ID:', sectionId);
            console.log('New name:', newName);
            console.log('========================================');

            // Determine the correct API endpoint based on section type
            // Check exact type value with strict comparison
            if (editingSection.type === 'Buildings' || editingSection.type === 'building') {
                endpoint = `${domain}/api/building?id=${sectionId}`;
                console.log('✅ MATCHED: Building type');
                console.log('Building endpoint:', endpoint);
            } else if (editingSection.type === 'rowhouse' || editingSection.type === 'row house' || editingSection.type === 'Rowhouse') {
                // RowHouse API uses 'rh' parameter
                endpoint = `${domain}/api/rowHouse?rh=${sectionId}`;
                console.log('✅ MATCHED: Rowhouse type');
                console.log('Rowhouse endpoint:', endpoint);

                // Include totalHouses if it exists
                const sectionData = editingSection as any;
                if (sectionData.totalHouses) {
                    payload.totalHouses = sectionData.totalHouses;
                }
            } else {
                // OtherSection API uses 'rh' parameter
                endpoint = `${domain}/api/otherSection?rh=${sectionId}`;
                console.log('✅ MATCHED: Other section type (default)');
                console.log('Other section endpoint:', endpoint);
            }

            console.log('========================================');
            console.log('FINAL ENDPOINT:', endpoint);
            console.log('========================================');

            console.log('Payload:', payload);

            const res = await axios.put(endpoint, payload);

            console.log('Update response:', res.data);

            toast.dismiss(loadingToast);

            if (res.status === 200) {
                toast.success('Section updated successfully!');

                // Log activity
                logSectionUpdated(
                    id as string,
                    name as string,
                    sectionId,
                    newName,
                    [{
                        field: 'name',
                        oldValue: editingSection.name,
                        newValue: newName,
                    }]
                );

                // Update the section in the list immediately (optimistic update)
                setSections(prevSections => {
                    return prevSections.map(s => {
                        const currentId = s._id || s.sectionId;
                        if (currentId === sectionId) {
                            return { ...s, name: newName };
                        }
                        return s;
                    });
                });

                console.log('✅ Section updated in list');

                // Close modal
                setShowEditModal(false);
                setEditingSection(null);
                setEditSectionName('');
            }
        } catch (error: any) {
            if (loadingToast) {
                toast.dismiss(loadingToast);
            }

            console.error('Error updating section:', error);
            console.error('Error response:', error?.response?.data);
            console.error('Error status:', error?.response?.status);

            const errorMessage = error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to update section';
            toast.error(errorMessage);
        }
    };

    // Handle section addition
    const handleAddSection = async (type: string, title: string, totalHouses?: number) => {
        // Create the base payload
        const payload = {
            projectId: id,
            name: title
        }

        console.log('Adding section with payload:', payload);

        let loadingToast: any = null;

        try {
            loadingToast = toast.loading('Adding section...');
            let res;

            if (type === "building") {
                res = await axios.post(`${domain}/api/building`, payload);
                console.log('Building API response:', res.data);

                if (res && res.status === 200) {
                    toast.dismiss(loadingToast);
                    toast.success('Building added successfully!');
                }

            } else if (type === "rowhouse") {
                const rowhousePayload = {
                    ...payload,
                    totalHouses: totalHouses
                };

                res = await axios.post(`${domain}/api/rowHouse`, rowhousePayload);
                console.log('Rowhouse API response:', res.data);

                if (res && res.status === 200) {
                    toast.dismiss(loadingToast);
                    toast.success('Row house added successfully!');
                }
            } else {
                res = await axios.post(`${domain}/api/otherSection`, payload);
                console.log('Other section API response:', res.data);

                if (res && res.status === 200) {
                    toast.dismiss(loadingToast);
                    toast.success('Other section added successfully!');
                }
            }

            setShowAddModal(false);

            console.log('Section added successfully, full response:', JSON.stringify(res?.data, null, 2));

            // The API returns the section data directly or wrapped in a property
            // We need to extract it properly
            let newSectionData: any = null;

            if (res && res.data) {
                const responseData = res.data as any;
                // Check different possible response structures
                if (responseData._id || responseData.sectionId) {
                    // Direct section object
                    newSectionData = responseData;
                } else if (responseData.section) {
                    // Wrapped in 'section' property
                    newSectionData = responseData.section;
                } else if (responseData.data) {
                    // Wrapped in 'data' property
                    newSectionData = responseData.data;
                }
            }

            if (newSectionData && (newSectionData._id || newSectionData.sectionId)) {
                console.log('✅ Found new section data:', newSectionData);

                // Ensure the section has all required fields
                const formattedSection: ProjectSection = {
                    _id: newSectionData._id,
                    sectionId: newSectionData.sectionId || newSectionData._id,
                    name: newSectionData.name || title,
                    type: type === 'building' ? 'Buildings' : (type === 'rowhouse' ? 'rowhouse' : 'other'),
                    ...newSectionData
                };

                console.log('Adding formatted section to list:', formattedSection);

                // Log activity
                const sectionTypeName = type === 'building' ? 'Building' : (type === 'rowhouse' ? 'Row House' : 'Other Section');
                logSectionCreated(
                    id as string,
                    name as string,
                    formattedSection._id || formattedSection.sectionId,
                    title,
                    sectionTypeName
                );

                // Add the new section to the existing sections
                setSections(prevSections => {
                    const updated = [...prevSections, formattedSection];
                    console.log('Updated sections count:', updated.length);
                    return updated;
                });

                console.log('✅ Section added to list successfully');
            } else {
                // If we can't find section data in response, create it manually
                console.log('⚠️ No section data in response, creating manually...');

                const manualSection: ProjectSection = {
                    _id: `temp-${Date.now()}`, // Temporary ID
                    sectionId: `temp-${Date.now()}`,
                    name: title,
                    type: type === 'building' ? 'Buildings' : (type === 'rowhouse' ? 'rowhouse' : 'other'),
                };

                setSections(prevSections => [...prevSections, manualSection]);

                console.log('⚠️ Manual section added, will refresh from server...');

                // Wait and refresh from server to get the real data
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Force refresh from server
                isLoadingRef.current = false;
                lastLoadTimeRef.current = 0;

                await fetchSections(true);

                console.log('✅ Section list refreshed from server');
            }

        } catch (error: any) {
            if (loadingToast) {
                toast.dismiss(loadingToast);
            }

            console.error('Error adding section:', error);
            console.error('Error response:', error?.response?.data);

            const errorMessage = error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to add section. Please try again.';

            toast.error(errorMessage);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <View style={styles.HeadingInfo}>
                        <Text style={styles.headingTitle}>{name}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowAddModal(true)}
                >
                    <Ionicons name="add-circle" size={24} color="#1F2937" />
                    <Text style={styles.addButtonText}>Add Section</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
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
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Project Sections</Text>
                    <View style={styles.sectionDivider} />
                </View>

                {loading ? (
                    <View style={styles.centered}>
                        <View style={{ alignItems: 'center', marginBottom: 16 }}>
                            <Ionicons name="sync" size={48} color="#3B82F6" />
                        </View>
                        <Text style={styles.loadingText}>Loading sections...</Text>
                        <Text style={[styles.loadingText, { fontSize: 12, marginTop: 4, color: '#94A3B8' }]}>Please wait...</Text>
                    </View>
                ) : sections.length === 0 ? (
                    <View style={styles.centered}>
                        <Ionicons name="layers-outline" size={64} color="#CBD5E1" />
                        <Text style={styles.emptyTitle}>No sections found</Text>
                        <Text style={styles.emptySubtitle}>Tap "Add Section" to create your first section</Text>
                    </View>
                ) : (
                    sections.map((section, index) => (
                        <View key={section._id || index} style={styles.sectionCard}>
                            <View style={styles.sectionCardHeader}>
                                <View style={styles.sectionTypeTag}>
                                    <Text style={styles.sectionTypeText}>{section.type}</Text>
                                </View>
                                <View style={styles.sectionIdContainer}>
                                    <Text style={styles.sectionIdLabel}>Section ID:</Text>
                                    <Text style={styles.sectionIdValue}>{section.sectionId}</Text>
                                </View>
                            </View>

                            <View style={styles.sectionCardBody}>
                                <View style={styles.sectionIconContainer}>
                                    {section.type === "Buildings" && (
                                        <Ionicons name="business-outline" size={28} color="#3B82F6" />
                                    )}
                                    {section.type === 'rowhouse' && (
                                        <Ionicons name="home-outline" size={28} color="#10B981" />
                                    )}
                                    {section.type === 'other' && (
                                        <Ionicons name="layers-outline" size={28} color="#8B5CF6" />
                                    )}
                                </View>

                                <View style={styles.sectionDetails}>
                                    <Text style={styles.sectionName} numberOfLines={2}>{section.name}</Text>

                                    <View style={styles.actionButtonsRow}>
                                        <TouchableOpacity
                                            style={styles.viewMaterialsButton}
                                            onPress={() => {
                                                router.push({
                                                    pathname: '/details',
                                                    params: {
                                                        projectId: id,
                                                        projectName: name,
                                                        sectionId: section._id || section.sectionId,
                                                        sectionName: section.name,
                                                    }
                                                });
                                            }}
                                        >
                                            <Ionicons name="cube-outline" size={18} color="#3B82F6" />
                                            <Text style={styles.viewMaterialsText}>View Materials</Text>
                                        </TouchableOpacity>

                                        <View style={styles.actionButtons}>
                                            <TouchableOpacity
                                                style={styles.editButton}
                                                onPress={() => handleEditSection(section)}
                                            >
                                                <Ionicons name="create-outline" size={18} color="#F59E0B" />
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={styles.deleteButton}
                                                onPress={() => handleDeleteSection(section)}
                                            >
                                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Add Section Modal */}
            <AddSectionModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAddSection={handleAddSection}
                projectId={id as string}
            />

            {/* Edit Section Modal */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setShowEditModal(false);
                    setEditingSection(null);
                    setEditSectionName('');
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Section</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowEditModal(false);
                                    setEditingSection(null);
                                    setEditSectionName('');
                                }}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <Text style={styles.inputLabel}>Section Name</Text>
                            <TextInput
                                style={styles.input}
                                value={editSectionName}
                                onChangeText={setEditSectionName}
                                placeholder="Enter section name"
                                placeholderTextColor="#94A3B8"
                                autoFocus
                            />
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setShowEditModal(false);
                                    setEditingSection(null);
                                    setEditSectionName('');
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.updateButton}
                                onPress={handleUpdateSection}
                            >
                                <Text style={styles.updateButtonText}>Update</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default ManageProject;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        zIndex: 1000,
        marginBottom: 10
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    HeadingInfo: {
        flex: 1,
    },
    headingTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        marginBottom: 2,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addButtonText: {
        marginLeft: 4,
        fontWeight: '600',
        color: '#1F2937',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    sectionCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        backgroundColor: '#FAFBFC',
    },
    sectionTypeTag: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    sectionTypeText: {
        color: '#475569',
        fontWeight: '600',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    sectionIdLabel: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
    },
    sectionIdValue: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    sectionCardBody: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
        gap: 14,
    },
    sectionIconContainer: {
        width: 56,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sectionDetails: {
        flex: 1,
    },
    sectionName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 12,
        letterSpacing: 0.2,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    viewMaterialsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 6,
        flex: 1,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    viewMaterialsText: {
        color: '#3B82F6',
        fontWeight: '600',
        fontSize: 14,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    editButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#FFFBEB',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    deleteButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
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
    // Edit Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        width: '90%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    closeButton: {
        padding: 4,
    },
    modalBody: {
        padding: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1E293B',
        backgroundColor: '#F8FAFC',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748B',
    },
    updateButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: '#3B82F6',
    },
    updateButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
