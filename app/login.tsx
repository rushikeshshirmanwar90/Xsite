import Loading from '@/components/Loading';
import { useAuth } from '@/contexts/AuthContext';
import { addPassword, confirmMail, findUserType, forgetPassword, getUser, login, sendOtp } from '@/functions/login';
import { generateOTP } from '@/lib/functions';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
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

type Step = 'email' | 'otp' | 'password';

export default function LoginScreen() {
    const router = useRouter();
    const { checkAuthStatus } = useAuth();
    const scrollViewRef = useRef<ScrollView>(null);

    const [mountLoading, setMountLoading] = useState<boolean>(true);
    const [currentStep, setCurrentStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [generatedOTP, setGeneratedOTP] = useState(1);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [userType, setUserType] = useState('');
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        // Just check if we should show loading, don't navigate
        // Let the root layout handle navigation based on auth state
        const checkLogin = async () => {
            try {
                const res = await AsyncStorage.getItem("user")
                if (res) {
                    // User is already logged in, let AuthContext handle navigation
                    console.log('User already logged in, waiting for AuthContext...');
                }
                // Always set loading to false, let AuthContext handle navigation
                setMountLoading(false);
            } catch (error) {
                console.error('Error checking login:', error);
                setMountLoading(false);
            }
        }
        checkLogin();
    }, [])

    if (mountLoading) {
        return <Loading />
    }

    const handleGenerateOTP = async () => {
        if (!email.trim() || !email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            const check = await confirmMail(email);

            console.log(check);
            console.log(check.userType)
            setUserType(check.userType)
            if (!check.verified) {
                if (check) {
                    const OTP = generateOTP();
                    setGeneratedOTP(OTP);
                    const sendMail = await sendOtp(email, OTP);
                    if (sendMail) {
                        toast.success('OTP sent to your email');
                    } else {
                        toast.error("something went wrong, can't send the OTP")
                    }
                } else {
                    toast.warning('user not found')
                }
                setCurrentStep('otp');
            } else {
                setIsVerified(true);
                setCurrentStep('password')
            }
        } catch (error) {
            toast.error('user not found');
            console.log(error)
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp.trim() || otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        try {
            if (Number(otp) === generatedOTP) {
                toast.success('OTP verified successfully');
                // ✅ Only proceed to password step if OTP is correct
                setCurrentStep('password');
            } else {
                toast.error("Invalid OTP");
                // ✅ Stay on OTP step if OTP is wrong
                // Don't change the step, let user try again
            }
        } catch (error) {
            toast.error('Invalid OTP');
            // ✅ Stay on OTP step if there's an error
        } finally {
            setLoading(false);
        }
    };

    const handleSetPassword = async () => {
        // ✅ Enhanced password validation to match backend requirements
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

        setLoading(true);
        try {
            console.log('Setting password for user type:', userType);
            console.log('Password validation passed, calling API...');

            const res = await addPassword(email, password, userType);
            console.log('addPassword result:', res);
            
            if (res.success) {
                const user = await getUser(email, userType);
                console.log('User data retrieved:', user);

                // ✅ Ensure _id is accessible and stored properly
                if (user && user._id) {
                    // Convert ObjectId to string if needed
                    if (typeof user._id === 'object') {
                        user._id = user._id.toString();
                    }
                    
                    // ✅ FIX: Don't override clientId with _id! 
                    // The API already returns the correct clientId
                    // user.clientId should be the client/company ID, not the user's own ID
                    if (user.clientId && typeof user.clientId === 'object') {
                        user.clientId = user.clientId.toString();
                    }
                    
                    console.log('✅ User ID (_id):', user._id);
                    console.log('✅ Client ID (clientId):', user.clientId);
                    console.log('✅ These should be DIFFERENT values!');
                }

                // ✅ Clear any existing data before storing new data
                console.log('🧹 Clearing existing data before login...');
                await AsyncStorage.clear();
                
                // Store fresh user data in AsyncStorage
                const jsonUser = JSON.stringify(user);
                console.log('💾 Storing fresh user data:', jsonUser);
                await AsyncStorage.setItem('user', jsonUser);

                // Also store userType separately for reference
                await AsyncStorage.setItem('userType', userType);
                
                console.log('✅ Fresh login data stored successfully');

                toast.success('Password set successfully');

                // Show navigating state
                setIsNavigating(true);
                setLoading(false);

                // Trigger auth context to update
                await checkAuthStatus();

                // Navigate after a brief moment
                setTimeout(() => {
                    router.replace({
                        pathname: "/(tabs)"
                    });
                }, 300);
            } else {
                console.error('❌ Password setup failed:', res.error);
                toast.error(res.error || "Failed to set password. Please try again.");
                setLoading(false);
            }
        } catch (error) {
            console.error('Password setup error:', error);
            toast.error('Failed to set password');
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!password.trim()) {
            toast.error("Password is required");
            return;
        }

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters long");
            return;
        }

        setLoading(true);

        try {
            const result = await login(email, password);
            console.log('Login result:', result);

            if (result.success) {
                const user = await getUser(email, userType);
                console.log('User data retrieved:', user);

                // ✅ Ensure _id is accessible and stored properly
                if (user && user._id) {
                    // Convert ObjectId to string if needed
                    if (typeof user._id === 'object') {
                        user._id = user._id.toString();
                    }
                    
                    // ✅ FIX: Don't override clientId with _id! 
                    // The API already returns the correct clientId
                    // user.clientId should be the client/company ID, not the user's own ID
                    if (user.clientId && typeof user.clientId === 'object') {
                        user.clientId = user.clientId.toString();
                    }
                    
                    console.log('✅ User ID (_id):', user._id);
                    console.log('✅ Client ID (clientId):', user.clientId);
                    console.log('✅ These should be DIFFERENT values!');
                }

                // ✅ Clear any existing data before storing new data
                console.log('🧹 Clearing existing data before login...');
                await AsyncStorage.clear();
                
                // Store fresh user data in AsyncStorage
                const jsonUser = JSON.stringify(user);
                console.log('💾 Storing fresh user data:', jsonUser);
                await AsyncStorage.setItem("user", jsonUser);

                // Also store userType separately for reference
                await AsyncStorage.setItem('userType', userType);
                
                console.log('✅ Fresh login data stored successfully');

                toast.success("User logged in successfully");

                // Show navigating state
                setIsNavigating(true);
                setLoading(false);

                // Trigger auth context to update
                await checkAuthStatus();

                // Navigate after a brief moment
                setTimeout(() => {
                    router.replace({
                        pathname: "/(tabs)",
                    });
                }, 300);
            } else {
                toast.error(result.error || "Invalid email or password");
                setLoading(false);
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error("Failed to login due to an unexpected error");
            setLoading(false);
        }
    };

    const handleForgetPassword = async () => {
        setLoading(true);
        try {
            console.log('\n🔐 FORGET PASSWORD FLOW STARTED');
            console.log('Email:', email);

            // First, find the user type
            console.log('Step 1: Finding user type...');
            const userTypeResult = await findUserType(email);

            console.log('User Type Result:', userTypeResult);

            if (!userTypeResult.success || !userTypeResult.userType) {
                console.log('❌ User not found');
                toast.error("User not found with this email");
                return;
            }

            console.log('✅ User found with type:', userTypeResult.userType);
            console.log('Step 2: Sending forget password request...');

            // Then send forget password request
            const result = await forgetPassword(email, userTypeResult.userType);

            console.log('Forget Password Result:', result);

            if (result.success) {
                console.log('✅ Password reset email sent successfully');
                toast.success(result.message || "Password reset link sent to your email");
                // Go back to email step
                setCurrentStep('email');
                setPassword('');
                setOtp('');
            } else {
                console.log('❌ Failed to send password reset email');
                toast.error(result.error || "Failed to send password reset email");
            }
        } catch (error) {
            console.error('❌ Forget password error:', error);
            toast.error("Failed to process forget password request");
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 'email':
                return (
                    <>
                        <Text style={styles.welcomeText}>Welcome To Exponentor</Text>
                        <Text style={styles.stepTitle}>Enter your email</Text>
                        <Text style={styles.stepDescription}>
                            thank you for giving us a chance to solve your problem
                        </Text>
                        <View style={styles.inputContainer}>
                            <MaterialIcons name="email" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email address"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                                onFocus={() => {
                                    setTimeout(() => {
                                        scrollViewRef.current?.scrollToEnd({ animated: true });
                                    }, 100);
                                }}
                            />
                        </View>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleGenerateOTP}
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
                                    <Text style={styles.buttonText}>Next</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </>
                );

            case 'otp':
                return (
                    <>
                        <Text style={styles.welcomeText}>Verification</Text>
                        <Text style={styles.stepTitle}>Enter OTP</Text>
                        <Text style={styles.stepDescription}>
                            Please enter the 6-digit code sent to {email}
                        </Text>
                        <View style={styles.inputContainer}>
                            <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="6-digit OTP"
                                value={otp}
                                onChangeText={setOtp}
                                keyboardType="number-pad"
                                maxLength={6}
                                onFocus={() => {
                                    setTimeout(() => {
                                        scrollViewRef.current?.scrollToEnd({ animated: true });
                                    }, 100);
                                }}
                            />
                        </View>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleVerifyOTP}
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
                                    <Text style={styles.buttonText}>Verify OTP</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => {
                                setOtp('');
                                setCurrentStep('email');
                            }}
                        >
                            <Text style={styles.secondaryButtonText}>Change Email</Text>
                        </TouchableOpacity>
                    </>
                );

            case 'password':
                return (
                    <>
                        <Text style={styles.welcomeText}>Almost Done</Text>
                        <Text style={styles.stepTitle}>{isVerified ? 'Enter' : 'Set'} Password</Text>

                        {/* Show email */}
                        <View style={styles.emailDisplayContainer}>
                            <MaterialIcons name="email" size={16} color="#666" />
                            <Text style={styles.emailDisplayText}>{email}</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setPassword('');
                                    setOtp('');
                                    setCurrentStep('email');
                                }}
                                style={styles.changeEmailButton}
                            >
                                <Text style={styles.changeEmailText}>Change</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.stepDescription}>
                            {isVerified 
                                ? 'Enter your password to continue' 
                                : 'Create a strong password: 8+ characters with uppercase, lowercase, number, and special character (@$!%*?&)'
                            }
                        </Text>

                        <View style={styles.inputContainer}>
                            <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                key={`password-${showPassword}`}
                                style={styles.input}
                                placeholder="Password (8+ chars, A-z, 0-9, @$!%*?&)"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                                textContentType="password"
                                onFocus={() => {
                                    setTimeout(() => {
                                        scrollViewRef.current?.scrollToEnd({ animated: true });
                                    }, 100);
                                }}
                            />
                            <TouchableOpacity
                                onPress={() => {
                                    const newValue = !showPassword;
                                    console.log('👁️ Toggle password - showPassword:', showPassword, '→', newValue);
                                    setShowPassword(newValue);
                                }}
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

                        {/* Forget Password - Only show when user is verified (login mode) */}
                        {isVerified && (
                            <TouchableOpacity
                                onPress={handleForgetPassword}
                                style={styles.forgetPasswordButton}
                                disabled={loading}
                            >
                                <Text style={styles.forgetPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.button}
                            onPress={!isVerified ? handleSetPassword : handleLogin}
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
                                    <Text style={styles.buttonText}>{isVerified ? 'Login' : 'Set Password'}</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </>
                );
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
                    ref={scrollViewRef}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.content}>
                        <View style={styles.formContainer}>
                            {renderStep()}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Navigating Overlay */}
            {isNavigating && (
                <View style={styles.navigatingOverlay}>
                    <View style={styles.navigatingContainer}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text style={styles.navigatingText}>Redirecting...</Text>
                    </View>
                </View>
            )}
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
        justifyContent: 'center',
    },
    content: {
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        marginBottom: 24,
    },
    logoBackground: {
        width: 72,
        height: 72,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    illustration: {
        width: 220,
        height: 180,
    },
    illustrationImage: {
        width: 220,
        height: 180,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 8,
        textTransform: 'uppercase',
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
        marginBottom: 16,
        textAlign: 'center',
    },
    stepTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    stepDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 24,
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
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    signupText: {
        color: '#666',
    },
    signupLink: {
        color: '#4f46e5',
        fontWeight: 'bold',
    },
    emailDisplayContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f9ff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    emailDisplayText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#1e40af',
        fontWeight: '500',
    },
    changeEmailButton: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: '#3b82f6',
        borderRadius: 6,
    },
    changeEmailText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    forgetPasswordButton: {
        alignSelf: 'flex-end',
        marginTop: -8,
        marginBottom: 8,
    },
    forgetPasswordText: {
        color: '#3b82f6',
        fontSize: 14,
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
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    navigatingText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
        color: '#3b82f6',
    },
});