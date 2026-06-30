import CustomTextInput from '@/components/common/CustomTextInput';
import { useAuth } from '@/contexts/AuthContext';
import { domain } from '@/lib/domain';
import { generateOTP } from '@/lib/functions';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '@/utils/axiosConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

type Role = 'site-engineer' | 'supervisor' | 'manager';

interface StaffRegistrationResponse {
    success?: boolean;
    data?: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
        role: Role;
        clients: {
            clientId: string;
            clientName: string;
            assignedAt?: Date;
        }[];
        [key: string]: any;
    };
    message?: string;
    [key: string]: any;
}

interface OTPResponse {
    success?: boolean;
    message?: string;
    [key: string]: any;
}

export default function RegisterScreen() {
    const router = useRouter();
    const { checkAuthStatus } = useAuth();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    
    // Email verification states
    const [emailVerified, setEmailVerified] = useState(false);
    const [otp, setOtp] = useState('');
    const [generatedOTP, setGeneratedOTP] = useState(0);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);

    // Animation for header icon
    const scaleAnim = new Animated.Value(1);

    // Default role for all new staff
    const role: Role = 'site-engineer';

    // Animate icon on mount
    useEffect(() => {
        const pulse = () => {
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ]).start(() => pulse());
        };
        pulse();
    }, []);

    const handleSendOtp = async () => {
        // Validate email first
        if (!email.trim() || !email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        setSendingOtp(true);

        try {
            console.log('📧 Sending OTP to:', email);
            
            // Generate OTP
            const OTP = generateOTP();
            setGeneratedOTP(OTP);
            
            // Send OTP via API
            const response = await apiClient.post<OTPResponse>(`/api/otp`, {
                email: email.trim().toLowerCase(),
                OTP: OTP,
            });

            if (response.status === 200) {
                toast.success('OTP sent to your email');
                setShowOtpInput(true);
            } else {
                toast.error('Failed to send OTP');
            }
        } catch (error: any) {
            console.error('❌ Error sending OTP:', error);
            if (error?.response || error?.request) {
                toast.error('Failed to send OTP. Please try again.');
            } else {
                toast.error('An unexpected error occurred');
            }
        } finally {
            setSendingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp.trim() || otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        if (Number(otp) === generatedOTP) {
            toast.success('Email verified successfully!');
            setEmailVerified(true);
            setShowOtpInput(false);
        } else {
            toast.error('Invalid OTP. Please try again.');
        }
    };

    const handleRegister = async () => {
        // Validation
        if (!firstName.trim()) {
            toast.error('First name is required');
            return;
        }

        if (!lastName.trim()) {
            toast.error('Last name is required');
            return;
        }

        if (!email.trim() || !email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        // Check if email is verified
        if (!emailVerified) {
            toast.error('Please verify your email first');
            return;
        }

        if (!phoneNumber.trim() || phoneNumber.length < 10) {
            toast.error('Please enter a valid phone number');
            return;
        }

        // Password validation
        if (!password.trim()) {
            toast.error('Password is required');
            return;
        }

        // Confirm password validation
        if (!confirmPassword.trim()) {
            toast.error('Please confirm your password');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            console.log('📝 Registering staff member...');
            console.log('Data:', { firstName, lastName, email, phoneNumber, role });
            console.log('🔑 Password length:', password.trim().length);
            console.log('🔑 Password provided:', !!password.trim());

            const payload = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim().toLowerCase(),
                phoneNumber: phoneNumber.trim(),
                role,
                password: password.trim(),
                clients: [], // Empty array - admin will assign clients later
            };

            console.log('📦 Complete payload:', { ...payload, password: `[${payload.password.length} chars]` });

            const response = await apiClient.post<StaffRegistrationResponse>(`/api/staff`, payload);

            console.log('✅ Registration response:', response.data);

            if (response.status === 201) {
                toast.success('Staff member registered successfully!');
                
                // Auto-login the user after successful registration
                console.log('🔐 Auto-logging in user after registration...');
                console.log('📦 Registration response:', response.data);
                
                // Extract staff data from response
                const staffData = response.data.data || response.data;
                
                // Prepare user data for storage
                const userData = {
                    _id: staffData?._id || '',
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    email: email.trim().toLowerCase(),
                    phoneNumber: phoneNumber.trim(),
                    role,
                    clients: staffData?.clients || [], // Use clients from response
                    userType: 'staff' as const // Add userType for navigation
                };

                console.log('💾 Storing user data:', userData);

                // Clear any existing auth data and store new user data
                try {
                    // Remove specific keys instead of clearing everything
                    await AsyncStorage.multiRemove(['user', 'userType', 'token', 'refreshToken']);
                    console.log('✅ Cleared existing auth data');
                } catch (clearError) {
                    console.warn('⚠️ Error clearing storage (non-critical):', clearError);
                    // Continue anyway - this is not critical
                }
                
                // Store new user data
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                await AsyncStorage.setItem('userType', 'staff');

                // Show navigating state
                setIsNavigating(true);
                toast.success('Welcome! Redirecting to your dashboard...');

                // Update auth context
                await checkAuthStatus();

                // Clear form
                setFirstName('');
                setLastName('');
                setEmail('');
                setPhoneNumber('');
                setPassword('');
                setConfirmPassword('');
                setEmailVerified(false);
                setOtp('');
                setShowOtpInput(false);
                
                // Let AuthContext handle navigation automatically
                // The layout will detect the auth change and redirect to main app
                setLoading(false);
                setIsNavigating(false);
            }
        } catch (error: any) {
            console.error('❌ Registration error:', error);
            
            if (error?.response) {
                const errorMessage = error.response.data?.error || error.response.data?.message || 'Registration failed';
                toast.error(errorMessage);
                console.error('Error response:', error.response.data);
            } else if (error?.request) {
                toast.error('Network error. Please check your connection.');
            } else {
                toast.error('An unexpected error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#1F2937" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Staff Registration</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <View style={styles.content}>
                        <View style={styles.formContainer}>
                            <View style={styles.headerSection}>
                                <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
                                    <Ionicons name="person-add" size={32} color="#2E72F0" />
                                </Animated.View>
                                <Text style={styles.welcomeText}>Create Staff Account</Text>
                                <Text style={styles.stepDescription}>
                                    Join our team and start managing projects efficiently
                                </Text>
                            </View>

                            <View style={styles.inputSection}>
                                {/* First Name */}
                                <CustomTextInput
                                    icon="person"
                                    placeholder="First Name"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    autoCapitalize="words"
                                />

                                {/* Last Name */}
                                <CustomTextInput
                                    icon="person-outline"
                                    placeholder="Last Name"
                                    value={lastName}
                                    onChangeText={setLastName}
                                    autoCapitalize="words"
                                />

                                {/* Email */}
                                <CustomTextInput
                                    icon="email"
                                    iconColor={emailVerified ? "#10B981" : "#666"}
                                    placeholder="Email Address"
                                    value={email}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        // Reset verification if email changes
                                        if (emailVerified) {
                                            setEmailVerified(false);
                                            setShowOtpInput(false);
                                            setOtp('');
                                        }
                                    }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    editable={!emailVerified}
                                    containerStyle={emailVerified ? styles.inputContainerVerified : undefined}
                                    inputStyle={emailVerified ? styles.inputDisabled : undefined}
                                    rightElement={emailVerified ? (
                                        <Ionicons name="checkmark-circle" size={24} color="#10B981" style={{ marginRight: 8 }} />
                                    ) : undefined}
                                />

                                {/* Verified Email Display */}
                                {emailVerified && (
                                    <View style={styles.verifiedEmailContainer}>
                                        <View style={styles.verifiedEmailContent}>
                                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                            <Text style={styles.verifiedEmailText}>
                                                Email verified: {email}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {/* Change Email Button - Always visible after verification */}
                                {emailVerified && (
                                    <TouchableOpacity
                                        style={styles.changeEmailButtonVerified}
                                        onPress={() => {
                                            setEmailVerified(false);
                                            setShowOtpInput(false);
                                            setOtp('');
                                            setGeneratedOTP(0);
                                            setEmail('');
                                            toast.info('Email verification reset. You can now enter a different email address');
                                        }}
                                    >
                                        <Ionicons name="mail" size={16} color="#2E72F0" />
                                        <Text style={styles.changeEmailButtonVerifiedText}>Change Email</Text>
                                    </TouchableOpacity>
                                )}

                                {/* Email Verification Button */}
                                {!emailVerified && !showOtpInput && (
                                    <TouchableOpacity
                                        style={styles.verifyButton}
                                        onPress={handleSendOtp}
                                        disabled={sendingOtp || !email.trim()}
                                    >
                                        {sendingOtp ? (
                                            <ActivityIndicator size="small" color="#2E72F0" />
                                        ) : (
                                            <>
                                                <Ionicons name="mail-outline" size={18} color="#2E72F0" />
                                                <Text style={styles.verifyButtonText}>Verify Email</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
     
                                {/* OTP Input */}
                                {showOtpInput && !emailVerified && (
                                    <View style={styles.otpContainer}>
                                        {/* Email Display */}
                                        <View style={styles.emailDisplayContainer}>
                                            <MaterialIcons name="email" size={16} color="#2E72F0" />
                                            <Text style={styles.emailDisplayText}>
                                                Verifying: {email}
                                            </Text>
                                        </View>
                                        
                                        <CustomTextInput
                                            icon="lock"
                                            placeholder="Enter 6-digit OTP"
                                            value={otp}
                                            onChangeText={setOtp}
                                            keyboardType="number-pad"
                                            maxLength={6}
                                        />
                                        <View style={styles.otpActions}>
                                            <TouchableOpacity
                                                style={styles.verifyOtpButton}
                                                onPress={handleVerifyOtp}
                                            >
                                                <Text style={styles.verifyOtpButtonText}>Verify OTP</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.resendButton}
                                                onPress={handleSendOtp}
                                                disabled={sendingOtp}
                                            >
                                                <Text style={styles.resendButtonText}>Resend OTP</Text>
                                            </TouchableOpacity>
                                        </View>
                                        
                                        {/* Change Email Button */}
                                        <TouchableOpacity
                                            style={styles.changeEmailButton}
                                            onPress={() => {
                                                setShowOtpInput(false);
                                                setOtp('');
                                                setGeneratedOTP(0);
                                                setEmail('');
                                                toast.info('You can now enter a different email address');
                                            }}
                                        >
                                            <Ionicons name="mail" size={16} color="#6B7280" />
                                            <Text style={styles.changeEmailText}>Change Email</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Phone Number */}
                                <CustomTextInput
                                    icon="phone"
                                    placeholder="Phone Number"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    keyboardType="phone-pad"
                                    maxLength={15}
                                />

                                {/* Password */}
                                <CustomTextInput
                                    icon="lock"
                                    placeholder="Password"
                                    value={password}
                                    onChangeText={setPassword}
                                    isPassword={true}
                                    showPasswordToggle={true}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />

                                {/* Confirm Password */}
                                <CustomTextInput
                                    icon="lock-outline"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    isPassword={true}
                                    showPasswordToggle={true}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>



                            <View style={styles.buttonSection}>
                                {/* Register Button */}
                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={handleRegister}
                                    disabled={loading}
                                >
                                    <LinearGradient
                                        colors={['#2E72F0', '#1A54C4']}
                                        style={styles.buttonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <>
                                                <Ionicons name="person-add" size={20} color="white" style={{ marginRight: 8 }} />
                                                <Text style={styles.buttonText}>Create Account</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Back to Login */}
                                <TouchableOpacity
                                    style={styles.secondaryButton}
                                    onPress={() => router.back()}
                                >
                                    <Ionicons name="arrow-back" size={18} color="#2E72F0" style={{ marginRight: 8 }} />
                                    <Text style={styles.secondaryButtonText}>Back to Login</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Navigating Overlay */}
            {isNavigating && (
                <View style={styles.navigatingOverlay}>
                    <View style={styles.navigatingContainer}>
                        <ActivityIndicator size="large" color="#2E72F0" />
                        <Text style={styles.navigatingText}>Setting up your account...</Text>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    backButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    content: {
        padding: 20,
        justifyContent: 'center',
    },
    formContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
        marginVertical: 10,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#EAF0FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#2E72F0',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 8,
        textAlign: 'center',
    },
    stepDescription: {
        fontSize: 16,
        color: '#64748B',
        marginBottom: 8,
        textAlign: 'center',
        lineHeight: 22,
    },
    inputSection: {
        marginBottom: 24,
    },
    buttonSection: {
        gap: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        marginBottom: 16,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    inputContainerVerified: {
        backgroundColor: '#F0FDF4',
        borderColor: '#BBF7D0',
    },
    inputIcon: {
        padding: 12,
    },
    visibilityIcon: {
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        paddingRight: 12,
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '500',
    },
    inputDisabled: {
        color: '#9CA3AF',
        backgroundColor: 'transparent',
    },
    dropdownButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingRight: 12,
    },
    dropdownText: {
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '500',
    },
    dropdownList: {
        backgroundColor: '#ffffff',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        marginBottom: 16,
        marginTop: -8,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '500',
    },
    dropdownItemTextActive: {
        color: '#2E72F0',
        fontWeight: '700',
    },
    helperText: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 16,
        fontStyle: 'italic',
    },
    button: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#2E72F0',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    buttonGradient: {
        paddingVertical: 18,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#2E72F0',
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#2E72F0',
        fontSize: 16,
        fontWeight: '600',
    },
    verifyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EAF0FE',
        borderWidth: 2,
        borderColor: '#2E72F0',
        borderRadius: 16,
        paddingVertical: 14,
        marginBottom: 16,
        gap: 8,
        shadowColor: '#2E72F0',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    verifyButtonText: {
        color: '#2E72F0',
        fontSize: 15,
        fontWeight: '600',
    },
    otpContainer: {
        marginBottom: 16,
    },
    emailDisplayContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EAF0FE',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#C4D8FC',
    },
    emailDisplayText: {
        marginLeft: 8,
        fontSize: 15,
        color: '#1E40AF',
        fontWeight: '600',
        flex: 1,
    },
    otpActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    verifyOtpButton: {
        flex: 1,
        backgroundColor: '#10B981',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    verifyOtpButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '700',
    },
    resendButton: {
        flex: 1,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#2E72F0',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
    },
    resendButtonText: {
        color: '#2E72F0',
        fontSize: 15,
        fontWeight: '600',
    },
    changeEmailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#D1D5DB',
        borderRadius: 16,
        paddingVertical: 12,
        marginTop: 16,
        gap: 6,
    },
    changeEmailText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '500',
    },
    changeEmailButtonVerified: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EAF0FE',
        borderWidth: 2,
        borderColor: '#2E72F0',
        borderRadius: 16,
        paddingVertical: 12,
        marginBottom: 16,
        gap: 6,
        shadowColor: '#2E72F0',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    changeEmailButtonVerifiedText: {
        color: '#2E72F0',
        fontSize: 14,
        fontWeight: '600',
    },
    verifiedEmailContainer: {
        backgroundColor: '#F0FDF4',
        borderWidth: 2,
        borderColor: '#BBF7D0',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    verifiedEmailContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    verifiedEmailText: {
        flex: 1,
        fontSize: 15,
        color: '#166534',
        fontWeight: '600',
    },
    navigatingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    navigatingContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 40,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 12,
        minWidth: 200,
    },
    navigatingText: {
        marginTop: 20,
        fontSize: 17,
        fontWeight: '600',
        color: '#2E72F0',
        textAlign: 'center',
    },
});
