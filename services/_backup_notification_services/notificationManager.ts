import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationPermissions from './notificationPermissions';
import PushTokenService from './pushTokenService';

// Local notification interface for the notification list
export interface LocalNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  timestamp: Date;
  isRead: boolean;
  source: 'push' | 'local' | 'backend';
}

/**
 * Centralized notification manager that handles the complete notification setup flow
 * This service coordinates permissions, push token registration, and initialization
 * Also manages local notification storage and display
 */
class NotificationManager {
  private static instance: NotificationManager;
  private permissionService: NotificationPermissions;
  private pushTokenService: PushTokenService;
  private isInitialized: boolean = false;
  
  // Local notification management
  private notifications: LocalNotification[] = [];
  private listeners: ((notifications: LocalNotification[]) => void)[] = [];
  private storageKey = 'local_notifications';

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  constructor() {
    this.permissionService = NotificationPermissions.getInstance();
    this.pushTokenService = PushTokenService.getInstance();
    
    // Load existing notifications asynchronously (don't await in constructor)
    this.loadNotifications().catch(error => {
      console.error('❌ Error loading notifications in constructor:', error);
    });
  }

  /**
   * Initialize push notifications after user login
   * This is the main method to call after successful authentication
   */
  async initializePushNotifications(showPermissionDialog: boolean = true): Promise<boolean> {
    try {
      console.log('🔔 Initializing push notification system...');

      // PRODUCTION FIX: Check if this is a fresh installation
      const isFresh = await this.isFreshInstallation();
      if (isFresh) {
        console.log('🆕 Fresh installation detected, clearing any residual data');
        await this.clearAllNotificationData();
      }

      // Check if user is logged in
      const userData = await this.getUserData();
      if (!userData) {
        console.log('⚠️ No user data found, skipping notification initialization');
        return false;
      }

      console.log('👤 User found:', {
        id: userData._id,
        email: userData.email,
        userType: userData.userType || 'unknown'
      });

      // Check device support first
      const deviceSupport = await this.permissionService.isDeviceSupported();
      if (!deviceSupport.supported) {
        console.log('⚠️ Device not supported for push notifications:', deviceSupport.reason);
        
        // Store that we checked (so we don't keep asking)
        await AsyncStorage.setItem('notificationSetupChecked', 'true');
        await AsyncStorage.setItem('notificationSetupResult', 'device_not_supported');
        await AsyncStorage.setItem('notificationSetupTimestamp', new Date().toISOString());
        
        return false;
      }

      console.log('✅ Device supports push notifications');

      // PRODUCTION FIX: Always check current permission status first
      const currentPermissionStatus = await this.permissionService.getPermissionStatus();
      console.log('🔐 Current permission status:', currentPermissionStatus);

      if (!currentPermissionStatus.granted) {
        // Check if we can ask for permissions
        if (!currentPermissionStatus.canAskAgain) {
          console.log('❌ Cannot ask for permissions again - user denied permanently');
          
          if (showPermissionDialog) {
            // Show settings prompt
            console.log('📱 Showing settings prompt...');
            // The permission service will handle showing the settings prompt
          }
          
          // Store the result
          await AsyncStorage.setItem('notificationSetupChecked', 'true');
          await AsyncStorage.setItem('notificationSetupResult', 'permission_denied_permanently');
          await AsyncStorage.setItem('notificationSetupTimestamp', new Date().toISOString());
          
          return false;
        }

        if (showPermissionDialog) {
          console.log('📱 Requesting notification permissions...');
          
          // Request permissions with user-friendly dialog
          const permissionStatus = await this.permissionService.requestPermissions(true);
          
          if (!permissionStatus.granted) {
            console.log('❌ Permissions not granted:', permissionStatus.status);
            
            // Store the result
            await AsyncStorage.setItem('notificationSetupChecked', 'true');
            await AsyncStorage.setItem('notificationSetupResult', 'permission_denied');
            await AsyncStorage.setItem('notificationSetupTimestamp', new Date().toISOString());
            
            return false;
          }
          
          console.log('✅ Permissions granted!');
        } else {
          console.log('⚠️ Permissions not granted and not showing dialog');
          return false;
        }
      } else {
        console.log('✅ Permissions already granted');
      }

      // Initialize push token service
      console.log('🎫 Initializing push token service...');
      const tokenSuccess = await this.pushTokenService.initialize(false); // Don't show dialog again
      
      if (tokenSuccess) {
        console.log('✅ Push notification system initialized successfully!');
        
        // Store successful setup
        await AsyncStorage.setItem('notificationSetupChecked', 'true');
        await AsyncStorage.setItem('notificationSetupResult', 'success');
        await AsyncStorage.setItem('notificationSetupTimestamp', new Date().toISOString());
        
        this.isInitialized = true;
        return true;
      } else {
        console.log('❌ Failed to initialize push token service');
        
        // Store the failure
        await AsyncStorage.setItem('notificationSetupChecked', 'true');
        await AsyncStorage.setItem('notificationSetupResult', 'token_registration_failed');
        await AsyncStorage.setItem('notificationSetupTimestamp', new Date().toISOString());
        
        return false;
      }

    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
      
      // Store the error
      await AsyncStorage.setItem('notificationSetupChecked', 'true');
      await AsyncStorage.setItem('notificationSetupResult', 'error');
      await AsyncStorage.setItem('notificationSetupTimestamp', new Date().toISOString());
      
      return false;
    }
  }

