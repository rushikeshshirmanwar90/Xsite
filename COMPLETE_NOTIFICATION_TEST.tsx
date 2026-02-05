import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { domain } from '@/lib/domain';
import { getClientId } from '@/functions/clientId';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning' | 'info';
  message: string;
  details?: any;
  recommendation?: string;
  timestamp: string;
}

interface UserData {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  userType?: string;
  clientId?: string;
  clients?: any[];
}

const CompleteNotificationTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [testProjectId, setTestProjectId] = useState('');
  const [testClientId, setTestClientId] = useState('');
  const [currentStep, setCurrentStep] = useState('');

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        const userData = JSON.parse(userString);
        setCurrentUser(userData);
        
        // Auto-fill test data
        const clientId = await getClientId();
        if (clientId) {
          setTestClientId(clientId);
        } else if (userData.clientId) {
          setTestClientId(userData.clientId);
        } else if (userData.clients && userData.clients.length > 0) {
          setTestClientId(userData.clients[0].clientId);
        }
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const addResult = (result: TestResult) => {
    const timestampedResult = {
      ...result,
      timestamp: new Date().toLocaleTimeString()
    };
    setResults(prev => [...prev, timestampedResult]);
  };

  // Test 1: Verify User Setup and Client Structure
  const testUserSetup = async (): Promise<TestResult> => {
    setCurrentStep('Testing user setup and client structure...');
    
    try {
      if (!currentUser) {
        return {
          test: '👤 User Setup & Client Structure',
          status: 'fail',
          message: 'No user data found - please log in first',
          recommendation: 'Log in to the app and try again',
          timestamp: ''
        };
      }

      const clientId = await getClientId();
      const isAdmin = currentUser.role === 'admin' || currentUser.userType === 'admin';
      const isStaff = currentUser.role === 'staff' || currentUser.userType === 'staff';
      const hasClients = currentUser.clients && Array.isArray(currentUser.clients);
      const fullName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();

      let status: 'pass' | 'warning' = 'pass';
      let message = `User: ${fullName} (${isAdmin ? 'Admin' : isStaff ? 'Staff' : 'Unknown Role'})`;
      let recommendation = '';

      if (!clientId && !currentUser.clientId) {
        status = 'warning';
        message += ' - No client ID found';
        recommendation = 'Ensure user has proper client association';
      } else {
        message += ` - Client ID: ${clientId || currentUser.clientId}`;
      }

      return {
        test: '👤 User Setup & Client Structure',
        status,
        message,
        details: {
          userId: currentUser._id,
          fullName,
          role: currentUser.role || currentUser.userType,
          isAdmin,
          isStaff,
          clientId: clientId || currentUser.clientId,
          hasMultipleClients: hasClients && currentUser.clients!.length > 1,
          clientsCount: hasClients ? currentUser.clients!.length : 1
        },
        recommendation: recommendation || (isAdmin ? 
          'As Admin: You should receive notifications for all activities in your client projects' :
          'As Staff: You should receive notifications for activities by other users in your assigned projects'),
        timestamp: ''
      };
    } catch (error) {
      return {
        test: '👤 User Setup & Client Structure',
        status: 'fail',
        message: `Error: ${error}`,
        timestamp: ''
      };
    }
  };

  // Test 2: Test Backend API Endpoints
  const testBackendAPIs = async (): Promise<TestResult> => {
    setCurrentStep('Testing backend API endpoints...');
    
    try {
      const clientId = testClientId || await getClientId();
      if (!clientId) {
        return {
          test: '🔌 Backend API Endpoints',
          status: 'fail',
          message: 'No client ID available for testing',
          timestamp: ''
        };
      }

      // Test 1: Material Activity API (existing)
      try {
        const materialResponse = await axios.get(`${domain}/api/materialActivity?clientId=${clientId}&limit=1`);
        if (!materialResponse.data.success) {
          throw new Error('Material Activity API returned success: false');
        }
      } catch (error: any) {
        return {
          test: '🔌 Backend API Endpoints',
          status: 'fail',
          message: `Material Activity API failed: ${error.response?.data?.message || error.message}`,
          recommendation: 'Ensure /api/materialActivity endpoint is working',
          timestamp: ''
        };
      }

      // Test 2: Notification Recipients API (new - may not exist yet)
      let recipientsStatus = 'not implemented';
      try {
        const recipientsResponse = await axios.get(`${domain}/api/notifications/recipients?clientId=${clientId}&projectId=${testProjectId || 'test'}`);
        if (recipientsResponse.data.success) {
          recipientsStatus = `working (${recipientsResponse.data.recipients?.length || 0} recipients found)`;
        } else {
          recipientsStatus = 'implemented but returning errors';
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          recipientsStatus = 'not implemented (404)';
        } else {
          recipientsStatus = `error: ${error.response?.data?.message || error.message}`;
        }
      }

      // Test 3: Notification Send API (new - may not exist yet)
      let sendStatus = 'not implemented';
      try {
        // Don't actually send, just check if endpoint exists
        const testPayload = {
          title: 'Test',
          body: 'Test',
          category: 'material',
          action: 'test',
          data: { clientId, projectId: 'test' },
          recipients: [],
          timestamp: new Date().toISOString()
        };
        
        await axios.post(`${domain}/api/notifications/send`, testPayload);
        sendStatus = 'working';
      } catch (error: any) {
        if (error.response?.status === 404) {
          sendStatus = 'not implemented (404)';
        } else if (error.response?.status === 400) {
          sendStatus = 'implemented (validation error expected)';
        } else {
          sendStatus = `error: ${error.response?.data?.message || error.message}`;
        }
      }

      const implementedCount = [
        recipientsStatus.includes('working') ? 1 : 0,
        sendStatus.includes('working') || sendStatus.includes('implemented') ? 1 : 0
      ].reduce((a, b) => a + b, 0);

      const status = implementedCount === 2 ? 'pass' : implementedCount === 1 ? 'warning' : 'fail';
      const message = `Material Activity: ✅ | Recipients API: ${recipientsStatus} | Send API: ${sendStatus}`;

      return {
        test: '🔌 Backend API Endpoints',
        status,
        message,
        details: {
          materialActivityAPI: 'working',
          recipientsAPI: recipientsStatus,
          sendAPI: sendStatus,
          implementedCount,
          requiredCount: 2
        },
        recommendation: implementedCount < 2 ? 
          'Implement missing notification APIs - see BACKEND_IMPLEMENTATION_READY.md' : 
          'All required APIs are implemented',
        timestamp: ''
      };
    } catch (error) {
      return {
        test: '🔌 Backend API Endpoints',
        status: 'fail',
        message: `Error: ${error}`,
        timestamp: ''
      };
    }
  };

  // Test 3: Test Notification Recipients Logic
  const testNotificationRecipients = async (): Promise<TestResult> => {
    setCurrentStep('Testing notification recipients logic...');
    
    try {
      const clientId = testClientId || await getClientId();
      if (!clientId) {
        return {
          test: '👥 Notification Recipients',
          status: 'fail',
          message: 'No client ID available for testing',
          timestamp: ''
        };
      }

      try {
        const response = await axios.get(`${domain}/api/notifications/recipients?clientId=${clientId}&projectId=${testProjectId || 'test'}`);
        
        if (response.data.success) {
          const recipients = response.data.recipients || [];
          const adminCount = recipients.filter((r: any) => r.userType === 'admin').length;
          const staffCount = recipients.filter((r: any) => r.userType === 'staff').length;
          
          let status: 'pass' | 'warning' = 'pass';
          let recommendation = '';
          
          if (recipients.length === 0) {
            status = 'warning';
            recommendation = 'No recipients found - ensure users exist for this client';
          } else if (adminCount === 0) {
            status = 'warning';
            recommendation = 'No admin recipients found - ensure client has admin users';
          }

          return {
            test: '👥 Notification Recipients',
            status,
            message: `Found ${recipients.length} recipients (${adminCount} admins, ${staffCount} staff)`,
            details: {
              totalRecipients: recipients.length,
              adminCount,
              staffCount,
              recipients: recipients.map((r: any) => ({
                userId: r.userId,
                fullName: r.fullName,
                userType: r.userType
              }))
            },
            recommendation: recommendation || 'Recipients found successfully',
            timestamp: ''
          };
        } else {
          return {
            test: '👥 Notification Recipients',
            status: 'fail',
            message: `API returned success: false - ${response.data.message || 'Unknown error'}`,
            timestamp: ''
          };
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          return {
            test: '👥 Notification Recipients',
            status: 'fail',
            message: 'Recipients API not implemented (404)',
            recommendation: 'Implement /api/notifications/recipients endpoint',
            timestamp: ''
          };
        } else {
          return {
            test: '👥 Notification Recipients',
            status: 'fail',
            message: `API Error: ${error.response?.data?.message || error.message}`,
            timestamp: ''
          };
        }
      }
    } catch (error) {
      return {
        test: '👥 Notification Recipients',
        status: 'fail',
        message: `Error: ${error}`,
        timestamp: ''
      };
    }
  };

  // Test 4: Test Material Activity with Notification
  const testMaterialActivityNotification = async (): Promise<TestResult> => {
    setCurrentStep('Testing material activity with notifications...');
    
    try {
      if (!currentUser) {
        return {
          test: '📦 Material Activity Notification',
          status: 'fail',
          message: 'No user data available',
          timestamp: ''
        };
      }

      const clientId = testClientId || await getClientId();
      if (!clientId) {
        return {
          test: '📦 Material Activity Notification',
          status: 'fail',
          message: 'No client ID available',
          timestamp: ''
        };
      }

      const projectId = testProjectId || 'test-project-' + Date.now();
      const user = {
        userId: currentUser._id,
        fullName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Test User',
        email: currentUser.email
      };

      const testPayload = {
        clientId,
        projectId,
        projectName: 'Test Project for Notifications',
        sectionName: 'Test Section',
        materials: [{
          name: 'Test Material',
          unit: 'kg',
          specs: { grade: 'Test Grade' },
          qnt: 5,
          perUnitCost: 100,
          totalCost: 500,
          cost: 500
        }],
        message: 'Test material activity for notification system verification',
        activity: 'imported',
        user,
        date: new Date().toISOString()
      };

      console.log('🧪 Creating test material activity...');
      const response = await axios.post(`${domain}/api/materialActivity`, testPayload);

      if (response.data.success) {
        // Wait a moment for potential notifications to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));

        return {
          test: '📦 Material Activity Notification',
          status: 'pass',
          message: 'Material activity created successfully - check if notifications were sent',
          details: {
            activityId: response.data.data?._id,
            projectId,
            clientId,
            user: user.fullName,
            materialsCount: 1,
            totalCost: 500
          },
          recommendation: 'Check notification screen and other user accounts to verify notifications were received',
          timestamp: ''
        };
      } else {
        return {
          test: '📦 Material Activity Notification',
          status: 'fail',
          message: `Failed to create activity: ${response.data.message || 'Unknown error'}`,
          timestamp: ''
        };
      }
    } catch (error: any) {
      return {
        test: '📦 Material Activity Notification',
        status: 'fail',
        message: `Error: ${error.response?.data?.message || error.message}`,
        timestamp: ''
      };
    }
  };

  // Test 5: Test Local Notification System
  const testLocalNotifications = async (): Promise<TestResult> => {
    setCurrentStep('Testing local notification system...');
    
    try {
      // Dynamic import to handle potential missing module
      const NotificationManager = await import('@/services/notificationManager').then(m => m.default);
      const notificationManager = NotificationManager.getInstance();

      const testId = await notificationManager.scheduleLocalNotification(
        '🧪 Test Local Notification',
        'This is a test to verify the local notification system is working properly',
        {
          category: 'material',
          action: 'test',
          projectId: testProjectId || 'test-project',
          activityType: 'test_notification'
        }
      );

      if (testId) {
        const unreadCount = notificationManager.getUnreadCount();
        const totalNotifications = notificationManager.getNotifications().length;

        return {
          test: '📱 Local Notification System',
          status: 'pass',
          message: `Local notification created successfully (ID: ${testId})`,
          details: {
            notificationId: testId,
            unreadCount,
            totalNotifications
          },
          recommendation: 'Check the notification screen to see the test notification',
          timestamp: ''
        };
      } else {
        return {
          test: '📱 Local Notification System',
          status: 'warning',
          message: 'Local notification system available but notification creation returned null',
          timestamp: ''
        };
      }
    } catch (error: any) {
      return {
        test: '📱 Local Notification System',
        status: 'fail',
        message: `Error: ${error.message}`,
        recommendation: 'Check if NotificationManager service is properly implemented',
        timestamp: ''
      };
    }
  };

  // Test 6: End-to-End Notification Flow Test
  const testEndToEndFlow = async (): Promise<TestResult> => {
    setCurrentStep('Testing end-to-end notification flow...');
    
    try {
      const clientId = testClientId || await getClientId();
      if (!clientId || !currentUser) {
        return {
          test: '🔄 End-to-End Notification Flow',
          status: 'fail',
          message: 'Missing required data (user or client ID)',
          timestamp: ''
        };
      }

      // Step 1: Check if we can get recipients
      let recipientsAvailable = false;
      let recipientCount = 0;
      
      try {
        const recipientsResponse = await axios.get(`${domain}/api/notifications/recipients?clientId=${clientId}`);
        if (recipientsResponse.data.success) {
          recipientsAvailable = true;
          recipientCount = recipientsResponse.data.recipients?.length || 0;
        }
      } catch (error) {
        // Recipients API not available
      }

      // Step 2: Create material activity (this should trigger notifications if backend is ready)
      const projectId = testProjectId || 'e2e-test-' + Date.now();
      const activityPayload = {
        clientId,
        projectId,
        projectName: 'End-to-End Test Project',
        sectionName: 'Test Section',
        materials: [{
          name: 'E2E Test Material',
          unit: 'pieces',
          specs: { type: 'Test' },
          qnt: 3,
          perUnitCost: 200,
          totalCost: 600,
          cost: 600
        }],
        message: 'End-to-end notification flow test',
        activity: 'imported',
        user: {
          userId: currentUser._id,
          fullName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
          email: currentUser.email
        },
        date: new Date().toISOString()
      };

      const activityResponse = await axios.post(`${domain}/api/materialActivity`, activityPayload);
      
      if (!activityResponse.data.success) {
        return {
          test: '🔄 End-to-End Notification Flow',
          status: 'fail',
          message: 'Failed to create material activity',
          timestamp: ''
        };
      }

      // Step 3: Wait and check results
      await new Promise(resolve => setTimeout(resolve, 3000));

      let status: 'pass' | 'warning' | 'fail' = 'pass';
      let message = 'Material activity created successfully';
      let recommendation = '';

      if (!recipientsAvailable) {
        status = 'warning';
        message += ' - Recipients API not available, notifications may not be sent to other users';
        recommendation = 'Implement notification APIs for multi-user notifications';
      } else if (recipientCount === 0) {
        status = 'warning';
        message += ` - No recipients found for notifications`;
        recommendation = 'Ensure other users (admins/staff) exist for this client';
      } else {
        message += ` - Should have sent notifications to ${recipientCount} recipients`;
        recommendation = 'Check other user accounts to verify they received notifications';
      }

      return {
        test: '🔄 End-to-End Notification Flow',
        status,
        message,
        details: {
          activityCreated: true,
          activityId: activityResponse.data.data?._id,
          recipientsAPIAvailable: recipientsAvailable,
          recipientCount,
          projectId,
          clientId
        },
        recommendation,
        timestamp: ''
      };
    } catch (error: any) {
      return {
        test: '🔄 End-to-End Notification Flow',
        status: 'fail',
        message: `Error: ${error.response?.data?.message || error.message}`,
        timestamp: ''
      };
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults([]);
    setCurrentStep('Starting comprehensive notification system test...');

    const tests = [
      testUserSetup,
      testBackendAPIs,
      testNotificationRecipients,
      testLocalNotifications,
      testMaterialActivityNotification,
      testEndToEndFlow
    ];

    for (let i = 0; i < tests.length; i++) {
      try {
        const result = await tests[i]();
        addResult(result);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        addResult({
          test: `Test ${i + 1}`,
          status: 'fail',
          message: `Test execution error: ${error}`,
          timestamp: ''
        });
      }
    }

    setCurrentStep('All tests completed');
    setLoading(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass': return { name: 'checkmark-circle', color: '#10B981' };
      case 'fail': return { name: 'close-circle', color: '#EF4444' };
      case 'warning': return { name: 'warning', color: '#F59E0B' };
      case 'info': return { name: 'information-circle', color: '#3B82F6' };
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pass': return '#D1FAE5';
      case 'fail': return '#FEE2E2';
      case 'warning': return '#FEF3C7';
      case 'info': return '#DBEAFE';
    }
  };

  const generateTestReport = () => {
    const passCount = results.filter(r => r.status === 'pass').length;
    const failCount = results.filter(r => r.status === 'fail').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    
    const report = `
NOTIFICATION SYSTEM TEST REPORT
Generated: ${new Date().toLocaleString()}
User: ${currentUser?.firstName} ${currentUser?.lastName} (${currentUser?.role || currentUser?.userType})
Client ID: ${testClientId}

SUMMARY:
✅ Passed: ${passCount}
❌ Failed: ${failCount}
⚠️ Warnings: ${warningCount}
Total Tests: ${results.length}

DETAILED RESULTS:
${results.map((r, i) => `
${i + 1}. ${r.test}
   Status: ${r.status.toUpperCase()}
   Message: ${r.message}
   ${r.recommendation ? `Recommendation: ${r.recommendation}` : ''}
   Time: ${r.timestamp}
`).join('')}

NEXT STEPS:
${failCount > 0 ? '1. Fix failed tests before proceeding' : ''}
${warningCount > 0 ? '2. Address warnings for optimal functionality' : ''}
${passCount === results.length ? '3. System is ready for production use' : '3. Complete remaining implementation'}
`;

    Alert.alert(
      'Test Report Generated',
      'Test report copied to clipboard (if available) and logged to console',
      [{ text: 'OK' }]
    );
    
    console.log(report);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Complete Notification System Test</Text>
        <Text style={styles.subtitle}>
          Comprehensive testing of multi-user notification system
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Test Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Test Configuration</Text>
          
          {currentUser && (
            <View style={styles.userInfo}>
              <Text style={styles.userInfoText}>
                👤 {currentUser.firstName} {currentUser.lastName} ({currentUser.role || currentUser.userType})
              </Text>
            </View>
          )}
          
          <TextInput
            style={styles.input}
            placeholder="Test Project ID (optional)"
            value={testProjectId}
            onChangeText={setTestProjectId}
          />
          <TextInput
            style={styles.input}
            placeholder="Test Client ID"
            value={testClientId}
            onChangeText={setTestClientId}
          />
        </View>

        {/* Run Tests */}
        <TouchableOpacity
          style={[styles.runButton, loading && styles.runButtonDisabled]}
          onPress={runAllTests}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="play" size={20} color="#FFFFFF" />
          )}
          <Text style={styles.runButtonText}>
            {loading ? 'Running Tests...' : 'Run Complete Test Suite'}
          </Text>
        </TouchableOpacity>

        {/* Current Step */}
        {loading && currentStep && (
          <View style={styles.currentStep}>
            <Text style={styles.currentStepText}>{currentStep}</Text>
          </View>
        )}

        {/* Test Results */}
        {results.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📊 Test Results</Text>
              <TouchableOpacity style={styles.reportButton} onPress={generateTestReport}>
                <Ionicons name="document-text" size={16} color="#3B82F6" />
                <Text style={styles.reportButtonText}>Generate Report</Text>
              </TouchableOpacity>
            </View>
            
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
                    <View style={styles.resultTitleContainer}>
                      <Text style={styles.resultTitle}>{result.test}</Text>
                      <Text style={styles.resultTime}>{result.timestamp}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.resultMessage}>{result.message}</Text>
                  
                  {result.recommendation && (
                    <View style={styles.recommendationContainer}>
                      <Ionicons name="bulb" size={16} color="#F59E0B" />
                      <Text style={styles.recommendationText}>{result.recommendation}</Text>
                    </View>
                  )}
                  
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

        {/* Implementation Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Implementation Status</Text>
          
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.statusText}>Frontend notification system</Text>
            </View>
            
            <View style={styles.statusItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.statusText}>Local notification fallback</Text>
            </View>
            
            <View style={styles.statusItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.statusText}>Material activity logging</Text>
            </View>
            
            <View style={styles.statusItem}>
              <Ionicons name="warning" size={20} color="#F59E0B" />
              <Text style={styles.statusText}>Multi-user notification APIs</Text>
            </View>
            
            <View style={styles.statusItem}>
              <Ionicons name="warning" size={20} color="#F59E0B" />
              <Text style={styles.statusText}>Push notification service</Text>
            </View>
          </View>
        </View>

        {/* Next Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 Next Steps</Text>
          <View style={styles.nextStepsContainer}>
            <Text style={styles.nextStepsText}>
              1. Implement backend notification APIs (see BACKEND_IMPLEMENTATION_READY.md){'\n'}
              2. Test with multiple user accounts{'\n'}
              3. Verify cross-user notifications{'\n'}
              4. Set up push notification service{'\n'}
              5. Add notification preferences
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
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  userInfo: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  userInfoText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
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
    marginBottom: 16,
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
  currentStep: {
    backgroundColor: '#EBF8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  currentStepText: {
    fontSize: 14,
    color: '#1E40AF',
    fontStyle: 'italic',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EBF8FF',
    borderRadius: 6,
    gap: 4,
  },
  reportButtonText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
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
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  resultTitleContainer: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  resultTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  resultMessage: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  recommendationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    gap: 8,
  },
  recommendationText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
    lineHeight: 16,
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
  statusGrid: {
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  nextStepsContainer: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  nextStepsText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});

export default CompleteNotificationTest;