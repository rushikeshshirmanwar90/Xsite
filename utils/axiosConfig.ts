import axios from 'axios';
import { API_BASE_URL } from '@/lib/domain';

// Bearer token to be used for all API calls
// Uses environment variable if available, falls back to hardcoded value
const BEARER_TOKEN = 'eyJhbGciOiJIUIsInRbaDas2344rr308ohagn0wer4XVCJ9.';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL, // ✅ Use API_BASE_URL which includes trailing slash
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${BEARER_TOKEN}`,
  },
});

// Request interceptor to add Bearer token to all requests
apiClient.interceptors.request.use(
  (config: any) => {
    // ✅ Check for undefined in URL before making request
    if (config.url && config.url.includes('undefined')) {
      console.error('❌ API call contains undefined parameter');
      console.error('   URL:', config.url);
      console.error('   Method:', config.method?.toUpperCase());
      console.error('   This request will be blocked to prevent errors');
      
      // Return a rejected promise to prevent the API call
      return Promise.reject(new Error(`API call blocked: URL contains undefined parameter (${config.url})`));
    }
    
    // Always use the fixed Bearer token
    if (!config.headers) {
      config.headers = {};
    }
    
    config.headers.Authorization = `Bearer ${BEARER_TOKEN}`;
    
    // Add additional headers for tracking
    config.headers['X-App-Version'] = '1.0.0';
    config.headers['X-Platform'] = 'mobile';
    
    console.log(`🔐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log(`🔑 Authorization: Bearer ${BEARER_TOKEN.substring(0, 20)}...`);
    
    return config;
  },
  (error: any) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: any) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error: any) => {
    const status = error.response?.status;
    const url = error.config?.url;
    
    // Handle different error types with appropriate logging levels
    if (status === 404) {
      // 404 errors are often expected (e.g., checking if contractor exists)
      console.log(`📝 API Not Found (404): ${url}`, error.response?.data?.message || 'Resource not found');
    } else if (status === 401) {
      console.error('🚫 Unauthorized access - Bearer token may be invalid');
      console.error(`❌ API Error: ${status} ${url}`, error.response?.data);
    } else if (status >= 500) {
      // Server errors are more critical
      console.error(`🔥 Server Error (${status}): ${url}`, error.response?.data);
    } else {
      // Other client errors (400, 403, etc.)
      console.warn(`⚠️ API Error: ${status} ${url}`, error.response?.data);
    }
    
    return Promise.reject(error);
  }
);

// Helper function to get headers with Bearer token for fetch calls
export const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${BEARER_TOKEN}`,
  'X-App-Version': '1.0.0',
  'X-Platform': 'mobile',
});

export default apiClient;