  /**
   * Check if notification setup should be attempted
   * Returns false if we've already tried recently or if it's not appropriate
   */
  async shouldAttemptSetup(): Promise<boolean> {
    try {
      // PRODUCTION FIX: Always allow setup attempt if user just logged in
      // Check if this is a fresh login (within last 5 minutes)
      const loginTimestamp = await AsyncStorage.getItem('loginTimestamp');
      if (loginTimestamp) {
        const loginTime = parseInt(loginTimestamp);
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        
        if (loginTime > fiveMinutesAgo) {
          console.log('🆕 Fresh login detected, allowing notification setup');
          return true;
        }
      }

      // Check if we've already attempted setup recently
      const setupChecked = await AsyncStorage.getItem('notificationSetupChecked');
      const setupResult = await AsyncStorage.getItem('notificationSetupResult');
      const setupTimestamp = await AsyncStorage.getItem('notificationSetupTimestamp');

      if (setupChecked === 'true') {
        // If setup was successful, check if permissions are still granted
        if (setupResult === 'success') {
          console.log('✅ Notification setup was successful, checking current permissions...');
          
          // Verify permissions are still granted
          const currentStatus = await this.permissionService.getPermissionStatus();
          if (currentStatus.granted) {
            console.log('✅ Permissions still granted, skipping setup');
            return false;
          } else {
            console.log('⚠️ Permissions were revoked, allowing re-setup');
            return true;
          }
        }

        // If setup failed due to device support, don't try again (unless it's been a long time)
        if (setupResult === 'device_not_supported') {
          if (setupTimestamp) {
            const lastAttempt = new Date(setupTimestamp);
            const now = new Date();
            const daysSinceLastAttempt = (now.getTime() - lastAttempt.getTime()) / (1000 * 60 * 60 * 24);
            
            if (daysSinceLastAttempt < 7) {
              console.log('⚠️ Device not supported, skipping setup');
              return false;
            } else {
              console.log('🔄 Device support check is old, allowing retry');
              return true;
            }
          }
        }

        // If setup was attempted recently (within 1 hour), don't try again
        // REDUCED from 24 hours to 1 hour for better user experience
        if (setupTimestamp) {
          const lastAttempt = new Date(setupTimestamp);
          const now = new Date();
          const hoursSinceLastAttempt = (now.getTime() - lastAttempt.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLastAttempt < 1) {
            console.log(`⏰ Setup attempted ${Math.round(hoursSinceLastAttempt * 60)} minutes ago, skipping`);
            return false;
          } else {
            console.log(`🔄 Setup was ${Math.round(hoursSinceLastAttempt)} hours ago, allowing retry`);
          }
        }
      }

      // Check if user is logged in
      const userData = await this.getUserData();
      if (!userData) {
        console.log('⚠️ No user data, cannot attempt setup');
        return false;
      }

      console.log('✅ Conditions met, allowing notification setup attempt');
      return true;
    } catch (error) {
      console.error('❌ Error checking setup status:', error);
      return true; // Allow attempt on error
    }
  }

  /**
   * Reset notification setup status (for testing or when user wants to try again)
   */
  async resetSetupStatus(): Promise<void> {
    try {
      await AsyncStorage.removeItem('notificationSetupChecked');
      await AsyncStorage.removeItem('notificationSetupResult');
      await AsyncStorage.removeItem('notificationSetupTimestamp');
      this.isInitialized = false;
      console.log('🔄 Notification setup status reset');
    } catch (error) {
      console.error('❌ Error resetting setup status:', error);
    }
  }

