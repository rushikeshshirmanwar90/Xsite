import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { domain } from '@/lib/domain';
import { getClientId } from '@/functions/clientId';
import NotificationManager from '@/services/notificationManager';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning' | 'info';
  message: string;
  details?: any;
  recommendation?: string;
}

const NotificationTestingComplete: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [testProjectId, setTestProjectId] = useState('');
  const [testClientId, setTestClientId] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Initialize with current user data
  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        const userData = JSON.parse(userString);
        setCurrentUser(userData);
        
        // Auto-fill test data if available
        if (userData.clientId) {
          setTestClientId(userData.clientId);
        } else if (userData.clients && userData.clients.length > 0) {
          setTestClientId(userData.clients[0].clientId);
        }
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  // Test 1: Verify Current User Role and Client Structure
  const testUserRoleAndClient = async (): Promise<TestResult> => {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (!userString) {
        return {
          test: '👤 User Role & Client Structure',
          status: 'fail',
          message: 'No user data found in AsyncStorage',
          recommendation: 'Please log in to the app first'
        };
      }

      const userData = JSON.parse(userString);
      const clientId = await getClientId();

      const isAdmin = userData.role === 'admin' || userData.userType === 'admin';
      const isStaff = userData.role === 'staff' || userData.userType === 'staff';
      const hasClients = userData.clients && Array.isArray(userData.clients);
      const hasDirectClientId = userData.clientId;

      let userType = 'Unknown';
      if (isAdmin) userType = 'Admin';
      else if (isStaff) userType = 'Staff';

      return {
        test: '👤 User Role & Client Structure',
        status: 'pass',
        message: `User: ${userType}, ClientId: ${clientId ? 'Available' : 'Missing'}, Clients: ${hasClients ? userData.clients.length : 'Direct'}`,
        details: {
          userId: userData._id,
          fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          role: userData.role || userData.userType,
          isAdmin,
          isStaff,
          clientId,
          hasClients,
          clientsCount: hasClients ? userData.clients.length : 0,
          hasDirectClientId,
        },
        recommendation: isAdmin ? 
          'As Admin: You should receive notifications for all activities in your client projects' :
          'As Staff: You should receive notifications for activities by other users in your assigned projects'
      };
    } catch (error) {
      return {
        test: '👤 User Role & Client Structure',
        status: 'fail',
        message: `Error: ${error}`,
      };
    }
  };

  // Test 2: Test Local Notification System
  const testLocalNotificationSystem = async (): Promise<TestResult> => {