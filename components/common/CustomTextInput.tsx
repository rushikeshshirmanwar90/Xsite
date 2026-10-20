import React, { useId, useState } from 'react';
import {
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/theme';

// One step stronger than Colors.border so empty fields stay visible outdoors in bright light
const FIELD_BORDER = '#CBD5E1';

interface CustomTextInputProps extends TextInputProps {
    ref?: React.Ref<TextInput>;
    label?: string;
    hint?: string;
    error?: string;
    icon?: keyof typeof MaterialIcons.glyphMap;
    iconColor?: string;
    containerStyle?: ViewStyle;
    inputStyle?: TextStyle;
    rightElement?: React.ReactNode;
    showPasswordToggle?: boolean;
    isPassword?: boolean;
}

const CustomTextInput = ({
    ref,
    label,
    hint,
    error,
    icon,
    iconColor = Colors.textSecondary,
    containerStyle,
    inputStyle,
    rightElement,
    placeholder,
    placeholderTextColor,
    showPasswordToggle = false,
    isPassword = false,
    secureTextEntry,
    onFocus,
    onBlur,
    ...props
}: CustomTextInputProps) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const labelId = useId();

    // Determine if this is a password field
    const isPasswordField = isPassword || showPasswordToggle || !!secureTextEntry;
    const isEditable = props.editable !== false;
    const message = error || hint;

    // Screen readers name the field after its visible label. Android links the two
    // natively; iOS also reads the hint or error after the label.
    const accessibilityProps = Platform.OS === 'android'
        ? (label ? { accessibilityLabelledBy: labelId } : {})
        : { accessibilityLabel: label, accessibilityHint: message };

    // Enhanced placeholder color logic for better visibility
    const getPlaceholderColor = () => {
        if (placeholderTextColor) return placeholderTextColor;

        // Platform-specific defaults with better contrast
        if (Platform.OS === 'ios') {
            return '#8E8E93'; // iOS system placeholder color
        } else {
            return '#6B7280'; // Darker gray for Android
        }
    };

    return (
        <View>
            {label && (
                <Text nativeID={labelId} style={styles.label}>{label}</Text>
            )}
            <View style={[
                styles.container,
                !isEditable && styles.containerReadOnly,
                isFocused && styles.containerFocused,
                !!error && styles.containerError,
                containerStyle
            ]}>
                {icon && (
                    <MaterialIcons
                        name={icon}
                        size={20}
                        color={isFocused ? Colors.primary : iconColor}
                        style={styles.icon}
                    />
                )}
                <TextInput
                    ref={ref}
                    style={[styles.input, inputStyle]}
                    placeholder={placeholder}
                    placeholderTextColor={getPlaceholderColor()}
                    secureTextEntry={isPasswordField ? !isPasswordVisible : secureTextEntry}
                    {...accessibilityProps}
                    // Compose with the caller's handlers so the focus ring always tracks focus
                    onFocus={(e) => {
                        setIsFocused(true);
                        onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setIsFocused(false);
                        onBlur?.(e);
                    }}
                    // Enhanced keyboard handling for production builds
                    returnKeyType={props.returnKeyType || 'next'}
                    submitBehavior={props.submitBehavior ?? 'submit'}
                    editable={isEditable}
                    // Platform-specific optimizations
                    {...(Platform.OS === 'android' && {
                        underlineColorAndroid: 'transparent',
                        importantForAutofill: 'yes',
                        // Ensure keyboard stays responsive in production
                        keyboardType: props.keyboardType || 'default',
                    })}
                    {...(Platform.OS === 'ios' && {
                        // A clear button would sit next to the show/hide toggle
                        clearButtonMode: isPasswordField ? 'never' : 'while-editing',
                        // iOS-specific keyboard handling
                        enablesReturnKeyAutomatically: true,
                    })}
                    {...props}
                />

                {/* Password visibility toggle */}
                {isPasswordField && (showPasswordToggle || isPassword) && (
                    <Pressable
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        style={({ pressed }) => [styles.passwordToggle, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
                    >
                        <Ionicons
                            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                            size={22}
                            color={Colors.textSecondary}
                        />
                    </Pressable>
                )}

                {/* Custom right element */}
                {!isPasswordField && rightElement}
            </View>

            {/* Errors replace the hint and sit right under the field they're about */}
            {error ? (
                <View style={styles.messageRow}>
                    <Ionicons name="alert-circle" size={16} color={Colors.errorText} style={styles.messageIcon} />
                    <Text style={[styles.message, styles.errorMessage]}>{error}</Text>
                </View>
            ) : hint ? (
                <Text style={[styles.message, styles.hintMessage]}>{hint}</Text>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 52,
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: FIELD_BORDER,
        borderRadius: Radius.md,
        paddingHorizontal: 14,
    },
    containerReadOnly: {
        backgroundColor: Colors.background,
    },
    containerFocused: {
        borderColor: Colors.primary,
    },
    containerError: {
        borderColor: Colors.error,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 17,
        color: Colors.textPrimary,
        fontWeight: '400',
        // Platform-specific text rendering fixes
        ...Platform.select({
            android: {
                includeFontPadding: false,
                textAlignVertical: 'center',
                // Force text rendering to prevent placeholder issues
                fontFamily: 'System',
            },
            ios: {
                // iOS-specific optimizations
                fontFamily: 'System',
            },
        }),
    },
    passwordToggle: {
        width: 44,
        height: 44,
        marginRight: -10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pressed: {
        opacity: 0.5,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginTop: 8,
    },
    messageIcon: {
        marginTop: 1,
    },
    message: {
        flexShrink: 1,
        fontSize: 14,
        lineHeight: 19,
    },
    errorMessage: {
        color: Colors.errorText,
    },
    hintMessage: {
        color: Colors.textSecondary,
        marginTop: 8,
    },
});

export default CustomTextInput;
