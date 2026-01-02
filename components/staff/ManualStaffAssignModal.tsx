import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, UserPlus, Hash } from 'lucide-react-native';
import axios from 'axios';
import { domain } from '@/lib/domain';
import { toast } from 'sonner-native';

interface ManualStaffAssignModalProps {
  visible: boolean;
  onClose: () => void;
  clientId: string;
  onSuccess: () => void;
}

const ManualStaffAssignModal: React.FC<ManualStaffAssignModalProps> = ({
  visible,
  onClose,
  clientId,
  onSuccess,
}) => {
  const [staffId, setStaffId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [staffDetails, setStaffDetails] = useState<any>(null);

  const handleClose = () => {
    if (!isLoading) {
      setStaffId('');
      setStaffDetails(null);
      onClose();
    }
  };

  const fetchStaffDetails = async () => {
    if (!staffId.trim()) {
      Alert.alert('Error', 'Please enter a staff ID');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 Fetching staff details for ID:', staffId);
      
      // Fetch staff details by ID (without clientId filter for lookup)
      const response = await axios.get(
        `${domain}/api/(users)/staff?id=${staffId.trim()}`
      );

      const responseData = response.data as { success?: boolean; data?: any };

      if (responseData.success && responseData.data) {
        console.log('✅ Staff found:', responseData.data);
        setStaffDetails(responseData.data);
      } else {
        throw new Error('Staff member not found');
      }
    } catch (error: any) {
      console.error('❌ Error fetching staff:', error);
      
      let errorMessage = 'Staff member not found';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
      setStaffDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  const assignStaffToClient = async () => {
    if (!staffDetails) return;

    setIsLoading(true);
    try {
      console.log('🚀 Assigning staff to client...');
      console.log('Staff ID:', staffDetails._id);
      console.log('Client ID:', clientId);

      // Note: (users) is a route group in Next.js and doesn't appear in the URL
      const response = await axios.post(
        `${domain}/api/users/staff/assign-client`,
        {
          staffId: staffDetails._id,
          clientIds: [clientId],
        }
      );

      const responseData = response.data as { success?: boolean; message?: string };

      if (responseData.success) {
        toast.success(
          `${staffDetails.firstName} ${staffDetails.lastName} has been assigned successfully!`
        );
        onSuccess();
        handleClose();
      } else {
        throw new Error(responseData.message || 'Assignment failed');
      }
    } catch (error: any) {
      console.error('❌ Error assigning staff:', error);
      
      let errorMessage = 'Failed to assign staff member';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Assignment Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Hash size={24} color="#3B82F6" />
              <Text style={styles.headerTitle}>Assign by Staff ID</Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              disabled={isLoading}
              style={styles.closeButton}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.description}>
              Enter the staff member's ID to assign them to your organization
            </Text>

            {/* Staff ID Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Staff ID</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter staff ID (e.g., 507f1f77bcf86cd799439011)"
                placeholderTextColor="#9CA3AF"
                value={staffId}
                onChangeText={setStaffId}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading && !staffDetails}
              />
            </View>

            {/* Fetch Button */}
            {!staffDetails && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.primaryButton,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={fetchStaffDetails}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <UserPlus size={20} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Find Staff Member</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Staff Details Card */}
            {staffDetails && (
              <View style={styles.staffCard}>
                <Text style={styles.staffCardTitle}>Staff Details</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>
                    {staffDetails.firstName} {staffDetails.lastName}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{staffDetails.email}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>{staffDetails.phoneNumber}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Role:</Text>
                  <Text style={styles.detailValue}>
                    {staffDetails.role?.replace('-', ' ').toUpperCase()}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={() => {
                      setStaffDetails(null);
                      setStaffId('');
                    }}
                    disabled={isLoading}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.primaryButton,
                      styles.flexButton,
                      isLoading && styles.buttonDisabled,
                    ]}
                    onPress={assignStaffToClient}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <UserPlus size={20} color="#FFFFFF" />
                        <Text style={styles.primaryButtonText}>Assign to Organization</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  staffCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  staffCardTitle: {
    fontSize: 16,
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
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  flexButton: {
    flex: 1,
  },
});

export default ManualStaffAssignModal;
