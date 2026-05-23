import Header from '@/components/details/Header';
import MaterialCardEnhanced from '@/components/details/MaterialCardEnhanced';
import MaterialFormModal from '@/components/details/MaterialFormModel';
import MaterialUsageForm from '@/components/details/MaterialUsageForm';
import SectionManager from '@/components/details/SectionManager';
import TabSelector from '@/components/details/TabSelector';
import { predefinedSections } from '@/data/details';
import { getSection } from '@/functions/details';
import { getClientId } from '@/functions/clientId';
import { styles } from '@/style/details';
import { Material, MaterialEntry, Section } from '@/types/details';
import { logSectionCompleted, logSectionReopened } from '@/utils/activityLogger';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, FlatList, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { useSimpleNotifications } from '@/hooks/useSimpleNotifications';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/utils/axiosConfig';
import { safeJsonParse, safeDivide, safeFirst } from '@/utils/helpers';

const SwipeableMiniSection = ({ 
    section, 
    selectedMiniSection, 
    miniSectionCompletions, 
    miniSectionLoadingStates, 
    onSectionSelect, 
    onToggleCompletion, 
    onDelete 
}: {
    section: Section;
    selectedMiniSection: string | null;
    miniSectionCompletions: {[key: string]: boolean};
    miniSectionLoadingStates: {[key: string]: boolean};
    onSectionSelect: (sectionId: string) => void;
    onToggleCompletion: (sectionId: string, sectionName: string) => void;
    onDelete: (sectionId: string, sectionName: string) => void;
}) => {
    const translateX = useRef(new Animated.Value(0)).current;

    const handleGestureEvent = Animated.event(
        [{ nativeEvent: { translationX: translateX } }],
        { useNativeDriver: false }
    );

    const handleStateChange = (event: any) => {
        const { state, translationX } = event.nativeEvent;
        
        if (state === State.END) {
            if (translationX < -100) {
                // Swipe threshold reached - trigger delete
                onDelete(section._id, section.name);
                // Reset position
                Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: false,
                }).start();
            } else {
                // Reset position
                Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: false,
                }).start();
            }
        }
    };

    return (
        <View style={{ marginBottom: 12, position: 'relative' }}>
            <View
                style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: 100,
                    backgroundColor: '#EF4444',
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
                <Text style={{
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: '600',
                    marginTop: 4,
                }}>
                    Delete
                </Text>
            </View>

            {/* Swipeable Content */}
            <PanGestureHandler
                onGestureEvent={handleGestureEvent}
                onHandlerStateChange={handleStateChange}
                activeOffsetX={[-10, 10]}
            >
                <Animated.View
                    style={{
                        transform: [{ translateX }],
                        backgroundColor: '#FFFFFF',
                        borderRadius: 12,
                    }}
                >
                    <TouchableOpacity
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 20,
                            paddingVertical: 18,
                            backgroundColor: selectedMiniSection === section._id ? '#EFF6FF' : '#FFFFFF',
                            borderRadius: 12,
                            borderWidth: selectedMiniSection === section._id ? 2 : 1,
                            borderColor: selectedMiniSection === section._id ? '#3B82F6' : '#E2E8F0',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.05,
                            shadowRadius: 3,
                            elevation: 2,
                        }}
                        onPress={() => onSectionSelect(section._id)}
                        activeOpacity={0.7}
                    >
                        {/* Completion Status Icon */}
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                onToggleCompletion(section._id, section.name);
                            }}
                            disabled={miniSectionLoadingStates[section._id]}
                            activeOpacity={0.7}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: miniSectionCompletions[section._id] ? '#10B981' : '#F3F4F6',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 16,
                            }}
                        >
                            <Ionicons 
                                name={
                                    miniSectionCompletions[section._id] 
                                        ? "checkmark" 
                                        : "ellipse-outline"
                                } 
                                size={20}
                                color={
                                    miniSectionLoadingStates[section._id]
                                        ? "#94A3B8"
                                        : miniSectionCompletions[section._id]
                                            ? "#FFFFFF"
                                            : "#6B7280"
                                } 
                            />
                        </TouchableOpacity>
                        
                        {/* Section Info */}
                        <View style={{ flex: 1 }}>
                            <Text 
                                style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: selectedMiniSection === section._id ? '#3B82F6' : '#374151',
                                    marginBottom: 4,
                                }}
                                numberOfLines={1}
                            >
                                {section.name}
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                color: '#6B7280',
                            }}>
                                {miniSectionCompletions[section._id] ? 'Completed' : 'In Progress'}
                            </Text>
                        </View>
                        
                        {/* Selection Indicator */}
                        {selectedMiniSection === section._id && (
                            <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </PanGestureHandler>
        </View>
    );
};

