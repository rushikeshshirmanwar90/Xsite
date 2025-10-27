// Utility functions for notifications
export const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 3600));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return notificationTime.toLocaleDateString('en-IN');
};

export const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
};

export const getNotificationIcon = (type: string, approvalStatus?: string) => {
    if (type === 'permission_request' || type === 'material_request') {
        switch (approvalStatus) {
            case 'approved': return { icon: 'checkmark-circle', color: '#10B981' };
            case 'rejected': return { icon: 'close-circle', color: '#EF4444' };
            case 'imported': return { icon: 'cube', color: '#8B5CF6' };
            default: return { icon: 'time-outline', color: '#F59E0B' };
        }
    }

    switch (type) {
        case 'work_update': return { icon: 'checkmark-circle', color: '#10B981' };
        case 'work_remaining': return { icon: 'time', color: '#F59E0B' };
        case 'site_engineer': return { icon: 'person', color: '#3B82F6' };
        case 'material_alert': return { icon: 'cube', color: '#8B5CF6' };
        case 'material_request': return { icon: 'cube-outline', color: '#F59E0B' };
        case 'safety_alert': return { icon: 'shield-checkmark', color: '#EF4444' };
        case 'delay_warning': return { icon: 'warning', color: '#DC2626' };
        default: return { icon: 'information-circle', color: '#6B7280' };
    }
};