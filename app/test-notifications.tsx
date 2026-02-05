import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationTestHelper from '../components/NotificationTestHelper';
import { useRouter } from 'expo-router';

const TestNotificationsScreen: React.FC = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <NotificationTestHelper onClose={() => router.back()} />
    </SafeAreaView>
  );
};

export default TestNotificationsScreen;