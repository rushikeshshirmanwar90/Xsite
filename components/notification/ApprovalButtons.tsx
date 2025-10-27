import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ApprovalButtonsProps } from './types';

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

const styles = StyleSheet.create({
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
});

export default ApprovalButtons;