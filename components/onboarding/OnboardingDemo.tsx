import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '@/hooks/useOnboarding';

const OnboardingDemo: React.FC = () => {
    const { hasSeenOnboarding, resetOnboarding } = useOnboarding();

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Ionicons name="information-circle-outline" size={48} color="#3B82F6" />
                <Text style={styles.title}>Onboarding Status</Text>
                <Text style={styles.status}>
                    Status: {hasSeenOnboarding ? 'Completed' : 'Not Completed'}
                </Text>
                <Text style={styles.description}>
                    {hasSeenOnboarding 
                        ? 'You have completed the onboarding. Use the button below to reset and see it again.'
                        : 'Onboarding will be shown on next app launch.'
                    }
                </Text>
                
                <TouchableOpacity 
                    style={styles.button} 
                    onPress={resetOnboarding}
                >
                    <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Reset Onboarding</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F4FF', // Light blue background
        padding: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        maxWidth: 320,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#4F46E5', // Indigo
        marginTop: 16,
        marginBottom: 8,
    },
    status: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6366F1', // Lighter indigo
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4F46E5', // Indigo
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default OnboardingDemo;