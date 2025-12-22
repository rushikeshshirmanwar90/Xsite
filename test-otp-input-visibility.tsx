// Test component to verify OTP input field visibility
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TestOTPInput: React.FC = () => {
    const [otp, setOtp] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleOtpChange = (text: string) => {
        const numericText = text.replace(/[^0-9]/g, '').slice(0, 6);
        setOtp(numericText);
    };

    const testInput = () => {
        Alert.alert('Test Result', `OTP entered: ${otp}\nLength: ${otp.length}`);
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.content}>
                    <Text style={styles.title}>OTP Input Test</Text>
                    <Text style={styles.subtitle}>Test the visibility and functionality of OTP input</Text>

                    {/* Main OTP Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Enter 6-digit OTP:</Text>
                        <TextInput
                            style={[
                                styles.otpInput,
                                isFocused && styles.otpInputFocused,
                                otp.length === 6 && styles.otpInputComplete
                            ]}
                            value={otp}
                            onChangeText={handleOtpChange}
                            keyboardType="number-pad"
                            maxLength={6}
                            placeholder="000000"
                            placeholderTextColor="#CBD5E1"
                            textAlign="center"
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            autoFocus={true}
                        />
                        
                        {/* Status */}
                        <View style={styles.statusContainer}>
                            {isFocused ? (
                                <View style={styles.statusActive}>
                                    <Ionicons name="create-outline" size={16} color="#3B82F6" />
                                    <Text style={styles.statusText}>Input is focused and ready</Text>
                                </View>
                            ) : otp.length === 6 ? (
                                <View style={styles.statusComplete}>
                                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                    <Text style={styles.statusText}>OTP complete: {otp}</Text>
                                </View>
                            ) : (
                                <View style={styles.statusWaiting}>
                                    <Ionicons name="keypad-outline" size={16} color="#6B7280" />
                                    <Text style={styles.statusText}>Tap input field above</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Visual Display */}
                    <View style={styles.visualContainer}>
                        <Text style={styles.visualLabel}>Visual Display:</Text>
                        <View style={styles.boxContainer}>
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.box,
                                        otp.length > index && styles.boxFilled
                                    ]}
                                >
                                    <Text style={styles.boxText}>
                                        {otp[index] || '•'}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Test Button */}
                    <TouchableOpacity style={styles.testButton} onPress={testInput}>
                        <Ionicons name="checkmark-circle" size={20} color="white" />
                        <Text style={styles.testButtonText}>Test Input</Text>
                    </TouchableOpacity>

                    {/* Debug Info */}
                    <View style={styles.debugContainer}>
                        <Text style={styles.debugTitle}>Debug Info:</Text>
                        <Text style={styles.debugText}>Current OTP: "{otp}"</Text>
                        <Text style={styles.debugText}>Length: {otp.length}</Text>
                        <Text style={styles.debugText}>Is Focused: {isFocused ? 'Yes' : 'No'}</Text>
                        <Text style={styles.debugText}>Platform: {Platform.OS}</Text>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 40,
    },
    inputContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
        marginBottom: 16,
    },
    otpInput: {
        backgroundColor: '#F8FAFC',
        borderWidth: 3,
        borderColor: '#CBD5E1',
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 18,
        fontSize: 28,
        fontWeight: '700',
        color: '#1E293B',
        textAlign: 'center',
        letterSpacing: 8,
        minHeight: 64,
    },
    otpInputFocused: {
        borderColor: '#3B82F6',
        backgroundColor: '#EBF8FF',
    },
    otpInputComplete: {
        borderColor: '#10B981',
        backgroundColor: '#ECFDF5',
    },
    statusContainer: {
        alignItems: 'center',
        marginTop: 12,
        minHeight: 32,
    },
    statusActive: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EBF8FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statusComplete: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statusWaiting: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    visualContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    visualLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
        marginBottom: 16,
    },
    boxContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    box: {
        width: 48,
        height: 56,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    boxFilled: {
        borderColor: '#10B981',
        backgroundColor: '#ECFDF5',
    },
    boxText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#374151',
    },
    testButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 30,
    },
    testButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    debugContainer: {
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    debugTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    debugText: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 4,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
});

export default TestOTPInput;