import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { domain } from '@/lib/domain';
import { useNotifications } from '../hooks/useNotifications';

interface PushStats {
  totalTokens: number;
  activeTokens: number;
  tokensByPlatform: { [platform: string]: number };
  tokensByUserType: { [userType: string]: number };
}

const NotificationTestPanel: React.FC = () => {
  const [testTitle, setTestTitle] = useState('🧪 Test Notification');
  const [testBody, setTestBody] = useState('This is a test notification from the admin panel.');
  const [testUserIds, setTestUserIds] = useState('');
  const [testProjectId, setTestProjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<PushStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const { scheduleLocalNotification } = useNotifications();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch(`${domain}/api/push-notifications/stats`);
      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      } else {
        console.error('Failed to fetch push notification stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    if (!testTitle.trim() || !testBody.trim()) {
      Alert.alert('Error', 'Please enter both title and body for the test notification.');
      return;
    }

    if (!testUserIds.trim() && !testProjectId.trim()) {
      Alert.alert('Error', 'Please enter either User IDs or Project ID.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        title: testTitle,
        body: testBody,
        data: {
          isTest: true,
          testTimestamp: new Date().toISOString(),
        },
      };

      if (testProjectId.trim()) {
        payload.projectId = testProjectId.trim();
      } else if (testUserIds.trim()) {
        payload.userIds = testUserIds.split(',').map(id => id.trim()).filter(Boolean);
      }

      const response = await fetch(`${domain}/api/push-notifications/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          `Test notification sent to ${result.data.messagesSent} devices!`,
          [{ text: 'OK', onPress: fetchStats }]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const sendLocalTestNotification = async () => {
    try {
      await scheduleLocalNotification(
        testTitle || '🧪 Local Test',
        testBody || 'This is a local test notification.',
        {
          isTest: true,
          testType: 'local',
          testTimestamp: new Date().toISOString(),
        }
      );
      Alert.alert('Success', 'Local test notification scheduled!');
    } catch (error) {
      console.error('Error sending local test notification:', error);
      Alert.alert('Error', 'Failed to send local test notification.');
    }
  };

  const cleanupTokens = async () => {
    Alert.alert(
      'Cleanup Push Tokens',
      'This will deactivate push tokens that haven\'t been used in 30 days. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cleanup',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await fetch(`${domain}/api/push-notifications/stats`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'cleanup' }),
              });

              const result = await response.json();

              if (response.ok) {
                Alert.alert(
                  'Success',
                  `Cleaned up ${result.data.cleanedTokens} old push tokens.`,
                  [{ text: 'OK', onPress: fetchStats }]
                );
              } else {
                Alert.alert('Error', result.message || 'Failed to cleanup tokens');
              }
            } catch (error) {
              console.error('Error cleaning up tokens:', error);
              Alert.alert('Error', 'Failed to cleanup tokens.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Push Notification Statistics</Text>
        
        {statsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading stats...</Text>
          </View>
        ) : stats ? (
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Tokens:</Text>
              <Text style={styles.statValue}>{stats.totalTokens}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Active Tokens:</Text>
              <Text style={styles.statValue}>{stats.activeTokens}</Text>
            </View>
            
            {Object.keys(stats.tokensByPlatform).length > 0 && (
              <>
                <Text style={styles.subSectionTitle}>By Platform:</Text>
                {Object.entries(stats.tokensByPlatform).map(([platform, count]) => (
                  <View key={platform} style={styles.statRow}>
                    <Text style={styles.statLabel}>{platform}:</Text>
                    <Text style={styles.statValue}>{count}</Text>
                  </View>
                ))}
              </>
            )}
            
            {Object.keys(stats.tokensByUserType).length > 0 && (
              <>
                <Text style={styles.subSectionTitle}>By User Type:</Text>
                {Object.entries(stats.tokensByUserType).map(([userType, count]) => (
                  <View key={userType} style={styles.statRow}>
                    <Text style={styles.statLabel}>{userType}:</Text>
                    <Text style={styles.statValue}>{count}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        ) : (
          <Text style={styles.errorText}>Failed to load statistics</Text>
        )}

        <TouchableOpacity style={styles.refreshButton} onPress={fetchStats}>
          <Ionicons name="refresh" size={16} color="#3B82F6" />
          <Text style={styles.refreshButtonText}>Refresh Stats</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧪 Test Notifications</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Title:</Text>
          <TextInput
            style={styles.textInput}
            value={testTitle}
            onChangeText={setTestTitle}
            placeholder="Enter notification title"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Body:</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={testBody}
            onChangeText={setTestBody}
            placeholder="Enter notification body"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>User IDs (comma-separated):</Text>
          <TextInput
            style={styles.textInput}
            value={testUserIds}
            onChangeText={setTestUserIds}
            placeholder="user1,user2,user3"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>OR Project ID:</Text>
          <TextInput
            style={styles.textInput}
            value={testProjectId}
            onChangeText={setTestProjectId}
            placeholder="Enter project ID"
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.testButton, styles.localButton]}
            onPress={sendLocalTestNotification}
            disabled={loading}
          >
            <Ionicons name="phone-portrait" size={16} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Local Test</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, styles.pushButton]}
            onPress={sendTestNotification}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={16} color="#FFFFFF" />
            )}
            <Text style={styles.testButtonText}>Send Push</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧹 Maintenance</Text>
        
        <TouchableOpacity
          style={[styles.maintenanceButton]}
          onPress={cleanupTokens}
          disabled={loading}
        >
          <Ionicons name="trash" size={16} color="#EF4444" />
          <Text style={styles.maintenanceButtonText}>Cleanup Old Tokens</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 12,
    marginBottom: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    color: '#6B7280',
  },
  statsContainer: {
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    padding: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 8,
  },
  refreshButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  testButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  localButton: {
    backgroundColor: '#10B981',
  },
  pushButton: {
    backgroundColor: '#3B82F6',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  maintenanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  maintenanceButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default NotificationTestPanel;