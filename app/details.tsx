import Header from '@/components/details/Header';
import MaterialCardEnhanced from '@/components/details/MaterialCardEnhanced';
import MaterialFormModal from '@/components/details/MaterialFormModel';
import MaterialUsageForm from '@/components/details/MaterialUsageForm';
import SectionManager from '@/components/details/SectionManager';
import TabSelector from '@/components/details/TabSelector';
import MaterialActivityNotifications from '@/components/notifications/MaterialActivityNotifications';
import { predefinedSections } from '@/data/details';
import { getSection } from '@/functions/details';
import { domain } from '@/lib/domain';
import { styles } from '@/style/details';
import { Material, MaterialEntry, Section } from '@/types/details';
import { logMaterialImported } from '@/utils/activityLogger';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

const Details = () => {
    const params = useLocalSearchParams();
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
    const cardAnimations = useRef<Animated.Value[]>([]).current;

    // Performance optimization: Request cancellation and debouncing
    const abortControllerRef = useRef<AbortController | null>(null);
    const isLoadingRef = useRef(false);
    const lastLoadTimeRef = useRef<number>(0);
    const DEBOUNCE_DELAY = 500; // 500ms debounce

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

    // Helper function to get client ID
    const getClientIdFromStorage = async () => {
        try {
            const userDetailsString = await AsyncStorage.getItem("user");
            if (userDetailsString) {
                const userData = JSON.parse(userDetailsString);
                return userData.clientId || '';
            }
        } catch (error) {
            console.error('Error getting client ID:', error);
        }
        return '';
    };

    // Function to log material activity
    const logMaterialActivity = async (
        materials: any[],
        activity: 'imported' | 'used',
        message: string = ''
    ) => {
        try {
            const user = await getUserData();
            const clientId = await getClientIdFromStorage();

            if (!clientId) {
                console.warn('Client ID not found, skipping activity log');
                return;
            }

            const activityPayload = {
                clientId,
                projectId,
                materials,
                message,
                activity,
                user,
            };

            console.log('Logging material activity:', activityPayload);

            await axios.post(`${domain}/api/materialActivity`, activityPayload);
            console.log('✅ Material activity logged successfully');
        } catch (error) {
            console.error('Failed to log material activity:', error);
            // Don't throw error - activity logging is not critical
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

    // Function to reload both available and used materials
    const reloadProjectMaterials = async (forceReload: boolean = false) => {
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

        try {
            // Get clientId from storage
            const { getClientId } = require('@/functions/clientId');
            const clientId = await getClientId();

            if (!clientId) {
                throw new Error('Client ID not found');
            }

            console.log('\n========================================');
            console.log('RELOADING MATERIALS - API CALLS');
            console.log('========================================');
            console.log('Project ID:', projectId);
            console.log('Client ID:', clientId);
            console.log('API URLs:');
            console.log('  - Available:', `${domain}/api/material?projectId=${projectId}&clientId=${clientId}`);
            console.log('  - Used:', `${domain}/api/material-usage?projectId=${projectId}&clientId=${clientId}`);
            console.log('========================================\n');

            // Fetch MaterialAvailable and MaterialUsed separately with individual error handling
            let materialAvailable: any[] = [];
            let materialUsed: any[] = [];

            // Fetch MaterialAvailable
            try {
                const availableResponse = await axios.get(`${domain}/api/material?projectId=${projectId}&clientId=${clientId}`, {
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
                    materialAvailable = availableData.MaterialAvailable || [];
                    console.log('✓ MaterialAvailable extracted:', materialAvailable.length, 'items');
                    if (materialAvailable.length > 0) {
                        console.log('Sample material:', materialAvailable[0]);
                    }
                } else {
                    console.warn('⚠ API returned success: false');
                }
            } catch (availError: any) {
                console.error('❌ Error fetching MaterialAvailable:', availError?.response?.data || availError.message);
            }

            // Fetch MaterialUsed
            try {
                const usedResponse = await axios.get(`${domain}/api/material-usage?projectId=${projectId}&clientId=${clientId}`, {
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
                console.log('usedData.MaterialAvailable:', usedData.MaterialAvailable);
                console.log('usedData.data:', usedData.data);
                console.log('All keys in response:', Object.keys(usedData));
                console.log('Full response data:', JSON.stringify(usedData, null, 2));

                if (usedData.success) {
                    // Check multiple possible field names for used materials
                    materialUsed = usedData.MaterialUsed ||
                        usedData.materialUsed ||
                        usedData.usedMaterials ||
                        usedData.data?.MaterialUsed ||
                        usedData.data?.materialUsed ||
                        [];

                    console.log('✓ MaterialUsed extracted:', materialUsed.length, 'items');
                    if (materialUsed.length > 0) {
                        console.log('✅ Found used materials! Sample:', JSON.stringify(materialUsed[0], null, 2));
                    } else {
                        console.warn('⚠️ MaterialUsed array is EMPTY!');
                        console.warn('This could mean:');
                        console.warn('1. No materials have been used yet');
                        console.warn('2. API is returning data in a different field');
                        console.warn('3. The material usage was not saved properly');
                    }
                } else {
                    console.warn('⚠ MaterialUsed API returned success: false');
                }
            } catch (usedError: any) {
                console.error('❌ Error fetching MaterialUsed:', usedError?.response?.data || usedError.message);
                console.log('ℹ Continuing without MaterialUsed data');
            }

            console.log('Extracted - Available:', materialAvailable.length, 'Used:', materialUsed.length);

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

                // Log material sectionId for debugging
                console.log(`📦 Material: ${material.name}`);
                console.log(`   _id: ${material._id}`);
                console.log(`   sectionId: ${material.sectionId || 'NONE'}`);
                console.log(`   Current page sectionId: ${sectionId}`);
                console.log(`   Match: ${!material.sectionId || material.sectionId === sectionId ? '✅' : '❌'}`);

                return {
                    id: index + 1,
                    _id: material._id,
                    name: material.name,
                    quantity: material.qnt,
                    unit: material.unit,
                    price: material.cost || 0,
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
                return {
                    id: index + 1000,
                    _id: material._id,
                    name: material.name,
                    quantity: material.qnt,
                    unit: material.unit,
                    price: material.cost || 0,
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

            // Use functional updates to ensure we're working with latest state
            setAvailableMaterials(() => {
                console.log('📦 Setting availableMaterials state:', transformedAvailable.length);
                return transformedAvailable;
            });

            setUsedMaterials(() => {
                console.log('🔄 Setting usedMaterials state:', transformedUsed.length);
                return transformedUsed;
            });

            console.log('✅ State updated!\n');

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
                return {
                    id: index + 1,
                    _id: material._id, // Store MongoDB _id for API calls
                    name: material.name,
                    quantity: material.qnt,
                    unit: material.unit,
                    price: material.cost || 0,
                    date: new Date().toLocaleDateString(),
                    icon,
                    color,
                    specs: material.specs || {}
                };
            });

            // Transform MaterialUsed to Material interface
            const transformedUsed: Material[] = materialUsed.map((material: any, index: number) => {
                const { icon, color } = getMaterialIconAndColor(material.name);
                return {
                    id: index + 1000, // Different ID range to avoid conflicts
                    _id: material._id, // Store MongoDB _id
                    name: material.name,
                    quantity: material.qnt,
                    unit: material.unit,
                    price: material.cost || 0,
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
        loadProjectMaterials();

        // Cleanup: Cancel any pending requests when component unmounts
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                console.log('🧹 Cleanup: Cancelled pending requests');
            }
        };
    }, [projectId, materialAvailableParam, materialUsedParam]);

    // Debug: Log when usedMaterials state changes
    useEffect(() => {
        console.log('\n🔄 usedMaterials STATE CHANGED');
        console.log('New count:', usedMaterials.length);
        usedMaterials.forEach((m, idx) => {
            console.log(`  ${idx + 1}. ${m.name} - Qty: ${m.quantity} ${m.unit} (sectionId: ${m.sectionId}, miniSectionId: ${m.miniSectionId})`);
        });
        console.log('');
    }, [usedMaterials]);

    // Debug: Log when availableMaterials state changes
    useEffect(() => {
        console.log('\n📦 availableMaterials STATE CHANGED');
        console.log('New count:', availableMaterials.length);
        availableMaterials.forEach((m, idx) => {
            console.log(`  ${idx + 1}. ${m.name} - Qty: ${m.quantity} ${m.unit}`);
        });
        console.log('');
    }, [availableMaterials]);

    // Debug: Log when activeTab changes
    useEffect(() => {
        console.log('\n🔀 ACTIVE TAB CHANGED TO:', activeTab);
        console.log('Available materials count:', availableMaterials.length);
        console.log('Used materials count:', usedMaterials.length);
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

    // FIXED: Group materials by name and unit - CORRECTED LOGIC
    const groupMaterialsByName = (materials: Material[], isUsedTab: boolean = false) => {
        console.log('\n========================================');
        console.log('GROUPING MATERIALS');
        console.log('========================================');
        console.log('Input materials count:', materials.length);
        console.log('Is Used Tab:', isUsedTab);
        console.log('Materials to group:');
        materials.forEach((m, idx) => {
            console.log(`  ${idx + 1}. ${m.name} - Qty: ${m.quantity} ${m.unit}`);
        });
        console.log('========================================\n');

        const grouped: { [key: string]: any } = {};

        materials.forEach((material, index) => {
            const key = `${material.name}-${material.unit}`;

            if (!grouped[key]) {
                grouped[key] = {
                    name: material.name,
                    unit: material.unit,
                    icon: material.icon,
                    color: material.color,
                    date: material.date,
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

            grouped[key].totalQuantity += material.quantity;
            grouped[key].totalCost += material.price;
        });

        // FIXED: Correct calculation logic for both tabs
        Object.keys(grouped).forEach((key) => {
            if (isUsedTab) {
                // In "used" tab: totalQuantity IS the used amount (don't change it)
                const usedQuantity = grouped[key].totalQuantity;

                // Find available quantity for stats only
                const availableQuantity = availableMaterials
                    .filter(m => `${m.name}-${m.unit}` === key)
                    .reduce((sum, m) => sum + m.quantity, 0);

                grouped[key].totalUsed = usedQuantity;
                grouped[key].totalImported = availableQuantity + usedQuantity;
                // Keep totalQuantity as used quantity for display

                console.log(`Used Tab - ${key}: Used=${usedQuantity}, Available=${availableQuantity}, Total=${grouped[key].totalImported}`);
            } else {
                // In "imported" tab: totalQuantity is available amount
                const availableQuantity = grouped[key].totalQuantity;

                // Calculate used quantity for stats
                const usedQuantity = usedMaterials
                    .filter(m => `${m.name}-${m.unit}` === key)
                    .reduce((sum, m) => sum + m.quantity, 0);

                grouped[key].totalUsed = usedQuantity;
                grouped[key].totalImported = availableQuantity + usedQuantity;
                // Keep totalQuantity as available quantity for display

                console.log(`Imported Tab - ${key}: Available=${availableQuantity}, Used=${usedQuantity}, Total=${grouped[key].totalImported}`);
            }
        });

        const result = Object.values(grouped);
        console.log('\n========================================');
        console.log('GROUPED RESULT');
        console.log('========================================');
        console.log('Grouped materials count:', result.length);
        result.forEach((g: any, idx) => {
            console.log(`  ${idx + 1}. ${g.name} - Display Qty: ${g.totalQuantity} ${g.unit} (Used: ${g.totalUsed}, Total: ${g.totalImported})`);
        });
        console.log('========================================\n');

        return result;
    };
    // Handle adding material usage from the form
    const handleAddMaterialUsage = async (
        miniSectionId: string,
        materialId: string,
        quantity: number
    ) => {
        // Prevent duplicate submissions
        if (isLoadingRef.current) {
            toast.error('Please wait for the current operation to complete');
            return;
        }

        const apiPayload = {
            projectId: projectId,
            sectionId: sectionId,
            miniSectionId: miniSectionId,
            materialId: materialId,
            qnt: quantity
        };

        console.log('\n========================================');
        console.log('ADD MATERIAL USAGE - DEBUG INFO');
        console.log('========================================');
        console.log('Material ID received:', materialId);
        console.log('Material ID type:', typeof materialId);
        console.log('Material ID length:', materialId?.length);
        console.log('Section ID being sent:', sectionId);
        console.log('Mini Section ID being sent:', miniSectionId);

        const selectedMaterial = availableMaterials.find(m => m._id === materialId);
        console.log('Found material:', selectedMaterial ? selectedMaterial.name : 'NOT FOUND');

        if (!selectedMaterial) {
            console.log('❌ Material not found in availableMaterials!');
            console.log('Total available materials:', availableMaterials.length);
            console.log('\nSearching for material with ID:', materialId);
            console.log('\nAll available materials:');
            availableMaterials.forEach((m, idx) => {
                console.log(`  ${idx + 1}. ${m.name}:`);
                console.log(`     _id: "${m._id}" (type: ${typeof m._id})`);
                console.log(`     id: ${m.id} (type: ${typeof m.id})`);
                console.log(`     sectionId: "${m.sectionId}" (type: ${typeof m.sectionId})`);
                console.log(`     Match: ${m._id === materialId ? '✓ YES' : '✗ NO'}`);
            });

            toast.error('Material not found. Please refresh the page and try again.');
            return;
        } else {
            console.log('✓ Material found:', {
                name: selectedMaterial.name,
                _id: selectedMaterial._id,
                quantity: selectedMaterial.quantity,
                unit: selectedMaterial.unit,
                sectionId: selectedMaterial.sectionId
            });

            console.log('\n⚠️ IMPORTANT - API MATCHING LOGIC:');
            console.log('The API will look for a material where:');
            console.log('  1. _id matches:', materialId);
            console.log('  2. AND (sectionId is empty/null/undefined OR sectionId matches:', sectionId, ')');
            console.log('\nMaterial sectionId:', selectedMaterial.sectionId || '(empty/undefined)');
            console.log('Request sectionId:', sectionId);

            if (selectedMaterial.sectionId && selectedMaterial.sectionId !== sectionId) {
                console.log('⚠️ WARNING: Material has sectionId', selectedMaterial.sectionId, 'but request is for', sectionId);
                console.log('This might cause "Material not found" error from API!');
                console.log('💡 TIP: The material might be scoped to a different section.');
            }
        }

        console.log('API Payload:', JSON.stringify(apiPayload, null, 2));
        console.log('API Endpoint:', `${domain}/api/material-usage`);
        console.log('\n📝 API BEHAVIOR NOTE:');
        console.log('The API searches for material in MaterialAvailable where:');
        console.log('  - material._id === materialId (', materialId, ')');
        console.log('  - AND (material.sectionId is empty OR material.sectionId === sectionId)');
        console.log('\nIf material has a different sectionId, API will return:');
        console.log('  "Material not found in MaterialAvailable"');
        console.log('========================================\n');

        let loadingToast: any = null;
        try {
            isLoadingRef.current = true;
            loadingToast = toast.loading('Adding material usage...');

            console.log('\n🚀 SENDING API REQUEST...');
            console.log('URL:', `${domain}/api/material-usage`);
            console.log('Method: POST');
            console.log('Payload:', JSON.stringify(apiPayload, null, 2));
            console.log('Payload Details:');
            console.log('  - projectId:', apiPayload.projectId, '(type:', typeof apiPayload.projectId, ')');
            console.log('  - sectionId:', apiPayload.sectionId, '(type:', typeof apiPayload.sectionId, ')');
            console.log('  - miniSectionId:', apiPayload.miniSectionId, '(type:', typeof apiPayload.miniSectionId, ')');
            console.log('  - materialId:', apiPayload.materialId, '(type:', typeof apiPayload.materialId, ')');
            console.log('  - qnt:', apiPayload.qnt, '(type:', typeof apiPayload.qnt, ')');

            const response = await axios.post(`${domain}/api/material-usage`, apiPayload);
            const responseData = response.data as any;

            console.log('\n========================================');
            console.log('✅ API RESPONSE - SUCCESS');
            console.log('========================================');
            console.log('Status:', response.status);
            console.log('Response Data:', JSON.stringify(responseData, null, 2));
            console.log('Success:', responseData.success);
            console.log('Message:', responseData.message);
            console.log('========================================\n');

            if (responseData.success) {
                toast.dismiss(loadingToast);
                toast.success(responseData.message || 'Material usage added successfully');

                // Log material activity for used materials
                if (selectedMaterial) {
                    const usedMaterialLog = [{
                        name: selectedMaterial.name,
                        unit: selectedMaterial.unit,
                        specs: selectedMaterial.specs || {},
                        qnt: quantity,
                        cost: selectedMaterial.price || 0,
                        addedAt: new Date(),
                    }];

                    await logMaterialActivity(
                        usedMaterialLog,
                        'used',
                        `Used in ${sectionName} - Mini Section ID: ${miniSectionId}`
                    );

                    // Also log to general activity
                    const { logMaterialUsed } = require('@/utils/activityLogger');
                    const miniSection = miniSections.find(s => s._id === miniSectionId);
                    await logMaterialUsed(
                        projectId,
                        projectName,
                        sectionId,
                        sectionName,
                        miniSectionId,
                        miniSection?.name || 'Unknown Section',
                        selectedMaterial.name,
                        quantity,
                        selectedMaterial.unit,
                        selectedMaterial.price
                    );
                }

                // Refresh materials from API to get the latest data
                console.log('\n========================================');
                console.log('REFRESHING MATERIALS AFTER USAGE ADD');
                console.log('========================================\n');

                // Force refresh with a longer delay to ensure backend has processed
                await new Promise(resolve => setTimeout(resolve, 500));

                // Call reload with force refresh (bypasses debounce and loading check)
                await reloadProjectMaterials(true);

                // Wait for state to update - increased delay
                await new Promise(resolve => setTimeout(resolve, 500));

                console.log('✅ Materials refreshed after usage add');
                console.log('Available materials count:', availableMaterials.length);
                console.log('Used materials count:', usedMaterials.length);

                // Switch to "used" tab to show the newly added usage
                setActiveTab('used');

                // Close the usage form
                setShowUsageForm(false);

                // Show success message with material count
                toast.success(`Material usage recorded! Check the "Used Materials" tab.`);
            } else {
                throw new Error(responseData.error || 'Failed to add material usage');
            }
        } catch (error: any) {
            if (loadingToast) {
                toast.dismiss(loadingToast);
            }

            console.log('\n========================================');
            console.log('❌ API RESPONSE - ERROR');
            console.log('========================================');
            console.log('Error Object:', error);
            console.log('Error Name:', error?.name);
            console.log('Error Message:', error?.message);
            console.log('Error Code:', error?.code);
            console.log('\n--- Response Details ---');
            console.log('Status:', error?.response?.status);
            console.log('Status Text:', error?.response?.statusText);
            console.log('Response Headers:', error?.response?.headers);
            console.log('Response Data:', JSON.stringify(error?.response?.data, null, 2));
            console.log('\n--- Request Details ---');
            console.log('Request URL:', error?.config?.url);
            console.log('Request Method:', error?.config?.method);
            console.log('Request Data:', error?.config?.data);
            console.log('========================================\n');

            const errorMessage = error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to add material usage';

            console.log('🔴 Showing error toast:', errorMessage);
            toast.error(errorMessage);
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

    // Group materials by date for "Used Materials" tab
    const getGroupedByDate = () => {
        if (activeTab !== 'used') {
            return null;
        }

        const materials = getCurrentData();
        const groupedByDate: { [date: string]: Material[] } = {};

        materials.forEach(material => {
            // Use createdAt or addedAt for grouping
            const dateStr = material.createdAt || material.addedAt || material.date;
            const date = new Date(dateStr);
            const dateKey = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            if (!groupedByDate[dateKey]) {
                groupedByDate[dateKey] = [];
            }
            groupedByDate[dateKey].push(material);
        });

        // Sort dates in descending order (newest first)
        const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
            return new Date(b).getTime() - new Date(a).getTime();
        });

        return sortedDates.map(date => ({
            date,
            materials: groupMaterialsByName(groupedByDate[date], true)
        }));
    };

    const formatDateHeader = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const isToday = date.toDateString() === today.toDateString();
        const isYesterday = date.toDateString() === yesterday.toDateString();

        if (isToday) return 'Today';
        if (isYesterday) return 'Yesterday';

        return dateString;
    };

    // Calculate these values - they will update when dependencies change
    const filteredMaterials = getCurrentData();
    const groupedMaterials = getGroupedData();
    const totalCost = filteredMaterials.reduce((sum, material) => sum + material.price, 0);

    // Log the final data being displayed - ENHANCED DEBUGGING
    console.log('\n========================================');
    console.log('RENDER DATA - DETAILED');
    console.log('========================================');
    console.log('Active Tab:', activeTab);
    console.log('Available Materials State Count:', availableMaterials.length);
    console.log('Used Materials State Count:', usedMaterials.length);
    console.log('\nAvailable Materials in State:');
    availableMaterials.forEach((m, idx) => {
        console.log(`  ${idx + 1}. ${m.name} - Qty: ${m.quantity} ${m.unit} (_id: ${m._id})`);
    });
    console.log('\nUsed Materials in State:');
    usedMaterials.forEach((m, idx) => {
        console.log(`  ${idx + 1}. ${m.name} - Qty: ${m.quantity} ${m.unit} (_id: ${m._id}, miniSectionId: ${m.miniSectionId})`);
    });
    console.log('\nFiltered Materials (what getCurrentData returned):', filteredMaterials.length);
    filteredMaterials.forEach((m, idx) => {
        console.log(`  ${idx + 1}. ${m.name} - Qty: ${m.quantity} ${m.unit}`);
    });
    console.log('\nGrouped Materials (what will be displayed):', groupedMaterials.length);
    groupedMaterials.forEach((g: any, idx) => {
        console.log(`  ${idx + 1}. ${g.name} - totalQuantity: ${g.totalQuantity} ${g.unit}`);
        console.log(`      totalUsed: ${g.totalUsed}, totalImported: ${g.totalImported}`);
    });
    console.log('========================================\n');

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
        if (isLoadingRef.current) {
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

        // Transform materials to match API format
        const formattedMaterials = materials.map((material: any) => ({
            projectId: projectId,
            materialName: material.materialName,
            unit: material.unit,
            specs: material.specs || {},
            qnt: material.qnt,
            cost: material.cost,
            mergeIfExists: material.mergeIfExists !== undefined ? material.mergeIfExists : true,
        }));

        console.log("=== PAYLOAD BEING SENT ===");
        console.log(JSON.stringify(formattedMaterials, null, 2));
        console.log("==========================");

        let loadingToast: any = null;

        try {
            // Show loading toast
            loadingToast = toast.loading('Adding materials...');

            const res = await axios.post(`${domain}/api/material`, formattedMaterials);

            const responseData = res.data as any;

            // Dismiss loading toast
            toast.dismiss(loadingToast);

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
                    toast.success(`Successfully added ${successCount} material${successCount > 1 ? 's' : ''}!`);

                    // Log material activity for imported materials
                    const successfulMaterials = materials.map((material: any) => ({
                        name: material.materialName,
                        unit: material.unit,
                        specs: material.specs || {},
                        qnt: material.qnt,
                        cost: material.cost || 0,
                        addedAt: new Date(),
                    }));

                    await logMaterialActivity(successfulMaterials, 'imported', message);

                    // Log to general activity API
                    const totalCost = materials.reduce((sum: number, m: any) => sum + (m.cost || 0), 0);
                    await logMaterialImported(
                        projectId,
                        projectName,
                        successCount,
                        totalCost,
                        message
                    );
                }

                if (failCount > 0) {
                    toast.error(`Failed to add ${failCount} material${failCount > 1 ? 's' : ''}`);
                }

                // Refresh project materials after adding
                await reloadProjectMaterials();
            } else {
                throw new Error(responseData.error || 'Failed to add materials');
            }

        } catch (error) {
            console.error("Material request error:", error);

            // Dismiss loading toast if it exists
            if (loadingToast) {
                toast.dismiss(loadingToast);
            }

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

            {/* Action Buttons - Sticky at top, only visible in "imported" tab */}
            {activeTab === 'imported' && (
                <View style={actionStyles.stickyActionButtonsContainer}>
                    <TouchableOpacity
                        style={actionStyles.addMaterialButton}
                        onPress={() => setShowMaterialForm(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="add-circle-outline" size={20} color="#059669" />
                        <Text style={actionStyles.addMaterialButtonText}>Add Material</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={actionStyles.addUsageButton}
                        onPress={() => setShowUsageForm(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-forward-circle-outline" size={20} color="#DC2626" />
                        <Text style={actionStyles.addUsageButtonText}>Add Usage</Text>
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
                    await addMaterialRequest(materials, message);
                    setShowMaterialForm(false);
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
            />

            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <TabSelector activeTab={activeTab} onSelectTab={setActiveTab} />

                {/* Notification Button - Inside scroll view */}
                <View style={notificationStyles.notificationButtonContainer}>
                    <TouchableOpacity
                        style={notificationStyles.notificationButton}
                        onPress={() => setShowNotifications(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="notifications" size={20} color="#3B82F6" />
                        <Text style={notificationStyles.notificationButtonText}>Activity Log</Text>
                    </TouchableOpacity>
                </View>

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
                    <Text style={styles.sectionTitle}>
                        {activeTab === 'imported' ? 'Available Materials' : 'Used Materials'}
                        {activeTab === 'used' && selectedMiniSection && (
                            <Text style={{ fontSize: 14, color: '#64748B', fontWeight: '400' }}>
                                {' '}(Filtered)
                            </Text>
                        )}
                    </Text>
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
                        // Day-wise grouping for "Used Materials" tab
                        (() => {
                            const groupedByDate = getGroupedByDate();
                            return groupedByDate && groupedByDate.length > 0 ? (
                                groupedByDate.map((dateGroup, dateIndex) => (
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
                                        {dateGroup.materials.map((material, index) => (
                                            <MaterialCardEnhanced
                                                key={`${dateGroup.date}-${material.name}-${material.unit}`}
                                                material={material}
                                                animation={cardAnimations[dateIndex * 10 + index] || new Animated.Value(1)}
                                                activeTab={activeTab}
                                                onAddUsage={handleAddUsage}
                                                miniSections={miniSections}
                                                showMiniSectionLabel={!selectedMiniSection}
                                            />
                                        ))}
                                    </View>
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
                                                No used materials found for this section.
                                            </Text>
                                        </>
                                    )}
                                </View>
                            );
                        })()
                    ) : groupedMaterials.length > 0 ? (
                        // Regular grouping for "Imported Materials" tab
                        groupedMaterials.map((material, index) => (
                            <MaterialCardEnhanced
                                key={`${material.name}-${material.unit}`}
                                material={material}
                                animation={cardAnimations[index] || new Animated.Value(1)}
                                activeTab={activeTab}
                                onAddUsage={handleAddUsage}
                                miniSections={miniSections}
                                showMiniSectionLabel={false}
                            />
                        ))
                    ) : (
                        <View style={styles.noMaterialsContainer}>
                            {activeTab === 'used' && miniSections.length === 0 ? (
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

export default Details;