import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NotificationManager from '@/services/notificationManager';
import NotificationPermissions from '@/services/notificationPermissions';
import PushTokenService from '@/services/pushTokenService';

export default function NotificationPermissionFixer() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('Ready to setup notifications');

  const notificationManager = NotificationManager.getInstance();
  const permissionService = NotificationPermissions.getInstance();
  const pushTokenService = PushTokenService.getInstance();

  const updateStatus = (message: string) => {
    setStatus(message);
    console.log('🔔 Status:', message);
  };

  const checkCurrentStatus = async () => {
    try {
      updateStatus('Checking current status...');
      
      const deviceSupport = await permissionService.isDeviceSupported();
      const permissionStatus = await permissionService.getPermissionStatus();
      const tokenRegistered = await pushTokenService.isTokenRegistered();
      const currentToken = pushTokenService.getCurrentToken();

      const statusInfo = {
        deviceSupported: deviceSupport.supported,
        deviceReason: deviceSupport.reason,
        permissionGranted: permissionStatus.granted,
        permissionStatus: permissionStatus.status,
        canAskAgain: permissionStatus.canAskAgain,
        tokenRegistered,
        hasCurrentToken: !!currentToken
      };

      console.log('📊 Current Status:', statusInfo);
      
      Alert.alert(
        'Current Notification Status',
        `Device Supported: ${deviceSupport.supported ? 'Yes' : 'No'}\n` +
        `Permissions: ${permissionStatus.granted ? 'Granted' : 'Not Granted'}\n` +
        `Can Ask Again: ${permissionStatus.canAskAgain ? 'Yes' : 'No'}\n` +
        `Token Registered: ${tokenRegistered ? 'Yes' : 'No'}\n` +
        `Has Token: ${currentToken ? 'Yes' : 'No'}`,
        [{ text: 'OK' }]
      );

      updateStatus('Status check complete');
    } catch (error) {
      console.error('❌ Error checking status:', error);
      updateStatus('Error checking status');
    }
  };

  const requestPermissionsOnly = async () => {
    try {
      setLoading(true);
      updateStatus('Requesting notification permissions...');

      const result = await permissionService.requestPermissions(true);
      
      if (result.granted) {
        updateStatus('✅ Permissions granted successfully!');
        Alert.alert('Success!', 'Notification permissions have been granted. You can now proceed to register push token.');
      } else {
        updateStatus(`❌ Permissions denied: ${result.status}`);
        
        if (!result.canAskAgain) {
          Alert.alert(
            'Permissions Denied',
            'You have permanently denied notification permissions. To enable them:\n\n1. Go to your device Settings\n2. Find this app\n3. Enable Notifications',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => {
                // This will be handled by the permission service
              }}
            ]
          );
        } else {
          Alert.alert('Permissions Denied', 'Notification permissions were not granted. You can try again later.');
        }
      }
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      updateStatus('Error requesting permissions');
      Alert.alert('Error', 'Failed to request permissions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const registerTokenOnly = async () => {
    try {
      setLoading(true);
      updateStatus('Registering push token...');

      // First check if we have permissions
      const permissionStatus = await permissionService.getPermissionStatus();
      if (!permissionStatus.granted) {
        Alert.alert('No Permissions', 'Please grant notification permissions first before registering token.');
        updateStatus('❌ No permissions for token registration');
        return;
      }

      // Initialize push token service
      const success = await pushTokenService.initialize(false); // Don't show permission dialog
      
      if (success) {
        updateStatus('✅ Push token registered successfully!');
        Alert.alert('Success!', 'Push token has been registered. Notifications should now work.');
      } else {
        updateStatus('❌ Failed to register push token');
        Alert.alert('Failed', 'Could not register push token. Check console for details.');
      }
    } catch (error) {
      console.error('❌ Error registering token:', error);
      updateStatus('Error registering token');
      Alert.alert('Error', 'Failed to register token: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const setupNotificationsComplete = async () => {
    try {
      setLoading(true);
      updateStatus('Setting up complete notification system...');

      // Clear any previous setup data to force fresh setup
      await notificationManager.clearAllNotificationData();
      await notificationManager.resetSetupStatus();
      
      updateStatus('Cleared previous setup data...');

      // Initialize complete notification system
      const success = await notificationManager.initializePushNotifications(true);
      
      if (success) {
        updateStatus('✅ Notification system setup complete!');
        Alert.alert(
          'Setup Complete! 🎉',
          'Notifications are now fully configured and should work properly.',
          [{ text: 'Great!' }]
        );
      } else {
        updateStatus('❌ Notification setup failed');
        
        // Get detailed status for debugging
        const setupStatus = await notificationManager.getSetupStatus();
        console.log('📊 Setup failure details:', setupStatus);
        
        Alert.alert(
          'Setup Failed',
          `Notification setup failed. Reason: ${setupStatus.result || 'Unknown'}\n\nCheck console for details.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Error setting up notifications:', error);
      updateStatus('Error during setup');
      Alert.alert('Error', 'Failed to setup notifications: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = async () => {
    try {
      setLoading(true);
      updateStatus('Clearing all notification data...');

      await notificationManager.clearAllNotificationData();
      await notificationManager.resetSetupStatus();
      
      updateStatus('✅ All notification data cleared');
      Alert.alert('Cleared', 'All notification data has been cleared. You can now start fresh.');
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      updateStatus('Error clearing data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="settings-outline" size={24} color="#3B82F6" />
        <Text style={styles.title}>Notification Permission Fixer</Text>
      </View>

      <Text style={styles.status}>{status}</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={checkCurrentStatus}
          disabled={loading}
        >
          <Ionicons name="information-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Check Current Status</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.successButton]} 
          onPress={setupNotificationsComplete}
          disabled={loading}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>
            {loading ? 'Setting Up...' : 'Complete Setup (Recommended)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.warningButton]} 
          onPress={requestPermissionsOnly}
          disabled={loading}
        >
          <Ionicons name="shield-checkmark-outline" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Request Permissions Only</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.warningButton]} 
          onPress={registerTokenOnly}
          disabled={loading}
        >
          <Ionicons name="key-outline" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Register Token Only</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.dangerButton]} 
          onPress={clearAllData}
          disabled={loading}
        >
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Instructions:</Text>
        <Text style={styles.instructionsText}>
          1. First, tap "Check Current Status" to see what's wrong{'\n'}
          2. Use "Complete Setup" to fix everything automatically{'\n'}
          3. If that fails, try individual steps{'\n'}
          4. "Clear All Data" if you need to start completely fresh
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  status: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  successButton: {
    backgroundColor: '#10B981',
  },
  warningButton: {
    backgroundColor: '#F59E0B',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  instructions: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
});