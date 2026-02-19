import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useAuth } from '@/contexts/AuthContext';

const AuthDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const runDebug = async () => {
    setIsLoading(true);
    try {
      // Get all AsyncStorage keys
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Check specific auth keys
      const authKeys = ['auth_token', 'userToken', 'accessToken', 'authToken', 'token', 'user'];
      const authData: any = {};
      
      for (const key of authKeys) {
        const value = await AsyncStorage.getItem(key);
        authData[key] = value ? {
          exists: true,
          length: value.length,
          preview: value.substring(0, 50) + '...',
          isJWT: value.includes('.')
        } : { exists: false };
      }
      
      // Check Constants
      const constantsInfo = {
        executionEnvironment: Constants.executionEnvironment,
        expoConfig: !!Constants.expoConfig,
        manifest: !!Constants.manifest,
        manifest2: !!Constants.manifest2,
        projectId: Constants.expoConfig?.extra?.eas?.projectId || 
                   Constants.manifest?.extra?.eas?.projectId ||
                   Constants.manifest2?.extra?.eas?.projectId,
        expoConfigExtra: Constants.expoConfig?.extra,
        manifestExtra: Constants.manifest?.extra,
        manifest2Extra: Constants.manifest2?.extra
      };
      
      setDebugInfo({
        allKeys,
        authData,
        constantsInfo,
        user: user ? {
          hasUser: true,
          userId: user._id,
          email: user.email,
          userType: user.role || user.userType,
          hasToken: !!user.token
        } : { hasUser: false },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      Alert.alert('Debug Error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will clear all AsyncStorage data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'All data cleared');
              setDebugInfo(null);
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Auth & Config Debugger</Text>
      
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runDebug}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Debugging...' : 'Run Debug'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={clearAllData}
        >
          <Text style={styles.buttonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      {debugInfo && (
        <ScrollView style={styles.results}>
          <Text style={styles.sectionTitle}>🔐 Authentication Data</Text>
          {Object.entries(debugInfo.authData).map(([key, value]: [string, any]) => (
            <View key={key} style={styles.item}>
              <Text style={styles.itemKey}>{key}:</Text>
              <Text style={[styles.itemValue, value.exists ? styles.success : styles.error]}>
                {value.exists ? `✅ ${value.length} chars (JWT: ${value.isJWT})` : '❌ Not found'}
              </Text>
              {value.exists && (
                <Text style={styles.preview}>{value.preview}</Text>
              )}
            </View>
          ))}

          <Text style={styles.sectionTitle}>👤 User Context</Text>
          <View style={styles.item}>
            <Text style={styles.itemKey}>User Status:</Text>
            <Text style={[styles.itemValue, debugInfo.user.hasUser ? styles.success : styles.error]}>
              {debugInfo.user.hasUser ? '✅ Authenticated' : '❌ Not authenticated'}
            </Text>
          </View>
          {debugInfo.user.hasUser && (
            <>
              <View style={styles.item}>
                <Text style={styles.itemKey}>User ID:</Text>
                <Text style={styles.itemValue}>{debugInfo.user.userId}</Text>
              </View>
              <View style={styles.item}>
                <Text style={styles.itemKey}>Email:</Text>
                <Text style={styles.itemValue}>{debugInfo.user.email}</Text>
              </View>
              <View style={styles.item}>
                <Text style={styles.itemKey}>User Type:</Text>
                <Text style={styles.itemValue}>{debugInfo.user.userType}</Text>
              </View>
              <View style={styles.item}>
                <Text style={styles.itemKey}>Has Token:</Text>
                <Text style={[styles.itemValue, debugInfo.user.hasToken ? styles.success : styles.error]}>
                  {debugInfo.user.hasToken ? '✅ Yes' : '❌ No'}
                </Text>
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>⚙️ Constants & Config</Text>
          <View style={styles.item}>
            <Text style={styles.itemKey}>Execution Environment:</Text>
            <Text style={styles.itemValue}>{debugInfo.constantsInfo.executionEnvironment}</Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.itemKey}>Project ID:</Text>
            <Text style={[styles.itemValue, debugInfo.constantsInfo.projectId ? styles.success : styles.error]}>
              {debugInfo.constantsInfo.projectId || '❌ Not found'}
            </Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.itemKey}>ExpoConfig:</Text>
            <Text style={[styles.itemValue, debugInfo.constantsInfo.expoConfig ? styles.success : styles.error]}>
              {debugInfo.constantsInfo.expoConfig ? '✅ Available' : '❌ Not available'}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>📋 All Storage Keys</Text>
          <Text style={styles.keysList}>
            {debugInfo.allKeys.join(', ')}
          </Text>

          <Text style={styles.timestamp}>
            Debug run at: {debugInfo.timestamp}
          </Text>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
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
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  results: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  item: {
    marginBottom: 8,
  },
  itemKey: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  itemValue: {
    fontSize: 14,
    marginTop: 2,
  },
  preview: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  success: {
    color: '#34C759',
  },
  error: {
    color: '#FF3B30',
  },
  keysList: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});

export default AuthDebugger;