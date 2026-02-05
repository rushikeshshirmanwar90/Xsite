import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NotificationManager from '../services/notificationManager';

interface TestNotificationHelperProps {
  onClose?: () => void;
}

const NotificationTestHelper: React.FC<TestNotificationHelperProps> = ({ onClose }) => {
  const [isAdding, setIsAdding] = useState(false);
  const notificationManager = NotificationManager.getInstance();

  const testNotifications = [
    {
      title: '📥 Materials Imported',
      body: 'John Doe imported 25 materials: Cement, Steel and 1 more in Foundation Project',
      data: {
        activityId: 'test_activity_1',
        projectId: 'test_project_1',
        activityType: 'material_activity',
        category: 'material',
        action: 'imported',
        route: 'notification'
      },
      isRead: false,
      source: 'backend' as const
    },
    {
      title: '🔄 Materials Transferred',
      body: 'Jane Smith transferred 10 materials from Project A to Project B',
      data: {
        activityId: 'test_activity_2',
        projectId: 'test_project_2',
        activityType: 'material_activity',
        category: 'material',
        action: 'transferred',
        route: 'notification'
      },
      isRead: false,
      source: 'push' as const
    },
    {
      title: '🔨 Materials Used',
      body: 'Mike Johnson used 15 materials: Concrete, Rebar in Construction Phase',
      data: {
        activityId: 'test_activity_3',
        projectId: 'test_project_3',
        activityType: 'material_activity',
        category: 'material',
        action: 'used',
        route: 'notification'
      },
      isRead: true,
      source: 'backend' as const
    },
    {
      title: '🏗️ Project Update',
      body: 'New project "Residential Complex" created by Admin User',
      data: {
        activityId: 'test_activity_4',
        projectId: 'test_project_4',
        activityType: 'project_created',
        category: 'project',
        action: 'create',
        route: 'notification'
      },
      isRead: false,
      source: 'backend' as const
    },
    {
      title: '👥 Staff Update',
      body: 'New staff member assigned to Downtown Office Project',
      data: {
        activityId: 'test_activity_5',
        projectId: 'test_project_5',
        activityType: 'staff_assigned',
        category: 'staff',
        action: 'assign',
        route: 'notification'
      },
      isRead: true,
      source: 'push' as const
    }
  ];

  const addAllTestNotifications = async () => {
    setIsAdding(true);
    try {
      console.log('📱 Adding test notifications...');
      
      for (const notification of testNotifications) {
        await notificationManager.addNotification(notification);
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      Alert.alert(
        'Success!',
        `Added ${testNotifications.length} test notifications. Check the notifications screen to see them.`,
        [{ text: 'OK' }]
      );

      console.log('✅ All test notifications added successfully');
      
    } catch (error) {
      console.error('❌ Error adding test notifications:', error);
      Alert.alert(
        'Error',
        'Failed to add test notifications. Check the console for details.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAdding(false);
    }
  };

  const addSingleNotification = async (notification: typeof testNotifications[0]) => {
    try {
      await notificationManager.addNotification(notification);
      Alert.alert(
        'Added!',
        `Added notification: ${notification.title}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Error adding notification:', error);
      Alert.alert('Error', 'Failed to add notification', [{ text: 'OK' }]);
    }
  };

  const clearAllNotifications = async () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationManager.clearAll();
              Alert.alert('Cleared!', 'All notifications have been cleared.', [{ text: 'OK' }]);
            } catch (error) {
              console.error('❌ Error clearing notifications:', error);
              Alert.alert('Error', 'Failed to clear notifications', [{ text: 'OK' }]);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Notification Test Helper</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Use this helper to test the notification display system by adding sample notifications.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={addAllTestNotifications}
            disabled={isAdding}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>
              {isAdding ? 'Adding...' : `Add All ${testNotifications.length} Test Notifications`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={clearAllNotifications}
          >
            <Ionicons name="trash" size={20} color="#FFFFFF" />
            <Text style={styles.dangerButtonText}>Clear All Notifications</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Individual Notifications</Text>
          <Text style={styles.sectionDescription}>
            Add specific notifications one by one:
          </Text>

          {testNotifications.map((notification, index) => (
            <TouchableOpacity
              key={index}
              style={styles.notificationItem}
              onPress={() => addSingleNotification(notification)}
            >
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationBody} numberOfLines={2}>
                  {notification.body}
                </Text>
                <View style={styles.notificationMeta}>
                  <Text style={styles.notificationSource}>{notification.source}</Text>
                  <Text style={styles.notificationStatus}>
                    {notification.isRead ? '✅ Read' : '🔴 Unread'}
                  </Text>
                </View>
              </View>
              <Ionicons name="add" size={20} color="#3B82F6" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.instructions}>
            1. Tap "Add All Test Notifications" to add sample notifications{'\n'}
            2. Navigate to the Notifications screen to see them{'\n'}
            3. Test the read/unread functionality{'\n'}
            4. Test the delete and clear functionality{'\n'}
            5. Use "Clear All" to reset when done testing
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  notificationMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationSource: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  notificationStatus: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  instructions: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
  },
});

export default NotificationTestHelper;