import { domain } from "@/lib/domain";
import axios from "axios";

export const getSection = async (sectionId: string) => {
    try {
        const res = await axios.get(`${domain}/api/mini-seciton?sectionId=${sectionId}`);

        const data = res.data;

        return data;
    } catch (error) {
        console.error('Error', error);

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
