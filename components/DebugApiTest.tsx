import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { getClientId } from '@/functions/clientId';
import { getProjectData } from '@/functions/project';
import { domain } from '@/lib/domain';
import axios from 'axios';

const DebugApiTest = () => {
  const [testResults, setTestResults] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    setTestResults(prev => prev + '\n' + message);
    console.log(message);
  };

  const runTests = async () => {
    setIsLoading(true);
    setTestResults('🚀 Starting API Tests...\n');

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

      // Test 2: Direct API call
      addLog('\n📋 Test 2: Direct API call...');
      try {
        const directResponse = await axios.get(`${domain}/api/project?clientId=${clientId}`);
        addLog(`✅ Direct API Status: ${directResponse.status}`);
        addLog(`✅ Direct API Success: ${directResponse.data.success}`);
        addLog(`✅ Direct API Data Type: ${Array.isArray(directResponse.data.data) ? 'Array' : typeof directResponse.data.data}`);
        addLog(`✅ Direct API Projects Count: ${Array.isArray(directResponse.data.data) ? directResponse.data.data.length : 'N/A'}`);
        
        if (Array.isArray(directResponse.data.data) && directResponse.data.data.length > 0) {
          const firstProject = directResponse.data.data[0];
          addLog(`✅ First Project Keys: ${Object.keys(firstProject).join(', ')}`);
          addLog(`✅ First Project Name: ${firstProject.name || firstProject.projectName || 'No name'}`);
        }
      } catch (directError: any) {
        addLog(`❌ Direct API Error: ${directError.message}`);
        addLog(`❌ Direct API Response: ${JSON.stringify(directError.response?.data, null, 2)}`);
      }

      // Test 3: Using getProjectData function
      addLog('\n📋 Test 3: Using getProjectData function...');
      try {
        const projectData = await getProjectData(clientId);
        addLog(`✅ Function Result Type: ${Array.isArray(projectData) ? 'Array' : typeof projectData}`);
        addLog(`✅ Function Projects Count: ${Array.isArray(projectData) ? projectData.length : 'N/A'}`);
        
        if (Array.isArray(projectData) && projectData.length > 0) {
          const firstProject = projectData[0];
          addLog(`✅ First Project from Function: ${firstProject.name || firstProject.projectName || 'No name'}`);
        }
      } catch (functionError: any) {
        addLog(`❌ Function Error: ${functionError.message}`);
      }

      // Test 4: Check domain configuration
      addLog('\n📋 Test 4: Domain Configuration...');
      addLog(`✅ Domain: ${domain}`);
      addLog(`✅ Full API URL: ${domain}/api/project?clientId=${clientId}`);

      addLog('\n🎉 Tests completed!');
      
    } catch (error: any) {
      addLog(`❌ Test Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setTestResults('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Debug Test</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.testButton]} 
          onPress={runTests}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Running Tests...' : 'Run API Tests'}
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
    backgroundColor: '#007AFF',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
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

export default DebugApiTest;