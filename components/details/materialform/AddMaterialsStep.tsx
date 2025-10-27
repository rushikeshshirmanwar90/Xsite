import React, { useRef } from 'react';
import { ScrollView, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import AddedMaterialsList from './AddedMaterialsList';
import MaterialDetailsForm from './MaterialDetailsForm';
import MaterialSpecifications from './MaterialSpecifications';
import MaterialTemplateSelector from './MaterialTemplateSelector';
import { sharedStyles } from './styles';
import { CustomSpec, InternalMaterial, MaterialFormData } from './types';

interface AddMaterialsStepProps {
  addedMaterials: InternalMaterial[];
  formData: MaterialFormData;
  selectedTemplateKey: string | null;
  customSpecs: CustomSpec[];
  specFields: string[];
  editingMaterialIndex: number | null;
  showUnitDropdown: boolean;
  showSpecDropdown: string | null;
  onTemplateSelect: (templateKey: string) => void;
  onInputChange: (field: string, value: string) => void;
  onSpecChange: (field: string, value: string | number) => void;
  onToggleUnitDropdown: () => void;
  onToggleSpecDropdown: (field: string) => void;
  onAddSpecClick: () => void;
  onRemoveCustomSpec: (index: number) => void;
  onAddMaterial: () => void;
  onEditMaterial: (index: number) => void;
  onRemoveMaterial: (index: number) => void;
  onClose: () => void;
}

const AddMaterialsStep: React.FC<AddMaterialsStepProps> = ({
  addedMaterials,
  formData,
  selectedTemplateKey,
  customSpecs,
  specFields,
  editingMaterialIndex,
  showUnitDropdown,
  showSpecDropdown,
  onTemplateSelect,
  onInputChange,
  onSpecChange,
  onToggleUnitDropdown,
  onToggleSpecDropdown,
  onAddSpecClick,
  onRemoveCustomSpec,
  onAddMaterial,
  onEditMaterial,
  onRemoveMaterial,
  onClose,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <ScrollView
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[sharedStyles.formScrollContent, { paddingBottom: 120 }]}
    >
      <View style={sharedStyles.formHeader}>
        <Text style={sharedStyles.formTitle}>Add Material Entries</Text>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
          <Text style={sharedStyles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      <AddedMaterialsList
        materials={addedMaterials}
        editingIndex={editingMaterialIndex}
        onEdit={onEditMaterial}
        onRemove={onRemoveMaterial}
      />

      <MaterialTemplateSelector
        selectedTemplateKey={selectedTemplateKey}
        onSelectTemplate={onTemplateSelect}
      />

      <MaterialDetailsForm
        formData={formData}
        onInputChange={onInputChange}
        showUnitDropdown={showUnitDropdown}
        onToggleUnitDropdown={onToggleUnitDropdown}
      />

      <MaterialSpecifications
        specFields={specFields}
        formData={formData}
        customSpecs={customSpecs}
        showSpecDropdown={showSpecDropdown}
        onSpecChange={onSpecChange}
        onToggleSpecDropdown={onToggleSpecDropdown}
        onAddSpecClick={onAddSpecClick}
        onRemoveCustomSpec={onRemoveCustomSpec}
      />

      <View style={styles.formButtonContainer}>
        <TouchableOpacity
          style={styles.addMaterialButton}
          onPress={onAddMaterial}
          activeOpacity={0.8}
        >
          <Text style={styles.addMaterialButtonText}>
            {editingMaterialIndex !== null ? '✓ Update Material' : '+ Add Material'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

type Styles = {
  [key: string]: ViewStyle | TextStyle | any;
};

const styles = StyleSheet.create<Styles>({
  formButtonContainer: {
    marginTop: 8,
  },
  addMaterialButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addMaterialButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});

export default AddMaterialsStep;
