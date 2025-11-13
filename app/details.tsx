import Header from '@/components/details/Header';
import MaterialCardEnhanced from '@/components/details/MaterialCardEnhanced';
import MaterialFormModal from '@/components/details/MaterialFormModel';
import MaterialUsageForm from '@/components/details/MaterialUsageForm';
import SectionManager from '@/components/details/SectionManager';
import TabSelector from '@/components/details/TabSelector';
import { predefinedSections } from '@/data/details';
import { getSection } from '@/functions/details';
import { domain } from '@/lib/domain';
import { styles } from '@/style/details';
import { Material, MaterialEntry, Section } from '@/types/details';
import { Ionicons } from '@expo/vector-icons';
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
    const cardAnimations = useRef<Animated.Value[]>([]).current;

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
    const reloadProjectMaterials = async () => {
        if (!projectId) {
            return;
        }

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
                const availableResponse = await axios.get(`${domain}/api/material?projectId=${projectId}&clientId=${clientId}`);
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
                const usedResponse = await axios.get(`${domain}/api/material-usage?projectId=${projectId}&clientId=${clientId}`);
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
                    specs: material.specs || {}
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

            setAvailableMaterials(transformedAvailable);
            setUsedMaterials(transformedUsed);

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
            console.error('Error reloading materials:', error);
            toast.error('Failed to refresh materials');
        } finally {
            setLoading(false);
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

        const selectedMaterial = availableMaterials.find(m => m._id === materialId);
        console.log('Found material:', selectedMaterial ? selectedMaterial.name : 'NOT FOUND');

        if (!selectedMaterial) {
            console.log('❌ Material not found in availableMaterials!');
            console.log('Available materials:');
            availableMaterials.forEach((m, idx) => {
                console.log(`  ${idx + 1}. ${m.name}: _id="${m._id}" (type: ${typeof m._id})`);
            });
        } else {
            console.log('✓ Material found:', {
                name: selectedMaterial.name,
                _id: selectedMaterial._id,
                quantity: selectedMaterial.quantity,
                unit: selectedMaterial.unit
            });
        }

        console.log('API Payload:', JSON.stringify(apiPayload, null, 2));
        console.log('========================================\n');

        let loadingToast: any = null;
        try {
            loadingToast = toast.loading('Adding material usage...');
            const response = await axios.post(`${domain}/api/material-usage`, apiPayload);
            const responseData = response.data as any;

            console.log('\n========================================');
            console.log('API RESPONSE - SUCCESS');
            console.log('========================================');
            console.log(JSON.stringify(responseData, null, 2));
            console.log('========================================\n');

            if (responseData.success) {
                toast.dismiss(loadingToast);
                toast.success(responseData.message || 'Material usage added successfully');

                // Refresh materials from API to get the latest data
                console.log('\n========================================');
                console.log('REFRESHING MATERIALS AFTER USAGE ADD');
                console.log('========================================\n');

                await reloadProjectMaterials();

                // Add a small delay to ensure state is updated before switching tabs
                await new Promise(resolve => setTimeout(resolve, 200));

                // Switch to "used" tab to show the newly added usage
                setActiveTab('used');
            } else {
                throw new Error(responseData.error || 'Failed to add material usage');
            }
        } catch (error: any) {
            if (loadingToast) {
                toast.dismiss(loadingToast);
            }

            console.log('\n========================================');
            console.log('API RESPONSE - ERROR');
            console.log('========================================');
            console.log('Error Message:', error?.message);
            console.log('Error Response:', JSON.stringify(error?.response?.data, null, 2));
            console.log('========================================\n');

            const errorMessage = error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to add material usage';
            toast.error(errorMessage);
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

        // FIXED: Use the correct array based on active tab
        let materials = activeTab === 'imported' ? availableMaterials : usedMaterials;

        console.log('Selected materials array:', activeTab === 'imported' ? 'availableMaterials' : 'usedMaterials');
        console.log('Total materials before filtering:', materials.length);
        console.log('Current sectionId:', sectionId);
        console.log('Selected mini-section:', selectedMiniSection);

        // For "used" tab, only filter by selected mini-section if one is chosen
        if (activeTab === 'used') {
            console.log('✓ Processing USED materials tab...');

            // Log all materials for debugging
            console.log('Materials in usedMaterials array:');
            materials.forEach((m, idx) => {
                console.log(`  ${idx + 1}. ${m.name} - Qty: ${m.quantity}`);
                console.log('     sectionId:', m.sectionId);
                console.log('     miniSectionId:', m.miniSectionId);
            });

            // Only filter by specific mini-section if one is selected
            // Otherwise show ALL used materials (no section filtering)
            if (selectedMiniSection && selectedMiniSection !== 'all-sections') {
                console.log('Filtering by selected mini-section:', selectedMiniSection);
                materials = materials.filter(m => {
                    return m.miniSectionId === selectedMiniSection;
                });
                console.log('After mini-section filtering:', materials.length, 'materials');
            } else {
                console.log('✓ No mini-section filter - showing ALL used materials');
            }
        } else {
            console.log('✓ Processing IMPORTED materials tab...');
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
                availableMaterials={availableMaterials}
                miniSections={miniSections}
            />

            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <TabSelector activeTab={activeTab} onSelectTab={setActiveTab} />

                {/* Action Buttons - Only visible in "imported" tab */}
                {activeTab === 'imported' && (
                    <View style={actionStyles.actionButtonsContainer}>
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
                            <Text style={styles.noMaterialsTitle}>Loading Materials...</Text>
                            <Text style={styles.noMaterialsDescription}>
                                Fetching project materials...
                            </Text>
                        </View>
                    ) : groupedMaterials.length > 0 ? (
                        groupedMaterials.map((material, index) => (
                            <MaterialCardEnhanced
                                key={`${material.name}-${material.unit}`}
                                material={material}
                                animation={cardAnimations[index] || new Animated.Value(1)}
                                activeTab={activeTab}
                                onAddUsage={handleAddUsage}
                                miniSections={miniSections}
                                showMiniSectionLabel={activeTab === 'used' && !selectedMiniSection}
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
    actionButtonsContainer: {
        flexDirection: 'row',
        marginTop: 16,
        marginBottom: 8,
        marginHorizontal: 16,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
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