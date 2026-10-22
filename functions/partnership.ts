import apiClient from '@/utils/axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toast } from 'sonner-native';

// Per-project partnerships: the business plus staff partners who share a money
// pool. Every payment on the project records who paid it (a partner, or the
// pool), so each partner's share can be shown. API: /api/partnership.

export type PaymentCategory = 'material' | 'contractor' | 'labor' | 'equipment' | 'other';
export type ContributionCategory = 'initial' | 'additional';

// Who paid for a project expense, in the shape every payment API accepts
export type PaidBy = { type: 'partner'; partnerId: string } | { type: 'pool' };

export interface Partner {
    partnerId: string;
    partnerType: 'owner' | 'staff';
    name: string;
    email?: string;
    phoneNumber?: string;
    status: 'active' | 'removed';
    addedAt: string;
    removedAt?: string | null;
}

export interface Partnership {
    _id: string;
    clientId: string;
    projectId: string;
    projectName: string;
    partners: Partner[];
    status: 'active' | 'closed';
    createdAt: string;
    updatedAt: string;
}

export type AmountsByCategory = Record<PaymentCategory, number> & { total: number };

export interface PartnerSummary {
    partnerId: string;
    partnerType: 'owner' | 'staff';
    name: string;
    status: 'active' | 'removed';
    contributed: { initial: number; additional: number; total: number };
    paid: AmountsByCategory;
    total: number;
    sharePercent: number;
}

export interface PartnershipSummary {
    partners: PartnerSummary[];
    pool: { deposited: number; spent: AmountsByCategory; balance: number };
    totals: {
        contributed: number;
        paidByPartners: number;
        paidFromPool: number;
        spent: number;
        invested: number;
    };
    transactionCount: number;
}

export interface PartnershipWithSummary {
    partnership: Partnership;
    summary: PartnershipSummary | null;
    // Partners who couldn't be made staff on the project (start / add partner only)
    notAssigned?: string[];
}

// Partners are made project staff automatically; say so if that didn't work for someone
export const reportNotAssigned = (result?: { notAssigned?: string[] } | null) => {
    const names = result?.notAssigned ?? [];
    if (names.length > 0) {
        toast.warning(`Couldn't assign ${names.join(', ')} to this project. Assign them from the Staff tab.`);
    }
};

export interface PartnershipTransaction {
    _id: string;
    partnershipId: string;
    kind: 'contribution' | 'payment';
    category: ContributionCategory | PaymentCategory;
    amount: number;
    paidFrom: 'partner' | 'pool';
    partnerId?: string;
    partnerName?: string;
    source?: { entity: PaymentCategory; ids: string[]; label?: string };
    description: string;
    date: string;
    status: 'active' | 'void';
    recordedBy?: { userId?: string; fullName?: string; userType?: string };
    createdAt: string;
}

// What a payment API did with paidBy; sent back by every payment endpoint
export interface PartnershipLedgerResult {
    status: 'recorded' | 'skipped' | 'failed';
    count: number;
    message?: string;
}

export const CATEGORY_LABELS: Record<ContributionCategory | PaymentCategory, string> = {
    initial: 'Initial amount',
    additional: 'Added to pool',
    material: 'Material',
    contractor: 'Contractor',
    labor: 'Labour',
    equipment: 'Equipment',
    other: 'Other',
};

export const PAYMENT_CATEGORIES: PaymentCategory[] = ['material', 'contractor', 'labor', 'equipment', 'other'];

