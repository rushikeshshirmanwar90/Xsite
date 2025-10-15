import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Components
import DetailsHeader from './components/details/DetailsHeader';
import MaterialForm from './components/details/MaterialForm';
import MaterialList from './components/details/MaterialList';
import SectionManager from './components/details/SectionManager';

// Types
import { MaterialTab } from './components/types/common';
import { Material, MaterialEntry, MaterialFormData } from './types/material';
import { Section } from './types/section';

// Constants
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MATERIAL_TEMPLATES,
  PERIODS,
  SAMPLE_IMPORTED_MATERIALS,
  SAMPLE_USED_MATERIALS
} from './constants/materials';

const Details: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<MaterialTab>('imported');
  const [selectedPeriod, setSelectedPeriod] = useState<string>(PERIODS[0]);
  const [showMaterialForm, setShowMaterialForm] = useState<boolean>(false);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);
  const [materialEntries, setMaterialEntries] = useState<MaterialEntry[]>([]);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [formData, setFormData] = useState<MaterialFormData & { sectionId: string | null }>({
    name: '',
    category: '',
    unit: '',
    quantity: '',
    location: '',
    status: 'received',
    specs: {},
    notes: '',
    sectionId: null,
  });

  // Initialize with a default section if none exists
  useEffect(() => {
    if (sections.length === 0) {
      const defaultSection: Section = {
        id: 'default-section',
        name: 'General',
        description: 'Default section for all materials',
        createdAt: new Date().toISOString(),
      };
      setSections([defaultSection]);
      setCurrentSectionId(defaultSection.id);
    }
  }, []);

  // Update form data when section changes
  useEffect(() => {
    if (currentSectionId) {
      setFormData(prev => ({
        ...prev,
        sectionId: currentSectionId,
      }));
    }
  }, [currentSectionId]);

  // Derived state
  const filteredMaterials = useMemo(() => {
    const materials = activeTab === 'imported' ? SAMPLE_IMPORTED_MATERIALS : SAMPLE_USED_MATERIALS;

    // Filter materials by current section if a section is selected
    if (currentSectionId) {
      // In a real app, you would filter based on the sectionId in the material data
      // For now, we'll just return all materials
      return materials;
    }

    return materials;
  }, [activeTab, currentSectionId]);

  const totalCost = useMemo(() => {
    return filteredMaterials.reduce((sum, material) => sum + material.price, 0);
  }, [filteredMaterials]);

  const handleSectionSelect = useCallback((sectionId: string) => {
    setCurrentSectionId(sectionId);
  }, []);

  const handleAddSection = useCallback((newSection: Section) => {
    setSections(prev => [...prev, newSection]);
    setCurrentSectionId(newSection.id);
  }, []);

  const [showAddSectionModal, setShowAddSectionModal] = useState(false);

  // Handlers
  const handleTemplateSelect = useCallback((templateKey: string) => {
    const template = MATERIAL_TEMPLATES[templateKey as keyof typeof MATERIAL_TEMPLATES];
    setFormData(prev => ({
      ...prev,
      name: template.name,
      category: template.category,
      unit: template.unit,
      quantity: '',
      location: '',
      status: 'received',
      specs: {},
      notes: '',
      sectionId: currentSectionId,
    }));
    setSelectedTemplateKey(templateKey);
  }, [currentSectionId]);

  const handleSpecChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      specs: { ...prev.specs, [field]: value },
    }));
  }, []);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!formData.name || !formData.category || !formData.unit || !formData.quantity) {
      alert('Please fill in all required fields');
      return;
    }

    if (!currentSectionId) {
      alert('Please select a section first');
      return;
    }

    const newEntry: MaterialEntry & { sectionId: string } = {
      id: Date.now().toString(),
      name: formData.name,
      category: formData.category,
      unit: formData.unit,
      quantity: parseFloat(formData.quantity),
      location: formData.location || '',
      status: formData.status,
      specs: formData.specs || {},
      notes: formData.notes || '',
      date: new Date().toLocaleDateString('en-IN'),
      sectionId: currentSectionId,
    };

    setMaterialEntries(prevEntries => [...prevEntries, newEntry]);
    resetForm();
    setShowMaterialForm(false);
    alert(`Material added to ${sections.find(s => s.id === currentSectionId)?.name || 'section'} successfully!`);
  }, [formData, currentSectionId, sections]);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      category: '',
      unit: '',
      quantity: '',
      location: '',
      status: 'received',
      specs: {},
      notes: '',
      sectionId: null,
    });
    setSelectedTemplateKey(null);
  }, []);

  const handleMaterialPress = useCallback((material: Material) => {
    // Navigate to material details or show bottom sheet
    console.log('Material pressed:', material);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <DetailsHeader
        totalCost={totalCost}
        onAddPress={() => setShowMaterialForm(true)}
      />

      {/* Section Manager */}
      <View style={styles.sectionContainer}>
        <SectionManager
          onSectionSelect={handleSectionSelect}
          selectedSection={currentSectionId}
        />
      </View>

      {/* Main Content */}
      {currentSectionId ? (
        <MaterialList
          materials={filteredMaterials}
          activeTab={activeTab}
          onMaterialPress={handleMaterialPress}
          onAddPress={() => setShowMaterialForm(true)}
          totalCost={totalCost}
        />
      ) : (
        <View style={styles.noSectionContainer}>
          <Text style={styles.noSectionText}>No section selected</Text>
          <TouchableOpacity
            style={styles.addSectionBtn}
            onPress={() => setShowAddSectionModal(true)}
          >
            <Text style={styles.addSectionBtnText}>+ Add New Section</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Material Form Modal */}
      <Modal
        visible={showMaterialForm}
        animationType="slide"
        onRequestClose={() => setShowMaterialForm(false)}
      >
        <MaterialForm
          formData={formData}
          selectedTemplateKey={selectedTemplateKey}
          specFields={selectedTemplateKey ? MATERIAL_TEMPLATES[selectedTemplateKey]?.specFields || [] : []}
          onTemplateSelect={handleTemplateSelect}
          onInputChange={handleInputChange}
          onSpecChange={handleSpecChange}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowMaterialForm(false);
            resetForm();
          }}
          materialTemplates={MATERIAL_TEMPLATES}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  noSectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noSectionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  addSectionBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addSectionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default Details;
