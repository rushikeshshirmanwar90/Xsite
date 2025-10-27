import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NotificationHeaderProps {
    unreadCount: number;
    pendingApprovals: number;
    onBack: () => void;
    onMarkAllAsRead: () => void;
}

const NotificationHeader: React.FC<NotificationHeaderProps> = ({
    unreadCount,
    pendingApprovals,
    onBack,
    onMarkAllAsRead
}) => {
    return (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={onBack}
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
                    onPress={onMarkAllAsRead}
                >
                    <Text style={styles.markAllText}>Mark all read</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
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
});

export default NotificationHeader;