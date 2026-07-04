// Domain configuration based on environment
// For local development: use local IP or localhost
// For production: use production domain

// LOCAL DEVELOPMENT OPTIONS:
// export const domain = "http://10.86.171.10:8080"; // Current local IP
// export const domain = "http://172.22.58.174:8080";
// export const domain = "http://10.225.204.56:8080";
export const domain = "http://10.130.142.174:8080";

// PRODUCTION OPTIONS:
// export const domain = "https://real-estate-optimize-apis.vercel.app/";
// export const domain = "https://xsite.tech"; // Use production API with Bearer token

// Ensure domain has trailing slash for API calls
export const API_BASE_URL = domain.endsWith('/') ? domain : domain + '/'