import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useOnboarding } from '@/hooks/useOnboarding';
import OnboardingScreen from './OnboardingScreen';

interface OnboardingWrapperProps {
    children: React.ReactNode;
}

const OnboardingWrapper: React.FC<OnboardingWrapperProps> = ({ children }) => {
    const { hasSeenOnboarding, loading, completeOnboarding } = useOnboarding();

    // Show loading spinner while checking onboarding status
    if (loading) {
        return (
            <View style={{ 
                flex: 1, 
                justifyContent: 'center', 
                alignItems: 'center', 
                backgroundColor: '#F0F4FF' // Light blue background
            }}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    // Show onboarding if user hasn't seen it
    if (!hasSeenOnboarding) {
        return <OnboardingScreen onComplete={completeOnboarding} />;
    }

    // Show main app if user has completed onboarding
    return <>{children}</>;
};

export default OnboardingWrapper;