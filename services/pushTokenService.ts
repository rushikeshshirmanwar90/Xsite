import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import axios from 'axios';
import { domain } from '@/lib/domain';
import NotificationPermissions from './notificationPermissions';

// Check if we're in Expo Go (using newer method)
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Dynamic imports to avoid loading expo-notifications in Expo Go on Android
let Notifications: any = null;
let Device: any = null;

// Only import if not in Expo Go on Android
if (!(isExpoGo && Platform.OS === 'android')) {
  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
  } catch (error) {
    console.warn('Failed to load notification modules:', error);
  }
}

export interface PushTokenData {
  userId: string;
  userType: 'admin' | 'staff' | 'client';
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId?: string;
  deviceName?: string;
  appVersion?: string;
}

export interface UserData {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role?: string;
  userType?: string;
  clients?: Array<{ clientId: string; clientName: string }>;
}

// API Response types
interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface PushTokenResponse extends ApiResponse {
  data?: {
    tokenId: string;
    isNew: boolean;
  };
}

class PushTokenService {
  private static instance: PushTokenService;
  private currentToken: string | null = null;
  private isRegistering: boolean = false;
  private permissionService: NotificationPermissions;

  static getInstance(): PushTokenService {
    if (!PushTokenService.instance) {
      PushTokenService.instance = new PushTokenService();
    }
    return PushTokenService.instance;
  }

  constructor() {
    this.permissionService = NotificationPermissions.getInstance();
  }

  /**
   * Initialize push token registration
   * Call this when the app starts and user is logged in
   */
  async initialize(showPermissionDialog: boolean = true): Promise<boolean> {
    try {
      console.log('🔔 Initializing push token service...');

      // Check device support
      const deviceSupport = await this.permissionService.isDeviceSupported();
      if (!deviceSupport.supported) {
        console.log('⚠️ Device not supported:', deviceSupport.reason);
        return false;
      }

      // Get user data
      const userData = await this.getUserData();
      if (!userData) {
        console.log('⚠️ No user data found, skipping push token registration');
        return false;
      }

      // Request permissions with user-friendly dialog
      const permissionStatus = await this.permissionService.requestPermissions(showPermissionDialog);
      if (!permissionStatus.granted) {
        console.log('⚠️ Push notification permissions not granted:', permissionStatus.status);
        return false;
      }

      // Get and register push token
      const success = await this.registerPushToken(userData);
      if (success) {
        console.log('✅ Push token service initialized successfully');
        
        // Set up token refresh listener
        this.setupTokenRefreshListener();
        
        return true;
      } else {
        console.log('❌ Failed to register push token');
        return false;
      }

    } catch (error) {
      console.error('❌ Error initializing push token service:', error);
      return false;
    }
  }

