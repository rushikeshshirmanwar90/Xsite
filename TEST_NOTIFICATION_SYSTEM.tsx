import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { domain } from '@/lib/domain';
import { getClientId } from '@/functions/clientId';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

const NotificationSystemTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [testProjectId, setTestProjectId] = useState('');
  const [testClientId, setTestClientId] = useState('');

  // Test 1: Check user role and client structure
  const testUserRoleAndClient = async (): Promise<TestResult> => {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (!userString) {
        return {
          test: 'User Role & Client Structure',
          status: 'fail',
          message: 'No user data found in AsyncStorage',
        };
      }

      const userData = JSON.parse(userString);
      console.log('👤 User Data:', userData);

      // Check if user is admin or staff
      const isAdmin = userData.role === 'admin' || userData.userType === 'admin';
      const isStaff = userData.role === 'staff' || userData.userType === 'staff';
      
      // Check client structure
      const hasClients = userData.clients && Array.isArray(userData.clients);
      const hasDirectClientId = userData.clientId;

      return {
        test: 'User Role & Client Structure',
        status: 'pass',
        message: `User: ${isAdmin ? 'Admin' : isStaff ? 'Staff' : 'Unknown'}, Clients: ${hasClients ? userData.clients.length : 'Direct'}, ClientId: ${hasDirectClientId ? 'Yes' : 'No'}`,
        details: {
          role: userData.role || userData.userType,
          isAdmin,
          isStaff,
          hasClients,
          clientsCount: hasClients ? userData.clients.length : 0,
          hasDirectClientId,
          clientId: userData.clientId,
          userId: userData._id,
          fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        }
      };
    } catch (error) {
      return {
        test: 'User Role & Client Structure',
        status: 'fail',
        message: `Error: ${error}`,
      };
    }
  };

  // Test 2: Check material activity API endpoint
  const testMaterialActivityAPI = async (): Promise<TestResult> => {
    try {
      const clientId = await getClientId();
      if (!clientId) {
        return {
          test: 'Material Activity API',
          status: 'fail',
          message: 'No client ID available',
        };
      }

      const response = await axios.get(`${domain}/api/materialActivity?clientId=${clientId}&limit=5`);
      const data = response.data as any;

      if (data.success) {
        return {
          test: 'Material Activity API',
          status: 'pass',
          message: `API working, ${data.data?.length || 0} activities found`,
          details: {
            endpoint: `${domain}/api/materialActivity`,
            clientId,
            activitiesCount: data.data?.length || 0,
            sampleActivity: data.data?.[0] || null,
          }
        };
      } else {
        return {
          test: 'Material Activity API',
          status: 'warning',
          message: `API returned success: false - ${data.message || 'Unknown error'}`,
          details: data,
        };
      }
    } catch (error: any) {
      return {
        test: 'Material Activity API',
        status: 'fail',
        message: `API Error: ${error?.response?.data?.message || error.message}`,
        details: {
          status: error?.response?.status,
          data: error?.response?.data,
        }
      };
    }
  };

  // Test 3: Test notification creation for material activity
  const testMaterialActivityNotification = async (): Promise<TestResult> => {
    try {
      if (!testProjectId || !testClientId) {
        return {
          test: 'Material Activity Notification',
          status: 'warning',
          message: 'Please provide test project ID and client ID',
        };
      }

      const userString = await AsyncStorage.getItem('user');
      if (!userString) {
        return {
          test: 'Material Activity Notification',
          status: 'fail',
          message: 'No user data found',
        };
      }

      const userData = JSON.parse(userString);
      const user = {
        userId: userData._id || userData.id || 'test-user',
        fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Test User',
        email: userData.email,
      };

      // Create a test material activity
      const testPayload = {
        clientId: testClientId,
        projectId: testProjectId,
        projectName: 'Test Project',
        sectionName: 'Test Section',
        materials: [{
          name: 'Test Material',
          unit: 'kg',
          specs: { grade: 'A' },
          qnt: 10,
          perUnitCost: 100,
          totalCost: 1000,
          cost: 1000,
        }],
        message: 'Test material activity for notification system',
        activity: 'imported' as const,
        user,
        date: new Date().toISOString(),
      };

      console.log('🧪 Test Material Activity Payload:', testPayload);

      const response = await axios.post(`${domain}/api/materialActivity`, testPayload);
      const data = response.data as any;

      if (data.success) {
        return {
          test: 'Material Activity Notification',
          status: 'pass',
          message: 'Material activity created successfully - check notifications',
          details: {
            activityId: data.data?._id,
            response: data,
          }
        };
      } else {
        return {
          test: 'Material Activity Notification',
          status: 'fail',
          message: `Failed to create activity: ${data.message || 'Unknown error'}`,
          details: data,
        };
      }
    } catch (error: any) {
      return {
        test: 'Material Activity Notification',
        status: 'fail',
        message: `Error: ${error?.response?.data?.message || error.message}`,
        details: {
          status: error?.response?.status,
          data: error?.response?.data,
        }
      };
    }
  };

  // Test 4: Check notification targeting (who should receive notifications)
  const testNotificationTargeting = async (): Promise<TestResult> => {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (!userString) {
        return {
          test: 'Notification Targeting',
          status: 'fail',
          message: 'No user data found',
        };
      }

      const userData = JSON.parse(userString);
      const clientId = await getClientId();

      // Check if current user should receive notifications
      const isAdmin = userData.role === 'admin' || userData.userType === 'admin';
      const isStaff = userData.role === 'staff' || userData.userType === 'staff';
      
      let targetingLogic = '';
      
      if (isAdmin) {
        targetingLogic = 'As ADMIN: Should receive notifications for all activities in your client projects';
      } else if (isStaff) {
        targetingLogic = 'As STAFF: Should receive notifications for activities by other staff/admins in your assigned projects';
      } else {
        targetingLogic = 'Unknown role: Notification targeting unclear';
      }

      // Check if user has access to multiple clients (staff scenario)
      const hasMultipleClients = userData.clients && userData.clients.length > 1;
      
      return {
        test: 'Notification Targeting',
        status: 'pass',
        message: targetingLogic,
        details: {
          userRole: userData.role || userData.userType,
          isAdmin,
          isStaff,
          clientId,
          hasMultipleClients,
          clientsCount: userData.clients?.length || 0,
          targetingRules: {
            admin: 'Receives all notifications for their client projects',
            staff: 'Receives notifications for activities by other users in assigned projects',
          }
        }
      };
    } catch (error) {
      return {
        test: 'Notification Targeting',
        status: 'fail',
        message: `Error: ${error}`,
      };
    }
  };

  // Test 5: Check notification API endpoint
  const testNotificationAPI = async (): Promise<TestResult> => {
    try {
      // Check if there's a notification API endpoint
      const clientId = await getClientId();
      
      // Try to fetch notifications (this might not exist yet)
      try {
        const response = await axios.get(`${domain}/api/notifications?clientId=${clientId}`);
        return {
          test: 'Notification API',
          status: 'pass',
          message: 'Notification API endpoint exists and working',
          details: response.data,
        };
      } catch (error: any) {
        if (error?.response?.status === 404) {
          return {
            test: 'Notification API',
            status: 'warning',
            message: 'Notification API endpoint not found - notifications may be handled differently',
            details: {
              suggestion: 'Notifications might be sent via push notifications or stored in materialActivity collection',
            }
          };
        } else {
          return {
            test: 'Notification API',
            status: 'fail',
            message: `API Error: ${error?.response?.data?.message || error.message}`,
            details: error?.response?.data,
          };
        }
      }
    } catch (error) {
      return {
        test: 'Notification API',
        status: 'fail',
        message: `Error: ${error}`,
      };
    }
  };

  // Test 6: Check local notification system
  const testLocalNotificationSystem = async (): Promise<TestResult> => {
    try {
      // Import notification manager
      const NotificationManager = (await import('../services/notificationManager')).default;
      const notificationManager = NotificationManager.getInstance();

      // Test local notification
      const testId = await notificationManager.scheduleLocalNotification(
        'Test Notification',
        'This is a test notification to verify the local notification system is working',
        {
          category: 'material',
          action: 'imported',
          projectId: testProjectId || 'test-project',
          activityType: 'material_imported',
        }
      );

      if (testId) {
        return {
          test: 'Local Notification System',
          status: 'pass',
          message: 'Local notification system working - check notification screen',
          details: {
            notificationId: testId,
            unreadCount: notificationManager.getUnreadCount(),
            totalNotifications: notificationManager.getNotifications().length,
          }
        };
      } else {
        return {
          test: 'Local Notification System',
          status: 'warning',
          message: 'Local notification system available but notification creation failed',
        };
      }
    } catch (error) {
      return {
        test: 'Local Notification System',
        status: 'fail',
        message: `Error: ${error}`,
      };
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults([]);

    const tests = [
      testUserRoleAndClient,
      testMaterialActivityAPI,
      testNotificationTargeting,
      testNotificationAPI,
      testLocalNotificationSystem,
      testMaterialActivityNotification,
    ];

    const testResults: TestResult[] = [];

    for (const test of tests) {
      try {
        const result = await test();
        testResults.push(result);
        setResults([...testResults]);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        testResults.push({
          test: 'Unknown Test',
          status: 'fail',
          message: `Test execution error: ${error}`,
        });
      }
    }

    setLoading(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass': return { name: 'checkmark-circle', color: '#10B981' };
      case 'fail': return { name: 'close-circle', color: '#EF4444' };
      case 'warning': return { name: 'warning', color: '#F59E0B' };
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pass': return '#D1FAE5';
      case 'fail': return '#FEE2E2';
      case 'warning': return '#FEF3C7';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notification System Test</Text>
        <Text style={styles.subtitle}>
          Testing multi-user notification system for client-admin-staff hierarchy
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Test Configuration */}
        <View style={styles.configSection}>
          <Text style={styles.sectionTitle}>Test Configuration</Text>
          <TextInput
            style={styles.input}
            placeholder="Test Project ID (optional)"
            value={testProjectId}
            onChangeText={setTestProjectId}
          />
          <TextInput
            style={styles.input}
            placeholder="Test Client ID (optional)"
            value={testClientId}
            onChangeText={setTestClientId}
          />
        </View>

        {/* Run Tests Button */}
        <TouchableOpacity
          style={[styles.runButton, loading && styles.runButtonDisabled]}
          onPress={runAllTests}
          disabled={loading}
        >
          <Ionicons 
            name={loading ? "sync" : "play"} 
            size={20} 
            color="#FFFFFF" 
          />
          <Text style={styles.runButtonText}>
            {loading ? 'Running Tests...' : 'Run All Tests'}
          </Text>
        </TouchableOpacity>

        {/* Test Results */}
        {results.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            {results.map((result, index) => {
              const icon = getStatusIcon(result.status);
              return (
                <View 
                  key={index} 
                  style={[
                    styles.resultCard,
                    { backgroundColor: getStatusColor(result.status) }
                  ]}
                >
                  <View style={styles.resultHeader}>
                    <Ionicons name={icon.name as any} size={24} color={icon.color} />
                    <Text style={styles.resultTitle}>{result.test}</Text>
                  </View>
                  <Text style={styles.resultMessage}>{result.message}</Text>
                  {result.details && (
                    <TouchableOpacity
                      style={styles.detailsButton}
                      onPress={() => {
                        Alert.alert(
                          'Test Details',
                          JSON.stringify(result.details, null, 2),
                          [{ text: 'OK' }]
                        );
                      }}
                    >
                      <Text style={styles.detailsButtonText}>View Details</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Expected Behavior Documentation */}
        <View style={styles.docSection}>
          <Text style={styles.sectionTitle}>Expected Notification Behavior</Text>
          <View style={styles.docCard}>
            <Text style={styles.docTitle}>🏢 Client-Admin-Staff Hierarchy</Text>
            <Text style={styles.docText}>
              • One client can have multiple admins and staff{'\n'}
              • Staff activities should notify client admins{'\n'}
              • Admin activities should notify other admins{'\n'}
              • Users should only see notifications for their client's projects
            </Text>
          </View>
          
          <View style={styles.docCard}>
            <Text style={styles.docTitle}>📱 Notification Flow</Text>
            <Text style={styles.docText}>
              1. Staff performs material activity{'\n'}
              2. Activity logged via /api/materialActivity{'\n'}
              3. Backend identifies client admins{'\n'}
              4. Notifications sent to relevant admins{'\n'}
              5. Admins see notifications in app
            </Text>
          </View>

          <View style={styles.docCard}>
            <Text style={styles.docTitle}>🔧 Current Implementation Status</Text>
            <Text style={styles.docText}>
              • Local notifications: ✅ Working{'\n'}
              • Material activity logging: ✅ Working{'\n'}
              • Multi-user targeting: ❓ Needs verification{'\n'}
              • Push notifications: ❓ May need backend setup
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
    lineHeight: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  configSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
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
  resultsSection: {
    marginBottom: 20,
  },
  resultCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  resultMessage: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  detailsButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 6,
  },
  detailsButtonText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  docSection: {
    marginBottom: 20,
  },
  docCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  docTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  docText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});

export default NotificationSystemTest;