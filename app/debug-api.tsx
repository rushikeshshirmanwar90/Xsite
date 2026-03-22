import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import DebugApiTest from '@/components/DebugApiTest';

export default function DebugApiPage() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <DebugApiTest />
    </SafeAreaView>
  );
}