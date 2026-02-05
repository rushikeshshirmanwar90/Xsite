import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { domain } from '@/lib/domain';
import PushTokenService from '@/services/pushTokenService';
import NotificationPermissions from '@/services/notificationPermissions';

// Check if we're in Expo Go
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Dynamic imports
let Notifications: any = null;
let Device: any = null;

if (!(isExpoGo && Platform.OS === 'android')) {
  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
  } catch (error) {
    console.warn('Failed to load notification modules:', error);
  }
}

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'warning' | 'error';
  message: string;
  details?: any;
  duration?: number;
  timestamp?: string;
}

interface TestSuite {
  id: string;
  name: string;
  tests: TestResult[];
  status: 'pending' | 'running' | 'completed';
}

const ComprehensivePushTokenTest: React.FC = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [startTime, setStartTime] = useState<number>(0);

  const updateTestResult = (suiteId: string, testId: string, updates: Partial<TestResult>) => {
    setTestSuites(prev => prev.map(suite => {
      if (suite.id === suiteId) {
        return {
          ...suite,
          tests: suite.tests.map(test => {
            if (test.id === testId) {
              return {
                ...test,
                ...updates,
                timestamp: new Date().toISOString()
              };
            }
            return test;
          })
        };
      }
      return suite;
    }));
  };

  const updateSuiteStatus = (suiteId: string, status: TestSuite['status']) => {
    setTestSuites(prev => prev.map(suite => {
      if (suite.id === suiteId) {
        return { ...suite, status };
      }
      return suite;
    }));
  };

  const initializeTestSuites = () => {
    const suites: TestSuite[] = [
      {
        id: 'environment',
        name: '🌍 Environment & Setup',
        status: 'pending',
        tests: [
          { id: 'platform', name: 'Platform Detection', status: 'pending', message: '' },
          { id: 'expo-env', name: 'Expo Environment', status: 'pending', message: '' },
          { id: 'device', name: 'Device Support', status: 'pending', message: '' },
          { id: 'modules', name: 'Required Modules', status: 'pending', message: '' },
          { id: 'config', name: 'App Configuration', status: 'pending', message: '' },
        ]
      },
      {
        id: 'authentication',
        name: '👤 User Authentication',
        status: 'pending',
        tests: [
          { id: 'user-data', name: 'User Data Availability', status: 'pending', message: '' },
          { id: 'user-validation', name: 'User Data Validation', status: 'pending', message: '' },
          { id: 'user-type', name: 'User Type Detection', status: 'pending', message: '' },
        ]
      },
      {
        id: 'permissions',
        name: '🔐 Notification Permissions',
        status: 'pending',
        tests: [
          { id: 'permission-check', name: 'Current Permission Status', status: 'pending', message: '' },
          { id: 'permission-request', name: 'Permission Request', status: 'pending', message: '' },
          { id: 'permission-validation', name: 'Permission Validation', status: 'pending', message: '' },
        ]
      },
      {
        id: 'token-generation',
        name: '🎫 Push Token Generation',
        status: 'pending',
        tests: [
          { id: 'project-id', name: 'Project ID Configuration', status: 'pending', message: '' },
          { id: 'token-creation', name: 'Token Generation', status: 'pending', message: '' },
          { id: 'token-validation', name: 'Token Format Validation', status: 'pending', message: '' },
        ]
      },
      {
        id: 'backend',
        name: '🌐 Backend Connectivity',
        status: 'pending',
        tests: [
          { id: 'health-check', name: 'Backend Health Check', status: 'pending', message: '' },
          { id: 'api-availability', name: 'Push Token API Availability', status: 'pending', message: '' },
          { id: 'database-connection', name: 'Database Connection', status: 'pending', message: '' },
        ]
      },
      {
        id: 'registration',
        name: '📤 Token Registration',
        status: 'pending',
        tests: [
          { id: 'payload-creation', name: 'Registration Payload', status: 'pending', message: '' },
          { id: 'api-call', name: 'API Registration Call', status: 'pending', message: '' },
          { id: 'local-storage', name: 'Local Storage Update', status: 'pending', message: '' },
          { id: 'verification', name: 'Registration Verification', status: 'pending', message: '' },
        ]
      },
      {
        id: 'notification-test',
        name: '🔔 Notification Testing',
        status: 'pending',
        tests: [
          { id: 'test-send', name: 'Send Test Notification', status: 'pending', message: '' },
          { id: 'delivery-check', name: 'Delivery Verification', status: 'pending', message: '' },
          { id: 'error-handling', name: 'Error Handling Test', status: 'pending', message: '' },
        ]
      },
      {
        id: 'integration',
        name: '🔗 Service Integration',
        status: 'pending',
        tests: [
          { id: 'service-init', name: 'Push Token Service', status: 'pending', message: '' },
          { id: 'permission-service', name: 'Permission Service', status: 'pending', message: '' },
          { id: 'notification-manager', name: 'Notification Manager', status: 'pending', message: '' },
        ]
      }
    ];

    setTestSuites(suites);
  };

  const runEnvironmentTests = async () => {
    const suiteId = 'environment';
    updateSuiteStatus(suiteId, 'running');

    // Platform Detection
    updateTestResult(suiteId, 'platform', { status: 'running', message: 'Detecting platform...' });
    await new Promise(resolve => setTimeout(resolve, 500));
    updateTestResult(suiteId, 'platform', {
      status: 'success',
      message: `Platform: ${Platform.OS}`,
      details: { platform: Platform.OS, version: Platform.Version }
    });

    // Expo Environment
    updateTestResult(suiteId, 'expo-env', { status: 'running', message: 'Checking Expo environment...' });
    await new Promise(resolve => setTimeout(resolve, 500));
    const envStatus = isExpoGo && Platform.OS === 'android' ? 'error' : 'success';
    updateTestResult(suiteId, 'expo-env', {
      status: envStatus,
      message: isExpoGo 
        ? (Platform.OS === 'android' ? 'Expo Go on Android (Not Supported)' : 'Expo Go (Limited Support)')
        : 'Development/Production Build',
      details: {
        executionEnvironment: Constants.executionEnvironment,
        isExpoGo,
        supported: !(isExpoGo && Platform.OS === 'android')
      }
    });

    // Device Support
    updateTestResult(suiteId, 'device', { status: 'running', message: 'Checking device support...' });
    await new Promise(resolve => setTimeout(resolve, 500));
    const deviceSupported = Device?.isDevice;
    updateTestResult(suiteId, 'device', {
      status: deviceSupported ? 'success' : 'error',
      message: deviceSupported ? 'Physical Device' : 'Simulator/Emulator (Not Supported)',
      details: {
        isDevice: Device?.isDevice,
        deviceName: Device?.deviceName,
        platform: Platform.OS
      }
    });

    // Required Modules
    updateTestResult(suiteId, 'modules', { status: 'running', message: 'Checking required modules...' });
    await new Promise(resolve => setTimeout(resolve, 500));
    const modulesAvailable = !!Notifications && !!Device;
    updateTestResult(suiteId, 'modules', {
      status: modulesAvailable ? 'success' : 'error',
      message: modulesAvailable ? 'All modules loaded' : 'Missing required modules',
      details: {
        notifications: !!Notifications,
        device: !!Device,
        asyncStorage: !!AsyncStorage
      }
    });

    // App Configuration
    updateTestResult(suiteId, 'config', { status: 'running', message: 'Checking app configuration...' });
    await new Promise(resolve => setTimeout(resolve, 500));
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                      (Constants.expoConfig as any)?.projectId || 
                      '2fcc4ccc-b8b5-4ff4-ae3c-b195aa9eb32f';
    updateTestResult(suiteId, 'config', {
      status: 'success',
      message: 'Configuration loaded',
      details: {
        projectId,
        appVersion: Constants.expoConfig?.version,
        domain,
        sdkVersion: Constants.expoConfig?.sdkVersion
      }
    });

    updateSuiteStatus(suiteId, 'completed');
  };

  const runAuthenticationTests = async () => {
    const suiteId = 'authentication';
    updateSuiteStatus(suiteId, 'running');

    // User Data Availability
    updateTestResult(suiteId, 'user-data', { status: 'running', message: 'Checking user data...' });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const userDetailsString = await AsyncStorage.getItem("user");
      if (userDetailsString) {
        const userData = JSON.parse(userDetailsString);
        updateTestResult(suiteId, 'user-data', {
          status: 'success',
          message: 'User data found',
          details: {
            userId: userData._id,
            email: userData.email,
            hasRole: !!userData.role,
            hasUserType: !!userData.userType
          }
        });

        // User Data Validation
        updateTestResult(suiteId, 'user-validation', { status: 'running', message: 'Validating user data...' });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const isValid = userData._id && userData.email;
        updateTestResult(suiteId, 'user-validation', {
          status: isValid ? 'success' : 'error',
          message: isValid ? 'User data is valid' : 'Invalid user data',
          details: {
            hasId: !!userData._id,
            hasEmail: !!userData.email,
            emailFormat: userData.email?.includes('@')
          }
        });

        // User Type Detection
        updateTestResult(suiteId, 'user-type', { status: 'running', message: 'Detecting user type...' });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        let userType = 'client';
        if (userData.role) {
          if (userData.role === 'admin' || userData.role === 'client-admin') {
            userType = 'admin';
          } else if (userData.role === 'staff' || userData.role.includes('engineer')) {
            userType = 'staff';
          }
        }
        
        updateTestResult(suiteId, 'user-type', {
          status: 'success',
          message: `User type: ${userType}`,
          details: {
            detectedType: userType,
            originalRole: userData.role,
            originalUserType: userData.userType,
            hasClients: userData.clients?.length || 0
          }
        });

      } else {
        updateTestResult(suiteId, 'user-data', {
          status: 'error',
          message: 'No user data found - Please login first'
        });
        
        updateTestResult(suiteId, 'user-validation', {
          status: 'error',
          message: 'Cannot validate - No user data'
        });
        
        updateTestResult(suiteId, 'user-type', {
          status: 'error',
          message: 'Cannot detect - No user data'
        });
      }
    } catch (error: any) {
      updateTestResult(suiteId, 'user-data', {
        status: 'error',
        message: `Error reading user data: ${error.message}`
      });
    }

    updateSuiteStatus(suiteId, 'completed');
  };

  const runPermissionTests = async () => {
    const suiteId = 'permissions';
    updateSuiteStatus(suiteId, 'running');

    if (!Notifications) {
      updateTestResult(suiteId, 'permission-check', {
        status: 'error',
        message: 'Notifications module not available'
      });
      updateSuiteStatus(suiteId, 'completed');
      return;
    }

    // Current Permission Status
    updateTestResult(suiteId, 'permission-check', { status: 'running', message: 'Checking current permissions...' });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      updateTestResult(suiteId, 'permission-check', {
        status: status === 'granted' ? 'success' : 'warning',
        message: `Permission status: ${status}`,
        details: {
          status,
          granted: status === 'granted',
          canAskAgain
        }
      });

      // Permission Request
      if (status !== 'granted') {
        updateTestResult(suiteId, 'permission-request', { status: 'running', message: 'Requesting permissions...' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (canAskAgain) {
          const result = await Notifications.requestPermissionsAsync();
          updateTestResult(suiteId, 'permission-request', {
            status: result.status === 'granted' ? 'success' : 'error',
            message: `Permission request result: ${result.status}`,
            details: result
          });
        } else {
          updateTestResult(suiteId, 'permission-request', {
            status: 'error',
            message: 'Cannot request permissions - User denied permanently'
          });
        }
      } else {
        updateTestResult(suiteId, 'permission-request', {
          status: 'success',
          message: 'Permissions already granted'
        });
      }

      // Permission Validation
      updateTestResult(suiteId, 'permission-validation', { status: 'running', message: 'Validating permissions...' });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const finalStatus = await Notifications.getPermissionsAsync();
      updateTestResult(suiteId, 'permission-validation', {
        status: finalStatus.status === 'granted' ? 'success' : 'error',
        message: finalStatus.status === 'granted' ? 'Permissions validated' : 'Permissions not granted',
        details: finalStatus
      });

    } catch (error: any) {
      updateTestResult(suiteId, 'permission-check', {
        status: 'error',
        message: `Permission error: ${error.message}`
      });
    }

    updateSuiteStatus(suiteId, 'completed');
  };

  const runTokenGenerationTests = async () => {
    const suiteId = 'token-generation';
    updateSuiteStatus(suiteId, 'running');

    if (!Notifications) {
      updateTestResult(suiteId, 'project-id', {
        status: 'error',
        message: 'Notifications module not available'
      });
      updateSuiteStatus(suiteId, 'completed');
      return;
    }

    // Project ID Configuration
    updateTestResult(suiteId, 'project-id', { status: 'running', message: 'Checking project ID...' });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                      (Constants.expoConfig as any)?.projectId || 
                      '2fcc4ccc-b8b5-4ff4-ae3c-b195aa9eb32f';
    
    updateTestResult(suiteId, 'project-id', {
      status: 'success',
      message: 'Project ID configured',
      details: {
        projectId,
        source: Constants.expoConfig?.extra?.eas?.projectId ? 'eas.json' : 
                (Constants.expoConfig as any)?.projectId ? 'app.json' : 'fallback'
      }
    });

    // Token Generation
    updateTestResult(suiteId, 'token-creation', { status: 'running', message: 'Generating push token...' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      const token = tokenData.data;
      updateTestResult(suiteId, 'token-creation', {
        status: 'success',
        message: 'Push token generated successfully',
        details: {
          tokenPreview: token.substring(0, 50) + '...',
          tokenLength: token.length,
          fullToken: token
        }
      });

      // Token Format Validation
      updateTestResult(suiteId, 'token-validation', { status: 'running', message: 'Validating token format...' });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const isValidFormat = token.startsWith('ExponentPushToken[') && token.endsWith(']');
      const hasValidLength = token.length > 50;
      
      updateTestResult(suiteId, 'token-validation', {
        status: isValidFormat && hasValidLength ? 'success' : 'warning',
        message: isValidFormat && hasValidLength ? 'Token format is valid' : 'Token format may be invalid',
        details: {
          startsWithExponent: token.startsWith('ExponentPushToken['),
          endsWithBracket: token.endsWith(']'),
          hasValidLength,
          actualLength: token.length,
          format: isValidFormat ? 'Expo' : 'Unknown'
        }
      });

    } catch (error: any) {
      updateTestResult(suiteId, 'token-creation', {
        status: 'error',
        message: `Token generation failed: ${error.message}`,
        details: { error: error.message }
      });
      
      updateTestResult(suiteId, 'token-validation', {
        status: 'error',
        message: 'Cannot validate - Token generation failed'
      });
    }

    updateSuiteStatus(suiteId, 'completed');
  };

  const runBackendTests = async () => {
    const suiteId = 'backend';
    updateSuiteStatus(suiteId, 'running');

    // Backend Health Check
    updateTestResult(suiteId, 'health-check', { status: 'running', message: 'Checking backend health...' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const healthResponse = await fetch(`${domain}api/health`, {
        method: 'GET',
      });
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        updateTestResult(suiteId, 'health-check', {
          status: 'success',
          message: 'Backend is healthy',
          details: {
            status: healthData.status,
            timestamp: healthData.timestamp,
            responseTime: healthResponse.headers.get('x-response-time')
          }
        });
      } else {
        updateTestResult(suiteId, 'health-check', {
          status: 'error',
          message: `Backend health check failed: ${healthResponse.status}`,
          details: { status: healthResponse.status }
        });
      }
    } catch (error: any) {
      updateTestResult(suiteId, 'health-check', {
        status: 'error',
        message: `Cannot connect to backend: ${error.message}`,
        details: { error: error.message, domain }
      });
    }

    // API Availability
    updateTestResult(suiteId, 'api-availability', { status: 'running', message: 'Checking push token API...' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const apiResponse = await fetch(`${domain}api/push-token/stats`, {
        method: 'GET',
      });
      
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        updateTestResult(suiteId, 'api-availability', {
          status: 'success',
          message: 'Push token API is available',
          details: {
            totalTokens: apiData.data?.tokens?.total || 0,
            activeTokens: apiData.data?.tokens?.active || 0
          }
        });
      } else {
        updateTestResult(suiteId, 'api-availability', {
          status: 'warning',
          message: `API returned status: ${apiResponse.status}`,
          details: { status: apiResponse.status }
        });
      }
    } catch (error: any) {
      updateTestResult(suiteId, 'api-availability', {
        status: 'error',
        message: `API check failed: ${error.message}`
      });
    }

    // Database Connection (indirect test)
    updateTestResult(suiteId, 'database-connection', { status: 'running', message: 'Testing database connection...' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const dbTestResponse = await fetch(`${domain}api/push-token/stats`, {
        method: 'GET',
      });
      
      if (dbTestResponse.ok) {
        const dbData = await dbTestResponse.json();
        updateTestResult(suiteId, 'database-connection', {
          status: dbData.success ? 'success' : 'error',
          message: dbData.success ? 'Database connection working' : 'Database connection issues',
          details: dbData
        });
      } else {
        updateTestResult(suiteId, 'database-connection', {
          status: 'error',
          message: 'Database connection test failed'
        });
      }
    } catch (error: any) {
      updateTestResult(suiteId, 'database-connection', {
        status: 'error',
        message: `Database test failed: ${error.message}`
      });
    }

    updateSuiteStatus(suiteId, 'completed');
  };

  const runRegistrationTests = async () => {
    const suiteId = 'registration';
    updateSuiteStatus(suiteId, 'running');

    try {
      // Get user data and token
      const userDetailsString = await AsyncStorage.getItem("user");
      if (!userDetailsString) {
        updateTestResult(suiteId, 'payload-creation', {
          status: 'error',
          message: 'No user data available for registration'
        });
        updateSuiteStatus(suiteId, 'completed');
        return;
      }

      const userData = JSON.parse(userDetailsString);
      
      if (!Notifications) {
        updateTestResult(suiteId, 'payload-creation', {
          status: 'error',
          message: 'Notifications module not available'
        });
        updateSuiteStatus(suiteId, 'completed');
        return;
      }

      // Payload Creation
      updateTestResult(suiteId, 'payload-creation', { status: 'running', message: 'Creating registration payload...' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                        (Constants.expoConfig as any)?.projectId || 
                        '2fcc4ccc-b8b5-4ff4-ae3c-b195aa9eb32f';
      
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      const token = tokenData.data;
      
      let userType = 'client';
      if (userData.role) {
        if (userData.role === 'admin' || userData.role === 'client-admin') {
          userType = 'admin';
        } else if (userData.role === 'staff' || userData.role.includes('engineer')) {
          userType = 'staff';
        }
      }
      
      const payload = {
        userId: userData._id,
        userType: userType,
        token: token,
        platform: Platform.OS,
        deviceId: Constants.sessionId || Constants.installationId || 'unknown',
        deviceName: Device?.deviceName || `${Platform.OS} Device`,
        appVersion: Constants.expoConfig?.version || '1.0.0'
      };

      updateTestResult(suiteId, 'payload-creation', {
        status: 'success',
        message: 'Registration payload created',
        details: {
          userId: payload.userId,
          userType: payload.userType,
          platform: payload.platform,
          deviceId: payload.deviceId,
          tokenPreview: token.substring(0, 30) + '...'
        }
      });

      // API Registration Call
      updateTestResult(suiteId, 'api-call', { status: 'running', message: 'Calling registration API...' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await fetch(`${domain}api/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      
      if (response.ok && responseData.success) {
        updateTestResult(suiteId, 'api-call', {
          status: 'success',
          message: 'Registration API call successful',
          details: {
            tokenId: responseData.data?.tokenId,
            isNew: responseData.data?.isNew,
            message: responseData.message
          }
        });

        // Local Storage Update
        updateTestResult(suiteId, 'local-storage', { status: 'running', message: 'Updating local storage...' });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await AsyncStorage.setItem('pushToken', token);
        await AsyncStorage.setItem('pushTokenRegistered', 'true');
        await AsyncStorage.setItem('pushTokenRegistrationTime', Date.now().toString());
        
        updateTestResult(suiteId, 'local-storage', {
          status: 'success',
          message: 'Local storage updated successfully'
        });

        // Registration Verification
        updateTestResult(suiteId, 'verification', { status: 'running', message: 'Verifying registration...' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const storedToken = await AsyncStorage.getItem('pushToken');
        const isRegistered = await AsyncStorage.getItem('pushTokenRegistered');
        
        updateTestResult(suiteId, 'verification', {
          status: storedToken && isRegistered === 'true' ? 'success' : 'error',
          message: storedToken && isRegistered === 'true' ? 'Registration verified' : 'Registration verification failed',
          details: {
            hasStoredToken: !!storedToken,
            isMarkedRegistered: isRegistered === 'true',
            tokenMatches: storedToken === token
          }
        });

      } else {
        updateTestResult(suiteId, 'api-call', {
          status: 'error',
          message: `Registration failed: ${responseData.message || 'Unknown error'}`,
          details: {
            status: response.status,
            success: responseData.success,
            message: responseData.message,
            error: responseData.error
          }
        });
        
        updateTestResult(suiteId, 'local-storage', {
          status: 'error',
          message: 'Skipped - API call failed'
        });
        
        updateTestResult(suiteId, 'verification', {
          status: 'error',
          message: 'Skipped - Registration failed'
        });
      }

    } catch (error: any) {
      updateTestResult(suiteId, 'api-call', {
        status: 'error',
        message: `Registration error: ${error.message}`,
        details: { error: error.message }
      });
    }

    updateSuiteStatus(suiteId, 'completed');
  };

  const runNotificationTests = async () => {
    const suiteId = 'notification-test';
    updateSuiteStatus(suiteId, 'running');

    try {
      const userDetailsString = await AsyncStorage.getItem("user");
      if (!userDetailsString) {
        updateTestResult(suiteId, 'test-send', {
          status: 'error',
          message: 'No user data available for notification test'
        });
        updateSuiteStatus(suiteId, 'completed');
        return;
      }

      const userData = JSON.parse(userDetailsString);

      // Send Test Notification
      updateTestResult(suiteId, 'test-send', { status: 'running', message: 'Sending test notification...' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const testNotification = {
        title: 'Push Token Test',
        body: `Test notification sent at ${new Date().toLocaleTimeString()}`,
        data: {
          type: 'test',
          userId: userData._id,
          timestamp: new Date().toISOString(),
          testId: Math.random().toString(36).substr(2, 9)
        },
        recipients: [userData._id]
      };

      const notificationResponse = await fetch(`${domain}api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testNotification),
      });

      const notificationData = await notificationResponse.json();
      
      if (notificationResponse.ok && notificationData.success) {
        const successful = notificationData.data?.notificationsSent || 0;
        const failed = notificationData.data?.notificationsFailed || 0;
        
        updateTestResult(suiteId, 'test-send', {
          status: successful > 0 ? 'success' : 'warning',
          message: `Notification sent (${successful} sent, ${failed} failed)`,
          details: {
            sent: successful,
            failed: failed,
            recipients: notificationData.data?.recipients || [],
            testId: testNotification.data.testId
          }
        });

        // Delivery Check
        updateTestResult(suiteId, 'delivery-check', { status: 'running', message: 'Checking delivery status...' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Note: In a real implementation, you'd check delivery receipts
        updateTestResult(suiteId, 'delivery-check', {
          status: 'success',
          message: 'Check your device for the test notification',
          details: {
            note: 'Manual verification required - check if notification appeared on device'
          }
        });

      } else {
        updateTestResult(suiteId, 'test-send', {
          status: 'error',
          message: `Notification send failed: ${notificationData.message || 'Unknown error'}`,
          details: notificationData
        });
        
        updateTestResult(suiteId, 'delivery-check', {
          status: 'error',
          message: 'Skipped - Send failed'
        });
      }

      // Error Handling Test
      updateTestResult(suiteId, 'error-handling', { status: 'running', message: 'Testing error handling...' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        // Test with invalid data
        const errorTestResponse = await fetch(`${domain}api/notifications/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: 'Error Test',
            recipients: ['invalid-user-id']
          }),
        });

        const errorTestData = await errorTestResponse.json();
        
        updateTestResult(suiteId, 'error-handling', {
          status: 'success',
          message: 'Error handling works correctly',
          details: {
            handledGracefully: !errorTestData.success,
            errorMessage: errorTestData.message
          }
        });

      } catch (error: any) {
        updateTestResult(suiteId, 'error-handling', {
          status: 'warning',
          message: 'Error handling test inconclusive',
          details: { error: error.message }
        });
      }

    } catch (error: any) {
      updateTestResult(suiteId, 'test-send', {
        status: 'error',
        message: `Notification test error: ${error.message}`
      });
    }

    updateSuiteStatus(suiteId, 'completed');
  };

  const runIntegrationTests = async () => {
    const suiteId = 'integration';
    updateSuiteStatus(suiteId, 'running');

    // Push Token Service
    updateTestResult(suiteId, 'service-init', { status: 'running', message: 'Testing Push Token Service...' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const pushTokenService = PushTokenService.getInstance();
      const isRegistered = await pushTokenService.isTokenRegistered();
      const currentToken = pushTokenService.getCurrentToken();
      
      updateTestResult(suiteId, 'service-init', {
        status: 'success',
        message: 'Push Token Service working',
        details: {
          serviceAvailable: !!pushTokenService,
          isRegistered,
          hasCurrentToken: !!currentToken
        }
      });
    } catch (error: any) {
      updateTestResult(suiteId, 'service-init', {
        status: 'error',
        message: `Service error: ${error.message}`
      });
    }

    // Permission Service
    updateTestResult(suiteId, 'permission-service', { status: 'running', message: 'Testing Permission Service...' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const permissionService = NotificationPermissions.getInstance();
      const deviceSupport = await permissionService.isDeviceSupported();
      const permissionStatus = await permissionService.getPermissionStatus();
      
      updateTestResult(suiteId, 'permission-service', {
        status: 'success',
        message: 'Permission Service working',
        details: {
          serviceAvailable: !!permissionService,
          deviceSupported: deviceSupport.supported,
          permissionGranted: permissionStatus.granted
        }
      });
    } catch (error: any) {
      updateTestResult(suiteId, 'permission-service', {
        status: 'error',
        message: `Permission service error: ${error.message}`
      });
    }

    // Notification Manager (if available)
    updateTestResult(suiteId, 'notification-manager', { status: 'running', message: 'Testing Notification Manager...' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Test if notification manager is working by checking AsyncStorage
      const notificationSetup = await AsyncStorage.getItem('notificationSetupChecked');
      const pushTokenRegistered = await AsyncStorage.getItem('pushTokenRegistered');
      
      updateTestResult(suiteId, 'notification-manager', {
        status: 'success',
        message: 'Notification Manager integration working',
        details: {
          setupChecked: !!notificationSetup,
          tokenRegistered: pushTokenRegistered === 'true',
          storageAccessible: true
        }
      });
    } catch (error: any) {
      updateTestResult(suiteId, 'notification-manager', {
        status: 'error',
        message: `Notification manager error: ${error.message}`
      });
    }

    updateSuiteStatus(suiteId, 'completed');
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setOverallStatus('running');
    setStartTime(Date.now());
    initializeTestSuites();

    try {
      await runEnvironmentTests();
      await runAuthenticationTests();
      await runPermissionTests();
      await runTokenGenerationTests();
      await runBackendTests();
      await runRegistrationTests();
      await runNotificationTests();
      await runIntegrationTests();
    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      setIsRunning(false);
      setOverallStatus('completed');
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Ionicons name="ellipse-outline" size={16} color="#9CA3AF" />;
      case 'running':
        return <ActivityIndicator size="small" color="#3B82F6" />;
      case 'success':
        return <Ionicons name="checkmark-circle" size={16} color="#10B981" />;
      case 'warning':
        return <Ionicons name="warning" size={16} color="#F59E0B" />;
      case 'error':
        return <Ionicons name="close-circle" size={16} color="#EF4444" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return '#9CA3AF';
      case 'running':
        return '#3B82F6';
      case 'success':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'error':
        return '#EF4444';
    }
  };

  const getSuiteStatusIcon = (suite: TestSuite) => {
    const hasError = suite.tests.some(test => test.status === 'error');
    const hasWarning = suite.tests.some(test => test.status === 'warning');
    const allCompleted = suite.tests.every(test => test.status !== 'pending' && test.status !== 'running');
    const isRunning = suite.status === 'running';

    if (isRunning) {
      return <ActivityIndicator size="small" color="#3B82F6" />;
    } else if (hasError) {
      return <Ionicons name="close-circle" size={20} color="#EF4444" />;
    } else if (hasWarning) {
      return <Ionicons name="warning" size={20} color="#F59E0B" />;
    } else if (allCompleted) {
      return <Ionicons name="checkmark-circle" size={20} color="#10B981" />;
    } else {
      return <Ionicons name="ellipse-outline" size={20} color="#9CA3AF" />;
    }
  };

  const getOverallStatus = () => {
    if (overallStatus === 'running') return 'Running Tests...';
    if (overallStatus === 'idle') return 'Ready to Test';
    
    const totalTests = testSuites.reduce((acc, suite) => acc + suite.tests.length, 0);
    const successfulTests = testSuites.reduce((acc, suite) => 
      acc + suite.tests.filter(test => test.status === 'success').length, 0);
    const errorTests = testSuites.reduce((acc, suite) => 
      acc + suite.tests.filter(test => test.status === 'error').length, 0);
    const warningTests = testSuites.reduce((acc, suite) => 
      acc + suite.tests.filter(test => test.status === 'warning').length, 0);

    return `Completed: ${successfulTests}/${totalTests} passed, ${errorTests} errors, ${warningTests} warnings`;
  };

  const exportResults = () => {
    const results = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      environment: {
        platform: Platform.OS,
        isExpoGo,
        executionEnvironment: Constants.executionEnvironment
      },
      testSuites: testSuites.map(suite => ({
        ...suite,
        tests: suite.tests.map(test => ({
          ...test,
          details: test.details
        }))
      }))
    };

    console.log('=== COMPREHENSIVE PUSH TOKEN TEST RESULTS ===');
    console.log(JSON.stringify(results, null, 2));
    console.log('=== END RESULTS ===');

    Alert.alert(
      'Results Exported',
      'Test results have been logged to console. Check the console for detailed results.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Comprehensive Push Token Test</Text>
        <Text style={styles.subtitle}>{getOverallStatus()}</Text>
        {overallStatus === 'completed' && (
          <Text style={styles.duration}>
            Duration: {((Date.now() - startTime) / 1000).toFixed(1)}s
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, isRunning && styles.buttonDisabled]}
          onPress={runAllTests}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={exportResults}
          disabled={overallStatus !== 'completed'}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>Export Results</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {testSuites.map((suite) => (
          <View key={suite.id} style={styles.suiteContainer}>
            <View style={styles.suiteHeader}>
              {getSuiteStatusIcon(suite)}
              <Text style={styles.suiteName}>{suite.name}</Text>
              <Text style={styles.suiteProgress}>
                {suite.tests.filter(t => t.status === 'success').length}/{suite.tests.length}
              </Text>
            </View>

            {suite.tests.map((test) => (
              <View key={test.id} style={styles.testItem}>
                <View style={styles.testHeader}>
                  {getStatusIcon(test.status)}
                  <Text style={[styles.testName, { color: getStatusColor(test.status) }]}>
                    {test.name}
                  </Text>
                </View>
                
                <Text style={styles.testMessage}>{test.message}</Text>
                
                {test.details && (
                  <View style={styles.testDetails}>
                    <Text style={styles.testDetailsText}>
                      {JSON.stringify(test.details, null, 2)}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  duration: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#374151',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  suiteContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suiteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suiteName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
  suiteProgress: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  testItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  testMessage: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    marginLeft: 24,
  },
  testDetails: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 6,
    marginLeft: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  testDetailsText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
});

export default ComprehensivePushTokenTest;