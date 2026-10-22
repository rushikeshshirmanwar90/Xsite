import { Colors, Radius } from '@/constants/theme';
import {
    CATEGORY_LABELS,
    errorMessage,
    formatRupees,
    PaidBy,
    Partnership,
    PartnershipTransaction,
    reassignTransaction,
} from '@/functions/partnership';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { toast } from 'sonner-native';
import PaidByPicker from './PaidByPicker';
import PartnershipSheet from './PartnershipSheet';

// Fixes who paid a payment that was recorded against the wrong partner. The
// parent gives it a fresh key per entry, so it always starts from that entry.

interface ChangePayerSheetProps {
    visible: boolean;
    transaction: PartnershipTransaction | null;
    partnership: Partnership;
    myPartnerId: string | null;
    poolBalance?: number | null;
    onClose: () => void;
    onSaved: () => void;
}

const ChangePayerSheet: React.FC<ChangePayerSheetProps> = ({
    visible,
    transaction,
    partnership,
    myPartnerId,
    poolBalance,
    onClose,
    onSaved,
}) => {
    const [value, setValue] = useState<PaidBy | null>(() =>
        !transaction
            ? null
            : transaction.paidFrom === 'pool'
                ? { type: 'pool' }
                : transaction.partnerId
                    ? { type: 'partner', partnerId: transaction.partnerId }
                    : null
    );
    const [submitting, setSubmitting] = useState(false);

    const handleSave = async () => {
        if (!transaction || !value) return;
        setSubmitting(true);
        try {
            await reassignTransaction(transaction._id, value);
            toast.success('Payment updated');
            onSaved();
        } catch (error) {
            toast.error(errorMessage(error, "Couldn't update the payment. Try again."));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PartnershipSheet
            visible={visible && !!transaction}
            title="Change Who Paid"
            onClose={onClose}
            primaryTitle="Save"
            primaryLoadingTitle="Saving…"
            onPrimary={handleSave}
            loading={submitting}
        >
            {transaction && (
                <View style={styles.summary}>
                    <View style={styles.summaryText}>
                        <Text style={styles.summaryTitle} numberOfLines={2}>
                            {transaction.source?.label || transaction.description || CATEGORY_LABELS[transaction.category]}
                        </Text>
                        <Text style={styles.summaryDetail}>{CATEGORY_LABELS[transaction.category]}</Text>
                    </View>
                    <Text style={styles.summaryAmount}>{formatRupees(transaction.amount)}</Text>
                </View>
            )}

            <PaidByPicker
                partnership={partnership}
                value={value}
                onChange={setValue}
                myPartnerId={myPartnerId}
                poolBalance={poolBalance}
            />
        </PartnershipSheet>
    );
};

const styles = StyleSheet.create({
    summary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: Radius.md,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    summaryText: {
        flex: 1,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    summaryDetail: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    summaryAmount: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.textPrimary,
        fontVariant: ['tabular-nums'],
    },
});

export default ChangePayerSheet;
