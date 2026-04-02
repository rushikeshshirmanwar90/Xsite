// export const domain = "http://localhost:8080/";
// export const domain = "https://real-estate-optimize-apis.vercel.app/";
export const domain = "http://187.127.137.30:3000";
// export const domain = "http://10.240.86.195:8080";

// Ensure domain has trailing slash for API calls
export const API_BASE_URL = domain.endsWith('/') ? domain : domain + '/'