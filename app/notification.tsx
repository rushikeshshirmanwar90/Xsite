import { getClientId } from '@/functions/clientId';
import { domain } from '@/lib/domain';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '@/utils/axiosConfig';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PDFReportGenerator } from '@/utils/pdfReportGenerator';

interface Activity {
    _id: string;
    user: {
        userId: string;
        fullName: string;
        email?: string;
    };
    projectName?: string;
    sectionName?: string;
    miniSectionName?: string;
    activityType: string;
    category: string;
    action: string;
    description: string;
    message?: string;
    createdAt: string;
    metadata?: {
        changedData?: Array<{
            field: string;
            oldValue: any;
            newValue: any;
        }>;
    };
}

interface MaterialActivity {
    _id: string;
    user: {
        userId: string;
        fullName: string;
    };
    projectId: string;
    projectName?: string;
    sectionName?: string;
    miniSectionName?: string;
    materials: {
        name: string;
        unit: string;
        specs?: Record<string, any>;
        qnt: number;
        cost: number;
        contractor_name?: string;
    }[];
    message?: string;
    activity: 'imported' | 'used' | 'transferred';
    createdAt?: string;
    date?: string;
    transferDetails?: {
        fromProject: { id: string; name: string };
        toProject: { id: string; name: string };
    };
    contractor_name?: string;
}

interface OtherCostActivity {
    _id: string;
    user: {
        userId: string;
        fullName: string;
    };
    projectId: string;
    projectName?: string;
    sectionName?: string;
    miniSectionName?: string;
    otherCosts: {
        name: string;
        category: string;
        quantity: number;
        unit: string;
        unitCost: number;
        totalCost: number;
        status: string;
    }[];
    message?: string;
    activity: 'added' | 'updated' | 'approved';
    createdAt?: string;
    date?: string;
}

type TabType = 'all' | 'project' | 'material' | 'labor' | 'other_cost';
type MaterialSubTab = 'all' | 'imported' | 'used' | 'transferred';

