// utils/activityLogger.ts
import { domain } from "@/lib/domain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

interface UserData {
  userId: string;
  fullName: string;
  email?: string;
}

interface ActivityLogParams {
  projectId?: string;
  projectName?: string;
  sectionId?: string;
  sectionName?: string;
  miniSectionId?: string;
  miniSectionName?: string;
  activityType:
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
  category:
    | "project"
    | "section"
    | "mini_section"
    | "material"
    | "staff"
    | "other";
  action:
    | "create"
    | "update"
    | "delete"
    | "assign"
    | "remove"
    | "import"
    | "use";
  description: string;
  message?: string;
  changedData?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Get user data from AsyncStorage
 */
const getUserData = async (): Promise<UserData> => {
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

/**
 * Get client ID from AsyncStorage
 */
const getClientId = async (): Promise<string> => {
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

/**
 * Log activity to the API
 * This is a non-blocking operation - errors won't affect the main flow
 */
export const logActivity = async (params: ActivityLogParams): Promise<void> => {
  try {
    const user = await getUserData();
    const clientId = await getClientId();

    if (!clientId) {
      console.warn("Client ID not found, skipping activity log");
      return;
    }

    const payload = {
      user,
      clientId,
      ...params,
    };

    console.log("📝 Logging activity:", {
      type: params.activityType,
      category: params.category,
      action: params.action,
    });

    await axios.post(`${domain}/api/activity`, payload);

    console.log("✅ Activity logged successfully");
  } catch (error) {
    console.error("❌ Failed to log activity:", error);
    // Don't throw - activity logging is not critical
  }
};

/**
 * Helper functions for common activities
 */

// Project Activities
export const logProjectCreated = (
  projectId: string,
  projectName: string,
  metadata?: any
) => {
  return logActivity({
    projectId,
    projectName,
    activityType: "project_created",
    category: "project",
    action: "create",
    description: `Created project: ${projectName}`,
    metadata,
  });
};

export const logProjectUpdated = (
  projectId: string,
  projectName: string,
  changedData: Array<{ field: string; oldValue: any; newValue: any }>
) => {
  return logActivity({
    projectId,
    projectName,
    activityType: "project_updated",
    category: "project",
    action: "update",
    description: `Updated project: ${projectName}`,
    changedData,
  });
};

export const logProjectDeleted = (
  projectId: string,
  projectName: string,
  message?: string
) => {
  return logActivity({
    projectId,
    projectName,
    activityType: "project_deleted",
    category: "project",
    action: "delete",
    description: `Deleted project: ${projectName}`,
    message,
  });
};

// Section Activities
export const logSectionCreated = (
  projectId: string,
  projectName: string,
  sectionId: string,
  sectionName: string,
  sectionType: string
) => {
  return logActivity({
    projectId,
    projectName,
    sectionId,
    sectionName,
    activityType: "section_created",
    category: "section",
    action: "create",
    description: `Created ${sectionType} section: ${sectionName}`,
    metadata: { sectionType },
  });
};

export const logSectionUpdated = (
  projectId: string,
  projectName: string,
  sectionId: string,
  sectionName: string,
  changedData: Array<{ field: string; oldValue: any; newValue: any }>
) => {
  return logActivity({
    projectId,
    projectName,
    sectionId,
    sectionName,
    activityType: "section_updated",
    category: "section",
    action: "update",
    description: `Updated section: ${sectionName}`,
    changedData,
  });
};

export const logSectionDeleted = (
  projectId: string,
  projectName: string,
  sectionId: string,
  sectionName: string,
  message?: string
) => {
  return logActivity({
    projectId,
    projectName,
    sectionId,
    sectionName,
    activityType: "section_deleted",
    category: "section",
    action: "delete",
    description: `Deleted section: ${sectionName}`,
    message,
  });
};

// Mini-Section Activities
export const logMiniSectionCreated = (
  projectId: string,
  projectName: string,
  sectionId: string,
  sectionName: string,
  miniSectionId: string,
  miniSectionName: string
) => {
  return logActivity({
    projectId,
    projectName,
    sectionId,
    sectionName,
    miniSectionId,
    miniSectionName,
    activityType: "mini_section_created",
    category: "mini_section",
    action: "create",
    description: `Created mini-section: ${miniSectionName} in ${sectionName}`,
  });
};

export const logMiniSectionUpdated = (
  projectId: string,
  projectName: string,
  sectionId: string,
  sectionName: string,
  miniSectionId: string,
  miniSectionName: string,
  changedData: Array<{ field: string; oldValue: any; newValue: any }>
) => {
  return logActivity({
    projectId,
    projectName,
    sectionId,
    sectionName,
    miniSectionId,
    miniSectionName,
    activityType: "mini_section_updated",
    category: "mini_section",
    action: "update",
    description: `Updated mini-section: ${miniSectionName}`,
    changedData,
  });
};

export const logMiniSectionDeleted = (
  projectId: string,
  projectName: string,
  sectionId: string,
  sectionName: string,
  miniSectionId: string,
  miniSectionName: string,
  message?: string
) => {
  return logActivity({
    projectId,
    projectName,
    sectionId,
    sectionName,
    miniSectionId,
    miniSectionName,
    activityType: "mini_section_deleted",
    category: "mini_section",
    action: "delete",
    description: `Deleted mini-section: ${miniSectionName}`,
    message,
  });
};

// Material Activities
export const logMaterialImported = (
  projectId: string,
  projectName: string,
  materialCount: number,
  totalCost: number,
  message?: string
) => {
  return logActivity({
    projectId,
    projectName,
    activityType: "material_imported",
    category: "material",
    action: "import",
    description: `Imported ${materialCount} material(s) worth ₹${totalCost.toLocaleString(
      "en-IN"
    )}`,
    message,
    metadata: { materialCount, totalCost },
  });
};

export const logMaterialUsed = (
  projectId: string,
  projectName: string,
  sectionId: string,
  sectionName: string,
  miniSectionId: string,
  materialName: string,
  quantity: number,
  unit: string
) => {
  return logActivity({
    projectId,
    projectName,
    sectionId,
    sectionName,
    miniSectionId,
    activityType: "material_used",
    category: "material",
    action: "use",
    description: `Used ${quantity} ${unit} of ${materialName} in ${sectionName}`,
    metadata: { materialName, quantity, unit },
  });
};

// Staff Activities
export const logStaffAssigned = (
  projectId: string,
  projectName: string,
  staffName: string,
  staffId: string
) => {
  return logActivity({
    projectId,
    projectName,
    activityType: "staff_assigned",
    category: "staff",
    action: "assign",
    description: `Assigned ${staffName} to project`,
    metadata: { staffId, staffName },
  });
};

export const logStaffRemoved = (
  projectId: string,
  projectName: string,
  staffName: string,
  staffId: string
) => {
  return logActivity({
    projectId,
    projectName,
    activityType: "staff_removed",
    category: "staff",
    action: "remove",
    description: `Removed ${staffName} from project`,
    metadata: { staffId, staffName },
  });
};
