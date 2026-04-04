import Header from '@/components/details/Header';
import MaterialCardEnhanced from '@/components/details/MaterialCardEnhanced';
import MaterialFormModal from '@/components/details/MaterialFormModel';
import MaterialUsageForm from '@/components/details/MaterialUsageForm';
import SectionManager from '@/components/details/SectionManager';
import TabSelector from '@/components/details/TabSelector';
import { predefinedSections } from '@/data/details';
import { getSection } from '@/functions/details';
import { getClientId } from '@/functions/clientId';
import { API_BASE_URL as domain } from '@/lib/domain';
import { styles } from '@/style/details';
import { Material, MaterialEntry, Section } from '@/types/details';
import { logMaterialImported } from '@/utils/activityLogger';
import { logSectionCompleted, logSectionReopened, logMiniSectionCompleted, logMiniSectionReopened } from '@/utils/activityLogger';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { useSimpleNotifications } from '@/hooks/useSimpleNotifications';
import { useAuth } from '@/contexts/AuthContext';

const Details = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { sendProjectNotification } = useSimpleNotifications();
    const projectId = params.projectId as string;
    const projectName = params.projectName as string;
    const sectionId = params.sectionId as string;
    const sectionName = params.sectionName as string;
    let consoleLogCount = 0;
    const MAX_CONSOLE_LOGS = 50;
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

    const [materials, setMaterials] = useState<{
        available: Material[];
        used: Material[];
        loading: boolean;
        error: string | null;
        pagination: {
            available: {
                currentPage: number;
                totalPages: number;
                totalItems: number;
                hasNextPage: boolean;
                hasPrevPage: boolean;
            };
            used: {
                currentPage: number;
                totalPages: number;
                totalItems: number;
                hasNextPage: boolean;
                hasPrevPage: boolean;
            };
        };
    }>({
        available: [],
        used: [],
        loading: false,
        error: null,
        pagination: {
            available: {
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                hasNextPage: false,
                hasPrevPage: false
            },
            used: {
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                hasNextPage: false,
                hasPrevPage: false
            }
        }
    });

    const [miniSections, setMiniSections] = useState<Section[]>([]);
    const [showAddSectionModal, setShowAddSectionModal] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');
    const [newSectionDesc, setNewSectionDesc] = useState('');
    const [isAddingMaterial, setIsAddingMaterial] = useState(false);
    const [isAddingMaterialUsage, setIsAddingMaterialUsage] = useState(false);
    const [sectionCompleted, setSectionCompleted] = useState(false);
    const [miniSectionCompletions, setMiniSectionCompletions] = useState<{[key: string]: boolean}>({});
    const [isUpdatingCompletion, setIsUpdatingCompletion] = useState(false);
    const [currentUserType, setCurrentUserType] = useState<string>('staff'); // Track current user type

    // Low stock alert system
    const [lowStockThreshold, setLowStockThreshold] = useState(10); // Default 10% threshold
    const [ignoredMaterials, setIgnoredMaterials] = useState<string[]>([]);
    const [lowStockMaterials, setLowStockMaterials] = useState<any[]>([]);
    const [showLowStockAlert, setShowLowStockAlert] = useState(false);
    const [alertDismissedAt, setAlertDismissedAt] = useState<number | null>(null);

    // Log section completion status changes and button states
    useEffect(() => {
        console.log('🔒 Section completion status changed:', {
            sectionCompleted,
            buttonsDisabled: sectionCompleted,
            projectId,
            sectionId,
            sectionName
        });
        
        if (sectionCompleted) {
            console.log('🚫 Add Material and Add Usage buttons are now DISABLED due to section completion');
        } else {
            console.log('✅ Add Material and Add Usage buttons are ENABLED');
        }
    }, [sectionCompleted]);

    // Reload mini-section completion status when mini-sections change
    useEffect(() => {
        if (miniSections.length > 0) {
            console.log('� Mini-sections changed, reloading completion status...');
            console.log('🔄 Mini-sections count:', miniSections.length);
            
            // Small delay to ensure mini-sections are properly set
            setTimeout(() => {
                loadMiniSectionCompletionStatus();
            }, 200);
        }
    }, [miniSections]);

    const cardAnimations = useRef<Animated.Value[]>([]).current;
    const scrollViewRef = useRef<ScrollView>(null);
    const isMountedRef = useRef(true);
    const isLoadingRef = useRef(false);
    
    // Loading animations for material operations
    const materialLoadingAnimation = useRef(new Animated.Value(0)).current;
    const usageLoadingAnimation = useRef(new Animated.Value(0)).current;

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
                    userType: userData.userType || 'staff', // Include userType, default to 'staff'
                };
            }
        } catch (error) {
            console.error('Error getting user data:', error);
        }
        return {
            userId: 'unknown',
            fullName: 'Unknown User',
            userType: 'staff', // Default to 'staff'
        };
    };

    const fetchMaterials = async (page: number = 1, limit: number = 10, forceRefresh: boolean = false) => {
        if (!projectId) {
            console.log('❌ No projectId available');
            return;
        }

        try {
            const clientId = await getClientId();
            if (!clientId) {
                throw new Error('Client ID not available');
            }

            console.log(`\n========================================`);
            console.log(`🔄 FETCHING MATERIALS - Page ${page}, Limit ${limit}, Force: ${forceRefresh}`);
            console.log(`========================================`);
            console.log(`Tab: ${activeTab}`);
            console.log(`Section Filter: ${selectedMiniSection || 'all'}`);
            console.log(`Project ID: ${projectId}`);
            console.log(`Client ID: ${clientId}`);

            setMaterials(prev => ({ ...prev, loading: true, error: null }));

            // Build API parameters based on active tab and filters
            // ✅ SORT BY NEWEST FIRST: Sort by createdAt/addedAt in descending order
            const baseParams = {
                projectId,
                clientId,
                page,
                limit,
                sortBy: 'createdAt', // Primary sort: creation date
                sortOrder: 'desc',   // Descending = newest first (most recent at top)
                // ✅ CACHE BUSTING: Add timestamp when force refresh is requested
                ...(forceRefresh ? { _t: Date.now() } : {})
            };

            console.log(`\n========================================`);
            console.log(`🔄 FETCHING MATERIALS WITH SORTING`);
            console.log(`========================================`);
            console.log(`📊 Sort Configuration:`);
            console.log(`   Sort By: createdAt (newest first)`);
            console.log(`   Sort Order: desc (descending)`);
            console.log(`   Expected: Most recently added materials at top`);
            console.log(`========================================\n`);

            // Add section filter only for used materials tab
            const availableParams = { ...baseParams };
            const usedParams = {
                ...baseParams,
                ...(activeTab === 'used' && selectedMiniSection ? {
                    sectionId: selectedMiniSection,
                    miniSectionId: selectedMiniSection
                } : {})
            };

            console.log(`📤 API Request Parameters:`);
            console.log(`   Available Materials:`, availableParams);
            console.log(`   Used Materials:`, usedParams);
            if (forceRefresh) {
                console.log(`   🔄 Cache busting enabled with timestamp: ${baseParams._t}`);
            }

            // Fetch both available and used materials in parallel
            const [availableResponse, usedResponse] = await Promise.all([
                axios.get(`${domain}/api/material`, {
                    params: availableParams,
                    timeout: 10000
                }),
                axios.get(`${domain}/api/material-usage`, {
                    params: usedParams,
                    timeout: 10000
                })
            ]);

            const availableData = availableResponse.data as any;
            const usedData = usedResponse.data as any;

            console.log(`\n📥 API Response Received:`);
            console.log(`   Available Status: ${availableResponse.status}`);
            console.log(`   Used Status: ${usedResponse.status}`);
            console.log(`   Available Keys:`, Object.keys(availableData));
            console.log(`   Used Keys:`, Object.keys(usedData));

            // Extract materials arrays from API response
            const availableMaterialsArray = availableData.MaterialAvailable || availableData.materials || [];
            const usedMaterialsArray = usedData.MaterialUsed || usedData.materials || [];

            console.log(`\n📊 Materials Count:`);
            console.log(`   Available: ${availableMaterialsArray.length} items`);
            console.log(`   Used: ${usedMaterialsArray.length} items`);
            
            // ✅ LOG FIRST FEW MATERIALS TO VERIFY SORT ORDER
            if (availableMaterialsArray.length > 0) {
                console.log(`\n📋 First 3 Available Materials (should be newest first):`);
                availableMaterialsArray.slice(0, 3).forEach((m: any, idx: number) => {
                    console.log(`   ${idx + 1}. ${m.name} - Created: ${m.createdAt || m.addedAt || 'N/A'}`);
                });
            }

            // Transform materials to match existing interface
            // ✅ IMPORTANT: Transformation preserves API order (newest first from backend)
            const transformedAvailable = availableMaterialsArray.map((material: any, index: number) => {
                const { icon, color } = getMaterialIconAndColor(material.name);
                
                // ✅ CRITICAL FIX: Properly extract per-unit cost from API response
                let perUnitCost = 0;
                const quantity = material.qnt || 0;
                const totalCost = material.totalCost || 0;
                
                // Priority 1: Use perUnitCost if available
                if (material.perUnitCost !== undefined && material.perUnitCost !== null && !isNaN(Number(material.perUnitCost))) {
                    perUnitCost = Number(material.perUnitCost);
                    console.log(`✅ Using API perUnitCost for ${material.name}: ₹${perUnitCost}`);
                } 
                // Priority 2: Calculate from totalCost / quantity
                else if (totalCost > 0 && quantity > 0) {
                    perUnitCost = totalCost / quantity;
                    console.log(`⚠️ Calculated perUnitCost for ${material.name}: ₹${totalCost} / ${quantity} = ₹${perUnitCost}`);
                }
                // Priority 3: Use cost field if available (legacy support)
                else if (material.cost !== undefined && material.cost !== null && !isNaN(Number(material.cost))) {
                    perUnitCost = Number(material.cost);
                    console.log(`⚠️ Using legacy cost field for ${material.name}: ₹${perUnitCost}`);
                }
                
                return {
                    id: (page - 1) * limit + index + 1,
                    _id: material._id,
                    name: material.name,
                    quantity: quantity,
                    unit: material.unit,
                    price: perUnitCost, // ✅ CRITICAL: This is per-unit cost, NOT total cost
                    perUnitCost: perUnitCost, // ✅ Store per-unit cost explicitly
                    totalCost: totalCost, // ✅ Store total cost for reference
                    date: material.createdAt || material.addedAt || new Date().toISOString(),
                    icon,
                    color,
                    specs: material.specs || {},
                    sectionId: material.sectionId,
                    createdAt: material.createdAt,
                    addedAt: material.addedAt
                };
            });

            const transformedUsed = usedMaterialsArray.map((material: any, index: number) => {
                const { icon, color } = getMaterialIconAndColor(material.name);
                
                // ✅ CRITICAL FIX: Properly extract per-unit cost from API response
                let perUnitCost = 0;
                const quantity = material.qnt || 0;
                const totalCost = material.totalCost || 0;
                
                // Priority 1: Use perUnitCost if available
                if (material.perUnitCost !== undefined && material.perUnitCost !== null && !isNaN(Number(material.perUnitCost))) {
                    perUnitCost = Number(material.perUnitCost);
                    console.log(`✅ Using API perUnitCost for ${material.name}: ₹${perUnitCost}`);
                } 
                // Priority 2: Calculate from totalCost / quantity
                else if (totalCost > 0 && quantity > 0) {
                    perUnitCost = totalCost / quantity;
                    console.log(`⚠️ Calculated perUnitCost for ${material.name}: ₹${totalCost} / ${quantity} = ₹${perUnitCost}`);
                }
                // Priority 3: Use cost field if available (legacy support)
                else if (material.cost !== undefined && material.cost !== null && !isNaN(Number(material.cost))) {
                    perUnitCost = Number(material.cost);
                    console.log(`⚠️ Using legacy cost field for ${material.name}: ₹${perUnitCost}`);
                }
                
                return {
                    id: (page - 1) * limit + index + 1000,
                    _id: material._id,
                    name: material.name,
                    quantity: quantity,
                    unit: material.unit,
                    price: perUnitCost, // ✅ CRITICAL: This is per-unit cost, NOT total cost
                    perUnitCost: perUnitCost, // ✅ Store per-unit cost explicitly
                    totalCost: totalCost, // ✅ Store total cost for reference
                    date: material.createdAt || material.addedAt || new Date().toISOString(),
                    icon,
                    color,
                    specs: material.specs || {},
                    sectionId: material.sectionId,
                    miniSectionId: material.miniSectionId,
                    createdAt: material.createdAt,
                    addedAt: material.addedAt
                };
            });

            // ✅ ENHANCED: Smart pagination extraction with multiple fallback strategies
            const extractPagination = (data: any, defaultPage: number, materialsArray: any[]) => {
                console.log(`\n========================================`);
                console.log(`SMART PAGINATION EXTRACTION`);
                console.log(`========================================`);
                console.log(`Page: ${defaultPage}, Limit: ${limit}, Materials: ${materialsArray.length}`);
                console.log(`Full API Response Keys:`, Object.keys(data));
                console.log(`Full API Response:`, JSON.stringify(data, null, 2));

                let currentPage = defaultPage;
                let totalPages = 1;
                let totalItems = 0;
                let hasNextPage = false;
                let hasPrevPage = false;

                // Strategy 1: Check for nested pagination object (BACKEND USES THIS)
                if (data.pagination) {
                    console.log(`✅ Strategy 1: Found data.pagination`);
                    console.log(`   Pagination object:`, JSON.stringify(data.pagination, null, 2));
                    currentPage = data.pagination.currentPage || data.pagination.page || defaultPage;
                    totalPages = data.pagination.totalPages || data.pagination.pages || 1;
                    totalItems = data.pagination.totalItems || data.pagination.total || data.pagination.count || 0;
                    hasNextPage = data.pagination.hasNextPage ?? data.pagination.hasNext ?? (currentPage < totalPages);
                    hasPrevPage = data.pagination.hasPrevPage ?? data.pagination.hasPrev ?? (currentPage > 1);
                    
                    console.log(`   ✅ Extracted from data.pagination:`);
                    console.log(`      currentPage: ${currentPage}`);
                    console.log(`      totalPages: ${totalPages}`);
                    console.log(`      totalItems: ${totalItems}`);
                    console.log(`      hasNextPage: ${hasNextPage}`);
                    console.log(`      hasPrevPage: ${hasPrevPage}`);
                }
                // Strategy 2: Check for meta object
                else if (data.meta) {
                    console.log(`✅ Strategy 2: Found data.meta`);
                    currentPage = data.meta.currentPage || data.meta.page || defaultPage;
                    totalPages = data.meta.totalPages || data.meta.pages || 1;
                    totalItems = data.meta.totalItems || data.meta.total || data.meta.count || 0;
                    hasNextPage = data.meta.hasNextPage ?? data.meta.hasNext ?? (currentPage < totalPages);
                    hasPrevPage = data.meta.hasPrevPage ?? data.meta.hasPrev ?? (currentPage > 1);
                }
                // Strategy 3: Check for root-level pagination fields
                else if (data.currentPage || data.totalPages || data.page || data.pages) {
                    console.log(`✅ Strategy 3: Found root-level pagination fields`);
                    currentPage = data.currentPage || data.page || defaultPage;
                    totalPages = data.totalPages || data.pages || 1;
                    totalItems = data.totalItems || data.total || data.count || 0;
                    hasNextPage = data.hasNextPage ?? data.hasNext ?? (currentPage < totalPages);
                    hasPrevPage = data.hasPrevPage ?? data.hasPrev ?? (currentPage > 1);
                }
                // Strategy 4: Fallback - Calculate from materials count
                else {
                    console.log(`⚠️ Strategy 4: No API pagination - Using smart fallback`);
                    
                    if (materialsArray.length === limit) {
                        // Got a full page - assume there might be more
                        totalPages = defaultPage + 1;
                        totalItems = materialsArray.length * totalPages;
                        hasNextPage = true;
                        console.log(`   📊 Full page detected (${materialsArray.length}/${limit})`);
                        console.log(`   📊 Assuming at least ${totalPages} pages exist`);
                    } else if (materialsArray.length > 0) {
                        // Got partial page - this is likely the last page
                        totalPages = defaultPage;
                        totalItems = (defaultPage - 1) * limit + materialsArray.length;
                        hasNextPage = false;
                        console.log(`   📊 Partial page detected (${materialsArray.length}/${limit})`);
                        console.log(`   📊 This appears to be the last page`);
                    } else {
                        // No materials - single empty page
                        totalPages = 1;
                        totalItems = 0;
                        hasNextPage = false;
                        console.log(`   📊 No materials found`);
                    }
                    
                    hasPrevPage = defaultPage > 1;
                }

                // Strategy 5: Override if API says 1 page but we have a full page
                if (totalPages === 1 && materialsArray.length === limit) {
                    console.log(`⚠️ Strategy 5: API says 1 page but got full page - overriding`);
                    totalPages = 2;
                    totalItems = Math.max(totalItems, materialsArray.length * 2);
                    hasNextPage = true;
                }

                const result = {
                    currentPage,
                    totalPages,
                    totalItems,
                    hasNextPage,
                    hasPrevPage
                };

                console.log(`\n✅ Final Pagination Result:`);
                console.log(`   Current Page: ${result.currentPage}`);
                console.log(`   Total Pages: ${result.totalPages}`);
                console.log(`   Total Items: ${result.totalItems}`);
                console.log(`   Has Next: ${result.hasNextPage}`);
                console.log(`   Has Prev: ${result.hasPrevPage}`);
                console.log(`========================================\n`);

                return result;
            };

            const availablePagination = extractPagination(availableData, page, transformedAvailable);
            const usedPagination = extractPagination(usedData, page, transformedUsed);

            console.log(`\n🎯 Setting Materials State:`);
            console.log(`   Available: ${transformedAvailable.length} materials, Page ${availablePagination.currentPage}/${availablePagination.totalPages}`);
            console.log(`   Used: ${transformedUsed.length} materials, Page ${usedPagination.currentPage}/${usedPagination.totalPages}`);
            
            // ✅ VERIFY SORT ORDER: Log first material to confirm newest is at top
            if (transformedAvailable.length > 0) {
                const firstMaterial = transformedAvailable[0];
                console.log(`\n✅ SORT ORDER VERIFICATION:`);
                console.log(`   First material (should be newest): ${firstMaterial.name}`);
                console.log(`   Created at: ${firstMaterial.createdAt || firstMaterial.addedAt || 'N/A'}`);
                console.log(`   This should be the most recently added material`);
            }

            setMaterials(prev => ({
                ...prev,
                available: transformedAvailable,
                used: transformedUsed,
                loading: false,
                pagination: {
                    available: availablePagination,
                    used: usedPagination
                }
            }));

            console.log(`✅ Materials state updated successfully`);
            console.log(`========================================\n`);

        } catch (error: any) {
            console.error(`\n❌ ERROR FETCHING MATERIALS:`);
            console.error(`   Message: ${error?.message}`);
            console.error(`   Status: ${error?.response?.status}`);
            console.error(`   Data:`, error?.response?.data);
            
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load materials';
            
            setMaterials(prev => ({ 
                ...prev, 
                loading: false, 
                error: errorMessage
            }));

            toast.error(errorMessage);
        }
    };

    const reloadMaterials = async (page: number = 1, forceRefresh: boolean = true) => {
        // Always force refresh by default to avoid cache issues
        await fetchMaterials(page, 10, forceRefresh);
    };

    const ignoreMaterial = async (materialKey: string, materialName: string) => {
        try {
            const updatedIgnored = [...ignoredMaterials, materialKey];
            setIgnoredMaterials(updatedIgnored);
            
            // Save to AsyncStorage for persistence
            await AsyncStorage.setItem(
                `ignored_materials_${projectId}`, 
                JSON.stringify(updatedIgnored)
            );
            
            // Remove from low stock materials
            setLowStockMaterials(prev => prev.filter(item => item.materialKey !== materialKey));
            
            toast.success(`${materialName} will no longer show low stock alerts`);
            console.log(`✅ Material ignored: ${materialName} (${materialKey})`);
        } catch (error) {
            console.error('❌ Error ignoring material:', error);
            toast.error('Failed to ignore material');
        }
    };

    // Function to load ignored materials from storage
    const loadIgnoredMaterials = async () => {
        try {
            const stored = await AsyncStorage.getItem(`ignored_materials_${projectId}`);
            if (stored) {
                const ignored = JSON.parse(stored);
                setIgnoredMaterials(ignored);
                console.log('✅ Loaded ignored materials:', ignored);
            }
        } catch (error) {
            console.error('❌ Error loading ignored materials:', error);
        }
    };

    // ✅ NEW: Function to load alert dismissal timestamp
    const loadAlertDismissalTime = async () => {
        try {
            const stored = await AsyncStorage.getItem(`low_stock_alert_dismissed_${projectId}`);
            if (stored) {
                const dismissedAt = parseInt(stored, 10);
                setAlertDismissedAt(dismissedAt);
                console.log('✅ Loaded alert dismissal time:', new Date(dismissedAt).toLocaleString());
            }
        } catch (error) {
            console.error('❌ Error loading alert dismissal time:', error);
        }
    };

    // ✅ NEW: Function to check if alert should be shown (15 hours have passed)
    const shouldShowAlert = () => {
        if (!alertDismissedAt) {
            // Never dismissed before, can show
            return true;
        }

        const now = Date.now();
        const fifteenHoursInMs = 15 * 60 * 60 * 1000; // 15 hours in milliseconds
        const timeSinceDismissal = now - alertDismissedAt;

        const shouldShow = timeSinceDismissal >= fifteenHoursInMs;
        
        if (!shouldShow) {
            const remainingTime = fifteenHoursInMs - timeSinceDismissal;
            const remainingHours = Math.floor(remainingTime / (60 * 60 * 1000));
            const remainingMinutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
            console.log(`⏰ Alert suppressed. Time remaining: ${remainingHours}h ${remainingMinutes}m`);
        }

        return shouldShow;
    };

    // ✅ UPDATED: Function to dismiss popup only (icon remains visible)
    const dismissAlertFor15Hours = async () => {
        try {
            const now = Date.now();
            await AsyncStorage.setItem(`low_stock_alert_dismissed_${projectId}`, now.toString());
            setAlertDismissedAt(now);
            setShowLowStockAlert(false);
            
            const nextAlertTime = new Date(now + (15 * 60 * 60 * 1000));
            console.log('✅ Alert popup dismissed until:', nextAlertTime.toLocaleString());
        } catch (error) {
            console.error('❌ Error dismissing alert:', error);
        }
    };

    // Helper function to validate MongoDB ObjectId
    const isValidMongoId = (id: string) => {
        return /^[0-9a-fA-F]{24}$/.test(id);
    };

    // Function to toggle section completion
    const toggleSectionCompletion = async () => {
        if (isUpdatingCompletion) return;
        
        // Validate IDs first
        if (!sectionId || !isValidMongoId(sectionId)) {
            toast.error('Invalid section ID. Please refresh the page and try again.');
            return;
        }
        
        if (!projectId || !isValidMongoId(projectId)) {
            toast.error('Invalid project ID. Please refresh the page and try again.');
            return;
        }
        
        setIsUpdatingCompletion(true);
        try {
            console.log('🎯 Toggling section completion...');
            console.log('Current section completion status:', sectionCompleted);
            console.log('Domain:', domain);
            console.log('Section ID:', sectionId);
            console.log('Project ID:', projectId);
            console.log('API URL:', `${domain}/api/completion`);
            
            const payload = {
                updateType: 'project-section',
                id: sectionId,
                projectId: projectId
            };
            
            console.log('Payload:', JSON.stringify(payload, null, 2));
            
            const response = await axios.patch(`${domain}/api/completion`, payload, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 second timeout
            });

            console.log('Response status:', response.status);
            console.log('Response data:', JSON.stringify(response.data, null, 2));

            const responseData = response.data as any;
            if (responseData.success) {
                // Use the actual completion status from the API response instead of toggling
                const newCompletionStatus = responseData.data?.isCompleted;
                console.log('✅ New section completion status from API:', newCompletionStatus, typeof newCompletionStatus);
                
                if (typeof newCompletionStatus === 'boolean') {
                    setSectionCompleted(newCompletionStatus);
                    console.log('✅ Section completion state updated to:', newCompletionStatus);
                    toast.success(responseData.message || `Section ${newCompletionStatus ? 'completed' : 'reopened'} successfully`);
                    
                    // 🔔 NEW: Log completion activity
                    try {
                        console.log('🔔 Logging section completion activity...');
                        if (newCompletionStatus) {
                            await logSectionCompleted(
                                projectId,
                                projectName,
                                sectionId,
                                sectionName,
                                `Section marked as completed via details page`
                            );
                            console.log('✅ Section completion activity logged');
                            
                            // 🔔 Create local notification for completion
                            try {
                                const NotificationManager = (await import('../services/notificationManager')).default;
                                const notificationManager = NotificationManager.getInstance();
                                
                                await notificationManager.scheduleLocalNotification(
                                    `✅ Section Completed`,
                                    `Section "${sectionName}" has been marked as completed in ${projectName}`,
                                    {
                                        category: 'section',
                                        action: 'section_completed',
                                        projectId,
                                        projectName,
                                        sectionId,
                                        sectionName,
                                        route: 'project',
                                    }
                                );
                                
                                console.log('✅ Local completion notification created');
                            } catch (notificationError) {
                                console.error('❌ Failed to create completion notification:', notificationError);
                            }
                        } else {
                            await logSectionReopened(
                                projectId,
                                projectName,
                                sectionId,
                                sectionName,
                                `Section reopened via details page`
                            );
                            console.log('✅ Section reopen activity logged');
                            
                            // 🔔 Create local notification for reopening
                            try {
                                const NotificationManager = (await import('../services/notificationManager')).default;
                                const notificationManager = NotificationManager.getInstance();
                                
                                await notificationManager.scheduleLocalNotification(
                                    `🔄 Section Reopened`,
                                    `Section "${sectionName}" has been reopened in ${projectName}`,
                                    {
                                        category: 'section',
                                        action: 'section_reopened',
                                        projectId,
                                        projectName,
                                        sectionId,
                                        sectionName,
                                        route: 'project',
                                    }
                                );
                                
                                console.log('✅ Local reopen notification created');
                            } catch (notificationError) {
                                console.error('❌ Failed to create reopen notification:', notificationError);
                            }
                        }
                    } catch (activityError) {
                        console.error('❌ Failed to log section completion activity:', activityError);
                        // Don't fail the completion operation if activity logging fails
                    }
                } else {
                    // Fallback to toggle logic if API doesn't return the new status
                    const toggledStatus = !sectionCompleted;
                    setSectionCompleted(toggledStatus);
                    console.log('⚠️ Fallback: Section completion toggled to:', toggledStatus);
                    toast.success(responseData.message || `Section completion updated successfully`);
                    
                    // 🔔 NEW: Log completion activity (fallback)
                    try {
                        console.log('🔔 Logging section completion activity (fallback)...');
                        if (toggledStatus) {
                            await logSectionCompleted(
                                projectId,
                                projectName,
                                sectionId,
                                sectionName,
                                `Section marked as completed via details page (fallback)`
                            );
                            console.log('✅ Section completion activity logged (fallback)');
                            
                            // 🔔 Create local notification for completion (fallback)
                            try {
                                const NotificationManager = (await import('../services/notificationManager')).default;
                                const notificationManager = NotificationManager.getInstance();
                                
                                await notificationManager.scheduleLocalNotification(
                                    `✅ Section Completed`,
                                    `Section "${sectionName}" has been marked as completed in ${projectName}`,
                                    {
                                        category: 'section',
                                        action: 'section_completed',
                                        projectId,
                                        projectName,
                                        sectionId,
                                        sectionName,
                                        route: 'project',
                                    }
                                );
                                
                                console.log('✅ Local completion notification created (fallback)');
                            } catch (notificationError) {
                                console.error('❌ Failed to create completion notification (fallback):', notificationError);
                            }
                        } else {
                            await logSectionReopened(
                                projectId,
                                projectName,
                                sectionId,
                                sectionName,
                                `Section reopened via details page (fallback)`
                            );
                            console.log('✅ Section reopen activity logged (fallback)');
                            
                            // 🔔 Create local notification for reopening (fallback)
                            try {
                                const NotificationManager = (await import('../services/notificationManager')).default;
                                const notificationManager = NotificationManager.getInstance();
                                
                                await notificationManager.scheduleLocalNotification(
                                    `🔄 Section Reopened`,
                                    `Section "${sectionName}" has been reopened in ${projectName}`,
                                    {
                                        category: 'section',
                                        action: 'section_reopened',
                                        projectId,
                                        projectName,
                                        sectionId,
                                        sectionName,
                                        route: 'project',
                                    }
                                );
                                
                                console.log('✅ Local reopen notification created (fallback)');
                            } catch (notificationError) {
                                console.error('❌ Failed to create reopen notification (fallback):', notificationError);
                            }
                        }
                    } catch (activityError) {
                        console.error('❌ Failed to log section completion activity (fallback):', activityError);
                        // Don't fail the completion operation if activity logging fails
                    }
                }
            } else {
                throw new Error(responseData.message || 'Failed to update section completion');
            }
        } catch (error: any) {
            console.error('❌ Error updating section completion:', error);
            console.error('Error details:', {
                message: error?.message,
                status: error?.response?.status,
                statusText: error?.response?.statusText,
                data: error?.response?.data,
                config: {
                    url: error?.config?.url,
                    method: error?.config?.method,
                    data: error?.config?.data
                }
            });
            
            // Handle specific error cases
            const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
            
            if (errorMessage.includes('not found')) {
                toast.error('Section not found in project. This section may not support completion tracking yet.');
            } else if (error?.code === 'ECONNABORTED') {
                toast.error('Request timeout. Please check your connection and try again.');
            } else if (error?.response?.status === 404) {
                toast.error('Completion feature not available for this section.');
            } else {
                toast.error(`Failed to update section completion: ${errorMessage}`);
            }
        } finally {
            setIsUpdatingCompletion(false);
        }
    };

    // Function to toggle mini-section completion
    const toggleMiniSectionCompletionDirect = async (miniSectionId: string, miniSectionName: string) => {
        if (isUpdatingCompletion) return;
        
        setIsUpdatingCompletion(true);
        
        try {
            const payload = {
                updateType: 'minisection',
                id: miniSectionId
            };
            
            const response = await axios.patch(`${domain}/api/completion`, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });
            
            const responseData = response.data as any;
            if (responseData.success) {
                const newStatus = responseData.data?.isCompleted;
                
                if (typeof newStatus === 'boolean') {
                    setMiniSectionCompletions(prev => ({
                        ...prev,
                        [miniSectionId]: newStatus
                    }));
                    
                    toast.success(`${miniSectionName} ${newStatus ? 'completed' : 'reopened'} successfully`);
                    
                    // 🔔 NEW: Log mini-section completion activity
                    try {
                        console.log('🔔 Logging mini-section completion activity...');
                        if (newStatus) {
                            await logMiniSectionCompleted(
                                projectId,
                                projectName,
                                sectionId,
                                sectionName,
                                miniSectionId,
                                miniSectionName,
                                `Mini-section marked as completed via details page`
                            );
                            console.log('✅ Mini-section completion activity logged');
                            
                            // 🔔 Create local notification for mini-section completion
                            try {
                                const NotificationManager = (await import('../services/notificationManager')).default;
                                const notificationManager = NotificationManager.getInstance();
                                
                                await notificationManager.scheduleLocalNotification(
                                    `✅ Mini-Section Completed`,
                                    `Mini-section "${miniSectionName}" has been completed in ${projectName} → ${sectionName}`,
                                    {
                                        category: 'mini_section',
                                        action: 'mini_section_completed',
                                        projectId,
                                        projectName,
                                        sectionId,
                                        sectionName,
                                        miniSectionId,
                                        miniSectionName,
                                        route: 'project',
                                    }
                                );
                                
                                console.log('✅ Local mini-section completion notification created');
                            } catch (notificationError) {
                                console.error('❌ Failed to create mini-section completion notification:', notificationError);
                            }
                        } else {
                            await logMiniSectionReopened(
                                projectId,
                                projectName,
                                sectionId,
                                sectionName,
                                miniSectionId,
                                miniSectionName,
                                `Mini-section reopened via details page`
                            );
                            console.log('✅ Mini-section reopen activity logged');
                            
                            // 🔔 Create local notification for mini-section reopening
                            try {
                                const NotificationManager = (await import('../services/notificationManager')).default;
                                const notificationManager = NotificationManager.getInstance();
                                
                                await notificationManager.scheduleLocalNotification(
                                    `🔄 Mini-Section Reopened`,
                                    `Mini-section "${miniSectionName}" has been reopened in ${projectName} → ${sectionName}`,
                                    {
                                        category: 'mini_section',
                                        action: 'mini_section_reopened',
                                        projectId,
                                        projectName,
                                        sectionId,
                                        sectionName,
                                        miniSectionId,
                                        miniSectionName,
                                        route: 'project',
                                    }
                                );
                                
                                console.log('✅ Local mini-section reopen notification created');
                            } catch (notificationError) {
                                console.error('❌ Failed to create mini-section reopen notification:', notificationError);
                            }
                        }
                    } catch (activityError) {
                        console.error('❌ Failed to log mini-section completion activity:', activityError);
                        // Don't fail the completion operation if activity logging fails
                    }
                } else {
                    // Fallback to toggle logic if API doesn't return the new status
                    const currentStatus = miniSectionCompletions[miniSectionId] || false;
                    const toggledStatus = !currentStatus;
                    
                    setMiniSectionCompletions(prev => ({
                        ...prev,
                        [miniSectionId]: toggledStatus
                    }));
                    
                    toast.success(`${miniSectionName} completion updated`);
                    
                    // 🔔 NEW: Log mini-section completion activity (fallback)
                    try {
                        console.log('🔔 Logging mini-section completion activity (fallback)...');
                        if (toggledStatus) {
                            await logMiniSectionCompleted(
                                projectId,
                                projectName,
                                sectionId,
                                sectionName,
                                miniSectionId,
                                miniSectionName,
                                `Mini-section marked as completed via details page (fallback)`
                            );
                            console.log('✅ Mini-section completion activity logged (fallback)');
                            
                            // 🔔 Create local notification for mini-section completion (fallback)
                            try {
                                const NotificationManager = (await import('../services/notificationManager')).default;
                                const notificationManager = NotificationManager.getInstance();
                                
                                await notificationManager.scheduleLocalNotification(
                                    `✅ Mini-Section Completed`,
                                    `Mini-section "${miniSectionName}" has been completed in ${projectName} → ${sectionName}`,
                                    {
                                        category: 'mini_section',
                                        action: 'mini_section_completed',
                                        projectId,
                                        projectName,
                                        sectionId,
                                        sectionName,
                                        miniSectionId,
                                        miniSectionName,
                                        route: 'project',
                                    }
                                );
                                
                                console.log('✅ Local mini-section completion notification created (fallback)');
                            } catch (notificationError) {
                                console.error('❌ Failed to create mini-section completion notification (fallback):', notificationError);
                            }
                        } else {
                            await logMiniSectionReopened(
                                projectId,
                                projectName,
                                sectionId,
                                sectionName,
                                miniSectionId,
                                miniSectionName,
                                `Mini-section reopened via details page (fallback)`
                            );
                            console.log('✅ Mini-section reopen activity logged (fallback)');
                            
                            // 🔔 Create local notification for mini-section reopening (fallback)
                            try {
                                const NotificationManager = (await import('../services/notificationManager')).default;
                                const notificationManager = NotificationManager.getInstance();
                                
                                await notificationManager.scheduleLocalNotification(
                                    `🔄 Mini-Section Reopened`,
                                    `Mini-section "${miniSectionName}" has been reopened in ${projectName} → ${sectionName}`,
                                    {
                                        category: 'mini_section',
                                        action: 'mini_section_reopened',
                                        projectId,
                                        projectName,
                                        sectionId,
                                        sectionName,
                                        miniSectionId,
                                        miniSectionName,
                                        route: 'project',
                                    }
                                );
                                
                                console.log('✅ Local mini-section reopen notification created (fallback)');
                            } catch (notificationError) {
                                console.error('❌ Failed to create mini-section reopen notification (fallback):', notificationError);
                            }
                        }
                    } catch (activityError) {
                        console.error('❌ Failed to log mini-section completion activity (fallback):', activityError);
                        // Don't fail the completion operation if activity logging fails
                    }
                }
            } else {
                throw new Error(responseData.message || 'API returned success: false');
            }
            
        } catch (error: any) {
            console.error('Error updating mini-section completion:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
            toast.error(`Failed to update ${miniSectionName}: ${errorMessage}`);
        } finally {
            setIsUpdatingCompletion(false);
        }
    };

    // Enhanced function to load mini-section completion status
    const loadMiniSectionCompletionStatus = async () => {
        console.log('\n========================================');
        console.log('🔍 ENHANCED: Loading mini-section completion status...');
        console.log('========================================');
        console.log('🔍 ENHANCED: sectionId:', sectionId);
        console.log('🔍 ENHANCED: domain:', domain);
        console.log('🔍 ENHANCED: miniSections.length:', miniSections.length);
        
        if (!sectionId) {
            console.log('❌ ENHANCED: No sectionId available');
            return;
        }
        
        if (miniSections.length === 0) {
            console.log('⚠️ ENHANCED: No mini-sections loaded yet, skipping completion load');
            return;
        }
        
        try {
            console.log('� ENHANCED: Using existing mini-sections array instead of API call');
            console.log('� ENHANCED: Mini-sections to process:', miniSections.map(s => ({ id: s._id, name: s.name })));
            
            // Step 2: Load completion status for each mini-section
            const completionStates: {[key: string]: boolean} = {};
            
            for (const section of miniSections) {
                console.log(`\n📡 ENHANCED: Loading completion for ${section.name} (${section._id})`);
                
                try {
                    const completionUrl = `${domain}/api/completion?updateType=minisection&id=${section._id}`;
                    console.log(`📡 ENHANCED: Completion URL: ${completionUrl}`);
                    
                    const completionResponse = await axios.get(completionUrl);
                    console.log(`📊 ENHANCED: ${section.name} response status:`, completionResponse.status);
                    console.log(`� ENHANCED: ${section.name} full response:`, JSON.stringify(completionResponse.data, null, 2));
                    
                    const completionData = completionResponse.data as any;
                    if (completionData.success && completionData.data) {
                        const isCompleted = completionData.data.isCompleted;
                        const booleanCompleted = Boolean(isCompleted);
                        completionStates[section._id] = booleanCompleted;
                        
                        console.log(`✅ ENHANCED: ${section.name} completion analysis:`);
                        console.log(`   - Raw value: ${isCompleted}`);
                        console.log(`   - Type: ${typeof isCompleted}`);
                        console.log(`   - Boolean conversion: ${booleanCompleted}`);
                        console.log(`   - State key: ${section._id}`);
                        console.log(`   - State value: ${completionStates[section._id]}`);
                        console.log(`   - UI should show: ${booleanCompleted ? 'GREEN COMPLETED ✅' : 'GRAY COMPLETE ○'}`);
                    } else {
                        completionStates[section._id] = false;
                        console.log(`⚠️ ENHANCED: ${section.name} defaulted to false`);
                        console.log(`⚠️ ENHANCED: Response analysis:`, {
                            success: completionData.success,
                            hasData: !!completionData.data,
                            dataKeys: completionData.data ? Object.keys(completionData.data) : [],
                            fullData: completionData.data
                        });
                    }
                } catch (error: any) {
                    console.log(`❌ ENHANCED: ${section.name} fetch failed:`, error.message);
                    console.log(`❌ ENHANCED: Error details:`, {
                        status: error.response?.status,
                        statusText: error.response?.statusText,
                        data: error.response?.data
                    });
                    completionStates[section._id] = false;
                }
            }
            
            // Step 3: Update state
            console.log('\n🔄 ENHANCED: Updating miniSectionCompletions state...');
            console.log('🔄 ENHANCED: New state object:', completionStates);
            console.log('� ENHANCED: State entries:');
            Object.entries(completionStates).forEach(([id, completed]) => {
                const section = miniSections.find(s => s._id === id);
                const sectionName = section ? section.name : 'Unknown';
                console.log(`   - ${sectionName} (${id}): ${completed} -> UI: ${completed ? 'GREEN' : 'GRAY'}`);
            });
            
            setMiniSectionCompletions(completionStates);
            
            // Step 4: Verify state update with a delay
            setTimeout(() => {
                console.log('\n🔍 ENHANCED: State verification after update...');
                console.log('🔍 ENHANCED: Current miniSectionCompletions state should be:', completionStates);
                
                // This will be logged by the useEffect when the state actually changes
                console.log('🔍 ENHANCED: Waiting for useEffect to log actual state change...');
            }, 100);
            
            console.log('========================================\n');
            
        } catch (error: any) {
            console.error('❌ ENHANCED: Failed to load completion status:', error);
            console.error('❌ ENHANCED: Error details:', error.response?.data || error.message);
            console.log('========================================\n');
        }
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

    const logMaterialActivity = async (
        materials: any[],
        activity: 'imported' | 'used' | 'transferred',
        message: string = ''
    ) => {
        try {
            const user = await getUserData();
            const clientId = await getClientIdFromStorage();

            if (!user || !clientId) {
                console.error('❌ Missing user data or clientId:', { user, clientId });
                return;
            }

            console.log('👤 User Data:', user);
            console.log('🏢 Client ID:', clientId);

            // Step 1: Log the activity to backend (existing functionality)
            const activityPayload = {
                clientId,
                projectId,
                projectName,
                sectionName,
                materials,
                message,
                activity,
                user,
                date: new Date().toISOString(),
            };

            console.log('📤 Logging activity to backend...');
            const response = await axios.post(`${domain}/api/materialActivity`, activityPayload);
            
            console.log('✅ Material Activity API Response:');
            console.log('   - Status:', response.status);
            console.log('   - Data:', JSON.stringify(response.data, null, 2));

            const responseData = response.data as any;
            if (!responseData.success) {
                console.error('❌ Failed to log activity:', responseData.message);
                return;
            }

            // Step 2: Enhanced notification logic
            console.log('📱 Processing enhanced notifications...');
            
            try {
                // Get notification recipients (admins and staff for this client)
                const recipients = await getNotificationRecipients(clientId, projectId, user.userId, materials, activity, user);
                
                if (recipients.length > 0) {
                    console.log(`🔔 Sending notifications to ${recipients.length} recipients...`);
                    
                    // Create notification payload
                    const notificationPayload = createMaterialNotificationPayload(
                        activity,
                        materials,
                        projectId,
                        projectName,
                        sectionName,
                        user,
                        recipients
                    );

                    // Send notifications
                    await sendEnhancedNotifications(notificationPayload);
                } else {
                    console.log('ℹ️ No notification recipients found');
                }
            } catch (notificationError) {
                console.error('❌ Enhanced notification error:', notificationError);
                // Don't fail the entire operation if notifications fail
            }

            console.log('🎉 ENHANCED MATERIAL ACTIVITY LOGGED SUCCESSFULLY');
            console.log('========================================\n');

        } catch (error) {
            console.error('\n========================================');
            console.error('❌ ENHANCED MATERIAL ACTIVITY LOGGING FAILED');
            console.error('========================================');
            console.error('Error Type:', error?.constructor?.name);
            console.error('Error Message:', (error as any)?.message);
            
            if ((error as any)?.response) {
                console.error('API Response Error:');
                console.error('   - Status:', (error as any).response.status);
                console.error('   - Data:', JSON.stringify((error as any).response.data, null, 2));
            }
            console.error('========================================\n');
        }
    };

    // Helper function to get notification recipients
    const getNotificationRecipients = async (
        clientId: string, 
        projectId: string, 
        excludeUserId: string,
        materials: any[],
        activity: 'imported' | 'used' | 'transferred',
        user: any
    ) => {
        try {
            console.log('🔍 Getting notification recipients...');
            console.log('   - Client ID:', clientId);
            console.log('   - Project ID:', projectId);
            console.log('   - Exclude User ID:', excludeUserId);

            // Try to get recipients from backend
            const response = await axios.get(`${domain}/api/notifications/recipients?clientId=${clientId}&projectId=${projectId}`);
            
            const responseData = response.data as any;
            if (responseData.success) {
                let recipients = responseData.recipients || [];
                // Exclude the user who triggered the action
                recipients = recipients.filter((r: any) => r.userId !== excludeUserId);
                console.log(`✅ Found ${recipients.length} recipients from backend`);
                return recipients;
            }
        } catch (error: any) {
            console.warn('⚠️ Backend recipients API not available:', error?.response?.status);
            
            // If 404, the endpoint doesn't exist yet
            if (error?.response?.status === 404) {
                console.log('📝 Backend notification API not implemented yet - using fallback');
            }
        }

        // Fallback: Create a local notification for testing
        console.log('🔄 Using fallback notification method...');
        try {
            // Import and use the notification manager for local testing
            const NotificationManager = (await import('../services/notificationManager')).default;
            const notificationManager = NotificationManager.getInstance();
            
            // Create a test notification to show the system is working
            const materialCount = materials.length;
            const totalCost = materials.reduce((sum: number, m: any) => sum + (m.totalCost || m.cost || 0), 0);
            
            let title = '';
            let body = '';
            
            switch (activity) {
                case 'imported':
                    title = `📦 Materials Imported`;
                    body = `${user.fullName} imported ${materialCount} material${materialCount > 1 ? 's' : ''} (₹${totalCost.toLocaleString()}) in ${projectName}`;
                    break;
                case 'used':
                    title = `🔧 Materials Used`;
                    body = `${user.fullName} used ${materialCount} material${materialCount > 1 ? 's' : ''} (₹${totalCost.toLocaleString()}) in ${projectName} - ${sectionName}`;
                    break;
                case 'transferred':
                    title = `↔️ Materials Transferred`;
                    body = `${user.fullName} transferred ${materialCount} material${materialCount > 1 ? 's' : ''} (₹${totalCost.toLocaleString()}) from ${projectName}`;
                    break;
            }
            
            await notificationManager.scheduleLocalNotification(
                title,
                body,
                {
                    category: 'material',
                    action: activity,
                    projectId,
                    projectName,
                    sectionName,
                    clientId,
                    triggeredBy: user.fullName,
                    route: 'notification',
                }
            );
            
            console.log('✅ Local fallback notification created');
        } catch (fallbackError) {
            console.error('❌ Local notification fallback failed:', fallbackError);
        }

        return []; // Return empty array for now
    };

    // Helper function to create notification payload
    const createMaterialNotificationPayload = (
        activity: 'imported' | 'used' | 'transferred',
        materials: any[],
        projectId: string,
        projectName: string,
        sectionName: string,
        triggeredBy: any,
        recipients: any[]
    ) => {
        const materialCount = materials.length;
        const totalCost = materials.reduce((sum: number, m: any) => sum + (m.totalCost || m.cost || 0), 0);

        let title = '';
        let body = '';

        switch (activity) {
            case 'imported':
                title = `📦 Materials Imported`;
                body = `${triggeredBy.fullName} imported ${materialCount} material${materialCount > 1 ? 's' : ''} (₹${totalCost.toLocaleString()}) in ${projectName}`;
                break;
            case 'used':
                title = `🔧 Materials Used`;
                body = `${triggeredBy.fullName} used ${materialCount} material${materialCount > 1 ? 's' : ''} (₹${totalCost.toLocaleString()}) in ${projectName} - ${sectionName}`;
                break;
            case 'transferred':
                title = `↔️ Materials Transferred`;
                body = `${triggeredBy.fullName} transferred ${materialCount} material${materialCount > 1 ? 's' : ''} (₹${totalCost.toLocaleString()}) from ${projectName}`;
                break;
        }

        return {
            title,
            body,
            category: 'material',
            action: activity,
            data: {
                projectId,
                projectName,
                sectionName,
                clientId: triggeredBy.clientId || 'unknown',
                triggeredBy: {
                    userId: triggeredBy.userId,
                    fullName: triggeredBy.fullName,
                    userType: 'staff', // You might want to determine this properly
                },
                materials,
                totalCost,
                route: 'project',
            },
            recipients,
            timestamp: new Date().toISOString(),
        };
    };

    // Helper function to send enhanced notifications
    const sendEnhancedNotifications = async (payload: any) => {
        try {
            console.log('📤 Attempting to send notifications via backend...');
            console.log('   - Recipients:', payload.recipients.length);
            console.log('   - Title:', payload.title);
            
            // Try to send via backend notification service
            const response = await axios.post(`${domain}/api/notifications/send`, payload);
            
            const responseData = response.data as any;
            if (responseData.success) {
                console.log('✅ Server-side notifications sent successfully');
                return true;
            } else {
                console.warn('⚠️ Server-side notifications failed:', responseData.message);
                return false;
            }
        } catch (error: any) {
            console.warn('⚠️ Backend notification service not available:', error?.response?.status);
            
            if (error?.response?.status === 404) {
                console.log('📝 Backend notification API not implemented yet');
                console.log('💡 Recommendation: Implement POST /api/notifications/send endpoint');
            }
            
            // For now, we already created a local notification in the fallback
            console.log('✅ Using local notification fallback (already created)');
            return false;
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

    // Function to check for low stock materials
    const checkLowStockMaterials = () => {
        console.log('\n========================================');
        console.log('🔍 CHECKING LOW STOCK MATERIALS');
        console.log('========================================');
        console.log('Available materials:', materials?.available?.length || 0);
        console.log('Used materials:', materials?.used?.length || 0);
        console.log('Ignored materials:', ignoredMaterials);
        console.log('Low stock threshold:', lowStockThreshold, '%');

        const lowStockItems: any[] = [];

        // ✅ SAFETY CHECK: Ensure we have materials to check
        if (!materials || !materials.available || materials.available.length === 0) {
            console.log('⚠️ No materials available to check for low stock');
            return lowStockItems;
        }

        // Group materials to get complete picture
        const groupedMaterials = groupMaterialsByName(materials.available, false);

        console.log(`\n📦 Checking ${groupedMaterials.length} grouped materials for low stock...`);

        groupedMaterials.forEach((group: any) => {
            const materialKey = `${group.name}-${group.unit}`;
            
            // Skip if this material is ignored
            if (ignoredMaterials.includes(materialKey)) {
                console.log(`⏭️ Skipping ignored material: ${group.name}`);
                return;
            }

            // ✅ CRITICAL: Use the correct values from grouped materials
            // totalImported = total quantity originally imported (available + used)
            // currentlyAvailable = quantity still available (not used yet)
            const totalImported = group.totalImported || 0;
            const currentAvailable = group.currentlyAvailable || group.totalQuantity || 0;
            
            if (totalImported > 0) {
                const stockPercentage = (currentAvailable / totalImported) * 100;
                
                console.log(`\n📊 ${group.name}:`);
                console.log(`   Total Imported: ${totalImported} ${group.unit}`);
                console.log(`   Currently Available: ${currentAvailable} ${group.unit}`);
                console.log(`   Stock Percentage: ${stockPercentage.toFixed(1)}%`);
                console.log(`   Threshold: ${lowStockThreshold}%`);
                console.log(`   Is Low Stock: ${stockPercentage <= lowStockThreshold ? 'YES ⚠️' : 'NO ✅'}`);

                // ✅ Check if stock is at or below threshold
                if (stockPercentage <= lowStockThreshold) {
                    const alertLevel = stockPercentage <= 3 ? 'critical' : stockPercentage <= 7 ? 'warning' : 'low';
                    
                    lowStockItems.push({
                        ...group,
                        materialKey,
                        totalImported,
                        currentAvailable,
                        stockPercentage,
                        alertLevel
                    });
                    
                    console.log(`   🚨 ALERT LEVEL: ${alertLevel.toUpperCase()}`);
                }
            } else {
                console.log(`\n⚠️ ${group.name}: No import data (totalImported = 0)`);
            }
        });

        console.log(`\n========================================`);
        console.log(`🚨 FOUND ${lowStockItems.length} LOW STOCK MATERIALS`);
        console.log(`========================================`);
        
        if (lowStockItems.length > 0) {
            console.log('\n📋 Low Stock Materials:');
            lowStockItems.forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.name}`);
                console.log(`      - Available: ${item.currentAvailable} / ${item.totalImported} ${item.unit}`);
                console.log(`      - Stock: ${item.stockPercentage.toFixed(1)}%`);
                console.log(`      - Alert Level: ${item.alertLevel}`);
            });
        }
        console.log(`========================================\n`);

        setLowStockMaterials(lowStockItems);
        
        // ✅ Show alert automatically if there are new low stock items
        // Only show if alert is not already visible AND 15 hours have passed since last dismissal
        if (lowStockItems.length > 0 && !showLowStockAlert && shouldShowAlert()) {
            console.log('🔔 Showing low stock alert modal...');
            setShowLowStockAlert(true);
        } else if (lowStockItems.length > 0 && !shouldShowAlert()) {
            console.log('⏰ Low stock detected but alert is suppressed (15-hour cooldown active)');
        }

        return lowStockItems;
    };

    // Load project materials on mount (LIMIT: 10 items per page)
    useEffect(() => {
        fetchMaterials(1, 10, true); // ✅ OPTIMIZED: 10 items per page for better UX
        loadInitialCompletionStatus(); // Load completion status on mount
        loadIgnoredMaterials(); // Load ignored materials from storage
        loadAlertDismissalTime(); // ✅ NEW: Load alert dismissal timestamp

        // Load current user type
        const loadUserType = async () => {
            try {
                const userData = await getUserData();
                setCurrentUserType(userData.userType);
                console.log('🔍 Current user type loaded:', userData.userType);
                console.log('🔍 Transfer button will be:', userData.userType === 'staff' ? 'HIDDEN' : 'VISIBLE');
            } catch (error) {
                console.error('Error loading user type:', error);
                setCurrentUserType('staff'); // Default to staff
            }
        };
        loadUserType();
    }, [projectId]);

    // ✅ NEW: Check for low stock materials whenever materials change
    useEffect(() => {
        // Only check when we have both available and used materials loaded
        if (!materials.loading && materials.available.length > 0) {
            console.log('🔍 Checking for low stock materials...');
            checkLowStockMaterials();
        }
    }, [materials.available, materials.used, materials.loading, ignoredMaterials]);

    // Load initial completion status for section and mini-sections
    const loadInitialCompletionStatus = async () => {
        try {
            // Load section completion status
            if (sectionId && isValidMongoId(sectionId) && projectId && isValidMongoId(projectId)) {
                try {
                    const sectionResponse = await axios.get(`${domain}/api/completion?updateType=project-section&id=${sectionId}&projectId=${projectId}`);
                    const sectionData = sectionResponse.data as any;
                    if (sectionData.success && sectionData.data) {
                        const isSectionCompleted = Boolean(sectionData.data.isCompleted);
                        setSectionCompleted(isSectionCompleted);
                    }
                } catch (error) {
                    console.warn('Could not load section completion status:', error);
                }
            }

            // Load mini-section completion status
            await loadMiniSectionCompletionStatus();
            
        } catch (error) {
            console.error('❌ Error loading initial completion status:', error);
        }
    };

    useEffect(() => {
        if (__DEV__ && consoleLogCount < MAX_CONSOLE_LOGS) {
            console.log('🔄 usedMaterials:', materials?.used?.length || 0);
            consoleLogCount++;
        }
    }, [materials.used]);

    // Debug: Log when materials state changes (limited logging)
    useEffect(() => {
        if (__DEV__ && consoleLogCount < MAX_CONSOLE_LOGS) {
            console.log('📦 availableMaterials:', materials?.available?.length || 0);
            consoleLogCount++;
        }
    }, [materials.available]);

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
                console.log('🔄 Fetching mini-sections for sectionId:', sectionId);
                const sections = await getSection(sectionId);
                if (sections && Array.isArray(sections)) {
                    console.log('✅ Mini-sections loaded:', sections.length);
                    console.log('✅ Mini-sections:', sections.map(s => ({ id: s._id, name: s.name })));
                    
                    setMiniSections(sections);
                    
                    // Load completion status after mini-sections are loaded with a longer delay
                    setTimeout(async () => {
                        console.log('🔄 Loading completion status after mini-sections are set...');
                        await loadMiniSectionCompletionStatus();
                    }, 500); // Increased delay to ensure state is updated
                }
            } catch (error) {
                console.error('❌ Error fetching mini-sections:', error);
            }
        };

        fetchMiniSections();
    }, [sectionId, projectId]);

    // ✅ OPTIMIZED: Wrapper function for material grouping with safety checks
    const getGroupedMaterialsWithCompleteData = (materialsToDisplay: any[], isUsedTab: boolean) => {
        console.log(`\n🔄 GROUPING MATERIALS WITH COMPLETE DATA:`);
        console.log(`   Materials to display: ${materialsToDisplay?.length || 0}`);
        console.log(`   Available materials in state: ${materials?.available?.length || 0}`);
        console.log(`   Used materials in state: ${materials?.used?.length || 0}`);
        console.log(`   Is used tab: ${isUsedTab}`);
        
        // ✅ SAFETY CHECK: Ensure we have valid data before grouping
        if (!materialsToDisplay || !Array.isArray(materialsToDisplay) || materialsToDisplay.length === 0) {
            console.log('⚠️ No valid materials to display, returning empty array');
            return [];
        }
        
        if (!materials || !materials.available || !materials.used) {
            console.log('⚠️ Materials state not ready, returning empty array');
            return [];
        }
        
        return groupMaterialsByName(materialsToDisplay, isUsedTab);
    };

    // ✅ FIXED: Group materials by name, unit, AND specifications for separate cards
    const groupMaterialsByName = (materialsArray: Material[], isUsedTab: boolean = false) => {
        try {
            // ✅ SAFETY CHECK: Ensure materials array exists and is valid
            if (!materialsArray || !Array.isArray(materialsArray)) {
                console.warn('⚠️ Invalid materials array passed to groupMaterialsByName:', materialsArray);
                return [];
            }

            // ✅ SAFETY CHECK: Ensure materials state exists before accessing it in calculations
            if (!materials || !materials.available || !materials.used) {
                console.warn('⚠️ Materials state not properly initialized, skipping grouping');
                return [];
            }

            if (__DEV__ && consoleLogCount < MAX_CONSOLE_LOGS) {
                console.log('Grouping', materialsArray.length, 'materials for', isUsedTab ? 'USED' : 'IMPORTED', 'tab');
                consoleLogCount++;
            }

            const grouped: { [key: string]: any } = {};

            // Debug raw materials input
            if (__DEV__) {
                console.log('🔍 RAW MATERIALS INPUT TO GROUPING:');
                materialsArray.forEach((material, index) => {
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

            materialsArray.forEach((material, index) => {
                // ✅ FIXED: Create grouping key WITH price to create separate cards for different costs
                const specsKey = material.specs ? JSON.stringify(material.specs) : 'no-specs';
                const perUnitCost = material.perUnitCost || material.price || 0;
                const priceKey = perUnitCost.toFixed(2); // Round to 2 decimals for consistent grouping
                const key = `${material.name}-${material.unit}-${specsKey}-${priceKey}`;

                if (!grouped[key]) {
                    grouped[key] = {
                        name: material.name,
                        unit: material.unit,
                        icon: material.icon,
                        color: material.color,
                        date: material.date, // Will be updated to most recent date
                        createdAt: material.createdAt, // ✅ NEW: Track creation date
                        addedAt: material.addedAt, // ✅ NEW: Track added date
                        specs: material.specs || {},
                        variants: [],
                        totalQuantity: 0,
                        totalCost: 0,
                        totalUsed: 0,
                        totalImported: 0,
                        currentlyAvailable: 0,
                        miniSectionId: material.miniSectionId,
                    };
                } else {
                    // ✅ CRITICAL FIX: Update to most recent date when grouping
                    const currentDate = new Date(grouped[key].date || 0);
                    const newDate = new Date(material.date || 0);
                    if (newDate > currentDate) {
                        grouped[key].date = material.date;
                        grouped[key].createdAt = material.createdAt;
                        grouped[key].addedAt = material.addedAt;
                    }
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
                        materialPerUnitCost: material.perUnitCost,
                        materialTotalCost: (material as any).totalCost,
                        materialPriceType: typeof material.price,
                        groupKey: key,
                        beforeQuantity: grouped[key].totalQuantity,
                        beforeCost: grouped[key].totalCost
                    });
                }

                grouped[key].totalQuantity += material.quantity;
                // ✅ CRITICAL FIX: Calculate total cost correctly
                // Use perUnitCost (which is stored in material.price) multiplied by quantity
                const materialPerUnitCost = material.perUnitCost || material.price || 0;
                const materialTotalCost = materialPerUnitCost * material.quantity;
                grouped[key].totalCost += materialTotalCost;

                // Debug logging after addition
                if (__DEV__) {
                    console.log('🔍 AFTER ADDITION:', {
                        materialName: material.name,
                        materialQuantity: material.quantity,
                        materialPerUnitCost: materialPerUnitCost,
                        materialTotalCost: materialTotalCost,
                        afterQuantity: grouped[key].totalQuantity,
                        afterCost: grouped[key].totalCost,
                        expectedPerUnit: grouped[key].totalQuantity > 0 ? (grouped[key].totalCost / grouped[key].totalQuantity) : 0
                    });
                }
            });

            // ✅ FIXED: Proper calculation logic for both tabs with null checks
            Object.keys(grouped).forEach((key) => {
                const group = grouped[key];
                
                console.log(`\n🔍 PROCESSING GROUP: ${group.name}`);
                console.log(`   Group key: ${key}`);
                console.log(`   Group totalQuantity (from current tab): ${group.totalQuantity}`);
                
                // ✅ SAFETY CHECK: Ensure materials arrays exist
                const availableMaterials = materials?.available || [];
                const usedMaterials = materials?.used || [];
                
                console.log(`   Available materials count: ${availableMaterials.length}`);
                console.log(`   Used materials count: ${usedMaterials.length}`);

                const availableQuantity = availableMaterials
                    .filter(m => {
                        const mSpecsKey = m.specs ? JSON.stringify(m.specs) : 'no-specs';
                        const mPerUnitCost = m.perUnitCost || m.price || 0;
                        const mPriceKey = mPerUnitCost.toFixed(2);
                        const mKey = `${m.name}-${m.unit}-${mSpecsKey}-${mPriceKey}`;
                        const matches = mKey === key;
                        if (matches) {
                            console.log(`     ✅ Available match: ${m.name} (${m.quantity} ${m.unit}) @ ₹${mPriceKey}`);
                        }
                        return matches;
                    })
                    .reduce((sum, m) => {
                        console.log(`     Adding available: ${m.quantity}`);
                        return sum + m.quantity;
                    }, 0);

                // Calculate used quantity for this material
                const usedQuantity = usedMaterials
                    .filter(m => {
                        const mSpecsKey = m.specs ? JSON.stringify(m.specs) : 'no-specs';
                        const mPerUnitCost = m.perUnitCost || m.price || 0;
                        const mPriceKey = mPerUnitCost.toFixed(2);
                        const mKey = `${m.name}-${m.unit}-${mSpecsKey}-${mPriceKey}`;
                        const matches = mKey === key;
                        if (matches) {
                            console.log(`     ✅ Used match: ${m.name} (${m.quantity} ${m.unit}) @ ₹${mPriceKey}`);
                        }
                        return matches;
                    })
                    .reduce((sum, m) => {
                        console.log(`     Adding used: ${m.quantity}`);
                        return sum + m.quantity;
                    }, 0);

                // ✅ FIXED: Total imported = Currently Available + Total Used
                const totalImported = availableQuantity + usedQuantity;

                console.log(`   📊 CALCULATED VALUES:`);
                console.log(`     Available quantity: ${availableQuantity}`);
                console.log(`     Used quantity: ${usedQuantity}`);
                console.log(`     Total imported: ${totalImported}`);

                // Set the correct values based on which tab we're displaying
                if (isUsedTab) {
                    // In "used" tab: show used materials
                    group.totalQuantity = group.totalQuantity; // Keep as is (used quantity)
                    group.totalUsed = usedQuantity; // Total used across all sections
                    group.totalImported = totalImported; // Total originally imported
                    group.currentlyAvailable = availableQuantity; // Currently available
                    
                    console.log(`   ✅ Used Tab - ${group.name}:`);
                    console.log(`     Showing Used: ${group.totalQuantity}`);
                    console.log(`     Total Used: ${usedQuantity}`);
                    console.log(`     Currently Available: ${availableQuantity}`);
                    console.log(`     Total Imported: ${totalImported}`);
                } else {
                    // In "imported" tab: show available materials
                    group.totalQuantity = group.totalQuantity; // Keep as is (available quantity)
                    group.totalUsed = usedQuantity; // Total used across all sections
                    group.totalImported = totalImported; // Total originally imported
                    group.currentlyAvailable = availableQuantity; // Currently available
                    
                    console.log(`   ✅ Imported Tab - ${group.name}:`);
                    console.log(`     Showing Available: ${group.totalQuantity}`);
                    console.log(`     Total Used: ${usedQuantity}`);
                    console.log(`     Currently Available: ${availableQuantity}`);
                    console.log(`     Total Imported: ${totalImported}`);
                }
                
                // Debug cost consistency
                if (__DEV__) {
                    const perUnit = group.totalQuantity > 0 ? (group.totalCost / group.totalQuantity) : 0;
                    console.log(`   💰 COST CONSISTENCY CHECK - ${key}:`, {
                        tab: isUsedTab ? 'used' : 'imported',
                        displayQuantity: group.totalQuantity,
                        displayCost: group.totalCost,
                        calculatedPerUnit: perUnit.toFixed(2),
                        totalImported: group.totalImported,
                        currentlyAvailable: group.currentlyAvailable,
                        totalUsed: group.totalUsed
                    });
                }
            });

            const result = Object.values(grouped);
            
            // ✅ CRITICAL FIX: Sort grouped materials by newest first
            // After grouping, we need to re-sort by the most recent createdAt in each group
            result.sort((a: any, b: any) => {
                // Get the most recent date from variants in each group
                const getLatestDate = (group: any) => {
                    if (!group.variants || group.variants.length === 0) return new Date(0);
                    
                    // Find the variant with the most recent date
                    const dates = group.variants
                        .map((v: any) => {
                            // Try to get date from the original material data
                            const dateStr = group.date || group.createdAt || group.addedAt;
                            return dateStr ? new Date(dateStr) : new Date(0);
                        })
                        .filter((d: Date) => !isNaN(d.getTime()));
                    
                    return dates.length > 0 ? new Date(Math.max(...dates.map((d: Date) => d.getTime()))) : new Date(0);
                };
                
                const dateA = getLatestDate(a);
                const dateB = getLatestDate(b);
                
                // Sort descending (newest first)
                return dateB.getTime() - dateA.getTime();
            });
            
            console.log('\n✅ MATERIALS SORTED BY NEWEST FIRST');
            if (result.length > 0) {
                console.log(`   First material: ${result[0].name} (${result[0].date})`);
                if (result.length > 1) {
                    console.log(`   Second material: ${result[1].name} (${result[1].date})`);
                }
            }
            
            // Debug final grouped results
            if (__DEV__) {
                console.log('🎯 FINAL GROUPED RESULTS:');
                result.forEach((group: any, index: number) => {
                    const perUnit = group.totalQuantity > 0 ? (group.totalCost / group.totalQuantity) : 0;
                    console.log(`   Group ${index + 1}: ${group.name}`);
                    console.log(`     Display Quantity: ${group.totalQuantity} (${typeof group.totalQuantity})`);
                    console.log(`     Display Cost: ${group.totalCost} (${typeof group.totalCost})`);
                    console.log(`     Per Unit: ₹${perUnit.toFixed(2)}/${group.unit}`);
                    console.log(`     Total Imported: ${group.totalImported}`);
                    console.log(`     Currently Available: ${group.currentlyAvailable}`);
                    console.log(`     Total Used: ${group.totalUsed}`);
                    console.log(`     Variants: ${group.variants.length}`);
                    console.log(`     Date: ${group.date}`); // ✅ Show date for verification
                });
            }
            
            return result;
        } catch (error) {
            console.error('Error grouping materials:', error);
            return [];
        }
    };
    // Helper function to validate API parameters
    const validateApiParameters = (params: any) => {
        const errors = [];
        
        if (!params.projectId || !isValidMongoId(params.projectId)) {
            errors.push('Invalid or missing projectId');
        }
        
        if (!params.sectionId || !isValidMongoId(params.sectionId)) {
            errors.push('Invalid or missing sectionId');
        }
        
        if (!params.miniSectionId || !isValidMongoId(params.miniSectionId)) {
            errors.push('Invalid or missing miniSectionId');
        }
        
        if (!params.clientId) {
            errors.push('Missing clientId');
        }
        
        if (!params.materialUsages || !Array.isArray(params.materialUsages) || params.materialUsages.length === 0) {
            errors.push('Invalid or empty materialUsages array');
        }
        
        if (!params.user || !params.user.userId) {
            errors.push('Invalid or missing user data');
        }
        
        return errors;
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

        console.log('\n🎯 MATERIAL USAGES TO PROCESS:');
        materialUsages.forEach((usage, index) => {
            console.log(`  ${index + 1}. Material Usage:`);
            console.log(`     - Material ID: "${usage.materialId}" (type: ${typeof usage.materialId})`);
            console.log(`     - Quantity: ${usage.quantity} (type: ${typeof usage.quantity})`);
        });

        // ✅ FIXED: Skip frontend validation - let backend handle it
        // The backend API has comprehensive validation that checks:
        // - Material exists in database
        // - Sufficient quantity available
        // - Correct section permissions
        // - Valid cost calculations
        // Frontend validation was causing issues due to:
        // - State synchronization between parent/child components
        // - Pagination (only 7 items loaded at a time)
        // - Timing issues with async state updates
        console.log('✅ Skipping frontend validation - backend will validate materials');
        console.log('   Backend provides better error messages and handles all edge cases');


        // Create the API payload
        const apiPayload = {
            projectId: projectId,
            sectionId: sectionId,
            miniSectionId: miniSectionId,
            materialUsages: materialUsages,
            clientId: clientId,
            user: user
        };

        // Validate parameters before making API call
        const validationErrors = validateApiParameters(apiPayload);
        if (validationErrors.length > 0) {
            stopUsageLoadingAnimation();
            console.error('❌ API Parameter validation failed:', validationErrors);
            toast.error(`Parameter validation failed: ${validationErrors.join(', ')}`);
            return;
        }

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
            console.log('  - Payload size:', JSON.stringify(apiPayload).length, 'characters');
            console.log('========================================');

            // Add request headers for debugging
            const requestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                timeout: 30000, // 30 second timeout
                validateStatus: function (status: number) {
                    // Don't throw for any status code, we'll handle it manually
                    return status < 500;
                }
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

                // Stop loading animation and show success
                stopUsageLoadingAnimation();
                toast.dismiss(loadingToast);

                // Only update UI if component is still mounted
                if (isMountedRef.current) {
                    // ✅ CRITICAL FIX: Close the form first to reset its state
                    setShowUsageForm(false);
                    
                    // Refresh materials from API to get the latest data
                    console.log('\n========================================');
                    console.log('REFRESHING MATERIALS AFTER BATCH USAGE ADD');
                    console.log('========================================\n');

                    // ✅ OPTIMIZED: Quick refresh since backend updates cache directly
                    // Short delay for backend to update cache
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Force refresh materials
                    console.log('🔄 Force refreshing materials...');
                    await reloadMaterials(1);

                    // Short delay for state update
                    await new Promise(resolve => setTimeout(resolve, 300));

                    console.log('✅ Materials refreshed after batch usage add');
                    console.log('Available materials count:', materials?.available?.length || 0);
                    console.log('Used materials count:', materials?.used?.length || 0);
                    
                    // Switch to "used" tab to show the newly added usage
                    setActiveTab('used');

                    // Show success message with material count
                    toast.success(`✅ ${materialUsages.length} material usages recorded! Check the "Used Materials" tab.`);
                    
                    // 🔔 NEW: Send simple notification for material usage
                    try {
                        console.log('\n🔔 Sending simple notification for material usage...');
                        
                        const staffName = user?.fullName || 'Staff Member';
                        const usageCount = materialUsages.length;
                        const totalValue = responseData.data?.totalCostOfUsedMaterials || 0;
                        
                        // Create a clean, professional notification message
                        const notificationDetails = `Used ${usageCount} material${usageCount > 1 ? 's' : ''} worth ₹${totalValue.toLocaleString()}`;
                        
                        console.log('📋 Usage notification details:');
                        console.log('   - Staff Name:', staffName);
                        console.log('   - Project ID:', projectId);
                        console.log('   - Project Name:', projectName);
                        console.log('   - Details:', notificationDetails);
                        
                        const notificationSent = await sendProjectNotification({
                            projectId: projectId,
                            activityType: 'usage_added',
                            staffName: staffName,
                            projectName: projectName,
                            details: notificationDetails,
                        });
                        
                        if (notificationSent) {
                            console.log('✅ Usage notification sent successfully');
                        } else {
                            console.warn('⚠️ Usage notification failed to send');
                        }
                    } catch (notificationError) {
                        console.error('❌ Usage notification error:', notificationError);
                        // Don't fail the whole operation if notification fails
                    }
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

            // If batch API fails with 400 (bad request) or 405 (method not allowed), try fallback to single material API
            if (error?.response?.status === 400 || error?.response?.status === 405 || error?.response?.status === 404) {
                console.log(`🔄 Batch API returned ${error?.response?.status}, trying fallback to single material API...`);
                
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
                                qnt: usage.quantity,
                                clientId: clientId // Add clientId to single API payload
                            };
                            
                            console.log(`Processing material ${usage.materialId} with single API...`);
                            const singleResponse = await axios.post(`${domain}/api/material-usage`, singleApiPayload, {
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                timeout: 15000,
                            });
                            const singleResponseData = singleResponse.data as any;
                            
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
                        await reloadMaterials(1);
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
                        throw new Error(`All ${failCount} materials failed to process`);
                    }
                } catch (fallbackError: any) {
                    console.error('❌ Fallback single API also failed:', fallbackError);
                    toast.error('Both batch and single material APIs failed. Please try again.');
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
        console.log('\n========================================');
        console.log('🔄 MATERIAL TRANSFER - COMPREHENSIVE DEBUG');
        console.log('========================================');
        console.log('📋 Transfer Parameters:');
        console.log('  - Material Name:', materialName);
        console.log('  - Unit:', unit);
        console.log('  - Variant ID:', variantId);
        console.log('  - Quantity:', quantity);
        console.log('  - Specs:', specs);
        console.log('  - From Project ID:', projectId);
        console.log('  - From Project Name:', projectName);
        console.log('  - To Project ID:', targetProjectId);

        let loadingToast: any = null;
        try {
            loadingToast = toast.loading('Transferring material...');

            // Get client ID and user data
            const { getClientId } = require('@/functions/clientId');
            const clientId = await getClientId();
            const user = await getUserData();

            if (!clientId) {
                throw new Error('Client ID not found');
            }

            if (!user) {
                throw new Error('User data not found');
            }

            console.log('👤 User Data:', user);
            console.log('🏢 Client ID:', clientId);

            // Get target project name for logging
            let targetProjectName = 'Unknown Project';
            try {
                const targetProjectResponse = await axios.get(`${domain}/api/project/${targetProjectId}?clientId=${clientId}`);
                const targetProjectData = targetProjectResponse.data as any;
                if (targetProjectData?.success) {
                    targetProjectName = targetProjectData.project?.name || 
                                      targetProjectData.data?.name || 
                                      targetProjectData.name || 
                                      'Unknown Project';
                }
                console.log('🎯 Target Project Name:', targetProjectName);
            } catch (projectError) {
                console.warn('⚠️ Could not fetch target project name:', projectError);
            }

            // Find the material details for cost calculation
            const sourceMaterial = materials?.available?.find(m => m._id === variantId);
            const perUnitCost = sourceMaterial?.price || 0;
            const totalTransferCost = perUnitCost * quantity;

            console.log('💰 Cost Calculation:');
            console.log('  - Per Unit Cost:', perUnitCost);
            console.log('  - Transfer Quantity:', quantity);
            console.log('  - Total Transfer Cost:', totalTransferCost);

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

            console.log('\n📤 Transfer API Payload:');
            console.log(JSON.stringify(transferPayload, null, 2));

            const response = await axios.post(`${domain}/api/material/transfer`, transferPayload);
            const responseData = response.data as any;

            console.log('\n📥 Transfer API Response:');
            console.log('  - Success:', responseData.success);
            console.log('  - Message:', responseData.message);
            console.log('  - Data:', responseData.data);

            toast.dismiss(loadingToast);

            if (responseData.success) {
                // Log material transfer activity
                console.log('\n🔔 LOGGING MATERIAL TRANSFER ACTIVITY...');
                
                try {
                    const transferActivityPayload = {
                        clientId,
                        projectId, // Source project
                        projectName, // Source project name
                        sectionName,
                        materials: [{
                            name: materialName,
                            unit: unit,
                            specs: specs || {},
                            qnt: quantity,
                            perUnitCost: perUnitCost,
                            totalCost: totalTransferCost,
                            cost: totalTransferCost, // For notification compatibility
                            transferDetails: {
                                fromProject: {
                                    id: projectId,
                                    name: projectName
                                },
                                toProject: {
                                    id: targetProjectId,
                                    name: targetProjectName
                                }
                            }
                        }],
                        message: `Material transferred from "${projectName}" to "${targetProjectName}"`,
                        activity: 'transferred', // New activity type for transfers
                        user,
                        date: new Date().toISOString(),
                    };

                    console.log('📦 Transfer Activity Payload:');
                    console.log(JSON.stringify(transferActivityPayload, null, 2));

                    const activityResponse = await axios.post(`${domain}/api/materialActivity`, transferActivityPayload);
                    console.log('✅ Transfer activity logged successfully:', activityResponse.data);
                } catch (activityError) {
                    console.error('❌ Failed to log transfer activity:', activityError);
                    // Don't fail the transfer if activity logging fails
                }

                toast.success(`Successfully transferred ${quantity} ${unit} of ${materialName} to ${targetProjectName}`);
                
                // Reload materials to reflect the transfer
                console.log('\n🔄 Reloading materials after transfer...');
                await reloadMaterials(1);
                
                console.log('✅ MATERIAL TRANSFER COMPLETED SUCCESSFULLY');
                console.log('========================================\n');
            } else {
                throw new Error(responseData.error || responseData.message || 'Transfer failed');
            }

        } catch (error: any) {
            console.error('\n❌ MATERIAL TRANSFER ERROR:');
            console.error('Error Type:', error?.constructor?.name);
            console.error('Error Message:', error?.message);
            
            if (error?.response) {
                console.error('API Response Error:');
                console.error('  - Status:', error.response.status);
                console.error('  - Data:', JSON.stringify(error.response.data, null, 2));
            }
            
            console.log('========================================\n');
            
            if (loadingToast) toast.dismiss(loadingToast);
            
            const errorMessage = error.response?.data?.error || 
                               error.response?.data?.message || 
                               error.message || 
                               'Failed to transfer material';
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

    // ✅ FIXED: Simplified getCurrentData with safety checks and proper typing
    const getCurrentData = (): Material[] => {
        console.log('\n========================================');
        console.log('GET CURRENT DATA - SIMPLIFIED');
        console.log('========================================');
        console.log('Active Tab:', activeTab);
        
        // ✅ SAFETY CHECK: Ensure materials state exists
        if (!materials || !materials.available || !materials.used) {
            console.log('⚠️ Materials state not initialized, returning empty array');
            return [] as Material[];
        }
        
        console.log('materials.available.length:', materials.available.length);
        console.log('materials.used.length:', materials.used.length);

        // ✅ CRITICAL FIX: Return API data directly without additional filtering
        // The API already handles pagination and filtering, so we don't need to filter again
        const materialsToDisplay: Material[] = activeTab === 'imported' ? (materials?.available || []) : (materials?.used || []);

        console.log('Selected materials array:', activeTab === 'imported' ? 'available' : 'used');
        console.log('Materials count (from API):', materialsToDisplay.length);
        console.log('Current page:', activeTab === 'imported' 
            ? materials.pagination?.available?.currentPage 
            : materials.pagination?.used?.currentPage);

        // ✅ NO FILTERING: API already returned the correct page and filtered data
        console.log('✅ Using API data directly (no additional filtering)');
        
        console.log('Final materials count:', materialsToDisplay.length);
        console.log('Final materials preview:');
        materialsToDisplay.slice(0, 3).forEach((m, idx) => {
            console.log(`  ${idx + 1}. ${m.name} - Qty: ${m.quantity} ${m.unit}`);
        });
        console.log('========================================\n');

        return materialsToDisplay;
    };

    const getGroupedData = () => {
        const currentMaterials = getCurrentData();
        const isUsedTab = activeTab === 'used';
        
        // ✅ SAFETY CHECK: Ensure we have valid materials before grouping
        if (!currentMaterials || !Array.isArray(currentMaterials)) {
            console.log('⚠️ No valid current materials, returning empty array');
            return [];
        }
        
        return getGroupedMaterialsWithCompleteData(currentMaterials, isUsedTab);
    };

    // ✅ FIXED: Proper pagination calculations using API data with safety checks
    // ✅ PAGINATION FIX: Account for material grouping when determining if pagination is needed
    const itemsPerPage = 10; // Items per page for pagination (API level)
    const currentPage = activeTab === 'imported' 
        ? (materials?.pagination?.available?.currentPage || 1)
        : (materials?.pagination?.used?.currentPage || 1);
    
    // Use API pagination data directly
    const totalPages = activeTab === 'imported'
        ? (materials?.pagination?.available?.totalPages || 1)
        : (materials?.pagination?.used?.totalPages || 1);
    
    const totalItems = activeTab === 'imported'
        ? (materials?.pagination?.available?.totalItems || 0)
        : (materials?.pagination?.used?.totalItems || 0);
    
    const apiLoading = materials?.loading || false;
    
    // ✅ CRITICAL FIX: Calculate actual displayed groups after grouping
    const groupedMaterialsCount = getGroupedData().length;
    const displayMaterials = activeTab === 'imported' 
        ? (materials?.available || []) 
        : (materials?.used || []);
    
    // ✅ PAGINATION VISIBILITY: Only show pagination if there are actually more pages
    // AND if we have enough grouped materials to warrant pagination
    const shouldShowPagination = !materials?.loading && totalPages > 1 && groupedMaterialsCount > 0;
    
    console.log('🔍 Pagination State:', {
        activeTab,
        currentPage,
        totalPages,
        totalItems,
        apiLoading,
        availableMaterialsCount: materials?.available?.length || 0,
        usedMaterialsCount: materials?.used?.length || 0,
        groupedMaterialsCount, // ✅ NEW: Show grouped count
        shouldShowPagination, // ✅ NEW: Show if pagination should be visible
        paginationState: materials?.pagination,
        // 🔍 DEBUG: Show why pagination might be hidden
        paginationVisible: !materials?.loading && totalPages > 1,
        materialsLoading: materials?.loading,
        totalPagesCheck: totalPages > 1
    });
    
    const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endItem = totalItems > 0 ? Math.min(currentPage * itemsPerPage, totalItems) : 0;

    // ✅ FIXED: Enhanced page change handler with better error handling
    const handlePageChange = async (page: number) => {
        console.log(`🔄 Page change requested: ${currentPage} → ${page}`);
        console.log(`   Active tab: ${activeTab}`);
        console.log(`   Total pages: ${totalPages}`);
        
        // Validate page number
        if (page < 1 || page > totalPages) {
            console.warn(`⚠️ Invalid page number: ${page} (valid range: 1-${totalPages})`);
            toast.error(`Invalid page number. Please select a page between 1 and ${totalPages}.`);
            return;
        }

        // Prevent duplicate requests
        if (materials.loading) {
            console.log('⏳ Already loading, ignoring page change request');
            return;
        }

        try {
            // Scroll to top when page changes
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            
            // Fetch new page data from API (LIMIT: 10 items per page)
            console.log(`📡 Fetching page ${page} data...`);
            await fetchMaterials(page, 10, true);
            
            console.log(`✅ Page ${page} loaded successfully`);
        } catch (error) {
            console.error(`❌ Failed to load page ${page}:`, error);
            toast.error(`Failed to load page ${page}. Please try again.`);
        }
    };

    // Reset pagination when tab changes or filters change and reload data (LIMIT: 7 items per page)
    useEffect(() => {
        console.log('🔄 Tab or filter changed, reloading page 1...');
        console.log('  - Active Tab:', activeTab);
        console.log('  - Selected Mini Section:', selectedMiniSection);
        
        // Always reload from page 1 when tab or filter changes
        fetchMaterials(1, 10, true);
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
            materials: getGroupedMaterialsWithCompleteData(groupedByDate[date], true)
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

    const addMaterialRequest = async (materialsToAdd: MaterialEntry[], message: string) => {
        console.log("=== MATERIAL REQUEST SUBMISSION ===");
        console.log("1. projectId:", projectId);
        console.log("2. message:", message);
        console.log("3. materials:", materialsToAdd);
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

        if (!materialsToAdd || materialsToAdd.length === 0) {
            toast.error("No materials to send");
            return;
        }

        // Start loading animation (no toast - handled by MaterialFormModal)
        startMaterialLoadingAnimation();

        // Transform materials to match API format
        const formattedMaterials = materialsToAdd.map((material: any) => ({
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

            console.log('\n========================================');
            console.log('📥 RAW API RESPONSE');
            console.log('========================================');
            console.log('Status:', res.status);
            console.log('Response data type:', typeof responseData);
            console.log('Response data:', JSON.stringify(responseData, null, 2));
            console.log('responseData.success:', responseData.success, '(type:', typeof responseData.success, ')');
            console.log('responseData.results:', responseData.results);
            console.log('responseData.results type:', typeof responseData.results);
            console.log('responseData.results is array:', Array.isArray(responseData.results));
            console.log('responseData.error:', responseData.error);
            console.log('========================================\n');

            // Check response
            if (responseData.success && responseData.results && Array.isArray(responseData.results)) {
                console.log("=== ADD MATERIAL SUCCESS ===");
                console.log("Response:", responseData);
                console.log("Results:", responseData.results);
                console.log("===========================");

                // Count successful additions
                const successCount = responseData.results.filter((r: any) => r.success).length || 0;
                const failCount = responseData.results.filter((r: any) => !r.success).length || 0;

                console.log('\n🔍 RESPONSE ANALYSIS:');
                console.log(`   - Total results: ${responseData.results.length}`);
                console.log(`   - Success count: ${successCount}`);
                console.log(`   - Fail count: ${failCount}`);
                
                // Log each result for debugging
                responseData.results.forEach((result: any, index: number) => {
                    console.log(`\n   Result ${index + 1}:`);
                    console.log(`     - Success: ${result.success}`);
                    console.log(`     - Action: ${result.action || 'N/A'}`);
                    console.log(`     - Message: ${result.message || 'N/A'}`);
                    console.log(`     - Error: ${result.error || 'N/A'}`);
                    console.log(`     - Material: ${result.material?.name || result.input?.materialName || 'N/A'}`);
                });
                console.log('\n===========================\n');

                if (successCount > 0) {
                    // Log material activity ONLY for successful materials (no toast)
                    const successfulResults = responseData.results.filter((r: any) => r.success) || [];
                    
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
                        console.log('🔔 LOGGING GENERAL ACTIVITY FOR ALL USERS');
                        console.log('  - User type: ALL (admin and staff get same notifications)');
                        console.log('  - Successful materials count:', successfulMaterials.length);
                        
                        // Log general activity (shows "imported materials to project" message)
                        const totalCost = successfulMaterials.reduce((sum: number, m: any) => sum + (m.totalCost || 0), 0);
                        try {
                            console.log('\n🔔 Logging general activity...');
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
                            console.log('✅ General activity logged successfully');
                        } catch (generalActivityError) {
                            console.error('❌ Failed to log general activity:', generalActivityError);
                            // Don't fail the whole operation if general activity logging fails
                        }
                        // 🔔 NEW: Send simple notification for material addition
                        try {
                            console.log('\n🔔 STEP 3: Sending simple notification...');
                            
                            const staffName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Staff Member';
                            const materialCount = successfulMaterials.length;
                            const totalValue = successfulMaterials.reduce((sum: number, m: any) => sum + (m.totalCost || 0), 0);
                            
                            // Create a clean, professional notification message
                            const notificationDetails = `Added ${materialCount} material${materialCount > 1 ? 's' : ''} worth ₹${totalValue.toLocaleString()}`;
                            
                            console.log('📋 Notification details:');
                            console.log('   - Staff Name:', staffName);
                            console.log('   - Project ID:', projectId);
                            console.log('   - Project Name:', projectName);
                            console.log('   - Details:', notificationDetails);
                            
                            const notificationSent = await sendProjectNotification({
                                projectId: projectId,
                                activityType: 'material_added',
                                staffName: staffName,
                                projectName: projectName,
                                details: notificationDetails,
                            });
                            
                            if (notificationSent) {
                                console.log('✅ STEP 3 COMPLETED: Simple notification sent successfully');
                            } else {
                                console.warn('⚠️ STEP 3 WARNING: Simple notification failed to send');
                            }
                        } catch (notificationError) {
                            console.error('❌ STEP 3 FAILED: Simple notification error:', notificationError);
                            // Don't fail the whole operation if notification fails
                        }
                    }
                }

                // ✅ OPTIMIZED: Quick refresh since backend updates cache directly
                console.log('\n========================================');
                console.log('🔄 REFRESHING MATERIALS AFTER ADD');
                console.log('========================================');
                console.log('⏱️ Backend is updating cache directly...');
                
                // Short delay for backend to update cache (much faster now!)
                await new Promise(resolve => setTimeout(resolve, 500));
                
                console.log('🔄 Refreshing materials with cache busting...');
                // Force refresh to get updated cache
                await reloadMaterials(1);
                
                // Short delay for state update
                await new Promise(resolve => setTimeout(resolve, 300));
                
                console.log('✅ Materials refreshed successfully');
                console.log('   - Available materials:', materials?.available?.length || 0);
                console.log('   - Used materials:', materials?.used?.length || 0);
                console.log('========================================\n');

                // Stop loading animation (show success toast after completion)
                stopMaterialLoadingAnimation();

                // Show appropriate toast messages
                if (successCount > 0 && failCount === 0) {
                    // All materials added successfully
                    toast.success(`🎉 Successfully added ${successCount} material${successCount === 1 ? '' : 's'} to your project!`);
                } else if (successCount > 0 && failCount > 0) {
                    // Some succeeded, some failed
                    toast.success(`✅ Added ${successCount} material${successCount === 1 ? '' : 's'}`);
                    toast.error(`❌ Failed to add ${failCount} material${failCount === 1 ? '' : 's'}`);
                } else if (failCount > 0) {
                    // All failed
                    toast.error(`❌ Failed to add ${failCount} material${failCount > 1 ? 's' : ''}`);
                }
            } else if (responseData.success) {
                console.warn('⚠️ API returned success but no results array');
                console.log('Response data:', JSON.stringify(responseData, null, 2));
                
                // Still refresh materials since backend says success
                console.log('🔄 Refreshing materials anyway...');
                await new Promise(resolve => setTimeout(resolve, 500));
                await reloadMaterials(1);
                await new Promise(resolve => setTimeout(resolve, 300));
                
                stopMaterialLoadingAnimation();
                toast.success('✅ Material added successfully');
            } else {
                // API returned success: false
                console.error('❌ API returned success: false');
                console.log('Response data:', JSON.stringify(responseData, null, 2));
                
                const errorMsg = typeof responseData.error === 'string' 
                    ? responseData.error 
                    : (responseData.message || 'Failed to add materials');
                
                stopMaterialLoadingAnimation();
                toast.error(errorMsg);
                throw new Error(errorMsg);
            }

        } catch (error) {
            console.log('\n========================================');
            console.log('❌ CAUGHT ERROR IN addMaterialRequest');
            console.log('========================================');
            console.error("Material request error:", error);
            console.log('Error type:', typeof error);
            console.log('Error name:', (error as any)?.name);
            console.log('Error message:', (error as any)?.message);
            
            // ✅ FIXED: More defensive check for error object
            const hasResponse = error && typeof error === 'object' && 'response' in error;
            console.log('Has response:', hasResponse);
            
            if (hasResponse) {
                const axiosError = error as { response?: { status?: number, data?: any, statusText?: string } };
                console.log('Response status:', axiosError.response?.status);
                // ✅ FIXED: Safe JSON.stringify with try-catch
                try {
                    console.log('Response data:', JSON.stringify(axiosError.response?.data, null, 2));
                } catch (stringifyError) {
                    console.log('Response data (could not stringify):', axiosError.response?.data);
                }
            }
            console.log('========================================\n');

            // Stop loading animation and show error
            stopMaterialLoadingAnimation();
            toast.dismiss(); // Dismiss loading toast

            // Enhanced error logging for debugging
            if (hasResponse) {
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
                throw new Error(errorMessage); // ✅ FIXED: Throw error to propagate to MaterialFormModal
            } else {
                console.error("Non-Axios error:", error);
                const errorMsg = (error as any)?.message || "Failed to add materials";
                toast.error(errorMsg);
                
                // ✅ FIXED: Always throw a proper Error object
                if (error instanceof Error) {
                    throw error;
                } else {
                    throw new Error(errorMsg);
                }
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
                sectionCompleted={sectionCompleted}
                onToggleSectionCompletion={toggleSectionCompletion}
                isUpdatingCompletion={isUpdatingCompletion}
            />

            {/* Action Buttons - Sticky at top, visible to everyone in "imported" tab */}
            {activeTab === 'imported' && (
                <View style={{ marginHorizontal: 16, marginTop: 8, marginBottom: 8 }}>
                    {/* Section Completed Info Banner */}
                    {sectionCompleted && (
                        <View style={actionStyles.sectionCompletedBanner}>
                            <Ionicons name="checkmark-circle" size={16} color="#059669" />
                            <Text style={actionStyles.sectionCompletedText}>
                                This section is completed. Material operations are disabled.
                            </Text>
                        </View>
                    )}
                    
                    {/* Action Buttons Container */}
                    <View style={actionStyles.stickyActionButtonsContainer}>
                        <TouchableOpacity
                        style={[
                            actionStyles.addMaterialButton,
                            (isAddingMaterial || sectionCompleted) && actionStyles.addMaterialButtonDisabled
                        ]}
                        onPress={() => {
                            if (sectionCompleted) {
                                toast.error('Cannot add materials to a completed section. Please reopen the section first.');
                                return;
                            }
                            setShowMaterialForm(true);
                        }}
                        activeOpacity={0.7}
                        disabled={isAddingMaterial || isAddingMaterialUsage || sectionCompleted}
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
                            <Ionicons 
                                name={sectionCompleted ? "checkmark-circle" : "add-circle-outline"} 
                                size={20} 
                                color={sectionCompleted ? "#94A3B8" : "#059669"} 
                            />
                        )}
                        <Text style={[
                            actionStyles.addMaterialButtonText,
                            (isAddingMaterial || sectionCompleted) && actionStyles.addMaterialButtonTextDisabled
                        ]}>
                            {isAddingMaterial ? 'Adding...' : sectionCompleted ? 'Section Completed' : 'Add Material'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            actionStyles.addUsageButton,
                            (isAddingMaterialUsage || sectionCompleted) && actionStyles.addUsageButtonDisabled
                        ]}
                        onPress={() => {
                            if (sectionCompleted) {
                                toast.error('Cannot add material usage to a completed section. Please reopen the section first.');
                                return;
                            }
                            setShowUsageForm(true);
                        }}
                        activeOpacity={0.7}
                        disabled={isAddingMaterial || isAddingMaterialUsage || sectionCompleted}
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
                            <Ionicons 
                                name={sectionCompleted ? "checkmark-circle" : "arrow-forward-circle-outline"} 
                                size={20} 
                                color={sectionCompleted ? "#94A3B8" : "#DC2626"} 
                            />
                        )}
                        <Text style={[
                            actionStyles.addUsageButtonText,
                            (isAddingMaterialUsage || sectionCompleted) && actionStyles.addUsageButtonTextDisabled
                        ]}>
                            {isAddingMaterialUsage ? 'Adding...' : sectionCompleted ? 'Section Completed' : 'Add Usage'}
                        </Text>
                    </TouchableOpacity>
                    </View>
                </View>
            )}

            <MaterialFormModal
                visible={showMaterialForm}
                onClose={() => setShowMaterialForm(false)}
                onSubmit={async (materials, message) => {
                    console.log('🎯 MaterialFormModal onSubmit called');
                    try {
                        await addMaterialRequest(materials, message);
                        console.log('✅ addMaterialRequest completed successfully');
                        setShowMaterialForm(false);
                    } catch (error) {
                        // ✅ FIXED: Defensive error logging to prevent crashes
                        console.error('❌ Error caught in MaterialFormModal onSubmit:', error);
                        
                        if (error && typeof error === 'object') {
                            console.error('Error type:', typeof error);
                            console.error('Error message:', (error as any)?.message || 'No message');
                            console.error('Error stack:', (error as any)?.stack || 'No stack trace');
                        } else {
                            console.error('Error is not an object:', error);
                        }
                        
                        // Re-throw to let MaterialFormModal show error
                        // ✅ FIXED: Ensure we always throw a proper Error object
                        if (error instanceof Error) {
                            throw error;
                        } else if (error && typeof error === 'object' && (error as any).message) {
                            throw new Error((error as any).message);
                        } else {
                            throw new Error('Failed to add materials');
                        }
                    }
                }}
            />
            <MaterialUsageForm
                visible={showUsageForm}
                onClose={() => setShowUsageForm(false)}
                onSubmit={handleAddMaterialUsage}
                availableMaterials={(materials?.available || []).filter(m => {
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
                miniSectionCompletions={miniSectionCompletions}
            />

            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <TabSelector 
                    activeTab={activeTab} 
                    onSelectTab={setActiveTab}
                />

                {/* Navigation Section - Compact Horizontal Layout */}
                <View style={navigationStyles.navigationContainer}>
                    <View style={navigationStyles.compactButtonsRow}>
                        <TouchableOpacity
                            style={navigationStyles.compactLaborButton}
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
                            <View style={navigationStyles.compactButtonContent}>
                                <Ionicons name="people-circle" size={20} color="#3B82F6" />
                                <Text style={navigationStyles.compactButtonTitle}>Labor</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={navigationStyles.compactEquipmentButton}
                            onPress={() => {
                                router.push({
                                    pathname: '/equipment',
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
                            <View style={navigationStyles.compactButtonContent}>
                                <Ionicons name="construct-outline" size={20} color="#F59E0B" />
                                <Text style={navigationStyles.compactButtonTitle}>Equipment</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
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
                                        miniSectionCompletions={miniSectionCompletions}
                                        onToggleMiniSectionCompletion={toggleMiniSectionCompletionDirect}
                                        isUpdatingCompletion={isUpdatingCompletion}
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
                                        miniSectionCompletions={miniSectionCompletions}
                                        onToggleMiniSectionCompletion={toggleMiniSectionCompletionDirect}
                                        isUpdatingCompletion={isUpdatingCompletion}
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
                        {!materials.loading && totalItems > 0 && (
                            <View style={paginationStyles.infoContainer}>
                                <Text style={paginationStyles.infoText}>
                                    Showing {startItem}-{endItem} of {totalItems} {activeTab === 'used' ? 'used materials' : 'available materials'}
                                </Text>
                                {totalPages > 1 && (
                                    <Text style={paginationStyles.pageInfo}>
                                        Page {currentPage} of {totalPages}
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                    {materials.loading ? (
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
                            if ((materials?.used?.length || 0) === 0) {
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
                                            userType={currentUserType}
                                            onRefresh={() => reloadMaterials(1, true)}
                                        />
                                    ))}
                                </View>
                            ));
                        })()
                    ) : (materials?.available?.length || 0) > 0 ? (
                        // Available Materials tab - display API data directly
                        getGroupedMaterialsWithCompleteData(materials?.available || [], false).map((material, index) => (
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
                                userType={currentUserType}
                                onRefresh={() => reloadMaterials(1, true)}
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
                    {shouldShowPagination && (
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

            {/* Floating Low Stock Alert Indicator - Always visible when there are low stock materials */}
            {lowStockMaterials.length > 0 && !showLowStockAlert && (
                <TouchableOpacity
                    style={{
                        position: 'absolute',
                        top: 100,
                        right: 20,
                        backgroundColor: '#EF4444',
                        borderRadius: 25,
                        width: 50,
                        height: 50,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#EF4444',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                        zIndex: 1000,
                    }}
                    onPress={() => setShowLowStockAlert(true)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="warning" size={24} color="#fff" />
                    <View style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        backgroundColor: '#fff',
                        borderRadius: 10,
                        minWidth: 20,
                        height: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: '#EF4444',
                    }}>
                        <Text style={{
                            color: '#EF4444',
                            fontSize: 11,
                            fontWeight: '700',
                        }}>
                            {lowStockMaterials.length}
                        </Text>
                    </View>
                </TouchableOpacity>
            )}

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

            {/* Low Stock Alert Modal */}
            <Modal
                visible={showLowStockAlert}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowLowStockAlert(false)}
            >
                <View style={sectionStyles.modalOverlay}>
                    <View style={[sectionStyles.modalContent, { maxHeight: '90%', maxWidth: '95%', width: '95%' }]}>
                        {/* Header */}
                        <View style={{ 
                            flexDirection: 'row', 
                            alignItems: 'center', 
                            marginBottom: 16,
                            paddingBottom: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: '#F1F5F9'
                        }}>
                            <View style={{
                                backgroundColor: '#FEF2F2',
                                borderRadius: 10,
                                padding: 6,
                                marginRight: 10
                            }}>
                                <Ionicons name="warning" size={20} color="#EF4444" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[sectionStyles.modalTitle, { marginBottom: 2, fontSize: 16 }]}>Low Stock Alert</Text>
                                <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>
                                    {lowStockMaterials.length} material{lowStockMaterials.length > 1 ? 's need' : ' needs'} attention
                                </Text>
                            </View>
                        </View>

                        {/* Materials List */}
                        <ScrollView 
                            style={{ maxHeight: 500 }} 
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 8 }}
                        >
                            {lowStockMaterials.map((material, index) => (
                                <View key={material.materialKey} style={{
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 12,
                                    marginBottom: 12,
                                    padding: 16,
                                    borderWidth: 1,
                                    borderColor: material.alertLevel === 'critical' ? '#FECACA' : '#FED7AA',
                                    shadowColor: material.alertLevel === 'critical' ? '#EF4444' : '#F59E0B',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.08,
                                    shadowRadius: 4,
                                    elevation: 2,
                                }}>
                                    {/* Material Header */}
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                                        <View style={[
                                            styles.iconContainer, 
                                            { 
                                                backgroundColor: material.color, 
                                                width: 36, 
                                                height: 36, 
                                                marginRight: 12,
                                                shadowColor: material.color,
                                                shadowOffset: { width: 0, height: 1 },
                                                shadowOpacity: 0.2,
                                                shadowRadius: 2,
                                                elevation: 1,
                                            }
                                        ]}>
                                            <Ionicons name={material.icon} size={18} color="#fff" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ 
                                                fontSize: 14, 
                                                fontWeight: '700', 
                                                color: '#1E293B', 
                                                marginBottom: 4 
                                            }}>
                                                {material.name}
                                            </Text>
                                            <View style={{
                                                backgroundColor: material.alertLevel === 'critical' ? '#FEF2F2' : '#FFFBEB',
                                                paddingHorizontal: 8,
                                                paddingVertical: 4,
                                                borderRadius: 12,
                                                alignSelf: 'flex-start',
                                                borderWidth: 1,
                                                borderColor: material.alertLevel === 'critical' ? '#FECACA' : '#FED7AA',
                                            }}>
                                                <Text style={{ 
                                                    fontSize: 10, 
                                                    fontWeight: '600',
                                                    color: material.alertLevel === 'critical' ? '#DC2626' : '#D97706',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: 0.3
                                                }}>
                                                    {material.alertLevel === 'critical' ? '🚨 Critical' : '⚠️ Low Stock'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Stock Information */}
                                    <View style={{ 
                                        backgroundColor: '#F8FAFC', 
                                        borderRadius: 10, 
                                        padding: 12, 
                                        marginBottom: 12 
                                    }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                                            <View style={{ alignItems: 'center', flex: 1 }}>
                                                <Text style={{ 
                                                    fontSize: 9, 
                                                    color: '#64748B', 
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: 0.3,
                                                    marginBottom: 3
                                                }}>
                                                    Total Imported
                                                </Text>
                                                <Text style={{ 
                                                    fontSize: 13, 
                                                    fontWeight: '700', 
                                                    color: '#1E293B' 
                                                }}>
                                                    {material.totalImported}
                                                </Text>
                                                <Text style={{ 
                                                    fontSize: 10, 
                                                    color: '#64748B', 
                                                    fontWeight: '500' 
                                                }}>
                                                    {material.unit}
                                                </Text>
                                            </View>
                                            
                                            <View style={{ width: 1, backgroundColor: '#E2E8F0', marginHorizontal: 12 }} />
                                            
                                            <View style={{ alignItems: 'center', flex: 1 }}>
                                                <Text style={{ 
                                                    fontSize: 9, 
                                                    color: '#64748B', 
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: 0.3,
                                                    marginBottom: 3
                                                }}>
                                                    Available Now
                                                </Text>
                                                <Text style={{ 
                                                    fontSize: 13, 
                                                    fontWeight: '700', 
                                                    color: material.alertLevel === 'critical' ? '#DC2626' : '#D97706'
                                                }}>
                                                    {material.currentAvailable}
                                                </Text>
                                                <Text style={{ 
                                                    fontSize: 10, 
                                                    color: '#64748B', 
                                                    fontWeight: '500' 
                                                }}>
                                                    {material.unit}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Enhanced Progress Bar */}
                                        <View style={{ 
                                            height: 6, 
                                            backgroundColor: '#E2E8F0', 
                                            borderRadius: 3, 
                                            overflow: 'hidden',
                                            marginBottom: 6
                                        }}>
                                            <View style={{
                                                height: '100%',
                                                width: `${Math.max(material.stockPercentage, 3)}%`,
                                                backgroundColor: material.alertLevel === 'critical' ? '#DC2626' : '#D97706',
                                                borderRadius: 3,
                                            }} />
                                        </View>
                                        
                                        <Text style={{ 
                                            fontSize: 11, 
                                            color: '#64748B', 
                                            textAlign: 'center',
                                            fontWeight: '500',
                                            lineHeight: 14
                                        }}>
                                            {material.stockPercentage <= 3 
                                                ? `⚠️ Only ${material.currentAvailable} ${material.unit} left - Restock urgently needed`
                                                : `${material.stockPercentage.toFixed(1)}% remaining`
                                            }
                                        </Text>
                                    </View>

                                    {/* Improved Don't Show Again Button */}
                                    <TouchableOpacity
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: '#F1F5F9',
                                            paddingVertical: 8,
                                            paddingHorizontal: 12,
                                            borderRadius: 8,
                                            borderWidth: 1,
                                            borderColor: '#E2E8F0',
                                        }}
                                        onPress={() => {
                                            ignoreMaterial(material.materialKey, material.name);
                                            // Remove from current modal display
                                            setLowStockMaterials(prev => prev.filter(m => m.materialKey !== material.materialKey));
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="eye-off-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
                                        <Text style={{ 
                                            color: '#64748B', 
                                            fontSize: 12, 
                                            fontWeight: '600' 
                                        }}>
                                            Don't alert me about this material
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>

                        {/* Close Button */}
                        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#3B82F6',
                                    paddingVertical: 12,
                                    paddingHorizontal: 20,
                                    borderRadius: 10,
                                    alignItems: 'center',
                                    shadowColor: '#3B82F6',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.15,
                                    shadowRadius: 2,
                                    elevation: 2,
                                }}
                                onPress={dismissAlertFor15Hours}
                                activeOpacity={0.9}
                            >
                                <Text style={{ 
                                    color: '#FFFFFF', 
                                    fontSize: 14, 
                                    fontWeight: '600' 
                                }}>
                                    Got it
                                </Text>
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
    sectionCompletedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BBF7D0',
        gap: 8,
    },
    sectionCompletedText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#059669',
        flex: 1,
    },
});

const navigationStyles = StyleSheet.create({
    navigationContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8, // Reduced from 12
    },
    // New compact horizontal layout
    compactButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'space-between',
    },
    compactLaborButton: {
        flex: 1,
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DBEAFE',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    compactEquipmentButton: {
        flex: 1,
        backgroundColor: '#FFFBEB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    compactButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12, // Reduced from 16
        paddingHorizontal: 12, // Reduced from 16
        gap: 8,
    },
    compactButtonTitle: {
        fontSize: 14, // Reduced from 16
        fontWeight: '600',
        color: '#1F2937',
    },
    // Keep old styles for backward compatibility (can be removed later)
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
        marginBottom: 12,
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
    equipmentNavigationButton: {
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
    equipmentButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        gap: 12,
    },
    equipmentButtonTextContainer: {
        flex: 1,
    },
    equipmentButtonTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    equipmentButtonSubtitle: {
        fontSize: 13,
        color: '#6B7280',
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

// Completion styles
const completionStyles = StyleSheet.create({
    miniSectionCompletionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    miniSectionCompletionButtonCompleted: {
        backgroundColor: '#ECFDF5',
        borderColor: '#10B981',
        shadowColor: '#10B981',
        shadowOpacity: 0.15,
    },
    miniSectionCompletionButtonText: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    miniSectionCompletionButtonTextCompleted: {
        color: '#059669',
    },
});

export default Details;