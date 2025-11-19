import { getClientId } from '@/functions/clientId';
import { domain } from '@/lib/domain';
import { Ionicons } from '@expo/vector-icons';
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
    materials: Array<{
        name: string;
        unit: string;
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
            if (!clientId) {
                throw new Error('Client ID not found');
            }

            // Fetch both activities in parallel
            const [activityRes, materialActivityRes] = await Promise.all([
                axios.get(`${domain}/api/activity?clientId=${clientId}&limit=50`).catch(() => ({ data: { activities: [] } })),
                axios.get(`${domain}/api/materialActivity?clientId=${clientId}&limit=50`).catch(() => ({ data: [] })),
            ]);

            const activityData = activityRes.data as any;
            const materialData = Array.isArray(materialActivityRes.data) ? materialActivityRes.data : [];

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
                        <Text style={styles.activityUser}>{activity.user.fullName}</Text>
                        <Text style={styles.activityDot}>•</Text>
                        <Text style={styles.activityTime}>{formatTimeAgo(activity.createdAt)}</Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderMaterialActivityItem = (activity: MaterialActivity) => {
        const icon = getMaterialActivityIcon(activity.activity);
        const totalCost = activity.materials.reduce((sum, m) => sum + (m.cost || 0), 0);
        const materialCount = activity.materials.length;

        return (
            <View key={activity._id} style={styles.activityItem}>
                <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
                    <Ionicons name={icon.name as any} size={24} color={icon.color} />
                </View>
                <View style={styles.activityContent}>
                    <Text style={styles.activityDescription}>
                        {activity.activity === 'imported' ? 'Imported' : 'Used'} {materialCount} material{materialCount > 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.activityCost}>₹{totalCost.toLocaleString('en-IN')}</Text>
                    {activity.message && (
                        <Text style={styles.activityMessage}>{activity.message}</Text>
                    )}
                    <View style={styles.activityMeta}>
                        <Text style={styles.activityUser}>{activity.user.fullName}</Text>
                        <Text style={styles.activityDot}>•</Text>
                        <Text style={styles.activityTime}>{formatTimeAgo(activity.createdAt)}</Text>
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
