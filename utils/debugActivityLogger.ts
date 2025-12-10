/**
 * Debug helper for Activity Logger
 *
 * Use this to check if AsyncStorage has the required data for activity logging
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export const debugActivityLogger = async () => {
  console.log("\n========================================");
  console.log("🔍 ACTIVITY LOGGER DEBUG");
  console.log("========================================\n");

  try {
    // Check if user data exists
    console.log("1️⃣ Checking AsyncStorage for 'user' key...");
    const userDetailsString = await AsyncStorage.getItem("user");

    if (!userDetailsString) {
      console.error("❌ PROBLEM: No 'user' data found in AsyncStorage!");
      console.error("\n💡 Solution:");
      console.error("   - Make sure user is logged in");
      console.error("   - Check login flow saves user data to AsyncStorage");
      console.error(
        "   - Use: await AsyncStorage.setItem('user', JSON.stringify(userData))"
      );
      return;
    }

    console.log("✅ User data found in AsyncStorage");

    // Parse user data
    console.log("\n2️⃣ Parsing user data...");
    const userData = JSON.parse(userDetailsString);
    console.log("✅ User data parsed successfully");

    // Check required fields
    console.log("\n3️⃣ Checking required fields...");
    console.log("\nUser Data Structure:");
    console.log(JSON.stringify(userData, null, 2));

    console.log("\n4️⃣ Field Validation:");

    // Check clientId
    if (userData.clientId) {
      console.log("✅ clientId: FOUND -", userData.clientId);
    } else {
      console.error("❌ clientId: MISSING!");
      console.error("   This is REQUIRED for activity logging");
    }

    // Check user ID
    const userId = userData._id || userData.id || userData.clientId;
    if (userId) {
      console.log("✅ userId: FOUND -", userId);
    } else {
      console.error("❌ userId: MISSING!");
      console.error("   Need at least one of: _id, id, or clientId");
    }

    // Check name fields
    if (
      userData.firstName ||
      userData.lastName ||
      userData.name ||
      userData.username
    ) {
      const fullName =
        userData.firstName && userData.lastName
          ? `${userData.firstName} ${userData.lastName}`
          : userData.firstName ||
            userData.lastName ||
            userData.name ||
            userData.username;
      console.log("✅ fullName: FOUND -", fullName);
    } else {
      console.warn("⚠️ fullName: MISSING (will use 'Unknown User')");
    }

    // Check email (optional)
    if (userData.email) {
      console.log("✅ email: FOUND -", userData.email);
    } else {
      console.log("ℹ️ email: Not provided (optional)");
    }

    // Summary
    console.log("\n========================================");
    if (userData.clientId && userId) {
      console.log("✅ READY: Activity logging should work!");
      console.log("========================================\n");
      return true;
    } else {
      console.error("❌ NOT READY: Missing required fields");
      console.error("========================================\n");
      return false;
    }
  } catch (error) {
    console.error("\n❌ ERROR during debug:");
    console.error(error);
    console.error("========================================\n");
    return false;
  }
};

// Export a function to call from console
export const testActivityLogging = async () => {
  const isReady = await debugActivityLogger();

  if (isReady) {
    console.log("🎉 You can now test activity logging!");
    console.log("\nTry creating a project and check the console logs.");
  } else {
    console.log("⚠️ Fix the issues above before testing activity logging.");
  }
};
