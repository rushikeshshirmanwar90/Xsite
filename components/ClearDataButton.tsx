import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

/**
 * Debug component to clear AsyncStorage and force re-login
 * Use this when you have stale/wrong client ID stored
 * 
 * Usage:
 * import ClearDataButton from '@/components/ClearDataButton';
 * <ClearDataButton />
 */
export default function ClearDataButton() {
    const router = useRouter();
    const [clearing, setClearing] = useState(false);

    const handleClearData = () => {
        Alert.alert(
            'Clear All Data?',
            'This will log you out and clear all stored data. You will need to login again.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Clear Data',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setClearing(true);
                            console.log('🧹 Clearing AsyncStorage...');

                            // Clear all AsyncStorage data
                            await AsyncStorage.clear();

                            console.log('✅ AsyncStorage cleared successfully');

                            // Navigate to login
                            router.replace('/login');
                        } catch (error) {
                            console.error('❌ Error clearing data:', error);
                            Alert.alert('Error', 'Failed to clear data. Please try again.');
                        } finally {
                            setClearing(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <TouchableOpacity
            style={styles.button}
            onPress={handleClearData}
            disabled={clearing}
        >
            {clearing ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.buttonText}>🧹 Clear Data & Re-login</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#ef4444',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
