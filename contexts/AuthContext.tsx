import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import axios from 'axios';
import { domain } from '@/lib/domain';
import PushTokenService from '@/services/pushTokenService';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  clientId: string | null;
  checkAuthStatus: () => Promise<void>;
  logout: () => Promise<void>;
  forceRefresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  // Initialize push token service when user is authenticated
  const initializePushTokens = async (userData: any) => {
    try {
      console.log('🔔 Initializing push tokens for authenticated user...');
      console.log('👤 User data for push tokens:', {
        id: userData._id,
        email: userData.email,
        role: userData.role,
        userType: userData.userType,
        clientsCount: userData.clients?.length || 0
      });
      
      const pushTokenService = PushTokenService.getInstance();
      
      // Initialize with user-friendly permission dialog
      const success = await pushTokenService.initialize(true);
      
      if (success) {
        console.log('✅ Push tokens initialized successfully');
        
        // Get the current token for verification
        const currentToken = pushTokenService.getCurrentToken();
        if (currentToken) {
          console.log('🎫 Current push token:', currentToken.substring(0, 30) + '...');
        }
      } else {
        console.log('⚠️ Push token initialization failed - user may not receive notifications');
      }
    } catch (error) {
      console.error('❌ Error initializing push tokens:', error);
    }
  };

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Checking auth status with validation...');
      
      // PRODUCTION FIX: First validate the authentication state
      const isValid = await validateAuthenticationState();
      if (!isValid) {
        console.log('❌ Authentication state invalid, user not authenticated');
        setIsAuthenticated(false);
        setUser(null);
        setClientId(null);
        setIsLoading(false);
        return;
      }
      
      const userDetails = await AsyncStorage.getItem("user");
      console.log('📱 Raw user data from storage:', userDetails ? 'Found' : 'Not found');
      
      if (userDetails && userDetails.trim() !== '' && userDetails !== 'null' && userDetails !== 'undefined') {
        try {
          const data = JSON.parse(userDetails);
          console.log('📊 Parsed user data:', data ? 'Valid object' : 'Invalid');
          
          // Enhanced validation - check for valid object structure
          if (data && 
              typeof data === 'object' && 
              Object.keys(data).length > 0 &&
              data._id && 
              data.email &&
              data.email.includes('@')) {
            
            // Check if user is staff
            const isStaff = data.role && ['site-engineer', 'supervisor', 'manager'].includes(data.role);
            
            // For staff users with clients array
            if (isStaff) {
              console.log('👷 Staff user detected');
              
              // Allow staff to login even without clients (they'll see the QR screen)
              if (!data.clients || data.clients.length === 0) {
                console.log('⚠️ Staff user with no clients - allowing login to show QR screen');
                setIsAuthenticated(true);
                setUser(data);
                setClientId(null); // No client assigned yet
                console.log('✅ Auth state updated for staff without clients');
                
                // Initialize push tokens for staff without clients
                await initializePushTokens(data);
                return;
              }
              
              // Staff with clients - use first client's clientId
              const extractedClientId = data.clients[0].clientId;
              console.log('👥 Staff user with clients, using first clientId:', extractedClientId);
              setIsAuthenticated(true);
              setUser(data);
              setClientId(extractedClientId);
              console.log('✅ Auth state updated successfully');
              
              // Initialize push tokens for staff with clients
              await initializePushTokens(data);
              return;
            }
            
            // For non-staff users (admin, client, etc.)
            const extractedClientId = data._id || data.clientId;
            
            if (extractedClientId) {
              console.log('✅ Valid user data found, setting authenticated state');
              console.log('🆔 User ID:', data._id);
              console.log('🏢 Client ID:', extractedClientId);

              setIsAuthenticated(true);
              setUser(data);
              setClientId(typeof extractedClientId === 'string' ? extractedClientId : null);
              
              console.log('✅ Auth state updated successfully');
              
              // Initialize push tokens for non-staff users
              await initializePushTokens(data);
            } else {
              console.warn('⚠️ No client ID found in stored user data');
              await clearCorruptedData();
            }
          } else {
            console.warn('⚠️ Invalid user data structure or missing required fields');
            await clearCorruptedData();
          }
        } catch (parseError) {
          console.error('❌ Error parsing user data:', parseError);
          await clearCorruptedData();
        }
      } else {
        console.log('📭 No valid user data found in storage');
        setIsAuthenticated(false);
        setUser(null);
        setClientId(null);
      }
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
      await clearCorruptedData();
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to clear corrupted data
  const clearCorruptedData = async () => {
    try {
      console.log('🧹 Clearing corrupted auth data...');
      await AsyncStorage.clear();
      setIsAuthenticated(false);
      setUser(null);
      setClientId(null);
    } catch (clearError) {
      console.error('❌ Error clearing corrupted data:', clearError);
      // Force reset state even if storage clear fails
      setIsAuthenticated(false);
      setUser(null);
      setClientId(null);
    }
  };

  // PRODUCTION FIX: Add authentication state validator
  const validateAuthenticationState = async (): Promise<boolean> => {
    try {
      console.log('🔍 Validating authentication state...');
      
      const userDetails = await AsyncStorage.getItem("user");
      
      // Check for empty or invalid data
      if (!userDetails || 
          userDetails.trim() === '' || 
          userDetails === 'null' || 
          userDetails === 'undefined' ||
          userDetails === '{}') {
        console.log('❌ Invalid user data found, clearing...');
        await AsyncStorage.clear();
        return false;
      }
      
      try {
        const data = JSON.parse(userDetails);
        
        // Validate required fields
        if (!data || 
            typeof data !== 'object' || 
            Object.keys(data).length === 0 ||
            !data._id || 
            !data.email ||
            !data.email.includes('@')) {
          console.log('❌ Corrupted user data structure, clearing...');
          await AsyncStorage.clear();
          return false;
        }
        
        // Check if data is too old (optional - expire after 30 days)
        const loginTimestamp = await AsyncStorage.getItem('loginTimestamp');
        if (loginTimestamp) {
          const loginTime = parseInt(loginTimestamp);
          const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
          
          if (loginTime < thirtyDaysAgo) {
            console.log('❌ Authentication data expired, clearing...');
            await AsyncStorage.clear();
            return false;
          }
        }
        
        console.log('✅ Authentication state is valid');
        return true;
        
      } catch (parseError) {
        console.error('❌ Error parsing user data:', parseError);
        await AsyncStorage.clear();
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error validating auth state:', error);
      await AsyncStorage.clear();
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Starting enhanced logout process...');
      
      // PRODUCTION FIX: Clear notification data first
      try {
        console.log('🔔 Clearing notification data...');
        const NotificationManager = (await import('@/services/notificationManager')).default;
        const notificationManager = NotificationManager.getInstance();
        await notificationManager.cleanup();
        await notificationManager.clearAllNotificationData();
        console.log('✅ Notification data cleared successfully');
      } catch (notificationError) {
        console.error('⚠️ Error clearing notification data:', notificationError);
        // Continue with logout even if notification cleanup fails
      }
      
      // Unregister push tokens before clearing storage
      try {
        console.log('🔔 Unregistering push tokens...');
        const pushTokenService = PushTokenService.getInstance();
        await pushTokenService.unregisterPushToken();
        console.log('✅ Push tokens unregistered successfully');
      } catch (tokenError) {
        console.error('⚠️ Error unregistering push tokens:', tokenError);
        // Continue with logout even if token cleanup fails
      }
      
      // ENHANCED: Clear ALL possible storage keys
      console.log('🧹 Clearing all authentication data...');
      
      // Get all keys first
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('📋 Found storage keys:', allKeys);
      
      // Clear everything
      await AsyncStorage.clear();
      
      // Double-check by explicitly removing known keys
      const keysToRemove = [
        'user', 'userType', 'admin', 'staff', 'client',
        'pushToken', 'pushTokenRegistered', 'pushTokenRegistrationTime',
        'notificationSetupChecked', 'notificationSetupResult', 
        'notificationSetupTimestamp', 'local_notifications',
        'authToken', 'sessionId', 'lastLoginTime', 'clientId',
        'isAuthenticated', 'loginTimestamp', 'deviceId',
        // Add any other keys your app might use
      ];
      
      await Promise.all(keysToRemove.map(key => 
        AsyncStorage.removeItem(key).catch(err => 
          console.warn(`⚠️ Failed to remove ${key}:`, err)
        )
      ));
      
      // PRODUCTION FIX: Force clear by setting empty values as fallback
      await Promise.all(keysToRemove.map(key => 
        AsyncStorage.setItem(key, '').catch(err => 
          console.warn(`⚠️ Failed to set empty ${key}:`, err)
        )
      ));
      
      console.log('✅ All storage data cleared');
      
      // Reset all auth state
      setIsAuthenticated(false);
      setUser(null);
      setClientId(null);
      
      // PRODUCTION FIX: Add small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('✅ Enhanced logout completed - all data cleared');
    } catch (error) {
      console.error('❌ Enhanced logout error:', error);
      
      // CRITICAL: Always reset auth state even if storage operations fail
      setIsAuthenticated(false);
      setUser(null);
      setClientId(null);
    }
  };

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Listen for app state changes (when app comes back from background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkAuthStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // Set up periodic auth status checks (less aggressive)
  useEffect(() => {
    const checkAuthInterval = setInterval(checkAuthStatus, 30000); // Check every 30 seconds
    return () => clearInterval(checkAuthInterval);
  }, []);

  const fetchFreshUserData = async (userEmail: string, userType: string) => {
    try {
      console.log('🌐 Fetching fresh user data from server...');
      console.log('   Email:', userEmail);
      console.log('   UserType:', userType);

      // Determine the correct endpoint based on userType
      const endpoint = userType === 'staff' 
        ? `${domain}/api/staff?email=${userEmail}`
        : `${domain}/api/${userType}?email=${userEmail}`;

      console.log('   URL:', endpoint);

      const response = await axios.get(endpoint);
      console.log('📦 Fresh data response status:', response.status);

      if (response.status === 200) {
        const freshUserData = response.data.data;
        console.log('✅ Fresh user data received:', {
          _id: freshUserData?._id,
          email: freshUserData?.email,
          clients: freshUserData?.clients,
          clientsLength: freshUserData?.clients?.length || 0
        });
        return freshUserData;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to fetch fresh user data:', error);
      return null;
    }
  };

  const forceRefresh = async () => {
    console.log('🔄 Force refresh triggered - fetching fresh data from server...');
    
    try {
      // Get current user data from storage
      const userDetails = await AsyncStorage.getItem("user");
      if (!userDetails) {
        console.log('❌ No user data in storage to refresh');
        return;
      }

      const currentUser = JSON.parse(userDetails);
      if (!currentUser.email) {
        console.log('❌ No email found in current user data');
        return;
      }

      // Determine user type
      const userType = currentUser.role ? 'staff' : (currentUser.userType || 'clients');
      
      // Fetch fresh data from server
      const freshUserData = await fetchFreshUserData(currentUser.email, userType);
      
      if (freshUserData) {
        // Merge fresh data with existing data, preserving important fields
        const updatedUserData = {
          ...currentUser,
          ...freshUserData,
          userType: userType // Ensure userType is preserved
        };

        console.log('💾 Updating storage with fresh data...');
        console.log('   Old clients:', currentUser.clients);
        console.log('   New clients:', freshUserData.clients);

        // Update AsyncStorage with fresh data
        await AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
        
        // Update auth state by calling checkAuthStatus
        await checkAuthStatus();
        
        console.log('✅ Force refresh completed with fresh server data');
      } else {
        console.log('⚠️ Could not fetch fresh data, falling back to local refresh');
        await checkAuthStatus();
      }
    } catch (error) {
      console.error('❌ Error during force refresh:', error);
      // Fallback to local refresh
      await checkAuthStatus();
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    clientId,
    checkAuthStatus,
    logout,
    forceRefresh,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
