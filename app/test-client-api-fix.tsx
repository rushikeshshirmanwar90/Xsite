import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import ClientAPITester from '@/components/ClientAPITester';

export default function TestClientAPIFixPage() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ClientAPITester />
    </SafeAreaView>
  );
}