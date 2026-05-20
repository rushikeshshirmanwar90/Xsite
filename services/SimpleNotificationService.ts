import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import apiClient from '@/utils/axiosConfig';

// ✅ Check if we're running in Expo Go (which doesn't support push notifications in SDK 53+)
const isExpoGo = Constants.appOwnership === 'expo';

// Conditional import - only import Notifications if not in Expo Go
let Notifications: any;

if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
  } catch (error) {
    console.log('⚠️ expo-notifications not available, using mock');
    Notifications = null;
  }
}

// Mock Notifications object for Expo Go compatibility
if (!Notifications || isExpoGo) {
  Notifications = {
    setNotificationHandler: () => {},
    getPermissionsAsync: async () => ({ status: 'denied' }),
    requestPermissionsAsync: async () => ({ status: 'denied' }),
    setNotificationChannelAsync: async () => {},
    getExpoPushTokenAsync: async () => ({ data: 'mock-token-expo-go' }),
    scheduleNotificationAsync: async () => 'mock-id',
    AndroidImportance: { MAX: 4 },
    AndroidNotificationPriority: { HIGH: 1 },
    SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
  };
}

// Simple notification service for project activities
export class SimpleNotificationService {
  private static instance: SimpleNotificationService;
  private currentToken: string | null = null;

  static getInstance(): SimpleNotificationService {
    if (!SimpleNotificationService.instance) {
      SimpleNotificationService.instance = new SimpleNotificationService();
    }
    return SimpleNotificationService.instance;
  }

  constructor() {
    this.setupNotificationHandler();
  }

