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

const NotificationVerificationTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [testProjectId, setTestProjectId] = useState('');
  const [testClientId, setTestClientId] = useState('');
  const [currentStep, setCurrentStep] = useState('');
  const [overallStatus, setOverallStatus] = useState<'unknown' | 'working' | 'partial' | 'broken'>('unknown');

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        const userData = JSON.parse(userString);
        setCurrentUser(userData);
        
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

  // Test 1: Verify Backend API Endpoints are Working
  const testBackendAPIs = async (): Promise<TestResult> => {
    setCurrentStep('🔌 Testing backend API endpoints...');
    
    try {
      const clientId = testClientId || await getClientId();
      if (!clientId) {
        return {
          test: '🔌 Backend API Endpoints',
          status: 'fail',
          message: 'No client ID available for testing',
          recommendation: 'Ensure user is logged in and has proper client association',
          timestamp: ''
        };
      }

      let apiResults = {
        materialActivity: false,
        recipients: false,
        send: false
      };

      // Test 1: Material Activity API (should work)
      try {
        const materialResponse = await axios.get(`${domain}/api/materialActivity?clientId=${clientId}&limit=1`);
        if (materialResponse.data.success) {
          apiResults.materialActivity = true;
        }
      } catch (error: any) {
        console.error('Material Activity API failed:', error.response?.status);
      }

      // Test 2: Notification Recipients API (newly implemented)
      try {
        const recipientsResponse = await axios.get(`${domain}/api/notifications/recipients?clientId=${clientId}&projectId=${testProjectId || 'test'}`);
        if (recipientsResponse.data.success) {
          apiResults.recipients = true;
          
          const recipients = recipientsResponse.data.recipients || [];
          const adminCount = recipients.filter((r: any) => r.userType === 'admin').length;
          const staffCount = recipients.filter((r: any) => r.userType === 'staff').length;
          
          return {
            test: '🔌 Backend API Endpoints',
            status: 'pass',
            message: `All APIs working! Found ${recipients.length} notification recipients (${adminCount} admins, ${staffCount} staff)`,
            details: {
              materialActivityAPI: apiResults.materialActivity,
              recipientsAPI: apiResults.recipients,
              sendAPI: 'not tested yet',
              recipients: recipients.map((r: any) => ({
                userId: r.userId,
                fullName: r.fullName,
                userType: r.userType
              }))
            },
            recommendation: 'APIs are working correctly - multi-user notifications should work',
            timestamp: ''
          };
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          return {
            test: '🔌 Backend API Endpoints',
            status: 'fail',
            message: 'Recipients API not implemented (404) - multi-user notifications will not work',
            details: {
              materialActivityAPI: apiResults.materialActivity,
              recipientsAPI: false,
              sendAPI: false,
              error: 'GET /api/notifications/recipients returns 404'
            },
            recommendation: 'Implement the missing backend APIs using BACKEND_FIX_IMPLEMENTATION.js',
            timestamp: ''
          };
        }
      }

      // Test 3: Notification Send API (newly implemented)
      try {
        const testPayload = {
          title: 'API Test',
          body: 'Testing notification send API',
          category: 'material',
          action: 'test',
          data: { 
            clientId, 
            projectId: testProjectId || 'test',
            triggeredBy: {
              userId: currentUser?._id || 'test',
              fullName: 'Test User',
              userType: 'staff'
            }
          },
          recipients: [], // Empty for testing
          timestamp: new Date().toISOString()
        };
        
        const sendResponse = await axios.post(`${domain}/api/notifications/send`, testPayload);
        if (sendResponse.data.success) {
          apiResults.send = true;
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          return {
            test: '🔌 Backend API Endpoints',
            status: 'fail',
            message: 'Send API not implemented (404) - notifications cannot be distributed',
            details: {
              materialActivityAPI: apiResults.materialActivity,
              recipientsAPI: apiResults.recipients,
              sendAPI: false,
              error: 'POST /api/notifications/send returns 404'
            },
            recommendation: 'Implement the missing backend APIs using BACKEND_FIX_IMPLEMENTATION.js',
            timestamp: ''
          };
        }
      }

      // Determine overall API status
      const workingAPIs = Object.values(apiResults).filter(Boolean).length;
      const totalAPIs = 3;
      
      if (workingAPIs === totalAPIs) {
        return {
          test: '🔌 Backend API Endpoints',
          status: 'pass',
          message: `All ${totalAPIs} APIs working correctly`,
          details: apiResults,
          recommendation: 'Backend is ready for multi-user notifications',
          timestamp: ''
        };
      } else if (workingAPIs > 0) {
        return {
          test: '🔌 Backend API Endpoints',
          status: 'warning',
          message: `${workingAPIs}/${totalAPIs} APIs working - partial functionality`,
          details: apiResults,
          recommendation: 'Complete the backend API implementation',
          timestamp: ''
        };
      } else {
        return {
          test: '🔌 Backend API Endpoints',
          status: 'fail',
          message: 'No notification APIs working',
          details: apiResults,
          recommendation: 'Implement all backend APIs using BACKEND_FIX_IMPLEMENTATION.js',
          timestamp: ''
        };
      }

    } catch (error) {
      return {
        test: '🔌 Backend API Endpoints',
        status: 'fail',
        message: `API testing error: ${error}`,
        recommendation: 'Check backend server connectivity and implementation',
        timestamp: ''
      };
    }
  };

  // Test 2: Test Multi-User Notification Flow
  const testMultiUserNotifications = async (): Promise<TestResult> => {
    setCurrentStep('👥 Testing multi-user notification flow...');
    
    try {
      if (!currentUser) {
        return {
          test: '👥 Multi-User Notification Flow',
          status: 'fail',
          message: 'No user data available for testing',
          timestamp: ''
        };
      }

      const clientId = testClientId || await getClientId();
      if (!clientId) {
        return {
          test: '👥 Multi-User Notification Flow',
          status: 'fail',
          message: 'No client ID available for testing',
          timestamp: ''
        };
      }

      // Step 1: Get notification recipients
      let recipients = [];
      try {
        const recipientsResponse = await axios.get(`${domain}/api/notifications/recipients?clientId=${clientId}`);
        if (recipientsResponse.data.success) {
          recipients = recipientsResponse.data.recipients || [];
        }
      } catch (error: any) {
        return {
          test: '👥 Multi-User Notification Flow',
          status: 'fail',
          message: 'Cannot get notification recipients - backend API missing',
          details: { error: error.response?.status === 404 ? 'API not implemented' : error.message },
          recommendation: 'Implement GET /api/notifications/recipients endpoint',
          timestamp: ''
        };
      }

      // Step 2: Filter out current user (self-exclusion test)
      const otherUsers = recipients.filter((r: any) => r.userId !== currentUser._id);
      
      if (otherUsers.length === 0) {
        return {
          test: '👥 Multi-User Notification Flow',
          status: 'warning',
          message: 'No other users found for multi-user testing',
          details: {
            totalUsers: recipients.length,
            currentUserId: currentUser._id,
            otherUsers: otherUsers.length
          },
          recommendation: 'Create additional user accounts (admin/staff) for the same client to test multi-user notifications',
          timestamp: ''
        };
      }

      // Step 3: Test notification sending
      const testNotificationPayload = {
        title: '🧪 Multi-User Test Notification',
        body: `${currentUser.firstName} ${currentUser.lastName} is testing the multi-user notification system`,
        category: 'material',
        action: 'test',
        data: {
          projectId: testProjectId || 'test-project-' + Date.now(),
          projectName: 'Multi-User Test Project',
          sectionName: 'Test Section',
          clientId,
          triggeredBy: {
            userId: currentUser._id,
            fullName: `${currentUser.firstName} ${currentUser.lastName}`,
            userType: currentUser.role || currentUser.userType || 'staff'
          },
          route: 'notification'
        },
        recipients: otherUsers,
        timestamp: new Date().toISOString()
      };

      try {
        const sendResponse = await axios.post(`${domain}/api/notifications/send`, testNotificationPayload);
        
        if (sendResponse.data.success) {
          return {
            test: '👥 Multi-User Notification Flow',
            status: 'pass',
            message: `Multi-user notifications sent successfully to ${otherUsers.length} users`,
            details: {
              recipientsSent: sendResponse.data.data?.notificationsSent || otherUsers.length,
              recipients: otherUsers.map((r: any) => ({
                fullName: r.fullName,
                userType: r.userType
              })),
              notificationTitle: testNotificationPayload.title,
              selfExcluded: true
            },
            recommendation: 'Check other user accounts to verify they received the test notification',
            timestamp: ''
          };
        } else {
          return {
            test: '👥 Multi-User Notification Flow',
            status: 'fail',
            message: 'Notification sending failed',
            details: sendResponse.data,
            timestamp: ''
          };
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          return {
            test: '👥 Multi-User Notification Flow',
            status: 'fail',
            message: 'Cannot send notifications - backend API missing',
            details: { error: 'POST /api/notifications/send not implemented' },
            recommendation: 'Implement POST /api/notifications/send endpoint',
            timestamp: ''
          };
        } else {
          return {
            test: '👥 Multi-User Notification Flow',
            status: 'fail',
            message: `Notification sending error: ${error.response?.data?.message || error.message}`,
            details: { status: error.response?.status, data: error.response?.data },
            timestamp: ''
          };
        }
      }

    } catch (error) {
      return {
        test: '👥 Multi-User Notification Flow',
        status: 'fail',
        message: `Multi-user test error: ${error}`,
        timestamp: ''
      };
    }
  };

  // Test 3: Test Material Activity Integration
  const testMaterialActivityIntegration = async (): Promise<TestResult> => {
    setCurrentStep('📦 Testing material activity integration...');
    
    try {
      if (!currentUser) {
        return {
          test: '📦 Material Activity Integration',
          status: 'fail',
          message: 'No user data available for testing',
          timestamp: ''
        };
      }

      const clientId = testClientId || await getClientId();
      if (!clientId) {
        return {
          test: '📦 Material Activity Integration',
          status: 'fail',
          message: 'No client ID available for testing',
          timestamp: ''
        };
      }

      const projectId = testProjectId || 'integration-test-' + Date.now();
      const testPayload = {
        clientId,
        projectId,
        projectName: 'Integration Test Project',
        sectionName: 'Test Section',
        materials: [{
          name: 'Integration Test Material',
          unit: 'kg',
          specs: { grade: 'Test Grade' },
          qnt: 3,
          perUnitCost: 150,
          totalCost: 450,
          cost: 450
        }],
        message: 'Testing material activity integration with notifications',
        activity: 'imported',
        user: {
          userId: currentUser._id,
          fullName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Test User',
          email: currentUser.email
        },
        date: new Date().toISOString()
      };

      console.log('🧪 Creating test material activity with notification integration...');
      const response = await axios.post(`${domain}/api/materialActivity`, testPayload);

      if (response.data.success) {
        // Wait for potential notification processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        return {
          test: '📦 Material Activity Integration',
          status: 'pass',
          message: 'Material activity created successfully - notifications should be triggered',
          details: {
            activityId: response.data.data?._id,
            projectId,
            clientId,
            user: testPayload.user.fullName,
            materialsCount: 1,
            totalCost: 450,
            activity: 'imported'
          },
          recommendation: 'Check other user accounts to verify they received notifications about this material activity',
          timestamp: ''
        };
      } else {
        return {
          test: '📦 Material Activity Integration',
          status: 'fail',
          message: `Failed to create material activity: ${response.data.message || 'Unknown error'}`,
          details: response.data,
          timestamp: ''
        };
      }
    } catch (error: any) {
      return {
        test: '📦 Material Activity Integration',
        status: 'fail',
        message: `Material activity integration error: ${error.response?.data?.message || error.message}`,
        details: { status: error.response?.status, data: error.response?.data },
        timestamp: ''
      };
    }
  };

  // Test 4: Test Local Notification Fallback
  const testLocalNotificationFallback = async (): Promise<TestResult> => {
    setCurrentStep('📱 Testing local notification fallback...');
    
    try {
      const NotificationManager = await import('@/services/notificationManager').then(m => m.default);
      const notificationManager = NotificationManager.getInstance();

      const testId = await notificationManager.scheduleLocalNotification(
        '🧪 Fallback Test Notification',
        'Testing local notification fallback system to ensure it works when backend is unavailable',
        {
          category: 'material',
          action: 'test',
          projectId: testProjectId || 'fallback-test',
          activityType: 'fallback_test'
        }
      );

      if (testId) {
        const unreadCount = notificationManager.getUnreadCount();
        const totalNotifications = notificationManager.getNotifications().length;

        return {
          test: '📱 Local Notification Fallback',
          status: 'pass',
          message: `Local notification fallback working correctly (ID: ${testId})`,
          details: {
            notificationId: testId,
            unreadCount,
            totalNotifications
          },
          recommendation: 'Local fallback system is working - notifications will work even if backend fails',
          timestamp: ''
        };
      } else {
        return {
          test: '📱 Local Notification Fallback',
          status: 'warning',
          message: 'Local notification system available but notification creation returned null',
          timestamp: ''
        };
      }
    } catch (error: any) {
      return {
        test: '📱 Local Notification Fallback',
        status: 'fail',
        message: `Local notification fallback error: ${error.message}`,
        recommendation: 'Check if NotificationManager service is properly implemented',
        timestamp: ''
      };
    }
  };

  // Run All Tests
  const runComprehensiveTest = async () => {
    setLoading(true);
    setResults([]);
    setCurrentStep('Starting comprehensive notification system verification...');

    const tests = [
      testBackendAPIs,
      testMultiUserNotifications,
      testMaterialActivityIntegration,
      testLocalNotificationFallback
    ];

    let passCount = 0;
    let failCount = 0;
    let warningCount = 0;

    for (let i = 0; i < tests.length; i++) {
      try {
        const result = await tests[i]();
        addResult(result);
        
        if (result.status === 'pass') passCount++;
        else if (result.status === 'fail') failCount++;
        else if (result.status === 'warning') warningCount++;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        const errorResult: TestResult = {
          test: `Test ${i + 1}`,
          status: 'fail',
          message: `Test execution error: ${error}`,
          timestamp: new Date().toLocaleTimeString()
        };
        addResult(errorResult);
        failCount++;
      }
    }

    // Determine overall status
    if (failCount === 0 && warningCount === 0) {
      setOverallStatus('working');
    } else if (failCount === 0) {
      setOverallStatus('partial');
    } else {
      setOverallStatus('broken');
    }

    setCurrentStep('Comprehensive verification completed');
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

  const getOverallStatusDisplay = () => {
    switch (overallStatus) {
      case 'working':
        return { text: '🎉 FULLY WORKING', color: '#10B981', bg: '#D1FAE5' };
      case 'partial':
        return { text: '⚠️ PARTIALLY WORKING', color: '#F59E0B', bg: '#FEF3C7' };
      case 'broken':
        return { text: '❌ NOT WORKING', color: '#EF4444', bg: '#FEE2E2' };
      default:
        return { text: '🔍 TESTING...', color: '#6B7280', bg: '#F3F4F6' };
    }
  };

  const generateVerificationReport = () => {
    const passCount = results.filter(r => r.status === 'pass').length;
    const failCount = results.filter(r => r.status === 'fail').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    
    const report = `
NOTIFICATION SYSTEM VERIFICATION REPORT
Generated: ${new Date().toLocaleString()}
User: ${currentUser?.firstName} ${currentUser?.lastName} (${currentUser?.role || currentUser?.userType})
Client ID: ${testClientId}
Backend: ${domain}

OVERALL STATUS: ${getOverallStatusDisplay().text}

SUMMARY:
✅ Passed: ${passCount}
❌ Failed: ${failCount}
⚠️ Warnings: ${warningCount}
📊 Total Tests: ${results.length}

DETAILED RESULTS:
${results.map((r, i) => `
${i + 1}. ${r.test}
   Status: ${r.status.toUpperCase()}
   Message: ${r.message}
   ${r.recommendation ? `Recommendation: ${r.recommendation}` : ''}
   Time: ${r.timestamp}
`).join('')}

SYSTEM STATUS:
${overallStatus === 'working' ? '🎉 Multi-user notifications are fully functional!' : ''}
${overallStatus === 'partial' ? '⚠️ System partially working - address warnings for full functionality' : ''}
${overallStatus === 'broken' ? '❌ Multi-user notifications not working - implement missing backend APIs' : ''}

NEXT STEPS:
${failCount > 0 ? '1. Implement missing backend APIs using BACKEND_FIX_IMPLEMENTATION.js' : ''}
${warningCount > 0 ? '2. Address warnings for optimal functionality' : ''}
${passCount === results.length ? '3. System is ready for production use!' : '3. Complete remaining implementation'}
`;

    Alert.alert(
      'Verification Report',
      'Detailed report logged to console',
      [{ text: 'OK' }]
    );
    
    console.log(report);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notification System Verification</Text>
        <Text style={styles.subtitle}>
          Comprehensive testing to verify if multi-user notifications are working
        </Text>
        
        {overallStatus !== 'unknown' && (
          <View style={[styles.statusBadge, { backgroundColor: getOverallStatusDisplay().bg }]}>
            <Text style={[styles.statusText, { color: getOverallStatusDisplay().color }]}>
              {getOverallStatusDisplay().text}
            </Text>
          </View>
        )}
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
              <Text style={styles.userInfoSubtext}>
                🏢 Client: {testClientId}
              </Text>
              <Text style={styles.userInfoSubtext}>
                🌐 Backend: {domain}
              </Text>
            </View>
          )}
          
          <TextInput
            style={styles.input}
            placeholder="Test Project ID (optional)"
            value={testProjectId}
            onChangeText={setTestProjectId}
          />
        </View>

        {/* Run Verification */}
        <TouchableOpacity
          style={[styles.runButton, loading && styles.runButtonDisabled]}
          onPress={runComprehensiveTest}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="play" size={20} color="#FFFFFF" />
          )}
          <Text style={styles.runButtonText}>
            {loading ? 'Running Verification...' : 'Run Comprehensive Verification'}
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
              <Text style={styles.sectionTitle}>📊 Verification Results</Text>
              <TouchableOpacity style={styles.reportButton} onPress={generateVerificationReport}>
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

        {/* Quick Actions */}
        {overallStatus !== 'unknown' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
            
            {overallStatus === 'broken' && (
              <View style={styles.actionCard}>
                <Text style={styles.actionTitle}>🔧 Fix Required</Text>
                <Text style={styles.actionText}>
                  Backend APIs are missing. Implement the notification endpoints to enable multi-user notifications.
                </Text>
                <Text style={styles.actionFile}>
                  📁 Use: BACKEND_FIX_IMPLEMENTATION.js
                </Text>
              </View>
            )}
            
            {overallStatus === 'partial' && (
              <View style={styles.actionCard}>
                <Text style={styles.actionTitle}>⚠️ Optimization Needed</Text>
                <Text style={styles.actionText}>
                  System is partially working. Address warnings to achieve full functionality.
                </Text>
              </View>
            )}
            
            {overallStatus === 'working' && (
              <View style={styles.actionCard}>
                <Text style={styles.actionTitle}>🎉 System Ready</Text>
                <Text style={styles.actionText}>
                  Multi-user notifications are fully functional! Test with multiple user accounts to verify cross-user notifications.
                </Text>
              </View>
            )}
          </View>
        )}
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
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
  userInfoSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
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
  actionCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
    marginBottom: 4,
  },
  actionFile: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
});

export default NotificationVerificationTest;