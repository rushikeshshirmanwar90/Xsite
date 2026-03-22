import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput } from 'react-native';
import { domain } from '@/lib/domain';
import axios from 'axios';

const ClientAPITester = () => {
  const [testResults, setTestResults] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [testClientId, setTestClientId] = useState('');

  const addLog = (message: string) => {
    setTestResults(prev => prev + '\n' + message);
    console.log(message);
  };

  const testClientAPI = async (clientId: string) => {
    if (!clientId.trim()) {
      addLog('❌ Please enter a client ID to test');
      return;
    }

    setIsLoading(true);
    addLog(`🚀 Testing Client API with ID: ${clientId}\n`);

    try {
      const url = `${domain}/api/clients?id=${clientId}`;
      addLog(`📤 URL: ${url}`);
      
      const response = await axios.get(url);
      
      addLog(`✅ Status: ${response.status}`);
      addLog(`✅ Success: ${response.data.success}`);
      addLog(`✅ Message: ${response.data.message}`);
      
      if (response.data.success && response.data.data) {
        const client = response.data.data;
        addLog(`✅ Client Name: ${client.name}`);
        addLog(`✅ Client Email: ${client.email}`);
        addLog(`✅ Client Phone: ${client.phoneNumber}`);
        addLog(`✅ Client License: ${client.license}`);
        addLog(`✅ License Active: ${client.isLicenseActive}`);
        addLog(`✅ License Expiry: ${client.licenseExpiryDate}`);
        addLog(`✅ All Keys: ${Object.keys(client).join(', ')}`);
      } else {
        addLog(`❌ No client data returned`);
      }
      
      addLog('\n🎉 Client API test completed successfully!');
      
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
      addLog(`❌ Status: ${error.response?.status}`);
      addLog(`❌ Response: ${JSON.stringify(error.response?.data, null, 2)}`);
      
      if (error.response?.status === 500) {
        addLog('\n🔧 500 Error suggests a server-side issue');
        addLog('   - Check if the client ID exists in the database');
        addLog('   - Check server logs for detailed error information');
      } else if (error.response?.status === 400) {
        addLog('\n🔧 400 Error suggests invalid client ID format');
        addLog('   - Make sure the client ID is a valid MongoDB ObjectId');
      } else if (error.response?.status === 404) {
        addLog('\n🔧 404 Error suggests client not found');
        addLog('   - The client ID might not exist in the database');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setTestResults('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Client API Tester</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Client ID:</Text>
        <TextInput
          style={styles.textInput}
          value={testClientId}
          onChangeText={setTestClientId}
          placeholder="Enter client ID to test"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.testButton]} 
          onPress={() => testClientAPI(testClientId)}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Testing...' : 'Test Client API'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearLogs}
        >
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.logContainer}>
        <Text style={styles.logText}>{testResults}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  testButton: {
    backgroundColor: '#10B981',
  },
  clearButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 10,
  },
  logText: {
    color: '#00FF00',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 16,
  },
});

export default ClientAPITester;