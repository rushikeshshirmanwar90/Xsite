import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';

const QuickAuthCheck: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      // Check all possible auth token keys
      const authKeys = ['auth_token', 'userToken', 'accessToken', 'authToken', 'token'];
      const tokenStatus: any = {};
      
      for (const key of authKeys) {
        const value = await AsyncStorage.getItem(key);
        tokenStatus[key] = value ? {
          exists: true,
          length: value.length,
          isJWT: value.includes('.'),
          preview: value.substring(0, 30) + '...'
        } : { exists: false };
      }

      // Check user data
      const userData = await AsyncStorage.getItem('user');
      const userInfo = userData ? JSON.parse(userData) : null;

      // Check login timestamp
      const loginTimestamp = await AsyncStorage.getItem('loginTimestamp');

      setAuthStatus({
        tokens: tokenStatus,
        user: userInfo ? {
          id: userInfo._id,
          email: userInfo.email,
          userType: userInfo.userType || userInfo.role,
          hasToken: !!userInfo.token
        } : null,
        contextUser: user ? {
          id: user._id,
          email: user.email,
          userType: user.userType || user.role
        } : null,
        loginTimestamp: loginTimestamp ? new Date(parseInt(loginTimestamp)).toLocaleString() : null,
        timestamp: new Date().toLocaleString()
      });
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const clearStorage = async () => {
    await AsyncStorage.clear();
    await checkAuthStatus();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Quick Auth Check</Text>
      
      <View style={styles.buttons}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={checkAuthStatus}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Checking...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.dangerButton]} 
          onPress={clearStorage}
        >
          <Text style={styles.buttonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {authStatus && (
        <ScrollView style={styles.results}>
          <Text style={styles.section}>🔐 Token Status</Text>
          {Object.entries(authStatus.tokens).map(([key, value]: [string, any]) => (
            <View key={key} style={styles.row}>
              <Text style={styles.key}>{key}:</Text>
              <Text style={[styles.value, value.exists ? styles.success : styles.error]}>
                {value.exists ? `✅ ${value.length}ch (JWT: ${value.isJWT})` : '❌'}
              </Text>
            </View>
          ))}

          <Text style={styles.section}>👤 User Data</Text>
          <View style={styles.row}>
            <Text style={styles.key}>Storage User:</Text>
            <Text style={[styles.value, authStatus.user ? styles.success : styles.error]}>
              {authStatus.user ? `✅ ${authStatus.user.email}` : '❌ None'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.key}>Context User:</Text>
            <Text style={[styles.value, authStatus.contextUser ? styles.success : styles.error]}>
              {authStatus.contextUser ? `✅ ${authStatus.contextUser.email}` : '❌ None'}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.key}>Login Time:</Text>
            <Text style={styles.value}>
              {authStatus.loginTimestamp || '❌ None'}
            </Text>
          </View>

          <Text style={styles.timestamp}>
            Last check: {authStatus.timestamp}
          </Text>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    minHeight: 300,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  results: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    maxHeight: 400,
  },
  section: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  key: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 120,
  },
  value: {
    fontSize: 14,
    flex: 1,
  },
  success: {
    color: '#34C759',
  },
  error: {
    color: '#FF3B30',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});

export default QuickAuthCheck;