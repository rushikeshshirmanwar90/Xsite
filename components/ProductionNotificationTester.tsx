import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { domain } from '@/lib/domain';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProductionNotificationTester() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testNotificationSystem = async () => {
    setTesting(true);
    setResults([]);
    
    try {
      addResult('🧪 Starting production notification test...');
      
      // Test 1: Check backend connectivity
      addResult('📡 Testing backend connectivity...');
      try {
        const healthResponse = await axios.get(`${domain}/api/health`, { timeout: 10000 });
        addResult(`✅ Backend connected: ${healthResponse.status}`);
      } catch (error: any) {
        addResult(`❌ Backend connection failed: ${error.message}`);
        return;
      }

      // Test 2: Check push token
      addResult('🎫 Checking push token...');
      const pushToken = await AsyncStorage.getItem('pushToken');
      if (pushToken) {
        addResult(`✅ Push token found: ${pushToken.substring(0, 30)}...`);
      } else {
        addResult('❌ No push token found');
        return;
      }

      // Test 3: Check user data
      addResult('👤 Checking user data...');
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        addResult(`✅ User data found: ${user.email} (${user._id})`);
        
        // Test 4: Test notification API
        addResult('📱 Testing notification API...');
        try {
          const testNotification = {
            userIds: [user._id],
            title: 'Production Test Notification',
            body: 'This is a test notification from production app',
            data: {
              route: 'notification',
              testId: Date.now().toString()
            }
          };

          const notificationResponse = await axios.post(
            `${domain}/api/notifications/send-test`, 
            testNotification,
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 15000
            }
          );

          if (notificationResponse.data.success) {
            addResult(`✅ Test notification sent: ${notificationResponse.data.messagesSent} messages`);
          } else {
            addResult(`❌ Test notification failed: ${notificationResponse.data.message}`);
          }
        } catch (notifError: any) {
          addResult(`❌ Notification API error: ${notifError.message}`);
        }

        // Test 5: Test material activity notification
        addResult('📦 Testing material activity notification...');
        try {
          const materialActivity = {
            clientId: user.clientId || user._id,
            projectId: '507f1f77bcf86cd799439011', // Test project ID
            user: {
              userId: user._id,
              fullName: user.firstName + ' ' + user.lastName || user.email
            },
            activity: 'imported',
            materials: [
              { name: 'Test Material', quantity: 10, unit: 'kg' }
            ],
            projectName: 'Test Project',
            message: 'Test material activity from production app'
          };

          const materialResponse = await axios.post(
            `${domain}/api/test-material-notification`,
            materialActivity,
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 15000
            }
          );

          if (materialResponse.data.success) {
            addResult(`✅ Material notification sent: ${materialResponse.data.deliveredCount}/${materialResponse.data.recipientCount} delivered`);
          } else {
            addResult(`❌ Material notification failed: ${materialResponse.data.message}`);
          }
        } catch (materialError: any) {
          addResult(`❌ Material notification error: ${materialError.message}`);
        }

      } else {
        addResult('❌ No user data found');
      }

    } catch (error: any) {
      addResult(`❌ Test failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Production Notification Tester</Text>
      <Text style={styles.subtitle}>Backend: {domain}</Text>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, testing && styles.buttonDisabled]} 
          onPress={testNotificationSystem}
          disabled={testing}
        >
          <Text style={styles.buttonText}>
            {testing ? 'Testing...' : 'Test Notifications'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.results} showsVerticalScrollIndicator={true}>
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>{result}</Text>
        ))}
        {results.length === 0 && (
          <Text style={styles.placeholderText}>
            Tap "Test Notifications" to run production tests
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  results: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultText: {
    fontSize: 12,
    marginBottom: 5,
    fontFamily: 'monospace',
    color: '#333',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});