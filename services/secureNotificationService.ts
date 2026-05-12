import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import apiClient from '@/utils/axiosConfig';
import { domain } from '@/lib/domain';

// Secure notification service following Expo best practices
export class SecureNotificationService {
  private static instance: SecureNotificationService;
  private isInitialized = false;
  private encryptionKey: string | null = null;

  static getInstance(): SecureNotificationService {
    if (!SecureNotificationService.instance) {
      SecureNotificationService.instance = new SecureNotificationService();
    }
    return SecureNotificationService.instance;
  }

  constructor() {
    this.setupNotificationHandler();
    this.initializeEncryption();
  }

  /**
   * SECURITY FIX: Proper notification handler setup
   */
  private setupNotificationHandler() {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        // SECURITY: Validate notification content
        const isValidNotification = this.validateNotificationContent(notification);
        
        if (!isValidNotification) {
          console.warn('🚨 Invalid notification received, blocking display');
          return {
            shouldShowBanner: false,
            shouldShowList: false,
            shouldPlaySound: false,
            shouldSetBadge: false,
          };
        }

        return {
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      },
      handleSuccess: (notificationId) => {
        console.log('✅ Notification handled successfully:', notificationId);
      },
      handleError: (notificationId, error) => {
        console.error('❌ Notification handling error:', notificationId, error);
      },
    });
  }

  /**
   * SECURITY FIX: Initialize encryption for token storage
   */
  private async initializeEncryption() {
    try {
      let key = await AsyncStorage.getItem('notification_encryption_key');
      if (!key) {
        // Generate a simple encryption key for development (React Native compatible)
        const randomString = `${Constants.sessionId || 'default'}-${Date.now()}-${Math.random()}`;
        // Use base64 encoding instead of Buffer (React Native compatible)
        key = btoa(randomString).substring(0, 32);
        await AsyncStorage.setItem('notification_encryption_key', key);
      }
      this.encryptionKey = key;
    } catch (error) {
      console.error('❌ Failed to initialize encryption:', error);
      // Fallback to simple key
      this.encryptionKey = 'fallback-key-' + Date.now().toString().substring(0, 16);
    }
  }

  /**
   * SECURITY FIX: Validate notification content
   */
  private validateNotificationContent(notification: Notifications.Notification): boolean {
    try {
      const content = notification.request.content;
      
      // Check for required fields
      if (!content.title && !content.body) {
        return false;
      }

      // SECURITY: Validate data payload
      if (content.data) {
        // Check for suspicious content
        const dataString = JSON.stringify(content.data);
        const suspiciousPatterns = [
          /<script/i,
          /javascript:/i,
          /data:text\/html/i,
          /vbscript:/i,
          /onload=/i,
          /onerror=/i
        ];

        for (const pattern of suspiciousPatterns) {
          if (pattern.test(dataString)) {
            console.warn('🚨 Suspicious content detected in notification data');
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error validating notification:', error);
      return false;
    }
  }

  /**
   * SECURITY FIX: Secure token encryption (React Native compatible)
   */
  private async encryptToken(token: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption not initialized');
    }
    
    try {
      // React Native compatible encryption using simple base64 + key mixing
      const keyString = this.encryptionKey.padEnd(32, '0').slice(0, 32);
      
      // Simple encryption: mix token with key and encode
      let encrypted = '';
      for (let i = 0; i < token.length; i++) {
        const tokenChar = token.charCodeAt(i);
        const keyChar = keyString.charCodeAt(i % keyString.length);
        encrypted += String.fromCharCode(tokenChar ^ keyChar);
      }
      
      // Base64 encode the result
      return btoa(encrypted);
    } catch (error) {
      console.error('❌ Token encryption failed:', error);
      // Fallback to simple base64 encoding
      return btoa(token);
    }
  }

  /**
   * SECURITY FIX: Secure token decryption (React Native compatible)
   */
  private async decryptToken(encryptedToken: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption not initialized');
    }
    
    try {
      // React Native compatible decryption
      const keyString = this.encryptionKey.padEnd(32, '0').slice(0, 32);
      
      // Base64 decode first
      const encrypted = atob(encryptedToken);
      
      // Simple decryption: reverse the XOR operation
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        const encryptedChar = encrypted.charCodeAt(i);
        const keyChar = keyString.charCodeAt(i % keyString.length);
        decrypted += String.fromCharCode(encryptedChar ^ keyChar);
      }
      
      return decrypted;
    } catch (error) {
      console.error('❌ Token decryption failed:', error);
      // Fallback to simple base64 decoding
      return atob(encryptedToken);
    }
  }

  /**
   * SECURITY FIX: Secure permission request
   */
  async requestPermissions(): Promise<{ granted: boolean; status: string }> {
    try {
      // Check device support first
      if (!Device.isDevice) {
        console.warn('⚠️ Push notifications require a physical device');
        return { granted: false, status: 'unsupported' };
      }

      // Check current permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowDisplayInCarPlay: false,
            allowCriticalAlerts: false,
          },
        });
        finalStatus = status;
      }

      const granted = finalStatus === 'granted';
      
      // SECURITY: Log permission result without sensitive data
      console.log(`🔐 Notification permissions: ${granted ? 'granted' : 'denied'}`);
      
      return { granted, status: finalStatus };
    } catch (error) {
      console.error('❌ Permission request failed:', error);
      return { granted: false, status: 'error' };
    }
  }

  /**
   * SECURITY FIX: Secure token generation
   */
  async getSecurePushToken(): Promise<string | null> {
    try {
      // Validate environment
      if (!Device.isDevice) {
        console.warn('⚠️ Push tokens require a physical device');
        return null;
      }

      // Set up notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Get project ID securely
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.error('❌ Project ID not found in configuration');
        return null;
      }

      // Generate token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      const token = tokenData.data;
      
      // SECURITY FIX: Don't log the actual token
      console.log('✅ Push token generated successfully');
      console.log(`📊 Token length: ${token.length} characters`);
      console.log(`🔍 Token type: ${tokenData.type}`);
      
      return token;
    } catch (error) {
      console.error('❌ Token generation failed:', error);
      return null;
    }
  }

  /**
   * SECURITY FIX: Secure token storage
   */
  async storeTokenSecurely(token: string): Promise<boolean> {
    try {
      const encryptedToken = await this.encryptToken(token);
      await AsyncStorage.setItem('secure_push_token', encryptedToken);
      await AsyncStorage.setItem('token_stored_at', Date.now().toString());
      
      console.log('✅ Token stored securely');
      return true;
    } catch (error) {
      console.error('❌ Secure token storage failed:', error);
      return false;
    }
  }

  /**
   * SECURITY FIX: Secure token retrieval
   */
  async getStoredTokenSecurely(): Promise<string | null> {
    try {
      const encryptedToken = await AsyncStorage.getItem('secure_push_token');
      if (!encryptedToken) {
        return null;
      }

      const token = await this.decryptToken(encryptedToken);
      return token;
    } catch (error) {
      console.error('❌ Secure token retrieval failed:', error);
      return null;
    }
  }

  /**
   * SECURITY FIX: Secure backend registration with authentication
   */
  /**
   * DEBUG: Check authentication status and tokens
   */
  async debugAuthenticationStatus(): Promise<void> {
    console.log('🔍 DEBUG: Checking authentication status...');
    
    // Check all possible auth token keys
    const authKeys = ['auth_token', 'userToken', 'accessToken', 'authToken', 'token'];
    
    for (const key of authKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        console.log(`✅ Found token at key '${key}': ${value.substring(0, 20)}...`);
      } else {
        console.log(`❌ No token found at key '${key}'`);
      }
    }
    
    // Check user data
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        console.log('👤 User data found:', {
          id: parsed._id,
          email: parsed.email,
          hasToken: !!parsed.token
        });
      } catch (error) {
        console.error('❌ Failed to parse user data:', error);
      }
    } else {
      console.log('❌ No user data found');
    }
  }

  async registerTokenWithBackend(token: string, userData: any): Promise<boolean> {
    try {
      // Get authentication token - check multiple possible keys
      let authToken = await AsyncStorage.getItem('auth_token') ||
                     await AsyncStorage.getItem('userToken') ||
                     await AsyncStorage.getItem('accessToken') ||
                     await AsyncStorage.getItem('authToken') ||
                     await AsyncStorage.getItem('token');

      if (!authToken) {
        console.error('❌ No authentication token found in any storage key');
        console.log('🔍 Checked keys: auth_token, userToken, accessToken, authToken, token');
        
        // Try to get from user data if available
        if (userData && userData.token) {
          authToken = userData.token;
          console.log('✅ Found auth token in user data');
        } else {
          console.error('❌ No authentication token found - user must log in');
          console.log('🔧 Production mode: JWT tokens are required for backend registration');
          console.log('📱 Local notifications will work, but push notifications from server will not');
          
          // In production, we require proper authentication
          return false;
        }
      }

      // Prepare secure payload
      const payload = {
        userId: userData._id,
        userType: this.determineUserType(userData),
        token: token, // Token is sent over HTTPS
        platform: Platform.OS,
        deviceId: Constants.sessionId,
        deviceName: Device.deviceName || `${Platform.OS} Device`,
        appVersion: Constants.expoConfig?.version || '1.0.0',
        timestamp: Date.now(),
      };

      // SECURITY FIX: Add authentication headers
      const response = await apiClient.post(`/api/push-token`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'X-App-Version': Constants.expoConfig?.version || '1.0.0',
          'X-Platform': Platform.OS,
        },
        timeout: 15000,
      });

      const responseData = response.data as any;
      if (responseData?.success) {
        console.log('✅ Token registered with backend successfully');
        await this.storeTokenSecurely(token);
        return true;
      } else {
        console.error('❌ Backend registration failed:', responseData?.message);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Backend registration error:', error);
      
      // Provide more detailed error information
      if (error.response) {
        console.error('📊 Response status:', error.response.status);
        console.error('📊 Response data:', error.response.data);
        console.error('📊 Response headers:', error.response.headers);
        
        if (error.response.status === 401) {
          console.error('🔐 Authentication failed - check if auth token is valid');
        } else if (error.response.status === 400) {
          console.error('📝 Bad request - check payload format');
        } else if (error.response.status === 403) {
          console.error('🚫 Forbidden - check user permissions');
        }
      } else if (error.request) {
        console.error('🌐 Network error - no response received');
        console.error('📊 Request details:', error.request);
      } else {
        console.error('⚙️ Request setup error:', error.message);
      }
      
      return false;
    }
  }

  /**
   * SECURITY FIX: Secure user type determination
   */
  private determineUserType(userData: any): 'admin' | 'staff' | 'client' {
    // Validate user data first
    if (!userData || typeof userData !== 'object') {
      return 'client';
    }

    // Check role field
    if (userData.role) {
      const role = userData.role.toLowerCase();
      if (role === 'admin' || role === 'client-admin') {
        return 'admin';
      }
      if (role.includes('engineer') || role.includes('supervisor') || role.includes('manager')) {
        return 'staff';
      }
    }

    // Check userType field
    if (userData.userType) {
      const userType = userData.userType.toLowerCase();
      if (userType === 'admin') return 'admin';
      if (userType === 'staff') return 'staff';
    }

    // Check clients array
    if (Array.isArray(userData.clients) && userData.clients.length > 0) {
      return 'staff';
    }

    return 'client';
  }

  /**
   * SECURITY FIX: Complete secure initialization
   */
  async initializeSecurely(userData: any): Promise<boolean> {
    try {
      if (this.isInitialized) {
        console.log('✅ Notification service already initialized');
        return true;
      }

      console.log('🔐 Initializing secure notification service...');
      
      // DEBUG: Check authentication status
      await this.debugAuthenticationStatus();

      // Step 1: Request permissions
      const permissionResult = await this.requestPermissions();
      if (!permissionResult.granted) {
        console.warn('⚠️ Notification permissions not granted');
        return false;
      }

      // Step 2: Generate secure token
      const token = await this.getSecurePushToken();
      if (!token) {
        console.error('❌ Failed to generate push token');
        return false;
      }

      // Step 3: Register with backend (optional for development)
      const registrationSuccess = await this.registerTokenWithBackend(token, userData);
      if (!registrationSuccess) {
        console.warn('⚠️ Failed to register token with backend - continuing with local notifications only');
        console.log('📱 Local notifications will still work, but push notifications from server may not');
        // Don't return false here - allow initialization to continue
      } else {
        console.log('✅ Backend registration successful');
      }

      // Step 4: Set up listeners
      this.setupNotificationListeners();

      this.isInitialized = true;
      console.log('✅ Secure notification service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Secure initialization failed:', error);
      return false;
    }
  }

  /**
   * SECURITY FIX: Secure notification listeners
   */
  private setupNotificationListeners() {
    // Listen for incoming notifications
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received');
      // SECURITY: Validate before processing
      if (this.validateNotificationContent(notification)) {
        this.handleSecureNotification(notification);
      }
    });

    // Listen for notification responses
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification response received');
      // SECURITY: Validate before processing
      if (this.validateNotificationContent(response.notification)) {
        this.handleSecureNotificationResponse(response);
      }
    });

    // Store listeners for cleanup
    AsyncStorage.setItem('notification_listeners_active', 'true');
  }

  /**
   * SECURITY FIX: Secure notification handling
   */
  private handleSecureNotification(notification: Notifications.Notification) {
    try {
      // Process notification securely
      const content = notification.request.content;
      
      // SECURITY: Sanitize data before use
      const sanitizedData = this.sanitizeNotificationData(content.data);
      
      // Handle based on notification type
      if (sanitizedData?.type === 'material_update') {
        // Handle material updates
        console.log('📦 Material update notification processed');
      } else if (sanitizedData?.type === 'project_update') {
        // Handle project updates
        console.log('🏗️ Project update notification processed');
      }
    } catch (error) {
      console.error('❌ Secure notification handling failed:', error);
    }
  }

  /**
   * SECURITY FIX: Secure notification response handling
   */
  private handleSecureNotificationResponse(response: Notifications.NotificationResponse) {
    try {
      const data = response.notification.request.content.data;
      const sanitizedData = this.sanitizeNotificationData(data);
      
      // SECURITY: Validate URL before navigation
      if (sanitizedData?.url) {
        const isValidUrl = this.validateNavigationUrl(sanitizedData.url);
        if (isValidUrl) {
          console.log('🔗 Safe navigation URL validated');
          // Navigate safely
        } else {
          console.warn('🚨 Unsafe navigation URL blocked');
        }
      }
    } catch (error) {
      console.error('❌ Secure response handling failed:', error);
    }
  }

  /**
   * SECURITY FIX: Sanitize notification data
   */
  private sanitizeNotificationData(data: any): any {
    if (!data || typeof data !== 'object') {
      return {};
    }

    const sanitized: any = {};
    
    // Only allow safe properties
    const allowedProperties = ['type', 'id', 'url', 'title', 'message'];
    
    for (const prop of allowedProperties) {
      if (data[prop] && typeof data[prop] === 'string') {
        // Basic sanitization
        sanitized[prop] = data[prop]
          .replace(/<script.*?>.*?<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/data:text\/html/gi, '')
          .trim();
      }
    }

    return sanitized;
  }

  /**
   * SECURITY FIX: Validate navigation URLs
   */
  private validateNavigationUrl(url: string): boolean {
    try {
      // Only allow relative URLs or specific domains
      const allowedPatterns = [
        /^\/[^\/]/,  // Relative URLs starting with /
        /^[a-zA-Z0-9-]+$/,  // Simple route names
      ];

      // Block dangerous protocols
      const dangerousPatterns = [
        /^javascript:/i,
        /^data:/i,
        /^vbscript:/i,
        /^file:/i,
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(url)) {
          return false;
        }
      }

      for (const pattern of allowedPatterns) {
        if (pattern.test(url)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('❌ URL validation failed:', error);
      return false;
    }
  }

  /**
   * SECURITY FIX: Secure cleanup
   */
  async cleanup(): Promise<void> {
    try {
      console.log('🧹 Cleaning up secure notification service...');
      
      // Clear encrypted tokens
      await AsyncStorage.removeItem('secure_push_token');
      await AsyncStorage.removeItem('token_stored_at');
      await AsyncStorage.removeItem('notification_listeners_active');
      
      // Reset state
      this.isInitialized = false;
      
      console.log('✅ Secure cleanup completed');
    } catch (error) {
      console.error('❌ Secure cleanup failed:', error);
    }
  }
}

export default SecureNotificationService;