import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface LaborFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (laborEntries: any[], message: string, miniSectionId?: string) => void;
  sectionId?: string;
  miniSectionId?: string;
  projectId?: string;
  projectName?: string;
  sectionName?: string;
  miniSections?: any[];
}

interface LaborCategory {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  types: string[];
}

const laborCategories: LaborCategory[] = [
  {
    id: 'civil',
    name: 'Civil / Structural Works',
    icon: 'hammer-outline',
    color: '#EF4444',
    types: [
      'Mason (Raj Mistri)',
      'Helper / Unskilled Labour',
      'Shuttering Carpenter',
      'Steel Fixer / Bar Bender',
      'Concrete Labour',
      'Tile Fixer',
      'Stone Mason',
      'Waterproofing Labour'
    ]
  },
  {
    id: 'electrical',
    name: 'Electrical Works',
    icon: 'flash-outline',
    color: '#F59E0B',
    types: [
      'Electrical Engineer / Supervisor',
      'Electrician',
      'Electrician Helper',
      'Panel Technician',
      'Earthing Technician'
    ]
  },
  {
    id: 'plumbing',
    name: 'Plumbing & Sanitary Works',
    icon: 'water-outline',
    color: '#3B82F6',
    types: [
      'Plumbing Engineer / Supervisor',
      'Plumber',
      'Plumber Helper',
      'Sanitary Fitter',
      'Drainage Labour'
    ]
  },
  {
    id: 'finishing',
    name: 'Finishing Works',
    icon: 'brush-outline',
    color: '#EC4899',
    types: [
      'Painter',
      'Polish Worker',
      'Gypsum / POP Worker',
      'Carpenter (Finishing)',
      'Glass Fitter',
      'Aluminium Fabricator'
    ]
  },
  {
    id: 'hvac',
    name: 'Mechanical & HVAC Works',
    icon: 'thermometer-outline',
    color: '#F97316',
    types: [
      'HVAC Engineer',
      'AC Technician',
      'Duct Fabricator',
      'Ventilation Technician'
    ]
  },
  {
    id: 'firefighting',
    name: 'Fire Fighting & Safety Works',
    icon: 'flame-outline',
    color: '#DC2626',
    types: [
      'Fire Fighting Engineer',
      'Fire Pipe Fitter',
      'Sprinkler Technician',
      'Fire Alarm Technician'
    ]
  },
  {
    id: 'external',
    name: 'External & Infrastructure Works',
    icon: 'leaf-outline',
    color: '#65A30D',
    types: [
      'Paver Block Labour',
      'Road Work Labour',
      'Compound Wall Mason',
      'Landscaping Labour / Gardener',
      'Rainwater Harvesting Technician'
    ]
  },
  {
    id: 'waterproofing',
    name: 'Waterproofing & Treatment Works',
    icon: 'shield-outline',
    color: '#10B981',
    types: [
      'Waterproofing Applicator',
      'Chemical Treatment Technician',
      'Basement Treatment Labour'
    ]
  },
  {
    id: 'management',
    name: 'Site Management & Support Staff',
    icon: 'people-outline',
    color: '#1E40AF',
    types: [
      'Site Engineer',
      'Junior Engineer',
      'Site Supervisor / Foreman',
      'Safety Officer',
      'Store Keeper',
      'Quantity Surveyor (QS)',
      'Time Keeper'
    ]
  },
  {
    id: 'equipment',
    name: 'Equipment Operators',
    icon: 'car-outline',
    color: '#7C2D12',
    types: [
      'Excavator / JCB Operator',
      'Crane Operator',
      'Concrete Mixer Operator',
      'Lift Operator (Material/Passenger)'
    ]
  },
  {
    id: 'security',
    name: 'Security & Housekeeping',
    icon: 'shield-checkmark-outline',
    color: '#374151',
    types: [
      'Security Guard',
      'Watchman',
      'Housekeeping Labour'
    ]
  },
  {
    id: 'multitask',
    name: 'Multitask Labor',
    icon: 'layers-outline',
    color: '#8B5CF6',
    types: [
      'General Multitask Worker',
      'Skilled Multitask Labor',
      'Semi-Skilled Multitask Labor',
      'Multitask Helper',
      'Versatile Construction Worker',
      'All-Round Technician',
      'Multi-Trade Specialist',
      'Flexible Labor (Civil + Electrical)',
      'Flexible Labor (Plumbing + Finishing)',
      'Cross-Trained Worker'
    ]
  }
];

