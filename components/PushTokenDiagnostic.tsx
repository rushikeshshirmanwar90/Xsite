import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { domain } from '@/lib/domain';

// Check if we're in Expo Go
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Dynamic imports
let Notifications: any = null;
let Device: any = null;

if (!(isExpoGo && Platform.OS === 'android')) {
  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
  } catch (error) {
    console.warn('Failed to load notification modules:', error);
  }
}

const PushTokenDiagnostic: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([]);

  const log = (message: string) => {
    console.log(message);
    setOutput(prev => [...prev, message]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setOutput([]);

    log('🔍 Starting Push Token Registration Diagnostics...\n');

    try {
      // 1. Environment Check
      log('📱 ENVIRONMENT CHECK:');
      log(`- Platform: ${Platform.OS}`);
      log(`- Is Expo Go: ${isExpoGo}`);
      log(`- Execution Environment: ${Constants.executionEnvironment}`);
      log(`- Is Physical Device: ${Device?.isDevice}`);
      log(`- Notifications Module Available: ${!!Notifications}`);
      log(`- Device Module Available: ${!!Device}`);
      log(`- Backend URL: ${domain}`);
      log('');

      // 2. User Data Check
      log('👤 USER DATA CHECK:');
      try {
        const userDetailsString = await AsyncStorage.getItem("user");
        if (userDetailsString) {
          const userData = JSON.parse(userDetailsString);
          log('✅ User data found:');
          log(`- User ID: ${userData._id}`);
          log(`- Email: ${userData.email}`);
          log(`- Role: ${userData.role}`);
          log(`- User Type: ${userData.userType}`);
          log(`- Has Clients: ${userData.clients?.length || 0}`);
        } else {
          log('❌ No user data found in AsyncStorage');
          log('💡 Solution: Make sure user is logged in');
          setIsRunning(false);
          return;
        }
      } catch (error: any) {
        log(`❌ Error reading user data: ${error.message}`);
        setIsRunning(false);
        return;
      }
      log('');

      // 3. Device Support Check
      log('🔧 DEVICE SUPPORT CHECK:');
      if (isExpoGo && Platform.OS === 'android') {
        log('❌ Push notifications not supported in Expo Go on Android');
        log('💡 Solution: Use a development build or EAS Build');
        setIsRunning(false);
        return;
      }

      if (!Device?.isDevice) {
        log('❌ Push notifications require a physical device');
        log('💡 Solution: Test on a real device, not simulator');
        setIsRunning(false);
        return;
      }

      if (!Notifications) {
        log('❌ Notification modules not available');
        log('💡 Solution: Check expo-notifications installation');
        setIsRunning(false);
        return;
      }

      log('✅ Device supports push notifications');
      log('');

      // 4. Permission Check
      log('🔐 PERMISSION CHECK:');
      try {
        const { status, canAskAgain } = await Notifications.getPermissionsAsync();
        log(`- Current Status: ${status}`);
        log(`- Can Ask Again: ${canAskAgain}`);
        log(`- Is Granted: ${status === 'granted'}`);

        if (status !== 'granted') {
          log('⚠️ Permissions not granted');
          log('💡 Solution: Request permissions first');
          
          if (canAskAgain) {
            log('🔄 Attempting to request permissions...');
            const result = await Notifications.requestPermissionsAsync();
            log(`- New Status: ${result.status}`);
            log(`- Is Granted: ${result.status === 'granted'}`);
            
            if (result.status !== 'granted') {
              log('❌ User denied permissions');
              log('💡 Solution: Enable notifications in device settings');
              setIsRunning(false);
              return;
            }
          } else {
            log('❌ Cannot ask for permissions again');
            log('💡 Solution: Enable notifications in device settings');
            setIsRunning(false);
            return;
          }
        } else {
          log('✅ Permissions already granted');
        }
      } catch (error: any) {
        log(`❌ Error checking permissions: ${error.message}`);
        setIsRunning(false);
        return;
      }
      log('');

      // 5. Push Token Generation
      log('🎫 PUSH TOKEN GENERATION:');
      let token: string;
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                          Constants.expoConfig?.projectId || 
                          '2fcc4ccc-b8b5-4ff4-ae3c-b195aa9eb32f';
        
        log(`- Project ID: ${projectId}`);
        
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        });

        token = tokenData.data;
        log('✅ Push token generated successfully');
        log(`- Token Preview: ${token.substring(0, 50)}...`);
        log(`- Token Length: ${token.length}`);
        log(`- Token Format: ${token.startsWith('ExponentPushToken[') ? 'Expo' : 'Unknown'}`);
      } catch (error: any) {
        log(`❌ Error generating push token: ${error.message}`);
        log('💡 Possible solutions:');
        log('  - Check internet connection');
        log('  - Verify project ID in app.json/eas.json');
        log('  - Try restarting the app');
        setIsRunning(false);
        return;
      }
      log('');

      // 6. Backend Connectivity
      log('🌐 BACKEND CONNECTIVITY CHECK:');
      try {
        log(`- Testing connection to: ${domain}`);
        
        const healthResponse = await fetch(`${domain}api/health`, {
          method: 'GET',
        });
        
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          log('✅ Backend is accessible');
          log(`- Health Status: ${healthData.status || 'OK'}`);
        } else {
          log(`⚠️ Backend returned error: ${healthResponse.status}`);
        }
      } catch (error: any) {
        log(`❌ Cannot connect to backend: ${error.message}`);
        log('💡 Possible solutions:');
        log('  - Check internet connection');
        log('  - Verify backend URL is correct');
        log('  - Check if backend is running');
        setIsRunning(false);
        return;
      }
      log('');

      // 7. Push Token Registration Test
      log('📤 PUSH TOKEN REGISTRATION TEST:');
      try {
        const userDetailsString = await AsyncStorage.getItem("user");
        const userData = JSON.parse(userDetailsString!);
        
        // Determine user type
        let userType = 'client';
        if (userData.role) {
          if (userData.role === 'admin' || userData.role === 'client-admin') {
            userType = 'admin';
          } else if (userData.role === 'staff' || userData.role.includes('engineer')) {
            userType = 'staff';
          }
        }
        
        const payload = {
          userId: userData._id,
          userType: userType,
          token: token!,
          platform: Platform.OS,
          deviceId: Constants.sessionId || Constants.installationId || 'unknown',
          deviceName: Device?.deviceName || `${Platform.OS} Device`,
          appVersion: Constants.expoConfig?.version || '1.0.0'
        };

        log('- Payload:');
        log(`  userId: ${payload.userId}`);
        log(`  userType: ${payload.userType}`);
        log(`  platform: ${payload.platform}`);
        log(`  deviceId: ${payload.deviceId}`);
        log(`  tokenPreview: ${token!.substring(0, 30)}...`);

        const response = await fetch(`${domain}api/push-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const responseData = await response.json();
        
        if (response.ok && responseData.success) {
          log('✅ Push token registered successfully!');
          log(`- Token ID: ${responseData.data?.tokenId}`);
          log(`- Is New: ${responseData.data?.isNew}`);
          log(`- Message: ${responseData.message}`);
          
          // Store locally
          await AsyncStorage.setItem('pushToken', token!);
          await AsyncStorage.setItem('pushTokenRegistered', 'true');
          await AsyncStorage.setItem('pushTokenRegistrationTime', Date.now().toString());
          
          log('✅ Token stored locally');
        } else {
          log('❌ Push token registration failed');
          log(`- Status: ${response.status}`);
          log(`- Success: ${responseData.success}`);
          log(`- Message: ${responseData.message}`);
          log(`- Error: ${responseData.error}`);
          
          log('💡 Possible solutions:');
          log('  - Check if user ID is valid');
          log('  - Verify backend API is working');
          log('  - Check database connection');
        }
      } catch (error: any) {
        log(`❌ Error during registration: ${error.message}`);
        log('💡 Check the full error details above');
      }
      log('');

      log('🏁 Diagnostics Complete!');
      log('If you still have issues, please share the output above for further assistance.');

    } catch (error: any) {
      log(`❌ Unexpected error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearOutput = () => {
    setOutput([]);
  };

  const copyOutput = () => {
    const outputText = output.join('\n');
    // In a real app, you'd use Clipboard.setString(outputText)
    Alert.alert('Output Ready', 'Output has been prepared for copying. Check console for full details.');
    console.log('=== DIAGNOSTIC OUTPUT ===');
    console.log(outputText);
    console.log('=== END OUTPUT ===');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Push Token Diagnostic</Text>
        <Text style={styles.subtitle}>Identify push token registration issues</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, isRunning && styles.buttonDisabled]}
          onPress={runDiagnostics}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={clearOutput}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={copyOutput}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>Copy Output</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.outputContainer}>
        {output.map((line, index) => (
          <Text key={index} style={styles.outputLine}>
            {line}
          </Text>
        ))}
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
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#374151',
  },
  outputContainer: {
    flex: 1,
    backgroundColor: '#1F2937',
    margin: 16,
    borderRadius: 8,
    padding: 16,
  },
  outputLine: {
    color: '#F9FAFB',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});

export default PushTokenDiagnostic;