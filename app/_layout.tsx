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
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();

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