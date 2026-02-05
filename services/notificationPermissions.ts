import { Platform, Alert, Linking } from 'react-native';
import Constants from 'expo-constants';

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

export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
  expires?: string;
}

class NotificationPermissions {
  private static instance: NotificationPermissions;

  static getInstance(): NotificationPermissions {
    if (!NotificationPermissions.instance) {
      NotificationPermissions.instance = new NotificationPermissions();
    }
    return NotificationPermissions.instance;
  }

  /**
   * Check if device supports push notifications
   */
  async isDeviceSupported(): Promise<{ supported: boolean; reason?: string }> {
    // Check if we're in Expo Go on Android
    if (isExpoGo && Platform.OS === 'android') {
      return {
        supported: false,
        reason: 'Push notifications are not supported in Expo Go on Android. Please use a development build.'
      };
    }

    // Check if it's a physical device
    if (!Device?.isDevice) {
      return {
        supported: false,
        reason: 'Push notifications require a physical device. Simulators are not supported.'
      };
    }

    // Check if notification modules are available
    if (!Notifications) {
      return {
        supported: false,
        reason: 'Notification modules are not available in this environment.'
      };
    }

    return { supported: true };
  }

  /**
   * Get current permission status
   */
  async getPermissionStatus(): Promise<PermissionStatus> {
    const deviceSupport = await this.isDeviceSupported();
    
    if (!deviceSupport.supported) {
      return {
        granted: false,
        canAskAgain: false,
        status: 'unsupported',
      };
    }

    try {
      const { status, canAskAgain, expires } = await Notifications.getPermissionsAsync();
      
      console.log('📋 Current notification permission status:', {
        status,
        granted: status === 'granted',
        canAskAgain,
        expires
      });

      return {
        granted: status === 'granted',
        canAskAgain: canAskAgain !== false,
        status,
        expires
      };
    } catch (error) {
      console.error('❌ Error getting permission status:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error',
      };
    }
  }

  /**
   * Request notification permissions with user-friendly prompts
   */
  async requestPermissions(showExplanation: boolean = true): Promise<PermissionStatus> {
    console.log('🔔 Requesting notification permissions...');

    const deviceSupport = await this.isDeviceSupported();
    
    if (!deviceSupport.supported) {
      console.log('❌ Device not supported:', deviceSupport.reason);
      
      if (showExplanation) {
        Alert.alert(
          'Notifications Not Supported',
          deviceSupport.reason,
          [{ text: 'OK' }]
        );
      }
      
      return {
        granted: false,
        canAskAgain: false,
        status: 'unsupported',
      };
    }

    try {
      // First, check current status
      const currentStatus = await this.getPermissionStatus();
      
      if (currentStatus.granted) {
        console.log('✅ Permissions already granted');
        return currentStatus;
      }

      // If we can't ask again, show settings prompt
      if (!currentStatus.canAskAgain) {
        console.log('⚠️ Cannot ask for permissions again');
        
        if (showExplanation) {
          this.showSettingsPrompt();
        }
        
        return currentStatus;
      }

      // Show explanation before requesting (optional)
      if (showExplanation) {
        const shouldProceed = await this.showPermissionExplanation();
        if (!shouldProceed) {
          console.log('👤 User declined permission explanation');
          return {
            granted: false,
            canAskAgain: true,
            status: 'denied',
          };
        }
      }

      // Request permissions
      console.log('📱 Showing system permission dialog...');
      const { status, canAskAgain, expires } = await Notifications.requestPermissionsAsync();
      
      const result: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain: canAskAgain !== false,
        status,
        expires
      };

      console.log('📋 Permission request result:', result);

      // Handle the result
      if (result.granted) {
        console.log('✅ Notification permissions granted!');
        
        if (showExplanation) {
          Alert.alert(
            'Notifications Enabled! 🎉',
            'You will now receive real-time notifications when materials are added, used, or transferred in your projects.',
            [{ text: 'Great!' }]
          );
        }
      } else {
        console.log('❌ Notification permissions denied');
        
        if (showExplanation && !result.canAskAgain) {
          this.showSettingsPrompt();
        }
      }

      return result;

    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      
      if (showExplanation) {
        Alert.alert(
          'Permission Error',
          'There was an error requesting notification permissions. Please try again.',
          [{ text: 'OK' }]
        );
      }
      
      return {
        granted: false,
        canAskAgain: false,
        status: 'error',
      };
    }
  }

  /**
   * Show explanation dialog before requesting permissions
   */
  private showPermissionExplanation(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Enable Notifications? 🔔',
        'Get real-time alerts when:\n\n• Materials are added to projects\n• Materials are used or transferred\n• Important project updates occur\n\nThis helps you stay updated on project activities even when the app is closed.',
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: 'Enable Notifications',
            onPress: () => resolve(true)
          }
        ]
      );
    });
  }

  /**
   * Show prompt to open device settings
   */
  private showSettingsPrompt(): void {
    Alert.alert(
      'Enable Notifications in Settings',
      'To receive notifications, please enable them in your device settings:\n\n1. Go to Settings\n2. Find this app\n3. Enable Notifications',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          }
        }
      ]
    );
  }

  /**
   * Request permissions silently (without user prompts)
   */
  async requestPermissionsSilently(): Promise<PermissionStatus> {
    return this.requestPermissions(false);
  }

  /**
   * Check if we should show permission request
   */
  async shouldRequestPermissions(): Promise<boolean> {
    const deviceSupport = await this.isDeviceSupported();
    if (!deviceSupport.supported) {
      return false;
    }

    const status = await this.getPermissionStatus();
    return !status.granted && status.canAskAgain;
  }

  /**
   * Test permission functionality
   */
  async testPermissions(): Promise<void> {
    console.log('🧪 Testing notification permissions...');
    
    const deviceSupport = await this.isDeviceSupported();
    console.log('📱 Device support:', deviceSupport);
    
    const currentStatus = await this.getPermissionStatus();
    console.log('📋 Current status:', currentStatus);
    
    const shouldRequest = await this.shouldRequestPermissions();
    console.log('❓ Should request:', shouldRequest);
    
    if (shouldRequest) {
      console.log('💡 You can call requestPermissions() to show the permission dialog');
    } else if (currentStatus.granted) {
      console.log('✅ Permissions are already granted');
    } else {
      console.log('⚠️ Permissions cannot be requested (device not supported or user denied permanently)');
    }
  }
}

export default NotificationPermissions;