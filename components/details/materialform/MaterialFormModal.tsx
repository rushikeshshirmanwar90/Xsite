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
  onSubmit: (materials: any[], message: string) => Promise<void>;
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
  
  // Ref to store the latest addedMaterials to avoid closure issues
  const addedMaterialsRef = useRef<InternalMaterial[]>([]);
  
  // Update ref whenever addedMaterials changes
  React.useEffect(() => {
    addedMaterialsRef.current = addedMaterials;
  }, [addedMaterials]);
  
  // Ref to prevent infinite retry loops
  const retryAttemptRef = useRef(0);
  
  // Ref to store loading toast ID
  const loadingToastRef = useRef<any>(null);
  
  // Function to update loading toast message
  const updateLoadingToast = (message: string) => {
    if (loadingToastRef.current) {
      toast.dismiss(loadingToastRef.current);
    }
    loadingToastRef.current = toast.loading(message);
  };
  
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
  const [showAddForm, setShowAddForm] = useState(true); // New state to control form visibility
  
  // Loading animation states
  const [isAddingMaterials, setIsAddingMaterials] = useState(false);
  const loadingAnimation = useRef(new Animated.Value(0)).current;
  
  // Ref to store the latest purposeMessage value to avoid closure issues
  const purposeMessageRef = useRef('');
  
  // Update ref whenever purposeMessage changes
  React.useEffect(() => {
    purposeMessageRef.current = purposeMessage;
  }, [purposeMessage]);
  
  // Loading animation functions
  const startLoadingAnimation = () => {
    setIsAddingMaterials(true);
    Animated.loop(
      Animated.timing(loadingAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopLoadingAnimation = () => {
    setIsAddingMaterials(false);
    loadingAnimation.stopAnimation();
    loadingAnimation.setValue(0);
  };
  
  // Custom setter that updates both state and ref
  const updatePurposeMessage = (message: string) => {
    setPurposeMessage(message);
    purposeMessageRef.current = message;
  };

  // Custom setter for addedMaterials that updates both state and ref
  const updateAddedMaterials = (materials: InternalMaterial[]) => {
    setAddedMaterials(materials);
    addedMaterialsRef.current = materials;
  };

  // Function to get current materials (always returns latest value)
  const getCurrentMaterials = (): InternalMaterial[] => {
    const refValue = addedMaterialsRef.current;
    const stateValue = addedMaterials;
    
    // Use ref value as it's always up to date
    return refValue;
  };

  // Alternative validation: Check if we can proceed based on UI state
  const canSubmitMaterials = (): boolean => {
    const materials = getCurrentMaterials();
    const hasValidMaterials = materials && materials.length > 0;
    
    return hasValidMaterials;
  };

  // Safety check: If we're on step 1 but have no materials, go back to step 0
  React.useEffect(() => {
    const currentMaterials = addedMaterialsRef.current;
    if (currentStep === 1 && currentMaterials.length === 0) {
      handlePreviousStep();
    }
  }, [currentStep]);

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
    const perUnitCost = parseFloat(formData.perUnitCost);

    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity greater than 0');
      return;
    }

    if (isNaN(perUnitCost) || perUnitCost < 0) {
      Alert.alert('Error', 'Please enter a valid cost per unit (0 or greater)');
      return;
    }

    // ✅ CLIENT-SIDE PRICE CONFLICT DETECTION
    // Check if there's already a material with same name/unit/specs but different price
    const existingSimilarMaterial = addedMaterials.find((existing) => {
      const nameMatch = existing.name === formData.name;
      const unitMatch = existing.unit === formData.unit;
      const specsMatch = JSON.stringify(existing.specs || {}) === JSON.stringify(formData.specs || {});
      const priceDifferent = Number(existing.perUnitCost || 0) !== Number(perUnitCost);
      
      return nameMatch && unitMatch && specsMatch && priceDifferent;
    });

    if (existingSimilarMaterial) {
      Alert.alert(
        'Price Conflict Detected',
        `You already have "${formData.name}" with the same specifications but different price:\n\n` +
        `Existing: ₹${existingSimilarMaterial.perUnitCost}/${formData.unit}\n` +
        `New: ₹${perUnitCost}/${formData.unit}\n\n` +
        `This will create separate entries. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => proceedWithAddMaterial(quantity, perUnitCost) }
        ]
      );
      return;
    }

    proceedWithAddMaterial(quantity, perUnitCost);
  };

  const proceedWithAddMaterial = (quantity: number, perUnitCost: number) => {

    if (editingMaterialIndex !== null) {
      const updatedMaterials = [...addedMaterials];
      updatedMaterials[editingMaterialIndex] = {
        ...updatedMaterials[editingMaterialIndex],
        name: formData.name,
        unit: formData.unit,
        quantity,
        perUnitCost: perUnitCost,
        specs: formData.specs,
      };
      updateAddedMaterials(updatedMaterials);
      setEditingMaterialIndex(null); // Clear editing state

      // Show toast for update
      toast.success('Material updated successfully');
      
      // Hide form after updating
      setShowAddForm(false);
    } else {
      const newEntry: InternalMaterial = {
        id: Date.now().toString(),
        name: formData.name,
        unit: formData.unit,
        quantity,
        perUnitCost: perUnitCost,
        specs: formData.specs,
        date: new Date().toLocaleDateString('en-IN'),
      };
      const newMaterials = [...addedMaterials, newEntry];
      updateAddedMaterials(newMaterials);

      // Show toast for new material
      toast.success(`✓ ${formData.name} added to list`);

      // Hide form after adding first material (or any material)
      setShowAddForm(false);

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

    // Show form when editing
    setShowAddForm(true);

    // Scroll to top when editing
    if (currentStep === 1) {
      handlePreviousStep();
    }
    
    // Scroll to form when editing (small delay to ensure form is rendered)
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };

  const handleShowAddForm = () => {
    setShowAddForm(true);
    resetForm();
    setEditingMaterialIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingMaterialIndex(null);
    setShowAddForm(false);
    resetForm();
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
    }).start(() => {
      setCurrentStep(1);
    });
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
    const currentPurposeMessage = purposeMessageRef.current;
    const currentAddedMaterials = getCurrentMaterials();
    
    // Check if materials are added first - use multiple validation approaches
    const canSubmit = canSubmitMaterials();
    if (!canSubmit) {
      // Fallback: Check if we're on step 1 and the UI shows materials
      // This might indicate a state sync issue
      if (currentStep === 1 && retryAttemptRef.current < 2) {
        retryAttemptRef.current += 1;
        
        // Force a state refresh and try again after a delay
        setTimeout(() => {
          const recoveredMaterials = getCurrentMaterials();
          
          if (recoveredMaterials && recoveredMaterials.length > 0) {
            // Retry the submission with recovered materials
            handleSendRequest();
            return;
          } else {
            retryAttemptRef.current = 0; // Reset for next time
            Alert.alert(
              'No Materials Added',
              'Please add at least one material before submitting. Go back to the first step to add materials.',
              [
                { text: 'Go Back', onPress: () => handlePreviousStep(), style: 'default' },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }
        }, 200);
        return;
      }
      
      Alert.alert(
        'No Materials Added',
        'Please add at least one material before submitting. Go back to the first step to add materials.',
        [
          { text: 'Go Back', onPress: () => handlePreviousStep(), style: 'default' },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }
    
    if (!currentPurposeMessage.trim()) {
      Alert.alert(
        'Purpose Required', 
        'Please describe what these materials are needed for. This helps with project tracking and material management.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (isSubmitting) {
      return; // Prevent double submission
    }

    const formattedMaterials = currentAddedMaterials.map((material) => ({
      materialName: material.name,
      unit: material.unit,
      qnt: material.quantity,
      specs: material.specs || {},
      perUnitCost: material.perUnitCost || 0,
      mergeIfExists: true,
    }));

    // Final validation before API call
    if (formattedMaterials.length === 0) {
      Alert.alert(
        'Error',
        'No materials to submit. Please add materials first.',
        [{ text: 'Go Back', onPress: () => handlePreviousStep() }]
      );
      return;
    }

    try {
      setIsSubmitting(true);
      startLoadingAnimation(); // Start loading animation
      
      // Reset retry counter on successful attempt
      retryAttemptRef.current = 0;
      
      // Show initial loading toast with material count
      const materialCount = formattedMaterials.length;
      loadingToastRef.current = toast.loading(
        `Adding ${materialCount} material${materialCount > 1 ? 's' : ''}...`
      );
      
      // Close the modal immediately to show the loading state
      handleClose(true);
      
      // Update loading message for API call
      updateLoadingToast(`Saving ${materialCount} material${materialCount > 1 ? 's' : ''} to database...`);
      
      // Call onSubmit and wait for it to complete (including material refresh)
      await onSubmit(formattedMaterials, currentPurposeMessage);
      
      // Update loading message for UI refresh
      updateLoadingToast('Refreshing materials list...');
      
      // Add a small delay to ensure UI has updated with new materials
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Final completion message
      updateLoadingToast('Materials added successfully!');
      
      // Brief delay to show completion message
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Dismiss loading toast and show success only after everything is complete
      if (loadingToastRef.current) {
        toast.dismiss(loadingToastRef.current);
        loadingToastRef.current = null;
      }
      
      toast.success(
        `✅ ${materialCount} material${materialCount > 1 ? 's' : ''} added successfully!`
      );
      
    } catch (error) {
      console.error('Error submitting materials:', error);
      
      // Dismiss loading toast and show error
      if (loadingToastRef.current) {
        toast.dismiss(loadingToastRef.current);
        loadingToastRef.current = null;
      }
      
      toast.error('Failed to add materials. Please try again.');
      
    } finally {
      setIsSubmitting(false);
      stopLoadingAnimation(); // Stop loading animation
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
    
    if (progress >= 0.7) {
      // Complete the swipe and submit
      Animated.timing(swipeAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        // Add a small delay to ensure all state updates are processed
        setTimeout(() => {
          handleSendRequest();
        }, 100);
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
      onStartShouldSetPanResponder: () => {
        const currentMaterials = addedMaterialsRef.current;
        return currentMaterials.length > 0;
      },
      onMoveShouldSetPanResponder: () => {
        const currentMaterials = addedMaterialsRef.current;
        return currentMaterials.length > 0;
      },
      onPanResponderGrant: handleSwipeStart,
      onPanResponderMove: (_, gestureState) => {
        const currentMaterials = addedMaterialsRef.current;
        if (currentMaterials.length > 0) {
          handleSwipeMove(gestureState);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentMaterials = addedMaterialsRef.current;
        if (currentMaterials.length > 0) {
          handleSwipeEnd(gestureState);
        }
      },
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
    // Clean up loading toast if it exists
    if (loadingToastRef.current) {
      toast.dismiss(loadingToastRef.current);
      loadingToastRef.current = null;
    }
    
    // If skipConfirmation is true (from successful submit), close immediately
    if (skipConfirmation) {
      updateAddedMaterials([]);
      setPurposeMessage('');
      purposeMessageRef.current = '';
      setShowAddForm(true); // Reset form visibility
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
              // Clean up loading toast
              if (loadingToastRef.current) {
                toast.dismiss(loadingToastRef.current);
                loadingToastRef.current = null;
              }
              
              updateAddedMaterials([]);
              setPurposeMessage('');
              purposeMessageRef.current = '';
              setShowAddForm(true); // Reset form visibility
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
      // Clean up loading toast
      if (loadingToastRef.current) {
        toast.dismiss(loadingToastRef.current);
        loadingToastRef.current = null;
      }
      
      updateAddedMaterials([]);
      setPurposeMessage('');
      purposeMessageRef.current = '';
      setShowAddForm(true); // Reset form visibility
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
                showAddForm={showAddForm}
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
                onRemoveMaterial={(index) => {
                  const newMaterials = addedMaterials.filter((_, i) => i !== index);
                  updateAddedMaterials(newMaterials);
                }}
                onShowAddForm={handleShowAddForm}
                onCancelEdit={handleCancelEdit}
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
                onPurposeChange={updatePurposeMessage}
                onBack={handlePreviousStep}
                onClose={handleClose}
                onEditMaterial={handleEditMaterial}
                onRemoveMaterial={(index) => {
                  const newMaterials = addedMaterials.filter((_, i) => i !== index);
                  updateAddedMaterials(newMaterials);
                }}
                onSubmit={handleSendRequest}
              />
            </Animated.View>
          </View>

          {/* Floating Action Buttons */}
          {currentStep === 0 && addedMaterials.length > 0 && editingMaterialIndex === null && (
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

          {currentStep === 1 && addedMaterials.length > 0 && (
            <View style={styles.floatingButtonContainer}>
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
                      Swipe to Add Materials
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

        {/* Loading Overlay */}
        {isAddingMaterials && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <Animated.View
                style={[
                  styles.loadingIconContainer,
                  {
                    transform: [
                      {
                        rotate: loadingAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Ionicons name="cube" size={48} color="#3B82F6" />
              </Animated.View>
              <Text style={styles.loadingTitle}>Adding Materials</Text>
              <Text style={styles.loadingSubtitle}>Please wait while we process your materials</Text>
              <View style={styles.loadingDots}>
                <Animated.View style={[styles.loadingDot, { opacity: loadingAnimation }]} />
                <Animated.View
                  style={[
                    styles.loadingDot,
                    {
                      opacity: loadingAnimation.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.3, 1, 0.3],
                      }),
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.loadingDot,
                    {
                      opacity: loadingAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0.3],
                      }),
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        )}
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
  // Loading Overlay Styles
  loadingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    minWidth: 200,
  },
  loadingIconContainer: {
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center' as const,
    marginBottom: 20,
  },
  loadingDots: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
});

export default MaterialFormModal;
