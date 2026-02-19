import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useSimpleNotifications } from '@/hooks/useSimpleNotifications';
import { useAuth } from '@/contexts/AuthContext';

interface UsageUpdateFormProps {
  projectId: string;
  projectName: string;
  onUsageUpdated?: () => void;
}

const UsageUpdateForm: React.FC<UsageUpdateFormProps> = ({
  projectId,
  projectName,
  onUsageUpdated,
}) => {
  const [activity, setActivity] = useState('');
  const [materialUsed, setMaterialUsed] = useState('');
  const [quantityUsed, setQuantityUsed] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const { sendProjectNotification } = useSimpleNotifications();

  const handleUpdateUsage = async () => {
    if (!activity || !materialUsed || !quantityUsed) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Save usage data to your database (replace with your API call)
      const usageData = {
        projectId,
        activity,
        materialUsed,
        quantityUsed: parseFloat(quantityUsed),
        notes,
        updatedBy: user?._id,
        updatedAt: new Date(),
      };

      // TODO: Replace this with your actual API call
      // await saveUsageToDatabase(usageData);
      console.log('📊 Usage to save:', usageData);

      // 2. Send notification to project admins
      console.log('📤 Preparing to send usage notification with user data:', {
        userId: user?._id,
        userRole: user?.role,
        userType: user?.userType,
        userClients: user?.clients?.length || 0,
        projectId,
        projectName,
      });

      // ✅ Send notification to admins - let backend get clientId from project
      console.log('📤 Preparing to send usage notification...');
      console.log('📤 Project ID:', projectId);
      console.log('📤 Staff ID:', user?._id);
      console.log('📤 Backend will get clientId from project automatically');

      const notificationSent = await sendProjectNotification({
        projectId,
        activityType: 'usage_added',
        staffName: user?.firstName || user?.name || 'Staff Member',
        projectName,
        details: `Updated usage: ${quantityUsed} ${materialUsed} for ${activity}${notes ? ` (${notes})` : ''}`,
        recipientType: 'admins',
        staffId: user?._id, // ✅ Pass staffId to prevent self-notification
        // ✅ Remove clientId - let backend get it from project
      });

      console.log('📤 Usage notification send result:', notificationSent);

      if (notificationSent) {
        console.log('✅ Notification sent to admins');
      } else {
        console.log('⚠️ Notification failed, but usage was updated');
      }

      // 3. Show success and reset form
      Alert.alert(
        'Success',
        `Usage updated successfully for "${activity}"!\n${notificationSent ? 'Admins have been notified.' : 'Note: Notification failed.'}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setActivity('');
              setMaterialUsed('');
              setQuantityUsed('');
              setNotes('');
              
              // Call callback if provided
              onUsageUpdated?.();
            },
          },
        ]
      );

    } catch (error) {
      console.error('❌ Error updating usage:', error);
      Alert.alert('Error', 'Failed to update usage. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📊 Update Material Usage</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Activity/Work Type *</Text>
        <TextInput
          style={styles.input}
          value={activity}
          onChangeText={setActivity}
          placeholder="e.g., Foundation work, Wall construction"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Material Used *</Text>
        <TextInput
          style={styles.input}
          value={materialUsed}
          onChangeText={setMaterialUsed}
          placeholder="e.g., Cement, Steel bars, Bricks"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Quantity Used *</Text>
        <TextInput
          style={styles.input}
          value={quantityUsed}
          onChangeText={setQuantityUsed}
          placeholder="e.g., 25 bags, 2 tons"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional notes about the usage..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleUpdateUsage}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Updating Usage...' : '📊 Update Usage & Notify Admins'}
          </Text>
        </TouchableOpacity>

        <View style={styles.info}>
          <Text style={styles.infoText}>
            ℹ️ When you update material usage, all project admins will be automatically notified.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  info: {
    backgroundColor: '#EBF8FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    color: '#1E40AF',
    fontSize: 14,
  },
});

export default UsageUpdateForm;