import { getClientId } from '@/functions/clientId';
import { domain } from '@/lib/domain';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    materials: Array<{
        name: string;
        unit: string;
        specs?: Record<string, any>;
        qnt: number;
        cost: number;
    }>;
    message?: string;
    activity: 'imported' | 'used';
    createdAt?: string;
    date?: string; // Material activities use 'date' field instead of 'createdAt'
}

type TabType = 'all' | 'project' | 'material';
type MaterialSubTab = 'imported' | 'used';

const NotificationPage: React.FC = () => {
    console.log('🏗️ NotificationPage component rendering/re-rendering');

    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [materialSubTab, setMaterialSubTab] = useState<MaterialSubTab>('imported');
    const [activitiesRaw, setActivitiesRaw] = useState<Activity[]>(() => {
        console.log('🎬 Initializing activities state to empty array');
        return [];
    });

    // SAFETY: Ensure activities is always an array, even if state gets corrupted
    const activities = React.useMemo(() => {
        console.log('🔍 Processing activities state:', activitiesRaw);
        console.log('   - Type:', typeof activitiesRaw);
        console.log('   - Is array?', Array.isArray(activitiesRaw));

        // If activitiesRaw is the API response object (has 'activities' property), extract it
        if (activitiesRaw && typeof activitiesRaw === 'object' && !Array.isArray(activitiesRaw)) {
            const anyActivities = activitiesRaw as any;
            if (anyActivities.activities && Array.isArray(anyActivities.activities)) {
                console.log('   ⚠️ WARNING: State contains API response object, extracting activities array');
                return anyActivities.activities as Activity[];
            }
        }

        // If it's already an array, return it
        if (Array.isArray(activitiesRaw)) {
            return activitiesRaw;
        }

        // Fallback to empty array
        console.log('   ⚠️ WARNING: State is not an array, returning empty array');
        return [];
    }, [activitiesRaw]);
    const [materialActivities, setMaterialActivities] = useState<MaterialActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Performance optimization
    const isLoadingRef = React.useRef(false);
    const lastLoadTimeRef = React.useRef<number>(0);
    const DEBOUNCE_DELAY = 500;
    const [currentUser, setCurrentUser] = useState<{ userId: string; fullName: string } | null>(null);

    // Animation
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

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

                const user = {
                    userId: userData._id || userData.id || userData.clientId || 'unknown',
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

    // Load current user on mount
    useEffect(() => {
        getCurrentUser();
    }, []);

    const fetchActivities = async (showLoadingState = true) => {
        console.log('🚀 fetchActivities CALLED');
        console.log('   - showLoadingState:', showLoadingState);
        console.log('   - isLoadingRef.current:', isLoadingRef.current);

        // Prevent duplicate calls
        if (isLoadingRef.current) {
            console.log('⏸️ Skipping fetch - already loading');
            return;
        }

        // Debounce
        const now = Date.now();
        const timeSinceLastLoad = now - lastLoadTimeRef.current;
        console.log('   - Time since last load:', timeSinceLastLoad, 'ms');

        if (timeSinceLastLoad < DEBOUNCE_DELAY && lastLoadTimeRef.current > 0) {
            console.log('⏸️ Skipping fetch - debounced');
            return;
        }
        lastLoadTimeRef.current = now;

        console.log('✅ Proceeding with fetch...');

        try {
            isLoadingRef.current = true;
            if (showLoadingState) {
                setLoading(true);
            }
            setError(null);

            const clientId = await getClientId();
            console.log('\n========================================');
            console.log('FETCHING ACTIVITIES');
            console.log('========================================');
            console.log('Client ID:', clientId);

            if (!clientId) {
                throw new Error('Client ID not found');
            }

            console.log('API URLs:');
            console.log('  - Activity:', `${domain}/api/activity?clientId=${clientId}&limit=50`);
            console.log('  - Material Activity:', `${domain}/api/materialActivity?clientId=${clientId}&limit=50`);

            // Fetch both activities in parallel with better error handling
            const [activityRes, materialActivityRes] = await Promise.all([
                axios.get(`${domain}/api/activity?clientId=${clientId}&limit=50`)
                    .catch((err) => {
                        console.error('❌ Activity API Error:', err?.response?.data || err.message);
                        return { data: { activities: [] } };
                    }),
                axios.get(`${domain}/api/materialActivity?clientId=${clientId}&limit=50`)
                    .catch((err) => {
                        console.error('❌ Material Activity API Error:', err?.response?.data || err.message);
                        return { data: [] };
                    }),
            ]);

            console.log('\n--- API RESPONSES ---');
            console.log('Activity Response:', JSON.stringify(activityRes.data, null, 2));
            console.log('Material Activity Response:', JSON.stringify(materialActivityRes.data, null, 2));

            const activityData = activityRes.data as any;
            const materialDataRaw = materialActivityRes.data as any;

            // Handle different response formats for Activity API
            let activities: Activity[] = [];
            if (Array.isArray(activityData)) {
                // If response is directly an array
                activities = activityData;
            } else if (activityData && typeof activityData === 'object') {
                // Check if it's wrapped in a property
                activities = (activityData.activities ||
                    activityData.data ||
                    activityData.activity ||
                    []) as Activity[];
            }

            // Handle different response formats for Material Activity API
            let materialData: MaterialActivity[] = [];
            if (Array.isArray(materialDataRaw)) {
                materialData = materialDataRaw;
            } else if (materialDataRaw && typeof materialDataRaw === 'object') {
                // Check if it's wrapped in a property
                materialData = (materialDataRaw.materialActivities ||
                    materialDataRaw.activities ||
                    materialDataRaw.data ||
                    []) as MaterialActivity[];
            }

            console.log('\n--- EXTRACTED DATA ---');
            console.log('Activities count:', activities.length);
            console.log('Material Activities count:', materialData.length);

            // Debug user data in activities
            if (materialData.length > 0) {
                console.log('\n--- SAMPLE MATERIAL ACTIVITY ---');
                console.log('First material activity:', JSON.stringify(materialData[0], null, 2));
                console.log('User in first activity:', materialData[0].user);
                console.log('\n🔍 DATE FIELD ANALYSIS:');
                console.log('   - date field:', materialData[0].date);
                console.log('   - date type:', typeof materialData[0].date);
                console.log('   - createdAt field:', materialData[0].createdAt);
                console.log('   - createdAt type:', typeof materialData[0].createdAt);

                // Test if date is valid
                if (materialData[0].date) {
                    const testDate = new Date(materialData[0].date);
                    console.log('   - date is valid?', !isNaN(testDate.getTime()));
                    console.log('   - parsed date:', testDate.toISOString());
                }
                if (materialData[0].createdAt) {
                    const testDate = new Date(materialData[0].createdAt);
                    console.log('   - createdAt is valid?', !isNaN(testDate.getTime()));
                    console.log('   - parsed createdAt:', testDate.toISOString());
                }
            }

            if (activities.length > 0) {
                console.log('\n--- SAMPLE PROJECT ACTIVITY ---');
                console.log('First project activity:', JSON.stringify(activities[0], null, 2));
                console.log('User in first activity:', activities[0].user);
            } else {
                console.warn('⚠️ NO ACTIVITIES FOUND!');
                console.warn('Raw response structure:', Object.keys(activityData));
                console.warn('Full response:', JSON.stringify(activityData, null, 2));
            }
            console.log('========================================\n');

            console.log('🔧 SETTING STATE:');
            console.log('   - About to call setActivities with:', activities);
            console.log('   - Is array?', Array.isArray(activities));
            console.log('   - Length:', activities.length);

            // Ensure we always set arrays, never undefined
            setActivitiesRaw(activities || []);
            setMaterialActivities(materialData || []);

            console.log('✅ State set successfully');
        } catch (error) {
            console.error('Error fetching activities:', error);
            setError('Failed to load activities');
            // Ensure arrays are initialized even on error
            setActivitiesRaw([]);
            setMaterialActivities([]);
        } finally {
            isLoadingRef.current = false;
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('📱 NotificationPage mounted - calling fetchActivities()');
        fetchActivities();
    }, []);

    const onRefresh = async () => {
        if (refreshing || isLoadingRef.current) {
            return;
        }

        setRefreshing(true);
        try {
            await fetchActivities(false);
        } finally {
            setRefreshing(false);
        }
    };

    const getActivityIcon = (type: string, category: string) => {
        if (category === 'project') return { name: 'folder', color: '#3B82F6' };
        if (category === 'section') return { name: 'layers', color: '#8B5CF6' };
        if (category === 'mini_section') return { name: 'grid', color: '#10B981' };
        if (category === 'staff') return { name: 'people', color: '#EF4444' };
        return { name: 'information-circle', color: '#6B7280' };
    };

    const getMaterialActivityIcon = (activity: 'imported' | 'used') => {
        return activity === 'imported'
            ? { name: 'download', color: '#10B981' }
            : { name: 'arrow-forward', color: '#EF4444' };
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

                    {activity.message && (
                        <Text style={styles.activityMessageNew}>{activity.message}</Text>
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
        return { icon: 'cube-outline', color: '#6B7280' };
    };

    const renderMaterialActivityItem = (activity: MaterialActivity) => {
        const icon = getMaterialActivityIcon(activity.activity);
        const totalCost = activity.materials.reduce((sum, m) => sum + (m.cost || 0), 0);
        const materialCount = activity.materials.length;
        const isImported = activity.activity === 'imported';

        // Debug: Log the date field to see what we're getting
        if (__DEV__) {
            console.log('Material Activity Date Debug:', {
                _id: activity._id,
                date: activity.date,
                createdAt: activity.createdAt,
                dateType: typeof activity.date,
                createdAtType: typeof activity.createdAt,
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
                                backgroundColor: isImported ? '#10B981' : '#EF4444',
                                shadowColor: isImported ? '#10B981' : '#EF4444',
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
                                {isImported ? 'IMPORTED' : 'USED'}
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

                    {/* Footer with user info */}
                    <View style={styles.materialActivityFooter}>
                        <View style={styles.userInfo}>
                            <View style={styles.userAvatar}>
                                <Text style={styles.userAvatarText}>
                                    {displayUser.fullName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.userName}>{displayUser.fullName}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const getCombinedActivities = () => {
        const combined: Array<{ type: 'activity' | 'material'; data: Activity | MaterialActivity; timestamp: string }> = [];

        // Safely iterate over activities (ensure it's an array)
        if (Array.isArray(activities)) {
            activities.forEach(a => {
                combined.push({ type: 'activity', data: a, timestamp: a.createdAt });
            });
        }

        // Safely iterate over material activities (ensure it's an array)
        if (Array.isArray(materialActivities)) {
            materialActivities.forEach(m => {
                // Material activities use 'date' field, fallback to 'createdAt'
                const timestamp: string = m.date || m.createdAt || new Date().toISOString();
                combined.push({ type: 'material' as const, data: m, timestamp });
            });
        }

        // Sort by timestamp descending
        combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return combined;
    };

    const getFilteredActivities = () => {
        if (activeTab === 'all') {
            return getCombinedActivities();
        } else if (activeTab === 'project') {
            // Safely map activities (ensure it's an array)
            if (Array.isArray(activities)) {
                return activities.map(a => ({ type: 'activity' as const, data: a, timestamp: a.createdAt }));
            }
            return [];
        } else if (activeTab === 'material') {
            // Filter materials based on sub-tab (ensure it's an array)
            if (Array.isArray(materialActivities)) {
                return materialActivities
                    .filter(m => m.activity === materialSubTab)
                    .map(m => ({
                        type: 'material' as const,
                        data: m,
                        timestamp: m.date || m.createdAt || new Date().toISOString()
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
                const dateKey = date.toISOString().split('T')[0]; // "2025-12-07"

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

    const groupedActivities = getGroupedByDate();

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
    console.log('- Should show empty state?', !loading && !error && filteredActivities.length === 0);
    console.log('- Should show activities?', !loading && !error && filteredActivities.length > 0);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Activity Feed</Text>
                    <Text style={styles.headerSubtitle}>
                        {filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'}
                    </Text>
                </View>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                    <Ionicons
                        name={refreshing ? "sync" : "refresh"}
                        size={22}
                        color="#3B82F6"
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={async () => {
                        console.log('\n========================================');
                        console.log('DEBUG INFO');
                        console.log('========================================');
                        console.log('Activities:', activities.length);
                        console.log('Material Activities:', materialActivities.length);
                        console.log('Active Tab:', activeTab);
                        console.log('Filtered Activities:', filteredActivities.length);
                        console.log('Loading:', loading);
                        console.log('Error:', error);

                        // Test direct API call
                        console.log('\n🧪 TESTING DIRECT API CALL...');
                        try {
                            const clientId = await getClientId();
                            const testRes = await axios.get(`${domain}/api/activity?clientId=${clientId}&limit=5`);
                            console.log('✅ Direct API Response:', JSON.stringify(testRes.data, null, 2));
                            console.log('Response type:', typeof testRes.data);
                            console.log('Is array?', Array.isArray(testRes.data));
                            if (typeof testRes.data === 'object' && testRes.data !== null && !Array.isArray(testRes.data)) {
                                console.log('Object keys:', Object.keys(testRes.data));
                            }
                        } catch (err: any) {
                            console.error('❌ Direct API Error:', err?.response?.data || err.message);
                        }

                        console.log('========================================\n');
                    }}
                    style={styles.refreshButton}
                >
                    <Ionicons name="bug" size={22} color="#F59E0B" />
                </TouchableOpacity>
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
                    style={[styles.tab, activeTab === 'material' && styles.tabActive]}
                    onPress={() => setActiveTab('material')}
                >
                    <Text style={[styles.tabText, activeTab === 'material' && styles.tabTextActive]}>
                        Materials
                    </Text>
                    {activeTab === 'material' && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
            </View>

            {/* Material Sub-Tabs - Only show when Materials tab is active */}
            {activeTab === 'material' && (
                <View style={styles.subTabsContainer}>
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
                </View>
            )}

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#3B82F6']}
                        tintColor="#3B82F6"
                    />
                }
            >
                {loading ? (
                    <>
                        {console.log('🔄 Rendering: LOADING STATE')}
                        <View style={styles.loadingContainer}>
                            <View style={styles.loadingHeader}>
                                <ActivityIndicator size="large" color="#3B82F6" />
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
                            <TouchableOpacity style={styles.retryButton} onPress={() => fetchActivities()}>
                                <Text style={styles.retryButtonText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : filteredActivities.length === 0 ? (
                    <>
                        {console.log('📭 Rendering: EMPTY STATE')}
                        <View style={styles.centerContainer}>
                            <LinearGradient
                                colors={['#F8FAFC', '#F1F5F9']}
                                style={styles.emptyStateGradient}
                            >
                                <View style={styles.emptyIconContainer}>
                                    <Ionicons name="notifications-off-outline" size={64} color="#94A3B8" />
                                </View>
                                <Text style={styles.emptyTitle}>No Activities Yet</Text>
                                <Text style={styles.emptySubtitle}>
                                    Your project activities will appear here{'\n'}
                                    Start by creating a project or adding materials
                                </Text>
                                <View style={{ marginTop: 20, padding: 15, backgroundColor: '#FEF3C7', borderRadius: 10 }}>
                                    <Text style={{ fontSize: 12, color: '#92400E', textAlign: 'center' }}>
                                        Debug Info:{'\n'}
                                        Raw Activities: {activities.length}{'\n'}
                                        Material Activities: {materialActivities.length}{'\n'}
                                        Active Tab: {activeTab}{'\n'}
                                        Tap the bug icon (🐛) for more details
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.emptyActionButton}
                                    onPress={() => router.push('/(tabs)')}
                                >
                                    <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                                    <Text style={styles.emptyActionText}>Get Started</Text>
                                </TouchableOpacity>
                            </LinearGradient>
                        </View>
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
                                                        : renderMaterialActivityItem(item.data as MaterialActivity)
                                                    }
                                                </React.Fragment>
                                            );
                                        })}
                                    </View>
                                );
                            })}
                        </Animated.View>
                    </>
                )}
            </ScrollView>
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
        color: '#3B82F6',
        fontWeight: '600',
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: '#3B82F6',
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
    },
    subTabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    subTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    subTabActive: {
        backgroundColor: '#FFFFFF',
        borderColor: '#3B82F6',
        shadowColor: '#3B82F6',
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
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: '#F8FAFC',
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#3B82F6',
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
        backgroundColor: '#3B82F6',
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
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
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
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#3B82F6',
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
});

export default NotificationPage;