export const formatRupees = (amount: number) =>
    `₹${(Math.round((amount || 0) * 100) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

// "1,50,000" → 150000; blank → 0; anything that isn't an amount → null
export const parseAmountInput = (text: string): number | null => {
    const cleaned = text.replace(/[,\s₹]/g, '');
    if (!cleaned) return 0;
    const value = Number(cleaned);
    return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) / 100 : null;
};

export const formatDate = (iso: string) => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
        ? ''
        : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const teamMemberName = (member: { firstName?: string; lastName?: string; email?: string }) =>
    [member.firstName, member.lastName].filter(Boolean).join(' ').trim() || member.email || 'Team member';

export const errorMessage = (error: unknown, fallback: string): string => {
    const e = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
    return e?.response?.data?.message || e?.response?.data?.error || e?.message || fallback;
};

// A payment was saved but couldn't be added to the partnership account
export const reportLedgerResult = (result?: PartnershipLedgerResult | null) => {
    if (result?.status === 'failed') {
        toast.warning(result.message || "Payment saved, but it couldn't be added to the partnership account");
    }
};

// The signed-in user, as the API's recordedBy
export const currentActor = async () => {
    try {
        const raw = await AsyncStorage.getItem('user');
        const user = raw ? JSON.parse(raw) : null;
        if (!user) return undefined;
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.name || undefined;
        return {
            userId: user._id ? String(user._id) : undefined,
            fullName,
            userType: user.role ? 'staff' : 'admin',
        };
    } catch {
        return undefined;
    }
};

const unwrap = <T>(res: { data: unknown }): T => {
    const body = res.data as { success?: boolean; data?: T; message?: string };
    if (body?.success) return body.data as T;
    throw new Error(body?.message || 'Request failed');
};

export const fetchProjectPartnership = async (projectId: string) =>
    unwrap<{ partnership: Partnership | null; summary: PartnershipSummary | null }>(
        await apiClient.get('/api/partnership', { params: { projectId } })
    );

export const fetchClientPartnerships = async (clientId: string) =>
    unwrap<PartnershipWithSummary[]>(await apiClient.get('/api/partnership', { params: { clientId } }));

export const fetchMyPartnerships = async (partnerId: string) =>
    unwrap<PartnershipWithSummary[]>(await apiClient.get('/api/partnership', { params: { partnerId } }));

export const startPartnership = async (input: {
    clientId: string;
    projectId: string;
    ownerInitialAmount: number;
    partners: { staffId: string; initialAmount: number }[];
}) =>
    unwrap<PartnershipWithSummary>(
        await apiClient.post('/api/partnership', { ...input, recordedBy: await currentActor() })
    );

export const updatePartnership = async (
    input:
        | { partnershipId: string; action: 'add_partner'; staffId: string; initialAmount: number }
        | { partnershipId: string; action: 'remove_partner'; partnerId: string }
        | { partnershipId: string; action: 'close' | 'reopen' }
) =>
    unwrap<PartnershipWithSummary>(
        await apiClient.patch('/api/partnership', { ...input, recordedBy: await currentActor() })
    );

export const fetchTransactions = async (partnershipId: string, page = 1) =>
    unwrap<{ transactions: PartnershipTransaction[]; page: number; total: number; hasMore: boolean }>(
        await apiClient.get('/api/partnership/transactions', { params: { partnershipId, page, limit: 50 } })
    );

export const addContribution = async (input: {
    partnershipId: string;
    partnerId: string;
    amount: number;
    category: ContributionCategory;
    description?: string;
}) =>
    unwrap<PartnershipTransaction>(
        await apiClient.post('/api/partnership/transactions', { ...input, recordedBy: await currentActor() })
    );

export const voidTransaction = async (transactionId: string) =>
    unwrap<PartnershipTransaction>(
        await apiClient.patch('/api/partnership/transactions', {
            transactionId,
            action: 'void',
            recordedBy: await currentActor(),
        })
    );

export const reassignTransaction = async (transactionId: string, paidBy: PaidBy) =>
    unwrap<PartnershipTransaction>(
        await apiClient.patch('/api/partnership/transactions', {
            transactionId,
            action: 'reassign',
            paidBy,
            recordedBy: await currentActor(),
        })
    );

export interface TeamMember {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
    role?: string;
}

// Registered staff on the business's team — the people who can become partners
export const fetchTeam = async (clientId: string): Promise<TeamMember[]> => {
    const fromList = (res: { data: unknown }) => {
        const body = res.data as { success?: boolean; data?: TeamMember[] };
        return body?.success && Array.isArray(body.data) ? body.data : [];
    };
    const team = fromList(await apiClient.get('/api/clients/staff', { params: { clientId } }));
    if (team.length > 0) return team;
    // Older businesses keep their staff list on the staff records instead
    return fromList(await apiClient.get('/api/users/staff', { params: { clientId } }));
};
