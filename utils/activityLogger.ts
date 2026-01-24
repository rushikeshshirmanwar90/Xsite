import { domain } from "@/lib/domain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { getClientId as getClientIdFromFunction } from "@/functions/clientId";

// Get user data from AsyncStorage
const getUserData = async () => {
  try {
    const userDetailsString = await AsyncStorage.getItem("user");
    if (userDetailsString) {
      const userData = JSON.parse(userDetailsString);

      // Build full name from firstName and lastName, or fallback to name/username
      let fullName = "Unknown User";
      if (userData.firstName && userData.lastName) {
        fullName = `${userData.firstName} ${userData.lastName}`;
      } else if (userData.firstName) {
        fullName = userData.firstName;
      } else if (userData.lastName) {
        fullName = userData.lastName;
      } else if (userData.name) {
        fullName = userData.name;
      } else if (userData.username) {
        fullName = userData.username;
      }

      return {
        userId: userData._id || userData.id || userData.clientId || "unknown",
        fullName: fullName,
        email: userData.email || undefined,
      };
    }
  } catch (error) {
    console.error("Error getting user data:", error);
  }
  return {
    userId: "unknown",
    fullName: "Unknown User",
  };
};

// Get client ID from AsyncStorage (use the same function as other parts of the app)
const getClientId = async () => {
  const clientId = await getClientIdFromFunction();
  return clientId || "";
};

// Activity Types
export type ActivityType =
  | "project_created"
  | "project_updated"
  | "project_deleted"
  | "section_created"
  | "section_updated"
  | "section_deleted"
  | "mini_section_created"
  | "mini_section_updated"
  | "mini_section_deleted"
  | "staff_assigned"
  | "staff_removed"
  | "labor_added"
  | "labor_updated"
  | "labor_removed"
  | "other";

export type ActivityCategory =
  | "project"
  | "section"
  | "mini_section"
  | "material"
  | "staff"
  | "other"
  | "labor";

export type ActivityAction =
  | "add"
  | "create"
  | "update"
  | "delete"
  | "assign"
  | "remove"
  | "import"
  | "use";

interface ActivityLogParams {
  activityType: ActivityType;
  category: ActivityCategory;
  action: ActivityAction;
  description: string;
  projectId?: string;
  projectName?: string;
  sectionId?: string;
  sectionName?: string;
  miniSectionId?: string;
  miniSectionName?: string;
  message?: string;
  changedData?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  metadata?: any;
}

// Main activity logging function
export const logActivity = async (params: ActivityLogParams) => {
  console.log("\n========================================");
  console.log("🚀 ACTIVITY LOGGING STARTED");
  console.log("========================================");
  console.log("Activity Type:", params.activityType);
  console.log("Category:", params.category);
  console.log("Action:", params.action);
  console.log("Description:", params.description);
  console.log("Project ID:", params.projectId);
  console.log("Project Name:", params.projectName);

  try {
    console.log("\n🔍 Step 1: Getting user data from AsyncStorage...");
    const user = await getUserData();
    console.log("✅ User data retrieved:");
    console.log("   - User ID:", user.userId);
    console.log("   - Full Name:", user.fullName);
    console.log("   - Email:", user.email || "(not provided)");

    console.log("\n🔍 Step 2: Getting client ID from AsyncStorage...");
    const clientId = await getClientId();
    console.log("✅ Client ID retrieved:", clientId || "(EMPTY!)");

    if (!clientId) {
      console.error("\n❌ CRITICAL: Client ID is empty!");
      console.error("Activity logging cannot proceed without clientId");
      console.error(
        "Please ensure user is logged in and clientId is stored in AsyncStorage"
      );
      console.warn("⚠️ Skipping activity log due to missing clientId");
      return;
    }

    console.log("\n🔨 Step 3: Building activity payload...");
    const activityPayload = {
      user,
      clientId,
      projectId: params.projectId,
      projectName: params.projectName,
      sectionId: params.sectionId,
      sectionName: params.sectionName,
      miniSectionId: params.miniSectionId,
      miniSectionName: params.miniSectionName,
      activityType: params.activityType,
      category: params.category,
      action: params.action,
      description: params.description,
      message: params.message,
      changedData: params.changedData,
      metadata: params.metadata,
      date: new Date().toISOString(),
    };

    console.log("✅ Activity payload built successfully");
    console.log("\n📝 Payload details:");
    console.log(JSON.stringify(activityPayload, null, 2));

    console.log("\n🌐 Step 4: Sending POST request to Activity API...");
    console.log("API Endpoint:", `${domain}/api/activity`);

    const response = await axios.post(
      `${domain}/api/activity`,
      activityPayload
    );

    console.log("\n✅ SUCCESS! Activity logged to API");
    console.log("Response Status:", response.status);
    console.log("Response Data:", JSON.stringify(response.data, null, 2));
    console.log("========================================");
    console.log("🏁 ACTIVITY LOGGING COMPLETED");
    console.log("========================================\n");
  } catch (error: any) {
    console.error("\n========================================");
    console.error("❌ ACTIVITY LOGGING FAILED");
    console.error("========================================");
    console.error("Error Type:", error?.name);
    console.error("Error Message:", error?.message);

    if (error?.response) {
      console.error("\n📡 API Response Error:");
      console.error("   Status:", error.response.status);
      console.error("   Status Text:", error.response.statusText);
      console.error(
        "   Error Data:",
        JSON.stringify(error.response.data, null, 2)
      );
    } else if (error?.request) {
      console.error("\n📡 Network Error:");
      console.error("   No response received from server");
      console.error("   Request was made but no response");
    } else {
      console.error("\n⚠️ Unknown Error:", error);
    }

    console.error("\n💡 Troubleshooting Tips:");
    console.error("   1. Check if Activity API endpoint exists");
    console.error("   2. Verify MongoDB connection");
    console.error("   3. Check Activity model schema");
    console.error("   4. Verify network connectivity");
    console.error("========================================\n");

    // Don't throw error - activity logging is not critical
  }
};

