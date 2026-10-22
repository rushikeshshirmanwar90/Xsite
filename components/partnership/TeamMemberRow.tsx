import { Colors } from '@/constants/theme';
import { TeamMember, teamMemberName } from '@/functions/partnership';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { partnerInitials } from './partnerStyle';

// One selectable person from the business's team, for choosing partners

interface TeamMemberRowProps {
    member: TeamMember;
    selected: boolean;
    // checkbox when several can be picked, radio when only one
    mode: 'checkbox' | 'radio';
    color: string;
    onPress: () => void;
    showDivider?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
    'site-engineer': 'Site engineer',
    supervisor: 'Supervisor',
    manager: 'Manager',
};

const TeamMemberRow: React.FC<TeamMemberRowProps> = ({ member, selected, mode, color, onPress, showDivider }) => {
    const name = teamMemberName(member);
    const detail = (member.role && ROLE_LABELS[member.role]) || member.phoneNumber || member.email;
    const icon = mode === 'checkbox'
        ? (selected ? 'checkbox' : 'square-outline')
        : (selected ? 'radio-button-on' : 'radio-button-off');

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.row, showDivider && styles.rowDivider, pressed && styles.rowPressed]}
            accessibilityRole={mode === 'checkbox' ? 'checkbox' : 'radio'}
            accessibilityState={{ checked: selected }}
            accessibilityLabel={[name, detail].filter(Boolean).join(', ')}
        >
            <View style={[styles.avatar, { backgroundColor: color }]}>
                <Text style={styles.avatarText} allowFontScaling={false}>{partnerInitials(name)}</Text>
            </View>
            <View style={styles.text}>
                <Text style={styles.name} numberOfLines={1}>{name}</Text>
                {detail ? <Text style={styles.detail} numberOfLines={1}>{detail}</Text> : null}
            </View>
            <Ionicons name={icon} size={22} color={selected ? Colors.primary : Colors.textSecondary} />
        </Pressable>
    );
};

const styles = StyleSheet.create({
    row: {
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    rowDivider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
    },
    rowPressed: {
        backgroundColor: Colors.fill,
    },
    avatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    text: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    detail: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 1,
    },
});

export default TeamMemberRow;
