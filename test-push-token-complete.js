/**
 * Complete Push Token Registration Test Script
 * Run this script to test all aspects of push token registration
 * 
 * Usage:
 * 1. Make sure you're logged in to the app
 * 2. Run this script in the React Native debugger console
 * 3. Check the output for detailed results
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configuration
const DOMAIN = "https://real-estate-optimize-apis.vercel.app/";
const PROJECT_ID = "2fcc4ccc-b8b5-4ff4-ae3c-b195aa9eb32f";

// Check if we're in Expo Go
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Dynamic imports
let Notifications = null;
let Device = null;

if (!(isExpoGo && Platform.OS === 'android')) {
  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
  } catch (error) {
    console.warn('Failed to load notification modules:', error);
  }
}

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  platform: Platform.OS,
  environment: Constants.executionEnvironment,
  tests: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

// Helper functions
const logTest = (testName, status, message, details = null) => {
  const result = {
    status,
    message,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests[testName] = result;
  testResults.summary.total++;
  
  if (status === 'PASS') {
    testResults.summary.passed++;
    console.log(`✅ ${testName}: ${message}`);
  } else if (status === 'FAIL') {
    testResults.summary.failed++;
    console.log(`❌ ${testName}: ${message}`);
  } else if (status === 'WARN') {
    testResults.summary.warnings++;
    console.log(`⚠️ ${testName}: ${message}`);
  }
  
  if (details) {
    console.log(`   Details:`, details);
  }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test functions
async function testEnvironment() {
  console.log('\n🌍 TESTING ENVIRONMENT...');
  
  // Platform test
  logTest('Platform Detection', 'PASS', `Running on ${Platform.OS}`, {
    platform: Platform.OS,
    version: Platform.Version
  });
  
  // Expo environment test
  if (isExpoGo && Platform.OS === 'android') {
    logTest('Expo Environment', 'FAIL', 'Expo Go on Android is not supported for push notifications', {
      executionEnvironment: Constants.executionEnvironment,
      isExpoGo,
      platform: Platform.OS
    });
    return false;
  } else {
    logTest('Expo Environment', 'PASS', isExpoGo ? 'Expo Go (iOS)' : 'Development/Production Build', {
      executionEnvironment: Constants.executionEnvironment,
      isExpoGo
    });
  }
  
  // Device test
  if (!Device?.isDevice) {
    logTest('Device Support', 'FAIL', 'Push notifications require a physical device', {
      isDevice: Device?.isDevice,
      deviceName: Device?.deviceName
    });
    return false;
  } else {
    logTest('Device Support', 'PASS', `Physical device: ${Device.deviceName}`, {
      isDevice: Device?.isDevice,
      deviceName: Device?.deviceName
    });
  }
  
  // Modules test
  if (!Notifications || !Device) {
    logTest('Required Modules', 'FAIL', 'Missing required notification modules', {
      notifications: !!Notifications,
      device: !!Device
    });
    return false;
  } else {
    logTest('Required Modules', 'PASS', 'All required modules loaded', {
      notifications: !!Notifications,
      device: !!Device,
      asyncStorage: !!AsyncStorage
    });
  }
  
  return true;
}

async function testUserAuthentication() {
  console.log('\n👤 TESTING USER AUTHENTICATION...');
  
  try {
    const userDetailsString = await AsyncStorage.getItem("user");
    
    if (!userDetailsString) {
      logTest('User Data', 'FAIL', 'No user data found - Please login first');
      return null;
    }
    
    const userData = JSON.parse(userDetailsString);
    
    if (!userData._id || !userData.email) {
      logTest('User Data', 'FAIL', 'Invalid user data - Missing required fields', {
        hasId: !!userData._id,
        hasEmail: !!userData.email
      });
      return null;
    }
    
    logTest('User Data', 'PASS', `User authenticated: ${userData.email}`, {
      userId: userData._id,
      email: userData.email,
      role: userData.role,
      userType: userData.userType,
      hasClients: userData.clients?.length || 0
    });
    
    return userData;
    
  } catch (error) {
    logTest('User Data', 'FAIL', `Error reading user data: ${error.message}`);
    return null;
  }
}

async function testPermissions() {
  console.log('\n🔐 TESTING PERMISSIONS...');
  
  if (!Notifications) {
    logTest('Permission Check', 'FAIL', 'Notifications module not available');
    return false;
  }
  
  try {
    // Check current permissions
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();
    
    logTest('Permission Status', status === 'granted' ? 'PASS' : 'WARN', `Current status: ${status}`, {
      status,
      granted: status === 'granted',
      canAskAgain
    });
    
    // Request permissions if needed
    if (status !== 'granted') {
      if (canAskAgain) {
        console.log('   Requesting permissions...');
        const result = await Notifications.requestPermissionsAsync();
        
        logTest('Permission Request', result.status === 'granted' ? 'PASS' : 'FAIL', 
          `Permission request result: ${result.status}`, result);
        
        return result.status === 'granted';
      } else {
        logTest('Permission Request', 'FAIL', 'Cannot request permissions - User denied permanently');
        return false;
      }
    }
    
    return true;
    
  } catch (error) {
    logTest('Permission Check', 'FAIL', `Permission error: ${error.message}`);
    return false;
  }
}

async function testTokenGeneration() {
  console.log('\n🎫 TESTING TOKEN GENERATION...');
  
  if (!Notifications) {
    logTest('Token Generation', 'FAIL', 'Notifications module not available');
    return null;
  }
  
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                      Constants.expoConfig?.projectId || 
                      PROJECT_ID;
    
    logTest('Project ID', 'PASS', `Using project ID: ${projectId}`, {
      projectId,
      source: Constants.expoConfig?.extra?.eas?.projectId ? 'eas.json' : 
              Constants.expoConfig?.projectId ? 'app.json' : 'fallback'
    });
    
    console.log('   Generating push token...');
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });

    const token = tokenData.data;
    
    // Validate token format
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
    
    return token;
    
  } catch (error) {
    logTest('Token Generation', 'FAIL', `Token generation failed: ${error.message}`);
    return null;
  }
}

async function testBackendConnectivity() {
  console.log('\n🌐 TESTING BACKEND CONNECTIVITY...');
  
  try {
    // Health check
    console.log('   Testing backend health...');
    const healthResponse = await fetch(`${DOMAIN}api/health`, {
      method: 'GET',
      timeout: 10000
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      logTest('Backend Health', 'PASS', 'Backend is accessible and healthy', {
        status: healthData.status,
        url: DOMAIN
      });
    } else {
      logTest('Backend Health', 'WARN', `Backend returned status: ${healthResponse.status}`, {
        status: healthResponse.status,
        url: DOMAIN
      });
    }
    
    // API availability
    console.log('   Testing push token API...');
    const apiResponse = await fetch(`${DOMAIN}api/push-token/stats`, {
      method: 'GET',
      timeout: 10000
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
    
    return true;
    
  } catch (error) {
    logTest('Backend Connectivity', 'FAIL', `Cannot connect to backend: ${error.message}`, {
      error: error.message,
      url: DOMAIN
    });
    return false;
  }
}

async function testTokenRegistration(userData, token) {
  console.log('\n📤 TESTING TOKEN REGISTRATION...');
  
  if (!userData || !token) {
    logTest('Registration Prerequisites', 'FAIL', 'Missing user data or token');
    return false;
  }
  
  try {
    // Determine user type
    let userType = 'client';
    if (userData.role) {
      if (userData.role === 'admin' || userData.role === 'client-admin') {
        userType = 'admin';
      } else if (userData.role === 'staff' || userData.role.includes('engineer')) {
        userType = 'staff';
      }
    }
    
    // Create payload
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
    
    // Make registration call
    console.log('   Calling registration API...');
    const response = await fetch(`${DOMAIN}api/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      timeout: 15000
    });

    const responseData = await response.json();
    
    if (response.ok && responseData.success) {
      logTest('API Registration', 'PASS', 'Token registered successfully with backend', {
        tokenId: responseData.data?.tokenId,
        isNew: responseData.data?.isNew,
        message: responseData.message
      });
      
      // Update local storage
      await AsyncStorage.setItem('pushToken', token);
      await AsyncStorage.setItem('pushTokenRegistered', 'true');
      await AsyncStorage.setItem('pushTokenRegistrationTime', Date.now().toString());
      
      logTest('Local Storage', 'PASS', 'Token stored locally');
      
      // Verify storage
      const storedToken = await AsyncStorage.getItem('pushToken');
      const isRegistered = await AsyncStorage.getItem('pushTokenRegistered');
      
      if (storedToken === token && isRegistered === 'true') {
        logTest('Registration Verification', 'PASS', 'Registration verified successfully');
        return true;
      } else {
        logTest('Registration Verification', 'FAIL', 'Local storage verification failed');
        return false;
      }
      
    } else {
      logTest('API Registration', 'FAIL', `Registration failed: ${responseData.message || 'Unknown error'}`, {
        status: response.status,
        success: responseData.success,
        message: responseData.message,
        error: responseData.error
      });
      return false;
    }
    
  } catch (error) {
    logTest('Token Registration', 'FAIL', `Registration error: ${error.message}`);
    return false;
  }
}

async function testNotificationSend(userData) {
  console.log('\n🔔 TESTING NOTIFICATION SEND...');
  
  if (!userData) {
    logTest('Notification Test', 'FAIL', 'No user data available');
    return false;
  }
  
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

    console.log('   Sending test notification...');
    const notificationResponse = await fetch(`${DOMAIN}api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testNotification),
      timeout: 15000
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
        return true;
      } else {
        logTest('Notification Send', 'WARN', `Notification API succeeded but no notifications sent (${successful} sent, ${failed} failed)`, {
          sent: successful,
          failed: failed,
          recipients: notificationData.data?.recipients || []
        });
        return false;
      }
    } else {
      logTest('Notification Send', 'FAIL', `Notification send failed: ${notificationData.message || 'Unknown error'}`, notificationData);
      return false;
    }
    
  } catch (error) {
    logTest('Notification Send', 'FAIL', `Notification test error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runCompleteTest() {
  console.log('🚀 STARTING COMPREHENSIVE PUSH TOKEN TEST');
  console.log('='.repeat(50));
  
  const startTime = Date.now();
  
  try {
    // Test environment
    const envOk = await testEnvironment();
    if (!envOk) {
      console.log('\n❌ Environment tests failed. Cannot continue.');
      return printSummary();
    }
    
    await sleep(500);
    
    // Test user authentication
    const userData = await testUserAuthentication();
    if (!userData) {
      console.log('\n❌ User authentication failed. Cannot continue.');
      return printSummary();
    }
    
    await sleep(500);
    
    // Test permissions
    const permissionsOk = await testPermissions();
    if (!permissionsOk) {
      console.log('\n❌ Permission tests failed. Cannot continue.');
      return printSummary();
    }
    
    await sleep(500);
    
    // Test token generation
    const token = await testTokenGeneration();
    if (!token) {
      console.log('\n❌ Token generation failed. Cannot continue.');
      return printSummary();
    }
    
    await sleep(500);
    
    // Test backend connectivity
    const backendOk = await testBackendConnectivity();
    if (!backendOk) {
      console.log('\n❌ Backend connectivity failed. Cannot continue.');
      return printSummary();
    }
    
    await sleep(500);
    
    // Test token registration
    const registrationOk = await testTokenRegistration(userData, token);
    if (!registrationOk) {
      console.log('\n❌ Token registration failed.');
    }
    
    await sleep(500);
    
    // Test notification send
    await testNotificationSend(userData);
    
  } catch (error) {
    console.error('\n💥 Unexpected error during testing:', error);
    logTest('Test Runner', 'FAIL', `Unexpected error: ${error.message}`);
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  testResults.duration = duration;
  
  printSummary();
}

function printSummary() {
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  
  console.log(`⏱️  Duration: ${testResults.duration}s`);
  console.log(`📱 Platform: ${testResults.platform}`);
  console.log(`🏗️  Environment: ${testResults.environment}`);
  console.log('');
  
  console.log(`📈 Results:`);
  console.log(`   Total Tests: ${testResults.summary.total}`);
  console.log(`   ✅ Passed: ${testResults.summary.passed}`);
  console.log(`   ❌ Failed: ${testResults.summary.failed}`);
  console.log(`   ⚠️  Warnings: ${testResults.summary.warnings}`);
  
  const successRate = testResults.summary.total > 0 
    ? ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)
    : 0;
  
  console.log(`   📊 Success Rate: ${successRate}%`);
  console.log('');
  
  if (testResults.summary.failed === 0 && testResults.summary.passed > 0) {
    console.log('🎉 ALL TESTS PASSED! Push token registration is working correctly.');
  } else if (testResults.summary.failed > 0) {
    console.log('🔧 SOME TESTS FAILED. Check the failed tests above for solutions.');
  } else {
    console.log('⚠️  NO TESTS COMPLETED. Check environment and try again.');
  }
  
  console.log('\n📋 DETAILED RESULTS:');
  console.log(JSON.stringify(testResults, null, 2));
  console.log('\n' + '='.repeat(50));
  
  return testResults;
}

// Export for use
export default runCompleteTest;

// For direct execution in console
if (typeof window !== 'undefined') {
  window.runCompleteTest = runCompleteTest;
}

// Auto-run if called directly
if (require.main === module) {
  runCompleteTest();
}