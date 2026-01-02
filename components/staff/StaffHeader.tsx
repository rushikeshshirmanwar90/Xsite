// components/StaffHeader.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
    onAddPress: () => void;
    onScanQRPress?: () => void;
    isAdmin?: boolean;
}

const StaffHeader: React.FC<StaffHeaderProps> = ({
    staffCount,
    adminCount,
    searchQuery,
    onSearchChange,
    onAddPress,
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

            {/* Add Staff Button - Full Width */}
            {isAdmin && (
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={onAddPress}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#3B82F6', '#8B5CF6']}
                            style={styles.addButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="add-circle" size={22} color="white" />
                            <Text style={styles.addButtonText}>Add Staff</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {onScanQRPress && (
                        <TouchableOpacity
                            style={styles.scanButton}
                            onPress={onScanQRPress}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="qr-code-outline" size={22} color="#3B82F6" />
                            <Text style={styles.scanButtonText}>Scan QR</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* View-only message for non-admin */}
            {!isAdmin && (
                <View style={styles.viewOnlyBanner}>
                    <Ionicons name="lock-closed-outline" size={16} color="#64748B" />
                    <Text style={styles.viewOnlyText}>View Only - Contact admin to add staff</Text>
                </View>
            )}

            {/* Search Bar */}
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
    headerSubtitle: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    addButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    addButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 10,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 15,
        letterSpacing: 0.3,
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 8,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        borderWidth: 2,
        borderColor: '#3B82F6',
    },
    scanButtonText: {
        color: '#3B82F6',
        fontWeight: '600',
        fontSize: 15,
        letterSpacing: 0.3,
    },
    viewOnlyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
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
    searchContainer: {
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
});

export default StaffHeader;