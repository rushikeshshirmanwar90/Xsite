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
  
  // ✅ ENHANCED: Configuration options
  private config = {
    enableBackendNotifications: true, // Set to false to disable backend calls entirely
    // ⚠️ Local fallback only notifies the SENDER's own device, so it makes failed
    // remote sends look like successes while other admins receive nothing.
    // Keep disabled; enable temporarily only when debugging local notifications.
    enableLocalFallback: false,
    networkCheckTimeout: 3000,
    apiTimeout: 10000,
  };

  static getInstance(): SimpleNotificationService {
    if (!SimpleNotificationService.instance) {
      SimpleNotificationService.instance = new SimpleNotificationService();
    }
    return SimpleNotificationService.instance;
  }

  constructor() {
    this.setupNotificationHandler();
    
    // ✅ ENHANCED: Allow configuration override via environment or debug settings
    if (__DEV__) {
      // In development, you can disable backend notifications to avoid connection errors
      // this.config.enableBackendNotifications = false;
      console.log('🔧 SimpleNotificationService config:', this.config);
    }
  }

  /**
   * Setup basic notification handler
   */
  private setupNotificationHandler() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,   // iOS < 17 foreground display
        shouldShowBanner: true,  // iOS 17+ / Android foreground display
        shouldShowList: true,    // iOS 17+ / Android notification list
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
        const { status } = await Notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowBadge: true, allowSound: true, allowCriticalAlerts: false },
        });
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
            lightColor: '#2E72F0',
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
        platform: Platform.OS as 'ios' | 'android', // ✅ FIX: Add platform field for Android notifications
      };

      console.log('📤 Registering push token with backend:', {
        userId,
        clientId,
        role,
        platform: Platform.OS,
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

      // 1. Try to refresh our own token, but never block the send on it —
      // recipients are notified via THEIR tokens through the backend, so the
      // sender's device not having a token must not prevent the remote send.
      if (!this.currentToken) {
        console.log('⚠️ No push token available, attempting to get one...');
        const token = await this.getPushToken();
        if (token) {
          this.currentToken = token;
          console.log('✅ Got new push token');
        } else {
          console.warn('⚠️ Could not get own push token — continuing with backend send anyway');
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

      // 5. Only admins of this client receive activity notifications.
      // (The backend re-resolves admins from the DB anyway; this keeps the
      // payload honest and the logs accurate.)
      const beforeAdminFilter = recipients.length;
      recipients = recipients.filter((r: any) => r.userType === 'admin');
      if (beforeAdminFilter !== recipients.length) {
        console.log(`🔒 Filtered out ${beforeAdminFilter - recipients.length} non-admin recipients`);
      }

      // Filter out performer (self-notification prevention)
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
      // Build the styled title/body (matches the in-app notification card design)
      const styled = this.buildNotificationContent(activityData, cleanProjectName);

      const notificationPayload = {
        projectId: activityData.projectId,
        clientId: targetClientId,
        type: activityData.activityType,
        title: activityData.title || styled.title,
        message: styled.body,
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

      // 7. Send to backend API with enhanced error handling and fallback
      try {
        console.log('📤 Attempting to send notification to backend...');
        
        // ✅ ENHANCED: Check network connectivity first
        const isNetworkAvailable = await this.checkNetworkConnectivity();
        if (!isNetworkAvailable) {
          console.log('📱 No network connectivity - sending local notification only');
          throw new Error('No network connectivity');
        }

        const response = await apiClient.post(`/api/send-project-notification`, notificationPayload, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // Reduced timeout to 10 seconds
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
          throw new Error((response.data as any)?.message || 'API returned unsuccessful response');
        }

      } catch (apiError: any) {
        console.log('❌ Backend API failed:', apiError.message);
        
        // ✅ ENHANCED: Determine if we should retry or fallback immediately
        const shouldFallbackImmediately = 
          apiError.code === 'ECONNREFUSED' ||
          apiError.code === 'ENOTFOUND' ||
          apiError.code === 'ECONNABORTED' ||
          apiError.message?.includes('Network Error') ||
          apiError.message?.includes('fetch failed') ||
          apiError.message?.includes('No network connectivity');

        if (shouldFallbackImmediately) {
          console.log('🔄 Network/connection error detected - using local notification fallback');
          throw apiError; // Will be caught by outer try-catch for local fallback
        }

        // For other errors (like 500, 401, etc.), still try local fallback
        console.log('🔄 API error - using local notification fallback');
        throw apiError;
      }

    } catch (error: any) {
      console.error('❌ Error sending project notification:', error);
      
      // ✅ ENHANCED: Better error categorization and logging
      let errorCategory = 'unknown';
      let shouldShowUserError = false;
      
      if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
        errorCategory = 'connection';
        console.log('🔌 Connection error - backend server may be offline');
      } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        errorCategory = 'timeout';
        console.log('⏰ Request timeout - backend server may be slow');
      } else if (error?.response?.status === 401) {
        errorCategory = 'auth';
        console.log('🔐 Authentication error - token may be invalid');
        shouldShowUserError = true;
      } else if (error?.response?.status === 500) {
        errorCategory = 'server';
        console.log('🔥 Server error - backend API issue');
      } else if (error?.message?.includes('Network Error') || error?.message?.includes('fetch failed')) {
        errorCategory = 'network';
        console.log('📡 Network error - connectivity issue');
      }
      
      // Log detailed error info for debugging
      if (error?.response) {
        console.error('❌ API error details:', {
          category: errorCategory,
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
      }
      
      // 9. Local fallback is disabled by default: it only fires on the sender's
      // own device, which hides real delivery failures. When disabled, report
      // the failure honestly so it shows up during testing.
      if (this.config.enableLocalFallback) {
        try {
          console.log('🔄 Sending local notification fallback (debug mode)...');

          const fallbackStyled = this.buildNotificationContent(
            activityData,
            this.cleanProjectName(activityData.projectName)
          );
          const fallbackTitle = activityData.title || fallbackStyled.title;
          const fallbackMessage = fallbackStyled.body;

          await this.scheduleLocalNotification(
            fallbackTitle,
            fallbackMessage,
            {
              projectId: activityData.projectId,
              activityType: activityData.activityType,
              route: 'notifications',
              screen: 'notifications',
              source: 'local_fallback',
              originalError: errorCategory
            }
          );

          console.log('⚠️ Local fallback notification shown on sender device — remote send still FAILED');
        } catch (localError: any) {
          console.error('❌ Even local notification failed:', localError);
        }
      }

      if (shouldShowUserError) {
        // Could show a toast or alert here if needed
        console.error('💥 Critical notification failure - user should be informed');
      }

      return false;
    }
  }

  /**
   * Check network connectivity
   */
  private async checkNetworkConnectivity(): Promise<boolean> {
    try {
      // Simple connectivity check - try to reach a reliable endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      console.log('📡 Network connectivity check failed:', error);
      return false;
    }
  }

  /**
   * Visual identity per activity type — mirrors the category icons/colors used by
   * the in-app notification page (app/notification.tsx getActivityIcon), so the
   * system push and the in-app card feel like the same design.
   */
  private getActivityEmoji(activityType: string): string {
    if (activityType === 'material_imported' || activityType === 'material_added') return '📥';
    if (activityType === 'material_used' || activityType === 'usage_added') return '📤';
    if (activityType === 'material_transferred') return '🔁';
    if (activityType === 'labor_added') return '👷';
    if (activityType.startsWith('equipment_')) return '🏗️';
    if (activityType.startsWith('project_')) return '📁';
    if (activityType.startsWith('mini_section_')) return '🧩';
    if (activityType.startsWith('section_')) return '🗂️';
    if (activityType.startsWith('staff_')) return '👥';
    return 'ℹ️';
  }

  /**
   * Short badge-style headline per activity type — same wording as the badges on
   * the notification page cards ("MATERIALS IMPORTED", "LABOR ADDED", …).
   */
  private getActivityHeadline(activityType: string): string {
    switch (activityType) {
      case 'material_added':
      case 'material_imported': return 'Materials Imported';
      case 'usage_added':
      case 'material_used': return 'Materials Used';
      case 'material_transferred': return 'Materials Transferred';
      case 'labor_added': return 'Labor Added';
      case 'equipment_added': return 'Equipment Added';
      case 'equipment_updated': return 'Equipment Updated';
      case 'equipment_removed': return 'Equipment Removed';
      case 'project_created': return 'New Project Created';
      case 'project_updated': return 'Project Updated';
      case 'project_deleted': return 'Project Deleted';
      case 'section_created': return 'New Section Created';
      case 'section_updated': return 'Section Updated';
      case 'section_deleted': return 'Section Deleted';
      case 'mini_section_created': return 'New Mini-Section Created';
      case 'mini_section_updated': return 'Mini-Section Updated';
      case 'mini_section_deleted': return 'Mini-Section Deleted';
      case 'staff_added': return 'New Staff Added';
      case 'staff_updated': return 'Staff Updated';
      case 'staff_removed': return 'Staff Removed';
      case 'admin_update': return 'Admin Update';
      default: return 'Activity Update';
    }
  }

  /**
   * Builds the push notification title + body styled like the in-app activity
   * cards on the notification page:
   *
   *   📥 Materials Imported · Sunrise Towers
   *   📍 Sunrise Towers › Building A › Slab 2
   *   • Cement — 50 bag · ₹25,000
   *   • Steel — 2 ton · ₹1,20,000
   *   💰 Total: ₹1,45,000
   *   👤 By Rushikesh
   *
   * Android expands the multi-line body via BigText; iOS shows it on long-press.
   */
  private buildNotificationContent(activityData: {
    activityType: string;
    staffName: string;
    projectName?: string;
    sectionName?: string;
    miniSectionName?: string;
    details: string;
    materials?: Array<{ name: string; unit: string; qnt: number; cost: number }>;
    transferDetails?: {
      fromProject: { id: string; name: string };
      toProject: { id: string; name: string };
    };
  }, cleanProjectName: string): { title: string; body: string } {
    const emoji = this.getActivityEmoji(activityData.activityType);
    const headline = this.getActivityHeadline(activityData.activityType);
    const rupees = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

    const title = cleanProjectName
      ? `${emoji} ${headline} · ${cleanProjectName}`
      : `${emoji} ${headline}`;

    const lines: string[] = [];

    // Location breadcrumb — same info as the project/section rows on the card
    const locationParts = [
      cleanProjectName,
      activityData.sectionName,
      activityData.miniSectionName,
    ].filter(Boolean);
    if (locationParts.length > 1) {
      lines.push(`📍 ${locationParts.join(' › ')}`);
    }

    // Materials list — mirrors the card's materials list (max 3, then "+n more")
    const materials = activityData.materials || [];
    if (materials.length > 0) {
      const MAX_SHOWN = 3;
      materials.slice(0, MAX_SHOWN).forEach((m) => {
        const costPart = m.cost > 0 ? ` · ${rupees(m.cost)}` : '';
        lines.push(`• ${m.name} — ${m.qnt} ${m.unit}${costPart}`);
      });
      if (materials.length > MAX_SHOWN) {
        lines.push(`  +${materials.length - MAX_SHOWN} more item${materials.length - MAX_SHOWN > 1 ? 's' : ''}`);
      }
      const totalCost = materials.reduce((sum, m) => sum + (m.cost || 0), 0);
      if (totalCost > 0) {
        lines.push(`💰 Total: ${rupees(totalCost)}`);
      }
    } else if (activityData.details) {
      // No structured materials — fall back to the caller's details text
      lines.push(activityData.details);
    }

    // Transfer route — mirrors the card's from → to section
    if (activityData.transferDetails) {
      lines.push(
        `🔁 ${activityData.transferDetails.fromProject.name} → ${activityData.transferDetails.toProject.name}`
      );
    }

    // Footer — matches the card's user attribution footer
    if (activityData.staffName) {
      lines.push(`👤 By ${activityData.staffName}`);
    }

    return { title, body: lines.join('\n') };
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