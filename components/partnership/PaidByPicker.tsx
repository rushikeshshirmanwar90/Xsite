import { Colors, Radius } from '@/constants/theme';
import { formatRupees, PaidBy, Partnership } from '@/functions/partnership';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { partnerColor, partnerInitials } from './partnerStyle';

// "Paid By" on every payment form of a project that has a partnership: one of
// the partners, or the shared pool. Renders nothing for projects without one,
// so those forms look and work exactly as before.

interface PaidByPickerProps {
    partnership: Partnership | null;
    value: PaidBy | null;
    onChange: (value: PaidBy) => void;
    myPartnerId?: string | null;
    // Shown under the pool option so people can see whether it can cover this
    poolBalance?: number | null;
    // Off when choosing whose money goes into the pool
    includePool?: boolean;
    error?: string;
    label?: string;
    style?: StyleProp<ViewStyle>;
}

export const isSamePaidBy = (a: PaidBy | null, b: PaidBy) =>
    !!a && a.type === b.type && (a.type === 'pool' || (b.type === 'partner' && a.partnerId === b.partnerId));

const PaidByPicker: React.FC<PaidByPickerProps> = ({
    partnership,
    value,
    onChange,
    myPartnerId,
    poolBalance,
    includePool = true,
    error,
    label = 'Paid By',
    style,
}) => {
    if (!partnership || partnership.status !== 'active') return null;

    const partners = partnership.partners.filter((p) => p.status === 'active');
    const options: { key: string; paidBy: PaidBy; title: string; detail?: string; color?: string; initials?: string }[] = [
        ...partners.map((partner) => ({
            key: partner.partnerId,
            paidBy: { type: 'partner' as const, partnerId: partner.partnerId },
            title: partner.name,
            detail: [partner.partnerType === 'owner' ? 'Owner' : null, partner.partnerId === myPartnerId ? 'You' : null]
                .filter(Boolean)
                .join(' · ') || undefined,
            color: partnerColor(partnership.partners, partner.partnerId),
            initials: partnerInitials(partner.name),
        })),
        ...(includePool
            ? [{
                key: 'pool',
                paidBy: { type: 'pool' as const },
                title: 'Partnership pool',
                detail:
                    poolBalance === undefined || poolBalance === null
                        ? 'Money the partners put in'
                        : poolBalance >= 0
                            ? `${formatRupees(poolBalance)} left`
                            : `Short by ${formatRupees(-poolBalance)}`,
            }]
            : []),
    ];

    return (
        <View style={style}>
            <Text style={styles.label}>{label}</Text>
            <View
                style={[styles.group, !!error && styles.groupError]}
                accessibilityRole="radiogroup"
                accessibilityLabel={label}
            >
                {options.map((option, index) => {
                    const selected = isSamePaidBy(value, option.paidBy);
                    return (
                        <Pressable
                            key={option.key}
                            onPress={() => onChange(option.paidBy)}
                            style={({ pressed }) => [
                                styles.row,
                                index > 0 && styles.rowDivider,
                                pressed && styles.rowPressed,
                            ]}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: selected }}
                            accessibilityLabel={[option.title, option.detail].filter(Boolean).join(', ')}
                        >
                            {option.initials ? (
                                <View style={[styles.avatar, { backgroundColor: option.color }]}>
                                    <Text style={styles.avatarText} allowFontScaling={false}>{option.initials}</Text>
                                </View>
                            ) : (
                                <View style={[styles.avatar, styles.poolAvatar]}>
                                    <Ionicons name="wallet-outline" size={18} color={Colors.primaryDark} />
                                </View>
                            )}
                            <View style={styles.rowText}>
                                <Text style={styles.title} numberOfLines={1}>{option.title}</Text>
                                {option.detail ? (
                                    <Text
                                        style={[
                                            styles.detail,
                                            option.key === 'pool' && (poolBalance ?? 0) < 0 && styles.detailWarning,
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {option.detail}
                                    </Text>
                                ) : null}
                            </View>
                            <Ionicons
                                name={selected ? 'radio-button-on' : 'radio-button-off'}
                                size={22}
                                color={selected ? Colors.primary : Colors.textSecondary}
                            />
                        </Pressable>
                    );
                })}
            </View>
            {error ? (
                <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={16} color={Colors.errorText} style={styles.errorIcon} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    group: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
    },
    groupError: {
        borderColor: Colors.error,
    },
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
    poolAvatar: {
        backgroundColor: Colors.primaryLight,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    rowText: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    detail: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 1,
    },
    detailWarning: {
        color: Colors.warningText,
    },
    errorRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginTop: 8,
    },
    errorIcon: {
        marginTop: 1,
    },
    errorText: {
        flexShrink: 1,
        fontSize: 14,
        lineHeight: 19,
        color: Colors.errorText,
    },
});

export default PaidByPicker;
