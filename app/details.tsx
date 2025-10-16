import FloatingActionButton from '@/components/details/FloatingActionButton';
import Header from '@/components/details/Header';
import MaterialCard from '@/components/details/MaterialCard';
import MaterialFormModal from '@/components/details/MaterialFormModel';
import PeriodFilter from '@/components/details/PeriodTable';
import TabSelector from '@/components/details/TabSelector';
import { importedMaterials, predefinedSections, usedMaterials } from '@/data/details';
import { styles } from '@/style/details';
import { Material, MaterialEntry } from '@/types/details';
import React, { useRef, useState } from 'react';
import { Animated, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DetailsProps {
}

const Details: React.FC<DetailsProps> = () => {
    const [activeTab, setActiveTab] = useState<'imported' | 'used'>('imported');
    const [selectedPeriod, setSelectedPeriod] = useState('Today');
    const [showMaterialForm, setShowMaterialForm] = useState(false);
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [materialEntries, setMaterialEntries] = useState<MaterialEntry[]>([]);
    const cardAnimations = useRef(importedMaterials.map(() => new Animated.Value(0))).current;

    const getCurrentData = () => {
        const materials = activeTab === 'imported' ? importedMaterials : usedMaterials;
        if (selectedSection) {
            return materials.filter(material => material.sectionId === selectedSection);
        }
        return materials;
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
        const section = predefinedSections.find(s => s.id === sectionId);
        return section ? section.name : 'Unassigned';
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header
                selectedSection={selectedSection}
                onSectionSelect={setSelectedSection}
                totalCost={totalCost}
                formatPrice={formatPrice}
                getSectionName={getSectionName}
            />
            <FloatingActionButton onPress={() => setShowMaterialForm(true)} />
            <MaterialFormModal
                visible={showMaterialForm}
                onClose={() => setShowMaterialForm(false)}
                onSubmit={(newEntry) => {
                    setMaterialEntries([...materialEntries, newEntry]);
                    setShowMaterialForm(false);
                }}
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
                    {filteredMaterials.map((material, index) => (
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
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Details;