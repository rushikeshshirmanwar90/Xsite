import Loading from '@/components/Loading';
import { domain } from '@/lib/domain';
import { generateOTP } from '@/lib/functions';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

type Role = 'site-engineer' | 'supervisor' | 'manager';

export default function RegisterScreen() {
    const router = useRouter();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Email verification states
    const [emailVerified, setEmailVerified] = useState(false);
    const [otp, setOtp] = useState('');
    const [generatedOTP, setGeneratedOTP] = useState(0);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);

    // Default role for all new staff
    const role: Role = 'site-engineer';

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
            const response = await axios.post(`${domain}/api/otp`, {
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
            toast.error('Failed to send OTP. Please try again.');
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

        if (password.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        // Check for uppercase letter
        if (!/[A-Z]/.test(password)) {
            toast.error('Password must contain at least one uppercase letter');
            return;
        }

        // Check for lowercase letter
        if (!/[a-z]/.test(password)) {
            toast.error('Password must contain at least one lowercase letter');
            return;
        }

        // Check for number
        if (!/\d/.test(password)) {
            toast.error('Password must contain at least one number');
            return;
        }

        // Check for special character
        if (!/[@$!%*?&]/.test(password)) {
            toast.error('Password must contain at least one special character (@$!%*?&)');
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

            const response = await axios.post(`${domain}/api/staff`, {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim().toLowerCase(),
                phoneNumber: phoneNumber.trim(),
                role,
                password: password.trim(),
                clientIds: [], // Empty array - admin will assign clients later
            });

            console.log('✅ Registration response:', response.data);

            if (response.status === 201) {
                toast.success('Staff member registered successfully!');
                toast.success('You can now login with your credentials');
                
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
                
                // Navigate back to login after a short delay
                setTimeout(() => {
                    router.replace('/login');
                }, 2000);
            }
        } catch (error: any) {
            console.error('❌ Registration error:', error);
            
            if (error.response) {
                const errorMessage = error.response.data?.error || error.response.data?.message || 'Registration failed';
                toast.error(errorMessage);
                console.error('Error response:', error.response.data);
            } else if (error.request) {
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
                            <Text style={styles.welcomeText}>Create Staff Account</Text>
                            <Text style={styles.stepDescription}>
                                Fill in the details to register a new staff member
                            </Text>

                            {/* First Name */}
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="person" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="First Name"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    autoCapitalize="words"
                                />
                            </View>

                            {/* Last Name */}
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Last Name"
                                    value={lastName}
                                    onChangeText={setLastName}
                                    autoCapitalize="words"
                                />
                            </View>

                            {/* Email */}
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="email" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
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
                                />
                                {emailVerified && (
                                    <Ionicons name="checkmark-circle" size={24} color="#10B981" style={{ marginRight: 8 }} />
                                )}
                            </View>

                            {/* Email Verification Button */}
                            {!emailVerified && !showOtpInput && (
                                <TouchableOpacity
                                    style={styles.verifyButton}
                                    onPress={handleSendOtp}
                                    disabled={sendingOtp || !email.trim()}
                                >
                                    {sendingOtp ? (
                                        <ActivityIndicator size="small" color="#3b82f6" />
                                    ) : (
                                        <>
                                            <Ionicons name="mail-outline" size={18} color="#3b82f6" />
                                            <Text style={styles.verifyButtonText}>Verify Email</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
 
                            {/* OTP Input */}
                            {showOtpInput && !emailVerified && (
                                <View style={styles.otpContainer}>
                                    <View style={styles.inputContainer}>
                                        <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter 6-digit OTP"
                                            value={otp}
                                            onChangeText={setOtp}
                                            keyboardType="number-pad"
                                            maxLength={6}
                                        />
                                    </View>
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
                                </View>
                            )}

                            {/* Phone Number */}
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="phone" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Phone Number"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    keyboardType="phone-pad"
                                    maxLength={15}
                                />
                            </View>

                            {/* Password */}
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password (8+ chars, A-z, 0-9, @$!%*?&)"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.visibilityIcon}
                                    activeOpacity={0.7}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons
                                        name={showPassword ? "eye-off" : "eye"}
                                        size={24}
                                        color="#3b82f6"
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Confirm Password */}
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={styles.visibilityIcon}
                                    activeOpacity={0.7}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? "eye-off" : "eye"}
                                        size={24}
                                        color="#3b82f6"
                                    />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.helperText}>
                                * Password must be 8+ characters with uppercase, lowercase, number, and special character (@$!%*?&)
                            </Text>

                            {/* Register Button */}
                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleRegister}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={['#3b82f6', '#4f46e5']}
                                    style={styles.buttonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.buttonText}>Register Staff</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Back to Login */}
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => router.back()}
                            >
                                <Text style={styles.secondaryButtonText}>Back to Login</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    content: {
        padding: 24,
        justifyContent: 'center',
    },
    formContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
    },
    welcomeText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#4f46e5',
        marginBottom: 8,
        textAlign: 'center',
    },
    stepDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 24,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f7f9fc',
        borderWidth: 1,
        borderColor: '#e6e8eb',
        borderRadius: 12,
        marginBottom: 16,
        padding: 4,
    },
    inputIcon: {
        padding: 10,
    },
    visibilityIcon: {
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        paddingRight: 12,
        fontSize: 16,
        color: '#333',
    },
    dropdownButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingRight: 12,
    },
    dropdownText: {
        fontSize: 16,
        color: '#333',
    },
    dropdownList: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e6e8eb',
        borderRadius: 12,
        marginBottom: 16,
        marginTop: -8,
        overflow: 'hidden',
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#333',
    },
    dropdownItemTextActive: {
        color: '#3B82F6',
        fontWeight: '600',
    },
    helperText: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 16,
        fontStyle: 'italic',
    },
    button: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#3b82f6',
        borderRadius: 12,
        paddingVertical: 15,
        marginTop: 16,
    },
    secondaryButtonText: {
        color: '#3b82f6',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    verifyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#3b82f6',
        borderRadius: 12,
        paddingVertical: 12,
        marginBottom: 16,
        gap: 8,
    },
    verifyButtonText: {
        color: '#3b82f6',
        fontSize: 14,
        fontWeight: '600',
    },
    otpContainer: {
        marginBottom: 16,
    },
    otpActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: -8,
    },
    verifyOtpButton: {
        flex: 1,
        backgroundColor: '#10B981',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    verifyOtpButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    resendButton: {
        flex: 1,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#3b82f6',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    resendButtonText: {
        color: '#3b82f6',
        fontSize: 14,
        fontWeight: '600',
    },
});
