import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';

interface TokenInfo {
  key: string;
  value: string | null;
  length: number;
  preview: string;
}

const AuthTokenDebugger: React.FC = () => {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const checkAllTokens = async () => {
    setLoading(true);
    try {
      const authKeys = [
        'auth_token',
        'userToken', 
        'accessToken',
        'authToken',
        'token',
        'user',
        'sessionToken',
        'bearerToken'
      ];

      const tokenResults: TokenInfo[] = [];

      for (const key of authKeys) {
        const value = await AsyncStorage.getItem(key);
        tokenResults.push({
          key,
          value,
          length: value ? value.length : 0,
          preview: value ? value.substring(0, 30) + '...' : 'null'
        });
      }

      setTokens(tokenResults);

      // Check user data
      const userDataStr = await AsyncStorage.getItem('user');
      if (userDataStr) {
        try {
          const parsed = JSON.parse(userDataStr);
          setUserData(parsed);
        } catch (error) {
          setUserData({ error: 'Failed to parse user data' });
        }
      }

    } catch (error) {
      console.error('Error checking tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAllTokens();
  }, []);

  const clearAllTokens = async () => {
    try {
      await AsyncStorage.clear();
      console.log('✅ All storage cleared');
      await checkAllTokens();
    } catch (error) {
      console.error('❌ Error clearing storage:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Auth Token Debugger</Text>
        <Text style={styles.subtitle}>Debug authentication tokens and user data</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={checkAllTokens}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Checking...' : 'Refresh Tokens'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.dangerButton]} 
          onPress={clearAllTokens}
        >
          <Text style={styles.buttonText}>Clear All Storage</Text>
        </TouchableOpacity>
      </View>

      {/* Auth Context User */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Auth Context User</Text>
        <View style={styles.card}>
          {user ? (
            <>
              <Text style={styles.label}>ID: {user._id}</Text>
              <Text style={styles.label}>Email: {user.email}</Text>
              <Text style={styles.label}>Role: {user.role || user.userType || 'N/A'}</Text>
              <Text style={styles.label}>Has Token: {user.token ? 'Yes' : 'No'}</Text>
            </>
          ) : (
            <Text style={styles.noData}>No user in auth context</Text>
          )}
        </View>
      </View>

      {/* Storage Tokens */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AsyncStorage Tokens</Text>
        {tokens.map((token, index) => (
          <View key={index} style={styles.tokenCard}>
            <View style={styles.tokenHeader}>
              <Text style={styles.tokenKey}>{token.key}</Text>
              <Text style={[
                styles.tokenStatus,
                { color: token.value ? '#10B981' : '#EF4444' }
              ]}>
                {token.value ? '✅' : '❌'}
              </Text>
            </View>
            <Text style={styles.tokenValue}>
              {token.value ? `${token.preview} (${token.length} chars)` : 'Not found'}
            </Text>
          </View>
        ))}
      </View>

      {/* User Data */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stored User Data</Text>
        <View style={styles.card}>
          {userData ? (
            <Text style={styles.jsonText}>
              {JSON.stringify(userData, null, 2)}
            </Text>
          ) : (
            <Text style={styles.noData}>No user data found</Text>
          )}
        </View>
      </View>

      {/* Recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 Recommendations</Text>
        <View style={styles.card}>
          <Text style={styles.recommendation}>
            • If no auth tokens found: User needs to log in again
          </Text>
          <Text style={styles.recommendation}>
            • If user data exists but no tokens: Check login flow
          </Text>
          <Text style={styles.recommendation}>
            • For backend registration: Ensure auth token is stored after login
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  controls: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tokenCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tokenKey: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  tokenStatus: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tokenValue: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  label: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  noData: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  jsonText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'monospace',
  },
  recommendation: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default AuthTokenDebugger;