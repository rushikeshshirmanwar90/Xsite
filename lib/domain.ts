// Domain configuration based on environment
// For local development: use local IP or localhost
// For production: use production domain

// Uncomment the appropriate domain for your environment:

// LOCAL DEVELOPMENT OPTIONS:
export const domain = "http://192.168.128.10:8080"; // Current local IP
// export const domain = "http://localhost:8080";

// PRODUCTION OPTIONS:
// export const domain = "https://real-estate-optimize-apis.vercel.app/";
// export const domain = "https://xsite.tech";

// Ensure domain has trailing slash for API calls
export const API_BASE_URL = domain.endsWith('/') ? domain : domain + '/'