  /**
   * Get push notification token
   */
  private async getPushToken(): Promise<string | null> {
    if (!Notifications) {
      console.warn('Notifications module not available');
      return null;
    }

    try {
      // EXPO FIX: Use Expo's push notification service directly
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                        Constants.expoConfig?.projectId || 
                        '2fcc4ccc-b8b5-4ff4-ae3c-b195aa9eb32f';

      console.log('📱 Getting Expo push notification data:', {
        projectId: projectId.substring(0, 8) + '...',
        executionEnvironment: Constants.executionEnvironment,
        isExpoGo: Constants.executionEnvironment === 'storeClient'
      });

      // Use Expo's push notification service (no Firebase required)
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      const token = tokenData.data;
      // SECURITY FIX: Don't log actual token
      console.log('✅ Got Expo push token successfully');
      console.log(`📊 Token length: ${token.length} characters`);
      console.log(`🔍 Token type: ${tokenData.type}`);
      
      this.currentToken = token;
      return token;
    } catch (error) {
      console.error('❌ Error getting push token:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Try alternative method without projectId
      try {
        console.log('🔄 Trying alternative token generation method...');
        const tokenData = await Notifications.getExpoPushTokenAsync();
        const token = tokenData.data;
        // SECURITY FIX: Don't log actual token
        console.log('✅ Got push token (alternative method) successfully');
        console.log(`📊 Token length: ${token.length} characters`);
        this.currentToken = token;
        return token;
      } catch (alternativeError) {
        console.error('❌ Alternative method also failed:', alternativeError);
        return null;
      }
    }
  }

  /**
   * Get user data from AsyncStorage
   */
  private async getUserData(): Promise<UserData | null> {
    try {
      const userDetailsString = await AsyncStorage.getItem("user");
      if (userDetailsString) {
        const userData = JSON.parse(userDetailsString);
        console.log('👤 User data found:', {
          id: userData._id,
          email: userData.email,
          role: userData.role,
          userType: userData.userType,
          clientsCount: userData.clients?.length || 0
        });
        return userData;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting user data:', error);
      return null;
    }
  }

  /**
   * Determine user type based on user data
   */
  private determineUserType(userData: UserData): 'admin' | 'staff' | 'client' {
    // Check if user has role field
    if (userData.role) {
      if (userData.role === 'admin' || userData.role === 'client-admin') {
        return 'admin';
      }
      if (userData.role === 'staff' || userData.role.includes('engineer') || 
          userData.role.includes('supervisor') || userData.role.includes('manager')) {
        return 'staff';
      }
    }

    // Check if user has userType field
    if (userData.userType) {
      if (userData.userType === 'admin') return 'admin';
      if (userData.userType === 'staff') return 'staff';
      if (userData.userType === 'client') return 'client';
    }

    // Check if user has clients array (staff members have this)
    if (userData.clients && Array.isArray(userData.clients) && userData.clients.length > 0) {
      return 'staff';
    }

    // Default to client
    return 'client';
  }

  /**
   * Get device information
   */
  private getDeviceInfo() {
    const platform = Platform.OS as 'ios' | 'android';
    const deviceId = Constants.sessionId || Constants.installationId || 'unknown';
    const deviceName = Device?.deviceName || `${Platform.OS} Device`;
    const appVersion = Constants.expoConfig?.version || '1.0.0';

    return {
      platform,
      deviceId,
      deviceName,
      appVersion
    };
  }

  /**
   * Register push token with backend
   */
  async registerPushToken(userData: UserData): Promise<boolean> {
    if (this.isRegistering) {
      console.log('⏳ Push token registration already in progress...');
      return false;
    }

    this.isRegistering = true;

    try {
      console.log('📤 Registering push token with backend...');

      // Get push token with retry logic
      let token = await this.getPushToken();
      if (!token) {
        console.log('❌ No push token available, retrying...');
        // Retry once after 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));
        token = await this.getPushToken();
        if (!token) {
          console.log('❌ Still no push token after retry');
          return false;
        }
      }

      // Get device info
      const deviceInfo = this.getDeviceInfo();
      const userType = this.determineUserType(userData);

      // Prepare registration payload
      const payload: PushTokenData = {
        userId: userData._id,
        userType: userType,
        token: token,
        platform: deviceInfo.platform,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        appVersion: deviceInfo.appVersion
      };

      console.log('📋 Push notification registration payload:', {
        userId: payload.userId,
        userType: payload.userType,
        platform: payload.platform,
        deviceId: payload.deviceId,
        deviceName: payload.deviceName,
        appVersion: payload.appVersion,
        // SECURITY FIX: Don't log actual token
        tokenLength: token.length,
        backendUrl: domain.substring(0, 30) + '...'
      });

      // SECURITY FIX: Add authentication headers
      const response = await axios.post(`${domain}/api/push-token`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'X-App-Version': Constants.expoConfig?.version || '1.0.0',
          'X-Platform': Platform.OS,
        },
        timeout: 15000 // Increased timeout for production
      });

      const responseData = response!.data as PushTokenResponse;
      if (responseData.success) {
        console.log('✅ Push notification registered successfully:', responseData.message);
        
        // Store token locally for future reference
        await AsyncStorage.setItem('pushToken', token);
        await AsyncStorage.setItem('pushTokenRegistered', 'true');
        await AsyncStorage.setItem('pushTokenRegistrationTime', Date.now().toString());
        
        return true;
      } else {
        console.log('❌ Push notification registration failed:', responseData.message);
        return false;
      }

    } catch (error: any) {
      console.error('❌ Error registering push token:', error);
      if (error.response) {
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response data:', error.response.data);
      }
      return false;
    } finally {
      this.isRegistering = false;
    }
  }

