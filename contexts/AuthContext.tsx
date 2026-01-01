import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

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
            const extractedClientId = data._id || data.clientId;

            if (extractedClientId) {
              console.log('✅ Valid user data found, setting authenticated state');
              console.log('🆔 User ID:', data._id);
              console.log('🏢 Client ID:', data.clientId);

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

  const forceRefresh = async () => {
    console.log('🔄 Force refresh triggered from AuthContext...');
    await checkAuthStatus();
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
