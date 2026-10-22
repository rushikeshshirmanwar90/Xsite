import { AuthButton } from '@/components/auth/AuthUI';
import { partnerColor } from '@/components/partnership/partnerStyle';
import ShareBar from '@/components/partnership/ShareBar';
import { Colors, Radius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getClientId } from '@/functions/clientId';
import {
    errorMessage,
    fetchClientPartnerships,
    fetchMyPartnerships,
    formatRupees,
    Partnership,
    PartnershipSummary,
} from '@/functions/partnership';
import { getProjectData } from '@/functions/project';
import { getMyPartnerId } from '@/hooks/useProjectPartnership';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Every project's partnership at a glance. Admins see all their projects,
// including the ones without partners yet; staff see the ones they're part of.

interface Row {
    projectId: string;
    projectName: string;
    partnership?: Partnership;
    summary?: PartnershipSummary | null;
}

export default function PartnershipsScreen() {
    const router = useRouter();
    const { user, clientId: authClientId } = useAuth();
    const isStaffUser = !!user?.role;

    const [rows, setRows] = useState<Row[]>([]);
    const [myPartnerId, setMyPartnerId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setError('');
        try {
            const partnerId = await getMyPartnerId();
            setMyPartnerId(partnerId);

            if (isStaffUser) {
                if (!partnerId) throw new Error('Your account could not be found. Log in again.');
                const mine = await fetchMyPartnerships(partnerId);
                setRows(mine.map((item) => ({
                    projectId: String(item.partnership.projectId),
                    projectName: item.partnership.projectName,
                    ...item,
                })));
                return;
            }

            const clientId = authClientId || (await getClientId());
            if (!clientId) throw new Error('Your business account could not be found. Log in again.');
            const [projects, partnerships] = await Promise.all([
                getProjectData(clientId, undefined, true),
                fetchClientPartnerships(clientId),
            ]);

            const byProject = new Map(partnerships.map((item) => [String(item.partnership.projectId), item]));
            const projectRows: Row[] = (Array.isArray(projects) ? projects : []).map((project: { _id: string; name: string }) => ({
                projectId: String(project._id),
                projectName: project.name,
                ...byProject.get(String(project._id)),
            }));
            // Partnerships whose project isn't in the list (hidden or removed) still show
            const listed = new Set(projectRows.map((row) => row.projectId));
            const unlisted = partnerships
                .filter((item) => !listed.has(String(item.partnership.projectId)))
                .map((item) => ({
                    projectId: String(item.partnership.projectId),
                    projectName: item.partnership.projectName,
                    ...item,
                }));
            setRows([...projectRows, ...unlisted]);
        } catch (loadError) {
            setError(errorMessage(loadError, "Couldn't load partnerships."));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isStaffUser, authClientId]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const openProject = (row: Row) => {
        router.push({ pathname: '/partnership', params: { projectId: row.projectId, projectName: row.projectName } });
    };

    const withPartners = rows.filter((row) => row.partnership);
    const withoutPartners = rows.filter((row) => !row.partnership);

    const renderBody = () => {
        if (loading) {
            return (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.centered}>
                    <Text style={styles.emptyTitle}>Couldn’t load partnerships</Text>
                    <Text style={styles.emptyBody}>{error}</Text>
                    <AuthButton title="Try Again" variant="tinted" onPress={() => { setLoading(true); load(); }} style={styles.emptyButton} />
                </View>
            );
        }

        return (
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); load(); }}
                        tintColor={Colors.primary}
                    />
                }
            >
                <View style={styles.heading}>
                    <Text style={styles.title} accessibilityRole="header">Partnerships</Text>
                    <Text style={styles.subtitle}>
                        {isStaffUser
                            ? 'Projects where you share the costs, and how much you’ve put in.'
                            : 'Partners share a project’s costs. Open a project to see who has put in how much.'}
                    </Text>
                </View>

                {withPartners.length === 0 && (isStaffUser || withoutPartners.length === 0) && (
                    <View style={styles.emptyCard}>
                        <Ionicons name="wallet-outline" size={26} color={Colors.primaryDark} />
                        <Text style={styles.emptyCardText}>
                            {isStaffUser
                                ? 'You’re not a partner on any project yet. Your admin can add you to one.'
                                : 'Add a project first, then start a partnership for it here.'}
                        </Text>
                    </View>
                )}

                {withPartners.length > 0 && (
                    <View style={styles.cards}>
                        {withPartners.map((row) => (
                            <PartnershipCard
                                key={row.projectId}
                                row={row}
                                myPartnerId={myPartnerId}
                                isStaffUser={isStaffUser}
                                onPress={() => openProject(row)}
                            />
                        ))}
                    </View>
                )}

                {!isStaffUser && withoutPartners.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle} accessibilityRole="header">No Partners Yet</Text>
                        <View style={styles.group}>
                            {withoutPartners.map((row, index) => (
                                <Pressable
                                    key={row.projectId}
                                    onPress={() => openProject(row)}
                                    style={({ pressed }) => [styles.row, index > 0 && styles.rowDivider, pressed && styles.rowPressed]}
                                    accessibilityRole="button"
                                    accessibilityLabel={`${row.projectName}, no partners yet`}
                                    accessibilityHint="Opens the project to start a partnership"
                                >
                                    <Ionicons name="business-outline" size={20} color={Colors.textSecondary} />
                                    <Text style={styles.rowTitle} numberOfLines={1}>{row.projectName}</Text>
                                    <Text style={styles.rowAction}>Start</Text>
                                    <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                                </Pressable>
                            ))}
                        </View>
                    </>
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
                    style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                >
                    <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
                </Pressable>
            </View>
            {renderBody()}
        </SafeAreaView>
    );
}

