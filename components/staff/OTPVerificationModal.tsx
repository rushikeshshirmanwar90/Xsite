import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OTPVerificationModalProps {
    visible: boolean;
    onClose: () => void;
    onVerify: (otp: string) => Promise<boolean>;
    email: string;
    staffName: string;
}

const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({
    visible,
    onClose,
    onVerify,
    email,
    staffName,
}) => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleVerify = async () => {
        if (otp.length !== 6) {
            setError('Please enter a 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const success = await onVerify(otp);
            if (success) {
                setOtp('');
                onClose();
            } else {
                setError('Invalid OTP. Please try again.');
            }
        } catch (err) {
            setError('Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setOtp('');
        setError('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="mail-outline" size={32} color="#3B82F6" />
                        </View>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={handleClose}
                        >
                            <Ionicons name="close" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Verify Email</Text>
                    <Text style={styles.subtitle}>
                        We've sent a 6-digit verification code to
                    </Text>
                    <Text style={styles.email}>{email}</Text>

                    {/* OTP Input */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChangeText={(text) => {
                                setOtp(text.replace(/[^0-9]/g, ''));
                                setError('');
                            }}
                            keyboardType="number-pad"
                            maxLength={6}
                            autoFocus
                        />
                    </View>

                    {/* Error Message */}
                    {error ? (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={16} color="#EF4444" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {/* Verify Button */}
                    <TouchableOpacity
                        style={[
                            styles.verifyButton,
                            (loading || otp.length !== 6) && styles.verifyButtonDisabled,
                        ]}
                        onPress={handleVerify}
                        disabled={loading || otp.length !== 6}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                <Text style={styles.verifyButtonText}>Verify Email</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Info Text */}
                    <Text style={styles.infoText}>
                        Didn't receive the code? Check your spam folder or try again.
                    </Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        padding: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 16,
    },
    input: {
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 16,
        fontSize: 24,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 8,
        color: '#1E293B',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    errorText: {
        fontSize: 14,
        color: '#EF4444',
        flex: 1,
    },
    verifyButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    verifyButtonDisabled: {
        backgroundColor: '#CBD5E1',
    },
    verifyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    infoText: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 18,
    },
});

export default OTPVerificationModal;