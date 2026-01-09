// components/StaffHeader.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface StaffHeaderProps {
    staffCount: number;
    adminCount: number;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onScanQRPress?: () => void;
    isAdmin?: boolean;
}

const StaffHeader: React.FC<StaffHeaderProps> = ({
    staffCount,
    adminCount,
    searchQuery,
    onSearchChange,
    onScanQRPress,
    isAdmin = true,
}) => {
    return (
        <View style={styles.header}>
            {/* Title Section */}
            <View style={styles.titleSection}>
                <View style={styles.titleContainer}>
                    <Text style={styles.headerTitle}>Team Management</Text>
                    <View style={styles.countsContainer}>
                        <View style={styles.countItem}>
                            <Ionicons name="people" size={16} color="#3B82F6" />
                            <Text style={styles.countText}>
                                {staffCount} Staff
                            </Text>
                        </View>
                        <View style={styles.countSeparator} />
                        <View style={styles.countItem}>
                            <Ionicons name="shield-checkmark" size={16} color="#F59E0B" />
                            <Text style={styles.countText}>
                                {adminCount} Admin{adminCount !== 1 ? 's' : ''}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Search Bar and Scan Button Row */}
            <View style={styles.searchRow}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={20} color="#64748B" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name, email, or role..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={onSearchChange}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={() => onSearchChange('')}
                            style={styles.clearButton}
                        >
                            <Ionicons name="close-circle" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Scan QR Button */}
                {isAdmin && onScanQRPress && (
                    <TouchableOpacity
                        style={styles.scanButton}
                        onPress={onScanQRPress}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="qr-code-outline" size={22} color="#3B82F6" />
                    </TouchableOpacity>
                )}
            </View>

            {/* View-only message for non-admin */}
            {!isAdmin && (
                <View style={styles.viewOnlyBanner}>
                    <Ionicons name="lock-closed-outline" size={16} color="#64748B" />
                    <Text style={styles.viewOnlyText}>View Only - Contact admin to add staff</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    titleSection: {
        marginBottom: 16,
    },
    titleContainer: {
        gap: 8,
    },
    countsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    countItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    countText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    countSeparator: {
        width: 1,
        height: 16,
        backgroundColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 48,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '400',
    },
    clearButton: {
        padding: 4,
    },
    scanButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        borderWidth: 2,
        borderColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewOnlyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 8,
    },
    viewOnlyText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748B',
    },
});

export default StaffHeader;