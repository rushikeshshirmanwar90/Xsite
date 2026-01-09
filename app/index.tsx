import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import StaffNoClientScreen from '@/components/staff/StaffNoClientScreen';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    console.log('📍 Index page - Auth state:', { 
      isAuthenticated, 
      isLoading, 
      hasUser: !!user,
      userRole: user?.role,
      userClients: user?.clients,
      userType: user?.userType
    });
    
    // Wait for auth to finish loading and user data to be available
    if (!isLoading) {
      // Add a small delay to ensure all data is processed
      const timer = setTimeout(() => {
        console.log('✅ Index page ready to route');
        setIsReady(true);
      }, 150);
      
      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
    }
  }, [isAuthenticated, isLoading, user]);

  // Show loading spinner while checking auth or waiting for data
  if (isLoading || !isReady) {
    console.log('⏳ Index page showing loading...', { isLoading, isReady });
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 16, color: '#6B7280', fontSize: 14 }}>
          {isLoading ? 'Checking authentication...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  // Check if user is staff without any assigned clients
  if (isAuthenticated && user) {
    console.log('🔍 Checking user for staff without clients:', {
      hasRole: !!user.role,
      role: user.role,
      hasClientIds: !!user.clientIds,
      clientIds: user.clientIds,
      clientIdsLength: user.clientIds?.length,
      isArray: Array.isArray(user.clientIds)
    });
    
    // Check if user is staff by role field
    const isStaff = user.role && ['site-engineer', 'supervisor', 'manager'].includes(user.role);
    
    // Check if clients array is empty or not present
    const hasNoClients = !user.clients || 
                        (Array.isArray(user.clients) && user.clients.length === 0);
    
    console.log('🎯 Staff check results:', { isStaff, hasNoClients });
    
    if (isStaff && hasNoClients) {
      console.log('⚠️ Staff user with no assigned clients - showing QR screen');
      console.log('📋 Staff data being passed:', {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        clients: user.clients
      });
      return <StaffNoClientScreen staffData={user} />;
    }
    
    console.log('✅ User has clients or is not staff - proceeding to tabs');
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    console.log('✅ Index page redirecting to tabs - user authenticated');
    return <Redirect href="/(tabs)" />;
  }

  console.log('🚫 Index page redirecting to login - user not authenticated');
  return <Redirect href="/login" />;
}