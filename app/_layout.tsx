import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import 'react-native-reanimated';
import { Toaster } from "sonner-native";

export const unstable_settings = {
  initialRouteName: 'login',
};

// Define protected routes that require authentication
const PROTECTED_ROUTES = ['(tabs)', 'details'];
const PUBLIC_ROUTES = ['login'];

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Handle navigation based on auth status
  useEffect(() => {
    if (isLoading) return;

    const currentRoute = segments[0] || '';
    const isProtectedRoute = PROTECTED_ROUTES.includes(currentRoute);
    const isPublicRoute = PUBLIC_ROUTES.includes(currentRoute);

    if (!isAuthenticated && isProtectedRoute) {
      // Trying to access protected route without auth
      router.replace('/login');
    } else if (isAuthenticated && currentRoute === 'login') {
      // Authenticated user on login page, redirect to home
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isLoading]);

  const checkAuthStatus = async () => {
    try {
      const userDetails = await AsyncStorage.getItem("user");
      if (userDetails) {
        const data = JSON.parse(userDetails);
        if (data) {
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

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