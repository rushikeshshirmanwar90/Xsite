import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import axios from 'axios';
import { domain } from '@/lib/domain';

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

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Checking auth status...');
      const userDetails = await AsyncStorage.getItem("user");
      console.log('📱 Raw user data from storage:', userDetails ? 'Found' : 'Not found');
      
      if (userDetails && userDetails.trim() !== '') {
        try {
          const data = JSON.parse(userDetails);
          console.log('📊 Parsed user data:', data ? 'Valid object' : 'Invalid');
          
          if (data && typeof data === 'object' && Object.keys(data).length > 0) {
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
                return;
              }
              
              // Staff with clients - use first client's clientId
              const extractedClientId = data.clients[0].clientId;
              console.log('👥 Staff user with clients, using first clientId:', extractedClientId);
              setIsAuthenticated(true);
              setUser(data);
              setClientId(extractedClientId);
              console.log('✅ Auth state updated successfully');
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
            } else {
              console.warn('⚠️ No client ID found in stored user data');
              await AsyncStorage.clear();
              setIsAuthenticated(false);
              setUser(null);
              setClientId(null);
            }
          } else {
            console.warn('⚠️ Invalid user data structure');
            await AsyncStorage.clear();
            setIsAuthenticated(false);
            setUser(null);
            setClientId(null);
          }
        } catch (parseError) {
          console.error('❌ Error parsing user data:', parseError);
          await AsyncStorage.clear();
          setIsAuthenticated(false);
          setUser(null);
          setClientId(null);
        }
      } else {
        console.log('📭 No user data found in storage');
        setIsAuthenticated(false);
        setUser(null);
        setClientId(null);
      }
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
      setClientId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Starting logout process...');
      
      // Clear ALL AsyncStorage data to ensure clean logout
      console.log('🧹 Clearing all AsyncStorage data...');
      await AsyncStorage.clear();
      
      // Alternative approach: Remove specific keys if clear() fails
      // await AsyncStorage.removeItem('user');
      // await AsyncStorage.removeItem('userType');
      // await AsyncStorage.removeItem('admin');
      // await AsyncStorage.removeItem('staff');
      
      console.log('✅ AsyncStorage cleared successfully');
      
      // Reset all auth state
      setIsAuthenticated(false);
      setUser(null);
      setClientId(null);
      
      console.log('✅ Logout completed - all data cleared');
    } catch (error) {
      console.error('❌ Logout error:', error);
      
      // Fallback: try to clear individual items if clear() fails
      try {
        console.log('🔄 Attempting fallback cleanup...');
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('userType');
        await AsyncStorage.removeItem('admin');
        await AsyncStorage.removeItem('staff');
        console.log('✅ Fallback cleanup completed');
      } catch (fallbackError) {
        console.error('❌ Fallback cleanup failed:', fallbackError);
        // Last resort: set empty values
        await AsyncStorage.setItem('user', '');
        await AsyncStorage.setItem('userType', '');
      }
      
      // Always reset auth state regardless of storage errors
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
