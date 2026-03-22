import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { getClientId } from '@/functions/clientId';
import { domain } from '@/lib/domain';
import axios from 'axios';

const StaffDebugger = () => {
  const [debugResults, setDebugResults] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    setDebugResults(prev => prev + '\n' + message);
    console.log(message);
  };

  const runStaffDebug = async () => {
    setIsLoading(true);
    setDebugResults('🚀 Starting Staff API Debug...\n');

    try {
      // Test 1: Check clientId
      addLog('\n📋 Test 1: Getting ClientId...');
      const clientId = await getClientId();
      addLog(`✅ ClientId: ${clientId}`);
      
      if (!clientId) {
        addLog('❌ No clientId found! Check user authentication.');
        setIsLoading(false);
        return;
      }

      // Test 2: Test new staff API (clients/staff)
      addLog('\n📋 Test 2: Testing New Staff API (clients/staff)...');
      try {
        const newStaffUrl = `${domain}/api/clients/staff?clientId=${clientId}`;
        addLog(`📤 URL: ${newStaffUrl}`);
        
        const newStaffResponse = await axios.get(newStaffUrl);
        addLog(`✅ New Staff API Status: ${newStaffResponse.status}`);
        addLog(`✅ New Staff API Success: ${newStaffResponse.data.success}`);
        addLog(`✅ New Staff API Message: ${newStaffResponse.data.message}`);
        
        if (newStaffResponse.data.success && Array.isArray(newStaffResponse.data.data)) {
          addLog(`✅ New Staff API returned ${newStaffResponse.data.data.length} staff members`);
          if (newStaffResponse.data.data.length > 0) {
            const firstStaff = newStaffResponse.data.data[0];
            addLog(`✅ First staff: ${firstStaff.firstName} ${firstStaff.lastName}`);
            addLog(`✅ Staff keys: ${Object.keys(firstStaff).join(', ')}`);
          }
        } else {
          addLog(`❌ New Staff API returned no data or failed`);
          addLog(`❌ Response: ${JSON.stringify(newStaffResponse.data, null, 2)}`);
        }
      } catch (newStaffError: any) {
        addLog(`❌ New Staff API Error: ${newStaffError.message}`);
        addLog(`❌ New Staff API Status: ${newStaffError.response?.status}`);
        addLog(`❌ New Staff API Response: ${JSON.stringify(newStaffError.response?.data, null, 2)}`);
      }

      // Test 3: Test old staff API (users/staff)
      addLog('\n📋 Test 3: Testing Old Staff API (users/staff)...');
      try {
        const oldStaffUrl = `${domain}/api/users/staff?clientId=${clientId}`;
        addLog(`📤 URL: ${oldStaffUrl}`);
        
        const oldStaffResponse = await axios.get(oldStaffUrl);
        addLog(`✅ Old Staff API Status: ${oldStaffResponse.status}`);
        addLog(`✅ Old Staff API Success: ${oldStaffResponse.data.success}`);
        addLog(`✅ Old Staff API Message: ${oldStaffResponse.data.message}`);
        
        if (oldStaffResponse.data.success && Array.isArray(oldStaffResponse.data.data)) {
          addLog(`✅ Old Staff API returned ${oldStaffResponse.data.data.length} staff members`);
          if (oldStaffResponse.data.data.length > 0) {
            const firstStaff = oldStaffResponse.data.data[0];
            addLog(`✅ First staff: ${firstStaff.firstName} ${firstStaff.lastName}`);
            addLog(`✅ Staff keys: ${Object.keys(firstStaff).join(', ')}`);
          }
        } else {
          addLog(`❌ Old Staff API returned no data or failed`);
          addLog(`❌ Response: ${JSON.stringify(oldStaffResponse.data, null, 2)}`);
        }
      } catch (oldStaffError: any) {
        addLog(`❌ Old Staff API Error: ${oldStaffError.message}`);
        addLog(`❌ Old Staff API Status: ${oldStaffError.response?.status}`);
        addLog(`❌ Old Staff API Response: ${JSON.stringify(oldStaffError.response?.data, null, 2)}`);
      }

      // Test 4: Test admin API
      addLog('\n📋 Test 4: Testing Admin API...');
      try {
        const adminUrl = `${domain}/api/users/admin?clientId=${clientId}`;
        addLog(`📤 URL: ${adminUrl}`);
        
        const adminResponse = await axios.get(adminUrl);
        addLog(`✅ Admin API Status: ${adminResponse.status}`);
        addLog(`✅ Admin API Success: ${adminResponse.data.success}`);
        addLog(`✅ Admin API Message: ${adminResponse.data.message}`);
        
        if (adminResponse.data.success && adminResponse.data.data) {
          const adminData = adminResponse.data.data;
          if (Array.isArray(adminData)) {
            addLog(`✅ Admin API returned ${adminData.length} admins`);
          } else {
            addLog(`✅ Admin API returned 1 admin: ${adminData.firstName} ${adminData.lastName}`);
          }
        } else {
          addLog(`❌ Admin API returned no data or failed`);
          addLog(`❌ Response: ${JSON.stringify(adminResponse.data, null, 2)}`);
        }
      } catch (adminError: any) {
        addLog(`❌ Admin API Error: ${adminError.message}`);
        addLog(`❌ Admin API Status: ${adminError.response?.status}`);
        addLog(`❌ Admin API Response: ${JSON.stringify(adminError.response?.data, null, 2)}`);
      }

      // Test 5: Test client API
      addLog('\n📋 Test 5: Testing Client API...');
      try {
        const clientUrl = `${domain}/api/clients?id=${clientId}`;
        addLog(`📤 URL: ${clientUrl}`);
        
        const clientResponse = await axios.get(clientUrl);
        addLog(`✅ Client API Status: ${clientResponse.status}`);
        addLog(`✅ Client API Success: ${clientResponse.data.success}`);
        addLog(`✅ Client API Message: ${clientResponse.data.message}`);
        
        if (clientResponse.data.success && clientResponse.data.data) {
          const client = clientResponse.data.data;
          addLog(`✅ Client found: ${client.name}`);
          addLog(`✅ Client email: ${client.email}`);
          addLog(`✅ Client staffs array: ${JSON.stringify(client.staffs)}`);
          addLog(`✅ Client keys: ${Object.keys(client).join(', ')}`);
        } else {
          addLog(`❌ Client API returned no data or failed`);
          addLog(`❌ Response: ${JSON.stringify(clientResponse.data, null, 2)}`);
        }
      } catch (clientError: any) {
        addLog(`❌ Client API Error: ${clientError.message}`);
        addLog(`❌ Client API Status: ${clientError.response?.status}`);
        addLog(`❌ Client API Response: ${JSON.stringify(clientError.response?.data, null, 2)}`);
      }

      // Test 6: Configuration
      addLog('\n📋 Test 6: Configuration...');
      addLog(`✅ Domain: ${domain}`);

      addLog('\n🎉 Staff API debug completed!');
      
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
      <Text style={styles.title}>Staff API Debugger</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.debugButton]} 
          onPress={runStaffDebug}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Running Debug...' : 'Debug Staff APIs'}
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
    backgroundColor: '#8B5CF6',
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

export default StaffDebugger;