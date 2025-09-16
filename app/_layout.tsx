import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import 'react-native-reanimated';
import { Toaster } from "sonner-native";
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

export const unstable_settings = {
  initialRouteName: 'login',
};

// Define protected routes that require authentication
const PROTECTED_ROUTES = ['(tabs)', 'details'];


function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Handle navigation based on auth status
  useEffect(() => {
    if (isLoading) return;

    const currentRoute = segments[0] || '';
    const isProtectedRoute = PROTECTED_ROUTES.includes(currentRoute);

    if (!isAuthenticated && isProtectedRoute) {
      // Trying to access protected route without auth
      router.replace('/login');
    } else if (isAuthenticated && currentRoute === 'login') {
      // Authenticated user on login page, redirect to home
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isLoading, router]);

  if (isLoading) {
    return null; // or return a loading component
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
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