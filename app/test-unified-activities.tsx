import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUnifiedActivities } from '../hooks/useUnifiedActivities';
import { logSectionCompleted, logMiniSectionCompleted } from '../utils/activityLogger';
import axios from 'axios';
import { domain } from '../lib/domain';
import { getClientId } from '../functions/clientId';

const TestUnifiedActivitiesScreen: React.FC = () => {
  const router = useRouter();
  const { activities, isLoading, error, refresh } = useUnifiedActivities();
  const [isTestingCompletion, setIsTestingCompletion] = useState(false);
  const [isTestingAPI, setIsTestingAPI] = useState(false);

  const testCompletionLogging = async () => {
    setIsTestingCompletion(true);
    try {
      console.log('🧪 Testing completion activity logging...');
      
      // Test section completion
      await logSectionCompleted(
        'test-project-123',
        'Test Project for Completion',
        'test-section-123',
        'Test Section for Completion',
        'Testing completion logging from unified activities test'
      );
      
      console.log('✅ Section completion logged');
      
      // Test mini-section completion
      await logMiniSectionCompleted(
        'test-project-123',
        'Test Project for Completion',
        'test-section-123',
        'Test Section for Completion',
        'test-mini-section-123',
        'Test Mini-Section for Completion',
        'Testing mini-section completion logging from unified activities test'
      );
      
      console.log('✅ Mini-section completion logged');
      
      // Refresh activities to see the new ones
      setTimeout(() => {
        refresh();
      }, 1000);
      
      Alert.alert(
        'Success',
        'Completion activities logged successfully! Check the console logs and refresh the activities list.',
        [{ text: 'OK' }]
      );
      
    } catch (error: any) {
      console.error('❌ Completion logging test failed:', error);
      Alert.alert('Error', `Completion logging failed: ${error.message}`);
    } finally {
      setIsTestingCompletion(false);
    }
  };

  const testActivityAPI = async () => {
    setIsTestingAPI(true);
    try {
      console.log('🧪 Testing Activity API directly...');
      
      const clientId = await getClientId();
      if (!clientId) {
        throw new Error('Client ID not found');
      }
      
      // Test direct API call
      const testPayload = {
        user: {
          userId: 'test-user-123',
          fullName: 'Test User',
          email: 'test@example.com'
        },
        clientId,
        projectId: 'test-project-123',
        projectName: 'Test Project Direct API',
        sectionId: 'test-section-123',
        sectionName: 'Test Section Direct API',
        activityType: 'section_completed',
        category: 'section',
        action: 'complete',
        description: 'Direct API test for section completion',
        message: 'Testing direct API call from unified activities test',
        metadata: {
          completionTimestamp: new Date().toISOString(),
          testSource: 'unified-activities-test'
        },
        date: new Date().toISOString()
      };
      
      console.log('📤 Sending to Activity API:', `${domain}/api/activity`);
      console.log('📋 Payload:', JSON.stringify(testPayload, null, 2));
      
      const response = await axios.post(`${domain}/api/activity`, testPayload);
      
      console.log('✅ Activity API response:', response.data);
      
      // Refresh activities to see the new one
      setTimeout(() => {
        refresh();
      }, 1000);
      
      Alert.alert(
        'Success',
        'Direct API test successful! Check the console logs and refresh the activities list.',
        [{ text: 'OK' }]
      );
      
    } catch (error: any) {
      console.error('❌ Activity API test failed:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      Alert.alert('Error', `Activity API test failed: ${error.message}`);
    } finally {
      setIsTestingAPI(false);
    }
  };

  const materialActivities = activities.filter(a => a.type === 'material');
  const completionActivities = activities.filter(a => a.type === 'completion');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Test Unified Activities</Text>
        </View>

        <TouchableOpacity onPress={refresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Test Buttons */}
        <View style={styles.testSection}>
          <Text style={styles.sectionTitle}>🧪 Test Completion Logging</Text>
          <Text style={styles.sectionSubtitle}>
            Test the completion activity logging functions to see if they create activities in the database.
          </Text>
          
          <TouchableOpacity
            style={[styles.testButton, styles.completionButton]}
            onPress={testCompletionLogging}
            disabled={isTestingCompletion}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>
              {isTestingCompletion ? 'Testing...' : 'Test Completion Logging'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, styles.apiButton]}
            onPress={testActivityAPI}
            disabled={isTestingAPI}
          >
            <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>
              {isTestingAPI ? 'Testing...' : 'Test Activity API Direct'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Statistics */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>📊 Activity Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="list" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.statNumber}>{activities.length}</Text>
              <Text style={styles.statLabel}>Total Activities</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="cube" size={24} color="#06B6D4" />
              </View>
              <Text style={styles.statNumber}>{materialActivities.length}</Text>
              <Text style={styles.statLabel}>Material Activities</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              </View>
              <Text style={styles.statNumber}>{completionActivities.length}</Text>
              <Text style={styles.statLabel}>Completion Activities</Text>
            </View>
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>📋 Current Status</Text>
          
          {error ? (
            <View style={styles.statusCard}>
              <Ionicons name="alert-circle" size={24} color="#EF4444" />
              <View style={styles.statusContent}>
                <Text style={styles.statusTitle}>Error Loading Activities</Text>
                <Text style={styles.statusDescription}>{error}</Text>
              </View>
            </View>
          ) : isLoading ? (
            <View style={styles.statusCard}>
              <Ionicons name="hourglass" size={24} color="#F59E0B" />
              <View style={styles.statusContent}>
                <Text style={styles.statusTitle}>Loading Activities...</Text>
                <Text style={styles.statusDescription}>Fetching activities from both APIs</Text>
              </View>
            </View>
          ) : (
            <View style={styles.statusCard}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <View style={styles.statusContent}>
                <Text style={styles.statusTitle}>Activities Loaded Successfully</Text>
                <Text style={styles.statusDescription}>
                  Found {activities.length} activities ({materialActivities.length} material, {completionActivities.length} completion)
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Recent Activities Preview */}
        {activities.length > 0 && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>🕒 Recent Activities</Text>
            
            {activities.slice(0, 5).map((activity, index) => (
              <View key={activity._id} style={styles.activityPreview}>
                <View style={styles.activityPreviewIcon}>
                  <Ionicons 
                    name={activity.type === 'material' ? 'cube' : 'checkmark-circle'} 
                    size={16} 
                    color={activity.type === 'material' ? '#06B6D4' : '#10B981'} 
                  />
                </View>
                <View style={styles.activityPreviewContent}>
                  <Text style={styles.activityPreviewTitle}>{activity.title}</Text>
                  <Text style={styles.activityPreviewDescription} numberOfLines={2}>
                    {activity.description}
                  </Text>
                  <Text style={styles.activityPreviewTime}>
                    {activity.timestamp.toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}

            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/activities')}
            >
              <Text style={styles.viewAllButtonText}>View All Activities</Text>
              <Ionicons name="arrow-forward" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.sectionTitle}>💡 Instructions</Text>
          <Text style={styles.instructionText}>
            1. Click "Test Completion Logging" to create test completion activities
          </Text>
          <Text style={styles.instructionText}>
            2. Click "Test Activity API Direct" to test the API endpoint directly
          </Text>
          <Text style={styles.instructionText}>
            3. Check the console logs for detailed information
          </Text>
          <Text style={styles.instructionText}>
            4. Use the refresh button to reload activities
          </Text>
          <Text style={styles.instructionText}>
            5. Navigate to the Activities page to see the unified view
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  testSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  completionButton: {
    backgroundColor: '#10B981',
  },
  apiButton: {
    backgroundColor: '#3B82F6',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  statusSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  statusContent: {
    flex: 1,
    marginLeft: 12,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  previewSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityPreviewIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityPreviewContent: {
    flex: 1,
  },
  activityPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  activityPreviewDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  activityPreviewTime: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginRight: 4,
  },
  instructionsSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default TestUnifiedActivitiesScreen;