// Remove direct service import - we'll use callback pattern
// import SimpleNotificationService from '@/services/SimpleNotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AdminUpdateData {
  updateType: 'settings' | 'configuration' | 'permissions' | 'general';
  description: string;
  projectId?: string;
  projectName?: string;
  details?: string;
  affectedArea?: string;
}

export const sendAdminUpdateNotification = async (updateData: AdminUpdateData, notificationCallback?: (data: any) => Promise<boolean>): Promise<boolean> => {
  try {
    console.log('🔔 Sending admin update notification...');
    
    if (!notificationCallback) {
      console.log('⚠️ No notification callback provided for admin update');
      return false;
    }
    
    // Get user data for notification
    const userString = await AsyncStorage.getItem('user');
    let userInfo = null;
    
    if (userString) {
      const userData = JSON.parse(userString);
      userInfo = {
        fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.name || userData.username || 'Unknown User',
      };
    }

    const notificationSent = await notificationCallback({
      projectId: updateData.projectId,
      activityType: 'admin_update',
      staffName: userInfo?.fullName || 'Admin',
      projectName: updateData.projectName || 'System',
      details: updateData.description,
      category: 'project', // Admin updates can affect projects
      message: updateData.details || `${updateData.updateType} update: ${updateData.affectedArea || 'System'}`,
    });

    console.log('🔔 Admin update notification result:', notificationSent);
    
    if (notificationSent) {
      console.log('✅ Admin update notification sent successfully');
      return true;
    } else {
      console.log('⚠️ Admin update notification failed');
      return false;
    }
  } catch (notificationError: any) {
    console.error('❌ Error sending admin update notification:', notificationError);
    return false;
  }
};

// Convenience functions for common admin updates
export const notifySettingsUpdate = async (settingName: string, notificationCallback?: (data: any) => Promise<boolean>, projectId?: string, projectName?: string) => {
  return await sendAdminUpdateNotification({
    updateType: 'settings',
    description: `Updated ${settingName} settings`,
    projectId,
    projectName,
    affectedArea: settingName,
  }, notificationCallback);
};

export const notifyConfigurationChange = async (configArea: string, description: string, notificationCallback?: (data: any) => Promise<boolean>, projectId?: string, projectName?: string) => {
  return await sendAdminUpdateNotification({
    updateType: 'configuration',
    description: `Configuration change: ${description}`,
    projectId,
    projectName,
    affectedArea: configArea,
    details: description,
  }, notificationCallback);
};

export const notifyPermissionChange = async (description: string, notificationCallback?: (data: any) => Promise<boolean>, projectId?: string, projectName?: string) => {
  return await sendAdminUpdateNotification({
    updateType: 'permissions',
    description: `Permission change: ${description}`,
    projectId,
    projectName,
    affectedArea: 'User Permissions',
    details: description,
  }, notificationCallback);
};