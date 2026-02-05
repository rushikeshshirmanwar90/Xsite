# 🔔 Push Notification Integration Guide

## 📋 **Overview**

This guide shows how to integrate push token registration into your React Native app so users receive notifications when materials are added, used, or transferred.

---

## 🚀 **Quick Setup (5 minutes)**

### **Step 1: Add Push Notification Setup to Login Screen**

Add this to your login success handler:

```typescript
// In your login screen (e.g., app/login.tsx)
import NotificationManager from '@/services/notificationManager';

// After successful login
const handleLoginSuccess = async (userData: any) => {
  // Your existing login logic...
  
  // Initialize push notifications
  const notificationManager = NotificationManager.getInstance();
  await notificationManager.initializePushNotifications();
  
  // Navigate to main app...
};
```

### **Step 2: Add Push Notification Setup Component (Optional)**

Add a settings screen where users can manage notifications:

```typescript
// In a settings screen or profile screen
import PushNotificationSetup from '@/components/PushNotificationSetup';

const SettingsScreen = () => {
  return (
    <View>
      {/* Your other settings */}
      <PushNotificationSetup />
    </View>
  );
};
```

### **Step 3: Handle Logout**

Add this to your logout handler:

```typescript
// In your logout function
import PushTokenService from '@/services/pushTokenService';

const handleLogout = async () => {
  // Unregister push token
  const pushTokenService = PushTokenService.getInstance();
  await pushTokenService.unregisterPushToken();
  
  // Your existing logout logic...
};
```

---

## 🔧 **Detailed Integration**

### **1. App.tsx / _layout.tsx Integration**

```typescript
import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import NotificationManager from '@/services/notificationManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  useEffect(() => {
    // Initialize notifications when app starts
    const initializeNotifications = async () => {
      try {
        // Check if user is logged in
        const userDetailsString = await AsyncStorage.getItem("user");
        if (userDetailsString) {
          console.log('🔔 User is logged in, initializing push notifications...');
          
          const notificationManager = NotificationManager.getInstance();
          await notificationManager.initializePushNotifications();
        }
      } catch (error) {
        console.error('❌ Error initializing notifications:', error);
      }
    };

    initializeNotifications();

    // Handle app state changes
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App became active, re-initialize if needed
        initializeNotifications();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    // Your app content
  );
}
```

### **2. Login Screen Integration**

```typescript
// app/login.tsx or your login component
import React, { useState } from 'react';
import NotificationManager from '@/services/notificationManager';

const LoginScreen = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    try {
      setIsLoggingIn(true);
      
      // Your existing login API call
      const response = await loginAPI(email, password);
      
      if (response.success) {
        // Store user data
        await AsyncStorage.setItem("user", JSON.stringify(response.user));
        
        // Initialize push notifications
        console.log('✅ Login successful, setting up push notifications...');
        const notificationManager = NotificationManager.getInstance();
        const pushSetupSuccess = await notificationManager.initializePushNotifications();
        
        if (pushSetupSuccess) {
          console.log('✅ Push notifications set up successfully');
        } else {
          console.log('⚠️ Push notifications setup failed, but login was successful');
        }
        
        // Navigate to main app
        router.replace('/');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    // Your login UI
  );
};
```

### **3. Settings/Profile Screen Integration**

```typescript
// app/profile.tsx or settings screen
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import PushNotificationSetup from '@/components/PushNotificationSetup';

const ProfileScreen = () => {
  const handleNotificationSetupComplete = (success: boolean) => {
    if (success) {
      console.log('✅ Push notifications are now active');
    } else {
      console.log('❌ Push notifications setup incomplete');
    }
  };

  return (
    <ScrollView>
      <Text style={{ fontSize: 24, fontWeight: 'bold', padding: 20 }}>
        Settings
      </Text>
      
      {/* Other settings */}
      
      <View style={{ padding: 20 }}>
        <PushNotificationSetup 
          onSetupComplete={handleNotificationSetupComplete}
          showTestButton={true}
        />
      </View>
    </ScrollView>
  );
};
```

### **4. Using the Hook in Components**

```typescript
// Any component where you want to check notification status
import React from 'react';
import { View, Text } from 'react-native';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const SomeComponent = () => {
  const { 
    isInitialized, 
    isRegistered, 
    hasPermission, 
    error,
    initialize 
  } = usePushNotifications();

  if (!isRegistered) {
    return (
      <View>
        <Text>Push notifications are not set up</Text>
        <TouchableOpacity onPress={initialize}>
          <Text>Set Up Notifications</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <Text>✅ Push notifications are active</Text>
    </View>
  );
};
```

---

## 🧪 **Testing Push Notifications**

### **1. Test Registration**

```typescript
// Add this to any component for testing
import PushTokenService from '@/services/pushTokenService';

const testPushNotifications = async () => {
  const pushTokenService = PushTokenService.getInstance();
  await pushTokenService.testRegistration();
  
  // Check console logs for detailed test results
};
```

### **2. Test Material Activity**

1. **Login as a staff member**
2. **Add materials to a project**
3. **Check if admin users receive notifications**
4. **Check console logs for notification processing**

### **3. Verify Backend Registration**

Check your backend logs for messages like:
```
📱 Registering push token: { userId: '...', userType: 'staff', platform: 'ios' }
✅ Created new push token: 64f8a9b2c1d2e3f4a5b6c7d8
```

---

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **"Push notifications are not supported in Expo Go on Android"**
   - **Solution:** Use a development build or test on iOS in Expo Go

2. **"No push tokens found for users"**
   - **Solution:** Users need to open the app and grant notification permissions

3. **"Failed to get push token"**
   - **Solution:** Check device permissions and network connectivity

4. **"Push token registration failed"**
   - **Solution:** Check backend server is running and API endpoints are working

### **Debug Steps:**

1. **Check console logs** for detailed error messages
2. **Use the test function** in PushNotificationSetup component
3. **Verify backend APIs** are responding correctly
4. **Check device notification settings**

---

## 📱 **Expected User Flow**

1. **User logs in** → Push token automatically registered
2. **Staff adds materials** → Backend finds admin users with push tokens
3. **Push notifications sent** → Admins receive notifications on their devices
4. **User taps notification** → App opens to relevant screen

---

## ✅ **Verification Checklist**

- [ ] Push token service integrated in login flow
- [ ] Push notifications initialize on app start
- [ ] Users can manage notification settings
- [ ] Push tokens unregister on logout
- [ ] Material activities trigger notifications
- [ ] Notifications appear on admin devices
- [ ] Console logs show successful token registration
- [ ] Backend shows active push tokens for users

---

## 🎯 **Next Steps**

Once push tokens are registered:

1. **Test with real users** - Have staff and admin users test the flow
2. **Monitor backend logs** - Check for successful notification delivery
3. **Add notification history** - Show users their notification history
4. **Customize notification content** - Improve notification messages
5. **Add notification preferences** - Let users choose notification types

---

The push notification system is now ready! Users will receive real-time notifications when materials are added, used, or transferred in their projects. 🚀