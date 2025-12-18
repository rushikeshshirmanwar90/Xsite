import BarChart from '@/components/BarChart';
import { isAdmin, useUser } from '@/hooks/useUser';
import { domain } from '@/lib/domain';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { toast } from 'sonner-native';

export default function ProjectDetails() {
  const { id } = useLocalSearchParams();
  
  // Mock data - replace with actual API calls
  const mockProjects = [
    {
      id: id as string,
      name: 'Sample Project',
      status: 'active',
      totalBudget: 1000000,
      budgetUsed: 750000,
      progress: 75,
      color: '#4CAF50'
    }
  ];
  
  const mockBuildingSections = [
    {
      id: '1',
      projectId: id as string,
      name: 'Foundation',
      budgetUsed: 200000,
      budgetAllocated: 300000,
      progress: 80,
      color: '#4CAF50',
      status: 'active',
      daysCompleted: 20,
      daysRequired: 25
    }
  ];
  
  const project = mockProjects.find((p: any) => p.id === id);
  const buildingSections = mockBuildingSections.filter((section: any) => section.projectId === id);
  
  // Admin authentication
  const { user } = useUser();
  const userIsAdmin = isAdmin(user);
  
  // Edit project state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProjectName, setEditProjectName] = useState(project?.name || '');
  const [editProjectBudget, setEditProjectBudget] = useState(project?.totalBudget?.toString() || '');
  const [editProjectStatus, setEditProjectStatus] = useState(project?.status || 'active');
  const [loading, setLoading] = useState(false);

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Project not found</Text>
      </View>
    );
  }

  const barChartData = buildingSections.map(section => ({
    id: section.id,
    label: section.name,
    value: section.budgetUsed,
    maxValue: section.budgetAllocated,
    color: section.color,
    status: section.status,
  }));

  const handleSectionPress = (sectionId: string) => {
    const section = buildingSections.find((s: any) => s.id === sectionId);
    if (section) {
      router.push({
        pathname: '/details',
        params: {
          projectId: project?.id,
          sectionId: section.id,
          sectionName: section.name
        }
      });
    }
  };

  // Handle edit project
  const handleEditProject = async () => {
    if (!userIsAdmin) {
      toast.error('Only admins can edit projects');
      return;
    }

    if (!editProjectName.trim()) {
      toast.error('Project name is required');
      return;
    }

    if (!editProjectBudget.trim() || isNaN(Number(editProjectBudget))) {
      toast.error('Valid budget is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${domain}/api/project/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editProjectName.trim(),
          totalBudget: Number(editProjectBudget),
          status: editProjectStatus,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Project updated successfully');
        setShowEditModal(false);
        // Refresh the page or update local state
        router.back();
      } else {
        throw new Error(data.message || 'Failed to update project');
      }
    } catch (error: any) {
      console.error('Error updating project:', error);
      toast.error(error.message || 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete project
  const handleDeleteProject = () => {
    if (!userIsAdmin) {
      toast.error('Only admins can delete projects');
      return;
    }

    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project?.name}"? This action cannot be undone and will remove all associated data.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDeleteProject,
        },
      ]
    );
  };

  const confirmDeleteProject = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${domain}/api/project/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Project deleted successfully');
        router.replace('/');
      } else {
        throw new Error(data.message || 'Failed to delete project');
      }
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast.error(error.message || 'Failed to delete project');
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal with current project data
  const openEditModal = () => {
    if (!userIsAdmin) {
      toast.error('Only admins can edit projects');
      return;
    }
    
    setEditProjectName(project?.name || '');
    setEditProjectBudget(project?.totalBudget?.toString() || '');
    setEditProjectStatus(project?.status || 'active');
    setShowEditModal(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.projectName}>{project.name}</Text>
            <Text style={styles.projectStatus}>
              Status: {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </Text>
          </View>
          
          {/* Admin Controls */}
          {userIsAdmin && (
            <View style={styles.adminControls}>
              <TouchableOpacity 
                onPress={openEditModal} 
                style={styles.adminButton}
                disabled={loading}
              >
                <Ionicons name="create-outline" size={20} color="#4CAF50" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleDeleteProject} 
                style={styles.adminButton}
                disabled={loading}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Project Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                ${(project.totalBudget / 1000000).toFixed(1)}M
              </Text>
              <Text style={styles.statLabel}>Total Budget</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                ${(project.budgetUsed / 1000000).toFixed(1)}M
              </Text>
              <Text style={styles.statLabel}>Budget Used</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{project.progress}%</Text>
              <Text style={styles.statLabel}>Progress</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${project.progress}%`,
                  backgroundColor: project.color,
                },
              ]}
            />
          </View>
        </View>

        {/* Building Sections Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Budget by Building Section</Text>
          <BarChart
            data={barChartData}
            onBarPress={handleSectionPress}
            title="Building Sections Budget Analysis"
          />
        </View>

        {/* Building Sections List */}
        <View style={styles.sectionsSection}>
          <Text style={styles.sectionTitle}>Building Sections Details</Text>
          {buildingSections.map((section: any) => (
            <TouchableOpacity
              key={section.id}
              style={styles.sectionCard}
              onPress={() => handleSectionPress(section.id)}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionInfo}>
                  <Text style={styles.sectionName}>{section.name}</Text>
                  <Text style={styles.sectionStatus}>
                    {section.status.charAt(0).toUpperCase() + section.status.slice(1)}
                  </Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: section.color }]} />
              </View>

              <View style={styles.sectionStats}>
                <View style={styles.sectionStat}>
                  <Text style={styles.sectionStatValue}>
                    ${(section.budgetUsed / 1000).toFixed(0)}k
                  </Text>
                  <Text style={styles.sectionStatLabel}>Used</Text>
                </View>
                <View style={styles.sectionStat}>
                  <Text style={styles.sectionStatValue}>
                    ${(section.budgetAllocated / 1000).toFixed(0)}k
                  </Text>
                  <Text style={styles.sectionStatLabel}>Allocated</Text>
                </View>
                <View style={styles.sectionStat}>
                  <Text style={styles.sectionStatValue}>{section.progress}%</Text>
                  <Text style={styles.sectionStatLabel}>Progress</Text>
                </View>
              </View>

              <View style={styles.sectionProgress}>
                <Text style={styles.sectionProgressText}>
                  {section.daysCompleted}/{section.daysRequired} days
                </Text>
                <View style={styles.sectionProgressBarContainer}>
                  <View
                    style={[
                      styles.sectionProgressBar,
                      {
                        width: `${section.progress}%`,
                        backgroundColor: section.color,
                      },
                    ]}
                  />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Edit Project Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Project</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Project Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Project Name *</Text>
              <TextInput
                style={styles.textInput}
                value={editProjectName}
                onChangeText={setEditProjectName}
                placeholder="Enter project name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Budget */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Total Budget *</Text>
              <TextInput
                style={styles.textInput}
                value={editProjectBudget}
                onChangeText={setEditProjectBudget}
                placeholder="Enter total budget"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            {/* Status */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusContainer}>
                {['active', 'completed', 'on-hold', 'cancelled'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      editProjectStatus === status && styles.statusOptionSelected
                    ]}
                    onPress={() => setEditProjectStatus(status)}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      editProjectStatus === status && styles.statusOptionTextSelected
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowEditModal(false)}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleEditProject}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  projectName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  projectStatus: {
    fontSize: 14,
    color: '#ccc',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#2a3f5f',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  chartSection: {
    padding: 20,
    backgroundColor: '#16213e',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a3f5f',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  sectionStatus: {
    fontSize: 12,
    color: '#ccc',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sectionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionStat: {
    alignItems: 'center',
  },
  sectionStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 2,
  },
  sectionStatLabel: {
    fontSize: 11,
    color: '#ccc',
  },
  sectionProgress: {
    marginTop: 8,
  },
  sectionProgressText: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 4,
  },
  sectionProgressBarContainer: {
    height: 4,
    backgroundColor: '#2a3f5f',
    borderRadius: 2,
    overflow: 'hidden',
  },
  sectionProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  errorText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 50,
  },
  // Admin Controls Styles
  adminControls: {
    flexDirection: 'row',
    gap: 8,
  },
  adminButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16213e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a3f5f',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  statusOptionSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusOptionTextSelected: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
