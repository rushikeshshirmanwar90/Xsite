import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuthStatus: () => Promise<void>;
  logout: () => Promise<void>;
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

  const checkAuthStatus = async () => {
    try {
      const userDetails = await AsyncStorage.getItem("user");
      if (userDetails && userDetails.trim() !== '') {
        try {
          const data = JSON.parse(userDetails);
          if (data && typeof data === 'object' && Object.keys(data).length > 0) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: try to set empty string if remove fails
      await AsyncStorage.setItem('user', '');
      setIsAuthenticated(false);
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

  // Set up periodic auth status checks
  useEffect(() => {
    const checkAuthInterval = setInterval(checkAuthStatus, 1000); // Check every second
    return () => clearInterval(checkAuthInterval);
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    checkAuthStatus,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
