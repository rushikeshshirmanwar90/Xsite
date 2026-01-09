// components/AddStaffModalWithVerification.tsx
import { roles } from '@/data/staff';
import { AddStaffModalProps, Staff } from '@/types/staff';
import { emailService } from '@/services/emailService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useRef } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';

const AddStaffModalWithVerification: React.FC<AddStaffModalProps> = ({ visible, onClose, onAdd, companyName = 'Your Company' }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);
    
    // Simplified verification states
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    
    // Create ref for OTP input
    const otpInputRef = useRef<TextInput>(null);

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePhone = (phone: string): boolean => {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    };

    const validateForm = (): boolean => {
        if (!firstName.trim()) {
            Alert.alert('Error', 'Please enter first name');
            return false;
        }
        if (!lastName.trim()) {
            Alert.alert('Error', 'Please enter last name');
            return false;
        }
        if (!phoneNumber.trim()) {
            Alert.alert('Error', 'Please enter phone number');
            return false;
        }
        if (!validatePhone(phoneNumber)) {
            Alert.alert('Error', 'Please enter a valid phone number');
            return false;
        }
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter email address');
            return false;
        }
        if (!validateEmail(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return false;
        }
        if (!role) {
            Alert.alert('Error', 'Please select a role');
            return false;
        }
        return true;
    };

    const handleSendOTP = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            console.log('📧 Sending OTP to:', email);
            
            const otpPayload = {
                email: email.trim().toLowerCase(),
                staffName: `${firstName.trim()} ${lastName.trim()}`,
                companyName: companyName
            };

            const success = await emailService.sendOTPEmail(otpPayload);
            
            if (success) {
                setOtpSent(true);
                setShowOtpInput(true);
                Alert.alert(
                    'Verification Code Sent',
                    `A 6-digit verification code has been sent to ${email}. Please enter it below.`,
                    [{ text: 'OK', onPress: () => {
                        // Focus the OTP input after alert is dismissed
                        setTimeout(() => {
                            otpInputRef.current?.focus();
                        }, 100);
                    }}]
                );
            } else {
                Alert.alert('Error', 'Failed to send verification email. Please try again.');
            }
        } catch (error) {
            console.error('❌ Error sending OTP:', error);
            Alert.alert('Error', 'Failed to send verification email. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp.trim()) {
            Alert.alert('Error', 'Please enter the verification code');
            return;
        }

        if (otp.trim().length !== 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit verification code');
            return;
        }

        setIsLoading(true);
        try {
            console.log('🔐 Verifying OTP with backend...');
            console.log('🔍 Entered OTP:', otp.trim());
            console.log('📧 Email:', email.trim().toLowerCase());
            
            // Use the backend verification API
            const success = await emailService.verifyOTP(email.trim().toLowerCase(), otp.trim());
            
            if (success) {
                console.log('✅ OTP verified successfully (backend validation)');
                setIsEmailVerified(true);
                Alert.alert(
                    'Email Verified!',
                    'Your email has been successfully verified.',
                    [{ text: 'OK' }]
                );
            } else {
                console.log('❌ Invalid OTP (backend validation)');
                Alert.alert('Error', 'Invalid verification code. Please try again.');
                setOtp('');
            }
        } catch (error) {
            console.error('❌ Error verifying OTP:', error);
            Alert.alert('Error', 'Failed to verify code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = () => {
        if (!isEmailVerified) {
            Alert.alert('Error', 'Please verify your email address first');
            return;
        }

        const newStaff: Staff = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phoneNumber: phoneNumber.trim(),
            email: email.trim().toLowerCase(),
            role,
            assignedProjects: [] // This will be an empty array of ProjectAssignment objects
        };

        console.log('✅ Adding verified staff:', newStaff);
        onAdd(newStaff);
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setFirstName('');
        setLastName('');
        setPhoneNumber('');
        setEmail('');
        setRole('');
        setOtp('');
        setShowRoleDropdown(false);
        setIsEmailVerified(false);
        setShowOtpInput(false);
        setOtpSent(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView 
                style={styles.modalOverlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add New Staff Member</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                        {/* First Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>First Name *</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    placeholder="Enter first name"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>

                        {/* Last Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Last Name *</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={lastName}
                                    onChangeText={setLastName}
                                    placeholder="Enter last name"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>

                        {/* Phone Number */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number *</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="call-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    placeholder="+91 98765 43210"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                        {/* Email Address */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address *</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="name@company.com"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        {/* Role */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Role *</Text>
                            <TouchableOpacity
                                style={styles.dropdown}
                                onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                            >
                                <Ionicons name="briefcase-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                                <Text style={role ? styles.dropdownText : styles.dropdownPlaceholder}>
                                    {role || 'Select role'}
                                </Text>
                                <Ionicons
                                    name={showRoleDropdown ? "chevron-up" : "chevron-down"}
                                    size={20}
                                    color="#6B7280"
                                />
                            </TouchableOpacity>

                            {showRoleDropdown && (
                                <View style={styles.dropdownList}>
                                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                                        {roles.map((roleOption, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={[
                                                    styles.dropdownItem,
                                                    role === roleOption && styles.selectedDropdownItem
                                                ]}
                                                onPress={() => {
                                                    setRole(roleOption);
                                                    setShowRoleDropdown(false);
                                                }}
                                            >
                                                <Text style={[
                                                    styles.dropdownItemText,
                                                    role === roleOption && styles.selectedDropdownItemText
                                                ]}>
                                                    {roleOption}
                                                </Text>
                                                {role === roleOption && (
                                                    <Ionicons name="checkmark" size={16} color="#3B82F6" />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>

                        {/* Email Verification Section */}
                        <View style={styles.verificationSection}>
                            <Text style={styles.verificationLabel}>Email Verification</Text>
                            
                            {/* Send Verification Button */}
                            {!otpSent ? (
                                <TouchableOpacity 
                                    style={[styles.verifyButton, isLoading && styles.disabledButton]} 
                                    onPress={handleSendOTP}
                                    disabled={isLoading}
                                >
                                    <LinearGradient
                                        colors={isLoading ? ['#9CA3AF', '#9CA3AF'] : ['#3B82F6', '#8B5CF6']}
                                        style={styles.verifyButtonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator size="small" color="white" />
                                        ) : (
                                            <Ionicons name="mail" size={18} color="white" />
                                        )}
                                        <Text style={styles.verifyButtonText}>
                                            {isLoading ? 'Sending...' : 'Send Verification Code'}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.sentContainer}>
                                    <View style={styles.sentMessage}>
                                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                        <Text style={styles.sentText}>Verification code sent to {email}</Text>
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.resendButton} 
                                        onPress={handleSendOTP}
                                        disabled={isLoading}
                                    >
                                        <Ionicons name="refresh-outline" size={16} color="#3B82F6" />
                                        <Text style={styles.resendText}>Resend</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* OTP Input Field - Shows after verification code is sent */}
                            {showOtpInput && (
                                <View style={styles.otpContainer}>
                                    <Text style={styles.otpLabel}>Enter 6-digit verification code</Text>
                                    <View style={styles.otpInputContainer}>
                                        <TextInput
                                            ref={otpInputRef}
                                            style={styles.otpInput}
                                            value={otp}
                                            onChangeText={(text) => {
                                                const numericText = text.replace(/[^0-9]/g, '').slice(0, 6);
                                                setOtp(numericText);
                                            }}
                                            keyboardType="number-pad"
                                            maxLength={6}
                                            placeholder="000000"
                                            placeholderTextColor="#9CA3AF"
                                            textAlign="center"
                                        />
                                        {otp.length === 6 && (
                                            <TouchableOpacity 
                                                style={styles.verifyOtpButton}
                                                onPress={handleVerifyOTP}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? (
                                                    <ActivityIndicator size="small" color="#10B981" />
                                                ) : (
                                                    <Ionicons name="checkmark" size={20} color="#10B981" />
                                                )}
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    
                                    {/* Verification Status */}
                                    {isEmailVerified && (
                                        <View style={styles.verifiedContainer}>
                                            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                            <Text style={styles.verifiedText}>Email verified successfully!</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    {/* Modal Actions */}
                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[
                                styles.submitButton, 
                                (!isEmailVerified || isLoading) && styles.disabledButton
                            ]} 
                            onPress={handleSubmit}
                            disabled={!isEmailVerified || isLoading}
                        >
                            <LinearGradient
                                colors={(!isEmailVerified || isLoading) ? ['#9CA3AF', '#9CA3AF'] : ['#10B981', '#059669']}
                                style={styles.submitButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="add" size={18} color="white" />
                                <Text style={styles.submitButtonText}>Add Staff</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        margin: 20,
        borderRadius: 20,
        width: '90%',
        maxHeight: '85%',
        flex: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    form: {
        paddingHorizontal: 20,
        maxHeight: 500,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
    },
    dropdownText: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
    },
    dropdownPlaceholder: {
        flex: 1,
        fontSize: 16,
        color: '#9CA3AF',
    },
    dropdownList: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        marginTop: 4,
        maxHeight: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    dropdownScroll: {
        maxHeight: 200,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    selectedDropdownItem: {
        backgroundColor: '#EBF8FF',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#374151',
        flex: 1,
    },
    selectedDropdownItemText: {
        color: '#1E40AF',
        fontWeight: '500',
    },
    // NEW VERIFICATION SECTION STYLES
    verificationSection: {
        marginTop: 20,
        marginBottom: 20,
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    verificationLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    verifyButton: {
        borderRadius: 12,
        marginBottom: 12,
    },
    verifyButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 8,
    },
    verifyButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    sentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    sentMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    sentText: {
        fontSize: 14,
        color: '#10B981',
        fontWeight: '500',
        flex: 1,
    },
    resendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    resendText: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '500',
    },
    otpContainer: {
        marginTop: 12,
    },
    otpLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    otpInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    otpInput: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#3B82F6',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 24,
        fontWeight: '700',
        color: '#1E293B',
        textAlign: 'center',
        letterSpacing: 8,
        minHeight: 48,
    },
    verifyOtpButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#ECFDF5',
        borderWidth: 2,
        borderColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
    },
    verifiedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#ECFDF5',
        borderRadius: 8,
        gap: 6,
    },
    verifiedText: {
        fontSize: 14,
        color: '#10B981',
        fontWeight: '500',
    },
    modalActions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 20,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '600',
    },
    submitButton: {
        flex: 1,
        borderRadius: 12,
    },
    disabledButton: {
        opacity: 0.6,
    },
    submitButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AddStaffModalWithVerification;