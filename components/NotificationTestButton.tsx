import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { SimpleNotificationService } from '@/services/SimpleNotificationService';

const NotificationTestButton: React.FC = () => {
  const notificationService = SimpleNotificationService.getInstance();

  const testNotification = async () => {
    try {
      // Test local notification
      await notificationService.scheduleLocalNotification(
        'Test Notification',
        'This is a test notification from your app!',
        { test: true }
      );

      Alert.alert('Success', 'Test notification scheduled!');
    } catch (error) {
      console.error('Test notification error:', error);
      Alert.alert('Error', 'Failed to schedule test notification');
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={testNotification}>
      <Text style={styles.buttonText}>Test Notification</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2E72F0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    margin: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default NotificationTestButton;