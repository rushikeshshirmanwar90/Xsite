import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Toaster } from "sonner-native";
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// ✅ Check if we're running in Expo Go (which doesn't support push notifications in SDK 53+)
const isExpoGo = Constants.appOwnership === 'expo';

// ✅ Configure notification behavior (only if not in Expo Go)
if (!isExpoGo) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true, // Enable default sound
        shouldSetBadge: true,
        shouldShowBanner: true, // Show banner notification
        shouldShowList: true,   // Show in notification list
      }),
    });
  } catch (error) {
    console.log('⚠️ Notification handler setup skipped (Expo Go limitation)');
  }
}

// Define protected routes that require authentication
const PROTECTED_ROUTES = ['(tabs)', 'details'];

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // ✅ Handle notification tap - Navigate to notification page (skip in Expo Go)
  useEffect(() => {
    if (isExpoGo) {
      console.log('⚠️ Push notifications not available in Expo Go - use development build for full functionality');
      return;
    }

    try {
      const subscription = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('🔔 Notification tapped:', response);
        
        // Navigate to notification page when user taps notification
        try {
          router.push('/notification');
        } catch (error) {
          console.error('❌ Navigation error from notification:', error);
          // Fallback navigation
          router.replace('/(tabs)');
        }
      });

      return () => subscription.remove();
    } catch (error) {
      console.log('⚠️ Notification listener setup skipped');
    }
  }, [router]);

  // ✅ Handle notification received while app is in foreground (skip in Expo Go)
  useEffect(() => {
    if (isExpoGo) return;

    try {
      const subscription = Notifications.addNotificationReceivedListener(notification => {
        console.log('🔔 Notification received in foreground:', notification);
        // Notification will be shown automatically with sound
      });

      return () => subscription.remove();
    } catch (error) {
      console.log('⚠️ Foreground notification listener setup skipped');
    }
  }, []);

  // Handle navigation based on auth status
  useEffect(() => {
    // Don't do anything while loading
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'details';
    const currentRoute = segments.join('/') || 'index';
    const currentSegment = String(segments[0]);

    console.log('🧭 Navigation check:', {
      isAuthenticated,
      currentRoute,
      inAuthGroup,
      segments,
      hasUser: !!user,
      userRole: user?.role,
      userClients: user?.clients
    });

    // Check if user is staff without clients
    const isStaffWithoutClients = user && 
      user.role && 
      ['site-engineer', 'supervisor', 'manager'].includes(user.role) &&
      (!user.clients || user.clients.length === 0);

    console.log('🔍 Staff check in layout:', { isStaffWithoutClients });

    // Use setTimeout to ensure navigation happens after render
    const navigationTimeout = setTimeout(() => {
      try {
        if (!isAuthenticated && inAuthGroup) {
          // User is not authenticated but trying to access protected route
          console.log('🚫 Redirecting to login - not authenticated in protected route');
          router.replace('/login');
        } else if (isAuthenticated && isStaffWithoutClients && currentSegment !== 'index') {
          // Staff without clients should stay on index page (which shows QR screen)
          console.log('⚠️ Staff without clients - redirecting to index for QR screen');
          router.replace('/');
        } else if (isAuthenticated && !isStaffWithoutClients && (currentSegment === 'login' || currentSegment === 'index' || currentSegment === 'register')) {
          // User is authenticated with clients but on login, index, or register page
          console.log('✅ Redirecting to tabs - authenticated user with clients on public page');
          router.replace('/(tabs)');
        }
        // Don't redirect if user is on login, index, or register pages while not authenticated
        // This allows them to navigate freely between these pages
      } catch (error) {
        console.error('❌ Navigation error:', error);
      }
    }, 100); // Small delay to ensure state is settled

    return () => clearTimeout(navigationTimeout);
  }, [isAuthenticated, segments, isLoading, user]);

  // Show nothing while loading to prevent flash
  if (isLoading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="details" options={{ headerShown: false }} />
        <Stack.Screen name="notification" options={{ headerShown: false }} />
      </Stack>
      <Toaster position="bottom-center" />
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
};

export default AppNavigator;