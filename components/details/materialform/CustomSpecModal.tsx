import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { sharedStyles } from './styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CustomSpecModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (key: string, value: string) => void;
}

const CustomSpecModal: React.FC<CustomSpecModalProps> = ({ visible, onClose, onAdd }) => {
  const [customSpecKey, setCustomSpecKey] = useState('');
  const [customSpecValue, setCustomSpecValue] = useState('');

  const handleAdd = () => {
    if (!customSpecKey.trim()) {
      Alert.alert('Error', 'Specification name cannot be empty');
      return;
    }

    onAdd(customSpecKey.trim(), customSpecValue.trim());
    setCustomSpecKey('');
    setCustomSpecValue('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.customSpecModalContainer, { width: SCREEN_WIDTH * 0.9 }]}>
          <View style={styles.customSpecModalHeader}>
            <Text style={styles.customSpecModalTitle}>Add Custom Specification</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={sharedStyles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.customSpecFormGroup}>
            <Text style={sharedStyles.label}>Specification Name</Text>
            <TextInput
              style={sharedStyles.input}
              placeholder="e.g., Color, Thickness, Grade"
              value={customSpecKey}
              onChangeText={setCustomSpecKey}
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.customSpecFormGroup}>
            <Text style={sharedStyles.label}>Specification Value</Text>
            <TextInput
              style={sharedStyles.input}
              placeholder="e.g., Red, 10mm, A-Grade"
              value={customSpecValue}
              onChangeText={setCustomSpecValue}
              placeholderTextColor="#94A3B8"
            />
          </View>

          <TouchableOpacity
            style={styles.addSpecButton}
            onPress={handleAdd}
            activeOpacity={0.8}
          >
            <Text style={styles.addSpecButtonText}>Add Specification</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

type Styles = {
  [key: string]: ViewStyle | TextStyle | any;
};

const styles = StyleSheet.create<Styles>({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  customSpecModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  customSpecModalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  customSpecModalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  customSpecFormGroup: {
    marginBottom: 16,
  },
  addSpecButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center' as const,
    marginTop: 8,
  },
  addSpecButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
});

export default CustomSpecModal;