// ============================================
// PROJECT ACTIVITIES
// ============================================

export const logProjectCreated = async (
  projectId: string,
  projectName: string,
  metadata?: any
) => {
  console.log("🎯 logProjectCreated called with:", {
    projectId,
    projectName,
    metadata,
  });

  try {
    await logActivity({
      activityType: "project_created",
      category: "project",
      action: "create",
      description: `Created project "${projectName}"`,
      projectId,
      projectName,
      metadata,
    });
    console.log("🎯 logProjectCreated completed");
  } catch (error) {
    console.error("🎯 logProjectCreated error:", error);
    // Don't throw - activity logging should not break the main flow
  }
};

export const logProjectUpdated = async (
  projectId: string,
  projectName: string,
  changedData?: Array<{ field: string; oldValue: any; newValue: any }>,
  message?: string
) => {
  // Create a detailed description based on what changed
  let description = `Updated project "${projectName}"`;
  
  if (changedData && changedData.length > 0) {
    const changes = changedData.map(change => {
      switch (change.field) {
        case 'name':
          return `renamed from "${change.oldValue}" to "${change.newValue}"`;
        case 'budget':
          return `budget changed from ₹${Number(change.oldValue).toLocaleString('en-IN')} to ₹${Number(change.newValue).toLocaleString('en-IN')}`;
        case 'address':
          return `address updated`;
        case 'description':
          return `description updated`;
        default:
          return `${change.field} changed`;
      }
    });
    
    if (changes.length === 1) {
      description = `Updated project "${projectName}": ${changes[0]}`;
    } else if (changes.length === 2) {
      description = `Updated project "${projectName}": ${changes.join(' and ')}`;
    } else {
      description = `Updated project "${projectName}": ${changes.slice(0, 2).join(', ')} and ${changes.length - 2} more changes`;
    }
  }

  await logActivity({
    activityType: "project_updated",
    category: "project",
    action: "update",
    description,
    projectId,
    projectName,
    changedData,
    message,
    metadata: {
      changesCount: changedData?.length || 0,
      changesSummary: changedData?.map(c => c.field) || [],
    },
  });
};

export const logProjectDeleted = async (
  projectId: string,
  projectName: string
) => {
  await logActivity({
    activityType: "project_deleted",
    category: "project",
    action: "delete",
    description: `Deleted project "${projectName}"`,
    projectId,
    projectName,
  });
};

// ============================================
// SECTION ACTIVITIES
// ============================================

export const logSectionCreated = async (
  projectId: string,
  projectName: string,
  sectionId: string,
  sectionName: string
) => {
  await logActivity({
    activityType: "section_created",
    category: "section",
    action: "create",
    description: `Created section "${sectionName}" in project "${projectName}"`,
    projectId,
    projectName,
    sectionId,
    sectionName,
  });
};

