// components/StaffHeader.tsx
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const INK = '#0F172A';

interface StaffHeaderProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onScanQRPress?: () => void;
    isAdmin?: boolean;
}

// Counts live on the section headers below, which already leave out the signed-in
// user — repeating different totals up here only made the two disagree.
const StaffHeader: React.FC<StaffHeaderProps> = ({
    searchQuery,
    onSearchChange,
    onScanQRPress,
    isAdmin = true,
}) => {
    return (
        <View style={styles.header}>
            <Text style={styles.headerTitle} accessibilityRole="header">Team</Text>

            <View style={styles.searchRow}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={18} color={Colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search name, email or role"
                        placeholderTextColor={Colors.textSecondary}
                        value={searchQuery}
                        onChangeText={onSearchChange}
                        returnKeyType="search"
                        autoCorrect={false}
                        autoCapitalize="none"
                        clearButtonMode="never"
                        accessibilityLabel="Search team"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={() => onSearchChange('')}
                            style={styles.clearButton}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Clear search"
                        >
                            <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {isAdmin && onScanQRPress && (
                    <TouchableOpacity
                        style={styles.scanButton}
                        onPress={onScanQRPress}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Add staff by scanning their QR code"
                    >
                        <Ionicons name="qr-code-outline" size={22} color={Colors.primaryDark} />
                    </TouchableOpacity>
                )}
            </View>

            {!isAdmin && (
                <View style={styles.viewOnlyRow}>
                    <Ionicons name="lock-closed-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.viewOnlyText}>View only. Ask an admin to add or change staff.</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: Colors.surface,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: INK,
        letterSpacing: -0.7,
        marginBottom: 12,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.fill,
        borderRadius: 12,
        paddingHorizontal: 12,
        minHeight: 44,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: INK,
        paddingVertical: 10,
    },
    clearButton: {
        padding: 2,
    },
    scanButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewOnlyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
    },
    viewOnlyText: {
        flexShrink: 1,
        fontSize: 13,
        fontWeight: '500',
        color: Colors.textSecondary,
    },
});

export default StaffHeader;
