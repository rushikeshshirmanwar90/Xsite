import { getClientId } from '@/functions/clientId';
import {
    fetchProjectPartnership,
    PaidBy,
    Partnership,
    PartnershipSummary,
} from '@/functions/partnership';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useSyncExternalStore } from 'react';

// Every payment form asks "does this project have a partnership?", so answers
// are cached for a minute per project and shared across screens. Anything that
// changes a partnership calls invalidateProjectPartnership() to refresh them.

interface CacheEntry {
    partnership: Partnership | null;
    summary: PartnershipSummary | null;
    fetchedAt: number;
}

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map<string, CacheEntry>();
// A list of material cards all mount at once; they share one request
const inflight = new Map<string, Promise<CacheEntry>>();
const subscribers = new Set<() => void>();

const notify = () => subscribers.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
    subscribers.add(listener);
    return () => {
        subscribers.delete(listener);
    };
};

const loadPartnership = (projectId: string): Promise<CacheEntry> => {
    let request = inflight.get(projectId);
    if (!request) {
        request = fetchProjectPartnership(projectId)
            .then((data) => {
                const entry = { ...data, fetchedAt: Date.now() };
                cache.set(projectId, entry);
                notify();
                return entry;
            })
            .finally(() => {
                inflight.delete(projectId);
            });
        inflight.set(projectId, request);
    }
    return request;
};

export const invalidateProjectPartnership = (projectId?: string) => {
    if (projectId) {
        cache.delete(projectId);
        inflight.delete(projectId);
    } else {
        cache.clear();
        inflight.clear();
    }
    notify();
};

// Stable key for a payer, for comparing choices
export const paidByKey = (paidBy: PaidBy | null) =>
    !paidBy ? '' : paidBy.type === 'pool' ? 'pool' : paidBy.partnerId;

// The partner id that stands for the signed-in user: the business's id for
// admins, their own staff id for staff
export const getMyPartnerId = async (): Promise<string | null> => {
    try {
        const raw = await AsyncStorage.getItem('user');
        const user = raw ? JSON.parse(raw) : null;
        if (user?.role) return user._id ? String(user._id) : null;
        return await getClientId();
    } catch {
        return null;
    }
};

export const useProjectPartnership = (projectId?: string) => {
    const entry = useSyncExternalStore(
        subscribe,
        () => (projectId ? cache.get(projectId) ?? null : null),
        // Web pre-rendering has no cache to read
        () => null
    );
    const [myPartnerId, setMyPartnerId] = useState<string | null>(null);
    // The project whose last load failed, so loading doesn't spin forever
    const [failedProjectId, setFailedProjectId] = useState<string | null>(null);

    useEffect(() => {
        getMyPartnerId().then(setMyPartnerId);
    }, []);

    useEffect(() => {
        if (!projectId) return;
        if (entry && Date.now() - entry.fetchedAt < CACHE_TTL_MS) return;

        let cancelled = false;
        loadPartnership(projectId)
            .then(() => {
                if (!cancelled) setFailedProjectId(null);
            })
            .catch((error) => {
                // Payments still go through unattributed if this can't load
                console.warn('⚠️ Could not load project partnership:', error?.message);
                if (!cancelled) setFailedProjectId(projectId);
            });
        return () => {
            cancelled = true;
        };
    }, [projectId, entry]);

    const partnership = entry?.partnership ?? null;
    // Closed partnerships keep their history but take no new payments
    const activePartnership = partnership?.status === 'active' ? partnership : null;
    const myPartner =
        activePartnership?.partners.find((p) => p.status === 'active' && p.partnerId === myPartnerId) ?? null;
    // Most payments are made by whoever records them, so start there when they're a partner
    const defaultPaidBy: PaidBy | null = myPartner ? { type: 'partner', partnerId: myPartner.partnerId } : null;

    return {
        partnership,
        activePartnership,
        summary: entry?.summary ?? null,
        loading: !!projectId && !entry && failedProjectId !== projectId,
        myPartnerId,
        myPartner,
        defaultPaidBy,
        refresh: () => invalidateProjectPartnership(projectId),
    };
};
