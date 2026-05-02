import { Platform } from 'react-native';

/**
 * Environment detection utilities for handling dev vs production differences
 */

export const isDevelopment = __DEV__;
export const isProduction = !__DEV__;

/**
 * Get keyboard-friendly TextInput props based on environment
 */
export const getKeyboardProps = (options: {
  returnKeyType?: 'done' | 'next' | 'search' | 'send' | 'go';
  onSubmitEditing?: () => void;
  isLastInput?: boolean;
}) => {
  const { returnKeyType = 'next', onSubmitEditing, isLastInput = false } = options;
  
  return {
    returnKeyType: isLastInput ? 'done' : returnKeyType,
    onSubmitEditing,
    blurOnSubmit: isLastInput,
    editable: true,
    // Ensure keyboard stays responsive in production
    ...(Platform.OS === 'android' && {
      underlineColorAndroid: 'transparent',
      importantForAutofill: 'yes',
    }),
    ...(Platform.OS === 'ios' && {
      enablesReturnKeyAutomatically: true,
      clearButtonMode: 'while-editing',
    }),
  };
};

/**
 * Get platform-specific keyboard avoiding behavior
 */
export const getKeyboardAvoidingProps = () => ({
  behavior: Platform.OS === 'ios' ? 'padding' as const : 'height' as const,
  keyboardVerticalOffset: Platform.OS === 'ios' ? 64 : 0,
});

/**
 * Check if we're in a production build that might have keyboard issues
 */
export const hasKeyboardIssues = () => {
  return isProduction && Platform.OS === 'android';
};

export default {
  isDevelopment,
  isProduction,
  getKeyboardProps,
  getKeyboardAvoidingProps,
  hasKeyboardIssues,
};