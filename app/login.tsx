import Loading from '@/components/Loading';
import { addPassword, confirmMail, getUser, login, sendOtp } from '@/functions/password';
import { generateOTP } from '@/lib/functions';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Lottie from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

type Step = 'email' | 'otp' | 'password';

export default function LoginScreen() {
    const router = useRouter();

    const [mountLoading, setMountLoading] = useState<boolean>(true);
    const [currentStep, setCurrentStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [generatedOTP, setGeneratedOTP] = useState(1);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        const checkLogin = async () => {
            const res = await AsyncStorage.getItem("user")

            if (res) {
                router.replace({
                    pathname: "/(tabs)"
                })
            }
            setMountLoading(false);
        }
        checkLogin();
    }, [router])

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
            const check = await confirmMail(email, "client");

            console.log(check);

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
            } else {
                toast.error("invalid OTP")
            }
            setCurrentStep('password');
        } catch (error) {
            toast.error('Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleSetPassword = async () => {
        if (!password.trim() || password.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);
        try {

            const res = await addPassword(email, password, "client");
            if (res) {
                const user = await getUser(email, "client");
                console.log(user)
                const jsonUser = JSON.stringify(user.isUser);
                await AsyncStorage.setItem("user", jsonUser);
                toast.success('Password set successfully');
                router.replace({
                    pathname: "/(tabs)"
                });
            } else {
                toast.error("something went wrong, please try again later")
            }
        } catch (error) {
            toast.error('Failed to set password');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!password.trim() || password.length < 8) {
            toast.error("Password must be at least 8 characters long");
            return;
        }

        setLoading(true);

        try {
            const result = await login(email, password);

            if (result.success) {
                const user = await getUser(email, "client");
                const jsonUser = JSON.stringify(user.isUser);
                console.log(jsonUser);
                await AsyncStorage.setItem("user", jsonUser);
                toast.success("User logged in successfully");
                router.replace({
                    pathname: "/(tabs)",
                });
            } else {
                toast.error(result.error || "Invalid email or password");
            }
        } catch (error) {
            toast.error("Failed to login due to an unexpected error");
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
                        <Text style={styles.stepDescription}>
                            Create a strong password for your account
                        </Text>
                        <View style={styles.inputContainer}>
                            <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.visibilityIcon}>
                                <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#666" />
                            </TouchableOpacity>
                        </View>
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
                                    <Text style={styles.buttonText}>{isVerified ? 'Enter' : 'Set'}  Password</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </>
                );
        }
    };

    return (
        <SafeAreaView style={styles.container}>

            <ScrollView>
                <StatusBar style="dark" />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoidingView}
                >
                    <View style={styles.content}>
                        <View style={styles.header}>
                            {currentStep === 'email' ? (
                                <Lottie
                                    style={styles.illustration}
                                    source={require('@/assets/onBoarding/screen-3.json')}
                                    autoPlay
                                    loop
                                />
                            ) : (
                                <Image
                                    source={require('@/assets/images/house.png')}
                                    style={styles.illustrationImage}
                                    resizeMode="contain"
                                />
                            )}
                            <Text style={styles.headerTitle}>Exponentor</Text>
                        </View>
                        <View style={styles.formContainer}>
                            {renderStep()}
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </ScrollView>
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
    content: {
        flex: 1,
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
});