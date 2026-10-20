// components/StaffEmptyState.tsx
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const INK = '#0F172A';

interface StaffEmptyStateProps {
    hasSearchQuery: boolean;
    onAddPress?: () => void;
}

const StaffEmptyState: React.FC<StaffEmptyStateProps> = ({ hasSearchQuery, onAddPress }) => {
    return (
        <View style={styles.emptyState}>
            <View style={styles.iconBadge}>
                <Ionicons name={hasSearchQuery ? 'search' : 'people-outline'} size={30} color={Colors.primaryDark} />
            </View>
            <Text style={styles.title}>
                {hasSearchQuery ? 'No matching staff' : 'No staff yet'}
            </Text>
            <Text style={styles.body}>
                {hasSearchQuery
                    ? 'Try a different name, email or role.'
                    : 'Add the people who work on your sites so you can assign them to projects.'}
            </Text>
            {!hasSearchQuery && onAddPress && (
                <TouchableOpacity
                    style={styles.button}
                    onPress={onAddPress}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                >
                    <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Add Staff Member</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    emptyState: {
        alignItems: 'center',
        paddingTop: 40,
        paddingBottom: 24,
        paddingHorizontal: 24,
    },
    iconBadge: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: INK,
        letterSpacing: -0.2,
        textAlign: 'center',
    },
    body: {
        fontSize: 15,
        lineHeight: 21,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 6,
        maxWidth: 300,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 20,
        backgroundColor: Colors.primary,
        paddingHorizontal: 22,
        minHeight: 48,
        borderRadius: 24,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    },
});

export default StaffEmptyState;
