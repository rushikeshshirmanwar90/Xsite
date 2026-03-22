import { domain } from "@/lib/domain";
import { Project } from "@/types/project";
import axios from "axios";

export const getProjectData = async (
  clientId: string,
  staffId?: string, // Add optional staffId parameter
  excludeMaterials: boolean = true // ✅ NEW: Option to exclude material data for performance
) => {
  try {
    if (!clientId) {
      throw new Error("Client ID is required");
    }

    console.log(
      "📝 Fetching projects for clientId:",
      clientId,
      "staffId:",
      staffId || "none",
      "excludeMaterials:",
      excludeMaterials
    );

    // Build URL with optional staffId parameter and material exclusion
    let url = `${domain}/api/project?clientId=${clientId}`;
    if (staffId) {
      url += `&staffId=${staffId}`;
      console.log("🔍 Adding staff filtering to project request");
    }
    if (excludeMaterials) {
      url += `&excludeMaterials=true`;
      console.log("🚀 Excluding material data for better performance");
    }

    const res = await axios.get(url);

    console.log("📦 API Response:", JSON.stringify(res.data, null, 2));

    // Handle new response structure (no pagination)
    const responseData = res.data as any;
    if (responseData.success && Array.isArray(responseData.data)) {
      console.log(
        "✅ Projects extracted:",
        responseData.data.length,
        staffId ? "(filtered for staff)" : "(all client projects)",
        excludeMaterials ? "(materials excluded)" : "(materials included)"
      );
      return responseData.data;
    }

    // Fallback for direct array response
    console.log("⚠️ Using fallback response parsing");
    const projects = Array.isArray(res.data) ? res.data : [];
    return projects;
  } catch (error) {
    console.error("❌ Failed to fetch project data:", error);
    throw error;
  }
};

export const getProject = async (projectId: string, clientId: string) => {
  try {
    if (!projectId) {
      throw new Error("Project ID is required");
    }
    if (!clientId) {
      throw new Error("Client ID is required");
    }

    console.log("📝 Fetching project for projectId:", projectId, "clientId:", clientId);

    const res = await axios.get(`${domain}/api/project?id=${projectId}&clientId=${clientId}`);

    console.log("📦 API Response:", JSON.stringify(res.data, null, 2));

    // Handle response structure
    const responseData = res.data as any;
    if (responseData.success && responseData.data) {
      console.log("✅ Project data extracted successfully");
      return responseData.data;
    }

    // Fallback for direct data response
    console.log("⚠️ Using fallback response parsing");
    return responseData;
  } catch (error) {
    console.error("❌ Failed to fetch project:", error);
    throw error;
  }
};

export const addProject = async (data: Project, clientId: string) => {
  try {
    if (!clientId) {
      throw new Error("Client ID is required");
    }

    const projectData = {
      ...data,
      clientId,
    };

    const res = await axios.post(`${domain}/api/project`, projectData);
    const responseData = res.data as any;

    // ✅ FIXED: Handle new response structure
    if (responseData.success && responseData.data) {
      return responseData.data;
    }

    return responseData?.data ?? responseData;
  } catch (error) {
    console.error("Failed to add project:", error);
    throw error;
  }
};
