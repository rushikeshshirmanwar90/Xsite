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

interface MaterialAddFormProps {
  projectId: string;
  projectName: string;
  onMaterialAdded?: () => void;
}

const MaterialAddForm: React.FC<MaterialAddFormProps> = ({
  projectId,
  projectName,
  onMaterialAdded,
}) => {
  const [materialName, setMaterialName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [cost, setCost] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const { sendProjectNotification } = useSimpleNotifications();

  const handleAddMaterial = async () => {
    if (!materialName || !quantity || !unit) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Save material to your database (replace with your API call)
      const materialData = {
        projectId,
        name: materialName,
        quantity: parseFloat(quantity),
        unit,
        cost: cost ? parseFloat(cost) : 0,
        addedBy: user?._id,
        addedAt: new Date(),
      };

      // TODO: Replace this with your actual API call
      // await saveMaterialToDatabase(materialData);
      console.log('📦 Material to save:', materialData);

      // 2. Send notification to project admins
      console.log('📤 Preparing to send notification with user data:', {
        userId: user?._id,
        userRole: user?.role,
        userType: user?.userType,
        userClients: user?.clients?.length || 0,
        projectId,
        projectName,
      });

      // ✅ Send notification to admins - let backend get clientId from project
      console.log('📤 Preparing to send notification...');
      console.log('📤 Project ID:', projectId);
      console.log('📤 Staff ID:', user?._id);
      console.log('📤 Backend will get clientId from project automatically');

      const notificationSent = await sendProjectNotification({
        projectId,
        activityType: 'material_added',
        staffName: user?.firstName || user?.name || 'Staff Member',
        projectName,
        details: `Added ${quantity} ${unit} of ${materialName}${cost ? ` (₹${cost})` : ''}`,
        recipientType: 'admins',
        staffId: user?._id, // ✅ Pass staffId to prevent self-notification
        // ✅ Remove clientId - let backend get it from project
      });

      console.log('📤 Notification send result:', notificationSent);

      if (notificationSent) {
        console.log('✅ Notification sent to admins');
      } else {
        console.log('⚠️ Notification failed, but material was added');
      }

      // 3. Show success and reset form
      Alert.alert(
        'Success',
        `Material "${materialName}" added successfully!\n${notificationSent ? 'Admins have been notified.' : 'Note: Notification failed.'}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setMaterialName('');
              setQuantity('');
              setUnit('');
              setCost('');
              
              // Call callback if provided
              onMaterialAdded?.();
            },
          },
        ]
      );

    } catch (error) {
      console.error('❌ Error adding material:', error);
      Alert.alert('Error', 'Failed to add material. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📦 Add Material</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Material Name *</Text>
        <TextInput
          style={styles.input}
          value={materialName}
          onChangeText={setMaterialName}
          placeholder="e.g., Cement, Steel, Bricks"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Quantity *</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          placeholder="e.g., 50"
          keyboardType="numeric"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Unit *</Text>
        <TextInput
          style={styles.input}
          value={unit}
          onChangeText={setUnit}
          placeholder="e.g., bags, tons, pieces"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Cost (Optional)</Text>
        <TextInput
          style={styles.input}
          value={cost}
          onChangeText={setCost}
          placeholder="e.g., 5000"
          keyboardType="numeric"
          placeholderTextColor="#9CA3AF"
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleAddMaterial}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Adding Material...' : '📦 Add Material & Notify Admins'}
          </Text>
        </TouchableOpacity>

        <View style={styles.info}>
          <Text style={styles.infoText}>
            ℹ️ When you add material, all project admins will be automatically notified.
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
  button: {
    backgroundColor: '#10B981',
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
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  infoText: {
    color: '#065F46',
    fontSize: 14,
  },
});

export default MaterialAddForm;