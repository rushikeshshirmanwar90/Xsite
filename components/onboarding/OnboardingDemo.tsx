import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '@/hooks/useOnboarding';

const OnboardingDemo: React.FC = () => {
    const { 
        hasSeenOnboarding, 
        resetOnboarding, 
        forceShowOnboarding, 
        currentVersion 
    } = useOnboarding();

    const handleResetOnboarding = () => {
        Alert.alert(
            'Reset Onboarding',
            'This will reset the onboarding status and show it again on next app launch. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Reset', 
                    style: 'destructive',
                    onPress: resetOnboarding 
                }
            ]
        );
    };

    const handleForceShow = () => {
        Alert.alert(
            'Show Onboarding',
            'This will immediately show the onboarding screen. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Show Now', 
                    onPress: forceShowOnboarding 
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Ionicons name="information-circle-outline" size={48} color="#3B82F6" />
                <Text style={styles.title}>Onboarding Status</Text>
                
                <View style={styles.statusContainer}>
                    <Text style={styles.statusLabel}>Status:</Text>
                    <Text style={[
                        styles.status,
                        { color: hasSeenOnboarding ? '#10B981' : '#F59E0B' }
                    ]}>
                        {hasSeenOnboarding ? 'Completed' : 'Not Completed'}
                    </Text>
                </View>

                <View style={styles.versionContainer}>
                    <Text style={styles.versionLabel}>Version:</Text>
                    <Text style={styles.version}>{currentVersion}</Text>
                </View>
                
                <Text style={styles.description}>
                    {hasSeenOnboarding 
                        ? 'You have completed the onboarding. Use the buttons below to reset or show it again.'
                        : 'Onboarding will be shown on next app launch.'
                    }
                </Text>
                
                <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                        style={[styles.button, styles.resetButton]} 
                        onPress={handleResetOnboarding}
                    >
                        <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.buttonText}>Reset Onboarding</Text>
                    </TouchableOpacity>

                    {hasSeenOnboarding && (
                        <TouchableOpacity 
                            style={[styles.button, styles.showButton]} 
                            onPress={handleForceShow}
                        >
                            <Ionicons name="play-outline" size={20} color="#FFFFFF" />
                            <Text style={styles.buttonText}>Show Now</Text>
                        </TouchableOpacity>
                    )}
                </View>
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
        marginBottom: 16,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#6B7280',
        marginRight: 8,
    },
    status: {
        fontSize: 16,
        fontWeight: '700',
    },
    versionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    versionLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
        marginRight: 8,
    },
    version: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4F46E5',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    description: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    buttonContainer: {
        gap: 12,
        width: '100%',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    resetButton: {
        backgroundColor: '#EF4444', // Red
        shadowColor: '#EF4444',
    },
    showButton: {
        backgroundColor: '#10B981', // Green
        shadowColor: '#10B981',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default OnboardingDemo;