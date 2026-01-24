import Header from '@/components/details/Header';
import MaterialCardEnhanced from '@/components/details/MaterialCardEnhanced';
import MaterialFormModal from '@/components/details/MaterialFormModel';
import MaterialUsageForm from '@/components/details/MaterialUsageForm';
import SectionManager from '@/components/details/SectionManager';
import TabSelector from '@/components/details/TabSelector';
import MaterialActivityNotifications from '@/components/notifications/MaterialActivityNotifications';
import { predefinedSections } from '@/data/details';
import { getSection } from '@/functions/details';
import { getClientId } from '@/functions/clientId';
import { domain } from '@/lib/domain';
import { styles } from '@/style/details';
import { Material, MaterialEntry, Section } from '@/types/details';
import { logMaterialImported } from '@/utils/activityLogger';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

const Details = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    const projectId = params.projectId as string;
    const projectName = params.projectName as string;
    const sectionId = params.sectionId as string;
    const sectionName = params.sectionName as string;
    const materialAvailableParam = params.materialAvailable as string;
    const materialUsedParam = params.materialUsed as string;
    const [activeTab, setActiveTab] = useState<'imported' | 'used'>('imported');
    const [selectedPeriod, setSelectedPeriod] = useState('All');
    const [showMaterialForm, setShowMaterialForm] = useState(false);
    const [showUsageForm, setShowUsageForm] = useState(false);
    const [selectedMiniSection, setSelectedMiniSection] = useState<string | null>(null);
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
    const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
    const [customEndDate, setCustomEndDate] = useState<Date>(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
    const [usedMaterials, setUsedMaterials] = useState<Material[]>([]);
    const [miniSections, setMiniSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddSectionModal, setShowAddSectionModal] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');
    const [newSectionDesc, setNewSectionDesc] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [isAddingMaterial, setIsAddingMaterial] = useState(false);
    const [isAddingMaterialUsage, setIsAddingMaterialUsage] = useState(false);
    const cardAnimations = useRef<Animated.Value[]>([]).current;
    const scrollViewRef = useRef<ScrollView>(null);
    
    // Loading animations for material operations
    const materialLoadingAnimation = useRef(new Animated.Value(0)).current;
    const usageLoadingAnimation = useRef(new Animated.Value(0)).current;

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10); // Fixed items per page
    const [totalAvailableCount, setTotalAvailableCount] = useState(0);
    const [totalUsedCount, setTotalUsedCount] = useState(0);
    const [apiLoading, setApiLoading] = useState(false);

    // Performance optimization: Request cancellation and debouncing
    const abortControllerRef = useRef<AbortController | null>(null);
    const isLoadingRef = useRef(false);
    const lastLoadTimeRef = useRef<number>(0);
    const isMountedRef = useRef(true);
    const DEBOUNCE_DELAY = 500; // 500ms debounce
    const MAX_CONSOLE_LOGS = 10; // Limit console logs
    let consoleLogCount = 0;

    // Function to start material loading animation
    const startMaterialLoadingAnimation = () => {
        setIsAddingMaterial(true);
        Animated.loop(
            Animated.timing(materialLoadingAnimation, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            })
        ).start();
    };

    // Function to stop material loading animation
    const stopMaterialLoadingAnimation = () => {
        setIsAddingMaterial(false);
        materialLoadingAnimation.stopAnimation();
        materialLoadingAnimation.setValue(0);
    };

    // Function to start usage loading animation
    const startUsageLoadingAnimation = () => {
        setIsAddingMaterialUsage(true);
        Animated.loop(
            Animated.timing(usageLoadingAnimation, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            })
        ).start();
    };

    // Function to stop usage loading animation
    const stopUsageLoadingAnimation = () => {
        setIsAddingMaterialUsage(false);
        usageLoadingAnimation.stopAnimation();
        usageLoadingAnimation.setValue(0);
    };

    // Helper function to get user data
    const getUserData = async () => {
        try {
            const userDetailsString = await AsyncStorage.getItem("user");
            if (userDetailsString) {
                const userData = JSON.parse(userDetailsString);

                // Build full name from firstName and lastName, or fallback to name/username
                let fullName = 'Unknown User';
                if (userData.firstName && userData.lastName) {
                    fullName = `${userData.firstName} ${userData.lastName}`;
                } else if (userData.firstName) {
                    fullName = userData.firstName;
                } else if (userData.lastName) {
                    fullName = userData.lastName;
                } else if (userData.name) {
                    fullName = userData.name;
                } else if (userData.username) {
                    fullName = userData.username;
                }

                return {
                    userId: userData._id || userData.id || userData.clientId || 'unknown',
                    fullName: fullName,
                };
            }
        } catch (error) {
            console.error('Error getting user data:', error);
        }
        return {
            userId: 'unknown',
            fullName: 'Unknown User',
        };
    };

    // Helper function to get client ID from project
    const getClientIdFromProject = async (projectId: string) => {
        try {
            console.log('🔍 Fetching project details to get clientId for project:', projectId);
            
            // First, we need to get a clientId to make the API call
            // Try to get it from the standard method first
            let queryClientId = null;
            try {
                queryClientId = await getClientId();
                console.log('📋 Got clientId for project API query:', queryClientId);
            } catch (error) {
                console.warn('⚠️ Could not get clientId for project API query:', error);
            }
            
            // If we don't have a clientId to query with, try to get it from user data directly
            if (!queryClientId) {
                try {
                    const userDetailsString = await AsyncStorage.getItem("user");
                    if (userDetailsString) {
                        const userData = JSON.parse(userDetailsString);
                        
                        // For staff users, try to use the first client
                        if (userData?.clients && Array.isArray(userData.clients) && userData.clients.length > 0) {
                            queryClientId = userData.clients[0].clientId;
                            console.log('📋 Using first client from staff user for query:', queryClientId);
                        } else if (userData?.clientId) {
                            queryClientId = userData.clientId;
                            console.log('📋 Using user clientId for query:', queryClientId);
                        } else if (userData?._id) {
                            queryClientId = userData._id;
                            console.log('📋 Using user _id for query:', queryClientId);
                        }
                    }
                } catch (fallbackError) {
                    console.error('❌ Fallback clientId method failed:', fallbackError);
                }
            }
            
            if (!queryClientId) {
                console.error('❌ Cannot query project API without clientId parameter');
                return null;
            }
            
            // Make the API call with clientId parameter
            const apiUrl = `${domain}/api/project/${projectId}?clientId=${queryClientId}`;
            console.log('🌐 Project API URL:', apiUrl);
            
            const response = await axios.get(apiUrl);
            const projectData = response.data as any;
            
            console.log('📦 Project data response:', projectData);
            console.log('📦 Project data keys:', Object.keys(projectData || {}));
            
            // Try multiple possible response structures
            let clientId = null;
            
            // Check different possible nested structures
            if (projectData?.project?.clientId) {
                clientId = projectData.project.clientId;
                console.log('✅ Found clientId in project.clientId:', clientId);
            } else if (projectData?.clientId) {
                clientId = projectData.clientId;
                console.log('✅ Found clientId in root clientId:', clientId);
            } else if (projectData?.data?.clientId) {
                clientId = projectData.data.clientId;
                console.log('✅ Found clientId in data.clientId:', clientId);
            } else if (projectData?.data?.project?.clientId) {
                clientId = projectData.data.project.clientId;
                console.log('✅ Found clientId in data.project.clientId:', clientId);
            }
            
            // Handle ObjectId objects (convert to string)
            if (typeof clientId === 'object' && clientId !== null) {
                console.log('🔄 Converting ObjectId to string');
                clientId = clientId.toString();
            }
            
            console.log('🏢 Final extracted clientId from project:', clientId);
            
            if (!clientId) {
                console.error('❌ No clientId found in project data');
                console.error('❌ Full project response:', JSON.stringify(projectData, null, 2));
                return null;
            }
            
            return clientId;
        } catch (error) {
            console.error('❌ Error fetching project clientId:', error);
            if ((error as any)?.response) {
                console.error('❌ API Response Error:');
                console.error('   - Status:', (error as any).response.status);
                console.error('   - Data:', (error as any).response.data);
            }
            return null;
        }
    };

    // Helper function to get client ID (with fallback to project-based lookup)
    const getClientIdFromStorage = async () => {
        try {
            console.log('🔍 Getting clientId for material activity logging...');
            
            // Try the standard method first (this is working based on your logs)
            const standardClientId = await getClientId();
            if (standardClientId) {
                console.log('✅ Got clientId from standard method:', standardClientId);
                
                // For material activities, we can use the standard clientId since it's working
                // The project-based lookup is mainly for verification, not required for functionality
                return standardClientId;
            }
            
            console.log('⚠️ Standard clientId method failed, trying project-based lookup...');
            
            // Fallback: Get clientId from project (for edge cases)
            if (projectId) {
                console.log('📋 Attempting project-based clientId lookup...');
                const projectClientId = await getClientIdFromProject(projectId);
                if (projectClientId) {
                    console.log('✅ Got clientId from project:', projectClientId);
                    return projectClientId;
                } else {
                    console.warn('⚠️ Project-based clientId lookup failed, but this is not critical');
                }
            }
            
            // Final fallback: Try to get clientId directly from user data
            console.log('🔄 Trying direct user data fallback...');
            try {
                const userDetailsString = await AsyncStorage.getItem("user");
                if (userDetailsString) {
                    const userData = JSON.parse(userDetailsString);
                    
                    // For staff users, use the first client
                    if (userData?.clients && Array.isArray(userData.clients) && userData.clients.length > 0) {
                        const fallbackClientId = userData.clients[0].clientId;
                        console.log('✅ Got clientId from user clients array:', fallbackClientId);
                        return fallbackClientId;
                    } else if (userData?.clientId) {
                        console.log('✅ Got clientId from user data:', userData.clientId);
                        return userData.clientId;
                    } else if (userData?._id) {
                        console.log('✅ Got clientId from user _id:', userData._id);
                        return userData._id;
                    }
                }
            } catch (fallbackError) {
                console.error('❌ Direct user data fallback failed:', fallbackError);
            }
            
            console.error('❌ All clientId methods failed');
            return null;
        } catch (error) {
            console.error('❌ Error in getClientIdFromStorage:', error);
            return null;
        }
    };

    // Function to log material activity
    const logMaterialActivity = async (
        materials: any[],
        activity: 'imported' | 'used',
        message: string = ''
    ) => {
        try {
            console.log('\n========================================');
            console.log('🔔 DETAILED MATERIAL ACTIVITY LOGGING');
            console.log('========================================');
            console.log('📋 Input Parameters:');
            console.log('   - Activity Type:', activity);
            console.log('   - Materials Count:', materials.length);
            console.log('   - Message:', message);
            console.log('   - Project ID:', projectId);
            console.log('   - Project Name:', projectName);
            console.log('   - Section Name:', sectionName);
            console.log('   - Materials Details:');
            materials.forEach((material, index) => {
                console.log(`     ${index + 1}. ${material.name}:`);
                console.log(`        - Quantity: ${material.qnt} ${material.unit}`);
                console.log(`        - Per Unit Cost: ₹${material.perUnitCost || 0}`);
                console.log(`        - Total Cost: ₹${material.totalCost || 0}`);
                console.log(`        - Cost (for notifications): ₹${material.cost || 0}`);
                console.log(`        - Specs:`, material.specs || {});
            });

            const user = await getUserData();
            console.log('👤 User Data:', user);

            // Try to get clientId with comprehensive error handling
            let clientId = null;
            try {
                clientId = await getClientIdFromStorage();
                console.log('🏢 Client ID from storage:', clientId);
            } catch (clientIdError) {
                console.error('❌ Error getting clientId from storage:', clientIdError);
            }

            // If still no clientId, try alternative methods
            if (!clientId) {
                console.warn('⚠️ No clientId from storage, trying alternative methods...');
                
                // Try getting clientId directly from user data
                try {
                    const userDetailsString = await AsyncStorage.getItem("user");
                    if (userDetailsString) {
                        const userData = JSON.parse(userDetailsString);
                        
                        // For staff users, try to find the right clientId based on project
                        if (userData?.clients && Array.isArray(userData.clients)) {
                            console.log('👥 Staff user detected, searching for matching clientId...');
                            // For now, use the first client as fallback
                            clientId = userData.clients[0]?.clientId;
                            console.log('🔄 Using first client as fallback:', clientId);
                        } else if (userData?.clientId) {
                            clientId = userData.clientId;
                            console.log('🔄 Using user clientId:', clientId);
                        } else if (userData?._id) {
                            clientId = userData._id;
                            console.log('🔄 Using user _id as clientId:', clientId);
                        }
                    }
                } catch (fallbackError) {
                    console.error('❌ Fallback clientId method failed:', fallbackError);
                }
            }

            if (!clientId) {
                console.error('❌ CRITICAL: Client ID not found after all attempts, skipping detailed material activity log');
                console.error('❌ This means material activity notifications will not be generated');
                console.error('❌ Please check user login status and project configuration');
                return;
            }

            console.log('✅ Final clientId to use:', clientId);

            // Create activity payload with date and project information
            const activityPayload = {
                clientId,
                projectId,
                projectName, // Add project name for notifications
                sectionName, // Add section name for notifications  
                materials,
                message,
                activity,
                user,
                date: new Date().toISOString(), // Add ISO date string as required by API
            };

            console.log('📦 Material Activity Payload:');
            console.log(JSON.stringify(activityPayload, null, 2));
            console.log('🌐 API Endpoint:', `${domain}/api/materialActivity`);

            console.log('⏳ Sending request to Material Activity API...');
            const response = await axios.post(`${domain}/api/materialActivity`, activityPayload);
            
            console.log('✅ Material Activity API Response:');
            console.log('   - Status:', response.status);
            console.log('   - Data:', JSON.stringify(response.data, null, 2));
            console.log('🎉 DETAILED MATERIAL ACTIVITY LOGGED SUCCESSFULLY');
            console.log('   - Staff and Admin should now see detailed material notifications');
            console.log('   - Check notification page for material details');
            console.log('========================================\n');

        } catch (error) {
            console.error('\n========================================');
            console.error('❌ DETAILED MATERIAL ACTIVITY LOGGING FAILED');
            console.error('========================================');
            console.error('Error Type:', error?.constructor?.name);
            console.error('Error Message:', (error as any)?.message);
            
            if ((error as any)?.response) {
                console.error('API Response Error:');
                console.error('   - Status:', (error as any).response.status);
                console.error('   - Status Text:', (error as any).response.statusText);
                console.error('   - Response Data:', JSON.stringify((error as any).response.data, null, 2));
            } else if ((error as any)?.request) {
                console.error('Network Error:');
                console.error('   - Request was made but no response received');
                console.error('   - Request:', (error as any).request);
            } else {
                console.error('Unknown Error:', error);
            }
            console.error('========================================\n');
            
            // Don't throw error - activity logging is not critical, but we want to see the error
        }
    };

    // Function to get material icon and color based on material name
    const getMaterialIconAndColor = (materialName: string) => {
        const materialMap: { [key: string]: { icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap, color: string } } = {
            'cement': { icon: 'cube-outline', color: '#8B5CF6' },
            'brick': { icon: 'square-outline', color: '#EF4444' },
            'steel': { icon: 'barbell-outline', color: '#6B7280' },
            'sand': { icon: 'layers-outline', color: '#F59E0B' },
            'gravel': { icon: 'diamond-outline', color: '#10B981' },
            'concrete': { icon: 'cube', color: '#3B82F6' },
            'wood': { icon: 'leaf-outline', color: '#84CC16' },
            'paint': { icon: 'color-palette-outline', color: '#EC4899' },
            'tile': { icon: 'grid-outline', color: '#06B6D4' },
            'pipe': { icon: 'ellipse-outline', color: '#8B5CF6' },
        };

        const lowerName = materialName.toLowerCase();
        for (const [key, value] of Object.entries(materialMap)) {
            if (lowerName.includes(key)) {
                return value;
            }
        }
        return { icon: 'cube-outline' as keyof typeof import('@expo/vector-icons').Ionicons.glyphMap, color: '#6B7280' };
    };

    // Function to reload both available and used materials with pagination
    const reloadProjectMaterials = async (forceReload: boolean = false, page: number = currentPage) => {
        if (!projectId) {
            return;
        }

        // Prevent duplicate simultaneous calls (unless force reload)
        if (!forceReload && isLoadingRef.current) {
            console.log('⏸️ Skipping reload - already loading');
            return;
        }

        // Debounce: Prevent rapid successive calls (unless force reload)
        if (!forceReload) {
            const now = Date.now();
            if (now - lastLoadTimeRef.current < DEBOUNCE_DELAY) {
                console.log('⏸️ Skipping reload - too soon (debounced)');
                return;
            }
            lastLoadTimeRef.current = now;
        } else {
            console.log('🔄 Force reload requested - bypassing debounce');
            lastLoadTimeRef.current = Date.now();
        }

        // Cancel any pending requests
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            console.log('🚫 Cancelled previous request');
        }

        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        isLoadingRef.current = true;
        setLoading(true);
        setApiLoading(true);

        try {
            // Get clientId from storage
            const { getClientId } = require('@/functions/clientId');
            const clientId = await getClientId();

            if (!clientId) {
                throw new Error('Client ID not found');
            }

            console.log('\n========================================');
            console.log('RELOADING MATERIALS - API CALLS WITH PAGINATION');
            console.log('========================================');
            console.log('Project ID:', projectId);
            console.log('Client ID:', clientId);
            console.log('Page:', page);
            console.log('Items per page:', itemsPerPage);
            console.log('Active Tab:', activeTab);
            console.log('Selected Mini Section:', selectedMiniSection);

            // Build pagination parameters
            const paginationParams = new URLSearchParams({
                projectId: projectId,
                clientId: clientId,
                page: page.toString(),
                limit: itemsPerPage.toString(),
            });

            // Add section filtering if in used tab
            if (activeTab === 'used') {
                paginationParams.append('sectionId', sectionId);
                if (selectedMiniSection && selectedMiniSection !== 'all-sections') {
                    paginationParams.append('miniSectionId', selectedMiniSection);
                }
            }

            console.log('API URLs:');
            console.log('  - Available:', `${domain}/api/material?${paginationParams.toString()}`);
            console.log('  - Used:', `${domain}/api/material-usage?${paginationParams.toString()}`);
            console.log('========================================\n');

            // Fetch MaterialAvailable and MaterialUsed separately with individual error handling
            let materialAvailable: any[] = [];
            let materialUsed: any[] = [];
            let availableTotal = 0;
            let usedTotal = 0;

            // Fetch MaterialAvailable with pagination
            try {
                const availableUrl = `${domain}/api/material?${paginationParams.toString()}`;
                const availableResponse = await axios.get(availableUrl, {
                    timeout: 10000, // 10 second timeout
                });

                // Check if request was cancelled
                if (signal.aborted) {
                    console.log('🚫 Request was cancelled');
                    return;
                }

                console.log('Available Response:', JSON.stringify(availableResponse.data, null, 2));
                const availableData = availableResponse.data as any;

                if (availableData.success) {
                    materialAvailable = availableData.MaterialAvailable || availableData.data?.materials || [];
                    availableTotal = availableData.pagination?.totalCount || availableData.totalCount || availableData.total || materialAvailable.length;
                    console.log('✓ MaterialAvailable extracted:', materialAvailable.length, 'items, Total:', availableTotal);
                    if (materialAvailable.length > 0) {
                        console.log('Sample material:', materialAvailable[0]);
                    }
                } else {
                    console.warn('⚠ API returned success: false');
                }
            } catch (availError: any) {
                console.error('❌ Error fetching MaterialAvailable:', availError?.response?.data || availError.message);
            }

            // Fetch MaterialUsed with pagination
            try {
                const usedUrl = `${domain}/api/material-usage?${paginationParams.toString()}`;
                const usedResponse = await axios.get(usedUrl, {
                    timeout: 10000, // 10 second timeout
                });

                // Check if request was cancelled
                if (signal.aborted) {
                    console.log('🚫 Request was cancelled');
                    return;
                }

                console.log('Used Response:', JSON.stringify(usedResponse.data, null, 2));
                const usedData = usedResponse.data as any;

                console.log('\n🔍 CHECKING API RESPONSE STRUCTURE:');
                console.log('usedData.success:', usedData.success);
                console.log('usedData.MaterialUsed:', usedData.MaterialUsed);
                console.log('usedData.materialUsed:', usedData.materialUsed);
                console.log('usedData.totalCount:', usedData.totalCount);
                console.log('usedData.total:', usedData.total);
                console.log('All keys in response:', Object.keys(usedData));

                if (usedData.success) {
                    // ✅ FIXED: API now consistently returns MaterialUsed field
                    materialUsed = usedData.MaterialUsed || usedData.data?.materials || [];
                    usedTotal = usedData.pagination?.totalCount || usedData.totalCount || usedData.total || materialUsed.length;

                    console.log('✓ MaterialUsed extracted:', materialUsed.length, 'items, Total:', usedTotal);
                    if (materialUsed.length > 0) {
                        console.log('✅ Found used materials! Sample:', JSON.stringify(materialUsed[0], null, 2));
                    } else {
                        console.warn('⚠️ MaterialUsed array is EMPTY for this page!');
                    }
                } else {
                    console.warn('⚠ MaterialUsed API returned success: false');
                }
            } catch (usedError: any) {
                console.error('❌ Error fetching MaterialUsed:', usedError?.response?.data || usedError.message);
                console.log('ℹ Continuing without MaterialUsed data');
            }

            console.log('Extracted - Available:', materialAvailable.length, 'Used:', materialUsed.length);
            console.log('Totals - Available:', availableTotal, 'Used:', usedTotal);

            // Log raw data to check if API is returning correct data
            console.log('\n========================================');
            console.log('RAW API DATA COMPARISON');
            console.log('========================================');
            console.log('MaterialAvailable (first item):');
            if (materialAvailable.length > 0) {
                console.log(JSON.stringify(materialAvailable[0], null, 2));
            }
            console.log('\nMaterialUsed (first item):');
            if (materialUsed.length > 0) {
                console.log(JSON.stringify(materialUsed[0], null, 2));
            }
            console.log('========================================\n');

            // Transform MaterialAvailable
            const transformedAvailable: Material[] = materialAvailable.map((material: any, index: number) => {
                const { icon, color } = getMaterialIconAndColor(material.name);

                // Validate that material has _id
                if (!material._id) {
                    console.warn(`⚠️ Material "${material.name}" is missing _id field!`, material);
                }

                // ✅ FIXED: Handle different cost field structures
                let materialCost = 0;
                if (material.perUnitCost !== undefined) {
                    materialCost = Number(material.perUnitCost) || 0;
                } else if (material.totalCost !== undefined) {
                    materialCost = Number(material.totalCost) || 0;
                } else if (material.cost !== undefined) {
                    materialCost = Number(material.cost) || 0;
                }

                // Log material sectionId for debugging
                console.log(`📦 Material: ${material.name}`);
                console.log(`   _id: ${material._id}`);
                console.log(`   sectionId: ${material.sectionId || 'NONE'}`);
                console.log(`   Current page sectionId: ${sectionId}`);
                console.log(`   Match: ${!material.sectionId || material.sectionId === sectionId ? '✅' : '❌'}`);
                console.log(`   Cost (normalized): ${materialCost}`);

                return {
                    id: index + 1,
                    _id: material._id,
                    name: material.name,
                    quantity: material.qnt,
                    unit: material.unit,
                    price: materialCost, // Use normalized cost
                    date: new Date().toLocaleDateString(),
                    icon,
                    color,
                    specs: material.specs || {},
                    sectionId: material.sectionId // Include sectionId in transformed material
                };
            });

            // Transform MaterialUsed
            const transformedUsed: Material[] = materialUsed.map((material: any, index: number) => {
                const { icon, color } = getMaterialIconAndColor(material.name);
                
                // ✅ FIXED: Handle different cost field structures for used materials
                let materialCost = 0;
                if (material.totalCost !== undefined) {
                    // For used materials, totalCost is the total cost of the quantity used
                    materialCost = Number(material.totalCost) || 0;
                } else if (material.perUnitCost !== undefined) {
                    // If only per-unit cost is available, calculate total
                    materialCost = (Number(material.perUnitCost) || 0) * (Number(material.qnt) || 1);
                } else if (material.cost !== undefined) {
                    materialCost = Number(material.cost) || 0;
                }

                console.log(`🔄 Used Material: ${material.name}`);
                console.log(`   Quantity: ${material.qnt} ${material.unit}`);
                console.log(`   Per-unit cost: ${material.perUnitCost || 'N/A'}`);
                console.log(`   Total cost: ${material.totalCost || 'N/A'}`);
                console.log(`   Legacy cost: ${material.cost || 'N/A'}`);
                console.log(`   Normalized cost: ${materialCost}`);

                return {
                    id: index + 1000,
                    _id: material._id,
                    name: material.name,
                    quantity: material.qnt,
                    unit: material.unit,
                    price: materialCost, // Use normalized cost
                    date: new Date().toLocaleDateString(),
                    icon,
                    color,
                    specs: material.specs || {},
                    sectionId: material.sectionId || material.miniSectionId,
                    miniSectionId: material.miniSectionId,
                    addedAt: material.addedAt,
                    createdAt: material.createdAt,
                    updatedAt: material.updatedAt
                };
            });

            console.log('MATERIALS RELOADED SUCCESSFULLY');
            console.log('Available Materials:', transformedAvailable.length);
            console.log('Used Materials:', transformedUsed.length);

            console.log('\n========================================');
            console.log('TRANSFORMED DATA');
            console.log('========================================');
            console.log('Transformed Available (first item):');
            if (transformedAvailable.length > 0) {
                console.log(JSON.stringify(transformedAvailable[0], null, 2));
            }
            console.log('\nTransformed Used (first item):');
            if (transformedUsed.length > 0) {
                console.log(JSON.stringify(transformedUsed[0], null, 2));
            } else {
                console.error('❌ NO USED MATERIALS TO TRANSFORM!');
                console.error('The materialUsed array from API was empty');
            }
            console.log('========================================\n');

            console.log('🚨 SETTING STATE NOW:');
            console.log('  - availableMaterials:', transformedAvailable.length);
            console.log('  - usedMaterials:', transformedUsed.length);
            console.log('  - totalAvailableCount:', availableTotal);
            console.log('  - totalUsedCount:', usedTotal);

            // Use functional updates to ensure we're working with latest state
            // Only update if component is still mounted
            if (isMountedRef.current) {
                setAvailableMaterials(() => transformedAvailable);
                setUsedMaterials(() => transformedUsed);
                setTotalAvailableCount(availableTotal);
                setTotalUsedCount(usedTotal);
            }

            // Reinitialize animations
            const totalMaterials = Math.max(transformedAvailable.length, transformedUsed.length);
            cardAnimations.splice(0);
            for (let i = 0; i < totalMaterials; i++) {
                cardAnimations.push(new Animated.Value(0));
            }

            Animated.stagger(100,
                cardAnimations.map((anim: Animated.Value) =>
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: false,
                    })
                )
            ).start();
        } catch (error: any) {
            // Don't show error if request was cancelled
            if (error.name === 'AbortError' || error.name === 'CanceledError' || error.message?.includes('cancel')) {
                console.log('🚫 Request cancelled');
                return;
            }

            console.error('Error reloading materials:', error);

            // Only show error toast if it's not a timeout
            if (error.code !== 'ECONNABORTED') {
                toast.error('Failed to refresh materials');
            } else {
                toast.error('Request timeout - please try again');
            }
        } finally {
            isLoadingRef.current = false;
            setLoading(false);
            setApiLoading(false);
            abortControllerRef.current = null;
        }
    };

    // Function to load materials from params or fetch from API
    const loadProjectMaterials = async (forceRefresh = false) => {
        setLoading(true);
        try {
            let materialAvailable: any[] = [];
            let materialUsed: any[] = [];

            // If forceRefresh is true, always fetch from API
            if (forceRefresh && projectId) {
                try {
                    // Get clientId from storage
                    const { getClientId } = require('@/functions/clientId');
                    const clientId = await getClientId();

                    if (clientId) {
                        // Fetch MaterialAvailable
                        try {
                            const availableResponse = await axios.get(`${domain}/api/material?projectId=${projectId}&clientId=${clientId}`);
                            const availableData = availableResponse.data as any;
                            console.log('Force Refresh - Available Response:', JSON.stringify(availableData, null, 2));
                            if (availableData.success) {
                                materialAvailable = availableData.MaterialAvailable || [];
                                console.log('✓ Force Refresh - MaterialAvailable:', materialAvailable.length, 'items');
                            }
                        } catch (availError: any) {
                            console.error('❌ Force Refresh - Error fetching MaterialAvailable:', availError?.response?.data || availError.message);
                        }

                        // Fetch MaterialUsed
                        try {
                            const usedResponse = await axios.get(`${domain}/api/material-usage?projectId=${projectId}&clientId=${clientId}`);
                            const usedData = usedResponse.data as any;
                            console.log('Force Refresh - Used Response:', JSON.stringify(usedData, null, 2));
                            if (usedData.success) {
                                // Check multiple possible field names for used materials
                                materialUsed = usedData.MaterialUsed ||
                                    usedData.materialUsed ||
                                    usedData.usedMaterials ||
                                    usedData.data?.MaterialUsed ||
                                    usedData.data?.materialUsed ||
                                    [];
                                console.log('✓ Force Refresh - MaterialUsed:', materialUsed.length, 'items');
                            }
                        } catch (usedError: any) {
                            console.error('❌ Force Refresh - Error fetching MaterialUsed:', usedError?.response?.data || usedError.message);
                        }

                        console.log('Force Refresh - Extracted Available:', materialAvailable.length, 'Used:', materialUsed.length);
                    }
                } catch (apiError: any) {
                    console.error('Error force refreshing materials:', apiError);
                }
            } else {
                // Try to use passed params first (no API call needed!)
                if (materialAvailableParam) {
                    try {
                        const parsedAvailable = JSON.parse(
                            Array.isArray(materialAvailableParam) ? materialAvailableParam[0] : materialAvailableParam
                        );
                        materialAvailable = parsedAvailable;
                    } catch (e) {
                        // Silent error handling
                    }
                }

                if (materialUsedParam) {
                    try {
                        const parsedUsed = JSON.parse(
                            Array.isArray(materialUsedParam) ? materialUsedParam[0] : materialUsedParam
                        );
                        materialUsed = parsedUsed;
                    } catch (e) {
                        // Silent error handling
                    }
                }

                // Fallback: fetch from API if params are not available
                if (materialAvailable.length === 0 && materialUsed.length === 0 && projectId) {
                    try {
                        // Get clientId from storage
                        const { getClientId } = require('@/functions/clientId');
                        const clientId = await getClientId();

                        if (clientId) {
                            // Fetch MaterialAvailable
                            try {
                                const availableResponse = await axios.get(`${domain}/api/material?projectId=${projectId}&clientId=${clientId}`);
                                const availableData = availableResponse.data as any;
                                console.log('Fallback API - Available Response:', JSON.stringify(availableData, null, 2));
                                if (availableData.success) {
                                    materialAvailable = availableData.MaterialAvailable || [];
                                    console.log('✓ Fallback API - MaterialAvailable:', materialAvailable.length, 'items');
                                }
                            } catch (availError: any) {
                                console.error('❌ Fallback API - Error fetching MaterialAvailable:', availError?.response?.data || availError.message);
                            }

                            // Fetch MaterialUsed
                            try {
                                const usedResponse = await axios.get(`${domain}/api/material-usage?projectId=${projectId}&clientId=${clientId}`);
                                const usedData = usedResponse.data as any;
                                console.log('Fallback API - Used Response:', JSON.stringify(usedData, null, 2));
                                if (usedData.success) {
                                    // Check multiple possible field names for used materials
                                    materialUsed = usedData.MaterialUsed ||
                                        usedData.materialUsed ||
                                        usedData.usedMaterials ||
                                        usedData.data?.MaterialUsed ||
                                        usedData.data?.materialUsed ||
                                        [];
                                    console.log('✓ Fallback API - MaterialUsed:', materialUsed.length, 'items');
                                }
                            } catch (usedError: any) {
                                console.error('❌ Fallback API - Error fetching MaterialUsed:', usedError?.response?.data || usedError.message);
                            }

                            console.log('Fallback API - Extracted Available:', materialAvailable.length, 'Used:', materialUsed.length);
                        }
                    } catch (apiError: any) {
                        console.error('Error fetching materials from API:', apiError);
                    }
                }
            }

            // Transform MaterialAvailable to Material interface
            const transformedAvailable: Material[] = materialAvailable.map((material: any, index: number) => {
                const { icon, color } = getMaterialIconAndColor(material.name);
                
                // ✅ FIXED: Handle different cost field structures
                let materialCost = 0;
                if (material.perUnitCost !== undefined) {
                    materialCost = Number(material.perUnitCost) || 0;
                } else if (material.totalCost !== undefined) {
                    materialCost = Number(material.totalCost) || 0;
                } else if (material.cost !== undefined) {
                    materialCost = Number(material.cost) || 0;
                }

                return {
                    id: index + 1,
                    _id: material._id, // Store MongoDB _id for API calls
                    name: material.name,
                    quantity: material.qnt,
                    unit: material.unit,
                    price: materialCost, // Use normalized cost
                    date: new Date().toLocaleDateString(),
                    icon,
                    color,
                    specs: material.specs || {}
                };
            });

            // Transform MaterialUsed to Material interface
            const transformedUsed: Material[] = materialUsed.map((material: any, index: number) => {
                const { icon, color } = getMaterialIconAndColor(material.name);
                
                // ✅ FIXED: Handle different cost field structures for used materials
                let materialCost = 0;
                if (material.totalCost !== undefined) {
                    // For used materials, totalCost is the total cost of the quantity used
                    materialCost = Number(material.totalCost) || 0;
                } else if (material.perUnitCost !== undefined) {
                    // If only per-unit cost is available, calculate total
                    materialCost = (Number(material.perUnitCost) || 0) * (Number(material.qnt) || 1);
                } else if (material.cost !== undefined) {
                    materialCost = Number(material.cost) || 0;
                }

                return {
                    id: index + 1000, // Different ID range to avoid conflicts
                    _id: material._id, // Store MongoDB _id
                    name: material.name,
                    quantity: material.qnt,
                    unit: material.unit,
                    price: materialCost, // Use normalized cost
                    date: new Date().toLocaleDateString(),
                    icon,
                    color,
                    specs: material.specs || {},
                    sectionId: material.sectionId || material.miniSectionId, // Preserve section/mini-section ID
                    miniSectionId: material.miniSectionId, // Also store miniSectionId separately
                    addedAt: material.addedAt,
                    createdAt: material.createdAt,
                    updatedAt: material.updatedAt
                };
            });

            console.log('\n========================================');
            console.log('INITIAL MATERIALS LOADED');
            console.log('========================================');
            console.log('Available Materials:', transformedAvailable.length);
            console.log('Used Materials:', transformedUsed.length);
            console.log('Source:', materialAvailableParam ? 'Params' : 'API');
            console.log('========================================\n');

            setAvailableMaterials(transformedAvailable);
            setUsedMaterials(transformedUsed);

            // Initialize animations for the materials
            const totalMaterials = Math.max(transformedAvailable.length, transformedUsed.length);
            cardAnimations.splice(0); // Clear existing animations
            for (let i = 0; i < totalMaterials; i++) {
                cardAnimations.push(new Animated.Value(0));
            }

            // Animate cards in
            Animated.stagger(100,
                cardAnimations.map((anim: Animated.Value) =>
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: false,
                    })
                )
            ).start();
        } catch (error: any) {
            // Only show error toast if it's a critical error (not from API fetch)
            if (!error?.message?.includes('API') && !error?.response) {
                const errorMessage = error?.message || 'Failed to process materials';
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    // Load project materials on mount
    useEffect(() => {
        isMountedRef.current = true;
        loadProjectMaterials();

        // Cleanup: Cancel any pending requests when component unmounts
        return () => {
            isMountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            // Clear animations to prevent memory leaks
            cardAnimations.forEach(anim => {
                anim.stopAnimation();
            });
        };
    }, [projectId, materialAvailableParam, materialUsedParam]);

    // Debug: Log when usedMaterials state changes (limited logging)
    useEffect(() => {
        if (__DEV__ && consoleLogCount < MAX_CONSOLE_LOGS) {
            console.log('🔄 usedMaterials:', usedMaterials.length);
            consoleLogCount++;
        }
    }, [usedMaterials]);

    // Debug: Log when availableMaterials state changes (limited logging)
    useEffect(() => {
        if (__DEV__ && consoleLogCount < MAX_CONSOLE_LOGS) {
            console.log('📦 availableMaterials:', availableMaterials.length);
            consoleLogCount++;
        }
    }, [availableMaterials]);

    // Debug: Log when activeTab changes (limited logging)
    useEffect(() => {
        if (__DEV__ && consoleLogCount < MAX_CONSOLE_LOGS) {
            console.log('🔀 Tab:', activeTab);
            consoleLogCount++;
        }
    }, [activeTab]);

    // Fetch mini-sections for the section selector
    useEffect(() => {
        const fetchMiniSections = async () => {
            if (!sectionId) return;

            try {
                const sections = await getSection(sectionId);
                if (sections && Array.isArray(sections)) {
                    setMiniSections(sections);
                }
            } catch (error) {
                // Silent error handling
            }
        };

        fetchMiniSections();
    }, [sectionId]);

    // ✅ UPDATED: Group materials by name, unit, AND specifications for separate cards
    const groupMaterialsByName = (materials: Material[], isUsedTab: boolean = false) => {
        try {
            if (__DEV__ && consoleLogCount < MAX_CONSOLE_LOGS) {
                console.log('Grouping', materials.length, 'materials');
                consoleLogCount++;
            }

            const grouped: { [key: string]: any } = {};

            // Debug raw materials input
            if (__DEV__) {
                console.log('🔍 RAW MATERIALS INPUT TO GROUPING:');
                materials.forEach((material, index) => {
                    console.log(`   Material ${index + 1}:`, {
                        name: material.name,
                        quantity: material.quantity,
                        price: material.price,
                        unit: material.unit,
                        quantityType: typeof material.quantity,
                        priceType: typeof material.price,
                        specs: material.specs
                    });
                });
            }

            materials.forEach((material, index) => {
                // ✅ FIXED: Include price in the grouping key to create separate cards for different prices
                const specsKey = material.specs ? JSON.stringify(material.specs) : 'no-specs';
                const priceKey = material.price ? material.price.toString() : '0';
                const key = `${material.name}-${material.unit}-${specsKey}-${priceKey}`;

                if (!grouped[key]) {
                    grouped[key] = {
                        name: material.name,
                        unit: material.unit,
                        icon: material.icon,
                        color: material.color,
                        date: material.date,
                        specs: material.specs || {}, // ✅ Store specs for display
                        variants: [],
                        totalQuantity: 0,
                        totalCost: 0,
                        totalUsed: 0,
                        totalImported: 0,
                        miniSectionId: material.miniSectionId,
                    };
                }

                const variantId = (material as any)._id || material.id.toString();

                grouped[key].variants.push({
                    _id: variantId,
                    specs: material.specs || {},
                    quantity: material.quantity,
                    cost: material.price,
                    miniSectionId: material.miniSectionId,
                });

                // Debug logging for grouping
                if (__DEV__) {
                    console.log('🔍 GROUPING DEBUG:', {
                        materialName: material.name,
                        materialQuantity: material.quantity,
                        materialPrice: material.price,
                        materialPriceType: typeof material.price,
                        groupKey: key,
                        beforeQuantity: grouped[key].totalQuantity,
                        beforeCost: grouped[key].totalCost
                    });
                }

                grouped[key].totalQuantity += material.quantity;
                grouped[key].totalCost += material.price;

                // Debug logging after addition
                if (__DEV__) {
                    console.log('🔍 AFTER ADDITION:', {
                        materialName: material.name,
                        afterQuantity: grouped[key].totalQuantity,
                        afterCost: grouped[key].totalCost,
                        expectedPerUnit: grouped[key].totalQuantity > 0 ? (grouped[key].totalCost / grouped[key].totalQuantity) : 0
                    });
                }
            });

            // FIXED: Correct calculation logic for both tabs
            Object.keys(grouped).forEach((key) => {
                // Store original totals for cost calculation
                const originalTotalQuantity = grouped[key].totalQuantity;
                const originalTotalCost = grouped[key].totalCost;
                
                if (isUsedTab) {
                    // In "used" tab: totalQuantity IS the used amount (don't change it)
                    const usedQuantity = grouped[key].totalQuantity;

                    // Find available quantity for stats only
                    const availableQuantity = availableMaterials
                        .filter(m => {
                            const mSpecsKey = m.specs ? JSON.stringify(m.specs) : 'no-specs';
                            const mPriceKey = m.price ? m.price.toString() : '0';
                            const mKey = `${m.name}-${m.unit}-${mSpecsKey}-${mPriceKey}`;
                            return mKey === key;
                        })
                        .reduce((sum, m) => sum + m.quantity, 0);

                    grouped[key].totalUsed = usedQuantity;
                    grouped[key].totalImported = availableQuantity + usedQuantity;
                    // Keep totalQuantity as used quantity for display
                    // Keep totalCost as is (it represents cost of used materials)

                    console.log(`Used Tab - ${key}: Used=${usedQuantity}, Available=${availableQuantity}, Total=${grouped[key].totalImported}`);
                } else {
                    // In "imported" tab: totalQuantity is available amount
                    const availableQuantity = grouped[key].totalQuantity;

                    // Calculate used quantity for stats
                    const usedQuantity = usedMaterials
                        .filter(m => {
                            const mSpecsKey = m.specs ? JSON.stringify(m.specs) : 'no-specs';
                            const mPriceKey = m.price ? m.price.toString() : '0';
                            const mKey = `${m.name}-${m.unit}-${mSpecsKey}-${mPriceKey}`;
                            return mKey === key;
                        })
                        .reduce((sum, m) => sum + m.quantity, 0);

                    grouped[key].totalUsed = usedQuantity;
                    grouped[key].totalImported = availableQuantity + usedQuantity;
                    // Keep totalQuantity as available quantity for display
                    // Keep totalCost as is (it represents cost of available materials)

                    console.log(`Imported Tab - ${key}: Available=${availableQuantity}, Used=${usedQuantity}, Total=${grouped[key].totalImported}`);
                }
                
                // Debug cost consistency
                if (__DEV__) {
                    const perUnit = grouped[key].totalQuantity > 0 ? (grouped[key].totalCost / grouped[key].totalQuantity) : 0;
                    console.log(`💰 COST CONSISTENCY CHECK - ${key}:`, {
                        tab: isUsedTab ? 'used' : 'imported',
                        displayQuantity: grouped[key].totalQuantity,
                        displayCost: grouped[key].totalCost,
                        calculatedPerUnit: perUnit.toFixed(2),
                        originalQuantity: originalTotalQuantity,
                        originalCost: originalTotalCost
                    });
                }
            });

            const result = Object.values(grouped);
            
            // Debug final grouped results
            if (__DEV__) {
                console.log('🎯 FINAL GROUPED RESULTS:');
                result.forEach((group: any, index: number) => {
                    const perUnit = group.totalQuantity > 0 ? (group.totalCost / group.totalQuantity) : 0;
                    console.log(`   Group ${index + 1}: ${group.name}`);
                    console.log(`     totalQuantity: ${group.totalQuantity} (${typeof group.totalQuantity})`);
                    console.log(`     totalCost: ${group.totalCost} (${typeof group.totalCost})`);
                    console.log(`     calculated per unit: ₹${perUnit.toFixed(2)}/${group.unit}`);
                    console.log(`     variants count: ${group.variants.length}`);
                });
            }
            
            return result;
        } catch (error) {
            console.error('Error grouping materials:', error);
            return [];
        }
    };
    // Handle adding material usage from the form (batch version)
    const handleAddMaterialUsage = async (
        miniSectionId: string,
        materialUsages: { materialId: string; quantity: number }[]
    ) => {
        // Prevent duplicate submissions
        if (isLoadingRef.current || isAddingMaterialUsage) {
            toast.error('Please wait for the current operation to complete');
            return;
        }

        // Start loading animation
        startUsageLoadingAnimation();

        // Get user data and clientId for activity logging
        const user = await getUserData();
        const { getClientId } = require('@/functions/clientId');
        const clientId = await getClientId();

        if (!user || !clientId) {
            stopUsageLoadingAnimation();
            toast.error('Unable to get user information. Please try logging in again.');
            console.error('❌ Missing user data or clientId:', { user, clientId });
            return;
        }

        console.log('\n========================================');
        console.log('🎯 ADD BATCH MATERIAL USAGE - COMPREHENSIVE DEBUG');
        console.log('========================================');
        console.log('📊 INPUT PARAMETERS:');
        console.log('  - Project ID:', projectId, '(type:', typeof projectId, ')');
        console.log('  - Section ID:', sectionId, '(type:', typeof sectionId, ')');
        console.log('  - Mini Section ID:', miniSectionId, '(type:', typeof miniSectionId, ')');
        console.log('  - Client ID:', clientId, '(type:', typeof clientId, ')');
        console.log('  - Number of materials:', materialUsages.length);
        console.log('  - User:', JSON.stringify(user, null, 2));

        console.log('\n📦 AVAILABLE MATERIALS CONTEXT:');
        console.log('  - Total available materials:', availableMaterials.length);
        availableMaterials.slice(0, 3).forEach((m, idx) => {
            console.log(`    ${idx + 1}. ${m.name} (_id: ${m._id}, qty: ${m.quantity})`);
        });

        console.log('\n🎯 MATERIAL USAGES TO PROCESS:');
        materialUsages.forEach((usage, index) => {
            const selectedMaterial = availableMaterials.find(m => m._id === usage.materialId);
            console.log(`  ${index + 1}. Material Usage:`);
            console.log(`     - Material ID: "${usage.materialId}" (type: ${typeof usage.materialId})`);
            console.log(`     - Quantity: ${usage.quantity} (type: ${typeof usage.quantity})`);
            
            if (selectedMaterial) {
                console.log(`     - Material Name: ${selectedMaterial.name}`);
                console.log(`     - Available Quantity: ${selectedMaterial.quantity} ${selectedMaterial.unit}`);
                console.log(`     - Unit Cost: ${selectedMaterial.price || 0}`);
                console.log(`     - Section ID: ${selectedMaterial.sectionId || 'none'}`);
                console.log(`     ✅ Material found in available materials`);
            } else {
                console.log(`     ❌ Material NOT FOUND in available materials!`);
                console.log(`     🔍 Searching in available materials by ID...`);
                const foundById = availableMaterials.find(m => String(m._id) === String(usage.materialId));
                const foundByIdLoose = availableMaterials.find(m => m.id === parseInt(usage.materialId));
                console.log(`     - Found by string comparison: ${!!foundById}`);
                console.log(`     - Found by ID number: ${!!foundByIdLoose}`);
            }
        });

        // Create the API payload
        const apiPayload = {
            projectId: projectId,
            sectionId: sectionId,
            miniSectionId: miniSectionId,
            materialUsages: materialUsages,
            clientId: clientId,
            user: user
        };

        console.log('\n📤 API PAYLOAD:');
        console.log(JSON.stringify(apiPayload, null, 2));
        console.log('\n🌐 API ENDPOINT:', `${domain}/api/material-usage-batch`);
        console.log('========================================\n');

        let loadingToast: any = null;
        try {
            isLoadingRef.current = true;
            loadingToast = toast.loading(`Adding ${materialUsages.length} material usages...`);

            console.log('\n🚀 SENDING BATCH API REQUEST...');
            console.log('========================================');
            console.log('📡 REQUEST DETAILS:');
            console.log('  - URL:', `${domain}/api/material-usage-batch`);
            console.log('  - Method: POST');
            console.log('  - Domain:', domain);
            console.log('  - Full URL:', `${domain}/api/material-usage-batch`);
            console.log('  - Timeout: 30 seconds');
            console.log('========================================');

            // Add request headers for debugging
            const requestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 30000, // 30 second timeout
            };

            console.log('📋 Request config:', JSON.stringify(requestConfig, null, 2));
            console.log('\n⏳ Making API call...');

            const response = await axios.post(`${domain}/api/material-usage-batch`, apiPayload, requestConfig);
            const responseData = response.data as any;

            console.log('\n========================================');
            console.log('✅ BATCH API RESPONSE - SUCCESS');
            console.log('========================================');
            console.log('📊 RESPONSE DETAILS:');
            console.log('  - Status Code:', response.status);
            console.log('  - Success:', responseData.success);
            console.log('  - Message:', responseData.message);
            
            if (responseData.data) {
                console.log('  - Materials processed:', responseData.data.usedMaterials?.length || 0);
                console.log('  - Total cost:', responseData.data.totalCostOfUsedMaterials || 0);
                console.log('  - Remaining available:', responseData.data.materialAvailable?.length || 0);
                console.log('  - Total used materials:', responseData.data.materialUsed?.length || 0);
            }
            
            console.log('\n📋 FULL RESPONSE DATA:');
            console.log(JSON.stringify(responseData, null, 2));
            console.log('========================================\n');

            if (responseData.success) {
                // Update loading message
                toast.loading('Refreshing materials...');

                // Log material activity for used materials
                if (responseData.data?.usedMaterials) {
                    // Find the mini-section name
                    const miniSection = miniSections.find(s => s._id === miniSectionId);
                    const miniSectionName = miniSection?.name || 'Unknown Section';

                    const usedMaterialsLog = responseData.data.usedMaterials.map((usedMaterial: any) => ({
                        name: usedMaterial.name,
                        unit: usedMaterial.unit,
                        specs: usedMaterial.specs || {},
                        qnt: usedMaterial.qnt,
                        perUnitCost: usedMaterial.perUnitCost || 0, // ✅ FIXED: Use perUnitCost
                        totalCost: usedMaterial.totalCost || 0, // ✅ FIXED: Use totalCost
                        addedAt: new Date(),
                    }));

                    // ✅ ACTIVITY LOGGING REMOVED - The batch API already handles MaterialActivity logging
                    // This prevents duplicate notifications in the activity feed
                    console.log('✅ Material usage logged by batch API - no additional logging needed');
                }

                // Refresh materials from API to get the latest data
                console.log('\n========================================');
                console.log('REFRESHING MATERIALS AFTER BATCH USAGE ADD');
                console.log('========================================\n');

                // Force refresh with a longer delay to ensure backend has processed
                await new Promise(resolve => setTimeout(resolve, 500));

                // Call reload with force refresh (bypasses debounce and loading check)
                await reloadProjectMaterials(true);

                // Wait for state to update - increased delay
                await new Promise(resolve => setTimeout(resolve, 500));

                console.log('✅ Materials refreshed after batch usage add');
                console.log('Available materials count:', availableMaterials.length);
                console.log('Used materials count:', usedMaterials.length);

                // Stop loading animation and show success
                stopUsageLoadingAnimation();
                toast.dismiss(loadingToast);

                // Only update UI if component is still mounted
                if (isMountedRef.current) {
                    // Switch to "used" tab to show the newly added usage
                    setActiveTab('used');

                    // Close the usage form
                    setShowUsageForm(false);

                    // Show success message with material count
                    toast.success(`✅ ${materialUsages.length} material usages recorded! Check the "Used Materials" tab.`);
                }
            } else {
                throw new Error(responseData.error || 'Failed to add material usages');
            }
        } catch (error: any) {
            if (loadingToast) {
                toast.dismiss(loadingToast);
            }

            console.log('\n========================================');
            console.log('❌ BATCH API RESPONSE - ERROR');
            console.log('========================================');
            console.log('🚨 ERROR DETAILS:');
            console.log('  - Error Type:', error?.name || 'Unknown');
            console.log('  - Error Message:', error?.message || 'No message');
            console.log('  - Error Code:', error?.code || 'No code');
            
            if (error?.response) {
                console.log('\n📡 HTTP RESPONSE ERROR:');
                console.log('  - Status Code:', error.response.status);
                console.log('  - Status Text:', error.response.statusText);
                console.log('  - Response Data:', JSON.stringify(error.response.data, null, 2));
                console.log('  - Response Headers:', JSON.stringify(error.response.headers, null, 2));
            } else if (error?.request) {
                console.log('\n📡 REQUEST ERROR (No Response):');
                console.log('  - Request was made but no response received');
                console.log('  - Request details:', error.request);
            } else {
                console.log('\n🔧 SETUP ERROR:');
                console.log('  - Error setting up request');
            }
            
            if (error?.config) {
                console.log('\n📋 REQUEST CONFIG:');
                console.log('  - URL:', error.config.url);
                console.log('  - Method:', error.config.method);
                console.log('  - Headers:', JSON.stringify(error.config.headers, null, 2));
                console.log('  - Data:', error.config.data);
                console.log('  - Timeout:', error.config.timeout);
            }
            
            console.log('\n🔍 FULL ERROR OBJECT:');
            console.log(JSON.stringify(error, null, 2));
            console.log('========================================\n');

            // If batch API fails with 405, try fallback to single material API
            if (error?.response?.status === 405) {
                console.log('🔄 Batch API returned 405, trying fallback to single material API...');
                
                try {
                    loadingToast = toast.loading('Retrying with alternative method...');
                    
                    // Process materials one by one using the original API
                    let successCount = 0;
                    let failCount = 0;
                    
                    for (const usage of materialUsages) {
                        try {
                            const singleApiPayload = {
                                projectId: projectId,
                                sectionId: sectionId,
                                miniSectionId: miniSectionId,
                                materialId: usage.materialId,
                                qnt: usage.quantity
                            };
                            
                            console.log(`Processing material ${usage.materialId} with single API...`);
                            const singleResponse = await axios.post(`${domain}/api/material-usage`, singleApiPayload);
                            const singleResponseData = singleResponse.data as any; // ✅ FIXED: Type assertion
                            
                            if (singleResponseData.success) {
                                successCount++;
                                console.log(`✅ Material ${usage.materialId} processed successfully`);
                            } else {
                                failCount++;
                                console.log(`❌ Material ${usage.materialId} failed:`, singleResponseData.error);
                            }
                        } catch (singleError: any) {
                            failCount++;
                            console.log(`❌ Material ${usage.materialId} failed:`, singleError?.response?.data?.error || singleError.message);
                        }
                    }
                    
                    toast.dismiss(loadingToast);
                    
                    if (successCount > 0) {
                        toast.success(`${successCount} material usages recorded successfully!`);
                        
                        // Refresh materials and update UI
                        await new Promise(resolve => setTimeout(resolve, 500));
                        await reloadProjectMaterials(true);
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        // Stop loading animation
                        stopUsageLoadingAnimation();
                        
                        if (isMountedRef.current) {
                            setActiveTab('used');
                            setShowUsageForm(false);
                        }
                        
                        if (failCount > 0) {
                            toast.error(`${failCount} materials failed to process`);
                        }
                        
                        return; // Exit successfully
                    } else {
                        throw new Error('All materials failed to process');
                    }
                } catch (fallbackError: any) {
                    if (loadingToast) {
                        toast.dismiss(loadingToast);
                    }
                    console.log('❌ Fallback also failed:', fallbackError);
                    toast.error('Failed to process materials with both methods');
                    stopUsageLoadingAnimation();
                    return;
                }
            }

            const errorMessage = error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to add material usages';

            console.log('🔴 Showing error toast:', errorMessage);
            toast.error(errorMessage);
            stopUsageLoadingAnimation();
        } finally {
            isLoadingRef.current = false;
        }
    };

    const handleAddUsage = async (
        materialName: string,
        unit: string,
        variantId: string,
        quantity: number,
        specs: Record<string, any>
    ) => {
        toast.error('Please use the "Add Usage" button at the top to add material usage');
    };

    const handleTransferMaterial = async (
        materialName: string,
        unit: string,
        variantId: string,
        quantity: number,
        specs: Record<string, any>,
        targetProjectId: string
    ) => {
        console.log('=== MATERIAL TRANSFER ===');
        console.log('Material:', materialName);
        console.log('Unit:', unit);
        console.log('Variant ID:', variantId);
        console.log('Quantity:', quantity);
        console.log('Specs:', specs);
        console.log('From Project:', projectId);
        console.log('To Project:', targetProjectId);
        console.log('========================');

        let loadingToast: any = null;
        try {
            loadingToast = toast.loading('Transferring material...');

            // Get client ID
            const { getClientId } = require('@/functions/clientId');
            const clientId = await getClientId();

            if (!clientId) {
                throw new Error('Client ID not found');
            }

            // API call to transfer material
            const transferPayload = {
                fromProjectId: projectId,
                toProjectId: targetProjectId,
                materialName,
                unit,
                variantId,
                quantity,
                specs,
                clientId
            };

            console.log('Transfer payload:', transferPayload);

            const response = await axios.post(`${domain}/api/material/transfer`, transferPayload);
            const responseData = response.data as any;

            toast.dismiss(loadingToast);

            if (responseData.success) {
                toast.success(`Successfully transferred ${quantity} ${unit} of ${materialName}`);
                
                // Reload materials to reflect the transfer
                await reloadProjectMaterials(true);
            } else {
                throw new Error(responseData.message || 'Transfer failed');
            }

        } catch (error: any) {
            console.error('Transfer error:', error);
            if (loadingToast) toast.dismiss(loadingToast);
            
            const errorMessage = error.response?.data?.message || error.message || 'Failed to transfer material';
            toast.error(errorMessage);
        }
    };

    const handleAddSection = async () => {
        if (!newSectionName.trim()) {
            toast.error('Please enter a section name');
            return;
        }

        const { addSection } = require('@/functions/details');
        const { logMiniSectionCreated } = require('@/utils/activityLogger');

        const sectionData = {
            name: newSectionName.trim(),
            projectDetails: {
                projectName: projectName,
                projectId: projectId
            },
            mainSectionDetails: {
                sectionName: sectionName,
                sectionId: sectionId
            }
        };

        console.log('Adding section:', sectionData);

        let loadingToast: any = null;
        try {
            loadingToast = toast.loading('Adding section...');
            const res: any = await addSection(sectionData);

            console.log('\n========================================');
            console.log('ADD SECTION - API RESPONSE');
            console.log('========================================');
            console.log('Full response:', JSON.stringify(res, null, 2));
            console.log('========================================\n');

            toast.dismiss(loadingToast);

            if (res && res.success) {
                toast.success("Section added successfully");

                // Log activity
                await logMiniSectionCreated(
                    projectId,
                    projectName,
                    sectionId,
                    sectionName,
                    res.section?._id || 'unknown',
                    newSectionName.trim()
                );

                // Refetch sections after adding a new one
                const sections = await getSection(sectionId);
                if (sections && Array.isArray(sections)) {
                    setMiniSections(sections);
                }

                // Clear form and close modal
                setNewSectionName('');
                setNewSectionDesc('');
                setShowAddSectionModal(false);
            } else {
                throw new Error(res?.error || 'Failed to add section');
            }
        } catch (error: any) {
            if (loadingToast) {
                toast.dismiss(loadingToast);
            }
            console.error('Add section error:', error);
            const errorMessage = error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to add section';
            toast.error(errorMessage);
        }
    };

    // FIXED: Get current data with proper filtering
    const getCurrentData = () => {
        console.log('\n========================================');
        console.log('GET CURRENT DATA - START');
        console.log('========================================');
        console.log('Active Tab:', activeTab);
        console.log('availableMaterials.length:', availableMaterials.length);
        console.log('usedMaterials.length:', usedMaterials.length);

        // Use the correct array based on active tab
        let materials = activeTab === 'imported' ? availableMaterials : usedMaterials;

        console.log('Selected materials array:', activeTab === 'imported' ? 'availableMaterials' : 'usedMaterials');
        console.log('Total materials before filtering:', materials.length);
        console.log('Current sectionId:', sectionId);
        console.log('Selected mini-section:', selectedMiniSection);

        // For "imported" tab: Show ALL materials (no filtering)
        if (activeTab === 'imported') {
            console.log('✓ Processing IMPORTED materials tab - showing ALL materials');
        }
        // For "used" tab: Filter by current section AND optionally by mini-section
        else if (activeTab === 'used') {
            console.log('✓ Processing USED materials tab...');

            // Log all materials for debugging
            console.log('Materials in usedMaterials array:');
            materials.forEach((m, idx) => {
                console.log(`  ${idx + 1}. ${m.name} - Qty: ${m.quantity}`);
                console.log('     sectionId:', m.sectionId);
                console.log('     miniSectionId:', m.miniSectionId);
            });

            // FIRST: Filter by current section (main section filter)
            console.log('Filtering by current sectionId:', sectionId);
            materials = materials.filter(m => {
                // Match materials that belong to the current section
                const matchesSection = m.sectionId === sectionId;
                if (!matchesSection) {
                    console.log(`  ❌ Filtered out: ${m.name} (sectionId: ${m.sectionId})`);
                }
                return matchesSection;
            });
            console.log('After section filtering:', materials.length, 'materials');

            // SECOND: Filter by mini-section if one is selected
            if (selectedMiniSection && selectedMiniSection !== 'all-sections') {
                console.log('Filtering by selected mini-section:', selectedMiniSection);
                materials = materials.filter(m => {
                    return m.miniSectionId === selectedMiniSection;
                });
                console.log('After mini-section filtering:', materials.length, 'materials');
            } else {
                console.log('✓ No mini-section filter - showing all materials in current section');
            }
        }

        console.log('Final materials count:', materials.length);
        console.log('Final materials:');
        materials.forEach((m, idx) => {
            console.log(`  ${idx + 1}. ${m.name} - Qty: ${m.quantity} ${m.unit}`);
        });
        console.log('========================================\n');

        return materials;
    };

    const getGroupedData = () => {
        const materials = getCurrentData();
        const isUsedTab = activeTab === 'used';
        return groupMaterialsByName(materials, isUsedTab);
    };

    // Pagination helper functions
    const getPaginatedData = (data: any[]) => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return data.slice(startIndex, endIndex);
    };

    const getTotalPages = (totalItems: number) => {
        return Math.ceil(totalItems / itemsPerPage);
    };

    const handlePageChange = async (page: number) => {
        setCurrentPage(page);
        // Scroll to top when page changes
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        
        // Fetch new page data from API
        await reloadProjectMaterials(true, page);
    };

    // Reset pagination when tab changes or filters change and reload data
    useEffect(() => {
        setCurrentPage(1);
        // Reload data with new filters
        reloadProjectMaterials(true, 1);
    }, [activeTab, selectedMiniSection]);

    // Group materials by date for "Used Materials" tab
    const getGroupedByDate = () => {
        if (activeTab !== 'used') {
            return null;
        }

        const materials = getCurrentData();
        const groupedByDate: { [date: string]: Material[] } = {};

        materials.forEach(material => {
            try {
                // Use createdAt or addedAt for grouping
                const dateStr = material.createdAt || material.addedAt || material.date;
                const date = new Date(dateStr);

                // Check if date is valid
                if (isNaN(date.getTime())) {
                    console.warn('Invalid date for material:', material.name, dateStr);
                    // Use a fallback date key
                    const dateKey = 'unknown-date';
                    if (!groupedByDate[dateKey]) {
                        groupedByDate[dateKey] = [];
                    }
                    groupedByDate[dateKey].push(material);
                    return;
                }

                // Use ISO date string (YYYY-MM-DD) as key for proper sorting
                const dateKey = date.toISOString().split('T')[0]; // "2025-12-07"

                if (!groupedByDate[dateKey]) {
                    groupedByDate[dateKey] = [];
                }
                groupedByDate[dateKey].push(material);
            } catch (error) {
                console.error('Error processing material date:', material.name, error);
            }
        });

        // Sort dates in descending order (newest first)
        const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
            return b.localeCompare(a); // ISO dates can be sorted alphabetically
        });

        return sortedDates.map(date => ({
            date,
            materials: groupMaterialsByName(groupedByDate[date], true)
        }));
    };

    const formatDateHeader = (dateString: string) => {
        try {
            // Handle unknown date
            if (dateString === 'unknown-date') {
                return 'Unknown Date';
            }

            // dateString is in ISO format: "2025-12-07"
            const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues

            // Check if date is valid
            if (isNaN(date.getTime())) {
                console.warn('Invalid date string in header:', dateString);
                return 'Unknown Date';
            }

            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            // Compare dates (ignore time)
            const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

            if (dateOnly.getTime() === todayOnly.getTime()) return 'Today';
            if (dateOnly.getTime() === yesterdayOnly.getTime()) return 'Yesterday';

            // Format as "December 7, 2025"
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date header:', dateString, error);
            return 'Unknown Date';
        }
    };

    // Calculate these values - they will update when dependencies change
    const filteredMaterials = getCurrentData();
    const groupedMaterials = getGroupedData();
    const totalCost = filteredMaterials.reduce((sum, material) => sum + (material.price * material.quantity), 0);

    // Pagination calculations using API totals
    const getDataForPagination = () => {
        if (activeTab === 'used') {
            return totalUsedCount;
        }
        return totalAvailableCount;
    };

    const totalItemsCount = getDataForPagination();
    const totalPages = getTotalPages(totalItemsCount);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItemsCount);

    // For display, we use the current page data directly (no client-side pagination needed)
    const displayMaterials = activeTab === 'imported' ? availableMaterials : usedMaterials;

    // Minimal logging for debugging (only in development)
    if (__DEV__ && consoleLogCount < MAX_CONSOLE_LOGS) {
        console.log(`Render: ${activeTab} tab, ${groupedMaterials.length} groups`);
        consoleLogCount++;
    }

    const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`;
    const getSectionName = (sectionId: string | undefined) => {
        if (!sectionId) return 'Unassigned';
        const section = predefinedSections.find(s => s._id === sectionId);
        return section ? section.name : 'Unassigned';
    };

    const addMaterialRequest = async (materials: MaterialEntry[], message: string) => {
        console.log("=== MATERIAL REQUEST SUBMISSION ===");
        console.log("1. projectId:", projectId);
        console.log("2. message:", message);
        console.log("3. materials:", materials);
        console.log("=====================================");

        // Prevent duplicate submissions
        if (isLoadingRef.current || isAddingMaterial) {
            toast.error('Please wait for the current operation to complete');
            return;
        }

        // Validation before sending
        if (!projectId) {
            toast.error("Project ID is missing");
            return;
        }

        if (!materials || materials.length === 0) {
            toast.error("No materials to send");
            return;
        }

        // Start loading animation
        startMaterialLoadingAnimation();
        toast.loading(`Adding ${materials.length} material${materials.length === 1 ? '' : 's'}...`);

        // Transform materials to match API format
        const formattedMaterials = materials.map((material: any) => ({
            projectId: projectId,
            materialName: material.materialName,
            unit: material.unit,
            specs: material.specs || {},
            qnt: material.qnt,
            perUnitCost: material.perUnitCost, // ✅ FIXED: Use perUnitCost instead of cost
            mergeIfExists: material.mergeIfExists !== undefined ? material.mergeIfExists : true,
        }));

        console.log("=== PAYLOAD BEING SENT ===");
        console.log(JSON.stringify(formattedMaterials, null, 2));
        console.log("==========================");

        try {
            const res = await axios.post(`${domain}/api/material`, formattedMaterials);

            const responseData = res.data as any;

            // Check response
            if (responseData.success) {
                console.log("=== ADD MATERIAL SUCCESS ===");
                console.log("Response:", responseData);
                console.log("Results:", responseData.results);
                console.log("===========================");

                // Count successful additions
                const successCount = responseData.results?.filter((r: any) => r.success).length || 0;
                const failCount = responseData.results?.filter((r: any) => !r.success).length || 0;

                if (successCount > 0) {
                    // Update loading message
                    toast.loading('Logging activity...');

                    // ✅ FIXED: Log material activity ONLY for successful materials
                    const successfulResults = responseData.results?.filter((r: any) => r.success) || [];
                    
                    console.log('🔍 DEBUG: Successful Results Structure:');
                    successfulResults.forEach((result: any, index: number) => {
                        console.log(`  Result ${index + 1}:`, {
                            success: result.success,
                            'INPUT (what was added)': {
                                materialName: result.input?.materialName,
                                unit: result.input?.unit,
                                qnt: result.input?.qnt,
                                perUnitCost: result.input?.perUnitCost,
                                totalCost: result.input?.totalCost,
                            },
                            'MATERIAL (merged result in DB)': {
                                name: result.material?.name,
                                unit: result.material?.unit,
                                qnt: result.material?.qnt,
                                perUnitCost: result.material?.perUnitCost,
                                totalCost: result.material?.totalCost,
                            },
                            'WILL USE': 'INPUT data for activity logging'
                        });
                    });

                    const successfulMaterials = successfulResults.map((result: any) => {
                        // ✅ CRITICAL FIX: Always use INPUT data for activity logging
                        // This ensures we show what was actually added, not the merged database result
                        
                        // Get original input values (what user actually added)
                        const inputQnt = result.input?.qnt || 0;
                        const inputPerUnitCost = result.input?.perUnitCost || 0;
                        const inputTotalCost = result.input?.totalCost || (inputQnt * inputPerUnitCost);
                        
                        const materialData = {
                            name: result.input?.materialName || result.material?.name || 'Unknown Material',
                            unit: result.input?.unit || result.material?.unit || 'unit',
                            specs: result.input?.specs || result.material?.specs || {},
                            qnt: inputQnt, // ✅ ALWAYS use input quantity (what was actually added)
                            perUnitCost: inputPerUnitCost, // ✅ Use input per-unit cost
                            totalCost: inputTotalCost, // ✅ Use input total cost
                            cost: inputTotalCost, // ✅ For notification compatibility
                            addedAt: new Date(),
                        };
                        
                        console.log('🔍 Activity Logging Data (FIXED):');
                        console.log('   - Material:', materialData.name);
                        console.log('   - INPUT quantity (what was added):', inputQnt);
                        console.log('   - DATABASE quantity (after merge):', result.material?.qnt);
                        console.log('   - USING for notification:', inputQnt, '✅');
                        console.log('   - Input total cost:', inputTotalCost);
                        
                        return materialData;
                    });

                    console.log('🔔 FINAL SUCCESSFUL MATERIALS FOR LOGGING:');
                    console.log('  - Count:', successfulMaterials.length);
                    successfulMaterials.forEach((material: any, index: number) => {
                        console.log(`  ${index + 1}. ${material.name} (${material.qnt} ${material.unit}) - ₹${material.totalCost}`);
                    });

                    // Only log activity if we have successful materials
                    if (successfulMaterials.length > 0) {
                        console.log('🔔 LOGGING BOTH DETAILED AND GENERAL ACTIVITIES FOR ALL USERS');
                        console.log('  - User type: ALL (admin and staff get same notifications)');
                        console.log('  - Successful materials count:', successfulMaterials.length);
                        
                        // 1. Log detailed material activity (shows specific materials imported)
                        try {
                            console.log('\n🔔 STEP 1: Logging detailed material activity...');
                            
                            // Validate materials before logging
                            const validMaterials = successfulMaterials.filter((material: any) => {
                                const isValid = material.name && material.unit && typeof material.qnt === 'number' && material.qnt > 0;
                                if (!isValid) {
                                    console.warn('⚠️ Invalid material detected:', material);
                                }
                                return isValid;
                            });
                            
                            console.log('📋 Valid materials for detailed logging:', validMaterials.length, 'out of', successfulMaterials.length);
                            validMaterials.forEach((m: any, index: number) => {
                                console.log(`  ${index + 1}. ${m.name} (${m.qnt} ${m.unit} - ₹${m.totalCost})`);
                            });
                            
                            if (validMaterials.length > 0) {
                                await logMaterialActivity(validMaterials, 'imported', message);
                                console.log('✅ STEP 1 COMPLETED: Detailed material activity logged successfully');
                            } else {
                                console.error('❌ STEP 1 SKIPPED: No valid materials to log');
                            }
                        } catch (activityError) {
                            console.error('❌ STEP 1 FAILED: Failed to log detailed material activity:', activityError);
                            // Don't fail the whole operation if activity logging fails
                        }

                        // 2. Log general activity (shows generic "imported materials to project" message)
                        const totalCost = successfulMaterials.reduce((sum: number, m: any) => sum + (m.totalCost || 0), 0);
                        try {
                            console.log('\n🔔 STEP 2: Logging general activity...');
                            console.log('📋 General activity details:');
                            console.log('   - Project ID:', projectId);
                            console.log('   - Project Name:', projectName);
                            console.log('   - Success Count:', successCount);
                            console.log('   - Total Cost:', totalCost);
                            console.log('   - Message:', message);
                            await logMaterialImported(
                                projectId,
                                projectName,
                                successCount,
                                totalCost,
                                message
                            );
                            console.log('✅ STEP 2 COMPLETED: General activity logged successfully');
                        } catch (generalActivityError) {
                            console.error('❌ STEP 2 FAILED: Failed to log general activity:', generalActivityError);
                            // Don't fail the whole operation if general activity logging fails
                        }

                        console.log('🎉 BOTH ACTIVITY TYPES LOGGED - Staff and Admin will see same notifications');
                    }
                }

                // Update loading message for refresh
                toast.loading('Refreshing materials...');

                // Refresh project materials after adding
                await reloadProjectMaterials();

                // Stop loading animation and show success
                stopMaterialLoadingAnimation();
                toast.dismiss(); // Dismiss loading toast

                if (failCount > 0) {
                    toast.error(`Failed to add ${failCount} material${failCount > 1 ? 's' : ''}`);
                } else {
                    toast.success(`✅ Successfully added ${successCount} material${successCount === 1 ? '' : 's'}`);
                }
            } else {
                throw new Error(responseData.error || 'Failed to add materials');
            }

        } catch (error) {
            console.error("Material request error:", error);

            // Stop loading animation and show error
            stopMaterialLoadingAnimation();
            toast.dismiss(); // Dismiss loading toast

            // Enhanced error logging for debugging
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { status?: number, data?: any, statusText?: string } };
                console.error("=== API ERROR DETAILS ===");
                console.error("Status:", axiosError.response?.status);
                console.error("Status Text:", axiosError.response?.statusText);
                console.error("Response Data:", axiosError.response?.data);
                console.error("========================");

                const errorMessage = axiosError.response?.data?.message ||
                    axiosError.response?.data?.error ||
                    `API Error: ${axiosError.response?.status}`;
                toast.error(errorMessage);
            } else {
                console.error("Non-Axios error:", error);
                toast.error("Failed to add materials");
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header
                selectedSection={null}
                onSectionSelect={() => { }}
                totalCost={totalCost}
                formatPrice={formatPrice}
                getSectionName={getSectionName}
                projectName={projectName}
                sectionName={sectionName}
                projectId={projectId}
                sectionId={sectionId}
                onShowSectionPrompt={() => { }}
                hideSection={true}
            />

            {/* Action Buttons - Sticky at top, visible to everyone in "imported" tab */}
            {activeTab === 'imported' && (
                <View style={actionStyles.stickyActionButtonsContainer}>
                    <TouchableOpacity
                        style={[
                            actionStyles.addMaterialButton,
                            isAddingMaterial && actionStyles.addMaterialButtonDisabled
                        ]}
                        onPress={() => setShowMaterialForm(true)}
                        activeOpacity={0.7}
                        disabled={isAddingMaterial || isAddingMaterialUsage}
                    >
                        {isAddingMaterial ? (
                            <Animated.View
                                style={{
                                    transform: [
                                        {
                                            rotate: materialLoadingAnimation.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0deg', '360deg'],
                                            }),
                                        },
                                    ],
                                }}
                            >
                                <Ionicons name="sync" size={20} color="#94A3B8" />
                            </Animated.View>
                        ) : (
                            <Ionicons name="add-circle-outline" size={20} color="#059669" />
                        )}
                        <Text style={[
                            actionStyles.addMaterialButtonText,
                            isAddingMaterial && actionStyles.addMaterialButtonTextDisabled
                        ]}>
                            {isAddingMaterial ? 'Adding...' : 'Add Material'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            actionStyles.addUsageButton,
                            isAddingMaterialUsage && actionStyles.addUsageButtonDisabled
                        ]}
                        onPress={() => setShowUsageForm(true)}
                        activeOpacity={0.7}
                        disabled={isAddingMaterial || isAddingMaterialUsage}
                    >
                        {isAddingMaterialUsage ? (
                            <Animated.View
                                style={{
                                    transform: [
                                        {
                                            rotate: usageLoadingAnimation.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0deg', '360deg'],
                                            }),
                                        },
                                    ],
                                }}
                            >
                                <Ionicons name="sync" size={20} color="#94A3B8" />
                            </Animated.View>
                        ) : (
                            <Ionicons name="arrow-forward-circle-outline" size={20} color="#DC2626" />
                        )}
                        <Text style={[
                            actionStyles.addUsageButtonText,
                            isAddingMaterialUsage && actionStyles.addUsageButtonTextDisabled
                        ]}>
                            {isAddingMaterialUsage ? 'Adding...' : 'Add Usage'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Material Activity Notifications Modal */}
            <MaterialActivityNotifications
                visible={showNotifications}
                onClose={() => setShowNotifications(false)}
                projectId={projectId}
            />
            <MaterialFormModal
                visible={showMaterialForm}
                onClose={() => setShowMaterialForm(false)}
                onSubmit={async (materials, message) => {
                    try {
                        await addMaterialRequest(materials, message);
                        setShowMaterialForm(false);
                    } catch (error) {
                        console.error('Error in material form submission:', error);
                        // Don't close the form if there's an error
                        throw error; // Re-throw to let MaterialFormModal handle it
                    }
                }}
            />
            <MaterialUsageForm
                visible={showUsageForm}
                onClose={() => setShowUsageForm(false)}
                onSubmit={handleAddMaterialUsage}
                availableMaterials={availableMaterials.filter(m => {
                    // Show materials that have no sectionId (global) OR match current sectionId
                    const isAvailable = !m.sectionId || m.sectionId === sectionId;
                    if (!isAvailable) {
                        console.log(`🚫 Filtering out material: ${m.name} (sectionId: ${m.sectionId}, current: ${sectionId})`);
                    }
                    return isAvailable;
                })}
                miniSections={miniSections}
                projectId={projectId}
                sectionId={sectionId}
            />

            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <TabSelector activeTab={activeTab} onSelectTab={setActiveTab} />

                {/* Navigation Section - Always visible */}
                <View style={navigationStyles.navigationContainer}>
                    <TouchableOpacity
                        style={navigationStyles.laborNavigationButton}
                        onPress={() => {
                            router.push({
                                pathname: '/labor',
                                params: {
                                    projectId,
                                    projectName,
                                    sectionId,
                                    sectionName
                                }
                            });
                        }}
                        activeOpacity={0.7}
                    >
                        <View style={navigationStyles.laborButtonContent}>
                            <Ionicons name="people-circle" size={24} color="#3B82F6" />
                            <View style={navigationStyles.laborButtonTextContainer}>
                                <Text style={navigationStyles.laborButtonTitle}>Labor Management</Text>
                                <Text style={navigationStyles.laborButtonSubtitle}>Manage labor entries for this section</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Notification Button - Inside scroll view */}
                {/* <View style={notificationStyles.notificationButtonContainer}>
                    <TouchableOpacity
                        style={notificationStyles.notificationButton}
                        onPress={() => setShowNotifications(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="notifications" size={20} color="#3B82F6" />
                        <Text style={notificationStyles.notificationButtonText}>Activity Log</Text>
                    </TouchableOpacity>
                </View> */}

                {/* Compact Filters - Only visible in "Used Materials" tab */}
                {activeTab === 'used' && (
                    <View style={sectionStyles.filtersContainer}>
                        {/* Section Filter - Compact Dropdown */}
                        <View style={sectionStyles.filterRow}>
                            <Ionicons name="layers-outline" size={16} color="#64748B" style={sectionStyles.filterIcon} />
                            {miniSections.length > 0 ? (
                                <View style={sectionStyles.compactSectionSelector}>
                                    <SectionManager
                                        onSectionSelect={(sectionId) => {
                                            setSelectedMiniSection(sectionId === 'all-sections' ? null : sectionId);
                                        }}
                                        onAddSection={async (newSection) => {
                                            // Refetch sections after adding a new one
                                            const sections = await getSection(sectionId);
                                            if (sections && Array.isArray(sections)) {
                                                setMiniSections(sections);
                                            }
                                        }}
                                        selectedSection={selectedMiniSection || 'all-sections'}
                                        sections={[
                                            { id: 'all-sections', name: 'All Sections', createdAt: new Date().toISOString() },
                                            ...miniSections.map(s => ({
                                                id: s._id,
                                                name: s.name,
                                                createdAt: s.createdAt
                                            }))
                                        ]}
                                        compact={true}
                                        projectDetails={{
                                            projectName: projectName,
                                            projectId: projectId
                                        }}
                                        mainSectionDetails={{
                                            sectionName: sectionName,
                                            sectionId: sectionId
                                        }}
                                    />
                                </View>
                            ) : (
                                <View style={sectionStyles.noSectionsWrapper}>
                                    <View style={sectionStyles.noSectionsCompact}>
                                        <Ionicons name="alert-circle-outline" size={16} color="#D97706" />
                                        <Text style={sectionStyles.noSectionsTextCompact}>No mini-sections</Text>
                                    </View>
                                    <SectionManager
                                        onSectionSelect={(sectionId) => {
                                            setSelectedMiniSection(sectionId);
                                        }}
                                        onAddSection={async (newSection) => {
                                            // Refetch sections after adding a new one
                                            const sections = await getSection(sectionId);
                                            if (sections && Array.isArray(sections)) {
                                                setMiniSections(sections);
                                            }
                                        }}
                                        selectedSection={null}
                                        sections={[]}
                                        compact={true}
                                        projectDetails={{
                                            projectName: projectName,
                                            projectId: projectId
                                        }}
                                        mainSectionDetails={{
                                            sectionName: sectionName,
                                            sectionId: sectionId
                                        }}
                                    />
                                </View>
                            )}
                        </View>
                    </View>
                )}

                <View style={styles.materialsSection}>
                    <View style={paginationStyles.headerContainer}>
                        <Text style={styles.sectionTitle}>
                            {activeTab === 'imported' ? 'Available Materials' : 'Used Materials'}
                            {activeTab === 'used' && selectedMiniSection && (
                                <Text style={{ fontSize: 14, color: '#64748B', fontWeight: '400' }}>
                                    {' '}(Filtered)
                                </Text>
                            )}
                        </Text>
                        
                        {/* Material count and pagination info */}
                        {!loading && totalItemsCount > 0 && (
                            <View style={paginationStyles.infoContainer}>
                                <Text style={paginationStyles.infoText}>
                                    Showing {startItem}-{endItem} of {totalItemsCount} {activeTab === 'used' ? 'used materials' : 'available materials'}
                                </Text>
                                {totalPages > 1 && (
                                    <Text style={paginationStyles.pageInfo}>
                                        Page {currentPage} of {totalPages}
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                    {loading ? (
                        <View style={styles.noMaterialsContainer}>
                            <Animated.View style={{
                                transform: [{
                                    rotate: cardAnimations[0]?.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0deg', '360deg'],
                                    }) || '0deg'
                                }]
                            }}>
                                <Ionicons name="sync" size={48} color="#3B82F6" />
                            </Animated.View>
                            <Text style={styles.noMaterialsTitle}>Loading Materials...</Text>
                            <Text style={styles.noMaterialsDescription}>
                                Please wait while we fetch your data...
                            </Text>
                        </View>
                    ) : activeTab === 'used' ? (
                        // Used Materials tab - display API data directly
                        (() => {
                            if (usedMaterials.length === 0) {
                                return (
                                    <View style={styles.noMaterialsContainer}>
                                        {miniSections.length === 0 ? (
                                            <>
                                                <Ionicons name="layers-outline" size={64} color="#CBD5E1" />
                                                <Text style={styles.noMaterialsTitle}>No Mini-Sections Found</Text>
                                                <Text style={[styles.noMaterialsDescription, { marginBottom: 20 }]}>
                                                    Create mini-sections to organize and track material usage in different areas of your project.
                                                </Text>
                                                <TouchableOpacity
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: '#3B82F6',
                                                        paddingVertical: 12,
                                                        paddingHorizontal: 24,
                                                        borderRadius: 10,
                                                        gap: 8,
                                                        marginTop: 8,
                                                        shadowColor: '#3B82F6',
                                                        shadowOffset: { width: 0, height: 4 },
                                                        shadowOpacity: 0.3,
                                                        shadowRadius: 8,
                                                        elevation: 4,
                                                    }}
                                                    onPress={() => {
                                                        setShowAddSectionModal(true);
                                                    }}
                                                >
                                                    <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                                                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
                                                        Add Section
                                                    </Text>
                                                </TouchableOpacity>
                                            </>
                                        ) : (
                                            <>
                                                <Ionicons name="cube-outline" size={64} color="#CBD5E1" />
                                                <Text style={styles.noMaterialsTitle}>No Materials Found</Text>
                                                <Text style={styles.noMaterialsDescription}>
                                                    No used materials found for this section.
                                                </Text>
                                            </>
                                        )}
                                    </View>
                                );
                            }

                            // Group materials by date for display
                            const groupedByDate = getGroupedByDate();
                            if (!groupedByDate || groupedByDate.length === 0) {
                                return (
                                    <View style={styles.noMaterialsContainer}>
                                        <Ionicons name="cube-outline" size={64} color="#CBD5E1" />
                                        <Text style={styles.noMaterialsTitle}>No Materials Found</Text>
                                        <Text style={styles.noMaterialsDescription}>
                                            No used materials found for this page.
                                        </Text>
                                    </View>
                                );
                            }
                            
                            return groupedByDate.map((dateGroup, dateIndex) => (
                                <View key={dateGroup.date} style={dateGroupStyles.dateGroupContainer}>
                                    {/* Date Header */}
                                    <View style={dateGroupStyles.dateHeader}>
                                        {/* Left: Material count */}
                                        <View style={dateGroupStyles.dateHeaderLeft}>
                                            <Ionicons name="cube-outline" size={16} color="#64748B" />
                                            <Text style={dateGroupStyles.materialCountText}>
                                                {dateGroup.materials.length} {dateGroup.materials.length === 1 ? 'Material' : 'Materials'}
                                            </Text>
                                        </View>

                                        {/* Right: Date */}
                                        <View style={dateGroupStyles.dateHeaderRight}>
                                            <Text style={dateGroupStyles.dateHeaderText}>
                                                {formatDateHeader(dateGroup.date)}
                                            </Text>
                                            <Ionicons name="calendar-outline" size={16} color="#64748B" />
                                        </View>
                                    </View>

                                    {/* Materials for this date */}
                                    {dateGroup.materials.map((material: any, index: number) => (
                                        <MaterialCardEnhanced
                                            key={`${dateGroup.date}-${material.name}-${material.unit}-${JSON.stringify(material.specs || {})}-${material.totalCost || 0}`}
                                            material={material}
                                            animation={cardAnimations[dateIndex * 10 + index] || new Animated.Value(1)}
                                            activeTab={activeTab}
                                            onAddUsage={handleAddUsage}
                                            onTransferMaterial={handleTransferMaterial}
                                            currentProjectId={projectId}
                                            miniSections={miniSections}
                                            showMiniSectionLabel={!selectedMiniSection}
                                        />
                                    ))}
                                </View>
                            ));
                        })()
                    ) : availableMaterials.length > 0 ? (
                        // Available Materials tab - display API data directly
                        groupMaterialsByName(availableMaterials, false).map((material, index) => (
                            <MaterialCardEnhanced
                                key={`${material.name}-${material.unit}-${JSON.stringify(material.specs || {})}-${material.totalCost || 0}`}
                                material={material}
                                animation={cardAnimations[index] || new Animated.Value(1)}
                                activeTab={activeTab}
                                onAddUsage={handleAddUsage}
                                onTransferMaterial={handleTransferMaterial}
                                currentProjectId={projectId}
                                miniSections={miniSections}
                                showMiniSectionLabel={false}
                            />
                        ))
                    ) : (
                        <View style={styles.noMaterialsContainer}>
                            {miniSections.length === 0 ? (
                                <>
                                    <Ionicons name="layers-outline" size={64} color="#CBD5E1" />
                                    <Text style={styles.noMaterialsTitle}>No Mini-Sections Found</Text>
                                    <Text style={[styles.noMaterialsDescription, { marginBottom: 20 }]}>
                                        Create mini-sections to organize and track material usage in different areas of your project.
                                    </Text>
                                    <TouchableOpacity
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: '#3B82F6',
                                            paddingVertical: 12,
                                            paddingHorizontal: 24,
                                            borderRadius: 10,
                                            gap: 8,
                                            marginTop: 8,
                                            shadowColor: '#3B82F6',
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.3,
                                            shadowRadius: 8,
                                            elevation: 4,
                                        }}
                                        onPress={() => {
                                            setShowAddSectionModal(true);
                                        }}
                                    >
                                        <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
                                            Add Section
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="cube-outline" size={64} color="#CBD5E1" />
                                    <Text style={styles.noMaterialsTitle}>No Materials Found</Text>
                                    <Text style={styles.noMaterialsDescription}>
                                        No {activeTab === 'imported' ? 'available' : 'used'} materials found for this project.
                                        {activeTab === 'imported' && ' Add materials using the + button above.'}
                                    </Text>
                                </>
                            )}
                        </View>
                    )}

                    {/* Pagination Controls */}
                    {!loading && totalPages > 1 && (
                        <View style={paginationStyles.paginationContainer}>
                            {apiLoading && (
                                <View style={paginationStyles.loadingContainer}>
                                    <Animated.View style={{
                                        transform: [{
                                            rotate: cardAnimations[0]?.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0deg', '360deg'],
                                            }) || '0deg'
                                        }]
                                    }}>
                                        <Ionicons name="sync" size={20} color="#3B82F6" />
                                    </Animated.View>
                                    <Text style={paginationStyles.loadingText}>Loading page...</Text>
                                </View>
                            )}
                            
                            <View style={[paginationStyles.paginationControls, apiLoading && { opacity: 0.5 }]}>
                                {/* Previous Button */}
                                <TouchableOpacity
                                    style={[
                                        paginationStyles.paginationButton,
                                        (currentPage === 1 || apiLoading) && paginationStyles.paginationButtonDisabled
                                    ]}
                                    onPress={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1 || apiLoading}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons 
                                        name="chevron-back" 
                                        size={20} 
                                        color={(currentPage === 1 || apiLoading) ? '#CBD5E1' : '#3B82F6'} 
                                    />
                                    <Text style={[
                                        paginationStyles.paginationButtonText,
                                        (currentPage === 1 || apiLoading) && paginationStyles.paginationButtonTextDisabled
                                    ]}>
                                        Previous
                                    </Text>
                                </TouchableOpacity>

                                {/* Page Numbers */}
                                <View style={paginationStyles.pageNumbersContainer}>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                        // Show first page, last page, current page, and pages around current
                                        const showPage = page === 1 || 
                                                        page === totalPages || 
                                                        Math.abs(page - currentPage) <= 1;
                                        
                                        if (!showPage && page !== 2 && page !== totalPages - 1) {
                                            // Show ellipsis for gaps
                                            if (page === 2 && currentPage > 4) {
                                                return (
                                                    <Text key={`ellipsis-${page}`} style={paginationStyles.ellipsis}>
                                                        ...
                                                    </Text>
                                                );
                                            }
                                            if (page === totalPages - 1 && currentPage < totalPages - 3) {
                                                return (
                                                    <Text key={`ellipsis-${page}`} style={paginationStyles.ellipsis}>
                                                        ...
                                                    </Text>
                                                );
                                            }
                                            return null;
                                        }

                                        return (
                                            <TouchableOpacity
                                                key={page}
                                                style={[
                                                    paginationStyles.pageNumberButton,
                                                    page === currentPage && paginationStyles.pageNumberButtonActive,
                                                    apiLoading && { opacity: 0.5 }
                                                ]}
                                                onPress={() => handlePageChange(page)}
                                                disabled={apiLoading}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[
                                                    paginationStyles.pageNumberText,
                                                    page === currentPage && paginationStyles.pageNumberTextActive
                                                ]}>
                                                    {page}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* Next Button */}
                                <TouchableOpacity
                                    style={[
                                        paginationStyles.paginationButton,
                                        (currentPage === totalPages || apiLoading) && paginationStyles.paginationButtonDisabled
                                    ]}
                                    onPress={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages || apiLoading}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        paginationStyles.paginationButtonText,
                                        (currentPage === totalPages || apiLoading) && paginationStyles.paginationButtonTextDisabled
                                    ]}>
                                        Next
                                    </Text>
                                    <Ionicons 
                                        name="chevron-forward" 
                                        size={20} 
                                        color={(currentPage === totalPages || apiLoading) ? '#CBD5E1' : '#3B82F6'} 
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Items per page info */}
                            <Text style={paginationStyles.itemsPerPageText}>
                                {itemsPerPage} items per page
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Custom Date Picker Modal */}
            <Modal
                visible={showCustomDatePicker}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCustomDatePicker(false)}
            >
                <View style={sectionStyles.modalOverlay}>
                    <View style={sectionStyles.modalContent}>
                        <Text style={sectionStyles.modalTitle}>Select Date Range</Text>

                        <Text style={sectionStyles.dateLabel}>Start Date</Text>
                        <TouchableOpacity
                            style={sectionStyles.dateButton}
                            onPress={() => setShowStartPicker(true)}
                        >
                            <Ionicons name="calendar" size={20} color="#3B82F6" />
                            <Text style={sectionStyles.dateButtonText}>
                                {customStartDate.toLocaleDateString()}
                            </Text>
                        </TouchableOpacity>

                        <Text style={sectionStyles.dateLabel}>End Date</Text>
                        <TouchableOpacity
                            style={sectionStyles.dateButton}
                            onPress={() => setShowEndPicker(true)}
                        >
                            <Ionicons name="calendar" size={20} color="#3B82F6" />
                            <Text style={sectionStyles.dateButtonText}>
                                {customEndDate.toLocaleDateString()}
                            </Text>
                        </TouchableOpacity>

                        <View style={sectionStyles.modalButtons}>
                            <TouchableOpacity
                                style={sectionStyles.modalCancelButton}
                                onPress={() => {
                                    setShowCustomDatePicker(false);
                                    setSelectedPeriod('All');
                                }}
                            >
                                <Text style={sectionStyles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={sectionStyles.modalApplyButton}
                                onPress={() => {
                                    if (customStartDate > customEndDate) {
                                        toast.error('Start date must be before end date');
                                        return;
                                    }
                                    setShowCustomDatePicker(false);
                                    toast.success(`Showing materials from ${customStartDate.toLocaleDateString()} to ${customEndDate.toLocaleDateString()}`);
                                }}
                            >
                                <Text style={sectionStyles.modalApplyText}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Date Pickers */}
            {showStartPicker && (
                <DateTimePicker
                    value={customStartDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                        setShowStartPicker(Platform.OS === 'ios');
                        if (selectedDate) {
                            setCustomStartDate(selectedDate);
                        }
                    }}
                    maximumDate={new Date()}
                />
            )}
            {showEndPicker && (
                <DateTimePicker
                    value={customEndDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                        setShowEndPicker(Platform.OS === 'ios');
                        if (selectedDate) {
                            setCustomEndDate(selectedDate);
                        }
                    }}
                    maximumDate={new Date()}
                    minimumDate={customStartDate}
                />
            )}

            {/* Add Section Modal */}
            <Modal
                visible={showAddSectionModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddSectionModal(false)}
            >
                <View style={sectionStyles.modalOverlay}>
                    <View style={sectionStyles.modalContent}>
                        <Text style={sectionStyles.modalTitle}>Add New Section</Text>

                        <Text style={sectionStyles.dateLabel}>Section Name *</Text>
                        <TextInput
                            style={sectionStyles.dateButton}
                            value={newSectionName}
                            onChangeText={setNewSectionName}
                            placeholder="e.g., Base, First Slab, Second Slab"
                            placeholderTextColor="#94A3B8"
                        />

                        <Text style={sectionStyles.dateLabel}>Description (Optional)</Text>
                        <TextInput
                            style={[sectionStyles.dateButton, { minHeight: 80, textAlignVertical: 'top' }]}
                            value={newSectionDesc}
                            onChangeText={setNewSectionDesc}
                            placeholder="Add a description for this section"
                            placeholderTextColor="#94A3B8"
                            multiline
                            numberOfLines={3}
                        />

                        <View style={sectionStyles.modalButtons}>
                            <TouchableOpacity
                                style={sectionStyles.modalCancelButton}
                                onPress={() => {
                                    setShowAddSectionModal(false);
                                    setNewSectionName('');
                                    setNewSectionDesc('');
                                }}
                            >
                                <Text style={sectionStyles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={sectionStyles.modalApplyButton}
                                onPress={handleAddSection}
                                disabled={!newSectionName.trim()}
                            >
                                <Text style={sectionStyles.modalApplyText}>Add Section</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Material Loading Overlay */}
            {isAddingMaterial && (
                <View style={loadingStyles.loadingOverlay}>
                    <View style={loadingStyles.loadingContainer}>
                        <Animated.View
                            style={[
                                loadingStyles.loadingSpinner,
                                {
                                    transform: [
                                        {
                                            rotate: materialLoadingAnimation.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0deg', '360deg'],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        >
                            <Ionicons name="cube" size={48} color="#059669" />
                        </Animated.View>
                        <Text style={loadingStyles.loadingTitle}>Adding Materials</Text>
                        <Text style={loadingStyles.loadingSubtitle}>Please wait while we process your request...</Text>
                        
                        {/* Progress dots animation */}
                        <View style={loadingStyles.dotsContainer}>
                            <Animated.View
                                style={[
                                    loadingStyles.dot,
                                    {
                                        opacity: materialLoadingAnimation.interpolate({
                                            inputRange: [0, 0.33, 0.66, 1],
                                            outputRange: [0.3, 1, 0.3, 0.3],
                                        }),
                                    },
                                ]}
                            />
                            <Animated.View
                                style={[
                                    loadingStyles.dot,
                                    {
                                        opacity: materialLoadingAnimation.interpolate({
                                            inputRange: [0, 0.33, 0.66, 1],
                                            outputRange: [0.3, 0.3, 1, 0.3],
                                        }),
                                    },
                                ]}
                            />
                            <Animated.View
                                style={[
                                    loadingStyles.dot,
                                    {
                                        opacity: materialLoadingAnimation.interpolate({
                                            inputRange: [0, 0.33, 0.66, 1],
                                            outputRange: [0.3, 0.3, 0.3, 1],
                                        }),
                                    },
                                ]}
                            />
                        </View>
                    </View>
                </View>
            )}

            {/* Material Usage Loading Overlay */}
            {isAddingMaterialUsage && (
                <View style={loadingStyles.loadingOverlay}>
                    <View style={loadingStyles.loadingContainer}>
                        <Animated.View
                            style={[
                                loadingStyles.loadingSpinner,
                                {
                                    transform: [
                                        {
                                            rotate: usageLoadingAnimation.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0deg', '360deg'],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        >
                            <Ionicons name="arrow-forward-circle" size={48} color="#DC2626" />
                        </Animated.View>
                        <Text style={loadingStyles.loadingTitle}>Recording Material Usage</Text>
                        <Text style={loadingStyles.loadingSubtitle}>Please wait while we process your request...</Text>
                        
                        {/* Progress dots animation */}
                        <View style={loadingStyles.dotsContainer}>
                            <Animated.View
                                style={[
                                    loadingStyles.dot,
                                    {
                                        opacity: usageLoadingAnimation.interpolate({
                                            inputRange: [0, 0.33, 0.66, 1],
                                            outputRange: [0.3, 1, 0.3, 0.3],
                                        }),
                                    },
                                ]}
                            />
                            <Animated.View
                                style={[
                                    loadingStyles.dot,
                                    {
                                        opacity: usageLoadingAnimation.interpolate({
                                            inputRange: [0, 0.33, 0.66, 1],
                                            outputRange: [0.3, 0.3, 1, 0.3],
                                        }),
                                    },
                                ]}
                            />
                            <Animated.View
                                style={[
                                    loadingStyles.dot,
                                    {
                                        opacity: usageLoadingAnimation.interpolate({
                                            inputRange: [0, 0.33, 0.66, 1],
                                            outputRange: [0.3, 0.3, 0.3, 1],
                                        }),
                                    },
                                ]}
                            />
                        </View>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

const actionStyles = StyleSheet.create({
    stickyActionButtonsContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 8,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    addMaterialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0FDF4',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRightWidth: 0.5,
        borderRightColor: '#E5E7EB',
        gap: 8,
    },
    addMaterialButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#059669',
    },
    addUsageButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF2F2',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderLeftWidth: 0.5,
        borderLeftColor: '#E5E7EB',
        gap: 8,
    },
    addUsageButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#DC2626',
    },
    addMaterialButtonDisabled: {
        backgroundColor: '#F1F5F9',
        opacity: 0.7,
    },
    addMaterialButtonTextDisabled: {
        color: '#94A3B8',
    },
    addUsageButtonDisabled: {
        backgroundColor: '#F1F5F9',
        opacity: 0.7,
    },
    addUsageButtonTextDisabled: {
        color: '#94A3B8',
    },
});

const navigationStyles = StyleSheet.create({
    navigationContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    laborNavigationButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    laborButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        gap: 12,
    },
    laborButtonTextContainer: {
        flex: 1,
    },
    laborButtonTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    laborButtonSubtitle: {
        fontSize: 13,
        color: '#6B7280',
    },
});

const notificationStyles = StyleSheet.create({
    notificationButtonContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    notificationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EFF6FF',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        gap: 8,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    notificationButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
});

const dateGroupStyles = StyleSheet.create({
    dateGroupContainer: {
        marginBottom: 20,
    },
    dateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 8,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        width: '100%',
    },
    dateHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    materialCountText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748B',
    },
    dateHeaderText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748B',
    },
});

const sectionStyles = StyleSheet.create({
    filtersContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
        marginBottom: 8,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        gap: 12,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'visible',
    },
    filterIcon: {
        marginRight: 8,
    },
    compactSectionSelector: {
        flex: 1,
        overflow: 'visible',
    },
    noSectionsWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        overflow: 'visible',
    },
    noSectionsCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FDE68A',
        gap: 4,
    },
    noSectionsTextCompact: {
        fontSize: 11,
        color: '#92400E',
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 20,
    },
    dateLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
        marginTop: 12,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 14,
        gap: 12,
    },
    dateButtonText: {
        fontSize: 15,
        color: '#1E293B',
        flex: 1,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 24,
        gap: 12,
    },
    modalCancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
    },
    modalCancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748B',
    },
    modalApplyButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: '#3B82F6',
    },
    modalApplyText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

const paginationStyles = StyleSheet.create({
    headerContainer: {
        marginBottom: 16,
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingHorizontal: 4,
    },
    infoText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    pageInfo: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    paginationContainer: {
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        alignItems: 'center',
        gap: 12,
    },
    paginationControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    paginationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 4,
    },
    paginationButtonDisabled: {
        backgroundColor: '#F1F5F9',
        borderColor: '#E2E8F0',
    },
    paginationButtonText: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '500',
    },
    paginationButtonTextDisabled: {
        color: '#CBD5E1',
    },
    pageNumbersContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    pageNumberButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pageNumberButtonActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    pageNumberText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    pageNumberTextActive: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    ellipsis: {
        fontSize: 14,
        color: '#64748B',
        paddingHorizontal: 8,
    },
    itemsPerPageText: {
        fontSize: 12,
        color: '#94A3B8',
        fontStyle: 'italic',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    loadingText: {
        fontSize: 14,
        color: '#64748B',
        fontStyle: 'italic',
    },
});

const loadingStyles = StyleSheet.create({
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
        minWidth: 280,
    },
    loadingSpinner: {
        marginBottom: 20,
    },
    loadingTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
        textAlign: 'center',
    },
    loadingSubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3B82F6',
    },
});

export default Details;