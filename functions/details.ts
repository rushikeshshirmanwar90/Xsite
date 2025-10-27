import { domain } from "@/lib/domain";
import axios from "axios";
import { Section } from "@/types/details";

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

        if (res) {
            return true
        } else {
            return false
        }
    } catch (error) {
        console.log('Error', error)
        return false
    }
}
