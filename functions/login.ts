import axios from "axios";
import { domain } from "../lib/domain";

// Type definitions for API responses
interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface UserData {
  _id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  userType?: string;
  [key: string]: any;
}

interface FindUserResponse {
  isUser: {
    userType: string;
  };
}

export const getUser = async (email: string, userType: string): Promise<UserData | null> => {
  try {
    console.log("🌐 Fetching user data...");
    console.log("   Email:", email);
    console.log("   UserType:", userType);

    // ✅ FIX: Use correct endpoint based on userType
    // For clients, use /api/clients (plural) which supports email query
    const endpoint =
      userType === "clients"
        ? `${domain}/api/clients?email=${email}`
        : `${domain}/api/${userType}?email=${email}`;

    console.log("   URL:", endpoint);

    const res = await axios.get<ApiResponse<UserData>>(endpoint);

    console.log("📦 API Response Status:", res.status);
    console.log("📦 API Response Data:", JSON.stringify(res.data, null, 2));

    if (res.status === 200) {
      const userData = res.data.data;
      console.log("✅ Extracted user data:", JSON.stringify(userData, null, 2));
      console.log("✅ User data keys:", Object.keys(userData || {}));
      console.log("✅ Has _id?", !!userData?._id);
      console.log("✅ _id value:", userData?._id);
      console.log("✅ _id type:", typeof userData?._id);
      return userData || null;
    }
    return null;
  } catch (error) {
    console.error("❌ Failed to fetch user:", error);
    return null;
  }
};

export const confirmMail = async (email: string): Promise<{ verified: boolean; isUser: boolean; userType: string }> => {
  try {
    const res = await axios.post<FindUserResponse>(`${domain}/api/findUser`, {
      email: email,
    });

    const data = res.data.isUser;

    if (res.status === 200) {
      // User exists and is verified (has password)
      return { verified: true, isUser: true, userType: data.userType };
    } else if (res.status === 201) {
      // User exists but not verified (no password set)
      return { verified: false, isUser: true, userType: data.userType };
    } else {
      // Unexpected status
      return { verified: false, isUser: false, userType: "" };
    }
  } catch (error: any) {
    console.error("❌ Failed to confirm mail:", error);
    
    // ✅ FIX: Handle 404 status (user not found) specifically
    if (error.response?.status === 404) {
      return { verified: false, isUser: false, userType: "" };
    }
    
    // Other errors (network, server errors, etc.)
    return { verified: false, isUser: false, userType: "" };
  }
};

export const sendOtp = async (email: string, OTP: number): Promise<boolean> => {
  try {
    console.log("📧 Sending OTP email...");
    console.log("   Email:", email);
    console.log("   OTP:", OTP);
    console.log("   URL:", `${domain}/api/otp`);

    const res = await axios.post<ApiResponse>(`${domain}/api/otp`, {
      email: email,
      OTP: OTP,
    });

    console.log("✅ OTP email sent successfully");
    console.log("   Status:", res.status);
    console.log("   Response:", res.data);

    return res.status === 200;
  } catch (error: any) {
    console.error("❌ Failed to send OTP email:", error);
    console.error("   Error response:", error.response?.data);
    console.error("   Error status:", error.response?.status);
    return false;
  }
};

export const addPassword = async (
  email: string,
  password: string,
  userType: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    console.log('🔐 ADD PASSWORD API CALL');
    console.log('📧 Email:', email);
    console.log('👤 User Type:', userType);
    console.log('🔑 Password length:', password.length);

    const res = await axios.post<ApiResponse>(`${domain}/api/password`, {
      email: email,
      password: password,
      userType: userType,
    });

    console.log('✅ Password API Response Status:', res.status);
    console.log('✅ Password API Response Data:', res.data);

    if (res.status === 200) {
      return { success: true, message: res.data.message || 'Password set successfully' };
    } else {
      return { success: false, error: res.data.message || 'Failed to set password' };
    }
  } catch (error: any) {
    console.error('❌ Add Password Error:', error);
    
    if (error.response) {
      console.error('❌ Error Status:', error.response.status);
      console.error('❌ Error Data:', error.response.data);
      
      return { 
        success: false, 
        error: error.response.data.message || error.response.data.error || 'Failed to set password'
      };
    }
    
    return { success: false, error: 'Network error occurred' };
  }
};

export const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const res = await axios.post<ApiResponse>(`${domain}/api/login`, {
      email,
      password,
    });

    if (res.status === 200) {
      return { success: true };
    } else {
      return {
        success: false,
        error: res.data.message || "Login failed",
      };
    }
  } catch (error: any) {
    console.log("Failed to login");
    console.error(error.message);
    return {
      success: false,
      error:
        error.response?.data?.message || error.message || "An error occurred",
    };
  }
};

export const findUserType = async (email: string): Promise<{ success: boolean; userType: string }> => {
  try {
    const res = await axios.post<FindUserResponse>(`${domain}/api/findUser`, {
      email: email,
    });

    if (res.status === 200 || res.status === 201) {
      const data = res.data.isUser;
      return { success: true, userType: data.userType };
    } else {
      return { success: false, userType: "" };
    }
  } catch (error: any) {
    console.error("Failed to find user type:", error);
    
    // ✅ FIX: Handle 404 status (user not found) specifically
    if (error.response?.status === 404) {
      return { success: false, userType: "" };
    }
    
    return { success: false, userType: "" };
  }
};

export const forgetPassword = async (email: string, userType: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const payload = {
      email: email,
      userType: userType,
    };

    console.log("\n========================================");
    console.log("FORGET PASSWORD API CALL");
    console.log("========================================");
    console.log("API Endpoint:", `${domain}/api/forget-password`);
    console.log("Payload:", JSON.stringify(payload, null, 2));
    console.log("Email:", email);
    console.log("UserType:", userType);
    console.log("========================================\n");

    const res = await axios.post<ApiResponse>(`${domain}/api/forget-password`, payload);

    console.log("Forget Password Response Status:", res.status);
    console.log(
      "Forget Password Response Data:",
      JSON.stringify(res.data, null, 2)
    );

    if (res.status === 200) {
      return {
        success: true,
        message: res.data.message || "Password reset email sent",
      };
    } else {
      return {
        success: false,
        error: res.data.message || "Failed to send reset email",
      };
    }
  } catch (error: any) {
    console.error("\n❌ FORGET PASSWORD ERROR:");
    console.error("Error Message:", error.message);
    console.error("Error Response:", error.response?.data);
    console.error("Error Status:", error.response?.status);
    return {
      success: false,
      error:
        error.response?.data?.message || error.message || "An error occurred",
    };
  }
};
