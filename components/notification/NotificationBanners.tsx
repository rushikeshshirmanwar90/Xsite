import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface NotificationBannersProps {
    hasNotifications: boolean;
    pendingApprovals: number;
}

const NotificationBanners: React.FC<NotificationBannersProps> = ({
    hasNotifications,
    pendingApprovals
}) => {
    return (
        <>
            {/* Instructions */}
            {hasNotifications && (
                <View style={styles.instructionBanner}>
                    <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                    <Text style={styles.instructionText}>
                        Tap to read • Swipe left to delete • Use action buttons for approvals
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
        </>
    );
};

const styles = StyleSheet.create({
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
});

export default NotificationBanners;