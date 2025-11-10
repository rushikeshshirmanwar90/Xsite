import { domain } from "@/lib/domain";
import { Section } from "@/types/details";
import axios from "axios";

interface SectionResponse {
    success: boolean;
    message: string;
    data: Section[];
}

export const getSection = async (sectionId: string): Promise<Section[]> => {
    try {
        console.log("sectionId :", sectionId)
        const res = await axios.get<SectionResponse>(`${domain}/api/mini-section?sectionId=${sectionId}`);
        // The API returns { success, message, data }
        // We need to return the data array
        return res.data.data;
    } catch (error) {
        console.log("sectionId :", sectionId)
        console.log("somthing went wrong")
        console.error('Error', error);
        return [];
    }
}

export const addSection = async (data: any) => {
    try {
        const res = await axios.post(`${domain}/api/mini-section`, data);

        if (res && res.data) {
            return res.data; // Return the full response data including the new section
        } else {
            return null;
        }
    } catch (error) {
        console.log('Error', error);
        return null;
    }
}

export const updateSection = async (sectionId: string, data: any) => {
    try {
        const res = await axios.put(`${domain}/api/mini-section?id=${sectionId}`, data);

        if (res && res.data) {
            return res.data;
        } else {
            return null;
        }
    } catch (error) {
        console.log('Error updating section:', error);
        return null;
    }
}

export const deleteSection = async (sectionId: string) => {
    try {
        const res = await axios.delete(`${domain}/api/mini-section?id=${sectionId}`);

        if (res && res.data) {
            return res.data;
        } else {
            return null;
        }
    } catch (error) {
        console.log('Error deleting section:', error);
        return null;
    }
}
