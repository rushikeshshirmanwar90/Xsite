import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationSystemTest from '@/components/NotificationSystemTest';

/**
 * Test page for notification system security validation
 * 
 * This page provides a comprehensive test interface for validating
 * the security and functionality of the notification system.
 * 
 * Access this page by navigating to /test-notifications-security
 */
const TestNotificationsSecurity: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <NotificationSystemTest />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});

export default TestNotificationsSecurity;