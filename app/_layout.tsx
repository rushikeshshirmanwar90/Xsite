import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import 'react-native-reanimated';
import { Toaster } from "sonner-native";

export const unstable_settings = {
  initialRouteName: 'index',
};

// Define protected routes that require authentication
const PROTECTED_ROUTES = ['(tabs)', 'details'];


function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Handle navigation based on auth status
  useEffect(() => {
    // Don't do anything while loading
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'details';
    const currentRoute = segments.join('/') || 'index';

    console.log('🧭 Navigation check:', {
      isAuthenticated,
      currentRoute,
      inAuthGroup,
      segments
    });

    // Use setTimeout to ensure navigation happens after render
    const navigationTimeout = setTimeout(() => {
      try {
        if (!isAuthenticated && inAuthGroup) {
          // User is not authenticated but trying to access protected route
          console.log('🚫 Redirecting to login - not authenticated in protected route');
          router.replace('/login');
        } else if (isAuthenticated && (segments[0] === 'login' || segments[0] === 'index')) {
          // User is authenticated but on login or index page
          console.log('✅ Redirecting to tabs - authenticated user on login/index');
          router.replace('/(tabs)');
        } else if (!isAuthenticated && segments[0] !== 'login' && segments[0] !== 'index') {
          // User is not authenticated and not on login or index page
          console.log('🚫 Redirecting to login - not authenticated');
          router.replace('/login');
        }
      } catch (error) {
        console.error('❌ Navigation error:', error);
      }
    }, 100); // Small delay to ensure state is settled

    return () => clearTimeout(navigationTimeout);
  }, [isAuthenticated, segments, isLoading]);

  // Show nothing while loading to prevent flash
  if (isLoading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="details" options={{ headerShown: false }} />
      </Stack>
      <Toaster position="bottom-center" />
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}