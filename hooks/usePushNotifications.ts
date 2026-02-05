import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import PushTokenService from '@/services/pushTokenService';
import NotificationPermissions, { PermissionStatus } from '@/services/notificationPermissions';

export interface PushNotificationStatus {
  isInitialized: boolean;
  isRegistered: boolean;
  hasPermission: boolean;
  permissionStatus: PermissionStatus | null;
  token: string | null;
  error: string | null;
  isLoading: boolean;
  deviceSupported: boolean;
}

/**
 * Hook for managing push notifications
 * Automatically handles token registration and app state changes
 */
export const usePushNotifications = () => {
  const [status, setStatus] = useState<PushNotificationStatus>({
    isInitialized: false,
    isRegistered: false,
    hasPermission: false,
    permissionStatus: null,
    token: null,
    error: null,
    isLoading: true,
    deviceSupported: false,
  });

  const pushTokenService = PushTokenService.getInstance();
  const permissionService = NotificationPermissions.getInstance();

  /**
   * Initialize push notifications
   */
  const initialize = async (showPermissionDialog: boolean = true) => {
    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));
      
      console.log('🔔 Initializing push notifications...');
      
      // Check device support first
      const deviceSupport = await permissionService.isDeviceSupported();
      
      setStatus(prev => ({ 
        ...prev, 
        deviceSupported: deviceSupport.supported 
      }));
      
      if (!deviceSupport.supported) {
        setStatus(prev => ({
          ...prev,
          isInitialized: false,
          isRegistered: false,
          hasPermission: false,
          permissionStatus: { granted: false, canAskAgain: false, status: 'unsupported' },
          token: null,
          error: deviceSupport.reason || 'Device not supported',
          isLoading: false,
        }));
        return false;
      }
      
      const success = await pushTokenService.initialize(showPermissionDialog);
      const isRegistered = await pushTokenService.isTokenRegistered();
      const token = pushTokenService.getCurrentToken();
      const permissionStatus = await permissionService.getPermissionStatus();
      
      setStatus(prev => ({
        ...prev,
        isInitialized: success,
        isRegistered: isRegistered,
        hasPermission: permissionStatus.granted,
        permissionStatus: permissionStatus,
        token: token,
        error: success ? null : 'Failed to initialize push notifications',
        isLoading: false,
      }));

      if (success) {
        console.log('✅ Push notifications initialized successfully');
      } else {
        console.log('❌ Push notifications initialization failed');
      }

      return success;
    } catch (error: any) {
      console.error('❌ Error initializing push notifications:', error);
      setStatus(prev => ({
        ...prev,
        isInitialized: false,
        isRegistered: false,
        hasPermission: false,
        permissionStatus: { granted: false, canAskAgain: false, status: 'error' },
        token: null,
        error: error.message || 'Unknown error occurred',
        isLoading: false,
      }));
      return false;
    }
  };

  /**
   * Re-register push token
   */
  const reregister = async () => {
    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));
      
      console.log('🔄 Re-registering push token...');
      
      const success = await pushTokenService.forceReregister();
      const isRegistered = await pushTokenService.isTokenRegistered();
      const token = pushTokenService.getCurrentToken();
      
      setStatus(prev => ({
        ...prev,
        isRegistered: isRegistered,
        token: token,
        error: success ? null : 'Failed to re-register push token',
        isLoading: false,
      }));

      return success;
    } catch (error: any) {
      console.error('❌ Error re-registering push token:', error);
      setStatus(prev => ({
        ...prev,
        error: error.message || 'Unknown error occurred',
        isLoading: false,
      }));
      return false;
    }
  };

  /**
   * Unregister push token
   */
  const unregister = async () => {
    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));
      
      console.log('🗑️ Unregistering push token...');
      
      const success = await pushTokenService.unregisterPushToken();
      
      setStatus(prev => ({
        ...prev,
        isInitialized: false,
        isRegistered: false,
        token: null,
        error: success ? null : 'Failed to unregister push token',
        isLoading: false,
      }));

      return success;
    } catch (error: any) {
      console.error('❌ Error unregistering push token:', error);
      setStatus(prev => ({
        ...prev,
        error: error.message || 'Unknown error occurred',
        isLoading: false,
      }));
      return false;
    }
  };

  /**
   * Request permissions manually
   */
  const requestPermissions = async (showDialog: boolean = true) => {
    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));
      
      console.log('🔔 Requesting permissions manually...');
      
      const permissionStatus = await permissionService.requestPermissions(showDialog);
      
      setStatus(prev => ({
        ...prev,
        hasPermission: permissionStatus.granted,
        permissionStatus: permissionStatus,
        error: permissionStatus.granted ? null : 'Permission not granted',
        isLoading: false,
      }));

      return permissionStatus.granted;
    } catch (error: any) {
      console.error('❌ Error requesting permissions:', error);
      setStatus(prev => ({
        ...prev,
        hasPermission: false,
        permissionStatus: { granted: false, canAskAgain: false, status: 'error' },
        error: error.message || 'Unknown error occurred',
        isLoading: false,
      }));
      return false;
    }
  };
  const test = async () => {
    try {
      console.log('🧪 Testing push notification setup...');
      await pushTokenService.testRegistration();
    } catch (error: any) {
      console.error('❌ Error testing push notifications:', error);
    }
  };

  /**
   * Handle app state changes
   */
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && status.isInitialized && !status.isRegistered) {
        // App became active and we're initialized but not registered
        // Try to re-register
        console.log('📱 App became active, checking push token registration...');
        reregister();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [status.isInitialized, status.isRegistered]);

  /**
   * Auto-initialize on mount
   */
  useEffect(() => {
    // Only initialize once
    if (!status.isInitialized && !status.isLoading) {
      initialize();
    }
  }, []);

  return {
    ...status,
    initialize,
    reregister,
    unregister,
    requestPermissions,
    test,
  };
};

export default usePushNotifications;