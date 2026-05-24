// Domain configuration based on environment
// For local development: use local IP or localhost
// For production: use production domain

// LOCAL DEVELOPMENT OPTIONS:
// export const domain = "http://10.86.171.10:8080"; // Current local IP
export const domain = "http://192.168.0.110:8080";

// PRODUCTION OPTIONS:
// export const domain = "https://real-estate-optimize-apis.vercel.app/";
// export const domain = "https://xsite.tech"; // Use production API with Bearer token

// Ensure domain has trailing slash for API calls
export const API_BASE_URL = domain.endsWith('/') ? domain : domain + '/'