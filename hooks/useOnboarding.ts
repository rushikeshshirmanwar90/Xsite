import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'hasSeenOnboarding';
const ONBOARDING_VERSION_KEY = 'onboardingVersion';
const CURRENT_ONBOARDING_VERSION = '1.0'; // Increment this to force re-show onboarding

export const useOnboarding = () => {
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

    const resetOnboarding = async () => {
        try {
            await Promise.all([
                AsyncStorage.removeItem(ONBOARDING_KEY),
                AsyncStorage.removeItem(ONBOARDING_VERSION_KEY)
            ]);
            
            setHasSeenOnboarding(false);
            
            console.log('🔄 Onboarding reset - will show on next app launch');
            
        } catch (error) {
            console.error('❌ Error resetting onboarding status:', error);
        }
    };

    const forceShowOnboarding = () => {
        setHasSeenOnboarding(false);
    };

    return {
        hasSeenOnboarding,
        loading,
        completeOnboarding,
        resetOnboarding,
        forceShowOnboarding,
        currentVersion: CURRENT_ONBOARDING_VERSION,
    };
};