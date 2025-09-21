// notification.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Types
interface Notification {
    id: number;
    type: 'work_update' | 'work_remaining' | 'site_engineer' | 'material_alert' | 'safety_alert' | 'delay_warning';
    title: string;
    message: string;
    projectName: string;
    projectId: number;
    senderName?: string;
    timestamp: string;
    priority: 'high' | 'medium' | 'low';
    isRead: boolean;
}

// Utility functions
const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 3600));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notificationTime.toLocaleDateString('en-IN');
};

// Company configuration
const COMPANY_CONFIG = {
    name: "Sharda Constructions",
    subtitle: "Notifications"
};

// Generate initials function
const generateInitials = (companyName: string): string => {
    if (!companyName) return 'XX';
    
    const words = companyName
        .split(/[\s\-_&]+/)
        .filter(word => word.length > 0);
    
    if (words.length === 0) return 'XX';
    
    if (words.length === 1) {
        const word = words[0];
        return word.length >= 2 ? word.substring(0, 2).toUpperCase() : word.toUpperCase();
    }
    
    return words
        .slice(0, 2)
        .map(word => word[0])
        .join('')
        .toUpperCase();
};

// Dummy notifications data
const dummyNotifications: Notification[] = [
    {
        id: 1,
        type: 'work_update',
        title: 'Foundation Work Completed',
        message: 'Foundation work for Block A has been completed successfully. Ready for next phase construction.',
        projectName: 'Manthan Tower A',
        projectId: 1,
        senderName: 'Rajesh Kumar',
        timestamp: '2024-09-21T08:30:00Z',
        priority: 'high',
        isRead: false,
    },
    {
        id: 2,
        type: 'site_engineer',
        title: 'Material Quality Issue',
        message: 'Some cement bags received today have moisture damage. Please arrange for replacement immediately.',
        projectName: 'Skyline Apartments B',
        projectId: 2,
        senderName: 'Priya Sharma',
        timestamp: '2024-09-21T07:15:00Z',
        priority: 'high',
        isRead: false,
    },
    {
        id: 3,
        type: 'work_remaining',
        title: 'Pending Electrical Work',
        message: 'Electrical wiring for floors 3-5 is pending. Current progress: 60%. Estimated completion: 3 days.',
        projectName: 'Green Valley Villas',
        projectId: 4,
        senderName: 'Sneha Reddy',
        timestamp: '2024-09-21T06:45:00Z',
        priority: 'medium',
        isRead: true,
    },
    {
        id: 4,
        type: 'delay_warning',
        title: 'Project Delay Risk',
        message: 'Metro Plaza Complex is at risk of delay due to permit approval pending. Immediate action required.',
        projectName: 'Metro Plaza Complex',
        projectId: 3,
        senderName: 'Amit Patel',
        timestamp: '2024-09-20T16:20:00Z',
        priority: 'high',
        isRead: false,
    },
    {
        id: 5,
        type: 'material_alert',
        title: 'Low Steel Inventory',
        message: 'Steel bars inventory is running low. Current stock: 2 tons. Estimated requirement: 8 tons.',
        projectName: 'Tech Park Phase 1',
        projectId: 6,
        senderName: 'Kavya Nair',
        timestamp: '2024-09-20T14:30:00Z',
        priority: 'medium',
        isRead: true,
    },
    {
        id: 6,
        type: 'safety_alert',
        title: 'Safety Equipment Check',
        message: 'Monthly safety equipment inspection completed. 2 helmets need replacement.',
        projectName: 'Manthan Tower A',
        projectId: 1,
        senderName: 'Safety Inspector',
        timestamp: '2024-09-20T11:00:00Z',
        priority: 'low',
        isRead: true,
    },
];

// Simple Notification Item Component
interface NotificationItemProps {
    notification: Notification;
    onPress: (notification: Notification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress }) => {
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'work_update': return { icon: 'checkmark-circle', color: '#10B981' };
            case 'work_remaining': return { icon: 'time', color: '#F59E0B' };
            case 'site_engineer': return { icon: 'person', color: '#3B82F6' };
            case 'material_alert': return { icon: 'cube', color: '#8B5CF6' };
            case 'safety_alert': return { icon: 'shield-checkmark', color: '#EF4444' };
            case 'delay_warning': return { icon: 'warning', color: '#DC2626' };
            default: return { icon: 'information-circle', color: '#6B7280' };
        }
    };

    const iconConfig = getNotificationIcon(notification.type);

    return (
        <TouchableOpacity
            style={[
                styles.notificationItem,
                !notification.isRead && styles.unreadItem
            ]}
            onPress={() => onPress(notification)}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: iconConfig.color }]}>
                <Ionicons name={iconConfig.icon as any} size={16} color="white" />
            </View>
            
            <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                    <Text style={[
                        styles.title,
                        !notification.isRead && styles.unreadTitle
                    ]} numberOfLines={1}>
                        {notification.title}
                    </Text>
                    <Text style={styles.timeText}>
                        {getTimeAgo(notification.timestamp)}
                    </Text>
                </View>
                
                <Text style={styles.message} numberOfLines={2}>
                    {notification.message}
                </Text>
                
                <Text style={styles.projectText}>
                    {notification.projectName}
                </Text>
            </View>
            
            {!notification.isRead && <View style={styles.unreadDot} />}
        </TouchableOpacity>
    );
};

// Main Notification Component
const NotificationScreen: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>(dummyNotifications);
    const router = useRouter();
    const companyInitials = generateInitials(COMPANY_CONFIG.name);

    const unreadCount = useMemo(() => {
        return notifications.filter(n => !n.isRead).length;
    }, [notifications]);

    const handleNotificationPress = (notification: Notification) => {
        // Mark as read when tapped
        setNotifications(prev => 
            prev.map(n => 
                n.id === notification.id ? { ...n, isRead: true } : n
            )
        );
    };

    const handleMarkAllAsRead = () => {
        setNotifications(prev => 
            prev.map(notification => ({ ...notification, isRead: true }))
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Simple Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="chevron-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Notifications</Text>
                        <Text style={styles.headerSubtitle}>
                            {unreadCount} unread
                        </Text>
                    </View>
                </View>
                
                {unreadCount > 0 && (
                    <TouchableOpacity 
                        style={styles.markAllButton} 
                        onPress={handleMarkAllAsRead}
                    >
                        <Text style={styles.markAllText}>Mark all read</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Simple Notifications List */}
            <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                {notifications.length > 0 ? (
                    notifications.map((notification) => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onPress={handleNotificationPress}
                        />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-outline" size={48} color="#9CA3AF" />
                        <Text style={styles.emptyTitle}>No notifications</Text>
                        <Text style={styles.emptyMessage}>
                            You're all caught up! Check back later for updates.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default NotificationScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backButton: {
        padding: 8,
        marginRight: 12,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    markAllButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    markAllText: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
        position: 'relative',
    },
    unreadItem: {
        backgroundColor: '#FEFEFE',
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    contentContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    title: {
        fontSize: 15,
        fontWeight: '500',
        color: '#374151',
        flex: 1,
        marginRight: 8,
    },
    unreadTitle: {
        fontWeight: '600',
        color: '#1F2937',
    },
    timeText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '400',
    },
    message: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
        marginBottom: 6,
    },
    projectText: {
        fontSize: 12,
        color: '#3B82F6',
        fontWeight: '500',
    },
    unreadDot: {
        position: 'absolute',
        top: 20,
        right: 16,
        width: 8,
        height: 8,
        backgroundColor: '#3B82F6',
        borderRadius: 4,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
});