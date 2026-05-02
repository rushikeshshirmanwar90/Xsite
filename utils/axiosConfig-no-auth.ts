import axios from 'axios';
import { domain } from '@/lib/domain';

// TEMPORARY CONFIG FOR TESTING WITHOUT BEARER TOKEN
// Use this file for testing unprotected endpoints

// Create axios instance WITHOUT Bearer token
const apiClientNoAuth = axios.create({
  baseURL: domain,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    // NO Authorization header for testing
  },
});

// Request interceptor for logging only
apiClientNoAuth.interceptors.request.use(
  (config) => {
    console.log(`🔓 API Request (NO AUTH): ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClientNoAuth.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response (NO AUTH): ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ API Error (NO AUTH): ${error.response?.status} ${error.config?.url}`, error.response?.data);
    return Promise.reject(error);
  }
);

// Helper function to get headers without Bearer token
export const getNoAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'X-App-Version': '1.0.0',
  'X-Platform': 'mobile',
});

export default apiClientNoAuth;