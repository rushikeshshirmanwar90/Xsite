import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getClientId } from '@/functions/clientId';
import { domain } from '@/lib/domain';
import axios from 'axios';

const ProfileDebugger = () => {
  const [debugResults, setDebugResults] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    setDebugResults(prev => prev + '\n' + message);
    console.log(message);
  };

  const runProfileDebug = async () => {
    setIsLoading(true);
    setDebugResults('🚀 Starting Profile Debug...\n');

    try {
      // Test 1: Check AsyncStorage user data
      addLog('\n📋 Test 1: AsyncStorage User Data...');
      const userDetailsString = await AsyncStorage.getItem("user");
      if (userDetailsString) {
        const userData = JSON.parse(userDetailsString);
        addLog(`✅ User data found in AsyncStorage`);
        addLog(`✅ User keys: ${Object.keys(userData).join(', ')}`);
        addLog(`✅ User _id: ${userData._id}`);
        addLog(`✅ User clientId: ${userData.clientId}`);
        addLog(`✅ User role: ${userData.role}`);
        addLog(`✅ User clients: ${JSON.stringify(userData.clients)}`);
        addLog(`✅ User firstName: ${userData.firstName}`);
        addLog(`✅ User lastName: ${userData.lastName}`);
        addLog(`✅ User email: ${userData.email}`);
      } else {
        addLog('❌ No user data found in AsyncStorage');
        setIsLoading(false);
        return;
      }

      // Test 2: Check getClientId function
      addLog('\n📋 Test 2: getClientId Function...');
      try {
        const clientId = await getClientId();
        addLog(`✅ getClientId() returned: ${clientId}`);
        addLog(`✅ ClientId type: ${typeof clientId}`);
        addLog(`✅ ClientId length: ${clientId?.length}`);
        
        if (!clientId) {
          addLog('❌ getClientId() returned null/undefined');
        }

        // Test 3: Test client API if clientId exists
        if (clientId) {
          addLog('\n📋 Test 3: Client API Test...');
          try {
            const clientResponse = await axios.get(`${domain}/api/clients?id=${clientId}`);
            addLog(`✅ Client API Status: ${clientResponse.status}`);
            addLog(`✅ Client API Success: ${clientResponse.data.success}`);
            addLog(`✅ Client API Message: ${clientResponse.data.message}`);
            
            if (clientResponse.data.success && clientResponse.data.data) {
              const client = clientResponse.data.data;
              addLog(`✅ Client found: ${client.name}`);
              addLog(`✅ Client email: ${client.email}`);
              addLog(`✅ Client phone: ${client.phoneNumber}`);
              addLog(`✅ Client license: ${client.license} (type: ${typeof client.license})`);
              addLog(`✅ Client license active: ${client.isLicenseActive}`);
              addLog(`✅ Client license expiry: ${client.licenseExpiryDate}`);
              addLog(`✅ All client keys: ${Object.keys(client).join(', ')}`);
            } else {
              addLog(`❌ No client data in response`);
              addLog(`❌ Response: ${JSON.stringify(clientResponse.data)}`);
            }
          } catch (clientError: any) {
            addLog(`❌ Client API Error: ${clientError.message}`);
            addLog(`❌ Client API Status: ${clientError.response?.status}`);
            addLog(`❌ Client API Response: ${JSON.stringify(clientError.response?.data)}`);
          }
        } else {
          addLog('⚠️ Skipping client API test - no clientId');
        }

      } catch (getClientIdError: any) {
        addLog(`❌ getClientId() Error: ${getClientIdError.message}`);
      }

      // Test 4: Domain configuration
      addLog('\n📋 Test 4: Configuration...');
      addLog(`✅ Domain: ${domain}`);
      addLog(`✅ Client API URL: ${domain}/api/clients?id={clientId}`);

      addLog('\n🎉 Profile debug completed!');
      
    } catch (error: any) {
      addLog(`❌ Debug Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setDebugResults('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Debugger</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.debugButton]} 
          onPress={runProfileDebug}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Running Debug...' : 'Debug Profile Issues'}
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
        <Text style={styles.logText}>{debugResults}</Text>
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
  debugButton: {
    backgroundColor: '#3B82F6',
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

export default ProfileDebugger;