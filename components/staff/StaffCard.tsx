import { Colors } from '@/constants/theme';
import { StaffCardProps } from '@/types/staff';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const INK = '#0F172A';

// "site-engineer" → "Site engineer"
const formatRole = (role: string) => {
    const words = (role || '').replace(/[-_]/g, ' ').trim();
    return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Staff';
};

const StaffCard: React.FC<StaffCardProps & { isExpanded?: boolean }> = ({ staff, onPress, isExpanded = false }) => {
    const initials = ((staff.firstName?.[0] ?? '') + (staff.lastName?.[0] ?? '')).toUpperCase() || '?';
    const fullName = `${staff.firstName} ${staff.lastName}`;
    const role = formatRole(staff.role);
    const projectCount = staff.assignedProjects?.length ?? 0;
    const projectLabel = projectCount > 0
        ? `${projectCount} project${projectCount !== 1 ? 's' : ''}`
        : 'No projects';

    return (
        <TouchableOpacity
            style={[styles.card, isExpanded && styles.cardExpanded]}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ expanded: isExpanded }}
            accessibilityLabel={`${fullName}${staff.emailVerified ? ', verified' : ''}, ${role}, ${projectLabel}`}
            accessibilityHint={isExpanded ? 'Hides actions' : 'Shows projects and actions'}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <View style={styles.info}>
                <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>{fullName}</Text>
                    {staff.emailVerified && (
                        <Ionicons name="checkmark-circle" size={16} color={Colors.successText} />
                    )}
                </View>

                <Text style={styles.roleLine} numberOfLines={1}>
                    {role}<Text style={styles.dot}> · </Text>{projectLabel}
                </Text>

                <View style={styles.meta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="call-outline" size={13} color={Colors.textSecondary} />
                        <Text style={styles.metaText}>{staff.phoneNumber}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="mail-outline" size={13} color={Colors.textSecondary} />
                        <Text style={styles.metaText} numberOfLines={1}>{staff.email}</Text>
                    </View>
                </View>
            </View>

            <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={Colors.textSecondary}
                style={styles.chevron}
            />
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
        // No overflow:'hidden' here — combined with elevation it triggers a
        // Fabric/Android bug where the card's children render blank (white)
        // when elevation/borderRadius change on expand/collapse.
        shadowColor: INK,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
    },
    cardExpanded: {
        // The action panel below continues the card
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderBottomColor: Colors.border,
        marginBottom: 0,
        shadowOpacity: 0,
        elevation: 0,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.primaryDark,
    },
    info: {
        flex: 1,
        gap: 3,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    name: {
        flexShrink: 1,
        fontSize: 16,
        fontWeight: '700',
        color: INK,
        letterSpacing: -0.2,
    },
    roleLine: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
    dot: {
        color: Colors.textSecondary,
        fontWeight: '400',
    },
    meta: {
        gap: 2,
        marginTop: 3,
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
    chevron: {
        marginLeft: 8,
    },
});

export default StaffCard;
