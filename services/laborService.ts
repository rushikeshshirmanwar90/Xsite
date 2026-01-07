import axios from 'axios';
import { domain } from '@/lib/domain';
import { LaborEntry } from '@/types/labor';

export interface LaborApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    createdEntries?: any[];
    totalCreated?: number;
    totalCostOfLabor?: number;
    totalLaborCount?: number;
  };
  errors?: any[];
  laborEntries?: any[];
  statistics?: {
    totalEntries: number;
    totalLaborers: number;
    totalCost: number;
    avgCostPerLaborer: number;
    categoriesUsed: string[];
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface LaborActivityResponse {
  success: boolean;
  message?: string;
  error?: string;
  activities?: any[];
  summary?: {
    totalActivities: number;
    totalCostOfLabor: number;
    totalLaborCount: number;
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface LaborStatisticsResponse {
  success: boolean;
  message?: string;
  error?: string;
  statistics?: {
    overall: {
      totalEntries: number;
      totalLaborers: number;
      totalCost: number;
      avgCostPerLaborer: number;
      maxCostPerLaborer: number;
      minCostPerLaborer: number;
      categoriesUsed: string[];
      typesUsed: string[];
    };
    byCategory: any[];
    byType: any[];
    daily: any[];
    costDistribution: any[];
    topCategories: any[];
    mostUsedTypes: any[];
    recentActivities: any[];
  };
  metadata?: {
    projectId: string;
    clientId: string;
    sectionId?: string;
    generatedAt: string;
  };
}

export class LaborService {
  private static getApiUrl(endpoint: string): string {
    return `${domain}/api/${endpoint}`;
  }

  // Get labor entries with pagination and filtering
  static async getLaborEntries(params: {
    projectId: string;
    clientId: string;
    sectionId?: string;
    miniSectionId?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<LaborApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('projectId', params.projectId);
      queryParams.append('clientId', params.clientId);
      
      if (params.sectionId) queryParams.append('sectionId', params.sectionId);
      if (params.miniSectionId) queryParams.append('miniSectionId', params.miniSectionId);
      if (params.category) queryParams.append('category', params.category);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const response = await axios.get<LaborApiResponse>(
        `${this.getApiUrl('labor')}?${queryParams.toString()}`,
        { timeout: 10000 }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error fetching labor entries:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to fetch labor entries');
    }
  }

  // Add labor entries
  static async addLaborEntries(data: {
    projectId: string;
    sectionId: string;
    miniSectionId?: string;
    clientId: string;
    laborEntries: LaborEntry[];
    user: {
      userId: string;
      fullName: string;
    };
    message?: string;
  }): Promise<LaborApiResponse> {
    try {
      const response = await axios.post<LaborApiResponse>(
        this.getApiUrl('labor'),
        data,
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error adding labor entries:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to add labor entries');
    }
  }

  // Update labor entry
  static async updateLaborEntry(data: {
    id: string;
    projectId: string;
    clientId: string;
    count?: number;
    perLaborCost?: number;
    message?: string;
  }): Promise<LaborApiResponse> {
    try {
      const response = await axios.put<LaborApiResponse>(
        this.getApiUrl('labor'),
        data,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error updating labor entry:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to update labor entry');
    }
  }

  // Delete labor entry
  static async deleteLaborEntry(params: {
    id: string;
    projectId: string;
    clientId: string;
  }): Promise<LaborApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('id', params.id);
      queryParams.append('projectId', params.projectId);
      queryParams.append('clientId', params.clientId);

      const response = await axios.delete<LaborApiResponse>(
        `${this.getApiUrl('labor')}?${queryParams.toString()}`,
        { timeout: 10000 }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error deleting labor entry:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to delete labor entry');
    }
  }

  // Get labor activities
  static async getLaborActivities(params: {
    projectId: string;
    clientId: string;
    sectionId?: string;
    activity?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<LaborActivityResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('projectId', params.projectId);
      queryParams.append('clientId', params.clientId);
      
      if (params.sectionId) queryParams.append('sectionId', params.sectionId);
      if (params.activity) queryParams.append('activity', params.activity);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const response = await axios.get<LaborActivityResponse>(
        `${this.getApiUrl('labor-activity')}?${queryParams.toString()}`,
        { timeout: 10000 }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error fetching labor activities:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to fetch labor activities');
    }
  }

  // Get labor statistics
  static async getLaborStatistics(params: {
    projectId: string;
    clientId: string;
    sectionId?: string;
    startDate?: string;
    endDate?: string;
    groupBy?: string;
  }): Promise<LaborStatisticsResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('projectId', params.projectId);
      queryParams.append('clientId', params.clientId);
      
      if (params.sectionId) queryParams.append('sectionId', params.sectionId);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.groupBy) queryParams.append('groupBy', params.groupBy);

      const response = await axios.get<LaborStatisticsResponse>(
        `${this.getApiUrl('labor-statistics')}?${queryParams.toString()}`,
        { timeout: 10000 }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error fetching labor statistics:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to fetch labor statistics');
    }
  }

  // Generate custom report
  static async generateCustomReport(data: {
    projectId: string;
    clientId: string;
    sectionId?: string;
    reportType: 'summary' | 'detailed' | 'grouped';
    dateRange?: {
      startDate: string;
      endDate: string;
    };
    filters?: {
      categories?: string[];
      types?: string[];
      minCost?: number;
      maxCost?: number;
    };
    groupBy?: string;
  }): Promise<any> {
    try {
      const response = await axios.post(
        this.getApiUrl('labor-statistics'),
        data,
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error generating custom report:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to generate custom report');
    }
  }
}