  /**
   * Setup token refresh listener
   * Tokens can change, so we need to re-register when they do
   */
  private setupTokenRefreshListener() {
    if (!Notifications) {
      return;
    }

    try {
      // Listen for token updates
      const subscription = Notifications.addPushTokenListener(async (tokenData: any) => {
        // SECURITY FIX: Don't log actual token
        console.log('🔄 Push notification updated successfully');
        console.log(`📊 New data length: ${tokenData.data.length} characters`);
        
        const userData = await this.getUserData();
        if (userData) {
          await this.registerPushToken(userData);
        }
      });

      console.log('👂 Push token refresh listener setup');
      return subscription;
    } catch (error) {
      console.error('❌ Error setting up token refresh listener:', error);
    }
  }

  /**
   * SECURITY FIX: Get authentication token
   */
  private async getAuthToken(): Promise<string> {
    try {
      const authToken = await AsyncStorage.getItem('auth_token') || 
                       await AsyncStorage.getItem('userToken') ||
                       await AsyncStorage.getItem('accessToken');
      
      if (!authToken) {
        throw new Error('No authentication token found');
      }
      
      return authToken;
    } catch (error) {
      console.error('❌ Failed to get auth token:', error);
      throw new Error('Authentication required for push token registration');
    }
  }

  /**
   * Unregister push token (call when user logs out)
   */
  async unregisterPushToken(): Promise<boolean> {
    try {
      console.log('🗑️ Unregistering push token...');

      const userData = await this.getUserData();
      if (!userData) {
        console.log('⚠️ No user data found for unregistration');
        return false;
      }

      // Deactivate token on backend
      const response = await axios.delete(`${domain}/api/push-token?userId=${userData._id}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });

      const responseData = response.data as ApiResponse;
      if (responseData.success) {
        console.log('✅ Push token unregistered successfully');
        
        // Clear local storage
        await AsyncStorage.removeItem('pushToken');
        await AsyncStorage.removeItem('pushTokenRegistered');
        
        this.currentToken = null;
        return true;
      } else {
        console.log('❌ Push notification unregistration failed:', responseData.message);
        return false;
      }

    } catch (error: any) {
      console.error('❌ Error unregistering push token:', error);
      return false;
    }
  }

  /**
   * Check if push token is registered
   */
  async isTokenRegistered(): Promise<boolean> {
    try {
      const registered = await AsyncStorage.getItem('pushTokenRegistered');
      return registered === 'true';
    } catch (error) {
      console.error('❌ Error checking token registration status:', error);
      return false;
    }
  }

  /**
   * Get current push token
   */
  getCurrentToken(): string | null {
    return this.currentToken;
  }

  /**
   * Force re-registration of push token
   */
  async forceReregister(): Promise<boolean> {
    console.log('🔄 Force re-registering push token...');
    
    const userData = await this.getUserData();
    if (!userData) {
      console.log('❌ No user data found for re-registration');
      return false;
    }

    return await this.registerPushToken(userData);
  }

  /**
   * Get permission service instance
   */
  getPermissionService(): NotificationPermissions {
    return this.permissionService;
  }

  /**
   * Check if permissions are granted
   */
  async hasPermissions(): Promise<boolean> {
    const status = await this.permissionService.getPermissionStatus();
    return status.granted;
  }

  /**
   * Request permissions manually
   */
  async requestPermissions(showDialog: boolean = true): Promise<boolean> {
    const status = await this.permissionService.requestPermissions(showDialog);
    return status.granted;
  }

  /**
   * Test push token registration
   */
  async testRegistration(): Promise<void> {
    console.log('🧪 Testing push token registration...');
    
    const userData = await this.getUserData();
    if (!userData) {
      console.log('❌ No user data found for testing');
      return;
    }

    console.log('👤 User data:', {
      id: userData._id,
      email: userData.email,
      userType: this.determineUserType(userData)
    });

    const deviceInfo = this.getDeviceInfo();
    console.log('📱 Device info:', deviceInfo);

    const hasPermission = await this.hasPermissions();
    console.log('🔐 Has permission:', hasPermission);

    if (hasPermission) {
      const token = await this.getPushToken();
      console.log('🎫 Notification data available:', !!token);
      
      if (token) {
        // SECURITY FIX: Don't log actual token
        console.log('🎫 Data length:', token.length, 'characters');
      }
    }
  }
}

export default PushTokenService;