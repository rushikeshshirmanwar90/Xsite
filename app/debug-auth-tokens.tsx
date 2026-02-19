import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthTokenDebugger from '@/components/AuthTokenDebugger';

/**
 * Debug page for authentication tokens
 * 
 * This page helps debug authentication issues by showing:
 * - All stored auth tokens in AsyncStorage
 * - Current user data from AuthContext
 * - Stored user data in AsyncStorage
 * - Recommendations for fixing auth issues
 * 
 * Access this page by navigating to /debug-auth-tokens
 */
const DebugAuthTokens: React.FC = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AuthTokenDebugger />
    </SafeAreaView>
  );
};

export default DebugAuthTokens;