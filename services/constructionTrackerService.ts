import { domain } from '@/lib/domain';
import { getAuthHeaders } from '@/utils/axiosConfig';
import type {
    ConstructionTracker,
    Phase,
    UpdatePhasePayload,
} from '@/types/construction';

const BASE = `${domain}/api/construction-tracker`;

async function handleResponse<T>(res: Response): Promise<T> {
    const json = await res.json();
    if (!res.ok || !json.success) {
        throw new Error(json.message || 'Construction tracker request failed');
    }
    return json.data as T;
}

export const constructionTrackerService = {
    // Each mini-section has its own tracker — fetched/created by miniSectionId, never shared.
    async getTracker(miniSectionId: string): Promise<ConstructionTracker> {
        const res = await fetch(`${BASE}?miniSectionId=${encodeURIComponent(miniSectionId)}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse<ConstructionTracker>(res);
    },

    // Idempotent: finds-or-creates this mini-section's own tracker, with phases built
    // from the slabwork.md template for `sectionName`. Safe to call repeatedly.
    async ensureTracker(
        miniSectionId: string,
        projectId: string,
        projectName: string,
        sectionName: string
    ): Promise<ConstructionTracker> {
        const res = await fetch(BASE, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ miniSectionId, projectId, projectName, sectionName }),
        });
        return handleResponse<ConstructionTracker>(res);
    },

    async updatePhase(
        payload: UpdatePhasePayload
    ): Promise<{ phase: Phase; overallProgress: number }> {
        const res = await fetch(`${BASE}/phase`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        return handleResponse(res);
    },
};
