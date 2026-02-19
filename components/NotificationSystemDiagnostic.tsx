import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSimpleNotifications } from '@/hooks/useSimpleNotifications';
import SimpleNotificationService from '@/services/SimpleNotificationService';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { domain } from '@/lib/domain';

const NotificationSystemDiagnostic: React.FC = () => {
  const [diagnosticResults, setDiagnosticResults] = useState<any>({});
  const [isRunning, setIsRunning] = useState(false);
  const { user, isAuthenticated, clientId } = useAuth();
  const { isInitialized, isLoading, sendProjectNotification } = useSimpleNotifications();

  const runCompleteDiagnostic = async () => {
    setIsRunning(true);
    const results: any = {};

    try {
      console.log('🔍 === STARTING COMPLETE NOTIFICATION DIAGNOSTIC ===');

      // 1. Check Authentication State
      results.auth = {
        isAuthenticated,
        hasUser: !!user,
        userId: user?._id,
        userEmail: user?.email,
        userRole: user?.role || user?.userType,
        clientId,
        userClients: user?.clients?.length || 0,
        userProjects: user?.assignedProjects?.length || 0,
      };
      console.log('👤 Auth State:', results.auth);

      // 2. Check Notification Permissions
      const { status } = await Notifications.getPermissionsAsync();
      results.permissions = {
        status,
        granted: status === 'granted',
      };
      console.log('🔐 Permissions:', results.permissions);

      // 3. Check Notification Service State
      const service = SimpleNotificationService.getInstance();
      results.service = {
        hasToken: !!service.getCurrentToken(),
        token: service.getCurrentToken()?.substring(0, 30) + '...',
        isInitialized,
        isLoading,
      };
      console.log('🔔 Service State:', results.service);

      // 4. Check AsyncStorage Data
      const storageKeys = [
        'user', 'pushTokenRegistered', 'registeredClientId',
        'pushToken', 'clientId', 'isAuthenticated'
      ];
      
      results.storage = {};
      for (const key of storageKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          results.storage[key] = value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : null;
        } catch (error) {
          results.storage[key] = `Error: ${error}`;
        }
      }
      console.log('💾 Storage Data:', results.storage);

      // 5. Test API Connectivity
      try {
        const response = await fetch(`${domain}/api/simple-push-token`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        results.apiConnectivity = {
          status: response.status,
          reachable: response.ok,
          url: `${domain}/api/simple-push-token`,
        };
      } catch (error) {
        results.apiConnectivity = {
          status: 'error',
          reachable: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          url: `${domain}/api/simple-push-token`,
        };
      }
      console.log('🌐 API Connectivity:', results.apiConnectivity);

      // 6. Check Notification Channels (Android)
      try {
        const channels = await Notifications.getNotificationChannelsAsync();
        results.channels = channels.map(channel => ({
          id: channel.id,
          name: channel.name,
          importance: channel.importance,
        }));
      } catch (error) {
        results.channels = 'Not available or error';
      }
      console.log('📺 Channels:', results.channels);

      // 7. Test Token Generation
      try {
        const service = SimpleNotificationService.getInstance();
        const token = await service.getCurrentToken();
        results.tokenTest = {
          hasToken: !!token,
          tokenLength: token?.length || 0,
          tokenPrefix: token?.substring(0, 20) || 'None',
        };
      } catch (error) {
        results.tokenTest = {
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
      console.log('🎫 Token Test:', results.tokenTest);

      // 8. Extract ClientId from User Data
      let extractedClientId = null;
      if (user?.clients && user.clients.length > 0) {
        extractedClientId = user.clients[0].clientId;
      } else if (user?.role === 'client' || user?.userType === 'client') {
        extractedClientId = user._id;
      } else if (user?.assignedProjects && user.assignedProjects.length > 0) {
        extractedClientId = user.assignedProjects[0].clientId;
      }

      results.clientIdExtraction = {
        fromAuthContext: clientId,
        extractedFromUser: extractedClientId,
        userHasClients: !!user?.clients?.length,
        userHasProjects: !!user?.assignedProjects?.length,
        userIsClient: user?.role === 'client' || user?.userType === 'client',
      };
      console.log('🏢 ClientId Extraction:', results.clientIdExtraction);

      setDiagnosticResults(results);
      console.log('✅ === DIAGNOSTIC COMPLETE ===');

    } catch (error) {
      console.error('❌ Diagnostic error:', error);
      results.error = error instanceof Error ? error.message : 'Unknown error';
      setDiagnosticResults(results);
    } finally {
      setIsRunning(false);
    }
  };

  const testMaterialNotification = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in first');
      return;
    }

    setIsRunning(true);
    try {
      console.log('🧪 Testing material notification with full diagnostic...');
      
      // Extract clientId
      let clientId = null;
      if (user?.clients && user.clients.length > 0) {
        clientId = user.clients[0].clientId;
      } else if (user?.role === 'client' || user?.userType === 'client') {
        clientId = user._id;
      }

      console.log('🧪 Test notification data:', {
        projectId: 'test-project-123',
        staffId: user._id,
        clientId,
        staffName: user.firstName || user.name || 'Test User',
      });

      // ✅ Use the hook that's already initialized at component level
      const result = await sendProjectNotification({
        projectId: 'test-project-123',
        activityType: 'material_added',
        staffName: user.firstName || user.name || 'Test User',
        projectName: 'Test Project',
        details: 'Added 10 bags of cement (₹5,000) - DIAGNOSTIC TEST',
        recipientType: 'admins',
        staffId: user._id,
        clientId,
      });

      Alert.alert(
        'Test Result',
        result ? 'Notification sent successfully!' : 'Notification failed to send',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Test notification error:', error);
      Alert.alert('Error', `Test notification failed: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const testLocalNotification = async () => {
    setIsRunning(true);
    try {
      const service = SimpleNotificationService.getInstance();
      await service.scheduleLocalNotification(
        'Diagnostic Test',
        'This is a diagnostic test notification with sound and navigation',
        { route: 'notification', test: true, diagnostic: true }
      );
      Alert.alert('Success', 'Local notification scheduled!');
    } catch (error) {
      console.error('❌ Local notification error:', error);
      Alert.alert('Error', 'Local notification failed');
    } finally {
      setIsRunning(false);
    }
  };

  const reinitializeNotifications = async () => {
    setIsRunning(true);
    try {
      console.log('🔄 Reinitializing notification system...');
      
      const service = SimpleNotificationService.getInstance();
      
      // Clear old data
      await AsyncStorage.removeItem('pushTokenRegistered');
      await AsyncStorage.removeItem('registeredClientId');
      
      // Reinitialize
      const initialized = await service.initialize();
      if (initialized && user) {
        const registered = await service.registerToken(user);
        Alert.alert(
          'Reinitialization Result',
          registered ? 'Successfully reinitialized!' : 'Reinitialization failed'
        );
      } else {
        Alert.alert('Error', 'Failed to reinitialize');
      }
      
      // Refresh diagnostic
      await runCompleteDiagnostic();
    } catch (error) {
      console.error('❌ Reinitialize error:', error);
      Alert.alert('Error', 'Reinitialization failed');
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runCompleteDiagnostic();
  }, []);

  const getStatusIcon = (condition: boolean) => condition ? '✅' : '❌';
  const getStatusColor = (condition: boolean) => condition ? '#10B981' : '#EF4444';

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔧 Notification System Diagnostic</Text>

      {/* Quick Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Quick Status</Text>
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={[styles.statusIcon, { color: getStatusColor(diagnosticResults.auth?.isAuthenticated) }]}>
              {getStatusIcon(diagnosticResults.auth?.isAuthenticated)}
            </Text>
            <Text style={styles.statusLabel}>Authenticated</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={[styles.statusIcon, { color: getStatusColor(diagnosticResults.permissions?.granted) }]}>
              {getStatusIcon(diagnosticResults.permissions?.granted)}
            </Text>
            <Text style={styles.statusLabel}>Permissions</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={[styles.statusIcon, { color: getStatusColor(diagnosticResults.service?.hasToken) }]}>
              {getStatusIcon(diagnosticResults.service?.hasToken)}
            </Text>
            <Text style={styles.statusLabel}>Has Token</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={[styles.statusIcon, { color: getStatusColor(diagnosticResults.apiConnectivity?.reachable) }]}>
              {getStatusIcon(diagnosticResults.apiConnectivity?.reachable)}
            </Text>
            <Text style={styles.statusLabel}>API Reachable</Text>
          </View>
        </View>
      </View>

      {/* Detailed Results */}
      {Object.entries(diagnosticResults).map(([key, value]) => (
        <View key={key} style={styles.section}>
          <Text style={styles.sectionTitle}>{key.toUpperCase()}</Text>
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>
              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            </Text>
          </View>
        </View>
      ))}

      {/* Action Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧪 Test Actions</Text>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runCompleteDiagnostic}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Running...' : '🔄 Run Full Diagnostic'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testLocalNotification}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            📱 Test Local Notification
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testMaterialNotification}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            📦 Test Material Notification
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={reinitializeNotifications}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            🔄 Reinitialize System
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusItem: {
    alignItems: 'center',
    width: '22%',
    marginBottom: 10,
  },
  statusIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  resultBox: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  resultText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'monospace',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  testButton: {
    backgroundColor: '#10B981',
  },
  warningButton: {
    backgroundColor: '#F59E0B',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NotificationSystemDiagnostic;