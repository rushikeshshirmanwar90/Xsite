import FloatingActionButton from '@/components/details/FloatingActionButton';
import Header from '@/components/details/Header';
import MaterialCardEnhanced from '@/components/details/MaterialCardEnhanced';
import MaterialFormModal from '@/components/details/MaterialFormModel';
import PeriodFilter from '@/components/details/PeriodTable';
import SectionSelectionPrompt from '@/components/details/SectionSelectionPrompt';
import TabSelector from '@/components/details/TabSelector';
import { predefinedSections } from '@/data/details';
import { getClientId } from '@/functions/clientId';
import { domain } from '@/lib/domain';
import { styles } from '@/style/details';
import { Material, MaterialEntry } from '@/types/details';
import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

const Details = () => {
    const params = useLocalSearchParams();
    const projectId = params.projectId as string;
    const projectName = params.projectName as string;
    const sectionId = params.sectionId as string;
    const sectionName = params.sectionName as string;

    const [activeTab, setActiveTab] = useState<'imported' | 'used'>('imported');
    const [selectedPeriod, setSelectedPeriod] = useState('Today');
    const [showMaterialForm, setShowMaterialForm] = useState(false);

    // selectedSection should be for mini-sections (foundation, first slab, etc.), not the main sectionId

    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [materialEntries, setMaterialEntries] = useState<MaterialEntry[]>([]);
    const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
    const [usedMaterials, setUsedMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(false);
    const cardAnimations = useRef<Animated.Value[]>([]).current;
    const [clientId, setClientId] = useState<string | null>(null);
    const [showSectionPrompt, setShowSectionPrompt] = useState(false);

    useEffect(() => {
        const fetchClientId = async () => {
            const clientId = await getClientId();
            setClientId(clientId)
        }
        fetchClientId()
    }, []);

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

    // Function to fetch mini-section data
    const fetchMiniSectionData = async (miniSectionId: string) => {
        if (!miniSectionId) return;

        setLoading(true);
        try {
            const response = await axios.get(`${domain}/api/mini-section?id=${miniSectionId}`);

            if ((response.data as any).success) {
                const sectionData = (response.data as any).data;
                const materialAvailable = sectionData.MaterialAvailable || [];
                const materialUsed = sectionData.MaterialUsed || [];

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
                        sectionId: miniSectionId,
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
                        sectionId: miniSectionId,
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

                console.log('Mini-section data loaded:', {
                    sectionId: miniSectionId,
                    availableMaterials: transformedAvailable.length,
                    usedMaterials: transformedUsed.length
                });
            }
        } catch (error) {
            console.error('Error fetching mini-section data:', error);
            toast.error('Failed to load section materials');
        } finally {
            setLoading(false);
        }
    };

    // Fetch data when selectedSection changes
    useEffect(() => {
        if (selectedSection) {
            fetchMiniSectionData(selectedSection);
        }
    }, [selectedSection]);

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

    // Handle adding usage
    const handleAddUsage = async (
        materialName: string,
        unit: string,
        variantId: string,
        quantity: number,
        specs: Record<string, any>
    ) => {
        if (!selectedSection) {
            toast.error('No section selected');
            return;
        }

        let loadingToast: any = null;

        try {
            // Prepare API payload
            const apiPayload = {
                sectionId: selectedSection,
                materialId: variantId,
                qnt: quantity
            };

            console.log('=== ADD USAGE REQUEST ===');
            console.log('Material Name:', materialName);
            console.log('Unit:', unit);
            console.log('Variant ID (materialId):', variantId);
            console.log('Quantity (qnt):', quantity);
            console.log('Specs:', specs);
            console.log('Section ID:', selectedSection);
            console.log('---');
            console.log('API ENDPOINT:', `${domain}/api/material-usage`);
            console.log('---');
            console.log('PAYLOAD BEING SENT:');
            console.log(JSON.stringify(apiPayload, null, 2));
            console.log('---');
            console.log('Payload Details:');
            console.log('  - sectionId:', apiPayload.sectionId);
            console.log('  - materialId:', apiPayload.materialId);
            console.log('  - qnt:', apiPayload.qnt);
            console.log('  - qnt type:', typeof apiPayload.qnt);
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

                // Refresh data to show updated quantities
                await fetchMiniSectionData(selectedSection);
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

    // Show section selection prompt when no section is selected
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!selectedSection) {
                setShowSectionPrompt(true);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [selectedSection]);

    const getCurrentData = () => {
        const materials = activeTab === 'imported' ? availableMaterials : usedMaterials;
        console.log('getCurrentData:', {
            activeTab,
            selectedMiniSection: selectedSection,
            totalMaterials: materials.length,
            materialSectionIds: materials.map(m => m.sectionId)
        });

        return materials; // Return all materials since they're already filtered by selectedSection
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
        const miniSectionId = selectedSection || sectionId;
        const miniSectionName = getSectionName(miniSectionId);

        console.log("=== MATERIAL REQUEST SUBMISSION ===");
        console.log("1. clientId:", clientId);
        console.log("2. miniSectionId:", miniSectionId, `(${miniSectionName})`);
        console.log("3. message:", message);
        console.log("4. materials:", materials);
        console.log("=====================================");

        // Validation before sending
        if (!clientId) {
            toast.error("Client ID is missing");
            return;
        }

        if (!miniSectionId) {
            toast.error("Section ID is missing");
            return;
        }

        if (!materials || materials.length === 0) {
            toast.error("No materials to send");
            return;
        }

        // Payload matching your RequestedMaterialSchema
        const payload = {
            clientId,
            sectionId: miniSectionId,
            materials,
            message
        };

        console.log("=== PAYLOAD BEING SENT ===");
        console.log(JSON.stringify(payload, null, 2));
        console.log("==========================");

        try {
            const res = await axios.post(`${domain}/api/request-material`, payload);

            // Check response status is successful
            if (res.status !== 201) {
                toast.error("Failed to send material request");
                return;
            }
            toast.success("Material request sent successfully");

        } catch (error) {
            console.error("Material request error:", error);

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
                toast.error("Failed to send material request");
            }
        }
    };

    const handleSectionSelect = (miniSectionId: string) => {
        console.log('Details: Mini-section selected:', miniSectionId);
        setSelectedSection(miniSectionId);
        setShowSectionPrompt(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header
                selectedSection={selectedSection}
                onSectionSelect={setSelectedSection}
                totalCost={totalCost}
                formatPrice={formatPrice}
                getSectionName={getSectionName}
                projectName={projectName}
                sectionName={sectionName}
                projectId={projectId}
                sectionId={sectionId}
                onShowSectionPrompt={() => setShowSectionPrompt(true)}
            />
            <FloatingActionButton onPress={() => setShowMaterialForm(true)} />
            <MaterialFormModal
                visible={showMaterialForm}
                onClose={() => setShowMaterialForm(false)}
                onSubmit={addMaterialRequest}
            />

            <SectionSelectionPrompt
                visible={showSectionPrompt}
                onSelectSection={handleSectionSelect}
                onClose={() => setShowSectionPrompt(false)}
                sectionId={sectionId}
                projectName={projectName}
                sectionName={sectionName}
            />
            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <PeriodFilter selectedPeriod={selectedPeriod} onSelectPeriod={setSelectedPeriod} />
                <TabSelector activeTab={activeTab} onSelectTab={setActiveTab} />
                <View style={styles.materialsSection}>
                    <Text style={styles.sectionTitle}>
                        {activeTab === 'imported' ? 'Available Materials' : 'Used Materials'}
                    </Text>
                    {!selectedSection ? (
                        <View style={styles.noSectionContainer}>
                            <Text style={styles.noSectionTitle}>No Mini-Section Selected</Text>
                            <Text style={styles.noSectionDescription}>
                                Please select a mini-section (Foundation, First Slab, etc.) to view materials
                            </Text>
                            <TouchableOpacity
                                style={styles.selectSectionButtonLarge}
                                onPress={() => setShowSectionPrompt(true)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.selectSectionButtonText}>Select Mini-Section</Text>
                            </TouchableOpacity>
                        </View>
                    ) : loading ? (
                        <View style={styles.noMaterialsContainer}>
                            <Text style={styles.noMaterialsTitle}>Loading Materials...</Text>
                            <Text style={styles.noMaterialsDescription}>
                                Fetching materials data for this section
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
                                No {activeTab === 'imported' ? 'available' : 'used'} materials found for this mini-section
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Details;