import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import NotificationPermissions, { PermissionStatus } from '@/services/notificationPermissions';
import PushTokenService from '@/services/pushTokenService';

const NotificationPermissionTest: React.FC = () => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deviceSupported, setDeviceSupported] = useState<boolean | null>(null);

  const permissionService = NotificationPermissions.getInstance();
  const pushTokenService = PushTokenService.getInstance();

  useEffect(() => {
    checkInitialStatus();
  }, []);

  const checkInitialStatus = async () => {
    setIsLoading(true);
    try {
      // Check device support
      const support = await permissionService.isDeviceSupported();
      setDeviceSupported(support.supported);

      if (support.supported) {
        // Get current permission status
        const status = await permissionService.getPermissionStatus();
        setPermissionStatus(status);
      }
    } catch (error) {
      console.error('Error checking initial status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPermissions = async () => {
    setIsLoading(true);
    try {
      console.log('🔔 User requested permissions...');
      const status = await permissionService.requestPermissions(true);
      setPermissionStatus(status);
      
      if (status.granted) {
        Alert.alert(
          'Success! 🎉',
          'Notifications are now enabled. You will receive alerts when materials are added or used.',
          [{ text: 'Great!' }]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request permissions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestFullSetup = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing full push notification setup...');
      
      // Test the complete flow
      const success = await pushTokenService.initialize(true);
      
      if (success) {
        Alert.alert(
          'Setup Complete! ✅',
          'Push notifications are fully configured and working. You will now receive notifications when materials are added or used.',
          [{ text: 'Awesome!' }]
        );
        
        // Refresh status
        await checkInitialStatus();
      } else {
        Alert.alert(
          'Setup Failed ❌',
          'There was an issue setting up push notifications. Please check the console logs for details.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error testing full setup:', error);
      Alert.alert('Error', 'Failed to test setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPermissions = async () => {
    console.log('🧪 Running permission tests...');
    await permissionService.testPermissions();
    Alert.alert(
      'Test Complete',
      'Check the console logs for detailed test results.',
      [{ text: 'OK' }]
    );
  };

  const getStatusColor = () => {
    if (!deviceSupported) return '#FF4444';
    if (!permissionStatus) return '#888888';
    if (permissionStatus.granted) return '#00AA00';
    if (permissionStatus.canAskAgain) return '#FFA500';
    return '#FF4444';
  };

  const getStatusText = () => {
    if (!deviceSupported) return 'Not Supported';
    if (!permissionStatus) return 'Unknown';
    if (permissionStatus.granted) return 'Granted ✅';
    if (permissionStatus.canAskAgain) return 'Not Granted';
    return 'Denied Permanently';
  };

  if (isLoading && !permissionStatus) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Checking notification status...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔔 Notification Permissions</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Device Support:</Text>
        <Text style={[styles.statusValue, { color: deviceSupported ? '#00AA00' : '#FF4444' }]}>
          {deviceSupported ? 'Supported ✅' : 'Not Supported ❌'}
        </Text>
      </View>

      {deviceSupported && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Permission Status:</Text>
          <Text style={[styles.statusValue, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      )}

      {permissionStatus && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Details:</Text>
          <Text style={styles.detailsText}>Status: {permissionStatus.status}</Text>
          <Text style={styles.detailsText}>Can Ask Again: {permissionStatus.canAskAgain ? 'Yes' : 'No'}</Text>
          {permissionStatus.expires && (
            <Text style={styles.detailsText}>Expires: {permissionStatus.expires}</Text>
          )}
        </View>
      )}

      <View style={styles.buttonContainer}>
        {deviceSupported && !permissionStatus?.granted && permissionStatus?.canAskAgain && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleRequestPermissions}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Request Permissions</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleTestFullSetup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#007AFF" size="small" />
          ) : (
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Test Full Setup
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={handleTestPermissions}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, styles.testButtonText]}>
            Run Permission Tests
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.refreshButton]}
          onPress={checkInitialStatus}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, styles.refreshButtonText]}>
            Refresh Status
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>ℹ️ About Notifications</Text>
        <Text style={styles.infoText}>
          Push notifications let you receive real-time alerts when:
        </Text>
        <Text style={styles.infoText}>• Materials are added to projects</Text>
        <Text style={styles.infoText}>• Materials are used or transferred</Text>
        <Text style={styles.infoText}>• Important project updates occur</Text>
        <Text style={styles.infoText}>
          {'\n'}Notifications work even when the app is closed.
        </Text>
      </View>
    </View>
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
    marginBottom: 30,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  detailsText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  testButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#34C759',
  },
  refreshButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  testButtonText: {
    color: '#34C759',
  },
  refreshButtonText: {
    color: '#FF9500',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
});

export default NotificationPermissionTest;