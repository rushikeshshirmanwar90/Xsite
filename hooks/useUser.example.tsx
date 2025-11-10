/**
 * EXAMPLE: How to use the useUser hook
 * 
 * This file demonstrates various ways to use the useUser hook
 * in your React Native components.
 */

import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getUserDisplayName, getUserRole, isAdmin, isCustomer, isStaff, useUser } from './useUser';

// Example 1: Basic usage - Display user info
export const UserProfileExample = () => {
  const { user, userType, loading, error } = useUser();
  const router = useRouter();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text>Loading user data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>No user logged in</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Profile</Text>
      <Text style={styles.label}>Name: {getUserDisplayName(user)}</Text>
      <Text style={styles.label}>Email: {user.email}</Text>
      <Text style={styles.label}>Phone: {user.phoneNumber}</Text>
      <Text style={styles.label}>User Type: {userType}</Text>
      
      {isStaff(user) && (
        <Text style={styles.label}>Role: {getUserRole(user)}</Text>
      )}
      
      {isCustomer(user) && (
        <Text style={styles.label}>
          Verified: {(user as any).verified ? 'Yes' : 'No'}
        </Text>
      )}
    </View>
  );
};

// Example 2: Refresh user data
export const RefreshUserExample = () => {
  const { user, refreshUser, loading } = useUser();

  const handleRefresh = async () => {
    await refreshUser();
    console.log('User data refreshed!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Current User: {getUserDisplayName(user)}</Text>
      <TouchableOpacity 
        style={styles.button}
        onPress={handleRefresh}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Refresh User Data</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// Example 3: Update user data
export const UpdateUserExample = () => {
  const { user, updateUser, loading } = useUser();

  const handleUpdatePhone = async () => {
    const success = await updateUser({
      phoneNumber: '9876543210'
    });

    if (success) {
      console.log('Phone number updated successfully!');
    } else {
      console.log('Failed to update phone number');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Update User</Text>
      <Text style={styles.label}>Current Phone: {user?.phoneNumber}</Text>
      <TouchableOpacity 
        style={styles.button}
        onPress={handleUpdatePhone}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Update Phone Number</Text>
      </TouchableOpacity>
    </View>
  );
};

// Example 4: Logout
export const LogoutExample = () => {
  const { logout, loading } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

// Example 5: Role-based rendering
export const RoleBasedExample = () => {
  const { user, userType } = useUser();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Role-Based Content</Text>
      
      {isAdmin(user) && (
        <View style={styles.roleSection}>
          <Text style={styles.roleTitle}>Admin Dashboard</Text>
          <Text>You have access to all admin features</Text>
        </View>
      )}
      
      {isStaff(user) && (
        <View style={styles.roleSection}>
          <Text style={styles.roleTitle}>Staff Dashboard</Text>
          <Text>Role: {getUserRole(user)}</Text>
          <Text>Assigned Projects: {(user as any).assignedProjects?.length || 0}</Text>
        </View>
      )}
      
      {isCustomer(user) && (
        <View style={styles.roleSection}>
          <Text style={styles.roleTitle}>Customer Dashboard</Text>
          <Text>Your properties and projects</Text>
        </View>
      )}
    </View>
  );
};

// Example 6: Complete user management component
export const UserManagementExample = () => {
  const { user, userType, loading, error, refreshUser, logout, updateUser } = useUser();
  const router = useRouter();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Not Logged In</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Management</Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>User Information</Text>
        <Text style={styles.infoText}>Name: {getUserDisplayName(user)}</Text>
        <Text style={styles.infoText}>Email: {user.email}</Text>
        <Text style={styles.infoText}>Type: {userType}</Text>
        
        {isStaff(user) && (
          <Text style={styles.infoText}>Role: {getUserRole(user)}</Text>
        )}
      </View>
      
      <View style={styles.buttonGroup}>
        <TouchableOpacity 
          style={styles.button}
          onPress={refreshUser}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Refresh Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.logoutButton]}
          onPress={async () => {
            await logout();
            router.replace('/login');
          }}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1F2937',
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#4B5563',
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  roleSection: {
    backgroundColor: '#F3F4F6',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1F2937',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1F2937',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#6B7280',
  },
  buttonGroup: {
    gap: 10,
  },
});
