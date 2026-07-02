import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import SimpleNotificationService from '@/services/SimpleNotificationService';
import { useAuth } from '@/contexts/AuthContext';

interface TestResult {
  name: string;
  status: 'pending' | 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  timestamp?: Date;
}

const NotificationSystemTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const { user } = useAuth();

  const addTestResult = (result: TestResult) => {
    result.timestamp = new Date();
    setTestResults(prev => [...prev, result]);
  };

  const updateCurrentTest = (testName: string) => {
    setCurrentTest(testName);
  };

  /**
   * Debug function to check all AsyncStorage keys
   */
  const debugStorageKeys = async (): Promise<void> => {
    try {
      console.log('🔍 DEBUG: Checking all AsyncStorage keys...');
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('📋 All storage keys:', allKeys);
      
      // Check specific auth-related keys
      const authKeys = ['auth_token', 'userToken', 'accessToken', 'authToken', 'token', 'user'];
      for (const key of authKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          console.log(`✅ Found ${key}:`, value.substring(0, 50) + '...');
        } else {
          console.log(`❌ Missing ${key}`);
        }
      }
    } catch (error) {
      console.error('❌ Error debugging storage:', error);
    }
  };

  /**
   * Test 1: Device and Environment Check
   */
  const testDeviceEnvironment = async (): Promise<void> => {
    updateCurrentTest('Device Environment Check');
    
    try {
      // Check if physical device
      if (!Device.isDevice) {
        addTestResult({
          name: 'Physical Device Check',
          status: 'fail',
          message: 'Push notifications require a physical device',
          details: { isDevice: Device.isDevice, platform: Platform.OS }
        });
        return;
      }

      addTestResult({
        name: 'Physical Device Check',
        status: 'pass',
        message: 'Running on physical device',
        details: { 
          deviceName: Device.deviceName,
          platform: Platform.OS,
          osVersion: Device.osVersion
        }
      });

      // Check Expo environment
      const isExpoGo = Constants.executionEnvironment === 'storeClient';
      
      // Debug Constants object
      console.log('🔍 Constants debug:', {
        executionEnvironment: Constants.executionEnvironment,
        expoConfig: !!Constants.expoConfig,
        manifest: !!Constants.manifest,
        manifest2: !!Constants.manifest2,
        expoConfigExtra: Constants.expoConfig?.extra,
        manifestExtra: Constants.manifest?.extra,
        manifest2Extra: Constants.manifest2?.extra
      });
      
      if (isExpoGo && Platform.OS === 'android') {
        addTestResult({
          name: 'Expo Environment Check',
          status: 'warning',
          message: 'Running in Expo Go on Android - push notifications limited',
          details: { executionEnvironment: Constants.executionEnvironment }
        });
      } else {
        addTestResult({
          name: 'Expo Environment Check',
          status: 'pass',
          message: 'Environment supports push notifications',
          details: { executionEnvironment: Constants.executionEnvironment }
        });
      }

      // Check project ID
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                        Constants.manifest?.extra?.eas?.projectId ||
                        Constants.manifest2?.extra?.eas?.projectId;
      
      if (!projectId) {
        addTestResult({
          name: 'Project ID Check',
          status: 'fail',
          message: 'EAS Project ID not found in configuration',
          details: { 
            projectId,
            expoConfig: !!Constants.expoConfig,
            manifest: !!Constants.manifest,
            manifest2: !!Constants.manifest2,
            extra: Constants.expoConfig?.extra || Constants.manifest?.extra || Constants.manifest2?.extra
          }
        });
      } else {
        addTestResult({
          name: 'Project ID Check',
          status: 'pass',
          message: 'EAS Project ID configured',
          details: { projectId: projectId.substring(0, 8) + '...' }
        });
      }

    } catch (error) {
      addTestResult({
        name: 'Device Environment Check',
        status: 'fail',
        message: 'Environment check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  };

  /**
   * Test 2: User Authentication Check
   */
  const testUserAuthentication = async (): Promise<void> => {
    updateCurrentTest('User Authentication Check');
    
    try {
      if (!user) {
        addTestResult({
          name: 'User Authentication',
          status: 'fail',
          message: 'No authenticated user found',
          details: { user: null }
        });
        return;
      }

      addTestResult({
        name: 'User Authentication',
        status: 'pass',
        message: 'User authenticated successfully',
        details: {
          userId: user._id,
          email: user.email,
          userType: user.role || user.userType || 'unknown'
        }
      });

      // Check for auth token - check all possible keys
      const authKeys = ['auth_token', 'userToken', 'accessToken', 'authToken', 'token'];
      let authToken = null;
      let foundKey = null;
      
      for (const key of authKeys) {
        const token = await AsyncStorage.getItem(key);
        if (token && token.trim() !== '' && token !== 'null' && token !== 'undefined') {
          authToken = token;
          foundKey = key;
          break;
        }
      }
      
      // Also check if user object has a token
      if (!authToken && user && user.token) {
        authToken = user.token;
        foundKey = 'user.token';
      }

      if (!authToken) {
        addTestResult({
          name: 'Authentication Token',
          status: 'warning',
          message: 'No authentication token found - API calls may fail',
          details: { 
            tokenFound: false,
            checkedKeys: authKeys,
            userHasToken: !!(user && user.token)
          }
        });
      } else {
        addTestResult({
          name: 'Authentication Token',
          status: 'pass',
          message: 'Authentication token available',
          details: { 
            tokenFound: true,
            tokenLength: authToken.length,
            foundAt: foundKey,
            isJWT: authToken.includes('.')
          }
        });
      }

    } catch (error) {
      addTestResult({
        name: 'User Authentication Check',
        status: 'fail',
        message: 'Authentication check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  };

  const testNotificationPermissions = async (): Promise<void> => {
    updateCurrentTest('Notification Permissions');
    
    try {
      const simpleService = SimpleNotificationService.getInstance();
      
      // Test permission request - SimpleNotificationService uses initialize()
      const initialized = await simpleService.initialize();
      
      if (initialized) {
        addTestResult({
          name: 'Notification Permissions',
          status: 'pass',
          message: 'Notification permissions granted and service initialized',
          details: { 
            granted: true,
            initialized: true
          }
        });
      } else {
        addTestResult({
          name: 'Notification Permissions',
          status: 'fail',
          message: 'Notification permissions denied or initialization failed',
          details: { 
            granted: false,
            initialized: false
          }
        });
      }

    } catch (error) {
      addTestResult({
        name: 'Notification Permissions',
        status: 'fail',
        message: 'Permission test failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  };

  /**
   * Test 4: Push Token Generation
   */
  const testPushTokenGeneration = async (): Promise<void> => {
    updateCurrentTest('Push Token Generation');
    
    try {
      const simpleService = SimpleNotificationService.getInstance();
      
      // SimpleNotificationService stores token internally during initialize()
      const token = simpleService.getCurrentToken();
      
      if (token) {
        addTestResult({
          name: 'Push Token Generation',
          status: 'pass',
          message: 'Push token generated successfully',
          details: { 
            tokenGenerated: true,
            tokenLength: token.length,
            tokenType: token.startsWith('ExponentPushToken[') ? 'Expo' : 'Unknown'
          }
        });

        // Test token registration status
        const isSetup = await simpleService.isSetup();
        if (isSetup) {
          addTestResult({
            name: 'Token Registration Status',
            status: 'pass',
            message: 'Token registered with backend',
            details: { registered: true }
          });
        } else {
          addTestResult({
            name: 'Token Registration Status',
            status: 'warning',
            message: 'Token not yet registered with backend',
            details: { registered: false }
          });
        }

      } else {
        addTestResult({
          name: 'Push Token Generation',
          status: 'fail',
          message: 'Failed to generate push token',
          details: { tokenGenerated: false }
        });
      }

    } catch (error) {
      addTestResult({
        name: 'Push Token Generation',
        status: 'fail',
        message: 'Token generation test failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  };

  /**
   * Test 5: Service Initialization
   */
  const testSecureServiceInitialization = async (): Promise<void> => {
    updateCurrentTest('Service Initialization');
    
    try {
      if (!user) {
        addTestResult({
          name: 'Service Initialization',
          status: 'fail',
          message: 'Cannot initialize without authenticated user',
          details: { user: null }
        });
        return;
      }

      const simpleService = SimpleNotificationService.getInstance();
      
      // Test initialization
      const initialized = await simpleService.initialize();
      
      if (initialized) {
        // Test token registration
        const registered = await simpleService.registerToken(user);
        
        if (registered) {
          addTestResult({
            name: 'Service Initialization',
            status: 'pass',
            message: 'Notification service initialized and token registered successfully',
            details: { initialized: true, registered: true }
          });
        } else {
          addTestResult({
            name: 'Service Initialization',
            status: 'warning',
            message: 'Service initialized but token registration failed',
            details: { initialized: true, registered: false }
          });
        }
      } else {
        addTestResult({
          name: 'Service Initialization',
          status: 'fail',
          message: 'Service initialization failed',
          details: { initialized: false }
        });
      }

    } catch (error) {
      addTestResult({
        name: 'Service Initialization',
        status: 'fail',
        message: 'Service initialization test failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  };

  /**
   * Test 6: Local Notification
   */
  const testLocalNotification = async (): Promise<void> => {
    updateCurrentTest('Local Notification Test');
    
    try {
      // Schedule a test notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Notification',
          body: 'This is a test notification from the security test suite',
          data: { 
            testId: 'security-test-' + Date.now(),
            source: 'test-suite'
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
        },
      });

      if (notificationId) {
        addTestResult({
          name: 'Local Notification Scheduling',
          status: 'pass',
          message: 'Local notification scheduled successfully',
          details: { 
            notificationId,
            scheduledFor: '2 seconds from now'
          }
        });

        // Wait for notification to trigger
        setTimeout(() => {
          addTestResult({
            name: 'Local Notification Delivery',
            status: 'pass',
            message: 'Check if test notification appeared',
            details: { 
              note: 'Manual verification required - did you see the test notification?'
            }
          });
        }, 3000);

      } else {
        addTestResult({
          name: 'Local Notification Scheduling',
          status: 'fail',
          message: 'Failed to schedule local notification',
          details: { notificationId }
        });
      }

    } catch (error) {
      addTestResult({
        name: 'Local Notification Test',
        status: 'fail',
        message: 'Local notification test failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  };

  /**
   * Test 7: Notification Sending
   */
  const testNotificationSending = async (): Promise<void> => {
    updateCurrentTest('Notification Sending');
    
    try {
      const simpleService = SimpleNotificationService.getInstance();
      
      // Test sending a project notification
      const testData = {
        projectId: 'test-project-123',
        clientId: user?.clients?.[0]?.clientId || user?.clientId || user?._id,
        activityType: 'mini_section_created' as const,
        staffName: user?.firstName || 'Test User',
        projectName: 'Test Project',
        miniSectionName: 'Test Mini Section',
        details: 'This is a test notification from the test suite',
        recipientType: 'admins' as const,
        staffId: user?._id,
        category: 'mini_section' as const,
      };

      const sent = await simpleService.sendProjectNotification(testData);
      
      if (sent) {
        addTestResult({
          name: 'Notification Sending',
          status: 'pass',
          message: 'Test notification sent successfully',
          details: { sent: true, testData }
        });
      } else {
        addTestResult({
          name: 'Notification Sending',
          status: 'warning',
          message: 'Notification sending returned false (may have used local fallback)',
          details: { sent: false }
        });
      }

    } catch (error) {
      addTestResult({
        name: 'Notification Sending',
        status: 'fail',
        message: 'Notification sending test failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  };

  /**
   * Run All Tests
   */
  const runAllTests = async (): Promise<void> => {
    setIsRunning(true);
    setTestResults([]);
    setCurrentTest('Starting tests...');

    try {
      // Debug storage keys first
      await debugStorageKeys();
      
      await testDeviceEnvironment();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testUserAuthentication();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testNotificationPermissions();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testPushTokenGeneration();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testSecureServiceInitialization();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testLocalNotification();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testNotificationSending();
      
      setCurrentTest('Tests completed');
      
      // Show summary
      setTimeout(() => {
        const passed = testResults.filter(r => r.status === 'pass').length;
        const failed = testResults.filter(r => r.status === 'fail').length;
        const warnings = testResults.filter(r => r.status === 'warning').length;
        
        Alert.alert(
          'Test Results Summary',
          `✅ Passed: ${passed}\n❌ Failed: ${failed}\n⚠️ Warnings: ${warnings}\n\nTotal: ${testResults.length} tests`,
          [{ text: 'OK' }]
        );
      }, 1000);
      
    } catch (error) {
      addTestResult({
        name: 'Test Suite Execution',
        status: 'fail',
        message: 'Test suite encountered an error',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  /**
   * Clear Test Results
   */
  const clearResults = (): void => {
    setTestResults([]);
    setCurrentTest('');
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status: TestResult['status']): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'pass': return 'checkmark-circle';
      case 'fail': return 'close-circle';
      case 'warning': return 'warning';
      case 'pending': return 'time';
      default: return 'help-circle';
    }
  };

  /**
   * Get status color
   */
  const getStatusColor = (status: TestResult['status']): string => {
    switch (status) {
      case 'pass': return '#10B981';
      case 'fail': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'pending': return '#6B7280';
      default: return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔔 Notification System Test</Text>
        <Text style={styles.subtitle}>Comprehensive notification validation</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, isRunning && styles.disabledButton]}
          onPress={runAllTests}
          disabled={isRunning}
        >
          <Ionicons 
            name={isRunning ? "hourglass" : "play"} 
            size={20} 
            color="white" 
          />
          <Text style={styles.buttonText}>
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={clearResults}
          disabled={isRunning}
        >
          <Ionicons name="trash" size={20} color="#6B7280" />
          <Text style={styles.secondaryButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {currentTest && (
        <View style={styles.currentTest}>
          <Ionicons name="sync" size={16} color="#3A78B5" />
          <Text style={styles.currentTestText}>{currentTest}</Text>
        </View>
      )}

      <ScrollView style={styles.results}>
        {testResults.map((result, index) => (
          <View key={index} style={styles.resultItem}>
            <View style={styles.resultHeader}>
              <Ionicons
                name={getStatusIcon(result.status)}
                size={20}
                color={getStatusColor(result.status)}
              />
              <Text style={styles.resultName}>{result.name}</Text>
              {result.timestamp && (
                <Text style={styles.resultTime}>
                  {result.timestamp.toLocaleTimeString()}
                </Text>
              )}
            </View>
            
            <Text style={[
              styles.resultMessage,
              { color: getStatusColor(result.status) }
            ]}>
              {result.message}
            </Text>
            
            {result.details && (
              <View style={styles.resultDetails}>
                <Text style={styles.detailsText}>
                  {JSON.stringify(result.details, null, 2)}
                </Text>
              </View>
            )}
          </View>
        ))}
        
        {testResults.length === 0 && !isRunning && (
          <View style={styles.emptyState}>
            <Ionicons name="flask" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No tests run yet</Text>
            <Text style={styles.emptySubtext}>
              Tap "Run All Tests" to start the security validation
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  controls: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#3A78B5',
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 16,
  },
  currentTest: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EBF8FF',
    gap: 8,
  },
  currentTestText: {
    color: '#3A78B5',
    fontWeight: '500',
  },
  results: {
    flex: 1,
    padding: 16,
  },
  resultItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  resultName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  resultTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  resultMessage: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  resultDetails: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 6,
  },
  detailsText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#4B5563',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});

export default NotificationSystemTest;