// export const domain = "http://localhost:8080/";
export const domain = "https://real-estate-optimize-apis.vercel.app/";
// export const domain = "http://10.38.203.135:8080";
// export const domain = "http://10.25.234.56:8080";

// Ensure domain doesn't have trailing slash for consistency
export const API_BASE_URL = domain.endsWith('/') ? domain.slice(0, -1) : domain;