  /**
   * PRODUCTION FIX: Force clear all notification data on fresh app start
   * This handles the AsyncStorage persistence issue after app uninstall/reinstall
   */
  async clearAllNotificationData(): Promise<void> {
    try {
      console.log('🧹 Clearing all notification data...');
      
      const keysToRemove = [
        'notificationSetupChecked',
        'notificationSetupResult', 
        'notificationSetupTimestamp',
        'pushToken',
        'pushTokenRegistered',
        'pushTokenRegistrationTime',
        'local_notifications'
      ];
      
      await Promise.all(keysToRemove.map(key => 
        AsyncStorage.removeItem(key).catch(err => 
          console.warn(`⚠️ Failed to remove ${key}:`, err)
        )
      ));
      
      this.isInitialized = false;
      this.notifications = [];
      
      console.log('✅ All notification data cleared');
    } catch (error) {
      console.error('❌ Error clearing notification data:', error);
    }
  }

  /**
   * Check if this is a fresh app installation (no previous notification data)
   */
  async isFreshInstallation(): Promise<boolean> {
    try {
      const setupChecked = await AsyncStorage.getItem('notificationSetupChecked');
      const pushTokenRegistered = await AsyncStorage.getItem('pushTokenRegistered');
      const loginTimestamp = await AsyncStorage.getItem('loginTimestamp');
      
      // If no notification-related data exists, it's likely a fresh install
      const hasNoNotificationData = !setupChecked && !pushTokenRegistered;
      
      // If login timestamp is very recent (within 2 minutes), it might be a fresh install
      let isRecentLogin = false;
      if (loginTimestamp) {
        const loginTime = parseInt(loginTimestamp);
        const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
        isRecentLogin = loginTime > twoMinutesAgo;
      }
      
      const isFresh = hasNoNotificationData || isRecentLogin;
      console.log('🔍 Fresh installation check:', {
        hasNoNotificationData,
        isRecentLogin,
        isFresh
      });
      
      return isFresh;
    } catch (error) {
      console.error('❌ Error checking fresh installation:', error);
      return true; // Assume fresh on error
    }
  }

  /**
   * Get notification setup status for display
   */
  async getSetupStatus(): Promise<{
    checked: boolean;
    result: string | null;
    timestamp: string | null;
    canRetry: boolean;
  }> {
    try {
      const checked = await AsyncStorage.getItem('notificationSetupChecked') === 'true';
      const result = await AsyncStorage.getItem('notificationSetupResult');
      const timestamp = await AsyncStorage.getItem('notificationSetupTimestamp');
      
      // Can retry if it's been more than 24 hours or if it failed due to permissions
      let canRetry = false;
      if (checked && result !== 'success' && result !== 'device_not_supported') {
        if (timestamp) {
          const lastAttempt = new Date(timestamp);
          const now = new Date();
          const hoursSinceLastAttempt = (now.getTime() - lastAttempt.getTime()) / (1000 * 60 * 60);
          canRetry = hoursSinceLastAttempt >= 24;
        } else {
          canRetry = true;
        }
      }

      return {
        checked,
        result,
        timestamp,
        canRetry
      };
    } catch (error) {
      console.error('❌ Error getting setup status:', error);
      return {
        checked: false,
        result: null,
        timestamp: null,
        canRetry: true
      };
    }
  }

  /**
   * Cleanup notifications when user logs out
   */
  async cleanup(): Promise<void> {
    try {
      console.log('🧹 Cleaning up notification system...');
      
      // Unregister push token
      await this.pushTokenService.unregisterPushToken();
      
      // Clear setup status
      await this.resetSetupStatus();
      
      this.isInitialized = false;
      
      console.log('✅ Notification system cleaned up');
    } catch (error) {
      console.error('❌ Error cleaning up notifications:', error);
    }
  }