const NotificationPage: React.FC = () => {
    console.log('🏗️ NotificationPage component rendering/re-rendering');

    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [materialSubTab, setMaterialSubTab] = useState<MaterialSubTab>('all');
    const [activitiesRaw, setActivitiesRaw] = useState<Activity[]>(() => {
        console.log('🎬 Initializing activities state to empty array');
        return [];
    });

    // ✅ NEW: Vendor filter state - Changed to array for multiple selection
    const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
    const [showVendorModal, setShowVendorModal] = useState(false);
    const [availableVendors, setAvailableVendors] = useState<string[]>([]);

    // SAFETY: Ensure activities is always an array, even if state gets corrupted
    const activities = React.useMemo(() => {
        console.log('🔍 Processing activities state:', activitiesRaw);
        console.log('   - Type:', typeof activitiesRaw);
        console.log('   - Is array?', Array.isArray(activitiesRaw));

        // If activitiesRaw is already an array, return it
        if (Array.isArray(activitiesRaw)) {
            return activitiesRaw;
        }

        // If activitiesRaw is the API response object (has 'activities' property), extract it
        if (activitiesRaw && typeof activitiesRaw === 'object') {
            const anyActivities = activitiesRaw as any;

            // Try different possible response structures
            if (anyActivities.data?.activities && Array.isArray(anyActivities.data.activities)) {
                console.log('   ⚠️ WARNING: State contains nested API response, extracting activities array');
                return anyActivities.data.activities as Activity[];
            }

            if (anyActivities.activities && Array.isArray(anyActivities.activities)) {
                console.log('   ⚠️ WARNING: State contains API response object, extracting activities array');
                return anyActivities.activities as Activity[];
            }

            if (anyActivities.data && Array.isArray(anyActivities.data)) {
                console.log('   ⚠️ WARNING: State contains data array, extracting it');
                return anyActivities.data as Activity[];
            }
        }

        // Fallback to empty array
        console.log('   ⚠️ WARNING: State is not an array, returning empty array');
        return [];
    }, [activitiesRaw]);
    const [materialActivities, setMaterialActivities] = useState<MaterialActivity[]>([]);
    const [otherCostActivities, setOtherCostActivities] = useState<OtherCostActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Performance optimization
    const isLoadingRef = React.useRef(false);
    const lastLoadTimeRef = React.useRef<number>(0);
    const DEBOUNCE_DELAY = 500;
    const [currentUser, setCurrentUser] = useState<{ userId: string; fullName: string } | null>(null);
    const [clientData, setClientData] = useState<any>({});
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    // Animation
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    // ScrollView reference for scroll-to-top functionality
    const scrollViewRef = useRef<ScrollView>(null);

    // Get current user data from AsyncStorage
    const getCurrentUser = async () => {
        try {
            const userDetailsString = await AsyncStorage.getItem("user");
            if (userDetailsString) {
                const userData = JSON.parse(userDetailsString);

                // Build full name from firstName and lastName
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

                // ✅ FIX: userId must only ever be the user's own _id — never the org clientId
                const user = {
                    userId: userData._id?.toString() || userData.id?.toString() || 'unknown',
                    fullName: fullName,
                };

                console.log('📝 Current User Loaded:', user);
                setCurrentUser(user);
                return user;
            }
        } catch (error) {
            console.error('Error getting user data:', error);
        }
        return null;
    };

    const fetchClientData = async () => {
        try {
            const clientId = await getClientId();
            if (clientId) {
                const res = await apiClient.get(`/api/client/details?clientId=${clientId}`);
                if (res.data && res.data.success) {
                    setClientData(res.data.data);
                }
            }
        } catch (error) {
            console.error('Error fetching client data:', error);
        }
    };

    // Load current user on mount
    useEffect(() => {
        getCurrentUser();
        fetchClientData();
    }, []);

    // State for date-based pagination
    const [dateGroups, setDateGroups] = useState<{ date: string, activities: any[], count: number }[]>([]);
    const [hasMoreDates, setHasMoreDates] = useState(false);
    const [nextDate, setNextDate] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    // Date-based navigation state
    const [currentDate, setCurrentDate] = useState<string>(() => {
        // Always start with today's date
        return new Date().toLocaleDateString('en-CA');
    });
    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [hasNextDate, setHasNextDate] = useState(false);
    const [hasPrevDate, setHasPrevDate] = useState(false);

    // Date picker state
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const fetchActivities = async (showLoadingState = true, loadMore = false, targetDate?: string) => {
        console.log('🚀 fetchActivities CALLED');
        console.log('   - targetDate:', targetDate);
        console.log('   - currentDate:', currentDate);

        // Prevent duplicate calls
        if (isLoadingRef.current) {
            console.log('⏸️ Skipping fetch - already loading');
            return;
        }

        // Debounce
        const now = Date.now();
        const timeSinceLastLoad = now - lastLoadTimeRef.current;

        if (timeSinceLastLoad < DEBOUNCE_DELAY && lastLoadTimeRef.current > 0 && !loadMore) {
            console.log('⏸️ Skipping fetch - debounced');
            return;
        }
        lastLoadTimeRef.current = now;

        console.log('✅ Proceeding with fetch...');

        try {
            isLoadingRef.current = true;
            if (showLoadingState && !loadMore) {
                setLoading(true);
            }
            if (loadMore) {
                setLoadingMore(true);
            }
            setError(null);

            const clientId = await getClientId();
            console.log('Client ID:', clientId);

            if (!clientId) {
                console.error('❌ CRITICAL: Client ID not found!');
                throw new Error('Client ID not found - user may not be logged in');
            }

            console.log('✅ Client ID is valid, proceeding with API calls...');

            // Date-based navigation - fetch activities for specific date
            const dateToFetch = targetDate || currentDate;
            // If contractor filter is active, do NOT filter by date on the backend so we fetch all materials!
            const shouldFilterByDate = selectedVendors.length === 0;

            // Simplified API parameters - the API doesn't support date-based pagination
            const activityParams = new URLSearchParams({
                clientId,
                ...(shouldFilterByDate && targetDate && { targetDate: dateToFetch }) // Only add targetDate if specified
            });

            const materialParams = new URLSearchParams({
                clientId,
                ...(shouldFilterByDate && targetDate && { targetDate: dateToFetch }) // Only add targetDate if specified
            });

            const otherCostParams = new URLSearchParams({
                clientId,
                ...(shouldFilterByDate && targetDate && { targetDate: dateToFetch }) // Only add targetDate if specified
            });

            console.log('📅 Date-based navigation - fetching for date:', dateToFetch);

            console.log('API URLs:');
            console.log('  - Activity:', `${domain}/api/activity?${activityParams.toString()}`);
            console.log('  - Material Activity:', `${domain}/api/materialActivity?${materialParams.toString()}`);
            console.log('  - Other Cost Activity:', `${domain}/api/otherCostActivity?${otherCostParams.toString()}`);

            // Fetch all activities in parallel with enhanced error handling
            const [activityRes, materialActivityRes, otherCostActivityRes] = await Promise.all([
                apiClient.get(`/api/activity?${activityParams.toString()}`)
                    .catch((err) => {
                        console.error('❌ Activity API Error Details:');
                        console.error('   - URL:', `${domain}/api/activity?${activityParams.toString()}`);
                        console.error('   - Status:', err?.response?.status);
                        console.error('   - Status Text:', err?.response?.statusText);
                        console.error('   - Response Data:', err?.response?.data);
                        console.error('   - Error Message:', err.message);
                        console.error('   - Error Code:', err.code);
                        // Return structure that matches successful response but indicates failure
                        return {
                            data: {
                                success: false,
                                error: err?.response?.data?.message || err.message,
                                data: { dateGroups: [], hasMoreDates: false, nextDate: null }
                            }
                        };
                    }),
                apiClient.get(`/api/materialActivity?${materialParams.toString()}`)
                    .catch((err) => {
                        console.error('❌ Material Activity API Error Details:');
                        console.error('   - URL:', `${domain}/api/materialActivity?${materialParams.toString()}`);
                        console.error('   - Status:', err?.response?.status);
                        console.error('   - Status Text:', err?.response?.statusText);
                        console.error('   - Response Data:', err?.response?.data);
                        console.error('   - Error Message:', err.message);
                        console.error('   - Error Code:', err.code);
                        // Return structure that matches successful response but indicates failure
                        return {
                            data: {
                                success: false,
                                error: err?.response?.data?.message || err.message,
                                data: { dateGroups: [], hasMoreDates: false, nextDate: null }
                            }
                        };
                    }),
                apiClient.get(`/api/otherCostActivity?${otherCostParams.toString()}`)
                    .catch((err) => {
                        console.error('❌ Other Cost Activity API Error Details:');
                        console.error('   - URL:', `${domain}/api/otherCostActivity?${otherCostParams.toString()}`);
                        console.error('   - Status:', err?.response?.status);
                        console.error('   - Status Text:', err?.response?.statusText);
                        console.error('   - Response Data:', err?.response?.data);
                        console.error('   - Error Message:', err.message);
                        console.error('   - Error Code:', err.code);
                        // Return structure that matches successful response but indicates failure
                        return {
                            data: {
                                success: false,
                                error: err?.response?.data?.message || err.message,
                                data: { dateGroups: [], hasMoreDates: false, nextDate: null }
                            }
                        };
                    }),
            ]);

            console.log('\n--- API RESPONSES ---');
            console.log('Activity Response Success:', activityRes.data.success !== false);
            console.log('Material Activity Response Success:', materialActivityRes.data.success !== false);

            // DEBUG: Log full response structure
            console.log('\n--- FULL API RESPONSE DEBUG ---');
            console.log('Activity Response Structure:');
            console.log('  - Status:', (activityRes as any).status);
            console.log('  - Data keys:', Object.keys(activityRes.data || {}));
            console.log('  - Success field:', activityRes.data.success);
            console.log('  - Message field:', (activityRes.data as any).message);
            console.log('  - Data field keys:', Object.keys(activityRes.data.data || {}));

            console.log('Material Activity Response Structure:');
            console.log('  - Status:', (materialActivityRes as any).status);
            console.log('  - Data keys:', Object.keys(materialActivityRes.data || {}));
            console.log('  - Success field:', materialActivityRes.data.success);
            console.log('  - Message field:', (materialActivityRes.data as any).message);
            console.log('  - Data field keys:', Object.keys(materialActivityRes.data.data || {}));

            // Check if both APIs failed
            if ((activityRes.data as any).success === false && (materialActivityRes.data as any).success === false) {
                console.error('❌ Both APIs failed, throwing error');
                throw new Error(`API Error - Activity: ${(activityRes.data as any).error}, Material: ${(materialActivityRes.data as any).error}`);
            }

            const activityData = activityRes.data as any;
            const materialData = materialActivityRes.data as any;
            const otherCostData = otherCostActivityRes.data as any;

            // Handle actual API response format - activities are returned directly
            const activityList = (activityData.success !== false)
                ? (activityData.data?.activities || activityData.activities || [])
                : [];
            const materialList = (materialData.success !== false)
                ? (materialData.data?.activities || materialData.activities || [])
                : [];
            const otherCostList = (otherCostData.success !== false)
                ? (otherCostData.data?.activities || otherCostData.activities || [])
                : [];

            console.log('\n--- ACTIVITY DATA ---');
            console.log('Target Date:', targetDate || currentDate);
            console.log('Activity List Length:', activityList.length);
            console.log('Material List Length:', materialList.length);

            // DEBUG: Log the actual activities content
            console.log('\n--- ACTIVITIES CONTENT DEBUG ---');
            console.log('Activity List Sample:');
            activityList.slice(0, 5).forEach((activity: any, index: number) => {
                console.log(`  Activity ${index + 1}: Category=${activity.category}, Action=${activity.action}, Date=${activity.date}, Description=${activity.description?.substring(0, 50)}...`);
            });
            console.log('Material List Sample:');
            materialList.slice(0, 3).forEach((material: any, index: number) => {
                console.log(`  Material ${index + 1}: Activity=${material.activity}, Date=${material.date || material.createdAt}`);
            });

            // DEBUG: Check what categories exist in the activities
            const categories = [...new Set(activityList.map((a: any) => a.category))];
            console.log('📊 Available activity categories:', categories);

            // Get available dates for navigation - extract unique dates from activities
            const activityDates = activityList.map((activity: any) => {
                const rawDate = activity.date || activity.createdAt;
                return rawDate ? new Date(rawDate).toLocaleDateString('en-CA') : null;
            }).filter(Boolean);

            const materialDates = materialList.map((material: any) => {
                const rawDate = material.date || material.createdAt;
                return rawDate ? new Date(rawDate).toLocaleDateString('en-CA') : null;
            }).filter(Boolean);

            const otherCostDates = otherCostList.map((otherCost: any) => {
                const rawDate = otherCost.date || otherCost.createdAt;
                return rawDate ? new Date(rawDate).toLocaleDateString('en-CA') : null;
            }).filter(Boolean);

            // Merge and sort all available dates
            const allAvailableDates = [...new Set([...activityDates, ...materialDates, ...otherCostDates])].sort((a, b) => b.localeCompare(a));
            setAvailableDates(allAvailableDates);

            // Update current date if targetDate was provided
            const finalDateToUse = targetDate || currentDate;
            if (targetDate) {
                setCurrentDate(targetDate);
            }

            // Check if there are previous/next dates available using the actual date being used
            // For navigation, we should allow going to any date, not just dates with activities
            const today = new Date().toLocaleDateString('en-CA');
            const [year, month, day] = finalDateToUse.split('-').map(Number);
            const currentDateObj = new Date(year, month - 1, day);
            const todayObj = new Date(today);

            // Allow navigation to previous dates (older dates)
            setHasPrevDate(true); // Always allow going to previous dates

            // Only allow navigation to future dates if there are activities on future dates, or if we're not on today
            if (finalDateToUse === today) {
                // If we're on today, only allow next if there are future dates with activities
                const futureDatesWithActivities = allAvailableDates.filter(date => date > today);
                setHasNextDate(futureDatesWithActivities.length > 0);
            } else if (finalDateToUse < today) {
                // If we're on a past date, allow going to more recent dates (including today)
                setHasNextDate(true);
            } else {
                // If we're somehow on a future date, allow going back
                setHasNextDate(false);
            }

            console.log('📅 Date Navigation State:');
            console.log('   - Final Date Used:', finalDateToUse);
            console.log('   - Today:', today);
            console.log('   - Available Dates:', allAvailableDates.length);
            console.log('   - Has Previous Date:', true);
            console.log('   - Has Next Date:', finalDateToUse < today);
            console.log('   - Available Dates Array:', allAvailableDates);

            // ✅ FIX: Filter activities for the target date using local timezone
            // Convert stored UTC timestamp to device's local date for comparison
            // If contractor filter is active, skip single-day client-side filtering to show all materials!
            const skipDayFilter = selectedVendors.length > 0;

            const filteredActivities = skipDayFilter
                ? activityList
                : activityList.filter((activity: any) => {
                    const rawDate = activity.date || activity.createdAt;
                    if (!rawDate) return false;
                    // 'en-CA' locale gives YYYY-MM-DD format — works for any timezone
                    const activityLocalDate = new Date(rawDate).toLocaleDateString('en-CA');
                    return activityLocalDate === finalDateToUse;
                });

            const filteredMaterials = skipDayFilter
                ? materialList
                : materialList.filter((material: any) => {
                    const rawDate = material.date || material.createdAt;
                    if (!rawDate) return false;
                    const materialLocalDate = new Date(rawDate).toLocaleDateString('en-CA');
                    return materialLocalDate === finalDateToUse;
                });

            // If contractor filter is active, hide non-material activities (other costs have no vendor)
            const filteredOtherCosts = skipDayFilter
                ? []
                : otherCostList.filter((otherCost: any) => {
                    const rawDate = otherCost.date || otherCost.createdAt;
                    if (!rawDate) return false;
                    const otherCostLocalDate = new Date(rawDate).toLocaleDateString('en-CA');
                    return otherCostLocalDate === finalDateToUse;
                });

            // If no activities found for current date, show empty state but keep navigation
            if (filteredActivities.length === 0 && filteredMaterials.length === 0 && filteredOtherCosts.length === 0) {
                console.log('📭 No activities found for date:', finalDateToUse);
                setDateGroups([]);
                setActivitiesRaw([]);
                setMaterialActivities([]);
                setOtherCostActivities([]);
                return;
            }

            // Create date groups from filtered activities
            const allDateGroups: { [date: string]: any[] } = {};

            // Add filtered activities
            filteredActivities.forEach((activity: any) => {
                const rawDate = activity.date || activity.createdAt;
                const activityDate = new Date(rawDate).toLocaleDateString('en-CA');
                if (!allDateGroups[activityDate]) {
                    allDateGroups[activityDate] = [];
                }
                allDateGroups[activityDate].push({ type: 'activity', data: activity, timestamp: activity.createdAt || activity.date });
            });

            // Add filtered materials
            filteredMaterials.forEach((material: any) => {
                const rawDate = material.date || material.createdAt;
                const materialDate = rawDate ? new Date(rawDate).toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA');
                const timestamp = material.date || material.createdAt || new Date().toISOString();
                if (!allDateGroups[materialDate]) {
                    allDateGroups[materialDate] = [];
                }
                allDateGroups[materialDate].push({ type: 'material', data: material, timestamp });
            });

            // Add filtered other costs
            filteredOtherCosts.forEach((otherCost: any) => {
                const rawDate = otherCost.date || otherCost.createdAt;
                const otherCostDate = rawDate ? new Date(rawDate).toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA');
                const timestamp = otherCost.date || otherCost.createdAt || new Date().toISOString();
                if (!allDateGroups[otherCostDate]) {
                    allDateGroups[otherCostDate] = [];
                }
                allDateGroups[otherCostDate].push({ type: 'other_cost', data: otherCost, timestamp });
            });

            // Convert to sorted array (should only be one date)
            const sortedDates = Object.keys(allDateGroups).sort((a, b) => b.localeCompare(a));
            const newDateGroups = sortedDates.map(date => ({
                date,
                activities: allDateGroups[date].sort((a, b) =>
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                ),
                count: allDateGroups[date].length
            }));

            // Always replace date groups for single date navigation
            setDateGroups(newDateGroups);

            // Also update legacy state for backward compatibility
            setActivitiesRaw(filteredActivities);
            setMaterialActivities(filteredMaterials);
            setOtherCostActivities(filteredOtherCosts);

            // ✅ NEW: Fetch all available contractors for this client asynchronously
            apiClient.get(`/api/materialActivity/contractors?clientId=${clientId}`)
                .then(res => {
                    console.log('📋 Fetched all unique contractors:', res.data);
                    if (res.data && res.data.success !== false) {
                        const contractors = res.data.data || [];
                        setAvailableVendors(contractors);
                    }
                })
                .catch(err => {
                    // Handle 404 gracefully - it just means no contractors exist for this client yet
                    if (err.response?.status === 404) {
                        console.log('📝 No contractors found for this client');
                        setAvailableVendors([]);
                    } else {
                        console.error('⚠️ Failed to fetch unique contractors:', err);
                    }
                });

            console.log('✅ Date navigation state updated');
            console.log('   - Date Groups:', newDateGroups.length);
            console.log('   - Activities:', filteredActivities.length);
            console.log('   - Materials:', filteredMaterials.length);

            // Update pagination state - handle nested data structure
            const hasMoreFromActivity = activityData.data?.hasMoreDates || activityData.hasMoreDates || false;
            const hasMoreFromMaterial = materialData.data?.hasMoreDates || materialData.hasMoreDates || false;
            const nextFromActivity = activityData.data?.nextDate || activityData.nextDate;
            const nextFromMaterial = materialData.data?.nextDate || materialData.nextDate;

            setHasMoreDates(hasMoreFromActivity || hasMoreFromMaterial);

            // Use the earliest next date
            let earliestNextDate = null;
            if (nextFromActivity && nextFromMaterial) {
                earliestNextDate = nextFromActivity < nextFromMaterial ? nextFromActivity : nextFromMaterial;
            } else if (nextFromActivity) {
                earliestNextDate = nextFromActivity;
            } else if (nextFromMaterial) {
                earliestNextDate = nextFromMaterial;
            }
            setNextDate(earliestNextDate);

            console.log('✅ Date-based pagination state updated');
            console.log('   - Date Groups:', newDateGroups.length);
            console.log('   - Has More:', hasMoreFromActivity || hasMoreFromMaterial);
            console.log('   - Next Date:', earliestNextDate);

        } catch (error) {
            console.error('Error fetching activities:', error);
            setError('Failed to load activities');
            // Ensure arrays are initialized even on error
            if (!loadMore) {
                setActivitiesRaw([]);
                setMaterialActivities([]);
                setOtherCostActivities([]);
                setDateGroups([]);
                setHasMoreDates(false);
                setNextDate(null);
            }
        } finally {
            isLoadingRef.current = false;
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // ✅ FIX: Guard to prevent double useEffect on mount
    const isMountedRef = React.useRef(false);

    // Effect 1 — initial load only
    useEffect(() => {
        console.log('📱 NotificationPage mounted - calling fetchActivities()');
        isMountedRef.current = true;
        // For initial load, don't specify a target date - let the function determine the best starting date
        fetchActivities();
    }, []);

    // Effect 2 — fires on activeTab, materialSubTab, or selectedVendors change
    useEffect(() => {
        if (!isMountedRef.current) return; // ✅ Skip the initial render
        console.log('🔄 Tab or Filters changed - fetching activities');
        // If a contractor filter is active, we don't pass targetDate to fetch everything!
        const targetDateToPass = selectedVendors.length > 0 ? undefined : currentDate;
        fetchActivities(true, false, targetDateToPass);
    }, [activeTab, materialSubTab, selectedVendors]);

    // Date navigation functions
    const handlePreviousDay = async () => {
        if (hasPrevDate && !loading) {
            // Go to previous day (yesterday)
            const [year, month, day] = currentDate.split('-').map(Number);
            const currentDateObj = new Date(year, month - 1, day);
            currentDateObj.setDate(currentDateObj.getDate() - 1);
            const previousDate = currentDateObj.toLocaleDateString('en-CA');

            console.log('📅 Navigating to previous day:', previousDate);

            // Set loading state
            setLoading(true);

            try {
                await fetchActivities(false, false, previousDate);

                // Scroll to top AFTER content has loaded
                setTimeout(() => {
                    scrollViewRef.current?.scrollTo({
                        y: 0,
                        animated: true,
                    });
                }, 100); // Small delay to ensure content is rendered
            } finally {
                // Loading state will be cleared in fetchActivities finally block
            }
        }
    };

    const handleNextDay = async () => {
        if (hasNextDate && !loading) {
            // Go to next day (tomorrow, but not beyond today)
            const [year, month, day] = currentDate.split('-').map(Number);
            const currentDateObj = new Date(year, month - 1, day);
            currentDateObj.setDate(currentDateObj.getDate() + 1);
            const nextDate = currentDateObj.toLocaleDateString('en-CA');

            console.log('📅 Navigating to next day:', nextDate);

            // Set loading state
            setLoading(true);

            try {
                await fetchActivities(false, false, nextDate);

                // Scroll to top AFTER content has loaded
                setTimeout(() => {
                    scrollViewRef.current?.scrollTo({
                        y: 0,
                        animated: true,
                    });
                }, 100); // Small delay to ensure content is rendered
            } finally {
                // Loading state will be cleared in fetchActivities finally block
            }
        }
    };

    // Handle date picker
    const handleDatePickerOpen = () => {
        // Set the picker to current viewing date
        const dateObj = new Date(currentDate + 'T00:00:00');
        setSelectedDate(dateObj);
        setShowDatePicker(true);
    };

    const handleDateChange = (event: any, date?: Date) => {
        if (event.type === 'dismissed') {
            setShowDatePicker(false);
            return;
        }

        if (date) {
            setSelectedDate(date);
            // On Android, picker closes automatically after selection
            if (event.type === 'set') {
                const dateString = date.toLocaleDateString('en-CA');
                console.log('📅 Date selected from picker:', dateString);
                setShowDatePicker(false);

                // Fetch activities for selected date
                setLoading(true);
                fetchActivities(false, false, dateString).finally(() => {
                    // Scroll to top after loading
                    setTimeout(() => {
                        scrollViewRef.current?.scrollTo({
                            y: 0,
                            animated: true,
                        });
                    }, 100);
                });
            }
        }
    };

    const handleLoadMore = async () => {
        // In date navigation mode, load more means go to previous day
        await handlePreviousDay();
    };

    const onRefresh = async () => {
        if (refreshing || isLoadingRef.current) {
            return;
        }

        setRefreshing(true);
        try {
            // For date mode, refresh current date
            await fetchActivities(false, false, currentDate);
        } finally {
            setRefreshing(false);
        }
    };

    const generateVendorReport = async () => {
        if (selectedVendors.length === 0) return;
        setIsGeneratingReport(true);
        try {
            // Apply exactly the same filters as the UI
            let filtered = materialActivities;
            if (materialSubTab !== 'all') {
                filtered = filtered.filter(m => m.activity === materialSubTab);
            }
            // Vendor filter — keep only imported activities for the selected vendors
            filtered = filtered.filter(m =>
                m.activity === 'imported' &&
                selectedVendors.includes(m.contractor_name || '')
            );

            if (filtered.length === 0) {
                alert('No imported materials found for the selected vendor(s) to generate a report.');
                return;
            }

            const pdfGenerator = new PDFReportGenerator(clientData, currentUser);
            // Use the new vendor-focused PDF generator
            await pdfGenerator.generateVendorPDF(filtered, selectedVendors);

        } catch (error) {
            console.error('Failed to generate vendor report:', error);
            alert('Failed to generate report. Please try again.');
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const getActivityIcon = (type: string, category: string) => {
        if (category === 'project') return { name: 'folder', color: '#3A78B5' };
        if (category === 'section') return { name: 'layers', color: '#3A78B5' };
        if (category === 'mini_section') return { name: 'grid', color: '#10B981' };
        if (category === 'phase') return { name: 'git-branch', color: '#1E293B' };
        if (category === 'staff') return { name: 'people', color: '#EF4444' };
        if (category === 'labor') return { name: 'hammer', color: '#F59E0B' };
        if (category === 'material') return { name: 'cube', color: '#06B6D4' };
        if (category === 'equipment') return { name: 'construct', color: '#3A78B5' };
        if (category === 'other_cost') return { name: 'briefcase', color: '#3A78B5' };
        return { name: 'information-circle', color: '#6B7280' };
    };

    const getMaterialActivityIcon = (activity: 'imported' | 'used' | 'transferred') => {
        if (activity === 'imported') return { name: 'download', color: '#10B981' };
        if (activity === 'used') return { name: 'arrow-forward', color: '#EF4444' };
        return { name: 'swap-horizontal', color: '#3A78B5' }; // For transferred
    };

    const formatTimeAgo = (dateString: string | undefined | null) => {
        try {
            // Handle empty/null/undefined
            if (!dateString) {
                console.warn('Empty date string provided to formatTimeAgo');
                return 'Recently';
            }

            const date = new Date(dateString);

            // Check if date is valid
            if (isNaN(date.getTime())) {
                console.warn('Invalid date string:', dateString, 'Type:', typeof dateString);
                return 'Recently';
            }

            const now = new Date();
            const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

            // Handle future dates (shouldn't happen, but just in case)
            if (seconds < 0) {
                console.warn('Future date detected:', dateString);
                return 'Just now';
            }

            if (seconds < 60) return 'Just now';
            if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
            if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
            if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', dateString, error);
            return 'Recently';
        }
    };

    const renderActivityItem = (activity: Activity) => {
        const icon = getActivityIcon(activity.activityType, activity.category);

        const displayUser = activity.user?.fullName && activity.user.fullName !== 'Unknown User'
            ? activity.user
            : currentUser || { userId: 'unknown', fullName: 'Unknown User' };

        // Check if this is a labor or equipment activity
        const isLaborActivity = activity.category === 'labor';
        const isEquipmentActivity = activity.category === 'equipment';
        const isPhaseActivity = activity.category === 'phase';

        // Enhanced message for project updates with change details
        let enhancedMessage = activity.message;
        if (activity.activityType === 'project_updated' && activity.metadata?.changedData) {
            const changes = activity.metadata.changedData;
            if (Array.isArray(changes) && changes.length > 0) {
                const changeDetails = changes.map((change: any) => {
                    switch (change.field) {
                        case 'name':
                            return `Name: "${change.oldValue}" → "${change.newValue}"`;
                        case 'budget':
                            return `Budget: ₹${Number(change.oldValue).toLocaleString('en-IN')} → ₹${Number(change.newValue).toLocaleString('en-IN')}`;
                        case 'address':
                            return `Address updated`;
                        case 'description':
                            return `Description updated`;
                        default:
                            return `${change.field} changed`;
                    }
                }).join(' • ');

                enhancedMessage = `Changes: ${changeDetails}`;
            }
        }

        // Render labor/equipment activities with enhanced card design
        if (isLaborActivity || isEquipmentActivity) {
            const metadata = (activity as any).metadata || {};
            const laborEntries = metadata.laborEntries || [];
            const equipmentEntries = metadata.equipmentEntries || [];
            const entries = isLaborActivity ? laborEntries : equipmentEntries;
            const totalCost = metadata.totalCost || 0;

            return (
                <View key={activity._id} style={styles.materialActivityCard}>
                    <View style={styles.materialActivityGradient}>
                        {/* Header with activity type badge */}
                        <View style={styles.materialActivityHeader}>
                            <View style={[
                                styles.activityBadge,
                                {
                                    backgroundColor: icon.color,
                                    shadowColor: icon.color,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 4,
                                    elevation: 3,
                                }
                            ]}>
                                <Ionicons
                                    name={icon.name as any}
                                    size={16}
                                    color="#FFFFFF"
                                />
                                <Text style={[
                                    styles.activityBadgeText,
                                    { color: '#FFFFFF' }
                                ]}>
                                    {isLaborActivity ? 'LABOR ADDED' : 'EQUIPMENT ADDED'}
                                </Text>
                            </View>
                        </View>

                        {/* Project/Section Info */}
                        {(activity.projectName || activity.sectionName) && (
                            <View style={styles.projectInfo}>
                                {activity.projectName && (
                                    <View style={styles.projectInfoItem}>
                                        <Ionicons name="folder-outline" size={14} color="#64748B" />
                                        <Text style={styles.projectInfoText}>{activity.projectName}</Text>
                                    </View>
                                )}
                                {activity.sectionName && (
                                    <View style={styles.projectInfoItem}>
                                        <Ionicons name="layers-outline" size={14} color="#64748B" />
                                        <Text style={styles.projectInfoText}>{activity.sectionName}</Text>
                                    </View>
                                )}
                                {activity.miniSectionName && (
                                    <View style={styles.projectInfoItem}>
                                        <Ionicons name="grid-outline" size={14} color="#64748B" />
                                        <Text style={styles.projectInfoText}>{activity.miniSectionName}</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Labor/Equipment Entries List */}
                        {entries.length > 0 && (
                            <View style={styles.materialsList}>
                                {entries.map((entry: any, index: number) => (
                                    <React.Fragment key={index}>
                                        <View style={styles.materialItem}>
                                            <View style={[
                                                styles.materialIconSmall,
                                                { backgroundColor: `${icon.color}15` }
                                            ]}>
                                                <Ionicons
                                                    name={isLaborActivity ? 'person-outline' : 'construct-outline'}
                                                    size={18}
                                                    color={icon.color}
                                                />
                                            </View>
                                            <View style={styles.materialDetails}>
                                                <Text style={styles.materialName}>
                                                    {entry.type || entry.name}
                                                </Text>
                                                <Text style={styles.materialQuantity}>
                                                    {isLaborActivity
                                                        ? `${entry.count} laborers • ₹${entry.perLaborCost?.toLocaleString('en-IN')}/laborer`
                                                        : `${entry.quantity || 1} ${entry.unit || 'unit'}`
                                                    }
                                                    {entry.totalCost > 0 && (
                                                        <Text style={styles.materialCost}>
                                                            {' '}• ₹{entry.totalCost.toLocaleString('en-IN')}
                                                        </Text>
                                                    )}
                                                </Text>
                                                {entry.category && (
                                                    <Text style={styles.laborCategory}>
                                                        {entry.category}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                        {entry.description ? (
                                            <View style={styles.laborDescriptionCard}>
                                                <View style={styles.laborDescriptionAccent} />
                                                <View style={styles.laborDescriptionContent}>
                                                    <Ionicons name="document-text-outline" size={14} color="#F59E0B" style={{ marginTop: 1 }} />
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.laborDescriptionLabel}>Work Done</Text>
                                                        <Text style={styles.laborDescriptionText} numberOfLines={3}>{entry.description}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        ) : null}
                                    </React.Fragment>
                                ))}
                            </View>
                        )}

                        {/* Total Cost */}
                        {totalCost > 0 && (
                            <View style={styles.totalCostContainer}>
                                <Text style={styles.totalCostLabel}>Total Cost</Text>
                                <Text style={styles.totalCostValue}>
                                    ₹{totalCost.toLocaleString('en-IN')}
                                </Text>
                            </View>
                        )}

                        {/* Message - only show for non-labor activities */}
                        {!isLaborActivity && enhancedMessage && (
                            <View style={styles.messageContainer}>
                                <Ionicons name="chatbox-outline" size={14} color="#64748B" />
                                <Text style={styles.messageText}>{enhancedMessage}</Text>
                            </View>
                        )}

                        {/* Footer with user info and time ago */}
                        <View style={styles.materialActivityFooter}>
                            <View style={styles.userInfo}>
                                <View style={[styles.userAvatar, { backgroundColor: icon.color }]}>
                                    <Text style={styles.userAvatarText}>
                                        {displayUser.fullName.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={styles.userName}>{displayUser.fullName}</Text>
                            </View>
                            <Text style={styles.activityTimeNew}>
                                {formatTimeAgo(activity.createdAt)}
                            </Text>
                        </View>
                    </View>
                </View>
            );
        }

        // Render phase activities (active phase switch / phase / sub-phase progress) with an
        // enhanced card, matching the visual treatment material/labor/equipment activities get.
        if (isPhaseActivity) {
            const meta = (activity as any).metadata || {};
            const isPhaseChange = activity.activityType === 'phase_changed';
            const isSubPhaseProgress = activity.activityType === 'sub_phase_progress_updated';
            const badgeIcon = isPhaseChange ? 'git-branch' : 'trending-up';
            const badgeLabel = isPhaseChange
                ? 'PHASE CHANGED'
                : isSubPhaseProgress
                    ? 'SUB-PHASE PROGRESS'
                    : 'PHASE PROGRESS';
            const progressLabel = isSubPhaseProgress && meta.subPhaseName
                ? `${meta.phaseName} → ${meta.subPhaseName}`
                : meta.phaseName;
            const isProgressComplete = meta.newProgress === 100;
            // Light, flat (non-gradient) accent colors per element so the card has variety
            // without looking loud.
            const badgeBg = isPhaseChange ? '#EDE9FE' : '#FEF3C7';
            const badgeColor = isPhaseChange ? '#7C3AED' : '#D97706';
            const fromColor = '#94A3B8';
            const toColor = '#34D399';
            const progressValueColor = isProgressComplete ? '#34D399' : '#D97706';
            const progressBarColor = '#FCD34D';
            const avatarColor = '#E0E7FF';

            return (
                <View key={activity._id} style={styles.materialActivityCard}>
                    <View style={styles.materialActivityGradient}>
                        <View style={styles.materialActivityHeader}>
                            <View style={[
                                styles.activityBadge,
                                { backgroundColor: badgeBg }
                            ]}>
                                <Ionicons name={badgeIcon as any} size={16} color={badgeColor} />
                                <Text style={[styles.activityBadgeText, { color: badgeColor }]}>
                                    {badgeLabel}
                                </Text>
                            </View>
                        </View>

                        {(activity.projectName || activity.sectionName || activity.miniSectionName) && (
                            <View style={styles.projectInfo}>
                                {activity.projectName && (
                                    <View style={styles.projectInfoItem}>
                                        <Ionicons name="folder-outline" size={14} color="#64748B" />
                                        <Text style={styles.projectInfoText}>{activity.projectName}</Text>
                                    </View>
                                )}
                                {activity.sectionName && (
                                    <View style={styles.projectInfoItem}>
                                        <Ionicons name="layers-outline" size={14} color="#64748B" />
                                        <Text style={styles.projectInfoText}>{activity.sectionName}</Text>
                                    </View>
                                )}
                                {activity.miniSectionName && (
                                    <View style={styles.projectInfoItem}>
                                        <Ionicons name="grid-outline" size={14} color="#64748B" />
                                        <Text style={styles.projectInfoText}>{activity.miniSectionName}</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {isPhaseChange ? (
                            <View style={styles.transferDetailsContainer}>
                                <View style={styles.transferRoute}>
                                    <View style={styles.transferProject}>
                                        <Ionicons name="ellipse-outline" size={16} color={fromColor} />
                                        <Text style={styles.transferProjectName}>
                                            {meta.fromPhaseName || 'None'}
                                        </Text>
                                    </View>
                                    <Ionicons name="arrow-forward" size={16} color="#64748B" />
                                    <View style={styles.transferProject}>
                                        <Ionicons name="checkmark-circle" size={16} color={toColor} />
                                        <Text style={styles.transferProjectName}>
                                            {meta.toPhaseName || 'Unlinked'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <>
                                <View style={styles.phaseProgressContainer}>
                                    <Text style={styles.phaseProgressLabel} numberOfLines={1}>
                                        {progressLabel}
                                    </Text>
                                    <Text style={[styles.phaseProgressValue, { color: progressValueColor }]}>
                                        {meta.oldProgress}% → {meta.newProgress}%
                                    </Text>
                                </View>
                                <View style={styles.phaseProgressBarTrack}>
                                    <View style={[
                                        styles.phaseProgressBarFill,
                                        { width: `${meta.newProgress || 0}%` as any, backgroundColor: progressBarColor }
                                    ]} />
                                </View>
                            </>
                        )}

                        {/* Message */}
                        {activity.message && (
                            <View style={styles.messageContainer}>
                                <Ionicons name="chatbox-outline" size={14} color="#64748B" />
                                <Text style={styles.messageText}>{activity.message}</Text>
                            </View>
                        )}

                        {/* Footer with user info and time ago */}
                        <View style={styles.materialActivityFooter}>
                            <View style={styles.userInfo}>
                                <View style={[styles.userAvatar, { backgroundColor: avatarColor }]}>
                                    <Text style={[styles.userAvatarText, { color: '#295E94' }]}>
                                        {displayUser.fullName.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={styles.userName}>{displayUser.fullName}</Text>
                            </View>
                            <Text style={styles.activityTimeNew}>
                                {formatTimeAgo(activity.createdAt)}
                            </Text>
                        </View>
                    </View>
                </View>
            );
        }

        // Regular activity card for other types
        return (
            <View key={activity._id} style={styles.activityItemNew}>
                <View style={[styles.iconContainerNew, { backgroundColor: icon.color }]}>
                    <Ionicons name={icon.name as any} size={24} color="#FFFFFF" />
                </View>

                <View style={styles.activityContentNew}>
                    <View style={styles.activityHeaderNew}>
                        <Text style={styles.activityDescriptionNew}>{activity.description}</Text>
                        <View style={styles.categoryBadgeNew}>
                            <Text style={styles.categoryBadgeTextNew}>
                                {activity.category.toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    {enhancedMessage && (
                        <Text style={styles.activityMessageNew}>{enhancedMessage}</Text>
                    )}

                    <View style={styles.activityFooterNew}>
                        <View style={styles.userInfoNew}>
                            <View style={[styles.userAvatarNew, { backgroundColor: icon.color }]}>
                                <Text style={styles.userAvatarTextNew}>
                                    {displayUser.fullName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.userNameNew}>{displayUser.fullName}</Text>
                        </View>
                        <Text style={styles.activityTimeNew}>{formatTimeAgo(activity.createdAt)}</Text>
                    </View>
                </View>
            </View>
        );
    };

    const getMaterialIcon = (materialName: string) => {
        const materialMap: { [key: string]: { icon: string; color: string } } = {
            'cement': { icon: 'cube-outline', color: '#3A78B5' },
            'brick': { icon: 'square-outline', color: '#EF4444' },
            'steel': { icon: 'barbell-outline', color: '#6B7280' },
            'sand': { icon: 'layers-outline', color: '#F59E0B' },
            'gravel': { icon: 'diamond-outline', color: '#10B981' },
            'concrete': { icon: 'cube', color: '#3A78B5' },
            'wood': { icon: 'leaf-outline', color: '#84CC16' },
            'paint': { icon: 'color-palette-outline', color: '#EC4899' },
            'tile': { icon: 'grid-outline', color: '#06B6D4' },
            'pipe': { icon: 'ellipse-outline', color: '#3A78B5' },
        };

        const lowerName = materialName.toLowerCase();
        for (const [key, value] of Object.entries(materialMap)) {
            if (lowerName.includes(key)) {
                return value;
            }
        }
        return { icon: 'cube-outline', color: '#6B7280' };
    };

    const renderMaterialActivityItem = (activity: MaterialActivity) => {
        const icon = getMaterialActivityIcon(activity.activity);
        // Fix: Just sum up the cost field (which should already be the total cost per material)
        // Don't multiply by quantity again since cost field already represents total cost
        const totalCost = activity.materials.reduce((sum, m) => sum + (m.cost || 0), 0);
        const materialCount = activity.materials.length;
        const isImported = activity.activity === 'imported';
        const isUsed = activity.activity === 'used';
        const isTransferred = activity.activity === 'transferred';

        // Debug: Log the cost calculation to verify it's correct
        if (__DEV__) {
            console.log('Material Activity Cost Debug:', {
                _id: activity._id,
                materials: activity.materials.map(m => ({
                    name: m.name,
                    qnt: m.qnt,
                    unit: m.unit,
                    cost: m.cost,
                    perUnitCost: (m as any).perUnitCost,
                    totalCost: (m as any).totalCost,
                })),
                calculatedTotalCost: totalCost,
            });
        }

        // Debug: Log the date field to see what we're getting
        if (__DEV__) {
            console.log('Material Activity Date Debug:', {
                _id: activity._id,
                date: activity.date,
                createdAt: activity.createdAt,
                dateType: typeof activity.date,
                createdAtType: typeof activity.createdAt,
                formattedTimeAgo: formatTimeAgo(activity.date || activity.createdAt),
            });
        }

        // Debug: Log contractor_name to verify it's being received
        if (__DEV__) {
            console.log('🏗️ Contractor Name Debug:', {
                _id: activity._id,
                contractor_name: activity.contractor_name,
                hasContractorName: !!activity.contractor_name,
                contractorNameType: typeof activity.contractor_name,
                materials: activity.materials.map(m => ({
                    name: m.name,
                    contractor_name: m.contractor_name,
                })),
            });
        }

        // Use activity user or fallback to current user
        const displayUser = activity.user?.fullName && activity.user.fullName !== 'Unknown User'
            ? activity.user
            : currentUser || { userId: 'unknown', fullName: 'Unknown User' };

        return (
            <View key={activity._id} style={styles.materialActivityCard}>
                <View style={styles.materialActivityGradient}>
                    {/* Header with activity type badge */}
                    <View style={styles.materialActivityHeader}>
                        <View style={[
                            styles.activityBadge,
                            {
                                backgroundColor: isImported ? '#10B981' : isUsed ? '#EF4444' : '#3A78B5',
                                shadowColor: isImported ? '#10B981' : isUsed ? '#EF4444' : '#3A78B5',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 4,
                                elevation: 3,
                            }
                        ]}>
                            <Ionicons
                                name={icon.name as any}
                                size={16}
                                color="#FFFFFF"
                            />
                            <Text style={[
                                styles.activityBadgeText,
                                { color: '#FFFFFF' }
                            ]}>
                                {isImported ? 'IMPORTED' : isUsed ? 'USED' : 'TRANSFERRED'}
                            </Text>
                        </View>
                    </View>

                    {/* Project/Section Info */}
                    {(activity.projectName || activity.sectionName) && (
                        <View style={styles.projectInfo}>
                            {activity.projectName && (
                                <View style={styles.projectInfoItem}>
                                    <Ionicons name="folder-outline" size={14} color="#64748B" />
                                    <Text style={styles.projectInfoText}>{activity.projectName}</Text>
                                </View>
                            )}
                            {activity.sectionName && (
                                <View style={styles.projectInfoItem}>
                                    <Ionicons name="layers-outline" size={14} color="#64748B" />
                                    <Text style={styles.projectInfoText}>{activity.sectionName}</Text>
                                </View>
                            )}
                            {activity.miniSectionName && (
                                <View style={styles.projectInfoItem}>
                                    <Ionicons name="grid-outline" size={14} color="#64748B" />
                                    <Text style={styles.projectInfoText}>{activity.miniSectionName}</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Transfer Details - Only show for transferred activities */}
                    {isTransferred && activity.transferDetails && (
                        <View style={styles.transferDetailsContainer}>
                            <View style={styles.transferRoute}>
                                <View style={styles.transferProject}>
                                    <Ionicons name="folder" size={16} color="#3A78B5" />
                                    <Text style={styles.transferProjectName}>
                                        {activity.transferDetails.fromProject.name}
                                    </Text>
                                </View>
                                <Ionicons name="arrow-forward" size={16} color="#64748B" />
                                <View style={styles.transferProject}>
                                    <Ionicons name="folder" size={16} color="#10B981" />
                                    <Text style={styles.transferProjectName}>
                                        {activity.transferDetails.toProject.name}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Contractor Name - Show if available */}
                    {activity.contractor_name && (
                        <View style={styles.contractorInfoContainer}>
                            <View style={styles.contractorInfoItem}>
                                <Ionicons name="person-outline" size={14} color="#3A78B5" />
                                <Text style={styles.contractorLabel}>Contractor:</Text>
                                <Text style={styles.contractorName}>{activity.contractor_name}</Text>
                            </View>
                        </View>
                    )}

                    {/* Materials List */}
                    <View style={styles.materialsList}>
                        {activity.materials.map((material, index) => {
                            const matIcon = getMaterialIcon(material.name);
                            return (
                                <View key={index} style={styles.materialItem}>
                                    <View style={[
                                        styles.materialIconSmall,
                                        { backgroundColor: `${matIcon.color}15` }
                                    ]}>
                                        <Ionicons
                                            name={matIcon.icon as any}
                                            size={18}
                                            color={matIcon.color}
                                        />
                                    </View>
                                    <View style={styles.materialDetails}>
                                        <Text style={styles.materialName}>{material.name}</Text>
                                        <Text style={styles.materialQuantity}>
                                            {material.qnt} {material.unit}
                                            {material.cost > 0 && (
                                                <Text style={styles.materialCost}>
                                                    {' '}• ₹{material.cost.toLocaleString('en-IN')}
                                                </Text>
                                            )}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Total Cost */}
                    {totalCost > 0 && (
                        <View style={styles.totalCostContainer}>
                            <Text style={styles.totalCostLabel}>Total Cost</Text>
                            <Text style={styles.totalCostValue}>
                                ₹{totalCost.toLocaleString('en-IN')}
                            </Text>
                        </View>
                    )}

                    {/* Message */}
                    {activity.message && (
                        <View style={styles.messageContainer}>
                            <Ionicons name="chatbox-outline" size={14} color="#64748B" />
                            <Text style={styles.messageText}>{activity.message}</Text>
                        </View>
                    )}

                    {/* Footer with user info and time ago */}
                    <View style={styles.materialActivityFooter}>
                        <View style={styles.userInfo}>
                            <View style={styles.userAvatar}>
                                <Text style={styles.userAvatarText}>
                                    {displayUser.fullName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.userName}>{displayUser.fullName}</Text>
                        </View>
                        {/* Add time ago display similar to regular activities */}
                        <Text style={styles.activityTimeNew}>
                            {formatTimeAgo(activity.date || activity.createdAt)}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderOtherCostActivityItem = (activity: OtherCostActivity) => {
        const icon = { name: 'briefcase', color: '#3A78B5' };
        const totalCost = activity.otherCosts.reduce((sum, o) => sum + (o.totalCost || 0), 0);
        const costCount = activity.otherCosts.length;

        const displayUser = activity.user?.fullName && activity.user.fullName !== 'Unknown User'
            ? activity.user
            : currentUser || { userId: 'unknown', fullName: 'Unknown User' };

        return (
            <View key={activity._id} style={styles.materialActivityCard}>
                <View style={styles.materialActivityGradient}>
                    {/* Header with activity type badge */}
                    <View style={styles.materialActivityHeader}>
                        <View style={[
                            styles.activityBadge,
                            {
                                backgroundColor: '#3A78B5',
                                shadowColor: '#3A78B5',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 4,
                                elevation: 3,
                            }
                        ]}>
                            <Ionicons
                                name={icon.name as any}
                                size={16}
                                color="#FFFFFF"
                            />
                            <Text style={[
                                styles.activityBadgeText,
                                { color: '#FFFFFF' }
                            ]}>
                                OTHER COST ADDED
                            </Text>
                        </View>
                    </View>

                    {/* Project/Section Info */}
                    {(activity.projectName || activity.sectionName) && (
                        <View style={styles.projectInfo}>
                            {activity.projectName && (
                                <View style={styles.projectInfoItem}>
                                    <Ionicons name="folder-outline" size={14} color="#64748B" />
                                    <Text style={styles.projectInfoText}>{activity.projectName}</Text>
                                </View>
                            )}
                            {activity.sectionName && (
                                <View style={styles.projectInfoItem}>
                                    <Ionicons name="layers-outline" size={14} color="#64748B" />
                                    <Text style={styles.projectInfoText}>{activity.sectionName}</Text>
                                </View>
                            )}
                            {activity.miniSectionName && (
                                <View style={styles.projectInfoItem}>
                                    <Ionicons name="grid-outline" size={14} color="#64748B" />
                                    <Text style={styles.projectInfoText}>{activity.miniSectionName}</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Other Costs List */}
                    <View style={styles.materialsList}>
                        {activity.otherCosts.map((cost, index) => (
                            <View key={index} style={styles.materialItem}>
                                <View style={[
                                    styles.materialIconSmall,
                                    { backgroundColor: '#3A78B515' }
                                ]}>
                                    <Ionicons
                                        name="briefcase-outline"
                                        size={18}
                                        color="#3A78B5"
                                    />
                                </View>
                                <View style={styles.materialDetails}>
                                    <Text style={styles.materialName}>{cost.name}</Text>
                                    <Text style={styles.materialQuantity}>
                                        {cost.quantity} {cost.unit}
                                        {cost.totalCost > 0 && (
                                            <Text style={styles.materialCost}>
                                                {' '}• ₹{cost.totalCost.toLocaleString('en-IN')}
                                            </Text>
                                        )}
                                    </Text>
                                    {cost.category && (
                                        <Text style={styles.laborCategory}>
                                            {cost.category}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Total Cost */}
                    {totalCost > 0 && (
                        <View style={styles.totalCostContainer}>
                            <Text style={styles.totalCostLabel}>Total Cost</Text>
                            <Text style={styles.totalCostValue}>
                                ₹{totalCost.toLocaleString('en-IN')}
                            </Text>
                        </View>
                    )}

                    {/* Message */}
                    {activity.message && (
                        <View style={styles.messageContainer}>
                            <Ionicons name="chatbox-outline" size={14} color="#64748B" />
                            <Text style={styles.messageText}>{activity.message}</Text>
                        </View>
                    )}

                    {/* Footer with user info and time ago */}
                    <View style={styles.materialActivityFooter}>
                        <View style={styles.userInfo}>
                            <View style={[styles.userAvatar, { backgroundColor: '#3A78B5' }]}>
                                <Text style={styles.userAvatarText}>
                                    {displayUser.fullName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.userName}>{displayUser.fullName}</Text>
                        </View>
                        <Text style={styles.activityTimeNew}>
                            {formatTimeAgo(activity.date || activity.createdAt)}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    const getCombinedActivities = () => {
        const combined: { type: 'activity' | 'material' | 'other_cost'; data: Activity | MaterialActivity | OtherCostActivity; timestamp: string }[] = [];

        // Safely iterate over activities (ensure it's an array)
        if (Array.isArray(activities)) {
            activities.forEach(a => {
                combined.push({ type: 'activity', data: a, timestamp: a.createdAt });
            });
        }

        // Safely iterate over material activities (ensure it's an array)
        if (Array.isArray(materialActivities)) {
            materialActivities.forEach(m => {
                const timestamp: string = m.date || m.createdAt || new Date().toISOString();
                combined.push({ type: 'material' as const, data: m, timestamp });
            });
        }

        // Safely iterate over other cost activities (ensure it's an array)
        if (Array.isArray(otherCostActivities)) {
            otherCostActivities.forEach(o => {
                const timestamp: string = o.date || o.createdAt || new Date().toISOString();
                combined.push({ type: 'other_cost' as const, data: o, timestamp });
            });
        }

        // Sort by timestamp descending
        combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return combined;
    };

    const getFilteredActivities = () => {
        console.log('🔍 getFilteredActivities called with activeTab:', activeTab);
        console.log('🔍 activities array length:', activities.length);
        console.log('🔍 selectedVendors:', selectedVendors);

        if (activeTab === 'all') {
            const combined = getCombinedActivities();
            // ✅ NEW: Filter by vendors if selected (multiple vendors)
            if (selectedVendors.length > 0) {
                return combined.filter(item => {
                    if (item.type === 'material') {
                        const materialActivity = item.data as MaterialActivity;
                        return selectedVendors.includes(materialActivity.contractor_name || '');
                    }
                    return false; // Hide non-material activities when vendor filter is active
                });
            }
            return combined;
        } else if (activeTab === 'project') {
            if (Array.isArray(activities)) {
                const projectActivities = activities.filter(a => {
                    const isProjectCategory = a.category === 'project' || a.category === 'section' || a.category === 'mini_section' || a.category === 'equipment' || a.category === 'phase';
                    if (isProjectCategory) {
                        console.log('✅ Found project activity:', a.category, a.action, a.description?.substring(0, 30));
                    }
                    return isProjectCategory;
                });
                console.log('🎯 Project activities found:', projectActivities.length);
                return projectActivities.map(a => ({ type: 'activity' as const, data: a, timestamp: a.createdAt }));
            }
            return [];
        } else if (activeTab === 'labor') {
            // Filter activities to show only labor activities
            if (Array.isArray(activities)) {
                return activities
                    .filter(a => a.category === 'labor')
                    .map(a => ({ type: 'activity' as const, data: a, timestamp: a.createdAt }));
            }
            return [];
        } else if (activeTab === 'material') {
            // Filter materials based on sub-tab (ensure it's an array)
            if (Array.isArray(materialActivities)) {
                let filtered = materialActivities;

                // ✅ NEW: Filter by vendors if selected (multiple vendors)
                if (selectedVendors.length > 0) {
                    filtered = filtered.filter(m => selectedVendors.includes(m.contractor_name || ''));
                }

                // If 'all' sub-tab is selected, show all material activities
                if (materialSubTab === 'all') {
                    return filtered.map(m => ({
                        type: 'material' as const,
                        data: m,
                        timestamp: m.date || m.createdAt || new Date().toISOString()
                    }));
                }
                // Otherwise filter by specific activity type
                return filtered
                    .filter(m => m.activity === materialSubTab)
                    .map(m => ({
                        type: 'material' as const,
                        data: m,
                        timestamp: m.date || m.createdAt || new Date().toISOString()
                    }));
            }
            return [];
        } else if (activeTab === 'other_cost') {
            // Filter other cost activities (ensure it's an array)
            if (Array.isArray(otherCostActivities)) {
                return otherCostActivities.map(o => ({
                    type: 'other_cost' as const,
                    data: o,
                    timestamp: o.date || o.createdAt || new Date().toISOString()
                }));
            }
            return [];
        }
        return [];
    };

    const filteredActivities = getFilteredActivities();

    // Animate on data load
    useEffect(() => {
        if (!loading && filteredActivities.length > 0) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [loading, filteredActivities.length]);

    // Group activities by date
    const getGroupedByDate = () => {
        // Use the new date groups from API if available
        if (dateGroups.length > 0) {
            return dateGroups.map(group => {
                // Filter activities based on active tab AND vendor filter
                let filteredGroupActivities = group.activities;

                // ✅ FIRST: Apply vendor filter if selected (multiple vendors)
                if (selectedVendors.length > 0) {
                    filteredGroupActivities = filteredGroupActivities.filter(item => {
                        if (item.type === 'material') {
                            const materialActivity = item.data as MaterialActivity;
                            return selectedVendors.includes(materialActivity.contractor_name || '');
                        }
                        return false; // Hide non-material activities when vendor filter is active
                    });
                }

                // ✅ THEN: Apply tab filter
                if (activeTab === 'project') {
                    // Only show regular activities (not material activities) - include project, section, mini-section, and equipment activities
                    filteredGroupActivities = filteredGroupActivities.filter(item =>
                        item.type === 'activity' &&
                        ['project', 'section', 'mini_section', 'equipment'].includes((item.data as Activity).category)
                    );
                } else if (activeTab === 'labor') {
                    // Only show labor activities
                    filteredGroupActivities = filteredGroupActivities.filter(item =>
                        item.type === 'activity' &&
                        (item.data as Activity).category === 'labor'
                    );
                } else if (activeTab === 'material') {
                    // Only show material activities that match the sub-tab
                    if (materialSubTab === 'all') {
                        // Show all material activities
                        filteredGroupActivities = filteredGroupActivities.filter(item =>
                            item.type === 'material'
                        );
                    } else {
                        // Filter by specific activity type
                        filteredGroupActivities = filteredGroupActivities.filter(item =>
                            item.type === 'material' &&
                            (item.data as MaterialActivity).activity === materialSubTab
                        );
                    }
                } else if (activeTab === 'other_cost') {
                    // Only show other cost activities
                    filteredGroupActivities = filteredGroupActivities.filter(item =>
                        item.type === 'other_cost'
                    );
                } else {
                    // 'all' tab - show everything (already filtered by vendor if applicable)
                    filteredGroupActivities = filteredGroupActivities;
                }

                return {
                    date: group.date,
                    activities: filteredGroupActivities
                };
            }).filter(group => group.activities.length > 0); // Remove empty date groups
        }

        // Fallback to client-side grouping for backward compatibility
        const groupedByDate: { [date: string]: typeof filteredActivities } = {};

        filteredActivities.forEach(activity => {
            try {
                // Ensure timestamp exists
                if (!activity.timestamp) {
                    console.warn('Missing timestamp for activity:', activity.data._id);
                    const dateKey = 'unknown-date';
                    if (!groupedByDate[dateKey]) {
                        groupedByDate[dateKey] = [];
                    }
                    groupedByDate[dateKey].push(activity);
                    return;
                }

                const date = new Date(activity.timestamp);

                // Check if date is valid
                if (isNaN(date.getTime())) {
                    console.warn('Invalid timestamp for activity:', activity.data._id, activity.timestamp);
                    // Use a fallback date key
                    const dateKey = 'unknown-date';
                    if (!groupedByDate[dateKey]) {
                        groupedByDate[dateKey] = [];
                    }
                    groupedByDate[dateKey].push(activity);
                    return;
                }

                // Use ISO date string (YYYY-MM-DD) as key for proper sorting
                const dateKey = date.toLocaleDateString('en-CA'); // "2025-12-07"

                if (!groupedByDate[dateKey]) {
                    groupedByDate[dateKey] = [];
                }
                groupedByDate[dateKey].push(activity);
            } catch (error) {
                console.error('Error processing activity date:', activity.data._id, error);
            }
        });

        // Sort dates in descending order (newest first)
        const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
            return b.localeCompare(a); // ISO dates can be sorted alphabetically
        });

        return sortedDates.map(date => ({
            date,
            activities: groupedByDate[date]
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

            // Format as "Dec 7, 25" (short month, 2-digit year)
            return date.toLocaleDateString('en-US', {
                year: '2-digit',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date header:', dateString, error);
            return 'Unknown Date';
        }
    };

    const groupedActivities = getGroupedByDate();

    // ✅ DEBUG: Log vendor filter state (multiple vendors)
    if (selectedVendors.length > 0) {
        console.log('🏗️ VENDOR FILTER ACTIVE:', selectedVendors);
        console.log('   - Selected vendors count:', selectedVendors.length);
        console.log('   - Total date groups:', dateGroups.length);
        console.log('   - Filtered date groups:', groupedActivities.length);
        console.log('   - Total activities after filter:', groupedActivities.reduce((sum, group) => sum + group.activities.length, 0));
    }

    // DEBUG: Log rendering state
    console.log('\n🎨 RENDERING STATE:');
    console.log('- Loading:', loading);
    console.log('- Error:', error);
    console.log('- Activities:', activities);
    console.log('- Activities is array?', Array.isArray(activities));
    console.log('- Activities array length:', activities?.length);
    console.log('- Material Activities array length:', materialActivities?.length);
    console.log('- Filtered Activities length:', filteredActivities.length);
    console.log('- Grouped Activities length:', groupedActivities.length);
    console.log('- Active Tab:', activeTab);
    console.log('- Material Sub Tab:', materialSubTab);
    console.log('- Date Groups (raw):', dateGroups.length);
    console.log('- Current Date:', currentDate);
    console.log('- Available Dates:', availableDates.length);
    console.log('- Should show empty state?', !loading && !error && filteredActivities.length === 0);
    console.log('- Should show activities?', !loading && !error && filteredActivities.length > 0);

    // Debug tab filtering
    if (dateGroups.length > 0) {
        console.log('🔍 TAB FILTERING DEBUG:');
        dateGroups.forEach((group, index) => {
            const totalInGroup = group.activities.length;
            const activityCount = group.activities.filter(item => item.type === 'activity').length;
            const laborCount = group.activities.filter(item =>
                item.type === 'activity' && (item.data as Activity).category === 'labor'
            ).length;
            const projectCount = group.activities.filter(item =>
                item.type === 'activity' && ['project', 'section', 'mini_section', 'equipment'].includes((item.data as Activity).category)
            ).length;
            const materialImportedCount = group.activities.filter(item =>
                item.type === 'material' && (item.data as MaterialActivity).activity === 'imported'
            ).length;
            const materialUsedCount = group.activities.filter(item =>
                item.type === 'material' && (item.data as MaterialActivity).activity === 'used'
            ).length;

            console.log(`   Date ${group.date}:`);
            console.log(`     - Total: ${totalInGroup}`);
            console.log(`     - Activities: ${activityCount}`);
            console.log(`     - Labor Activities: ${laborCount}`);
            console.log(`     - Project Activities (includes sections & equipment): ${projectCount}`);
            console.log(`     - Materials (imported): ${materialImportedCount}`);
            console.log(`     - Materials (used): ${materialUsedCount}`);

            // Log individual activities for debugging
            group.activities.forEach((item, actIndex) => {
                if (item.type === 'activity') {
                    const activity = item.data as Activity;
                    console.log(`       Activity ${actIndex + 1}: ${activity.category} - ${activity.activityType} - ${activity.description}`);
                }
            });
        });
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Activity Feed</Text>
                    </View>
                    <Text style={styles.headerSubtitle}>
                        {selectedVendors.length > 0
                            ? `${selectedVendors.length} vendor${selectedVendors.length > 1 ? 's' : ''} selected • ${groupedActivities.reduce((sum, group) => sum + group.activities.length, 0)} activities`
                            : `${formatDateHeader(currentDate)} • ${groupedActivities.reduce((sum, group) => sum + group.activities.length, 0)} activities`
                        }
                    </Text>
                </View>

                {/* Header Actions */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {/* ✅ NEW: Generate Report Button */}
                    {selectedVendors.length > 0 && (activeTab === 'material' || activeTab === 'all') && (
                        <TouchableOpacity
                            onPress={generateVendorReport}
                            disabled={isGeneratingReport}
                            style={[styles.vendorFilterButton, { marginRight: 8, backgroundColor: '#10B981', borderColor: '#10B981' }]}
                        >
                            {isGeneratingReport ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Ionicons name="document-text" size={20} color="#FFFFFF" />
                            )}
                        </TouchableOpacity>
                    )}

                    {/* ✅ NEW: Vendor Filter Button (replaces refresh button) */}
                    <TouchableOpacity
                        onPress={() => setShowVendorModal(true)}
                        style={[styles.vendorFilterButton, selectedVendors.length > 0 && styles.vendorFilterButtonActive]}
                    >
                        <Ionicons
                            name={selectedVendors.length > 0 ? "funnel" : "funnel-outline"}
                            size={20}
                            color={selectedVendors.length > 0 ? "#FFFFFF" : "#3A78B5"}
                        />
                        {selectedVendors.length > 0 && (
                            <View style={styles.vendorFilterBadge}>
                                <Text style={styles.vendorFilterBadgeText}>{selectedVendors.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Main Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'all' && styles.tabActive]}
                    onPress={() => setActiveTab('all')}
                >
                    <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
                        All
                    </Text>
                    {activeTab === 'all' && <View style={styles.tabIndicator} />}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'project' && styles.tabActive]}
                    onPress={() => setActiveTab('project')}
                >
                    <Text style={[styles.tabText, activeTab === 'project' && styles.tabTextActive]}>
                        Projects
                    </Text>
                    {activeTab === 'project' && <View style={styles.tabIndicator} />}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'labor' && styles.tabActive]}
                    onPress={() => setActiveTab('labor')}
                >
                    <Text style={[styles.tabText, activeTab === 'labor' && styles.tabTextActive]}>
                        Labor
                    </Text>
                    {activeTab === 'labor' && <View style={styles.tabIndicator} />}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'material' && styles.tabActive]}
                    onPress={() => setActiveTab('material')}
                >
                    <Text style={[styles.tabText, activeTab === 'material' && styles.tabTextActive]}>
                        Materials
                    </Text>
                    {activeTab === 'material' && <View style={styles.tabIndicator} />}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'other_cost' && styles.tabActive]}
                    onPress={() => setActiveTab('other_cost')}
                >
                    <Text style={[styles.tabText, activeTab === 'other_cost' && styles.tabTextActive]}>
                        Other
                    </Text>
                    {activeTab === 'other_cost' && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
            </View>

            {/* Material Sub-Tabs - Only show when Materials tab is active */}
            {activeTab === 'material' && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.subTabsContainer}
                    contentContainerStyle={styles.subTabsContentContainer}
                >
                    <TouchableOpacity
                        style={[styles.subTab, materialSubTab === 'all' && styles.subTabActive]}
                        onPress={() => setMaterialSubTab('all')}
                    >
                        <Ionicons
                            name="apps-outline"
                            size={16}
                            color={materialSubTab === 'all' ? '#3A78B5' : '#64748B'}
                        />
                        <Text style={[styles.subTabText, materialSubTab === 'all' && styles.subTabTextActive]}>
                            All
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.subTab, materialSubTab === 'imported' && styles.subTabActive]}
                        onPress={() => setMaterialSubTab('imported')}
                    >
                        <Ionicons
                            name="download-outline"
                            size={16}
                            color={materialSubTab === 'imported' ? '#10B981' : '#64748B'}
                        />
                        <Text style={[styles.subTabText, materialSubTab === 'imported' && styles.subTabTextActive]}>
                            Imported
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.subTab, materialSubTab === 'used' && styles.subTabActive]}
                        onPress={() => setMaterialSubTab('used')}
                    >
                        <Ionicons
                            name="arrow-forward-outline"
                            size={16}
                            color={materialSubTab === 'used' ? '#EF4444' : '#64748B'}
                        />
                        <Text style={[styles.subTabText, materialSubTab === 'used' && styles.subTabTextActive]}>
                            Used
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.subTab, materialSubTab === 'transferred' && styles.subTabActive]}
                        onPress={() => setMaterialSubTab('transferred')}
                    >
                        <Ionicons
                            name="swap-horizontal-outline"
                            size={16}
                            color={materialSubTab === 'transferred' ? '#3A78B5' : '#64748B'}
                        />
                        <Text style={[styles.subTabText, materialSubTab === 'transferred' && styles.subTabTextActive]}>
                            Transferred
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            )}

            {/* Content */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#3A78B5']}
                        tintColor="#3A78B5"
                    />
                }
            >
                {loading ? (
                    <>
                        {console.log('🔄 Rendering: LOADING STATE')}
                        <View style={styles.loadingContainer}>
                            <View style={styles.loadingHeader}>
                                <ActivityIndicator size="large" color="#3A78B5" />
                                <Text style={styles.loadingText}>Loading activities...</Text>
                            </View>
                            {/* Loading Skeleton */}
                            {[1, 2, 3].map((item) => (
                                <View key={item} style={styles.skeletonCard}>
                                    <View style={styles.skeletonIcon} />
                                    <View style={styles.skeletonContent}>
                                        <View style={styles.skeletonLine} />
                                        <View style={styles.skeletonLineSmall} />
                                        <View style={styles.skeletonLineTiny} />
                                    </View>
                                </View>
                            ))}
                        </View>
                    </>
                ) : error ? (
                    <>
                        {console.log('❌ Rendering: ERROR STATE -', error)}
                        <View style={styles.centerContainer}>
                            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                            <Text style={styles.errorText}>{error}</Text>
                            <Text style={styles.errorHint}>
                                This could be due to network issues or server problems.{'\n'}
                                Try refreshing or check your connection.
                            </Text>
                            <View style={styles.errorActions}>
                                <TouchableOpacity style={styles.retryButton} onPress={() => fetchActivities()}>
                                    <Ionicons name="refresh" size={16} color="#FFFFFF" />
                                    <Text style={styles.retryButtonText}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                ) : groupedActivities.length === 0 || groupedActivities.reduce((sum, group) => sum + group.activities.length, 0) === 0 ? (
                    <>
                        {console.log('📭 Rendering: EMPTY STATE')}
                        {/* Simple "No activity today" message while keeping all UI elements */}
                        <View style={styles.simpleEmptyState}>
                            {selectedVendors.length > 0 && (activeTab === 'project' || activeTab === 'labor') ? (
                                <View style={styles.simpleEmptyContainer}>
                                    <Ionicons name="funnel-outline" size={56} color="#3A78B5" />
                                    <Text style={styles.simpleEmptyTitle}>
                                        To see {activeTab === 'project' ? 'Project' : 'Labor'} activities, please remove the vendor filter.
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.removeFilterButton}
                                        onPress={() => setSelectedVendors([])}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="trash-outline" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                                        <Text style={styles.removeFilterButtonText}>Remove Filter</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.simpleEmptyContainer}>
                                    <Ionicons name="calendar-outline" size={48} color="#94A3B8" />
                                    <Text style={styles.simpleEmptyTitle}>
                                        {(() => {
                                            if (selectedVendors.length > 0) {
                                                return 'No material activity found for selected vendor';
                                            }
                                            const today = new Date().toLocaleDateString('en-CA');
                                            if (currentDate === today) {
                                                return 'No activity today';
                                            } else {
                                                return `No activity on ${formatDateHeader(currentDate)}`;
                                            }
                                        })()}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Show Date Navigation Controls even when no activities */}
                        {selectedVendors.length === 0 && (
                            <View style={styles.compactDateNavigation}>
                                {/* Compact Date Navigation Bar */}
                                <View style={styles.dateNavigationBar}>
                                    {/* Previous Day Button */}
                                    <TouchableOpacity
                                        style={[
                                            styles.compactNavButton,
                                            styles.prevButton,
                                            (!hasPrevDate || loading) && styles.navButtonDisabled
                                        ]}
                                        onPress={handlePreviousDay}
                                        disabled={!hasPrevDate || loading}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons
                                            name="chevron-back"
                                            size={20}
                                            color={(!hasPrevDate || loading) ? '#9CA3AF' : '#10B981'}
                                        />
                                    </TouchableOpacity>

                                    {/* Current Date Display - Compact - Clickable */}
                                    <TouchableOpacity
                                        style={styles.compactDateDisplay}
                                        onPress={handleDatePickerOpen}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.compactDateBadge}>
                                            <Ionicons name="calendar" size={14} color="#10B981" />
                                            <Text style={styles.compactDateText}>
                                                {formatDateHeader(currentDate)}
                                            </Text>
                                        </View>
                                        <Text style={styles.compactActivityCount}>
                                            0 activities
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Next Day Button */}
                                    <TouchableOpacity
                                        style={[
                                            styles.compactNavButton,
                                            styles.nextButton,
                                            (!hasNextDate || loading) && styles.navButtonDisabled
                                        ]}
                                        onPress={handleNextDay}
                                        disabled={!hasNextDate || loading}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons
                                            name="chevron-forward"
                                            size={20}
                                            color={(!hasNextDate || loading) ? '#9CA3AF' : '#10B981'}
                                        />
                                    </TouchableOpacity>
                                </View>

                                {/* Loading indicator - show when loading with enhanced animation */}
                                {loading && (
                                    <View style={styles.compactLoadingIndicator}>
                                        <ActivityIndicator size="small" color="#10B981" />
                                        <Text style={styles.compactLoadingText}>Loading date...</Text>
                                    </View>
                                )}

                                {/* Optional: Date navigation info - very compact */}
                                {availableDates.length > 1 && (
                                    <View style={styles.compactNavigationInfo}>
                                        <Text style={styles.compactInfoText}>
                                            {availableDates.length} dates with activities available
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </>
                ) : (
                    <>
                        {console.log('✅ Rendering: ACTIVITIES LIST - Count:', groupedActivities.length)}
                        <Animated.View
                            style={[
                                styles.activitiesList,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }],
                                }
                            ]}
                        >
                            {groupedActivities.map((dateGroup, dateIndex) => {
                                console.log(`📅 Rendering date group ${dateIndex + 1}:`, dateGroup.date, '- Activities:', dateGroup.activities.length);
                                return (
                                    <View key={dateGroup.date} style={styles.dateGroupContainer}>
                                        {/* Date Header */}
                                        <View style={styles.dateHeader}>
                                            {/* Left: Activity count */}
                                            <View style={styles.dateHeaderLeft}>
                                                <Ionicons name="pulse-outline" size={16} color="#64748B" />
                                                <Text style={styles.activityCountText}>
                                                    {dateGroup.activities.length} {dateGroup.activities.length === 1 ? 'Activity' : 'Activities'}
                                                </Text>
                                            </View>

                                            {/* Right: Date */}
                                            <View style={styles.dateHeaderRight}>
                                                <Text style={styles.dateHeaderText}>
                                                    {formatDateHeader(dateGroup.date)}
                                                </Text>
                                                <Ionicons name="calendar-outline" size={16} color="#64748B" />
                                            </View>
                                        </View>

                                        {/* Activities for this date */}
                                        {dateGroup.activities.map((item, index) => {
                                            console.log(`  📌 Rendering activity ${index + 1}:`, item.type, item.data._id);
                                            return (
                                                <React.Fragment key={`${dateGroup.date}-${item.type}-${item.data._id}`}>
                                                    {item.type === 'activity'
                                                        ? renderActivityItem(item.data as Activity)
                                                        : item.type === 'material'
                                                            ? renderMaterialActivityItem(item.data as MaterialActivity)
                                                            : renderOtherCostActivityItem(item.data as OtherCostActivity)
                                                    }
                                                </React.Fragment>
                                            );
                                        })}
                                    </View>
                                );
                            })}

                            {/* Load More Button for Date Mode */}
                            {hasMoreDates && (
                                <View style={styles.loadMoreContainer}>
                                    <TouchableOpacity
                                        style={[styles.loadMoreButton, loadingMore && styles.loadMoreButtonDisabled]}
                                        onPress={handleLoadMore}
                                        disabled={loadingMore}
                                        activeOpacity={0.7}
                                    >
                                        {loadingMore ? (
                                            <>
                                                <ActivityIndicator size="small" color="#FFFFFF" />
                                                <Text style={styles.loadMoreText}>Loading...</Text>
                                            </>
                                        ) : (
                                            <>
                                                <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
                                                <Text style={styles.loadMoreText}>Load More Activities</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                    <Text style={styles.loadMoreHint}>
                                        Showing activities by date • Load more to see older activities
                                    </Text>
                                </View>
                            )}

                            {/* Date Navigation Controls */}
                            {selectedVendors.length === 0 && (
                                <View style={styles.compactDateNavigation}>
                                    {/* Compact Date Navigation Bar */}
                                    <View style={styles.dateNavigationBar}>
                                        {/* Previous Day Button */}
                                        <TouchableOpacity
                                            style={[
                                                styles.compactNavButton,
                                                styles.prevButton,
                                                (!hasPrevDate || loading) && styles.navButtonDisabled
                                            ]}
                                            onPress={handlePreviousDay}
                                            disabled={!hasPrevDate || loading}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons
                                                name="chevron-back"
                                                size={20}
                                                color={(!hasPrevDate || loading) ? '#9CA3AF' : '#10B981'}
                                            />
                                        </TouchableOpacity>

                                        {/* Current Date Display - Compact */}
                                        <View style={styles.compactDateDisplay}>
                                            <View style={styles.compactDateBadge}>
                                                <Ionicons name="calendar" size={14} color="#10B981" />
                                                <Text style={styles.compactDateText}>
                                                    {formatDateHeader(currentDate)}
                                                </Text>
                                            </View>
                                            <Text style={styles.compactActivityCount}>
                                                {groupedActivities.reduce((sum, group) => sum + group.activities.length, 0)} activities
                                            </Text>
                                        </View>

                                        {/* Next Day Button */}
                                        <TouchableOpacity
                                            style={[
                                                styles.compactNavButton,
                                                styles.nextButton,
                                                (!hasNextDate || loading) && styles.navButtonDisabled
                                            ]}
                                            onPress={handleNextDay}
                                            disabled={!hasNextDate || loading}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons
                                                name="chevron-forward"
                                                size={20}
                                                color={(!hasNextDate || loading) ? '#9CA3AF' : '#10B981'}
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Loading indicator - show when loading with enhanced animation */}
                                    {loading && (
                                        <View style={styles.compactLoadingIndicator}>
                                            <ActivityIndicator size="small" color="#10B981" />
                                            <Text style={styles.compactLoadingText}>Loading date...</Text>
                                        </View>
                                    )}

                                    {/* Optional: Date navigation info - very compact */}
                                    {availableDates.length > 1 && (
                                        <View style={styles.compactNavigationInfo}>
                                            <Text style={styles.compactInfoText}>
                                                {availableDates.indexOf(currentDate) + 1} of {availableDates.length} dates
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </Animated.View>
                    </>
                )}
            </ScrollView>

            {/* Date Picker Modal */}
            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()} // Can't select future dates
                />
            )}

            {/* ✅ NEW: Vendor Filter Modal */}
            <Modal
                visible={showVendorModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowVendorModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.vendorModalContainer}>
                        {/* Modal Header */}
                        <View style={styles.vendorModalHeader}>
                            <View>
                                <Text style={styles.vendorModalTitle}>Filter by Vendors</Text>
                                {selectedVendors.length > 0 && (
                                    <Text style={styles.vendorModalSubtitle}>
                                        {selectedVendors.length} vendor{selectedVendors.length > 1 ? 's' : ''} selected
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowVendorModal(false)}
                                style={styles.modalCloseButton}
                            >
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {/* Vendor List */}
                        <ScrollView style={styles.vendorList}>
                            {/* All Vendors Option */}
                            <TouchableOpacity
                                style={[
                                    styles.vendorItem,
                                    selectedVendors.length === 0 && styles.vendorItemActive
                                ]}
                                onPress={() => {
                                    setSelectedVendors([]);
                                }}
                            >
                                <View style={styles.vendorItemLeft}>
                                    <View style={[
                                        styles.checkbox,
                                        selectedVendors.length === 0 && styles.checkboxChecked
                                    ]}>
                                        {selectedVendors.length === 0 && (
                                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                        )}
                                    </View>
                                    <Ionicons
                                        name="apps-outline"
                                        size={20}
                                        color={selectedVendors.length === 0 ? "#3A78B5" : "#64748B"}
                                    />
                                    <Text style={[
                                        styles.vendorItemText,
                                        selectedVendors.length === 0 && styles.vendorItemTextActive
                                    ]}>
                                        All Vendors
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {/* Divider */}
                            {availableVendors.length > 0 && (
                                <View style={styles.vendorDivider} />
                            )}

                            {/* Individual Vendors */}
                            {availableVendors.length > 0 ? (
                                availableVendors.map((vendor, index) => {
                                    const isSelected = selectedVendors.includes(vendor);
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.vendorItem,
                                                isSelected && styles.vendorItemActive
                                            ]}
                                            onPress={() => {
                                                if (isSelected) {
                                                    // Remove vendor from selection
                                                    setSelectedVendors(selectedVendors.filter(v => v !== vendor));
                                                } else {
                                                    // Add vendor to selection
                                                    setSelectedVendors([...selectedVendors, vendor]);
                                                }
                                            }}
                                        >
                                            <View style={styles.vendorItemLeft}>
                                                <View style={[
                                                    styles.checkbox,
                                                    isSelected && styles.checkboxChecked
                                                ]}>
                                                    {isSelected && (
                                                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                                    )}
                                                </View>
                                                <Ionicons
                                                    name="person-outline"
                                                    size={20}
                                                    color={isSelected ? "#3A78B5" : "#64748B"}
                                                />
                                                <Text style={[
                                                    styles.vendorItemText,
                                                    isSelected && styles.vendorItemTextActive
                                                ]}>
                                                    {vendor}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })
                            ) : (
                                <View style={styles.noVendorsContainer}>
                                    <Ionicons name="business-outline" size={48} color="#CBD5E1" />
                                    <Text style={styles.noVendorsText}>No vendors found</Text>
                                    <Text style={styles.noVendorsHint}>
                                        Add materials with contractor names to see vendors here
                                    </Text>
                                </View>
                            )}
                        </ScrollView>

                        {/* Modal Footer */}
                        <View style={styles.vendorModalFooter}>
                            {selectedVendors.length > 0 && (
                                <TouchableOpacity
                                    style={styles.clearFilterButton}
                                    onPress={() => {
                                        setSelectedVendors([]);
                                    }}
                                >
                                    <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                                    <Text style={styles.clearFilterButtonText}>Clear All Filters</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.applyFilterButton}
                                onPress={() => setShowVendorModal(false)}
                            >
                                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                                <Text style={styles.applyFilterButtonText}>
                                    Apply {selectedVendors.length > 0 ? `(${selectedVendors.length})` : ''}
                                </Text>
                            </TouchableOpacity>
                        </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    headerContent: {
        flex: 1,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    refreshButton: {
        padding: 8,
    },
    // ✅ NEW: Vendor Filter Button Styles
    vendorFilterButton: {
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#EAF0FE',
        position: 'relative',
    },
    vendorFilterButtonActive: {
        backgroundColor: '#3A78B5',
    },
    vendorFilterBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#EF4444',
        borderRadius: 8,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    vendorFilterBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // ✅ NEW: Vendor Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    vendorModalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '70%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
    },
    vendorModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    vendorModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    vendorModalSubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    modalCloseButton: {
        padding: 4,
    },
    vendorList: {
        maxHeight: 400,
    },
    vendorItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    vendorItemActive: {
        backgroundColor: '#F8FAFC',
    },
    vendorItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    // ✅ NEW: Checkbox styles
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    checkboxChecked: {
        backgroundColor: '#3A78B5',
        borderColor: '#3A78B5',
    },
    vendorItemText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#475569',
        flex: 1,
    },
    vendorItemTextActive: {
        color: '#1E293B',
        fontWeight: '600',
    },
    vendorDivider: {
        height: 8,
        backgroundColor: '#F8FAFC',
    },
    noVendorsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 32,
    },
    noVendorsText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 16,
        marginBottom: 8,
    },
    noVendorsHint: {
        fontSize: 13,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 18,
    },
    vendorModalFooter: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        flexDirection: 'row',
        gap: 12,
    },
    clearFilterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FEE2E2',
        flex: 1,
    },
    clearFilterButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#EF4444',
    },
    // ✅ NEW: Apply button styles
    applyFilterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#3A78B5',
        flex: 1,
    },
    applyFilterButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        position: 'relative',
    },
    tabActive: {
        // Active state handled by indicator
    },
    tabText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#6B7280',
    },
    tabTextActive: {
        color: '#3A78B5',
        fontWeight: '600',
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: '#3A78B5',
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
    },
    subTabsContainer: {
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        maxHeight: 56,
    },
    subTabsContentContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 10,
        alignItems: 'center',
    },
    subTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        height: 36,
    },
    subTabActive: {
        backgroundColor: '#FFFFFF',
        borderColor: '#3A78B5',
        shadowColor: '#3A78B5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    subTabText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748B',
    },
    subTabTextActive: {
        color: '#1E293B',
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    activitiesList: {
        padding: 16,
    },
    activityItem: {
        marginBottom: 12,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    activityGradient: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 20,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
        gap: 8,
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    categoryBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    userBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    userAvatarSmall: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userAvatarSmallText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    activityContent: {
        flex: 1,
    },
    activityDescription: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
        flex: 1,
        lineHeight: 20,
    },
    activityMessage: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 8,
        lineHeight: 18,
    },
    activityCost: {
        fontSize: 16,
        fontWeight: '700',
        color: '#10B981',
        marginBottom: 4,
    },
    activityMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    activityUser: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    activityDot: {
        fontSize: 12,
        color: '#CBD5E1',
        marginHorizontal: 6,
    },
    activityTime: {
        fontSize: 12,
        color: '#94A3B8',
    },
    // Material Activity Card Styles
    materialActivityCard: {
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
    materialActivityGradient: {
        padding: 18,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
    },
    materialActivityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    activityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 10,
        gap: 6,
    },
    activityBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    materialActivityTime: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    materialActivityTimeFooter: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    projectInfo: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    projectInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    projectInfoText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    materialsList: {
        gap: 10,
        marginBottom: 12,
    },
    materialItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    materialIconSmall: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    materialDetails: {
        flex: 1,
    },
    materialName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 2,
    },
    materialQuantity: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    materialCost: {
        fontSize: 13,
        color: '#10B981',
        fontWeight: '600',
    },
    laborCategory: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
        fontStyle: 'italic',
    },
    laborDescriptionCard: {
        backgroundColor: '#FFFBEB',
        borderRadius: 8,
        marginTop: 6,
        marginRight: 4,
        overflow: 'hidden',
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    laborDescriptionAccent: {
        width: 3,
        backgroundColor: '#F59E0B',
    },
    laborDescriptionContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 10,
        gap: 8,
    },
    laborDescriptionLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#B45309',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    laborDescriptionText: {
        fontSize: 12,
        color: '#78350F',
        lineHeight: 17,
        fontWeight: '500',
    },
    totalCostContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    totalCostLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#166534',
    },
    totalCostValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#15803D',
    },
    phaseProgressContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    phaseProgressLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginRight: 8,
    },
    phaseProgressValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
    },
    phaseProgressBarTrack: {
        height: 6,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 12,
    },
    phaseProgressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: '#F8FAFC',
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#3A78B5',
    },
    messageText: {
        flex: 1,
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
    },
    materialActivityFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    userAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#3A78B5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userAvatarText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    userName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },
    materialCountBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    materialCountText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
        paddingHorizontal: 40,
    },
    loadingContainer: {
        padding: 20,
    },
    loadingHeader: {
        alignItems: 'center',
        marginBottom: 30,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '600',
    },
    skeletonCard: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
    },
    skeletonIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: '#E2E8F0',
        marginRight: 14,
    },
    skeletonContent: {
        flex: 1,
    },
    skeletonLine: {
        height: 16,
        backgroundColor: '#E2E8F0',
        borderRadius: 8,
        marginBottom: 8,
        width: '80%',
    },
    skeletonLineSmall: {
        height: 12,
        backgroundColor: '#E2E8F0',
        borderRadius: 6,
        marginBottom: 6,
        width: '60%',
    },
    skeletonLineTiny: {
        height: 10,
        backgroundColor: '#E2E8F0',
        borderRadius: 5,
        width: '40%',
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        color: '#EF4444',
        fontWeight: '600',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: '#3A78B5',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    errorHint: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    errorActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    debugButton: {
        backgroundColor: '#F59E0B',
    },
    emptyStateGradient: {
        padding: 40,
        borderRadius: 24,
        alignItems: 'center',
        margin: 20,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    emptyActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3A78B5',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#3A78B5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    emptyActionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    // Date Group Styles
    dateGroupContainer: {
        marginBottom: 20,
    },
    dateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 18,
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
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
    activityCountText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748B',
    },
    dateHeaderText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748B',
    },
    // New simplified activity card styles
    activityItemNew: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    iconContainerNew: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activityContentNew: {
        flex: 1,
    },
    activityHeaderNew: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    activityDescriptionNew: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        lineHeight: 20,
        marginRight: 8,
    },
    categoryBadgeNew: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    categoryBadgeTextNew: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6B7280',
        letterSpacing: 0.5,
    },
    activityMessageNew: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 12,
        lineHeight: 18,
    },
    activityFooterNew: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userInfoNew: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userAvatarNew: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    userAvatarTextNew: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    userNameNew: {
        fontSize: 13,
        fontWeight: '500',
        color: '#374151',
    },
    activityTimeNew: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    // Load More Button Styles
    loadMoreContainer: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 16,
    },
    loadMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3A78B5',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#3A78B5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        minWidth: 200,
        justifyContent: 'center',
    },
    loadMoreButtonSecondary: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#3A78B5',
        shadowColor: '#000',
        shadowOpacity: 0.1,
    },
    loadMoreButtonDisabled: {
        backgroundColor: '#9CA3AF',
        shadowColor: '#9CA3AF',
        borderColor: '#9CA3AF',
    },
    loadMoreText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    loadMoreTextSecondary: {
        color: '#3A78B5',
    },
    loadMoreHint: {
        marginTop: 12,
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 18,
    },
    // Traditional Pagination Styles
    paginationContainer: {
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        alignItems: 'center',
        gap: 16,
    },
    paginationLoadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    paginationLoadingText: {
        fontSize: 14,
        color: '#64748B',
        fontStyle: 'italic',
    },
    paginationControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    paginationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 6,
        minWidth: 100,
        justifyContent: 'center',
    },
    paginationButtonDisabled: {
        backgroundColor: '#F1F5F9',
        borderColor: '#E2E8F0',
    },
    paginationButtonText: {
        fontSize: 14,
        color: '#3A78B5',
        fontWeight: '500',
    },
    paginationButtonTextDisabled: {
        color: '#CBD5E1',
    },
    pageNumbersContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    pageNumberButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pageNumberButtonActive: {
        backgroundColor: '#3A78B5',
        borderColor: '#3A78B5',
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
    paginationInfo: {
        alignItems: 'center',
        gap: 4,
    },
    paginationInfoText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    paginationTotalText: {
        fontSize: 12,
        color: '#94A3B8',
        fontStyle: 'italic',
    },
    paginationStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EAF0FE',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 12,
        gap: 8,
    },
    paginationStatusText: {
        fontSize: 13,
        color: '#1E40AF',
        fontWeight: '500',
    },
    singlePageHint: {
        fontSize: 11,
        color: '#F59E0B',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 4,
    },
    // Pagination Banner Styles
    paginationBanner: {
        backgroundColor: '#EAF0FE',
        borderBottomWidth: 1,
        borderBottomColor: '#C4D8FC',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    paginationBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    paginationBannerText: {
        fontSize: 13,
        color: '#1E40AF',
        fontWeight: '500',
        flex: 1,
        textAlign: 'center',
    },
    paginationBannerBadge: {
        backgroundColor: '#3A78B5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    paginationBannerBadgeText: {
        fontSize: 11,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    // Date Navigation Styles
    dateNavigationButton: {
        backgroundColor: '#F0FDF4',
        borderColor: '#BBF7D0',
        minWidth: 120,
    },
    dateNavigationButtonText: {
        color: '#10B981',
    },
    currentDateContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    currentDateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BBF7D0',
        gap: 8,
        marginBottom: 4,
    },
    currentDateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#059669',
    },
    currentDateSubtext: {
        fontSize: 12,
        color: '#6B7280',
        fontStyle: 'italic',
    },
    // Compact Date Navigation Styles
    compactDateNavigation: {
        backgroundColor: '#FFFFFF',
        width: '98%', // Increased from 96% to 98% for maximum space utilization
        alignSelf: 'center', // Center the container
        marginVertical: 12,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    dateNavigationBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8, // Further reduced padding to maximize space
        paddingVertical: 12,
        justifyContent: 'space-between',
    },
    compactNavButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44, // Fixed square size for icon-only buttons
        height: 44, // Fixed square size for icon-only buttons
        borderRadius: 12, // Slightly larger border radius for better appearance
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#BBF7D0',
        flex: 0, // Don't let buttons grow
    },
    prevButton: {
        // Specific styles for previous button if needed
    },
    nextButton: {
        // Specific styles for next button if needed
    },
    navButtonDisabled: {
        backgroundColor: '#F9FAFB',
        borderColor: '#E5E7EB',
        opacity: 0.6,
    },
    compactNavButtonText: {
        fontSize: 11, // Further reduced from 12 to make buttons more compact
        fontWeight: '600',
        color: '#10B981',
    },
    navButtonTextDisabled: {
        color: '#9CA3AF',
    },
    compactDateDisplay: {
        alignItems: 'center',
        flex: 3, // Increased from 2 to 3 since buttons are now much smaller
        paddingHorizontal: 16, // Increased padding for better spacing
        minWidth: 0, // Allow shrinking if needed
    },
    compactDateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Center the content horizontally within the badge
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 16, // Increased padding since we have more space
        paddingVertical: 10, // Increased vertical padding
        borderRadius: 12, // Larger border radius for better appearance
        borderWidth: 1,
        borderColor: '#BBF7D0',
        gap: 10, // Increased gap between icon and text
        marginBottom: 2,
        maxWidth: '100%', // Ensure it doesn't overflow
        minWidth: 140, // Increased minimum width for better appearance
    },
    compactDateText: {
        fontSize: 15, // Increased font size since we have more space
        fontWeight: '600',
        color: '#059669',
        flexShrink: 1, // Allow text to shrink if needed
        textAlign: 'center', // Center align the date text
    },
    compactActivityCount: {
        fontSize: 10, // Slightly smaller
        color: '#6B7280',
        fontWeight: '500',
        textAlign: 'center',
    },
    compactLoadingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#F8FAFC',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        gap: 6,
    },
    compactLoadingText: {
        fontSize: 12,
        color: '#6B7280',
        fontStyle: 'italic',
    },
    compactNavigationInfo: {
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 16,
        backgroundColor: '#F8FAFC',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    compactInfoText: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    // Simple Empty State Styles (keeps all UI elements visible)
    simpleEmptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
    },
    simpleEmptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    simpleEmptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 16,
        textAlign: 'center',
    },
    removeFilterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EF4444',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginTop: 20,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    removeFilterButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    // Loading Animation Styles
    navigationBarLoading: {
        opacity: 0.8,
    },
    navButtonLoading: {
        backgroundColor: '#F0FDF4',
        borderColor: '#BBF7D0',
    },
    dateBadgeLoading: {
        opacity: 0.9,
    },
    // Transfer details styles
    transferDetailsContainer: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    transferRoute: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    transferProject: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingHorizontal: 8,
    },
    transferProjectName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
        marginLeft: 6,
        flex: 1,
    },
    // ✅ NEW: Contractor info styles
    contractorInfoContainer: {
        backgroundColor: '#F5F3FF',
        borderRadius: 10,
        padding: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#DDD6FE',
    },
    contractorInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    contractorLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6B7280',
    },
    contractorName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#3A78B5',
        flex: 1,
    },
});

export default NotificationPage;
