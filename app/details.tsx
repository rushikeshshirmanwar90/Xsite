import Header from '@/components/details/Header';
import MaterialCardEnhanced from '@/components/details/MaterialCardEnhanced';
import MaterialFormModal from '@/components/details/MaterialFormModel';
import MaterialUsageForm from '@/components/details/MaterialUsageForm';
import SectionManager from '@/components/details/SectionManager';
import TabSelector from '@/components/details/TabSelector';
import { predefinedSections } from '@/data/details';
import { getSection } from '@/functions/details';
import { domain } from '@/lib/domain';
import { styles } from '@/style/details';
import { Material, MaterialEntry, Section } from '@/types/details';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

const Details = () => {
    const params = useLocalSearchParams();
    const projectId = params.projectId as string;
    const projectName = params.projectName as string;
    const sectionId = params.sectionId as string;
    const sectionName = params.sectionName as string;
    const materialAvailableParam = params.materialAvailable as string;
    const materialUsedParam = params.materialUsed as string;

    const [activeTab, setActiveTab] = useState<'imported' | 'used'>('imported');
    const [selectedPeriod, setSelectedPeriod] = useState('Today');
    const [showMaterialForm, setShowMaterialForm] = useState(false);
    const [showUsageForm, setShowUsageForm] = useState(false);
    const [selectedMiniSection, setSelectedMiniSection] = useState<string | null>(null);

    const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
    const [usedMaterials, setUsedMaterials] = useState<Material[]>([]);
    const [miniSections, setMiniSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(false);
    const cardAnimations = useRef<Animated.Value[]>([]).current;



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

    // Function to load materials from params or fetch from API
    const loadProjectMaterials = async () => {
        setLoading(true);
        try {
            let materialAvailable: any[] = [];
            let materialUsed: any[] = [];

            // Try to use passed params first (no API call needed!)
            if (materialAvailableParam) {
                try {
                    const parsedAvailable = JSON.parse(
                        Array.isArray(materialAvailableParam) ? materialAvailableParam[0] : materialAvailableParam
                    );
                    materialAvailable = parsedAvailable;
                    console.log('✓ Using MaterialAvailable from params:', materialAvailable.length);
                } catch (e) {
                    console.error('Failed to parse materialAvailableParam:', e);
                }
            }

            if (materialUsedParam) {
                try {
                    const parsedUsed = JSON.parse(
                        Array.isArray(materialUsedParam) ? materialUsedParam[0] : materialUsedParam
                    );
                    materialUsed = parsedUsed;
                    console.log('✓ Using MaterialUsed from params:', materialUsed.length);
                } catch (e) {
                    console.error('Failed to parse materialUsedParam:', e);
                }
            }

            // Fallback: fetch from API if params are not available
            if (materialAvailable.length === 0 && materialUsed.length === 0 && projectId) {
                console.log('⚠ No materials in params, fetching from API...');
                const response = await axios.get(`${domain}/api/project?id=${projectId}`);
                
                const responseData = response.data as any;
                let projectData;
                
                if (responseData.success && responseData.data) {
                    projectData = responseData.data;
                } else if (Array.isArray(responseData)) {
                    projectData = responseData[0];
                } else if (responseData._id) {
                    projectData = responseData;
                } else {
                    throw new Error('Invalid API response format');
                }

                if (projectData) {
                    materialAvailable = projectData.MaterialAvailable || [];
                    materialUsed = projectData.MaterialUsed || [];
                    console.log('✓ Fetched from API - Available:', materialAvailable.length, 'Used:', materialUsed.length);
                }
            }

                // Transform MaterialAvailable to Material interface
                const transformedAvailable: Material[] = materialAvailable.map((material: any, index: number) => {
                    const { icon, color } = getMaterialIconAndColor(material.name);
                    return {
                        id: index + 1,
                        _id: material._id, // Store MongoDB _id for API calls
                        name: material.name,
                        quantity: material.qnt,
                        unit: material.unit,
                        price: material.cost || 0,
                        date: new Date().toLocaleDateString(),
                        icon,
                        color,
                        specs: material.specs || {}
                    };
                });

                // Transform MaterialUsed to Material interface
                const transformedUsed: Material[] = materialUsed.map((material: any, index: number) => {
                    const { icon, color } = getMaterialIconAndColor(material.name);
                    return {
                        id: index + 1000, // Different ID range to avoid conflicts
                        _id: material._id, // Store MongoDB _id
                        name: material.name,
                        quantity: material.qnt,
                        unit: material.unit,
                        price: material.cost || 0,
                        date: new Date().toLocaleDateString(),
                        icon,
                        color,
                        specs: material.specs || {}
                    };
                });

                setAvailableMaterials(transformedAvailable);
                setUsedMaterials(transformedUsed);

                // Initialize animations for the materials
                const totalMaterials = Math.max(transformedAvailable.length, transformedUsed.length);
                cardAnimations.splice(0); // Clear existing animations
                for (let i = 0; i < totalMaterials; i++) {
                    cardAnimations.push(new Animated.Value(0));
                }

                // Animate cards in
                Animated.stagger(100,
                    cardAnimations.map((anim: Animated.Value) =>
                        Animated.timing(anim, {
                            toValue: 1,
                            duration: 300,
                            useNativeDriver: false,
                        })
                    )
                ).start();

                console.log('Project materials loaded successfully:', {
                    projectId,
                    availableMaterials: transformedAvailable.length,
                    usedMaterials: transformedUsed.length
                });
        } catch (error: any) {
            console.error('=== ERROR FETCHING PROJECT MATERIALS ===');
            console.error('Error:', error);
            console.error('Error message:', error?.message);
            console.error('Error response:', error?.response?.data);
            console.error('========================================');
            
            const errorMessage = error?.response?.data?.error || 
                                error?.message || 
                                'Failed to load project materials';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Load project materials on mount
    useEffect(() => {
        loadProjectMaterials();
    }, [projectId, materialAvailableParam, materialUsedParam]);

    // Fetch mini-sections for the section selector
    useEffect(() => {
        const fetchMiniSections = async () => {
            if (!sectionId) return;
            
            try {
                console.log('Fetching mini-sections for sectionId:', sectionId);
                const sections = await getSection(sectionId);
                if (sections && Array.isArray(sections)) {
                    setMiniSections(sections);
                    console.log('Mini-sections loaded:', sections.length);
                }
            } catch (error) {
                console.error('Failed to fetch mini-sections:', error);
            }
        };

        fetchMiniSections();
    }, [sectionId]);

    // Group materials by name and unit
    const groupMaterialsByName = (materials: Material[], usedMaterialsList: Material[] = []) => {
        console.log('=== GROUPING MATERIALS ===');
        console.log('Total materials to group:', materials.length);
        console.log('Used materials for reference:', usedMaterialsList.length);

        const grouped: { [key: string]: any } = {};

        materials.forEach((material, index) => {
            const key = `${material.name}-${material.unit}`;

            console.log(`Material ${index + 1}:`, {
                name: material.name,
                unit: material.unit,
                _id: (material as any)._id,
                id: material.id,
                quantity: material.quantity,
                specs: material.specs
            });

            if (!grouped[key]) {
                grouped[key] = {
                    name: material.name,
                    unit: material.unit,
                    icon: material.icon,
                    color: material.color,
                    date: material.date,
                    variants: [],
                    totalQuantity: 0,
                    totalCost: 0,
                    totalUsed: 0,
                    totalImported: 0,
                };
            }

            const variantId = (material as any)._id || material.id.toString();
            console.log(`  → Adding variant with _id: ${variantId}`);

            grouped[key].variants.push({
                _id: variantId,
                specs: material.specs || {},
                quantity: material.quantity,
                cost: material.price,
            });

            grouped[key].totalQuantity += material.quantity;
            grouped[key].totalCost += material.price;
        });

        // Calculate total used for each material from usedMaterialsList
        usedMaterialsList.forEach((usedMaterial) => {
            const key = `${usedMaterial.name}-${usedMaterial.unit}`;
            if (grouped[key]) {
                grouped[key].totalUsed += usedMaterial.quantity;
            }
        });

        // Calculate total imported (available + used)
        Object.keys(grouped).forEach((key) => {
            grouped[key].totalImported = grouped[key].totalQuantity + grouped[key].totalUsed;
        });

        const result = Object.values(grouped);
        console.log('Grouped materials:', result.length);
        result.forEach((group: any) => {
            console.log(`${group.name} (${group.unit}):`, {
                variants: group.variants.length,
                variantIds: group.variants.map((v: any) => v._id),
                totalQuantity: group.totalQuantity,
                totalUsed: group.totalUsed,
                totalImported: group.totalImported,
                percentageRemaining: group.totalImported > 0
                    ? Math.round((group.totalQuantity / group.totalImported) * 100)
                    : 100
            });
        });
        console.log('=========================');

        return result;
    };

    // Handle adding material usage from the form
    const handleAddMaterialUsage = async (
        sectionId: string,
        materialId: string,
        quantity: number
    ) => {
        let loadingToast: any = null;

        try {
            const apiPayload = {
                sectionId: sectionId,
                materialId: materialId,
                qnt: quantity
            };

            console.log('=== ADD MATERIAL USAGE REQUEST ===');
            console.log('Section ID:', sectionId);
            console.log('Material ID:', materialId);
            console.log('Quantity:', quantity);
            console.log('API ENDPOINT:', `${domain}/api/add-material-usage`);
            console.log('PAYLOAD:', JSON.stringify(apiPayload, null, 2));
            console.log('==================================');

            loadingToast = toast.loading('Adding material usage...');

            const response = await axios.post(`${domain}/api/add-material-usage`, apiPayload);
            const responseData = response.data as any;

            if (responseData.success) {
                console.log('=== ADD MATERIAL USAGE SUCCESS ===');
                console.log('Response:', responseData);
                console.log('==================================');

                toast.dismiss(loadingToast);
                toast.success(responseData.message || 'Material usage added successfully');

                // Refresh materials
                await loadProjectMaterials();
            } else {
                throw new Error(responseData.error || 'Failed to add material usage');
            }
        } catch (error: any) {
            console.error('=== ADD MATERIAL USAGE ERROR ===');
            console.error('Error:', error);
            console.error('================================');

            if (loadingToast) {
                toast.dismiss(loadingToast);
            }

            const errorMessage = error?.response?.data?.error ||
                error?.message ||
                'Failed to add material usage';

            toast.error(errorMessage);
        }
    };

    // Handle adding usage - now works at project level
    const handleAddUsage = async (
        materialName: string,
        unit: string,
        variantId: string,
        quantity: number,
        specs: Record<string, any>
    ) => {
        let loadingToast: any = null;

        try {
            // Prepare API payload - using projectId instead of sectionId
            const apiPayload = {
                projectId: projectId,
                materialId: variantId,
                qnt: quantity
            };

            console.log('=== ADD USAGE REQUEST ===');
            console.log('Material Name:', materialName);
            console.log('Unit:', unit);
            console.log('Variant ID (materialId):', variantId);
            console.log('Quantity (qnt):', quantity);
            console.log('Specs:', specs);
            console.log('Project ID:', projectId);
            console.log('---');
            console.log('API ENDPOINT:', `${domain}/api/material-usage`);
            console.log('---');
            console.log('PAYLOAD BEING SENT:');
            console.log(JSON.stringify(apiPayload, null, 2));
            console.log('========================');

            // Show loading toast
            loadingToast = toast.loading('Adding material usage...');

            // Call API to add material usage
            const response = await axios.post(`${domain}/api/material-usage`, apiPayload);

            const responseData = response.data as any;

            // Check response
            if (responseData.success) {
                console.log('=== ADD USAGE SUCCESS ===');
                console.log('Response:', responseData);
                console.log('========================');

                // Dismiss loading toast
                toast.dismiss(loadingToast);
                toast.success(responseData.message || `Added ${quantity} ${unit} of ${materialName} to used materials`);

                // Refresh project materials to show updated quantities
                await loadProjectMaterials();
            } else {
                throw new Error(responseData.error || 'Failed to add material usage');
            }
        } catch (error: any) {
            console.error('=== ADD USAGE ERROR ===');
            console.error('Error:', error);
            console.error('======================');

            // Dismiss loading toast if it exists
            if (loadingToast) {
                toast.dismiss(loadingToast);
            }

            // Extract error message
            const errorMessage = error?.response?.data?.error ||
                error?.message ||
                'Failed to add material usage';

            toast.error(errorMessage);
        }
    };



    const getCurrentData = () => {
        let materials = activeTab === 'imported' ? availableMaterials : usedMaterials;
        
        // Filter by mini-section only for "used" tab
        if (activeTab === 'used' && selectedMiniSection) {
            materials = materials.filter(m => m.sectionId === selectedMiniSection);
            console.log('getCurrentData (filtered by section):', {
                activeTab,
                selectedMiniSection,
                totalMaterials: materials.length
            });
        } else {
            console.log('getCurrentData:', {
                activeTab,
                projectId,
                totalMaterials: materials.length
            });
        }

        return materials;
    };

    const getGroupedData = () => {
        const materials = getCurrentData();
        // Pass used materials to calculate total imported and used
        return groupMaterialsByName(materials, usedMaterials);
    };

    const filteredMaterials = getCurrentData();
    const groupedMaterials = getGroupedData();
    const totalCost = filteredMaterials.reduce((sum, material) => sum + material.price, 0);

    const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`;

    const getImportedQuantity = (material: Material) => {
        const importedMaterial = availableMaterials.find(m =>
            m.name === material.name && m.unit === material.unit
        );
        return importedMaterial ? importedMaterial.quantity : 0;
    };

    const getAvailableQuantity = (material: Material) => {
        const importedMaterial = availableMaterials.find(m =>
            m.name === material.name && m.unit === material.unit
        );
        const usedMaterial = usedMaterials.find(m =>
            m.name === material.name && m.unit === material.unit
        );
        if (!importedMaterial) return 0;
        if (!usedMaterial) return importedMaterial.quantity;
        return Math.max(0, importedMaterial.quantity - usedMaterial.quantity);
    };

    const getAvailabilityPercentage = (material: Material) => {
        const importedMaterial = availableMaterials.find(m =>
            m.name === material.name && m.unit === material.unit
        );
        const usedMaterial = usedMaterials.find(m =>
            m.name === material.name && m.unit === material.unit
        );
        if (!importedMaterial || importedMaterial.quantity === 0) return 0;
        if (!usedMaterial) return 100;
        const available = Math.max(0, importedMaterial.quantity - usedMaterial.quantity);
        return Math.round((available / importedMaterial.quantity) * 100);
    };

    const getQuantityWasted = (material: Material) => {
        const usedMaterial = usedMaterials.find(m =>
            m.name === material.name && m.unit === material.unit
        );
        if (!usedMaterial) return 0;
        return Math.round(usedMaterial.quantity * 0.1); // Assuming 10% wastage
    };

    const getSectionName = (sectionId: string | undefined) => {
        if (!sectionId) return 'Unassigned';
        const section = predefinedSections.find(s => s._id === sectionId);
        return section ? section.name : 'Unassigned';
    };

    const addMaterialRequest = async (materials: MaterialEntry[], message: string) => {
        console.log("=== MATERIAL REQUEST SUBMISSION ===");
        console.log("1. projectId:", projectId);
        console.log("2. message:", message);
        console.log("3. materials:", materials);
        console.log("=====================================");

        // Validation before sending
        if (!projectId) {
            toast.error("Project ID is missing");
            return;
        }

        if (!materials || materials.length === 0) {
            toast.error("No materials to send");
            return;
        }

        // Transform materials to match API format
        const formattedMaterials = materials.map((material: any) => ({
            projectId: projectId,
            materialName: material.materialName,
            unit: material.unit,
            specs: material.specs || {},
            qnt: material.qnt,
            cost: material.cost,
            mergeIfExists: material.mergeIfExists !== undefined ? material.mergeIfExists : true,
        }));

        console.log("=== PAYLOAD BEING SENT ===");
        console.log(JSON.stringify(formattedMaterials, null, 2));
        console.log("==========================");

        let loadingToast: any = null;

        try {
            // Show loading toast
            loadingToast = toast.loading('Adding materials...');

            const res = await axios.post(`${domain}/api/add-material`, formattedMaterials);

            const responseData = res.data as any;

            // Dismiss loading toast
            toast.dismiss(loadingToast);

            // Check response
            if (responseData.success) {
                console.log("=== ADD MATERIAL SUCCESS ===");
                console.log("Response:", responseData);
                console.log("Results:", responseData.results);
                console.log("===========================");

                // Count successful additions
                const successCount = responseData.results?.filter((r: any) => r.success).length || 0;
                const failCount = responseData.results?.filter((r: any) => !r.success).length || 0;

                if (successCount > 0) {
                    toast.success(`Successfully added ${successCount} material${successCount > 1 ? 's' : ''}!`);
                }

                if (failCount > 0) {
                    toast.error(`Failed to add ${failCount} material${failCount > 1 ? 's' : ''}`);
                }

                // Refresh project materials after adding
                await loadProjectMaterials();
            } else {
                throw new Error(responseData.error || 'Failed to add materials');
            }

        } catch (error) {
            console.error("Material request error:", error);

            // Dismiss loading toast if it exists
            if (loadingToast) {
                toast.dismiss(loadingToast);
            }

            // Enhanced error logging for debugging
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { status?: number, data?: any, statusText?: string } };
                console.error("=== API ERROR DETAILS ===");
                console.error("Status:", axiosError.response?.status);
                console.error("Status Text:", axiosError.response?.statusText);
                console.error("Response Data:", axiosError.response?.data);
                console.error("========================");

                const errorMessage = axiosError.response?.data?.message ||
                    axiosError.response?.data?.error ||
                    `API Error: ${axiosError.response?.status}`;
                toast.error(errorMessage);
            } else {
                console.error("Non-Axios error:", error);
                toast.error("Failed to add materials");
            }
        }
    };



    return (
        <SafeAreaView style={styles.container}>
            <Header
                selectedSection={null}
                onSectionSelect={() => {}}
                totalCost={totalCost}
                formatPrice={formatPrice}
                getSectionName={getSectionName}
                projectName={projectName}
                sectionName={sectionName}
                projectId={projectId}
                sectionId={sectionId}
                onShowSectionPrompt={() => {}}
                hideSection={true}
            />
            <MaterialFormModal
                visible={showMaterialForm}
                onClose={() => setShowMaterialForm(false)}
                onSubmit={async (materials, message) => {
                    await addMaterialRequest(materials, message);
                    setShowMaterialForm(false);
                }}
            />
            <MaterialUsageForm
                visible={showUsageForm}
                onClose={() => setShowUsageForm(false)}
                onSubmit={handleAddMaterialUsage}
                availableMaterials={availableMaterials}
                miniSections={miniSections}
            />

            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <TabSelector activeTab={activeTab} onSelectTab={setActiveTab} />
                
                {/* Action Buttons */}
                <View style={actionStyles.actionButtonsContainer}>
                    <TouchableOpacity
                        style={actionStyles.addMaterialButton}
                        onPress={() => setShowMaterialForm(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="add-circle-outline" size={20} color="#059669" />
                        <Text style={actionStyles.addMaterialButtonText}>Add Material</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={actionStyles.addUsageButton}
                        onPress={() => setShowUsageForm(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-forward-circle-outline" size={20} color="#DC2626" />
                        <Text style={actionStyles.addUsageButtonText}>Add Usage</Text>
                    </TouchableOpacity>
                </View>
                
                {/* Compact Filters - Only visible in "Used Materials" tab */}
                {activeTab === 'used' && (
                    <View style={sectionStyles.filtersContainer}>
                        {/* Period Filter - Compact Chips */}
                        <View style={sectionStyles.filterRow}>
                            <Ionicons name="time-outline" size={16} color="#64748B" style={sectionStyles.filterIcon} />
                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false}
                                style={sectionStyles.chipScrollView}
                            >
                                {['Today', '1 Week', '15 Days', '1 Month', 'All'].map((period) => (
                                    <TouchableOpacity
                                        key={period}
                                        style={[
                                            sectionStyles.chip,
                                            selectedPeriod === period && sectionStyles.chipActive
                                        ]}
                                        onPress={() => setSelectedPeriod(period)}
                                    >
                                        <Text style={[
                                            sectionStyles.chipText,
                                            selectedPeriod === period && sectionStyles.chipTextActive
                                        ]}>
                                            {period}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Section Filter - Compact Dropdown */}
                        <View style={sectionStyles.filterRow}>
                            <Ionicons name="layers-outline" size={16} color="#64748B" style={sectionStyles.filterIcon} />
                            {miniSections.length > 0 ? (
                                <View style={sectionStyles.compactSectionSelector}>
                                    <SectionManager
                                        onSectionSelect={(sectionId) => {
                                            setSelectedMiniSection(sectionId === 'all-sections' ? null : sectionId);
                                        }}
                                        selectedSection={selectedMiniSection || 'all-sections'}
                                        sections={[
                                            { id: 'all-sections', name: 'All Sections', createdAt: new Date().toISOString() },
                                            ...miniSections.map(s => ({
                                                id: s._id,
                                                name: s.name,
                                                createdAt: s.createdAt
                                            }))
                                        ]}
                                        compact={true}
                                        projectDetails={{
                                            projectName: projectName,
                                            projectId: projectId
                                        }}
                                        mainSectionDetails={{
                                            sectionName: sectionName,
                                            sectionId: sectionId
                                        }}
                                    />
                                </View>
                            ) : (
                                <View style={sectionStyles.noSectionsCompact}>
                                    <Text style={sectionStyles.noSectionsTextCompact}>No mini-sections</Text>
                                    <SectionManager
                                        onSectionSelect={(sectionId) => {
                                            setSelectedMiniSection(sectionId);
                                            if (sectionId) {
                                                getSection(sectionId).then(sections => {
                                                    if (sections && Array.isArray(sections)) {
                                                        setMiniSections(sections);
                                                    }
                                                });
                                            }
                                        }}
                                        selectedSection={null}
                                        sections={[]}
                                        compact={true}
                                        projectDetails={{
                                            projectName: projectName,
                                            projectId: projectId
                                        }}
                                        mainSectionDetails={{
                                            sectionName: sectionName,
                                            sectionId: sectionId
                                        }}
                                    />
                                </View>
                            )}
                        </View>
                    </View>
                )}

                <View style={styles.materialsSection}>
                    <Text style={styles.sectionTitle}>
                        {activeTab === 'imported' ? 'Available Materials' : 'Used Materials'}
                        {activeTab === 'used' && selectedMiniSection && (
                            <Text style={{ fontSize: 14, color: '#64748B', fontWeight: '400' }}>
                                {' '}(Filtered)
                            </Text>
                        )}
                    </Text>
                    {loading ? (
                        <View style={styles.noMaterialsContainer}>
                            <Text style={styles.noMaterialsTitle}>Loading Materials...</Text>
                            <Text style={styles.noMaterialsDescription}>
                                Fetching project materials...
                            </Text>
                        </View>
                    ) : groupedMaterials.length > 0 ? (
                        groupedMaterials.map((material, index) => (
                            <MaterialCardEnhanced
                                key={`${material.name}-${material.unit}`}
                                material={material}
                                animation={cardAnimations[index] || new Animated.Value(1)}
                                activeTab={activeTab}
                                onAddUsage={handleAddUsage}
                            />
                        ))
                    ) : (
                        <View style={styles.noMaterialsContainer}>
                            <Text style={styles.noMaterialsTitle}>No Materials Found</Text>
                            <Text style={styles.noMaterialsDescription}>
                                No {activeTab === 'imported' ? 'available' : 'used'} materials found for this project.
                                {activeTab === 'imported' && ' Add materials using the + button below.'}
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const actionStyles = StyleSheet.create({
    actionButtonsContainer: {
        flexDirection: 'row',
        marginTop: 16,
        marginBottom: 8,
        marginHorizontal: 16,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    addMaterialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0FDF4',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRightWidth: 0.5,
        borderRightColor: '#E5E7EB',
        gap: 8,
    },
    addMaterialButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#059669',
    },
    addUsageButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF2F2',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderLeftWidth: 0.5,
        borderLeftColor: '#E5E7EB',
        gap: 8,
    },
    addUsageButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#DC2626',
    },
});

const sectionStyles = StyleSheet.create({
    filtersContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        gap: 12,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 36,
    },
    filterIcon: {
        marginRight: 8,
    },
    chipScrollView: {
        flex: 1,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    chipActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    chipText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    chipTextActive: {
        color: '#FFFFFF',
    },
    compactSectionSelector: {
        flex: 1,
    },
    noSectionsCompact: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    noSectionsTextCompact: {
        fontSize: 13,
        color: '#92400E',
        fontWeight: '500',
        flex: 1,
    },
});

export default Details;