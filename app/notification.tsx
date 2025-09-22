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
  Alert,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

// Types
interface Notification {
    id: number;
    type: 'work_update' | 'work_remaining' | 'site_engineer' | 'material_alert' | 'safety_alert' | 'delay_warning' | 'permission_request';
    title: string;
    message: string;
    projectName: string;
    projectId: number;
    senderName?: string;
    timestamp: string;
    priority: 'high' | 'medium' | 'low';
    isRead: boolean;
    requiresApproval?: boolean;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
    permissionType?: 'material_purchase' | 'equipment_rental' | 'overtime_work' | 'budget_revision' | 'design_change';
    requestAmount?: number;
    requestDetails?: string;
}

interface DeletedNotification extends Notification {
    deletedAt: number;
    originalIndex: number; // Add original index to restore position
}

// Toast Component
interface ToastProps {
    visible: boolean;
    message: string;
    onUndo?: () => void;
    onHide: () => void;
    type?: 'success' | 'error' | 'info';
}

const Toast: React.FC<ToastProps> = ({ visible, message, onUndo, onHide, type = 'info' }) => {
    const translateY = useRef(new Animated.Value(100)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();

            // Auto hide after 3 seconds
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

    const getToastColor = () => {
        switch (type) {
            case 'success': return '#10B981';
            case 'error': return '#EF4444';
            default: return '#1F2937';
        }
    };

    return (
        <Animated.View 
            style={[
                styles.toastContainer,
                { 
                    transform: [{ translateY }],
                    backgroundColor: getToastColor()
                }
            ]}
        >
            <Text style={styles.toastMessage}>{message}</Text>
            {onUndo && (
                <TouchableOpacity onPress={onUndo} style={styles.undoButton}>
                    <Text style={styles.undoText}>UNDO</Text>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

// Approval Buttons Component
interface ApprovalButtonsProps {
    notification: Notification;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
}

const ApprovalButtons: React.FC<ApprovalButtonsProps> = ({ notification, onApprove, onReject }) => {
    if (!notification.requiresApproval || notification.approvalStatus !== 'pending') {
        return null;
    }

    return (
        <View style={styles.approvalContainer}>
            <TouchableOpacity 
                style={[styles.approvalButton, styles.rejectButton]}
                onPress={() => onReject(notification.id)}
            >
                <Ionicons name="close" size={14} color="#FFFFFF" />
                <Text style={styles.approvalButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.approvalButton, styles.approveButton]}
                onPress={() => onApprove(notification.id)}
            >
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                <Text style={styles.approvalButtonText}>Approve</Text>
            </TouchableOpacity>
        </View>
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

const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
};

// Company configuration
const COMPANY_CONFIG = {
    name: "Sharda Constructions",
    subtitle: "Notifications"
};

// Dummy notifications data with approval requests
const dummyNotifications: Notification[] = [
    {
        id: 1,
        type: 'permission_request',
        title: 'Material Purchase Approval Required',
        message: 'Requesting approval for additional cement and steel purchase for Block A foundation work. Estimated cost: ₹2,50,000',
        projectName: 'Manthan Tower A',
        projectId: 1,
        senderName: 'Rajesh Kumar (Site Engineer)',
        timestamp: '2024-09-21T08:30:00Z',
        priority: 'high',
        isRead: false,
        requiresApproval: true,
        approvalStatus: 'pending',
        permissionType: 'material_purchase',
        requestAmount: 250000,
        requestDetails: 'Additional 50 bags of cement and 2 tons of steel bars required due to foundation depth revision.'
    },
    {
        id: 2,
        type: 'permission_request',
        title: 'Equipment Rental Approval',
        message: 'Need approval to rent JCB for excavation work. Daily rental: ₹8,000 for 3 days. Total: ₹24,000',
        projectName: 'Skyline Apartments B',
        projectId: 2,
        senderName: 'Priya Sharma (Site Engineer)',
        timestamp: '2024-09-21T07:15:00Z',
        priority: 'medium',
        isRead: false,
        requiresApproval: true,
        approvalStatus: 'pending',
        permissionType: 'equipment_rental',
        requestAmount: 24000,
        requestDetails: 'JCB required for basement excavation work. Expected completion in 3 days.'
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
        type: 'permission_request',
        title: 'Overtime Work Authorization',
        message: 'Requesting approval for overtime work to meet project deadline. Additional labor cost: ₹15,000',
        projectName: 'Metro Plaza Complex',
        projectId: 3,
        senderName: 'Amit Patel (Site Engineer)',
        timestamp: '2024-09-20T16:20:00Z',
        priority: 'high',
        isRead: false,
        requiresApproval: true,
        approvalStatus: 'approved',
        permissionType: 'overtime_work',
        requestAmount: 15000,
        requestDetails: 'Need to work extra hours to complete concrete pouring before monsoon.'
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
    // Add more notifications to test scrolling
    {
        id: 7,
        type: 'work_update',
        title: 'Foundation Work Completed',
        message: 'Foundation work for Block B has been completed successfully. Ready for next phase.',
        projectName: 'Manthan Tower A',
        projectId: 1,
        senderName: 'Rajesh Kumar',
        timestamp: '2024-09-19T16:00:00Z',
        priority: 'medium',
        isRead: true,
    },
    {
        id: 8,
        type: 'delay_warning',
        title: 'Weather Delay Alert',
        message: 'Heavy rainfall expected for next 3 days. Outdoor activities may be delayed.',
        projectName: 'Green Valley Villas',
        projectId: 4,
        senderName: 'Weather Service',
        timestamp: '2024-09-19T12:00:00Z',
        priority: 'high',
        isRead: true,
    },
    {
        id: 9,
        type: 'material_alert',
        title: 'Cement Delivery Scheduled',
        message: 'Cement delivery scheduled for tomorrow morning at 8 AM. Please ensure site access.',
        projectName: 'Skyline Apartments B',
        projectId: 2,
        senderName: 'Supply Manager',
        timestamp: '2024-09-19T10:30:00Z',
        priority: 'medium',
        isRead: true,
    },
    {
        id: 10,
        type: 'safety_alert',
        title: 'Safety Training Reminder',
        message: 'Monthly safety training scheduled for all workers this Friday at 2 PM.',
        projectName: 'Tech Park Phase 1',
        projectId: 6,
        senderName: 'Safety Officer',
        timestamp: '2024-09-18T15:45:00Z',
        priority: 'medium',
        isRead: true,
    },
];

// Swipeable Notification Item Component
interface NotificationItemProps {
    notification: Notification;
    onPress: (notification: Notification) => void;
    onDelete: (notification: Notification) => void;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
}

const SwipeableNotificationItem: React.FC<NotificationItemProps> = ({ 
    notification, 
    onPress, 
    onDelete,
    onApprove,
    onReject
}) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const scale = useRef(new Animated.Value(1)).current;

    const getNotificationIcon = (type: string, approvalStatus?: string) => {
        if (type === 'permission_request') {
            switch (approvalStatus) {
                case 'approved': return { icon: 'checkmark-circle', color: '#10B981' };
                case 'rejected': return { icon: 'close-circle', color: '#EF4444' };
                default: return { icon: 'time-outline', color: '#F59E0B' };
            }
        }
        
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

    const iconConfig = getNotificationIcon(notification.type, notification.approvalStatus);

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
                        notification.requiresApproval && notification.approvalStatus === 'pending' && styles.approvalPendingItem,
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

                            {/* Request Amount Display */}
                            {notification.requestAmount && (
                                <Text style={styles.amountText}>
                                    Amount: {formatCurrency(notification.requestAmount)}
                                </Text>
                            )}

                            {/* Approval Status Badge */}
                            {notification.requiresApproval && notification.approvalStatus && (
                                <View style={styles.statusContainer}>
                                    <View style={[
                                        styles.statusBadge,
                                        notification.approvalStatus === 'approved' && styles.approvedBadge,
                                        notification.approvalStatus === 'rejected' && styles.rejectedBadge,
                                        notification.approvalStatus === 'pending' && styles.pendingBadge,
                                    ]}>
                                        <Text style={[
                                            styles.statusText,
                                            notification.approvalStatus === 'pending' && styles.pendingStatusText
                                        ]}>
                                            {notification.approvalStatus.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                            )}
                            
                            <Text style={styles.projectText}>
                                {notification.projectName}
                                {notification.senderName && ` • ${notification.senderName}`}
                            </Text>

                            {/* Approval Buttons */}
                            <ApprovalButtons 
                                notification={notification}
                                onApprove={onApprove}
                                onReject={onReject}
                            />
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
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
    const [lastDeleted, setLastDeleted] = useState<DeletedNotification | null>(null);
    const router = useRouter();
    
    const unreadCount = useMemo(() => {
        return notifications.filter(n => !n.isRead).length;
    }, [notifications]);

    const pendingApprovals = useMemo(() => {
        return notifications.filter(n => n.requiresApproval && n.approvalStatus === 'pending').length;
    }, [notifications]);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
    };

    const handleNotificationPress = (notification: Notification) => {
        // Mark as read
        setNotifications(prev => 
            prev.map(n => 
                n.id === notification.id ? { ...n, isRead: true } : n
            )
        );
    };

    const handleDeleteNotification = (notification: Notification) => {
        // Find the original index of the notification
        const originalIndex = notifications.findIndex(n => n.id === notification.id);
        
        const deletedNotification: DeletedNotification = {
            ...notification,
            deletedAt: Date.now(),
            originalIndex: originalIndex,
        };

        setLastDeleted(deletedNotification);
        setDeletedNotifications(prev => [...prev, deletedNotification]);
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        showToast('Notification deleted', 'info');
    };

    const handleApprove = (id: number) => {
        Alert.alert(
            'Approve Request',
            'Are you sure you want to approve this request?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    style: 'default',
                    onPress: () => {
                        setNotifications(prev =>
                            prev.map(n =>
                                n.id === id ? { ...n, approvalStatus: 'approved' as const, isRead: true } : n
                            )
                        );
                        showToast('Request approved successfully', 'success');
                    }
                }
            ]
        );
    };

    const handleReject = (id: number) => {
        Alert.alert(
            'Reject Request',
            'Are you sure you want to reject this request?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: () => {
                        setNotifications(prev =>
                            prev.map(n =>
                                n.id === id ? { ...n, approvalStatus: 'rejected' as const, isRead: true } : n
                            )
                        );
                        showToast('Request rejected', 'error');
                    }
                }
            ]
        );
    };

    const handleUndo = () => {
        if (lastDeleted) {
            // Restore notification at its original position
            const { originalIndex, deletedAt, ...notification } = lastDeleted;
            
            setNotifications(prev => {
                const newNotifications = [...prev];
                // Insert at the original index, but ensure it doesn't exceed array bounds
                const insertIndex = Math.min(originalIndex, newNotifications.length);
                newNotifications.splice(insertIndex, 0, notification);
                return newNotifications;
            });
            
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
        setNotifications(prev => 
            prev.map(notification => ({ ...notification, isRead: true }))
        );
        showToast('All notifications marked as read', 'success');
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

            {/* Enhanced Header */}
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
                            {pendingApprovals > 0 && ` • ${pendingApprovals} pending approval`}
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
                        Tap to read • Swipe to delete • Use action buttons for approvals
                    </Text>
                </View>
            )}

            {/* Pending Approvals Alert */}
            {pendingApprovals > 0 && (
                <View style={styles.approvalAlert}>
                    <Ionicons name="alert-circle" size={20} color="#F59E0B" />
                    <Text style={styles.approvalAlertText}>
                        {pendingApprovals} request{pendingApprovals > 1 ? 's' : ''} pending your approval
                    </Text>
                </View>
            )}

            {/* Notifications List */}
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={true}
                nestedScrollEnabled={true}
            >
                {notifications.length > 0 ? (
                    notifications.map((notification) => (
                        <SwipeableNotificationItem
                            key={notification.id}
                            notification={notification}
                            onPress={handleNotificationPress}
                            onDelete={handleDeleteNotification}
                            onApprove={handleApprove}
                            onReject={handleReject}
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

            {/* Toast for feedback */}
            <Toast
                visible={toastVisible}
                message={toastMessage}
                type={toastType}
                onUndo={lastDeleted ? handleUndo : undefined}
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
    approvalAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FEF3C7',
        borderBottomWidth: 1,
        borderBottomColor: '#FDE68A',
    },
    approvalAlertText: {
        fontSize: 14,
        color: '#92400E',
        marginLeft: 8,
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1, // Changed from paddingBottom to flexGrow
        paddingBottom: 120, // Keep some bottom padding for toast
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
        minHeight: 80, // Add minimum height to ensure proper scrolling
    },
    unreadItem: {
        backgroundColor: '#FEFEFE',
    },
    approvalPendingItem: {
        backgroundColor: '#FFFBEB',
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
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
    amountText: {
        fontSize: 13,
        color: '#059669',
        fontWeight: '600',
        marginBottom: 6,
    },
    statusContainer: {
        marginBottom: 6,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    approvedBadge: {
        backgroundColor: '#D1FAE5',
    },
    rejectedBadge: {
        backgroundColor: '#FEE2E2',
    },
    pendingBadge: {
        backgroundColor: '#FEF3C7',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#059669',
    },
    pendingStatusText: {
        color: '#92400E',
    },
    projectText: {
        fontSize: 12,
        color: '#3B82F6',
        fontWeight: '500',
        marginBottom: 8,
    },
    approvalContainer: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 8,
    },
    approvalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        minWidth: 80,
        justifyContent: 'center',
    },
    approveButton: {
        backgroundColor: '#10B981',
    },
    rejectButton: {
        backgroundColor: '#EF4444',
    },
    approvalButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
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
        flex: 1,
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
        zIndex: 1000,
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
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});