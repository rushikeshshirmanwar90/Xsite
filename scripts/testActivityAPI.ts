/**
 * Comprehensive Activity API Test Script
 *
 * This script tests all activity types and operations to verify
 * the Activity API integration is working correctly.
 *
 * Run: npx ts-node scripts/testActivityAPI.ts
 */

import axios from "axios";

const domain = "https://real-estate-apis.vercel.app"; // Update with your domain

const testActivityAPI = async () => {
  console.log("🧪 Testing Activity API Integration...\n");
  console.log("=".repeat(60));

  // Test data
  const testClientId = "test-client-123";
  const testProjectId = "test-project-456";
  const testProjectName = "Test Construction Project";
  const testSectionId = "test-section-789";
  const testSectionName = "Building A";

  try {
    // Test 1: Project Created Activity
    console.log("\n📝 Test 1: Project Created Activity");
    console.log("-".repeat(60));
    await axios.post(`${domain}/api/activity`, {
      user: {
        userId: "test-user-123",
        fullName: "John Doe",
        email: "john@example.com",
      },
      clientId: testClientId,
      projectId: testProjectId,
      projectName: testProjectName,
      activityType: "project_created",
      category: "project",
      action: "create",
      description: `Created project "${testProjectName}"`,
      metadata: {
        address: "123 Test Street",
        budget: 500000,
        description: "Test project for activity logging",
      },
    });
    console.log("✅ Project created activity logged");

    // Test 2: Staff Assigned Activity
    console.log("\n👥 Test 2: Staff Assigned Activity");
    console.log("-".repeat(60));
    await axios.post(`${domain}/api/activity`, {
      user: {
        userId: "test-user-123",
        fullName: "John Doe",
      },
      clientId: testClientId,
      projectId: testProjectId,
      projectName: testProjectName,
      activityType: "staff_assigned",
      category: "staff",
      action: "assign",
      description: 'Assigned Jane Smith to project "Test Construction Project"',
      message: "Assigned during project creation",
      metadata: {
        staffName: "Jane Smith",
        role: "Project Manager",
      },
    });
    console.log("✅ Staff assigned activity logged");

    // Test 3: Section Created Activity
    console.log("\n🏗️  Test 3: Section Created Activity");
    console.log("-".repeat(60));
    await axios.post(`${domain}/api/activity`, {
      user: {
        userId: "test-user-123",
        fullName: "John Doe",
      },
      clientId: testClientId,
      projectId: testProjectId,
      projectName: testProjectName,
      sectionId: testSectionId,
      sectionName: testSectionName,
      activityType: "section_created",
      category: "section",
      action: "create",
      description: `Created section "${testSectionName}" in project "${testProjectName}"`,
    });
    console.log("✅ Section created activity logged");

    // Test 4: Material Import Activity
    console.log("\n📦 Test 4: Material Import Activity");
    console.log("-".repeat(60));
    await axios.post(`${domain}/api/activity`, {
      user: {
        userId: "test-user-123",
        fullName: "John Doe",
      },
      clientId: testClientId,
      projectId: testProjectId,
      projectName: testProjectName,
      activityType: "other",
      category: "material",
      action: "import",
      description:
        'Imported 5 materials to project "Test Construction Project"',
      message: "Bulk material import",
      metadata: {
        materialCount: 5,
        totalCost: 25000,
      },
    });
    console.log("✅ Material import activity logged");

    // Test 5: Material Usage Activity
    console.log("\n🔨 Test 5: Material Usage Activity");
    console.log("-".repeat(60));
    await axios.post(`${domain}/api/activity`, {
      user: {
        userId: "test-user-123",
        fullName: "John Doe",
      },
      clientId: testClientId,
      projectId: testProjectId,
      projectName: testProjectName,
      sectionId: testSectionId,
      sectionName: testSectionName,
      miniSectionId: "mini-section-001",
      miniSectionName: "Floor 1",
      activityType: "other",
      category: "material",
      action: "use",
      description: 'Used 100 kg of Cement in mini-section "Floor 1"',
      metadata: {
        materialName: "Cement",
        quantity: 100,
        unit: "kg",
        cost: 5000,
      },
    });
    console.log("✅ Material usage activity logged");

    // Test 6: Fetch All Activities
    console.log("\n📋 Test 6: Fetching All Activities");
    console.log("-".repeat(60));
    const fetchAllResponse = await axios.get(
      `${domain}/api/activity?clientId=${testClientId}&limit=20`
    );
    console.log("✅ Activities fetched successfully");
    console.log(`   Total activities: ${fetchAllResponse.data.total}`);
    console.log(`   Returned: ${fetchAllResponse.data.activities.length}`);

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ ALL TESTS PASSED!");
    console.log("=".repeat(60));
    console.log("\n📊 Test Summary:");
    console.log("   ✓ Project activities: Working");
    console.log("   ✓ Staff activities: Working");
    console.log("   ✓ Section activities: Working");
    console.log("   ✓ Material activities: Working");
    console.log("   ✓ Activity retrieval: Working");
    console.log("\n🎉 Activity API integration is fully functional!\n");
  } catch (error: any) {
    console.error("\n❌ TEST FAILED");
    console.error("=".repeat(60));
    console.error("Error:", error.response?.data || error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    }
  }
};

// Run the test
console.log("🚀 Starting Activity API Integration Tests...\n");
testActivityAPI();
