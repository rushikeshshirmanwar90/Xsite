/**
 * Android Notification Test Screen
 * 
 * Navigate to this screen to run diagnostics and test Android notifications
 * Route: /test-android-notifications
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { diagnostics } from '@/scripts/test-android-notifications';

interface DiagnosticResult {
  step: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export default function TestAndroidNotifications() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    setTestSent(false);

    try {
      const diagnosticResults = await diagnostics.runDiagnostics();
      setResults(diagnosticResults);
    } catch (error) {
      console.error('Error running diagnostics:', error);
      alert('Failed to run diagnostics. Check console for details.');
    } finally {
      setIsRunning(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      const success = await diagnostics.testLocalNotification();
      if (success) {
        setTestSent(true);
        alert('Test notification scheduled! It should appear in 2 seconds.');
      } else {
        alert('Failed to send test notification. Check console for details.');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Failed to send test notification. Check console for details.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return '✅';
      case 'fail':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return '#10B981';
      case 'fail':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>🔔 Android Notification Test</Text>
          <Text style={styles.subtitle}>
            Platform: {Platform.OS} {Platform.Version}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={runDiagnostics}
            disabled={isRunning}
          >
            {isRunning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>🔍 Run Diagnostics</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={sendTestNotification}
            disabled={isRunning || results.length === 0}
          >
            <Text style={styles.buttonText}>
              {testSent ? '✅ Test Sent' : '🧪 Send Test Notification'}
            </Text>
          </TouchableOpacity>
        </View>

        {results.length > 0 && (
          <>
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>✅ Passed: {passed}</Text>
                <Text style={styles.summaryText}>❌ Failed: {failed}</Text>
                <Text style={styles.summaryText}>⚠️ Warnings: {warnings}</Text>
              </View>
              
              {failed === 0 && warnings === 0 && (
                <View style={styles.successBanner}>
                  <Text style={styles.successText}>
                    🎉 All checks passed! Notifications should work.
                  </Text>
                </View>
              )}
              
              {failed > 0 && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>
                    ⚠️ {failed} check{failed > 1 ? 's' : ''} failed. Review below.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Diagnostic Results</Text>
              
              {results.map((result, index) => (
                <View
                  key={index}
                  style={[
                    styles.resultCard,
                    { borderLeftColor: getStatusColor(result.status) },
                  ]}
                >
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultIcon}>
                      {getStatusIcon(result.status)}
                    </Text>
                    <Text style={styles.resultStep}>{result.step}</Text>
                  </View>
                  
                  <Text style={styles.resultMessage}>{result.message}</Text>
                  
                  {result.details && (
                    <View style={styles.detailsContainer}>
                      <Text style={styles.detailsTitle}>Details:</Text>
                      <Text style={styles.detailsText}>
                        {JSON.stringify(result.details, null, 2)}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {results.length === 0 && !isRunning && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔍</Text>
            <Text style={styles.emptyStateText}>
              Tap "Run Diagnostics" to check your notification setup
            </Text>
          </View>
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>ℹ️ About This Test</Text>
          <Text style={styles.infoText}>
            This diagnostic tool checks:
          </Text>
          <Text style={styles.infoItem}>• Platform and device type</Text>
          <Text style={styles.infoItem}>• Expo Go detection</Text>
          <Text style={styles.infoItem}>• Notification permissions</Text>
          <Text style={styles.infoItem}>• Android notification channels</Text>
          <Text style={styles.infoItem}>• Push token generation</Text>
          <Text style={styles.infoItem}>• Backend connectivity</Text>
          <Text style={styles.infoItem}>• Stored notification data</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryButton: {
    backgroundColor: '#2E72F0',
  },
  secondaryButton: {
    backgroundColor: '#10B981',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  successBanner: {
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  successText: {
    color: '#065F46',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  resultsContainer: {
    padding: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  resultCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  resultStep: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  resultMessage: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  detailsContainer: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 11,
    color: '#374151',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  infoContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#EAF0FE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C4D8FC',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E3A8A',
    marginBottom: 8,
  },
  infoItem: {
    fontSize: 13,
    color: '#1E3A8A',
    marginLeft: 8,
    marginBottom: 4,
  },
});
