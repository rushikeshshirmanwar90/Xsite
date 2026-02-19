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

interface LaborCostFormProps {
  projectId: string;
  projectName: string;
  onLaborAdded?: () => void;
}

const LaborCostForm: React.FC<LaborCostFormProps> = ({
  projectId,
  projectName,
  onLaborAdded,
}) => {
  const [workType, setWorkType] = useState('');
  const [laborerName, setLaborerName] = useState('');
  const [hours, setHours] = useState('');
  const [ratePerHour, setRatePerHour] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const { sendProjectNotification } = useSimpleNotifications();

  // Calculate total cost when hours or rate changes
  const calculateTotal = (hoursValue: string, rateValue: string) => {
    const h = parseFloat(hoursValue) || 0;
    const r = parseFloat(rateValue) || 0;
    const total = h * r;
    setTotalCost(total > 0 ? total.toString() : '');
  };

  const handleHoursChange = (value: string) => {
    setHours(value);
    calculateTotal(value, ratePerHour);
  };

  const handleRateChange = (value: string) => {
    setRatePerHour(value);
    calculateTotal(hours, value);
  };

  const handleAddLaborCost = async () => {
    if (!workType || !laborerName || (!hours && !totalCost)) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Save labor cost to your database (replace with your API call)
      const laborData = {
        projectId,
        workType,
        laborerName,
        hours: hours ? parseFloat(hours) : null,
        ratePerHour: ratePerHour ? parseFloat(ratePerHour) : null,
        totalCost: totalCost ? parseFloat(totalCost) : 0,
        description,
        addedBy: user?._id,
        addedAt: new Date(),
      };

      // TODO: Replace this with your actual API call
      // await saveLaborCostToDatabase(laborData);
      console.log('👷 Labor cost to save:', laborData);

      // 2. Send notification to project admins
      // ✅ Send notification to admins - let backend get clientId from project
      console.log('📤 Preparing to send labor notification...');
      console.log('📤 Project ID:', projectId);
      console.log('📤 Staff ID:', user?._id);
      console.log('📤 Backend will get clientId from project automatically');

      const costDisplay = totalCost ? `₹${totalCost}` : `${hours}h @ ₹${ratePerHour}/h`;
      const notificationSent = await sendProjectNotification({
        projectId,
        activityType: 'labor_added',
        staffName: user?.firstName || user?.name || 'Staff Member',
        projectName,
        details: `Added labor cost: ${costDisplay} for ${workType} by ${laborerName}${description ? ` (${description})` : ''}`,
        recipientType: 'admins',
        staffId: user?._id, // ✅ Pass staffId to prevent self-notification
        // ✅ Remove clientId - let backend get it from project
      });

      console.log('📤 Labor notification send result:', notificationSent);

      if (notificationSent) {
        console.log('✅ Notification sent to admins');
      } else {
        console.log('⚠️ Notification failed, but labor cost was added');
      }

      // 3. Show success and reset form
      Alert.alert(
        'Success',
        `Labor cost added successfully!\nWork: ${workType}\nCost: ${costDisplay}\n${notificationSent ? 'Admins have been notified.' : 'Note: Notification failed.'}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setWorkType('');
              setLaborerName('');
              setHours('');
              setRatePerHour('');
              setTotalCost('');
              setDescription('');
              
              // Call callback if provided
              onLaborAdded?.();
            },
          },
        ]
      );

    } catch (error) {
      console.error('❌ Error adding labor cost:', error);
      Alert.alert('Error', 'Failed to add labor cost. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>👷 Add Labor Cost</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Work Type *</Text>
        <TextInput
          style={styles.input}
          value={workType}
          onChangeText={setWorkType}
          placeholder="e.g., Masonry, Plumbing, Electrical"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Laborer Name *</Text>
        <TextInput
          style={styles.input}
          value={laborerName}
          onChangeText={setLaborerName}
          placeholder="e.g., John Doe, ABC Contractors"
          placeholderTextColor="#9CA3AF"
        />

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Hours</Text>
            <TextInput
              style={styles.input}
              value={hours}
              onChangeText={handleHoursChange}
              placeholder="e.g., 8"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.halfWidth}>
            <Text style={styles.label}>Rate/Hour (₹)</Text>
            <TextInput
              style={styles.input}
              value={ratePerHour}
              onChangeText={handleRateChange}
              placeholder="e.g., 500"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <Text style={styles.label}>Total Cost (₹) *</Text>
        <TextInput
          style={styles.input}
          value={totalCost}
          onChangeText={setTotalCost}
          placeholder="Auto-calculated or enter manually"
          keyboardType="numeric"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Additional details about the work..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleAddLaborCost}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Adding Labor Cost...' : '👷 Add Labor Cost & Notify Admins'}
          </Text>
        </TouchableOpacity>

        <View style={styles.info}>
          <Text style={styles.infoText}>
            ℹ️ When you add labor costs, all project admins will be automatically notified.
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  button: {
    backgroundColor: '#F59E0B',
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
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  infoText: {
    color: '#92400E',
    fontSize: 14,
  },
});

export default LaborCostForm;