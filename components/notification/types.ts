// Types for notification components
export interface Material {
    name: string;
    unit: string;
    specs?: object;
    qnt: number;
    cost: number;
    _id: string;
}

export interface MaterialRequest {
    _id: string;
    clientId: string;
    projectId: string;
    mainSectionId: string;
    sectionId: string;
    materials: Material[];
    status: 'pending' | 'approved' | 'rejected' | 'imported';
    message: string;
    qnt?: number;
    __v: number;
}

export interface MaterialRequestResponse {
    success: boolean;
    message: string;
    data: MaterialRequest[];
}

export interface Notification {
    id: string;
    type: 'work_update' | 'work_remaining' | 'site_engineer' | 'material_alert' | 'safety_alert' | 'delay_warning' | 'permission_request' | 'material_request';
    title: string;
    message: string;
    projectName: string;
    projectId: string;
    senderName?: string;
    timestamp: string;
    priority: 'high' | 'medium' | 'low';
    isRead: boolean;
    requiresApproval?: boolean;
    approvalStatus?: 'pending' | 'approved' | 'rejected' | 'imported';
    permissionType?: 'material_purchase' | 'equipment_rental' | 'overtime_work' | 'budget_revision' | 'design_change';
    requestAmount?: number;
    requestDetails?: string;
    materialRequest?: MaterialRequest;
    sectionName?: string;
}

export interface DeletedNotification extends Notification {
    deletedAt: number;
    originalIndex: number;
}

export interface ToastProps {
    visible: boolean;
    message: string;
    onUndo?: () => void;
    onHide: () => void;
    type?: 'success' | 'error' | 'info';
}

export interface ApprovalButtonsProps {
    notification: Notification;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}

export interface NotificationItemProps {
    notification: Notification;
    onPress: (notification: Notification) => void;
    onDelete: (notification: Notification) => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onMenuAction?: (id: string, action: string) => void;
}