const PartnershipCard = ({
    row,
    myPartnerId,
    isStaffUser,
    onPress,
}: {
    row: Row;
    myPartnerId: string | null;
    isStaffUser: boolean;
    onPress: () => void;
}) => {
    const partnership = row.partnership!;
    const summary = row.summary;
    const names = partnership.partners
        .filter((p) => p.status === 'active')
        .map((p) => (p.partnerId === myPartnerId ? 'You' : p.name))
        .join(', ');
    const me = summary?.partners.find((p) => p.partnerId === myPartnerId);
    const closed = partnership.status === 'closed';

    const stats = isStaffUser
        ? [
            { label: 'You’ve put in', value: formatRupees(me?.total ?? 0) },
            { label: 'Your share', value: `${me?.sharePercent ?? 0}%` },
        ]
        : [
            { label: 'Put in', value: formatRupees(summary?.totals.invested ?? 0) },
            { label: 'Pool balance', value: formatRupees(summary?.pool.balance ?? 0) },
        ];

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            accessibilityRole="button"
            accessibilityLabel={[
                row.projectName,
                closed ? 'closed' : null,
                `partners ${names}`,
                ...stats.map((s) => `${s.label} ${s.value}`),
            ].filter(Boolean).join(', ')}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>{row.projectName}</Text>
                {closed && (
                    <View style={styles.closedTag}>
                        <Text style={styles.closedTagText}>Closed</Text>
                    </View>
                )}
                <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </View>
            <Text style={styles.cardPartners} numberOfLines={1}>{names}</Text>
            {summary && summary.totals.invested > 0 && (
                <ShareBar
                    partners={summary.partners}
                    colorFor={(partnerId) => partnerColor(partnership.partners, partnerId)}
                    height={8}
                />
            )}
            <View style={styles.stats}>
                {stats.map((stat) => (
                    <View key={stat.label} style={styles.stat}>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                        <Text style={styles.statValue}>{stat.value}</Text>
                    </View>
                ))}
            </View>
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
        paddingHorizontal: 16,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    backButtonPressed: {
        backgroundColor: Colors.fill,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingBottom: 40,
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
        paddingBottom: 40,
    },
    heading: {
        marginBottom: 20,
    },
    title: {
        fontSize: 30,
        lineHeight: 36,
        fontWeight: '800',
        color: Colors.textPrimary,
        letterSpacing: -0.6,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 22,
        color: Colors.textSecondary,
        marginTop: 6,
    },
    emptyCard: {
        alignItems: 'center',
        gap: 10,
        padding: 24,
        borderRadius: Radius.lg,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    emptyCardText: {
        fontSize: 15,
        lineHeight: 21,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    cards: {
        gap: 12,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 16,
        gap: 10,
    },
    cardPressed: {
        backgroundColor: Colors.fill,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cardTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    closedTag: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Radius.sm,
        backgroundColor: Colors.warningLight,
    },
    closedTagText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.warningText,
    },
    cardPartners: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    stats: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 2,
    },
    stat: {
        flex: 1,
    },
    statLabel: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    statValue: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.textPrimary,
        fontVariant: ['tabular-nums'],
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.textPrimary,
        letterSpacing: -0.3,
        marginTop: 28,
        marginBottom: 10,
    },
    group: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
    },
    row: {
        minHeight: 52,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    rowDivider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
    },
    rowPressed: {
        backgroundColor: Colors.fill,
    },
    rowTitle: {
        flex: 1,
        fontSize: 16,
        color: Colors.textPrimary,
    },
    rowAction: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.primaryDark,
    },
});
