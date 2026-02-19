import { domain } from "@/lib/domain";
import axios from "axios";
// Remove direct service import - we'll use callback pattern
// import SimpleNotificationService from '@/services/SimpleNotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MaterialTransferData {
  fromProjectId: string;
  fromProjectName: string;
  toProjectId: string;
  toProjectName: string;
  materials: Array<{
    name: string;
    unit: string;
    qnt: number;
    cost: number;
  }>;
  transferredBy?: string;
  notes?: string;
}

export const transferMaterials = async (transferData: MaterialTransferData, notificationCallback?: (data: any) => Promise<boolean>): Promise<any | null> => {
  try {
    console.log('📤 Transferring materials via API:', `${domain}/api/material-transfer`);
    console.log('📋 Transfer payload:', transferData);
    
    const res = await axios.post(`${domain}/api/material-transfer`, transferData);
    console.log('✅ Material transfer API response:', res.data);
    
    const result = (res.data as any)?.data ?? null;
    
    if (result && notificationCallback) {
      // 🔔 Send material transfer notification using callback
      try {
        console.log('🔔 Sending material transfer notification...');
        
        // Get user data for notification
        const userString = await AsyncStorage.getItem('user');
        let userInfo = null;
        
        if (userString) {
          const userData = JSON.parse(userString);
          userInfo = {
            fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.name || userData.username || 'Unknown User',
          };
        }

        const materialNames = transferData.materials.slice(0, 2).map(m => m.name).join(', ');
        const totalCost = transferData.materials.reduce((sum, m) => sum + (m.cost || 0), 0);

        const notificationSent = await notificationCallback({
          projectId: transferData.toProjectId, // Notify about the receiving project
          activityType: 'material_transferred',
          staffName: userInfo?.fullName || 'User',
          projectName: transferData.toProjectName,
          details: `Transferred ${transferData.materials.length} material${transferData.materials.length > 1 ? 's' : ''} (${materialNames}${transferData.materials.length > 2 ? '...' : ''}) from ${transferData.fromProjectName}${totalCost > 0 ? ` - ₹${totalCost.toLocaleString('en-IN')}` : ''}`,
          category: 'material',
          materials: transferData.materials,
          transferDetails: {
            fromProject: { id: transferData.fromProjectId, name: transferData.fromProjectName },
            toProject: { id: transferData.toProjectId, name: transferData.toProjectName }
          },
          message: transferData.notes,
        });

        console.log('🔔 Material transfer notification result:', notificationSent);
        
        if (notificationSent) {
          console.log('✅ Material transfer notification sent successfully');
        } else {
          console.log('⚠️ Material transfer notification failed');
        }
      } catch (notificationError: any) {
        console.error('❌ Error sending material transfer notification:', notificationError);
        // Don't fail the whole operation if notification fails
      }
    }
    
    return result;
  } catch (error: any) {
    console.error('❌ Error in transferMaterials function:', error);
    console.error('❌ Error response:', error.response?.data);
    return null;
  }
};