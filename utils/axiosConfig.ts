import axios from 'axios';
import { domain } from '@/lib/domain';

// Bearer token to be used for all API calls
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