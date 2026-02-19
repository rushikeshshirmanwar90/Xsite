import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useSimpleNotifications } from '@/hooks/useSimpleNotifications';
import { useAuth } from '@/contexts/AuthContext';

const SimpleNotificationTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const {
    isInitialized,
    isLoading: notificationLoading,
    sendProjectNotification,
    scheduleTestNotification,
    reinitialize,
  } = useSimpleNotifications();

  const testMaterialAdded = async () => {
    setIsLoading(true);
    try {
      const success = await sendProjectNotification({
        projectId: 'test-project-123',
        activityType: 'material_added',
        staffName: user?.firstName || 'Test Staff',
        projectName: 'Sample Project',
        details: 'Added 50 bags of cement',
        recipientType: 'admins',
      });

      Alert.alert(
        success ? 'Success' : 'Failed',
        success ? 'Material notification sent to admins!' : 'Failed to send notification'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
    } finally {
      setIsLoading(false);
    }
  };

  const testUsageAdded = async () => {
    setIsLoading(true);
    try {
      const success = await sendProjectNotification({
        projectId: 'test-project-123',
        activityType: 'usage_added',
        staffName: user?.firstName || 'Test Staff',
        projectName: 'Sample Project',
        details: 'Updated material usage for foundation work',
        recipientType: 'admins',
      });

      Alert.alert(
        success ? 'Success' : 'Failed',
        success ? 'Usage notification sent to admins!' : 'Failed to send notification'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
    } finally {
      setIsLoading(false);
    }
  };

  const testLaborAdded = async () => {
    setIsLoading(true);
    try {
      const success = await sendProjectNotification({
        projectId: 'test-project-123',
        activityType: 'labor_added',
        staffName: user?.firstName || 'Test Staff',
        projectName: 'Sample Project',
        details: 'Added labor cost: ₹5,000 for masonry work',
        recipientType: 'admins',
      });

      Alert.alert(
        success ? 'Success' : 'Failed',
        success ? 'Labor notification sent to admins!' : 'Failed to send notification'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
    } finally {
      setIsLoading(false);
    }
  };

  const testAdminUpdate = async () => {
    setIsLoading(true);
    try {
      const success = await sendProjectNotification({
        projectId: 'test-project-123',
        activityType: 'admin_update',
        staffName: user?.firstName || 'Test Admin',
        projectName: 'Sample Project',
        details: 'Updated project timeline and budget',
        recipientType: 'staff',
      });

      Alert.alert(
        success ? 'Success' : 'Failed',
        success ? 'Admin update notification sent to staff!' : 'Failed to send notification'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
    } finally {
      setIsLoading(false);
    }
  };

  const testLocalNotification = async () => {
    try {
      await scheduleTestNotification(
        '🧪 Test Notification',
        'This is a local test notification!'
      );
      Alert.alert('Success', 'Local notification scheduled!');
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule local notification');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📱 Simple Notification Test</Text>
      
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Status</Text>
        <Text style={[styles.statusText, { color: isInitialized ? '#10B981' : '#EF4444' }]}>
          {notificationLoading ? 'Initializing...' : isInitialized ? '✅ Ready' : '❌ Not Ready'}
        </Text>
        
        {!isInitialized && !notificationLoading && (
          <TouchableOpacity style={styles.retryButton} onPress={reinitialize}>
            <Text style={styles.retryButtonText}>Retry Setup</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionTitle}>Staff Actions → Admin Notifications</Text>
      
      <TouchableOpacity
        style={[styles.testButton, styles.materialButton]}
        onPress={testMaterialAdded}
        disabled={!isInitialized || isLoading}
      >
        <Text style={styles.buttonText}>📦 Test Material Added</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.testButton, styles.usageButton]}
        onPress={testUsageAdded}
        disabled={!isInitialized || isLoading}
      >
        <Text style={styles.buttonText}>📊 Test Usage Added</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.testButton, styles.laborButton]}
        onPress={testLaborAdded}
        disabled={!isInitialized || isLoading}
      >
        <Text style={styles.buttonText}>👷 Test Labor Added</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Admin Actions → Staff Notifications</Text>

      <TouchableOpacity
        style={[styles.testButton, styles.adminButton]}
        onPress={testAdminUpdate}
        disabled={!isInitialized || isLoading}
      >
        <Text style={styles.buttonText}>⚡ Test Admin Update</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Local Test</Text>

      <TouchableOpacity
        style={[styles.testButton, styles.localButton]}
        onPress={testLocalNotification}
      >
        <Text style={styles.buttonText}>🧪 Test Local Notification</Text>
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          • Material/Usage/Labor notifications go to project admins{'\n'}
          • Admin update notifications go to project staff{'\n'}
          • Local notifications work without internet
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#111827',
  },
  statusCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 20,
    marginBottom: 12,
  },
  testButton: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  materialButton: {
    backgroundColor: '#10B981',
  },
  usageButton: {
    backgroundColor: '#3B82F6',
  },
  laborButton: {
    backgroundColor: '#F59E0B',
  },
  adminButton: {
    backgroundColor: '#8B5CF6',
  },
  localButton: {
    backgroundColor: '#6B7280',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  info: {
    backgroundColor: '#EBF8FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    color: '#1E40AF',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default SimpleNotificationTest;