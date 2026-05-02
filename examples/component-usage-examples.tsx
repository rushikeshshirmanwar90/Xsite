// ============================================================================
// REACT NATIVE COMPONENT EXAMPLES WITH BEARER TOKEN API CALLS
// ============================================================================

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { projectService, Project } from '@/services/projectService';
import { laborService, LaborEntry } from '@/services/laborService-updated';

// ============================================================================
// PROJECT LIST COMPONENT EXAMPLE
// ============================================================================

interface ProjectListProps {
  clientId: string;
}

export const ProjectListComponent: React.FC<ProjectListProps> = ({ clientId }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [clientId]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // API call with bearer token authentication
      const response = await projectService.getAllProjects(clientId);
      
      if (response.success) {
        setProjects(response.data);
      } else {
        setError(response.message || 'Failed to fetch projects');
      }
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      const newProject: Omit<Project, '_id' | 'createdAt' | 'updatedAt'> = {
        name: 'New Project',
        description: 'Project created from mobile app',
        clientId: clientId,
        status: 'active',
        startDate: new Date().toISOString(),
      };

      // API call with bearer token authentication
      const response = await projectService.createProject(newProject);
      
      if (response.success) {
        Alert.alert('Success', 'Project created successfully');
        fetchProjects(); // Refresh the list
      } else {
        Alert.alert('Error', response.message || 'Failed to create project');
      }
    } catch (error: any) {
      console.error('Error creating project:', error);
      Alert.alert('Error', error.message || 'An error occurred');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this project?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              // API call with bearer token authentication
              const response = await projectService.deleteProject(projectId);
              
              if (response.success) {
                Alert.alert('Success', 'Project deleted successfully');
                fetchProjects(); // Refresh the list
              } else {
                Alert.alert('Error', response.message || 'Failed to delete project');
              }
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error deleting project:', error);
      Alert.alert('Error', error.message || 'An error occurred');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={{ marginTop: 10 }}>Loading projects...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', textAlign: 'center', marginBottom: 20 }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={fetchProjects}
          style={{ backgroundColor: '#0066cc', padding: 10, borderRadius: 5 }}
        >
          <Text style={{ color: 'white' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Projects ({projects.length})
      </Text>
      
      <TouchableOpacity
        onPress={handleCreateProject}
        style={{ backgroundColor: '#28a745', padding: 15, borderRadius: 5, marginBottom: 20 }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          Create New Project
        </Text>
      </TouchableOpacity>

      {projects.map((project) => (
        <View
          key={project._id}
          style={{
            backgroundColor: '#f8f9fa',
            padding: 15,
            borderRadius: 8,
            marginBottom: 10,
            borderLeftWidth: 4,
            borderLeftColor: project.status === 'active' ? '#28a745' : '#6c757d'
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 5 }}>
            {project.name}
          </Text>
          <Text style={{ color: '#6c757d', marginBottom: 5 }}>
            {project.description}
          </Text>
          <Text style={{ fontSize: 12, color: '#6c757d', marginBottom: 10 }}>
            Status: {project.status} | Created: {new Date(project.createdAt || '').toLocaleDateString()}
          </Text>
          
          <TouchableOpacity
            onPress={() => handleDeleteProject(project._id!)}
            style={{ backgroundColor: '#dc3545', padding: 8, borderRadius: 4, alignSelf: 'flex-start' }}
          >
            <Text style={{ color: 'white', fontSize: 12 }}>Delete</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

// ============================================================================
// LABOR MANAGEMENT COMPONENT EXAMPLE
// ============================================================================

interface LaborManagementProps {
  projectId: string;
  sectionId: string;
  miniSectionId?: string;
}

export const LaborManagementComponent: React.FC<LaborManagementProps> = ({
  projectId,
  sectionId,
  miniSectionId
}) => {
  const [laborEntries, setLaborEntries] = useState<LaborEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    fetchLaborEntries();
  }, [projectId, sectionId, miniSectionId]);

  const fetchLaborEntries = async () => {
    try {
      setLoading(true);
      setError(null);

      // API call with bearer token authentication
      const response = await laborService.getLaborEntries(projectId, sectionId, miniSectionId);
      
      if (response.success) {
        setLaborEntries(response.data.laborEntries);
        setTotalCost(response.data.totalCost);
      } else {
        setError(response.message || 'Failed to fetch labor entries');
      }
    } catch (error: any) {
      console.error('Error fetching labor entries:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLaborEntry = async () => {
    try {
      const newLaborEntry: Omit<LaborEntry, '_id' | 'createdAt' | 'updatedAt'> = {
        type: 'Manual',
        category: 'Construction',
        count: 5,
        perLaborCost: 500,
        totalCost: 2500,
        projectId: projectId,
        sectionId: sectionId,
        miniSectionId: miniSectionId,
      };

      // API call with bearer token authentication
      const response = await laborService.addLaborEntry(newLaborEntry);
      
      if (response.success) {
        Alert.alert('Success', 'Labor entry added successfully');
        fetchLaborEntries(); // Refresh the list
      } else {
        Alert.alert('Error', response.message || 'Failed to add labor entry');
      }
    } catch (error: any) {
      console.error('Error adding labor entry:', error);
      Alert.alert('Error', error.message || 'An error occurred');
    }
  };

  const handleDeleteLaborEntry = async (laborId: string) => {
    try {
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this labor entry?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              // API call with bearer token authentication
              const response = await laborService.deleteLaborEntry(laborId);
              
              if (response.success) {
                Alert.alert('Success', 'Labor entry deleted successfully');
                fetchLaborEntries(); // Refresh the list
              } else {
                Alert.alert('Error', response.message || 'Failed to delete labor entry');
              }
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error deleting labor entry:', error);
      Alert.alert('Error', error.message || 'An error occurred');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={{ marginTop: 10 }}>Loading labor entries...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', textAlign: 'center', marginBottom: 20 }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={fetchLaborEntries}
          style={{ backgroundColor: '#0066cc', padding: 10, borderRadius: 5 }}
        >
          <Text style={{ color: 'white' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>
        Labor Management
      </Text>
      
      <Text style={{ fontSize: 16, color: '#6c757d', marginBottom: 20 }}>
        Total Entries: {laborEntries.length} | Total Cost: ₹{totalCost.toLocaleString()}
      </Text>
      
      <TouchableOpacity
        onPress={handleAddLaborEntry}
        style={{ backgroundColor: '#28a745', padding: 15, borderRadius: 5, marginBottom: 20 }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          Add Labor Entry
        </Text>
      </TouchableOpacity>

      {laborEntries.map((entry) => (
        <View
          key={entry._id}
          style={{
            backgroundColor: '#f8f9fa',
            padding: 15,
            borderRadius: 8,
            marginBottom: 10,
            borderLeftWidth: 4,
            borderLeftColor: '#0066cc'
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>
            {entry.category} - {entry.type}
          </Text>
          <Text style={{ color: '#6c757d', marginBottom: 5 }}>
            Count: {entry.count} | Per Labor Cost: ₹{entry.perLaborCost}
          </Text>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#28a745', marginBottom: 10 }}>
            Total Cost: ₹{entry.totalCost.toLocaleString()}
          </Text>
          
          <TouchableOpacity
            onPress={() => handleDeleteLaborEntry(entry._id!)}
            style={{ backgroundColor: '#dc3545', padding: 8, borderRadius: 4, alignSelf: 'flex-start' }}
          >
            <Text style={{ color: 'white', fontSize: 12 }}>Delete</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

// ============================================================================
// CUSTOM HOOK FOR API CALLS
// ============================================================================

export const useApiCall = <T,>(apiFunction: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction();
      setData(result);
      return result;
    } catch (error: any) {
      console.error('API call failed:', error);
      setError(error.message || 'An error occurred');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, execute };
};