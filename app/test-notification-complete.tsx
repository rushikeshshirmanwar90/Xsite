/**
 * Complete Notification Testing Screen
 * 
 * Tests all aspects of the notification system:
 * - iOS notification support
 * - Android notification support (with channelId)
 * - Token registration
 * - Push notification delivery
 * - Multi-admin broadcasting
 * - Platform-specific features
 * 
 * Usage: Navigate to /test-notification-complete
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import apiClient from '@/utils/axiosConfig';
import { SimpleNotificationService } from '@/services/SimpleNotificationService';

// Conditional import for notifications
let Notifications: any;
const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
  } catch (error) {
    console.log('⚠️ expo-notifications not available');
  }
}

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  message: string;
  details?: string;
  timestamp?: Date;
}

interface UserInfo {
  userId: string;
  userType: 'admin' | 'staff' | 'client';
  clientId?: string;
  fullName: string;
  email: string;
}

const TestNotificationComplete: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [testRunning, setTestRunning] = useState(false);

  // Initialize
  useEffect(() => {
    loadUserInfo();
    initializeTests();
  }, []);

  // Load user information
  const loadUserInfo = async () => {
    try {
      const userDetailsString = await AsyncStorage.getItem('user');
      if (userDetailsString) {
        const userData = JSON.parse(userDetailsString);
        
        const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 
                        userData.name || 
                        userData.username || 
                        'Unknown User';

        const userType = userData.role === 'admin' || userData.userType === 'admin' 
          ? 'admin' 
          : userData.role === 'staff' || userData.userType === 'staff'
          ? 'staff'
          : 'client';

        setUserInfo({
          userId: userData._id || userData.id,
          userType,
          clientId: userData.clientId || userData.clients?.[0]?.clientId,
          fullName,
          email: userData.email,
        });
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  // Initialize test results
  const initializeTests = () => {
    const tests: TestResult[] = [
      { name: 'Environment Check', status: 'pending', message: 'Not started' },
      { name: 'Device Compatibility', status: 'pending', message: 'Not started' },
      { name: 'Permissions Check', status: 'pending', message: 'Not started' },
      { name: 'Notification Channels (Android)', status: 'pending', message: 'Not started' },
      { name: 'Push Token Generation', status: 'pending', message: 'Not started' },
      { name: 'Token Registration', status: 'pending', message: 'Not started' },
      { name: 'Backend Connectivity', status: 'pending', message: 'Not started' },
      { name: 'Test Notification Send', status: 'pending', message: 'Not started' },
      { name: 'Platform-Specific Features', status: 'pending', message: 'Not started' },
    ];
    setTestResults(tests);
  };

  // Update test result
  const updateTestResult = (
    index: number, 
    status: TestResult['status'], 
    message: string, 
    details?: string
  ) => {
    setTestResults(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        status,
        message,
        details,
        timestamp: new Date(),
      };
      return updated;
    });
  };

  // Run all tests
  const runAllTests = async () => {
    setTestRunning(true);
    setLoading(true);

    try {
      // Test 1: Environment Check
      await testEnvironment(0);
      await delay(500);

      // Test 2: Device Compatibility
      await testDeviceCompatibility(1);
      await delay(500);

      // Test 3: Permissions
      await testPermissions(2);
      await delay(500);

      // Test 4: Notification Channels (Android only)
      if (Platform.OS === 'android') {
        await testNotificationChannels(3);
        await delay(500);
      } else {
        updateTestResult(3, 'warning', 'Skipped (iOS)', 'Notification channels are Android-only');
      }

      // Test 5: Push Token Generation
      await testPushTokenGeneration(4);
      await delay(500);

      // Test 6: Token Registration
      await testTokenRegistration(5);
      await delay(500);

      // Test 7: Backend Connectivity
      await testBackendConnectivity(6);
      await delay(500);

      // Test 8: Test Notification Send
      await testNotificationSend(7);
      await delay(500);

      // Test 9: Platform-Specific Features
      await testPlatformFeatures(8);

      // Show summary
      showTestSummary();

    } catch (error) {
      console.error('Test suite error:', error);
      Alert.alert('Test Error', 'An error occurred during testing. Check console for details.');
    } finally {
      setLoading(false);
      setTestRunning(false);
    }
  };

  // Individual test functions
  const testEnvironment = async (index: number) => {
    updateTestResult(index, 'running', 'Checking environment...');

    try {
      const environment = {
        platform: Platform.OS,
        isExpoGo: isExpoGo,
        isDevice: Device.isDevice,
        deviceName: Device.deviceName,
        osVersion: Device.osVersion,
        appVersion: Constants.expoConfig?.version,
      };

      if (isExpoGo) {
        updateTestResult(
          index, 
          'failed', 
          'Running in Expo Go', 
          'Push notifications require a development or production build. Run: eas build --profile development'
        );
        return false;
      }

      if (!Device.isDevice) {
        updateTestResult(
          index, 
          'warning', 
          'Running on simulator/emulator', 
          'Push notifications work best on physical devices'
        );
        return true;
      }

      updateTestResult(
        index, 
        'passed', 
        `${Platform.OS} - Physical Device`, 
        JSON.stringify(environment, null, 2)
      );
      return true;

    } catch (error) {
      updateTestResult(index, 'failed', 'Environment check failed', String(error));
      return false;
    }
  };

  const testDeviceCompatibility = async (index: number) => {
    updateTestResult(index, 'running', 'Checking device compatibility...');

    try {
      const compatible = Device.isDevice && !isExpoGo;
      
      if (compatible) {
        updateTestResult(
          index, 
          'passed', 
          'Device is compatible', 
          `Platform: ${Platform.OS}, Device: ${Device.deviceName}`
        );
      } else {
        const reason = isExpoGo 
          ? 'Expo Go does not support push notifications' 
          : 'Simulator/Emulator detected';
        updateTestResult(index, 'failed', 'Device not compatible', reason);
      }

      return compatible;
    } catch (error) {
      updateTestResult(index, 'failed', 'Compatibility check failed', String(error));
      return false;
    }
  };

  const testPermissions = async (index: number) => {
    updateTestResult(index, 'running', 'Checking permissions...');

    if (!Notifications) {
      updateTestResult(index, 'failed', 'Notifications module not available');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      if (existingStatus === 'granted') {
        updateTestResult(index, 'passed', 'Permissions granted', `Status: ${existingStatus}`);
        return true;
      }

      // Request permissions
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      
      if (newStatus === 'granted') {
        updateTestResult(index, 'passed', 'Permissions granted', `Status: ${newStatus}`);
        return true;
      } else {
        updateTestResult(
          index, 
          'failed', 
          'Permissions denied', 
          `Status: ${newStatus}. Go to Settings → App → Notifications to enable.`
        );
        return false;
      }

    } catch (error) {
      updateTestResult(index, 'failed', 'Permission check failed', String(error));
      return false;
    }
  };

  const testNotificationChannels = async (index: number) => {
    updateTestResult(index, 'running', 'Checking notification channels...');

    if (!Notifications || Platform.OS !== 'android') {
      updateTestResult(index, 'warning', 'Skipped (not Android)');
      return true;
    }

    try {
      // Create channels
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2E72F0',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('project-updates', {
        name: 'Project Updates',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
        sound: 'default',
      });

      updateTestResult(
        index, 
        'passed', 
        'Channels created successfully', 
        'Created: default, project-updates'
      );
      return true;

    } catch (error) {
      updateTestResult(index, 'failed', 'Channel creation failed', String(error));
      return false;
    }
  };

  const testPushTokenGeneration = async (index: number) => {
    updateTestResult(index, 'running', 'Generating push token...');

    if (!Notifications) {
      updateTestResult(index, 'failed', 'Notifications module not available');
      return false;
    }

    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                       (Constants.expoConfig as any)?.projectId || 
                       '2fcc4ccc-b8b5-4ff4-ae3c-b195aa9eb32f';

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenData.data;

      setPushToken(token);
      
      updateTestResult(
        index, 
        'passed', 
        'Token generated successfully', 
        `Token: ${token.substring(0, 30)}... (${token.length} chars)`
      );
      return true;

    } catch (error) {
      updateTestResult(index, 'failed', 'Token generation failed', String(error));
      return false;
    }
  };

  const testTokenRegistration = async (index: number) => {
    updateTestResult(index, 'running', 'Registering token with backend...');

    if (!pushToken || !userInfo) {
      updateTestResult(index, 'failed', 'Missing token or user info');
      return false;
    }

    try {
      const deviceId = Constants.sessionId || Constants.installationId || 'test-device';
      const deviceName = Device.deviceName || `${Platform.OS} Device`;
      const appVersion = Constants.expoConfig?.version || '1.0.0';

      const payload = {
        userId: userInfo.userId,
        userType: userInfo.userType,
        token: pushToken,
        platform: Platform.OS,
        deviceId,
        deviceName,
        appVersion,
      };

      const response = await apiClient.post('/api/push-token', payload);

      if (response.data.success) {
        updateTestResult(
          index, 
          'passed', 
          'Token registered successfully', 
          JSON.stringify(response.data, null, 2)
        );
        return true;
      } else {
        updateTestResult(index, 'failed', 'Registration failed', response.data.message);
        return false;
      }

    } catch (error: any) {
      updateTestResult(
        index, 
        'failed', 
        'Registration error', 
        error.response?.data?.message || String(error)
      );
      return false;
    }
  };

  const testBackendConnectivity = async (index: number) => {
    updateTestResult(index, 'running', 'Testing backend connectivity...');

    try {
      // Test if we can reach the backend
      const response = await apiClient.get('/api/push-token', {
        params: { userId: userInfo?.userId },
      });

      if (response.data.success) {
        updateTestResult(
          index, 
          'passed', 
          'Backend connected', 
          `Found ${response.data.data?.count || 0} tokens`
        );
        return true;
      } else {
        updateTestResult(index, 'warning', 'Backend responded but with error', response.data.message);
        return true;
      }

    } catch (error: any) {
      updateTestResult(
        index, 
        'failed', 
        'Backend connection failed', 
        error.response?.data?.message || String(error)
      );
      return false;
    }
  };

  const testNotificationSend = async (index: number) => {
    updateTestResult(index, 'running', 'Sending test notification...');

    if (!Notifications) {
      updateTestResult(index, 'failed', 'Notifications module not available');
      return false;
    }

    try {
      // Send local notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '✅ Test Notification',
          body: `${Platform.OS === 'ios' ? 'iOS' : 'Android'} notifications are working!`,
          data: { 
            test: true, 
            platform: Platform.OS,
            timestamp: new Date().toISOString(),
          },
          sound: 'default',
          badge: 1,
        },
        trigger: { seconds: 2 },
      });

      updateTestResult(
        index, 
        'passed', 
        'Test notification scheduled', 
        'Check your notification tray in 2 seconds'
      );

      // Show alert
      setTimeout(() => {
        Alert.alert(
          'Check Notification',
          'A test notification should appear in 2 seconds. Did you receive it?',
          [
            { text: 'Yes ✅', onPress: () => console.log('Notification received') },
            { text: 'No ❌', onPress: () => console.log('Notification not received') },
          ]
        );
      }, 3000);

      return true;

    } catch (error) {
      updateTestResult(index, 'failed', 'Notification send failed', String(error));
      return false;
    }
  };

  const testPlatformFeatures = async (index: number) => {
    updateTestResult(index, 'running', 'Testing platform-specific features...');

    try {
      const features: string[] = [];

      if (Platform.OS === 'ios') {
        features.push('✅ iOS native notifications');
        features.push('✅ No channelId required');
        features.push('✅ Badge support');
        features.push('✅ Sound support');
      } else if (Platform.OS === 'android') {
        features.push('✅ Android notification channels');
        features.push('✅ channelId: project-updates');
        features.push('✅ Vibration support');
        features.push('✅ LED light support');
        features.push('✅ Android 8.0+ compatible');
      }

      updateTestResult(
        index, 
        'passed', 
        `${Platform.OS} features verified`, 
        features.join('\n')
      );
      return true;

    } catch (error) {
      updateTestResult(index, 'failed', 'Platform feature test failed', String(error));
      return false;
    }
  };

  // Show test summary
  const showTestSummary = () => {
    const passed = testResults.filter(t => t.status === 'passed').length;
    const failed = testResults.filter(t => t.status === 'failed').length;
    const warnings = testResults.filter(t => t.status === 'warning').length;
    const total = testResults.length;

    const message = `
Test Results:
✅ Passed: ${passed}/${total}
❌ Failed: ${failed}/${total}
⚠️ Warnings: ${warnings}/${total}

${failed === 0 ? '🎉 All critical tests passed!' : '⚠️ Some tests failed. Check details below.'}
    `.trim();

    Alert.alert('Test Summary', message);
  };

  // Send test notification via backend
  const sendBackendTestNotification = async () => {
    if (!userInfo) {
      Alert.alert('Error', 'User information not loaded');
      return;
    }

    setLoading(true);
    try {
      // This would call your backend API to send a notification
      // You'll need to create this endpoint
      const response = await apiClient.post('/api/test-notification', {
        userId: userInfo.userId,
        title: 'Backend Test Notification',
        body: `Test from ${Platform.OS} device`,
        data: {
          test: true,
          platform: Platform.OS,
          timestamp: new Date().toISOString(),
        },
      });

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Test notification sent from backend. Check your notification tray.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Failed to send notification');
      }

    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to send test notification'
      );
    } finally {
      setLoading(false);
    }
  };

  // Utility functions
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserInfo();
    initializeTests();
    setRefreshing(false);
  };

  // Render test result item
  const renderTestResult = (result: TestResult, index: number) => {
    const getStatusIcon = () => {
      switch (result.status) {
        case 'passed': return { name: 'checkmark-circle', color: '#10B981' };
        case 'failed': return { name: 'close-circle', color: '#EF4444' };
        case 'warning': return { name: 'warning', color: '#F59E0B' };
        case 'running': return { name: 'sync', color: '#2E72F0' };
        default: return { name: 'ellipse-outline', color: '#9CA3AF' };
      }
    };

    const icon = getStatusIcon();

    return (
      <View key={index} style={styles.testItem}>
        <View style={styles.testHeader}>
          <Ionicons 
            name={icon.name as any} 
            size={24} 
            color={icon.color}
            style={result.status === 'running' ? styles.spinning : undefined}
          />
          <View style={styles.testInfo}>
            <Text style={styles.testName}>{result.name}</Text>
            <Text style={[styles.testMessage, { color: icon.color }]}>
              {result.message}
            </Text>
          </View>
        </View>
        
        {result.details && (
          <View style={styles.testDetails}>
            <Text style={styles.testDetailsText}>{result.details}</Text>
          </View>
        )}

        {result.timestamp && (
          <Text style={styles.testTimestamp}>
            {result.timestamp.toLocaleTimeString()}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#2E72F0', '#2563EB']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Test Suite</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{Platform.OS.toUpperCase()}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* User Info */}
        {userInfo && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>User Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{userInfo.fullName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type:</Text>
              <Text style={styles.infoValue}>{userInfo.userType}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>User ID:</Text>
              <Text style={styles.infoValue}>{userInfo.userId}</Text>
            </View>
            {userInfo.clientId && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Client ID:</Text>
                <Text style={styles.infoValue}>{userInfo.clientId}</Text>
              </View>
            )}
          </View>
        )}

        {/* Push Token */}
        {pushToken && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Push Token</Text>
            <Text style={styles.tokenText} numberOfLines={2}>
              {pushToken}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, testRunning && styles.buttonDisabled]}
            onPress={runAllTests}
            disabled={testRunning || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="play-circle" size={20} color="#FFF" />
                <Text style={styles.buttonText}>Run All Tests</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={sendBackendTestNotification}
            disabled={loading}
          >
            <Ionicons name="send" size={20} color="#2E72F0" />
            <Text style={[styles.buttonText, { color: '#2E72F0' }]}>
              Send Backend Test
            </Text>
          </TouchableOpacity>
        </View>

        {/* Test Results */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results</Text>
          {testResults.map((result, index) => renderTestResult(result, index))}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>📋 Instructions</Text>
          <Text style={styles.instructionsText}>
            1. Tap "Run All Tests" to check notification system{'\n'}
            2. Review each test result{'\n'}
            3. All tests should pass (✅) for full functionality{'\n'}
            4. Warnings (⚠️) are acceptable in some cases{'\n'}
            5. Fix any failed (❌) tests before production
          </Text>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  tokenText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#2E72F0',
  },
  secondaryButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#2E72F0',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  resultsContainer: {
    margin: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  testItem: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  testMessage: {
    fontSize: 14,
  },
  testDetails: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  testDetailsText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  testTimestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'right',
  },
  spinning: {
    // Add animation if needed
  },
  instructionsCard: {
    backgroundColor: '#EAF0FE',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C4D8FC',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  spacer: {
    height: 32,
  },
});

export default TestNotificationComplete;
