import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileDebugger from '@/components/ProfileDebugger';

export default function DebugProfilePage() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ProfileDebugger />
    </SafeAreaView>
  );
}