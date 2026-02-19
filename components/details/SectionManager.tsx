import { addSection, deleteSection, updateSection } from '@/functions/details';
import { useSimpleNotifications } from '@/hooks/useSimpleNotifications';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { toast } from 'sonner-native';
import { logMiniSectionCreated, logMiniSectionUpdated, logMiniSectionDeleted } from '@/utils/activityLogger';

type Section = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
};

type SectionManagerProps = {
  onSectionSelect: (sectionId: string) => void;
  selectedSection: string | null;
  onAddSection?: (newSection: Section) => Promise<void> | void;
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
  miniSectionCompletions?: {[key: string]: boolean};
  onToggleMiniSectionCompletion?: (miniSectionId: string, miniSectionName: string) => void;
  isUpdatingCompletion?: boolean;
};

const SectionManager: React.FC<SectionManagerProps> = ({
  onSectionSelect,
  selectedSection,
  onAddSection,
  sections: propSections,
  style,
  compact = false,
  projectDetails,
  mainSectionDetails,
  miniSectionCompletions = {},
  onToggleMiniSectionCompletion,
  isUpdatingCompletion = false
}) => {
  const [sections, setSections] = useState<Section[]>(propSections || []);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionDesc, setNewSectionDesc] = useState('');

  // ✅ Add notification hook
  const { sendProjectNotification } = useSimpleNotifications();

  // Use provided sections or add a default section if none exists
  useEffect(() => {
    if (propSections && propSections.length > 0) {
      setSections(propSections);
      
      // Safety check: if currently selected section doesn't exist in new sections, select first one
      if (selectedSection && !propSections.find(s => s.id === selectedSection)) {
        const allSectionsOption = propSections.find(s => s.id === 'all-sections');
        const firstSection = allSectionsOption || propSections[0];
        if (firstSection) {
          onSectionSelect(firstSection.id);
        }
      }
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

    console.log('Adding section:', sectionData);
    // ✅ Pass notification callback to function
    const res: any = await addSection(sectionData, sendProjectNotification);
    
    console.log('\n========================================');
    console.log('ADD SECTION - API RESPONSE');
    console.log('========================================');
    console.log('Full response:', JSON.stringify(res, null, 2));
    console.log('========================================\n');
    
    if (res && res.success) {
      toast.success("Section added successfully");
      
      // Use the section data returned from the API
      const newSection: Section = {
        id: res.section?._id || res.data?._id || `section-${Date.now()}`,
        name: res.section?.name || res.data?.name || newSectionName.trim(),
        description: res.section?.description || res.data?.description || newSectionDesc.trim(),
        createdAt: res.section?.createdAt || res.data?.createdAt || new Date().toISOString(),
      };
      
      console.log('New section created:', newSection);

      // Log mini-section creation activity
      try {
        await logMiniSectionCreated(
          sectionData.projectDetails.projectId,
          sectionData.projectDetails.projectName,
          sectionData.mainSectionDetails.sectionId,
          sectionData.mainSectionDetails.sectionName,
          newSection.id,
          newSection.name
        );
        console.log('✅ Mini-section creation activity logged successfully');
      } catch (error) {
        console.error('❌ Failed to log mini-section creation activity:', error);
        // Don't break the flow if activity logging fails
      }
      
      // Add the new section to the list
      const updatedSections = [...sections, newSection];
      setSections(updatedSections);
      
      // Call the onAddSection callback if provided
      if (onAddSection) {
        await onAddSection(newSection);
      }
      
      // Clear form and close modal
      setNewSectionName('');
      setNewSectionDesc('');
      setShowAddSectionModal(false);
      
      // Select the newly added section
      onSectionSelect(newSection.id);
    } else {
      toast.error("Failed to add section");
      console.error('Add section failed:', res);
    }
  };

  const handleEditSection = (section: Section) => {
    setEditingSectionId(section.id);
    setNewSectionName(section.name);
    setNewSectionDesc(section.description || '');
    setShowEditModal(true);
  };

  const handleUpdateSection = async () => {
    if (!newSectionName.trim() || !editingSectionId) return;

    const updateData = {
      name: newSectionName.trim(),
      description: newSectionDesc.trim(),
    };

    // Get the current section for logging
    const currentSection = sections.find(s => s.id === editingSectionId);
    const oldName = currentSection?.name || '';
    const oldDescription = currentSection?.description || '';

    console.log('Updating section:', editingSectionId, updateData);
    // ✅ Pass notification callback to function
    const res: any = await updateSection(editingSectionId, updateData, sendProjectNotification);

    console.log('\n========================================');
    console.log('UPDATE SECTION - API RESPONSE');
    console.log('========================================');
    console.log('Full response:', JSON.stringify(res, null, 2));
    console.log('========================================\n');

    if (res && res.success) {
      toast.success("Section updated successfully");

      // Log mini-section update activity
      try {
        const changedData = [];
        if (oldName !== newSectionName.trim()) {
          changedData.push({
            field: 'name',
            oldValue: oldName,
            newValue: newSectionName.trim()
          });
        }
        if (oldDescription !== newSectionDesc.trim()) {
          changedData.push({
            field: 'description',
            oldValue: oldDescription,
            newValue: newSectionDesc.trim()
          });
        }

        await logMiniSectionUpdated(
          projectDetails?.projectId || "1245",
          projectDetails?.projectName || "projectname",
          mainSectionDetails?.sectionId || "sec124",
          mainSectionDetails?.sectionName || "tower A",
          editingSectionId,
          newSectionName.trim(),
          changedData.length > 0 ? changedData : undefined,
          changedData.length > 0 ? `Updated ${changedData.map(c => c.field).join(', ')}` : undefined
        );
        console.log('✅ Mini-section update activity logged successfully');
      } catch (error) {
        console.error('❌ Failed to log mini-section update activity:', error);
        // Don't break the flow if activity logging fails
      }

      // Update the section in local state
      const updatedSections = sections.map(s =>
        s.id === editingSectionId
          ? { ...s, name: newSectionName.trim(), description: newSectionDesc.trim() }
          : s
      );
      setSections(updatedSections);

      // Call the onAddSection callback to refresh from server
      if (onAddSection) {
        const updatedSection: Section = {
          id: editingSectionId,
          name: newSectionName.trim(),
          description: newSectionDesc.trim(),
          createdAt: sections.find(s => s.id === editingSectionId)?.createdAt || new Date().toISOString(),
        };
        await onAddSection(updatedSection);
      }

      // Clear form and close modal
      setNewSectionName('');
      setNewSectionDesc('');
      setEditingSectionId(null);
      setShowEditModal(false);
    } else {
      toast.error("Failed to update section");
      console.error('Update section failed:', res);
    }
  };

  const handleDeleteSection = (section: Section) => {
    Alert.alert(
      'Delete Section',
      `Are you sure you want to delete "${section.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('Deleting section:', section.id);
            
            // ✅ Prepare section data for notification
            const sectionData = {
              name: section.name,
              projectId: projectDetails?.projectId,
              projectName: projectDetails?.projectName,
            };
            
            // ✅ Pass notification callback to function
            const res: any = await deleteSection(section.id, sectionData, sendProjectNotification);

            console.log('\n========================================');
            console.log('DELETE SECTION - API RESPONSE');
            console.log('========================================');
            console.log('Full response:', JSON.stringify(res, null, 2));
            console.log('========================================\n');

            if (res && res.success) {
              toast.success("Section deleted successfully");

              // Log mini-section deletion activity
              try {
                await logMiniSectionDeleted(
                  projectDetails?.projectId || "1245",
                  projectDetails?.projectName || "projectname",
                  mainSectionDetails?.sectionId || "sec124",
                  mainSectionDetails?.sectionName || "tower A",
                  section.id,
                  section.name
                );
                console.log('✅ Mini-section deletion activity logged successfully');
              } catch (error) {
                console.error('❌ Failed to log mini-section deletion activity:', error);
                // Don't break the flow if activity logging fails
              }

              // Remove from local state
              const updatedSections = sections.filter(s => s.id !== section.id);
              
              // If deleted section was selected, select a safe option before updating state
              if (selectedSection === section.id) {
                // Try to select 'all-sections' first, or the first available section
                const allSectionsOption = updatedSections.find(s => s.id === 'all-sections');
                const nextSection = allSectionsOption || updatedSections[0];
                
                if (nextSection) {
                  onSectionSelect(nextSection.id);
                } else {
                  // No sections left, select null or a default
                  onSectionSelect('all-sections');
                }
              }
              
              // Update local state after selecting new section
              setSections(updatedSections);

              // Call the onAddSection callback to refresh from server
              if (onAddSection) {
                try {
                  await onAddSection(section);
                } catch (error) {
                  console.error('Error refreshing sections after delete:', error);
                }
              }
            } else {
              toast.error("Failed to delete section");
              console.error('Delete section failed:', res);
            }
          },
        },
      ]
    );
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

  // Safety check: ensure we have a valid selected section
  const safeSelectedSection = selectedSection && sections.find(s => s.id === selectedSection)
    ? selectedSection
    : sections[0]?.id;
  
  const currentSection = sections.find(s => s.id === safeSelectedSection);

  return (
    <View style={[styles.container, compact && styles.compactContainer, style]}>
      <View style={[styles.sectionSelector, compact && styles.compactSelector]}>
        <Picker
          selectedValue={safeSelectedSection}
          style={[styles.picker, compact && styles.compactPicker]}
          onValueChange={(itemValue) => {
            if (itemValue && sections.find(s => s.id === itemValue)) {
              onSectionSelect(itemValue);
            }
          }}
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
        <View style={styles.actionButtons}>
          {currentSection && currentSection.id !== 'all-sections' && currentSection.id !== 'default-section' && (
            <>
              <TouchableOpacity
                style={[styles.iconButton, compact && styles.compactIconButton]}
                onPress={() => handleEditSection(currentSection)}
              >
                <MaterialIcons name="edit" size={compact ? 18 : 20} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, compact && styles.compactIconButton]}
                onPress={() => handleDeleteSection(currentSection)}
              >
                <MaterialIcons name="delete" size={compact ? 18 : 20} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            style={[styles.addSectionButton, compact && styles.compactAddButton]}
            onPress={() => setShowAddSectionModal(true)}
          >
            <MaterialIcons name="add" size={compact ? 20 : 24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mini-Section Completion Button */}
      {currentSection && 
       currentSection.id !== 'all-sections' && 
       currentSection.id !== 'default-section' && 
       onToggleMiniSectionCompletion && (
        <TouchableOpacity
          style={[
            styles.miniSectionCompletionButton,
            miniSectionCompletions[currentSection.id] && styles.miniSectionCompletionButtonCompleted,
            isUpdatingCompletion && styles.miniSectionCompletionButtonDisabled
          ]}
          onPress={() => {
            console.log('🎯 SECTION_MANAGER: Button pressed for:', currentSection.name);
            console.log('🎯 SECTION_MANAGER: currentSection.id:', currentSection.id);
            console.log('🎯 SECTION_MANAGER: miniSectionCompletions:', miniSectionCompletions);
            console.log('🎯 SECTION_MANAGER: miniSectionCompletions[currentSection.id]:', miniSectionCompletions[currentSection.id]);
            console.log('🎯 SECTION_MANAGER: Should show completed?', !!miniSectionCompletions[currentSection.id]);
            onToggleMiniSectionCompletion(currentSection.id, currentSection.name);
          }}
          disabled={isUpdatingCompletion}
        >
          <MaterialIcons 
            name={miniSectionCompletions[currentSection.id] ? "check-circle" : "radio-button-unchecked"} 
            size={16} 
            color={miniSectionCompletions[currentSection.id] ? "#059669" : "#6B7280"} 
          />
          <Text style={[
            styles.miniSectionCompletionButtonText,
            miniSectionCompletions[currentSection.id] && styles.miniSectionCompletionButtonTextCompleted
          ]}>
            {(() => {
              const isCompleted = miniSectionCompletions[currentSection.id];
              const buttonText = isUpdatingCompletion ? 'Updating...' : `${currentSection.name} Work ${isCompleted ? 'Completed' : 'Complete'}`;
              console.log(`🎨 SECTION_MANAGER: Rendering ${currentSection.name} - isCompleted: ${isCompleted}, text: "${buttonText}"`);
              return buttonText;
            })()}
          </Text>
        </TouchableOpacity>
      )}

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
                onPress={() => {
                  setShowAddSectionModal(false);
                  setNewSectionName('');
                  setNewSectionDesc('');
                }}
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

      {/* Edit Section Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Section</Text>

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
                onPress={() => {
                  setShowEditModal(false);
                  setNewSectionName('');
                  setNewSectionDesc('');
                  setEditingSectionId(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.updateButton]}
                onPress={handleUpdateSection}
                disabled={!newSectionName.trim()}
              >
                <Text style={styles.addButtonText}>Update</Text>
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
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    height: 40,
    width: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  compactIconButton: {
    height: 36,
    width: 36,
    borderRadius: 8,
    margin: 2,
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
    margin: 2,
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
  updateButton: {
    backgroundColor: '#10B981',
  },
  miniSectionCompletionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginTop: 8,
  },
  miniSectionCompletionButtonCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  miniSectionCompletionButtonDisabled: {
    opacity: 0.6,
  },
  miniSectionCompletionButtonText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  miniSectionCompletionButtonTextCompleted: {
    color: '#059669',
  },
});

export default SectionManager;
