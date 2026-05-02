import axios from 'axios';
import { domain } from '@/lib/domain';

// Bearer token for API authentication
const BEARER_TOKEN = 'eyJhbGciOiJIUIsInRbaDas2344rr308ohagn0wer4XVCJ9.';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: domain,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${BEARER_TOKEN}`,
  },
});

// Request interceptor to add Bearer token to all requests
apiClient.interceptors.request.use(
  (config) => {
    // Always use the fixed Bearer token
    if (!config.headers) {
      config.headers = {};
    }
    
    config.headers.Authorization = `Bearer ${BEARER_TOKEN}`;
    
    // Add additional headers for tracking
    config.headers['X-App-Version'] = '1.0.0';
    config.headers['X-Platform'] = 'mobile';
    config.headers['X-Client-Type'] = 'react-native';
    
    console.log(`🔐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log(`🔑 Authorization: Bearer ${BEARER_TOKEN.substring(0, 20)}...`);
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      console.error('🚫 Unauthorized access - Bearer token may be invalid');
      // You can add logout logic here if needed
    }
    
    // Handle 403 Forbidden errors
    if (error.response?.status === 403) {
      console.error('🚫 Forbidden access - Insufficient permissions');
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
  'X-Client-Type': 'react-native',
});

// Helper function for multipart/form-data requests
export const getAuthHeadersMultipart = () => ({
  'Authorization': `Bearer ${BEARER_TOKEN}`,
  'X-App-Version': '1.0.0',
  'X-Platform': 'mobile',
  'X-Client-Type': 'react-native',
  // Don't set Content-Type for multipart, let the browser set it
});

export default apiClient;