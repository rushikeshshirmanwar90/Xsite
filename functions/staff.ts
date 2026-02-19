import { domain } from "@/lib/domain";
import { Staff } from "@/types/staff";
import axios from "axios";
// Remove direct service import - we'll use a different approach
// import SimpleNotificationService from '@/services/SimpleNotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const addStaff = async (staff: Staff, notificationCallback?: (data: any) => Promise<boolean>): Promise<any | null> => {
  try {
    console.log('📤 Adding staff via API:', `${domain}/api/users/staff`);
    console.log('📋 Staff payload:', staff);
    
    const res = await axios.post(`${domain}/api/users/staff`, staff);
    console.log('✅ Staff API response:', res.data);
    
    const result = (res.data as any)?.data ?? null;
    
    if (result && notificationCallback) {
      // 🔔 Send staff addition notification using callback
      try {
        console.log('🔔 Sending staff addition notification...');
        
        const notificationSent = await notificationCallback({
          // ✅ For staff operations, use clientId directly (not projectId)
          clientId: staff.clientId, // Use clientId for staff operations
          activityType: 'staff_added',
          staffName: `${staff.firstName} ${staff.lastName}`,
          projectName: 'Organization',
          details: `Added new staff member: ${staff.firstName} ${staff.lastName} (${staff.role})`,
          category: 'staff',
          message: `Email: ${staff.email}, Phone: ${staff.phoneNumber}`,
        });

        console.log('🔔 Staff addition notification result:', notificationSent);
        
        if (notificationSent) {
          console.log('✅ Staff addition notification sent successfully');
        } else {
          console.log('⚠️ Staff addition notification failed');
        }
      } catch (notificationError: any) {
        console.error('❌ Error sending staff addition notification:', notificationError);
        // Don't fail the whole operation if notification fails
      }
    }
    
    return result;
  } catch (error: any) {
    console.error('❌ Error in addStaff function:', error);
    console.error('❌ Error response:', error.response?.data);
    return null;
  }
};

export const updateStaff = async (staffId: string, staffData: Partial<Staff>, notificationCallback?: (data: any) => Promise<boolean>): Promise<any | null> => {
  try {
    console.log('📤 Updating staff via API:', `${domain}/api/users/staff/${staffId}`);
    console.log('📋 Staff update payload:', staffData);
    
    const res = await axios.put(`${domain}/api/users/staff/${staffId}`, staffData);
    console.log('✅ Staff update API response:', res.data);
    
    const result = (res.data as any)?.data ?? null;
    
    if (result && notificationCallback) {
      // 🔔 Send staff update notification using callback
      try {
        console.log('🔔 Sending staff update notification...');

        const notificationSent = await notificationCallback({
          // ✅ For staff operations, use clientId directly (not projectId)
          clientId: staffData.clientId, // Use clientId for staff operations
          activityType: 'staff_updated',
          staffName: `${staffData.firstName || 'Staff'} ${staffData.lastName || 'Member'}`,
          projectName: 'Organization',
          details: `Updated staff member: ${staffData.firstName || 'Staff'} ${staffData.lastName || 'Member'}`,
          category: 'staff',
          message: 'Staff information has been updated',
        });

        console.log('🔔 Staff update notification result:', notificationSent);
        
        if (notificationSent) {
          console.log('✅ Staff update notification sent successfully');
        } else {
          console.log('⚠️ Staff update notification failed');
        }
      } catch (notificationError: any) {
        console.error('❌ Error sending staff update notification:', notificationError);
        // Don't fail the whole operation if notification fails
      }
    }
    
    return result;
  } catch (error: any) {
    console.error('❌ Error in updateStaff function:', error);
    console.error('❌ Error response:', error.response?.data);
    return null;
  }
};

export const removeStaff = async (staffId: string, staffName?: string, notificationCallback?: (data: any) => Promise<boolean>, clientId?: string): Promise<any | null> => {
  try {
    console.log('📤 Removing staff via API:', `${domain}/api/users/staff/${staffId}`);
    
    const res = await axios.delete(`${domain}/api/users/staff/${staffId}`);
    console.log('✅ Staff removal API response:', res.data);
    
    const result = (res.data as any)?.success ?? false;
    
    if (result && notificationCallback && clientId) {
      // 🔔 Send staff removal notification using callback
      try {
        console.log('🔔 Sending staff removal notification...');

        const notificationSent = await notificationCallback({
          // ✅ For staff operations, use clientId directly (not projectId)
          clientId: clientId, // Use clientId for staff operations
          activityType: 'staff_removed',
          staffName: staffName || 'Staff Member',
          projectName: 'Organization',
          details: `Removed staff member: ${staffName || 'Staff Member'}`,
          category: 'staff',
          message: 'Staff member has been removed from the organization',
        });

        console.log('🔔 Staff removal notification result:', notificationSent);
        
        if (notificationSent) {
          console.log('✅ Staff removal notification sent successfully');
        } else {
          console.log('⚠️ Staff removal notification failed');
        }
      } catch (notificationError: any) {
        console.error('❌ Error sending staff removal notification:', notificationError);
        // Don't fail the whole operation if notification fails
      }
    }
    
    return result;
  } catch (error: any) {
    console.error('❌ Error in removeStaff function:', error);
    console.error('❌ Error response:', error.response?.data);
    return null;
  }
};
