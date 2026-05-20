/**
 * Android Notification Diagnostic Script
 * 
 * This script helps diagnose Android notification issues by checking:
 * - Expo Go detection
 * - Notification permissions
 * - Channel creation
 * - Token generation
 * - Backend connectivity
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DiagnosticResult {
  step: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export class AndroidNotificationDiagnostics {
  private results: DiagnosticResult[] = [];

  /**
   * Run all diagnostic checks
   */
  async runDiagnostics(): Promise<DiagnosticResult[]> {
    console.log('🔍 Starting Android Notification Diagnostics...\n');
    
    this.results = [];

    await this.checkPlatform();
    await this.checkExpoGo();
    await this.checkDevice();
    await this.checkPermissions();
    await this.checkChannels();
    await this.checkToken();
    await this.checkBackendConnection();
    await this.checkStoredData();

    this.printResults();
    return this.results;
  }

  /**
   * Check 1: Platform
   */
  private async checkPlatform(): Promise<void> {
    const platform = Platform.OS;
    
    if (platform === 'android') {
      this.addResult('Platform Check', 'pass', `Running on Android`, { platform });
    } else {
      this.addResult('Platform Check', 'warning', `Running on ${platform} (not Android)`, { platform });
    }
  }

  /**
   * Check 2: Expo Go Detection
   */
  private async checkExpoGo(): Promise<void> {
    const isExpoGo = Constants.appOwnership === 'expo';
    const executionEnv = Constants.executionEnvironment;
    
    if (!isExpoGo) {
      this.addResult('Expo Go Check', 'pass', 'Not running in Expo Go (development/production build)', {
        appOwnership: Constants.appOwnership,
        executionEnvironment: executionEnv,
      });
    } else {
      this.addResult('Expo Go Check', 'fail', 'Running in Expo Go - notifications not supported', {
        appOwnership: Constants.appOwnership,
        executionEnvironment: executionEnv,
        solution: 'Build with: eas build --profile development --platform android',
      });
    }
  }

  /**
   * Check 3: Device Type
   */
  private async checkDevice(): Promise<void> {
    const isDevice = Device.isDevice;
    const deviceName = Device.deviceName;
    const osVersion = Device.osVersion;
    
    if (isDevice) {
      this.addResult('Device Check', 'pass', `Physical device: ${deviceName}`, {
        deviceName,
        osVersion,
        isDevice,
      });
    } else {
      this.addResult('Device Check', 'fail', 'Running on simulator/emulator', {
        deviceName,
        solution: 'Use a physical Android device for testing',
      });
    }
  }

  /**
   * Check 4: Notification Permissions
   */
  private async checkPermissions(): Promise<void> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      
      if (status === 'granted') {
        this.addResult('Permission Check', 'pass', 'Notification permissions granted', { status });
      } else {
        this.addResult('Permission Check', 'fail', `Permissions not granted: ${status}`, {
          status,
          solution: 'Request permissions or check Android settings',
        });
      }
    } catch (error) {
      this.addResult('Permission Check', 'fail', 'Failed to check permissions', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check 5: Notification Channels (Android only)
   */
  private async checkChannels(): Promise<void> {
    if (Platform.OS !== 'android') {
      this.addResult('Channel Check', 'warning', 'Skipped (iOS does not use channels)', {});
      return;
    }

    try {
      // Try to get existing channels
      const channels = await Notifications.getNotificationChannelsAsync();
      
      const defaultChannel = channels.find(ch => ch.id === 'default');
      const projectUpdatesChannel = channels.find(ch => ch.id === 'project-updates');
      
      if (defaultChannel && projectUpdatesChannel) {
        this.addResult('Channel Check', 'pass', 'Both required channels exist', {
          channels: channels.map(ch => ({ id: ch.id, name: ch.name })),
        });
      } else {
        const missing = [];
        if (!defaultChannel) missing.push('default');
        if (!projectUpdatesChannel) missing.push('project-updates');
        
        this.addResult('Channel Check', 'fail', `Missing channels: ${missing.join(', ')}`, {
          existingChannels: channels.map(ch => ch.id),
          missingChannels: missing,
          solution: 'Channels should be created during app initialization',
        });
      }
    } catch (error) {
      this.addResult('Channel Check', 'fail', 'Failed to check channels', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check 6: Push Token Generation
   */
  private async checkToken(): Promise<void> {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                        '2fcc4ccc-b8b5-4ff4-ae3c-b195aa9eb32f';

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenData.data;
      
      if (token && token.length > 0) {
        this.addResult('Token Check', 'pass', 'Push token generated successfully', {
          tokenLength: token.length,
          tokenPrefix: token.substring(0, 20) + '...',
          projectId: projectId.substring(0, 8) + '...',
        });
      } else {
        this.addResult('Token Check', 'fail', 'Token is empty', {
          token,
        });
      }
    } catch (error) {
      this.addResult('Token Check', 'fail', 'Failed to generate push token', {
        error: error instanceof Error ? error.message : 'Unknown error',
        solution: 'Check Expo configuration and network connectivity',
      });
    }
  }

  /**
   * Check 7: Backend Connection
   */
  private async checkBackendConnection(): Promise<void> {
    try {
      const domain = await AsyncStorage.getItem('domain');
      
      if (domain) {
        this.addResult('Backend Check', 'pass', 'Backend domain configured', {
          domain: domain.substring(0, 30) + '...',
        });
      } else {
        this.addResult('Backend Check', 'warning', 'No backend domain found', {
          solution: 'Ensure user is logged in',
        });
      }
    } catch (error) {
      this.addResult('Backend Check', 'fail', 'Failed to check backend connection', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check 8: Stored Data
   */
  private async checkStoredData(): Promise<void> {
    try {
      const pushToken = await AsyncStorage.getItem('pushToken');
      const pushTokenRegistered = await AsyncStorage.getItem('pushTokenRegistered');
      const registeredClientId = await AsyncStorage.getItem('registeredClientId');
      
      const details: any = {
        hasPushToken: !!pushToken,
        isRegistered: pushTokenRegistered === 'true',
        hasClientId: !!registeredClientId,
      };
      
      if (pushToken) {
        details.tokenLength = pushToken.length;
      }
      
      if (pushTokenRegistered === 'true' && pushToken && registeredClientId) {
        this.addResult('Storage Check', 'pass', 'All required data stored', details);
      } else {
        this.addResult('Storage Check', 'warning', 'Some data missing', {
          ...details,
          solution: 'May need to re-login or re-register token',
        });
      }
    } catch (error) {
      this.addResult('Storage Check', 'fail', 'Failed to check stored data', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Add a diagnostic result
   */
  private addResult(step: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any): void {
    this.results.push({ step, status, message, details });
  }

  /**
   * Print results to console
   */
  private printResults(): void {
    console.log('\n📊 Diagnostic Results:\n');
    console.log('═'.repeat(60));
    
    this.results.forEach((result, index) => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      console.log(`\n${index + 1}. ${icon} ${result.step}`);
      console.log(`   ${result.message}`);
      
      if (result.details) {
        console.log('   Details:', JSON.stringify(result.details, null, 2));
      }
    });
    
    console.log('\n' + '═'.repeat(60));
    
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    
    console.log(`\n📈 Summary: ${passed} passed, ${failed} failed, ${warnings} warnings`);
    
    if (failed > 0) {
      console.log('\n❌ Action Required: Fix the failed checks above');
    } else if (warnings > 0) {
      console.log('\n⚠️ Review Warnings: Some checks need attention');
    } else {
      console.log('\n✅ All Checks Passed: Notifications should work!');
    }
    
    console.log('\n');
  }

  /**
   * Test sending a local notification
   */
  async testLocalNotification(): Promise<boolean> {
    try {
      console.log('🧪 Testing local notification...');
      
      const trigger: any = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      };

      // Add channelId for Android
      if (Platform.OS === 'android') {
        trigger.channelId = 'project-updates';
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Notification',
          body: 'If you see this, Android notifications are working!',
          data: { test: true },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger,
      });
      
      console.log('✅ Test notification scheduled (should appear in 2 seconds)');
      return true;
    } catch (error) {
      console.error('❌ Failed to schedule test notification:', error);
      return false;
    }
  }
}

// Export singleton instance
export const diagnostics = new AndroidNotificationDiagnostics();

// Usage example:
// import { diagnostics } from '@/scripts/test-android-notifications';
// await diagnostics.runDiagnostics();
// await diagnostics.testLocalNotification();
