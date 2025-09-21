// notification.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
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

interface DeletedNotification extends Notification {
    deletedAt: number;
}

// Toast Component
interface ToastProps {
    visible: boolean;
    message: string;
    onUndo: () => void;
    onHide: () => void;
}

const Toast: React.FC<ToastProps> = ({ visible, message, onUndo, onHide }) => {
    const translateY = useRef(new Animated.Value(100)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();

            // Auto hide after 10 seconds
            const timer = setTimeout(() => {
                hideToast();
            }, 3000);

            return () => clearTimeout(timer);
        } else {
            hideToast();
        }
    }, [visible]);

    const hideToast = () => {
        Animated.timing(translateY, {
            toValue: 100,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            onHide();
        });
    };

    if (!visible) return null;

    return (
        <Animated.View 
            style={[
                styles.toastContainer,
                { transform: [{ translateY }] }
            ]}
        >
            <Text style={styles.toastMessage}>{message}</Text>
            <TouchableOpacity onPress={onUndo} style={styles.undoButton}>
                <Text style={styles.undoText}>UNDO</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

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
        isRead: false,
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
        isRead: false,
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
        isRead: false,
    },
];

// Swipeable Notification Item Component
interface NotificationItemProps {
    notification: Notification;
    onPress: (notification: Notification) => void;
    onDelete: (notification: Notification) => void;
}

const SwipeableNotificationItem: React.FC<NotificationItemProps> = ({ 
    notification, 
    onPress, 
    onDelete 
}) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const scale = useRef(new Animated.Value(1)).current;

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

    const onGestureEvent = Animated.event(
        [{ nativeEvent: { translationX: translateX } }],
        { useNativeDriver: false }
    );

    const onHandlerStateChange = (event: any) => {
        if (event.nativeEvent.state === State.END) {
            const { translationX } = event.nativeEvent;
            
            if (Math.abs(translationX) > 120) {
                // Swipe threshold reached - delete
                Animated.parallel([
                    Animated.timing(translateX, {
                        toValue: translationX > 0 ? 400 : -400,
                        duration: 200,
                        useNativeDriver: false,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: false,
                    }),
                    Animated.timing(scale, {
                        toValue: 0.8,
                        duration: 200,
                        useNativeDriver: false,
                    }),
                ]).start(() => {
                    onDelete(notification);
                });
            } else {
                // Snap back to original position
                Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: false,
                    tension: 100,
                    friction: 8,
                }).start();
            }
        }
    };

    const iconConfig = getNotificationIcon(notification.type);

    return (
        <View style={styles.swipeContainer}>
            {/* Delete Background */}
            <View style={styles.deleteBackground}>
                <Ionicons name="trash" size={24} color="#FFFFFF" />
                <Text style={styles.deleteText}>Delete</Text>
            </View>

            <PanGestureHandler
                onGestureEvent={onGestureEvent}
                onHandlerStateChange={onHandlerStateChange}
            >
                <Animated.View
                    style={[
                        styles.notificationItem,
                        !notification.isRead && styles.unreadItem,
                        {
                            transform: [{ translateX }, { scale }],
                            opacity,
                        }
                    ]}
                >
                    <TouchableOpacity
                        style={styles.notificationContent}
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
                </Animated.View>
            </PanGestureHandler>
        </View>
    );
};

// Main Notification Component
const NotificationScreen: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>(dummyNotifications);
    const [deletedNotifications, setDeletedNotifications] = useState<DeletedNotification[]>([]);
    const [toastVisible, setToastVisible] = useState(false);
    const [lastDeleted, setLastDeleted] = useState<DeletedNotification | null>(null);
    const router = useRouter();
    
    const unreadCount = useMemo(() => {
        return notifications.filter(n => !n.isRead).length;
    }, [notifications]);

    const handleNotificationPress = (notification: Notification) => {
        // Just mark as read, don't remove from list
        setNotifications(prev => 
            prev.map(n => 
                n.id === notification.id ? { ...n, isRead: true } : n
            )
        );
    };

    const handleDeleteNotification = (notification: Notification) => {
        const deletedNotification: DeletedNotification = {
            ...notification,
            deletedAt: Date.now(),
        };

        setLastDeleted(deletedNotification);
        setDeletedNotifications(prev => [...prev, deletedNotification]);
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        setToastVisible(true);
    };

    const handleUndo = () => {
        if (lastDeleted) {
            setNotifications(prev => [...prev, lastDeleted]);
            setDeletedNotifications(prev => 
                prev.filter(n => n.id !== lastDeleted.id)
            );
            setLastDeleted(null);
        }
        setToastVisible(false);
    };

    const handleToastHide = () => {
        setToastVisible(false);
        setLastDeleted(null);
    };

    const handleMarkAllAsRead = () => {
        // Just mark all as read, don't remove from list
        setNotifications(prev => 
            prev.map(notification => ({ ...notification, isRead: true }))
        );
    };

    // Auto-cleanup deleted notifications after 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setDeletedNotifications(prev => 
                prev.filter(n => now - n.deletedAt < 30000)
            );
        }, 1000);

        return () => clearInterval(interval);
    }, []);

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

            {/* Instructions */}
            {notifications.length > 0 && (
                <View style={styles.instructionBanner}>
                    <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                    <Text style={styles.instructionText}>
                        Tap to read • Swipe to delete
                    </Text>
                </View>
            )}

            {/* Notifications List */}
            <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                {notifications.length > 0 ? (
                    notifications.map((notification) => (
                        <SwipeableNotificationItem
                            key={notification.id}
                            notification={notification}
                            onPress={handleNotificationPress}
                            onDelete={handleDeleteNotification}
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

            {/* Toast for Undo */}
            <Toast
                visible={toastVisible}
                message="Notification deleted"
                onUndo={handleUndo}
                onHide={handleToastHide}
            />
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
    instructionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    instructionText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 6,
    },
    scrollView: {
        flex: 1,
    },
    swipeContainer: {
        position: 'relative',
    },
    deleteBackground: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        width: 120,
    },
    deleteText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    notificationItem: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
    },
    notificationContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 16,
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
    // Toast styles
    toastContainer: {
        position: 'absolute',
        bottom: 24,
        left: 16,
        right: 16,
        backgroundColor: '#1F2937',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    toastMessage: {
        color: '#FFFFFF',
        fontSize: 14,
        flex: 1,
    },
    undoButton: {
        marginLeft: 16,
    },
    undoText: {
        color: '#3B82F6',
        fontSize: 14,
        fontWeight: '600',
    },
});