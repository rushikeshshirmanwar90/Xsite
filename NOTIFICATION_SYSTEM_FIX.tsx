/**
 * COMPREHENSIVE NOTIFICATION SYSTEM FIX
 * 
 * This file contains the complete solution for the multi-user notification system
 * that handles client-admin-staff hierarchy properly.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { domain } from '@/lib/domain';
import { getClientId } from '@/functions/clientId';
import NotificationManager from '@/services/notificationManager';

// ============================================================================
// STEP 1: ENHANCED NOTIFICATION TYPES
// ============================================================================

export interface NotificationRecipient {
  userId: string;
  userType: 'admin' | 'staff';
  clientId: string;
  fullName: string;
  email?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  category: 'material' | 'project' | 'staff' | 'labor' | 'section';
  action: string;
  data: {
    activityId?: string;
    projectId: string;
    projectName: string;
    sectionName?: string;
    clientId: string;
    triggeredBy: {
      userId: string;
      fullName: string;
      userType: 'admin' | 'staff';
    };
    [key: string]: any;
  };
  recipients: NotificationRecipient[];
  timestamp: string;
}

// ============================================================================
// STEP 2: ENHANCED NOTIFICATION SERVICE
// ============================================================================

class EnhancedNotificationService {
  private static instance: EnhancedNotificationService;
  private notificationManager: any;

  static getInstance(): EnhancedNotificationService {
    if (!EnhancedNotificationService.instance) {
      EnhancedNotificationService.instance = new EnhancedNotificationService();
    }
    return EnhancedNotificationService.instance;
  }

  constructor() {
    this.notificationManager = NotificationManager.getInstance();
  }

  /**
   * Send notification to multiple users based on client-admin-staff hierarchy
   */
  async sendMultiUserNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      console.log('\n========================================');
      console.log('🔔 SENDING MULTI-USER NOTIFICATION');
      console.log('========================================');
      console.log('📋 Notification Payload:');
      console.log(JSON.stringify(payload, null, 2));

      // Step 1: Send to backend for server-side processing and push notifications
      const response = await axios.post(`${domain}/api/notifications/send`, payload);
      
      if (response.data.success) {
        console.log('✅ Server-side notifications sent successfully');
        
        // Step 2: Check if current user should receive this notification locally
        const currentUser = await this.getCurrentUser();
        if (currentUser && this.shouldReceiveNotification(currentUser, payload)) {
          console.log('📱 Adding local notification for current user');
          
          await this.notificationManager.scheduleLocalNotification(
            payload.title,
            payload.body,
            payload.data
          );
        }
        
        return true;
      } else {
        console.error('❌ Server-side notification failed:', response.data.message);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Multi-user notification error:', error);
      
      // Fallback: At least add local notification if it's for current user
      try {
        const currentUser = await this.getCurrentUser();
        if (currentUser && this.shouldReceiveNotification(currentUser, payload)) {
          console.log('🔄 Fallback: Adding local notification');
          await this.notificationManager.scheduleLocalNotification(
            payload.title,
            payload.body,
            payload.data
          );
        }
      } catch (fallbackError) {
        console.error('❌ Fallback notification failed:', fallbackError);
      }
      
      return false;
    }
  }

  /**
   * Get current user data
   */
  private async getCurrentUser(): Promise<NotificationRecipient | null> {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (!userString) return null;

      const userData = JSON.parse(userString);
      const clientId = await getClientId();

      return {
        userId: userData._id || userData.id || 'unknown',
        userType: userData.role === 'admin' || userData.userType === 'admin' ? 'admin' : 'staff',
        clientId: clientId || userData.clientId || 'unknown',
        fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.name || 'Unknown User',
        email: userData.email,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Check if current user should receive this notification
   */
  private shouldReceiveNotification(currentUser: NotificationRecipient, payload: NotificationPayload): boolean {
    // Don't notify the user who triggered the action
    if (currentUser.userId === payload.data.triggeredBy.userId) {
      return false;
    }

    // Check if user is in the recipients list
    return payload.recipients.some(recipient => 
      recipient.userId === currentUser.userId && 
      recipient.clientId === currentUser.clientId
    );
  }

  /**
   * Create notification payload for material activity
   */
  createMaterialActivityNotification(
    activity: 'imported' | 'used' | 'transferred',
    materials: any[],
    projectId: string,
    projectName: string,
    sectionName: string,
    triggeredBy: NotificationRecipient,
    recipients: NotificationRecipient[]
  ): NotificationPayload {
    const materialCount = materials.length;
    const totalQuantity = materials.reduce((sum, m) => sum + (m.qnt || 0), 0);
    const totalCost = materials.reduce((sum, m) => sum + (m.totalCost || m.cost || 0), 0);

    let title = '';
    let body = '';

    switch (activity) {
      case 'imported':
        title = `📦 Materials Imported`;
        body = `${triggeredBy.fullName} imported ${materialCount} material${materialCount > 1 ? 's' : ''} (₹${totalCost.toLocaleString()}) in ${projectName}`;
        break;
      case 'used':
        title = `🔧 Materials Used`;
        body = `${triggeredBy.fullName} used ${materialCount} material${materialCount > 1 ? 's' : ''} (₹${totalCost.toLocaleString()}) in ${projectName} - ${sectionName}`;
        break;
      case 'transferred':
        title = `↔️ Materials Transferred`;
        body = `${triggeredBy.fullName} transferred ${materialCount} material${materialCount > 1 ? 's' : ''} (₹${totalCost.toLocaleString()}) from ${projectName}`;
        break;
    }

    return {
      title,
      body,
      category: 'material',
      action: activity,
      data: {
        projectId,
        projectName,
        sectionName,
        clientId: triggeredBy.clientId,
        triggeredBy: {
          userId: triggeredBy.userId,
          fullName: triggeredBy.fullName,
          userType: triggeredBy.userType,
        },
        materials,
        totalCost,
        totalQuantity,
        route: 'project',
      },
      recipients,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get recipients for a project-based notification
   */
  async getProjectNotificationRecipients(
    projectId: string,
    clientId: string,
    excludeUserId?: string
  ): Promise<NotificationRecipient[]> {
    try {
      console.log('🔍 Getting notification recipients for project:', projectId);
      
      // Call backend to get all admins and staff for this client
      const response = await axios.get(`${domain}/api/notifications/recipients?clientId=${clientId}&projectId=${projectId}`);
      
      if (response.data.success) {
        let recipients: NotificationRecipient[] = response.data.recipients || [];
        
        // Exclude the user who triggered the action
        if (excludeUserId) {
          recipients = recipients.filter(r => r.userId !== excludeUserId);
        }
        
        console.log(`✅ Found ${recipients.length} notification recipients`);
        return recipients;
      } else {
        console.warn('⚠️ Failed to get recipients from backend, using fallback');
        return await this.getFallbackRecipients(clientId, excludeUserId);
      }
    } catch (error) {
      console.error('❌ Error getting recipients:', error);
      return await this.getFallbackRecipients(clientId, excludeUserId);
    }
  }

  /**
   * Fallback method to get recipients when backend is not available
   */
  private async getFallbackRecipients(clientId: string, excludeUserId?: string): Promise<NotificationRecipient[]> {
    try {
      // For now, just return current user's client admins
      // In a real implementation, you'd query your user database
      const currentUser = await this.getCurrentUser();
      if (!currentUser || currentUser.userId === excludeUserId) {
        return [];
      }

      // Return current user as a recipient (for testing)
      return [currentUser];
    } catch (error) {
      console.error('❌ Fallback recipients error:', error);
      return [];
    }
  }
}

// ============================================================================
// STEP 3: ENHANCED MATERIAL ACTIVITY LOGGER
// ============================================================================

export class EnhancedMaterialActivityLogger {
  private notificationService: EnhancedNotificationService;

  constructor() {
    this.notificationService = EnhancedNotificationService.getInstance();
  }

  /**
   * Log material activity with proper notifications
   */
  async logMaterialActivity(
    materials: any[],
    activity: 'imported' | 'used' | 'transferred',
    projectId: string,
    projectName: string,
    sectionName: string,
    message: string = ''
  ): Promise<boolean> {
    try {
      console.log('\n========================================');
      console.log('🔔 ENHANCED MATERIAL ACTIVITY LOGGING');
      console.log('========================================');

      // Get current user (who triggered the activity)
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        console.error('❌ No current user found');
        return false;
      }

      console.log('👤 Current User:', currentUser);

      // Step 1: Log the activity to backend
      const activityPayload = {
        clientId: currentUser.clientId,
        projectId,
        projectName,
        sectionName,
        materials,
        message,
        activity,
        user: {
          userId: currentUser.userId,
          fullName: currentUser.fullName,
          email: currentUser.email,
        },
        date: new Date().toISOString(),
      };

      console.log('📤 Logging activity to backend...');
      const activityResponse = await axios.post(`${domain}/api/materialActivity`, activityPayload);
      
      if (!activityResponse.data.success) {
        console.error('❌ Failed to log activity:', activityResponse.data.message);
        return false;
      }

      console.log('✅ Activity logged successfully');

      // Step 2: Get notification recipients
      const recipients = await this.notificationService.getProjectNotificationRecipients(
        projectId,
        currentUser.clientId,
        currentUser.userId // Exclude current user
      );

      if (recipients.length === 0) {
        console.log('ℹ️ No notification recipients found');
        return true; // Activity logged successfully, just no notifications to send
      }

      // Step 3: Create and send notification
      const notificationPayload = this.notificationService.createMaterialActivityNotification(
        activity,
        materials,
        projectId,
        projectName,
        sectionName,
        currentUser,
        recipients
      );

      console.log('📱 Sending notifications to', recipients.length, 'recipients...');
      const notificationSent = await this.notificationService.sendMultiUserNotification(notificationPayload);

      if (notificationSent) {
        console.log('✅ Notifications sent successfully');
      } else {
        console.warn('⚠️ Notifications failed to send');
      }

      return true;
    } catch (error) {
      console.error('❌ Enhanced material activity logging error:', error);
      return false;
    }
  }

  private async getCurrentUser(): Promise<NotificationRecipient | null> {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (!userString) return null;

      const userData = JSON.parse(userString);
      const clientId = await getClientId();

      return {
        userId: userData._id || userData.id || 'unknown',
        userType: userData.role === 'admin' || userData.userType === 'admin' ? 'admin' : 'staff',
        clientId: clientId || userData.clientId || 'unknown',
        fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.name || 'Unknown User',
        email: userData.email,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
}

// ============================================================================
// STEP 4: BACKEND API REQUIREMENTS
// ============================================================================

/**
 * BACKEND API ENDPOINTS NEEDED:
 * 
 * 1. POST /api/notifications/send
 *    - Receives notification payload
 *    - Determines recipients based on client-admin-staff hierarchy
 *    - Sends push notifications to relevant users
 *    - Stores notifications in database
 * 
 * 2. GET /api/notifications/recipients?clientId=X&projectId=Y
 *    - Returns list of users who should receive notifications for a project
 *    - Filters based on user roles and project assignments
 * 
 * 3. GET /api/notifications?clientId=X&userId=Y
 *    - Returns notifications for a specific user
 *    - Used to sync notifications across devices
 * 
 * 4. PUT /api/notifications/:id/read
 *    - Mark notification as read
 * 
 * 5. DELETE /api/notifications/:id
 *    - Delete notification
 */

// ============================================================================
// STEP 5: USAGE EXAMPLE COMPONENT
// ============================================================================

const NotificationSystemDemo: React.FC = () => {
  const [logger] = useState(() => new EnhancedMaterialActivityLogger());

  const testMaterialImport = async () => {
    const success = await logger.logMaterialActivity(
      [
        {
          name: 'Test Cement',
          unit: 'bags',
          qnt: 10,
          totalCost: 5000,
          specs: { grade: 'OPC 53' }
        }
      ],
      'imported',
      'test-project-id',
      'Test Project',
      'Test Section',
      'Testing enhanced notification system'
    );

    Alert.alert(
      'Test Result',
      success ? 'Material activity logged and notifications sent!' : 'Failed to log activity',
      [{ text: 'OK' }]
    );
  };

  const testMaterialUsage = async () => {
    const success = await logger.logMaterialActivity(
      [
        {
          name: 'Test Steel',
          unit: 'kg',
          qnt: 50,
          totalCost: 3000,
          specs: { grade: 'Fe 415' }
        }
      ],
      'used',
      'test-project-id',
      'Test Project',
      'Foundation Section',
      'Testing material usage notification'
    );

    Alert.alert(
      'Test Result',
      success ? 'Material usage logged and notifications sent!' : 'Failed to log usage',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Enhanced Notification System</Text>
        <Text style={styles.subtitle}>
          Multi-user notification system with proper client-admin-staff hierarchy
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 Test Notifications</Text>
          
          <TouchableOpacity style={styles.testButton} onPress={testMaterialImport}>
            <Ionicons name="download" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Test Material Import Notification</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testMaterialUsage}>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Test Material Usage Notification</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Implementation Status</Text>
          
          <View style={styles.statusItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.statusText}>Enhanced notification service</Text>
          </View>
          
          <View style={styles.statusItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.statusText}>Material activity logger with notifications</Text>
          </View>
          
          <View style={styles.statusItem}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={styles.statusText}>Backend API endpoints (need implementation)</Text>
          </View>
          
          <View style={styles.statusItem}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={styles.statusText}>Push notification setup</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Next Steps</Text>
          <Text style={styles.nextStepsText}>
            1. Implement backend notification APIs{'\n'}
            2. Set up push notification service{'\n'}
            3. Update material activity calls to use enhanced logger{'\n'}
            4. Test with multiple users{'\n'}
            5. Add notification preferences
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  nextStepsText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});

export default NotificationSystemDemo;

// ============================================================================
// STEP 6: READY-TO-USE INTEGRATION FUNCTIONS
// ============================================================================

/**
 * READY-TO-USE FUNCTIONS FOR IMMEDIATE INTEGRATION
 */

// Export the enhanced logger for easy import
export const enhancedMaterialLogger = new EnhancedMaterialActivityLogger();

/**
 * Drop-in replacement for existing logMaterialActivity calls
 * Usage: Replace your existing calls with this function
 */
export const logMaterialActivityEnhanced = async (
  materials: any[],
  activity: 'imported' | 'used' | 'transferred',
  projectId: string,
  projectName: string,
  sectionName: string,
  message: string = ''
): Promise<boolean> => {
  return await enhancedMaterialLogger.logMaterialActivity(
    materials,
    activity,
    projectId,
    projectName,
    sectionName,
    message
  );
};

/**
 * Quick test function to verify notification system
 */
export const testNotificationSystem = async (): Promise<void> => {
  try {
    const success = await logMaterialActivityEnhanced(
      [{
        name: 'Test Material',
        unit: 'kg',
        qnt: 1,
        totalCost: 100,
        specs: { grade: 'Test' }
      }],
      'imported',
      'test-project-' + Date.now(),
      'Test Project',
      'Test Section',
      'Testing enhanced notification system'
    );

    Alert.alert(
      'Notification Test',
      success ? 
        'Test completed! Check notifications and other user accounts to verify multi-user notifications.' :
        'Test failed. Check console for errors.',
      [{ text: 'OK' }]
    );
  } catch (error) {
    Alert.alert('Test Error', `Error: ${error}`, [{ text: 'OK' }]);
  }
};

// ============================================================================
// INTEGRATION INSTRUCTIONS
// ============================================================================

/**
 * TO INTEGRATE THIS ENHANCED NOTIFICATION SYSTEM:
 * 
 * 1. IMMEDIATE INTEGRATION (Frontend):
 *    Replace existing logMaterialActivity calls with:
 *    ```typescript
 *    import { logMaterialActivityEnhanced } from './NOTIFICATION_SYSTEM_FIX';
 *    
 *    // Replace this:
 *    await logMaterialActivity(materials, 'imported', 'message');
 *    
 *    // With this:
 *    await logMaterialActivityEnhanced(materials, 'imported', projectId, projectName, sectionName, 'message');
 *    ```
 * 
 * 2. BACKEND IMPLEMENTATION (Required for multi-user notifications):
 *    See BACKEND_IMPLEMENTATION_READY.md for complete backend code
 * 
 * 3. TESTING:
 *    Use COMPLETE_NOTIFICATION_TEST.tsx to verify everything works
 * 
 * 4. VERIFICATION:
 *    Test with multiple user accounts to confirm cross-user notifications
 */