const Details = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { user, clientId } = useAuth();
    const { sendProjectNotification } = useSimpleNotifications();
    const projectId = params.projectId as string;
    const projectName = params.projectName as string;
    const sectionId = params.sectionId as string;
    const sectionName = params.sectionName as string;
    
    // 🔍 DEBUG: Log params on component mount
    console.log('\n🚀 ========== DETAILS.TSX COMPONENT MOUNTED ==========');
    console.log('   - All params:', params);
    console.log('   - projectId:', projectId);
    console.log('   - projectName:', projectName);
    console.log('   - sectionId:', sectionId);
    console.log('   - sectionName:', sectionName);
    console.log('   - sectionId type:', typeof sectionId);
    console.log('   - sectionId length:', sectionId?.length);
    console.log('   - sectionId is valid MongoDB ID?', sectionId?.length === 24);
    console.log('🚀 ========== END COMPONENT MOUNT ==========\n');
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
    
    // Simple dropdown state - now using modal instead of dropdown
    const [showSectionModal, setShowSectionModal] = useState(false);

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
    const [showCompletionConfirmModal, setShowCompletionConfirmModal] = useState(false);
    
    // Ref to track last completion toggle time per mini-section (for debouncing)
    const lastToggleTimesRef = useRef<{[key: string]: number}>({});
    const DEBOUNCE_DELAY = 500; // 500ms debounce
    
    // Track loading state per mini-section
    const [miniSectionLoadingStates, setMiniSectionLoadingStates] = useState<{[key: string]: boolean}>({});

    // Low stock alert system
    const [lowStockThreshold, setLowStockThreshold] = useState(10); // Default 10% threshold
    const [ignoredMaterials, setIgnoredMaterials] = useState<string[]>([]);
    const [lowStockMaterials, setLowStockMaterials] = useState<any[]>([]);
    const [showLowStockAlert, setShowLowStockAlert] = useState(false);
    const [alertDismissedAt, setAlertDismissedAt] = useState<number | null>(null);

    // Track section completion status for button disabling
    useEffect(() => {
        // Buttons are disabled when section is completed
        // No logging needed - just tracking state
    }, [sectionCompleted]);

    // Reload mini-section completion status when mini-sections change
    useEffect(() => {
        if (miniSections.length > 0 && isMountedRef.current) {
            // Clear any existing timeout
            if (completionLoadTimeoutRef.current) {
                clearTimeout(completionLoadTimeoutRef.current);
            }
            
            // Small delay to ensure mini-sections are properly set
            completionLoadTimeoutRef.current = setTimeout(() => {
                if (isMountedRef.current) {
                    loadMiniSectionCompletionStatus();
                }
            }, 200);
        }

        // Cleanup function for this effect
        return () => {
            if (completionLoadTimeoutRef.current) {
                clearTimeout(completionLoadTimeoutRef.current);
                completionLoadTimeoutRef.current = null;
            }
        };
    }, [miniSections]);

    const cardAnimations = useRef<Animated.Value[]>([]).current;
    const scrollViewRef = useRef<ScrollView>(null);
    const isMountedRef = useRef(true);
    const isLoadingRef = useRef(false);
    
    // Ref to track completion load timeout for cleanup
    const completionLoadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
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
                const userData = safeJsonParse(userDetailsString, {}) as any;

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
            return;
        }

        try {
            const clientId = await getClientId();
            if (!clientId) {
                throw new Error('Client ID not available');
            }

            console.log('🔄 Fetching materials - Page:', page, 'Force Refresh:', forceRefresh);

            setMaterials(prev => ({ ...prev, loading: true, error: null }));

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

            console.log('📋 Base params:', baseParams);

            // Add section filter only for used materials tab
            const availableParams = { ...baseParams };
            
            // ✅ CRITICAL FIX: Validate miniSectionId before adding to params
            // Filter out special IDs like 'all-sections', 'default-section', etc.
            const isValidMiniSectionId = selectedMiniSection && 
                                        selectedMiniSection !== 'all-sections' && 
                                        selectedMiniSection !== 'default-section' &&
                                        isValidMongoId(selectedMiniSection);
            
            console.log('🔍 Mini-section validation:', {
                selectedMiniSection,
                isValidMiniSectionId,
                isMongoId: selectedMiniSection ? isValidMongoId(selectedMiniSection) : false
            });
            
            // ✅ Compute ALL aliases for this section
            const sectionAliases = [...new Set([
                sectionId,
                ...miniSections.map(s => s.mainSectionDetails?.sectionId),
                ...miniSections.map(s => (s as any).sectionId)
            ])].filter(id => id && String(id).length === 24);

            const usedParams = {
                ...baseParams,
                // ✅ Fetch for ALL section aliases to guarantee we don't miss materials saved under an old/different alias!
                sectionId: sectionAliases.join(','),
                // ✅ Add mini-section filter ONLY if it's a valid MongoDB ObjectId
                ...(isValidMiniSectionId ? {
                    miniSectionId: selectedMiniSection
                } : {})
            };

            console.log('📦 Available params:', availableParams);
            console.log('🔧 Used params:', usedParams);

            // Import domain for fetch API calls
            const { domain } = await import('@/lib/domain');
            const { getAuthHeaders } = await import('@/utils/axiosConfig');

            // Build query strings manually for better control
            const buildQueryString = (params: any) => {
                return Object.entries(params)
                    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
                    .join('&');
            };

            const availableQueryString = buildQueryString(availableParams);
            const usedQueryString = buildQueryString(usedParams);

            console.log('🌐 Available URL:', `${domain}/api/material?${availableQueryString}`);
            console.log('🌐 Used URL:', `${domain}/api/material-usage?${usedQueryString}`);

            // Fetch both available and used materials in parallel using fetch API
            const [availableResponse, usedResponse] = await Promise.all([
                fetch(`${domain}/api/material?${availableQueryString}`, {
                    method: 'GET',
                    headers: {
                        ...getAuthHeaders(),
                    },
                }),
                fetch(`${domain}/api/material-usage?${usedQueryString}`, {
                    method: 'GET',
                    headers: {
                        ...getAuthHeaders(),
                    },
                })
            ]);

            console.log('✅ Available response status:', availableResponse.status);
            console.log('✅ Used response status:', usedResponse.status);

            // Check if responses are OK
            if (!availableResponse.ok) {
                throw new Error(`Available materials API failed: ${availableResponse.status}`);
            }
            if (!usedResponse.ok) {
                throw new Error(`Used materials API failed: ${usedResponse.status}`);
            }

            // Parse JSON responses
            const availableData = await availableResponse.json();
            const usedData = await usedResponse.json();

            console.log('📊 Available data:', availableData);
            console.log('📊 Used data:', usedData);
            console.log('📦 Available materials count:', availableData.MaterialAvailable?.length || 0);
            console.log('🔧 Used materials count:', usedData.MaterialUsed?.length || 0);
            // Extract materials arrays from API response
            const availableMaterialsArray = availableData.MaterialAvailable || availableData.materials || [];
            const usedMaterialsArray = usedData.MaterialUsed || usedData.materials || [];

            
            // ✅ LOG FIRST FEW MATERIALS TO VERIFY SORT ORDER
            if (availableMaterialsArray.length > 0) {
                availableMaterialsArray.slice(0, 3).forEach((m: any, idx: number) => {
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
                } 
                // Priority 2: Calculate from totalCost / quantity
                else if (totalCost > 0 && quantity > 0) {
                    perUnitCost = totalCost / quantity;
                }
                // Priority 3: Use cost field if available (legacy support)
                else if (material.cost !== undefined && material.cost !== null && !isNaN(Number(material.cost))) {
                    perUnitCost = Number(material.cost);
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
                } 
                // Priority 2: Calculate from totalCost / quantity
                else if (totalCost > 0 && quantity > 0) {
                    perUnitCost = totalCost / quantity;
                }
                // Priority 3: Use cost field if available (legacy support)
                else if (material.cost !== undefined && material.cost !== null && !isNaN(Number(material.cost))) {
                    perUnitCost = Number(material.cost);
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

                let currentPage = defaultPage;
                let totalPages = 1;
                let totalItems = 0;
                let hasNextPage = false;
                let hasPrevPage = false;

                // Strategy 1: Check for nested pagination object (BACKEND USES THIS)
                if (data.pagination) {
                    currentPage = data.pagination.currentPage || data.pagination.page || defaultPage;
                    totalPages = data.pagination.totalPages || data.pagination.pages || 1;
                    totalItems = data.pagination.totalItems || data.pagination.total || data.pagination.count || 0;
                    hasNextPage = data.pagination.hasNextPage ?? data.pagination.hasNext ?? (currentPage < totalPages);
                    hasPrevPage = data.pagination.hasPrevPage ?? data.pagination.hasPrev ?? (currentPage > 1);
                    
                }
                // Strategy 2: Check for meta object
                else if (data.meta) {
                    currentPage = data.meta.currentPage || data.meta.page || defaultPage;
                    totalPages = data.meta.totalPages || data.meta.pages || 1;
                    totalItems = data.meta.totalItems || data.meta.total || data.meta.count || 0;
                    hasNextPage = data.meta.hasNextPage ?? data.meta.hasNext ?? (currentPage < totalPages);
                    hasPrevPage = data.meta.hasPrevPage ?? data.meta.hasPrev ?? (currentPage > 1);
                }
                // Strategy 3: Check for root-level pagination fields
                else if (data.currentPage || data.totalPages || data.page || data.pages) {
                    currentPage = data.currentPage || data.page || defaultPage;
                    totalPages = data.totalPages || data.pages || 1;
                    totalItems = data.totalItems || data.total || data.count || 0;
                    hasNextPage = data.hasNextPage ?? data.hasNext ?? (currentPage < totalPages);
                    hasPrevPage = data.hasPrevPage ?? data.hasPrev ?? (currentPage > 1);
                }
                // Strategy 4: Fallback - Calculate from materials count
                else {
                    
                    if (materialsArray.length === limit) {
                        // Got a full page - assume there might be more
                        totalPages = defaultPage + 1;
                        totalItems = materialsArray.length * totalPages;
                        hasNextPage = true;
                    } else if (materialsArray.length > 0) {
                        // Got partial page - this is likely the last page
                        totalPages = defaultPage;
                        totalItems = (defaultPage - 1) * limit + materialsArray.length;
                        hasNextPage = false;
                    } else {
                        // No materials - single empty page
                        totalPages = 1;
                        totalItems = 0;
                        hasNextPage = false;
                    }
                    
                    hasPrevPage = defaultPage > 1;
                }

                // Strategy 5: Override if API says 1 page but we have a full page
                if (totalPages === 1 && materialsArray.length === limit) {
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


                return result;
            };

            const availablePagination = extractPagination(availableData, page, transformedAvailable);
            const usedPagination = extractPagination(usedData, page, transformedUsed);

            
            // ✅ VERIFY SORT ORDER: Log first material to confirm newest is at top
            if (transformedAvailable.length > 0) {
                const firstMaterial = transformedAvailable[0];
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


        } catch (error: any) {
            console.error(`\n❌ ERROR FETCHING MATERIALS:`);
            console.error(`   Message: ${error?.message}`);
            
            const errorMessage = error?.message || 'Failed to load materials';
            
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
                const ignored = safeJsonParse(stored, []);
                setIgnoredMaterials(ignored);
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
        } catch (error) {
            console.error('❌ Error dismissing alert:', error);
        }
    };

    // Helper function to validate MongoDB ObjectId
    const isValidMongoId = (id: string) => {
        return /^[0-9a-fA-F]{24}$/.test(id);
    };

    // Function to get selected section name for dropdown display
    const getSelectedSectionName = () => {
        if (!selectedMiniSection) {
            return 'All Sections';
        }
        const selectedSection = miniSections.find(s => s._id === selectedMiniSection);
        return selectedSection?.name || 'Unknown Section';
    };

    // Function to handle section selection from modal
    const handleSectionSelect = (sectionId: string) => {
        // ✅ CRITICAL FIX: Filter out special/invalid section IDs
        if (sectionId === 'all-sections' || sectionId === 'default-section') {
            setSelectedMiniSection(null);
        } else if (isValidMongoId(sectionId)) {
            // Only set if it's a valid MongoDB ObjectId
            setSelectedMiniSection(sectionId);
        } else {
            // Invalid ID format - treat as "all sections"
            console.warn(`⚠️ Invalid miniSectionId format: ${sectionId}, treating as "all sections"`);
            setSelectedMiniSection(null);
        }
        setShowSectionModal(false); // Close modal after selection
        
        // Reload materials with new filter
        reloadMaterials(1, true);
    };

    // Function to show confirmation modal before toggling
    const handleCompletionButtonPress = () => {
        setShowCompletionConfirmModal(true);
    };

    // Function to toggle section completion
    const toggleSectionCompletion = async () => {
        if (isUpdatingCompletion) return;
        if (!isMountedRef.current) return;
        
        // Close the confirmation modal
        setShowCompletionConfirmModal(false);
        
        // Validate IDs
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
            const payload = {
                updateType: 'project-section',
                id: sectionId,
                projectId: projectId
            };
            
            const response = await apiClient.patch(`/api/completion`, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000
            });
            
            // Check if still mounted after API call
            if (!isMountedRef.current) return;

            const responseData = response.data as any;
            if (responseData.success) {
                const newCompletionStatus = responseData.data?.isCompleted;
                
                if (typeof newCompletionStatus === 'boolean') {
                    // Only update state if mounted
                    if (isMountedRef.current) {
                        setSectionCompleted(newCompletionStatus);
                        toast.success(responseData.message || `Section ${newCompletionStatus ? 'completed' : 'reopened'} successfully`);
                    }
                    
                    // Log completion activity (fire-and-forget, fully isolated)
                    if (isMountedRef.current) {
                        setTimeout(() => {
                            try {
                                if (newCompletionStatus) {
                                    logSectionCompleted(projectId, projectName, sectionId, sectionName, `Section marked as completed via details page`).catch(() => {});
                                } else {
                                    logSectionReopened(projectId, projectName, sectionId, sectionName, `Section reopened via details page`).catch(() => {});
                                }
                            } catch (activityError) {
                                // Silent error - activity logging should never crash the app
                            }
                        }, 0);
                    }
                } else {
                    const toggledStatus = !sectionCompleted;
                    if (isMountedRef.current) {
                        setSectionCompleted(toggledStatus);
                        toast.success(responseData.message || `Section completion updated successfully`);
                    }
                }
            } else {
                throw new Error(responseData.message || 'Failed to update section completion');
            }
        } catch (error: any) {
            console.error('Section completion error:', error.message);
            
            // Only show error if mounted
            if (isMountedRef.current) {
                const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
                toast.error(`Failed to update section completion: ${errorMessage}`);
            }
        } finally {
            // Only update state if mounted
            if (isMountedRef.current) {
                setIsUpdatingCompletion(false);
            }
        }
    };

    // Function to toggle mini-section completion - ULTRA SIMPLE VERSION
    const toggleMiniSectionCompletionDirect = async (miniSectionId: string, miniSectionName: string) => {
        try {
            // Basic validation
            if (!isMountedRef.current) return;
            if (!miniSectionId || !isValidMongoId(miniSectionId)) return;
            
            // Debounce check
            const now = Date.now();
            const lastToggleTime = lastToggleTimesRef.current[miniSectionId] || 0;
            if (now - lastToggleTime < DEBOUNCE_DELAY) return;
            lastToggleTimesRef.current[miniSectionId] = now;
            
            // Check if already updating
            if (miniSectionLoadingStates[miniSectionId]) return;
            
            // Set loading
            if (!isMountedRef.current) return;
            setMiniSectionLoadingStates(prev => ({ ...prev, [miniSectionId]: true }));
            
            // Show loading toast
            toast.loading('Updating completion status...');
            
            // Enhanced API call with retry logic and increased timeout
            let lastError: any = null;
            const maxRetries = 2;
            
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    const response = await apiClient.patch(
                        `/api/completion`,
                        { updateType: 'minisection', id: miniSectionId },
                        { 
                            headers: { 'Content-Type': 'application/json' }, 
                            timeout: 30000 // Increased to 30 seconds
                        }
                    );

                    // Check mounted after API
                    if (!isMountedRef.current) return;

                    // Update state with API response
                    const responseData = response.data as any;
                    if (responseData?.success && typeof responseData.data?.isCompleted === 'boolean') {
                        const newStatus = responseData.data.isCompleted;
                        setMiniSectionCompletions(prev => ({ ...prev, [miniSectionId]: newStatus }));
                        
                        const statusText = newStatus ? 'completed' : 'reopened';
                        toast.success(`${miniSectionName} ${statusText}`);
                        return; // Success, exit retry loop
                    }
                    
                } catch (error: any) {
                    lastError = error;

                    // If it's a timeout and we have retries left, wait and retry
                    if (attempt < maxRetries && (
                        error.code === 'ECONNABORTED' || 
                        error.message?.includes('timeout') ||
                        error.response?.status >= 500
                    )) {
                        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                    
                    // If it's not retryable or we're out of retries, throw
                    throw error;
                }
            }

        } catch (error: any) {
            if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') return;
            
            console.error('Toggle error:', error.message);
            
            if (isMountedRef.current) {
                let errorMessage = 'Failed to update completion status';
                
                if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                    errorMessage = 'Request timed out. Please check your connection and try again.';
                } else if (error.response?.status === 404) {
                    errorMessage = 'Mini-section not found. Please refresh the page.';
                } else if (error.response?.status >= 500) {
                    errorMessage = 'Server error. Please try again later.';
                } else if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                }
                
                toast.error(errorMessage);
            }
        } finally {
            if (isMountedRef.current) {
                setMiniSectionLoadingStates(prev => ({ ...prev, [miniSectionId]: false }));
            }
        }
    };

    // Load mini-section completion status
    const loadMiniSectionCompletionStatus = async () => {
        if (!sectionId || miniSections.length === 0) {
            return;
        }
        
        try {
            const completionStates: {[key: string]: boolean} = {};
            
            // Load completion status for each mini-section in parallel
            const loadPromises = miniSections.map(async (section) => {
                try {
                    const url = `/api/completion?updateType=minisection&id=${section._id}`;
                    const response = await apiClient.get(url, { timeout: 10000 });
                    
                    const data = response.data as any;
                    if (data?.success && data?.data) {
                        completionStates[section._id] = Boolean(data.data.isCompleted);
                    } else {
                        completionStates[section._id] = false;
                    }
                } catch (error) {
                    completionStates[section._id] = false;
                }
            });
            
            await Promise.all(loadPromises);
            
            // Update state only if component is mounted
            if (isMountedRef.current) {
                setMiniSectionCompletions(completionStates);
            }
            
        } catch (error) {
            console.error('Failed to load completion status:', error);
        }
    };

    // Helper function to get client ID from project
    const getClientIdFromProject = async (projectId: string) => {
        try {
            
            // First, we need to get a clientId to make the API call
            // Try to get it from the standard method first
            let queryClientId = null;
            try {
                queryClientId = await getClientId();
            } catch (error) {
                console.warn('⚠️ Could not get clientId for project API query:', error);
            }
            
            // If we don't have a clientId to query with, try to get it from user data directly
            if (!queryClientId) {
                try {
                    const userDetailsString = await AsyncStorage.getItem("user");
                    if (userDetailsString) {
                        const userData = safeJsonParse(userDetailsString, {}) as any;
                        
                        // For staff users, try to use the first client
                        const firstClient = safeFirst(userData?.clients) as any;
                        if (firstClient?.clientId) {
                            queryClientId = firstClient.clientId;
                        } else if (userData?.clientId) {
                            queryClientId = userData.clientId;
                        } else if (userData?._id) {
                            queryClientId = userData._id;
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
            
            // ✅ Validate projectId before making API call
            if (!projectId || projectId === 'undefined' || projectId === 'null') {
                console.error('❌ Project ID is invalid, cannot fetch project data');
                console.error('   Received projectId:', projectId);
                return null;
            }
            
            // Make the API call with clientId parameter
            const apiUrl = `/api/project/${projectId}?clientId=${queryClientId}`;
            
            const response = await apiClient.get(apiUrl);
            const projectData = response.data as any;
            
            
            // Try multiple possible response structures
            let clientId = null;
            
            // Check different possible nested structures
            if (projectData?.project?.clientId) {
                clientId = projectData.project.clientId;
            } else if (projectData?.clientId) {
                clientId = projectData.clientId;
            } else if (projectData?.data?.clientId) {
                clientId = projectData.data.clientId;
            } else if (projectData?.data?.project?.clientId) {
                clientId = projectData.data.project.clientId;
            }
            
            // Handle ObjectId objects (convert to string)
            if (typeof clientId === 'object' && clientId !== null) {
                clientId = clientId.toString();
            }
            
            
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
            
            // Try the standard method first (this is working based on your logs)
            const standardClientId = await getClientId();
            if (standardClientId) {
                
                // For material activities, we can use the standard clientId since it's working
                // The project-based lookup is mainly for verification, not required for functionality
                return standardClientId;
            }
            
            
            // Fallback: Get clientId from project (for edge cases)
            if (projectId) {
                const projectClientId = await getClientIdFromProject(projectId);
                if (projectClientId) {
                    return projectClientId;
                } else {
                    console.warn('⚠️ Project-based clientId lookup failed, but this is not critical');
                }
            }
            
            // Final fallback: Try to get clientId directly from user data
            try {
                const userDetailsString = await AsyncStorage.getItem("user");
                if (userDetailsString) {
                    const userData = safeJsonParse(userDetailsString, {}) as any;
                    
                    // For staff users, use the first client
                    const firstClient = safeFirst(userData?.clients) as any;
                    if (firstClient?.clientId) {
                        return firstClient.clientId;
                    } else if (userData?.clientId) {
                        return userData.clientId;
                    } else if (userData?._id) {
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
                contractor_name: materials[0]?.contractor_name || '', // ✅ NEW: Include contractor name from first material
            };

            const response = await apiClient.post(`/api/materialActivity`, activityPayload);
            

            const responseData = response.data as any;
            if (!responseData.success) {
                console.error('❌ Failed to log activity:', responseData.message);
                return;
            }

            // Step 2: Enhanced notification logic
            try {
                // Get notification recipients (admins and staff for this client)
                const recipients = await getNotificationRecipients(clientId, projectId, user.userId, materials, activity, user);
                
                if (recipients.length > 0) {
                    
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
                }
            } catch (notificationError) {
                console.error('❌ Enhanced notification error:', notificationError);
                // Don't fail the entire operation if notifications fail
            }


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

            // Try to get recipients from backend
            const response = await apiClient.get(`/api/notifications/recipients?clientId=${clientId}&projectId=${projectId}`);
            
            const responseData = response.data as any;
            if (responseData.success) {
                let recipients = responseData.recipients || [];
                // Exclude the user who triggered the action
                recipients = recipients.filter((r: any) => r.userId !== excludeUserId);
                return recipients;
            }
        } catch (error: any) {
            console.warn('⚠️ Backend recipients API not available:', error?.response?.status);
            
            // If 404, the endpoint doesn't exist yet
            if (error?.response?.status === 404) {
            }
        }

        // Fallback: Create a local notification for testing
        try {
            // Import and use SimpleNotificationService for local testing
            const { SimpleNotificationService } = await import('../services/SimpleNotificationService');
            const notificationService = SimpleNotificationService.getInstance();
            
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
            
            await notificationService.scheduleLocalNotification(
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
            
            // Try to send via backend notification service
            const response = await apiClient.post(`/api/notifications/send`, payload);
            
            const responseData = response.data as any;
            if (responseData.success) {
                return true;
            } else {
                console.warn('⚠️ Server-side notifications failed:', responseData.message);
                return false;
            }
        } catch (error: any) {
            console.warn('⚠️ Backend notification service not available:', error?.response?.status);
            
            if (error?.response?.status === 404) {
            }
            
            // For now, we already created a local notification in the fallback
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

        const lowStockItems: any[] = [];

        // ✅ SAFETY CHECK: Ensure we have materials to check
        if (!materials || !materials.available || materials.available.length === 0) {
            return lowStockItems;
        }

        // Group materials to get complete picture
        const groupedMaterials = groupMaterialsByName(materials.available, false);


        groupedMaterials.forEach((group: any) => {
            const materialKey = `${group.name}-${group.unit}`;
            
            // Skip if this material is ignored
            if (ignoredMaterials.includes(materialKey)) {
                return;
            }

            // ✅ CRITICAL: Use the correct values from grouped materials
            // totalImported = total quantity originally imported (available + used)
            // currentlyAvailable = quantity still available (not used yet)
            const totalImported = group.totalImported || 0;
            const currentAvailable = group.currentlyAvailable || group.totalQuantity || 0;
            
            if (totalImported > 0) {
                const stockPercentage = (currentAvailable / totalImported) * 100;
                

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
                    
                }
            } else {
            }
        });

        
        if (lowStockItems.length > 0) {
            lowStockItems.forEach((item, index) => {
            });
        }

        setLowStockMaterials(lowStockItems);
        
        // ✅ Show alert automatically if there are new low stock items
        // Only show if alert is not already visible AND 15 hours have passed since last dismissal
        if (lowStockItems.length > 0 && !showLowStockAlert && shouldShowAlert()) {
            setShowLowStockAlert(true);
        } else if (lowStockItems.length > 0 && !shouldShowAlert()) {
        }

        return lowStockItems;
    };

    // Load project materials on mount (LIMIT: 10 items per page)
    useEffect(() => {
        // Set mounted flag
        isMountedRef.current = true;
        
        fetchMaterials(1, 10, true); // ✅ OPTIMIZED: 10 items per page for better UX
        loadInitialCompletionStatus(); // Load completion status on mount
        loadIgnoredMaterials(); // Load ignored materials from storage
        loadAlertDismissalTime(); // ✅ NEW: Load alert dismissal timestamp

        // Load current user type
        const loadUserType = async () => {
            try {
                const userData = await getUserData();
                if (isMountedRef.current) {
                    setCurrentUserType(userData.userType);
                }
            } catch (error) {
                console.error('Error loading user type:', error);
                if (isMountedRef.current) {
                    setCurrentUserType('staff'); // Default to staff
                }
            }
        };
        loadUserType();
        
        // Cleanup function
        return () => {
            isMountedRef.current = false;
            
            // Clear any pending timeouts
            if (completionLoadTimeoutRef.current) {
                clearTimeout(completionLoadTimeoutRef.current);
                completionLoadTimeoutRef.current = null;
            }
            
            // Stop any running animations
            materialLoadingAnimation.stopAnimation();
            usageLoadingAnimation.stopAnimation();
        };
    }, [projectId]);

    // ✅ NEW: Check for low stock materials whenever materials change
    useEffect(() => {
        // Only check when we have both available and used materials loaded
        if (!materials.loading && materials.available.length > 0) {
            checkLowStockMaterials();
        }
    }, [materials.available, materials.used, materials.loading, ignoredMaterials]);

    // Load initial completion status for section and mini-sections
    const loadInitialCompletionStatus = async () => {
        try {
            // Load section completion status
            if (sectionId && isValidMongoId(sectionId) && projectId && isValidMongoId(projectId)) {
                try {
                    const sectionResponse = await apiClient.get(`/api/completion?updateType=project-section&id=${sectionId}&projectId=${projectId}`);
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
            consoleLogCount++;
        }
    }, [materials.used]);

    // Debug: Log when materials state changes (limited logging)
    useEffect(() => {
        if (__DEV__ && consoleLogCount < MAX_CONSOLE_LOGS) {
            consoleLogCount++;
        }
    }, [materials.available]);

    // Debug: Log when activeTab changes (limited logging)
    useEffect(() => {
        if (__DEV__ && consoleLogCount < MAX_CONSOLE_LOGS) {
            consoleLogCount++;
        }
    }, [activeTab]);

    // Fetch mini-sections for the section selector
    // ✅ CRITICAL FIX: Add a refresh trigger to force re-fetch when needed
    const [miniSectionRefreshTrigger, setMiniSectionRefreshTrigger] = useState(0);
    
    // ✅ NEW: Add useFocusEffect to refresh mini-sections when page comes into focus
    useFocusEffect(
        useCallback(() => {
            console.log('📱 Page focused - triggering mini-section refresh');
            setMiniSectionRefreshTrigger(prev => prev + 1);
        }, [])
    );
    
    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        let isCancelled = false;
        
        const fetchMiniSections = async () => {
            console.log('\n🔍 ========== DETAILS.TSX: FETCHING MINI-SECTIONS (ROBUST) ==========');
            console.log('   - SectionId:', sectionId);
            console.log('   - ProjectId:', projectId);
            console.log('   - Function called at:', new Date().toISOString());
            
            if (!sectionId) {
                console.warn('   ⚠️ No sectionId provided, skipping mini-section fetch');
                return;
            }
            
            if (sectionId.length !== 24) {
                console.error('   ❌ Invalid sectionId format! Expected 24 characters, got:', sectionId.length);
                return;
            }

            try {
                // ✅ Step 1: Resolve parent section ID aliases (like _id vs sectionId in database)
                let sectionAliases = [sectionId];
                const clientId = await getClientIdFromStorage() || await getClientId();
                if (isCancelled) return;
                
                if (clientId && clientId.length === 24) {
                    try {
                        console.log('   - Resolving parent section aliases from project...');
                        const projectRes = await apiClient.get(`/api/project/${projectId}?clientId=${clientId}`);
                        const projectData = projectRes.data?.project || projectRes.data?.data?.project || projectRes.data?.data || projectRes.data;
                        if (projectData && projectData.section && Array.isArray(projectData.section)) {
                            const matchedSec = projectData.section.find((sec: any) => 
                                String(sec._id) === String(sectionId) || String(sec.sectionId) === String(sectionId)
                            );
                            if (matchedSec) {
                                if (matchedSec._id) sectionAliases.push(String(matchedSec._id));
                                if (matchedSec.sectionId) sectionAliases.push(String(matchedSec.sectionId));
                                sectionAliases = [...new Set(sectionAliases)].filter(id => id && id.length === 24);
                                console.log('   ✅ Resolved parent section ID aliases:', sectionAliases);
                            }
                        }
                    } catch (aliasError) {
                        console.warn('   ⚠️ Failed to resolve section aliases:', aliasError);
                    }
                }

                // ✅ Step 2: Fetch mini-sections from API for all section ID aliases!
                console.log('   - Fetching mini-sections from API for aliases:', sectionAliases);
                const miniSectionsDataArrays = await Promise.all(
                    sectionAliases.map(async (alias) => {
                        try {
                            return await getSection(alias);
                        } catch (err) {
                            console.error(`   ❌ Failed to fetch for alias ${alias}:`, err);
                            return [];
                        }
                    })
                );
                
                if (isCancelled) return;
                
                // Combine and deduplicate mini-sections
                const combinedMiniSections: any[] = [];
                const combinedIds = new Set();
                for (const arr of miniSectionsDataArrays) {
                    if (arr && Array.isArray(arr)) {
                        for (const ms of arr) {
                            if (ms && ms._id && !combinedIds.has(ms._id)) {
                                combinedIds.add(ms._id);
                                combinedMiniSections.push(ms);
                            }
                        }
                    }
                }
                
                console.log('   - Combined mini-sections count:', combinedMiniSections.length);

                // ✅ Step 3: Update state with resolved mini-sections
                if (isMountedRef.current && !isCancelled) {
                    setMiniSections(combinedMiniSections);
                    console.log('   ✅ Mini-sections state updated with', combinedMiniSections.length, 'sections');
                    
                    // Auto-select first mini-section if none selected
                    if (!selectedMiniSection && combinedMiniSections.length > 0) {
                        setSelectedMiniSection(combinedMiniSections[0]._id);
                        console.log('   ✅ Auto-selected first mini-section:', combinedMiniSections[0].name);
                    }
                    
                    // Load completion status after mini-sections are loaded
                    timeoutId = setTimeout(async () => {
                        if (isMountedRef.current && !isCancelled) {
                            await loadMiniSectionCompletionStatus();
                        }
                    }, 500);
                }
                
            } catch (error) {
                if (isCancelled) return;
                console.error('   ❌ Error fetching mini-sections:', error);
                
                // Final fallback: Basic getSection call
                try {
                    console.log('   - Falling back to basic getSection call...');
                    const sections = await getSection(sectionId);
                    if (sections && Array.isArray(sections) && isMountedRef.current && !isCancelled) {
                        setMiniSections(sections);
                        
                        // Load completion status
                        timeoutId = setTimeout(async () => {
                            if (isMountedRef.current && !isCancelled) {
                                await loadMiniSectionCompletionStatus();
                            }
                        }, 500);
                    }
                } catch (fallbackError) {
                    console.error('   ❌ Fallback also failed:', fallbackError);
                }
            }
            
            console.log('🔍 ========== END MINI-SECTIONS FETCH ==========\n');
        };

        fetchMiniSections();
        
        return () => {
            isCancelled = true;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [sectionId, projectId, miniSectionRefreshTrigger]);

    // ✅ OPTIMIZED: Wrapper function for material grouping with safety checks
    const getGroupedMaterialsWithCompleteData = (materialsToDisplay: any[], isUsedTab: boolean) => {
        
        // ✅ SAFETY CHECK: Ensure we have valid data before grouping
        if (!materialsToDisplay || !Array.isArray(materialsToDisplay) || materialsToDisplay.length === 0) {
            return [];
        }
        
        if (!materials || !materials.available || !materials.used) {
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
                consoleLogCount++;
            }

            const grouped: { [key: string]: any } = {};

            // Debug raw materials input
            if (__DEV__) {
                // Debug logging removed to prevent memory pressure
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
                    // Debug logging removed to prevent memory pressure
                }

                grouped[key].totalQuantity += material.quantity;
                // ✅ CRITICAL FIX: Calculate total cost correctly
                // Use perUnitCost (which is stored in material.price) multiplied by quantity
                const materialPerUnitCost = material.perUnitCost || material.price || 0;
                const materialTotalCost = materialPerUnitCost * material.quantity;
                grouped[key].totalCost += materialTotalCost;

                // Debug logging after addition
                if (__DEV__) {
                    // Debug logging removed to prevent memory pressure
                }
            });

            // ✅ FIXED: Proper calculation logic for both tabs with null checks
            Object.keys(grouped).forEach((key) => {
                const group = grouped[key];
                
                
                // ✅ SAFETY CHECK: Ensure materials arrays exist
                const availableMaterials = materials?.available || [];
                const usedMaterials = materials?.used || [];
                

                const availableQuantity = availableMaterials
                    .filter(m => {
                        const mSpecsKey = m.specs ? JSON.stringify(m.specs) : 'no-specs';
                        const mPerUnitCost = m.perUnitCost || m.price || 0;
                        const mPriceKey = mPerUnitCost.toFixed(2);
                        const mKey = `${m.name}-${m.unit}-${mSpecsKey}-${mPriceKey}`;
                        const matches = mKey === key;
                        if (matches) {
                        }
                        return matches;
                    })
                    .reduce((sum, m) => {
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
                        }
                        return matches;
                    })
                    .reduce((sum, m) => {
                        return sum + m.quantity;
                    }, 0);

                // ✅ FIXED: Total imported = Currently Available + Total Used
                const totalImported = availableQuantity + usedQuantity;


                // Set the correct values based on which tab we're displaying
                if (isUsedTab) {
                    // In "used" tab: show used materials
                    group.totalQuantity = group.totalQuantity; // Keep as is (used quantity)
                    group.totalUsed = usedQuantity; // Total used across all sections
                    group.totalImported = totalImported; // Total originally imported
                    group.currentlyAvailable = availableQuantity; // Currently available
                    
                } else {
                    // In "imported" tab: show available materials
                    group.totalQuantity = group.totalQuantity; // Keep as is (available quantity)
                    group.totalUsed = usedQuantity; // Total used across all sections
                    group.totalImported = totalImported; // Total originally imported
                    group.currentlyAvailable = availableQuantity; // Currently available
                    
                }
                
                // Debug cost consistency
                if (__DEV__) {
                    // Debug logging removed to prevent memory pressure
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
            
            if (result.length > 0) {
                if (result.length > 1) {
                }
            }
            
            // Debug final grouped results
            if (__DEV__) {
                // Debug logging removed to prevent memory pressure
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


        materialUsages.forEach((usage, index) => {
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


        // Resolve parent section ID to handle _id vs sectionId mismatches perfectly
        const selectedSectionDoc = miniSections.find(s => s._id === miniSectionId);
        const resolvedSectionId = (selectedSectionDoc?.mainSectionDetails?.sectionId) || sectionId;

        // Create the API payload
        const apiPayload = {
            projectId: projectId,
            sectionId: resolvedSectionId,
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


        let loadingToast: any = null;
        try {
            isLoadingRef.current = true;
            loadingToast = toast.loading(`Adding ${materialUsages.length} material usages...`);


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


            const response = await apiClient.post(`/api/material-usage-batch`, apiPayload, requestConfig);
            const responseData = response.data as any;

            
            if (responseData.data) {
            }
            

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
                }

                // Stop loading animation and show success
                stopUsageLoadingAnimation();
                toast.dismiss(loadingToast);

                // Only update UI if component is still mounted
                if (isMountedRef.current) {
                    // ✅ CRITICAL FIX: Close the form first to reset its state
                    setShowUsageForm(false);
                    
                    // Refresh materials from API to get the latest data

                    // ✅ OPTIMIZED: Quick refresh since backend updates cache directly
                    // Short delay for backend to update cache
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Force refresh materials
                    await reloadMaterials(1);

                    // Short delay for state update
                    await new Promise(resolve => setTimeout(resolve, 300));

                    
                    // Switch to "used" tab to show the newly added usage
                    setActiveTab('used');

                    // Show success message with material count
                    toast.success(`✅ ${materialUsages.length} material usages recorded! Check the "Used Materials" tab.`);
                    
                    // 🔔 NEW: Send simple notification for material usage
                    try {
                        
                        const staffName = user?.fullName || 'Staff Member';
                        const usageCount = materialUsages.length;
                        const totalValue = responseData.data?.totalCostOfUsedMaterials || 0;
                        
                        // Create a clean, professional notification message
                        const notificationDetails = `Used ${usageCount} material${usageCount > 1 ? 's' : ''} worth ₹${totalValue.toLocaleString()}`;
                        
                        
                        const notificationSent = await sendProjectNotification({
                            projectId: projectId,
                            clientId: clientId || undefined,
                            activityType: 'usage_added',
                            staffName: staffName,
                            projectName: projectName,
                            details: notificationDetails,
                        });
                        
                        if (notificationSent) {
                        } else {
                            console.warn('⚠️ Usage notification failed to send');
                        }
                    } catch (notificationError) {
                        console.error('❌ Usage notification error:', notificationError);
                    }
                }
            } else {
                throw new Error(responseData.error || 'Failed to add material usages');
            }
        } catch (error: any) {
            if (loadingToast) {
                toast.dismiss(loadingToast);
            }

            
            if (error?.response) {
            } else if (error?.request) {
            } else {
            }
            
            if (error?.config) {
            }
            

            // If batch API fails with 400 (bad request) or 405 (method not allowed), try fallback to single material API
            if (error?.response?.status === 400 || error?.response?.status === 405 || error?.response?.status === 404) {
                
                try {
                    loadingToast = toast.loading('Retrying with alternative method...');
                    
                    // Process materials one by one using the original API
                    let successCount = 0;
                    let failCount = 0;
                    
                    for (const usage of materialUsages) {
                        try {
                            const singleApiPayload = {
                                projectId: projectId,
                                sectionId: resolvedSectionId,
                                miniSectionId: miniSectionId,
                                materialId: usage.materialId,
                                qnt: usage.quantity,
                                clientId: clientId // Add clientId to single API payload
                            };
                            
                            const singleResponse = await apiClient.post(`/api/material-usage`, singleApiPayload, {
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                timeout: 15000,
                            });
                            const singleResponseData = singleResponse.data as any;
                            
                            if (singleResponseData.success) {
                                successCount++;
                            } else {
                                failCount++;
                            }
                        } catch (singleError: any) {
                            failCount++;
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


            // Get target project name for logging
            let targetProjectName = 'Unknown Project';
            try {
                // ✅ Validate targetProjectId before making API call
                if (!targetProjectId || targetProjectId === 'undefined' || targetProjectId === 'null') {
                    console.warn('⚠️ Target project ID is invalid, skipping project name fetch');
                    console.warn('   Received targetProjectId:', targetProjectId);
                } else {
                    const targetProjectResponse = await apiClient.get(`/api/project/${targetProjectId}?clientId=${clientId}`);
                    const targetProjectData = targetProjectResponse.data as any;
                    if (targetProjectData?.success) {
                        targetProjectName = targetProjectData.project?.name || 
                                          targetProjectData.data?.name || 
                                          targetProjectData.name || 
                                          'Unknown Project';
                    }
                }
            } catch (projectError) {
                console.warn('⚠️ Could not fetch target project name:', projectError);
            }

            // Find the material details for cost calculation
            const sourceMaterial = materials?.available?.find(m => m._id === variantId);
            const perUnitCost = sourceMaterial?.price || 0;
            const totalTransferCost = perUnitCost * quantity;


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


            const response = await apiClient.post(`/api/material/transfer`, transferPayload);
            const responseData = response.data as any;

            toast.dismiss(loadingToast);

            if (responseData.success) {

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

                    const activityResponse = await apiClient.post(`/api/materialActivity`, transferActivityPayload);
                } catch (activityError) {
                    console.error('❌ Failed to log transfer activity:', activityError);
                }

                toast.success(`Successfully transferred ${quantity} ${unit} of ${materialName} to ${targetProjectName}`);
                
                await reloadMaterials(1);
                
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

        // Check if component is mounted
        if (!isMountedRef.current) {
            console.warn('⚠️ Component unmounted, aborting section addition');
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

        console.log('📝 Adding mini-section:', sectionData);

        let loadingToast: any = null;
        try {
            loadingToast = toast.loading('Adding section...');
            
            // Call API to add section
            const res: any = await addSection(sectionData, sendProjectNotification);

            console.log('✅ Add section API response:', res);

            // Check if component is still mounted after API call
            if (!isMountedRef.current) {
                console.warn('⚠️ Component unmounted after API call, aborting state update');
                toast.dismiss(loadingToast);
                return;
            }

            toast.dismiss(loadingToast);

            if (res && res.success) {
                console.log('✅ Section added successfully, refetching sections...');
                
                // Show success message
                toast.success("Section added successfully");

                // Log activity (fire-and-forget, don't block UI update)
                setTimeout(() => {
                    logMiniSectionCreated(
                        projectId,
                        projectName,
                        sectionId,
                        sectionName,
                        res.section?._id || res.data?._id || 'unknown',
                        newSectionName.trim()
                    ).catch((err: any) => {
                        console.error('Failed to log activity:', err);
                    });
                }, 0);

                // ✅ CRITICAL FIX: Trigger refresh to fetch updated mini-sections
                console.log('🔄 Triggering mini-section refresh...');
                setMiniSectionRefreshTrigger(prev => prev + 1);

                // Clear form and close modal
                setNewSectionName('');
                setNewSectionDesc('');
                setShowAddSectionModal(false);
                
                console.log('✅ Section addition complete');
            } else {
                console.error('❌ API returned success: false');
                throw new Error(res?.error || res?.message || 'Failed to add section');
            }
        } catch (error: any) {
            if (loadingToast) {
                toast.dismiss(loadingToast);
            }
            console.error('❌ Add section error:', error);
            
            // Check if component is still mounted before showing error
            if (!isMountedRef.current) {
                return;
            }
            
            const errorMessage = error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to add section';
            toast.error(errorMessage);
        }
    };

    // Function to handle deleting a mini-section
    const handleDeleteSection = async (miniSectionId: string, miniSectionName: string) => {
        try {
            // Show confirmation alert
            Alert.alert(
                'Delete Mini-Section',
                `Are you sure you want to delete "${miniSectionName}"? This action cannot be undone.`,
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                            let loadingToast: any = null;
                            try {
                                loadingToast = toast.loading('Deleting section...');

                                // ✅ OPTIMISTIC UPDATE: Immediately remove from UI
                                const originalMiniSections = [...miniSections];
                                setMiniSections(prev => prev.filter(section => section._id !== miniSectionId));

                                // If the deleted mini-section was selected, reset the filter immediately
                                if (selectedMiniSection === miniSectionId) {
                                    setSelectedMiniSection(null);
                                }

                                // Use the correct delete function from details.ts
                                const { deleteMiniSection } = require('@/functions/details');
                                
                                // Prepare section data for notification
                                const sectionData = {
                                    name: miniSectionName,
                                    sectionName: sectionName, // Parent section name
                                    projectId: projectId,
                                    projectName: projectName
                                };

                                // Call the delete function with notification callback
                                const result = await deleteMiniSection(miniSectionId, sectionData, sendProjectNotification);

                                toast.dismiss(loadingToast);

                                if (result && result.success) {
                                    toast.success(`"${miniSectionName}" deleted successfully`);

                                    // ✅ CRITICAL FIX: Trigger refresh to fetch updated mini-sections
                                    console.log('🔄 Triggering mini-section refresh after deletion...');
                                    setMiniSectionRefreshTrigger(prev => prev + 1);

                                    // Reload materials to reflect the changes
                                    await reloadMaterials(1, true);

                                    // Log activity (optional)
                                    try {
                                        const user = await getUserData();
                                        console.log(`Mini-section "${miniSectionName}" deleted by ${user.fullName}`);
                                    } catch (logError) {
                                        // Silent error for logging
                                    }
                                } else {
                                    // ✅ ROLLBACK: Restore original state if API call failed
                                    setMiniSections(originalMiniSections);
                                    throw new Error(result?.error || result?.message || 'Failed to delete section');
                                }
                            } catch (error: any) {
                                if (loadingToast) {
                                    toast.dismiss(loadingToast);
                                }
                                
                                // ✅ ROLLBACK: Restore original state on error by re-triggering full fetch
                                const originalMiniSections = miniSections.filter(section => section._id !== miniSectionId);
                                if (originalMiniSections.length < miniSections.length) {
                                    // Trigger a full re-fetch (includes additional mini-sections from materials/labor)
                                    setMiniSectionRefreshTrigger(prev => prev + 1);
                                }
                                
                                console.error('Delete section error:', error);
                                
                                const errorMessage = error?.response?.data?.error ||
                                    error?.response?.data?.message ||
                                    error?.message ||
                                    'Failed to delete section';
                                toast.error(errorMessage);
                            }
                        },
                    },
                ]
            );
        } catch (error: any) {
            console.error('Error showing delete confirmation:', error);
            toast.error('Failed to show delete confirmation');
        }
    };

    // ✅ FIXED: Simplified getCurrentData with safety checks and proper typing
    const getCurrentData = (): Material[] => {
        
        // ✅ SAFETY CHECK: Ensure materials state exists
        if (!materials || !materials.available || !materials.used) {
            return [] as Material[];
        }
        

        // ✅ CRITICAL FIX: Return API data directly without additional filtering
        // The API already handles pagination and filtering, so we don't need to filter again
        const materialsToDisplay: Material[] = activeTab === 'imported' ? (materials?.available || []) : (materials?.used || []);

        // ✅ NO FILTERING: API already returned the correct page and filtered data
        
        return materialsToDisplay;
    };

    const getGroupedData = () => {
        const currentMaterials = getCurrentData();
        const isUsedTab = activeTab === 'used';
        
        // ✅ SAFETY CHECK: Ensure we have valid materials before grouping
        if (!currentMaterials || !Array.isArray(currentMaterials)) {
            return [];
        }
        
        return getGroupedMaterialsWithCompleteData(currentMaterials, isUsedTab);
    };

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
    
    const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endItem = totalItems > 0 ? Math.min(currentPage * itemsPerPage, totalItems) : 0;

    // ✅ FIXED: Enhanced page change handler with better error handling
    const handlePageChange = async (page: number) => {
        
        // Validate page number
        if (page < 1 || page > totalPages) {
            console.warn(`⚠️ Invalid page number: ${page} (valid range: 1-${totalPages})`);
            toast.error(`Invalid page number. Please select a page between 1 and ${totalPages}.`);
            return;
        }

        if (materials.loading) {
            return;
        }

        try {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            
            await fetchMaterials(page, 10, true);
            
        } catch (error) {
            console.error(`❌ Failed to load page ${page}:`, error);
            toast.error(`Failed to load page ${page}. Please try again.`);
        }
    };

    useEffect(() => {
        fetchMaterials(1, 10, true);
        
        // ✅ CRITICAL FIX: Refresh mini-sections when switching to "used" tab
        if (activeTab === 'used') {
            console.log('🔄 Switched to used tab - refreshing mini-sections');
            setMiniSectionRefreshTrigger(prev => prev + 1);
        }
    }, [activeTab, selectedMiniSection]);

    const getGroupedByDate = () => {
        if (activeTab !== 'used') {
            return null;
        }

        const materials = getCurrentData();
        const groupedByDate: { [date: string]: Material[] } = {};

        materials.forEach(material => {
            try {
                const dateStr = material.createdAt || material.addedAt || material.date;
                const date = new Date(dateStr);

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
            if (dateString === 'unknown-date') {
                return 'Unknown Date';
            }

            const date = new Date(dateString + 'T00:00:00');

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
        consoleLogCount++;
    }

    const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`;
    const getSectionName = (sectionId: string | undefined) => {
        if (!sectionId) return 'Unassigned';
        const section = predefinedSections.find(s => s._id === sectionId);
        return section ? section.name : 'Unassigned';
    };

    const addMaterialRequest = async (materialsToAdd: MaterialEntry[], message: string) => {

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
            contractor_name: material.contractor_name || '', // ✅ NEW: Include contractor_name
        }));


        try {
            // Get user details from AsyncStorage to send in headers
            const userDetailsString = await AsyncStorage.getItem("user");
            let userDetails = null;
            
            if (userDetailsString) {
                try {
                    userDetails = JSON.parse(userDetailsString);
                } catch (parseError) {
                    console.error('Failed to parse user details:', parseError);
                }
            }
            
            // Make API call with user details in headers
            const res = await apiClient.post(`/api/material`, formattedMaterials, {
                headers: {
                    ...(userDetails && { 'x-user-details': JSON.stringify(userDetails) })
                }
            });

            const responseData = res.data as any;

            // Check response
            if (responseData.success && responseData.results && Array.isArray(responseData.results)) {

                // Count successful additions
                const successCount = responseData.results.filter((r: any) => r.success).length || 0;
                const failCount = responseData.results.filter((r: any) => !r.success).length || 0;

                responseData.results.forEach((result: any, index: number) => {
                });

                if (successCount > 0) {
                    const successfulResults = responseData.results.filter((r: any) => r.success) || [];

                    const successfulMaterials = successfulResults.map((result: any) => {
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

                        return materialData;
                    });

                    successfulMaterials.forEach((material: any, index: number) => {
                    });

                    // Only log activity if we have successful materials
                    if (successfulMaterials.length > 0) {
                        
                        // ✅ REMOVED: logMaterialImported() call
                        // The backend API (/api/material/add-stock) already creates MaterialActivity entries
                        // with detailed information (activity: "imported"). Creating a duplicate regular Activity
                        // here was causing simple text notifications instead of detailed material cards.
                        // Now only the MaterialActivity from the backend will be shown in notifications.
                        try {
                            
                            const staffName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Staff Member';
                            const materialCount = successfulMaterials.length;
                            const totalValue = successfulMaterials.reduce((sum: number, m: any) => sum + (m.totalCost || 0), 0);
                            
                            const notificationDetails = `Added ${materialCount} material${materialCount > 1 ? 's' : ''} worth ₹${totalValue.toLocaleString()}`;
                            
                            const notificationSent = await sendProjectNotification({
                                projectId: projectId,
                                clientId: clientId || undefined,
                                activityType: 'material_added',
                                staffName: staffName,
                                projectName: projectName,
                                details: notificationDetails,
                            });
                            
                            if (notificationSent) {
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
                
                // Short delay for backend to update cache (much faster now!)
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Force refresh to get updated cache
                await reloadMaterials(1);
                
                // Short delay for state update
                await new Promise(resolve => setTimeout(resolve, 300));
                
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
                    toast.error(`❌ Failed to add ${failCount} material${failCount > 1 ? 's' : ''}`);
                }
            } else if (responseData.success) {
                console.warn('⚠️ API returned success but no results array');
                
                await new Promise(resolve => setTimeout(resolve, 500));
                await reloadMaterials(1);
                await new Promise(resolve => setTimeout(resolve, 300));
                
                stopMaterialLoadingAnimation();
                toast.success('✅ Material added successfully');
            } else {

                console.error('❌ API returned success: false');
                const errorMsg = typeof responseData.error === 'string' 
                    ? responseData.error 
                    : (responseData.message || 'Failed to add materials');
                
                stopMaterialLoadingAnimation();
                toast.error(errorMsg);
                throw new Error(errorMsg);
            }

        } catch (error) {
            console.error("Material request error:", error);
            
            // ✅ FIXED: More defensive check for error object
            const hasResponse = error && typeof error === 'object' && 'response' in error;

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
                onToggleSectionCompletion={handleCompletionButtonPress}
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
                    try {
                        await addMaterialRequest(materials, message);
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
                            {/* Check icon for mini-section completion status - Clickable to toggle */}
                            <TouchableOpacity
                                onPress={() => {
                                    if (selectedMiniSection) {
                                        // Find the selected mini-section name
                                        const selectedSection = miniSections.find(s => s._id === selectedMiniSection);
                                        const sectionName = selectedSection?.name || 'Unknown Section';
                                        
                                        // Toggle completion status
                                        toggleMiniSectionCompletionDirect(selectedMiniSection, sectionName);
                                    }
                                }}
                                disabled={!selectedMiniSection || miniSectionLoadingStates[selectedMiniSection || '']}
                                activeOpacity={0.7}
                                style={{
                                    padding: 4, // Add padding for better touch target
                                    marginRight: 4,
                                }}
                            >
                                <Ionicons 
                                    name={
                                        selectedMiniSection && miniSectionCompletions[selectedMiniSection] 
                                            ? "checkmark-circle" 
                                            : "checkmark-circle-outline"
                                    } 
                                    size={16} 
                                    color={
                                        !selectedMiniSection 
                                            ? "#CBD5E1" // Very light gray when no selection (disabled)
                                            : miniSectionLoadingStates[selectedMiniSection || '']
                                                ? "#94A3B8" // Medium gray when loading
                                                : miniSectionCompletions[selectedMiniSection]
                                                    ? "#10B981" // Green for completed
                                                    : "#64748B" // Gray for not completed
                                    } 
                                />
                            </TouchableOpacity>
                            
                            {miniSections.length > 0 ? (
                                <View style={sectionStyles.compactSectionSelector}>
                                    {/* Simple Inline Dropdown */}
                                    <View style={{ 
                                        flex: 1, 
                                        position: 'relative'
                                    }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            {/* Main Button */}
                                            <TouchableOpacity
                                                style={{
                                                    flex: 1,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    paddingHorizontal: 12,
                                                    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
                                                    backgroundColor: '#FFFFFF', // Always white background
                                                    borderRadius: Platform.OS === 'ios' ? 8 : 6,
                                                    borderWidth: 1,
                                                    borderColor: '#E2E8F0', // Always show border
                                                    minHeight: Platform.OS === 'ios' ? 44 : 40,
                                                    shadowColor: '#000',
                                                    shadowOffset: { width: 0, height: 1 },
                                                    shadowOpacity: 0.05,
                                                    shadowRadius: 2,
                                                    elevation: 1,
                                                }}
                                                onPress={() => {
                                    // ✅ Refresh mini-sections before opening modal
                                    setMiniSectionRefreshTrigger(prev => prev + 1);
                                    setShowSectionModal(true);
                                }}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={{
                                                    flex: 1,
                                                    fontSize: 14,
                                                    color: '#1F2937',
                                                    fontWeight: '500',
                                                    marginRight: 8,
                                                }} numberOfLines={1}>
                                                    {getSelectedSectionName()}
                                                </Text>
                                                <Ionicons 
                                                    name="chevron-down" 
                                                    size={16} 
                                                    color="#64748B" 
                                                />
                                            </TouchableOpacity>

                                            {/* Add Button */}
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: '#3B82F6',
                                                    width: Platform.OS === 'ios' ? 36 : 32,
                                                    height: Platform.OS === 'ios' ? 36 : 32,
                                                    borderRadius: Platform.OS === 'ios' ? 8 : 6,
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                }}
                                                onPress={() => setShowAddSectionModal(true)}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons name="add" size={20} color="#fff" />
                                            </TouchableOpacity>
                                        </View>


                                    </View>
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
                                            // ✅ FIX: Use refresh trigger to run full fetch (including additional mini-sections)
                                            setMiniSectionRefreshTrigger(prev => prev + 1);
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
                                        miniSectionLoadingStates={miniSectionLoadingStates}
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

            {/* Section Completion Confirmation Modal */}
            <Modal
                visible={showCompletionConfirmModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowCompletionConfirmModal(false)}
            >
                <View style={confirmModalStyles.modalOverlay}>
                    <View style={confirmModalStyles.modalContainer}>
                        <View style={confirmModalStyles.modalHeader}>
                            <Ionicons 
                                name={sectionCompleted ? "refresh-circle" : "checkmark-circle"} 
                                size={48} 
                                color={sectionCompleted ? "#F59E0B" : "#059669"} 
                            />
                            <Text style={confirmModalStyles.modalTitle}>
                                {sectionCompleted ? 'Reopen Section?' : 'Complete Section?'}
                            </Text>
                            <Text style={confirmModalStyles.modalMessage}>
                                {sectionCompleted 
                                    ? `Are you sure you want to reopen "${sectionName}"? This will allow material operations again.`
                                    : `Are you sure you want to mark "${sectionName}" as completed? This will disable material operations.`
                                }
                            </Text>
                        </View>

                        <View style={confirmModalStyles.modalActions}>
                            <TouchableOpacity
                                style={confirmModalStyles.cancelButton}
                                onPress={() => setShowCompletionConfirmModal(false)}
                                activeOpacity={0.7}
                            >
                                <Text style={confirmModalStyles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    confirmModalStyles.confirmButton,
                                    sectionCompleted && confirmModalStyles.confirmButtonReopen
                                ]}
                                onPress={toggleSectionCompletion}
                                activeOpacity={0.7}
                                disabled={isUpdatingCompletion}
                            >
                                {isUpdatingCompletion ? (
                                    <View style={confirmModalStyles.loadingContainer}>
                                        <Ionicons name="sync" size={16} color="#FFFFFF" />
                                        <Text style={confirmModalStyles.confirmButtonText}>
                                            {sectionCompleted ? 'Reopening...' : 'Completing...'}
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={confirmModalStyles.confirmButtonText}>
                                        {sectionCompleted ? 'Reopen' : 'Complete'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Mini-Section Selection Modal */}
            <Modal
                visible={showSectionModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowSectionModal(false)}
            >
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
                    {/* Header */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 20,
                        paddingVertical: 16,
                        backgroundColor: '#FFFFFF',
                        borderBottomWidth: 1,
                        borderBottomColor: '#E2E8F0',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 3,
                        elevation: 3,
                    }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{
                                fontSize: 18,
                                fontWeight: '600',
                                color: '#1F2937',
                            }}>
                                Select Mini-Section
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                color: '#6B7280',
                                marginTop: 2,
                            }}>
                                Swipe left to delete
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowSectionModal(false)}
                            style={{
                                padding: 8,
                                borderRadius: 8,
                                backgroundColor: '#F3F4F6',
                            }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="close" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView 
                        style={{ flex: 1 }}
                        contentContainerStyle={{ 
                            padding: 20,
                            paddingBottom: 40,
                        }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* All Sections Option */}
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 20,
                                paddingVertical: 18,
                                backgroundColor: !selectedMiniSection ? '#EFF6FF' : '#FFFFFF',
                                borderRadius: 12,
                                borderWidth: !selectedMiniSection ? 2 : 1,
                                borderColor: !selectedMiniSection ? '#3B82F6' : '#E2E8F0',
                                marginBottom: 16,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.05,
                                shadowRadius: 3,
                                elevation: 2,
                            }}
                            onPress={() => {
                                handleSectionSelect('all-sections');
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: !selectedMiniSection ? '#3B82F6' : '#F3F4F6',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 16,
                            }}>
                                <Ionicons 
                                    name="apps-outline" 
                                    size={20} 
                                    color={!selectedMiniSection ? '#FFFFFF' : '#6B7280'} 
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: !selectedMiniSection ? '#3B82F6' : '#374151',
                                    marginBottom: 2,
                                }}>
                                    All Sections
                                </Text>
                                <Text style={{
                                    fontSize: 14,
                                    color: '#6B7280',
                                }}>
                                    Show materials from all mini-sections
                                </Text>
                            </View>
                            {!selectedMiniSection && (
                                <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                            )}
                        </TouchableOpacity>

                        {/* Mini Sections List */}
                        {(() => {
                            console.log('\n🎨 ========== RENDERING MINI-SECTIONS ==========');
                            console.log('   - miniSections.length:', miniSections.length);
                            console.log('   - miniSections:', miniSections);
                            if (miniSections.length > 0) {
                                console.log('   - Mini-section IDs:', miniSections.map(s => s._id));
                                console.log('   - Mini-section names:', miniSections.map(s => s.name));
                            }
                            console.log('🎨 ========== END RENDERING ==========\n');
                            return null;
                        })()}
                        {miniSections.length > 0 && (
                            <View>
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: '#374151',
                                    marginBottom: 16,
                                    marginTop: 8,
                                }}>
                                    Mini-Sections ({miniSections.length})
                                </Text>

                                {miniSections.map((section, index) => (
                                    <SwipeableMiniSection
                                        key={section._id}
                                        section={section}
                                        selectedMiniSection={selectedMiniSection}
                                        miniSectionCompletions={miniSectionCompletions}
                                        miniSectionLoadingStates={miniSectionLoadingStates}
                                        onSectionSelect={(sectionId) => {
                                            handleSectionSelect(sectionId);
                                        }}
                                        onToggleCompletion={toggleMiniSectionCompletionDirect}
                                        onDelete={handleDeleteSection}
                                    />
                                ))}
                            </View>
                        )}

                        {/* Empty State */}
                        {miniSections.length === 0 && (
                            <View style={{
                                alignItems: 'center',
                                paddingVertical: 40,
                            }}>
                                <View style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 40,
                                    backgroundColor: '#F3F4F6',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 16,
                                }}>
                                    <Ionicons name="folder-outline" size={32} color="#9CA3AF" />
                                </View>
                                <Text style={{
                                    fontSize: 18,
                                    fontWeight: '600',
                                    color: '#374151',
                                    marginBottom: 8,
                                }}>
                                    No Mini-Sections
                                </Text>
                                <Text style={{
                                    fontSize: 14,
                                    color: '#6B7280',
                                    textAlign: 'center',
                                    lineHeight: 20,
                                }}>
                                    Create mini-sections to organize{'\n'}your materials better
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </SafeAreaView>
                </GestureHandlerRootView>
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
    // Completion Status Card for "used" tab
    completionStatusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    completionStatusCardCompleted: {
        backgroundColor: '#F0FDF4',
        borderColor: '#BBF7D0',
    },
    completionStatusLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    completionStatusTextContainer: {
        flex: 1,
    },
    completionStatusTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 2,
    },
    completionStatusSubtitle: {
        fontSize: 12,
        color: '#64748B',
    },
    completionToggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#059669',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 6,
    },
    completionToggleButtonUndo: {
        backgroundColor: '#F59E0B',
    },
    completionToggleButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
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

// Confirmation Modal Styles
const confirmModalStyles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1E293B',
        marginTop: 16,
        marginBottom: 12,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
    },
    modalActions: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#475569',
    },
    confirmButton: {
        flex: 1,
        backgroundColor: '#059669',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonReopen: {
        backgroundColor: '#F59E0B',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
});

export default Details;