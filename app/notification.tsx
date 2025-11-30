import { getClientId } from '@/functions/clientId';
import { domain } from '@/lib/domain';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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
    createdAt: string;
}

type TabType = 'all' | 'project' | 'material';

const NotificationPage: React.FC = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [activities, setActivities] = useState<Activity[]>([]);
    const [materialActivities, setMaterialActivities] = useState<MaterialActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Performance optimization
    const isLoadingRef = React.useRef(false);
    const lastLoadTimeRef = React.useRef<number>(0);
    const DEBOUNCE_DELAY = 500;
    const [currentUser, setCurrentUser] = useState<{ userId: string; fullName: string } | null>(null);

    // Get current user data from AsyncStorage
    const getCurrentUser = async () => {
        try {
            const userDetailsString = await AsyncStorage.getItem("user");
            if (userDetailsString) {
                const userData = JSON.parse(userDetailsString);
                const user = {
                    userId: userData._id || userData.id || userData.clientId || 'unknown',
                    fullName: userData.name || userData.username || 'Unknown User',
                };
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
            const materialDataRaw = materialActivityRes.data;

            // Handle different response formats
            let materialData: MaterialActivity[] = [];
            if (Array.isArray(materialDataRaw)) {
                materialData = materialDataRaw;
            } else if (materialDataRaw && typeof materialDataRaw === 'object') {
                // Check if it's wrapped in a property
                materialData = materialDataRaw.materialActivities ||
                    materialDataRaw.activities ||
                    materialDataRaw.data ||
                    [];
            }

            console.log('\n--- EXTRACTED DATA ---');
            console.log('Activities count:', activityData.activities?.length || 0);
            console.log('Material Activities count:', materialData.length);

            // Debug user data in activities
            if (materialData.length > 0) {
                console.log('\n--- SAMPLE MATERIAL ACTIVITY ---');
                console.log('First material activity:', JSON.stringify(materialData[0], null, 2));
                console.log('User in first activity:', materialData[0].user);
            }

            if (activityData.activities?.length > 0) {
                console.log('\n--- SAMPLE PROJECT ACTIVITY ---');
                console.log('First project activity:', JSON.stringify(activityData.activities[0], null, 2));
                console.log('User in first activity:', activityData.activities[0].user);
            }
            console.log('========================================\n');

            setActivities(activityData.activities || []);
            setMaterialActivities(materialData);
        } catch (error) {
            console.error('Error fetching activities:', error);
            setError('Failed to load activities');
        } finally {
            isLoadingRef.current = false;
            setLoading(false);
        }
    };

    useEffect(() => {
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
        if (category === 'material') return { name: 'cube', color: '#F59E0B' };
        if (category === 'staff') return { name: 'people', color: '#EF4444' };
        return { name: 'information-circle', color: '#6B7280' };
    };

    const getMaterialActivityIcon = (activity: 'imported' | 'used') => {
        return activity === 'imported'
            ? { name: 'download', color: '#10B981' }
            : { name: 'arrow-forward', color: '#EF4444' };
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    const renderActivityItem = (activity: Activity) => {
        const icon = getActivityIcon(activity.activityType, activity.category);

        // Use activity user or fallback to current user
        const displayUser = activity.user?.fullName && activity.user.fullName !== 'Unknown User'
            ? activity.user
            : currentUser || { userId: 'unknown', fullName: 'Unknown User' };

        return (
            <View key={activity._id} style={styles.activityItem}>
                <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
                    <Ionicons name={icon.name as any} size={24} color={icon.color} />
                </View>
                <View style={styles.activityContent}>
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                    {activity.message && (
                        <Text style={styles.activityMessage}>{activity.message}</Text>
                    )}
                    <View style={styles.activityMeta}>
                        <Text style={styles.activityUser}>{displayUser.fullName}</Text>
                        <Text style={styles.activityDot}>•</Text>
                        <Text style={styles.activityTime}>{formatTimeAgo(activity.createdAt)}</Text>
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

        // Use activity user or fallback to current user
        const displayUser = activity.user?.fullName && activity.user.fullName !== 'Unknown User'
            ? activity.user
            : currentUser || { userId: 'unknown', fullName: 'Unknown User' };

        return (
            <View key={activity._id} style={styles.materialActivityCard}>
                {/* Header with activity type badge */}
                <View style={styles.materialActivityHeader}>
                    <View style={[
                        styles.activityBadge,
                        { backgroundColor: isImported ? '#ECFDF5' : '#FEF2F2' }
                    ]}>
                        <Ionicons
                            name={icon.name as any}
                            size={16}
                            color={icon.color}
                        />
                        <Text style={[
                            styles.activityBadgeText,
                            { color: icon.color }
                        ]}>
                            {isImported ? 'Imported' : 'Used'}
                        </Text>
                    </View>
                    <Text style={styles.materialActivityTime}>
                        {formatTimeAgo(activity.createdAt)}
                    </Text>
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
                    <View style={styles.materialCountBadge}>
                        <Text style={styles.materialCountText}>
                            {materialCount} item{materialCount > 1 ? 's' : ''}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    const getCombinedActivities = () => {
        const combined: Array<{ type: 'activity' | 'material'; data: Activity | MaterialActivity; timestamp: string }> = [];

        activities.forEach(a => {
            combined.push({ type: 'activity', data: a, timestamp: a.createdAt });
        });

        materialActivities.forEach(m => {
            combined.push({ type: 'material', data: m, timestamp: m.createdAt });
        });

        // Sort by timestamp descending
        combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return combined;
    };

    const getFilteredActivities = () => {
        if (activeTab === 'all') {
            return getCombinedActivities();
        } else if (activeTab === 'project') {
            return activities.map(a => ({ type: 'activity' as const, data: a, timestamp: a.createdAt }));
        } else {
            return materialActivities.map(m => ({ type: 'material' as const, data: m, timestamp: m.createdAt }));
        }
    };

    const filteredActivities = getFilteredActivities();

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
                    onPress={() => {
                        console.log('\n========================================');
                        console.log('DEBUG INFO');
                        console.log('========================================');
                        console.log('Activities:', activities.length);
                        console.log('Material Activities:', materialActivities.length);
                        console.log('Active Tab:', activeTab);
                        console.log('Filtered Activities:', filteredActivities.length);
                        console.log('Loading:', loading);
                        console.log('Error:', error);
                        console.log('========================================\n');
                    }}
                    style={styles.refreshButton}
                >
                    <Ionicons name="bug" size={22} color="#F59E0B" />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
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
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={styles.loadingText}>Loading activities...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.centerContainer}>
                        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={() => fetchActivities()}>
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : filteredActivities.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Ionicons name="notifications-off-outline" size={64} color="#CBD5E1" />
                        <Text style={styles.emptyTitle}>No Activities Yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Your project activities will appear here
                        </Text>
                    </View>
                ) : (
                    <View style={styles.activitiesList}>
                        {filteredActivities.map((item, index) => (
                            <React.Fragment key={`${item.type}-${item.data._id}`}>
                                {item.type === 'activity'
                                    ? renderActivityItem(item.data as Activity)
                                    : renderMaterialActivityItem(item.data as MaterialActivity)
                                }
                            </React.Fragment>
                        ))}
                    </View>
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
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
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
        paddingVertical: 16,
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
    scrollView: {
        flex: 1,
    },
    activitiesList: {
        padding: 16,
    },
    activityItem: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
    },
    activityDescription: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
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
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9',
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
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    activityBadgeText: {
        fontSize: 13,
        fontWeight: '600',
    },
    materialActivityTime: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
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
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
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
    emptyTitle: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    emptySubtitle: {
        marginTop: 8,
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default NotificationPage;
