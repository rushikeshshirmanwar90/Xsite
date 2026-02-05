import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from './hooks/useNotifications';
import NotificationManager from './services/notificationManager';

const TestNotificationCrashFix: React.FC = () => {
  const { notifications, unreadCount, isLoading, error } = useNotifications();

  const testNotificationManager = async () => {
    try {
      console.log('🧪 Testing NotificationManager...');
      
      const notificationManager = NotificationManager.getInstance();
      
      // Test basic methods
      const currentNotifications = notificationManager.getNotifications();
      const currentUnreadCount = notificationManager.getUnreadCount();
      
      console.log('✅ NotificationManager working:');
      console.log('   Notifications:', currentNotifications.length);
      console.log('   Unread count:', currentUnreadCount);
      
      // Test adding a notification
      await notificationManager.addNotification({
        title: '🧪 Test Notification',
        body: 'This is a test notification to verify the system is working',
        data: { test: true },
        isRead: false,
        source: 'local'
      });
      
      console.log('✅ Test notification added successfully');
      
      Alert.alert(
        'Test Successful!',
        `NotificationManager is working correctly.\n\nNotifications: ${currentNotifications.length}\nUnread: ${currentUnreadCount}`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('❌ NotificationManager test failed:', error);
      Alert.alert(
        'Test Failed',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🔧 Notification Crash Fix Test</Text>
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Hook Status:</Text>
          {isLoading ? (
            <Text style={styles.statusLoading}>⏳ Loading...</Text>
          ) : error ? (
            <Text style={styles.statusError}>❌ Error: {error}</Text>
          ) : (
            <Text style={styles.statusSuccess}>✅ Loaded Successfully</Text>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{notifications.length}</Text>
            <Text style={styles.statLabel}>Total Notifications</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{unreadCount}</Text>
            <Text style={styles.statLabel}>Unread</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.testButton} onPress={testNotificationManager}>
          <Text style={styles.testButtonText}>🧪 Test NotificationManager</Text>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Fix Applied:</Text>
          <Text style={styles.infoText}>
            • Fixed async constructor issue{'\n'}
            • Added error handling to useNotifications hook{'\n'}
            • Added missing requestPermissions and getPushToken methods{'\n'}
            • Added loading and error states to notifications screen
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 32,
  },
  statusContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  statusLoading: {
    fontSize: 14,
    color: '#F59E0B',
  },
  statusError: {
    fontSize: 14,
    color: '#EF4444',
  },
  statusSuccess: {
    fontSize: 14,
    color: '#10B981',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  testButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default TestNotificationCrashFix;