export const logSectionUpdated = async (
  projectId: string,
  projectName: string,
  sectionId: string,
  sectionName: string,
  changedData?: Array<{ field: string; oldValue: any; newValue: any }>,
  message?: string
) => {
  await logActivity({
    activityType: "section_updated",
    category: "section",
    action: "update",
    description: `Updated section "${sectionName}" in project "${projectName}"`,
    projectId,
    projectName,
    sectionId,
    sectionName,
    changedData,
    message,
  });
};

export const logSectionDeleted = async (
  projectId: string,
  projectName: string,
  sectionId: string,
  sectionName: string
) => {
  await logActivity({
    activityType: "section_deleted",
    category: "section",
    action: "delete",
    description: `Deleted section "${sectionName}" from project "${projectName}"`,
    projectId,
    projectName,
    sectionId,
    sectionName,
  });
};

// ============================================
// MINI-SECTION ACTIVITIES
// ============================================

export const logMiniSectionCreated = async (
  projectId: string,
  projectName: string,
  sectionId: string,
  sectionName: string,
  miniSectionId: string,
  miniSectionName: string
) => {
  await logActivity({
    activityType: "mini_section_created",
    category: "mini_section",
    action: "create",
    description: `Created mini-section "${miniSectionName}" in "${sectionName}"`,
    projectId,
    projectName,
    sectionId,
    sectionName,
    miniSectionId,
    miniSectionName,
  });
};

export const logMiniSectionUpdated = async (
  projectId: string,
  projectName: string,
  sectionId: string,
  sectionName: string,
  miniSectionId: string,
  miniSectionName: string,
  changedData?: Array<{ field: string; oldValue: any; newValue: any }>,
  message?: string
) => {
  await logActivity({
    activityType: "mini_section_updated",
    category: "mini_section",
    action: "update",
    description: `Updated mini-section "${miniSectionName}" in "${sectionName}"`,
    projectId,
    projectName,
    sectionId,
    sectionName,
    miniSectionId,
    miniSectionName,
    changedData,
    message,
  });
};

export const logMiniSectionDeleted = async (
  projectId: string,
  projectName: string,
  sectionId: string,
  sectionName: string,
  miniSectionId: string,
  miniSectionName: string
) => {
  await logActivity({
    activityType: "mini_section_deleted",
    category: "mini_section",
    action: "delete",
    description: `Deleted mini-section "${miniSectionName}" from "${sectionName}"`,
    projectId,
    projectName,
    sectionId,
    sectionName,
    miniSectionId,
    miniSectionName,
  });
};

// ============================================
// MATERIAL ACTIVITIES
// ============================================

export const logMaterialImported = async (
  projectId: string,
  projectName: string,
  materialCount: number,
  totalCost: number,
  message?: string
) => {
  await logActivity({
    activityType: "other",
    category: "material",
    action: "import",
    description: `Imported ${materialCount} material${
      materialCount > 1 ? "s" : ""
    } to project "${projectName}"`,
    projectId,
    projectName,
    message,
    metadata: {
      materialCount,
      totalCost,
    },
  });
};

export const logMaterialUsed = async (
  projectId: string,
  projectName: string,
  sectionId: string,
  sectionName: string,
  miniSectionId: string,
  miniSectionName: string,
  materialName: string,
  quantity: number,
  unit: string,
  metadata?: any
) => {
  await logActivity({
    activityType: "other",
    category: "material",
    action: "use",
    description: `Used ${quantity} ${unit} of ${materialName} in mini-section "${miniSectionName}"`,
    projectId,
    projectName,
    sectionId,
    sectionName,
    miniSectionId,
    miniSectionName,
    metadata: {
      materialName,
      quantity,
      unit,
      ...metadata,
    },
  });
};

// ============================================
// STAFF ACTIVITIES
// ============================================

export const logStaffAssigned = async (
  projectId: string,
  projectName: string,
  staffName: string,
  role?: string,
  message?: string
) => {
  await logActivity({
    activityType: "staff_assigned",
    category: "staff",
    action: "assign",
    description: `Assigned ${staffName}${
      role ? ` as ${role}` : ""
    } to project "${projectName}"`,
    projectId,
    projectName,
    message,
    metadata: {
      staffName,
      role,
    },
  });
};

