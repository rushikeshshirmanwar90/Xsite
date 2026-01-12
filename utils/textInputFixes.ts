import { Platform, TextStyle } from 'react-native';

/**
 * Utility functions to fix TextInput placeholder visibility issues across different devices
 */

/**
 * Get platform-optimized placeholder color
 * @param customColor - Custom placeholder color (optional)
 * @returns Optimized placeholder color for the current platform
 */
export const getPlaceholderColor = (customColor?: string): string => {
    if (customColor) return customColor;
    
    // Platform-specific defaults with better contrast
    if (Platform.OS === 'ios') {
        return '#8E8E93'; // iOS system placeholder color
    } else {
        return '#6B7280'; // Darker gray for Android with better contrast
    }
};

/**
 * Get platform-optimized TextInput styles
 * @returns Platform-specific TextInput styles
 */
export const getTextInputStyles = (): TextStyle => {
    return {
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '400',
        ...Platform.select({
            android: {
                includeFontPadding: false,
                textAlignVertical: 'center',
                fontFamily: 'System',
                // Force text rendering to prevent placeholder issues
                textAlign: 'left',
            },
            ios: {
                fontFamily: 'System',
            },
        }),
    };
};

/**
 * Get platform-optimized container styles for TextInput
 * @param isFocused - Whether the input is focused
 * @returns Platform-specific container styles
 */
export const getTextInputContainerStyles = (isFocused: boolean = false) => {
    return {
        backgroundColor: isFocused ? '#F0F9FF' : '#F9FAFB',
        borderWidth: 1.5,
        borderColor: isFocused ? '#3B82F6' : '#E5E7EB',
        borderRadius: 12,
        minHeight: 56,
        ...Platform.select({
            ios: {
                shadowColor: isFocused ? '#3B82F6' : '#000',
                shadowOffset: { width: 0, height: isFocused ? 2 : 1 },
                shadowOpacity: isFocused ? 0.1 : 0.05,
                shadowRadius: isFocused ? 4 : 2,
            },
            android: {
                elevation: isFocused ? 2 : 1,
            },
        }),
    };
};

/**
 * Common TextInput props that fix placeholder visibility issues
 */
export const getCommonTextInputProps = () => {
    return {
        placeholderTextColor: getPlaceholderColor(),
        ...Platform.select({
            android: {
                underlineColorAndroid: 'transparent',
                importantForAutofill: 'yes',
            },
            ios: {
                clearButtonMode: 'while-editing' as const,
            },
        }),
    };
};

/**
 * Fix for specific placeholder visibility issues on certain Android devices
 * @param placeholder - The placeholder text
 * @returns Fixed placeholder text
 */
export const fixPlaceholderText = (placeholder: string): string => {
    // Some Android devices have issues with empty or very short placeholders
    if (!placeholder || placeholder.trim().length === 0) {
        return ' '; // Return a space to ensure placeholder is rendered
    }
    
    // Ensure placeholder has minimum length for visibility
    if (placeholder.trim().length < 2) {
        return placeholder + ' '; // Add space for better rendering
    }
    
    return placeholder;
};

/**
 * Debug function to log TextInput rendering issues
 * @param componentName - Name of the component using TextInput
 * @param placeholder - Placeholder text
 * @param value - Current input value
 */
export const debugTextInput = (componentName: string, placeholder: string, value: string) => {
    if (__DEV__) {
        console.log(`🔍 TextInput Debug - ${componentName}:`, {
            platform: Platform.OS,
            placeholder: placeholder,
            placeholderLength: placeholder?.length || 0,
            value: value,
            valueLength: value?.length || 0,
            hasPlaceholder: !!placeholder,
            isEmpty: !value || value.length === 0,
        });
    }
};