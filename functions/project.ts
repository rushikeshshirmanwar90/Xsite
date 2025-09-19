import { domain } from "@/lib/domain";
import { Project } from "@/types/project";
import axios from "axios";

export const getProjectData = async (clientId: string) => {
  try {
    if (!clientId) {
      throw new Error('Client ID is required');
    }
    console.log('clientId', clientId);
    const res = await axios.get(`${domain}/api/project?clientId=${clientId}`);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch project data:", error);
    throw error;
  }
};

export const addProject = async (data: Project, clientId: string) => {
  try {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    const projectData = {
      ...data,
      clientId
    };

    const res = await axios.post(`${domain}/api/project`, projectData);
    return res.data?.data ?? res.data;
  } catch (error) {
    console.error("Failed to add project:", error);
    throw error;
  }
};