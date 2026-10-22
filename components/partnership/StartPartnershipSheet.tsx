import CustomTextInput from '@/components/common/CustomTextInput';
import { Colors, Radius } from '@/constants/theme';
import {
    errorMessage,
    fetchTeam,
    parseAmountInput,
    reportNotAssigned,
    startPartnership,
    TeamMember,
} from '@/functions/partnership';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { toast } from 'sonner-native';
import PartnershipSheet from './PartnershipSheet';
import { PARTNER_COLORS } from './partnerStyle';
import TeamMemberRow from './TeamMemberRow';

// Starts a project's partnership: who the partners are, and what each one
// (the business included) puts into the pool to begin with. The parent gives
// it a fresh key each time it opens, so every opening starts from a blank form.

interface StartPartnershipSheetProps {
    visible: boolean;
    clientId: string | null;
    projectId: string;
    projectName: string;
    onClose: () => void;
    onStarted: () => void;
}

const AMOUNT_ERROR = 'Enter an amount in rupees, like 50000.';

const StartPartnershipSheet: React.FC<StartPartnershipSheetProps> = ({
    visible,
    clientId,
    projectId,
    projectName,
    onClose,
    onStarted,
}) => {
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [teamLoading, setTeamLoading] = useState(() => visible && !!clientId);
    const [teamError, setTeamError] = useState('');
    // Selected staff id → their initial amount as typed
    const [selected, setSelected] = useState<Record<string, string>>({});
    const [ownerAmount, setOwnerAmount] = useState('');
    const [ownerAmountError, setOwnerAmountError] = useState('');
    const [amountErrors, setAmountErrors] = useState<Record<string, string>>({});
    const [partnersError, setPartnersError] = useState('');
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

    const toggle = (member: TeamMember) => {
        setPartnersError('');
        setSelected((prev) => {
            const next = { ...prev };
            if (member._id in next) delete next[member._id];
            else next[member._id] = '';
            return next;
        });
    };

    const handleStart = async () => {
        if (!clientId) {
            toast.error('Your business account could not be found. Log in again.');
            return;
        }

        const owner = parseAmountInput(ownerAmount);
        const partnerIds = Object.keys(selected);
        const nextAmountErrors: Record<string, string> = {};
        const partners = partnerIds.map((staffId) => {
            const amount = parseAmountInput(selected[staffId]);
            if (amount === null) nextAmountErrors[staffId] = AMOUNT_ERROR;
            return { staffId, initialAmount: amount ?? 0 };
        });

        setOwnerAmountError(owner === null ? AMOUNT_ERROR : '');
        setAmountErrors(nextAmountErrors);
        setPartnersError(partnerIds.length === 0 ? 'Choose at least one partner.' : '');
        if (owner === null || partnerIds.length === 0 || Object.keys(nextAmountErrors).length > 0) return;

        setSubmitting(true);
        try {
            const result = await startPartnership({ clientId, projectId, ownerInitialAmount: owner, partners });
            toast.success('Partnership started');
            reportNotAssigned(result);
            onStarted();
        } catch (error) {
            toast.error(errorMessage(error, "Couldn't start the partnership. Try again."));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PartnershipSheet
            visible={visible}
            title="Start Partnership"
            subtitle={`Partners on ${projectName} share its costs. Every payment here will record who paid it.`}
            onClose={onClose}
            primaryTitle="Start Partnership"
            primaryLoadingTitle="Starting…"
            onPrimary={handleStart}
            loading={submitting}
        >
            <CustomTextInput
                label="Your Business's Initial Amount"
                icon="currency-rupee"
                placeholder="0"
                value={ownerAmount}
                onChangeText={(text) => {
                    setOwnerAmount(text);
                    setOwnerAmountError('');
                }}
                error={ownerAmountError}
                hint="What your business puts into the pool to begin with. You can add more later."
                keyboardType="decimal-pad"
                returnKeyType="done"
            />

            <View>
                <Text style={styles.label}>Partners</Text>
                <Text style={styles.help}>
                    Partners log in with their staff account, and are assigned to this project as staff if they
                    aren’t already. Add them to your team from the Staff tab first.
                </Text>

                {teamLoading ? (
                    <View style={styles.state}>
                        <ActivityIndicator color={Colors.primary} />
                    </View>
                ) : teamError ? (
                    <Text style={styles.errorText}>{teamError}</Text>
                ) : team.length === 0 ? (
                    <View style={styles.state}>
                        <Text style={styles.stateText}>No one is on your team yet.</Text>
                    </View>
                ) : (
                    <View style={[styles.group, !!partnersError && styles.groupError]}>
                        {team.map((member, index) => {
                            const isSelected = member._id in selected;
                            return (
                                <View key={member._id}>
                                    <TeamMemberRow
                                        member={member}
                                        selected={isSelected}
                                        mode="checkbox"
                                        color={PARTNER_COLORS[(index + 1) % PARTNER_COLORS.length]}
                                        onPress={() => toggle(member)}
                                        showDivider={index > 0}
                                    />
                                    {isSelected && (
                                        <View style={styles.amountRow}>
                                            <CustomTextInput
                                                label="Their Initial Amount"
                                                icon="currency-rupee"
                                                placeholder="0"
                                                value={selected[member._id]}
                                                onChangeText={(text) => {
                                                    setSelected((prev) => ({ ...prev, [member._id]: text }));
                                                    setAmountErrors((prev) => ({ ...prev, [member._id]: '' }));
                                                }}
                                                error={amountErrors[member._id]}
                                                keyboardType="decimal-pad"
                                                returnKeyType="done"
                                            />
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}
                {partnersError ? <Text style={styles.errorText}>{partnersError}</Text> : null}
            </View>
        </PartnershipSheet>
    );
};

const styles = StyleSheet.create({
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    help: {
        fontSize: 14,
        lineHeight: 19,
        color: Colors.textSecondary,
        marginTop: 4,
        marginBottom: 10,
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
    amountRow: {
        paddingHorizontal: 14,
        paddingBottom: 14,
    },
    state: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    stateText: {
        fontSize: 15,
        color: Colors.textSecondary,
    },
    errorText: {
        fontSize: 14,
        lineHeight: 19,
        color: Colors.errorText,
        marginTop: 8,
    },
});

export default StartPartnershipSheet;
