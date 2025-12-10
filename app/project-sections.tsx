import { domain } from '@/lib/domain';
import { ProjectSection } from '@/types/project';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

const ProjectSections = () => {
  const params = useLocalSearchParams();
  const { id, name, sectionData, materialAvailable, materialUsed } = params;

  const [sections, setSections] = useState<ProjectSection[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionType, setNewSectionType] = useState('building');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (sectionData) {
      const parsedData = JSON.parse(Array.isArray(sectionData) ? sectionData[0] : sectionData);
      setSections(parsedData);

      // If there's only one section and we're on this page, show a helpful message
      if (parsedData.length === 1) {
        console.log('Single section detected on sections page - user could have been redirected directly');
      }
    }
  }, [sectionData]);

  useEffect(() => {
    console.log('Project sections received materials:', {
      materialAvailableCount: materialAvailable ? JSON.parse(Array.isArray(materialAvailable) ? materialAvailable[0] : materialAvailable).length : 0,
      materialUsedCount: materialUsed ? JSON.parse(Array.isArray(materialUsed) ? materialUsed[0] : materialUsed).length : 0
    });
  }, [materialAvailable, materialUsed]);

  const getSectionIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'building':
      case 'buildings':
        return 'business';
      case 'rowhouse':
        return 'home';
      default:
        return 'grid';
    }
  };

  const handleViewDetails = (section: ProjectSection) => {
    console.log('Navigating to details with materials:', {
      sectionId: section._id || section.sectionId,
      passingMaterialsData: true
    });

    router.push({
      pathname: '../details',
      params: {
        projectId: id as string,
        projectName: name as string,
        sectionId: section._id || section.sectionId,
        sectionName: section.name,
        materialAvailable: materialAvailable as string,
        materialUsed: materialUsed as string
      }
    });
  };

  const handleAddSection = async () => {
    if (!newSectionName.trim()) {
      toast.error('Please enter a section name');
      return;
    }

    setIsAdding(true);
    try {
      const payload = {
        projectId: id,
        name: newSectionName.trim()
      };

      console.log('Adding section with payload:', payload);
      let res;

      // Use the correct API endpoint based on section type
      if (newSectionType === 'building') {
        res = await axios.post(`${domain}/api/building`, payload);
      } else if (newSectionType === 'rowhouse') {
        res = await axios.post(`${domain}/api/rowHouse`, payload);
      } else {
        res = await axios.post(`${domain}/api/otherSection`, payload);
      }

      console.log('Section API response:', JSON.stringify(res?.data, null, 2));
      console.log('Response status:', res?.status);

      // If we get a 200 status, the section was added successfully
      if (res && (res.status === 200 || res.status === 201)) {
        // Extract the new section data from response
        let newSectionData: any = null;
        const responseData = res.data as any;

        // Try different response structures
        if (responseData._id || responseData.sectionId) {
          newSectionData = responseData;
        } else if (responseData.section) {
          newSectionData = responseData.section;
        } else if (responseData.data) {
          newSectionData = responseData.data;
        } else if (responseData.building) {
          newSectionData = responseData.building;
        } else if (responseData.rowHouse) {
          newSectionData = responseData.rowHouse;
        } else if (responseData.otherSection) {
          newSectionData = responseData.otherSection;
        }

        // Create a formatted section even if we don't have full data
        const formattedSection: ProjectSection = {
          _id: newSectionData?._id || `temp-${Date.now()}`,
          sectionId: newSectionData?.sectionId || newSectionData?._id || `temp-${Date.now()}`,
          name: newSectionData?.name || newSectionName.trim(),
          type: newSectionType === 'building' ? 'Buildings' : (newSectionType === 'rowhouse' ? 'rowhouse' : 'other'),
          ...(newSectionData || {})
        };

        console.log('Formatted section to add:', formattedSection);

        setSections([...sections, formattedSection]);
        setShowAddModal(false);
        setNewSectionName('');
        setNewSectionType('building');
        toast.success('Section added successfully');
      } else {
        toast.error('Failed to add section');
      }
    } catch (error: any) {
      console.error('Error adding section:', error);
      console.error('Error response:', error?.response?.data);
      toast.error(error?.response?.data?.message || 'Failed to add section');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#0EA5E9" />
          </TouchableOpacity>
          <View>
            <Text style={styles.projectName}>{name}</Text>
            <Text style={styles.projectSubtitle}>Project Sections</Text>
          </View>
        </View>
      </View>

      {/* Sections List */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sections && sections.length > 0 ? (
          sections.map((section, index) => (
            <View key={section._id || index} style={styles.sectionCard}>
              <View style={styles.sectionContent}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons
                    name={getSectionIcon(section.type)}
                    size={24}
                    color="#0EA5E9"
                  />
                </View>
                <View style={styles.sectionInfo}>
                  <Text style={styles.sectionName}>{section.name}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => handleViewDetails(section)}
              >
                <Text style={styles.viewButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Sections Found</Text>
            <Text style={styles.emptySubtitle}>
              This project doesn't have any sections yet. Sections help organize your project materials and work areas.
            </Text>
            <TouchableOpacity
              style={styles.addSectionButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.addSectionButtonText}>Add Project Section</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add Section Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Section</Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Section Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Section Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Tower 1, Building A, Floor 2"
                placeholderTextColor="#94A3B8"
                value={newSectionName}
                onChangeText={setNewSectionName}
                autoFocus
              />
            </View>

            {/* Section Type Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Section Type</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    newSectionType === 'building' && styles.typeOptionActive
                  ]}
                  onPress={() => setNewSectionType('building')}
                >
                  <Ionicons
                    name="business"
                    size={20}
                    color={newSectionType === 'building' ? '#3B82F6' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.typeOptionText,
                      newSectionType === 'building' && styles.typeOptionTextActive
                    ]}
                  >
                    Building
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    newSectionType === 'rowhouse' && styles.typeOptionActive
                  ]}
                  onPress={() => setNewSectionType('rowhouse')}
                >
                  <Ionicons
                    name="home"
                    size={20}
                    color={newSectionType === 'rowhouse' ? '#3B82F6' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.typeOptionText,
                      newSectionType === 'rowhouse' && styles.typeOptionTextActive
                    ]}
                  >
                    Rowhouse
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    newSectionType === 'other' && styles.typeOptionActive
                  ]}
                  onPress={() => setNewSectionType('other')}
                >
                  <Ionicons
                    name="grid"
                    size={20}
                    color={newSectionType === 'other' ? '#3B82F6' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.typeOptionText,
                      newSectionType === 'other' && styles.typeOptionTextActive
                    ]}
                  >
                    Other
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
                disabled={isAdding}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addButton, isAdding && styles.addButtonDisabled]}
                onPress={handleAddSection}
                disabled={isAdding}
              >
                {isAdding ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.addButtonText}>Add Section</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  projectName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  projectSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionInfo: {
    flex: 1,
    marginRight: 8,
  },
  sectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flexShrink: 1,
  },
  viewButton: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flexShrink: 0,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 20,
    marginBottom: 24,
  },
  addSectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addSectionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1E293B',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
  },
  typeOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  typeOptionTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ProjectSections;