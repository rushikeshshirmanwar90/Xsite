import { domain } from "@/lib/domain";
import { Project } from "@/types/project";
import axios from "axios";

export const getProjectData = async (
  clientId: string,
  page: number = 1,
  limit: number = 10
) => {
  try {
    if (!clientId) {
      throw new Error("Client ID is required");
    }

    console.log(
      "📝 Fetching projects for clientId:",
      clientId,
      "page:",
      page,
      "limit:",
      limit
    );
    const res = await axios.get(
      `${domain}/api/project?clientId=${clientId}&page=${page}&limit=${limit}`
    );

    console.log("📦 API Response:", JSON.stringify(res.data, null, 2));

    // ✅ Handle paginated response structure
    const responseData = res.data as any;
    if (responseData.success && responseData.data) {
      const projects = responseData.data.projects || [];
      const meta = responseData.data.meta || {
        page: 1,
        limit: 10,
        total: projects.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      };
      console.log(
        "✅ Projects extracted:",
        projects.length,
        "Total:",
        meta.total
      );
      return { projects, meta };
    }

    // Fallback for old response format
    console.log("⚠️ Using fallback response parsing");
    const projects = Array.isArray(res.data) ? res.data : [];
    return {
      projects,
      meta: {
        page: 1,
        limit: 10,
        total: projects.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  } catch (error) {
    console.error("❌ Failed to fetch project data:", error);
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
