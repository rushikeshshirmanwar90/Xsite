// components/AdminCard.tsx
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

// Read-only unless a caller passes onPress — a chevron and press state on a card
// that leads nowhere promises a detail screen that doesn't exist.
const AdminCard: React.FC<AdminCardProps> = ({ admin, onPress }) => {
    const initials = ((admin.firstName?.[0] ?? '') + (admin.lastName?.[0] ?? '')).toUpperCase() || '?';
    const fullName = `${admin.firstName} ${admin.lastName}`;

    const content = (
        <>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <View style={styles.info}>
                <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>{fullName}</Text>
                    <View style={styles.badge}>
                        <Ionicons name="shield-checkmark" size={12} color={Colors.primaryDark} />
                        <Text style={styles.badgeText}>Admin</Text>
                    </View>
                </View>
                <View style={styles.metaItem}>
                    <Ionicons name="call-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{admin.phoneNumber}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Ionicons name="mail-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.metaText} numberOfLines={1}>{admin.email}</Text>
                </View>
            </View>

            {onPress && <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />}
        </>
    );

    if (!onPress) {
        return (
            <View style={styles.card} accessible accessibilityLabel={`${fullName}, admin, ${admin.phoneNumber}, ${admin.email}`}>
                {content}
            </View>
        );
    }

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${fullName}, admin`}
        >
            {content}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E8EDF4',
        paddingVertical: 14,
        paddingLeft: 14,
        paddingRight: 12,
        marginBottom: 10,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    info: {
        flex: 1,
        gap: 3,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 2,
    },
    name: {
        flexShrink: 1,
        fontSize: 16,
        fontWeight: '700',
        color: INK,
        letterSpacing: -0.2,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.primaryDark,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        flexShrink: 1,
        fontSize: 13,
        color: Colors.textSecondary,
        fontVariant: ['tabular-nums'],
    },
});

export default AdminCard;
