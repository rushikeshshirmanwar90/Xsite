import Header from '@/components/details/Header';
import LaborCardEnhanced from '@/components/details/LaborCardEnhanced';
import LaborFormModal from '@/components/details/LaborFormModal';
import { getClientId } from '@/functions/clientId';
import { getSection } from '@/functions/details';
import apiClient from '@/utils/axiosConfig';

import { styles } from '@/style/details';
import { Section } from '@/types/details';
import { Labor, LaborEntry } from '@/types/labor';
import { Ionicons } from '@expo/vector-icons';

import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import { toast } from 'sonner-native';
import { useSimpleNotifications } from '@/hooks/useSimpleNotifications';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeJsonParse, safeFirst } from '@/utils/helpers';

// Swipeable Mini-Section Component (copied from details.tsx)
const SwipeableMiniSection = ({ 
    section, 
    selectedMiniSection, 
    onSectionSelect, 
}: {
    section: Section;
    selectedMiniSection: string | null;
    onSectionSelect: (sectionId: string) => void;
}) => {
    const translateX = useRef(new Animated.Value(0)).current;

    const handleGestureEvent = Animated.event(
        [{ nativeEvent: { translationX: translateX } }],
        { useNativeDriver: false }
    );

    const handleStateChange = (event: any) => {
        const { state, translationX } = event.nativeEvent;
        
        if (state === State.END) {
            // Reset position (no delete functionality for labor page)
            Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: false,
            }).start();
        }
    };

    return (
        <View style={{ marginBottom: 12, position: 'relative' }}>
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
                            backgroundColor: selectedMiniSection === section._id ? '#EAF0FE' : '#FFFFFF',
                            borderRadius: 12,
                            borderWidth: selectedMiniSection === section._id ? 2 : 1,
                            borderColor: selectedMiniSection === section._id ? '#3A78B5' : '#E2E8F0',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.05,
                            shadowRadius: 3,
                            elevation: 2,
                        }}
                        onPress={() => onSectionSelect(section._id)}
                        activeOpacity={0.7}
                    >
                        {/* Section Icon */}
                        <View style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: selectedMiniSection === section._id ? '#3A78B5' : '#F3F4F6',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 16,
                        }}>
                            <Ionicons 
                                name="people-outline" 
                                size={20}
                                color={selectedMiniSection === section._id ? '#FFFFFF' : '#6B7280'} 
                            />
                        </View>
                        
                        {/* Section Info */}
                        <View style={{ flex: 1 }}>
                            <Text 
                                style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: selectedMiniSection === section._id ? '#3A78B5' : '#374151',
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
                                Slab
                            </Text>
                        </View>
                        
                        {/* Selection Indicator */}
                        {selectedMiniSection === section._id && (
                            <Ionicons name="checkmark-circle" size={24} color="#3A78B5" />
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </PanGestureHandler>
        </View>
    );
};

