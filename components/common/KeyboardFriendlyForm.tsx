import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ViewStyle,
  ScrollViewProps,
} from 'react-native';

interface KeyboardFriendlyFormProps extends ScrollViewProps {
  children: React.ReactNode;
  containerStyle?: ViewStyle;
}

/**
 * Universal wrapper for forms to ensure keyboard functionality
 * works consistently in both development and production builds
 */
const KeyboardFriendlyForm: React.FC<KeyboardFriendlyFormProps> = ({
  children,
  containerStyle,
  ...scrollViewProps
}) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[{ flex: 1 }, containerStyle]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default KeyboardFriendlyForm;