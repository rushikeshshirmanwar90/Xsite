import axios from "axios";
import { domain } from "../lib/domain";

export const getUser = async (email: string, userType: string) => {
  try {
    const res = await axios.get(`${domain}/api/${userType}?email=${email}`);
    if (res.status === 200) {
      return (res.data as any).data;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return null;
  }
};

export const confirmMail = async (email: string) => {
  const res = await axios.post(`${domain}/api/findUser`, {
    email: email,
  });

  const data = (res.data as any).isUser;

  if (res.status === 200) {
    const obj = { verified: true, isUser: true, userType: data.userType };
    return obj;
  } else if (res.status === 201) {
    const obj = { verified: false, isUser: true, userType: data.userType };
    return obj;
  } else {
    const obj = { verified: false, isUser: false, userType: "" };
    return obj;
  }
};

export const sendOtp = async (email: string, OTP: number) => {
  const res = await axios.post(`${domain}/api/otp`, {
    email: email,
    OTP: OTP,
  });

  if (res.status === 200) {
    return true;
  } else {
    return false;
  }
};

export const addPassword = async (
  email: string,
  password: string,
  userType: string
) => {
  const res = await axios.post(`${domain}/api/password`, {
    email: email,
    password: password,
    userType: userType,
  });

  console.log(userType);
  console.log(email);
  console.log(password);

  if (res.status === 200) {
    return true;
  } else {
    return false;
  }
};

export const login = async (email: string, password: string) => {
  try {
    const res = await axios.post(`${domain}/api/login`, {
      email,
      password,
    });

    if (res.status === 200) {
      return { success: true };
    } else {
      return { success: false, error: (res.data as any).message || "Login failed" };
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

export const findUserType = async (email: string) => {
  try {
    const res = await axios.post(`${domain}/api/findUser`, {
      email: email,
    });

    if (res.status === 200 || res.status === 201) {
      const data = (res.data as any).isUser;
      return { success: true, userType: data.userType };
    } else {
      return { success: false, userType: "" };
    }
  } catch (error: any) {
    console.error("Failed to find user type:", error);
    return { success: false, userType: "" };
  }
};

export const forgetPassword = async (email: string, userType: string) => {
  try {
    const payload = {
      email: email,
      userType: userType,
    };

    console.log('\n========================================');
    console.log('FORGET PASSWORD API CALL');
    console.log('========================================');
    console.log('API Endpoint:', `${domain}/api/forget-password`);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('Email:', email);
    console.log('UserType:', userType);
    console.log('========================================\n');

    const res = await axios.post(`${domain}/api/forget-password`, payload);

    console.log('Forget Password Response Status:', res.status);
    console.log('Forget Password Response Data:', JSON.stringify(res.data, null, 2));

    if (res.status === 200) {
      return { success: true, message: (res.data as any).message || "Password reset email sent" };
    } else {
      return { success: false, error: (res.data as any).message || "Failed to send reset email" };
    }
  } catch (error: any) {
    console.error('\n❌ FORGET PASSWORD ERROR:');
    console.error('Error Message:', error.message);
    console.error('Error Response:', error.response?.data);
    console.error('Error Status:', error.response?.status);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "An error occurred",
    };
  }
};
