import { Ionicons } from '@expo/vector-icons';
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
  showAddForm: boolean;
  scrollViewRef?: React.RefObject<ScrollView>;
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
  onShowAddForm: () => void;
  onCancelEdit: () => void;
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
  showAddForm,
  scrollViewRef: externalScrollViewRef,
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
  onShowAddForm,
  onCancelEdit,
  onClose,
}) => {
  const internalScrollViewRef = useRef<ScrollView>(null);
  const scrollViewRef = externalScrollViewRef || internalScrollViewRef;

  return (
    <ScrollView
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[sharedStyles.formScrollContent, { paddingBottom: 120 }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <View style={sharedStyles.formHeader}>
        <Text style={sharedStyles.formTitle}>
          {editingMaterialIndex !== null ? 'Edit Material Entry' : 'Add Material Entries'}
        </Text>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
          <Text style={sharedStyles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Editing Mode Banner */}
      {editingMaterialIndex !== null && (
        <View style={styles.editingBanner}>
          <Ionicons name="create" size={16} color="#F59E0B" />
          <Text style={styles.editingBannerText}>
            Editing material #{editingMaterialIndex + 1}
          </Text>
        </View>
      )}

      <AddedMaterialsList
        materials={addedMaterials}
        editingIndex={editingMaterialIndex}
        onEdit={onEditMaterial}
        onRemove={onRemoveMaterial}
      />

      {/* Show empty state message when no materials and form is hidden */}
      {!showAddForm && addedMaterials.length === 0 && (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="cube-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyStateTitle}>No Materials Added Yet</Text>
          <Text style={styles.emptyStateDescription}>
            Start by adding your first material using the form below
          </Text>
        </View>
      )}

      {/* Show "Add More Material" button when form is hidden and materials exist */}
      {!showAddForm && addedMaterials.length > 0 && (
        <View style={styles.addMoreButtonContainer}>
          <View style={styles.separatorContainer}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>Ready to add more?</Text>
            <View style={styles.separatorLine} />
          </View>
          <TouchableOpacity
            style={styles.addMoreButton}
            onPress={onShowAddForm}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.addMoreButtonText}>Add More Material</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Show form when showAddForm is true */}
      {showAddForm && (
        <>
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
            {editingMaterialIndex !== null ? (
              // Editing mode: Show Update and Cancel buttons
              <View style={styles.editingButtonsContainer}>
                <TouchableOpacity
                  style={styles.cancelEditButton}
                  onPress={onCancelEdit}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={20} color="#EF4444" style={{ marginRight: 8 }} />
                  <Text style={styles.cancelEditButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.updateMaterialButton}
                  onPress={onAddMaterial}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.updateMaterialButtonText}>Update Material</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Adding mode: Show regular Add button
              <TouchableOpacity
                style={styles.addMaterialButton}
                onPress={onAddMaterial}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.addMaterialButtonText}>Add Material</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
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
  addMoreButtonContainer: {
    marginVertical: 20,
    alignItems: 'center' as const,
  },
  separatorContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  separatorText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500' as const,
  },
  addMoreButton: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 200,
  },
  addMoreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  emptyStateContainer: {
    alignItems: 'center' as const,
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#374151',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  editingBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  editingBannerText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500' as const,
  },
  editingButtonsContainer: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  cancelEditButton: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    flex: 1,
  },
  cancelEditButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  updateMaterialButton: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    flex: 1,
  },
  updateMaterialButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});

export default AddMaterialsStep;
