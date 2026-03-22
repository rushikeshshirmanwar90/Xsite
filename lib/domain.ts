// export const domain = "http://localhost:8080/";
export const domain = "https://real-estate-optimize-apis.vercel.app/";
// export const domain = " http://192.168.192.10:8080";
// export const domain = "http://10.216.150.135:8080";

// Ensure domain has trailing slash for API calls
export const API_BASE_URL = domain.endsWith('/') ? domain : domain + '/'