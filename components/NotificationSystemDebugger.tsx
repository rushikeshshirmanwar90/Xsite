import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationManager from '@/services/notificationManager';
import NotificationPermissions from '@/services/notificationPermissions';
import PushTokenService from '@/services/pushTokenService';

interface DebugInfo {
  timestamp: string;
  userLoggedIn: boolean;
  deviceSupported: boolean;
  permissionStatus: any;
  setupStatus: any;
  pushTokenRegistered: boolean;
  currentToken: string | null;
  storageKeys: string[];
}

export default function NotificationSystemDebugger() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const notificationManager = NotificationManager.getInstance();
  const permissionService = NotificationPermissions.getInstance();
  const pushTokenService = PushTokenService.getInstance();

  const collectDebugInfo = async (): Promise<DebugInfo> => {
    // Check user login status
    const userDetails = await AsyncStorage.getItem("user");
    const userLoggedIn = !!userDetails && userDetails !== 'null' && userDetails !== '';

    // Check device support
    const deviceSupport = await permissionService.isDeviceSupported();
    const deviceSupported = deviceSupport.supported;

    // Check permission status
    const permissionStatus = await permissionService.getPermissionStatus();

    // Check setup status
    const setupStatus = await notificationManager.getSetupStatus();

    // Check push token registration
    const pushTokenRegistered = await pushTokenService.isTokenRegistered();
    const currentToken = pushTokenService.getCurrentToken();

    // Get all storage keys
    const storageKeys = await AsyncStorage.getAllKeys();

    return {
      timestamp: new Date().toISOString(),
      userLoggedIn,
      deviceSupported,
      permissionStatus,
      setupStatus,
      pushTokenRegistered,
      currentToken,
      storageKeys: storageKeys.filter(key => 
        key.includes('notification') || 
        key.includes('push') || 
        key.includes('user') ||
        key.includes('login')
      )
    };
  };

  const refreshDebugInfo = async () => {
    setLoading(true);
    try {
      const info = await collectDebugInfo();
      setDebugInfo(info);
    } catch (error) {
      console.error('Error collecting debug info:', error);
    } finally {
      setLoading(false);
    }
  };

  const testPermissionRequest = async () => {
    try {
      console.log('🧪 Testing permission request...');
      const result = await permissionService.requestPermissions(true);
      console.log('🧪 Permission result:', result);
      Alert.alert(
        'Permission Test Result',
        `Granted: ${result.granted}\nStatus: ${result.status}\nCan Ask Again: ${result.canAskAgain}`,
        [{ text: 'OK' }]
      );
      await refreshDebugInfo();
    } catch (error) {
      console.error('Permission test error:', error);
      Alert.alert('Error', 'Permission test failed: ' + error.message);
    }
  };

  const testNotificationInitialization = async () => {
    try {
      console.log('🧪 Testing notification initialization...');
      const result = await notificationManager.initializePushNotifications(true);
      console.log('🧪 Initialization result:', result);
      Alert.alert(
        'Initialization Test Result',
        `Success: ${result}`,
        [{ text: 'OK' }]
      );
      await refreshDebugInfo();
    } catch (error) {
      console.error('Initialization test error:', error);
      Alert.alert('Error', 'Initialization test failed: ' + error.message);
    }
  };

  const clearAllNotificationData = async () => {
    try {
      console.log('🧹 Clearing all notification data...');
      await notificationManager.clearAllNotificationData();
      await notificationManager.resetSetupStatus();
      Alert.alert('Success', 'All notification data cleared');
      await refreshDebugInfo();
    } catch (error) {
      console.error('Clear data error:', error);
      Alert.alert('Error', 'Failed to clear data: ' + error.message);
    }
  };

  const testCompleteSystem = async () => {
    try {
      console.log('🧪 Testing complete notification system...');
      await notificationManager.testSystem();
      Alert.alert('Test Complete', 'Check console for detailed results');
      await refreshDebugInfo();
    } catch (error) {
      console.error('System test error:', error);
      Alert.alert('Error', 'System test failed: ' + error.message);
    }
  };

  useEffect(() => {
    refreshDebugInfo();
  }, []);

  const getStatusColor = (status: boolean | string) => {
    if (typeof status === 'boolean') {
      return status ? '#22c55e' : '#ef4444';
    }
    if (status === 'granted' || status === 'success') {
      return '#22c55e';
    }
    return '#ef4444';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notification System Debugger</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={refreshDebugInfo}
          disabled={loading}
        >
          <Text style={styles.refreshButtonText}>
            {loading ? 'Loading...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      {debugInfo && (
        <View style={styles.debugInfo}>
          <Text style={styles.timestamp}>Last Updated: {new Date(debugInfo.timestamp).toLocaleString()}</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Status</Text>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>User Logged In:</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(debugInfo.userLoggedIn) }]}>
                {debugInfo.userLoggedIn ? 'Yes' : 'No'}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Device Supported:</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(debugInfo.deviceSupported) }]}>
                {debugInfo.deviceSupported ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Permission Status</Text>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Granted:</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(debugInfo.permissionStatus.granted) }]}>
                {debugInfo.permissionStatus.granted ? 'Yes' : 'No'}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(debugInfo.permissionStatus.status) }]}>
                {debugInfo.permissionStatus.status}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Can Ask Again:</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(debugInfo.permissionStatus.canAskAgain) }]}>
                {debugInfo.permissionStatus.canAskAgain ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Setup Status</Text>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Checked:</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(debugInfo.setupStatus.checked) }]}>
                {debugInfo.setupStatus.checked ? 'Yes' : 'No'}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Result:</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(debugInfo.setupStatus.result) }]}>
                {debugInfo.setupStatus.result || 'None'}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Can Retry:</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(debugInfo.setupStatus.canRetry) }]}>
                {debugInfo.setupStatus.canRetry ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Push Token</Text>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Registered:</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(debugInfo.pushTokenRegistered) }]}>
                {debugInfo.pushTokenRegistered ? 'Yes' : 'No'}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Current Token:</Text>
              <Text style={styles.tokenText}>
                {debugInfo.currentToken ? debugInfo.currentToken.substring(0, 30) + '...' : 'None'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Storage Keys ({debugInfo.storageKeys.length})</Text>
            {debugInfo.storageKeys.map((key, index) => (
              <Text key={index} style={styles.storageKey}>{key}</Text>
            ))}
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={testPermissionRequest}>
          <Text style={styles.actionButtonText}>Test Permission Request</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={testNotificationInitialization}>
          <Text style={styles.actionButtonText}>Test Initialization</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={testCompleteSystem}>
          <Text style={styles.actionButtonText}>Test Complete System</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={clearAllNotificationData}>
          <Text style={styles.actionButtonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  debugInfo: {
    padding: 16,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  tokenText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    flex: 2,
    textAlign: 'right',
  },
  storageKey: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  actions: {
    padding: 16,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});