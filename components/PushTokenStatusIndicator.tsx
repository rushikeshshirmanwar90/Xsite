import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PushTokenService from '@/services/pushTokenService';
import SecureNotificationService from '@/services/secureNotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PushTokenStatusIndicatorProps {
  showDetails?: boolean;
}

const PushTokenStatusIndicator: React.FC<PushTokenStatusIndicatorProps> = ({ 
  showDetails = false 
}) => {
  const [status, setStatus] = useState<{
    hasPermissions: boolean;
    hasToken: boolean;
    isRegistered: boolean;
    userEmail: string | null;
    loading: boolean;
  }>({
    hasPermissions: false,
    hasToken: false,
    isRegistered: false,
    userEmail: null,
    loading: true,
  });

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const pushTokenService = PushTokenService.getInstance();
      
      // Get user data
      const userDetails = await AsyncStorage.getItem("user");
      const userData = userDetails ? JSON.parse(userDetails) : null;
      
      // Check permissions
      const hasPermissions = await pushTokenService.hasPermissions();
      
      // Check if token is registered
      const isRegistered = await pushTokenService.isTokenRegistered();
      
      // Check if we have a current token
      const currentToken = pushTokenService.getCurrentToken();
      
      setStatus({
        hasPermissions,
        hasToken: !!currentToken,
        isRegistered,
        userEmail: userData?.email || null,
        loading: false,
      });

      console.log('🔔 Push Token Status Check:', {
        hasPermissions,
        hasToken: !!currentToken,
        isRegistered,
        userEmail: userData?.email,
        tokenPreview: currentToken ? currentToken.substring(0, 20) + '...' : 'None'
      });

    } catch (error) {
      console.error('❌ Error checking push token status:', error);
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const handleManualRegister = async () => {
    try {
      console.log('🔄 Manual push token registration triggered...');
      const pushTokenService = PushTokenService.getInstance();
      
      const success = await pushTokenService.initialize(true);
      
      if (success) {
        console.log('✅ Manual registration successful');
        await checkStatus(); // Refresh status
      } else {
        console.log('❌ Manual registration failed');
      }
    } catch (error) {
      console.error('❌ Error in manual registration:', error);
    }
  };

  const getStatusColor = () => {
    if (status.loading) return '#9CA3AF';
    if (status.hasPermissions && status.hasToken && status.isRegistered) return '#10B981';
    if (status.hasPermissions && status.hasToken) return '#F59E0B';
    return '#EF4444';
  };

  const getStatusIcon = () => {
    if (status.loading) return 'time-outline';
    if (status.hasPermissions && status.hasToken && status.isRegistered) return 'checkmark-circle';
    if (status.hasPermissions) return 'warning';
    return 'close-circle';
  };

  const getStatusText = () => {
    if (status.loading) return 'Checking...';
    if (status.hasPermissions && status.hasToken && status.isRegistered) return 'Notifications Active';
    if (status.hasPermissions && status.hasToken) return 'Token Not Registered';
    if (status.hasPermissions) return 'No Push Token';
    return 'No Permissions';
  };

  if (!showDetails) {
    // Simple indicator
    return (
      <View style={[styles.simpleIndicator, { backgroundColor: getStatusColor() }]}>
        <Ionicons name={getStatusIcon()} size={16} color="white" />
      </View>
    );
  }

  // Detailed view
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name={getStatusIcon()} size={20} color={getStatusColor()} />
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
        <TouchableOpacity onPress={checkStatus} style={styles.refreshButton}>
          <Ionicons name="refresh" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {status.userEmail && (
        <Text style={styles.userText}>User: {status.userEmail}</Text>
      )}

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Permissions:</Text>
          <Ionicons 
            name={status.hasPermissions ? 'checkmark-circle' : 'close-circle'} 
            size={16} 
            color={status.hasPermissions ? '#10B981' : '#EF4444'} 
          />
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Push Token:</Text>
          <Ionicons 
            name={status.hasToken ? 'checkmark-circle' : 'close-circle'} 
            size={16} 
            color={status.hasToken ? '#10B981' : '#EF4444'} 
          />
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Registered:</Text>
          <Ionicons 
            name={status.isRegistered ? 'checkmark-circle' : 'close-circle'} 
            size={16} 
            color={status.isRegistered ? '#10B981' : '#EF4444'} 
          />
        </View>
      </View>

      {(!status.hasPermissions || !status.hasToken || !status.isRegistered) && (
        <TouchableOpacity style={styles.actionButton} onPress={handleManualRegister}>
          <Text style={styles.actionButtonText}>Setup Notifications</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  simpleIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    margin: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  refreshButton: {
    padding: 4,
  },
  userText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  details: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PushTokenStatusIndicator;