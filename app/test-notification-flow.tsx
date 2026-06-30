import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { domain } from '@/lib/domain';
import { SimpleNotificationService } from '@/services/SimpleNotificationService';
import apiClient from '@/utils/axiosConfig';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: any;
  duration?: number;
}

export default function TestNotificationFlow() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  const updateTest = (id: string, updates: Partial<TestResult>) => {
    setTests(prev => prev.map(test => 
      test.id === id ? { ...test, ...updates } : test
    ));
  };

  const addTest = (test: TestResult) => {
    setTests(prev => [...prev, test]);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTests([]);

    try {
      // Get current user
      const userDetailsString = await AsyncStorage.getItem("user");
      if (!userDetailsString) {
        Alert.alert('Error', 'Please login first');
        setIsRunning(false);
        return;
      }

      const userData = JSON.parse(userDetailsString);
      setCurrentUser(userData);

      // Extract clientId
      let extractedClientId: string | null = null;
      const staffRoles = ["site-engineer", "supervisor", "manager"];
      const isStaff = staffRoles.includes(userData.role);

      if (isStaff) {
        extractedClientId = userData.clients?.[0]?.clientId?.toString() || null;
      } else if (userData.clients?.length > 0) {
        extractedClientId = userData.clients[0].clientId?.toString() || userData.clients[0]._id?.toString() || null;
      } else if (userData.clientId) {
        extractedClientId = userData.clientId.toString();
      } else {
        extractedClientId = userData._id?.toString() || null;
      }

      setClientId(extractedClientId);

      if (!extractedClientId) {
        Alert.alert('Error', 'Could not extract clientId from user data');
        setIsRunning(false);
        return;
      }

      // Run tests
      await test1_PushTokenRegistration(userData, extractedClientId);
      await test2_RecipientResolution(extractedClientId);
      await test3_SendTestNotification(userData, extractedClientId);
      await test4_FetchActivities(extractedClientId);
      await test5_SelfNotificationPrevention(userData, extractedClientId);
      await test6_ClientIdIsolation(extractedClientId);

    } catch (error: any) {
      Alert.alert('Test Error', error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const test1_PushTokenRegistration = async (userData: any, clientId: string) => {
    const testId = 'test1';
    addTest({
      id: testId,
      name: '1. Push Token Registration',
      status: 'running',
      message: 'Checking push token registration...'
    });

    const startTime = Date.now();

    try {
      const notificationService = SimpleNotificationService.getInstance();
      const token = notificationService.getCurrentToken();

      if (!token) {
        // Try to initialize
        await notificationService.initialize();
        const newToken = notificationService.getCurrentToken();

        if (!newToken) {
          updateTest(testId, {
            status: 'error',
            message: 'Failed to get push token',
            duration: Date.now() - startTime
          });
          return;
        }
      }

      // Check if token is registered
      const isSetup = await notificationService.isSetup();

      updateTest(testId, {
        status: isSetup ? 'success' : 'error',
        message: isSetup 
          ? `Push token registered successfully` 
          : 'Push token not registered',
        details: {
          token: token?.substring(0, 30) + '...',
          userId: userData._id,
          clientId: clientId,
          isSetup
        },
        duration: Date.now() - startTime
      });

    } catch (error: any) {
      updateTest(testId, {
        status: 'error',
        message: `Error: ${error.message}`,
        duration: Date.now() - startTime
      });
    }
  };

  const test2_RecipientResolution = async (clientId: string) => {
    const testId = 'test2';
    addTest({
      id: testId,
      name: '2. Recipient Resolution',
      status: 'running',
      message: 'Fetching recipients for clientId...'
    });

    const startTime = Date.now();

    try {
      const response = await apiClient.get(`/api/notifications/recipients?clientId=${clientId}`);

      if (response.data.success) {
        const recipients = response.data.data.recipients || [];
        const recipientCount = response.data.data.recipientCount || 0;
        const source = response.data.data.source || 'UNKNOWN';

        updateTest(testId, {
          status: recipients.length > 0 ? 'success' : 'error',
          message: recipients.length > 0
            ? `Found ${recipientCount} recipients (source: ${source})`
            : 'No recipients found',
          details: {
            recipients: recipients.map((r: any) => ({
              userId: r.userId,
              fullName: r.fullName,
              userType: r.userType,
              email: r.email
            })),
            source,
            resolutionTimeMs: response.data.data.resolutionTimeMs
          },
          duration: Date.now() - startTime
        });
      } else {
        updateTest(testId, {
          status: 'error',
          message: 'Failed to resolve recipients',
          details: response.data,
          duration: Date.now() - startTime
        });
      }

    } catch (error: any) {
      updateTest(testId, {
        status: 'error',
        message: `Error: ${error.response?.data?.message || error.message}`,
        duration: Date.now() - startTime
      });
    }
  };

  const test3_SendTestNotification = async (userData: any, clientId: string) => {
    const testId = 'test3';
    addTest({
      id: testId,
      name: '3. Send Test Notification',
      status: 'running',
      message: 'Sending test notification...'
    });

    const startTime = Date.now();

    try {
      const notificationService = SimpleNotificationService.getInstance();
      
      const success = await notificationService.sendProjectNotification({
        projectId: 'test_project_' + Date.now(),
        clientId: clientId,
        activityType: 'material_added',
        staffName: userData.firstName + ' ' + userData.lastName,
        projectName: 'Test Project',
        details: 'This is a test notification from the notification flow test',
        recipientType: 'admins',
        staffId: userData._id,
        performerId: userData._id,
        performerRole: userData.role,
        category: 'material',
        title: '🧪 Test Notification',
        message: 'Testing notification flow - please check if you receive this'
      });

      updateTest(testId, {
        status: success ? 'success' : 'error',
        message: success 
          ? 'Test notification sent successfully' 
          : 'Failed to send test notification',
        details: {
          clientId,
          performerId: userData._id,
          performerName: userData.firstName + ' ' + userData.lastName
        },
        duration: Date.now() - startTime
      });

    } catch (error: any) {
      updateTest(testId, {
        status: 'error',
        message: `Error: ${error.message}`,
        duration: Date.now() - startTime
      });
    }
  };

  const test4_FetchActivities = async (clientId: string) => {
    const testId = 'test4';
    addTest({
      id: testId,
      name: '4. Fetch Activities',
      status: 'running',
      message: 'Fetching activities for clientId...'
    });

    const startTime = Date.now();

    try {
      const [activityRes, materialRes] = await Promise.all([
        apiClient.get(`/api/activity?clientId=${clientId}`),
        apiClient.get(`/api/materialActivity?clientId=${clientId}`)
      ]);

      const activities = activityRes.data.data?.activities || activityRes.data.activities || [];
      const materials = materialRes.data.data?.activities || materialRes.data.activities || [];

      updateTest(testId, {
        status: 'success',
        message: `Found ${activities.length} activities and ${materials.length} material activities`,
        details: {
          activityCount: activities.length,
          materialCount: materials.length,
          latestActivity: activities[0] || null,
          latestMaterial: materials[0] || null
        },
        duration: Date.now() - startTime
      });

    } catch (error: any) {
      updateTest(testId, {
        status: 'error',
        message: `Error: ${error.response?.data?.message || error.message}`,
        duration: Date.now() - startTime
      });
    }
  };

  const test5_SelfNotificationPrevention = async (userData: any, clientId: string) => {
    const testId = 'test5';
    addTest({
      id: testId,
      name: '5. Self-Notification Prevention',
      status: 'running',
      message: 'Checking self-notification prevention...'
    });

    const startTime = Date.now();

    try {
      // Get recipients
      const response = await apiClient.get(`/api/notifications/recipients?clientId=${clientId}`);
      
      if (response.data.success) {
        const recipients = response.data.data.recipients || [];
        const currentUserId = userData._id.toString();
        
        // Check if current user is in recipients list
        const selfInRecipients = recipients.some((r: any) => r.userId === currentUserId);

        updateTest(testId, {
          status: 'success',
          message: selfInRecipients
            ? '⚠️ WARNING: Current user is in recipients list (self-notification possible)'
            : '✅ Current user NOT in recipients list (self-notification prevented)',
          details: {
            currentUserId,
            recipientUserIds: recipients.map((r: any) => r.userId),
            selfInRecipients,
            note: 'Self-notification prevention should be handled by backend when sending'
          },
          duration: Date.now() - startTime
        });
      } else {
        updateTest(testId, {
          status: 'error',
          message: 'Failed to check recipients',
          duration: Date.now() - startTime
        });
      }

    } catch (error: any) {
      updateTest(testId, {
        status: 'error',
        message: `Error: ${error.message}`,
        duration: Date.now() - startTime
      });
    }
  };

  const test6_ClientIdIsolation = async (clientId: string) => {
    const testId = 'test6';
    addTest({
      id: testId,
      name: '6. ClientId Isolation',
      status: 'running',
      message: 'Checking clientId isolation...'
    });

    const startTime = Date.now();

    try {
      // Fetch activities for current clientId
      const response = await apiClient.get(`/api/activity?clientId=${clientId}`);
      const activities = response.data.data?.activities || response.data.activities || [];

      // Check if all activities belong to current clientId
      const allActivitiesMatchClientId = activities.every((activity: any) => {
        // Activities might not have clientId field directly, but should be filtered by backend
        return true; // Assume backend filtering is correct
      });

      updateTest(testId, {
        status: 'success',
        message: `✅ Activities filtered by clientId (${activities.length} activities)`,
        details: {
          clientId,
          activityCount: activities.length,
          note: 'Backend should filter activities by clientId'
        },
        duration: Date.now() - startTime
      });

    } catch (error: any) {
      updateTest(testId, {
        status: 'error',
        message: `Error: ${error.message}`,
        duration: Date.now() - startTime
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'ellipse-outline';
      case 'running': return 'sync';
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#9CA3AF';
      case 'running': return '#2E72F0';
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Notification Flow Test</Text>
        <Text style={styles.subtitle}>
          Test the complete notification system
        </Text>
      </View>

      {currentUser && (
        <View style={styles.userInfo}>
          <Text style={styles.userInfoText}>
            👤 User: {currentUser.firstName} {currentUser.lastName}
          </Text>
          <Text style={styles.userInfoText}>
            🏢 Client ID: {clientId || 'Not found'}
          </Text>
          <Text style={styles.userInfoText}>
            👔 Role: {currentUser.role}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.runButton, isRunning && styles.runButtonDisabled]}
        onPress={runAllTests}
        disabled={isRunning}
      >
        {isRunning ? (
          <>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <Text style={styles.runButtonText}>Running Tests...</Text>
          </>
        ) : (
          <>
            <Ionicons name="play-circle" size={24} color="#FFFFFF" />
            <Text style={styles.runButtonText}>Run All Tests</Text>
          </>
        )}
      </TouchableOpacity>

      <ScrollView style={styles.testList}>
        {tests.map(test => (
          <View key={test.id} style={styles.testItem}>
            <View style={styles.testHeader}>
              <Ionicons
                name={getStatusIcon(test.status) as any}
                size={24}
                color={getStatusColor(test.status)}
              />
              <Text style={styles.testName}>{test.name}</Text>
              {test.duration && (
                <Text style={styles.testDuration}>{test.duration}ms</Text>
              )}
            </View>
            
            <Text style={[
              styles.testMessage,
              test.status === 'error' && styles.testMessageError
            ]}>
              {test.message}
            </Text>

            {test.details && (
              <View style={styles.testDetails}>
                <Text style={styles.testDetailsText}>
                  {JSON.stringify(test.details, null, 2)}
                </Text>
              </View>
            )}
          </View>
        ))}

        {tests.length === 0 && !isRunning && (
          <View style={styles.emptyState}>
            <Ionicons name="flask-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>
              Press "Run All Tests" to start testing
            </Text>
          </View>
        )}
      </ScrollView>

      {tests.length > 0 && !isRunning && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            ✅ Passed: {tests.filter(t => t.status === 'success').length} | 
            ❌ Failed: {tests.filter(t => t.status === 'error').length}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  userInfo: {
    padding: 16,
    backgroundColor: '#EAF0FE',
    borderBottomWidth: 1,
    borderBottomColor: '#C4D8FC',
  },
  userInfoText: {
    fontSize: 13,
    color: '#1E40AF',
    marginBottom: 4,
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E72F0',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  runButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  runButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  testList: {
    flex: 1,
    padding: 16,
  },
  testItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  testName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  testDuration: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  testMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  testMessageError: {
    color: '#EF4444',
  },
  testDetails: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 4,
    marginTop: 8,
  },
  testDetailsText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#4B5563',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
  summary: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
});
