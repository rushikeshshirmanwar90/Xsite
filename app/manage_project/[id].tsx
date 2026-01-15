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

interface BuildingDetails {
    totalFloors: number;
    totalBookedUnits: number;
    description: string;
    hasBasement: boolean;
    hasGroundFloor: boolean;
}

const ManageProject = () => {
    const params = useLocalSearchParams();
    const { id, name, sectionData } = params;

    // State management
    const [sections, setSections] = useState<ProjectSection[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [editingSection, setEditingSection] = useState<ProjectSection | null>(null);
    const [selectedSection, setSelectedSection] = useState<ProjectSection | null>(null);
    const [editSectionName, setEditSectionName] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Building details state
    const [buildingDetails, setBuildingDetails] = useState<BuildingDetails>({
        totalFloors: 0,
        totalBookedUnits: 0,
        description: '',
        hasBasement: false,
        hasGroundFloor: true
    });

    // Edit mode state
    const [isEditMode, setIsEditMode] = useState(false);
    const [hasExistingData, setHasExistingData] = useState(false);

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
            const responseData = res.data as any;

            console.log('Project data received:', responseData);

            // ✅ FIXED: Handle new response structure for single project
            let projectData: any = null;
            if (responseData.success && responseData.data) {
                // New format: { success: true, data: { project } }
                projectData = responseData.data;
                console.log('✅ Using new response format');
            } else {
                // Fallback for old format
                projectData = responseData;
                console.log('⚠️ Using fallback response format');
            }

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
                        const sectionId = section._id || section.sectionId;

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
                                await logSectionDeleted(
                                    id as string,
                                    name as string,
                                    sectionId,
                                    section.name
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

                                return;
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

    // Handle section details - Open details modal
    const handleSectionDetails = async (section: ProjectSection) => {
        console.log('🔍 DEBUG: Opening section details');
        console.log('Section data:', JSON.stringify(section, null, 2));
        
        setSelectedSection(section);
        setIsEditMode(false); // Reset to view mode
        
        // If it's a building, fetch existing details
        if (section.type === 'Buildings') {
            try {
                // Use sectionId for buildings (this is the actual building ID)
                const sectionId = section.sectionId || section._id;
                console.log('🔍 DEBUG: Fetching building details for ID:', sectionId);
                console.log('🌐 API URL:', `${domain}/api/building?id=${sectionId}`);
                
                const response = await axios.get(`${domain}/api/building?id=${sectionId}`);
                const responseData = response.data as any;
                
                console.log('📥 Building details response:', JSON.stringify(responseData, null, 2));
                
                if (responseData && responseData.success && responseData.data) {
                    const building = responseData.data;
                    
                    // Calculate the correct totalFloors from the floors array
                    // totalFloors should only count upper floors (floorNumber > 0)
                    let calculatedTotalFloors = building.totalFloors || 0;
                    if (building.floors && Array.isArray(building.floors)) {
                        const upperFloorsCount = building.floors.filter((f: any) => f.floorNumber > 0).length;
                        // If the database value doesn't match the actual count, use the actual count
                        if (upperFloorsCount !== building.totalFloors) {
                            console.log(`⚠️ Mismatch detected: DB has totalFloors=${building.totalFloors}, but actual upper floors=${upperFloorsCount}`);
                            console.log('🔧 Using actual count from floors array');
                            calculatedTotalFloors = upperFloorsCount;
                        }
                    }
                    
                    const details = {
                        totalFloors: calculatedTotalFloors,
                        totalBookedUnits: building.totalBookedUnits || 0,
                        description: building.description || '',
                        hasBasement: building.hasBasement || false,
                        hasGroundFloor: building.hasGroundFloor !== undefined ? building.hasGroundFloor : true
                    };
                    setBuildingDetails(details);
                    
                    console.log('✅ Building details loaded successfully');
                    console.log('📊 Calculated totalFloors:', calculatedTotalFloors);
                    console.log('📊 Has basement:', details.hasBasement);
                    console.log('📊 Has ground floor:', details.hasGroundFloor);
                    
                    // Check if data exists (at least one meaningful value)
                    const dataExists = details.totalFloors > 0 || details.description.trim() !== '' || 
                                      details.hasBasement || !details.hasGroundFloor;
                    setHasExistingData(dataExists);
                    
                    console.log('Has existing data:', dataExists);
                } else {
                    console.log('⚠️ No building data found, using defaults');
                    // Reset to defaults if no data found
                    setBuildingDetails({
                        totalFloors: 0,
                        totalBookedUnits: 0,
                        description: '',
                        hasBasement: false,
                        hasGroundFloor: true
                    });
                    setHasExistingData(false);
                    setIsEditMode(true); // Auto-enable edit mode if no data
                }
            } catch (error: any) {
                console.error('❌ Error fetching building details:', error);
                console.error('❌ Error response:', error?.response?.data);
                console.error('❌ Error status:', error?.response?.status);
                
                if (error?.response?.status === 404) {
                    console.error('🔍 Building not found in database. This building section exists but the building record is missing.');
                    toast.warning('Building record not found. You can create it by adding details.');
                }
                
                // Reset to defaults on error - the save function will create the building
                setBuildingDetails({
                    totalFloors: 0,
                    totalBookedUnits: 0,
                    description: '',
                    hasBasement: false,
                    hasGroundFloor: true
                });
                setHasExistingData(false);
                setIsEditMode(true); // Auto-enable edit mode on error
            }
        }
        
        setShowDetailsModal(true);
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
            console.log('Section ID:', sectionId);
            console.log('New name:', newName);
            console.log('========================================');

            // Determine the correct API endpoint based on section type
            if (editingSection.type === 'Buildings' || editingSection.type === 'building') {
                endpoint = `${domain}/api/building?id=${sectionId}`;
                console.log('✅ MATCHED: Building type');
            } else if (editingSection.type === 'rowhouse' || editingSection.type === 'row house' || editingSection.type === 'Rowhouse') {
                endpoint = `${domain}/api/rowHouse?rh=${sectionId}`;
                console.log('✅ MATCHED: Rowhouse type');

                const sectionData = editingSection as any;
                if (sectionData.totalHouses) {
                    payload.totalHouses = sectionData.totalHouses;
                }
            } else {
                endpoint = `${domain}/api/otherSection?rh=${sectionId}`;
                console.log('✅ MATCHED: Other section type');
            }

            console.log('FINAL ENDPOINT:', endpoint);
            console.log('Payload:', payload);

            const res = await axios.put(endpoint, payload);

            console.log('Update response:', res.data);

            toast.dismiss(loadingToast);

            if (res.status === 200) {
                toast.success('Section updated successfully!');

                // Log activity
                await logSectionUpdated(
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

                // Update the section in the list
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

    // Handle saving building details
    const handleSaveBuildingDetails = async () => {
        if (!selectedSection) return;

        let loadingToast: any = null;

        try {
            loadingToast = toast.loading('Saving building details and creating floors...');

            const sectionId = selectedSection.sectionId || selectedSection._id;
            
            console.log('🔍 DEBUG: Building save details');
            console.log('Selected section:', JSON.stringify(selectedSection, null, 2));
            console.log('Section ID:', sectionId);
            console.log('Building details:', JSON.stringify(buildingDetails, null, 2));
            
            // First save the building details
            const payload = {
                ...buildingDetails,
                clientId: 'unknown'
            };

            console.log('📤 API Payload:', JSON.stringify(payload, null, 2));
            console.log('🌐 API URL:', `${domain}/api/building?id=${sectionId}`);

            let response;
            
            try {
                response = await axios.put(`${domain}/api/building?id=${sectionId}`, payload);
                console.log('✅ Building updated successfully');
            } catch (updateError: any) {
                if (updateError?.response?.status === 404) {
                    console.log('🔄 Building not found, creating new building...');
                    
                    const createPayload = {
                        ...payload,
                        _id: sectionId,
                        name: selectedSection.name,
                        projectId: id
                    };
                    
                    console.log('📤 Create Payload:', JSON.stringify(createPayload, null, 2));
                    
                    response = await axios.post(`${domain}/api/building`, createPayload);
                    console.log('✅ Building created successfully');
                } else {
                    throw updateError;
                }
            }

            console.log('📥 API Response:', response.data);

            // Now create floors automatically using bulk API
            const floorsToCreate = [];

            if (buildingDetails.hasBasement) {
                floorsToCreate.push({
                    floorNumber: -1,
                    floorName: 'Basement',
                    floorType: 'Parking',
                    totalUnits: 0,
                    description: 'Basement floor for parking'
                });
            }

            if (buildingDetails.hasGroundFloor) {
                floorsToCreate.push({
                    floorNumber: 0,
                    floorName: 'Ground Floor',
                    floorType: 'Commercial',
                    totalUnits: 0,
                    description: 'Ground floor for commercial use'
                });
            }

            for (let i = 1; i <= buildingDetails.totalFloors; i++) {
                const floorName = i === 1 ? '1st Floor' : 
                                 i === 2 ? '2nd Floor' : 
                                 i === 3 ? '3rd Floor' : 
                                 `${i}th Floor`;
                
                floorsToCreate.push({
                    floorNumber: i,
                    floorName: floorName,
                    floorType: 'Residential',
                    totalUnits: 0,
                    description: `${floorName} - Residential units`
                });
            }

            // Check for existing floors and filter out duplicates
            let createdFloorsCount = 0;
            if (floorsToCreate.length > 0) {
                let existingFloors: any[] = [];
                try {
                    const existingFloorsResponse = await axios.get(`${domain}/api/floors?buildingId=${sectionId}`);
                    existingFloors = (existingFloorsResponse.data as any)?.data || [];
                    console.log(`📋 Found ${existingFloors.length} existing floors`);
                } catch (error) {
                    console.log('No existing floors found or error fetching them');
                    existingFloors = [];
                }

                // Filter out floors that already exist
                const newFloorsToCreate = floorsToCreate.filter(floor => {
                    const exists = existingFloors.some((f: any) => f.floorNumber === floor.floorNumber);
                    if (exists) {
                        console.log(`⏭️ Floor ${floor.floorName} already exists, skipping`);
                    } else {
                        console.log(`🔄 Creating floor: ${floor.floorName} (${floor.floorNumber})`);
                    }
                    return !exists;
                });

                console.log(`📋 Floors to create: ${newFloorsToCreate.length}`);

                // Create all new floors in bulk (single API call)
                if (newFloorsToCreate.length > 0) {
                    try {
                        console.log('🔄 Creating all floors in bulk...');
                        console.log('Bulk payload:', JSON.stringify({
                            buildingId: sectionId,
                            floors: newFloorsToCreate
                        }, null, 2));

                        const bulkResponse = await axios.post(`${domain}/api/floors`, {
                            buildingId: sectionId,
                            floors: newFloorsToCreate
                        });
                        
                        console.log('✅ Bulk floor creation response:', bulkResponse.data);
                        const responseData = bulkResponse.data as any;
                        createdFloorsCount = responseData?.data?.createdCount || newFloorsToCreate.length;
                        console.log(`📊 Floor creation summary: ${createdFloorsCount} created successfully`);
                    } catch (floorError: any) {
                        console.error('❌ Failed to create floors in bulk:', floorError);
                        console.error('Error details:', floorError?.response?.data);
                        // Continue even if floor creation fails
                    }
                } else {
                    console.log('ℹ️ No new floors to create - all floors already exist');
                }
            }

            toast.dismiss(loadingToast);

            if (response.status === 200 || response.status === 201) {
                if (createdFloorsCount > 0) {
                    toast.success(`Building details saved! Created ${createdFloorsCount} floors automatically.`);
                } else {
                    toast.success('Building details saved successfully!');
                }
                setIsEditMode(false);
                setHasExistingData(true);
                
                // Optionally refresh
                await fetchSections(false);
            }
        } catch (error: any) {
            if (loadingToast) {
                toast.dismiss(loadingToast);
            }

            console.error('❌ Error saving building details:', error);
            console.error('❌ Error response:', error?.response?.data);
            console.error('❌ Error status:', error?.response?.status);

            let errorMessage = 'Failed to save building details';
            
            if (error?.response?.status === 404) {
                errorMessage = 'Building not found and could not be created.';
            } else if (error?.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
        }
    };

    // Handle navigate to floors management
    const handleManageFloors = async () => {
        if (!selectedSection) return;

        const sectionId = selectedSection.sectionId || selectedSection._id;
        
        let loadingToast: any = null;

        try {
            // First, check if building has details and create floors if needed
            loadingToast = toast.loading('Preparing floors...');

            // Fetch current building details to check if floors exist
            let buildingData = null;
            try {
                const response = await axios.get(`${domain}/api/building?id=${sectionId}`);
                const responseData = response.data as any;
                if (responseData && responseData.success && responseData.data) {
                    buildingData = responseData.data;
                }
            } catch (error: any) {
                console.log('Building not found, will create floors based on current details');
            }

            // Check if building exists and get existing floors
            let existingFloors: any[] = [];
            if (buildingData) {
                existingFloors = buildingData.floors || [];
                console.log(`📋 Found ${existingFloors.length} existing floors`);
                
                // If floors already exist, just navigate without creating
                if (existingFloors.length > 0) {
                    console.log('✅ Floors already exist, skipping creation');
                    console.log('Existing floors:', existingFloors.map((f: any) => `${f.floorName} (${f.floorNumber})`).join(', '));
                    
                    toast.dismiss(loadingToast);
                    
                    // Navigate directly to floors page
                    setShowDetailsModal(false);
                    setSelectedSection(null);
                    
                    router.push({
                        pathname: '/building_floors/[id]',
                        params: { 
                            id: sectionId,
                            buildingName: selectedSection.name 
                        }
                    });
                    return; // Exit early - don't create floors
                }
            }

            // Prepare floors to create based on building data or current state
            const floorsToCreate = [];
            // IMPORTANT: Always use buildingDetails from state if we're in edit mode or if building data is incomplete
            // This ensures we use the latest values entered by the user even if not saved yet
            let sourceData = buildingData;
            
            // If building data doesn't have floor configuration, use current state
            if (!buildingData || (buildingData.totalFloors === 0 && !buildingData.hasBasement && buildingData.hasGroundFloor === undefined)) {
                sourceData = buildingDetails;
                console.log('⚠️ Building data incomplete or missing, using current state');
            } else if (buildingDetails.totalFloors > 0 || buildingDetails.hasBasement || !buildingDetails.hasGroundFloor) {
                // If user has modified values in the form, prefer those over saved data
                sourceData = buildingDetails;
                console.log('📝 Using current form state (user may have made changes)');
            }

            if (sourceData) {
                console.log('Building data source:', buildingData && sourceData === buildingData ? 'from API' : 'from state');
                console.log('Source data:', JSON.stringify(sourceData, null, 2));
                console.log('📊 Configuration: totalFloors=' + sourceData.totalFloors + ', hasBasement=' + sourceData.hasBasement + ', hasGroundFloor=' + sourceData.hasGroundFloor);

                // Create basement if enabled
                if (sourceData.hasBasement) {
                    floorsToCreate.push({
                        floorNumber: -1,
                        floorName: 'Basement',
                        floorType: 'Parking',
                        totalUnits: 0,
                        description: 'Basement floor for parking'
                    });
                    console.log('🔄 Creating floor: Basement (-1)');
                }

                // Create ground floor if enabled
                if (sourceData.hasGroundFloor) {
                    floorsToCreate.push({
                        floorNumber: 0,
                        floorName: 'Ground Floor',
                        floorType: 'Commercial',
                        totalUnits: 0,
                        description: 'Ground floor for commercial use'
                    });
                    console.log('🔄 Creating floor: Ground Floor (0)');
                }

                // Create upper floors
                const totalFloors = sourceData.totalFloors || 0;
                for (let i = 1; i <= totalFloors; i++) {
                    const floorName = i === 1 ? '1st Floor' : 
                                     i === 2 ? '2nd Floor' : 
                                     i === 3 ? '3rd Floor' : 
                                     `${i}th Floor`;
                    
                    floorsToCreate.push({
                        floorNumber: i,
                        floorName: floorName,
                        floorType: 'Residential',
                        totalUnits: 0,
                        description: `${floorName} - Residential units`
                    });
                    console.log(`🔄 Creating floor: ${floorName} (${i})`);
                }

                console.log(`📋 Floors to create: ${floorsToCreate.length}`);
                if (floorsToCreate.length > 0) {
                    console.log('Floors list:', floorsToCreate.map(f => `${f.floorName} (${f.floorNumber})`).join(', '));
                }

                // Create all floors using bulk API (single request)
                if (floorsToCreate.length > 0) {
                    try {
                        console.log('🔄 Creating all floors in bulk...');
                        console.log('Bulk payload:', JSON.stringify({
                            buildingId: sectionId,
                            floors: floorsToCreate
                        }, null, 2));

                        const bulkResponse = await axios.post(`${domain}/api/floors`, {
                            buildingId: sectionId,
                            floors: floorsToCreate
                        });
                        
                        console.log('✅ Bulk floor creation response:', bulkResponse.data);
                        
                        const responseData = bulkResponse.data as any;
                        const createdCount = responseData?.data?.createdCount || floorsToCreate.length;
                        
                        toast.dismiss(loadingToast);
                        toast.success(`Created ${createdCount} floors automatically!`);
                        
                        console.log(`📊 Floor creation summary: ${createdCount} created successfully`);
                    } catch (error: any) {
                        console.error('❌ Failed to create floors in bulk:', error);
                        console.error('Error details:', error?.response?.data);
                        console.error('Error status:', error?.response?.status);
                        console.error('Error message:', error?.message);
                        
                        toast.dismiss(loadingToast);
                        toast.error('Failed to create floors. Please try again.');
                    }
                } else {
                    toast.dismiss(loadingToast);
                    console.log('ℹ️ No new floors to create - all floors already exist');
                }
            } else {
                toast.dismiss(loadingToast);
                console.log('⚠️ No building data available to create floors');
            }

        } catch (error: any) {
            if (loadingToast) {
                toast.dismiss(loadingToast);
            }
            console.error('Error preparing floors:', error);
            // Continue to floors page even if floor creation fails
        }

        // Navigate to floors management page
        setShowDetailsModal(false);
        setSelectedSection(null);
        
        router.push({
            pathname: '/building_floors/[id]',
            params: { 
                id: sectionId,
                buildingName: selectedSection.name 
            }
        });
    };

    // Handle section addition
    const handleAddSection = async (type: string, title: string, totalHouses?: number) => {
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

            let newSectionData: any = null;

            if (res && res.data) {
                const responseData = res.data as any;
                if (responseData._id || responseData.sectionId) {
                    newSectionData = responseData;
                } else if (responseData.section) {
                    newSectionData = responseData.section;
                } else if (responseData.data) {
                    newSectionData = responseData.data;
                }
            }

            if (newSectionData && (newSectionData._id || newSectionData.sectionId)) {
                console.log('✅ Found new section data:', newSectionData);

                const formattedSection: ProjectSection = {
                    _id: newSectionData._id,
                    sectionId: newSectionData.sectionId || newSectionData._id,
                    name: newSectionData.name || title,
                    type: type === 'building' ? 'Buildings' : (type === 'rowhouse' ? 'rowhouse' : 'other'),
                    ...newSectionData
                };

                console.log('Adding formatted section to list:', formattedSection);

                await logSectionCreated(
                    id as string,
                    name as string,
                    formattedSection._id || formattedSection.sectionId,
                    title
                );

                setSections(prevSections => {
                    const updated = [...prevSections, formattedSection];
                    console.log('Updated sections count:', updated.length);
                    return updated;
                });

                console.log('✅ Section added to list successfully');
            } else {
                console.log('⚠️ No section data in response, creating manually...');

                const manualSection: ProjectSection = {
                    _id: `temp-${Date.now()}`,
                    sectionId: `temp-${Date.now()}`,
                    name: title,
                    type: type === 'building' ? 'Buildings' : (type === 'rowhouse' ? 'rowhouse' : 'other'),
                };

                setSections(prevSections => [...prevSections, manualSection]);

                console.log('⚠️ Manual section added, will refresh from server...');

                await new Promise(resolve => setTimeout(resolve, 1000));

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

    // Render Building Details View Mode
    const renderBuildingDetailsView = () => (
        <ScrollView 
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={true}
            style={{ flex: 1 }}
            bounces={true}
        >
            {/* Floor Summary Section */}
            <View style={styles.viewSection}>
                <Text style={styles.viewSectionTitle}>Floor Configuration</Text>
                <View style={styles.floorSummaryView}>
                    {buildingDetails.hasBasement && (
                        <View style={styles.floorSummaryItemView}>
                            <View style={styles.floorIconContainer}>
                                <Ionicons name="arrow-down" size={20} color="#3B82F6" />
                            </View>
                            <View style={styles.floorInfoView}>
                                <Text style={styles.floorNameView}>Basement</Text>
                                <Text style={styles.floorTypeView}>Parking</Text>
                            </View>
                        </View>
                    )}
                    {buildingDetails.hasGroundFloor && (
                        <View style={styles.floorSummaryItemView}>
                            <View style={styles.floorIconContainer}>
                                <Ionicons name="storefront" size={20} color="#10B981" />
                            </View>
                            <View style={styles.floorInfoView}>
                                <Text style={styles.floorNameView}>Ground Floor</Text>
                                <Text style={styles.floorTypeView}>Commercial</Text>
                            </View>
                        </View>
                    )}
                    {Array.from({length: buildingDetails.totalFloors}, (_, i) => {
                        const floorNum = i + 1;
                        const floorName = floorNum === 1 ? '1st' : floorNum === 2 ? '2nd' : floorNum === 3 ? '3rd' : `${floorNum}th`;
                        return (
                            <View key={i} style={styles.floorSummaryItemView}>
                                <View style={styles.floorIconContainer}>
                                    <Ionicons name="home" size={20} color="#8B5CF6" />
                                </View>
                                <View style={styles.floorInfoView}>
                                    <Text style={styles.floorNameView}>{floorName} Floor</Text>
                                    <Text style={styles.floorTypeView}>Residential</Text>
                                </View>
                            </View>
                        );
                    })}
                    {!buildingDetails.hasBasement && !buildingDetails.hasGroundFloor && buildingDetails.totalFloors === 0 && (
                        <Text style={styles.noDataText}>No floors configured yet</Text>
                    )}
                </View>
            </View>

            {/* Description Section */}
            {buildingDetails.description && (
                <View style={styles.viewSection}>
                    <Text style={styles.viewSectionTitle}>Description</Text>
                    <Text style={styles.descriptionText}>{buildingDetails.description}</Text>
                </View>
            )}

            {/* Total Floors Count */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Ionicons name="layers-outline" size={24} color="#3B82F6" />
                    <Text style={styles.statValue}>
                        {(buildingDetails.hasBasement ? 1 : 0) + 
                         (buildingDetails.hasGroundFloor ? 1 : 0) + 
                         buildingDetails.totalFloors}
                    </Text>
                    <Text style={styles.statLabel}>Total Floors</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="business-outline" size={24} color="#10B981" />
                    <Text style={styles.statValue}>{buildingDetails.totalFloors}</Text>
                    <Text style={styles.statLabel}>Upper Floors</Text>
                </View>
            </View>

            {/* Manage Floors Button */}
            <View style={styles.manageFloorsSection}>
                <View style={styles.manageFloorsInfo}>
                    <Ionicons name="information-circle-outline" size={16} color="#3B82F6" />
                    <Text style={styles.manageFloorsInfoText}>
                        Floors will be created automatically based on your configuration above
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.manageFloorsButton}
                    onPress={handleManageFloors}
                >
                    <Ionicons name="layers-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.manageFloorsText}>Manage Floors & Units</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    // Render Building Details Edit Mode
    const renderBuildingDetailsEdit = () => (
        <ScrollView 
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={true}
            style={{ flex: 1 }}
            bounces={true}
        >
            {/* Info message for new buildings */}
            {!hasExistingData && (
                <View style={styles.infoMessage}>
                    <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
                    <Text style={styles.infoMessageText}>
                        Configure your building details below, or skip to directly manage floors and units.
                    </Text>
                </View>
            )}

            {/* Floor Configuration */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Floor Configuration</Text>
                
                {/* Basement Checkbox */}
                <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setBuildingDetails(prev => ({ ...prev, hasBasement: !prev.hasBasement }))}
                >
                    <View style={[styles.checkbox, buildingDetails.hasBasement && styles.checkboxChecked]}>
                        {buildingDetails.hasBasement && (
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        )}
                    </View>
                    <Text style={styles.checkboxLabel}>Include Basement</Text>
                </TouchableOpacity>

                {/* Ground Floor Checkbox */}
                <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setBuildingDetails(prev => ({ ...prev, hasGroundFloor: !prev.hasGroundFloor }))}
                >
                    <View style={[styles.checkbox, buildingDetails.hasGroundFloor && styles.checkboxChecked]}>
                        {buildingDetails.hasGroundFloor && (
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        )}
                    </View>
                    <Text style={styles.checkboxLabel}>Include Ground Floor</Text>
                </TouchableOpacity>
            </View>

            {/* Total Floors */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Number of Upper Floors</Text>
                <TextInput
                    style={styles.input}
                    value={buildingDetails.totalFloors.toString()}
                    onChangeText={(text) => setBuildingDetails(prev => ({ ...prev, totalFloors: parseInt(text) || 0 }))}
                    placeholder="Enter number of floors above ground"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                />
                <Text style={styles.inputHint}>
                    This will create floors: {buildingDetails.totalFloors > 0 ? 
                        Array.from({length: buildingDetails.totalFloors}, (_, i) => {
                            const floorNum = i + 1;
                            return floorNum === 1 ? '1st' : floorNum === 2 ? '2nd' : floorNum === 3 ? '3rd' : `${floorNum}th`;
                        }).join(', ') + ' Floor' + (buildingDetails.totalFloors > 1 ? 's' : '')
                        : 'No upper floors'
                    }
                </Text>
            </View>

            {/* Floor Summary */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Floor Summary</Text>
                <View style={styles.floorSummary}>
                    {buildingDetails.hasBasement && (
                        <View style={styles.floorSummaryItem}>
                            <Ionicons name="arrow-down" size={16} color="#6B7280" />
                            <Text style={styles.floorSummaryText}>Basement (Parking)</Text>
                        </View>
                    )}
                    {buildingDetails.hasGroundFloor && (
                        <View style={styles.floorSummaryItem}>
                            <Ionicons name="storefront" size={16} color="#6B7280" />
                            <Text style={styles.floorSummaryText}>Ground Floor (Commercial)</Text>
                        </View>
                    )}
                    {Array.from({length: buildingDetails.totalFloors}, (_, i) => {
                        const floorNum = i + 1;
                        const floorName = floorNum === 1 ? '1st' : floorNum === 2 ? '2nd' : floorNum === 3 ? '3rd' : `${floorNum}th`;
                        return (
                            <View key={i} style={styles.floorSummaryItem}>
                                <Ionicons name="home" size={16} color="#6B7280" />
                                <Text style={styles.floorSummaryText}>{floorName} Floor (Residential)</Text>
                            </View>
                        );
                    })}
                    {!buildingDetails.hasBasement && !buildingDetails.hasGroundFloor && buildingDetails.totalFloors === 0 && (
                        <Text style={styles.noFloorsText}>No floors configured</Text>
                    )}
                </View>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={buildingDetails.description}
                    onChangeText={(text) => setBuildingDetails(prev => ({ ...prev, description: text }))}
                    placeholder="Enter building description"
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={4}
                />
            </View>

            {/* Manage Floors Button - Also available in edit mode */}
            <View style={styles.manageFloorsSection}>
                <View style={styles.manageFloorsInfo}>
                    <Ionicons name="information-circle-outline" size={16} color="#3B82F6" />
                    <Text style={styles.manageFloorsInfoText}>
                        Floors will be created automatically when you save or navigate to floor management
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.manageFloorsButton}
                    onPress={handleManageFloors}
                >
                    <Ionicons name="layers-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.manageFloorsText}>Manage Floors & Units</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

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
                                            style={styles.addDetailsButton}
                                            onPress={() => handleSectionDetails(section)}
                                        >
                                            <Ionicons name="settings-outline" size={18} color="#3B82F6" />
                                            <Text style={styles.addDetailsText}>
                                                {section.type === 'Buildings' ? 'Building Details' : 'Add Details'}
                                            </Text>
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

            {/* Edit Section Name Modal */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setShowEditModal(false);
                    setEditingSection(null);
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: 'auto', maxHeight: 300 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Section Name</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowEditModal(false);
                                    setEditingSection(null);
                                }}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.modalBody, { paddingHorizontal: 20, paddingVertical: 20 }]}>
                            <Text style={styles.inputLabel}>Section Name</Text>
                            <TextInput
                                style={styles.input}
                                value={editSectionName}
                                onChangeText={setEditSectionName}
                                placeholder="Enter section name"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setShowEditModal(false);
                                    setEditingSection(null);
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

            {/* Building Details Modal */}
            <Modal
                visible={showDetailsModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setShowDetailsModal(false);
                    setSelectedSection(null);
                    setIsEditMode(false);
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {selectedSection?.type === 'Buildings' ? 'Building Details' : 'Section Details'}
                            </Text>
                            <View style={styles.headerActions}>
                                {/* Edit Button - Only show in view mode when data exists */}
                                {selectedSection?.type === 'Buildings' && !isEditMode && hasExistingData && (
                                    <TouchableOpacity
                                        onPress={() => setIsEditMode(true)}
                                        style={styles.editModeButton}
                                    >
                                        <Ionicons name="create-outline" size={20} color="#3B82F6" />
                                        <Text style={styles.editModeButtonText}>Edit</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowDetailsModal(false);
                                        setSelectedSection(null);
                                        setIsEditMode(false);
                                    }}
                                    style={styles.closeButton}
                                >
                                    <Ionicons name="close" size={24} color="#64748B" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.modalBody}>
                            {selectedSection?.type === 'Buildings' ? (
                                <>
                                    {!isEditMode && hasExistingData ? renderBuildingDetailsView() : renderBuildingDetailsEdit()}
                                </>
                            ) : (
                                <ScrollView 
                                    contentContainerStyle={styles.modalScrollContent}
                                    showsVerticalScrollIndicator={true}
                                    style={{ flex: 1 }}
                                    bounces={true}
                                >
                                    <View style={styles.comingSoonContainer}>
                                        <Ionicons name="construct-outline" size={64} color="#94A3B8" />
                                        <Text style={styles.comingSoonTitle}>Coming Soon</Text>
                                        <Text style={styles.comingSoonText}>
                                            Details management for {selectedSection?.type} sections will be available in a future update.
                                        </Text>
                                    </View>
                                </ScrollView>
                            )}
                        </View>

                        {selectedSection?.type === 'Buildings' && isEditMode && (
                            <View style={styles.modalFooter}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => {
                                        if (hasExistingData) {
                                            setIsEditMode(false);
                                        } else {
                                            setShowDetailsModal(false);
                                            setSelectedSection(null);
                                        }
                                    }}
                                >
                                    <Text style={styles.cancelButtonText}>
                                        {hasExistingData ? 'Cancel' : 'Close'}
                                    </Text>
                                </TouchableOpacity>

                                {!hasExistingData && (
                                    <TouchableOpacity
                                        style={styles.skipButton}
                                        onPress={handleManageFloors}
                                    >
                                        <Text style={styles.skipButtonText}>Skip & Manage Floors</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={styles.saveButton}
                                    onPress={handleSaveBuildingDetails}
                                >
                                    <Text style={styles.saveButtonText}>Save Details</Text>
                                </TouchableOpacity>
                            </View>
                        )}
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
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        width: '95%',
        maxWidth: 500,
        height: '90%',
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        display: 'flex',
        flexDirection: 'column',
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
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    editModeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    editModeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
    closeButton: {
        padding: 4,
    },
    modalBody: {
        flex: 1,
        paddingHorizontal: 0,
        backgroundColor: '#FFFFFF',
        minHeight: 400,
    },
    modalScrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
        flexGrow: 1,
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
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1E293B',
        backgroundColor: '#F8FAFC',
        minHeight: 48,
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
        backgroundColor: '#FFFFFF',
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
    // Building Details Modal Styles
    inputGroup: {
        marginBottom: 16,
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 14,
    },
    addDetailsButton: {
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
    addDetailsText: {
        color: '#3B82F6',
        fontWeight: '600',
        fontSize: 14,
    },
    manageFloorsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 10,
        marginTop: 16,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    manageFloorsText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 17,
    },
    saveButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: '#3B82F6',
    },
    saveButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    skipButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: '#10B981',
    },
    skipButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    infoMessage: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#EFF6FF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#DBEAFE',
        gap: 8,
    },
    infoMessageText: {
        flex: 1,
        fontSize: 14,
        color: '#1E40AF',
        lineHeight: 18,
    },
    manageFloorsSection: {
        marginTop: 16,
    },
    manageFloorsInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    manageFloorsInfoText: {
        flex: 1,
        fontSize: 13,
        color: '#1E40AF',
        lineHeight: 16,
    },
    comingSoonContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    comingSoonTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 16,
        marginBottom: 8,
    },
    comingSoonText: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 20,
    },
    // Checkbox styles
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkboxChecked: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    checkboxLabel: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    inputHint: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
        fontStyle: 'italic',
    },
    floorSummary: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    floorSummaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    floorSummaryText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    noFloorsText: {
        fontSize: 14,
        color: '#9CA3AF',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    // View Mode Styles
    viewSection: {
        marginBottom: 24,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    viewSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
    },
    floorSummaryView: {
        gap: 10,
    },
    floorSummaryItemView: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        gap: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    floorIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    floorInfoView: {
        flex: 1,
    },
    floorNameView: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    floorTypeView: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    descriptionText: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
    noDataText: {
        fontSize: 14,
        color: '#9CA3AF',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
        fontWeight: '500',
    },
});