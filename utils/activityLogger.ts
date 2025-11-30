import { domain } from "@/lib/domain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// Get user data from AsyncStorage
const getUserData = async () => {
  try {
    const userDetailsString = await AsyncStorage.getItem("user");
    if (userDetailsString) {
      const userData = JSON.parse(userDetailsString);
      return {
        userId: userData._id || userData.id || userData.clientId || "unknown",
        fullName: userData.name || userData.username || "Unknown User",
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

// Get client ID from AsyncStorage
const getClientId = async () => {
  try {
    const userDetailsString = await AsyncStorage.getItem("user");
    if (userDetailsString) {
      const userData = JSON.parse(userDetailsString);
      return userData.clientId || "";
    }
  } catch (error) {
    console.error("Error getting client ID:", error);
  }
  return "";
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
  | "material_imported"
  | "material_used"
  | "material_updated"
  | "material_deleted"
  | "staff_assigned"
  | "staff_removed"
  | "other";

export type ActivityCategory =
  | "project"
  | "section"
  | "mini_section"
  | "material"
  | "staff"
  | "other";
export type ActivityAction =
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
  try {
    const user = await getUserData();
    const clientId = await getClientId();

    if (!clientId) {
      console.warn("Client ID not found, skipping activity log");
      return;
    }

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
    };

    console.log("📝 Logging activity:", activityPayload);

    await axios.post(`${domain}/api/activity`, activityPayload);
    console.log("✅ Activity logged successfully");
  } catch (error) {
    console.error("❌ Failed to log activity:", error);
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
  await logActivity({
    activityType: "project_created",
    category: "project",
    action: "create",
    description: `Created project "${projectName}"`,
    projectId,
    projectName,
    metadata,
  });
};

export const logProjectUpdated = async (
  projectId: string,
  projectName: string,
  changedData?: Array<{ field: string; oldValue: any; newValue: any }>,
  message?: string
) => {
  await logActivity({
    activityType: "project_updated",
    category: "project",
    action: "update",
    description: `Updated project "${projectName}"`,
    projectId,
    projectName,
    changedData,
    message,
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
// MATERIAL ACTIVITIES (Already exists but adding for completeness)
// ============================================

export const logMaterialImported = async (
  projectId: string,
  projectName: string,
  materialCount: number,
  totalCost: number,
  message?: string
) => {
  await logActivity({
    activityType: "material_imported",
    category: "material",
    action: "import",
    description: `Imported ${materialCount} material${
      materialCount > 1 ? "s" : ""
    } (₹${totalCost.toLocaleString("en-IN")})`,
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
  cost?: number
) => {
  await logActivity({
    activityType: "material_used",
    category: "material",
    action: "use",
    description: `Used ${quantity} ${unit} of ${materialName} in "${miniSectionName}"`,
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
      cost,
    },
  });
};

export const logMaterialUpdated = async (
  projectId: string,
  projectName: string,
  materialName: string,
  changedData?: Array<{ field: string; oldValue: any; newValue: any }>,
  message?: string
) => {
  await logActivity({
    activityType: "material_updated",
    category: "material",
    action: "update",
    description: `Updated material "${materialName}"`,
    projectId,
    projectName,
    changedData,
    message,
  });
};

export const logMaterialDeleted = async (
  projectId: string,
  projectName: string,
  materialName: string
) => {
  await logActivity({
    activityType: "material_deleted",
    category: "material",
    action: "delete",
    description: `Deleted material "${materialName}"`,
    projectId,
    projectName,
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