const LaborPage = () => {
    const params = useLocalSearchParams();
    const { user, clientId } = useAuth();
    const { sendProjectNotification } = useSimpleNotifications();
    
    // ✅ ENHANCED: Extract and validate parameters with detailed logging
    console.log('\n🚀 ========== LABOR PAGE INITIALIZATION ==========');
    console.log('   - Raw params object:', params);
    console.log('   - Params keys:', Object.keys(params));
    console.log('   - Params values:', Object.values(params));
    
    const projectId = params.projectId as string;
    const projectName = params.projectName as string;
    const sectionId = params.sectionId as string;
    const sectionName = params.sectionName as string;

    const contractorId = params.contractorId as string;
    const userId = params.userId as string;
    const contractorType = params.contractorType as string;
    
    console.log('   - Extracted projectId:', projectId, '(type:', typeof projectId, ')');
    console.log('   - Extracted projectName:', projectName, '(type:', typeof projectName, ')');
    console.log('   - Extracted sectionId:', sectionId, '(type:', typeof sectionId, ')');
    console.log('   - Extracted sectionName:', sectionName, '(type:', typeof sectionName, ')');
    
    // ✅ VALIDATION: Check if required parameters are missing
    const missingParams = [];
    if (!projectId) missingParams.push('projectId');
    if (!projectName) missingParams.push('projectName');
    if (!sectionId) missingParams.push('sectionId');
    if (!sectionName) missingParams.push('sectionName');
    
    if (missingParams.length > 0) {
        console.error('❌ MISSING REQUIRED PARAMETERS:', missingParams);
        console.error('❌ This will cause mini-section fetching to fail!');
        console.error('❌ Make sure navigation includes all required params');
    } else {
        console.log('✅ All required parameters present');
    }
    
    console.log('🚀 ========== END LABOR PAGE INITIALIZATION ==========\n');

    const [laborEntries, setLaborEntries] = useState<Labor[]>([]);
    const [loading, setLoading] = useState(false);
    const [showLaborForm, setShowLaborForm] = useState(false);
    const [isAddingLabor, setIsAddingLabor] = useState(false);
    const cardAnimations = useRef<Animated.Value[]>([]).current;
    const scrollViewRef = useRef<ScrollView>(null);
    
    // ✅ ADD: Mini-sections state and management
    const [miniSections, setMiniSections] = useState<Section[]>([]);
    const [miniSectionRefreshTrigger, setMiniSectionRefreshTrigger] = useState(0);
    const [selectedMiniSection, setSelectedMiniSection] = useState<string | null>(null);
    const [showSectionModal, setShowSectionModal] = useState(false);
    const isMountedRef = useRef(true);
    
    // Loading animation for adding labor
    const loadingAnimation = useRef(new Animated.Value(0)).current;

    // Contractor state variables
    const [contractorDetails, setContractorDetails] = useState<any>(null);
    const [contractorContracts, setContractorContracts] = useState<any[]>([]);
    const [loadingContractorDetails, setLoadingContractorDetails] = useState(false);
    const [showContractorModal, setShowContractorModal] = useState(false);
    
    // Contractor expansion state for dropdown functionality
    const [expandedContractors, setExpandedContractors] = useState<Set<string>>(new Set());
    
    // Contractor filtering - always show only contractor's work (no toggle needed)

    // Helper function to group contractor contracts by staff
    const groupContractorsByStaff = () => {
        if (!contractorContracts || contractorContracts.length === 0) return {};
        
        const grouped: { [key: string]: any[] } = {};
        
        contractorContracts.forEach(contract => {
            // Use staffId._id if it's populated, otherwise use staffId directly
            const staffId = contract.staffId?._id || contract.staffId;
            const staffKey = staffId ? staffId.toString() : 'unknown';
            
            if (!grouped[staffKey]) {
                grouped[staffKey] = [];
            }
            grouped[staffKey].push(contract);
        });
        
        return grouped;
    };

    // Helper function to toggle contractor expansion
    const toggleContractorExpansion = (staffId: string) => {
        const newExpanded = new Set(expandedContractors);
        if (newExpanded.has(staffId)) {
            newExpanded.delete(staffId);
        } else {
            newExpanded.add(staffId);
        }
        setExpandedContractors(newExpanded);
    };

    // Helper function to get staff display name
    const getStaffDisplayName = (contract: any) => {
        return contract.staffId
            ? `${contract.staffId.firstName} ${contract.staffId.lastName}`
            : 'Unknown Contractor';
    };

    // Function to fetch all labor entries from API
    const fetchLaborEntries = async () => {
        try {
            setLoading(true);
            console.log('📋 Fetching labor entries - Project:', projectId);
            
            const clientId = await getClientId();
            if (!clientId) {
                throw new Error('Client ID not found');
            }

            // ✅ Build API params with automatic contractor filtering
            const apiParams: any = {
                entityType: 'project',
                entityId: projectId,
                sectionId: sectionId
            };

            // ✅ AUTOMATIC CONTRACTOR FILTERING: Always filter by contractor's work if user is a contractor
            const isContractor = !!(contractorId && userId);
            
            if (isContractor) {
                // Always filter by userId for contractors - no toggle needed
                apiParams.addedBy = userId;
                console.log('🔍 Contractor detected - filtering by userId:', userId);
            } else {
                console.log('🔍 Non-contractor user - showing all entries');
            }

            console.log('📋 Final API Params:', apiParams);

            // Use apiClient for authenticated requests
            const response = await apiClient.get(`/api/labor`, {
                params: apiParams
            });

            const result = response.data;
            console.log('✅ Labor API response success:', result.success);
            console.log('✅ Raw labor entries count:', result?.data?.laborEntries?.length || 0);

            if (result.success && result.data) {
                // Transform API response to match our Labor interface
                const transformedEntries: Labor[] = (result.data.laborEntries || []).map((entry: any, index: number) => {
                    return {
                        id: index + 1,
                        _id: entry._id || `labor_${index}`,
                        type: entry.type,
                        category: entry.category,
                        count: entry.count,
                        perLaborCost: entry.perLaborCost,
                        totalCost: entry.totalCost,
                        date: entry.addedAt || entry.createdAt || new Date().toISOString(),
                        icon: getLaborIconAndColor(entry.category).icon,
                        color: getLaborIconAndColor(entry.category).color,
                        sectionId: sectionId,
                        miniSectionId: entry.miniSectionId,
                        addedBy: entry.addedBy,
                        addedAt: entry.addedAt || entry.createdAt || new Date().toISOString(),
                        createdAt: entry.createdAt || new Date().toISOString(),
                        updatedAt: entry.updatedAt || new Date().toISOString()
                    };
                });

                console.log('📋 Transformed entries count:', transformedEntries.length);
                console.log('📋 Contractor filtering applied:', isContractor);

                // ✅ BACKUP CLIENT-SIDE FILTERING: Apply additional filtering if needed
                let finalEntries = transformedEntries;
                
                // Only apply client-side filtering if we're a contractor and API didn't filter properly
                if (isContractor && transformedEntries.length > 0) {
                    const apiFilteredCorrectly = transformedEntries.every(entry => entry.addedBy === userId);
                    
                    if (!apiFilteredCorrectly) {
                        console.log('⚠️ API filtering incomplete, applying client-side backup filter');
                        finalEntries = transformedEntries.filter(entry => entry.addedBy === userId);
                        console.log('📋 Client-side filtered entries:', finalEntries.length);
                    } else {
                        console.log('✅ API filtering worked correctly');
                    }
                }

                setLaborEntries(finalEntries);

                // Clear animations array completely before reinitializing
                while (cardAnimations.length > 0) {
                    cardAnimations.pop();
                }
                
                // Initialize fresh animations for all items
                for (let i = 0; i < finalEntries.length; i++) {
                    cardAnimations.push(new Animated.Value(0));
                }

                // Start stagger animation
                Animated.stagger(100,
                    cardAnimations.map((anim: Animated.Value) =>
                        Animated.timing(anim, {
                            toValue: 1,
                            duration: 300,
                            useNativeDriver: false,
                        })
                    )
                ).start();
            } else {
                // No labor entries found
                console.log('⚠️ No labor entries in response');
                setLaborEntries([]);
            }
        } catch (error: any) {
            console.error('❌ Error fetching labor entries:', error);
            console.error('❌ Error details:', error.response?.data || error.message);
            toast.error('Failed to load labor entries');
            setLaborEntries([]);
        } finally {
            setLoading(false);
        }
    };

    // Function to get labor icon and color based on category
    const getLaborIconAndColor = (category: string) => {
        const categoryMap: { [key: string]: { icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap, color: string } } = {
            'Civil / Structural Works': { icon: 'hammer-outline', color: '#EF4444' },
            'Electrical Works': { icon: 'flash-outline', color: '#F59E0B' },
            'Plumbing & Sanitary Works': { icon: 'water-outline', color: '#3A78B5' },
            'Finishing Works': { icon: 'brush-outline', color: '#EC4899' },
            'Mechanical & HVAC Works': { icon: 'thermometer-outline', color: '#F97316' },
            'Fire Fighting & Safety Works': { icon: 'flame-outline', color: '#DC2626' },
            'External & Infrastructure Works': { icon: 'leaf-outline', color: '#65A30D' },
            'Waterproofing & Treatment Works': { icon: 'shield-outline', color: '#10B981' },
            'Site Management & Support Staff': { icon: 'people-outline', color: '#1E40AF' },
            'Equipment Operators': { icon: 'car-outline', color: '#7C2D12' },
            'Security & Housekeeping': { icon: 'shield-checkmark-outline', color: '#374151' },
            'RCC contractor': { icon: 'grid-outline', color: '#475569' }
        };

        return categoryMap[category] || { icon: 'people-outline', color: '#6B7280' };
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
        
        // No need to reload data - filtering is done in UI
    };

    // Helper function to get client ID from storage
    const getClientIdFromStorage = async () => {
        try {
            console.log('🔑 LABOR.TSX: Getting clientId from storage...');
            
            // Try the standard method first
            const standardClientId = await getClientId();
            if (standardClientId) {
                console.log('✅ LABOR.TSX: Standard clientId found:', standardClientId);
                return standardClientId;
            }
            
            console.log('⚠️ LABOR.TSX: Standard clientId not found, trying fallbacks...');
            
            // Final fallback: Try to get clientId directly from user data
            try {
                const userDetailsString = await AsyncStorage.getItem("user");
                if (userDetailsString) {
                    const userData = safeJsonParse(userDetailsString, {}) as any;
                    console.log('📋 LABOR.TSX: User data structure:', {
                        hasClients: !!userData?.clients,
                        clientsLength: userData?.clients?.length || 0,
                        hasClientId: !!userData?.clientId,
                        hasId: !!userData?._id
                    });
                    
                    // For staff users, use the first client
                    const firstClient = safeFirst(userData?.clients) as any;
                    if (firstClient?.clientId) {
                        console.log('✅ LABOR.TSX: Using first client clientId:', firstClient.clientId);
                        return firstClient.clientId;
                    } else if (userData?.clientId) {
                        console.log('✅ LABOR.TSX: Using user clientId:', userData.clientId);
                        return userData.clientId;
                    } else if (userData?._id) {
                        console.log('✅ LABOR.TSX: Using user _id as clientId:', userData._id);
                        return userData._id;
                    }
                }
            } catch (fallbackError) {
                console.error('❌ LABOR.TSX: Direct user data fallback failed:', fallbackError);
            }
            
            console.error('❌ LABOR.TSX: All clientId methods failed');
            return null;
        } catch (error) {
            console.error('❌ LABOR.TSX: Error in getClientIdFromStorage:', error);
            return null;
        }
    };

    const fetchContractorDetails = async () => {
        if (!projectId || !userId) return;
        try {
            setLoadingContractorDetails(true);
            console.log('🔍 Fetching contractor details for:', { projectId: projectId.slice(-6), userId: userId.slice(-6) });
            
            // Fetch ALL contractor records for this staff member in this project (including completed ones)
            const res = await apiClient.get(`/api/contractor`, {
                params: {
                    projectId: projectId,
                    staffId: userId,
                    all: true,
                    includeCompleted: true // Explicitly request completed contracts
                }
            });
            
            console.log('📋 Contractor API response:', {
                success: (res.data as any)?.success,
                dataType: typeof (res.data as any)?.data,
                isArray: Array.isArray((res.data as any)?.data),
                count: Array.isArray((res.data as any)?.data) ? (res.data as any).data.length : 1
            });
            
            if ((res.data as any)?.success && (res.data as any)?.data) {
                const data = (res.data as any).data;
                const arr = Array.isArray(data) ? data : [data];
                
                console.log('✅ Contractor contracts found:', arr.length);
                arr.forEach((contract: any, index: number) => {
                    console.log(`   Contract ${index + 1}:`, {
                        id: contract._id?.slice(-6),
                        type: contract.contractType,
                        status: contract.status,
                        totalAmount: contract.totalAmount,
                        totalPaid: contract.totalPaid,
                        usedAmount: contract.usedAmount
                    });
                });
                
                setContractorContracts(arr);
                if (arr.length > 0) {
                    setContractorDetails(arr[0]);
                }
            } else {
                console.log('⚠️ No contractor data in response');
                setContractorContracts([]);
                setContractorDetails(null);
            }
        } catch (err: any) {
            console.error('❌ Error fetching contractor details:', err);
            // Handle 404 gracefully - it just means no contractor record exists yet
            if (err.response?.status === 404) {
                console.log('📝 No contractor record found for this project/staff combination in labor.tsx');
                setContractorContracts([]);
                setContractorDetails(null);
            } else {
                console.error('Failed to fetch contractor details in labor.tsx:', err);
            }
        } finally {
            setLoadingContractorDetails(false);
        }
    };

    // Function to load data
    const loadData = async () => {
        setLoading(true);
        
        try {
            // Load labor entries from API
            await fetchLaborEntries();
            if (contractorId && userId) {
                await fetchContractorDetails();
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Function to start loading animation
    const startLoadingAnimation = () => {
        setIsAddingLabor(true);
        Animated.loop(
            Animated.timing(loadingAnimation, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            })
        ).start();
    };

    // Function to stop loading animation
    const stopLoadingAnimation = () => {
        setIsAddingLabor(false);
        loadingAnimation.stopAnimation();
        loadingAnimation.setValue(0);
    };
    // Function to handle adding labor entries (real API implementation)
    const handleAddLaborEntries = async (laborEntries: LaborEntry[], message: string) => {
        try {
            console.log('Adding labor entries:', laborEntries);

            // Start loading animation
            startLoadingAnimation();
            toast.loading(`Adding labor...`);

            const clientId = await getClientId();
            if (!clientId) {
                throw new Error('Client ID not found');
            }

            // Prepare data for the labor API
            const requestData = {
                laborEntries: laborEntries.map(entry => ({
                    type: entry.type,
                    category: entry.category,
                    skillLevel: entry.skillLevel || 'na',
                    count: entry.count,
                    perLaborCost: entry.perLaborCost,
                    totalCost: entry.count * entry.perLaborCost,
                    notes: message || '',
                    workDate: new Date().toISOString(),
                    status: 'active',
                    description: entry.description || '',
                    miniSectionId: entry.miniSectionId,
                    miniSectionName: entry.miniSectionName
                })),
                entityType: 'project',
                entityId: projectId,
                sectionId: sectionId,
                addedBy: user?._id || clientId
            };

            console.log('Sending labor data to API:', requestData);

            // Use apiClient for authenticated requests
            const response = await apiClient.post('/api/labor', requestData);

            const result = response.data;
            console.log('Labor API response:', result);

            if (result.success) {
                // Log activity for labor addition
                try {
                    console.log('🚀 Starting labor activity logging...');
                    
                    // Import the activity logger
                    const { logLaborAdded } = await import('@/utils/activityLogger');
                    
                    await logLaborAdded(
                        projectId,
                        projectName,
                        sectionId,
                        sectionName,
                        sectionId, // Use sectionId as miniSectionId since we removed mini-sections
                        sectionName, // Use sectionName as miniSectionName
                        laborEntries.map(entry => ({
                            type: entry.type,
                            category: entry.category,
                            count: entry.count,
                            perLaborCost: entry.perLaborCost,
                            totalCost: entry.count * entry.perLaborCost,
                            description: entry.description || '',
                        })),
                        message
                    );
                    
                    console.log('✅ Labor activity logged successfully');
                } catch (activityError: any) {
                    console.error('❌ Failed to log labor activity:', activityError);
                    // Don't fail the main operation if activity logging fails
                }

                // Refresh the labor entries list
                await fetchLaborEntries();
                if (contractorId && userId) {
                    await fetchContractorDetails();
                }

                // Stop loading animation and show success
                stopLoadingAnimation();
                toast.dismiss();
                toast.success(`Labor added successfully`);
                
                // Send simple notification for labor addition
                try {
                    console.log('\n🔔 Sending simple notification for labor addition...');

                    const staffName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Staff Member';
                    const laborCount = laborEntries.length;
                    const totalValue = laborEntries.reduce((sum, entry) => sum + (entry.count * entry.perLaborCost), 0);
                    const descriptions = laborEntries.map(entry => `${entry.type} (${entry.description || ''})`).join(', ');
                    
                    const notificationDetails = `Added ${laborCount} labor ${laborCount === 1 ? 'entry' : 'entries'} worth ₹${totalValue.toLocaleString()}. Work done: ${descriptions}`;
                    
                    const notificationSent = await sendProjectNotification({
                        projectId: projectId,
                        clientId: clientId || undefined,
                        activityType: 'labor_added',
                        staffName: staffName,
                        projectName: projectName,
                        details: notificationDetails,
                        performerId: user?._id,
                        performerRole: user?.role,
                        recipientType: 'admins',
                    });
                    
                    if (notificationSent) {
                        console.log('✅ Labor notification sent successfully');
                    } else {
                        console.warn('⚠️ Labor notification failed to send');
                    }
                } catch (notificationError) {
                    console.error('❌ Labor notification error:', notificationError);
                }
            } else {
                throw new Error(result.message || 'Failed to add labor entries');
            }
            
        } catch (error: any) {
            console.error('Error adding labor entries:', error);
            stopLoadingAnimation();
            toast.dismiss();
            toast.error(error.message || 'Failed to add labor entries');
        }
    };

    // Function to format date for grouping
    const formatDateHeader = (dateString: string): string => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        }
    };

    // Function to group labor entries by date with filtering
    const getGroupedByDate = () => {
        // ✅ Apply mini-section filtering (contractor filtering now happens at API level)
        let filteredEntries = laborEntries;
        
        if (selectedMiniSection && isValidMongoId(selectedMiniSection)) {
            filteredEntries = laborEntries.filter(labor => 
                labor.miniSectionId === selectedMiniSection
            );
            console.log(`🔍 Filtered labor entries for mini-section ${selectedMiniSection}:`, filteredEntries.length);
        }
        
        const grouped: { [date: string]: Labor[] } = {};
        
        filteredEntries.forEach(labor => {
            const dateKey = new Date(labor.date).toDateString();
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(labor);
        });

        return Object.keys(grouped)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
            .map(date => ({
                date,
                laborEntries: grouped[date]
            }));
    };

    // Calculate total cost with filtering
    const getFilteredTotalCost = () => {
        let filteredEntries = laborEntries;
        
        if (selectedMiniSection && isValidMongoId(selectedMiniSection)) {
            filteredEntries = laborEntries.filter(labor => 
                labor.miniSectionId === selectedMiniSection
            );
        }
        
        return filteredEntries.reduce((sum, labor) => sum + labor.totalCost, 0);
    };

    const totalCost = getFilteredTotalCost();

    const formatPrice = (price: number): string => {
        return `₹${price.toLocaleString('en-IN')}`;
    };

    const getSectionName = (sectionId: string | undefined): string => {
        return sectionName || 'Unknown Section';
    };

    // ✅ ADD: Debug effect to monitor miniSections state changes
    useEffect(() => {
        console.log('🔍 LABOR.TSX: miniSections state changed - count:', miniSections.length);
        if (miniSections.length > 0) {
            console.log('📋 Available mini-sections:', miniSections.map(ms => ms.name).join(', '));
            console.log('📋 Mini-section IDs:', miniSections.map(ms => ms._id).join(', '));
        } else {
            console.log('⚠️ No mini-sections available. Checking parameters:');
            console.log('   - sectionId:', sectionId);
            console.log('   - projectId:', projectId);
            console.log('   - sectionId length:', sectionId?.length);
            console.log('   - projectId length:', projectId?.length);
            console.log('   - sectionId type:', typeof sectionId);
            console.log('   - projectId type:', typeof projectId);
        }
    }, [miniSections]);

    // Load data on component mount
    useEffect(() => {
        // Set mounted flag
        isMountedRef.current = true;
        
        // ✅ ADD: Enhanced parameter validation and debugging
        console.log('\n🚀 ========== LABOR.TSX COMPONENT MOUNTED ==========');
        console.log('   - All params:', params);
        console.log('   - projectId:', projectId, '(type:', typeof projectId, ', length:', projectId?.length, ')');
        console.log('   - projectName:', projectName);
        console.log('   - sectionId:', sectionId, '(type:', typeof sectionId, ', length:', sectionId?.length, ')');
        console.log('   - sectionName:', sectionName);
        console.log('   - contractorId:', contractorId);
        console.log('   - userId:', userId);
        console.log('   - sectionId is valid MongoDB ID?', sectionId?.length === 24);
        console.log('   - projectId is valid MongoDB ID?', projectId?.length === 24);
        console.log('🚀 ========== END COMPONENT MOUNT ==========\n');
        
        loadData();
        
        // Cleanup function
        return () => {
            isMountedRef.current = false;
        };
    }, [projectId, sectionId, contractorId, userId]); // Added contractorId and userId as dependencies

    // ✅ ADD: useFocusEffect to refresh mini-sections when page comes into focus
    useFocusEffect(
        useCallback(() => {
            console.log('📱 Labor page focused - triggering mini-section refresh');
            setMiniSectionRefreshTrigger(prev => prev + 1);
            
            // Also refresh contractor details when page comes into focus
            if (contractorId && userId) {
                console.log('🔄 Refreshing contractor details on focus');
                fetchContractorDetails();
            }
        }, [contractorId, userId])
    );
    
    // ✅ COPY EXACT WORKING LOGIC FROM DETAILS.TSX
    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        let isCancelled = false;
        
        const fetchMiniSections = async () => {
            console.log('\n🔍 ========== LABOR.TSX: FETCHING MINI-SECTIONS (ROBUST) ==========');
            console.log('   - SectionId:', sectionId);
            console.log('   - ProjectId:', projectId);
            console.log('   - Function called at:', new Date().toISOString());
            console.log('   - Refresh trigger:', miniSectionRefreshTrigger);
            
            if (!sectionId) {
                console.warn('   ⚠️ No sectionId provided, skipping mini-section fetch');
                console.warn('   ⚠️ This usually means navigation parameters are missing');
                return;
            }
            
            if (sectionId.length !== 24) {
                console.error('   ❌ Invalid sectionId format! Expected 24 characters, got:', sectionId.length);
                console.error('   ❌ SectionId value:', sectionId);
                console.error('   ❌ This usually means the parameter is corrupted or not a MongoDB ObjectId');
                return;
            }

            if (!projectId) {
                console.warn('   ⚠️ No projectId provided, skipping mini-section fetch');
                console.warn('   ⚠️ This usually means navigation parameters are missing');
                return;
            }
            
            if (projectId.length !== 24) {
                console.error('   ❌ Invalid projectId format! Expected 24 characters, got:', projectId.length);
                console.error('   ❌ ProjectId value:', projectId);
                console.error('   ❌ This usually means the parameter is corrupted or not a MongoDB ObjectId');
                return;
            }

            try {
                // ✅ Step 1: Resolve parent section ID aliases (like _id vs sectionId in database)
                let sectionAliases = [sectionId];
                const clientId = await getClientIdFromStorage() || await getClientId();
                if (isCancelled) return;
                
                console.log('   - Using clientId for project lookup:', clientId);
                
                if (clientId && clientId.length === 24) {
                    try {
                        console.log('   - Resolving parent section aliases from project...');
                        const projectRes = await apiClient.get(`/api/project/${projectId}?clientId=${clientId}`);
                        const projectData = projectRes.data?.project || projectRes.data?.data?.project || projectRes.data?.data || projectRes.data;
                        
                        console.log('   - Project data structure:', {
                            hasProject: !!projectData,
                            hasSection: !!(projectData?.section),
                            sectionCount: projectData?.section?.length || 0,
                            sectionTypes: projectData?.section?.map((s: any) => typeof s) || []
                        });
                        
                        if (projectData && projectData.section && Array.isArray(projectData.section)) {
                            const matchedSec = projectData.section.find((sec: any) => 
                                String(sec._id) === String(sectionId) || String(sec.sectionId) === String(sectionId)
                            );
                            if (matchedSec) {
                                console.log('   - Found matching section:', matchedSec.name || 'Unnamed');
                                if (matchedSec._id) sectionAliases.push(String(matchedSec._id));
                                if (matchedSec.sectionId) sectionAliases.push(String(matchedSec.sectionId));
                                sectionAliases = [...new Set(sectionAliases)].filter(id => id && id.length === 24);
                                console.log('   ✅ Resolved parent section ID aliases:', sectionAliases);
                            } else {
                                console.warn('   ⚠️ No matching section found in project data');
                                console.warn('   ⚠️ Available sections:', projectData.section.map((s: any) => ({ _id: s._id, sectionId: s.sectionId, name: s.name })));
                            }
                        } else {
                            console.warn('   ⚠️ Project data does not contain valid sections array');
                        }
                    } catch (aliasError) {
                        console.warn('   ⚠️ Failed to resolve section aliases:', aliasError);
                    }
                } else {
                    console.warn('   ⚠️ No valid clientId available for project lookup');
                }

                // ✅ Step 2: Fetch mini-sections from API for all section ID aliases!
                console.log('   - Fetching mini-sections from API for aliases:', sectionAliases);
                const miniSectionsDataArrays = await Promise.all(
                    sectionAliases.map(async (alias) => {
                        try {
                            console.log(`   - Calling getSection for alias: ${alias}`);
                            const result = await getSection(alias);
                            console.log(`   - getSection result for ${alias}:`, result?.length || 0, 'sections');
                            return result;
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
                                console.log(`   - Added mini-section: ${ms.name} (${ms._id})`);
                            }
                        }
                    }
                }
                
                console.log('   - Combined mini-sections count:', combinedMiniSections.length);

                // ✅ Step 3: Update state with resolved mini-sections
                if (isMountedRef.current && !isCancelled) {
                    setMiniSections(combinedMiniSections);
                    console.log('   ✅ Mini-sections state updated with', combinedMiniSections.length, 'sections');
                    
                    // Load completion status after mini-sections are loaded
                    timeoutId = setTimeout(async () => {
                        if (isMountedRef.current && !isCancelled) {
                            // Note: Labor page doesn't have completion status, so we skip this
                            console.log('   ✅ Mini-sections loaded successfully for labor page');
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
                    console.log('   - Fallback getSection result:', sections?.length || 0, 'sections');
                    if (sections && Array.isArray(sections) && isMountedRef.current && !isCancelled) {
                        setMiniSections(sections);
                        console.log('   ✅ Fallback: Mini-sections state updated with', sections.length, 'sections');
                        
                        // Load completion status
                        timeoutId = setTimeout(async () => {
                            if (isMountedRef.current && !isCancelled) {
                                console.log('   ✅ Fallback mini-sections loaded successfully for labor page');
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

    // ✅ ADD: Debug effect to monitor refresh trigger
    useEffect(() => {
        console.log('🔄 LABOR.TSX: miniSectionRefreshTrigger changed to:', miniSectionRefreshTrigger);
    }, [miniSectionRefreshTrigger]);

    // ✅ Effect to refresh data when component mounts or key params change
    useEffect(() => {
        if (projectId && sectionId) {
            console.log('🔄 LABOR.TSX: Loading data for:', {
                projectId: projectId.slice(-6),
                sectionId: sectionId.slice(-6),
                isContractor: !!(contractorId && userId),
                userId: userId?.slice(-6)
            });
            
            // Load data whenever key parameters change
            fetchLaborEntries();
        }
    }, [projectId, sectionId, contractorId, userId]);

    return (
        <SafeAreaView style={styles.container}>
            {/* ✅ ADD: Parameter validation warning */}
            {(!projectId || !sectionId) && (
                <View style={{
                    backgroundColor: '#FEF2F2',
                    borderColor: '#FECACA',
                    borderWidth: 1,
                    borderRadius: 8,
                    padding: 12,
                    margin: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                }}>
                    <Ionicons name="warning" size={20} color="#DC2626" style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#DC2626', fontWeight: '600', fontSize: 14 }}>
                            Missing Navigation Parameters
                        </Text>
                        <Text style={{ color: '#7F1D1D', fontSize: 12, marginTop: 2 }}>
                            ProjectId: {projectId || 'Missing'} | SectionId: {sectionId || 'Missing'}
                        </Text>
                    </View>
                </View>
            )}
            
            <Header
                selectedSection={null}
                onSectionSelect={() => { }}
                totalCost={totalCost}
                formatPrice={formatPrice}
                getSectionName={getSectionName}
                projectName={projectName || 'Unknown Project'}
                sectionName={`${sectionName || 'Unknown Section'} - Labor`}
                projectId={projectId || ''}
                sectionId={sectionId || ''}
                onShowSectionPrompt={() => { }}
                hideSection={true}
                hideMenu={true}
                onAddContractor={() => setShowLaborForm(true)}
                isAddingContractor={isAddingLabor}
            />

            {/* Mini-Section Selector */}
            <View style={sectionSelectorStyles.sectionSelectorContainer}>
                <Text style={sectionSelectorStyles.sectionSelectorLabel}>
                    Filter by Mini-Section: {miniSections.length > 0 ? `(${miniSections.length} available)` : '(No mini-sections found)'}
                </Text>
                
                <TouchableOpacity
                    style={sectionSelectorStyles.sectionSelectorButton}
                    onPress={() => {
                        if (miniSections.length === 0) {
                            // Force refresh if no mini-sections
                            setMiniSectionRefreshTrigger(prev => prev + 1);
                        }
                        setShowSectionModal(true);
                    }}
                    activeOpacity={0.7}
                >
                    <Text style={sectionSelectorStyles.sectionSelectorButtonText} numberOfLines={1}>
                        {getSelectedSectionName()}
                    </Text>
                    <Ionicons 
                        name="chevron-down" 
                        size={16} 
                        color="#64748B" 
                    />
                </TouchableOpacity>
            </View>

            <LaborFormModal
                visible={showLaborForm}
                onClose={() => setShowLaborForm(false)}
                onSubmit={handleAddLaborEntries}
                projectId={projectId}
                projectName={projectName}
                sectionId={sectionId}
                sectionName={sectionName}
                miniSections={miniSections}
                contractorId={contractorId || undefined}
                contractorType={contractorType || undefined}
                contractorContracts={contractorContracts}
            />

            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Contractor Progress Cards - only shown when user is a contractor */}
                {contractorId && contractorContracts && contractorContracts.length > 0 && (() => {
                    const formatCurrencyLocal = (amount: number) =>
                        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
                    
                    const groupedContracts = groupContractorsByStaff();
                    
                    return Object.entries(groupedContracts).map(([staffId, contractGroup]) => {
                        const isExpanded = expandedContractors.has(staffId);
                        const firstContract = contractGroup[0];
                        const staffName = getStaffDisplayName(firstContract);

                        // Calculate totals for the staff member
                        const totalBudget = contractGroup.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
                        const totalUsed = contractGroup.reduce((sum, c) => sum + (c.usedAmount || 0), 0);
                        const totalPaid = contractGroup.reduce((sum, c) => sum + (c.totalPaid || 0), 0);
                        const totalRemaining = totalBudget - totalUsed;
                        const totalOutstanding = totalUsed - totalPaid;
                        
                        // Check if all contracts are completed
                        const allCompleted = contractGroup.every(c => c.status === 'completed');
                        const allFullyPaid = totalOutstanding <= 0 && totalUsed > 0;

                        return (
                            <View key={staffId} style={contractorProgressStyles.groupContainer}>
                                {/* Staff Header */}
                                <TouchableOpacity
                                    style={contractorProgressStyles.staffHeader}
                                    onPress={() => toggleContractorExpansion(staffId)}
                                    activeOpacity={0.7}
                                >
                                    <View style={contractorProgressStyles.staffHeaderLeft}>
                                        <View style={contractorProgressStyles.avatarContainer}>
                                            <Text style={contractorProgressStyles.avatarText}>
                                                {staffName.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <Text style={contractorProgressStyles.staffName}>{staffName}</Text>
                                                {allCompleted && (
                                                    <View style={[contractorProgressStyles.statusBadge, contractorProgressStyles.statusCompleted]}>
                                                        <Text style={[contractorProgressStyles.statusText, contractorProgressStyles.statusTextCompleted]}>
                                                            COMPLETED
                                                        </Text>
                                                    </View>
                                                )}
                                                {allFullyPaid && (
                                                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                                )}
                                            </View>
                                            <Text style={contractorProgressStyles.contractCount}>
                                                {contractGroup.length} Contract{contractGroup.length > 1 ? 's' : ''} • Total Budget: {formatCurrencyLocal(totalBudget)}
                                            </Text>
                                            {allCompleted && (
                                                <Text style={{ fontSize: 11, color: allFullyPaid ? '#10B981' : '#F59E0B', fontWeight: '600', marginTop: 2 }}>
                                                    {allFullyPaid ? 'All payments completed ✅' : `Outstanding: ${formatCurrencyLocal(totalOutstanding)}`}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                    <View style={contractorProgressStyles.staffHeaderRight}>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={contractorProgressStyles.totalUsedText}>{formatCurrencyLocal(totalUsed)} Used</Text>
                                            <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '600' }}>
                                                {formatCurrencyLocal(totalPaid)} Paid
                                            </Text>
                                            {totalOutstanding > 0 && (
                                                <Text style={{ fontSize: 10, color: '#EF4444', fontWeight: '600' }}>
                                                    {formatCurrencyLocal(totalOutstanding)} Due
                                                </Text>
                                            )}
                                        </View>
                                        <Ionicons 
                                            name={isExpanded ? "chevron-up" : "chevron-down"} 
                                            size={20} 
                                            color="#64748B" 
                                        />
                                    </View>
                                </TouchableOpacity>

                                {/* Expanded Contracts */}
                                {isExpanded && (
                                    <View style={contractorProgressStyles.expandedContracts}>
                                        {contractGroup.map((contract: any, idx: number) => {
                                            const totalAmount = contract.totalAmount || 0;
                                            const usedAmount = contract.usedAmount || 0;
                                            const totalPaid = contract.totalPaid || 0;
                                            const remaining = totalAmount - usedAmount;
                                            const outstandingPayment = usedAmount - totalPaid;
                                            const percentUsed = totalAmount > 0 ? Math.min(100, Math.max(0, (usedAmount / totalAmount) * 100)) : 0;
                                            const percentPaid = usedAmount > 0 ? Math.min(100, Math.max(0, (totalPaid / usedAmount) * 100)) : 0;
                                            
                                            let progressColor = '#10B981';
                                            if (percentUsed > 85) progressColor = '#EF4444';
                                            else if (percentUsed > 60) progressColor = '#F59E0B';

                                            const contractStatus = contract.status || 'active';
                                            const isCompleted = contractStatus === 'completed';
                                            const isFullyPaid = totalPaid >= usedAmount && usedAmount > 0;

                                            return (
                                                <View key={contract._id || idx} style={[contractorProgressStyles.compactCard, { marginBottom: 12 }]}>
                                                    {/* Compact Header with Budget */}
                                                    <View style={contractorProgressStyles.compactHeader}>
                                                        <View style={contractorProgressStyles.compactIconBox}>
                                                            <Ionicons 
                                                                name={isCompleted ? "checkmark-circle" : "wallet-outline"} 
                                                                size={18} 
                                                                color={isCompleted ? "#10B981" : "#3A78B5"} 
                                                            />
                                                        </View>
                                                        <View style={{ flex: 1 }}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                                    <Text style={contractorProgressStyles.compactTitle}>{contract.contractType}</Text>
                                                                    <Text style={contractorProgressStyles.compactBudgetText}>
                                                                        {formatCurrencyLocal(totalAmount)}
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        </View>
                                                    </View>

                                                    {/* Financial Summary - Work Done, Paid, Pending */}
                                                    <View style={contractorProgressStyles.compactFinancialRow}>
                                                        <View style={contractorProgressStyles.compactFinancialItem}>
                                                            <Text style={contractorProgressStyles.compactFinancialLabel}>Work Done</Text>
                                                            <Text style={[contractorProgressStyles.compactFinancialValue, { color: '#F59E0B' }]}>
                                                                {formatCurrencyLocal(usedAmount)}
                                                            </Text>
                                                        </View>
                                                        <View style={contractorProgressStyles.compactDivider} />
                                                        <View style={contractorProgressStyles.compactFinancialItem}>
                                                            <Text style={contractorProgressStyles.compactFinancialLabel}>Paid</Text>
                                                            <Text style={[contractorProgressStyles.compactFinancialValue, { color: '#10B981' }]}>
                                                                {formatCurrencyLocal(totalPaid)}
                                                            </Text>
                                                        </View>
                                                        <View style={contractorProgressStyles.compactDivider} />
                                                        <View style={contractorProgressStyles.compactFinancialItem}>
                                                            <Text style={contractorProgressStyles.compactFinancialLabel}>Pending</Text>
                                                            <Text style={[contractorProgressStyles.compactFinancialValue, { color: outstandingPayment > 0 ? '#DC2626' : '#10B981' }]}>
                                                                {formatCurrencyLocal(Math.max(0, outstandingPayment))}
                                                            </Text>
                                                        </View>
                                                    </View>

                                                    {/* Completion Status */}
                                                    {isCompleted && (
                                                        <View style={contractorProgressStyles.compactCompletionBanner}>
                                                            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                                            <Text style={contractorProgressStyles.compactCompletionText}>
                                                                {isFullyPaid ? 'Contract Completed & Fully Paid' : 'Contract Completed'}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        );
                    });
                })()}

                {/* Labor Entries Display */}
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
                            <Ionicons name="sync" size={48} color="#3A78B5" />
                        </Animated.View>
                        <Text style={styles.noMaterialsTitle}>Loading Labor Entries...</Text>
                        <Text style={styles.noMaterialsDescription}>
                            Please wait while we fetch your data...
                        </Text>
                    </View>
                ) : laborEntries.length > 0 ? (
                    // Display labor entries grouped by date
                    (() => {
                        const groupedByDate = getGroupedByDate();
                        
                        return groupedByDate.map((dateGroup, dateIndex) => (
                            <View key={dateGroup.date} style={dateGroupStyles.dateGroupContainer}>
                                {/* Date Header */}
                                <View style={dateGroupStyles.dateHeader}>
                                    <View style={dateGroupStyles.dateHeaderLeft}>
                                        <Ionicons name="people-outline" size={16} color="#64748B" />
                                        <Text style={dateGroupStyles.materialCountText}>
                                            {dateGroup.laborEntries.length} {dateGroup.laborEntries.length === 1 ? 'Entry' : 'Entries'}
                                        </Text>
                                    </View>
                                    <View style={dateGroupStyles.dateHeaderRight}>
                                        <Text style={dateGroupStyles.dateHeaderText}>
                                            {formatDateHeader(dateGroup.date)}
                                        </Text>
                                        <Ionicons name="calendar-outline" size={16} color="#64748B" />
                                    </View>
                                </View>

                                {/* Labor entries for this date */}
                                {dateGroup.laborEntries.map((labor: Labor, index: number) => (
                                    <LaborCardEnhanced
                                        key={`${dateGroup.date}-${labor._id}-${index}`}
                                        labor={labor}
                                        animation={cardAnimations[dateIndex * 10 + index] || new Animated.Value(1)}
                                        showMiniSectionLabel={true}
                                        miniSections={miniSections}
                                    />
                                ))}
                            </View>
                        ));
                    })()
                ) : (
                    <View style={styles.noMaterialsContainer}>
                        <Ionicons name="people-outline" size={64} color="#CBD5E1" />
                        <Text style={styles.noMaterialsTitle}>
                            {contractorId && userId 
                                ? 'No Labor Entries Found for You' 
                                : 'No Labor Entries Found'
                            }
                        </Text>
                        <Text style={styles.noMaterialsDescription}>
                            {contractorId && userId 
                                ? 'No labor entries found that were added by you. Add some labor entries to get started.'
                                : 'No labor entries found for this section. Add some labor entries to get started.'
                            }
                        </Text>
                    </View>
                )}


            </ScrollView> 

            {/* Section Selection Modal */}
            <Modal
                visible={showSectionModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowSectionModal(false)}
            >
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
                        {/* Header */}
                        <View style={modalStyles.modalHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={modalStyles.modalTitle}>
                                    Select Slab
                                </Text>
                                <Text style={modalStyles.modalSubtitle}>
                                    Filter labor entries by slab
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowSectionModal(false)}
                                style={modalStyles.modalCloseButton}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="close" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Content */}
                        <ScrollView 
                            style={{ flex: 1 }}
                            contentContainerStyle={modalStyles.modalContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* All Sections Option */}
                            <TouchableOpacity
                                style={[
                                    modalStyles.allSectionsOption,
                                    !selectedMiniSection && modalStyles.allSectionsOptionSelected
                                ]}
                                onPress={() => {
                                    handleSectionSelect('all-sections');
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={[
                                    modalStyles.allSectionsIcon,
                                    !selectedMiniSection && modalStyles.allSectionsIconSelected
                                ]}>
                                    <Ionicons 
                                        name="apps-outline" 
                                        size={20} 
                                        color={!selectedMiniSection ? '#FFFFFF' : '#6B7280'} 
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[
                                        modalStyles.allSectionsTitle,
                                        !selectedMiniSection && modalStyles.allSectionsTitleSelected
                                    ]}>
                                        All Sections
                                    </Text>
                                    <Text style={modalStyles.allSectionsDescription}>
                                        Show labor entries from all slabs
                                    </Text>
                                </View>
                                {!selectedMiniSection && (
                                    <Ionicons name="checkmark-circle" size={24} color="#3A78B5" />
                                )}
                            </TouchableOpacity>

                            {/* Mini Sections List */}
                            {miniSections.length > 0 && (
                                <View>
                                    <Text style={modalStyles.miniSectionsHeader}>
                                        Mini-Sections ({miniSections.length})
                                    </Text>

                                    {miniSections.map((section, index) => (
                                        <SwipeableMiniSection
                                            key={section._id}
                                            section={section}
                                            selectedMiniSection={selectedMiniSection}
                                            onSectionSelect={(sectionId) => {
                                                handleSectionSelect(sectionId);
                                            }}
                                        />
                                    ))}
                                </View>
                            )}

                            {/* Empty State */}
                            {miniSections.length === 0 && (
                                <View style={modalStyles.emptyState}>
                                    <View style={modalStyles.emptyStateIcon}>
                                        <Ionicons name="folder-outline" size={32} color="#9CA3AF" />
                                    </View>
                                    <Text style={modalStyles.emptyStateTitle}>
                                        No Slabs Found
                                    </Text>
                                    <Text style={modalStyles.emptyStateDescription}>
                                        No slabs available for this section.
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                    </SafeAreaView>
                </GestureHandlerRootView>
            </Modal> 

            {/* Loading Overlay */}
            {isAddingLabor && (
                <View style={loadingStyles.loadingOverlay}>
                    <View style={loadingStyles.loadingContainer}>
                        <Animated.View
                            style={[
                                loadingStyles.loadingSpinner,
                                {
                                    transform: [
                                        {
                                            rotate: loadingAnimation.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0deg', '360deg'],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        >
                            <Ionicons name="people-circle" size={48} color="#3A78B5" />
                        </Animated.View>
                        <Text style={loadingStyles.loadingTitle}>Adding Labor Entries</Text>
                        <Text style={loadingStyles.loadingSubtitle}>Please wait while we process your request...</Text>
                        
                        {/* Progress dots animation */}
                        <View style={loadingStyles.dotsContainer}>
                            <Animated.View
                                style={[
                                    loadingStyles.dot,
                                    {
                                        opacity: loadingAnimation.interpolate({
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
                                        opacity: loadingAnimation.interpolate({
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
                                        opacity: loadingAnimation.interpolate({
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

const dateGroupStyles = StyleSheet.create({
    dateGroupContainer: {
        marginBottom: 16,
    },
    dateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    dateHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    materialCountText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    dateHeaderText: {
        fontSize: 13,
        color: '#1E293B',
        fontWeight: '600',
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
        backgroundColor: '#3A78B5',
    },
});

// Section Selector Styles
const sectionSelectorStyles = StyleSheet.create({
    sectionSelectorContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    sectionSelectorLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    sectionSelectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 12 : 10,
        backgroundColor: '#FFFFFF',
        borderRadius: Platform.OS === 'ios' ? 8 : 6,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        minHeight: Platform.OS === 'ios' ? 44 : 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    sectionSelectorButtonText: {
        flex: 1,
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '500',
        marginRight: 8,
    },
});

// Modal Styles
const modalStyles = StyleSheet.create({
    modalHeader: {
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
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    modalCloseButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    modalContent: {
        padding: 20,
        paddingBottom: 40,
    },
    allSectionsOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    allSectionsOptionSelected: {
        backgroundColor: '#EAF0FE',
        borderWidth: 2,
        borderColor: '#3A78B5',
    },
    allSectionsIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    allSectionsIconSelected: {
        backgroundColor: '#3A78B5',
    },
    allSectionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 2,
    },
    allSectionsTitleSelected: {
        color: '#3A78B5',
    },
    allSectionsDescription: {
        fontSize: 14,
        color: '#6B7280',
    },
    miniSectionsHeader: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 16,
        marginTop: 8,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyStateIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    emptyStateDescription: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
});

const contractorProgressStyles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: '#C4D8FC',
        shadowColor: '#3A78B5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconBox: {
        width: 40,
        height: 40,
        backgroundColor: '#EBF5FF',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },
    remaining: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'right',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 8,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: 0.6,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    progressTrack: {
        flex: 1,
        height: 8,
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
        minWidth: 52,
        textAlign: 'right',
    },
    
    // Status Badge Styles
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusActive: {
        backgroundColor: '#DCFCE7',
    },
    statusCompleted: {
        backgroundColor: '#E0E7FF',
    },
    statusText: {
        fontSize: 9,
        fontWeight: '700',
    },
    statusTextActive: {
        color: '#15803D',
    },
    statusTextCompleted: {
        color: '#4338CA',
    },
    
    // Completion Banner Styles
    completionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    completionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#065F46',
        flex: 1,
    },
    
    // ── Grouped Contractor Styles ────────────────────────────────────
    groupContainer: {
        marginBottom: 16,
        marginHorizontal: 16,
    },
    staffHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#C4D8FC',
        elevation: 2,
        shadowColor: '#3A78B5',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    staffHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    staffHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    avatarContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EAF0FE',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2563EB',
    },
    staffName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
    },
    contractCount: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    totalUsedText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#F59E0B',
    },
    expandedContracts: {
        marginTop: 8,
        paddingLeft: 8,
    },
    groupedCard: {
        marginHorizontal: 0,
        marginLeft: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#3A78B5',
    },
    
    // ── Compact Card Styles ────────────────────────────────────
    compactCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    compactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    compactIconBox: {
        width: 36,
        height: 36,
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    compactTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    compactBudgetText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    compactStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    compactStatusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    compactFinancialRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    compactFinancialItem: {
        flex: 1,
        alignItems: 'center',
    },
    compactFinancialLabel: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 2,
    },
    compactFinancialValue: {
        fontSize: 13,
        fontWeight: '600',
    },
    compactDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 8,
    },
    compactCompletionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        borderRadius: 8,
        padding: 8,
        marginTop: 8,
        gap: 6,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    compactCompletionText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#15803D',
        flex: 1,
    },
});

export default LaborPage;