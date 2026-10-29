import Loading from '@/components/Loading';
import {
    AUTH_FORM_MAX_WIDTH,
    AUTH_GUTTER,
    AuthButton,
    AuthEmphasis,
    AuthHeading,
    BlueprintBackdrop,
    BrandMark,
    IOS_PASSWORD_RULES,
    isPasswordValid,
    PasswordChecklist,
    signalError,
    signalSuccess,
} from '@/components/auth/AuthUI';
import CustomTextInput from '@/components/common/CustomTextInput';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { addPassword, confirmMail, findUserType, forgetPassword, getUser, login, sendOtp } from '@/functions/login';
import { generateOTP } from '@/lib/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
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
    const [isVerified, setIsVerified] = useState(false);
    const [userType, setUserType] = useState('');
    const [isNavigating, setIsNavigating] = useState(false);

    // Inline feedback, shown under the field it's about
    const [emailError, setEmailError] = useState('');
    const [otpError, setOtpError] = useState('');
    const [otpNotice, setOtpNotice] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [showPasswordRules, setShowPasswordRules] = useState(false);
    const [resending, setResending] = useState(false);
    const [sendingReset, setSendingReset] = useState(false);
    // Set after Forgot Password, so the code and password steps say "reset"
    const [isPasswordReset, setIsPasswordReset] = useState(false);

    const goToEmailStep = () => {
        setPassword('');
        setOtp('');
        setOtpError('');
        setOtpNotice('');
        setPasswordError('');
        setShowPasswordRules(false);
        setIsVerified(false);
        setIsPasswordReset(false);
        setCurrentStep('email');
    };

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

    // Android's back button steps back through the flow instead of leaving it
    useEffect(() => {
        if (currentStep === 'email') return;
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            goToEmailStep();
            return true;
        });
        return () => subscription.remove();
    }, [currentStep]);

    if (mountLoading) {
        return <Loading />
    }

    const flagError = (setError: (message: string) => void, message: string) => {
        setError(message);
        signalError(message);
    };

    // Keeps the field and its button above the keyboard
    const scrollToForm = () => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const handleGenerateOTP = async () => {
        if (!email.trim() || !email.includes('@')) {
            flagError(setEmailError, 'Enter a valid email address, like name@company.com.');
            return;
        }

        setLoading(true);
        try {
            const check = await confirmMail(email);

            console.log(check);
            console.log(check.userType)

            // ✅ FIX: Check if user exists in database first
            if (!check.isUser) {
                flagError(setEmailError, 'No account found with this email. Check it for typos.');
                return;
            }

            setUserType(check.userType)
            if (!check.verified) {
                // User exists but not verified - send OTP for password setup
                const OTP = generateOTP();
                setGeneratedOTP(OTP);
                const sendMail = await sendOtp(email, OTP);
                if (sendMail) {
                    setCurrentStep('otp');
                } else {
                    toast.error("Couldn't send the code. Try again.")
                }
            } else {
                // User exists and is verified - go to password login
                setIsVerified(true);
                setCurrentStep('password')
            }
        } catch (error) {
            toast.error("Couldn't check this email. Try again.");
            console.log(error)
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setResending(true);
        try {
            const OTP = generateOTP();
            const sendMail = await sendOtp(email, OTP);
            if (sendMail) {
                // Only replace the code once the new email is out, so a failed resend
                // leaves the earlier code working
                setGeneratedOTP(OTP);
                setOtp('');
                setOtpError('');
                setOtpNotice('New code sent. Earlier codes no longer work.');
                signalSuccess('New code sent');
            } else {
                toast.error("Couldn't send the code. Try again.");
            }
        } finally {
            setResending(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp.trim() || otp.length !== 6) {
            flagError(setOtpError, 'Enter the 6-digit code from the email.');
            return;
        }

        setLoading(true);
        try {
            if (Number(otp) === generatedOTP) {
                signalSuccess();
                setOtpNotice('');
                // ✅ Only proceed to password step if OTP is correct
                setCurrentStep('password');
            } else {
                flagError(setOtpError, "That code doesn't match. Check the latest email or resend the code.");
                // ✅ Stay on OTP step if OTP is wrong
                // Don't change the step, let user try again
            }
        } catch (error) {
            flagError(setOtpError, "That code doesn't match. Check the latest email or resend the code.");
            // ✅ Stay on OTP step if there's an error
        } finally {
            setLoading(false);
        }
    };

    const handleSetPassword = async () => {
        // ✅ Enhanced password validation to match backend requirements
        if (!password.trim()) {
            flagError(setPasswordError, 'Enter a password.');
            return;
        }

        // Length, upper and lowercase, number, symbol, and no characters the API rejects
        if (!isPasswordValid(password)) {
            setShowPasswordRules(true);
            flagError(setPasswordError, 'Choose a password that meets every requirement below.');
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

                    // ✅ ADD userType to user object for tab navigation
                    user.userType = userType;

                    console.log('✅ User ID (_id):', user._id);
                    console.log('✅ Client ID (clientId):', user.clientId);
                    console.log('✅ User Type:', user.userType);
                    console.log('✅ These should be DIFFERENT values!');
                }

                // ✅ PRODUCTION FIX: Store JWT token from password API response
                if (res.token) {
                    console.log('🔐 Storing JWT token from password API');
                    await AsyncStorage.setItem('auth_token', res.token);
                    console.log('✅ JWT token stored successfully');
                } else {
                    console.warn('⚠️ No JWT token received from password API');
                }

                // ✅ Clear any existing data before storing new data
                console.log('🧹 Clearing existing data before login...');
                try {
                    // Remove specific keys instead of clearing everything
                    await AsyncStorage.multiRemove(['user', 'userType', 'token', 'refreshToken', 'loginTimestamp']);
                    console.log('✅ Cleared existing auth data');
                } catch (clearError) {
                    console.warn('⚠️ Error clearing storage (non-critical):', clearError);
                    // Continue anyway - this is not critical
                }

                // PRODUCTION FIX: Add login timestamp for validation
                await AsyncStorage.setItem('loginTimestamp', Date.now().toString());

                // Store fresh user data in AsyncStorage
                const jsonUser = JSON.stringify(user);
                console.log('💾 Storing fresh user data:', jsonUser);
                await AsyncStorage.setItem('user', jsonUser);

                // Also store userType separately for reference
                await AsyncStorage.setItem('userType', userType);

                // Re-store the JWT token after clearing (important!)
                if (res.token) {
                    console.log('🔐 Re-storing JWT token after clear...');
                    await AsyncStorage.setItem('auth_token', res.token);
                    console.log('✅ JWT token re-stored successfully');

                    // DEBUG: Verify token was actually stored
                    const verifyToken = await AsyncStorage.getItem('auth_token');
                    if (verifyToken) {
                        console.log('✅ VERIFIED: JWT token is in storage');
                        console.log('📊 Token length:', verifyToken.length);
                        console.log('📊 Token preview:', verifyToken.substring(0, 50) + '...');
                    } else {
                        console.error('❌ CRITICAL: JWT token NOT found after storage!');
                    }
                } else {
                    console.error('❌ CRITICAL: No JWT token to re-store!');
                }

                console.log('✅ Fresh login data stored successfully');

                toast.success('Password saved');

                // Show navigating state
                setIsNavigating(true);

                // Trigger auth context to update
                await checkAuthStatus();

                // Notifications will be initialized automatically by AuthContext

                // Let the AuthContext and _layout handle navigation automatically
                // Don't manually navigate - the layout will detect auth change and redirect
                setLoading(false);
                setIsNavigating(false);
            } else {
                console.error('❌ Password setup failed:', res.error);
                toast.error(res.error || "Couldn't save your password. Try again.");
                setLoading(false);
            }
        } catch (error) {
            console.error('Password setup error:', error);
            toast.error("Couldn't save your password. Try again.");
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!password.trim()) {
            flagError(setPasswordError, 'Enter your password.');
            return;
        }

        if (password.length < 8) {
            flagError(setPasswordError, 'That password is too short. Passwords have at least 8 characters.');
            return;
        }

        setLoading(true);

        try {
            const result = await login(email, password);
            console.log('Login result:', result);
            console.log('🔍 DETAILED LOGIN RESULT:');
            console.log('  - Success:', result.success);
            console.log('  - Token exists:', !!result.token);
            console.log('  - Token type:', typeof result.token);
            console.log('  - Token length:', result.token ? result.token.length : 0);
            console.log('  - Token preview:', result.token ? result.token.substring(0, 50) + '...' : 'NO TOKEN');
            console.log('  - User exists:', !!result.user);

            if (result.success) {
                // ✅ PRODUCTION FIX: Store JWT token from login API response
                if (result.token) {
                    console.log('🔐 Storing JWT token from login API');
                    await AsyncStorage.setItem('auth_token', result.token);
                    console.log('✅ JWT token stored successfully');
                } else {
                    console.warn('⚠️ No JWT token received from login API');
                    console.warn('🔍 Full result object:', JSON.stringify(result, null, 2));
                }

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

                    // ✅ ADD userType to user object for tab navigation
                    user.userType = userType;

                    console.log('✅ User ID (_id):', user._id);
                    console.log('✅ Client ID (clientId):', user.clientId);
                    console.log('✅ User Type:', user.userType);
                    console.log('✅ These should be DIFFERENT values!');
                }

                // ✅ Clear any existing data before storing new data
                console.log('🧹 Clearing existing data before login...');
                try {
                    // Remove specific keys instead of clearing everything
                    await AsyncStorage.multiRemove(['user', 'userType', 'token', 'refreshToken', 'loginTimestamp']);
                    console.log('✅ Cleared existing auth data');
                } catch (clearError) {
                    console.warn('⚠️ Error clearing storage (non-critical):', clearError);
                    // Continue anyway - this is not critical
                }

                // PRODUCTION FIX: Add login timestamp for validation
                await AsyncStorage.setItem('loginTimestamp', Date.now().toString());

                // Store fresh user data in AsyncStorage
                const jsonUser = JSON.stringify(user);
                console.log('💾 Storing fresh user data:', jsonUser);
                await AsyncStorage.setItem("user", jsonUser);

                // Also store userType separately for reference
                await AsyncStorage.setItem('userType', userType);

                // Re-store the JWT token after clearing (important!)
                if (result.token) {
                    console.log('🔐 Re-storing JWT token after clear...');
                    await AsyncStorage.setItem('auth_token', result.token);
                    console.log('✅ JWT token re-stored successfully');

                    // DEBUG: Verify token was actually stored
                    const verifyToken = await AsyncStorage.getItem('auth_token');
                    if (verifyToken) {
                        console.log('✅ VERIFIED: JWT token is in storage');
                        console.log('📊 Token length:', verifyToken.length);
                        console.log('📊 Token preview:', verifyToken.substring(0, 50) + '...');
                    } else {
                        console.error('❌ CRITICAL: JWT token NOT found after storage!');
                    }
                } else {
                    console.error('❌ CRITICAL: No JWT token to re-store!');
                }

                console.log('✅ Fresh login data stored successfully');

                // Show navigating state
                setIsNavigating(true);

                // Trigger auth context to update
                await checkAuthStatus();

                // Notifications will be initialized automatically by AuthContext

                // Let the AuthContext and _layout handle navigation automatically
                // Don't manually navigate - the layout will detect auth change and redirect
                setLoading(false);
                setIsNavigating(false);
            } else {
                // A wrong password belongs next to the field; account problems stay in a toast
                const message = result.error || '';
                if (!message || /invalid credentials|invalid email or password/i.test(message)) {
                    flagError(setPasswordError, 'Incorrect password. Try again or reset it.');
                } else {
                    toast.error(message);
                }
                setLoading(false);
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error("Couldn't log in. Check your connection and try again.");
            setLoading(false);
        }
    };

    const handleForgetPassword = async () => {
        setSendingReset(true);
        try {
            console.log('\n🔐 FORGET PASSWORD FLOW STARTED');
            console.log('Email:', email);

            // First, find the user type
            console.log('Step 1: Finding user type...');
            const userTypeResult = await findUserType(email);

            console.log('User Type Result:', userTypeResult);

            if (!userTypeResult.success || !userTypeResult.userType) {
                console.log('❌ User not found');
                toast.error("No account found with this email.");
                return;
            }

            console.log('✅ User found with type:', userTypeResult.userType);
            setUserType(userTypeResult.userType);

            console.log('Step 2: Sending forget password request...');

            // Then send forget password request
            const result = await forgetPassword(email, userTypeResult.userType);

            console.log('Forget Password Result:', result);

            if (result.success) {
                console.log('✅ Password reset successful');

                // Generate and send OTP for verification
                const OTP = generateOTP();
                setGeneratedOTP(OTP);
                const sendMail = await sendOtp(email, OTP);

                // The old password no longer works, so move on to the code step either
                // way; if the email failed, Resend Code can try again from there
                // Set isVerified to false so user goes through password setup flow
                setIsVerified(false);
                setIsPasswordReset(true);
                // Go to OTP step
                setCurrentStep('otp');
                setPassword('');
                setOtp('');
                setPasswordError('');
                setOtpNotice('');
                setOtpError(sendMail ? '' : "Couldn't send the code. Tap Resend Code to try again.");
            } else {
                console.log('❌ Failed to reset password');
                toast.error(result.error || "Couldn't reset your password. Try again.");
            }
        } catch (error) {
            console.error('❌ Forget password error:', error);
            toast.error("Couldn't reset your password. Try again.");
        } finally {
            setSendingReset(false);
        }
    };

    // Resetting clears the current password on the server right away, so confirm first
    const confirmForgetPassword = () => {
        if (Platform.OS === 'web') {
            handleForgetPassword();
            return;
        }
        Alert.alert(
            'Reset Password?',
            `Your current password will stop working. A 6-digit code will be sent to ${email} so you can create a new one.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset Password', style: 'destructive', onPress: handleForgetPassword },
            ]
        );
    };

    const renderStep = () => {
        switch (currentStep) {
            case 'email':
                return (
                    <>
                        <AuthHeading title="Log In">
                            Track materials, labor, and payments across every site.
                        </AuthHeading>
                        <CustomTextInput
                            label="Email"
                            placeholder="name@company.com"
                            value={email}
                            onChangeText={(text) => {
                                // Emails are stored lowercase and looked up exactly, so drop spaces and
                                // capitals that autofill or the keyboard add ("Name@..." would 404)
                                setEmail(text.replace(/\s/g, '').toLowerCase());
                                setEmailError('');
                            }}
                            error={emailError}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="email"
                            textContentType="username"
                            returnKeyType="next"
                            onSubmitEditing={loading ? undefined : handleGenerateOTP}
                            onFocus={scrollToForm}
                        />
                        <AuthButton
                            title="Continue"
                            loadingTitle="Checking…"
                            loading={loading}
                            onPress={handleGenerateOTP}
                        />
                    </>
                );

            case 'otp':
                return (
                    <>
                        <AuthHeading title="Check Your Email">
                            {isPasswordReset
                                ? 'To reset your password, enter the 6-digit code sent to '
                                : 'Enter the 6-digit code sent to '}
                            <AuthEmphasis>{email}</AuthEmphasis>.
                        </AuthHeading>
                        <CustomTextInput
                            label="Verification Code"
                            value={otp}
                            onChangeText={(text) => {
                                setOtp(text.replace(/\D/g, ''));
                                setOtpError('');
                            }}
                            error={otpError}
                            hint={otpNotice}
                            keyboardType="number-pad"
                            maxLength={6}
                            autoComplete={Platform.OS === 'android' ? 'email-otp' : 'one-time-code'}
                            textContentType="oneTimeCode"
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={loading ? undefined : handleVerifyOTP}
                            inputStyle={styles.codeInput}
                            onFocus={scrollToForm}
                        />
                        <AuthButton
                            title="Verify"
                            loadingTitle="Verifying…"
                            loading={loading}
                            onPress={handleVerifyOTP}
                        />
                        <View style={styles.secondaryActions}>
                            <AuthButton
                                variant="plain"
                                title="Resend Code"
                                loadingTitle="Sending…"
                                loading={resending}
                                onPress={handleResendOTP}
                            />
                            <AuthButton variant="plain" title="Change Email" onPress={goToEmailStep} />
                        </View>
                    </>
                );

            case 'password':
                return (
                    <>
                        <AuthHeading
                            title={isVerified ? 'Enter Password' : isPasswordReset ? 'Create New Password' : 'Create Password'}
                        >
                            {isVerified
                                ? 'Logging in as '
                                : isPasswordReset
                                    ? 'Choose a new password for '
                                    : 'Set a password for '}
                            <AuthEmphasis>{email}</AuthEmphasis>
                            {isVerified || isPasswordReset ? '.' : ' to finish setting up your account.'}
                        </AuthHeading>

                        <CustomTextInput
                            label="Password"
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                setPasswordError('');
                            }}
                            error={passwordError}
                            isPassword={true}
                            showPasswordToggle={true}
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete={isVerified ? 'current-password' : 'new-password'}
                            textContentType={isVerified ? 'password' : 'newPassword'}
                            passwordRules={isVerified ? undefined : IOS_PASSWORD_RULES}
                            autoFocus
                            returnKeyType="go"
                            onSubmitEditing={loading ? undefined : (isVerified ? handleLogin : handleSetPassword)}
                            onFocus={scrollToForm}
                        />

                        {/* Existing accounts can reset; new passwords get live requirements */}
                        {isVerified ? (
                            <AuthButton
                                variant="plain"
                                title="Forgot Password?"
                                loadingTitle="Sending code…"
                                loading={sendingReset}
                                disabled={loading}
                                onPress={confirmForgetPassword}
                                style={styles.forgotPassword}
                            />
                        ) : (
                            <PasswordChecklist password={password} showErrors={showPasswordRules} />
                        )}

                        <AuthButton
                            title={isVerified ? 'Log In' : 'Set Password'}
                            loadingTitle={isVerified ? 'Logging in…' : 'Saving…'}
                            loading={loading}
                            disabled={sendingReset}
                            onPress={!isVerified ? handleSetPassword : handleLogin}
                        />
                        <AuthButton variant="plain" title="Change Email" onPress={goToEmailStep} />
                    </>
                );
        }
    };

    return (
        <View style={styles.screen}>
            <StatusBar style="dark" />
            <BlueprintBackdrop />
            <SafeAreaView style={styles.safeArea}>
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
                            <BrandMark />
                            {/* Each step fades in; forward steps also slide from the trailing side */}
                            <Animated.View
                                key={currentStep}
                                entering={currentStep === 'email' ? FadeIn.duration(200) : FadeInRight.duration(240)}
                                style={styles.form}
                            >
                                {renderStep()}
                            </Animated.View>
                        </View>

                        {/* Registration Link */}
                        {currentStep === 'email' && (
                            <View style={styles.footer}>
                                <Text style={styles.footerText}>New staff member?</Text>
                                <AuthButton
                                    variant="plain"
                                    title="Create Account"
                                    onPress={() => {
                                        console.log('Register button pressed');
                                        router.push('/register');
                                    }}
                                    style={styles.footerLink}
                                />
                            </View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

            {/* Navigating Overlay */}
            {isNavigating && (
                <View
                    style={styles.navigatingOverlay}
                    accessible
                    accessibilityViewIsModal
                    accessibilityRole="progressbar"
                    accessibilityLabel="Logging in"
                >
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.navigatingText}>Logging in…</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    safeArea: {
        flex: 1,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'space-between',
        paddingHorizontal: AUTH_GUTTER,
        paddingTop: 16,
        paddingBottom: 12,
    },
    content: {
        width: '100%',
        maxWidth: AUTH_FORM_MAX_WIDTH,
        alignSelf: 'center',
    },
    form: {
        gap: 20,
        marginTop: 40,
    },
    codeInput: {
        fontSize: 24,
        fontWeight: '600',
        letterSpacing: 6,
        fontVariant: ['tabular-nums'],
    },
    secondaryActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: -8,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: -12,
        marginRight: -12,
    },
    footer: {
        width: '100%',
        maxWidth: AUTH_FORM_MAX_WIDTH,
        alignSelf: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
        paddingTop: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
    },
    footerText: {
        fontSize: 15,
        color: Colors.textSecondary,
    },
    footerLink: {
        paddingHorizontal: 8,
    },
    navigatingOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: `${Colors.background}F0`,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        zIndex: 1000,
    },
    navigatingText: {
        fontSize: 17,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
});
