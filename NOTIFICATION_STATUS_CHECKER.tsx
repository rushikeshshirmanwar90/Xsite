import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { domain } from '@/lib/domain';
import { getClientId } from '@/functions/clientId';

interface StatusResult {
  test: string;
  status: 'pass' | 'fail' | 'warning' | 'info';
  message: string;
  details?: any;
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
}

const NotificationStatusChecker: React.FC = () => {
  const [results, setResults] = useState<StatusResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [clientId, setClientId] = useState('');
  const [overallStatus, setOverallStatus] = useState<'unknown' | 'working' | 'broken' | 'partial'>('unknown');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        const userData = JSON.parse(userString);
        setCurrentUser(userData);
        
        const id = await getClientId();
        setClientId(id || userData.clientId || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const addResult = (result: StatusResult) => {
    setResults(prev => [...prev, result]);
  };

  // Test Backend Connectivity
  const testConnectivity = async (): Promise<StatusResult> => {
    try {
      const response = await axios.get(`${domain}/api/materialActivity?limit=1`, { timeout: 10000 });
      
      if (response.status === 200) {
        return {
          test: '🌐 Backend Connectivity',
          status: 'pass',
          message: 'Backend server is accessible and responding'
        };
      } else {
        return {
          test: '🌐 Backend Connectivity',
          status: 'warning',
          message: `Backend responded with status ${response.status}`
        };
      }
    } catch (error: any) {
      return {
        test: '🌐 Backend Connectivity',
        status: 'fail',
        message: `Cannot connect to backend: ${error.message}`,
        critical: true
      };
    }
  };

  // Test Notification APIs
  const testNotificationAPIs = async (): Promise<StatusResult> => {
    if (!clientId) {
      return {
        test: '🔌 Notification APIs',
        status: 'fail',
        message: 'No client ID available for testing',
        critical: true
      };
    }

    let recipientsWorking = false;
    let sendWorking = false;
    let recipientCount = 0;

    // Test Recipients API
    try {
      const recipientsResponse = await axios.get(`${domain}/api/notifications/recipients?clientId=${clientId}`);
      if (recipientsResponse.data.success) {
        recipientsWorking = true;
        recipientCount = recipientsResponse.data.recipients?.length || 0;
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        // API exists but has other errors
        recipientsWorking = false;
      }
    }

    // Test Send API
    try {
      const testPayload = {
        title: 'Test',
        body: 'Test notification',
        category: 'material',
        action: 'test',
        data: { clientId },
        recipients: [],
        timestamp: new Date().toISOString()
      };
      
      const sendResponse = await axios.post(`${domain}/api/notifications/send`, testPayload);
      if (sendResponse.data.success) {
        sendWorking = true;
      }
    } catch (error: any) {
      if (error.response?.status === 400) {
        // API exists but validation error (expected with empty recipients)
        sendWorking = true;
      } else if (error.response?.status !== 404) {
        // API exists but has other errors
        sendWorking = false;
      }
    }

    // Determine result
    if (recipientsWorking && sendWorking) {
      return {
        test: '🔌 Notification APIs',
        status: 'pass',
        message: `Both notification APIs working! Found ${recipientCount} potential recipients`,
        details: { recipientCount, recipientsAPI: true, sendAPI: true }
      };
    } else if (!recipientsWorking && !sendWorking) {
      return {
        test: '🔌 Notification APIs',
        status: 'fail',
        message: 'Both notification APIs missing (404 errors) - multi-user notifications will not work',
        details: { recipientsAPI: false, sendAPI: false },
        critical: true
      };
    } else {
      return {
        test: '🔌 Notification APIs',
        status: 'warning',
        message: `Partial implementation: Recipients API ${recipientsWorking ? 'working' : 'missing'}, Send API ${sendWorking ? 'working' : 'missing'}`,
        details: { recipientsAPI: recipientsWorking, sendAPI: sendWorking },
        critical: true
      };
    }
  };

  // Test Multi-User Flow
  const testMultiUserFlow = async (): Promise<StatusResult> => {
    if (!clientId || !currentUser) {
      return {
        test: '👥 Multi-User Flow',
        status: 'fail',
        message: 'Missing user data or client ID for testing'
      };
    }

    try {
      // Get recipients
      const recipientsResponse = await axios.get(`${domain}/api/notifications/recipients?clientId=${clientId}`);
      
      if (!recipientsResponse.data.success) {
        return {
          test: '👥 Multi-User Flow',
          status: 'fail',
          message: 'Cannot get notification recipients'
        };
      }

      const recipients = recipientsResponse.data.recipients || [];
      const otherUsers = recipients.filter((r: any) => r.userId !== currentUser._id);

      if (recipients.length === 0) {
        return {
          test: '👥 Multi-User Flow',
          status: 'warning',
          message: 'No users found for multi-user testing - create additional user accounts'
        };
      }

      if (otherUsers.length === 0) {
        return {
          test: '👥 Multi-User Flow',
          status: 'warning',
          message: 'Only current user found - create additional users for multi-user testing'
        };
      }

      // Test sending notification
      const testNotification = {
        title: '🧪 Multi-User Test',
        body: `${currentUser.firstName} ${currentUser.lastName} is testing multi-user notifications`,
        category: 'material',
        action: 'test',
        data: {
          clientId,
          projectId: 'test-' + Date.now(),
          triggeredBy: {
            userId: currentUser._id,
            fullName: `${currentUser.firstName} ${currentUser.lastName}`,
            userType: currentUser.role || currentUser.userType || 'staff'
          }
        },
        recipients: otherUsers,
        timestamp: new Date().toISOString()
      };

      const sendResponse = await axios.post(`${domain}/api/notifications/send`, testNotification);
      
      if (sendResponse.data.success) {
        return {
          test: '👥 Multi-User Flow',
          status: 'pass',
          message: `Multi-user notifications working! Sent to ${otherUsers.length} users`,
          details: {
            totalUsers: recipients.length,
            notificationsSent: otherUsers.length,
            recipients: otherUsers.map((r: any) => ({ fullName: r.fullName, userType: r.userType }))
          }
        };
      } else {
        return {
          test: '👥 Multi-User Flow',
          status: 'fail',
          message: 'Multi-user notification sending failed'
        };
      }
    } catch (error: any) {
      return {
        test: '👥 Multi-User Flow',
        status: 'fail',
        message: `Multi-user flow error: ${error.response?.data?.message || error.message}`
      };
    }
  };

  // Test Local Notifications
  const testLocalNotifications = async (): Promise<StatusResult> => {
    try {
      const NotificationManager = await import('@/services/notificationManager').then(m => m.default);
      const notificationManager = NotificationManager.getInstance();

      const testId = await notificationManager.scheduleLocalNotification(
        '🧪 Local Test',
        'Testing local notification system',
        { category: 'material', action: 'test' }
      );

      if (testId) {
        return {
          test: '📱 Local Notifications',
          status: 'pass',
          message: 'Local notification system working correctly'
        };
      } else {
        return {
          test: '📱 Local Notifications',
          status: 'warning',
          message: 'Local notification system available but creation failed'
        };
      }
    } catch (error: any) {
      return {
        test: '📱 Local Notifications',
        status: 'fail',
        message: `Local notification error: ${error.message}`
      };
    }
  };

  // Run All Tests
  const runStatusCheck = async () => {
    setLoading(true);
    setResults([]);

    const tests = [
      testConnectivity,
      testNotificationAPIs,
      testMultiUserFlow,
      testLocalNotifications
    ];

    let passCount = 0;
    let failCount = 0;
    let criticalFailures = 0;

    for (const test of tests) {
      try {
        const result = await test();
        addResult(result);
        
        if (result.status === 'pass') passCount++;
        else if (result.status === 'fail') {
          failCount++;
          if (result.critical) criticalFailures++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        addResult({
          test: 'Test Error',
          status: 'fail',
          message: `Test execution error: ${error}`,
          critical: true
        });
        failCount++;
        criticalFailures++;
      }
    }

    // Determine overall status
    if (criticalFailures > 0) {
      setOverallStatus('broken');
    } else if (failCount > 0) {
      setOverallStatus('partial');
    } else {
      setOverallStatus('working');
    }

    setLoading(false);
  };

  const getStatusIcon = (status: StatusResult['status']) => {
    switch (status) {
      case 'pass': return { name: 'checkmark-circle', color: '#10B981' };
      case 'fail': return { name: 'close-circle', color: '#EF4444' };
      case 'warning': return { name: 'warning', color: '#F59E0B' };
      case 'info': return { name: 'information-circle', color: '#3B82F6' };
    }
  };

  const getStatusColor = (status: StatusResult['status']) => {
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
        return { text: '❌ CRITICAL ISSUES', color: '#EF4444', bg: '#FEE2E2' };
      default:
        return { text: '🔍 CHECKING...', color: '#6B7280', bg: '#F3F4F6' };
    }
  };

  const generateStatusReport = () => {
    const passCount = results.filter(r => r.status === 'pass').length;
    const failCount = results.filter(r => r.status === 'fail').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    const criticalCount = results.filter(r => r.critical).length;
    
    let report = `NOTIFICATION SYSTEM STATUS REPORT\n`;
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `User: ${currentUser?.firstName} ${currentUser?.lastName}\n`;
    report += `Client ID: ${clientId}\n`;
    report += `Backend: ${domain}\n\n`;
    report += `OVERALL STATUS: ${getOverallStatusDisplay().text}\n\n`;
    report += `SUMMARY:\n`;
    report += `✅ Passed: ${passCount}\n`;
    report += `❌ Failed: ${failCount}\n`;
    report += `⚠️ Warnings: ${warningCount}\n`;
    report += `🚨 Critical: ${criticalCount}\n\n`;
    report += `RESULTS:\n`;
    results.forEach((r, i) => {
      report += `${i + 1}. ${r.test}: ${r.status.toUpperCase()}\n`;
      report += `   ${r.message}\n`;
    });

    Alert.alert('Status Report', 'Report logged to console', [{ text: 'OK' }]);
    console.log(report);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notification System Status</Text>
        <Text style={styles.subtitle}>
          Current status check of multi-user notification system
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
        {/* System Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 System Information</Text>
          
          {currentUser && (
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>👤 User: {currentUser.firstName} {currentUser.lastName}</Text>
              <Text style={styles.infoText}>🏢 Client ID: {clientId}</Text>
              <Text style={styles.infoText}>🌐 Backend: {domain}</Text>
              <Text style={styles.infoText}>👔 Role: {currentUser.role || currentUser.userType}</Text>
            </View>
          )}
        </View>

        {/* Run Status Check */}
        <TouchableOpacity
          style={[styles.checkButton, loading && styles.checkButtonDisabled]}
          onPress={runStatusCheck}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
          )}
          <Text style={styles.checkButtonText}>
            {loading ? 'Checking Status...' : 'Check Current Status'}
          </Text>
        </TouchableOpacity>

        {/* Status Results */}
        {results.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📊 Status Results</Text>
              <TouchableOpacity style={styles.reportButton} onPress={generateStatusReport}>
                <Ionicons name="document-text" size={16} color="#3B82F6" />
                <Text style={styles.reportButtonText}>Report</Text>
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
                    <View style={styles.resultContent}>
                      <Text style={styles.resultTitle}>
                        {result.test}
                        {result.critical && <Text style={styles.criticalBadge}> CRITICAL</Text>}
                      </Text>
                      <Text style={styles.resultMessage}>{result.message}</Text>
                    </View>
                  </View>
                  
                  {result.details && (
                    <TouchableOpacity
                      style={styles.detailsButton}
                      onPress={() => {
                        Alert.alert(
                          'Details',
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

        {/* Action Items */}
        {overallStatus === 'broken' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔧 Required Actions</Text>
            <View style={styles.actionCard}>
              <Text style={styles.actionTitle}>Critical Issues Found</Text>
              <Text style={styles.actionText}>
                Backend notification APIs are missing. Multi-user notifications will not work until these are implemented.
              </Text>
              <Text style={styles.actionCode}>
                Required: GET /api/notifications/recipients{'\n'}
                Required: POST /api/notifications/send
              </Text>
              <Text style={styles.actionText}>
                Use IMMEDIATE_BACKEND_FIX.js to implement these endpoints.
              </Text>
            </View>
          </View>
        )}

        {overallStatus === 'working' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎉 System Ready</Text>
            <View style={styles.successCard}>
              <Text style={styles.successTitle}>Multi-User Notifications Working!</Text>
              <Text style={styles.successText}>
                All systems are operational. Test with multiple user accounts to verify cross-user notifications.
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
  infoCard: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  checkButton: {
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
  checkButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  checkButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    gap: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  criticalBadge: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '700',
  },
  resultMessage: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  detailsButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 6,
    marginTop: 8,
  },
  detailsButtonText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  actionCard: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#7F1D1D',
    lineHeight: 20,
    marginBottom: 8,
  },
  actionCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#7F1D1D',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  successCard: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#064E3B',
    lineHeight: 20,
  },
});

export default NotificationStatusChecker;