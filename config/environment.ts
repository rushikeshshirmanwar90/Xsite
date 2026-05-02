// ============================================================================
// ENVIRONMENT CONFIGURATION FOR BEARER TOKEN
// ============================================================================

// Environment-specific configuration
export const config = {
  // API Configuration
  api: {
    // Production domain
    baseURL: 'https://xsite.tech',
    
    // Bearer token for authentication
    bearerToken: 'eyJhbGciOiJIUIsInRbaDas2344rr308ohagn0wer4XVCJ9.',
    
    // Request timeout (15 seconds)
    timeout: 15000,
    
    // Retry configuration
    maxRetries: 3,
    retryDelay: 1000, // 1 second
  },

  // App Configuration
  app: {
    version: '1.0.0',
    platform: 'mobile',
    clientType: 'react-native',
  },

  // Development Configuration
  development: {
    enableLogging: true,
    enableDebugMode: true,
    logApiCalls: true,
  },

  // Production Configuration
  production: {
    enableLogging: false,
    enableDebugMode: false,
    logApiCalls: false,
  }
};

// Get current environment
export const isDevelopment = __DEV__;
export const isProduction = !__DEV__;

// Get environment-specific config
export const getEnvironmentConfig = () => {
  return isDevelopment ? config.development : config.production;
};

// API Headers factory
export const createApiHeaders = (includeAuth: boolean = true) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-App-Version': config.app.version,
    'X-Platform': config.app.platform,
    'X-Client-Type': config.app.clientType,
  };

  if (includeAuth) {
    headers['Authorization'] = `Bearer ${config.api.bearerToken}`;
  }

  return headers;
};

// Logging utility
export const log = (...args: any[]) => {
  const envConfig = getEnvironmentConfig();
  if (envConfig.enableLogging) {
    console.log('[Xsite]', ...args);
  }
};

// API logging utility
export const logApiCall = (method: string, url: string, data?: any) => {
  const envConfig = getEnvironmentConfig();
  if (envConfig.logApiCalls) {
    console.log(`🔐 API ${method.toUpperCase()}: ${url}`, data ? { data } : '');
  }
};