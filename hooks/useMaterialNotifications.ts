import { useCallback } from 'react';
import { toast } from 'sonner-native';
import { notificationService } from '@/services/notificationService';

interface MaterialNotificationData {
    materialName: string;
    quantity: number;
    unit: string;
    projectName: string;
    userName: string;
    userEmail: string;
    clientId: string;
    companyName: string;
}

export const useMaterialNotifications = () => {
    const showMaterialAddedNotification = useCallback((data: MaterialNotificationData) => {
        // Show toast notification
        toast.success(`Material Added`, {
            description: `${data.quantity} ${data.unit} of ${data.materialName} added to ${data.projectName}`,
            duration: 4000,
        });

        // Send notification to backend (optional - for email/push notifications)
        notificationService.sendMaterialAddedNotification({
            recipientEmail: data.userEmail,
            recipientName: data.userName,
            materialName: data.materialName,
            quantity: data.quantity,
            unit: data.unit,
            projectName: data.projectName,
            clientId: data.clientId,
            companyName: data.companyName,
        }).catch(error => {
            console.error('Failed to send material added notification:', error);
        });
    }, []);

    const showMaterialUsedNotification = useCallback((data: MaterialNotificationData) => {
        // Show toast notification
        toast.info(`Material Used`, {
            description: `${data.quantity} ${data.unit} of ${data.materialName} used in ${data.projectName}`,
            duration: 4000,
        });

        // Send notification to backend (optional - for email/push notifications)
        notificationService.sendMaterialUsedNotification({
            recipientEmail: data.userEmail,
            recipientName: data.userName,
            materialName: data.materialName,
            quantity: data.quantity,
            unit: data.unit,
            projectName: data.projectName,
            clientId: data.clientId,
            companyName: data.companyName,
        }).catch(error => {
            console.error('Failed to send material used notification:', error);
        });
    }, []);

    const showBatchMaterialAddedNotification = useCallback((
        materials: Array<{ name: string; qnt: number; unit: string }>,
        projectName: string
    ) => {
        const totalMaterials = materials.length;
        const materialsList = materials.slice(0, 3).map(m => `${m.name} (${m.qnt} ${m.unit})`).join(', ');
        const moreText = totalMaterials > 3 ? ` and ${totalMaterials - 3} more` : '';

        toast.success(`${totalMaterials} Materials Added`, {
            description: `${materialsList}${moreText} added to ${projectName}`,
            duration: 5000,
        });
    }, []);

    const showBatchMaterialUsedNotification = useCallback((
        materials: Array<{ name: string; qnt: number; unit: string }>,
        projectName: string
    ) => {
        const totalMaterials = materials.length;
        const materialsList = materials.slice(0, 3).map(m => `${m.name} (${m.qnt} ${m.unit})`).join(', ');
        const moreText = totalMaterials > 3 ? ` and ${totalMaterials - 3} more` : '';

        toast.info(`${totalMaterials} Materials Used`, {
            description: `${materialsList}${moreText} used in ${projectName}`,
            duration: 5000,
        });
    }, []);

    return {
        showMaterialAddedNotification,
        showMaterialUsedNotification,
        showBatchMaterialAddedNotification,
        showBatchMaterialUsedNotification,
    };
};
