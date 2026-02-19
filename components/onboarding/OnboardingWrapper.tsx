import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from './OnboardingScreen';

interface OnboardingWrapperProps {
    children: React.ReactNode;
}

const ONBOARDING_KEY = 'hasSeenOnboarding';
const ONBOARDING_VERSION_KEY = 'onboardingVersion';
const CURRENT_ONBOARDING_VERSION = '1.0';

const OnboardingWrapper: React.FC<OnboardingWrapperProps> = ({ children }) => {
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkOnboardingStatus();
    }, []);

    const checkOnboardingStatus = async () => {
        try {
            const [hasSeenValue, versionValue] = await Promise.all([
                AsyncStorage.getItem(ONBOARDING_KEY),
                AsyncStorage.getItem(ONBOARDING_VERSION_KEY)
            ]);
            
            const hasSeen = hasSeenValue === 'true';
            const savedVersion = versionValue || '0.0';
            
            // Show onboarding if user hasn't seen it OR if version has changed
            const shouldShowOnboarding = !hasSeen || savedVersion !== CURRENT_ONBOARDING_VERSION;
            
            setHasSeenOnboarding(!shouldShowOnboarding);
            
            console.log('🔍 Onboarding Status Check:', {
                hasSeen,
                savedVersion,
                currentVersion: CURRENT_ONBOARDING_VERSION,
                shouldShowOnboarding
            });
            
        } catch (error) {
            console.error('❌ Error checking onboarding status:', error);
            setHasSeenOnboarding(false);
        } finally {
            setLoading(false);
        }
    };

    const completeOnboarding = async () => {
        try {
            await Promise.all([
                AsyncStorage.setItem(ONBOARDING_KEY, 'true'),
                AsyncStorage.setItem(ONBOARDING_VERSION_KEY, CURRENT_ONBOARDING_VERSION)
            ]);
            
            setHasSeenOnboarding(true);
            
            console.log('✅ Onboarding completed and saved to AsyncStorage');
            
        } catch (error) {
            console.error('❌ Error saving onboarding status:', error);
        }
    };

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
                <Text style={{
                    marginTop: 16,
                    fontSize: 16,
                    color: '#6B7280',
                    fontWeight: '500'
                }}>
                    Loading...
                </Text>
            </View>
        );
    }

    // Show onboarding if user hasn't seen it
    if (!hasSeenOnboarding) {
        console.log('🎯 Showing onboarding screen to user');
        return <OnboardingScreen onComplete={completeOnboarding} />;
    }

    // Show main app if user has completed onboarding
    console.log('✅ User has completed onboarding - showing main app');
    return <>{children}</>;
};

export default OnboardingWrapper;