import CustomTextInput from '@/components/common/CustomTextInput';
import { Colors } from '@/constants/theme';
import {
    addContribution,
    ContributionCategory,
    errorMessage,
    PaidBy,
    parseAmountInput,
    Partnership,
    PartnershipSummary,
} from '@/functions/partnership';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { toast } from 'sonner-native';
import PaidByPicker from './PaidByPicker';
import PartnershipSheet from './PartnershipSheet';

// Records money one partner puts into the project's pool. The parent gives it a
// fresh key each time it opens, so every opening starts from a blank form.

interface AddMoneySheetProps {
    visible: boolean;
    partnership: Partnership;
    summary: PartnershipSummary | null;
    myPartnerId: string | null;
    onClose: () => void;
    onAdded: () => void;
}

const KINDS: { key: ContributionCategory; label: string }[] = [
    { key: 'initial', label: 'Initial Amount' },
    { key: 'additional', label: 'Added Later' },
];

const AddMoneySheet: React.FC<AddMoneySheetProps> = ({
    visible,
    partnership,
    summary,
    myPartnerId,
    onClose,
    onAdded,
}) => {
    // Partners who haven't put anything in yet are usually giving their initial amount
    const defaultKindFor = (partnerId: string): ContributionCategory => {
        const existing = summary?.partners.find((p) => p.partnerId === partnerId);
        return existing && existing.contributed.initial > 0 ? 'additional' : 'initial';
    };

    // Start with the person recording it, when they're a partner here
    const [partner, setPartner] = useState<PaidBy | null>(() =>
        myPartnerId && partnership.partners.some((p) => p.status === 'active' && p.partnerId === myPartnerId)
            ? { type: 'partner', partnerId: myPartnerId }
            : null
    );
    const [kind, setKind] = useState<ContributionCategory>(() =>
        partner?.type === 'partner' ? defaultKindFor(partner.partnerId) : 'additional'
    );
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [partnerError, setPartnerError] = useState('');
    const [amountError, setAmountError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleAdd = async () => {
        const value = parseAmountInput(amount);
        const partnerId = partner?.type === 'partner' ? partner.partnerId : '';
        setPartnerError(partnerId ? '' : 'Choose whose money this is.');
        setAmountError(!value ? 'Enter an amount greater than 0.' : '');
        if (!partnerId || !value) return;

        setSubmitting(true);
        try {
            await addContribution({
                partnershipId: partnership._id,
                partnerId,
                amount: value,
                category: kind,
                description: note.trim() || undefined,
            });
            toast.success('Amount added');
            onAdded();
        } catch (error) {
            toast.error(errorMessage(error, "Couldn't add the amount. Try again."));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PartnershipSheet
            visible={visible}
            title="Add Money"
            subtitle="Money a partner puts into this project's pool."
            onClose={onClose}
            primaryTitle="Add Money"
            primaryLoadingTitle="Adding…"
            onPrimary={handleAdd}
            loading={submitting}
        >
            <PaidByPicker
                partnership={partnership}
                value={partner}
                onChange={(value) => {
                    setPartner(value);
                    setPartnerError('');
                    if (value.type === 'partner') setKind(defaultKindFor(value.partnerId));
                }}
                myPartnerId={myPartnerId}
                includePool={false}
                label="Partner"
                error={partnerError}
            />

            <View>
                <Text style={styles.label}>Type</Text>
                <View style={styles.segmented} accessibilityRole="radiogroup">
                    {KINDS.map((option) => {
                        const selected = kind === option.key;
                        return (
                            <Pressable
                                key={option.key}
                                onPress={() => setKind(option.key)}
                                style={[styles.segment, selected && styles.segmentSelected]}
                                accessibilityRole="radio"
                                accessibilityState={{ checked: selected }}
                            >
                                <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                                    {option.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            <CustomTextInput
                label="Amount"
                icon="currency-rupee"
                placeholder="0"
                value={amount}
                onChangeText={(text) => {
                    setAmount(text);
                    setAmountError('');
                }}
                error={amountError}
                keyboardType="decimal-pad"
                returnKeyType="done"
            />

            <CustomTextInput
                label="Note"
                placeholder="Optional, e.g. bank transfer or cheque number"
                value={note}
                onChangeText={setNote}
                maxLength={200}
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
    segmented: {
        flexDirection: 'row',
        backgroundColor: Colors.fill,
        borderRadius: 12,
        padding: 4,
        gap: 4,
    },
    segment: {
        flex: 1,
        minHeight: 40,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    segmentSelected: {
        backgroundColor: Colors.surface,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    segmentText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    segmentTextSelected: {
        color: Colors.textPrimary,
    },
});

export default AddMoneySheet;
