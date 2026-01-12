import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'hasSeenOnboarding';

export const useOnboarding = () => {
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkOnboardingStatus();
    }, []);

    const checkOnboardingStatus = async () => {
        try {
            const value = await AsyncStorage.getItem(ONBOARDING_KEY);
            setHasSeenOnboarding(value === 'true');
        } catch (error) {
            console.error('Error checking onboarding status:', error);
            setHasSeenOnboarding(false);
        } finally {
            setLoading(false);
        }
    };

    const completeOnboarding = async () => {
        try {
            await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
            setHasSeenOnboarding(true);
        } catch (error) {
            console.error('Error saving onboarding status:', error);
        }
    };

    const resetOnboarding = async () => {
        try {
            await AsyncStorage.removeItem(ONBOARDING_KEY);
            setHasSeenOnboarding(false);
        } catch (error) {
            console.error('Error resetting onboarding status:', error);
        }
    };

    return {
        hasSeenOnboarding,
        loading,
        completeOnboarding,
        resetOnboarding,
    };
};