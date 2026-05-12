/**
 * Simple test function to verify Activity API is reachable
 * Call this from your app to test the API directly
 */

import { domain } from "@/lib/domain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from '@/utils/axiosConfig';

export const testActivityAPICall = async () => {
  console.log("\n========================================");
  console.log("🧪 TESTING ACTIVITY API DIRECTLY");
  console.log("========================================\n");

  try {
    // Get user data from AsyncStorage
    console.log("Step 1: Getting user data from AsyncStorage...");
    const userString = await AsyncStorage.getItem("user");

    if (!userString) {
      console.error("❌ No user data in AsyncStorage!");
      console.error("Please log in first.");
      return false;
    }

    const userData = JSON.parse(userString);
    console.log("✅ User data found:", {
      _id: userData._id,
      clientId: userData.clientId,
      firstName: userData.firstName,
      lastName: userData.lastName,
    });

    if (!userData.clientId) {
      console.error("❌ clientId is missing in user data!");
      console.error("User data:", userData);
      return false;
    }

    // Build test payload
    console.log("\nStep 2: Building test payload...");
    const testPayload = {
      user: {
        userId: userData._id || userData.id || "test-user",
        fullName:
          `${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
          "Test User",
        email: userData.email || "test@example.com",
      },
      clientId: userData.clientId,
      projectId: "test-project-" + Date.now(),
      projectName: "Test Project - Activity API",
      activityType: "project_created",
      category: "project",
      action: "create",
      description: "Test activity created to verify API is working",
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
      },
    };

    console.log("✅ Payload built:");
    console.log(JSON.stringify(testPayload, null, 2));

    // Make API call
    console.log("\nStep 3: Calling Activity API...");
    console.log("URL:", `${domain}/api/activity`);
    console.log("Method: POST");

    const response = await apiClient.post(`/api/activity`, testPayload);

    console.log("\n✅ SUCCESS! Activity API is working!");
    console.log("Response Status:", response.status);
    console.log("Response Data:", JSON.stringify(response.data, null, 2));
    console.log("\n========================================");
    console.log("🎉 TEST PASSED - Activity API is reachable and working!");
    console.log("========================================\n");

    return true;
  } catch (error: any) {
    console.error("\n❌ TEST FAILED!");
    console.error("========================================");

    if (error.response) {
      console.error("API Error Response:");
      console.error("  Status:", error.response.status);
      console.error("  Status Text:", error.response.statusText);
      console.error("  Data:", JSON.stringify(error.response.data, null, 2));

      if (error.response.status === 404) {
        console.error("\n💡 Problem: Activity API endpoint not found");
        console.error(
          "   Solution: Create POST /api/activity endpoint on backend"
        );
      } else if (error.response.status === 400) {
        console.error("\n💡 Problem: Validation error");
        console.error("   Solution: Check Activity model schema on backend");
      } else if (error.response.status === 500) {
        console.error("\n💡 Problem: Server error");
        console.error("   Solution: Check backend logs");
      }
    } else if (error.request) {
      console.error("Network Error:");
      console.error("  No response from server");
      console.error("  Request was made but no response received");
      console.error("\n💡 Problem: Cannot reach server");
      console.error("   Solution: Check if backend is running");
      console.error("   Domain:", domain);
    } else {
      console.error("Error:", error.message);
    }

    console.error("========================================\n");
    return false;
  }
};
