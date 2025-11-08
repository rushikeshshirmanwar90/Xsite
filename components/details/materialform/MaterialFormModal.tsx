import React, { useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddMaterialsStep from './AddMaterialsStep';
import { MATERIAL_TEMPLATES } from './constants';
import CustomSpecModal from './CustomSpecModal';
import ProgressIndicator from './ProgressIndicator';
import ReviewPurposeStep from './ReviewPurposeStep';
import { CustomSpec, InternalMaterial, MaterialFormData } from './types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MaterialFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (materials: any[], message: string) => void;
}

const MaterialFormModal: React.FC<MaterialFormModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);
  const [showSpecDropdown, setShowSpecDropdown] = useState<string | null>(null);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [addedMaterials, setAddedMaterials] = useState<InternalMaterial[]>([]);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<any>(null);
  const [formData, setFormData] = useState<MaterialFormData>({
    name: '',
    unit: '',
    quantity: '',
    specs: {},
    cost: '',
  });
  const [customSpecs, setCustomSpecs] = useState<CustomSpec[]>([]);
  const [showAddSpecModal, setShowAddSpecModal] = useState(false);
  const [editingMaterialIndex, setEditingMaterialIndex] = useState<number | null>(null);
  const [purposeMessage, setPurposeMessage] = useState('');

  const handleTemplateSelect = (templateKey: string) => {
    const template = MATERIAL_TEMPLATES[templateKey];
    setFormData({
      name: template.name,
      unit: template.unit,
      quantity: '',
      specs: {},
      cost: '',
    });
    setSelectedTemplateKey(templateKey);
    setCustomSpecs([]);
  };

  const handleSpecChange = (field: string, value: string | number) => {
    const stringValue = typeof value === 'number' ? String(value) : value;
    setFormData((prev) => ({
      ...prev,
      specs: { ...prev.specs, [field]: stringValue },
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddCustomSpec = (key: string, value: string) => {
    const newSpec = { key, value };
    setCustomSpecs([...customSpecs, newSpec]);
    setFormData((prev) => ({
      ...prev,
      specs: { ...prev.specs, [key]: value },
    }));
  };

  const handleRemoveCustomSpec = (index: number) => {
    const specToRemove = customSpecs[index];
    const updatedSpecs = [...customSpecs];
    updatedSpecs.splice(index, 1);
    setCustomSpecs(updatedSpecs);

    const updatedFormDataSpecs = { ...formData.specs };
    delete updatedFormDataSpecs[specToRemove.key];

    setFormData((prev) => ({
      ...prev,
      specs: updatedFormDataSpecs,
    }));
  };

  const handleAddMaterial = () => {
    if (!formData.name || !formData.unit || !formData.quantity || !formData.cost) {
      Alert.alert('Error', 'Please fill in all required fields (name, unit, quantity, and cost)');
      return;
    }

    const quantity = parseFloat(formData.quantity);
    const cost = parseFloat(formData.cost);

    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity greater than 0');
      return;
    }

    if (isNaN(cost) || cost < 0) {
      Alert.alert('Error', 'Please enter a valid cost (0 or greater)');
      return;
    }

    if (editingMaterialIndex !== null) {
      const updatedMaterials = [...addedMaterials];
      updatedMaterials[editingMaterialIndex] = {
        ...updatedMaterials[editingMaterialIndex],
        name: formData.name,
        unit: formData.unit,
        quantity,
        cost,
        specs: formData.specs,
      };
      setAddedMaterials(updatedMaterials);
      setEditingMaterialIndex(null);
      Alert.alert('✅ Success', 'Material updated successfully!');
    } else {
      const newEntry: InternalMaterial = {
        id: Date.now().toString(),
        name: formData.name,
        unit: formData.unit,
        quantity,
        cost,
        specs: formData.specs,
        date: new Date().toLocaleDateString('en-IN'),
      };
      setAddedMaterials([...addedMaterials, newEntry]);
      Alert.alert('✅ Material Added', `${formData.name} has been added successfully!`);
      
      // Scroll to top to show the added material
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
    }
    resetForm();
  };

  const handleEditMaterial = (index: number) => {
    const materialToEdit = addedMaterials[index];

    const specsArray = Object.entries(materialToEdit.specs || {}).map(([key, value]) => ({
      key,
      value: String(value),
    }));

    setFormData({
      name: materialToEdit.name,
      unit: materialToEdit.unit,
      quantity: String(materialToEdit.quantity),
      cost: String(materialToEdit.cost || 0),
      specs: materialToEdit.specs || {},
    });

    setCustomSpecs(specsArray);
    setEditingMaterialIndex(index);

    const templateEntry = Object.entries(MATERIAL_TEMPLATES).find(
      ([_, template]) => template.name === materialToEdit.name
    );
    if (templateEntry) {
      setSelectedTemplateKey(templateEntry[0]);
    } else {
      setSelectedTemplateKey(null);
    }

    // Scroll to top when editing
    if (currentStep === 1) {
      handlePreviousStep();
    }
  };

  const handleNextStep = () => {
    if (addedMaterials.length === 0) {
      Alert.alert('Error', 'Please add at least one material');
      return;
    }

    Animated.timing(slideAnim, {
      toValue: -SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setCurrentStep(1);
  };

  const handlePreviousStep = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setCurrentStep(0);
  };

  const handleSendRequest = async () => {
    if (!purposeMessage.trim()) {
      Alert.alert('Error', 'Please describe what these materials are needed for');
      return;
    }

    const formattedMaterials = addedMaterials.map((material) => ({
      materialName: material.name,
      unit: material.unit,
      qnt: material.quantity,
      specs: material.specs || {},
      cost: material.cost || 0,
      mergeIfExists: true,
    }));

    console.log('=== MATERIAL REQUEST ===');
    console.log('Purpose:', purposeMessage);
    console.log('Materials:', JSON.stringify(formattedMaterials, null, 2));
    console.log('========================');

    onSubmit(formattedMaterials, purposeMessage);
    handleClose();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      unit: '',
      quantity: '',
      specs: {},
      cost: '',
    });
    setSelectedTemplateKey(null);
    setShowSpecDropdown(null);
    setShowUnitDropdown(false);
    setCustomSpecs([]);
    setEditingMaterialIndex(null);
  };

  const handleClose = () => {
    // If there are added materials or form data, confirm before closing
    if (addedMaterials.length > 0 || formData.name || formData.quantity || formData.cost) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved materials. Are you sure you want to close?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setAddedMaterials([]);
              setPurposeMessage('');
              resetForm();
              setCurrentStep(0);
              slideAnim.setValue(0);
              onClose();
            },
          },
        ]
      );
    } else {
      setAddedMaterials([]);
      setPurposeMessage('');
      resetForm();
      setCurrentStep(0);
      slideAnim.setValue(0);
      onClose();
    }
  };

  const getSpecFields = () => {
    if (!selectedTemplateKey) return [];
    const template = MATERIAL_TEMPLATES[selectedTemplateKey];
    return template?.specFields || [];
  };

  const specFields = getSpecFields();

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      onRequestClose={handleClose}
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >
          <ProgressIndicator currentStep={currentStep} />

          <View style={{ flex: 1, overflow: 'hidden', backgroundColor: '#F8FAFC' }}>
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: SCREEN_WIDTH,
                  backgroundColor: '#F8FAFC',
                },
                { transform: [{ translateX: slideAnim }] }
              ]}
            >
              <AddMaterialsStep
                addedMaterials={addedMaterials}
                formData={formData}
                selectedTemplateKey={selectedTemplateKey}
                customSpecs={customSpecs}
                specFields={specFields}
                editingMaterialIndex={editingMaterialIndex}
                showUnitDropdown={showUnitDropdown}
                showSpecDropdown={showSpecDropdown}
                scrollViewRef={scrollViewRef}
                onTemplateSelect={handleTemplateSelect}
                onInputChange={handleInputChange}
                onSpecChange={handleSpecChange}
                onToggleUnitDropdown={() => setShowUnitDropdown(!showUnitDropdown)}
                onToggleSpecDropdown={(field) =>
                  setShowSpecDropdown(showSpecDropdown === field ? null : field)
                }
                onAddSpecClick={() => setShowAddSpecModal(true)}
                onRemoveCustomSpec={handleRemoveCustomSpec}
                onAddMaterial={handleAddMaterial}
                onEditMaterial={handleEditMaterial}
                onRemoveMaterial={(index) =>
                  setAddedMaterials(addedMaterials.filter((_, i) => i !== index))
                }
                onClose={handleClose}
              />
            </Animated.View>

            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  left: SCREEN_WIDTH,
                  right: -SCREEN_WIDTH,
                  bottom: 0,
                  width: SCREEN_WIDTH,
                  backgroundColor: '#F8FAFC',
                },
                { transform: [{ translateX: slideAnim }] }
              ]}
            >
              <ReviewPurposeStep
                addedMaterials={addedMaterials}
                purposeMessage={purposeMessage}
                onPurposeChange={setPurposeMessage}
                onBack={handlePreviousStep}
                onClose={handleClose}
                onEditMaterial={handleEditMaterial}
                onRemoveMaterial={(index) =>
                  setAddedMaterials(addedMaterials.filter((_, i) => i !== index))
                }
                onSubmit={handleSendRequest}
              />
            </Animated.View>
          </View>

          {/* Floating Action Buttons */}
          {currentStep === 0 && addedMaterials.length > 0 && (
            <View style={styles.floatingButtonContainer}>
              <TouchableOpacity
                style={styles.floatingNextButton}
                onPress={handleNextStep}
                activeOpacity={0.8}
              >
                <Text style={styles.floatingNextButtonText}>
                  Next: Review {addedMaterials.length} Material
                  {addedMaterials.length > 1 ? 's' : ''} →
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {currentStep === 1 && (
            <View style={styles.floatingButtonContainer}>
              <TouchableOpacity
                style={styles.floatingSendButton}
                onPress={handleSendRequest}
                activeOpacity={0.8}
              >
                <Text style={styles.floatingSendButtonText}>
                  📤 Send Material Request
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>

        <CustomSpecModal
          visible={showAddSpecModal}
          onClose={() => setShowAddSpecModal(false)}
          onAdd={handleAddCustomSpec}
        />
      </SafeAreaView>
    </Modal>
  );
};

type Styles = {
  [key: string]: ViewStyle | TextStyle | any;
};

const styles = StyleSheet.create<Styles>({
  floatingButtonContainer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingNextButton: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center' as const,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingNextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  floatingSendButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center' as const,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingSendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});

export default MaterialFormModal;
