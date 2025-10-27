import FloatingActionButton from '@/components/details/FloatingActionButton';
import Header from '@/components/details/Header';
import MaterialCard from '@/components/details/MaterialCard';
import MaterialFormModal from '@/components/details/MaterialFormModel';
import PeriodFilter from '@/components/details/PeriodTable';
import SectionSelectionPrompt from '@/components/details/SectionSelectionPrompt';
import TabSelector from '@/components/details/TabSelector';
import { importedMaterials, predefinedSections, usedMaterials } from '@/data/details';
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
    const cardAnimations = useRef(importedMaterials.map(() => new Animated.Value(0))).current;
    const [clientId, setClientId] = useState<string | null>(null);
    const [showSectionPrompt, setShowSectionPrompt] = useState(false);

    useEffect(() => {
        const fetchClientId = async () => {
            const clientId = await getClientId();
            setClientId(clientId)
        }
        fetchClientId()
    }, []);

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
        const materials = activeTab === 'imported' ? importedMaterials : usedMaterials;
        console.log('getCurrentData:', {
            activeTab,
            selectedMiniSection: selectedSection,
            totalMaterials: materials.length,
            materialSectionIds: materials.map(m => m.sectionId)
        });

        if (selectedSection) {
            const filtered = materials.filter(material => material.sectionId === selectedSection);
            console.log('Filtered materials:', filtered.length, 'for mini-section:', selectedSection);
            return filtered;
        }
        return [];
    };

    const filteredMaterials = getCurrentData();
    const totalCost = filteredMaterials.reduce((sum, material) => sum + material.price, 0);

    const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`;

    const getImportedQuantity = (material: Material) => {
        const importedMaterial = importedMaterials.find(m => m.id === material.id);
        return importedMaterial ? importedMaterial.quantity : 0;
    };

    const getAvailableQuantity = (material: Material) => {
        const importedMaterial = importedMaterials.find(m => m.id === material.id);
        const usedMaterial = usedMaterials.find(m => m.id === material.id);
        if (!importedMaterial) return 0;
        if (!usedMaterial) return importedMaterial.quantity;
        return importedMaterial.quantity - usedMaterial.quantity;
    };

    const getAvailabilityPercentage = (material: Material) => {
        const importedMaterial = importedMaterials.find(m => m.id === material.id);
        const usedMaterial = usedMaterials.find(m => m.id === material.id);
        if (!importedMaterial) return 0;
        if (!usedMaterial) return 100;
        const available = importedMaterial.quantity - usedMaterial.quantity;
        return Math.round((available / importedMaterial.quantity) * 100);
    };

    const getQuantityWasted = (material: Material) => {
        const usedMaterial = usedMaterials.find(m => m.id === material.id);
        if (!usedMaterial) return 0;
        return Math.round(usedMaterial.quantity * 0.1);
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
                        {activeTab === 'imported' ? 'Imported Materials' : 'Used Materials'}
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
                    ) : filteredMaterials.length > 0 ? (
                        filteredMaterials.map((material, index) => (
                            <MaterialCard
                                key={material.id}
                                material={material}
                                animation={cardAnimations[index]}
                                activeTab={activeTab}
                                getAvailableQuantity={getAvailableQuantity}
                                getAvailabilityPercentage={getAvailabilityPercentage}
                                getImportedQuantity={getImportedQuantity}
                                getQuantityWasted={getQuantityWasted}
                            />
                        ))
                    ) : (
                        <View style={styles.noMaterialsContainer}>
                            <Text style={styles.noMaterialsTitle}>No Materials Found</Text>
                            <Text style={styles.noMaterialsDescription}>
                                No {activeTab} materials found for this mini-section
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Details;