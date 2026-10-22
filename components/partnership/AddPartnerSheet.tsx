import CustomTextInput from '@/components/common/CustomTextInput';
import { Colors, Radius } from '@/constants/theme';
import {
    errorMessage,
    fetchTeam,
    parseAmountInput,
    Partnership,
    reportNotAssigned,
    TeamMember,
    updatePartnership,
} from '@/functions/partnership';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { toast } from 'sonner-native';
import PartnershipSheet from './PartnershipSheet';
import { PARTNER_COLORS } from './partnerStyle';
import TeamMemberRow from './TeamMemberRow';

// Adds one more team member to an existing partnership. The parent gives it a
// fresh key each time it opens, so every opening starts from a blank form.

interface AddPartnerSheetProps {
    visible: boolean;
    clientId: string | null;
    partnership: Partnership;
    onClose: () => void;
    onAdded: () => void;
}

const AddPartnerSheet: React.FC<AddPartnerSheetProps> = ({ visible, clientId, partnership, onClose, onAdded }) => {
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [teamLoading, setTeamLoading] = useState(() => visible && !!clientId);
    const [teamError, setTeamError] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [amount, setAmount] = useState('');
    const [selectError, setSelectError] = useState('');
    const [amountError, setAmountError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!visible || !clientId) return;
        let cancelled = false;
        fetchTeam(clientId)
            .then((members) => {
                if (!cancelled) setTeam(members);
            })
            .catch((error) => {
                if (!cancelled) setTeamError(errorMessage(error, "Couldn't load your team."));
            })
            .finally(() => {
                if (!cancelled) setTeamLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [visible, clientId]);

    const activePartnerIds = new Set(
        partnership.partners.filter((p) => p.status === 'active').map((p) => p.partnerId)
    );
    const candidates = team.filter((member) => !activePartnerIds.has(member._id));

    const handleAdd = async () => {
        const value = parseAmountInput(amount);
        setSelectError(selectedId ? '' : 'Choose who to add.');
        setAmountError(value === null ? 'Enter an amount in rupees, like 50000.' : '');
        if (!selectedId || value === null) return;

        setSubmitting(true);
        try {
            const result = await updatePartnership({
                partnershipId: partnership._id,
                action: 'add_partner',
                staffId: selectedId,
                initialAmount: value,
            });
            toast.success('Partner added');
            reportNotAssigned(result);
            onAdded();
        } catch (error) {
            toast.error(errorMessage(error, "Couldn't add the partner. Try again."));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PartnershipSheet
            visible={visible}
            title="Add Partner"
            subtitle="They'll be assigned to this project as staff if they aren't already, and see its partnership account when they log in."
            onClose={onClose}
            primaryTitle="Add Partner"
            primaryLoadingTitle="Adding…"
            onPrimary={handleAdd}
            loading={submitting}
        >
            <View>
                <Text style={styles.label}>Team Member</Text>
                {teamLoading ? (
                    <View style={styles.state}>
                        <ActivityIndicator color={Colors.primary} />
                    </View>
                ) : teamError ? (
                    <Text style={styles.errorText}>{teamError}</Text>
                ) : candidates.length === 0 ? (
                    <View style={styles.state}>
                        <Text style={styles.stateText}>Everyone on your team is already a partner here.</Text>
                    </View>
                ) : (
                    <View style={[styles.group, !!selectError && styles.groupError]} accessibilityRole="radiogroup">
                        {candidates.map((member, index) => (
                            <TeamMemberRow
                                key={member._id}
                                member={member}
                                selected={selectedId === member._id}
                                mode="radio"
                                color={PARTNER_COLORS[(partnership.partners.length + index) % PARTNER_COLORS.length]}
                                onPress={() => {
                                    setSelectedId(member._id);
                                    setSelectError('');
                                }}
                                showDivider={index > 0}
                            />
                        ))}
                    </View>
                )}
                {selectError ? <Text style={styles.errorText}>{selectError}</Text> : null}
            </View>

            <CustomTextInput
                label="Their Initial Amount"
                icon="currency-rupee"
                placeholder="0"
                value={amount}
                onChangeText={(text) => {
                    setAmount(text);
                    setAmountError('');
                }}
                error={amountError}
                hint="Leave it at 0 if they haven't put money in yet."
                keyboardType="decimal-pad"
                returnKeyType="done"
            />
        </PartnershipSheet>
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
    state: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    stateText: {
        fontSize: 15,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 14,
        lineHeight: 19,
        color: Colors.errorText,
        marginTop: 8,
    },
});

export default AddPartnerSheet;
