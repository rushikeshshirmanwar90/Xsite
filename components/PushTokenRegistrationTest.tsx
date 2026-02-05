import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PushTokenService from '@/services/pushTokenService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TestResult {
  step: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

const PushTokenRegistrationTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userDetails = await AsyncStorage.getItem("user");
      if (userDetails) {
        const userData = JSON.parse(userDetails);
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const updateResult = (step: string, status: 'pending' | 'success' | 'error', message: string, details?: any) => {
    setResults(prev => {
      const existing = prev.find(r => r.step === step);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.details = details;
        return [...prev];
      } else {
        return [...prev, { step, status, message, details }];
      }
    });
  };

  const runFullTest = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // Step 1: Check user data
      updateResult('User Data', 'pending', 'Checking user data...');
      
      if (!currentUser) {
        updateResult('User Data', 'error', 'No user data found. Please login first.');
        return;
      }

      updateResult('User Data', 'success', `Found user: ${currentUser.email}`, {
        id: currentUser._id,
        email: currentUser.email,
        role: currentUser.role,
        userType: currentUser.userType,
        clientsCount: currentUser.clients?.length || 0
      });

      // Step 2: Check permissions
      updateResult('Permissions', 'pending', 'Checking notification permissions...');
      
      const pushTokenService = PushTokenService.getInstance();
      const hasPermissions = await pushTokenService.hasPermissions();
      
      if (!hasPermissions) {
        updateResult('Permissions', 'pending', 'Requesting notification permissions...');
        const granted = await pushTokenService.requestPermissions(true);
        
        if (granted) {
          updateResult('Permissions', 'success', 'Notification permissions granted');
        } else {
          updateResult('Permissions', 'error', 'Notification permissions denied');
          return;
        }
      } else {
        updateResult('Permissions', 'success', 'Notification permissions already granted');
      }

      // Step 3: Initialize push token service
      updateResult('Token Registration', 'pending', 'Initializing push token service...');
      
      const initSuccess = await pushTokenService.initialize(false); // Don't show dialog again
      
      if (initSuccess) {
        updateResult('Token Registration', 'success', 'Push token registered successfully');
      } else {
        updateResult('Token Registration', 'error', 'Failed to register push token');
        return;
      }

      // Step 4: Verify token is stored locally
      updateResult('Local Verification', 'pending', 'Verifying local token storage...');
      
      const isRegistered = await pushTokenService.isTokenRegistered();
      const currentToken = pushTokenService.getCurrentToken();
      
      if (isRegistered && currentToken) {
        updateResult('Local Verification', 'success', 'Token verified locally', {
          tokenPreview: currentToken.substring(0, 30) + '...',
          isRegistered
        });
      } else {
        updateResult('Local Verification', 'error', 'Token not found locally');
        return;
      }

      // Step 5: Test backend connectivity
      updateResult('Backend Test', 'pending', 'Testing backend connectivity...');
      
      try {
        const response = await fetch('http://localhost:8080/api/push-token/status');
        const data = await response.json();
        
        if (data.success) {
          updateResult('Backend Test', 'success', 'Backend is accessible', {
            activeTokens: data.data.tokens.active,
            totalTokens: data.data.tokens.total
          });
        } else {
          updateResult('Backend Test', 'error', 'Backend returned error: ' + data.message);
        }
      } catch (error) {
        updateResult('Backend Test', 'error', 'Cannot connect to backend: ' + (error as Error).message);
      }

      // Step 6: Send test notification
      updateResult('Test Notification', 'pending', 'Sending test notification...');
      
      try {
        const testNotification = {
          title: 'Test Notification',
          body: `Test from ${currentUser.email} at ${new Date().toLocaleTimeString()}`,
          data: {
            type: 'test',
            userId: currentUser._id,
            timestamp: new Date().toISOString()
          },
          recipients: [currentUser._id]
        };

        const notificationResponse = await fetch('http://localhost:8080/api/notifications/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testNotification)
        });

        const notificationData = await notificationResponse.json();
        
        if (notificationData.success) {
          const successful = notificationData.data?.notificationsSent || 0;
          const failed = notificationData.data?.notificationsFailed || 0;
          
          if (successful > 0) {
            updateResult('Test Notification', 'success', `Notification sent successfully! (${successful} sent, ${failed} failed)`);
          } else {
            updateResult('Test Notification', 'error', `Notification failed to send (${successful} sent, ${failed} failed)`, notificationData.data);
          }
        } else {
          updateResult('Test Notification', 'error', 'Failed to send notification: ' + notificationData.message);
        }
      } catch (error) {
        updateResult('Test Notification', 'error', 'Error sending test notification: ' + (error as Error).message);
      }

    } catch (error) {
      console.error('Test error:', error);
      updateResult('Test Error', 'error', 'Unexpected error: ' + (error as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending':
        return <Ionicons name="time-outline" size={20} color="#FFA500" />;
      case 'success':
        return <Ionicons name="checkmark-circle" size={20} color="#00AA00" />;
      case 'error':
        return <Ionicons name="close-circle" size={20} color="#FF4444" />;
    }
  };

  const getStatusColor = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'success':
        return '#00AA00';
      case 'error':
        return '#FF4444';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Push Token Registration Test</Text>
        <Text style={styles.subtitle}>Test the complete notification system</Text>
      </View>

      <ScrollView style={styles.content}>
        {currentUser && (
          <View style={styles.userInfo}>
            <Text style={styles.userInfoTitle}>Current User:</Text>
            <Text style={styles.userInfoText}>Email: {currentUser.email}</Text>
            <Text style={styles.userInfoText}>ID: {currentUser._id}</Text>
            <Text style={styles.userInfoText}>Role: {currentUser.role || currentUser.userType || 'Unknown'}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={runFullTest}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Running Test...' : 'Run Complete Test'}
          </Text>
        </TouchableOpacity>

        {results.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Test Results:</Text>
            
            {results.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <View style={styles.resultHeader}>
                  {getStatusIcon(result.status)}
                  <Text style={[styles.resultStep, { color: getStatusColor(result.status) }]}>
                    {result.step}
                  </Text>
                </View>
                
                <Text style={styles.resultMessage}>{result.message}</Text>
                
                {result.details && (
                  <View style={styles.resultDetails}>
                    <Text style={styles.resultDetailsText}>
                      {JSON.stringify(result.details, null, 2)}
                    </Text>
                  </View>
                )}
              </View>
            ))}
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
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  userInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  userInfoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  resultItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultStep: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultMessage: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  resultDetails: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultDetailsText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
});

export default PushTokenRegistrationTest;