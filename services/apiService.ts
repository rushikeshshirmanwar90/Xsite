// ============================================================================
// CENTRALIZED API SERVICE WITH BEARER TOKEN AUTHENTICATION
// ============================================================================

import apiClient, { getAuthHeaders } from '@/utils/axiosConfig';
import { domain } from '@/lib/domain';

// ============================================================================
// BASE API SERVICE CLASS
// ============================================================================

export class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = domain;
  }

  // Generic GET method
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const url = new URL(endpoint, this.baseURL);
      if (params) {
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.append(key, params[key].toString());
          }
        });
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
        },
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`GET ${endpoint} failed:`, error);
      throw error;
    }
  }

  // Generic POST method
  async post<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`POST ${endpoint} failed:`, error);
      throw error;
    }
  }

  // Generic PUT method
  async put<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`PUT ${endpoint} failed:`, error);
      throw error;
    }
  }

  // Generic DELETE method
  async delete<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`DELETE ${endpoint} failed:`, error);
      throw error;
    }
  }

  // Handle API responses
  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
      console.error('🚫 Unauthorized - Bearer token invalid or expired');
      throw new Error('Authentication failed');
    }

    if (response.status === 403) {
      console.error('🚫 Forbidden - Insufficient permissions');
      throw new Error('Access denied');
    }

    if (response.status === 404) {
      console.error('🔍 Not Found - Resource not found');
      throw new Error('Resource not found');
    }

    if (response.status >= 500) {
      console.error('🔥 Server Error - Internal server error');
      throw new Error('Server error');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP ${response.status}: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text() as any;
  }
}

// Create singleton instance
export const apiService = new ApiService();