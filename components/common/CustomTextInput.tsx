import React, { useState } from 'react';
import { 
    TextInput, 
    TextInputProps, 
    StyleSheet, 
    View, 
    ViewStyle, 
    TextStyle, 
    Platform,
    TouchableOpacity 
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

interface CustomTextInputProps extends TextInputProps {
    icon?: keyof typeof MaterialIcons.glyphMap;
    iconColor?: string;
    containerStyle?: ViewStyle;
    inputStyle?: TextStyle;
    rightElement?: React.ReactNode;
    showPasswordToggle?: boolean;
    isPassword?: boolean;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({
    icon,
    iconColor = '#666',
    containerStyle,
    inputStyle,
    rightElement,
    placeholder,
    placeholderTextColor,
    showPasswordToggle = false,
    isPassword = false,
    secureTextEntry,
    ...props
}) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Determine if this is a password field
    const isPasswordField = isPassword || showPasswordToggle || secureTextEntry;
    const shouldShowPassword = isPasswordField && isPasswordVisible;

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
        <View style={[
            styles.container, 
            isFocused && styles.containerFocused,
            containerStyle
        ]}>
            {icon && (
                <MaterialIcons 
                    name={icon} 
                    size={20} 
                    color={isFocused ? '#3B82F6' : iconColor} 
                    style={styles.icon} 
                />
            )}
            <TextInput
                style={[styles.input, inputStyle]}
                placeholder={placeholder}
                placeholderTextColor={getPlaceholderColor()}
                secureTextEntry={isPasswordField ? !isPasswordVisible : secureTextEntry}
                onFocus={(e) => {
                    setIsFocused(true);
                    props.onFocus?.(e);
                }}
                onBlur={(e) => {
                    setIsFocused(false);
                    props.onBlur?.(e);
                }}
                // Platform-specific optimizations
                {...(Platform.OS === 'android' && {
                    underlineColorAndroid: 'transparent',
                    importantForAutofill: 'yes',
                })}
                {...(Platform.OS === 'ios' && {
                    clearButtonMode: 'while-editing',
                })}
                {...props}
            />
            
            {/* Password visibility toggle */}
            {isPasswordField && (showPasswordToggle || isPassword) && (
                <TouchableOpacity
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    style={styles.passwordToggle}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name={isPasswordVisible ? "eye-off" : "eye"}
                        size={24}
                        color="#3B82F6"
                    />
                </TouchableOpacity>
            )}
            
            {/* Custom right element */}
            {rightElement && !isPasswordField}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1.5, // Slightly thicker border for better definition
        borderColor: '#E5E7EB',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 4,
        minHeight: 56,
        // Enhanced shadow for better visual separation
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    containerFocused: {
        borderColor: '#3B82F6',
        backgroundColor: '#F0F9FF', // Slightly blue tint when focused
        ...Platform.select({
            ios: {
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    icon: {
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        paddingRight: 12,
        fontSize: 16,
        color: '#1F2937',
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
        paddingHorizontal: 12,
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default CustomTextInput;