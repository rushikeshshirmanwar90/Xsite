import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_PREFIX = 'hasSeenOnboarding_';
const ONBOARDING_VERSION_PREFIX = 'onboardingVersion_';
const CURRENT_ONBOARDING_VERSION = '1.0';

export const useUserSpecificOnboarding = (userId?: string) => {
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    // Use global onboarding if no userId provided
    const onboardingKey = userId ? `${ONBOARDING_PREFIX}${userId}` : 'hasSeenOnboarding';
    const versionKey = userId ? `${ONBOARDING_VERSION_PREFIX}${userId}` : 'onboardingVersion';

    useEffect(() => {
        checkOnboardingStatus();
    }, [userId]);

    const checkOnboardingStatus = async () => {
        try {
            const [hasSeenValue, versionValue] = await Promise.all([
                AsyncStorage.getItem(onboardingKey),
                AsyncStorage.getItem(versionKey)
            ]);
            
            const hasSeen = hasSeenValue === 'true';
            const savedVersion = versionValue || '0.0';
            
            // Show onboarding if user hasn't seen it OR if version has changed
            const shouldShowOnboarding = !hasSeen || savedVersion !== CURRENT_ONBOARDING_VERSION;
            
            setHasSeenOnboarding(!shouldShowOnboarding);
            
            console.log('🔍 User-Specific Onboarding Status Check:', {
                userId,
                hasSeen,
                savedVersion,
                currentVersion: CURRENT_ONBOARDING_VERSION,
                shouldShowOnboarding
            });
            
        } catch (error) {
            console.error('❌ Error checking user-specific onboarding status:', error);
            setHasSeenOnboarding(false);
        } finally {
            setLoading(false);
        }
    };

    const completeOnboarding = async () => {
        try {
            await Promise.all([
                AsyncStorage.setItem(onboardingKey, 'true'),
                AsyncStorage.setItem(versionKey, CURRENT_ONBOARDING_VERSION)
            ]);
            
            setHasSeenOnboarding(true);
            
            console.log('✅ User-specific onboarding completed:', { userId });
            
        } catch (error) {
            console.error('❌ Error saving user-specific onboarding status:', error);
        }
    };

    const resetOnboarding = async () => {
        try {
            await Promise.all([
                AsyncStorage.removeItem(onboardingKey),
                AsyncStorage.removeItem(versionKey)
            ]);
            
            setHasSeenOnboarding(false);
            
            console.log('🔄 User-specific onboarding reset:', { userId });
            
        } catch (error) {
            console.error('❌ Error resetting user-specific onboarding status:', error);
        }
    };

    const forceShowOnboarding = () => {
        setHasSeenOnboarding(false);
    };

    // Clear all onboarding data for all users (admin function)
    const clearAllOnboardingData = async () => {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const onboardingKeys = allKeys.filter(key => 
                key.startsWith(ONBOARDING_PREFIX) || 
                key.startsWith(ONBOARDING_VERSION_PREFIX) ||
                key === 'hasSeenOnboarding' ||
                key === 'onboardingVersion'
            );
            
            await AsyncStorage.multiRemove(onboardingKeys);
            
            console.log('🧹 Cleared all onboarding data for all users');
            
        } catch (error) {
            console.error('❌ Error clearing all onboarding data:', error);
        }
    };

    return {
        hasSeenOnboarding,
        loading,
        completeOnboarding,
        resetOnboarding,
        forceShowOnboarding,
        clearAllOnboardingData,
        currentVersion: CURRENT_ONBOARDING_VERSION,
        userId,
    };
};