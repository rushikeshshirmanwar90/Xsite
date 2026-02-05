/**
 * Test Expo Push Token Fix
 * Run this to test if the Expo push notification fix works
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Dynamic imports
let Notifications = null;
let Device = null;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
} catch (error) {
  console.warn('Failed to load notification modules:', error);
}

async function testExpoPushFix() {
  console.log('🧪 Testing Expo Push Token Fix...\n');

  // Check environment
  console.log('📱 Environment Check:');
  console.log('- Platform:', Platform.OS);
  console.log('- Execution Environment:', Constants.executionEnvironment);
  console.log('- Is Device:', Device?.isDevice);
  console.log('- Notifications Available:', !!Notifications);
  console.log('');

  if (!Notifications || !Device?.isDevice) {
    console.log('❌ Environment not suitable for testing');
    return;
  }

  // Check permissions
  console.log('🔐 Checking Permissions...');
  try {
    const { status } = await Notifications.getPermissionsAsync();
    console.log('- Current Status:', status);
    
    if (status !== 'granted') {
      console.log('- Requesting permissions...');
      const result = await Notifications.requestPermissionsAsync();
      console.log('- New Status:', result.status);
      
      if (result.status !== 'granted') {
        console.log('❌ Permissions not granted');
        return;
      }
    }
    console.log('✅ Permissions OK\n');
  } catch (error) {
    console.log('❌ Permission error:', error.message);
    return;
  }

  // Test token generation
  console.log('🎫 Testing Token Generation...');
  
  try {
    // Method 1: With project ID
    console.log('- Method 1: With project ID');
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                      Constants.expoConfig?.projectId || 
                      '2fcc4ccc-b8b5-4ff4-ae3c-b195aa9eb32f';
    
    console.log('- Using Project ID:', projectId);
    
    const tokenData1 = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });

    const token1 = tokenData1.data;
    console.log('✅ Method 1 Success!');
    console.log('- Token Preview:', token1.substring(0, 50) + '...');
    console.log('- Token Length:', token1.length);
    console.log('- Token Format:', token1.startsWith('ExponentPushToken[') ? 'Expo' : 'Unknown');
    console.log('');

    // Test registration
    console.log('📤 Testing Registration...');
    
    const userData = await AsyncStorage.getItem("user");
    if (!userData) {
      console.log('⚠️ No user data found - skipping registration test');
      console.log('✅ Token generation fix is working!');
      return;
    }

    const user = JSON.parse(userData);
    const payload = {
      userId: user._id,
      userType: user.userType || 'admin',
      token: token1,
      platform: Platform.OS,
      deviceId: Constants.sessionId || 'test-device',
      deviceName: Device?.deviceName || 'Test Device',
      appVersion: Constants.expoConfig?.version || '1.0.0'
    };

    console.log('- Registration Payload Created');
    console.log('- User ID:', payload.userId);
    console.log('- User Type:', payload.userType);
    console.log('- Platform:', payload.platform);

    const response = await fetch('https://real-estate-optimize-apis.vercel.app/api/push-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();
    
    if (response.ok && responseData.success) {
      console.log('✅ Registration Success!');
      console.log('- Token ID:', responseData.data?.tokenId);
      console.log('- Is New:', responseData.data?.isNew);
      console.log('- Message:', responseData.message);
    } else {
      console.log('⚠️ Registration Failed:', responseData.message);
      console.log('- But token generation is working!');
    }

  } catch (error) {
    console.log('❌ Method 1 Failed:', error.message);
    
    // Method 2: Without project ID
    try {
      console.log('- Method 2: Without project ID');
      const tokenData2 = await Notifications.getExpoPushTokenAsync();
      const token2 = tokenData2.data;
      
      console.log('✅ Method 2 Success!');
      console.log('- Token Preview:', token2.substring(0, 50) + '...');
      console.log('- Token Length:', token2.length);
      console.log('- Token Format:', token2.startsWith('ExponentPushToken[') ? 'Expo' : 'Unknown');
      
    } catch (error2) {
      console.log('❌ Method 2 Also Failed:', error2.message);
      console.log('');
      console.log('🔧 Possible Solutions:');
      console.log('1. Make sure you have a development build (not Expo Go)');
      console.log('2. Check if Firebase configuration is needed');
      console.log('3. Verify your Expo project ID is correct');
      console.log('4. Try rebuilding your app with: eas build --profile development --platform android');
    }
  }

  console.log('\n🏁 Test Complete!');
}

// Export for use
export default testExpoPushFix;

// For direct execution in console
if (typeof window !== 'undefined') {
  window.testExpoPushFix = testExpoPushFix;
}

// Auto-run if called directly
if (require.main === module) {
  testExpoPushFix();
}