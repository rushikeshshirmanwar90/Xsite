// components/AdminCard.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Admin {
    _id?: string;
    firstName: string;
    lastName: string;
    phoneNumber: number;
    email: string;
    clientId?: string;
}

interface AdminCardProps {
    admin: Admin;
    onPress?: () => void;
}

const AdminCard: React.FC<AdminCardProps> = ({ admin, onPress }) => {
    const getInitials = (firstName: string, lastName: string): string => {
        return (firstName[0] + lastName[0]).toUpperCase();
    };

    const getAdminColor = (): readonly [string, string] => {
        // Use a consistent admin color scheme (gold/orange for admin)
        return ['#F59E0B', '#D97706'];
    };

    const avatarColors = getAdminColor();
    const fullName = `${admin.firstName} ${admin.lastName}`;

    return (
        <TouchableOpacity
            style={styles.adminCard}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.adminCardContent}>
                <View style={styles.adminInfo}>
                    <LinearGradient
                        colors={avatarColors}
                        style={styles.avatar}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={styles.avatarText}>
                            {getInitials(admin.firstName, admin.lastName)}
                        </Text>
                    </LinearGradient>

                    <View style={styles.adminDetails}>
                        <View style={styles.nameContainer}>
                            <Text style={styles.adminName}>{fullName}</Text>
                            <View style={styles.adminBadge}>
                                <Ionicons name="shield-checkmark" size={12} color="#F59E0B" />
                                <Text style={styles.adminBadgeText}>ADMIN</Text>
                            </View>
                        </View>

                        <View style={styles.contactInfo}>
                            <View style={styles.contactItem}>
                                <Ionicons name="call" size={12} color="#6B7280" />
                                <Text style={styles.contactText}>{admin.phoneNumber}</Text>
                            </View>

                            <View style={styles.contactItem}>
                                <Ionicons name="mail" size={12} color="#6B7280" />
                                <Text style={styles.contactText} numberOfLines={1}>{admin.email}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.adminPermissions}>
                    <Text style={styles.permissionsLabel}>Admin Permissions</Text>
                    <View style={styles.permissionsList}>
                        <View style={styles.permissionItem}>
                            <Ionicons name="people" size={14} color="#10B981" />
                            <Text style={styles.permissionText}>Manage Staff</Text>
                        </View>
                        <View style={styles.permissionItem}>
                            <Ionicons name="folder" size={14} color="#10B981" />
                            <Text style={styles.permissionText}>Manage Projects</Text>
                        </View>
                        <View style={styles.permissionItem}>
                            <Ionicons name="settings" size={14} color="#10B981" />
                            <Text style={styles.permissionText}>System Settings</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.cardAction}>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    adminCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
    },
    adminCardContent: {
        flex: 1,
        padding: 16,
    },
    adminInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    adminDetails: {
        flex: 1,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    adminName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginRight: 8,
    },
    adminBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 2,
    },
    adminBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#F59E0B',
        letterSpacing: 0.5,
    },
    contactInfo: {
        gap: 4,
        marginBottom: 8,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    contactText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 6,
        flex: 1,
    },
    adminPermissions: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
    },
    permissionsLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    permissionsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    permissionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    permissionText: {
        fontSize: 11,
        color: '#166534',
        fontWeight: '500',
    },
    cardAction: {
        paddingRight: 16,
        paddingLeft: 8,
    },
});

export default AdminCard;