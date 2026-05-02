// ============================================================================
// PROJECT SERVICE WITH BEARER TOKEN AUTHENTICATION
// ============================================================================

import { apiService } from './apiService';

// ============================================================================
// INTERFACES
// ============================================================================

export interface Project {
  _id?: string;
  name: string;
  description?: string;
  clientId: string;
  status: 'active' | 'completed' | 'on-hold';
  startDate: string;
  endDate?: string;
  budget?: number;
  location?: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ============================================================================
// PROJECT SERVICE CLASS
// ============================================================================

export class ProjectService {
  
  // Get all projects for a client
  async getAllProjects(clientId: string): Promise<ApiResponse<Project[]>> {
    try {
      console.log('🔍 Fetching all projects for client:', clientId);
      
      const response = await apiService.get<ApiResponse<Project[]>>('/api/project', {
        clientId: clientId
      });

      console.log('✅ Projects fetched successfully:', response.data?.length || 0);
      return response;
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
      throw error;
    }
  }

  // Get single project by ID
  async getProjectById(projectId: string): Promise<ApiResponse<Project>> {
    try {
      console.log('🔍 Fetching project:', projectId);
      
      const response = await apiService.get<ApiResponse<Project>>('/api/project', {
        id: projectId
      });

      console.log('✅ Project fetched successfully:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error fetching project:', error);
      throw error;
    }
  }

  // Create new project
  async createProject(projectData: Omit<Project, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Project>> {
    try {
      console.log('🚀 Creating new project:', projectData.name);
      
      const response = await apiService.post<ApiResponse<Project>>('/api/project', projectData);

      console.log('✅ Project created successfully:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error creating project:', error);
      throw error;
    }
  }

  // Update existing project
  async updateProject(projectId: string, projectData: Partial<Project>): Promise<ApiResponse<Project>> {
    try {
      console.log('📝 Updating project:', projectId);
      
      const response = await apiService.put<ApiResponse<Project>>(`/api/project?id=${projectId}`, projectData);

      console.log('✅ Project updated successfully:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error updating project:', error);
      throw error;
    }
  }

  // Delete project
  async deleteProject(projectId: string): Promise<ApiResponse<any>> {
    try {
      console.log('🗑️ Deleting project:', projectId);
      
      const response = await apiService.delete<ApiResponse<any>>(`/api/project?id=${projectId}`);

      console.log('✅ Project deleted successfully');
      return response;
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      throw error;
    }
  }

  // Get project statistics
  async getProjectStats(projectId: string): Promise<ApiResponse<any>> {
    try {
      console.log('📊 Fetching project statistics:', projectId);
      
      const response = await apiService.get<ApiResponse<any>>('/api/project/stats', {
        projectId: projectId
      });

      console.log('✅ Project stats fetched successfully');
      return response;
    } catch (error) {
      console.error('❌ Error fetching project stats:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const projectService = new ProjectService();