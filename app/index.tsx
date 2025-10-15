import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import Details from './components/Details';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Details />
    </SafeAreaView>
  );
}