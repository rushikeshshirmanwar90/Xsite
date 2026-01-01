import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    console.log('📍 Index page - Auth state:', { isAuthenticated, isLoading });
  }, [isAuthenticated, isLoading]);

  // Show loading spinner while checking auth
  if (isLoading) {
    console.log('⏳ Index page showing loading...');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    console.log('✅ Index page redirecting to tabs - user authenticated');
    return <Redirect href="/(tabs)" />;
  }

  console.log('🚫 Index page redirecting to login - user not authenticated');
  return <Redirect href="/login" />;
}