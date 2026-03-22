import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import StaffDebugger from '@/components/StaffDebugger';

export default function DebugStaffPage() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StaffDebugger />
    </SafeAreaView>
  );
}