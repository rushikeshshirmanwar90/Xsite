// ============================================================================
// API USAGE EXAMPLES WITH BEARER TOKEN IN XSITE PROJECT
// ============================================================================

import apiClient, { getAuthHeaders, getAuthHeadersMultipart } from '@/utils/axiosConfig';
import { domain } from '@/lib/domain';

// ============================================================================
// METHOD 1: Using Axios Client (Recommended)
// ============================================================================

// GET Request with Axios
export const getProjectsWithAxios = async () => {
  try {
    const response = await apiClient.get('/api/project');
    return response.data;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

// POST Request with Axios
export const createProjectWithAxios = async (projectData: any) => {
  try {
    const response = await apiClient.post('/api/project', projectData);
    return response.data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

// PUT Request with Axios
export const updateProjectWithAxios = async (projectId: string, projectData: any) => {
  try {
    const response = await apiClient.put(`/api/project?id=${projectId}`, projectData);
    return response.data;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

// DELETE Request with Axios
export const deleteProjectWithAxios = async (projectId: string) => {
  try {
    const response = await apiClient.delete(`/api/project?id=${projectId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// ============================================================================
// METHOD 2: Using Fetch with getAuthHeaders (Current Pattern in Xsite)
// ============================================================================

// GET Request with Fetch
export const getProjectsWithFetch = async () => {
  try {
    const response = await fetch(`${domain}/api/project`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

// POST Request with Fetch
export const createProjectWithFetch = async (projectData: any) => {
  try {
    const response = await fetch(`${domain}/api/project`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

// PUT Request with Fetch
export const updateProjectWithFetch = async (projectId: string, projectData: any) => {
  try {
    const response = await fetch(`${domain}/api/project?id=${projectId}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

// DELETE Request with Fetch
export const deleteProjectWithFetch = async (projectId: string) => {
  try {
    const response = await fetch(`${domain}/api/project?id=${projectId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// ============================================================================
// METHOD 3: File Upload with Multipart Form Data
// ============================================================================

export const uploadFileWithAuth = async (file: any, additionalData: any) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('data', JSON.stringify(additionalData));

    const response = await fetch(`${domain}/api/upload`, {
      method: 'POST',
      headers: {
        ...getAuthHeadersMultipart(),
        // Don't set Content-Type for multipart, let fetch handle it
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// ============================================================================
// METHOD 4: Real Examples from Xsite Project
// ============================================================================

// Labor API Example (from labor.tsx)
export const getLaborEntries = async (projectId: string, sectionId: string, miniSectionId?: string) => {
  try {
    // Import domain and auth headers dynamically (Xsite pattern)
    const { domain } = await import('@/lib/domain');
    const { getAuthHeaders } = await import('@/utils/axiosConfig');

    const url = `${domain}/api/labor?entityType=project&entityId=${projectId}&sectionId=${sectionId}${miniSectionId ? `&miniSectionId=${miniSectionId}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Labor API response:', result);
    
    return result;
  } catch (error) {
    console.error('Error fetching labor entries:', error);
    throw error;
  }
};

// Add Labor Entry Example
export const addLaborEntry = async (laborData: any) => {
  try {
    const { domain } = await import('@/lib/domain');
    const { getAuthHeaders } = await import('@/utils/axiosConfig');

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
    console.log('Labor API response:', result);
    
    return result;
  } catch (error) {
    console.error('Error adding labor entry:', error);
    throw error;
  }
};

// Push Token Registration Example
export const registerPushToken = async (tokenData: any) => {
  try {
    const { domain } = await import('@/lib/domain');
    const { getAuthHeaders } = await import('@/utils/axiosConfig');

    const response = await fetch(`${domain}/api/push-token`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
      },
      body: JSON.stringify(tokenData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error registering push token:', error);
    throw error;
  }
};

// ============================================================================
// METHOD 5: Error Handling Patterns
// ============================================================================

export const apiCallWithErrorHandling = async (endpoint: string, options: any = {}) => {
  try {
    const { domain } = await import('@/lib/domain');
    const { getAuthHeaders } = await import('@/utils/axiosConfig');

    const response = await fetch(`${domain}${endpoint}`, {
      method: options.method || 'GET',
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    // Handle different HTTP status codes
    if (response.status === 401) {
      console.error('🚫 Unauthorized - Bearer token invalid or expired');
      // Handle logout or token refresh here
      throw new Error('Authentication failed');
    }

    if (response.status === 403) {
      console.error('🚫 Forbidden - Insufficient permissions');
      throw new Error('Access denied');
    }

    if (response.status === 404) {
      console.error('🔍 Not Found - Endpoint or resource not found');
      throw new Error('Resource not found');
    }

    if (response.status >= 500) {
      console.error('🔥 Server Error - Internal server error');
      throw new Error('Server error');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    throw error;
  }
};

// ============================================================================
// AUTHENTICATION ENDPOINTS (NO BEARER TOKEN)
// ============================================================================

// Login endpoint (should NOT use bearer token)
export const loginUser = async (email: string, password: string) => {
  try {
    const { domain } = await import('@/lib/domain');

    const response = await fetch(`${domain}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // NO Authorization header for login
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

// Find User endpoint (should NOT use bearer token)
export const findUser = async (email: string) => {
  try {
    const { domain } = await import('@/lib/domain');

    const response = await fetch(`${domain}/api/findUser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // NO Authorization header for findUser
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error finding user:', error);
    throw error;
  }
};