import { StaffCardProps } from '@/types/staff';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ROLE_COLOR: Record<string, { color: string; bg: string }> = {
    'site-engineer': { color: '#2563EB', bg: '#EAF0FE' },
    'supervisor':    { color: '#16A34A', bg: '#F0FDF4' },
    'manager':       { color: '#7C3AED', bg: '#FAF5FF' },
};

const StaffCard: React.FC<StaffCardProps & { isExpanded?: boolean }> = ({ staff, onPress, isExpanded = false }) => {
    const initials = (staff.firstName[0] + staff.lastName[0]).toUpperCase();
    const roleStyle = ROLE_COLOR[staff.role] ?? { color: '#3A78B5', bg: '#EAF0FE' };
    const projectCount = staff.assignedProjects?.length ?? 0;

    return (
        <TouchableOpacity
            style={[
                styles.card,
                isExpanded && styles.cardExpanded,
            ]}
            onPress={onPress}
            activeOpacity={0.75}
        >
            {/* Left accent */}
            <View
                style={[
                    styles.accent,
                    { backgroundColor: roleStyle.color },
                    isExpanded && styles.accentExpanded,
                ]}
            />

            {/* Avatar */}
            <View style={[styles.avatar, { backgroundColor: roleStyle.bg }]}>
                <Text style={[styles.avatarText, { color: roleStyle.color }]}>{initials}</Text>
            </View>

            {/* Info */}
            <View style={styles.info}>
                <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                        {staff.firstName} {staff.lastName}
                    </Text>
                    {staff.emailVerified && (
                        <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                    )}
                </View>

                <View style={[styles.rolePill, { backgroundColor: roleStyle.bg }]}>
                    <Text style={[styles.roleText, { color: roleStyle.color }]}>
                        {staff.role}
                    </Text>
                </View>

                <View style={styles.meta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="call-outline" size={12} color="#94A3B8" />
                        <Text style={styles.metaText}>{staff.phoneNumber}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="mail-outline" size={12} color="#94A3B8" />
                        <Text style={styles.metaText} numberOfLines={1}>{staff.email}</Text>
                    </View>
                </View>

                {projectCount > 0 && (
                    <View style={styles.projectRow}>
                        <Ionicons name="folder-outline" size={12} color="#64748B" />
                        <Text style={styles.projectText}>
                            {projectCount} project{projectCount !== 1 ? 's' : ''} assigned
                        </Text>
                    </View>
                )}
            </View>

            {/* Expand indicator */}
            <View style={[styles.expandBtn, isExpanded && { backgroundColor: roleStyle.bg }]}>
                <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={isExpanded ? roleStyle.color : '#94A3B8'}
                />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 10,
        // No overflow:'hidden' here — combined with elevation it triggers a
        // Fabric/Android bug where the card's children render blank (white)
        // when elevation/borderRadius change on expand/collapse. The accent
        // stripe rounds its own corners instead.
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
    },
    cardExpanded: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        marginBottom: 0,
        shadowOpacity: 0,
        elevation: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    accent: {
        width: 4,
        alignSelf: 'stretch',
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
    },
    accentExpanded: {
        // Card bottom corners are square while the dropdown is open
        borderBottomLeftRadius: 0,
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 14,
    },
    avatarText: {
        fontSize: 17,
        fontWeight: '800',
    },
    info: {
        flex: 1,
        paddingVertical: 14,
        paddingRight: 4,
        gap: 5,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    name: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
        flexShrink: 1,
    },
    rolePill: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    roleText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    meta: {
        gap: 3,
        marginTop: 2,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    metaText: {
        fontSize: 12,
        color: '#64748B',
        flexShrink: 1,
    },
    projectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 2,
    },
    projectText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    expandBtn: {
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
});

export default StaffCard;
