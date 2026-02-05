import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Alert, 
  View, 
  ScrollView, 
  Modal,
  ActivityIndicator,
  Clipboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { domain } from '@/lib/domain';

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

interface PushTokenTestButtonProps {
  style?: any;
}

const PushTokenTestButton: React.FC<PushTokenTestButtonProps> = ({ style }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [testOutput, setTestOutput] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<any>(null);

  const log = (message: string) => {
    console.log(message);
    setTestOutput(prev => [...prev, message]);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setTestOutput([]);
    setTestResults(null);

    const startTime = Date.now();
    const results = {
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      environment: Constants.executionEnvironment,
      tests: {} as any,
      summary: { total: 0, passed: 0, failed: 0, warnings: 0 }
    };

    const logTest = (testName: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details: any = null) => {
      const result = { status, message, details, timestamp: new Date().toISOString() };
      results.tests[testName] = result;
      results.summary.total++;
      
      if (status === 'PASS') {
        results.summary.passed++;
        log(`✅ ${testName}: ${message}`);
      } else if (status === 'FAIL') {
        results.summary.failed++;
        log(`❌ ${testName}: ${message}`);
      } else if (status === 'WARN') {
        results.summary.warnings++;
        log(`⚠️ ${testName}: ${message}`);
      }
      
      if (details) {
        log(`   Details: ${JSON.stringify(details, null, 2)}`);
      }
    };

    try {
      log('🚀 STARTING COMPREHENSIVE PUSH TOKEN TEST');
      log('='.repeat(50));

      // Environment Tests
      log('\n🌍 TESTING ENVIRONMENT...');
      
      logTest('Platform Detection', 'PASS', `Running on ${Platform.OS}`, {
        platform: Platform.OS,
        version: Platform.Version
      });

      if (isExpoGo && Platform.OS === 'android') {
        logTest('Expo Environment', 'FAIL', 'Expo Go on Android is not supported for push notifications', {
          executionEnvironment: Constants.executionEnvironment,
          isExpoGo,
          platform: Platform.OS
        });
        setTestResults(results);
        setIsRunning(false);
        return;
      } else {
        logTest('Expo Environment', 'PASS', isExpoGo ? 'Expo Go (iOS)' : 'Development/Production Build', {
          executionEnvironment: Constants.executionEnvironment,
          isExpoGo
        });
      }

      if (!Device?.isDevice) {
        logTest('Device Support', 'FAIL', 'Push notifications require a physical device', {
          isDevice: Device?.isDevice,
          deviceName: Device?.deviceName
        });
      } else {
        logTest('Device Support', 'PASS', `Physical device: ${Device.deviceName}`, {
          isDevice: Device?.isDevice,
          deviceName: Device?.deviceName
        });
      }

      if (!Notifications || !Device) {
        logTest('Required Modules', 'FAIL', 'Missing required notification modules', {
          notifications: !!Notifications,
          device: !!Device
        });
      } else {
        logTest('Required Modules', 'PASS', 'All required modules loaded', {
          notifications: !!Notifications,
          device: !!Device,
          asyncStorage: !!AsyncStorage
        });
      }

      await sleep(500);

      // User Authentication Tests
      log('\n👤 TESTING USER AUTHENTICATION...');
      
      let userData = null;
      try {
        const userDetailsString = await AsyncStorage.getItem("user");
        
        if (!userDetailsString) {
          logTest('User Data', 'FAIL', 'No user data found - Please login first');
        } else {
          userData = JSON.parse(userDetailsString);
          
          if (!userData._id || !userData.email) {
            logTest('User Data', 'FAIL', 'Invalid user data - Missing required fields', {
              hasId: !!userData._id,
              hasEmail: !!userData.email
            });
            userData = null;
          } else {
            logTest('User Data', 'PASS', `User authenticated: ${userData.email}`, {
              userId: userData._id,
              email: userData.email,
              role: userData.role,
              userType: userData.userType,
              hasClients: userData.clients?.length || 0
            });
          }
        }
      } catch (error: any) {
        logTest('User Data', 'FAIL', `Error reading user data: ${error.message}`);
      }

      await sleep(500);

      // Permission Tests
      log('\n🔐 TESTING PERMISSIONS...');
      
      if (!Notifications) {
        logTest('Permission Check', 'FAIL', 'Notifications module not available');
      } else {
        try {
          const { status, canAskAgain } = await Notifications.getPermissionsAsync();
          
          logTest('Permission Status', status === 'granted' ? 'PASS' : 'WARN', `Current status: ${status}`, {
            status,
            granted: status === 'granted',
            canAskAgain
          });

          if (status !== 'granted' && canAskAgain) {
            log('   Requesting permissions...');
            const result = await Notifications.requestPermissionsAsync();
            
            logTest('Permission Request', result.status === 'granted' ? 'PASS' : 'FAIL', 
              `Permission request result: ${result.status}`, result);
          }
        } catch (error: any) {
          logTest('Permission Check', 'FAIL', `Permission error: ${error.message}`);
        }
      }

      await sleep(500);

      // Token Generation Tests
      log('\n🎫 TESTING TOKEN GENERATION...');
      
      let token = null;
      if (!Notifications) {
        logTest('Token Generation', 'FAIL', 'Notifications module not available');
      } else {
        try {
          const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                            Constants.expoConfig?.projectId || 
                            '2fcc4ccc-b8b5-4ff4-ae3c-b195aa9eb32f';
          
          logTest('Project ID', 'PASS', `Using project ID: ${projectId}`, {
            projectId,
            source: Constants.expoConfig?.extra?.eas?.projectId ? 'eas.json' : 
                    Constants.expoConfig?.projectId ? 'app.json' : 'fallback'
          });

          log('   Generating push token...');
          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
          });

          token = tokenData.data;
          
          const isValidFormat = token.startsWith('ExponentPushToken[') && token.endsWith(']');
          const hasValidLength = token.length > 50;
          
          if (isValidFormat && hasValidLength) {
            logTest('Token Generation', 'PASS', 'Push token generated successfully', {
              tokenPreview: token.substring(0, 50) + '...',
              tokenLength: token.length,
              format: 'Expo',
              isValid: true
            });
          } else {
            logTest('Token Generation', 'WARN', 'Token generated but format may be invalid', {
              tokenPreview: token.substring(0, 50) + '...',
              tokenLength: token.length,
              startsWithExponent: token.startsWith('ExponentPushToken['),
              endsWithBracket: token.endsWith(']'),
              hasValidLength
            });
          }
        } catch (error: any) {
          logTest('Token Generation', 'FAIL', `Token generation failed: ${error.message}`);
        }
      }

      await sleep(500);

      // Backend Connectivity Tests
      log('\n🌐 TESTING BACKEND CONNECTIVITY...');
      
      try {
        log('   Testing backend health...');
        const healthResponse = await fetch(`${domain}api/health`, {
          method: 'GET',
        });
        
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          logTest('Backend Health', 'PASS', 'Backend is accessible and healthy', {
            status: healthData.status,
            url: domain
          });
        } else {
          logTest('Backend Health', 'WARN', `Backend returned status: ${healthResponse.status}`, {
            status: healthResponse.status,
            url: domain
          });
        }

        log('   Testing push token API...');
        const apiResponse = await fetch(`${domain}api/push-token/stats`, {
          method: 'GET',
        });
        
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          logTest('API Availability', 'PASS', 'Push token API is available', {
            totalTokens: apiData.data?.tokens?.total || 0,
            activeTokens: apiData.data?.tokens?.active || 0
          });
        } else {
          logTest('API Availability', 'WARN', `API returned status: ${apiResponse.status}`);
        }
      } catch (error: any) {
        logTest('Backend Connectivity', 'FAIL', `Cannot connect to backend: ${error.message}`, {
          error: error.message,
          url: domain
        });
      }

      await sleep(500);

      // Token Registration Tests
      log('\n📤 TESTING TOKEN REGISTRATION...');
      
      if (!userData || !token) {
        logTest('Registration Prerequisites', 'FAIL', 'Missing user data or token');
      } else {
        try {
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
          
          logTest('Registration Payload', 'PASS', 'Registration payload created', {
            userId: payload.userId,
            userType: payload.userType,
            platform: payload.platform,
            deviceId: payload.deviceId,
            tokenPreview: token.substring(0, 30) + '...'
          });

          log('   Calling registration API...');
          const response = await fetch(`${domain}api/push-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          const responseData = await response.json();
          
          if (response.ok && responseData.success) {
            logTest('API Registration', 'PASS', 'Token registered successfully with backend', {
              tokenId: responseData.data?.tokenId,
              isNew: responseData.data?.isNew,
              message: responseData.message
            });
            
            await AsyncStorage.setItem('pushToken', token);
            await AsyncStorage.setItem('pushTokenRegistered', 'true');
            await AsyncStorage.setItem('pushTokenRegistrationTime', Date.now().toString());
            
            logTest('Local Storage', 'PASS', 'Token stored locally');
            
            const storedToken = await AsyncStorage.getItem('pushToken');
            const isRegistered = await AsyncStorage.getItem('pushTokenRegistered');
            
            if (storedToken === token && isRegistered === 'true') {
              logTest('Registration Verification', 'PASS', 'Registration verified successfully');
            } else {
              logTest('Registration Verification', 'FAIL', 'Local storage verification failed');
            }
          } else {
            logTest('API Registration', 'FAIL', `Registration failed: ${responseData.message || 'Unknown error'}`, {
              status: response.status,
              success: responseData.success,
              message: responseData.message,
              error: responseData.error
            });
          }
        } catch (error: any) {
          logTest('Token Registration', 'FAIL', `Registration error: ${error.message}`);
        }
      }

      await sleep(500);

      // Notification Send Test
      log('\n🔔 TESTING NOTIFICATION SEND...');
      
      if (!userData) {
        logTest('Notification Test', 'FAIL', 'No user data available');
      } else {
        try {
          const testNotification = {
            title: 'Push Token Test Complete',
            body: `Test notification sent at ${new Date().toLocaleTimeString()}`,
            data: {
              type: 'test',
              userId: userData._id,
              timestamp: new Date().toISOString(),
              testId: Math.random().toString(36).substr(2, 9)
            },
            recipients: [userData._id]
          };

          log('   Sending test notification...');
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
            
            if (successful > 0) {
              logTest('Notification Send', 'PASS', `Test notification sent successfully (${successful} sent, ${failed} failed)`, {
                sent: successful,
                failed: failed,
                testId: testNotification.data.testId
              });
            } else {
              logTest('Notification Send', 'WARN', `Notification API succeeded but no notifications sent (${successful} sent, ${failed} failed)`, {
                sent: successful,
                failed: failed,
                recipients: notificationData.data?.recipients || []
              });
            }
          } else {
            logTest('Notification Send', 'FAIL', `Notification send failed: ${notificationData.message || 'Unknown error'}`, notificationData);
          }
        } catch (error: any) {
          logTest('Notification Send', 'FAIL', `Notification test error: ${error.message}`);
        }
      }

      // Final Summary
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      results.duration = duration;

      log('\n' + '='.repeat(50));
      log('📊 TEST SUMMARY');
      log('='.repeat(50));
      
      log(`⏱️  Duration: ${duration}s`);
      log(`📱 Platform: ${results.platform}`);
      log(`🏗️  Environment: ${results.environment}`);
      log('');
      
      log(`📈 Results:`);
      log(`   Total Tests: ${results.summary.total}`);
      log(`   ✅ Passed: ${results.summary.passed}`);
      log(`   ❌ Failed: ${results.summary.failed}`);
      log(`   ⚠️  Warnings: ${results.summary.warnings}`);
      
      const successRate = results.summary.total > 0 
        ? ((results.summary.passed / results.summary.total) * 100).toFixed(1)
        : 0;
      
      log(`   📊 Success Rate: ${successRate}%`);
      log('');
      
      if (results.summary.failed === 0 && results.summary.passed > 0) {
        log('🎉 ALL TESTS PASSED! Push token registration is working correctly.');
      } else if (results.summary.failed > 0) {
        log('🔧 SOME TESTS FAILED. Check the failed tests above for solutions.');
      } else {
        log('⚠️  NO TESTS COMPLETED. Check environment and try again.');
      }

      setTestResults(results);

    } catch (error: any) {
      log(`💥 Unexpected error during testing: ${error.message}`);
      logTest('Test Runner', 'FAIL', `Unexpected error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const copyResults = async () => {
    const fullOutput = testOutput.join('\n');
    const detailedResults = testResults ? JSON.stringify(testResults, null, 2) : '';
    
    const copyText = `PUSH TOKEN TEST RESULTS
${new Date().toISOString()}

CONSOLE OUTPUT:
${fullOutput}

DETAILED RESULTS:
${detailedResults}`;

    try {
      await Clipboard.setString(copyText);
      Alert.alert('Copied!', 'Test results copied to clipboard');
    } catch (error) {
      Alert.alert('Copy Failed', 'Could not copy results to clipboard');
    }
  };

  const handlePress = () => {
    setIsModalVisible(true);
  };

  return (
    <>
      <TouchableOpacity style={[styles.button, style]} onPress={handlePress}>
        <Ionicons name="bug-outline" size={20} color="#FFFFFF" />
        <Text style={styles.buttonText}>Test Push Tokens</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Push Token Test</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.testButton, isRunning && styles.testButtonDisabled]}
              onPress={runComprehensiveTest}
              disabled={isRunning}
            >
              {isRunning ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="play" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.testButtonText}>
                {isRunning ? 'Running Test...' : 'Run Complete Test'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.copyButton, testOutput.length === 0 && styles.copyButtonDisabled]}
              onPress={copyResults}
              disabled={testOutput.length === 0}
            >
              <Ionicons name="copy-outline" size={20} color="#FFFFFF" />
              <Text style={styles.copyButtonText}>Copy Results</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.outputContainer}>
            {testOutput.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="information-circle-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>
                  Tap "Run Complete Test" to start testing your push token system
                </Text>
              </View>
            ) : (
              testOutput.map((line, index) => (
                <Text key={index} style={styles.outputLine}>
                  {line}
                </Text>
              ))
            )}
          </ScrollView>

          {testResults && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Quick Summary</Text>
              <View style={styles.summaryStats}>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{testResults.summary.passed}</Text>
                  <Text style={styles.statLabel}>Passed</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statNumber, { color: '#EF4444' }]}>{testResults.summary.failed}</Text>
                  <Text style={styles.statLabel}>Failed</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{testResults.summary.warnings}</Text>
                  <Text style={styles.statLabel}>Warnings</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  testButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  testButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  copyButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  outputContainer: {
    flex: 1,
    backgroundColor: '#1F2937',
    margin: 16,
    borderRadius: 8,
    padding: 16,
  },
  outputLine: {
    color: '#F9FAFB',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});

export default PushTokenTestButton;