  /**
   * Setup basic notification handler
   */
  private setupNotificationHandler() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  /**
   * Initialize notifications - simple version
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔔 Initializing simple notification service...');
      console.log('📱 Platform:', Platform.OS);
      console.log('📱 Device type:', Device.isDevice ? 'Physical device' : 'Simulator/Emulator');
      console.log('📱 Expo Go:', isExpoGo ? 'Yes' : 'No');

      // ✅ Skip initialization in Expo Go
      if (isExpoGo) {
        console.log('⚠️ Running in Expo Go - push notifications not available');
        console.log('   Use a development build for full notification support');
        console.log('   Run: eas build --profile development --platform android');
        return false;
      }

      // Check device support
      if (!Device.isDevice) {
        console.log('⚠️ Push notifications require a physical device');
        return false;
      }

      // Request permissions
      console.log('🔐 Requesting notification permissions...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('🔐 Existing permission status:', existingStatus);
      
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('🔐 New permission status:', finalStatus);
      }

      if (finalStatus !== 'granted') {
        console.log('⚠️ Notification permissions not granted');
        return false;
      }

      // Set up notification channels for Android
      if (Platform.OS === 'android') {
        console.log('📱 Creating Android notification channels...');
        
        try {
          // Create 'default' channel
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default Notifications',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#3B82F6',
            sound: 'default',
            enableVibrate: true,
            enableLights: true,
            showBadge: true,
          });
          console.log('✅ Created "default" notification channel');

          // Create 'project-updates' channel
          await Notifications.setNotificationChannelAsync('project-updates', {
            name: 'Project Updates',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#10B981',
            sound: 'default',
            enableVibrate: true,
            enableLights: true,
            showBadge: true,
          });
          console.log('✅ Created "project-updates" notification channel');
        } catch (channelError) {
          console.error('❌ Failed to create Android notification channels:', channelError);
          // Don't fail initialization if channel creation fails
        }
      }

      // Get push token
      console.log('🎫 Getting push token...');
      const token = await this.getPushToken();
      if (token) {
        this.currentToken = token;
        console.log('✅ Notification service initialized successfully');
        console.log('📊 Token length:', token.length, 'characters');
        return true;
      } else {
        console.log('❌ Failed to get push token');
      }

      return false;
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
      console.log('⚠️ Simple push token initialization failed - user may not receive notifications');
      return false;
    }
  }

  /**
   * Get push token
   */
  private async getPushToken(): Promise<string | null> {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                        '2fcc4ccc-b8b5-4ff4-ae3c-b195aa9eb32f';

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      console.log('✅ Push token generated successfully');
      return tokenData.data;
    } catch (error) {
      console.error('❌ Error getting push token:', error);
      return null;
    }
  }

  /**
   * Register token with backend - simple version
   */
  async registerToken(userData: any): Promise<boolean> {
    try {
      if (!this.currentToken) {
        console.log('❌ No push token available');
        return false;
      }

      const userId = userData._id?.toString();
      if (!userId) {
        console.log('❌ No userId available');
        return false;
      }

      // ✅ FIX: Determine role
      const staffRoles = ["site-engineer", "supervisor", "manager"];
      const isStaff = staffRoles.includes(userData.role);
      const role = isStaff ? "staff" : "admin";

      // ✅ FIX: Determine clientId — same logic as AuthContext fix
      let clientId: string | null = null;
      
      if (isStaff) {
        // Staff: extract from clients array
        clientId = userData.clients?.[0]?.clientId?.toString() || null;
        console.log('👥 Staff clientId from clients[0]:', clientId);
      } else if (userData.clients?.length > 0) {
        // Admin with clients array
        clientId = userData.clients[0].clientId?.toString()
          || userData.clients[0]._id?.toString()
          || null;
        console.log('🏢 Admin clientId from clients[0]:', clientId);
      } else if (userData.clientId) {
        // Admin with direct clientId field
        clientId = userData.clientId.toString();
        console.log('🏢 Admin clientId from data.clientId:', clientId);
      } else {
        // Owner/super-admin: their own _id IS the clientId
        clientId = userData._id?.toString() || null;
        console.log('⚠️ Admin: falling back to own _id as clientId:', clientId);
      }

      if (!clientId) {
        console.warn("⚠️ Cannot register push token: no clientId resolved");
        return false;
      }

      const payload = {
        userId,
        clientId,
        role,
        token: this.currentToken,
      };

      console.log('📤 Registering push token with backend:', {
        userId,
        clientId,
        role,
        tokenPreview: this.currentToken.substring(0, 20) + '...'
      });

      const response = await apiClient.post(`/api/notifications/register-token`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if ((response.data as any)?.success) {
        console.log('✅ Push token registered successfully');
        await AsyncStorage.setItem('pushTokenRegistered', 'true');
        await AsyncStorage.setItem('registeredClientId', clientId);
        return true;
      } else {
        console.log('❌ Push token registration failed:', response.data);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error registering push token:', error);
      if (error?.response) {
        console.error('   Response status:', error.response.status);
        console.error('   Response data:', error.response.data);
      }
      return false;
    }
  }

  /**
   * Send notification for project activity
   */
  async sendProjectNotification(activityData: {
    projectId?: string;
    clientId?: string; // Add clientId field
    activityType: 'material_added' | 'usage_added' | 'labor_added' | 'equipment_added' | 'admin_update' | 
                  'project_created' | 'project_updated' | 'project_deleted' |
                  'section_created' | 'section_updated' | 'section_deleted' |
                  'mini_section_created' | 'mini_section_updated' | 'mini_section_deleted' |
                  'staff_added' | 'staff_updated' | 'staff_removed' |
                  'material_imported' | 'material_used' | 'material_transferred' |
                  'equipment_updated' | 'equipment_removed';
    staffName: string;
    projectName?: string;
    sectionName?: string;
    miniSectionName?: string;
    details: string;
    recipientType: 'admins' | 'staff';
    staffId?: string; // ID of the user performing the action
    performerRole?: string; // Role of the user performing the action
    performerId?: string; // ID of the user performing the action
    title?: string; // Custom notification title
    category?: 'project' | 'section' | 'mini_section' | 'staff' | 'labor' | 'material';
    materials?: Array<{
      name: string;
      unit: string;
      qnt: number;
      cost: number;
    }>;
    transferDetails?: {
      fromProject: { id: string; name: string };
      toProject: { id: string; name: string };
    };
    message?: string;
  }): Promise<boolean> {
    try {
      console.log('📤 Starting notification send process...');
      console.log('📤 Activity data:', activityData);

      // 1. Check if we have a valid token
      if (!this.currentToken) {
        console.log('⚠️ No push token available, attempting to get one...');
        const token = await this.getPushToken();
        if (token) {
          this.currentToken = token;
          console.log('✅ Got new push token');
        } else {
          console.error('❌ Failed to get push token');
          // Fallback to local notification
          await this.scheduleLocalNotification(
            this.getNotificationTitle(activityData.activityType, activityData.staffName),
            activityData.details,
            { projectId: activityData.projectId, route: 'notifications' }
          );
          return true; // Return true since we sent local notification
        }
      }

      // 2. Clean up project name - remove "Tmp" and other unwanted prefixes
      const cleanProjectName = this.cleanProjectName(activityData.projectName);

      // 3. Get clientId - use provided or fallback to stored
      let targetClientId = activityData.clientId || await AsyncStorage.getItem('registeredClientId');
      
      if (!targetClientId) {
        console.error('❌ No clientId available for notification');
        throw new Error('ClientId is required for notifications');
      }
      
      console.log('📋 Using clientId:', targetClientId);

      // 4. Resolve recipients by calling the recipients API
      console.log('🔍 Resolving recipients for clientId:', targetClientId);
      let recipients: any[] = [];
      
      try {
        const recipientsResponse = await apiClient.get(
          `/api/notifications/recipients?clientId=${targetClientId}`,
          { timeout: 5000 }
        );
        
        if (recipientsResponse.data?.success && recipientsResponse.data?.data?.recipients) {
          recipients = recipientsResponse.data.data.recipients;
          console.log(`✅ Found ${recipients.length} recipients from API`);
        } else {
          console.log('⚠️ Recipients API returned no data');
        }
      } catch (recipientError: any) {
        console.error('❌ Failed to resolve recipients:', recipientError.message);
        // Continue with empty recipients array - backend will handle fallback
      }

      // 5. Filter out performer (self-notification prevention)
      const performerId = activityData.performerId || activityData.staffId;
      if (performerId && recipients.length > 0) {
        const originalCount = recipients.length;
        recipients = recipients.filter((r: any) => r.userId !== performerId);
        const filteredCount = originalCount - recipients.length;
        if (filteredCount > 0) {
          console.log(`🚫 Filtered out ${filteredCount} recipient (self-notification prevention)`);
        }
      }

      console.log(`📤 Sending notification to ${recipients.length} recipients`);

      // 6. Prepare notification payload with recipients array
      const notificationPayload = {
        projectId: activityData.projectId,
        clientId: targetClientId,
        type: activityData.activityType,
        title: activityData.title || this.getNotificationTitle(activityData.activityType, activityData.staffName),
        message: cleanProjectName ? `${cleanProjectName}: ${activityData.details}` : activityData.details,
        recipients: recipients, // ✅ Send recipients array instead of recipientType
        category: activityData.category,
        action: activityData.activityType,
        triggeredBy: performerId,
        metadata: {
          staffId: activityData.staffId,
          performerRole: activityData.performerRole,
          performerId: activityData.performerId,
          materials: activityData.materials,
          transferDetails: activityData.transferDetails,
          projectName: activityData.projectName,
          sectionName: activityData.sectionName,
          miniSectionName: activityData.miniSectionName,
        },
        data: {
          projectId: activityData.projectId,
          clientId: targetClientId,
          activityType: activityData.activityType,
          category: activityData.category,
          projectName: activityData.projectName,
          sectionName: activityData.sectionName,
          miniSectionName: activityData.miniSectionName,
          timestamp: Date.now(),
          route: 'notifications',
          screen: 'notifications',
        }
      };

      console.log('📦 Notification payload:', {
        ...notificationPayload,
        recipients: `${recipients.length} recipients`
      });

      // 7. Send to backend API with better error handling
      const response = await apiClient.post(`/api/send-project-notification`, notificationPayload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000, // Increased timeout
      });

      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response data:', response.data);

      // 8. Check response
      if ((response.data as any)?.success) {
        const sentCount = (response.data as any)?.data?.notificationsSent || 
                         (response.data as any)?.data?.sent || 0;
        if (sentCount > 0) {
          console.log(`✅ Successfully sent ${sentCount} notifications`);
          return true;
        } else {
          console.log('⚠️ API succeeded but no notifications sent (recipients may be empty)');
          // Still return true as the API call succeeded
          return true;
        }
      } else {
        console.log('❌ API response indicates failure:', response.data);
        // Fallback to local notification
        await this.scheduleLocalNotification(
          notificationPayload.title,
          notificationPayload.message,
          notificationPayload.data
        );
        return true;
      }

    } catch (error: any) {
      console.error('❌ Error sending project notification:', error);
      
      // Log more details about the error
      if (error?.response) {
        console.error('❌ API error details:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
      }
      
      // 9. Final fallback: Always send local notification on error
      try {
        console.log('🔄 Final fallback: sending local notification...');
        await this.scheduleLocalNotification(
          this.getNotificationTitle(activityData.activityType, activityData.staffName),
          activityData.details,
          {
            projectId: activityData.projectId,
            activityType: activityData.activityType,
            route: 'notifications',
            screen: 'notifications',
          }
        );
        return true; // Return true since we sent local notification
      } catch (localError: any) {
        console.error('❌ Even local notification failed:', localError);
        return false;
      }
    }
  }

  /**
   * Clean project name for display in notifications
   */
  private cleanProjectName(projectName?: string): string {
    if (!projectName) return '';
    
    // Remove common unwanted prefixes/suffixes
    let cleaned = projectName
      .replace(/^tmp\s*/i, '') // Remove "Tmp" or "tmp" at the beginning
      .replace(/^test\s*/i, '') // Remove "Test" or "test" at the beginning
      .replace(/\s*tmp$/i, '') // Remove "tmp" at the end
      .replace(/\s*test$/i, '') // Remove "test" at the end
      .trim();
    
    // If the cleaned name is empty or too short, return original
    if (!cleaned || cleaned.length < 2) {
      return projectName;
    }
    
    // Capitalize first letter of each word
    cleaned = cleaned.replace(/\b\w/g, l => l.toUpperCase());
    
    return cleaned;
  }

  /**
   * Get notification title based on activity type
   */
  private getNotificationTitle(activityType: string, staffName: string): string {
    switch (activityType) {
      // Material Activities
      case 'material_added':
      case 'material_imported':
        return `Materials Imported by ${staffName}`;
      case 'usage_added':
      case 'material_used':
        return `Materials Used by ${staffName}`;
      case 'material_transferred':
        return `Materials Transferred by ${staffName}`;
        
      // Labor Activities
      case 'labor_added':
        return `Labor Added by ${staffName}`;
        
      // Equipment Activities
      case 'equipment_added':
        return `Equipment Added by ${staffName}`;
      case 'equipment_updated':
        return `Equipment Updated by ${staffName}`;
      case 'equipment_removed':
        return `Equipment Removed by ${staffName}`;
        
      // Project Activities
      case 'project_created':
        return `New Project Created by ${staffName}`;
      case 'project_updated':
        return `Project Updated by ${staffName}`;
      case 'project_deleted':
        return `Project Deleted by ${staffName}`;
        
      // Section Activities
      case 'section_created':
        return `New Section Created by ${staffName}`;
      case 'section_updated':
        return `Section Updated by ${staffName}`;
      case 'section_deleted':
        return `Section Deleted by ${staffName}`;
        
      // Mini-Section Activities
      case 'mini_section_created':
        return `New Mini-Section Created by ${staffName}`;
      case 'mini_section_updated':
        return `Mini-Section Updated by ${staffName}`;
      case 'mini_section_deleted':
        return `Mini-Section Deleted by ${staffName}`;
        
      // Staff Activities
      case 'staff_added':
        return `New Staff Added by ${staffName}`;
      case 'staff_updated':
        return `Staff Updated by ${staffName}`;
      case 'staff_removed':
        return `Staff Removed by ${staffName}`;
        
      // Admin Activities
      case 'admin_update':
        return `Admin Update by ${staffName}`;
        
      default:
        return `Activity Update by ${staffName}`;
    }
  }

  /**
   * Schedule local notification (for testing)
   */
  async scheduleLocalNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      const notificationContent: any = {
        title,
        body,
        data: {
          ...data,
          route: 'notifications', // ✅ Navigate to notifications page
          screen: 'notifications',
        },
        sound: 'default', // ✅ Enable default sound
        priority: Notifications.AndroidNotificationPriority.HIGH,
      };

      const trigger: any = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
      };

      // ✅ FIX: Add channelId for Android
      if (Platform.OS === 'android') {
        trigger.channelId = 'project-updates'; // Use project-updates channel
      }

      await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: trigger,
      });
      
      console.log('✅ Local notification scheduled with sound and navigation');
      if (Platform.OS === 'android') {
        console.log('📱 Android: Using channel "project-updates"');
      }
    } catch (error) {
      console.error('❌ Error scheduling local notification:', error);
    }
  }

  /**
   * Get current token
   */
  getCurrentToken(): string | null {
    return this.currentToken;
  }

  /**
   * Check if notifications are set up
   */
  async isSetup(): Promise<boolean> {
    const registered = await AsyncStorage.getItem('pushTokenRegistered');
    return registered === 'true' && !!this.currentToken;
  }
}

export default SimpleNotificationService;