import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, QrCode, RefreshCw, LogOut, Copy } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

interface StaffNoClientScreenProps {
  staffData: any;
}

const StaffNoClientScreen: React.FC<StaffNoClientScreenProps> = ({ staffData }) => {
  const { logout, forceRefresh } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh every 30 seconds to check for assignment updates
  useEffect(() => {
    console.log('🔄 Setting up auto-refresh for staff assignment check...');
    
    const autoRefreshInterval = setInterval(async () => {
      if (!isRefreshing) {
        console.log('🔄 Auto-refresh: Checking for assignment updates...');
        try {
          await forceRefresh();
        } catch (error) {
          console.error('❌ Auto-refresh error:', error);
        }
      }
    }, 30000); // Check every 30 seconds

    // Cleanup interval on unmount
    return () => {
      console.log('🧹 Cleaning up auto-refresh interval');
      clearInterval(autoRefreshInterval);
    };
  }, [forceRefresh, isRefreshing]);

  // Generate QR code data with staff details
  const qrData = JSON.stringify({
    staffId: staffData._id,
    firstName: staffData.firstName,
    lastName: staffData.lastName,
    email: staffData.email,
    phoneNumber: staffData.phoneNumber,
    role: staffData.role,
    timestamp: new Date().toISOString(),
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 Staff refresh initiated...');
      toast.info('Checking for assignment updates...');
      
      await forceRefresh();
      
      // Add a small delay to ensure the auth context has time to update
      setTimeout(() => {
        console.log('✅ Staff refresh completed');
        toast.success('Status updated successfully');
      }, 1000);
      
    } catch (error) {
      console.error('Error refreshing:', error);
      toast.error('Failed to refresh status. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleCopyStaffId = async () => {
    await Clipboard.setStringAsync(staffData._id);
    Alert.alert('Copied', 'Staff ID copied to clipboard');
  };

  const handleShareDetails = async () => {
    try {
      await Share.share({
        message: `Staff Assignment Request\n\nName: ${staffData.firstName} ${staffData.lastName}\nEmail: ${staffData.email}\nPhone: ${staffData.phoneNumber}\nRole: ${staffData.role}\nStaff ID: ${staffData._id}\n\nPlease assign this staff member to your client account.`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <AlertCircle size={48} color="#F59E0B" />
        </View>
        <Text style={styles.title}>No Client Assigned</Text>
        <Text style={styles.subtitle}>
          You haven't been assigned to any client yet. Please share your details with your administrator.
        </Text>
      </View>

      {/* Staff Details Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Details</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Name:</Text>
          <Text style={styles.detailValue}>
            {staffData.firstName} {staffData.lastName}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Email:</Text>
          <Text style={styles.detailValue}>{staffData.email}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Phone:</Text>
          <Text style={styles.detailValue}>{staffData.phoneNumber}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Role:</Text>
          <Text style={styles.detailValue}>
            {staffData.role?.replace('-', ' ').toUpperCase()}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Staff ID:</Text>
          <View style={styles.staffIdContainer}>
            <Text style={styles.detailValue} numberOfLines={1}>
              {staffData._id}
            </Text>
            <TouchableOpacity onPress={handleCopyStaffId} style={styles.copyButton}>
              <Copy size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* QR Code Section */}
      <View style={styles.card}>
        <View style={styles.qrHeader}>
          <QrCode size={24} color="#3B82F6" />
          <Text style={styles.cardTitle}>QR Code</Text>
        </View>
        <Text style={styles.qrSubtitle}>
          Share this QR code with your administrator to get assigned
        </Text>
        
        <View style={styles.qrContainer}>
          <View style={styles.qrCodeWrapper}>
            <QRCode
              value={qrData}
              size={200}
              color="#000000"
              backgroundColor="#FFFFFF"
              logo={require('@/assets/images/icon.png')}
              logoSize={40}
              logoBackgroundColor="#FFFFFF"
              logoMargin={2}
              logoBorderRadius={20}
            />
          </View>
        </View>

        <Text style={styles.qrNote}>
          Scan this QR code to get staff details for assignment
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleShareDetails}
        >
          <Text style={styles.primaryButtonText}>Share Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            size={20}
            color="#3B82F6"
            style={isRefreshing ? styles.rotating : undefined}
          />
          <Text style={styles.secondaryButtonText}>
            {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>What to do next?</Text>
        <Text style={styles.instructionText}>
          1. Share your Staff ID or QR code with your administrator
        </Text>
        <Text style={styles.instructionText}>
          2. Wait for the administrator to assign you to a client
        </Text>
        <Text style={styles.instructionText}>
          3. The app automatically checks for updates every 30 seconds
        </Text>
        <Text style={styles.instructionText}>
          4. You can also use "Refresh Status" for immediate updates
        </Text>
        <Text style={styles.instructionText}>
          5. Once assigned, you'll automatically get access to the app
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  staffIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  copyButton: {
    marginLeft: 8,
    padding: 4,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  qrSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  qrCodeWrapper: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrNote: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  rotating: {
    // Add rotation animation if needed
  },
  instructionsCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default StaffNoClientScreen;
