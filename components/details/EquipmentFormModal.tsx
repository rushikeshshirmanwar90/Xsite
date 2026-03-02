import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState, useEffect } from 'react';
import {
  Alert,
  Animated,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Dimensions,
} from 'react-native';
import { domain } from '@/lib/domain';

interface EquipmentFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (equipmentEntries: any[], message: string) => void;
  sectionId?: string;
  projectId?: string;
  projectName?: string;
  sectionName?: string;
}

interface EquipmentType {
  type: string;
  category: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  defaultCost: number;
  unit: string;
}

const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({
  visible,
  onClose,
  onSubmit
}) => {
  // Get screen dimensions and calculate safe bottom padding
  const safeBottomPadding = Platform.OS === 'ios' ? 34 : 20;
  
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [perUnitCost, setPerUnitCost] = useState<string>('');
  const [costType, setCostType] = useState<string>('purchase');
  const [rentalPeriod, setRentalPeriod] = useState<string>('daily');
  const [rentalDuration, setRentalDuration] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [equipmentEntries, setEquipmentEntries] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const equipmentEntriesRef = useRef<any[]>([]);

  // Animation values for swipe to submit
  const swipeAnimation = useRef(new Animated.Value(0)).current;
  const [isSwipeComplete, setIsSwipeComplete] = useState(false);

  // Animation values
  const scrollViewRef = useRef<ScrollView>(null);
  // Load equipment types from API
  const loadEquipmentTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${domain}/api/equipment/types`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setEquipmentTypes(result.data);
      } else {
        console.error('Failed to load equipment types:', result.message);
      }
    } catch (error) {
      console.error('Error loading equipment types:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load equipment types when modal becomes visible
  useEffect(() => {
    if (visible) {
      loadEquipmentTypes();
    }
  }, [visible]);

  // Swipe gesture handlers
  const handleSwipeStart = () => {
    setIsSwipeComplete(false);
  };

  const handleSwipeMove = (gestureState: any) => {
    const { dx } = gestureState;
    const maxSwipe = 200;
    const progress = Math.max(0, Math.min(dx / maxSwipe, 1));
    
    swipeAnimation.setValue(progress);
    
    if (progress >= 0.7 && !isSwipeComplete) {
      setIsSwipeComplete(true);
    }
  };

  const handleSwipeEnd = (gestureState: any) => {
    const { dx } = gestureState;
    const maxSwipe = 200;
    const progress = dx / maxSwipe;
    
    if (progress >= 0.7) {
      Animated.timing(swipeAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        handleFinalSubmit();
      });
    } else {
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
    setSelectedType('');
    setQuantity('');
    setPerUnitCost('');
    setCostType('purchase');
    setRentalPeriod('daily');
    setRentalDuration('');
    setSearchQuery('');
    setEquipmentEntries([]);
    equipmentEntriesRef.current = [];
    setShowAddForm(false);
    setEditingEntry(null);
    setIsSwipeComplete(false);
    swipeAnimation.setValue(0);
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const resetCurrentEntry = () => {
    setSelectedType('');
    setQuantity('');
    setPerUnitCost('');
    setCostType('purchase');
    setRentalPeriod('daily');
    setRentalDuration('');
    setSearchQuery('');
    setEditingEntry(null);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleAddEquipment = () => {
    if (!selectedType || !quantity || !perUnitCost) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (costType === 'rental' && !rentalDuration) {
      Alert.alert('Error', 'Please enter rental duration');
      return;
    }

    // Check if equipment types are loaded
    if (equipmentTypes.length === 0) {
      Alert.alert('Error', 'Equipment types not loaded. Please try again.');
      return;
    }

    const quantityNum = parseInt(quantity);
    const costNum = parseFloat(perUnitCost);

    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity (must be greater than 0)');
      return;
    }

    if (isNaN(costNum) || costNum <= 0) {
      Alert.alert('Error', 'Please enter a valid cost (must be greater than 0)');
      return;
    }

    const selectedEquipmentType = equipmentTypes.find(eq => eq.type === selectedType);
    
    // Ensure we found the equipment type
    if (!selectedEquipmentType) {
      Alert.alert('Error', 'Selected equipment type not found. Please select again.');
      return;
    }
    
    // Calculate total cost based on cost type
    let calculatedTotalCost;
    let calculationDetails = '';
    
    if (costType === 'rental') {
      const durationNum = parseInt(rentalDuration);
      
      if (isNaN(durationNum) || durationNum <= 0) {
        Alert.alert('Error', 'Please enter a valid rental duration (must be greater than 0)');
        return;
      }
      
      // For rental: Total Cost = Quantity × Duration × Per Unit Cost
      calculatedTotalCost = quantityNum * durationNum * costNum;
      calculationDetails = `${quantityNum} units × ${durationNum} ${rentalPeriod} × ₹${costNum} = ₹${calculatedTotalCost.toLocaleString()}`;
    } else {
      // For purchase: Total Cost = Quantity × Per Unit Cost
      calculatedTotalCost = quantityNum * costNum;
      calculationDetails = `${quantityNum} units × ₹${costNum} = ₹${calculatedTotalCost.toLocaleString()}`;
    }

    const equipmentEntry: any = {
      type: selectedType,
      category: selectedEquipmentType?.category || '',
      quantity: quantityNum,
      perUnitCost: costNum,
      totalCost: calculatedTotalCost,
      costType: costType,
      rentalPeriod: costType === 'rental' ? rentalPeriod : undefined,
      rentalDuration: costType === 'rental' ? parseInt(rentalDuration) : undefined,
      icon: selectedEquipmentType?.icon || 'construct',
      color: selectedEquipmentType?.color || '#3B82F6',
      unit: selectedEquipmentType?.unit || 'units',
      calculationDetails: calculationDetails, // Store calculation details for debugging
    };

    // Debug: Log the equipment entry being created
    console.log('Creating equipment entry:', equipmentEntry);
    console.log('Calculation details:', calculationDetails);

    // Validate required fields
    if (!equipmentEntry.type || !equipmentEntry.category) {
      Alert.alert('Error', 'Equipment type and category are required');
      return;
    }

    setEquipmentEntries(prev => {
      const newEntries = [...prev, equipmentEntry];
      equipmentEntriesRef.current = newEntries;
      return newEntries;
    });
    
    resetCurrentEntry();
    setShowAddForm(false);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };
  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFinalSubmit = () => {
    const currentEntries = equipmentEntriesRef.current;
    
    if (currentEntries.length === 0) {
      Alert.alert('Error', 'Please add at least one equipment entry');
      return;
    }

    const message = `Added ${currentEntries.length} equipment ${currentEntries.length === 1 ? 'entry' : 'entries'}`;
    onSubmit(currentEntries, message);

    resetForm();
    onClose();
  };

  const removeEquipmentEntry = (index: number) => {
    setEquipmentEntries(prev => {
      const newEntries = prev.filter((_, i) => i !== index);
      equipmentEntriesRef.current = newEntries;
      return newEntries;
    });
  };

  const confirmRemoveEquipmentEntry = (index: number, equipmentType: string) => {
    Alert.alert(
      'Delete Equipment Entry',
      `Are you sure you want to delete this ${equipmentType} entry? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeEquipmentEntry(index),
        },
      ]
    );
  };

  const editEquipmentEntry = (index: number) => {
    const entry = equipmentEntries[index];
    
    setEditingEntry(entry);
    setSelectedType(entry.type);
    setQuantity(entry.quantity.toString());
    setPerUnitCost(entry.perUnitCost.toString());
    setCostType(entry.costType);
    if (entry.costType === 'rental') {
      setRentalPeriod(entry.rentalPeriod || 'daily');
      setRentalDuration(entry.rentalDuration?.toString() || '');
    }
    
    removeEquipmentEntry(index);
    setShowAddForm(true);
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const filteredEquipmentTypes = equipmentTypes.filter(equipment =>
    equipment.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    equipment.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Text style={styles.modalTitle}>Enter Equipment Details</Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContentContainer,
              { paddingBottom: safeBottomPadding + 100 }
            ]}
          >
            {/* Equipment Entries Summary */}
            {equipmentEntries.length > 0 && (
              <View style={[styles.sectionContainer, styles.firstSectionContainer]}>
                <Text style={styles.sectionTitle}>Added Equipment Entries ({equipmentEntries.length})</Text>
                
                <View style={styles.compactEquipmentEntriesList}>
                  {equipmentEntries.map((entry, index) => (
                    <View key={index} style={styles.compactEquipmentEntryCard}>
                      <View style={styles.compactEquipmentEntryHeader}>
                        <View style={styles.compactEquipmentEntryLeft}>
                          <View style={[styles.compactEquipmentIcon, { backgroundColor: `${entry.color || '#3B82F6'}20` }]}>
                            <Ionicons name={entry.icon || 'construct'} size={18} color={entry.color || '#3B82F6'} />
                          </View>
                          <View style={styles.compactEquipmentInfo}>
                            <Text style={styles.compactEquipmentType}>{entry.type}</Text>
                            <Text style={styles.compactEquipmentCategory}>{entry.category}</Text>
                            <View style={styles.compactCostTypeInfo}>
                              <Ionicons name={entry.costType === 'rental' ? 'time' : 'card'} size={12} color="#3B82F6" />
                              <Text style={styles.compactCostTypeText}>
                                {entry.costType === 'rental' 
                                  ? `${entry.rentalDuration} ${entry.rentalPeriod}` 
                                  : 'Purchase'
                                }
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.compactCardActions}>
                          <TouchableOpacity 
                            style={styles.compactEditButton}
                            onPress={() => editEquipmentEntry(index)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="pencil" size={14} color="#3B82F6" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.compactRemoveButton}
                            onPress={() => confirmRemoveEquipmentEntry(index, entry.type)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="trash" size={14} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      <View style={styles.compactEquipmentMetrics}>
                        <View style={styles.compactMetricItem}>
                          <Ionicons name="layers" size={14} color="#64748B" />
                          <Text style={styles.compactMetricValue}>{entry.quantity}</Text>
                        </View>
                        <View style={styles.compactMetricDivider} />
                        <View style={styles.compactMetricItem}>
                          <Ionicons name="cash" size={14} color="#64748B" />
                          <Text style={styles.compactMetricValue}>₹{entry.perUnitCost.toLocaleString()}</Text>
                        </View>
                        <View style={styles.compactMetricDivider} />
                        <View style={styles.compactTotalMetric}>
                          <Text style={styles.compactTotalLabel}>Total:</Text>
                          <Text style={styles.compactTotalValue}>₹{entry.totalCost.toLocaleString()}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {/* Add Equipment Button */}
            {equipmentEntries.length > 0 && !showAddForm && (
              <View style={styles.addEquipmentButtonContainer}>
                <TouchableOpacity 
                  style={styles.addEquipmentButton}
                  onPress={() => {
                    setShowAddForm(true);
                    const scrollY = equipmentEntries.length * 150;
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: scrollY, animated: true });
                    }, 100);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.addEquipmentButtonContent}>
                    <Ionicons name="add-circle" size={20} color="#10B981" />
                    <Text style={styles.addEquipmentButtonText}>Add Equipment Entry</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Equipment Adding Form */}
            {(equipmentEntries.length === 0 || showAddForm) && (
              <>
                {/* Editing Entry Banner */}
                {editingEntry && (
                  <View style={styles.editingBannerContainer}>
                    <View style={styles.editingBanner}>
                      <View style={styles.editingBannerHeader}>
                        <View style={styles.editingBannerLeft}>
                          <View style={[styles.editingBannerIcon, { backgroundColor: `${editingEntry.color || '#3B82F6'}20` }]}>
                            <Ionicons name="pencil" size={16} color={editingEntry.color || '#3B82F6'} />
                          </View>
                          <View style={styles.editingBannerInfo}>
                            <Text style={styles.editingBannerTitle}>Editing Equipment Entry</Text>
                            <Text style={styles.editingBannerSubtitle}>
                              {editingEntry.type} • {editingEntry.costType}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity 
                          style={styles.editingBannerClose}
                          onPress={() => {
                            setEquipmentEntries(prev => {
                              const newEntries = [...prev, editingEntry];
                              equipmentEntriesRef.current = newEntries;
                              return newEntries;
                            });
                            resetCurrentEntry();
                            setShowAddForm(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close" size={18} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.editingBannerDetails}>
                        <View style={styles.editingBannerMetric}>
                          <Ionicons name="layers" size={14} color="#64748B" />
                          <Text style={styles.editingBannerMetricText}>{editingEntry.quantity} units</Text>
                        </View>
                        <View style={styles.editingBannerDivider} />
                        <View style={styles.editingBannerMetric}>
                          <Ionicons name="cash" size={14} color="#64748B" />
                          <Text style={styles.editingBannerMetricText}>₹{editingEntry.perUnitCost.toLocaleString()}/each</Text>
                        </View>
                        <View style={styles.editingBannerDivider} />
                        <View style={styles.editingBannerMetric}>
                          <Text style={styles.editingBannerTotalLabel}>Total:</Text>
                          <Text style={styles.editingBannerTotalValue}>₹{editingEntry.totalCost.toLocaleString()}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
                {/* Step 1: Equipment Type Selection */}
                <View style={[styles.sectionContainer, styles.firstSectionContainer]}>
                  {!selectedType ? (
                    <View style={styles.searchContainer}>
                      <View style={styles.searchInputWrapper}>
                        <Ionicons name="search" size={20} color="#9CA3AF" />
                        <TextInput
                          style={styles.searchInput}
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          placeholder="Search equipment types..."
                          placeholderTextColor="#9CA3AF"
                          returnKeyType="search"
                        />
                        {searchQuery.length > 0 && (
                          <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Selected Equipment</Text>
                      <TouchableOpacity 
                        style={styles.undoButton}
                        onPress={() => {
                          setSelectedType('');
                          setSearchQuery('');
                          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="arrow-undo-outline" size={16} color="#EA580C" />
                        <Text style={styles.undoButtonText}>Undo</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.equipmentTypesContainer}>
                    {!selectedType && (
                      <View style={styles.typesList}>
                        {loading ? (
                          <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>Loading equipment types...</Text>
                          </View>
                        ) : filteredEquipmentTypes.length > 0 ? (
                          filteredEquipmentTypes.map((equipment, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.typeCard}
                              onPress={() => handleTypeSelect(equipment.type)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.typeCardLeft}>
                                <View style={[styles.typeIconBadge, { backgroundColor: `${equipment.color}20` }]}>
                                  <Ionicons name={equipment.icon} size={18} color={equipment.color} />
                                </View>
                                <View style={styles.typeCardInfo}>
                                  <Text style={styles.typeCardName}>{equipment.type}</Text>
                                  <Text style={styles.typeCardCategory}>{equipment.category}</Text>
                                </View>
                              </View>
                              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                          ))
                        ) : (
                          <View style={styles.noResultsContainer}>
                            <Text style={styles.noResultsText}>No equipment types found</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {selectedType && (() => {
                      const equipment = equipmentTypes.find(eq => eq.type === selectedType);
                      return equipment ? (
                        <View style={styles.selectedTypeWrapper}>
                          <View style={styles.selectedTypeContainer}>
                            <View style={[styles.typeCard, styles.typeCardSelected]}>
                              <View style={styles.typeCardLeft}>
                                <View style={[styles.typeIconBadge, { backgroundColor: `${equipment.color}20` }]}>
                                  <Ionicons name={equipment.icon} size={18} color={equipment.color} />
                                </View>
                                <View style={styles.typeCardInfo}>
                                  <Text style={[styles.typeCardName, styles.typeCardNameSelected]}>
                                    {equipment.type}
                                  </Text>
                                  <Text style={styles.typeCardCategory}>{equipment.category}</Text>
                                </View>
                              </View>
                              <Ionicons name="checkmark-circle" size={22} color="#3B82F6" />
                            </View>
                          </View>
                        </View>
                      ) : null;
                    })()}
                  </View>
                </View>
                {/* Step 2: Equipment Details */}
                {selectedType && (
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Enter Equipment Details</Text>
                    
                    <View style={styles.equipmentDetailsCard}>
                      <View style={styles.equipmentDetailsHeader}>
                        <Text style={styles.equipmentDetailsTitle}>Equipment Information</Text>
                        <Text style={styles.equipmentDetailsSubtitle}>
                          Specify the quantity and cost details
                        </Text>
                      </View>

                      <View style={styles.equipmentDetailsSection}>
                        <View style={styles.equipmentDetailsInputCard}>
                          {/* Cost Type Selection */}
                          <View style={styles.equipmentInputSection}>
                            <Text style={styles.equipmentInputLabel}>Cost Type:</Text>
                            <View style={styles.costTypeContainer}>
                              <TouchableOpacity
                                style={[
                                  styles.costTypeButton,
                                  costType === 'purchase' && styles.costTypeButtonSelected
                                ]}
                                onPress={() => setCostType('purchase')}
                                activeOpacity={0.7}
                              >
                                <Ionicons 
                                  name="card" 
                                  size={16} 
                                  color={costType === 'purchase' ? '#FFFFFF' : '#64748B'} 
                                />
                                <Text style={[
                                  styles.costTypeButtonText,
                                  costType === 'purchase' && styles.costTypeButtonTextSelected
                                ]}>
                                  Purchase
                                </Text>
                              </TouchableOpacity>
                              
                              <TouchableOpacity
                                style={[
                                  styles.costTypeButton,
                                  costType === 'rental' && styles.costTypeButtonSelected
                                ]}
                                onPress={() => setCostType('rental')}
                                activeOpacity={0.7}
                              >
                                <Ionicons 
                                  name="time" 
                                  size={16} 
                                  color={costType === 'rental' ? '#FFFFFF' : '#64748B'} 
                                />
                                <Text style={[
                                  styles.costTypeButtonText,
                                  costType === 'rental' && styles.costTypeButtonTextSelected
                                ]}>
                                  Rental
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Rental Period Selection - Only show when rental is selected */}
                          {costType === 'rental' && (
                            <View style={styles.equipmentInputSection}>
                              <Text style={styles.equipmentInputLabel}>Rental Period:</Text>
                              <View style={styles.rentalPeriodContainer}>
                                {['hourly', 'daily', 'weekly', 'monthly'].map((period) => (
                                  <TouchableOpacity
                                    key={period}
                                    style={[
                                      styles.rentalPeriodButton,
                                      rentalPeriod === period && styles.rentalPeriodButtonSelected
                                    ]}
                                    onPress={() => setRentalPeriod(period)}
                                    activeOpacity={0.7}
                                  >
                                    <Text style={[
                                      styles.rentalPeriodButtonText,
                                      rentalPeriod === period && styles.rentalPeriodButtonTextSelected
                                    ]}>
                                      {period.charAt(0).toUpperCase() + period.slice(1)}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          )}

                          {/* Rental Duration - Only show when rental is selected */}
                          {costType === 'rental' && (
                            <View style={styles.equipmentInputSection}>
                              <Text style={styles.equipmentInputLabel}>Duration:</Text>
                              <View style={styles.equipmentInputWrapper}>
                                <TextInput
                                  style={styles.equipmentInputLarge}
                                  value={rentalDuration}
                                  onChangeText={setRentalDuration}
                                  placeholder={`Enter number of ${rentalPeriod} periods`}
                                  keyboardType="numeric"
                                  returnKeyType="next"
                                  placeholderTextColor="#94A3B8"
                                />
                                <Text style={styles.equipmentUnitLarge}>{rentalPeriod}</Text>
                              </View>
                              
                              {costType === 'rental' && rentalDuration && parseInt(rentalDuration) <= 0 && (
                                <View style={styles.equipmentError}>
                                  <Ionicons name="warning" size={16} color="#EF4444" />
                                  <Text style={styles.equipmentErrorText}>
                                    Please enter a valid duration (must be greater than 0)
                                  </Text>
                                </View>
                              )}
                              
                              {costType === 'rental' && rentalDuration && parseInt(rentalDuration) > 0 && (
                                <View style={styles.equipmentSuccess}>
                                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                  <Text style={styles.equipmentSuccessText}>
                                    Duration: {rentalDuration} {rentalPeriod}
                                  </Text>
                                </View>
                              )}
                            </View>
                          )}
                          {/* Quantity Input */}
                          <View style={styles.equipmentInputSection}>
                            <Text style={styles.equipmentInputLabel}>Quantity:</Text>
                            <View style={styles.equipmentInputWrapper}>
                              <TextInput
                                style={styles.equipmentInputLarge}
                                value={quantity}
                                onChangeText={setQuantity}
                                placeholder="Enter quantity"
                                keyboardType="numeric"
                                returnKeyType="next"
                                placeholderTextColor="#94A3B8"
                              />
                              <Text style={styles.equipmentUnitLarge}>units</Text>
                            </View>
                            
                            {quantity && parseInt(quantity) <= 0 && (
                              <View style={styles.equipmentError}>
                                <Ionicons name="warning" size={16} color="#EF4444" />
                                <Text style={styles.equipmentErrorText}>
                                  Please enter a valid quantity (must be greater than 0)
                                </Text>
                              </View>
                            )}
                            
                            {quantity && parseInt(quantity) > 0 && (
                              <View style={styles.equipmentSuccess}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                <Text style={styles.equipmentSuccessText}>
                                  Quantity: {quantity} units
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Cost Input */}
                          <View style={styles.equipmentInputSection}>
                            <Text style={styles.equipmentInputLabel}>
                              {costType === 'rental' 
                                ? `Cost per unit per ${rentalPeriod.slice(0, -2)} (₹/unit/${rentalPeriod.slice(0, -2)}):`
                                : 'Cost per unit (₹/unit):'
                              }
                            </Text>
                            {costType === 'rental' && (
                              <Text style={styles.equipmentInputHint}>
                                Total will be calculated as: Quantity × Duration × Cost per unit
                              </Text>
                            )}
                            <View style={styles.equipmentInputWrapper}>
                              <Text style={styles.equipmentCurrencySymbol}>₹</Text>
                              <TextInput
                                style={styles.equipmentInputLarge}
                                value={perUnitCost}
                                onChangeText={setPerUnitCost}
                                placeholder={costType === 'rental' 
                                  ? `Cost per unit per ${rentalPeriod.slice(0, -2)}`
                                  : 'Cost per unit'
                                }
                                keyboardType="numeric"
                                returnKeyType="done"
                                placeholderTextColor="#94A3B8"
                              />
                            </View>
                            
                            {perUnitCost && parseFloat(perUnitCost) <= 0 && (
                              <View style={styles.equipmentError}>
                                <Ionicons name="warning" size={16} color="#EF4444" />
                                <Text style={styles.equipmentErrorText}>
                                  Please enter a valid cost (must be greater than 0)
                                </Text>
                              </View>
                            )}
                            
                            {perUnitCost && parseFloat(perUnitCost) > 0 && (
                              <View style={styles.equipmentSuccess}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                <Text style={styles.equipmentSuccessText}>
                                  Cost per unit: ₹{parseFloat(perUnitCost).toLocaleString()}
                                </Text>
                              </View>
                            )}
                            
                            {/* Cost Calculation Preview */}
                            {costType === 'rental' && quantity && perUnitCost && rentalDuration && (
                              <View style={styles.costPreviewContainer}>
                                <View style={styles.costPreviewHeader}>
                                  <Ionicons name="calculator" size={16} color="#3B82F6" />
                                  <Text style={styles.costPreviewTitle}>Total Cost Calculation:</Text>
                                </View>
                                <View style={styles.costPreviewBreakdown}>
                                  <Text style={styles.costPreviewStep}>
                                    Quantity: {quantity} units
                                  </Text>
                                  <Text style={styles.costPreviewStep}>
                                    Duration: {rentalDuration} {rentalPeriod}
                                  </Text>
                                  <Text style={styles.costPreviewStep}>
                                    Cost per unit: ₹{perUnitCost}
                                  </Text>
                                </View>
                                <View style={styles.costPreviewFormulaDivider} />
                                <Text style={styles.costPreviewFormula}>
                                  {quantity} × {rentalDuration} × ₹{perUnitCost} = ₹{(parseInt(quantity) * parseInt(rentalDuration) * parseFloat(perUnitCost)).toLocaleString()}
                                </Text>
                              </View>
                            )}
                            
                            {costType === 'purchase' && quantity && perUnitCost && (
                              <View style={styles.costPreviewContainer}>
                                <View style={styles.costPreviewHeader}>
                                  <Ionicons name="calculator" size={16} color="#3B82F6" />
                                  <Text style={styles.costPreviewTitle}>Total Cost Calculation:</Text>
                                </View>
                                <View style={styles.costPreviewBreakdown}>
                                  <Text style={styles.costPreviewStep}>
                                    Quantity: {quantity} units
                                  </Text>
                                  <Text style={styles.costPreviewStep}>
                                    Cost per unit: ₹{perUnitCost}
                                  </Text>
                                </View>
                                <View style={styles.costPreviewFormulaDivider} />
                                <Text style={styles.costPreviewFormula}>
                                  {quantity} × ₹{perUnitCost} = ₹{(parseInt(quantity) * parseFloat(perUnitCost)).toLocaleString()}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </>
            )}

            {/* Cancel Add Form Button */}
            {equipmentEntries.length > 0 && showAddForm && (
              <View style={styles.cancelAddFormContainer}>
                <TouchableOpacity 
                  style={styles.cancelAddFormButton}
                  onPress={() => {
                    if (editingEntry) {
                      setEquipmentEntries(prev => {
                        const newEntries = [...prev, editingEntry];
                        equipmentEntriesRef.current = newEntries;
                        return newEntries;
                      });
                    }
                    resetCurrentEntry();
                    setShowAddForm(false);
                  }}
                  activeOpacity={0.7} 
                >
                  <Ionicons name="close" size={16} color="#6B7280" />
                  <Text style={styles.cancelAddFormText}>
                    {editingEntry ? "Cancel Edit" : "Cancel"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
          {/* Footer Actions - Show when form is visible and fields are filled */}
          {(equipmentEntries.length === 0 || showAddForm) && selectedType && quantity && perUnitCost && (costType === 'purchase' || rentalDuration) && (
            <View style={[styles.modalActions, { paddingBottom: safeBottomPadding + 8 }]}>
              <TouchableOpacity style={styles.submitButton} onPress={handleAddEquipment}>
                <View style={styles.submitButtonContainer}>
                  <Ionicons name={editingEntry ? "checkmark" : "add"} size={20} color="#10B981" />
                  <Text style={styles.submitButtonText}>
                    {editingEntry ? "Update Equipment" : "Add Equipment"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Grand Total */}
          {equipmentEntries.length > 0 && !showAddForm && (
            <View style={styles.grandTotalContainer}>
              <View style={styles.grandTotalContent}>
                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                <View style={styles.grandTotalDivider} />
                <Text style={styles.grandTotalValue}>
                  ₹{equipmentEntries.reduce((sum, entry) => sum + entry.totalCost, 0).toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          {/* Swipe to Submit */}
          {equipmentEntries.length > 0 && !showAddForm && (
            <View style={[styles.modalActions, { paddingBottom: safeBottomPadding + 8 }]}>
              <View style={styles.swipeToSubmitContainer}>
                <View style={styles.swipeTrack} {...panResponder.panHandlers}>
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
                      Swipe to Submit All ({equipmentEntries.length})
                    </Animated.Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    height: '95%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
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
    flex: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContentContainer: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  sectionContainer: {
    marginBottom: 10,
    paddingHorizontal: 0,
  },
  firstSectionContainer: {
    marginTop: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingLeft: 0,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    lineHeight: 18,
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FDBA74',
    gap: 4,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  undoButtonText: {
    fontSize: 12,
    color: '#EA580C',
    fontWeight: '600',
  },
  // Search styles
  searchContainer: {
    marginBottom: 8,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '400',
    paddingVertical: 0,
  },
  
  // Equipment types container
  equipmentTypesContainer: {
    gap: 12,
    minHeight: 100,
  },
  typesList: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    minHeight: 64,
  },
  typeCardSelected: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  typeCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  typeIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  typeCardInfo: {
    flex: 1,
    paddingRight: 8,
  },
  typeCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 18,
    marginBottom: 2,
  },
  typeCardNameSelected: {
    color: '#1E40AF',
  },
  typeCardCategory: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 14,
    fontWeight: '500',
  },
  selectedTypeWrapper: {
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDBA74',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 8,
  },
  selectedTypeContainer: {
    gap: 12,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Equipment details styles
  equipmentDetailsCard: {
    gap: 14,
  },
  equipmentDetailsHeader: {
    marginBottom: 6,
  },
  equipmentDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 3,
    lineHeight: 17,
  },
  equipmentDetailsSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '400',
    lineHeight: 15,
  },
  equipmentDetailsSection: {
    gap: 14,
  },
  equipmentDetailsInputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  equipmentInputSection: {
    gap: 6,
    marginBottom: 14,
  },
  equipmentInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  equipmentInputHint: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 4,
    lineHeight: 14,
  },
  equipmentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    minHeight: 48,
  },
  equipmentInputLarge: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
    paddingHorizontal: 0,
  },
  equipmentUnitLarge: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginLeft: 8,
    flexShrink: 0,
  },
  equipmentCurrencySymbol: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
    marginRight: 8,
    flexShrink: 0,
  },
  equipmentError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  equipmentErrorText: {
    fontSize: 12,
    color: '#EF4444',
    flex: 1,
  },
  equipmentSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  equipmentSuccessText: {
    fontSize: 12,
    color: '#10B981',
    flex: 1,
    fontWeight: '500',
  },
  
  // Cost preview styles
  costPreviewContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  costPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  costPreviewTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  costPreviewBreakdown: {
    gap: 4,
    marginBottom: 8,
  },
  costPreviewStep: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  costPreviewFormulaDivider: {
    height: 1,
    backgroundColor: '#DBEAFE',
    marginVertical: 8,
  },
  costPreviewFormula: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '700',
    fontFamily: 'monospace',
    textAlign: 'center',
    backgroundColor: '#F0F9FF',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  
  // Cost type styles
  costTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  costTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
    minHeight: 44,
  },
  costTypeButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  costTypeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  costTypeButtonTextSelected: {
    color: '#FFFFFF',
  },
  // Rental period styles
  rentalPeriodContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  rentalPeriodButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    minHeight: 36,
  },
  rentalPeriodButtonSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  rentalPeriodButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  rentalPeriodButtonTextSelected: {
    color: '#3B82F6',
  },

  // Add equipment button styles
  addEquipmentButtonContainer: {
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  addEquipmentButton: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: '#BBF7D0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addEquipmentButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addEquipmentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },

  // Editing banner styles
  editingBannerContainer: {
    marginBottom: 16,
  },
  editingBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editingBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  editingBannerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  editingBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  editingBannerInfo: {
    flex: 1,
  },
  editingBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  editingBannerSubtitle: {
    fontSize: 13,
    color: '#A16207',
    fontWeight: '500',
  },
  editingBannerClose: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editingBannerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  editingBannerMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  editingBannerMetricText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  editingBannerDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#F59E0B',
    marginHorizontal: 8,
  },
  editingBannerTotalLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  editingBannerTotalValue: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '700',
  },
  // Compact equipment entries styles
  compactEquipmentEntriesList: {
    gap: 12,
  },
  compactEquipmentEntryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  compactEquipmentEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    position: 'relative',
  },
  compactEquipmentEntryLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    paddingRight: 80, // Space for action buttons
  },
  compactEquipmentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  compactEquipmentInfo: {
    flex: 1,
    minWidth: 0, // Allow text to shrink
  },
  compactEquipmentType: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 3,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  compactEquipmentCategory: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    lineHeight: 13,
  },
  compactCostTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: 4,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    maxWidth: '100%',
  },
  compactCostTypeText: {
    fontSize: 10,
    color: '#1E40AF',
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  compactCardActions: {
    flexDirection: 'row',
    gap: 8,
    position: 'absolute',
    top: 0,
    right: 0,
  },
  compactEditButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  compactRemoveButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  compactEquipmentMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  compactMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  compactMetricValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '700',
    flexShrink: 1,
  },
  compactMetricDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 6,
  },
  compactTotalMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'flex-end',
    minWidth: 0,
  },
  compactTotalLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  compactTotalValue: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '800',
    flexShrink: 1,
  },
  // Cancel add form styles
  cancelAddFormContainer: {
    paddingHorizontal: 4,
    marginTop: 12,
    alignItems: 'center',
  },
  cancelAddFormButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  cancelAddFormText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Modal actions styles
  modalActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#F0FDF4',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },

  // Grand total styles
  grandTotalContainer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 6,
  },
  grandTotalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  grandTotalLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    fontFamily: 'System',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  grandTotalDivider: {
    width: 2,
    height: 20,
    backgroundColor: '#D1D5DB',
    borderRadius: 1,
  },
  grandTotalValue: {
    fontSize: 24,
    color: '#000000',
    fontWeight: '800',
    fontFamily: 'System',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    flexShrink: 1,
  },
  // Swipe to submit styles
  swipeToSubmitContainer: {
    width: '100%',
    paddingHorizontal: 4,
  },
  swipeTrack: {
    backgroundColor: '#1E293B',
    borderRadius: 32,
    height: 64,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  swipeButton: {
    position: 'absolute',
    left: 4,
    top: 4,
    width: 56,
    height: 56,
    backgroundColor: '#3B82F6',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  doubleChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronFirst: {
    marginRight: -6,
  },
  chevronSecond: {
    marginLeft: -6,
  },
  swipeTextContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 64,
    paddingRight: 16,
  },
  swipeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});

export default EquipmentFormModal;