// ============================================================================
// LABOR SERVICE WITH BEARER TOKEN AUTHENTICATION (UPDATED)
// ============================================================================

import { apiService } from './apiService';
import { getAuthHeaders } from '@/utils/axiosConfig';
import { domain } from '@/lib/domain';

// ============================================================================
// INTERFACES
// ============================================================================

export interface LaborEntry {
  _id?: string;
  type: string;
  category: string;
  count: number;
  perLaborCost: number;
  totalCost: number;
  projectId: string;
  sectionId: string;
  miniSectionId?: string;
  addedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LaborApiResponse {
  success: boolean;
  data: {
    laborEntries: LaborEntry[];
    totalCount: number;
    totalCost: number;
  };
  message?: string;
}

// ============================================================================
// LABOR SERVICE CLASS
// ============================================================================

export class LaborService {

  // Get labor entries for a project/section
  async getLaborEntries(
    projectId: string, 
    sectionId: string, 
    miniSectionId?: string
  ): Promise<LaborApiResponse> {
    try {
      console.log('🔍 Fetching labor entries:', { projectId, sectionId, miniSectionId });

      // Build query parameters
      const params: Record<string, string> = {
        entityType: 'project',
        entityId: projectId,
        sectionId: sectionId
      };

      if (miniSectionId) {
        params.miniSectionId = miniSectionId;
      }

      // Use fetch with bearer token (current Xsite pattern)
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${domain}/api/labor?${queryString}`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Labor entries fetched successfully:', result.data?.laborEntries?.length || 0);
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching labor entries:', error);
      throw error;
    }
  }

  // Add labor entry
  async addLaborEntry(laborData: Omit<LaborEntry, '_id' | 'createdAt' | 'updatedAt'>): Promise<LaborApiResponse> {
    try {
      console.log('🚀 Adding labor entry:', laborData);

      const response = await fetch(`${domain}/api/labor`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
        body: JSON.stringify(laborData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Labor entry added successfully:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error adding labor entry:', error);
      throw error;
    }
  }

  // Add multiple labor entries (batch)
  async addMultipleLaborEntries(laborEntries: Omit<LaborEntry, '_id' | 'createdAt' | 'updatedAt'>[]): Promise<LaborApiResponse[]> {
    try {
      console.log('🚀 Adding multiple labor entries:', laborEntries.length);

      const results: LaborApiResponse[] = [];

      // Process entries in batches to avoid overwhelming the server
      for (const laborData of laborEntries) {
        const response = await fetch(`${domain}/api/labor`, {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
          },
          body: JSON.stringify(laborData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        results.push(result);
      }

      console.log('✅ Multiple labor entries added successfully:', results.length);
      return results;
    } catch (error) {
      console.error('❌ Error adding multiple labor entries:', error);
      throw error;
    }
  }

  // Update labor entry
  async updateLaborEntry(laborId: string, laborData: Partial<LaborEntry>): Promise<LaborApiResponse> {
    try {
      console.log('📝 Updating labor entry:', laborId);

      const response = await apiService.put<LaborApiResponse>(`/api/labor?id=${laborId}`, laborData);

      console.log('✅ Labor entry updated successfully');
      return response;
    } catch (error) {
      console.error('❌ Error updating labor entry:', error);
      throw error;
    }
  }

  // Delete labor entry
  async deleteLaborEntry(laborId: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🗑️ Deleting labor entry:', laborId);

      const response = await apiService.delete<{ success: boolean; message?: string }>(`/api/labor?id=${laborId}`);

      console.log('✅ Labor entry deleted successfully');
      return response;
    } catch (error) {
      console.error('❌ Error deleting labor entry:', error);
      throw error;
    }
  }

  // Get labor statistics
  async getLaborStats(projectId: string, sectionId?: string): Promise<any> {
    try {
      console.log('📊 Fetching labor statistics:', { projectId, sectionId });

      const params: Record<string, string> = {
        projectId: projectId
      };

      if (sectionId) {
        params.sectionId = sectionId;
      }

      const response = await apiService.get<any>('/api/labor/stats', params);

      console.log('✅ Labor stats fetched successfully');
      return response;
    } catch (error) {
      console.error('❌ Error fetching labor stats:', error);
      throw error;
    }
  }

  // Get labor categories
  async getLaborCategories(): Promise<{ success: boolean; data: string[] }> {
    try {
      console.log('🔍 Fetching labor categories');

      const response = await apiService.get<{ success: boolean; data: string[] }>('/api/labor/categories');

      console.log('✅ Labor categories fetched successfully');
      return response;
    } catch (error) {
      console.error('❌ Error fetching labor categories:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const laborService = new LaborService();