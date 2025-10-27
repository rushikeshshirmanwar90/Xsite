import { addSection } from '@/functions/details';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { toast } from 'sonner-native';

type Section = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
};

type SectionManagerProps = {
  onSectionSelect: (sectionId: string) => void;
  selectedSection: string | null;
  onAddSection?: (newSection: Section) => void;
  sections?: Section[];
  style?: any;
  compact?: boolean;
  projectDetails?: {
    projectName: string;
    projectId: string;
  };
  mainSectionDetails?: {
    sectionName: string;
    sectionId: string;
  };
};

const SectionManager: React.FC<SectionManagerProps> = ({
  onSectionSelect,
  selectedSection,
  sections: propSections,
  style,
  compact = false,
  projectDetails,
  mainSectionDetails
}) => {
  const [sections, setSections] = useState<Section[]>(propSections || []);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionDesc, setNewSectionDesc] = useState('');

  // Use provided sections or add a default section if none exists
  useEffect(() => {
    if (propSections && propSections.length > 0) {
      setSections(propSections);
    } else if (sections.length === 0) {
      const defaultSection = {
        id: 'default-section',
        name: 'General',
        description: 'Default section for all materials',
        createdAt: new Date().toISOString(),
      };
      setSections([defaultSection]);
      onSectionSelect(defaultSection.id);
    }
  }, [propSections]);

  const handleAddSection = async () => {
    if (!newSectionName.trim()) return;



    const newSection: Section = {
      id: `section-${Date.now()}`,
      name: newSectionName.trim(),
      description: newSectionDesc.trim(),
      createdAt: new Date().toISOString(),
    };

    // Log data in the required format
    const sectionData = {
      name: newSectionName.trim(),
      projectDetails: projectDetails || {
        projectName: "projectname",
        projectId: "1245"
      },
      mainSectionDetails: mainSectionDetails || {
        sectionName: "tower A",
        sectionId: "sec124"
      }
    };

    console.log(sectionData);
    const res = await addSection(sectionData);
    if(res){
     toast.success("Section added successfully"); 
    } else {
      toast.error("Failed to add section");
    }
    setSections([...sections, newSection]);
    setNewSectionName('');
    setNewSectionDesc('');
    setShowAddSectionModal(false);
    onSectionSelect(newSection.id);
  };

  if (sections.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No sections found</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddSectionModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add Section</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, compact && styles.compactContainer, style]}>
      <View style={[styles.sectionSelector, compact && styles.compactSelector]}>
        <Picker
          selectedValue={selectedSection || sections[0]?.id}
          style={[styles.picker, compact && styles.compactPicker]}
          onValueChange={(itemValue) => onSectionSelect(itemValue)}
          dropdownIconColor="#000"
        >
          {sections.map((section) => (
            <Picker.Item
              key={section.id}
              label={section.name}
              value={section.id}
            />
          ))}
        </Picker>
        <TouchableOpacity
          style={[styles.addSectionButton, compact && styles.compactAddButton]}
          onPress={() => setShowAddSectionModal(true)}
        >
          <MaterialIcons name="add" size={compact ? 20 : 24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Add Section Modal */}
      <Modal
        visible={showAddSectionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddSectionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Section</Text>

            <Text style={styles.label}>Section Name *</Text>
            <TextInput
              style={styles.input}
              value={newSectionName}
              onChangeText={setNewSectionName}
              placeholder="e.g., Base, First Slab, Second Slab"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newSectionDesc}
              onChangeText={setNewSectionDesc}
              placeholder="Add a description for this section"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddSectionModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={handleAddSection}
                disabled={!newSectionName.trim()}
              >
                <Text style={styles.addButtonText}>Add Section</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  compactContainer: {
    marginBottom: 0,
    width: '100%',
  },
  sectionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  compactSelector: {
    elevation: 0,
    shadowOpacity: 0,
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingLeft: 0,
  },
  picker: {
    flex: 1,
    height: 50,
    color: '#333',
  },
  compactPicker: {
    height: 48,
    color: '#1F2937',
    fontSize: 20,
    fontWeight: '700',
  },
  addSectionButton: {
    backgroundColor: '#3B82F6',
    height: 40,
    width: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactAddButton: {
    height: 36,
    width: 36,
    borderRadius: 8,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1F2937',
  },
  label: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 12,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#4B5563',
    fontWeight: '500',
  },
});

export default SectionManager;
