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
import { domain } from '@/lib/domain';

const NotificationDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { isInitialized, sendProjectNotification } = useSimpleNotifications();

  const runDiagnostics = async () => {
    setIsLoading(true);
    const info: any = {};

    try {
      // 1. Check user authentication
      info.user = {
        isLoggedIn: !!user,
        userId: user?._id,
        userType: user?.role || user?.userType,
        name: user?.firstName || user?.name,
      };

      // 2. Check notification permissions
      const { status } = await Notifications.getPermissionsAsync();
      info.permissions = {
        status,
        granted: status === 'granted',
      };

      // 3. Check notification service
      const service = SimpleNotificationService.getInstance();
      info.service = {
        isInitialized,
        hasToken: !!service.getCurrentToken(),
        token: service.getCurrentToken()?.substring(0, 20) + '...',
      };

      // 4. Test API connectivity
      try {
        const response = await fetch(`${domain}/api/simple-push-token`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        info.apiConnectivity = {
          status: response.status,
          reachable: response.ok,
        };
      } catch (error) {
        info.apiConnectivity = {
          status: 'error',
          reachable: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }

      // 5. Check notification channels (Android)
      try {
        const channels = await Notifications.getNotificationChannelsAsync();
        info.channels = channels.map(channel => ({
          id: channel.id,
          name: channel.name,
          importance: channel.importance,
        }));
      } catch (error) {
        info.channels = 'Not available or error';
      }

      setDebugInfo(info);
    } catch (error) {
      console.error('❌ Diagnostics error:', error);
      Alert.alert('Error', 'Failed to run diagnostics');
    } finally {
      setIsLoading(false);
    }
  };

  const testMaterialNotification = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in first');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🧪 Testing material notification...');
      
      const result = await sendProjectNotification({
        projectId: 'test-project-123',
        activityType: 'material_added',
        staffName: user.firstName || user.name || 'Test User',
        projectName: 'Test Project',
        details: 'Added 10 bags of cement (₹5,000)',
        recipientType: 'admins',
      });

      Alert.alert(
        'Test Result',
        result ? 'Notification sent successfully!' : 'Notification failed to send',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Test notification error:', error);
      Alert.alert('Error', 'Test notification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testLocalNotification = async () => {
    setIsLoading(true);
    try {
      const service = SimpleNotificationService.getInstance();
      await service.scheduleLocalNotification(
        'Test Local Notification',
        'This is a test local notification with sound and navigation',
        { route: 'notification', test: true }
      );
      Alert.alert('Success', 'Local notification scheduled!');
    } catch (error) {
      console.error('❌ Local notification error:', error);
      Alert.alert('Error', 'Local notification failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔧 Notification Debugger</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 System Status</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>User Authentication</Text>
          <Text style={styles.infoText}>
            Logged In: {debugInfo.user?.isLoggedIn ? '✅' : '❌'}{'\n'}
            User ID: {debugInfo.user?.userId || 'N/A'}{'\n'}
            User Type: {debugInfo.user?.userType || 'N/A'}{'\n'}
            Name: {debugInfo.user?.name || 'N/A'}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Notification Permissions</Text>
          <Text style={styles.infoText}>
            Status: {debugInfo.permissions?.status || 'Unknown'}{'\n'}
            Granted: {debugInfo.permissions?.granted ? '✅' : '❌'}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Notification Service</Text>
          <Text style={styles.infoText}>
            Initialized: {debugInfo.service?.isInitialized ? '✅' : '❌'}{'\n'}
            Has Token: {debugInfo.service?.hasToken ? '✅' : '❌'}{'\n'}
            Token: {debugInfo.service?.token || 'N/A'}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>API Connectivity</Text>
          <Text style={styles.infoText}>
            Status: {debugInfo.apiConnectivity?.status || 'Unknown'}{'\n'}
            Reachable: {debugInfo.apiConnectivity?.reachable ? '✅' : '❌'}{'\n'}
            {debugInfo.apiConnectivity?.error && `Error: ${debugInfo.apiConnectivity.error}`}
          </Text>
        </View>

        {debugInfo.channels && (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Notification Channels</Text>
            <Text style={styles.infoText}>
              {Array.isArray(debugInfo.channels) 
                ? debugInfo.channels.map(ch => `${ch.id}: ${ch.name}`).join('\n')
                : debugInfo.channels}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧪 Test Functions</Text>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runDiagnostics}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Running...' : '🔄 Refresh Diagnostics'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testLocalNotification}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            📱 Test Local Notification
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testMaterialNotification}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            📦 Test Material Notification
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Troubleshooting Tips</Text>
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>
            1. Make sure you're logged in{'\n'}
            2. Check notification permissions{'\n'}
            3. Ensure API connectivity{'\n'}
            4. Test local notifications first{'\n'}
            5. Check device battery optimization settings{'\n'}
            6. Verify app is not in background restrictions
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
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
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  tipBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  tipText: {
    fontSize: 14,
    color: '#92400E',
  },
});

export default NotificationDebugger;