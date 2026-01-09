import { domain } from '@/lib/domain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useEffect, useState } from 'react';

// User type definitions
export interface AdminUser {
  _id: string;
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: number;
  password?: string;
}

export interface StaffUser {
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password?: string;
  clients: Array<{
    clientId: string;
    clientName: string;
    assignedAt?: Date;
  }>; // Changed from clientIds to clients array with client details
  role: 'site-engineer' | 'supervisor' | 'manager';
  assignedProjects?: Array<{
    projectId: string;
    projectName: string;
    clientId: string;
    clientName: string;
    assignedAt: string;
    status: "active" | "completed" | "paused";
  }>;
}

export interface CustomerUser {
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password?: string;
  clientId: string;
  verified: boolean;
  otp?: number;
  properties?: any;
  createdAt?: string;
  updatedAt?: string;
}

export type User = AdminUser | StaffUser | CustomerUser;
export type UserType = 'admin' | 'staff' | 'user';

interface UseUserReturn {
  user: User | null;
  userType: UserType | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<boolean>;
}

export const useUser = (): UseUserReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from AsyncStorage
  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check for user in AsyncStorage
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Determine user type based on user data structure
        if ('role' in parsedUser && parsedUser.role) {
          setUserType('staff');
        } else if ('verified' in parsedUser) {
          setUserType('user');
        } else {
          setUserType('admin');
        }
      } else {
        // Check legacy storage keys
        const adminData = await AsyncStorage.getItem('admin');
        const staffData = await AsyncStorage.getItem('staff');
        const userData = await AsyncStorage.getItem('user');

        if (adminData) {
          setUser(JSON.parse(adminData));
          setUserType('admin');
        } else if (staffData) {
          setUser(JSON.parse(staffData));
          setUserType('staff');
        } else if (userData) {
          setUser(JSON.parse(userData));
          setUserType('user');
        }
      }
    } catch (err) {
      console.error('Error loading user:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  // Refresh user data from API
  const refreshUser = async () => {
    if (!user || !userType) {
      console.warn('No user to refresh');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${domain}/api/${userType}?email=${user.email}`
      );

      if ((response.data as any).success) {
        const updatedUser = (response.data as any).data;
        setUser(updatedUser);
        
        // Update AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        throw new Error('Failed to refresh user data');
      }
    } catch (err: any) {
      console.error('Error refreshing user:', err);
      setError(err?.response?.data?.message || 'Failed to refresh user data');
    } finally {
      setLoading(false);
    }
  };

  // Update user data
  const updateUser = async (updates: Partial<User>): Promise<boolean> => {
    if (!user || !userType) {
      console.warn('No user to update');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.put(
        `${domain}/api/${userType}?id=${user._id}`,
        updates
      );

      if ((response.data as any).success) {
        const updatedUser = (response.data as any).data;
        setUser(updatedUser);
        
        // Update AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        return true;
      } else {
        throw new Error('Failed to update user');
      }
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err?.response?.data?.message || 'Failed to update user');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      // Clear all user-related data from AsyncStorage
      await AsyncStorage.multiRemove(['user', 'admin', 'staff', 'userType']);
      
      setUser(null);
      setUserType(null);
      setError(null);
    } catch (err) {
      console.error('Error during logout:', err);
      setError('Failed to logout');
    }
  };

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  return {
    user,
    userType,
    loading,
    error,
    refreshUser,
    logout,
    updateUser,
  };
};

// Helper function to get user display name
export const getUserDisplayName = (user: User | null): string => {
  if (!user) return 'Guest';
  return `${user.firstName} ${user.lastName}`;
};

// Helper function to check if user is admin
export const isAdmin = (user: User | null): boolean => {
  if (!user) return false;
  return 'clientId' in user && !('role' in user) && !('verified' in user);
};

// Helper function to check if user is staff
export const isStaff = (user: User | null): boolean => {
  if (!user) return false;
  return 'role' in user;
};

// Helper function to check if user is customer
export const isCustomer = (user: User | null): boolean => {
  if (!user) return false;
  return 'verified' in user;
};

// Helper function to get user role (for staff)
export const getUserRole = (user: User | null): string | null => {
  if (!user || !isStaff(user)) return null;
  return (user as StaffUser).role;
};
