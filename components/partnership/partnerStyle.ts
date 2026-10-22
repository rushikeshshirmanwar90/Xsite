import { Partner } from '@/functions/partnership';

// One colour per partner, used for their avatar and their slice of the share
// bar. Names and percentages always sit next to the colour, so it never carries
// meaning on its own. All hold ≥3:1 against white.
export const PARTNER_COLORS = ['#3A78B5', '#0F766E', '#B45309', '#7C3AED', '#BE185D', '#4D7C0F'];

export const partnerColor = (partners: Pick<Partner, 'partnerId'>[], partnerId: string) => {
    const index = partners.findIndex((p) => p.partnerId === partnerId);
    return PARTNER_COLORS[(index >= 0 ? index : partners.length) % PARTNER_COLORS.length];
};

export const partnerInitials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? '')
        .join('') || '?';
