import { domain } from '@/lib/domain';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { toast } from 'sonner-native';

interface Material {
    name: string;
    unit: string;
    specs?: Record<string, any>;
    qnt: number;
    cost?: number;
    addedAt?: string;
    _id?: string;
}

interface User {
    userId: string;
    fullName: string;
}

interface MaterialActivity {
    _id: string;
    user: User;
    clientId: string;
    projectId: string;
    materials: Material[];
    message?: string;
    activity: 'imported' | 'used';
    date?: string; // Material activities use 'date' field
    createdAt: string;
    updatedAt: string;
}

interface MaterialActivityNotificationsProps {
    visible: boolean;
    onClose: () => void;
    projectId?: string;
    clientId?: string;
}

const MaterialActivityNotifications: React.FC<MaterialActivityNotificationsProps> = ({
    visible,
    onClose,
    projectId,
    clientId
}) => {
    const [activities, setActivities] = useState<MaterialActivity[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'imported' | 'used'>('all');

    const fetchActivities = async (isRefreshing = false) => {
        if (!isRefreshing) setLoading(true);

        try {
            // Get clientId from storage if not provided
            let finalClientId = clientId;
            if (!finalClientId) {
                const userDetailsString = await AsyncStorage.getItem("user");
                if (userDetailsString) {
                    const userData = JSON.parse(userDetailsString);
                    finalClientId = userData.clientId;
                }
            }

            if (!finalClientId) {
                toast.error('Client ID not found');
                return;
            }

            // Build query params
            const params = new URLSearchParams();
            params.append('clientId', finalClientId);
            if (projectId) params.append('projectId', projectId);
            if (filter !== 'all') params.append('activity', filter);

            const response = await axios.get(`${domain}/api/materialActivity?${params.toString()}`);
            const responseData = response.data as { success: boolean; data?: MaterialActivity[]; message?: string };

            if (responseData.success) {
                setActivities(responseData.data || []);
            } else {
                toast.error('Failed to fetch activities');
            }
        } catch (error: any) {
            console.error('Error fetching material activities:', error);
            toast.error(error?.response?.data?.message || 'Failed to fetch activities');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (visible) {
            fetchActivities();
        }
    }, [visible, filter, projectId]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchActivities(true);
    };

    const getActivityIcon = (activity: 'imported' | 'used') => {
        return activity === 'imported' ? 'arrow-down-circle' : 'arrow-forward-circle';
    };

    const getActivityColor = (activity: 'imported' | 'used') => {
        return activity === 'imported' ? '#10B981' : '#EF4444';
    };

    const formatDate = (dateString: string) => {
        try {
            // Handle empty or invalid date strings
            if (!dateString) {
                return 'Recently';
            }

            const date = new Date(dateString);

            // Check if date is valid
            if (isNaN(date.getTime())) {
                console.warn('Invalid date string:', dateString);
                return 'Recently';
            }

            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            // Handle future dates
            if (diffMs < 0) {
                return 'Just now';
            }

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;

            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        } catch (error) {
            console.error('Error formatting date:', dateString, error);
            return 'Recently';
        }
    };

    const renderActivityItem = ({ item }: { item: MaterialActivity }) => {
        const totalQuantity = item.materials.reduce((sum, m) => sum + m.qnt, 0);
        const totalCost = item.materials.reduce((sum, m) => sum + (m.cost || 0), 0);
        const activityColor = getActivityColor(item.activity);

        return (
            <View style={styles.activityCard}>
                {/* Header */}
                <View style={styles.activityHeader}>
                    <View style={[styles.activityIconBadge, { backgroundColor: activityColor + '20' }]}>
                        <Ionicons
                            name={getActivityIcon(item.activity)}
                            size={24}
                            color={activityColor}
                        />
                    </View>
                    <View style={styles.activityHeaderText}>
                        <Text style={styles.activityTitle}>
                            Material {item.activity === 'imported' ? 'Imported' : 'Used'}
                        </Text>
                        <Text style={styles.activityTime}>
                            {formatDate(item.date || item.createdAt)}
                        </Text>
                    </View>
                </View>

                {/* User Info */}
                <View style={styles.userInfo}>
                    <Ionicons name="person-circle-outline" size={16} color="#64748B" />
                    <Text style={styles.userName}>{item.user.fullName}</Text>
                </View>

                {/* Materials Summary */}
                <View style={styles.materialsSummary}>
                    <View style={styles.summaryRow}>
                        <Ionicons name="cube-outline" size={16} color="#64748B" />
                        <Text style={styles.summaryText}>
                            {item.materials.length} material{item.materials.length > 1 ? 's' : ''}
                        </Text>
                    </View>
                    {totalCost > 0 && (
                        <View style={styles.summaryRow}>
                            <Ionicons name="cash-outline" size={16} color="#64748B" />
                            <Text style={styles.summaryText}>₹{totalCost.toLocaleString('en-IN')}</Text>
                        </View>
                    )}
                </View>

                {/* Materials List */}
                <View style={styles.materialsContainer}>
                    {item.materials.map((material, index) => (
                        <View key={material._id || index} style={styles.materialRow}>
                            <View style={styles.materialDot} />
                            <Text style={styles.materialName}>{material.name}</Text>
                            <Text style={styles.materialQuantity}>
                                {material.qnt} {material.unit}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Message */}
                {item.message && (
                    <View style={styles.messageContainer}>
                        <Ionicons name="chatbox-outline" size={14} color="#64748B" />
                        <Text style={styles.messageText}>{item.message}</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={styles.headerIconContainer}>
                                <Ionicons name="notifications" size={24} color="#3B82F6" />
                            </View>
                            <View>
                                <Text style={styles.title}>Material Activities</Text>
                                <Text style={styles.subtitle}>
                                    {projectId ? 'Project activities' : 'All activities'}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    {/* Filter Tabs */}
                    <View style={styles.filterContainer}>
                        <TouchableOpacity
                            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
                            onPress={() => setFilter('all')}
                        >
                            <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
                                All
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterTab, filter === 'imported' && styles.filterTabActive]}
                            onPress={() => setFilter('imported')}
                        >
                            <Ionicons
                                name="arrow-down-circle"
                                size={16}
                                color={filter === 'imported' ? '#10B981' : '#64748B'}
                            />
                            <Text style={[styles.filterTabText, filter === 'imported' && styles.filterTabTextActive]}>
                                Imported
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterTab, filter === 'used' && styles.filterTabActive]}
                            onPress={() => setFilter('used')}
                        >
                            <Ionicons
                                name="arrow-forward-circle"
                                size={16}
                                color={filter === 'used' ? '#EF4444' : '#64748B'}
                            />
                            <Text style={[styles.filterTabText, filter === 'used' && styles.filterTabTextActive]}>
                                Used
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Activities List */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#3B82F6" />
                            <Text style={styles.loadingText}>Loading activities...</Text>
                        </View>
                    ) : activities.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="notifications-off-outline" size={64} color="#CBD5E1" />
                            <Text style={styles.emptyTitle}>No Activities Yet</Text>
                            <Text style={styles.emptyDescription}>
                                Material activities will appear here when materials are imported or used.
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={activities}
                            renderItem={renderActivityItem}
                            keyExtractor={(item) => item._id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    colors={['#3B82F6']}
                                    tintColor="#3B82F6"
                                />
                            }
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    closeButton: {
        padding: 4,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    filterTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        gap: 6,
    },
    filterTabActive: {
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    filterTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    filterTabTextActive: {
        color: '#3B82F6',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 12,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginTop: 16,
    },
    emptyDescription: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 8,
    },
    listContent: {
        padding: 20,
        gap: 12,
    },
    activityCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    activityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    activityIconBadge: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activityHeaderText: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    activityTime: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    userName: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    materialsSummary: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    summaryText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    materialsContainer: {
        gap: 8,
    },
    materialRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    materialDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#3B82F6',
    },
    materialName: {
        flex: 1,
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '500',
    },
    materialQuantity: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    messageText: {
        flex: 1,
        fontSize: 13,
        color: '#64748B',
        fontStyle: 'italic',
    },
});

export default MaterialActivityNotifications;
