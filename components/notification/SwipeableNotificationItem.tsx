import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import ApprovalButtons from './ApprovalButtons';
import { NotificationItemProps } from './types';
import { formatCurrency, getNotificationIcon, getTimeAgo } from './utils';

const SwipeableNotificationItem: React.FC<NotificationItemProps> = ({
    notification,
    onPress,
    onDelete,
    onApprove,
    onReject,
    onMenuAction
}) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const [isDeleteVisible, setIsDeleteVisible] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const panGesture = Gesture.Pan()
        .activeOffsetX([-15, 15]) // Require minimum horizontal movement to start
        .failOffsetY([-50, 50]) // Allow more vertical movement before failing
        .onChange((event: any) => {
            // Only allow left swipe (negative translation) and constrain maximum swipe
            const constrainedTranslation = Math.max(Math.min(event.translationX, 0), -120);
            if (constrainedTranslation <= 0) {
                translateX.setValue(constrainedTranslation);
            }
        })
        .onEnd((event: any) => {
            // Only allow left swipe (negative translation)
            if (event.translationX < -60) { // Reduced threshold for easier activation
                // Show delete button
                Animated.timing(translateX, {
                    toValue: -80,
                    duration: 200,
                    useNativeDriver: false,
                }).start();
                setIsDeleteVisible(true);
            } else {
                // Snap back to original position
                Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: false,
                    tension: 100,
                    friction: 8,
                }).start();
                setIsDeleteVisible(false);
            }
        });

    const handleDelete = () => {
        // Animate out and then delete
        Animated.timing(translateX, {
            toValue: -400,
            duration: 200,
            useNativeDriver: false,
        }).start(() => {
            onDelete(notification);
            setIsDeleteVisible(false);
        });
    };

    const handlePress = () => {
        if (isDeleteVisible) {
            // If delete is visible, hide it first
            Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: false,
                tension: 100,
                friction: 8,
            }).start();
            setIsDeleteVisible(false);
        } else if (showMenu) {
            // If menu is visible, hide it first
            setShowMenu(false);
        } else {
            onPress(notification);
        }
    };

    const iconConfig = getNotificationIcon(notification.type, notification.approvalStatus);

    return (
        <View style={styles.swipeContainer}>
            {/* Delete Button Background */}
            <View style={styles.deleteBackground}>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDelete}
                    activeOpacity={0.7}
                >
                    <Ionicons name="trash" size={20} color="#FFFFFF" />
                    <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
            </View>

            <GestureDetector gesture={panGesture}>
                <Animated.View
                    style={[
                        styles.notificationItem,
                        !notification.isRead && styles.unreadItem,
                        notification.requiresApproval && notification.approvalStatus === 'pending' && styles.approvalPendingItem,
                        {
                            transform: [{ translateX }],
                        }
                    ]}
                >
                    <TouchableOpacity
                        style={styles.notificationContent}
                        onPress={handlePress}
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
                                <View style={styles.timeAndMenuContainer}>
                                    <Text style={styles.timeText}>
                                        {getTimeAgo(notification.timestamp)}
                                    </Text>
                                    {onMenuAction && notification.approvalStatus === 'approved' && (
                                        <TouchableOpacity
                                            style={styles.menuButton}
                                            onPress={() => setShowMenu(!showMenu)}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="ellipsis-vertical" size={16} color="#9CA3AF" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            <Text style={styles.message} numberOfLines={2}>
                                {notification.message}
                            </Text>

                            {/* Material Request Details */}
                            {notification.materialRequest && (
                                <View style={styles.materialContainer}>
                                    <Text style={styles.materialTitle}>Materials Requested:</Text>
                                    {notification.materialRequest.materials.map((material, index) => (
                                        <Text key={material._id} style={styles.materialItem}>
                                            • {material.name}: {material.qnt} {material.unit}
                                            {material.cost > 0 && ` - ₹${material.cost.toLocaleString('en-IN')}`}
                                        </Text>
                                    ))}
                                </View>
                            )}

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
                                        notification.approvalStatus === 'imported' && styles.importedBadge,
                                    ]}>
                                        <Text style={[
                                            styles.statusText,
                                            notification.approvalStatus === 'pending' && styles.pendingStatusText,
                                            notification.approvalStatus === 'imported' && styles.importedStatusText
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

                            {/* Menu Dropdown */}
                            {showMenu && onMenuAction && notification.approvalStatus === 'approved' && (
                                <View style={styles.menuDropdown}>
                                    <TouchableOpacity
                                        style={styles.menuItem}
                                        onPress={() => {
                                            onMenuAction(notification.id, 'mark_imported');
                                            setShowMenu(false);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                        <Text style={styles.menuItemText}>Material Imported</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

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
            </GestureDetector>
        </View>
    );
};

const styles = StyleSheet.create({
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
        width: 80,
    },
    deleteButton: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 20,
        width: '100%',
        height: '100%',
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
        minHeight: 80,
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
    timeAndMenuContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    timeText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '400',
    },
    menuButton: {
        padding: 4,
        borderRadius: 4,
    },
    menuDropdown: {
        position: 'absolute',
        top: 40,
        right: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        zIndex: 1000,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
    },
    menuItemText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
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
    importedBadge: {
        backgroundColor: '#E0E7FF',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#059669',
    },
    pendingStatusText: {
        color: '#92400E',
    },
    importedStatusText: {
        color: '#7C3AED',
    },
    projectText: {
        fontSize: 12,
        color: '#3B82F6',
        fontWeight: '500',
        marginBottom: 8,
    },
    materialContainer: {
        backgroundColor: '#F9FAFB',
        padding: 8,
        borderRadius: 6,
        marginBottom: 6,
    },
    materialTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    materialItem: {
        fontSize: 11,
        color: '#6B7280',
        marginLeft: 8,
        lineHeight: 16,
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
});

export default SwipeableNotificationItem;