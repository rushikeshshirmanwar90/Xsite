import { AuthProvider } from '@/contexts/AuthContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import 'react-native-reanimated';
import { Toaster } from "sonner-native";
import OnboardingWrapper from '@/components/onboarding/OnboardingWrapper';
import AppNavigator from '@/components/AppNavigator';
import ErrorBoundary from '@/components/ErrorBoundary';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <OnboardingWrapper>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </OnboardingWrapper>
    </ErrorBoundary>
  );
}