import { getClientId } from '@/functions/clientId';
import { domain } from '@/lib/domain';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StatusBar,
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
    clientId: string;
    projectId?: string;
    projectName?: string;
    sectionId?: string;
    sectionName?: string;
    miniSectionId?: string;
    miniSectionName?: string;
    activityType: string;
    category: string;
    action: string;
    description: string;
    message?: string;
    date: string;
    createdAt: string;
    metadata?: any;
}

interface GroupedActivities {
    [date: string]: Activity[];
}

interface User {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    role?: string;
}

const MyActivitiesScreen: React.FC = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    // Parse user data from params
    const user: User = JSON.parse(params.user as string);
    
    const [activities, setActivities] = useState<Activity[]>([]);
    const [groupedActivities, setGroupedActivities] = useState<GroupedActivities>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get user's display name
    const getUserDisplayName = () => {
        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`;
        } else if (user.firstName) {
            return user.firstName;
        } else if (user.lastName) {
            return user.lastName;
        } else if (user.name) {
            return user.name;
        }
        return 'My Activities';
    };

    // Fetch activities for this user
    const fetchMyActivities = async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            setError(null);

            const clientId = await getClientId();
            if (!clientId) {
                setError('Client ID not found');
                return;
            }

            console.log('🔍 Fetching my activities for user:', getUserDisplayName());
            console.log('🔍 User ID:', user._id);
            console.log('🔍 Client ID:', clientId);

            // Fetch activities where user.userId matches user._id
            const response = await axios.get(`${domain}/api/activity`, {
                params: {
                    clientId: clientId,
                    userId: user._id,
                    limit: 100, // Get more activities for the user
                }
            });

            console.log('📦 My Activities API response:', response.data);

            const responseData = response.data as any;
            if (responseData.success && responseData.data) {
                const activitiesData = responseData.data.activities || [];
                console.log('✅ Found', activitiesData.length, 'activities for me');
                
                setActivities(activitiesData);
                groupActivitiesByDate(activitiesData);
            } else {
                console.warn('⚠️ Unexpected response structure:', responseData);
                setActivities([]);
                setGroupedActivities({});
            }
        } catch (error: any) {
            console.error('❌ Error fetching my activities:', error);
            console.error('❌ Error response:', error.response?.data);
            setError('Failed to load activities');
            setActivities([]);
            setGroupedActivities({});
        } finally {
            setLoading(false);
        }
    };

    // Group activities by date
    const groupActivitiesByDate = (activities: Activity[]) => {
        const grouped: GroupedActivities = {};
        
        activities.forEach(activity => {
            // Use the date field from activity, or fall back to createdAt
            const activityDate = activity.date || activity.createdAt;
            const dateKey = new Date(activityDate).toDateString();
            
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(activity);
        });

        // Sort activities within each date by time (newest first)
        Object.keys(grouped).forEach(date => {
            grouped[date].sort((a, b) => 
                new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
            );
        });

        console.log('📊 Grouped my activities by date:', Object.keys(grouped));
        setGroupedActivities(grouped);
    };

    // Format time from date string
    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    };

    // Get activity icon based on activity type
    const getActivityIcon = (activityType: string, category: string) => {
        switch (category) {
            case 'project':
                return activityType.includes('created') ? 'add-circle' : 
                       activityType.includes('updated') ? 'create' : 'trash';
            case 'section':
                return 'layers';
            case 'mini_section':
                return 'grid';
            case 'material':
                return 'cube';
            case 'staff':
                return 'people';
            case 'building':
                return 'business';
            default:
                return 'ellipse';
        }
    };

    // Get activity color based on action
    const getActivityColor = (action: string) => {
        switch (action) {
            case 'create':
                return '#10B981'; // Green
            case 'update':
                return '#3B82F6'; // Blue
            case 'delete':
                return '#EF4444'; // Red
            case 'assign':
                return '#8B5CF6'; // Purple
            case 'import':
                return '#F59E0B'; // Orange
            default:
                return '#6B7280'; // Gray
        }
    };

    // Pull to refresh handler
    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMyActivities(false);
        setRefreshing(false);
    };

    // Initial data fetch
    useEffect(() => {
        fetchMyActivities();
    }, []);

    // Get sorted date keys (newest first)
    const sortedDateKeys = Object.keys(groupedActivities).sort((a, b) => 
        new Date(b).getTime() - new Date(a).getTime()
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>My Activities</Text>
                    <Text style={styles.headerSubtitle}>
                        {getUserDisplayName()} • Activity History
                    </Text>
                </View>
            </View>

            {/* User Info Card */}
            <View style={styles.userCard}>
                <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                        {getUserDisplayName().split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)}
                    </Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                        {getUserDisplayName()}
                    </Text>
                    {user.role && <Text style={styles.userRole}>{user.role}</Text>}
                    {user.email && <Text style={styles.userEmail}>{user.email}</Text>}
                </View>
                <View style={styles.activityCount}>
                    <Text style={styles.activityCountNumber}>{activities.length}</Text>
                    <Text style={styles.activityCountLabel}>Activities</Text>
                </View>
            </View>

            {/* Activities List */}
            <ScrollView 
                style={styles.activitiesList}
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
                        <Text style={styles.loadingText}>Loading your activities...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.centerContainer}>
                        <Ionicons name="alert-circle" size={48} color="#EF4444" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity 
                            style={styles.retryButton}
                            onPress={() => fetchMyActivities()}
                        >
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : activities.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
                        <Text style={styles.emptyTitle}>No Activities Found</Text>
                        <Text style={styles.emptySubtitle}>
                            You haven't performed any activities yet. Start working on projects to see your activity history here.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.activitiesContainer}>
                        {sortedDateKeys.map(dateKey => (
                            <View key={dateKey} style={styles.dateGroup}>
                                <Text style={styles.dateHeader}>
                                    {formatDate(dateKey)}
                                </Text>
                                
                                {groupedActivities[dateKey].map((activity, index) => (
                                    <View key={activity._id} style={styles.activityItem}>
                                        <View style={styles.activityTimeline}>
                                            <View style={[
                                                styles.activityDot,
                                                { backgroundColor: getActivityColor(activity.action) }
                                            ]}>
                                                <Ionicons 
                                                    name={getActivityIcon(activity.activityType, activity.category) as any}
                                                    size={12} 
                                                    color="white" 
                                                />
                                            </View>
                                            {index < groupedActivities[dateKey].length - 1 && (
                                                <View style={styles.timelineLine} />
                                            )}
                                        </View>
                                        
                                        <View style={styles.activityContent}>
                                            <View style={styles.activityHeader}>
                                                <Text style={styles.activityDescription}>
                                                    {activity.description}
                                                </Text>
                                                <Text style={styles.activityTime}>
                                                    {formatTime(activity.date || activity.createdAt)}
                                                </Text>
                                            </View>
                                            
                                            {activity.message && (
                                                <Text style={styles.activityMessage}>
                                                    {activity.message}
                                                </Text>
                                            )}
                                            
                                            <View style={styles.activityMeta}>
                                                <View style={[
                                                    styles.categoryBadge,
                                                    { backgroundColor: getActivityColor(activity.action) + '20' }
                                                ]}>
                                                    <Text style={[
                                                        styles.categoryText,
                                                        { color: getActivityColor(activity.action) }
                                                    ]}>
                                                        {activity.category}
                                                    </Text>
                                                </View>
                                                
                                                {activity.projectName && (
                                                    <Text style={styles.projectName}>
                                                        📁 {activity.projectName}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
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
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    userAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    userAvatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    userRole: {
        fontSize: 14,
        color: '#10B981',
        fontWeight: '500',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 12,
        color: '#6B7280',
    },
    activityCount: {
        alignItems: 'center',
    },
    activityCountNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#10B981',
    },
    activityCountLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    activitiesList: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        minHeight: 300,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        color: '#EF4444',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#3B82F6',
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    emptySubtitle: {
        marginTop: 8,
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    activitiesContainer: {
        padding: 16,
    },
    dateGroup: {
        marginBottom: 24,
    },
    dateHeader: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
        paddingLeft: 4,
    },
    activityItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    activityTimeline: {
        alignItems: 'center',
        marginRight: 16,
    },
    activityDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E5E7EB',
        marginTop: 8,
    },
    activityContent: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    activityDescription: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: '#1F2937',
        marginRight: 8,
    },
    activityTime: {
        fontSize: 12,
        color: '#6B7280',
    },
    activityMessage: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 8,
        fontStyle: 'italic',
    },
    activityMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    projectName: {
        fontSize: 12,
        color: '#6B7280',
        flex: 1,
        textAlign: 'right',
    },
});

export default MyActivitiesScreen;