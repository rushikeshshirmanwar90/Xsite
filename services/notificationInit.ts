import NotificationManager from './notificationManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { domain } from '@/lib/domain';

/**
 * Initialize notification system
 * Call this function when the app starts (e.g., in App.tsx or _layout.tsx)
 */
export const initializeNotifications = async () => {
  try {
    console.log('🔔 Initializing notification system...');
    
    const notificationManager = NotificationManager.getInstance();
    
    // Request permissions
    const hasPermission = await notificationManager.requestPermissions();
    if (hasPermission) {
      console.log('✅ Notification permissions granted');
      
      // Get push token and store it
      const pushToken = await notificationManager.getPushToken();
      if (pushToken) {
        console.log('✅ Push token obtained:', pushToken);
        
        // Store the token for sending to your backend
        await AsyncStorage.setItem('pushToken', pushToken);
        
        // Send the token to your backend
        await sendPushTokenToBackend(pushToken);
      }
    } else {
      console.log('❌ Notification permissions denied');
    }
    
    // Update badge count
    await notificationManager.updateBadgeCount();
    
    console.log('✅ Notification system initialized');
  } catch (error) {
    console.error('❌ Error initializing notifications:', error);
  }
};

/**
 * Send push token to backend
 */
export const sendPushTokenToBackend = async (pushToken: string) => {
  try {
    // Get user details
    const userDetailsString = await AsyncStorage.getItem("user");
    if (!userDetailsString) {
      console.log('No user found, skipping push token registration');
      return;
    }
    
    const userData = JSON.parse(userDetailsString);
    const userId = userData._id || userData.id || userData.clientId;
    
    if (!userId) {
      console.log('No user ID found, skipping push token registration');
      return;
    }

    // Get device information
    const deviceId = Device.isDevice ? await Device.getDeviceIdAsync() : 'simulator';
    const deviceName = Device.deviceName || `${Platform.OS} Device`;
    
    // Determine user type (you may need to adjust this based on your user structure)
    const userType = userData.role || userData.userType || 'client';

    console.log('📱 Registering push token with backend:', {
      userId,
      userType,
      platform: Platform.OS,
      deviceId,
      deviceName,
    });

    const response = await fetch(`${domain}/api/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userType,
        token: pushToken,
        platform: Platform.OS,
        deviceId,
        deviceName,
        appVersion: '1.0.0', // You can get this from app.json or package.json
      }),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Push token registered with backend:', result.data);
      
      // Store registration status
      await AsyncStorage.setItem('pushTokenRegistered', 'true');
      await AsyncStorage.setItem('pushTokenId', result.data.tokenId);
    } else {
      const errorData = await response.json();
      console.error('❌ Failed to register push token with backend:', errorData);
    }
    
  } catch (error) {
    console.error('Error sending push token to backend:', error);
  }
};

/**
 * Test notification function for development
 */
export const testNotification = async () => {
  const notificationManager = NotificationManager.getInstance();
  
  await notificationManager.scheduleLocalNotification(
    '🏗️ Test Notification',
    'This is a test notification to verify the system is working correctly.',
    {
      activityType: 'test',
      category: 'project',
      route: 'notification',
    }
  );
  
  console.log('📱 Test notification scheduled');
};