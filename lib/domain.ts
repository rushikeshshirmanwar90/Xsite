// export const domain = "http://localhost:8080/";
// export const domain = "https://real-estate-optimize-apis.vercel.app/";
// export const domain = "http://10.219.227.135:8080";
export const domain = "http://10.96.147.135:8080";

// Ensure domain doesn't have trailing slash for consistency
export const API_BASE_URL = domain.endsWith('/') ? domain.slice(0, -1) : domain