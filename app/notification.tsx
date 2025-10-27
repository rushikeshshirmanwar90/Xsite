import {
    convertMaterialRequestToNotification,
    DeletedNotification,
    EmptyState,
    fetchMaterialRequests,
    getProjectName,
    getSectionName,
    LoadingState,
    markMaterialAsImported,
    MaterialImportModal,
    Notification,
    NotificationBanners,
    NotificationHeader,
    sanctionMaterialRequest,
    SwipeableNotificationItem,
    Toast
} from '@/components/notification';
import { getClientId } from '@/functions/clientId';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

const NotificationScreen: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
    const [lastDeleted, setLastDeleted] = useState<DeletedNotification | null>(null);
    const [loading, setLoading] = useState(true);
    const [importModalVisible, setImportModalVisible] = useState(false);
    const [selectedNotificationForImport, setSelectedNotificationForImport] = useState<Notification | null>(null);
    const router = useRouter();

    // Remove sectionIds since we're fetching all material requests directly

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
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        showToast('Notification deleted', 'info');
    };

    const handleApprove = async (id: string) => {
        const notification = notifications.find(n => n.id === id);
        if (!notification) return;

        // Show material details in the confirmation with costs
        const materialsList = notification.materialRequest?.materials
            .map(m => `• ${m.name}: ${m.qnt} ${m.unit}${(m.cost && m.cost > 0) ? ` - ₹${m.cost.toLocaleString('en-IN')}` : ' - Cost: TBD'}`)
            .join('\n') || '';

        const totalQuantity = notification.materialRequest?.materials.reduce((sum, m) => sum + m.qnt, 0) || 0;
        const totalCost = notification.materialRequest?.materials.reduce((sum, m) => sum + (m.cost || 0), 0) || 0;

        Alert.alert(
            'Approve Material Request',
            `Are you sure you want to approve this material request for ${notification.sectionName}?\n\nTotal Items: ${totalQuantity}\nTotal Cost: ₹${totalCost.toLocaleString('en-IN')}\n\nMaterials:\n${materialsList}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    style: 'default',
                    onPress: async () => {
                        // Show loading toast
                        showToast('Processing approval...', 'info');

                        try {
                            const success = await sanctionMaterialRequest(id, true);
                            if (success) {
                                setNotifications(prev =>
                                    prev.map(n =>
                                        n.id === id ? { ...n, approvalStatus: 'approved' as const, isRead: true } : n
                                    )
                                );
                                showToast('✅ Material request approved successfully', 'success');
                            } else {
                                showToast('❌ Failed to approve material request', 'error');
                            }
                        } catch (error) {
                            console.error('Approval error:', error);
                            showToast('❌ Network error while approving request', 'error');
                        }
                    }
                }
            ]
        );
    };

    const handleReject = async (id: string) => {
        const notification = notifications.find(n => n.id === id);
        if (!notification) return;

        // Show material details in the confirmation with costs
        const materialsList = notification.materialRequest?.materials
            .map(m => `• ${m.name}: ${m.qnt} ${m.unit}${(m.cost && m.cost > 0) ? ` - ₹${m.cost.toLocaleString('en-IN')}` : ' - Cost: TBD'}`)
            .join('\n') || '';

        const totalQuantity = notification.materialRequest?.materials.reduce((sum, m) => sum + m.qnt, 0) || 0;
        const totalCost = notification.materialRequest?.materials.reduce((sum, m) => sum + (m.cost || 0), 0) || 0;

        Alert.alert(
            'Reject Material Request',
            `Are you sure you want to reject this material request for ${notification.sectionName}?\n\nTotal Items: ${totalQuantity}\nTotal Cost: ₹${totalCost.toLocaleString('en-IN')}\n\nMaterials:\n${materialsList}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        // Show loading toast
                        showToast('Processing rejection...', 'info');

                        try {
                            const success = await sanctionMaterialRequest(id, false);
                            if (success) {
                                setNotifications(prev =>
                                    prev.map(n =>
                                        n.id === id ? { ...n, approvalStatus: 'rejected' as const, isRead: true } : n
                                    )
                                );
                                showToast('❌ Material request rejected', 'error');
                            } else {
                                showToast('❌ Failed to reject material request', 'error');
                            }
                        } catch (error) {
                            console.error('Rejection error:', error);
                            showToast('❌ Network error while rejecting request', 'error');
                        }
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

    const handleMenuAction = async (id: string, action: string) => {
        const notification = notifications.find(n => n.id === id);
        if (!notification) return;

        if (action === 'mark_imported') {
            // Open the material import modal
            setSelectedNotificationForImport(notification);
            setImportModalVisible(true);
        }
    };

    const handleMaterialImport = async (apiPayload: any[]) => {
        if (!selectedNotificationForImport) return;

        showToast('Processing import...', 'info');

        try {
            const success = await markMaterialAsImported(
                apiPayload
            );
            
            if (success) {
                setNotifications(prev =>
                    prev.map(n =>
                        n.id === selectedNotificationForImport.id ? { ...n, approvalStatus: 'imported' as const, isRead: true } : n
                    )
                );
                showToast('✅ Materials imported successfully', 'success');
            } else {
                showToast('❌ Failed to import materials', 'error');
            }
        } catch (error) {
            console.error('Import error:', error);
            showToast('❌ Network error while importing materials', 'error');
        }
    };

    const handleCloseImportModal = () => {
        setImportModalVisible(false);
        setSelectedNotificationForImport(null);
    };

    // Fetch material requests on component mount
    useEffect(() => {
        const fetchAllMaterialRequests = async () => {
            setLoading(true);
            try {
                const allNotifications: Notification[] = [];

                // Get client ID once
                const clientId = await getClientId();

                // Fetch material requests
                try {
                    const materialRequests = await fetchMaterialRequests(clientId);

                    const materialNotifications = materialRequests.map(request => {
                        const sectionName = getSectionName(request.sectionId);
                        const projectName = getProjectName(request.projectId);
                        return convertMaterialRequestToNotification(request, sectionName, projectName);
                    });

                    allNotifications.push(...materialNotifications);
                } catch (error) {
                    console.error('Error fetching material requests:', error);
                }

                // Sort notifications by timestamp (newest first)
                allNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                setNotifications(allNotifications);
            } catch (error) {
                console.error('Error fetching notifications:', error);
                showToast('Error loading notifications', 'error');
                // Set empty array on error instead of dummy notifications
                setNotifications([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAllMaterialRequests();

        // Set up periodic refresh every 30 seconds
        const refreshInterval = setInterval(() => {
            fetchAllMaterialRequests();
        }, 30000);

        return () => clearInterval(refreshInterval);
    }, []); // Empty dependency array since we want this to run once on mount



    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

                <NotificationHeader
                    unreadCount={unreadCount}
                    pendingApprovals={pendingApprovals}
                    onBack={() => router.back()}
                    onMarkAllAsRead={handleMarkAllAsRead}
                />

                <NotificationBanners
                    hasNotifications={notifications.length > 0}
                    pendingApprovals={pendingApprovals}
                />

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    scrollEventThrottle={16}
                    keyboardShouldPersistTaps="handled"
                >
                    {loading ? (
                        <LoadingState />
                    ) : notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <SwipeableNotificationItem
                                key={notification.id}
                                notification={notification}
                                onPress={handleNotificationPress}
                                onDelete={handleDeleteNotification}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                onMenuAction={handleMenuAction}
                            />
                        ))
                    ) : (
                        <EmptyState />
                    )}
                </ScrollView>

                <Toast
                    visible={toastVisible}
                    message={toastMessage}
                    type={toastType}
                    onUndo={lastDeleted ? handleUndo : undefined}
                    onHide={handleToastHide}
                />

                <MaterialImportModal
                    visible={importModalVisible}
                    materials={selectedNotificationForImport?.materialRequest?.materials || []}
                    sectionName={selectedNotificationForImport?.sectionName || ''}
                    requestId={selectedNotificationForImport?.id || ''}
                    onClose={handleCloseImportModal}
                    onImport={handleMaterialImport}
                />
            </SafeAreaView>
        </GestureHandlerRootView>
    );
};

export default NotificationScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120,
    },
});