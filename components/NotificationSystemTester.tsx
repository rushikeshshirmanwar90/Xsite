import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import NotificationManager from '@/services/notificationManager';
import NotificationPermissions from '@/services/notificationPermissions';
import PushTokenService from '@/services/pushTokenService';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  details?: any;
}

const NotificationSystemTester: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Device Support', status: 'pending' },
    { name: 'Permission Status', status: 'pending' },
    { name: 'Setup Status', status: 'pending' },
    { name: 'Push Token Registration', status: 'pending' },
    { name: 'Complete System', status: 'pending' },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const notificationManager = NotificationManager.getInstance();
  const permissionService = NotificationPermissions.getInstance();
  const pushTokenService = PushTokenService.getInstance();

  useEffect(() => {
    runInitialTests();
  }, []);

  const updateTest = (name: string, status: TestResult['status'], message?: string, details?: any) => {
    setTests(prev => prev.map(test => 
      test.name === name 
        ? { ...test, status, message, details }
        : test
    ));
  };

  const runInitialTests = async () => {
    try {
      // Test device support
      updateTest('Device Support', 'running');
      const deviceSupport = await permissionService.isDeviceSupported();
      updateTest('Device Support', deviceSupport.supported ? 'success' : 'error', 
        deviceSupport.supported ? 'Device supports notifications' : deviceSupport.reason,
        deviceSupport
      );

      // Test permission status
      updateTest('Permission Status', 'running');
      const permissionStatus = await permissionService.getPermissionStatus();
      updateTest('Permission Status', permissionStatus.granted ? 'success' : 'error',
        `Status: ${permissionStatus.status}`,
        permissionStatus
      );

      // Test setup status
      updateTest('Setup Status', 'running');
      const setupStatus = await notificationManager.getSetupStatus();
      updateTest('Setup Status', setupStatus.result === 'success' ? 'success' : 'error',
        `Result: ${setupStatus.result || 'Not attempted'}`,
        setupStatus
      );

      // Test push token registration
      updateTest('Push Token Registration', 'running');
      const isTokenRegistered = await pushTokenService.isTokenRegistered();
      updateTest('Push Token Registration', isTokenRegistered ? 'success' : 'error',
        isTokenRegistered ? 'Token is registered' : 'No token registered',
        { isTokenRegistered }
      );

      // Test complete system
      updateTest('Complete System', 'running');
      const isFullySetup = await notificationManager.isFullySetup();
      updateTest('Complete System', isFullySetup ? 'success' : 'error',
        isFullySetup ? 'System fully operational' : 'System needs setup',
        { isFullySetup }
      );

    } catch (error) {
      console.error('Error running initial tests:', error);
    }
  };

  const handleRequestPermissions = async () => {
    setIsRunning(true);
    try {
      updateTest('Permission Status', 'running', 'Requesting permissions...');
      
      const status = await permissionService.requestPermissions(true);
      
      updateTest('Permission Status', status.granted ? 'success' : 'error',
        `Status: ${status.status}`,
        status
      );

      if (status.granted) {
        Alert.alert(
          'Success! 🎉',
          'Notification permissions granted! You can now receive push notifications.',
          [{ text: 'Great!' }]
        );
        
        // Re-run tests
        setTimeout(() => runInitialTests(), 1000);
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request permissions');
    } finally {
      setIsRunning(false);
    }
  };

  const handleInitializeSystem = async () => {
    setIsRunning(true);
    try {
      Alert.alert(
        'Initialize Notifications',
        'This will attempt to set up the complete notification system including permissions and push token registration.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Initialize',
            onPress: async () => {
              const success = await notificationManager.initializePushNotifications(true);
              
              if (success) {
                Alert.alert(
                  'Success! ✅',
                  'Notification system initialized successfully! You will now receive push notifications.',
                  [{ text: 'Awesome!' }]
                );
              } else {
                Alert.alert(
                  'Setup Failed ❌',
                  'Failed to initialize the notification system. Check the test results for details.',
                  [{ text: 'OK' }]
                );
              }
              
              // Re-run tests
              setTimeout(() => runInitialTests(), 1000);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error initializing system:', error);
      Alert.alert('Error', 'Failed to initialize notification system');
    } finally {
      setIsRunning(false);
    }
  };

  const handleResetSystem = async () => {
    Alert.alert(
      'Reset Notification System',
      'This will reset all notification settings and allow you to set up notifications again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await notificationManager.resetSetupStatus();
            Alert.alert('Reset Complete', 'Notification system has been reset.');
            setTimeout(() => runInitialTests(), 500);
          }
        }
      ]
    );
  };

  const handleTestSystem = async () => {
    setIsRunning(true);
    try {
      console.log('🧪 Running complete system test...');
      await notificationManager.testSystem();
      Alert.alert(
        'Test Complete',
        'System test completed. Check the console logs for detailed results.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error testing system:', error);
      Alert.alert('Error', 'Failed to test system');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '#00AA00';
      case 'error': return '#FF4444';
      case 'running': return '#FFA500';
      default: return '#888888';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔔 Notification System Tester</Text>
      
      <View style={styles.testsContainer}>
        <Text style={styles.sectionTitle}>System Status</Text>
        {tests.map((test, index) => (
          <View key={index} style={styles.testItem}>
            <View style={styles.testHeader}>
              <Text style={styles.testIcon}>{getStatusIcon(test.status)}</Text>
              <Text style={styles.testName}>{test.name}</Text>
              {test.status === 'running' && (
                <ActivityIndicator size="small" color="#FFA500" />
              )}
            </View>
            {test.message && (
              <Text style={[styles.testMessage, { color: getStatusColor(test.status) }]}>
                {test.message}
              </Text>
            )}
          </View>
        ))}
      </View>

      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleRequestPermissions}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Request Permissions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.successButton]}
          onPress={handleInitializeSystem}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Initialize Complete System</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleTestSystem}
          disabled={isRunning}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Run System Test
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={runInitialTests}
          disabled={isRunning}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Refresh Status
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleResetSystem}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Reset System</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>ℹ️ How to Use</Text>
        <Text style={styles.infoText}>
          1. Check the system status above{'\n'}
          2. If permissions are not granted, tap "Request Permissions"{'\n'}
          3. For complete setup, tap "Initialize Complete System"{'\n'}
          4. Use "Run System Test" to check console logs{'\n'}
          5. Use "Reset System" if you need to start over
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  testsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  testItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  testName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  testMessage: {
    fontSize: 14,
    marginTop: 4,
    marginLeft: 24,
  },
  actionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  successButton: {
    backgroundColor: '#34C759',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
});

export default NotificationSystemTester;