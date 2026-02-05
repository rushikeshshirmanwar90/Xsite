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
  critical?: boolean;
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

const ComprehensiveNotificationTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [testClientId, setTestClientId] = useState('');
  const [currentStep, setCurrentStep] = useState('');
  const [systemStatus, setSystemStatus] = useState<'unknown' | 'working' | 'partial' | 'broken'>('unknown');

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

  // Test 1: System Configuration Check
  const testSystemConfiguration = async (): Promise<TestResult> => {
    setCurrentStep('⚙️ Testing system configuration...');
    
    try {
      const issues = [];
      const details: any = {
        domain: domain,
        currentUser: currentUser ? {
          id: currentUser._id,
          name: `${currentUser.firstName} ${currentUser.lastName}`,
          role: currentUser.role || currentUser.userType,
          clientId: currentUser.clientId
        } : null,
        testClientId: testClientId
      };

      if (!currentUser) {
        issues.push('No user logged in');
      }

      if (!testClientId) {
        issues.push('No client ID available');
      }

      if (domain.includes('localhost') || domain.includes('127.0.0.1')) {
        issues.push('Using localhost domain - may not work on device');
      }

      if (issues.length === 0) {
        return {
          test: '⚙️ System Configuration',
          status: 'pass',
          message: 'System configuration is correct',
          details,
          timestamp: ''
        };
      } else {
        return {
          test: '⚙️ System Configuration',
          status: 'warning',
          message: `Configuration issues found: ${issues.join(', ')}`,
          details: { ...details, issues },
          recommendation: 'Fix configuration issues before testing',
          timestamp: ''
        };
      }
    } catch (error) {
      return {
        test: '⚙️ System Configuration',
        status: 'fail',
        message: `Configuration error: ${error}`,
        timestamp: ''
      };
    }
  };

  // Test 2: Backend Connectivity
  const testBackendConnectivity = async (): Promise<TestResult> => {
    setCurrentStep('🌐 Testing backend connectivity...');
    
    try {
      // Test basic connectivity
      const response = await axios.get(`${domain}/api/materialActivity?limit=1`, {
        timeout: 10000
      });

      if (response.status === 200) {
        return {
          test: '🌐 Backend Connectivity',
          status: 'pass',
          message: 'Backend server is accessible and responding',
          details: {
            domain: domain,
            status: response.status,
            responseTime: 'Connected'
          },
          timestamp: ''
        };
      } else {
        return {
          test: '🌐 Backend Connectivity',
          status: 'warning',
          message: `Backend responded with status ${response.status}`,
          details: { domain: domain, status: response.status },
          timestamp: ''
        };
      }
    } catch (error: any) {
      return {
        test: '🌐 Backend Connectivity',
        status: 'fail',
        message: `Cannot connect to backend: ${error.message}`,
        details: {
          domain: domain,
          error: error.message,
          code: error.code
        },
        recommendation: 'Check if backend server is running and accessible',
        critical: true,
        timestamp: ''
      };
    }
  };

  // Test 3: Critical API Endpoints
  const testCriticalAPIs = async (): Promise<TestResult> => {
    setCurrentStep('🔌 Testing critical API endpoints...');
    
    try {
      const clientId = testClientId;
      if (!clientId) {
        return {
          test: '🔌 Critical API Endpoints',
          status: 'fail',
          message: 'No client ID available for API testing',
          timestamp: ''
        };
      }

      const apiTests = {
        materialActivity: { status: 'unknown', details: null },
        recipients: { status: 'unknown', details: null },
        send: { status: 'unknown', details: null }
      };

      // Test Material Activity API
      try {
        const materialResponse = await axios.get(`${domain}/api/materialActivity?clientId=${clientId}&limit=1`);
        if (materialResponse.data.success) {
          apiTests.materialActivity = {
            status: 'pass',
            details: { activitiesFound: materialResponse.data.data?.length || 0 }
          };
        } else {
          apiTests.materialActivity = {
            status: 'warning',
            details: { message: 'API returned success: false' }
          };
        }
      } catch (error: any) {
        apiTests.materialActivity = {
          status: 'fail',
          details: { error: error.response?.status || error.message }
        };
      }

      // Test Recipients API (Critical for multi-user notifications)
      try {
        const recipientsResponse = await axios.get(`${domain}/api/notifications/recipients?clientId=${clientId}`);
        if (recipientsResponse.data.success) {
          const recipients = recipientsResponse.data.recipients || [];
          apiTests.recipients = {
            status: 'pass',
            details: {
              recipientsFound: recipients.length,
              adminCount: recipients.filter((r: any) => r.userType === 'admin').length,
              staffCount: recipients.filter((r: any) => r.userType === 'staff').length,
              recipients: recipients.map((r: any) => ({
                fullName: r.fullName,
                userType: r.userType
              }))
            }
          };
        } else {
          apiTests.recipients = {
            status: 'warning',
            details: { message: 'API returned success: false' }
          };
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          apiTests.recipients = {
            status: 'fail',
            details: { error: 'API not implemented (404)' }
          };
        } else {
          apiTests.recipients = {
            status: 'fail',
            details: { error: error.response?.status || error.message }
          };
        }
      }

      // Test Send API (Critical for multi-user notifications)
      try {
        const testPayload = {
          title: 'API Test',
          body: 'Testing send API',
          category: 'material',
          action: 'test',
          data: { clientId, projectId: 'test' },
          recipients: [],
          timestamp: new Date().toISOString()
        };
        
        const sendResponse = await axios.post(`${domain}/api/notifications/send`, testPayload);
        if (sendResponse.data.success) {
          apiTests.send = {
            status: 'pass',
            details: { message: 'API accepts notifications' }
          };
        } else {
          apiTests.send = {
            status: 'warning',
            details: { message: 'API returned success: false' }
          };
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          apiTests.send = {
            status: 'fail',
            details: { error: 'API not implemented (404)' }
          };
        } else if (error.response?.status === 400) {
          apiTests.send = {
            status: 'pass',
            details: { message: 'API exists (validation error expected)' }
          };
        } else {
          apiTests.send = {
            status: 'fail',
            details: { error: error.response?.status || error.message }
          };
        }
      }

      // Determine overall API status
      const passCount = Object.values(apiTests).filter(t => t.status === 'pass').length;
      const failCount = Object.values(apiTests).filter(t => t.status === 'fail').length;
      
      let status: 'pass' | 'fail' | 'warning' = 'pass';
      let message = '';
      let recommendation = '';
      let critical = false;

      if (failCount === 0) {
        status = 'pass';
        message = 'All critical APIs are working correctly';
      } else if (apiTests.materialActivity.status === 'fail') {
        status = 'fail';
        message = 'Material Activity API failed - basic functionality broken';
        recommendation = 'Check backend server and database connectivity';
        critical = true;
      } else if (apiTests.recipients.status === 'fail' || apiTests.send.status === 'fail') {
        status = 'fail';
        message = 'Notification APIs missing - multi-user notifications will not work';
        recommendation = 'Implement missing notification APIs using BACKEND_NOTIFICATION_ROUTES.js';
        critical = true;
      } else {
        status = 'warning';
        message = `${passCount}/3 APIs working - partial functionality`;
      }

      return {
        test: '🔌 Critical API Endpoints',
        status,
        message,
        details: apiTests,
        recommendation,
        critical,
        timestamp: ''
      };

    } catch (error) {
      return {
        test: '🔌 Critical API Endpoints',
        status: 'fail',
        message: `API testing error: ${error}`,
        critical: true,
        timestamp: ''
      };
    }
  };

  // Test 4: Multi-User Notification Flow
  const testMultiUserFlow = async (): Promise<TestResult> => {
    setCurrentStep('👥 Testing multi-user notification flow...');
    
    try {
      const clientId = testClientId;
      if (!clientId || !currentUser) {
        return {
          test: '👥 Multi-User Notification Flow',
          status: 'fail',
          message: 'Missing user data or client ID for testing',
          timestamp: ''
        };
      }

      // Step 1: Get notification recipients
      let recipients = [];
      try {
        const recipientsResponse = await axios.get(`${domain}/api/notifications/recipients?clientId=${clientId}`);
        if (recipientsResponse.data.success) {
          recipients = recipientsResponse.data.recipients || [];
        } else {
          return {
            test: '👥 Multi-User Notification Flow',
            status: 'fail',
            message: 'Cannot get notification recipients - API returned error',
            details: recipientsResponse.data,
            timestamp: ''
          };
        }
      } catch (error: any) {
        return {
          test: '👥 Multi-User Notification Flow',
          status: 'fail',
          message: 'Recipients API not available - multi-user notifications impossible',
          details: { error: error.response?.status === 404 ? 'API not implemented' : error.message },
          recommendation: 'Implement GET /api/notifications/recipients endpoint',
          critical: true,
          timestamp: ''
        };
      }

      // Step 2: Analyze recipients
      const otherUsers = recipients.filter((r: any) => r.userId !== currentUser._id);
      const adminCount = recipients.filter((r: any) => r.userType === 'admin').length;
      const staffCount = recipients.filter((r: any) => r.userType === 'staff').length;

      if (recipients.length === 0) {
        return {
          test: '👥 Multi-User Notification Flow',
          status: 'warning',
          message: 'No users found for notification testing',
          details: { totalUsers: 0, currentUserId: currentUser._id },
          recommendation: 'Create additional user accounts (admin/staff) for the same client',
          timestamp: ''
        };
      }

      if (otherUsers.length === 0) {
        return {
          test: '👥 Multi-User Notification Flow',
          status: 'warning',
          message: 'Only current user found - cannot test multi-user notifications',
          details: {
            totalUsers: recipients.length,
            currentUserId: currentUser._id,
            otherUsers: 0
          },
          recommendation: 'Create additional user accounts for multi-user testing',
          timestamp: ''
        };
      }

      // Step 3: Test notification sending
      const testNotification = {
        title: '🧪 Multi-User Flow Test',
        body: `${currentUser.firstName} ${currentUser.lastName} is testing multi-user notifications`,
        category: 'material',
        action: 'test',
        data: {
          projectId: 'test-project-' + Date.now(),
          projectName: 'Multi-User Test Project',
          clientId,
          triggeredBy: {
            userId: currentUser._id,
            fullName: `${currentUser.firstName} ${currentUser.lastName}`,
            userType: currentUser.role || currentUser.userType || 'staff'
          }
        },
        recipients: otherUsers,
        timestamp: new Date().toISOString()
      };

      try {
        const sendResponse = await axios.post(`${domain}/api/notifications/send`, testNotification);
        
        if (sendResponse.data.success) {
          return {
            test: '👥 Multi-User Notification Flow',
            status: 'pass',
            message: `Multi-user notification flow working! Sent to ${otherUsers.length} users`,
            details: {
              totalRecipients: recipients.length,
              adminCount,
              staffCount,
              notificationsSent: sendResponse.data.data?.notificationsSent || otherUsers.length,
              recipients: otherUsers.map((r: any) => ({
                fullName: r.fullName,
                userType: r.userType
              }))
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
        return {
          test: '👥 Multi-User Notification Flow',
          status: 'fail',
          message: 'Send API not available - cannot distribute notifications',
          details: { error: error.response?.status === 404 ? 'API not implemented' : error.message },
          recommendation: 'Implement POST /api/notifications/send endpoint',
          critical: true,
          timestamp: ''
        };
      }

    } catch (error) {
      return {
        test: '👥 Multi-User Notification Flow',
        status: 'fail',
        message: `Multi-user flow test error: ${error}`,
        timestamp: ''
      };
    }
  };

  // Test 5: Material Activity Integration
  const testMaterialActivityIntegration = async (): Promise<TestResult> => {
    setCurrentStep('📦 Testing material activity integration...');
    
    try {
      const clientId = testClientId;
      if (!clientId || !currentUser) {
        return {
          test: '📦 Material Activity Integration',
          status: 'fail',
          message: 'Missing user data or client ID for testing',
          timestamp: ''
        };
      }

      const testActivity = {
        clientId,
        projectId: 'integration-test-' + Date.now(),
        projectName: 'Integration Test Project',
        sectionName: 'Test Section',
        materials: [{
          name: 'Integration Test Material',
          unit: 'kg',
          specs: { grade: 'Test Grade' },
          qnt: 2,
          perUnitCost: 200,
          totalCost: 400,
          cost: 400
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

      console.log('🧪 Creating test material activity...');
      const response = await axios.post(`${domain}/api/materialActivity`, testActivity);

      if (response.data.success) {
        // Wait for notification processing
        await new Promise(resolve => setTimeout(resolve, 3000));

        return {
          test: '📦 Material Activity Integration',
          status: 'pass',
          message: 'Material activity created successfully - notifications should be triggered',
          details: {
            activityId: response.data.data?._id,
            projectId: testActivity.projectId,
            clientId,
            user: testActivity.user.fullName,
            materialsCount: 1,
            totalCost: 400
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

  // Test 6: Local Notification Fallback
  const testLocalNotificationFallback = async (): Promise<TestResult> => {
    setCurrentStep('📱 Testing local notification fallback...');
    
    try {
      const NotificationManager = await import('@/services/notificationManager').then(m => m.default);
      const notificationManager = NotificationManager.getInstance();

      const testId = await notificationManager.scheduleLocalNotification(
        '🧪 Fallback System Test',
        'Testing local notification fallback to ensure system works when backend is unavailable',
        {
          category: 'material',
          action: 'test',
          projectId: 'fallback-test',
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
          recommendation: 'Local fallback ensures notifications work even if backend fails',
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
    setCurrentStep('Starting comprehensive notification system test...');

    const tests = [
      testSystemConfiguration,
      testBackendConnectivity,
      testCriticalAPIs,
      testMultiUserFlow,
      testMaterialActivityIntegration,
      testLocalNotificationFallback
    ];

    let passCount = 0;
    let failCount = 0;
    let warningCount = 0;
    let criticalFailures = 0;

    for (let i = 0; i < tests.length; i++) {
      try {
        const result = await tests[i]();
        addResult(result);
        
        if (result.status === 'pass') passCount++;
        else if (result.status === 'fail') {
          failCount++;
          if (result.critical) criticalFailures++;
        }
        else if (result.status === 'warning') warningCount++;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        const errorResult: TestResult = {
          test: `Test ${i + 1}`,
          status: 'fail',
          message: `Test execution error: ${error}`,
          critical: true,
          timestamp: new Date().toLocaleTimeString()
        };
        addResult(errorResult);
        failCount++;
        criticalFailures++;
      }
    }

    // Determine system status
    if (criticalFailures > 0) {
      setSystemStatus('broken');
    } else if (failCount > 0) {
      setSystemStatus('partial');
    } else if (warningCount > 0) {
      setSystemStatus('partial');
    } else {
      setSystemStatus('working');
    }

    setCurrentStep('Comprehensive test completed');
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

  const getSystemStatusDisplay = () => {
    switch (systemStatus) {
      case 'working':
        return { text: '🎉 FULLY WORKING', color: '#10B981', bg: '#D1FAE5' };
      case 'partial':
        return { text: '⚠️ PARTIALLY WORKING', color: '#F59E0B', bg: '#FEF3C7' };
      case 'broken':
        return { text: '❌ CRITICAL ISSUES', color: '#EF4444', bg: '#FEE2E2' };
      default:
        return { text: '🔍 TESTING...', color: '#6B7280', bg: '#F3F4F6' };
    }
  };

  const generateComprehensiveReport = () => {
    const passCount = results.filter(r => r.status === 'pass').length;
    const failCount = results.filter(r => r.status === 'fail').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    const criticalCount = results.filter(r => r.critical).length;
    
    const report = `
COMPREHENSIVE NOTIFICATION SYSTEM TEST REPORT
Generated: ${new Date().toLocaleString()}
User: ${currentUser?.firstName} ${currentUser?.lastName} (${currentUser?.role || currentUser?.userType})
Client ID: ${testClientId}
Backend: ${domain}

SYSTEM STATUS: ${getSystemStatusDisplay().text}

SUMMARY:
✅ Passed: ${passCount}
❌ Failed: ${failCount}
⚠️ Warnings: ${warningCount}
🚨 Critical Issues: ${criticalCount}
📊 Total Tests: ${results.length}

DETAILED RESULTS:
${results.map((r, i) => `
${i + 1}. ${r.test}
   Status: ${r.status.toUpperCase()}${r.critical ? ' (CRITICAL)' : ''}
   Message: ${r.message}
   ${r.recommendation ? `Recommendation: ${r.recommendation}` : ''}
   Time: ${r.timestamp}
`).join('')}

DIAGNOSIS:
${systemStatus === 'working' ? '🎉 Multi-user notifications are fully functional!' : ''}
${systemStatus === 'partial' ? '⚠️ System partially working - some features need attention' : ''}
${systemStatus === 'broken' ? '❌ Critical issues prevent multi-user notifications from working' : ''}

NEXT STEPS:
${criticalCount > 0 ? '1. Fix critical issues immediately (backend APIs missing)' : ''}
${failCount > 0 ? '2. Address failed tests using provided solutions' : ''}
${warningCount > 0 ? '3. Optimize warnings for better functionality' : ''}
${passCount === results.length ? '4. System ready for production!' : '4. Complete remaining fixes'}

IMPLEMENTATION FILES:
- BACKEND_NOTIFICATION_ROUTES.js (Backend API code)
- STEP_BY_STEP_FIX.md (Implementation guide)
- test-after-fix.js (Verification script)
`;

    Alert.alert(
      'Comprehensive Test Report',
      'Detailed report logged to console',
      [{ text: 'OK' }]
    );
    
    console.log(report);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Comprehensive Notification Test</Text>
        <Text style={styles.subtitle}>
          Complete diagnostic testing of the notification system
        </Text>
        
        {systemStatus !== 'unknown' && (
          <View style={[styles.statusBadge, { backgroundColor: getSystemStatusDisplay().bg }]}>
            <Text style={[styles.statusText, { color: getSystemStatusDisplay().color }]}>
              {getSystemStatusDisplay().text}
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
            placeholder="Client ID (auto-detected)"
            value={testClientId}
            onChangeText={setTestClientId}
          />
        </View>

        {/* Run Test */}
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
            {loading ? 'Running Comprehensive Test...' : 'Run Complete Diagnostic Test'}
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
              <TouchableOpacity style={styles.reportButton} onPress={generateComprehensiveReport}>
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
                    { backgroundColor: getStatusColor(result.status) },
                    result.critical && styles.criticalCard
                  ]}
                >
                  <View style={styles.resultHeader}>
                    <Ionicons name={icon.name as any} size={24} color={icon.color} />
                    <View style={styles.resultTitleContainer}>
                      <Text style={styles.resultTitle}>
                        {result.test}
                        {result.critical && <Text style={styles.criticalBadge}> CRITICAL</Text>}
                      </Text>
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

        {/* Solution Guide */}
        {systemStatus === 'broken' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔧 Critical Fix Required</Text>
            <View style={styles.solutionCard}>
              <Text style={styles.solutionTitle}>Backend APIs Missing</Text>
              <Text style={styles.solutionText}>
                Your notification system needs 2 backend API endpoints to work properly:
              </Text>
              <Text style={styles.solutionCode}>
                GET /api/notifications/recipients{'\n'}
                POST /api/notifications/send
              </Text>
              <Text style={styles.solutionText}>
                Use BACKEND_NOTIFICATION_ROUTES.js to implement these endpoints.
              </Text>
            </View>
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
  criticalCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
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
  criticalBadge: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '700',
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
  solutionCard: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  solutionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
  },
  solutionText: {
    fontSize: 14,
    color: '#7F1D1D',
    lineHeight: 20,
    marginBottom: 8,
  },
  solutionCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#7F1D1D',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
});

export default ComprehensiveNotificationTest;