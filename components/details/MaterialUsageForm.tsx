import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Modal,
    PanResponder,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import axios from 'axios';
import { getClientId } from '@/functions/clientId';
import { domain } from '@/lib/domain';

interface Material {
    _id?: string;
    id: number;
    name: string;
    unit: string;
    specs?: Record<string, any>;
    quantity: number;
    price: number;
    date: string;
    icon: any;
    color: string;
    sectionId?: string;
}

interface MaterialUsage {
    materialId: string;
    quantity: number;
}

interface MaterialUsageFormProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (miniSectionId: string, materialUsages: MaterialUsage[]) => void;
    availableMaterials: Material[]; // This will be used as fallback only
    miniSections: { _id: string; name: string }[];
    projectId: string; // Add projectId to fetch all materials
    sectionId: string; // Add sectionId for filtering
    miniSectionCompletions?: { [key: string]: boolean }; // Add completion status tracking
}

const MaterialUsageForm: React.FC<MaterialUsageFormProps> = ({
    visible,
    onClose,
    onSubmit,
    availableMaterials,
    miniSections,
    projectId,
    sectionId,
    miniSectionCompletions = {} // Default to empty object if not provided
}) => {
    const [selectedMiniSectionId, setSelectedMiniSectionId] = useState<string>('');
    const [selectedMaterials, setSelectedMaterials] = useState<{ [materialId: string]: string }>({});
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [currentStep, setCurrentStep] = useState<'selection' | 'quantity'>('selection');
    
    // State for fetching all materials
    const [allAvailableMaterials, setAllAvailableMaterials] = useState<Material[]>([]);
    const [isLoadingMaterials, setIsLoadingMaterials] = useState<boolean>(false);
    const [materialsError, setMaterialsError] = useState<string>('');
    
    // Refs for tracking current state in swipe handlers
    const selectedMaterialsRef = useRef<{ [materialId: string]: string }>({});
    const selectedMiniSectionIdRef = useRef<string>('');
    
    // Refs for quantity inputs to enable keyboard navigation
    const quantityInputRefs = useRef<{ [materialId: string]: TextInput | null }>({});

    // Animation values for swipe to submit
    const swipeAnimation = useRef(new Animated.Value(0)).current;
    const [isSwipeComplete, setIsSwipeComplete] = useState(false);

    // Loading animation states
    const [isSubmittingUsage, setIsSubmittingUsage] = useState(false);
    const loadingAnimation = useRef(new Animated.Value(0)).current;

    // Function to fetch ALL available materials (with proper pagination)
    const fetchAllAvailableMaterials = async () => {
        if (!projectId) {
            console.error('❌ No projectId provided to fetch materials');
            return;
        }

        setIsLoadingMaterials(true);
        setMaterialsError('');

        try {
            console.log('\n========================================');
            console.log('🔄 FETCHING ALL MATERIALS FOR USAGE FORM');
            console.log('========================================');
            console.log('Project ID:', projectId);
            console.log('Section ID:', sectionId);

            const clientId = await getClientId();
            if (!clientId) {
                throw new Error('Client ID not found');
            }

            let allMaterials: any[] = [];
            let currentPage = 1;
            const maxLimit = 100; // API maximum limit
            let hasMorePages = true;

            // Fetch all pages of materials
            while (hasMorePages) {
                const params = new URLSearchParams({
                    projectId: projectId,
                    clientId: clientId,
                    page: currentPage.toString(),
                    limit: maxLimit.toString(),
                    sortBy: 'name',
                    sortOrder: 'asc'
                });

                const apiUrl = `${domain}/api/material?${params.toString()}`;
                console.log(`🌐 Fetching page ${currentPage}: ${apiUrl}`);

                const response = await axios.get(apiUrl, {
                    timeout: 15000, // 15 second timeout
                });

                console.log(`📦 Page ${currentPage} Response:`, response.status);
                const data = response.data as any;

                if (data.success && data.MaterialAvailable) {
                    allMaterials = allMaterials.concat(data.MaterialAvailable);
                    
                    console.log(`✅ Page ${currentPage}:`, data.MaterialAvailable.length, 'materials');
                    console.log('  - Pagination info:', data.pagination);
                    
                    // Check if there are more pages
                    if (data.pagination && data.pagination.hasNextPage) {
                        currentPage++;
                        hasMorePages = true;
                    } else {
                        hasMorePages = false;
                    }
                } else {
                    console.warn(`⚠️ Page ${currentPage} returned no materials or unsuccessful response`);
                    hasMorePages = false;
                }

                // Safety check to prevent infinite loops
                if (currentPage > 50) {
                    console.warn('⚠️ Reached maximum page limit (50), stopping fetch');
                    break;
                }
            }

            console.log(`🎉 Fetched ${allMaterials.length} materials across ${currentPage} pages`);

            if (allMaterials.length > 0) {
                // Transform materials to match the expected format
                const transformedMaterials = allMaterials.map((material: any) => {
                    const { icon, color } = getMaterialIconAndColor(material.name);
                    return {
                        _id: material._id,
                        id: material.id || Math.random(),
                        name: material.name,
                        unit: material.unit,
                        specs: material.specs || {},
                        quantity: material.qnt || 0,
                        price: material.perUnitCost || 0,
                        date: material.createdAt || new Date().toISOString(),
                        icon: icon,
                        color: color,
                        sectionId: material.sectionId,
                    };
                });

                // Filter materials for current section (same logic as parent component)
                const filteredMaterials = transformedMaterials.filter((m: Material) => {
                    const isAvailable = !m.sectionId || m.sectionId === sectionId;
                    if (!isAvailable) {
                        console.log(`🚫 Filtering out material: ${m.name} (sectionId: ${m.sectionId}, current: ${sectionId})`);
                    }
                    return isAvailable;
                });

                console.log('✅ Materials processed successfully:');
                console.log('  - Total fetched:', transformedMaterials.length);
                console.log('  - After section filtering:', filteredMaterials.length);

                setAllAvailableMaterials(filteredMaterials);
                setMaterialsError('');
            } else {
                console.warn('⚠️ No materials found across all pages');
                setAllAvailableMaterials([]);
                setMaterialsError('No materials found');
            }

        } catch (error) {
            console.error('❌ Error fetching all materials:', error);
            let errorMessage = 'Failed to fetch materials';
            
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as any;
                if (axiosError.response?.status === 400) {
                    errorMessage = 'Invalid request parameters';
                } else if (axiosError.response?.status === 404) {
                    errorMessage = 'Project not found';
                } else if (axiosError.response?.status === 500) {
                    errorMessage = 'Server error';
                } else {
                    errorMessage = `API Error: ${axiosError.response?.status || 'Unknown'}`;
                }
                console.error('API Error Details:', axiosError.response?.data);
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            
            setMaterialsError(errorMessage);
            
            // Fallback to provided materials if fetch fails
            console.log('🔄 Using fallback materials from props:', availableMaterials.length);
            setAllAvailableMaterials(availableMaterials);
        } finally {
            setIsLoadingMaterials(false);
            console.log('========================================\n');
        }
    };

    // Function to get material icon and color based on material name
    const getMaterialIconAndColor = (materialName: string) => {
        const materialMap: { [key: string]: { icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap, color: string } } = {
            'cement': { icon: 'cube-outline', color: '#8B5CF6' },
            'brick': { icon: 'square-outline', color: '#EF4444' },
            'steel': { icon: 'barbell-outline', color: '#6B7280' },
            'sand': { icon: 'layers-outline', color: '#F59E0B' },
            'gravel': { icon: 'diamond-outline', color: '#10B981' },
            'concrete': { icon: 'cube', color: '#3B82F6' },
            'wood': { icon: 'leaf-outline', color: '#84CC16' },
            'paint': { icon: 'color-palette-outline', color: '#EC4899' },
            'tile': { icon: 'grid-outline', color: '#06B6D4' },
            'pipe': { icon: 'ellipse-outline', color: '#8B5CF6' },
        };

        const lowerName = materialName.toLowerCase();
        for (const [key, value] of Object.entries(materialMap)) {
            if (lowerName.includes(key)) {
                return value;
            }
        }
        return { icon: 'cube-outline' as keyof typeof import('@expo/vector-icons').Ionicons.glyphMap, color: '#6B7280' };
    };

    // Loading animation functions
    const startLoadingAnimation = () => {
        setIsSubmittingUsage(true);
        Animated.loop(
            Animated.timing(loadingAnimation, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            })
        ).start();
    };

    const stopLoadingAnimation = () => {
        setIsSubmittingUsage(false);
        loadingAnimation.stopAnimation();
        loadingAnimation.setValue(0);
    };

    // Filter out completed mini-sections from the selection
    const availableMiniSections = miniSections.filter(section => {
        const isCompleted = miniSectionCompletions[section._id] || false;
        if (isCompleted) {
            console.log(`🚫 Filtering out completed mini-section: ${section.name} (${section._id})`);
        }
        return !isCompleted; // Only show incomplete mini-sections
    });

    // Log when form opens and fetch all materials
    useEffect(() => {
        if (visible) {
            console.log('\n========================================');
            console.log('📝 MATERIAL USAGE FORM OPENED');
            console.log('========================================');
            console.log('Available Materials Count (from props):', availableMaterials.length);
            console.log('Total Mini Sections Count:', miniSections.length);
            console.log('Available (Incomplete) Mini Sections Count:', availableMiniSections.length);
            console.log('Project ID:', projectId);
            console.log('Section ID:', sectionId);
            console.log('\n--- All Mini Sections ---');
            miniSections.forEach((s, idx) => {
                const isCompleted = miniSectionCompletions[s._id] || false;
                console.log(`  ${idx + 1}. ${s.name} (_id: ${s._id}) - ${isCompleted ? '✅ COMPLETED (HIDDEN)' : '⏳ INCOMPLETE (AVAILABLE)'}`);
            });
            console.log('\n--- Available Mini Sections (for selection) ---');
            availableMiniSections.forEach((s, idx) => {
                console.log(`  ${idx + 1}. ${s.name} (_id: ${s._id})`);
            });
            console.log('========================================\n');

            // Fetch all available materials when form opens
            fetchAllAvailableMaterials();
        } else {
            // Reset state when form closes
            setAllAvailableMaterials([]);
            setIsLoadingMaterials(false);
            setMaterialsError('');
        }
    }, [visible, projectId, sectionId, miniSections.length, availableMiniSections.length]);

    const handleSubmit = async () => {
        // Use refs for current values to avoid stale state
        const currentSelectedMiniSectionId = selectedMiniSectionIdRef.current;
        const currentSelectedMaterials = selectedMaterialsRef.current;
        
        console.log('🚀 handleSubmit called with refs:');
        console.log('  - currentSelectedMiniSectionId:', currentSelectedMiniSectionId);
        console.log('  - currentSelectedMaterials keys:', Object.keys(currentSelectedMaterials));
        
        if (!currentSelectedMiniSectionId) {
            alert('Please select a mini-section');
            return;
        }

        const materialUsages: MaterialUsage[] = [];
        let hasErrors = false;

        // Validate all selected materials using ref
        Object.entries(currentSelectedMaterials).forEach(([materialId, quantity]) => {
            const material = allAvailableMaterials.find(m => m._id === materialId);
            const quantityNum = parseFloat(quantity);

            if (!quantity || quantity.trim() === '' || quantityNum <= 0) {
                alert(`Please enter a valid quantity for ${material?.name || 'selected material'}`);
                hasErrors = true;
                return;
            }

            if (material && quantityNum > material.quantity) {
                alert(`Quantity exceeds available amount for ${material.name}!\n\nYou entered: ${quantityNum} ${material.unit}\nAvailable: ${material.quantity} ${material.unit}`);
                hasErrors = true;
                return;
            }

            materialUsages.push({
                materialId,
                quantity: quantityNum
            });
        });

        if (hasErrors) return;

        if (materialUsages.length === 0) {
            alert('Please select at least one material and enter quantities');
            return;
        }

        console.log('\n========================================');
        console.log('📋 MATERIAL USAGE FORM - BATCH SUBMISSION');
        console.log('========================================');
        console.log('Form Values:');
        console.log('  - Selected Mini-Section ID:', currentSelectedMiniSectionId, '(type:', typeof currentSelectedMiniSectionId, ')');
        console.log('  - Number of materials:', materialUsages.length);
        console.log('\n--- Material Usages ---');
        materialUsages.forEach((usage, index) => {
            const material = allAvailableMaterials.find(m => m._id === usage.materialId);
            console.log(`  ${index + 1}. ${material?.name || 'Unknown'}:`);
            console.log(`     Material ID: ${usage.materialId}`);
            console.log(`     Quantity: ${usage.quantity} ${material?.unit || ''}`);
            console.log(`     Available: ${material?.quantity || 0} ${material?.unit || ''}`);
        });
        console.log('========================================');
        console.log('🚀 Calling onSubmit with:', {
            miniSectionId: currentSelectedMiniSectionId,
            materialUsages: materialUsages
        });
        console.log('========================================\n');

        // Start loading animation
        startLoadingAnimation();

        try {
            await onSubmit(currentSelectedMiniSectionId, materialUsages);
            handleClose();
        } catch (error) {
            console.error('Error submitting material usage:', error);
            // Handle error if needed
        } finally {
            stopLoadingAnimation();
        }
    };

    const handleClose = () => {
        setSelectedMiniSectionId('');
        setSelectedMaterials({});
        setSearchQuery('');
        setCurrentStep('selection');
        // Clear input refs
        quantityInputRefs.current = {};
        // Reset swipe animation
        swipeAnimation.setValue(0);
        setIsSwipeComplete(false);
        // Reset state refs
        selectedMaterialsRef.current = {};
        selectedMiniSectionIdRef.current = '';
        onClose();
    };

    // Swipe gesture handlers
    const handleSwipeStart = () => {
        // Reset swipe state
        setIsSwipeComplete(false);
    };

    const handleSwipeMove = (gestureState: any) => {
        const { dx } = gestureState;
        const maxSwipe = 200; // Maximum swipe distance to match LaborFormModal
        const progress = Math.max(0, Math.min(dx / maxSwipe, 1));
        
        swipeAnimation.setValue(progress);
        
        // Check if swipe is complete (70% of the way)
        if (progress >= 0.7 && !isSwipeComplete) {
            setIsSwipeComplete(true);
        }
    };

    const handleSwipeEnd = async (gestureState: any) => {
        const { dx } = gestureState;
        const maxSwipe = 200; // Maximum swipe distance to match LaborFormModal
        const progress = dx / maxSwipe;
        
        // Use refs for current values to avoid stale state
        const currentSelectedMaterials = selectedMaterialsRef.current;
        const currentSelectedMiniSectionId = selectedMiniSectionIdRef.current;
        
        console.log('Swipe ended, progress:', progress);
        console.log('currentSelectedMaterials keys:', Object.keys(currentSelectedMaterials));
        console.log('currentSelectedMiniSectionId:', currentSelectedMiniSectionId);
        
        if (progress >= 0.7) {
            // Complete the swipe and submit
            Animated.timing(swipeAnimation, {
                toValue: 1,
                duration: 200,
                useNativeDriver: false,
            }).start(async () => {
                console.log('Animation completed, calling handleSubmit');
                await handleSubmit();
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

    // Filter materials based on search query
    const filteredMaterials = allAvailableMaterials.filter(material => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return material.name.toLowerCase().includes(query) ||
            material.unit.toLowerCase().includes(query);
    });

    // Function to get differing specifications for materials with same name
    const getDifferingSpecs = (material: Material) => {
        // Find all materials with the same name and unit
        const sameMaterials = filteredMaterials.filter(m => 
            m.name === material.name && m.unit === material.unit
        );
        
        // If only one material with this name, no need to show specs
        if (sameMaterials.length <= 1) {
            return null;
        }
        
        // Get all unique spec keys across all materials with same name
        const allSpecKeys = new Set<string>();
        sameMaterials.forEach(m => {
            if (m.specs) {
                Object.keys(m.specs).forEach(key => allSpecKeys.add(key));
            }
        });
        
        // Find specs that differ between materials
        const differingSpecs: Record<string, any> = {};
        
        Array.from(allSpecKeys).forEach(specKey => {
            const values = sameMaterials.map(m => m.specs?.[specKey]).filter(v => v !== undefined);
            const uniqueValues = [...new Set(values)];
            
            // If there are different values for this spec key, it's a differing spec
            if (uniqueValues.length > 1) {
                differingSpecs[specKey] = material.specs?.[specKey];
            }
        });
        
        return Object.keys(differingSpecs).length > 0 ? differingSpecs : null;
    };

    // Function to format differing specs for display
    const formatDifferingSpecs = (specs: Record<string, any> | null) => {
        if (!specs || Object.keys(specs).length === 0) return '';
        
        return Object.entries(specs)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
    };

    // Helper functions for material selection
    const toggleMaterialSelection = (materialId: string) => {
        console.log(`🔄 Toggle called for material: ${materialId}`);
        console.log(`Current selectedMaterials:`, Object.keys(selectedMaterials));
        
        setSelectedMaterials(prev => {
            const newSelection = { ...prev };
            const isCurrentlySelected = materialId in newSelection;
            
            console.log(`Material ${materialId} is currently selected: ${isCurrentlySelected}`);
            
            if (isCurrentlySelected) {
                // Material is currently selected, deselect it
                delete newSelection[materialId];
                console.log(`🔄 Material deselected: ${materialId}`);
                console.log(`New selection after deselect:`, Object.keys(newSelection));
            } else {
                // Material is not selected, select it with empty quantity
                newSelection[materialId] = '';
                console.log(`✅ Material selected: ${materialId}`);
                console.log(`New selection after select:`, Object.keys(newSelection));
            }
            
            // Update ref to keep it in sync
            selectedMaterialsRef.current = newSelection;
            
            return newSelection;
        });
    };

    const updateMaterialQuantity = (materialId: string, quantity: string) => {
        setSelectedMaterials(prev => {
            const newSelection = {
                ...prev,
                [materialId]: quantity
            };
            // Update ref to keep it in sync
            selectedMaterialsRef.current = newSelection;
            return newSelection;
        });
    };

    const isMaterialSelected = (materialId: string) => {
        return materialId in selectedMaterials;
    };

    const getSelectedMaterialsCount = () => {
        return Object.keys(selectedMaterials).length;
    };

    const canProceedToQuantity = () => {
        return selectedMiniSectionId && getSelectedMaterialsCount() > 0;
    };

    const canSubmitForm = () => {
        if (!selectedMiniSectionId || getSelectedMaterialsCount() === 0) {
            return false;
        }
        
        // Check if all selected materials have valid quantities
        return Object.entries(selectedMaterials).every(([materialId, quantity]) => {
            const material = allAvailableMaterials.find(m => m._id === materialId);
            const quantityNum = parseFloat(quantity);
            return quantity && quantity.trim() !== '' && quantityNum > 0 && (!material || quantityNum <= material.quantity);
        });
    };

    const handleNextStep = () => {
        if (canProceedToQuantity()) {
            setCurrentStep('quantity');
            // Focus on first quantity input after a short delay
            setTimeout(() => {
                const firstMaterialId = Object.keys(selectedMaterials)[0];
                if (firstMaterialId && quantityInputRefs.current[firstMaterialId]) {
                    quantityInputRefs.current[firstMaterialId]?.focus();
                }
            }, 300);
        }
    };

    const handlePreviousStep = () => {
        setCurrentStep('selection');
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="arrow-forward-circle" size={24} color="#3B82F6" />
                            </View>
                            <View>
                                <Text style={styles.title}>Record Material Usage</Text>
                                <Text style={styles.subtitle}>
                                    {currentStep === 'selection' 
                                        ? 'Step 1: Select materials and location' 
                                        : 'Step 2: Enter quantities'
                                    }
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    {/* Step Indicator */}
                    <View style={styles.stepIndicator}>
                        <View style={styles.stepContainer}>
                            <View style={[
                                styles.stepCircle, 
                                currentStep === 'selection' ? styles.stepCircleActive : styles.stepCircleCompleted
                            ]}>
                                <Text style={[
                                    styles.stepNumber,
                                    currentStep === 'selection' ? styles.stepNumberActive : styles.stepNumberCompleted
                                ]}>1</Text>
                            </View>
                            <Text style={[
                                styles.stepLabel,
                                currentStep === 'selection' ? styles.stepLabelActive : styles.stepLabelCompleted
                            ]}>Select Materials</Text>
                        </View>
                        
                        <View style={[
                            styles.stepConnector,
                            currentStep === 'quantity' ? styles.stepConnectorActive : styles.stepConnectorInactive
                        ]} />
                        
                        <View style={styles.stepContainer}>
                            <View style={[
                                styles.stepCircle,
                                currentStep === 'quantity' ? styles.stepCircleActive : styles.stepCircleInactive
                            ]}>
                                <Text style={[
                                    styles.stepNumber,
                                    currentStep === 'quantity' ? styles.stepNumberActive : styles.stepNumberInactive
                                ]}>2</Text>
                            </View>
                            <Text style={[
                                styles.stepLabel,
                                currentStep === 'quantity' ? styles.stepLabelActive : styles.stepLabelInactive
                            ]}>Enter Quantities</Text>
                        </View>
                    </View>

                    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                        {currentStep === 'selection' ? (
                            // STEP 1: MATERIAL SELECTION
                            <>
                                {/* Mini-Section Selector */}
                                <View style={styles.fieldContainer}>
                                    <View style={styles.labelWithHelper}>
                                        <Text style={styles.label}>
                                            Where is this material being used? <Text style={styles.required}>*</Text>
                                        </Text>
                                        <Text style={styles.labelHelper}>
                                            Select the work area or mini-section
                                            {miniSections.length > availableMiniSections.length && 
                                                ` (${miniSections.length - availableMiniSections.length} completed section${miniSections.length - availableMiniSections.length > 1 ? 's' : ''} hidden)`
                                            }
                                        </Text>
                                    </View>
                                    {availableMiniSections.length > 0 ? (
                                        <View style={styles.sectionList}>
                                            {availableMiniSections.map((section) => {
                                                const isSelected = selectedMiniSectionId === section._id;
                                                return (
                                                    <TouchableOpacity
                                                        key={section._id}
                                                        style={[
                                                            styles.sectionItem,
                                                            isSelected && styles.sectionItemSelected
                                                        ]}
                                                        onPress={() => {
                                                            setSelectedMiniSectionId(section._id);
                                                            selectedMiniSectionIdRef.current = section._id;
                                                        }}
                                                    >
                                                        <View style={styles.sectionItemLeft}>
                                                            <View style={styles.sectionIconBadge}>
                                                                <Ionicons name="layers" size={18} color="#3B82F6" />
                                                            </View>
                                                            <Text style={styles.sectionItemName}>{section.name}</Text>
                                                        </View>
                                                        {isSelected && (
                                                            <Ionicons name="checkmark-circle" size={22} color="#3B82F6" />
                                                        )}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    ) : (
                                        <View style={styles.noSectionsWarning}>
                                            <Ionicons name="alert-circle" size={20} color="#F59E0B" />
                                            <Text style={styles.helperText}>
                                                {miniSections.length === 0 
                                                    ? 'No mini-sections available. Please create one first.'
                                                    : 'All mini-sections are completed. No materials can be added to completed sections.'
                                                }
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Material Selection */}
                                <View style={styles.fieldContainer}>
                                    <View style={styles.labelWithHelper}>
                                        <Text style={styles.label}>
                                            Which materials are you using? <Text style={styles.required}>*</Text>
                                        </Text>
                                        <Text style={styles.labelHelper}>
                                            Search and select materials
                                            {getSelectedMaterialsCount() > 0 && ` (${getSelectedMaterialsCount()} selected)`}
                                        </Text>
                                    </View>
                                    <View style={styles.searchContainer}>
                                        <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
                                        <TextInput
                                            style={styles.searchInput}
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                            placeholder="Search by name or unit..."
                                            placeholderTextColor="#94A3B8"
                                        />
                                        {searchQuery.length > 0 && (
                                            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                                                <Ionicons name="close-circle" size={20} color="#94A3B8" />
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {/* Material List - Selection Only */}
                                    <ScrollView
                                        style={styles.materialList}
                                        nestedScrollEnabled={true}
                                        showsVerticalScrollIndicator={true}
                                    >
                                        {isLoadingMaterials ? (
                                            <View style={styles.loadingState}>
                                                <Text style={styles.loadingText}>Loading all materials...</Text>
                                                <Text style={styles.loadingSubtext}>Fetching from all pages</Text>
                                            </View>
                                        ) : materialsError ? (
                                            <View style={styles.errorState}>
                                                <Text style={styles.loadingErrorText}>
                                                    {materialsError}
                                                </Text>
                                                <Text style={styles.errorSubtext}>
                                                    Using materials from current page only
                                                </Text>
                                            </View>
                                        ) : filteredMaterials.length > 0 ? (
                                            filteredMaterials.map((material) => {
                                                const isSelected = isMaterialSelected(material._id!);
                                                
                                                return (
                                                    <TouchableOpacity
                                                        key={material._id || material.id}
                                                        style={[
                                                            styles.materialItem,
                                                            isSelected && styles.materialItemSelected
                                                        ]}
                                                        onPress={() => {
                                                            if (!material._id) {
                                                                alert('Error: Material ID not found. Please refresh and try again.');
                                                                return;
                                                            }
                                                            console.log(`🔄 Toggling material selection for: ${material.name} (ID: ${material._id})`);
                                                            console.log(`Current selection state: ${isMaterialSelected(material._id) ? 'SELECTED' : 'NOT SELECTED'}`);
                                                            toggleMaterialSelection(material._id);
                                                        }}
                                                        activeOpacity={0.7}
                                                    >
                                                        <View style={styles.materialItemLeft}>
                                                            <View style={[styles.materialIconBadge, { backgroundColor: material.color + '20' }]}>
                                                                <Ionicons name={material.icon} size={20} color={material.color} />
                                                            </View>
                                                            <View style={styles.materialItemInfo}>
                                                                <View style={styles.materialNameRow}>
                                                                    <Text style={styles.materialItemName}>{material.name}</Text>
                                                                    {(() => {
                                                                        const differingSpecs = getDifferingSpecs(material);
                                                                        if (differingSpecs) {
                                                                            return (
                                                                                <View style={styles.specsBadgeInline}>
                                                                                    <Text style={styles.specsBadgeText}>
                                                                                        {formatDifferingSpecs(differingSpecs)}
                                                                                    </Text>
                                                                                </View>
                                                                            );
                                                                        }
                                                                        return null;
                                                                    })()}
                                                                </View>
                                                                <Text style={styles.materialItemQuantity}>
                                                                    {material.quantity} {material.unit} available
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        
                                                        {/* Selection Checkbox */}
                                                        <View style={styles.checkboxContainer}>
                                                            <Ionicons 
                                                                name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
                                                                size={28} 
                                                                color={isSelected ? "#10B981" : "#CBD5E1"} 
                                                            />
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })
                                        ) : (
                                            <View style={styles.emptyState}>
                                                <Ionicons name="search-outline" size={48} color="#CBD5E1" />
                                                <Text style={styles.emptyStateText}>
                                                    {searchQuery ? 'No materials match your search' : 'No materials available'}
                                                </Text>
                                            </View>
                                        )}
                                    </ScrollView>
                                </View>

                                {/* Selected Materials Preview */}
                                {getSelectedMaterialsCount() > 0 && (
                                    <View style={styles.selectionPreview}>
                                        <Text style={styles.previewTitle}>
                                            Selected Materials
                                        </Text>
                                        <Text style={styles.previewSubtitle}>
                                            Tap materials above to add or remove from selection
                                        </Text>
                                        <View style={styles.previewList}>
                                            {Object.keys(selectedMaterials).map((materialId) => {
                                                const material = allAvailableMaterials.find(m => m._id === materialId);
                                                if (!material) return null;
                                                
                                                return (
                                                    <TouchableOpacity
                                                        key={materialId} 
                                                        style={styles.previewItem}
                                                        onPress={() => toggleMaterialSelection(materialId)}
                                                        activeOpacity={0.7}
                                                    >
                                                        <View style={[styles.previewIconBadge, { backgroundColor: material.color + '20' }]}>
                                                            <Ionicons name={material.icon} size={14} color={material.color} />
                                                        </View>
                                                        <Text style={styles.previewItemName}>{material.name}</Text>
                                                        <Text style={styles.previewItemUnit}>({material.unit})</Text>
                                                        <Ionicons name="close-circle" size={16} color="#EF4444" style={styles.previewRemoveIcon} />
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                )}
                            </>
                        ) : (
                            // STEP 2: QUANTITY INPUT
                            <>
                                {/* Back to Edit Materials - Moved to top */}
                                <View style={styles.step2BackHeader}>
                                    <TouchableOpacity
                                        style={styles.backButtonIcon}
                                        onPress={handlePreviousStep}
                                    >
                                        <Ionicons name="arrow-back" size={24} color="#64748B" />
                                    </TouchableOpacity>
                                    <Text style={styles.backToEditText}>Back to Edit Materials</Text>
                                </View>

                                {/* Selected Section Info */}
                                <View style={styles.sectionInfo}>
                                    <View style={styles.sectionInfoHeader}>
                                        <Ionicons name="layers" size={20} color="#3B82F6" />
                                        <Text style={styles.sectionInfoTitle}>Using materials in:</Text>
                                    </View>
                                    <Text style={styles.sectionInfoName}>
                                        {availableMiniSections.find(s => s._id === selectedMiniSectionId)?.name || 
                                         miniSections.find(s => s._id === selectedMiniSectionId)?.name || 
                                         'Unknown Section'}
                                    </Text>
                                </View>

                                {/* Quantity Input Section */}
                                <View style={styles.fieldContainer}>
                                    <View style={styles.labelWithHelper}>
                                        <Text style={styles.label}>
                                            Enter quantities for each material <Text style={styles.required}>*</Text>
                                        </Text>
                                        <Text style={styles.labelHelper}>
                                            Specify how much of each material you're using
                                        </Text>
                                    </View>

                                    {/* Progress indicator */}
                                    <View style={styles.quantityProgress}>
                                        <View style={styles.quantityProgressHeader}>
                                            <Text style={styles.quantityProgressText}>
                                                Progress: {Object.values(selectedMaterials).filter(q => q && parseFloat(q) > 0).length} of {getSelectedMaterialsCount()} materials
                                            </Text>
                                            <View style={styles.quantityProgressBar}>
                                                <View 
                                                    style={[
                                                        styles.quantityProgressFill,
                                                        { 
                                                            width: `${(Object.values(selectedMaterials).filter(q => q && parseFloat(q) > 0).length / getSelectedMaterialsCount()) * 100}%` 
                                                        }
                                                    ]} 
                                                />
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.quantitySection}>
                                        {Object.keys(selectedMaterials).map((materialId, index) => {
                                            const material = allAvailableMaterials.find(m => m._id === materialId);
                                            if (!material) return null;
                                            
                                            const currentQuantity = selectedMaterials[materialId] || '';
                                            const quantityNum = parseFloat(currentQuantity);
                                            // Only show error if user has interacted with the field (not empty by default)
                                            const hasError = currentQuantity !== '' && (quantityNum <= 0 || quantityNum > material.quantity);
                                            const materialIds = Object.keys(selectedMaterials);
                                            const isLastInput = index === materialIds.length - 1;
                                            
                                            return (
                                                <View key={materialId} style={styles.quantityCard}>
                                                    <View style={styles.quantityCardHeader}>
                                                        <View style={styles.quantityCardLeft}>
                                                            <View style={[styles.quantityIconBadge, { backgroundColor: material.color + '20' }]}>
                                                                <Ionicons name={material.icon} size={20} color={material.color} />
                                                            </View>
                                                            <View style={styles.quantityCardInfo}>
                                                                <Text style={styles.quantityCardName}>{material.name}</Text>
                                                                <Text style={styles.quantityCardAvailable}>
                                                                    {material.quantity} {material.unit} available
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                    
                                                    <View style={styles.quantityInputSection}>
                                                        <Text style={styles.quantityInputLabel}>Quantity to use:</Text>
                                                        <View style={styles.quantityInputWrapper}>
                                                            <TextInput
                                                                ref={(ref) => {
                                                                    quantityInputRefs.current[materialId] = ref;
                                                                }}
                                                                style={[
                                                                    styles.quantityInputLarge,
                                                                    hasError && styles.quantityInputError
                                                                ]}
                                                                value={currentQuantity}
                                                                onChangeText={(text) => updateMaterialQuantity(materialId, text)}
                                                                placeholder={`Enter quantity (Max: ${material.quantity})`}
                                                                keyboardType="numeric"
                                                                returnKeyType={isLastInput ? "done" : "next"}
                                                                placeholderTextColor="#94A3B8"
                                                                onSubmitEditing={() => {
                                                                    if (!isLastInput) {
                                                                        // Focus next input
                                                                        const nextMaterialId = materialIds[index + 1];
                                                                        if (nextMaterialId && quantityInputRefs.current[nextMaterialId]) {
                                                                            quantityInputRefs.current[nextMaterialId]?.focus();
                                                                        }
                                                                    } else {
                                                                        // Last input, blur to hide keyboard
                                                                        quantityInputRefs.current[materialId]?.blur();
                                                                    }
                                                                }}
                                                                blurOnSubmit={isLastInput}
                                                                autoCorrect={false}
                                                                autoCapitalize="none"
                                                            />
                                                            <Text style={styles.quantityUnitLarge}>{material.unit}</Text>
                                                        </View>
                                                        
                                                        {hasError && (
                                                            <View style={styles.quantityError}>
                                                                <Ionicons name="warning" size={16} color="#EF4444" />
                                                                <Text style={styles.quantityErrorText}>
                                                                    {quantityNum <= 0 
                                                                        ? 'Please enter a valid quantity'
                                                                        : `Exceeds available amount (${material.quantity} ${material.unit})`
                                                                    }
                                                                </Text>
                                                            </View>
                                                        )}
                                                        
                                                        {/* Helpful info when no error and no input */}
                                                        {!hasError && currentQuantity === '' && (
                                                            <View style={styles.quantityHint}>
                                                                <Ionicons name="information-circle-outline" size={16} color="#3B82F6" />
                                                                <Text style={styles.quantityHintText}>
                                                                    Enter the amount you want to use
                                                                </Text>
                                                            </View>
                                                        )}
                                                        
                                                        {/* Quick action buttons for common quantities */}
                                                        {currentQuantity === '' && (
                                                            <View style={styles.quickActionsContainer}>
                                                                <Text style={styles.quickActionsLabel}>Quick fill:</Text>
                                                                <View style={styles.quickActionButtons}>
                                                                    <TouchableOpacity
                                                                        style={styles.quickActionButton}
                                                                        onPress={() => updateMaterialQuantity(materialId, '1')}
                                                                    >
                                                                        <Text style={styles.quickActionButtonText}>1</Text>
                                                                    </TouchableOpacity>
                                                                    <TouchableOpacity
                                                                        style={styles.quickActionButton}
                                                                        onPress={() => updateMaterialQuantity(materialId, Math.floor(material.quantity / 2).toString())}
                                                                    >
                                                                        <Text style={styles.quickActionButtonText}>Half</Text>
                                                                    </TouchableOpacity>
                                                                    <TouchableOpacity
                                                                        style={styles.quickActionButton}
                                                                        onPress={() => updateMaterialQuantity(materialId, material.quantity.toString())}
                                                                    >
                                                                        <Text style={styles.quickActionButtonText}>All</Text>
                                                                    </TouchableOpacity>
                                                                </View>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            </>
                        )}
                    </ScrollView>

                    {/* Footer Buttons */}
                    <View style={styles.footer}>
                        {currentStep === 'selection' ? (
                            // Step 1 Footer
                            <>
                                <TouchableOpacity
                                    style={styles.cancelButtonIcon}
                                    onPress={handleClose}
                                >
                                    <Ionicons name="close" size={24} color="#64748B" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.nextButtonLarge,
                                        !canProceedToQuantity() && styles.nextButtonDisabled
                                    ]}
                                    onPress={handleNextStep}
                                    disabled={!canProceedToQuantity()}
                                >
                                    <Text style={styles.nextButtonText}>
                                        Next: Enter Quantities
                                    </Text>
                                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </>
                        ) : (
                            // Step 2 Footer - Swipe to Submit Only
                            <View style={styles.step2FooterSimple}>
                                <View style={styles.swipeContainer}>
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
                                                                outputRange: [0, 200], // Match the maxSwipe distance
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
                                                    Swipe to Record Usage
                                                </Animated.Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* Loading Overlay */}
            {isSubmittingUsage && (
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
                            <Ionicons name="arrow-forward-circle" size={48} color="#3B82F6" />
                        </Animated.View>
                        <Text style={styles.loadingTitle}>Recording Material Usage</Text>
                        <Text style={styles.loadingSubtitle}>Please wait while we process your usage data</Text>
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
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '95%', // Increased from 90% to 95% for more space
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    closeButton: {
        padding: 4,
    },
    formContainer: {
        padding: 20,
    },
    fieldContainer: {
        marginBottom: 20,
    },
    labelWithHelper: {
        marginBottom: 8,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 4,
    },
    labelHelper: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '400',
    },
    required: {
        color: '#EF4444',
    },
    pickerContainer: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 14,
        fontSize: 16,
        color: '#1E293B',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1E293B',
    },
    clearButton: {
        padding: 4,
    },
    searchResultText: {
        fontSize: 12,
        color: '#3B82F6',
        marginTop: 6,
        fontWeight: '500',
    },
    materialList: {
        maxHeight: 280,
        marginTop: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    materialItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
    },
    materialItemSelected: {
        backgroundColor: '#F0F9FF',
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    materialItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    materialIconBadge: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    materialItemInfo: {
        flex: 1,
    },
    materialNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 2,
        gap: 8,
    },
    materialItemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    specsBadgeInline: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    specsBadgeText: {
        fontSize: 10,
        color: '#92400E',
        fontWeight: '600',
    },
    materialItemQuantity: {
        fontSize: 13,
        color: '#64748B',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 12,
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
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
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
    errorText: {
        fontSize: 12,
        color: '#EF4444',
        marginTop: 6,
    },
    materialDetails: {
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#0369A1',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: '#0C4A6E',
        fontWeight: '700',
    },
    specsContainer: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#BAE6FD',
    },
    specsTitle: {
        fontSize: 13,
        color: '#0369A1',
        fontWeight: '600',
        marginBottom: 4,
    },
    specItem: {
        fontSize: 12,
        color: '#0C4A6E',
        marginLeft: 8,
        marginTop: 2,
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonSmall: {
        flex: 0.4, // Smaller cancel button for Step 1
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonIcon: {
        width: 48, // Fixed width for icon-only button
        height: 48, // Fixed height for icon-only button
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },
    submitButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    submitButtonDisabled: {
        backgroundColor: '#CBD5E1',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    checkboxContainer: {
        padding: 8,
    },
    quantityInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 8,
        minWidth: 80,
    },
    quantityInput: {
        flex: 1,
        paddingVertical: 8,
        fontSize: 14,
        color: '#1E293B',
        textAlign: 'center',
        minWidth: 40,
    },
    quantityInputError: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    quantityUnit: {
        fontSize: 12,
        color: '#64748B',
        marginLeft: 4,
    },
    errorIndicator: {
        marginLeft: 8,
    },
    selectedSummary: {
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    summaryTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0369A1',
        marginBottom: 12,
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#BAE6FD',
    },
    summaryItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    summaryIconBadge: {
        width: 24,
        height: 24,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    summaryItemName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#0C4A6E',
        flex: 1,
    },
    summaryItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    summaryQuantity: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0C4A6E',
    },
    summaryQuantityError: {
        color: '#EF4444',
    },
    // Step Indicator Styles
    stepIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    stepContainer: {
        alignItems: 'center',
        flex: 1,
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    stepCircleActive: {
        backgroundColor: '#3B82F6',
    },
    stepCircleCompleted: {
        backgroundColor: '#10B981',
    },
    stepCircleInactive: {
        backgroundColor: '#E2E8F0',
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: '600',
    },
    stepNumberActive: {
        color: '#FFFFFF',
    },
    stepNumberCompleted: {
        color: '#FFFFFF',
    },
    stepNumberInactive: {
        color: '#94A3B8',
    },
    stepLabel: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
    },
    stepLabelActive: {
        color: '#3B82F6',
    },
    stepLabelCompleted: {
        color: '#10B981',
    },
    stepLabelInactive: {
        color: '#94A3B8',
    },
    stepConnector: {
        height: 2,
        flex: 0.5,
        marginHorizontal: 8,
        marginBottom: 24,
    },
    stepConnectorActive: {
        backgroundColor: '#10B981',
    },
    stepConnectorInactive: {
        backgroundColor: '#E2E8F0',
    },
    // Selection Preview Styles
    selectionPreview: {
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    previewTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0369A1',
        marginBottom: 4,
    },
    previewSubtitle: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 12,
        fontStyle: 'italic',
    },
    previewList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    previewItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    previewIconBadge: {
        width: 20,
        height: 20,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    previewItemName: {
        fontSize: 12,
        fontWeight: '500',
        color: '#0C4A6E',
    },
    previewItemUnit: {
        fontSize: 11,
        color: '#64748B',
        marginLeft: 4,
    },
    previewRemoveIcon: {
        marginLeft: 6,
    },
    // Section Info Styles
    sectionInfo: {
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    sectionInfoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionInfoTitle: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '500',
        marginLeft: 8,
    },
    sectionInfoName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E40AF',
    },
    // Quantity Section Styles
    quantitySection: {
        gap: 16,
    },
    quantityCard: {
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
    quantityCardHeader: {
        marginBottom: 12,
    },
    quantityCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityIconBadge: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    quantityCardInfo: {
        flex: 1,
    },
    quantityCardName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 2,
    },
    quantityCardAvailable: {
        fontSize: 13,
        color: '#64748B',
    },
    quantityInputSection: {
        gap: 8,
    },
    quantityInputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    quantityInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
    },
    quantityInputLarge: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '500',
    },
    quantityUnitLarge: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
        marginLeft: 8,
    },
    quantityError: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    quantityErrorText: {
        fontSize: 12,
        color: '#EF4444',
        flex: 1,
    },
    // Button Styles
    nextButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    nextButtonLarge: {
        flex: 1.6, // Larger "Enter Quantities" button for Step 1
        paddingVertical: 16, // Slightly larger padding
        borderRadius: 12,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    nextButtonDisabled: {
        backgroundColor: '#CBD5E1',
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    backButton: {
        flex: 0.4, // Reduced from flex: 1 to make it smaller
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    backButtonIcon: {
        width: 48, // Fixed width for icon-only button
        height: 48, // Fixed height for icon-only button
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },
    // Large Submit Button for Step 2
    submitButtonLarge: {
        flex: 1.6, // Larger than the back button
        paddingVertical: 16, // Slightly larger padding
        borderRadius: 12,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    // Quantity Hint
    quantityHint: {
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
    quantityHintText: {
        fontSize: 12,
        color: '#3B82F6',
        flex: 1,
    },
    // Quantity Progress Styles
    quantityProgress: {
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    quantityProgressHeader: {
        gap: 8,
    },
    quantityProgressText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748B',
    },
    quantityProgressBar: {
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        overflow: 'hidden',
    },
    quantityProgressFill: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 2,
    },
    // Quick Actions Styles
    quickActionsContainer: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    quickActionsLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748B',
        marginBottom: 6,
    },
    quickActionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    quickActionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#F8FAFC',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        minWidth: 50,
        alignItems: 'center',
    },
    quickActionButtonText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#3B82F6',
    },
    // Step 2 Footer Styles
    step2Footer: {
        flexDirection: 'column',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20, // Reduced padding since we have proper header now
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        gap: 12,
    },
    step2FooterSimple: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    step2BackHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        gap: 12,
    },
    step2Header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 12,
    },
    backToEditText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
    },
    swipeContainer: {
        width: '100%',
    },
    // Grand Total Styles
    grandTotalContainer: {
        paddingVertical: 12,
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
    // Swipe to Submit Styles
    swipeToSubmitContainer: {
        width: '100%',
        paddingHorizontal: 4,
    },
    swipeTrack: {
        backgroundColor: '#1E293B',
        borderRadius: 35,
        height: 70,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    swipeButton: {
        position: 'absolute',
        left: 6,
        top: 6,
        width: 58,
        height: 58,
        backgroundColor: '#3B82F6',
        borderRadius: 29,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
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
    swipeTextContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 70,
        paddingRight: 20,
    },
    swipeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    // Loading and Error States
    loadingState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 12,
    },
    loadingSubtext: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 4,
    },
    errorState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        margin: 8,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    loadingErrorText: {
        fontSize: 14,
        color: '#DC2626',
        fontWeight: '600',
        textAlign: 'center',
    },
    errorSubtext: {
        fontSize: 12,
        color: '#7F1D1D',
        marginTop: 4,
        textAlign: 'center',
    },
    // Loading Overlay Styles
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
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
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 8,
        textAlign: 'center',
    },
    loadingSubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 20,
    },
    loadingDots: {
        flexDirection: 'row',
        gap: 8,
    },
    loadingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3B82F6',
    },
});

export default MaterialUsageForm;
