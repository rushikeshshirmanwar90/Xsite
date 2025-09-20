// components/StaffEmptyState.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface StaffEmptyStateProps {
    hasSearchQuery: boolean;
    onAddPress?: () => void;
}

const StaffEmptyState: React.FC<StaffEmptyStateProps> = ({ hasSearchQuery, onAddPress }) => {
    return (
        <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>
                {hasSearchQuery ? 'No matching staff found' : 'No staff members yet'}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
                {hasSearchQuery
                    ? 'Try adjusting your search terms'
                    : 'Add your first staff member to get started'
                }
            </Text>
            {!hasSearchQuery && onAddPress && (
                <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={onAddPress}
                >
                    <Text style={styles.emptyStateButtonText}>Add Staff Member</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 40,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyStateSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    emptyStateButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    emptyStateButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default StaffEmptyState;