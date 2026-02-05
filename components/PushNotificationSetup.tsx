import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface PushNotificationSetupProps {
  onSetupComplete?: (success: boolean) => void;
  showTestButton?: boolean;
}

const PushNotificationSetup: React.FC<PushNotificationSetupProps> = ({
  onSetupComplete,
  showTestButton = true,
}) => {
  const {
    isInitialized,
    isRegistered,
    hasPermission,
    token,
    error,
    isLoading,
    initialize,
    reregister,
    unregister,
    test,
  } = usePushNotifications();

  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (onSetupComplete) {
      onSetupComplete(isInitialized && isRegistered);
    }
  }, [isInitialized, isRegistered, onSetupComplete]);

  const handleInitialize = async () => {
    const success = await initialize();
    if (success) {
      Alert.alert(
        'Success',
        'Push notifications have been set up successfully! You will now receive notifications when materials are added or used.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Setup Failed',
        'Failed to set up push notifications. Please check your device settings and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleReregister = async () => {
    const success = await reregister();
    if (success) {
      Alert.alert('Success', 'Push token re-registered successfully!');
    } else {
      Alert.alert('Error', 'Failed to re-register push token.');
    }
  };

  const handleUnregister = async () => {
    Alert.alert(
      'Unregister Push Notifications',
      'Are you sure you want to stop receiving push notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unregister',
          style: 'destructive',
          onPress: async () => {
            const success = await unregister();
            if (success) {
              Alert.alert('Success', 'Push notifications have been disabled.');
            } else {
              Alert.alert('Error', 'Failed to unregister push notifications.');
            }
          },
        },
      ]
    );
  };

  const handleTest = async () => {
    await test();
    Alert.alert(
      'Test Complete',
      'Check the console logs for detailed test results.',
      [{ text: 'OK' }]
    );
  };

  const getStatusColor = () => {
    if (isLoading) return '#FFA500'; // Orange
    if (error) return '#FF4444'; // Red
    if (isInitialized && isRegistered) return '#00AA00'; // Green
    return '#888888'; // Gray
  };

  const getStatusText = () => {
    if (isLoading) return 'Setting up...';
    if (error) return 'Setup failed';
    if (isInitialized && isRegistered) return 'Active';
    if (isInitialized && !isRegistered) return 'Not registered';
    return 'Not set up';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Push Notifications</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Enable push notifications to receive real-time alerts when materials are added, used, or transferred in your projects.
        </Text>
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Initialized:</Text>
          <Text style={[styles.statusValue, { color: isInitialized ? '#00AA00' : '#FF4444' }]}>
            {isInitialized ? 'Yes' : 'No'}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Registered:</Text>
          <Text style={[styles.statusValue, { color: isRegistered ? '#00AA00' : '#FF4444' }]}>
            {isRegistered ? 'Yes' : 'No'}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Permission:</Text>
          <Text style={[styles.statusValue, { color: hasPermission ? '#00AA00' : '#FF4444' }]}>
            {hasPermission ? 'Granted' : 'Not granted'}
          </Text>
        </View>

        {token && (
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => setShowDetails(!showDetails)}
          >
            <Text style={styles.detailsButtonText}>
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Text>
          </TouchableOpacity>
        )}

        {showDetails && token && (
          <View style={styles.tokenContainer}>
            <Text style={styles.tokenLabel}>Push Token:</Text>
            <Text style={styles.tokenText}>{token.substring(0, 50)}...</Text>
          </View>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        {!isInitialized && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleInitialize}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Set Up Push Notifications</Text>
            )}
          </TouchableOpacity>
        )}

        {isInitialized && !isRegistered && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleReregister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Register Push Token</Text>
            )}
          </TouchableOpacity>
        )}

        {isInitialized && isRegistered && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleReregister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#007AFF" size="small" />
            ) : (
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Re-register Token
              </Text>
            )}
          </TouchableOpacity>
        )}

        {isInitialized && (
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleUnregister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Disable Notifications</Text>
          </TouchableOpacity>
        )}

        {showTestButton && (
          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={handleTest}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, styles.testButtonText]}>Test Setup</Text>
          </TouchableOpacity>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  statusContainer: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
  detailsButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  tokenContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#F8F8F8',
    borderRadius: 6,
  },
  tokenLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 5,
  },
  tokenText: {
    fontSize: 10,
    color: '#333333',
    fontFamily: 'monospace',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
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
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  testButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#34C759',
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
});

export default PushNotificationSetup;