export const logStaffRemoved = async (
  projectId: string,
  projectName: string,
  staffName: string,
  message?: string
) => {
  await logActivity({
    activityType: "staff_removed",
    category: "staff",
    action: "remove",
    description: `Removed ${staffName} from project "${projectName}"`,
    projectId,
    projectName,
    message,
    metadata: {
      staffName,
    },
  });
};


// ============================================
// LABOR ACTIVITIES
// ============================================

export const logLaborAdded = async (
  projectId: string,
  projectName: string,
  sectionId: string,
  sectionName: string,
  miniSectionId: string,
  miniSectionName: string,
  laborEntries: Array<{
    type: string;
    category: string;
    count: number;
    perLaborCost: number;
    totalCost: number;
  }>,
  message?: string
) => {
  const totalLaborers = laborEntries.reduce((sum, entry) => sum + entry.count, 0);
  const totalCost = laborEntries.reduce((sum, entry) => sum + entry.totalCost, 0);
  const categories = [...new Set(laborEntries.map(entry => entry.category))];
  const types = [...new Set(laborEntries.map(entry => entry.type))];

  // Create a hierarchical location description: Project → Section → Mini-Section
  const locationDescription = `${projectName} → ${sectionName} → ${miniSectionName}`;

  // Create a more detailed description
  let description = '';
  if (laborEntries.length === 1) {
    // Single entry - show specific details
    const entry = laborEntries[0];
    description = `Added ${entry.count} ${entry.type} (${entry.category}) to ${locationDescription}`;
  } else {
    // Multiple entries - show summary with types
    const typesList = types.length > 3 ? `${types.slice(0, 3).join(', ')} and ${types.length - 3} more` : types.join(', ');
    description = `Added ${totalLaborers} laborers: ${typesList} to ${locationDescription}`;
  }

  await logActivity({
    activityType: "labor_added",
    category: "labor",
    action: "add",
    description,
    projectId,
    projectName,
    sectionId,
    sectionName,
    miniSectionId,
    miniSectionName,
    message,
    metadata: {
      laborEntries,
      totalLaborers,
      totalCost,
      categories,
      types,
      entriesCount: laborEntries.length,
      locationHierarchy: {
        projectName,
        sectionName,
        miniSectionName,
        fullPath: locationDescription
      }
    },
  });
};

export const logLaborUpdated = async (
  projectId: string,
  projectName: string,
  sectionId: string,
  sectionName: string,
  miniSectionId: string,
  miniSectionName: string,
  laborType: string,
  laborCategory: string,
  oldCount: number,
  newCount: number,
  oldCost: number,
  newCost: number,
  message?: string
) => {
  // Create a hierarchical location description: Project → Section → Mini-Section
  const locationDescription = `${projectName} → ${sectionName} → ${miniSectionName}`;

  await logActivity({
    activityType: "labor_updated",
    category: "labor",
    action: "update",
    description: `Updated ${laborType} (${laborCategory}) in ${locationDescription}`,
    projectId,
    projectName,
    sectionId,
    sectionName,
    miniSectionId,
    miniSectionName,
    message,
    changedData: [
      {
        field: "count",
        oldValue: oldCount,
        newValue: newCount,
      },
      {
        field: "totalCost",
        oldValue: oldCost,
        newValue: newCost,
      },
    ],
    metadata: {
      laborType,
      laborCategory,
      countChange: newCount - oldCount,
      costChange: newCost - oldCost,
      locationHierarchy: {
        projectName,
        sectionName,
        miniSectionName,
        fullPath: locationDescription
      }
    },
  });
};

export const logLaborRemoved = async (
  projectId: string,
  projectName: string,
  sectionId: string,
  sectionName: string,
  miniSectionId: string,
  miniSectionName: string,
  laborType: string,
  laborCategory: string,
  count: number,
  totalCost: number,
  message?: string
) => {
  // Create a hierarchical location description: Project → Section → Mini-Section
  const locationDescription = `${projectName} → ${sectionName} → ${miniSectionName}`;

  await logActivity({
    activityType: "labor_removed",
    category: "labor",
    action: "remove",
    description: `Removed ${count} ${laborType} (${laborCategory}) from ${locationDescription}`,
    projectId,
    projectName,
    sectionId,
    sectionName,
    miniSectionId,
    miniSectionName,
    message,
    metadata: {
      laborType,
      laborCategory,
      count,
      totalCost,
      locationHierarchy: {
        projectName,
        sectionName,
        miniSectionName,
        fullPath: locationDescription
      }
    },
  });
};


