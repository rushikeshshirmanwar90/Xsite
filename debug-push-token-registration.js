/**
 * Push Token Registration Diagnostic Script
 * Run this to identify the exact issue with push token registration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Import domain
const domain = "https://real-estate-optimize-apis.vercel.app/";

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

async function runDiagnostics() {
  console.log('🔍 Starting Push Token Registration Diagnostics...\n');

  // 1. Environment Check
  console.log('📱 ENVIRONMENT CHECK:');
  console.log('- Platform:', Platform.OS);
  console.log('- Is Expo Go:', isExpoGo);
  console.log('- Execution Environment:', Constants.executionEnvironment);
  console.log('- Is Physical Device:', Device?.isDevice);
  console.log('- Notifications Module Available:', !!Notifications);
  console.log('- Device Module Available:', !!Device);
  console.log('- Backend URL:', domain);
  console.log('');

  // 2. User Data Check
  console.log('👤 USER DATA CHECK:');
  try {
    const userDetailsString = await AsyncStorage.getItem("user");
    if (userDetailsString) {
      const userData = JSON.parse(userDetailsString);
      console.log('✅ User data found:');
      console.log('- User ID:', userData._id);
      console.log('- Email:', userData.email);
      console.log('- Role:', userData.role);
      console.log('- User Type:', userData.userType);
      console.log('- Has Clients:', userData.clients?.length || 0);
    } else {
      console.log('❌ No user data found in AsyncStorage');
      console.log('💡 Solution: Make sure user is logged in');
      return;
    }
  } catch (error) {
    console.log('❌ Error reading user data:', error.message);
    return;
  }
  console.log('');

  // 3. Device Support Check
  console.log('🔧 DEVICE SUPPORT CHECK:');
  if (isExpoGo && Platform.OS === 'android') {
    console.log('❌ Push notifications not supported in Expo Go on Android');
    console.log('💡 Solution: Use a development build or EAS Build');
    return;
  }

  if (!Device?.isDevice) {
    console.log('❌ Push notifications require a physical device');
    console.log('💡 Solution: Test on a real device, not simulator');
    return;
  }

  if (!Notifications) {
    console.log('❌ Notification modules not available');
    console.log('💡 Solution: Check expo-notifications installation');
    return;
  }

  console.log('✅ Device supports push notifications');
  console.log('');

  // 4. Permission Check
  console.log('🔐 PERMISSION CHECK:');
  try {
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();
    console.log('- Current Status:', status);
    console.log('- Can Ask Again:', canAskAgain);
    console.log('- Is Granted:', status === 'granted');

    if (status !== 'granted') {
      console.log('⚠️ Permissions not granted');
      console.log('💡 Solution: Request permissions first');
      
      if (canAskAgain) {
        console.log('🔄 Attempting to request permissions...');
        const result = await Notifications.requestPermissionsAsync();
        console.log('- New Status:', result.status);
        console.log('- Is Granted:', result.status === 'granted');
        
        if (result.status !== 'granted') {
          console.log('❌ User denied permissions');
          console.log('💡 Solution: Enable notifications in device settings');
          return;
        }
      } else {
        console.log('❌ Cannot ask for permissions again');
        console.log('💡 Solution: Enable notifications in device settings');
        return;
      }
    } else {
      console.log('✅ Permissions already granted');
    }
  } catch (error) {
    console.log('❌ Error checking permissions:', error.message);
    return;
  }
  console.log('');

  // 5. Push Token Generation
  console.log('🎫 PUSH TOKEN GENERATION:');
  try {
    // Get project ID
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                      Constants.expoConfig?.projectId || 
                      '2fcc4ccc-b8b5-4ff4-ae3c-b195aa9eb32f';
    
    console.log('- Project ID:', projectId);
    
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });

    const token = tokenData.data;
    console.log('✅ Push token generated successfully');
    console.log('- Token Preview:', token.substring(0, 50) + '...');
    console.log('- Token Length:', token.length);
    console.log('- Token Format:', token.startsWith('ExponentPushToken[') ? 'Expo' : 'Unknown');
  } catch (error) {
    console.log('❌ Error generating push token:', error.message);
    console.log('💡 Possible solutions:');
    console.log('  - Check internet connection');
    console.log('  - Verify project ID in app.json/eas.json');
    console.log('  - Try restarting the app');
    return;
  }
  console.log('');

  // 6. Backend Connectivity
  console.log('🌐 BACKEND CONNECTIVITY CHECK:');
  try {
    console.log('- Testing connection to:', domain);
    
    // Test basic connectivity
    const healthResponse = await fetch(`${domain}api/health`, {
      method: 'GET',
      timeout: 10000
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend is accessible');
      console.log('- Health Status:', healthData.status || 'OK');
    } else {
      console.log('⚠️ Backend returned error:', healthResponse.status);
    }
  } catch (error) {
    console.log('❌ Cannot connect to backend:', error.message);
    console.log('💡 Possible solutions:');
    console.log('  - Check internet connection');
    console.log('  - Verify backend URL is correct');
    console.log('  - Check if backend is running');
    return;
  }
  console.log('');

  // 7. Push Token Registration Test
  console.log('📤 PUSH TOKEN REGISTRATION TEST:');
  try {
    const userDetailsString = await AsyncStorage.getItem("user");
    const userData = JSON.parse(userDetailsString);
    
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                      Constants.expoConfig?.projectId || 
                      '2fcc4ccc-b8b5-4ff4-ae3c-b195aa9eb32f';
    
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });

    const token = tokenData.data;
    
    // Determine user type
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

    console.log('- Payload:', {
      userId: payload.userId,
      userType: payload.userType,
      platform: payload.platform,
      deviceId: payload.deviceId,
      tokenPreview: token.substring(0, 30) + '...'
    });

    const response = await fetch(`${domain}api/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      timeout: 15000
    });

    const responseData = await response.json();
    
    if (response.ok && responseData.success) {
      console.log('✅ Push token registered successfully!');
      console.log('- Token ID:', responseData.data?.tokenId);
      console.log('- Is New:', responseData.data?.isNew);
      console.log('- Message:', responseData.message);
      
      // Store locally
      await AsyncStorage.setItem('pushToken', token);
      await AsyncStorage.setItem('pushTokenRegistered', 'true');
      await AsyncStorage.setItem('pushTokenRegistrationTime', Date.now().toString());
      
      console.log('✅ Token stored locally');
    } else {
      console.log('❌ Push token registration failed');
      console.log('- Status:', response.status);
      console.log('- Success:', responseData.success);
      console.log('- Message:', responseData.message);
      console.log('- Error:', responseData.error);
      
      console.log('💡 Possible solutions:');
      console.log('  - Check if user ID is valid');
      console.log('  - Verify backend API is working');
      console.log('  - Check database connection');
    }
  } catch (error) {
    console.log('❌ Error during registration:', error.message);
    console.log('💡 Check the full error details above');
  }
  console.log('');

  console.log('🏁 Diagnostics Complete!');
  console.log('If you still have issues, please share the output above for further assistance.');
}

// Export for use in React Native
export default runDiagnostics;

// For direct execution in console
if (typeof window !== 'undefined') {
  window.runPushTokenDiagnostics = runDiagnostics;
}