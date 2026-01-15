import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
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
    perUnitCost: '', // ✅ UPDATED: Use perUnitCost instead of cost
  });
  const [customSpecs, setCustomSpecs] = useState<CustomSpec[]>([]);
  const [showAddSpecModal, setShowAddSpecModal] = useState(false);
  const [editingMaterialIndex, setEditingMaterialIndex] = useState<number | null>(null);
  const [purposeMessage, setPurposeMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation values for swipe to submit
  const swipeAnimation = useRef(new Animated.Value(0)).current;
  const [isSwipeComplete, setIsSwipeComplete] = useState(false);

  const handleTemplateSelect = (templateKey: string) => {
    const template = MATERIAL_TEMPLATES[templateKey];
    setFormData({
      name: template.name,
      unit: template.unit,
      quantity: '',
      specs: {},
      perUnitCost: '', // ✅ UPDATED: Use perUnitCost instead of cost
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
    if (!formData.name || !formData.unit || !formData.quantity || !formData.perUnitCost) {
      Alert.alert('Error', 'Please fill in all required fields (name, unit, quantity, and cost per unit)');
      return;
    }

    const quantity = parseFloat(formData.quantity);
    const perUnitCost = parseFloat(formData.perUnitCost); // ✅ UPDATED: Use perUnitCost

    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity greater than 0');
      return;
    }

    if (isNaN(perUnitCost) || perUnitCost < 0) {
      Alert.alert('Error', 'Please enter a valid cost per unit (0 or greater)');
      return;
    }

    // Store per-unit cost, not total cost
    // This is important for correct calculations when using materials later

    if (editingMaterialIndex !== null) {
      const updatedMaterials = [...addedMaterials];
      updatedMaterials[editingMaterialIndex] = {
        ...updatedMaterials[editingMaterialIndex],
        name: formData.name,
        unit: formData.unit,
        quantity,
        perUnitCost: perUnitCost, // ✅ UPDATED: Store per-unit cost
        specs: formData.specs,
      };
      setAddedMaterials(updatedMaterials);
      setEditingMaterialIndex(null);

      // Show toast for update
      toast.success('Material updated successfully');
    } else {
      const newEntry: InternalMaterial = {
        id: Date.now().toString(),
        name: formData.name,
        unit: formData.unit,
        quantity,
        perUnitCost: perUnitCost, // ✅ UPDATED: Store per-unit cost
        specs: formData.specs,
        date: new Date().toLocaleDateString('en-IN'),
      };
      setAddedMaterials([...addedMaterials, newEntry]);

      // Show toast for new material
      toast.success(`✓ ${formData.name} added to list`);

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

    // Use per-unit cost directly (no calculation needed)
    const perUnitCost = materialToEdit.perUnitCost || 0; // ✅ UPDATED: Use perUnitCost directly

    setFormData({
      name: materialToEdit.name,
      unit: materialToEdit.unit,
      quantity: String(materialToEdit.quantity),
      perUnitCost: String(perUnitCost.toFixed(2)), // ✅ UPDATED: Use perUnitCost
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

    if (isSubmitting) {
      return; // Prevent double submission
    }

    const formattedMaterials = addedMaterials.map((material) => ({
      materialName: material.name,
      unit: material.unit,
      qnt: material.quantity,
      specs: material.specs || {},
      perUnitCost: material.perUnitCost || 0, // ✅ UPDATED: Use perUnitCost instead of cost
      mergeIfExists: true,
    }));

    console.log('=== MATERIAL REQUEST ===');
    console.log('Purpose:', purposeMessage);
    console.log('Materials:', JSON.stringify(formattedMaterials, null, 2));
    console.log('========================');

    try {
      setIsSubmitting(true);
      // Call onSubmit and close immediately without showing discard confirmation
      await onSubmit(formattedMaterials, purposeMessage);
      handleClose(true); // Skip confirmation when successfully submitted
    } catch (error) {
      console.error('Error submitting materials:', error);
      // Don't close the modal if there's an error
    } finally {
      setIsSubmitting(false);
    }
  };

  // Swipe gesture handlers
  const handleSwipeStart = () => {
    // Reset swipe state
    setIsSwipeComplete(false);
  };

  const handleSwipeMove = (gestureState: any) => {
    const { dx } = gestureState;
    const maxSwipe = 200; // Maximum swipe distance to match new design
    const progress = Math.max(0, Math.min(dx / maxSwipe, 1));
    
    swipeAnimation.setValue(progress);
    
    // Check if swipe is complete (70% of the way)
    if (progress >= 0.7 && !isSwipeComplete) {
      setIsSwipeComplete(true);
    }
  };

  const handleSwipeEnd = (gestureState: any) => {
    const { dx } = gestureState;
    const maxSwipe = 200;
    const progress = dx / maxSwipe;
    
    console.log('Swipe ended, progress:', progress, 'addedMaterials.length:', addedMaterials.length);
    
    if (progress >= 0.7) {
      // Complete the swipe and submit
      Animated.timing(swipeAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        console.log('Animation completed, calling handleSendRequest');
        handleSendRequest();
      });
    } else {
      // Animate back to start
      Animated.timing(swipeAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
      setIsSwipeComplete(false);
    }
  };

  // Pan responder for swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: handleSwipeStart,
      onPanResponderMove: (_, gestureState) => handleSwipeMove(gestureState),
      onPanResponderRelease: (_, gestureState) => handleSwipeEnd(gestureState),
    })
  ).current;

  const resetForm = () => {
    setFormData({
      name: '',
      unit: '',
      quantity: '',
      specs: {},
      perUnitCost: '', // ✅ UPDATED: Use perUnitCost instead of cost
    });
    setSelectedTemplateKey(null);
    setShowSpecDropdown(null);
    setShowUnitDropdown(false);
    setCustomSpecs([]);
    setEditingMaterialIndex(null);
  };

  const handleClose = (skipConfirmation = false) => {
    // If skipConfirmation is true (from successful submit), close immediately
    if (skipConfirmation) {
      setAddedMaterials([]);
      setPurposeMessage('');
      resetForm();
      setCurrentStep(0);
      slideAnim.setValue(0);
      swipeAnimation.setValue(0);
      setIsSwipeComplete(false);
      onClose();
      return;
    }

    // If there are added materials or form data, confirm before closing
    if (addedMaterials.length > 0 || formData.name || formData.quantity || formData.perUnitCost) {
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
              swipeAnimation.setValue(0);
              setIsSwipeComplete(false);
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
      swipeAnimation.setValue(0);
      setIsSwipeComplete(false);
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
      onRequestClose={() => handleClose(false)}
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
              {/* Grand Total */}
              <View style={styles.grandTotalContainer}>
                <View style={styles.grandTotalContent}>
                  <Text style={styles.grandTotalLabel}>Total Materials</Text>
                  <View style={styles.grandTotalDivider} />
                  <Text style={styles.grandTotalValue}>
                    {addedMaterials.length} Item{addedMaterials.length > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              {/* Swipe to Submit */}
              <View style={styles.swipeToSubmitContainer}>
                <View style={styles.swipeTrack} {...panResponder.panHandlers}>
                  {/* Swipe button with icon */}
                  <Animated.View 
                    style={[
                      styles.swipeButton,
                      {
                        transform: [{
                          translateX: swipeAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 200],
                            extrapolate: 'clamp',
                          })
                        }]
                      }
                    ]}
                  >
                    <View style={styles.doubleChevron}>
                      <Ionicons name="chevron-forward" size={20} color="#FFFFFF" style={styles.chevronFirst} />
                      <Ionicons name="chevron-forward" size={20} color="#FFFFFF" style={styles.chevronSecond} />
                    </View>
                  </Animated.View>
                  
                  {/* Text */}
                  <View style={styles.swipeTextContainer}>
                    <Animated.Text 
                      style={[
                        styles.swipeText,
                        {
                          opacity: swipeAnimation.interpolate({
                            inputRange: [0, 0.3],
                            outputRange: [1, 0],
                            extrapolate: 'clamp',
                          })
                        }
                      ]}
                    >
                      Swipe to Add Materials ({addedMaterials.length})
                    </Animated.Text>
                  </View>
                </View>
              </View>
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
  floatingSendButtonDisabled: {
    backgroundColor: '#93C5FD',
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 12,
  },
  loadingSpinner: {
    width: 24,
    height: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loadingText: {
    fontSize: 20,
  },
  // Grand Total Styles
  grandTotalContainer: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  grandTotalContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 12,
  },
  grandTotalLabel: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '600' as const,
    fontFamily: 'System',
    letterSpacing: 0.3,
    textTransform: 'uppercase' as const,
  },
  grandTotalDivider: {
    width: 2,
    height: 24,
    backgroundColor: '#D1D5DB',
    borderRadius: 1,
  },
  grandTotalValue: {
    fontSize: 28,
    color: '#000000',
    fontWeight: '800' as const,
    fontFamily: 'System',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Swipe to Submit Styles
  swipeToSubmitContainer: {
    width: '100%',
    paddingHorizontal: 4,
  },
  swipeTrack: {
    backgroundColor: '#1E293B',
    borderRadius: 35,
    height: 70,
    position: 'relative' as const,
    justifyContent: 'center' as const,
    alignItems: 'flex-start' as const,
    paddingLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  swipeButton: {
    position: 'absolute' as const,
    left: 6,
    top: 6,
    width: 58,
    height: 58,
    backgroundColor: '#3B82F6',
    borderRadius: 29,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  doubleChevron: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  chevronFirst: {
    marginRight: -8,
  },
  chevronSecond: {
    marginLeft: -8,
  },
  swipeTextContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingLeft: 70,
    paddingRight: 20,
  },
  swipeText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default MaterialFormModal;
