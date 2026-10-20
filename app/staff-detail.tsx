import { Colors } from '@/constants/theme';
import { getClientId } from '@/functions/clientId';
import { Staff } from '@/types/staff';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '@/utils/axiosConfig';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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

const INK = '#0F172A';

// The API returns at most this many; a full page means there may be older ones
const ACTIVITY_LIMIT = 100;

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

// Tinted tones from the shared palette — each label holds ≥4.5:1 on its tint.
// Green means something was added, red that something was removed; everything else is neutral blue.
const ACTION_TONES: Record<string, { bg: string; fg: string }> = {
    create: { bg: Colors.successLight, fg: Colors.successText },
    import: { bg: Colors.successLight, fg: Colors.successText },
    delete: { bg: Colors.errorLight, fg: Colors.errorText },
};
const DEFAULT_TONE = { bg: Colors.primaryLight, fg: Colors.primaryDark };

// "mini_section" → "Mini section", "site-engineer" → "Site engineer"
const humanize = (value?: string) => {
    const words = (value || '').replace(/[-_]/g, ' ').trim();
    return words ? words.charAt(0).toUpperCase() + words.slice(1) : '';
};

const StaffDetailScreen: React.FC = () => {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Parse staff data from params once; a bad or missing param shows a message instead of crashing
    const staff = useMemo<Staff | null>(() => {
        try {
            return params.staff ? JSON.parse(params.staff as string) : null;
        } catch {
            return null;
        }
    }, [params.staff]);

    const [activities, setActivities] = useState<Activity[]>([]);
    const [groupedActivities, setGroupedActivities] = useState<GroupedActivities>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch activities for this staff member
    const fetchStaffActivities = async (showLoading = true) => {
        if (!staff) {
            setLoading(false);
            return;
        }
        try {
            if (showLoading) {
                setLoading(true);
            }
            setError(null);

            const clientId = await getClientId();
            if (!clientId) {
                setError('Your session has expired. Sign in again to see activity.');
                return;
            }

            console.log('🔍 Fetching activities for staff:', staff.firstName, staff.lastName);

            // Fetch activities where user.userId matches staff._id
            const response = await apiClient.get(`/api/activity`, {
                params: {
                    clientId: clientId,
                    userId: staff._id,
                    limit: ACTIVITY_LIMIT,
                }
            });

            const responseData = response.data as any;
            if (responseData.success && responseData.data) {
                const activitiesData = responseData.data.activities || [];
                console.log('✅ Found', activitiesData.length, 'activities for staff');

                setActivities(activitiesData);
                groupActivitiesByDate(activitiesData);
            } else {
                console.warn('⚠️ Unexpected response structure:', responseData);
                setActivities([]);
                setGroupedActivities({});
            }
        } catch (error: any) {
            console.error('❌ Error fetching staff activities:', error);
            setError('Check your connection, then try again.');
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

        setGroupedActivities(grouped);
    };

    // "2:05 PM"
    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    // "Today", "Yesterday", "Monday, Oct 13" — the year only when it isn't this year
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            ...(date.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}),
        });
    };

    // Get activity icon based on activity type
    const getActivityIcon = (activityType: string, category: string) => {
        switch (category) {
            case 'project':
                return activityType.includes('created') ? 'add-circle-outline' :
                    activityType.includes('updated') ? 'create-outline' : 'trash-outline';
            case 'section':
                return 'layers-outline';
            case 'mini_section':
                return 'grid-outline';
            case 'material':
                return 'cube-outline';
            case 'labor':
                return 'hammer-outline';
            case 'equipment':
                return 'construct-outline';
            case 'staff':
                return 'people-outline';
            default:
                return 'ellipse-outline';
        }
    };

    // Pull to refresh handler
    const onRefresh = async () => {
        setRefreshing(true);
        await fetchStaffActivities(false);
        setRefreshing(false);
    };

    // Initial data fetch
    useEffect(() => {
        fetchStaffActivities();
    }, []);

    // Get sorted date keys (newest first)
    const sortedDateKeys = Object.keys(groupedActivities).sort((a, b) =>
        new Date(b).getTime() - new Date(a).getTime()
    );

    const backButton = (
        <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
        >
            <Ionicons name="arrow-back" size={22} color={INK} />
        </TouchableOpacity>
    );

    if (!staff) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>{backButton}</View>
                <View style={styles.stateContainer}>
                    <Text style={styles.stateTitle}>Couldn’t open this staff member</Text>
                    <Text style={styles.stateBody}>Go back to Team and choose them again.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const fullName = `${staff.firstName} ${staff.lastName}`;
    const role = humanize(staff.role) || 'Staff';
    const initials = ((staff.firstName?.[0] ?? '') + (staff.lastName?.[0] ?? '')).toUpperCase() || '?';
    const countLabel = activities.length >= ACTIVITY_LIMIT ? `${ACTIVITY_LIMIT}+` : `${activities.length}`;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

            {/* Header — names the screen; the person is introduced once, below */}
            <View style={styles.header}>
                {backButton}
                <Text style={styles.headerTitle} accessibilityRole="header">Activity</Text>
            </View>

            <ScrollView
                style={styles.scroll}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors.primary]}
                        tintColor={Colors.primary}
                    />
                }
                contentContainerStyle={styles.scrollContent}
            >
                {/* Who this is, and how much they've logged */}
                <View style={styles.profile}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName} numberOfLines={2}>{fullName}</Text>
                        <Text style={styles.profileRole}>{role}</Text>
                        {!!staff.email && (
                            <Text style={styles.profileEmail} numberOfLines={1}>{staff.email}</Text>
                        )}
                    </View>
                    {!loading && !error && (
                        <View
                            style={styles.countBlock}
                            accessible
                            accessibilityLabel={`${countLabel} ${activities.length === 1 ? 'activity' : 'activities'}`}
                        >
                            <Text style={styles.countNumber}>{countLabel}</Text>
                            <Text style={styles.countLabel}>{activities.length === 1 ? 'activity' : 'activities'}</Text>
                        </View>
                    )}
                </View>

                {loading ? (
                    <View style={styles.stateContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loadingText}>Loading activity…</Text>
                    </View>
                ) : error ? (
                    <View style={styles.stateContainer}>
                        <View style={[styles.stateIconBadge, { backgroundColor: Colors.errorLight }]}>
                            <Ionicons name="cloud-offline-outline" size={30} color={Colors.errorText} />
                        </View>
                        <Text style={styles.stateTitle}>Couldn’t load activity</Text>
                        <Text style={styles.stateBody}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => fetchStaffActivities()}
                            accessibilityRole="button"
                        >
                            <Ionicons name="refresh" size={17} color="#FFFFFF" />
                            <Text style={styles.retryButtonText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                ) : activities.length === 0 ? (
                    <View style={styles.stateContainer}>
                        <View style={styles.stateIconBadge}>
                            <Ionicons name="time-outline" size={30} color={Colors.primaryDark} />
                        </View>
                        <Text style={styles.stateTitle}>No activity yet</Text>
                        <Text style={styles.stateBody}>
                            Materials, labor and updates {staff.firstName} adds will show up here.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.timeline}>
                        {sortedDateKeys.map(dateKey => (
                            <View key={dateKey} style={styles.dateGroup}>
                                <View style={styles.dateHeaderRow}>
                                    <Text style={styles.dateHeader} accessibilityRole="header">{formatDate(dateKey)}</Text>
                                    <Text style={styles.dateCount}>{groupedActivities[dateKey].length}</Text>
                                </View>

                                {groupedActivities[dateKey].map((activity, index) => {
                                    const tone = ACTION_TONES[activity.action] ?? DEFAULT_TONE;
                                    const isLast = index === groupedActivities[dateKey].length - 1;
                                    const time = formatTime(activity.date || activity.createdAt);
                                    const category = humanize(activity.category);
                                    return (
                                        <View key={activity._id} style={styles.activityItem}>
                                            {/* Timeline rail: the icon marks the kind of thing, the tint whether it was added or removed */}
                                            <View style={styles.rail}>
                                                <View style={[styles.railDot, { backgroundColor: tone.bg }]}>
                                                    <Ionicons
                                                        name={getActivityIcon(activity.activityType, activity.category) as any}
                                                        size={15}
                                                        color={tone.fg}
                                                    />
                                                </View>
                                                {!isLast && <View style={styles.railLine} />}
                                            </View>

                                            <View
                                                style={[styles.activityCard, isLast && styles.activityCardLast]}
                                                accessible
                                                accessibilityLabel={[
                                                    activity.description,
                                                    time,
                                                    category,
                                                    activity.projectName,
                                                    activity.message,
                                                ].filter(Boolean).join(', ')}
                                            >
                                                <View style={styles.activityHeader}>
                                                    <Text style={styles.activityDescription}>{activity.description}</Text>
                                                    <Text style={styles.activityTime}>{time}</Text>
                                                </View>

                                                {!!activity.message && (
                                                    <Text style={styles.activityMessage}>{activity.message}</Text>
                                                )}

                                                <View style={styles.activityMeta}>
                                                    {!!category && (
                                                        <View style={[styles.categoryBadge, { backgroundColor: tone.bg }]}>
                                                            <Text style={[styles.categoryText, { color: tone.fg }]}>{category}</Text>
                                                        </View>
                                                    )}
                                                    {!!activity.projectName && (
                                                        <View style={styles.projectTag}>
                                                            <Ionicons name="folder-outline" size={13} color={Colors.textSecondary} />
                                                            <Text style={styles.projectName} numberOfLines={1}>{activity.projectName}</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        ))}

                        {activities.length >= ACTIVITY_LIMIT && (
                            <Text style={styles.limitNote}>Showing the latest {ACTIVITY_LIMIT} activities.</Text>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        minHeight: 64,
        backgroundColor: Colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.fill,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: INK,
        letterSpacing: -0.5,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 32,
    },

    // Profile
    profile: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: Colors.surface,
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E8EDF4',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.primaryDark,
    },
    profileInfo: {
        flex: 1,
        gap: 2,
    },
    profileName: {
        fontSize: 19,
        fontWeight: '800',
        color: INK,
        letterSpacing: -0.3,
    },
    profileRole: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
    profileEmail: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    countBlock: {
        alignItems: 'flex-end',
    },
    countNumber: {
        fontSize: 26,
        fontWeight: '800',
        color: INK,
        letterSpacing: -0.6,
        fontVariant: ['tabular-nums'],
    },
    countLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.textSecondary,
    },

    // Loading / error / empty
    stateContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 24,
        minHeight: 280,
    },
    stateIconBadge: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    stateTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: INK,
        letterSpacing: -0.2,
        textAlign: 'center',
    },
    stateBody: {
        fontSize: 15,
        lineHeight: 21,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 6,
        maxWidth: 300,
    },
    loadingText: {
        marginTop: 14,
        fontSize: 15,
        color: Colors.textSecondary,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 20,
        paddingHorizontal: 22,
        minHeight: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },

    // Timeline
    timeline: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    dateGroup: {
        marginTop: 20,
    },
    dateHeaderRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
        marginBottom: 12,
        paddingLeft: 4,
    },
    dateHeader: {
        fontSize: 17,
        fontWeight: '700',
        color: INK,
        letterSpacing: -0.3,
    },
    dateCount: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
        fontVariant: ['tabular-nums'],
    },
    activityItem: {
        flexDirection: 'row',
    },
    rail: {
        alignItems: 'center',
        width: 32,
        marginRight: 12,
    },
    railDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    railLine: {
        width: 2,
        flex: 1,
        backgroundColor: Colors.border,
        marginVertical: 4,
        borderRadius: 1,
    },
    activityCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8EDF4',
        marginBottom: 12,
    },
    activityCardLast: {
        marginBottom: 0,
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 10,
    },
    activityDescription: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: INK,
        lineHeight: 20,
    },
    activityTime: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontVariant: ['tabular-nums'],
    },
    activityMessage: {
        fontSize: 14,
        lineHeight: 19,
        color: '#475569',
        marginTop: 6,
    },
    activityMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '700',
    },
    projectTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        flexShrink: 1,
    },
    projectName: {
        flexShrink: 1,
        fontSize: 13,
        fontWeight: '500',
        color: '#475569',
    },
    limitNote: {
        fontSize: 13,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 24,
    },
});

export default StaffDetailScreen;