const LaborFormModal: React.FC<LaborFormModalProps> = ({
  visible,
  onClose,
  onSubmit,
  miniSections = []
}) => {
  // Get screen dimensions and calculate safe bottom padding
  const { height: screenHeight } = Dimensions.get('window');
  const safeBottomPadding = Platform.OS === 'ios' ? 34 : 20; // iOS has home indicator, Android has navigation bar
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [count, setCount] = useState<string>('');
  const [perLaborCost, setPerLaborCost] = useState<string>('');
  const [selectedMiniSection, setSelectedMiniSection] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [laborEntries, setLaborEntries] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const laborEntriesRef = useRef<any[]>([]);
  
  // State for showing advanced options
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);

  // Animation values for swipe to submit
  const swipeAnimation = useRef(new Animated.Value(0)).current;
  const [isSwipeComplete, setIsSwipeComplete] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [progressText, setProgressText] = useState('Swipe to Submit All');
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Calculate max swipe distance based on screen width
  const BUTTON_SIZE = 54;
  const TRACK_HORIZONTAL_PADDING = 40; // 20px padding on each side
  const BUTTON_INSET = 5;
  const maxSwipeDistance = Dimensions.get('window').width - TRACK_HORIZONTAL_PADDING - BUTTON_SIZE - (BUTTON_INSET * 2);

  // Animation values
  const scrollViewRef = useRef<ScrollView>(null);

  // Animation values for types section
  const typesSectionOpacity = useRef(new Animated.Value(0)).current;
  const typesSectionHeight = useRef(new Animated.Value(0)).current;

  // Start pulse animation when swipe area is visible
  useEffect(() => {
    if (laborEntries.length > 0 && !showAddForm) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      const shimmer = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      pulse.start();
      shimmer.start();

      return () => {
        pulse.stop();
        shimmer.stop();
      };
    }
  }, [laborEntries.length, showAddForm]);

  // Swipe gesture handlers
  const handleSwipeStart = () => {
    // Reset swipe state
    setIsSwipeComplete(false);
    setSwipeProgress(0);
    setProgressText('Swipe to Submit All');
    // Light haptic feedback on start
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSwipeMove = (gestureState: any) => {
    const { dx } = gestureState;
    const progress = Math.max(0, Math.min(dx / maxSwipeDistance, 1));
    
    setSwipeProgress(progress);
    swipeAnimation.setValue(progress);
    
    // Update progress text based on swipe progress
    if (progress < 0.3) {
      setProgressText('Swipe to Submit All');
    } else if (progress < 0.6) {
      setProgressText('Keep Swiping...');
      // Medium haptic feedback at 30% progress
      if (progress >= 0.3 && swipeProgress < 0.3) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } else if (progress < 0.7) {
      setProgressText('Almost There!');
    } else {
      setProgressText('Release to Submit!');
      // Success haptic feedback at 70% progress
      if (progress >= 0.7 && !isSwipeComplete) {
        setIsSwipeComplete(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  const handleSwipeEnd = (gestureState: any) => {
    const { dx } = gestureState;
    const progress = dx / maxSwipeDistance;
    
    console.log('Swipe ended, progress:', progress, 'laborEntries.length:', laborEntries.length);
    
    if (progress >= 0.7) {
      // Success haptic feedback on completion
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Complete the swipe — snap to end
      Animated.spring(swipeAnimation, {
        toValue: 1,
        speed: 20,
        bounciness: 2,
        useNativeDriver: false,
      }).start(() => {
        console.log('Animation completed, calling handleFinalSubmit');
        handleFinalSubmit();
      });
    } else {
      // Light haptic feedback on reset
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Animate back to start with spring physics
      Animated.spring(swipeAnimation, {
        toValue: 0,
        speed: 12,
        bounciness: 8,
        useNativeDriver: false,
      }).start();
      setIsSwipeComplete(false);
      setSwipeProgress(0);
      setProgressText('Swipe to Submit All');
    }
  };

  // Pan responder for swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 2);
      },
      onPanResponderGrant: handleSwipeStart,
      onPanResponderMove: (_, gestureState) => handleSwipeMove(gestureState),
      onPanResponderRelease: (_, gestureState) => handleSwipeEnd(gestureState),
    })
  ).current;

  const resetForm = () => {
    setSelectedCategory('');
    setSelectedType('');
    setCount('');
    setPerLaborCost('');
    setSelectedMiniSection('');
    setSearchQuery('');
    setLaborEntries([]);
    laborEntriesRef.current = []; // Reset ref too
    setShowAddForm(false);
    setEditingEntry(null);
    setIsSwipeComplete(false);
    setSwipeProgress(0);
    setProgressText('Swipe to Submit All');
    swipeAnimation.setValue(0);
    setShowAdvancedOptions(false); // Reset advanced options
    
    // Reset types section animations
    typesSectionOpacity.setValue(0);
    typesSectionHeight.setValue(0);
  };

  const handleCategorySelect = (category: LaborCategory) => {
    setSelectedCategory(category.id);
    
    // Show types section with animation
    const showTypesAnimations = [
      Animated.timing(typesSectionOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(typesSectionHeight, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      })
    ];

    Animated.parallel(showTypesAnimations).start(() => {
      // Auto scroll to types section
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 200, animated: true });
      }, 100);
    });
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    
    // If category is not set (quick selection), set it to 'civil' for Mistri and Labor
    if (!selectedCategory && (type === 'Mason (Raj Mistri)' || type === 'Helper / Unskilled Labour')) {
      setSelectedCategory('civil');
    }
    
    // Auto scroll to mini-section selection
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleMiniSectionSelect = (sectionId: string) => {
    setSelectedMiniSection(sectionId);
    // Auto scroll to labor details form
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const resetCurrentEntry = () => {
    setSelectedCategory('');
    setSelectedType('');
    setCount('');
    setPerLaborCost('');
    setSelectedMiniSection('');
    setSearchQuery('');
    setEditingEntry(null);
    setShowAdvancedOptions(false); // Reset advanced options
    
    // Reset types section animations
    typesSectionOpacity.setValue(0);
    typesSectionHeight.setValue(0);
    
    // Scroll back to top
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleAddLabor = () => {
    if (!selectedCategory || !selectedType || !count || !perLaborCost) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (!selectedMiniSection) {
      Alert.alert('Error', 'Please select a work area');
      return;
    }

    const countNum = parseInt(count);
    const costNum = parseFloat(perLaborCost);

    if (isNaN(countNum) || countNum <= 0) {
      Alert.alert('Error', 'Please enter a valid number of laborers');
      return;
    }

    if (isNaN(costNum) || costNum <= 0) {
      Alert.alert('Error', 'Please enter a valid cost per laborer');
      return;
    }

    const selectedCategoryData = laborCategories.find(cat => cat.id === selectedCategory);
    let selectedMiniSectionData;
    let miniSectionName;
    
    if (selectedMiniSection === 'no-mini-section') {
      miniSectionName = 'General Building Labor';
    } else {
      selectedMiniSectionData = miniSections.find(s => s._id === selectedMiniSection);
      miniSectionName = selectedMiniSectionData?.name || '';
    }
    
    // Create LaborEntry format
    const laborEntry: any = {
      type: selectedType,
      category: selectedCategoryData?.name || '',
      count: countNum,
      perLaborCost: costNum,
      totalCost: countNum * costNum,
      miniSectionId: selectedMiniSection,
      miniSectionName: miniSectionName,
      icon: selectedCategoryData?.icon || 'people',
      color: selectedCategoryData?.color || '#3B82F6',
    };

    // Add to entries list
    setLaborEntries(prev => {
      const newEntries = [...prev, laborEntry];
      laborEntriesRef.current = newEntries; // Keep ref in sync
      console.log('Adding labor entry, new total:', newEntries.length);
      console.log('New entry:', laborEntry);
      return newEntries;
    });
    
    // Reset current entry form and hide form
    resetCurrentEntry();
    setShowAddForm(false);
    
    // Scroll to top to show the summary
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const goBackToCategories = () => {
    setSelectedCategory('');
    setSelectedType('');
    setSelectedMiniSection('');
    setSearchQuery('');
    
    // Hide types section
    Animated.parallel([
      Animated.timing(typesSectionOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(typesSectionHeight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      })
    ]).start();

    // Scroll back to top
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const goBackToTypes = () => {
    setSelectedType('');
    setSelectedMiniSection('');
    // Scroll to types section
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 200, animated: true });
    }, 100);
  };

  const goBackToMiniSections = () => {
    setSelectedMiniSection('');
    // Scroll to mini-sections
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleFinalSubmit = () => {
    const currentEntries = laborEntriesRef.current; // Use ref instead of state
    console.log('handleFinalSubmit called, currentEntries.length:', currentEntries.length);
    console.log('currentEntries:', currentEntries);
    console.log('laborEntries state:', laborEntries.length); // Compare with state
    
    if (currentEntries.length === 0) {
      Alert.alert('Error', 'Please add at least one labor entry');
      return;
    }

    // Submit all entries as one group
    const message = `Labor added successfully`;
    onSubmit(currentEntries, message);

    resetForm();
    onClose();
  };

  const removeLaborEntry = (index: number) => {
    setLaborEntries(prev => {
      const newEntries = prev.filter((_, i) => i !== index);
      laborEntriesRef.current = newEntries; // Keep ref in sync
      return newEntries;
    });
  };

  const confirmRemoveLaborEntry = (index: number, laborType: string) => {
    Alert.alert(
      'Delete Labor Entry',
      `Are you sure you want to delete this ${laborType} entry? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeLaborEntry(index),
        },
      ]
    );
  };

  const editLaborEntry = (index: number) => {
    const entry = laborEntries[index];
    
    // Set editing entry for display
    setEditingEntry(entry);
    
    // Set form values to the entry being edited
    const categoryData = laborCategories.find(cat => cat.name === entry.category);
    if (categoryData) {
      setSelectedCategory(categoryData.id);
    }
    setSelectedType(entry.type);
    setCount(entry.count.toString());
    setPerLaborCost(entry.perLaborCost.toString());
    setSelectedMiniSection(entry.miniSectionId);
    
    // Remove the entry being edited
    removeLaborEntry(index);
    
    // Show the add form
    setShowAddForm(true);
    
    // Show the form sections
    typesSectionOpacity.setValue(1);
    typesSectionHeight.setValue(1);
    
    // Scroll to the form
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const selectedCategoryData = laborCategories.find(cat => cat.id === selectedCategory);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              {selectedCategory && (
                <TouchableOpacity 
                  onPress={goBackToCategories}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={24} color="#374151" />
                </TouchableOpacity>
              )}
              <Text style={styles.modalTitle}>Enter Labor Details</Text>
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
              { paddingBottom: safeBottomPadding + 100 } // Add safe area + extra padding for buttons
            ]}
          >
            {/* Compact Labor Entries Summary - Shown at Top */}
            {laborEntries.length > 0 && (
              <View style={[styles.sectionContainer, styles.firstSectionContainer]}>
                <Text style={styles.sectionTitle}>Added Labor Entries ({laborEntries.length})</Text>
                
                <View style={styles.compactLaborEntriesList}>
                  {laborEntries.map((entry, index) => (
                    <View key={index} style={styles.compactLaborEntryCard}>
                      <View style={styles.compactLaborEntryHeader}>
                        <View style={styles.compactLaborEntryLeft}>
                          <View style={[styles.compactLaborIcon, { backgroundColor: `${entry.color || '#3B82F6'}20` }]}>
                            <Ionicons name={entry.icon || 'people'} size={18} color={entry.color || '#3B82F6'} />
                          </View>
                          <View style={styles.compactLaborInfo}>
                            <Text style={styles.compactLaborType}>{entry.type}</Text>
                            <Text style={styles.compactLaborCategory}>{entry.category}</Text>
                            <View style={styles.compactAreaInfo}>
                              <Ionicons name="location" size={12} color="#3B82F6" />
                              <Text style={styles.compactAreaText}>{entry.miniSectionName}</Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.compactCardActions}>
                          <TouchableOpacity 
                            style={styles.compactEditButton}
                            onPress={() => editLaborEntry(index)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="pencil" size={14} color="#3B82F6" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.compactRemoveButton}
                            onPress={() => confirmRemoveLaborEntry(index, entry.type)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="trash" size={14} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      <View style={styles.compactLaborMetrics}>
                        <View style={styles.compactMetricItem}>
                          <Ionicons name="people" size={14} color="#64748B" />
                          <Text style={styles.compactMetricValue}>{entry.count}</Text>
                        </View>
                        <View style={styles.compactMetricDivider} />
                        <View style={styles.compactMetricItem}>
                          <Ionicons name="cash" size={14} color="#64748B" />
                          <Text style={styles.compactMetricValue}>₹{entry.perLaborCost.toLocaleString()}</Text>
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

            {/* Add Labor Button - Only show when there are existing entries */}
            {laborEntries.length > 0 && !showAddForm && (
              <View style={styles.addLaborButtonContainer}>
                <TouchableOpacity 
                  style={styles.addLaborButton}
                  onPress={() => {
                    setShowAddForm(true);
                    // Calculate scroll position based on number of labor entries
                    // 150px per labor entry
                    const scrollY = laborEntries.length * 150;
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: scrollY, animated: true });
                    }, 100);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.addLaborButtonContent}>
                    <Ionicons name="add-circle" size={20} color="#10B981" />
                    <Text style={styles.addLaborButtonText}>Add Labor Entry</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Labor Adding Form - Show by default when no entries, or when showAddForm is true */}
            {(laborEntries.length === 0 || showAddForm) && (
              <>
                {/* Editing Entry Banner - Show when editing */}
                {editingEntry && (
                  <View style={styles.editingBannerContainer}>
                    <View style={styles.editingBanner}>
                      <View style={styles.editingBannerHeader}>
                        <View style={styles.editingBannerLeft}>
                          <View style={[styles.editingBannerIcon, { backgroundColor: `${editingEntry.color || '#3B82F6'}20` }]}>
                            <Ionicons name="pencil" size={16} color={editingEntry.color || '#3B82F6'} />
                          </View>
                          <View style={styles.editingBannerInfo}>
                            <Text style={styles.editingBannerTitle}>Editing Labor Entry</Text>
                            <Text style={styles.editingBannerSubtitle}>
                              {editingEntry.type} • {editingEntry.miniSectionName}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity 
                          style={styles.editingBannerClose}
                          onPress={() => {
                            // Restore the entry back to the list
                            setLaborEntries(prev => {
                              const newEntries = [...prev, editingEntry];
                              laborEntriesRef.current = newEntries;
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
                          <Ionicons name="people" size={14} color="#64748B" />
                          <Text style={styles.editingBannerMetricText}>{editingEntry.count} laborers</Text>
                        </View>
                        <View style={styles.editingBannerDivider} />
                        <View style={styles.editingBannerMetric}>
                          <Ionicons name="cash" size={14} color="#64748B" />
                          <Text style={styles.editingBannerMetricText}>₹{editingEntry.perLaborCost.toLocaleString()}/each</Text>
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

                {/* Step 1: Category Selection - Only show if advanced options are enabled */}
                {showAdvancedOptions && (
                  <View style={[styles.sectionContainer, styles.firstSectionContainer]}>
                    {!selectedCategory ? (
                      <>
                        <View style={styles.searchContainer}>
                          <View style={styles.searchInputWrapper}>
                            <Ionicons name="search" size={20} color="#9CA3AF" />
                            <TextInput
                              style={styles.searchInput}
                              value={searchQuery}
                              onChangeText={setSearchQuery}
                              placeholder="Search labor categories..."
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
                        
                        {/* Hide Advanced Options Button */}
                        <TouchableOpacity
                          style={styles.hideAdvancedButton}
                          onPress={() => {
                            setShowAdvancedOptions(false);
                            setSelectedCategory('');
                            setSearchQuery('');
                            // Scroll back to top
                            setTimeout(() => {
                              scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                            }, 100);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.hideAdvancedButtonContent}>
                            <Ionicons name="chevron-up" size={18} color="#64748B" />
                            <Text style={styles.hideAdvancedButtonText}>Hide Advanced Options</Text>
                          </View>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Selected Category</Text>
                        <TouchableOpacity 
                          style={styles.undoButton}
                          onPress={goBackToCategories}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="arrow-undo-outline" size={16} color="#EA580C" />
                          <Text style={styles.undoButtonText}>Undo</Text>
                        </TouchableOpacity>
                      </View>
                    )}
              
              <View style={styles.categoriesContainer}>
                {!selectedCategory && (() => {
                  const filteredCategories = laborCategories.filter(category =>
                    category.name.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                  
                  return filteredCategories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={styles.categoryCard}
                      onPress={() => handleCategorySelect(category)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                        <Ionicons name={category.icon} size={24} color={category.color} />
                      </View>
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryName}>{category.name}</Text>
                      </View>
                    </TouchableOpacity>
                  ));
                })()}

                {selectedCategory && (() => {
                  const category = laborCategories.find(cat => cat.id === selectedCategory);
                  return category ? (
                    <View style={styles.selectedCategoryWrapper}>
                      <View style={styles.selectedCategoryContainer}>
                        <View style={[styles.categoryCard, styles.categoryCardSelected]}>
                          <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                            <Ionicons name={category.icon} size={24} color={category.color} />
                          </View>
                          <View style={styles.categoryInfo}>
                            <Text style={[styles.categoryName, styles.categoryNameSelected]}>
                              {category.name}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ) : null;
                })()}
              </View>
            </View>
                )}

            {/* Quick Labor Selection - Show when advanced options are NOT enabled */}
            {!showAdvancedOptions && (
              <View style={[styles.sectionContainer, styles.firstSectionContainer]}>
                <View style={styles.quickLaborHeader}>
                  <Ionicons name="people-circle-outline" size={24} color="#3B82F6" />
                  <Text style={styles.quickLaborTitle}>Select Labor Type</Text>
                </View>
                
                {!selectedType ? (
                  <View style={styles.quickLaborOptions}>
                    {/* Mistri Option */}
                    <TouchableOpacity
                      style={styles.quickLaborCard}
                      onPress={() => {
                        setSelectedCategory('civil'); // Set to Civil category
                        handleTypeSelect('Mason (Raj Mistri)');
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.quickLaborCardContent}>
                        <View style={[styles.quickLaborIcon, { backgroundColor: '#EFF6FF' }]}>
                          <Ionicons name="hammer-outline" size={32} color="#3B82F6" />
                        </View>
                        <View style={styles.quickLaborInfo}>
                          <Text style={styles.quickLaborName}>Mistri</Text>
                          <Text style={styles.quickLaborSubtext}>Skilled mason worker</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#3B82F6" />
                      </View>
                    </TouchableOpacity>

                    {/* Labor Option */}
                    <TouchableOpacity
                      style={styles.quickLaborCard}
                      onPress={() => {
                        setSelectedCategory('civil'); // Set to Civil category
                        handleTypeSelect('Helper / Unskilled Labour');
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.quickLaborCardContent}>
                        <View style={[styles.quickLaborIcon, { backgroundColor: '#F0FDF4' }]}>
                          <Ionicons name="people-outline" size={32} color="#10B981" />
                        </View>
                        <View style={styles.quickLaborInfo}>
                          <Text style={styles.quickLaborName}>Labor</Text>
                          <Text style={styles.quickLaborSubtext}>General helper</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#10B981" />
                      </View>
                    </TouchableOpacity>

                    {/* Show Advanced Options Button */}
                    <TouchableOpacity
                      style={styles.showAdvancedButton}
                      onPress={() => {
                        setShowAdvancedOptions(true);
                        // Scroll to show the advanced options
                        setTimeout(() => {
                          scrollViewRef.current?.scrollTo({ y: 100, animated: true });
                        }, 100);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.showAdvancedButtonContent}>
                        <Ionicons name="options-outline" size={20} color="#7C3AED" />
                        <Text style={styles.showAdvancedButtonText}>Show Advanced Options</Text>
                        <Ionicons name="chevron-down" size={18} color="#7C3AED" />
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.selectedQuickLaborWrapper}>
                    <View style={styles.selectedQuickLaborCard}>
                      <View style={styles.selectedQuickLaborContent}>
                        <View style={[styles.quickLaborIcon, { 
                          backgroundColor: selectedType === 'Mason (Raj Mistri)' ? '#EFF6FF' : '#F0FDF4' 
                        }]}>
                          <Ionicons 
                            name={selectedType === 'Mason (Raj Mistri)' ? 'hammer' : 'people'} 
                            size={28} 
                            color={selectedType === 'Mason (Raj Mistri)' ? '#3B82F6' : '#10B981'} 
                          />
                        </View>
                        <View style={styles.quickLaborInfo}>
                          <Text style={styles.selectedQuickLaborName}>
                            {selectedType === 'Mason (Raj Mistri)' ? 'Mistri' : 'Labor'}
                          </Text>
                          <Text style={styles.quickLaborSubtext}>
                            {selectedType === 'Mason (Raj Mistri)' ? 'Skilled mason worker' : 'General helper'}
                          </Text>
                        </View>
                        <View style={styles.selectedQuickLaborActions}>
                          <TouchableOpacity 
                            style={styles.undoButton}
                            onPress={() => {
                              setSelectedType('');
                              setSelectedCategory('');
                            }}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="arrow-undo-outline" size={16} color="#EA580C" />
                            <Text style={styles.undoButtonText}>Change</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Step 2: Type Selection - Only show if advanced options are enabled */}
            {showAdvancedOptions && selectedCategory && (
              <Animated.View 
                style={[
                  styles.sectionContainer,
                  {
                    opacity: typesSectionOpacity,
                    transform: [{
                      scaleY: typesSectionHeight
                    }]
                  }
                ]}
              >
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Select Labor Type</Text>
                  {selectedType && (
                    <TouchableOpacity 
                      style={styles.undoButton}
                      onPress={goBackToTypes}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="arrow-undo-outline" size={16} color="#EA580C" />
                      <Text style={styles.undoButtonText}>Undo</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.typesContainer}>
                  {(() => {
                    const categoryTypes = laborCategories.find(cat => cat.id === selectedCategory)?.types || [];
                    const displayTypes = selectedType ? categoryTypes.filter(type => type === selectedType) : categoryTypes;
                    
                    // Define basic labor types
                    const basicLaborTypes = ['Mason (Raj Mistri)', 'Helper / Unskilled Labour'];
                    
                    // Filter types based on showAdvancedOptions
                    const filteredTypes = showAdvancedOptions 
                      ? displayTypes 
                      : displayTypes.filter(type => basicLaborTypes.includes(type));
                    
                    return (
                      <>
                        {!selectedType && displayTypes.length > 0 && (
                          <View style={styles.laborTypesContainer}>
                            {/* Basic Labor Types - Mistri and Labor */}
                            <View style={styles.basicTypesGroup}>
                              <View style={styles.basicTypesHeader}>
                                <Ionicons name="people-circle-outline" size={20} color="#3B82F6" />
                                <Text style={styles.basicTypesHeaderText}>Quick Add</Text>
                              </View>
                              
                              <View style={styles.typesList}>
                                {filteredTypes.map((type, index) => (
                                  <TouchableOpacity
                                    key={index}
                                    style={[
                                      styles.typeCard,
                                      styles.basicTypeCard,
                                      index === filteredTypes.length - 1 && !showAdvancedOptions && styles.typeCardLast
                                    ]}
                                    onPress={() => handleTypeSelect(type)}
                                    activeOpacity={0.7}
                                  >
                                    <View style={styles.typeCardLeft}>
                                      <View style={[styles.typeIconBadge, styles.basicTypeIconBadge]}>
                                        <Ionicons name="person-outline" size={18} color="#3B82F6" />
                                      </View>
                                      <View style={styles.basicTypeInfo}>
                                        <Text style={styles.typeCardName}>{type}</Text>
                                        <Text style={styles.basicTypeSubtext}>
                                          {type === 'Mason (Raj Mistri)' ? 'Skilled mason worker' : 'General helper'}
                                        </Text>
                                      </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>

                            {/* Advanced Options - Show when toggled */}
                            {showAdvancedOptions && (
                              <>
                                {/* Multitask Labor Option */}
                                <TouchableOpacity
                                  style={styles.multitaskLaborCard}
                                  onPress={() => handleTypeSelect('Multitask Labor')}
                                  activeOpacity={0.7}
                                >
                                  <View style={styles.multitaskLaborContent}>
                                    <View style={styles.multitaskLaborIconContainer}>
                                      <View style={styles.multitaskLaborIconBadge}>
                                        <Ionicons name="people" size={20} color="#7C3AED" />
                                      </View>
                                      <View style={styles.multitaskLaborIconOverlay}>
                                        <Ionicons name="star" size={14} color="#7C3AED" />
                                      </View>
                                    </View>
                                    <View style={styles.multitaskLaborInfo}>
                                      <Text style={styles.multitaskLaborTitle}>Multitask Labor</Text>
                                      <Text style={styles.multitaskLaborSubtitle}>
                                        Workers who can handle multiple tasks in this category
                                      </Text>
                                      <View style={styles.multitaskLaborBadge}>
                                        <Ionicons name="flash" size={12} color="#7C3AED" />
                                        <Text style={styles.multitaskLaborBadgeText}>Versatile</Text>
                                      </View>
                                    </View>
                                    <View style={styles.multitaskLaborArrow}>
                                      <Ionicons name="chevron-forward" size={20} color="#7C3AED" />
                                    </View>
                                  </View>
                                </TouchableOpacity>

                                {/* Specific Labor Types */}
                                <View style={styles.specificTypesGroup}>
                                  <View style={styles.specificTypesHeader}>
                                    <View style={styles.specificTypesHeaderLine} />
                                    <Text style={styles.specificTypesHeaderText}>All Labor Types</Text>
                                    <View style={styles.specificTypesHeaderLine} />
                                  </View>
                                  
                                  <View style={styles.typesList}>
                                    {displayTypes.map((type, index) => (
                                      <TouchableOpacity
                                        key={index}
                                        style={[
                                          styles.typeCard,
                                          index === displayTypes.length - 1 && styles.typeCardLast
                                        ]}
                                        onPress={() => handleTypeSelect(type)}
                                        activeOpacity={0.7}
                                      >
                                        <View style={styles.typeCardLeft}>
                                          <View style={styles.typeIconBadge}>
                                            <Ionicons name="person-outline" size={18} color="#3B82F6" />
                                          </View>
                                          <Text style={styles.typeCardName}>{type}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                              </>
                            )}
                          </View>
                        )}

                        {selectedType && (
                          <View style={styles.selectedTypeWrapper}>
                            <View style={styles.selectedTypeContainer}>
                              {selectedType === 'Multitask Labor' ? (
                                <View style={styles.selectedMultitaskLaborCard}>
                                  <View style={styles.selectedMultitaskLaborContent}>
                                    <View style={styles.selectedMultitaskLaborIconContainer}>
                                      <View style={styles.selectedMultitaskLaborIconBadge}>
                                        <Ionicons name="people" size={20} color="#7C3AED" />
                                      </View>
                                      <View style={styles.selectedMultitaskLaborIconOverlay}>
                                        <Ionicons name="star" size={14} color="#7C3AED" />
                                      </View>
                                    </View>
                                    <View style={styles.selectedMultitaskLaborInfo}>
                                      <Text style={styles.selectedMultitaskLaborTitle}>Multitask Labor</Text>
                                      <Text style={styles.selectedMultitaskLaborSubtitle}>
                                        Versatile workers for multiple tasks
                                      </Text>
                                    </View>
                                    <Ionicons name="checkmark-circle" size={22} color="#7C3AED" />
                                  </View>
                                </View>
                              ) : (
                                <View style={[styles.typeCard, styles.typeCardSelected]}>
                                  <View style={styles.typeCardLeft}>
                                    <View style={styles.typeIconBadge}>
                                      <Ionicons name="person-outline" size={18} color="#3B82F6" />
                                    </View>
                                    <Text style={[styles.typeCardName, styles.typeCardNameSelected]}>
                                      {selectedType}
                                    </Text>
                                  </View>
                                  <Ionicons name="checkmark-circle" size={22} color="#3B82F6" />
                                </View>
                              )}
                            </View>
                          </View>
                        )}
                      </>
                    );
                  })()}
                </View>
              </Animated.View>
            )}

            {/* Step 3: Mini-Section Selection */}
            {selectedType && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Select Work Area</Text>
                  {selectedMiniSection && (
                    <TouchableOpacity 
                      style={styles.undoButton}
                      onPress={goBackToMiniSections}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="arrow-undo-outline" size={16} color="#EA580C" />
                      <Text style={styles.undoButtonText}>Undo</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                {/* Mini-Section Selection */}
                <View style={styles.miniSectionFieldContainer}>
                  <View style={styles.labelWithHelper}>
                    <Text style={styles.miniSectionLabel}>
                      Where is this labor being used? <Text style={styles.required}>*</Text>
                    </Text>
                    <Text style={styles.labelHelper}>Select the specific work area or choose general labor</Text>
                  </View>
                  
                  {!selectedMiniSection && (
                    <View style={styles.workAreaContainer}>
                      {/* No Mini-Section Option */}
                      <TouchableOpacity
                        style={styles.noMiniSectionCard}
                        onPress={() => handleMiniSectionSelect('no-mini-section')}
                        activeOpacity={0.7}
                      >
                        <View style={styles.noMiniSectionContent}>
                          <View style={styles.noMiniSectionIconContainer}>
                            <View style={styles.noMiniSectionIconBadge}>
                              <Ionicons name="business-outline" size={24} color="#7C3AED" />
                            </View>
                            <View style={styles.noMiniSectionIconOverlay}>
                              <Ionicons name="globe-outline" size={16} color="#7C3AED" />
                            </View>
                          </View>
                          <View style={styles.noMiniSectionInfo}>
                            <Text style={styles.noMiniSectionTitle}>General Building Labor</Text>
                            <Text style={styles.noMiniSectionSubtitle}>
                              For labor that works across the entire building
                            </Text>
                            <View style={styles.noMiniSectionBadge}>
                              <Ionicons name="checkmark-circle" size={14} color="#7C3AED" />
                              <Text style={styles.noMiniSectionBadgeText}>No specific area</Text>
                            </View>
                          </View>
                          <View style={styles.noMiniSectionArrow}>
                            <Ionicons name="chevron-forward" size={20} color="#7C3AED" />
                          </View>
                        </View>
                      </TouchableOpacity>

                      {/* Mini-Sections List */}
                      {miniSections.length > 0 && (
                        <View style={styles.miniSectionsGroup}>
                          <View style={styles.miniSectionsHeader}>
                            <View style={styles.miniSectionsHeaderLine} />
                            <Text style={styles.miniSectionsHeaderText}>Specific Work Areas</Text>
                            <View style={styles.miniSectionsHeaderLine} />
                          </View>
                          
                          <View style={styles.miniSectionsList}>
                            {miniSections.map((section: any, index: number) => (
                              <TouchableOpacity
                                key={section._id}
                                style={[
                                  styles.miniSectionCard,
                                  index === miniSections.length - 1 && styles.miniSectionCardLast
                                ]}
                                onPress={() => handleMiniSectionSelect(section._id)}
                                activeOpacity={0.7}
                              >
                                <View style={styles.miniSectionCardContent}>
                                  <View style={styles.miniSectionIconBadge}>
                                    <Ionicons name="layers-outline" size={20} color="#3B82F6" />
                                  </View>
                                  <View style={styles.miniSectionInfo}>
                                    <Text style={styles.miniSectionName}>{section.name}</Text>
                                    <Text style={styles.miniSectionDescription}>Specific area work</Text>
                                  </View>
                                  <View style={styles.miniSectionArrow}>
                                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                                  </View>
                                </View>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}

                      {miniSections.length === 0 && (
                        <View style={styles.noSectionsInfo}>
                          <View style={styles.noSectionsIconContainer}>
                            <Ionicons name="information-circle-outline" size={24} color="#6B7280" />
                          </View>
                          <Text style={styles.noSectionsInfoText}>
                            No specific work areas available. You can still add general building labor above.
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {selectedMiniSection && (() => {
                    if (selectedMiniSection === 'no-mini-section') {
                      return (
                        <View style={styles.selectedWorkAreaWrapper}>
                          <View style={styles.selectedNoMiniSectionContainer}>
                            <View style={styles.selectedNoMiniSectionCard}>
                              <View style={styles.selectedNoMiniSectionContent}>
                                <View style={styles.selectedNoMiniSectionIconContainer}>
                                  <View style={styles.selectedNoMiniSectionIconBadge}>
                                    <Ionicons name="business" size={24} color="#7C3AED" />
                                  </View>
                                  <View style={styles.selectedNoMiniSectionIconOverlay}>
                                    <Ionicons name="globe" size={16} color="#7C3AED" />
                                  </View>
                                </View>
                                <View style={styles.selectedNoMiniSectionInfo}>
                                  <Text style={styles.selectedNoMiniSectionTitle}>General Building Labor</Text>
                                  <Text style={styles.selectedNoMiniSectionSubtitle}>
                                    Works across the entire building
                                  </Text>
                                </View>
                                <Ionicons name="checkmark-circle" size={24} color="#7C3AED" />
                              </View>
                            </View>
                          </View>
                        </View>
                      );
                    } else {
                      const section = miniSections.find(s => s._id === selectedMiniSection);
                      return section ? (
                        <View style={styles.selectedWorkAreaWrapper}>
                          <View style={styles.selectedMiniSectionContainer}>
                            <View style={styles.selectedMiniSectionCard}>
                              <View style={styles.selectedMiniSectionContent}>
                                <View style={styles.selectedMiniSectionIconBadge}>
                                  <Ionicons name="layers" size={20} color="#3B82F6" />
                                </View>
                                <View style={styles.selectedMiniSectionInfo}>
                                  <Text style={styles.selectedMiniSectionTitle}>{section.name}</Text>
                                  <Text style={styles.selectedMiniSectionSubtitle}>Specific work area</Text>
                                </View>
                                <Ionicons name="checkmark-circle" size={22} color="#3B82F6" />
                              </View>
                            </View>
                          </View>
                        </View>
                      ) : null;
                    }
                  })()}
                </View>
              </View>
            )}

            {/* Step 4: Labor Details */}
            {selectedType && selectedMiniSection && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Enter Labor Details</Text>
                
                {/* Labor Details Card */}
                <View style={styles.laborDetailsCard}>
                  <View style={styles.laborDetailsHeader}>
                    <Text style={styles.laborDetailsTitle}>Labor Information</Text>
                    <Text style={styles.laborDetailsSubtitle}>
                      Specify the number of laborers and cost details
                    </Text>
                  </View>

                  <View style={styles.laborDetailsSection}>
                    <View style={styles.laborDetailsInputCard}>
                      <View style={styles.laborDetailsCardHeader}>
                        <View style={styles.laborSummaryContainer}>
                          <View style={styles.laborSummaryHeader}>
                            <View style={[styles.laborDetailsIconBadge, { backgroundColor: selectedCategoryData?.color + '20' }]}>
                              <Ionicons name={selectedCategoryData?.icon || 'person-outline'} size={24} color={selectedCategoryData?.color || '#6B7280'} />
                            </View>
                            <View style={styles.laborDetailsCardInfo}>
                              <Text style={styles.laborDetailsCardName}>{selectedType}</Text>
                              <Text style={styles.laborDetailsCardCategory}>
                                {selectedCategoryData?.name}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.laborInputSection}>
                        <Text style={styles.laborInputLabel}>Number of laborers:</Text>
                        <View style={styles.laborInputWrapper}>
                          <TextInput
                            style={styles.laborInputLarge}
                            value={count}
                            onChangeText={setCount}
                            placeholder="Enter number of laborers"
                            keyboardType="numeric"
                            returnKeyType="next"
                            placeholderTextColor="#94A3B8"
                          />
                          <Text style={styles.laborUnitLarge}>laborers</Text>
                        </View>
                        
                        {count && parseInt(count) <= 0 && (
                          <View style={styles.laborError}>
                            <Ionicons name="warning" size={16} color="#EF4444" />
                            <Text style={styles.laborErrorText}>
                              Please enter a valid number of laborers
                            </Text>
                          </View>
                        )}
                        
                        {!count && (
                          <View style={styles.laborHint}>
                            <Ionicons name="information-circle-outline" size={16} color="#3B82F6" />
                            <Text style={styles.laborHintText}>
                              Enter the number of laborers needed
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.laborInputSection}>
                        <Text style={styles.laborInputLabel}>Cost per laborer:</Text>
                        <View style={styles.laborInputWrapper}>
                          <Text style={styles.laborCurrencySymbol}>₹</Text>
                          <TextInput
                            style={styles.laborInputLarge}
                            value={perLaborCost}
                            onChangeText={setPerLaborCost}
                            placeholder="Enter cost per laborer"
                            keyboardType="numeric"
                            returnKeyType="done"
                            placeholderTextColor="#94A3B8"
                          />
                        </View>
                        
                        {perLaborCost && parseFloat(perLaborCost) <= 0 && (
                          <View style={styles.laborError}>
                            <Ionicons name="warning" size={16} color="#EF4444" />
                            <Text style={styles.laborErrorText}>
                              Please enter a valid cost per laborer
                            </Text>
                          </View>
                        )}
                        
                        {!perLaborCost && (
                          <View style={styles.laborHint}>
                            <Ionicons name="information-circle-outline" size={16} color="#3B82F6" />
                            <Text style={styles.laborHintText}>
                              Enter the cost for each laborer
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

            {/* Cancel Add Form Button - Only show when there are existing entries */}
            {laborEntries.length > 0 && showAddForm && (
              <View style={styles.cancelAddFormContainer}>
                <TouchableOpacity 
                  style={styles.cancelAddFormButton}
                  onPress={() => {
                    // If editing, restore the entry back to the list
                    if (editingEntry) {
                      setLaborEntries(prev => {
                        const newEntries = [...prev, editingEntry];
                        laborEntriesRef.current = newEntries;
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
          {(laborEntries.length === 0 || showAddForm) && selectedType && selectedMiniSection && (
            <View style={[styles.modalActions, { paddingBottom: safeBottomPadding + 8 }]}>
              <TouchableOpacity style={styles.submitButton} onPress={handleAddLabor}>
                <View style={styles.submitButtonContainer}>
                  <Ionicons name={editingEntry ? "checkmark" : "add"} size={20} color="#10B981" />
                  <Text style={styles.submitButtonText}>
                    {editingEntry ? "Update Labor" : "Add Labor"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Grand Total - Show above submit button when there are entries and form is not shown */}
          {laborEntries.length > 0 && !showAddForm && (
            <View style={styles.grandTotalContainer}>
              <View style={styles.grandTotalContent}>
                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                <View style={styles.grandTotalDivider} />
                <Text style={styles.grandTotalValue}>
                  ₹{laborEntries.reduce((sum, entry) => sum + entry.totalCost, 0).toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          {/* Swipe to Submit - Show when there are entries and form is not shown */}
          {laborEntries.length > 0 && !showAddForm && (
            <View style={[styles.swipeFooter, { paddingBottom: safeBottomPadding + 8 }]}>
              <View style={styles.swipeToSubmitContainer}>
                <View style={styles.swipeTrack} {...panResponder.panHandlers}>
                  {/* Animated fill behind the button */}
                  <Animated.View
                    style={[
                      styles.swipeFill,
                      {
                        width: swipeAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                          extrapolate: 'clamp',
                        }),
                        backgroundColor: swipeAnimation.interpolate({
                          inputRange: [0, 0.5, 0.7, 1],
                          outputRange: ['rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.25)', 'rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0.4)'],
                          extrapolate: 'clamp',
                        }),
                      }
                    ]}
                  />

                  {/* Shimmer arrow hints */}
                  <Animated.View
                    style={[
                      styles.shimmerContainer,
                      {
                        opacity: swipeAnimation.interpolate({
                          inputRange: [0, 0.15],
                          outputRange: [1, 0],
                          extrapolate: 'clamp',
                        }),
                      }
                    ]}
                  >
                    {[0, 1, 2].map((i) => (
                      <Animated.View
                        key={i}
                        style={{
                          opacity: shimmerAnim.interpolate({
                            inputRange: [0, 0.33 * i, 0.33 * i + 0.15, 0.33 * i + 0.33, 1],
                            outputRange: [0.15, 0.15, 0.5, 0.15, 0.15],
                            extrapolate: 'clamp',
                          }),
                        }}
                      >
                        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.5)" />
                      </Animated.View>
                    ))}
                  </Animated.View>

                  {/* Swipe button with pulsing chevrons */}
                  <Animated.View 
                    style={[
                      styles.swipeButton,
                      {
                        transform: [{
                          translateX: swipeAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, maxSwipeDistance],
                            extrapolate: 'clamp',
                          })
                        }],
                        backgroundColor: swipeAnimation.interpolate({
                          inputRange: [0, 0.65, 0.7, 1],
                          outputRange: ['#3B82F6', '#3B82F6', '#10B981', '#10B981'],
                          extrapolate: 'clamp',
                        }),
                      }
                    ]}
                  >
                    <Animated.View
                      style={{
                        transform: [{
                          translateX: pulseAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-2, 4],
                          }),
                        }],
                      }}
                    >
                      <Animated.View
                        style={{
                          opacity: swipeAnimation.interpolate({
                            inputRange: [0, 0.7, 1],
                            outputRange: [1, 1, 0],
                            extrapolate: 'clamp',
                          }),
                        }}
                      >
                        <View style={styles.doubleChevron}>
                          <Ionicons name="chevron-forward" size={22} color="#FFFFFF" style={styles.chevronFirst} />
                          <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.6)" style={styles.chevronSecond} />
                        </View>
                      </Animated.View>
                      <Animated.View
                        style={[
                          styles.checkmarkOverlay,
                          {
                            opacity: swipeAnimation.interpolate({
                              inputRange: [0, 0.65, 0.7, 1],
                              outputRange: [0, 0, 1, 1],
                              extrapolate: 'clamp',
                            }),
                          }
                        ]}
                      >
                        <Ionicons name="checkmark" size={28} color="#FFFFFF" />
                      </Animated.View>
                    </Animated.View>
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
                          }),
                        }
                      ]}
                    >
                      Swipe to Submit All ({laborEntries.length})
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
  backButton: {
    marginRight: 12,
    padding: 4,
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
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  firstSectionContainer: {
    marginTop: 16,
  },
  addLaborButtonContainer: {
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  addLaborButton: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: '#BBF7D0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLaborButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addLaborButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  // Editing Banner Styles
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
  grandTotalContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
  },
  grandTotalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  grandTotalLabel: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '600',
    fontFamily: 'System',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
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
    fontWeight: '800',
    fontFamily: 'System',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 0,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    lineHeight: 18,
  },
  categoriesContainer: {
    gap: 12,
    minHeight: 100,
  },
  selectedCategoryWrapper: {
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
  selectedCategoryContainer: {
    gap: 12,
  },
  categoryCardContainer: {
    overflow: 'hidden',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    minHeight: 80,
  },
  categoryCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 2,
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
  categoryNameSelected: {
    color: '#1E40AF',
  },
  categoryCountSelected: {
    color: '#3B82F6',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 18,
  },
  categoryCount: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 16,
  },
  typesContainer: {
    paddingVertical: 16,
  },
  laborTypesContainer: {
    gap: 20,
  },
  // Multitask Labor Card Styles
  multitaskLaborCard: {
    backgroundColor: '#FAFAF9',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E7E5E4',
    borderStyle: 'dashed',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  multitaskLaborContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  multitaskLaborIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  multitaskLaborIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  multitaskLaborIconOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  multitaskLaborInfo: {
    flex: 1,
  },
  multitaskLaborTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
    lineHeight: 20,
  },
  multitaskLaborSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 16,
  },
  multitaskLaborBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  multitaskLaborBadgeText: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '600',
  },
  multitaskLaborArrow: {
    marginLeft: 12,
  },
  // Basic Types Group Styles
  basicTypesGroup: {
    gap: 12,
    marginBottom: 16,
  },
  basicTypesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  basicTypesHeaderText: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  basicTypeCard: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  basicTypeIconBadge: {
    backgroundColor: '#DBEAFE',
  },
  basicTypeInfo: {
    flex: 1,
  },
  basicTypeSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  // Quick Labor Selection Styles
  quickLaborHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  quickLaborTitle: {
    fontSize: 18,
    color: '#1E293B',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  quickLaborOptions: {
    gap: 16,
  },
  quickLaborCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  quickLaborCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickLaborIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickLaborInfo: {
    flex: 1,
  },
  quickLaborName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  quickLaborSubtext: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  selectedQuickLaborWrapper: {
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
  },
  selectedQuickLaborCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  selectedQuickLaborContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  selectedQuickLaborName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  selectedQuickLaborActions: {
    marginLeft: 12,
  },
  // Show Advanced Options Button Styles
  showAdvancedButton: {
    backgroundColor: '#FAFAF9',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E7E5E4',
    borderStyle: 'dashed',
    marginTop: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  showAdvancedButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  showAdvancedButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7C3AED',
    letterSpacing: 0.2,
  },
  // Hide Advanced Options Button Styles
  hideAdvancedButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 12,
    alignItems: 'center',
  },
  hideAdvancedButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  hideAdvancedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.2,
  },
  // Specific Types Group Styles
  specificTypesGroup: {
    gap: 12,
  },
  specificTypesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  specificTypesHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  specificTypesHeaderText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Selected Multitask Labor Styles
  selectedMultitaskLaborCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  selectedMultitaskLaborContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  selectedMultitaskLaborIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  selectedMultitaskLaborIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedMultitaskLaborIconOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedMultitaskLaborInfo: {
    flex: 1,
  },
  selectedMultitaskLaborTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7C3AED',
    marginBottom: 2,
    lineHeight: 18,
  },
  selectedMultitaskLaborSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 15,
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
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    minHeight: 60,
  },
  typeCardLast: {
    borderBottomWidth: 0,
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
  },
  typeIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    lineHeight: 17,
  },
  typeCardNameSelected: {
    color: '#1E40AF',
  },
  // Selected Type Wrapper Styles
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
  selectedCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  selectedCategoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  typeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  typeName: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  formContainer: {
    paddingVertical: 16,
  },
  selectionSummary: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    width: 80,
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  totalCostContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
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
  noMiniSectionsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noMiniSectionsText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  // Labor Entry Card Styles
  // Mini-Section Container
  miniSectionFieldContainer: {
    gap: 8,
  },
  labelWithHelper: {
    marginBottom: 8,
  },
  miniSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    lineHeight: 17,
  },
  labelHelper: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '400',
    lineHeight: 15,
  },
  required: {
    color: '#EF4444',
  },
  workAreaContainer: {
    gap: 20,
  },
  // No Mini-Section Card Styles
  noMiniSectionCard: {
    backgroundColor: '#FAFAF9',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E7E5E4',
    borderStyle: 'dashed',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  noMiniSectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noMiniSectionIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  noMiniSectionIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMiniSectionIconOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMiniSectionInfo: {
    flex: 1,
  },
  noMiniSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
    lineHeight: 20,
  },
  noMiniSectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 16,
  },
  noMiniSectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  noMiniSectionBadgeText: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '600',
  },
  noMiniSectionArrow: {
    marginLeft: 12,
  },
  // Mini-Sections Group Styles
  miniSectionsGroup: {
    gap: 12,
  },
  miniSectionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  miniSectionsHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  miniSectionsHeaderText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  miniSectionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  miniSectionCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  miniSectionCardLast: {
    borderBottomWidth: 0,
  },
  miniSectionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  miniSectionIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  miniSectionInfo: {
    flex: 1,
  },
  miniSectionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
    lineHeight: 18,
  },
  miniSectionDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 15,
  },
  miniSectionArrow: {
    marginLeft: 8,
  },
  // No Sections Info Styles
  noSectionsInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  noSectionsIconContainer: {
    marginTop: 2,
  },
  noSectionsInfoText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
    lineHeight: 18,
  },
  // Selected Work Area Wrapper
  selectedWorkAreaWrapper: {
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
  // Selected No Mini-Section Styles
  selectedNoMiniSectionContainer: {
    gap: 12,
  },
  selectedNoMiniSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  selectedNoMiniSectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  selectedNoMiniSectionIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  selectedNoMiniSectionIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedNoMiniSectionIconOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedNoMiniSectionInfo: {
    flex: 1,
  },
  selectedNoMiniSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7C3AED',
    marginBottom: 2,
    lineHeight: 18,
  },
  selectedNoMiniSectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 15,
  },
  // Selected Mini-Section Styles
  selectedMiniSectionContainer: {
    gap: 12,
  },
  selectedMiniSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  selectedMiniSectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  selectedMiniSectionIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedMiniSectionInfo: {
    flex: 1,
  },
  selectedMiniSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 2,
    lineHeight: 18,
  },
  selectedMiniSectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 15,
  },
  sectionList: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionItemSelected: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  sectionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 17,
  },
  noSectionsWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
  },

  // Total Cost Card
  totalCostCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  totalCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalCostLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E40AF',
  },
  totalCostValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E40AF',
  },
  // Labor Details Card Styles (matching MaterialUsageForm quantity section)
  laborDetailsCard: {
    gap: 16,
  },
  laborDetailsHeader: {
    marginBottom: 8,
  },
  laborDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    lineHeight: 17,
  },
  laborDetailsSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '400',
    lineHeight: 15,
  },
  laborDetailsSection: {
    gap: 16,
  },
  laborDetailsInputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  laborDetailsCardHeader: {
    marginBottom: 16,
  },
  laborSummaryContainer: {
    gap: 12,
  },
  laborSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  laborDetailsIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  laborStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 4,
  },
  laborStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  laborQuickSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  laborSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  laborSummaryLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  laborSummaryValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  laborSummaryValueTotal: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '700',
  },
  laborSummaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  laborDetailsCardInfo: {
    flex: 1,
  },
  laborDetailsCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
    lineHeight: 18,
  },
  laborDetailsCardCategory: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 15,
  },
  laborInputSection: {
    gap: 8,
    marginBottom: 16,
  },
  laborInputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  laborInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    minHeight: 48,
  },
  laborInputLarge: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
    paddingHorizontal: 0,
  },
  laborUnitLarge: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginLeft: 8,
    flexShrink: 0,
  },
  laborCurrencySymbol: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
    marginRight: 8,
    flexShrink: 0,
  },
  laborError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  laborErrorText: {
    fontSize: 12,
    color: '#EF4444',
    flex: 1,
  },
  laborHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  laborHintText: {
    fontSize: 12,
    color: '#3B82F6',
    flex: 1,
  },
  // Compact Labor Entries Summary Styles
  compactLaborEntriesList: {
    gap: 12,
  },
  compactLaborEntryCard: {
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
  compactLaborEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    position: 'relative',
  },
  compactLaborEntryLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    paddingRight: 80, // Space for action buttons
  },
  compactLaborIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  compactLaborInfo: {
    flex: 1,
    minWidth: 0, // Allow text to shrink
  },
  compactLaborType: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 3,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  compactLaborCategory: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    lineHeight: 13,
  },
  compactAreaInfo: {
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
  compactAreaText: {
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
  compactLaborMetrics: {
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
  // Legacy Labor Entries Summary Styles
  laborEntriesList: {
    gap: 12,
  },
  laborEntryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  laborEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  laborEntryInfo: {
    flex: 1,
  },
  laborEntryType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  laborEntryCategory: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  laborEntrySection: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  removeEntryButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  laborEntryDetails: {
    gap: 8,
  },
  laborEntryDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  laborEntryDetailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  laborEntryDetailValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  laborEntryTotalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 4,
  },
  laborEntryTotalLabel: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
  },
  laborEntryTotalValue: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '700',
  },
  grandTotalCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 12,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  finalSubmitButton: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E40AF',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  finalSubmitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
  },
  // Swipe to Submit Styles
  swipeFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  swipeToSubmitContainer: {
    width: '100%',
  },
  swipeTrack: {
    backgroundColor: '#1E293B',
    borderRadius: 32,
    height: 64,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'flex-start',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  swipeFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 32,
  },
  shimmerContainer: {
    position: 'absolute',
    left: 68,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    zIndex: 1,
  },
  swipeButton: {
    position: 'absolute',
    left: 5,
    top: 5,
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  doubleChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronFirst: {
    marginRight: -8,
  },
  chevronSecond: {
    marginLeft: -8,
  },
  checkmarkOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeTextContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  swipeText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});

export default LaborFormModal;