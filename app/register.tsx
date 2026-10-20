import {
    AUTH_FORM_MAX_WIDTH,
    AUTH_GUTTER,
    AuthButton,
    AuthHeading,
    BlueprintBackdrop,
    IOS_PASSWORD_RULES,
    isPasswordValid,
    PasswordChecklist,
    signalError,
    signalSuccess,
} from '@/components/auth/AuthUI';
import CustomTextInput from '@/components/common/CustomTextInput';
import { Colors, Radius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { generateOTP } from '@/lib/functions';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '@/utils/axiosConfig';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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

// Top-to-bottom order of the form, used to focus the first field that needs attention
const FIELD_ORDER = ['firstName', 'lastName', 'email', 'phoneNumber', 'password', 'confirmPassword'] as const;
type Field = typeof FIELD_ORDER[number];
type FieldErrors = Partial<Record<Field, string>>;

export default function RegisterScreen() {
    const router = useRouter();
    const { checkAuthStatus } = useAuth();
    const insets = useSafeAreaInsets();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    // Email verification states
    const [emailVerified, setEmailVerified] = useState(false);
    const [otp, setOtp] = useState('');
    const [generatedOTP, setGeneratedOTP] = useState(0);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);

    // Inline feedback, shown under the field it's about
    const [errors, setErrors] = useState<FieldErrors>({});
    const [codeError, setCodeError] = useState('');
    const [codeNotice, setCodeNotice] = useState('');
    const [showPasswordRules, setShowPasswordRules] = useState(false);

    // Top bar gets a separator once content scrolls under it, and a title once the large one is gone
    const [isScrolled, setIsScrolled] = useState(false);
    const [showBarTitle, setShowBarTitle] = useState(false);

    const firstNameRef = useRef<TextInput>(null);
    const lastNameRef = useRef<TextInput>(null);
    const emailRef = useRef<TextInput>(null);
    const phoneNumberRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);
    const confirmPasswordRef = useRef<TextInput>(null);
    const fieldRefs: Record<Field, React.RefObject<TextInput | null>> = {
        firstName: firstNameRef,
        lastName: lastNameRef,
        email: emailRef,
        phoneNumber: phoneNumberRef,
        password: passwordRef,
        confirmPassword: confirmPasswordRef,
    };

    // Default role for all new staff
    const role: Role = 'site-engineer';

    const clearError = (field: Field) => {
        setErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev));
    };

    // Shown live once the confirmation is as long as the password
    const confirmMismatch = confirmPassword.length > 0
        && confirmPassword.length >= password.length
        && confirmPassword !== password;

    const goBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/login');
        }
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const y = event.nativeEvent.contentOffset.y;
        setIsScrolled(y > 4);
        setShowBarTitle(y > 48);
    };

    const resetVerification = () => {
        setEmailVerified(false);
        setShowOtpInput(false);
        setOtp('');
        setGeneratedOTP(0);
        setCodeError('');
        setCodeNotice('');
    };

    const handleEmailChange = (text: string) => {
        // Email addresses never contain spaces; drop any that autofill adds
        setEmail(text.replace(/\s/g, ''));
        clearError('email');
        // Any edit invalidates a verified address or a code that's already out,
        // so a code sent to one address can't verify another
        if (emailVerified || showOtpInput) {
            resetVerification();
        }
    };

    // Unlocks a verified address for editing; it has to be verified again
    const handleChangeEmail = () => {
        resetVerification();
        setTimeout(() => emailRef.current?.focus(), 50);
    };

    const handleSendOtp = async () => {
        // Validate email first
        if (!email.trim() || !email.includes('@')) {
            const message = 'Enter a valid email address, like name@company.com.';
            setErrors(prev => ({ ...prev, email: message }));
            signalError(message);
            return;
        }

        setSendingOtp(true);

        try {
            console.log('📧 Sending OTP to:', email);

            // Generate OTP
            const OTP = generateOTP();

            // Send OTP via API
            const response = await apiClient.post<OTPResponse>(`/api/otp`, {
                email: email.trim().toLowerCase(),
                OTP: OTP,
            });

            if (response.status === 200) {
                // Only replace the code once the new email is out, so a failed resend
                // leaves the earlier code working
                setGeneratedOTP(OTP);
                setOtp('');
                setCodeError('');
                setCodeNotice(showOtpInput ? 'New code sent. Earlier codes no longer work.' : '');
                setShowOtpInput(true);
                signalSuccess(showOtpInput ? 'New code sent' : 'Code sent');
            } else {
                toast.error("Couldn't send the code. Try again.");
            }
        } catch (error: any) {
            console.error('❌ Error sending OTP:', error);
            if (error?.response || error?.request) {
                toast.error("Couldn't send the code. Check your connection and try again.");
            } else {
                toast.error('Something went wrong. Try again.');
            }
        } finally {
            setSendingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp.trim() || otp.length !== 6) {
            setCodeError('Enter the 6-digit code from the email.');
            signalError('Enter the 6-digit code from the email.');
            return;
        }

        if (generatedOTP !== 0 && Number(otp) === generatedOTP) {
            signalSuccess('Email verified');
            setEmailVerified(true);
            setShowOtpInput(false);
            setCodeNotice('');
            clearError('email');
        } else {
            setCodeError("That code doesn't match. Check the latest email or resend the code.");
            signalError("That code doesn't match. Check the latest email or resend the code.");
        }
    };

    const handleRegister = async () => {
        // Validation: collect every problem at once so the form can be fixed in one pass
        const nextErrors: FieldErrors = {};

        if (!firstName.trim()) {
            nextErrors.firstName = 'Enter your first name.';
        }

        if (!lastName.trim()) {
            nextErrors.lastName = 'Enter your last name.';
        }

        if (!email.trim() || !email.includes('@')) {
            nextErrors.email = 'Enter a valid email address, like name@company.com.';
        } else if (!emailVerified) {
            // Check if email is verified
            nextErrors.email = 'Verify your email to continue.';
        }

        if (!phoneNumber.trim() || phoneNumber.length < 10) {
            nextErrors.phoneNumber = 'Enter a phone number with at least 10 digits.';
        }

        // Password validation, matching the API's rules
        if (!password.trim()) {
            nextErrors.password = 'Choose a password.';
        } else if (!isPasswordValid(password)) {
            nextErrors.password = 'Choose a password that meets every requirement below.';
        }

        // Confirm password validation
        if (!confirmPassword.trim()) {
            nextErrors.confirmPassword = 'Enter your password again.';
        } else if (password !== confirmPassword) {
            nextErrors.confirmPassword = "Passwords don't match.";
        }

        const firstInvalid = FIELD_ORDER.find(field => nextErrors[field]);
        if (firstInvalid) {
            setErrors(nextErrors);
            if (nextErrors.password) setShowPasswordRules(true);
            signalError(nextErrors[firstInvalid] as string);
            // A verified email is locked, so there's nothing to focus there
            if (!(firstInvalid === 'email' && emailVerified)) {
                fieldRefs[firstInvalid].current?.focus();
            }
            return;
        }

        setErrors({});
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
                toast.success('Account created');

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
                const errorMessage = error.response.data?.error || error.response.data?.message || "Couldn't create your account. Try again.";
                toast.error(errorMessage);
                console.error('Error response:', error.response.data);
            } else if (error?.request) {
                toast.error("Couldn't create your account. Check your connection and try again.");
            } else {
                toast.error('Something went wrong. Try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.screen}>
            <StatusBar style="dark" />
            <BlueprintBackdrop />
            <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
                {/* Top bar: stays put while the form scrolls, and reaches under the status bar
                    so its background covers the grid there too once content scrolls beneath it */}
                <View style={[styles.topBar, { paddingTop: insets.top }, isScrolled && styles.topBarScrolled]}>
                    <View style={styles.topBarRow}>
                        <Pressable
                            onPress={goBack}
                            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
                            accessibilityRole="button"
                            accessibilityLabel="Back to Log In"
                        >
                            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
                        </Pressable>
                        {showBarTitle && (
                            <View style={styles.topBarTitleWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                                <Text style={styles.topBarTitle} numberOfLines={1}>Create Staff Account</Text>
                            </View>
                        )}
                    </View>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoidingView}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    >
                        <View style={styles.content}>
                            <AuthHeading title="Create Staff Account">
                                Sign up, then show your staff QR code to your administrator so they can add you to their team.
                            </AuthHeading>

                            {/* Name */}
                            <View style={styles.group}>
                                <CustomTextInput
                                    ref={firstNameRef}
                                    label="First Name"
                                    value={firstName}
                                    onChangeText={(text) => {
                                        setFirstName(text);
                                        clearError('firstName');
                                    }}
                                    error={errors.firstName}
                                    autoCapitalize="words"
                                    autoComplete="given-name"
                                    textContentType="givenName"
                                    returnKeyType="next"
                                    onSubmitEditing={() => lastNameRef.current?.focus()}
                                />
                                <CustomTextInput
                                    ref={lastNameRef}
                                    label="Last Name"
                                    value={lastName}
                                    onChangeText={(text) => {
                                        setLastName(text);
                                        clearError('lastName');
                                    }}
                                    error={errors.lastName}
                                    autoCapitalize="words"
                                    autoComplete="family-name"
                                    textContentType="familyName"
                                    returnKeyType="next"
                                    onSubmitEditing={() => (emailVerified ? phoneNumberRef : emailRef).current?.focus()}
                                />
                            </View>

                            {/* Contact: the email is verified with a code before the account is created */}
                            <View style={styles.group}>
                                <View style={styles.fieldStack}>
                                    <CustomTextInput
                                        ref={emailRef}
                                        label="Email"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChangeText={handleEmailChange}
                                        error={errors.email}
                                        hint={!emailVerified && !showOtpInput ? "You'll get a 6-digit code to verify this address." : undefined}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        autoComplete="email"
                                        textContentType="emailAddress"
                                        editable={!emailVerified}
                                        returnKeyType="next"
                                        onSubmitEditing={showOtpInput || sendingOtp ? undefined : handleSendOtp}
                                    />

                                    {emailVerified ? (
                                        <View style={styles.verifiedRow}>
                                            <Ionicons name="checkmark-circle" size={20} color={Colors.successText} />
                                            <Text style={styles.verifiedText}>Email verified</Text>
                                            <AuthButton
                                                variant="plain"
                                                title="Change"
                                                accessibilityLabel="Change email"
                                                onPress={handleChangeEmail}
                                                style={styles.verifiedChange}
                                            />
                                        </View>
                                    ) : showOtpInput ? (
                                        <Animated.View entering={FadeIn.duration(200)} style={styles.codePanel}>
                                            <CustomTextInput
                                                label="Verification Code"
                                                value={otp}
                                                onChangeText={(text) => {
                                                    setOtp(text.replace(/\D/g, ''));
                                                    setCodeError('');
                                                }}
                                                error={codeError}
                                                hint={codeNotice || `Sent to ${email}.`}
                                                keyboardType="number-pad"
                                                maxLength={6}
                                                autoComplete={Platform.OS === 'android' ? 'email-otp' : 'one-time-code'}
                                                textContentType="oneTimeCode"
                                                autoFocus
                                                returnKeyType="done"
                                                onSubmitEditing={handleVerifyOtp}
                                                inputStyle={styles.codeInput}
                                            />
                                            <View style={styles.codeActions}>
                                                <AuthButton
                                                    variant="tinted"
                                                    title="Verify Email"
                                                    onPress={handleVerifyOtp}
                                                    style={styles.codeVerify}
                                                />
                                                <AuthButton
                                                    variant="plain"
                                                    title="Resend Code"
                                                    loadingTitle="Sending…"
                                                    loading={sendingOtp}
                                                    onPress={handleSendOtp}
                                                />
                                            </View>
                                        </Animated.View>
                                    ) : (
                                        <AuthButton
                                            variant="tinted"
                                            title="Send Code"
                                            loadingTitle="Sending code…"
                                            loading={sendingOtp}
                                            disabled={!email.trim()}
                                            onPress={handleSendOtp}
                                        />
                                    )}
                                </View>

                                <CustomTextInput
                                    ref={phoneNumberRef}
                                    label="Phone Number"
                                    value={phoneNumber}
                                    onChangeText={(text) => {
                                        setPhoneNumber(text);
                                        clearError('phoneNumber');
                                    }}
                                    error={errors.phoneNumber}
                                    keyboardType="phone-pad"
                                    maxLength={15}
                                    autoComplete="tel"
                                    textContentType="telephoneNumber"
                                    returnKeyType="next"
                                    onSubmitEditing={() => passwordRef.current?.focus()}
                                />
                            </View>

                            {/* Password */}
                            <View style={styles.group}>
                                <View style={styles.fieldStack}>
                                    <CustomTextInput
                                        ref={passwordRef}
                                        label="Password"
                                        value={password}
                                        onChangeText={(text) => {
                                            setPassword(text);
                                            clearError('password');
                                        }}
                                        error={errors.password}
                                        isPassword={true}
                                        showPasswordToggle={true}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        autoComplete="new-password"
                                        textContentType="newPassword"
                                        passwordRules={IOS_PASSWORD_RULES}
                                        returnKeyType="next"
                                        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                                    />
                                    <PasswordChecklist password={password} showErrors={showPasswordRules} />
                                </View>

                                <CustomTextInput
                                    ref={confirmPasswordRef}
                                    label="Confirm Password"
                                    value={confirmPassword}
                                    onChangeText={(text) => {
                                        setConfirmPassword(text);
                                        clearError('confirmPassword');
                                    }}
                                    error={errors.confirmPassword ?? (confirmMismatch ? "Passwords don't match." : undefined)}
                                    isPassword={true}
                                    showPasswordToggle={true}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="new-password"
                                    textContentType="newPassword"
                                    passwordRules={IOS_PASSWORD_RULES}
                                    returnKeyType="done"
                                    onSubmitEditing={loading ? undefined : handleRegister}
                                />
                            </View>

                            <AuthButton
                                title="Create Account"
                                loadingTitle="Creating account…"
                                loading={loading}
                                onPress={handleRegister}
                            />
                        </View>

                        {/* Back to Login */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account?</Text>
                            <AuthButton variant="plain" title="Log In" onPress={goBack} style={styles.footerLink} />
                        </View>
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
                    accessibilityLabel="Setting up your account"
                >
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.navigatingText}>Setting up your account…</Text>
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
    topBar: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'transparent',
    },
    topBarScrolled: {
        backgroundColor: Colors.background,
        borderBottomColor: Colors.border,
    },
    topBarRow: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: AUTH_GUTTER,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    backButtonPressed: {
        backgroundColor: Colors.fill,
    },
    topBarTitleWrap: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 72,
        pointerEvents: 'none',
    },
    topBarTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'space-between',
        paddingHorizontal: AUTH_GUTTER,
        paddingTop: 8,
        paddingBottom: 12,
    },
    content: {
        width: '100%',
        maxWidth: AUTH_FORM_MAX_WIDTH,
        alignSelf: 'center',
        gap: 28,
    },
    group: {
        gap: 16,
    },
    fieldStack: {
        gap: 12,
    },
    verifiedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    verifiedText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: Colors.successText,
    },
    verifiedChange: {
        marginRight: -12,
    },
    codePanel: {
        gap: 12,
        padding: 16,
        borderRadius: Radius.lg,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    codeInput: {
        fontSize: 24,
        fontWeight: '600',
        letterSpacing: 6,
        fontVariant: ['tabular-nums'],
    },
    codeActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
    },
    codeVerify: {
        flexGrow: 1,
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
