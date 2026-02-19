import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import { domain } from '@/lib/domain';

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

      // Check device support
      if (!Device.isDevice) {
        console.log('⚠️ Push notifications require a physical device');
        return false;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('⚠️ Notification permissions not granted');
        return false;
      }

      // Set up notification channels for Android
      if (Platform.OS === 'android') {
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
      }

      // Get push token
      const token = await this.getPushToken();
      if (token) {
        this.currentToken = token;
        console.log('✅ Notification service initialized successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
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

      // ✅ Determine clientId based on user type and data
      let clientId = null;
      
      if (userData.clientId) {
        clientId = userData.clientId;
      } else if (userData.role === 'client' || userData.userType === 'client') {
        clientId = userData._id; // Client is their own clientId
      } else if (userData.assignedProjects && userData.assignedProjects.length > 0) {
        clientId = userData.assignedProjects[0].clientId; // Staff - use first project's client
      } else if (userData.clients && userData.clients.length > 0) {
        clientId = userData.clients[0].clientId; // Staff - use first client assignment
      }

      // ✅ Determine userType more precisely
      let userType = 'client'; // Default fallback
      
      if (userData.role === 'staff') {
        userType = 'staff';
      } else if (userData.role === 'admin' || userData.userType === 'admin') {
        userType = 'admin';
      } else if (userData.role === 'client' || userData.userType === 'client') {
        userType = 'client';
      } else if (userData.userType) {
        userType = userData.userType;
      }

      const payload = {
        userId: userData._id,
        userType: userType,
        token: this.currentToken,
        platform: Platform.OS,
        deviceId: Constants.sessionId || 'unknown',
        deviceName: Device.deviceName || `${Platform.OS} Device`,
        clientId, // ✅ Include clientId for proper grouping
      };

      console.log('📤 Registering push token:', {
        userId: userData._id,
        userType: userType,
        clientId: clientId,
        originalRole: userData.role,
        originalUserType: userData.userType,
      });

      const response = await axios.post(`${domain}/api/simple-push-token`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if ((response.data as any)?.success) {
        console.log('✅ Push token registered successfully with clientId:', clientId);
        await AsyncStorage.setItem('pushTokenRegistered', 'true');
        await AsyncStorage.setItem('registeredClientId', clientId || '');
        return true;
      } else {
        console.log('❌ Push token registration failed');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error registering push token:', error);
      return false;
    }
  }

  /**
   * Send notification for project activity
   */
  async sendProjectNotification(activityData: {
    projectId?: string;
    clientId?: string; // Add clientId field
    activityType: 'material_added' | 'usage_added' | 'labor_added' | 'admin_update' | 
                  'project_created' | 'project_updated' | 'project_deleted' |
                  'section_created' | 'section_updated' | 'section_deleted' |
                  'mini_section_created' | 'mini_section_updated' | 'mini_section_deleted' |
                  'staff_added' | 'staff_updated' | 'staff_removed' |
                  'material_imported' | 'material_used' | 'material_transferred';
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

      // ✅ Let backend get clientId from project automatically
      let targetClientId = await AsyncStorage.getItem('registeredClientId') || undefined;
      console.log('📋 Using stored clientId (fallback only):', targetClientId);

      // 4. Prepare notification payload
      const notificationPayload = {
        projectId: activityData.projectId,
        clientId: activityData.clientId, // ✅ Pass clientId explicitly
        type: activityData.activityType,
        title: activityData.title || this.getNotificationTitle(activityData.activityType, activityData.staffName),
        message: cleanProjectName ? `${cleanProjectName}: ${activityData.details}` : activityData.details,
        recipientType: activityData.recipientType,
        staffId: activityData.staffId, // Include staffId to prevent self-notification
        performerRole: activityData.performerRole, // Role of the user performing the action
        performerId: activityData.performerId, // ID of the user performing the action
        category: activityData.category, // Activity category
        materials: activityData.materials, // Material details if applicable
        transferDetails: activityData.transferDetails, // Transfer details if applicable
        data: {
          projectId: activityData.projectId,
          clientId: activityData.clientId, // ✅ Include in data as well
          activityType: activityData.activityType,
          category: activityData.category,
          projectName: activityData.projectName,
          sectionName: activityData.sectionName,
          miniSectionName: activityData.miniSectionName,
          timestamp: Date.now(),
          route: 'notifications', // Navigation data
          screen: 'notifications',
        }
      };

      console.log('� Notification payload:', notificationPayload);
      console.log('� Sending to API:', `${domain}/api/send-project-notification`);

      // 5. Send to backend API with better error handling
      const response = await axios.post(`${domain}/api/send-project-notification`, notificationPayload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000, // Increased timeout
      });

      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response data:', response.data);

      // 6. Check response
      if ((response.data as any)?.success) {
        const sentCount = (response.data as any)?.data?.sent || 0;
        if (sentCount > 0) {
          console.log(`✅ Successfully sent ${sentCount} notifications to client ${targetClientId}`);
          return true;
        } else {
          console.log('⚠️ API succeeded but no notifications sent, using local fallback');
          // Fallback to local notification
          await this.scheduleLocalNotification(
            notificationPayload.title,
            notificationPayload.message,
            notificationPayload.data
          );
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
        console.error('❌ Axios error details:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
      }
      
      // 7. Final fallback: Always send local notification on error
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
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            ...data,
            route: 'notifications', // ✅ Navigate to notifications page
            screen: 'notifications',
          },
          sound: 'default', // ✅ Enable default sound
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
          channelId: 'project-updates', // Use project-updates channel
        },
      });
      console.log('✅ Local notification scheduled with sound and navigation');
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