  /**
   * Get user data from AsyncStorage
   */
  private async getUserData(): Promise<any | null> {
    try {
      const userDetailsString = await AsyncStorage.getItem("user");
      if (userDetailsString) {
        return JSON.parse(userDetailsString);
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting user data:', error);
      return null;
    }
  }

  /**
   * Check if notifications are fully set up and working
   */
  async isFullySetup(): Promise<boolean> {
    try {
      // Check if we're initialized
      if (!this.isInitialized) {
        return false;
      }

      // Check if permissions are granted
      const permissionStatus = await this.permissionService.getPermissionStatus();
      if (!permissionStatus.granted) {
        return false;
      }

      // Check if push token is registered
      const isTokenRegistered = await this.pushTokenService.isTokenRegistered();
      if (!isTokenRegistered) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error checking setup status:', error);
      return false;
    }
  }

  /**
   * Get permission service for direct access
   */
  getPermissionService(): NotificationPermissions {
    return this.permissionService;
  }

  /**
   * Get push token service for direct access
   */
  getPushTokenService(): PushTokenService {
    return this.pushTokenService;
  }

  /**
   * Request notification permissions (for useNotifications hook compatibility)
   */
  async requestPermissions(): Promise<any> {
    return await this.permissionService.requestPermissions();
  }

  /**
   * Get push token (for useNotifications hook compatibility)
   */
  async getPushToken(): Promise<string | null> {
    return await this.pushTokenService.getCurrentToken();
  }

  /**
   * Test the complete notification system
   */
  async testSystem(): Promise<void> {
    console.log('🧪 Testing complete notification system...');
    
    const userData = await this.getUserData();
    console.log('👤 User data:', userData ? 'Found' : 'Not found');
    
    const deviceSupport = await this.permissionService.isDeviceSupported();
    console.log('📱 Device support:', deviceSupport);
    
    const permissionStatus = await this.permissionService.getPermissionStatus();
    console.log('🔐 Permission status:', permissionStatus);
    
    const shouldAttempt = await this.shouldAttemptSetup();
    console.log('❓ Should attempt setup:', shouldAttempt);
    
    const setupStatus = await this.getSetupStatus();
    console.log('📊 Setup status:', setupStatus);
    
    const isFullySetup = await this.isFullySetup();
    console.log('✅ Fully setup:', isFullySetup);
    
    if (isFullySetup) {
      console.log('🎉 Notification system is fully operational!');
    } else {
      console.log('⚠️ Notification system needs setup or has issues');
    }
  }

  // ============================================================================
  // LOCAL NOTIFICATION MANAGEMENT METHODS
  // ============================================================================

  /**
   * Load notifications from AsyncStorage
   */
  private async loadNotifications(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
      }
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
      this.notifications = [];
    }
  }

  /**
   * Save notifications to AsyncStorage
   */
  private async saveNotifications(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.notifications));
    } catch (error) {
      console.error('❌ Error saving notifications:', error);
    }
  }

  /**
   * Notify all listeners of notification updates
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener([...this.notifications]);
      } catch (error) {
        console.error('❌ Error notifying listener:', error);
      }
    });
  }

  /**
   * Add a new notification
   */
  async addNotification(notification: Omit<LocalNotification, 'id' | 'timestamp'>): Promise<string> {
    const newNotification: LocalNotification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };

    this.notifications.unshift(newNotification);
    
    // Keep only the last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    await this.saveNotifications();
    this.notifyListeners();
    
    console.log('📱 Added local notification:', newNotification.title);
    return newNotification.id;
  }

  /**
   * Schedule a local notification (for testing and fallback)
   */
  async scheduleLocalNotification(title: string, body: string, data?: any): Promise<string> {
    return await this.addNotification({
      title,
      body,
      data,
      isRead: false,
      source: 'local'
    });
  }

  /**
   * Get all notifications
   */
  getNotifications(): LocalNotification[] {
    return [...this.notifications];
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === id);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      await this.saveNotifications();
      this.notifyListeners();
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    let changed = false;
    this.notifications.forEach(notification => {
      if (!notification.isRead) {
        notification.isRead = true;
        changed = true;
      }
    });

    if (changed) {
      await this.saveNotifications();
      this.notifyListeners();
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<void> {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      await this.saveNotifications();
      this.notifyListeners();
    }
  }

  /**
   * Clear all notifications
   */
  async clearAll(): Promise<void> {
    this.notifications = [];
    await this.saveNotifications();
    this.notifyListeners();
  }

  /**
   * Subscribe to notification updates
   */
  subscribe(listener: (notifications: LocalNotification[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Update badge count (for iOS)
   */
  async updateBadgeCount(): Promise<void> {
    try {
      const unreadCount = this.getUnreadCount();
      
      // Try to import expo-notifications for badge update
      try {
        const Notifications = require('expo-notifications');
        if (Notifications.setBadgeCountAsync) {
          await Notifications.setBadgeCountAsync(unreadCount);
        }
      } catch (error) {
        // Expo notifications not available, skip badge update
      }
    } catch (error) {
      console.error('❌ Error updating badge count:', error);
    }
  }

  /**
   * Handle incoming push notification (add to local storage)
   */
  async handleIncomingPushNotification(notification: {
    title: string;
    body: string;
    data?: any;
  }): Promise<void> {
    await this.addNotification({
      title: notification.title,
      body: notification.body,
      data: notification.data,
      isRead: false,
      source: 'push'
    });
  }

  /**
   * Handle backend notification (add to local storage)
   */
  async handleBackendNotification(notification: {
    title: string;
    body: string;
    data?: any;
  }): Promise<void> {
    await this.addNotification({
      title: notification.title,
      body: notification.body,
      data: notification.data,
      isRead: false,
      source: 'backend'
    });
  }
}

export default NotificationManager;