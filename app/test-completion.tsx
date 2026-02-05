import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { domain } from '@/lib/domain';
import { toast } from 'sonner-native';

const TestCompletion = () => {
  const [projectId, setProjectId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [miniSectionId, setMiniSectionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testProjectCompletion = async () => {
    if (!projectId.trim()) {
      toast.error('Please enter a project ID');
      return;
    }

    setLoading(true);
    try {
      addResult('🎯 Testing project completion...');
      
      const payload = {
        updateType: 'project',
        id: projectId.trim()
      };
      
      addResult(`Payload: ${JSON.stringify(payload)}`);
      addResult(`URL: ${domain}/api/completion`);
      
      const response = await axios.patch(`${domain}/api/completion`, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      addResult(`✅ Success! Status: ${response.status}`);
      addResult(`Response: ${JSON.stringify(response.data, null, 2)}`);
      
      toast.success('Project completion test successful!');
    } catch (error: any) {
      addResult(`❌ Error: ${error.message}`);
      addResult(`Status: ${error?.response?.status}`);
      addResult(`Response: ${JSON.stringify(error?.response?.data, null, 2)}`);
      
      toast.error('Project completion test failed!');
    } finally {
      setLoading(false);
    }
  };

  const testSectionCompletion = async () => {
    if (!sectionId.trim() || !projectId.trim()) {
      toast.error('Please enter both project ID and section ID');
      return;
    }

    setLoading(true);
    try {
      addResult('🎯 Testing section completion...');
      
      const payload = {
        updateType: 'project-section',
        id: sectionId.trim(),
        projectId: projectId.trim()
      };
      
      addResult(`Payload: ${JSON.stringify(payload)}`);
      addResult(`URL: ${domain}/api/completion`);
      
      const response = await axios.patch(`${domain}/api/completion`, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      addResult(`✅ Success! Status: ${response.status}`);
      addResult(`Response: ${JSON.stringify(response.data, null, 2)}`);
      
      toast.success('Section completion test successful!');
    } catch (error: any) {
      addResult(`❌ Error: ${error.message}`);
      addResult(`Status: ${error?.response?.status}`);
      addResult(`Response: ${JSON.stringify(error?.response?.data, null, 2)}`);
      
      toast.error('Section completion test failed!');
    } finally {
      setLoading(false);
    }
  };

  const testMiniSectionCompletion = async () => {
    if (!miniSectionId.trim()) {
      toast.error('Please enter a mini-section ID');
      return;
    }

    setLoading(true);
    try {
      addResult('🎯 Testing mini-section completion...');
      
      const payload = {
        updateType: 'minisection',
        id: miniSectionId.trim()
      };
      
      addResult(`Payload: ${JSON.stringify(payload)}`);
      addResult(`URL: ${domain}/api/completion`);
      
      const response = await axios.patch(`${domain}/api/completion`, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      addResult(`✅ Success! Status: ${response.status}`);
      addResult(`Response: ${JSON.stringify(response.data, null, 2)}`);
      
      toast.success('Mini-section completion test successful!');
    } catch (error: any) {
      addResult(`❌ Error: ${error.message}`);
      addResult(`Status: ${error?.response?.status}`);
      addResult(`Response: ${JSON.stringify(error?.response?.data, null, 2)}`);
      
      toast.error('Mini-section completion test failed!');
    } finally {
      setLoading(false);
    }
  };

  const testApiHealth = async () => {
    setLoading(true);
    try {
      addResult('🔍 Testing API health...');
      addResult(`Domain: ${domain}`);
      
      const response = await axios.get(`${domain}/api/health`, {
        timeout: 5000
      });

      addResult(`✅ API Health OK! Status: ${response.status}`);
      addResult(`Response: ${JSON.stringify(response.data, null, 2)}`);
      
      toast.success('API is healthy!');
    } catch (error: any) {
      addResult(`❌ API Health Error: ${error.message}`);
      addResult(`Status: ${error?.response?.status}`);
      
      toast.error('API health check failed!');
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Completion API Test</Text>
        <Text style={styles.subtitle}>Domain: {domain}</Text>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Project ID:</Text>
          <TextInput
            style={styles.input}
            value={projectId}
            onChangeText={setProjectId}
            placeholder="Enter project ID (MongoDB ObjectId)"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Section ID:</Text>
          <TextInput
            style={styles.input}
            value={sectionId}
            onChangeText={setSectionId}
            placeholder="Enter section ID (MongoDB ObjectId)"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Mini-Section ID:</Text>
          <TextInput
            style={styles.input}
            value={miniSectionId}
            onChangeText={setMiniSectionId}
            placeholder="Enter mini-section ID (MongoDB ObjectId)"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.button, styles.healthButton]}
            onPress={testApiHealth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test API Health</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.projectButton]}
            onPress={testProjectCompletion}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test Project Completion</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.sectionButton]}
            onPress={testSectionCompletion}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test Section Completion</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.miniButton]}
            onPress={testMiniSectionCompletion}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test Mini-Section Completion</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={clearResults}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Clear Results</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          {results.map((result, index) => (
            <Text key={index} style={styles.resultText}>
              {result}
            </Text>
          ))}
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 16,
  },
  buttonSection: {
    marginBottom: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  healthButton: {
    backgroundColor: '#10B981',
  },
  projectButton: {
    backgroundColor: '#3B82F6',
  },
  sectionButton: {
    backgroundColor: '#8B5CF6',
  },
  miniButton: {
    backgroundColor: '#F59E0B',
  },
  clearButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

export default TestCompletion;