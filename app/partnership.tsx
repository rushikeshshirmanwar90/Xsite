import { AuthButton } from '@/components/auth/AuthUI';
import AddMoneySheet from '@/components/partnership/AddMoneySheet';
import AddPartnerSheet from '@/components/partnership/AddPartnerSheet';
import ChangePayerSheet from '@/components/partnership/ChangePayerSheet';
import { partnerColor, partnerInitials } from '@/components/partnership/partnerStyle';
import ShareBar from '@/components/partnership/ShareBar';
import StartPartnershipSheet from '@/components/partnership/StartPartnershipSheet';
import { Colors, Radius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import {
    CATEGORY_LABELS,
    errorMessage,
    fetchTransactions,
    formatDate,
    formatRupees,
    PartnerSummary,
    PartnershipTransaction,
    PAYMENT_CATEGORIES,
    updatePartnership,
    voidTransaction,
} from '@/functions/partnership';
import { invalidateProjectPartnership, useProjectPartnership } from '@/hooks/useProjectPartnership';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

// One project's partnership: who the partners are, how much each has put in
// (into the pool, and by paying project costs themselves), the pool balance,
// and every entry behind those numbers. Admins manage it; partners can view it.

type IoniconName = keyof typeof Ionicons.glyphMap;

const CATEGORY_ICONS: Record<PartnershipTransaction['category'], IoniconName> = {
    initial: 'arrow-down-circle-outline',
    additional: 'add-circle-outline',
    material: 'cube-outline',
    contractor: 'people-outline',
    labor: 'hammer-outline',
    equipment: 'construct-outline',
    other: 'receipt-outline',
};

export default function PartnershipScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const projectId = String(params.projectId || '');
    const projectNameParam = String(params.projectName || '');
    const { user, clientId } = useAuth();
    const isAdminUser = !user?.role;
    const insets = useSafeAreaInsets();

    const { partnership, summary, loading, myPartnerId } = useProjectPartnership(projectId);
    // First page of the history, tagged with the request it answers so a newer
    // request (new entries, a refresh) shows as loading until its answer arrives
    const [history, setHistory] = useState<{
        key: string;
        transactions: PartnershipTransaction[];
        page: number;
        hasMore: boolean;
        error: string;
    } | null>(null);
    const [reloadToken, setReloadToken] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [sheet, setSheet] = useState<'start' | 'money' | 'partner' | 'payer' | null>(null);
    // Kept while the Change Who Paid sheet slides away
    const [payerTransaction, setPayerTransaction] = useState<PartnershipTransaction | null>(null);
    // A new key per opening gives each sheet a clean form
    const [sheetKey, setSheetKey] = useState(0);

    const openSheet = (name: 'start' | 'money' | 'partner' | 'payer') => {
        setSheetKey((key) => key + 1);
        setSheet(name);
    };

    const projectName = partnership?.projectName || projectNameParam || 'Project';
    const partnershipId = partnership?._id;
    const isActive = partnership?.status === 'active';
    const isPartner = !!partnership?.partners.some((p) => p.status === 'active' && p.partnerId === myPartnerId);
    const canView = isAdminUser || isPartner;
    const canManage = isAdminUser && isActive;

    const historyKey = partnershipId ? `${partnershipId}:${summary?.transactionCount ?? 0}:${reloadToken}` : '';
    const historyLoading = !!historyKey && history?.key !== historyKey;
    const transactions = history?.transactions ?? [];
    const historyError = history?.key === historyKey ? history.error : '';

    useEffect(() => {
        if (!partnershipId) return;
        let cancelled = false;
        fetchTransactions(partnershipId, 1)
            .then((data) => {
                if (cancelled) return;
                setHistory({ key: historyKey, transactions: data.transactions, page: 1, hasMore: data.hasMore, error: '' });
                setRefreshing(false);
            })
            .catch((error) => {
                if (cancelled) return;
                setHistory({
                    key: historyKey,
                    transactions: [],
                    page: 1,
                    hasMore: false,
                    error: errorMessage(error, "Couldn't load the history."),
                });
                setRefreshing(false);
            });
        return () => {
            cancelled = true;
        };
        // historyKey already carries every input that should trigger a reload
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [historyKey]);

    const loadMore = async () => {
        if (!partnershipId || !history || loadingMore) return;
        setLoadingMore(true);
        try {
            const data = await fetchTransactions(partnershipId, history.page + 1);
            setHistory((prev) => prev && {
                ...prev,
                transactions: [...prev.transactions, ...data.transactions],
                page: prev.page + 1,
                hasMore: data.hasMore,
            });
        } catch (error) {
            toast.error(errorMessage(error, "Couldn't load more of the history."));
        } finally {
            setLoadingMore(false);
        }
    };

    // Payments are recorded on other screens, so refresh whenever this one comes back into view
    const focusedOnce = useRef(false);
    useFocusEffect(
        useCallback(() => {
            if (focusedOnce.current) invalidateProjectPartnership(projectId);
            focusedOnce.current = true;
        }, [projectId])
    );

    const reloadEverything = () => {
        invalidateProjectPartnership(projectId);
        setReloadToken((token) => token + 1);
    };

    const handleRefresh = () => {
        setRefreshing(true);
        reloadEverything();
    };

    const afterChange = () => {
        setSheet(null);
        reloadEverything();
    };

    const setStatus = async (action: 'close' | 'reopen') => {
        if (!partnershipId) return;
        try {
            await updatePartnership({ partnershipId, action });
            toast.success(action === 'close' ? 'Partnership closed' : 'Partnership reopened');
            afterChange();
        } catch (error) {
            toast.error(errorMessage(error, "Couldn't update the partnership. Try again."));
        }
    };

    const handleMorePress = () => {
        if (isActive) {
            Alert.alert(
                'Close Partnership?',
                "Payments on this project will stop asking who paid. The history stays, and you can reopen it any time.",
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Close Partnership', style: 'destructive', onPress: () => setStatus('close') },
                ]
            );
        } else {
            Alert.alert('Reopen Partnership?', 'Payments on this project will ask who paid again.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reopen', onPress: () => setStatus('reopen') },
            ]);
        }
    };

    const confirmRemovePartner = (partner: PartnerSummary) => {
        if (!partnershipId) return;
        Alert.alert(
            `Remove ${partner.name}?`,
            "They'll no longer see this partnership. What they've already put in stays in the totals.",
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await updatePartnership({
                                partnershipId,
                                action: 'remove_partner',
                                partnerId: partner.partnerId,
                            });
                            toast.success(`${partner.name} removed`);
                            afterChange();
                        } catch (error) {
                            toast.error(errorMessage(error, "Couldn't remove the partner. Try again."));
                        }
                    },
                },
            ]
        );
    };

    const confirmVoid = (transaction: PartnershipTransaction) => {
        Alert.alert(
            'Remove This Entry?',
            transaction.kind === 'payment'
                ? "The cost stays on the project. It just won't count toward anyone's share."
                : 'This amount will no longer count as put into the pool.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await voidTransaction(transaction._id);
                            toast.success('Entry removed');
                            afterChange();
                        } catch (error) {
                            toast.error(errorMessage(error, "Couldn't remove the entry. Try again."));
                        }
                    },
                },
            ]
        );
    };

    const handleTransactionPress = (transaction: PartnershipTransaction) => {
        const buttons: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [];
        if (transaction.kind === 'payment') {
            buttons.push({
                text: 'Change Who Paid',
                onPress: () => {
                    setPayerTransaction(transaction);
                    openSheet('payer');
                },
            });
        }
        buttons.push({ text: 'Remove from Account', style: 'destructive', onPress: () => confirmVoid(transaction) });
        buttons.push({ text: 'Cancel', style: 'cancel' });
        Alert.alert(transactionTitle(transaction), `${formatRupees(transaction.amount)} · ${formatDate(transaction.date)}`, buttons);
    };

    const colorFor = (partnerId: string) => partnerColor(partnership?.partners ?? [], partnerId);

    const renderBody = () => {
        if (loading && !partnership) {
            return (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            );
        }

        if (!partnership) {
            return (
                <View style={styles.centered}>
                    <View style={styles.emptyIcon}>
                        <Ionicons name="wallet-outline" size={30} color={Colors.primaryDark} />
                    </View>
                    <Text style={styles.emptyTitle} accessibilityRole="header">
                        {isAdminUser ? 'No partners on this project yet' : 'No partnership on this project'}
                    </Text>
                    <Text style={styles.emptyBody}>
                        {isAdminUser
                            ? 'Add partners from your team and record what each one puts in. Every payment on this project will then show who paid it.'
                            : 'Your admin hasn’t started a partnership for this project.'}
                    </Text>
                    {isAdminUser && (
                        <AuthButton
                            title="Start Partnership"
                            onPress={() => openSheet('start')}
                            style={styles.emptyButton}
                        />
                    )}
                </View>
            );
        }

        if (!canView) {
            return (
                <View style={styles.centered}>
                    <Text style={styles.emptyTitle} accessibilityRole="header">You’re not a partner on this project</Text>
                    <Text style={styles.emptyBody}>Ask your admin to add you if you share its costs.</Text>
                </View>
            );
        }

        const partnerRows = summary?.partners ?? [];
        const totals = summary?.totals;
        const pool = summary?.pool;
        const activeCount = partnership.partners.filter((p) => p.status === 'active').length;

        return (
            <ScrollView
                contentContainerStyle={[styles.content, canManage && styles.contentWithBar]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
                }
            >
                <View style={styles.heading}>
                    <Text style={styles.title} accessibilityRole="header">{projectName}</Text>
                    <Text style={styles.subtitle}>
                        {activeCount} {activeCount === 1 ? 'partner' : 'partners'} · Started {formatDate(partnership.createdAt)}
                    </Text>
                </View>

                {!isActive && (
                    <View style={styles.closedBanner}>
                        <Ionicons name="lock-closed-outline" size={16} color={Colors.warningText} />
                        <Text style={styles.closedText}>
                            This partnership is closed. Payments on the project no longer ask who paid.
                        </Text>
                    </View>
                )}

                {/* Who has put in how much */}
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Put in by partners</Text>
                    <Text style={styles.bigAmount} accessibilityLabel={`Put in by partners, ${formatRupees(totals?.invested ?? 0)}`}>
                        {formatRupees(totals?.invested ?? 0)}
                    </Text>
                    {(totals?.invested ?? 0) > 0 && (
                        <>
                            <ShareBar partners={partnerRows} colorFor={colorFor} />
                            <View style={styles.legend}>
                                {partnerRows.map((p) => (
                                    <View
                                        key={p.partnerId}
                                        style={styles.legendItem}
                                        accessible
                                        accessibilityLabel={`${p.name}, ${p.sharePercent} percent`}
                                    >
                                        <View style={[styles.legendDot, { backgroundColor: colorFor(p.partnerId) }]} />
                                        <Text style={styles.legendName} numberOfLines={1}>{p.name}</Text>
                                        <Text style={styles.legendPercent}>{p.sharePercent}%</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}
                    <View style={styles.divider} />
                    <View style={styles.poolRow}>
                        <View style={styles.poolText}>
                            <Text style={styles.poolLabel}>Pool balance</Text>
                            <Text style={styles.poolDetail}>
                                {formatRupees(pool?.deposited ?? 0)} put in · {formatRupees(pool?.spent.total ?? 0)} paid from it
                            </Text>
                        </View>
                        <Text style={[styles.poolAmount, (pool?.balance ?? 0) < 0 && styles.poolAmountShort]}>
                            {(pool?.balance ?? 0) < 0 ? '−' : ''}{formatRupees(Math.abs(pool?.balance ?? 0))}
                        </Text>
                    </View>
                </View>
                <Text style={styles.footnote}>
                    A partner’s share counts what they put into the pool plus project payments they made themselves.
                    Payments from the pool come out of the pool balance.
                </Text>

                {/* Partners */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle} accessibilityRole="header">Partners</Text>
                    {canManage && (
                        <AuthButton
                            variant="plain"
                            title="Add Partner"
                            onPress={() => openSheet('partner')}
                            style={styles.sectionAction}
                        />
                    )}
                </View>
                <View style={styles.partnerList}>
                    {partnerRows.map((p) => (
                        <PartnerCard
                            key={p.partnerId}
                            partner={p}
                            color={colorFor(p.partnerId)}
                            isMe={p.partnerId === myPartnerId}
                            onRemove={
                                canManage && p.partnerType === 'staff' && p.status === 'active'
                                    ? () => confirmRemovePartner(p)
                                    : undefined
                            }
                        />
                    ))}
                </View>

                {/* Every entry behind the numbers */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle} accessibilityRole="header">History</Text>
                </View>
                {transactions.length === 0 && !historyLoading && !historyError ? (
                    <Text style={styles.emptyHistory}>
                        Nothing recorded yet. Money the partners put in, and payments made on this project, will show up here.
                    </Text>
                ) : (
                    transactions.length > 0 && (
                        <View style={styles.historyGroup}>
                            {transactions.map((t, index) => (
                                <TransactionRow
                                    key={t._id}
                                    transaction={t}
                                    myPartnerId={myPartnerId}
                                    showDivider={index > 0}
                                    onPress={canManage ? () => handleTransactionPress(t) : undefined}
                                />
                            ))}
                        </View>
                    )
                )}
                {historyLoading && !refreshing && (
                    <ActivityIndicator color={Colors.primary} style={styles.historySpinner} />
                )}
                {historyError ? (
                    <View style={styles.historyErrorRow}>
                        <Text style={styles.historyErrorText}>{historyError}</Text>
                        <AuthButton variant="plain" title="Try Again" onPress={reloadEverything} />
                    </View>
                ) : null}
                {history?.hasMore && !historyLoading && (
                    <AuthButton
                        variant="plain"
                        title="Show More"
                        loadingTitle="Loading…"
                        loading={loadingMore}
                        onPress={loadMore}
                    />
                )}
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

            <View style={styles.topBar}>
                <Pressable
                    onPress={() => router.back()}
                    style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                >
                    <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
                </Pressable>
                <Text style={styles.topBarTitle} numberOfLines={1}>Partnership</Text>
                {isAdminUser && partnership ? (
                    <Pressable
                        onPress={handleMorePress}
                        style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
                        accessibilityRole="button"
                        accessibilityLabel="More options"
                    >
                        <Ionicons name="ellipsis-horizontal" size={22} color={Colors.textPrimary} />
                    </Pressable>
                ) : (
                    <View style={styles.iconButtonSpacer} />
                )}
            </View>

            {renderBody()}

            {canManage && partnership && (
                <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                    <AuthButton title="Add Money" onPress={() => openSheet('money')} />
                </View>
            )}

            <StartPartnershipSheet
                key={`start-${sheetKey}`}
                visible={sheet === 'start'}
                clientId={clientId}
                projectId={projectId}
                projectName={projectName}
                onClose={() => setSheet(null)}
                onStarted={afterChange}
            />
            {partnership && (
                <>
                    <AddMoneySheet
                        key={`money-${sheetKey}`}
                        visible={sheet === 'money'}
                        partnership={partnership}
                        summary={summary}
                        myPartnerId={myPartnerId}
                        onClose={() => setSheet(null)}
                        onAdded={afterChange}
                    />
                    <AddPartnerSheet
                        key={`partner-${sheetKey}`}
                        visible={sheet === 'partner'}
                        clientId={clientId}
                        partnership={partnership}
                        onClose={() => setSheet(null)}
                        onAdded={afterChange}
                    />
                    <ChangePayerSheet
                        key={`payer-${sheetKey}`}
                        visible={sheet === 'payer'}
                        transaction={payerTransaction}
                        partnership={partnership}
                        myPartnerId={myPartnerId}
                        poolBalance={summary?.pool.balance}
                        onClose={() => setSheet(null)}
                        onSaved={afterChange}
                    />
                </>
            )}
        </SafeAreaView>
    );
}

const transactionTitle = (t: PartnershipTransaction) =>
    t.kind === 'contribution'
        ? t.partnerName || 'Partner'
        : t.source?.label || t.description || CATEGORY_LABELS[t.category];

// ─── Partner card ───────────────────────────────────────────────────────────

const PartnerCard = ({
    partner,
    color,
    isMe,
    onRemove,
}: {
    partner: PartnerSummary;
    color: string;
    isMe: boolean;
    onRemove?: () => void;
}) => {
    const tags = [
        partner.partnerType === 'owner' ? 'Owner' : null,
        isMe ? 'You' : null,
        partner.status === 'removed' ? 'Removed' : null,
    ].filter(Boolean);
    const rows = [
        { label: 'Initial amount', value: partner.contributed.initial },
        { label: 'Added to pool', value: partner.contributed.additional },
        ...PAYMENT_CATEGORIES.map((category) => ({
            label: `${CATEGORY_LABELS[category]} payments`,
            value: partner.paid[category],
        })),
    ].filter((row) => row.value > 0);

    return (
        <View style={styles.partnerCard}>
            <View style={styles.partnerHeader}>
                <View style={[styles.avatar, { backgroundColor: color }]}>
                    <Text style={styles.avatarText} allowFontScaling={false}>{partnerInitials(partner.name)}</Text>
                </View>
                <View style={styles.partnerNameBlock}>
                    <Text style={styles.partnerName} numberOfLines={1}>{partner.name}</Text>
                    {tags.length > 0 ? <Text style={styles.partnerTags}>{tags.join(' · ')}</Text> : null}
                </View>
                <View style={styles.partnerTotals}>
                    <Text style={styles.partnerTotal}>{formatRupees(partner.total)}</Text>
                    <Text style={styles.partnerShare}>{partner.sharePercent}% share</Text>
                </View>
            </View>

            {rows.length > 0 ? (
                <View style={styles.breakdown}>
                    {rows.map((row) => (
                        <View key={row.label} style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>{row.label}</Text>
                            <Text style={styles.breakdownValue}>{formatRupees(row.value)}</Text>
                        </View>
                    ))}
                </View>
            ) : (
                <Text style={styles.breakdownEmpty}>Nothing put in yet</Text>
            )}

            {onRemove && (
                <Pressable
                    onPress={onRemove}
                    style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${partner.name} from the partnership`}
                >
                    <Text style={styles.removeText}>Remove from Partnership</Text>
                </Pressable>
            )}
        </View>
    );
};

// ─── History row ────────────────────────────────────────────────────────────

const TransactionRow = ({
    transaction: t,
    myPartnerId,
    showDivider,
    onPress,
}: {
    transaction: PartnershipTransaction;
    myPartnerId: string | null;
    showDivider: boolean;
    onPress?: () => void;
}) => {
    const isContribution = t.kind === 'contribution';
    const who = t.partnerId && t.partnerId === myPartnerId ? 'You' : t.partnerName || 'Partner';
    const detail = isContribution
        ? `${t.description || CATEGORY_LABELS[t.category]} · ${formatDate(t.date)}`
        : `${t.paidFrom === 'pool' ? 'From pool' : `Paid by ${who}`} · ${CATEGORY_LABELS[t.category]} · ${formatDate(t.date)}`;
    const amount = `${isContribution ? '+' : ''}${formatRupees(t.amount)}`;

    return (
        <Pressable
            onPress={onPress}
            disabled={!onPress}
            style={({ pressed }) => [styles.txRow, showDivider && styles.txDivider, pressed && !!onPress && styles.txPressed]}
            accessibilityRole={onPress ? 'button' : undefined}
            accessibilityLabel={`${transactionTitle(t)}, ${detail}, ${amount}`}
            accessibilityHint={onPress ? 'Shows options for this entry' : undefined}
        >
            <View style={[styles.txIcon, isContribution ? styles.txIconIn : styles.txIconOut]}>
                <Ionicons
                    name={CATEGORY_ICONS[t.category]}
                    size={18}
                    color={isContribution ? Colors.successText : Colors.primaryDark}
                />
            </View>
            <View style={styles.txText}>
                <Text style={styles.txTitle} numberOfLines={1}>{transactionTitle(t)}</Text>
                <Text style={styles.txDetail} numberOfLines={2}>{detail}</Text>
            </View>
            <Text style={[styles.txAmount, isContribution && styles.txAmountIn]}>{amount}</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    topBar: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
    },
    topBarTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 17,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    iconButtonPressed: {
        backgroundColor: Colors.fill,
    },
    iconButtonSpacer: {
        width: 44,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingBottom: 40,
    },
    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    emptyBody: {
        fontSize: 15,
        lineHeight: 21,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },
    emptyButton: {
        alignSelf: 'stretch',
        marginTop: 24,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 32,
    },
    contentWithBar: {
        paddingBottom: 120,
    },
    heading: {
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        lineHeight: 34,
        fontWeight: '800',
        color: Colors.textPrimary,
        letterSpacing: -0.6,
    },
    subtitle: {
        fontSize: 15,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    closedBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        padding: 12,
        borderRadius: Radius.md,
        backgroundColor: Colors.warningLight,
        marginBottom: 16,
    },
    closedText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 19,
        color: Colors.warningText,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 16,
        gap: 12,
    },
    cardLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    bigAmount: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.textPrimary,
        letterSpacing: -0.5,
        fontVariant: ['tabular-nums'],
        marginTop: -6,
    },
    legend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: 8,
        columnGap: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        maxWidth: '100%',
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendName: {
        flexShrink: 1,
        fontSize: 14,
        color: Colors.textPrimary,
    },
    legendPercent: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
        fontVariant: ['tabular-nums'],
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: Colors.border,
    },
    poolRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    poolText: {
        flex: 1,
    },
    poolLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    poolDetail: {
        fontSize: 13,
        lineHeight: 18,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    poolAmount: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.textPrimary,
        fontVariant: ['tabular-nums'],
    },
    poolAmountShort: {
        color: Colors.errorText,
    },
    footnote: {
        fontSize: 13,
        lineHeight: 18,
        color: Colors.textSecondary,
        marginTop: 10,
        paddingHorizontal: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 28,
        marginBottom: 10,
        minHeight: 44,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.textPrimary,
        letterSpacing: -0.3,
    },
    sectionAction: {
        marginRight: -12,
    },
    partnerList: {
        gap: 12,
    },
    partnerCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 16,
    },
    partnerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    partnerNameBlock: {
        flex: 1,
    },
    partnerName: {
        fontSize: 17,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    partnerTags: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    partnerTotals: {
        alignItems: 'flex-end',
    },
    partnerTotal: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
        fontVariant: ['tabular-nums'],
    },
    partnerShare: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
        fontVariant: ['tabular-nums'],
    },
    breakdown: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
        gap: 8,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    breakdownLabel: {
        flexShrink: 1,
        fontSize: 15,
        color: Colors.textSecondary,
    },
    breakdownValue: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textPrimary,
        fontVariant: ['tabular-nums'],
    },
    breakdownEmpty: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 12,
    },
    removeButton: {
        alignSelf: 'flex-start',
        minHeight: 44,
        justifyContent: 'center',
        marginTop: 6,
        marginBottom: -10,
    },
    removeButtonPressed: {
        opacity: 0.5,
    },
    removeText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.errorText,
    },
    emptyHistory: {
        fontSize: 15,
        lineHeight: 21,
        color: Colors.textSecondary,
    },
    historyGroup: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
    },
    historySpinner: {
        marginVertical: 16,
    },
    historyErrorRow: {
        alignItems: 'center',
        marginTop: 12,
    },
    historyErrorText: {
        fontSize: 14,
        color: Colors.errorText,
        textAlign: 'center',
    },
    txRow: {
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    txDivider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
    },
    txPressed: {
        backgroundColor: Colors.fill,
    },
    txIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    txIconIn: {
        backgroundColor: Colors.successLight,
    },
    txIconOut: {
        backgroundColor: Colors.primaryLight,
    },
    txText: {
        flex: 1,
    },
    txTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    txDetail: {
        fontSize: 13,
        lineHeight: 18,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    txAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
        fontVariant: ['tabular-nums'],
    },
    txAmountIn: {
        color: Colors.successText,
    },
    bottomBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 20,
        paddingTop: 12,
        backgroundColor: Colors.background,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
    },
});
