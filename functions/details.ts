import { domain } from "@/lib/domain";
import { Section } from "@/types/details";
import axios from "axios";
// Remove direct service import - we'll use callback pattern
// import SimpleNotificationService from '@/services/SimpleNotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SectionResponse {
    success: boolean;
    message: string;
    data: Section[];
}

export const getSection = async (sectionId: string): Promise<Section[]> => {
    try {
        const res = await axios.get<SectionResponse>(`${domain}/api/mini-section?sectionId=${sectionId}`);
        // The API returns { success, message, data }
        // We need to return the data array
        return res.data.data;
    } catch (error) {
        console.error('Error fetching section:', error);
        return [];
    }
}

export const addSection = async (data: any, notificationCallback?: (data: any) => Promise<boolean>) => {
    try {
        const res = await axios.post(`${domain}/api/mini-section`, data);

        if (res && res.data) {
            // 🔔 Send section creation notification using callback
            if (notificationCallback) {
                try {
                    // Get user data for notification
                    const userString = await AsyncStorage.getItem('user');
                    let userInfo = null;
                    
                    if (userString) {
                        const userData = JSON.parse(userString);
                        userInfo = {
                            fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.name || userData.username || 'Unknown User',
                        };
                    }

                    await notificationCallback({
                        projectId: data.projectId,
                        activityType: 'section_created',
                        staffName: userInfo?.fullName || 'User',
                        projectName: data.projectName || 'Project',
                        sectionName: data.name || 'Section',
                        details: `Created section "${data.name || 'Section'}"`,
                        category: 'section',
                    });
                } catch (notificationError: any) {
                    console.error('Error sending section creation notification:', notificationError);
                    // Don't fail the whole operation if notification fails
                }
            }

            return res.data; // Return the full response data including the new section
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error adding section:', error);
        return null;
    }
}

export const updateSection = async (sectionId: string, data: any, notificationCallback?: (data: any) => Promise<boolean>) => {
    try {
        const res = await axios.put(`${domain}/api/mini-section?id=${sectionId}`, data);

        if (res && res.data) {
            // 🔔 Send section update notification using callback
            if (notificationCallback) {
                try {
                    // Get user data for notification
                    const userString = await AsyncStorage.getItem('user');
                    let userInfo = null;
                    
                    if (userString) {
                        const userData = JSON.parse(userString);
                        userInfo = {
                            fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.name || userData.username || 'Unknown User',
                        };
                    }

                    await notificationCallback({
                        projectId: data.projectId,
                        activityType: 'section_updated',
                        staffName: userInfo?.fullName || 'User',
                        projectName: data.projectName || 'Project',
                        sectionName: data.name || 'Section',
                        details: `Updated section "${data.name || 'Section'}"`,
                        category: 'section',
                    });
                } catch (notificationError: any) {
                    console.error('Error sending section update notification:', notificationError);
                    // Don't fail the whole operation if notification fails
                }
            }

            return res.data;
        } else {
            return null;
        }
    } catch (error) {
        console.log('Error updating section:', error);
        return null;
    }
}

export const deleteSection = async (sectionId: string, sectionData?: { name?: string; projectId?: string; projectName?: string }, notificationCallback?: (data: any) => Promise<boolean>) => {
    try {
        const res = await axios.delete(`${domain}/api/mini-section?id=${sectionId}`);

        if (res && res.data) {
            // 🔔 Send section deletion notification using callback
            if (notificationCallback && sectionData?.projectId) {
                try {
                    // Get user data for notification
                    const userString = await AsyncStorage.getItem('user');
                    let userInfo = null;
                    
                    if (userString) {
                        const userData = JSON.parse(userString);
                        userInfo = {
                            fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.name || userData.username || 'Unknown User',
                        };
                    }

                    await notificationCallback({
                        projectId: sectionData.projectId,
                        activityType: 'section_deleted',
                        staffName: userInfo?.fullName || 'User',
                        projectName: sectionData.projectName || 'Project',
                        sectionName: sectionData.name || 'Section',
                        details: `Deleted section "${sectionData.name || 'Section'}"`,
                        category: 'section',
                    });
                } catch (notificationError: any) {
                    console.error('Error sending section deletion notification:', notificationError);
                    // Don't fail the whole operation if notification fails
                }
            }

            return res.data;
        } else {
            return null;
        }
    } catch (error) {
        console.log('Error deleting section:', error);
        return null;
    }
}

// Mini-section management functions with notifications
export const addMiniSection = async (data: any, notificationCallback?: (data: any) => Promise<boolean>) => {
    try {
        const res = await axios.post(`${domain}/api/mini-section`, data);

        if (res && res.data) {
            // 🔔 Send mini-section creation notification using callback
            if (notificationCallback) {
                try {
                    // Get user data for notification
                    const userString = await AsyncStorage.getItem('user');
                    let userInfo = null;
                    
                    if (userString) {
                        const userData = JSON.parse(userString);
                        userInfo = {
                            fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.name || userData.username || 'Unknown User',
                        };
                    }

                    await notificationCallback({
                        projectId: data.projectId,
                        activityType: 'mini_section_created',
                        staffName: userInfo?.fullName || 'User',
                        projectName: data.projectName || 'Project',
                        sectionName: data.sectionName || 'Section',
                        miniSectionName: data.name || 'Mini-Section',
                        details: `Created mini-section "${data.name || 'Mini-Section'}" in ${data.sectionName || 'Section'}`,
                        category: 'mini_section',
                    });
                } catch (notificationError: any) {
                    console.error('Error sending mini-section creation notification:', notificationError);
                    // Don't fail the whole operation if notification fails
                }
            }

            return res.data;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error adding mini-section:', error);
        return null;
    }
}

export const updateMiniSection = async (miniSectionId: string, data: any, notificationCallback?: (data: any) => Promise<boolean>) => {
    try {
        const res = await axios.put(`${domain}/api/mini-section/${miniSectionId}`, data);

        if (res && res.data) {
            // 🔔 Send mini-section update notification using callback
            if (notificationCallback) {
                try {
                    // Get user data for notification
                    const userString = await AsyncStorage.getItem('user');
                    let userInfo = null;
                    
                    if (userString) {
                        const userData = JSON.parse(userString);
                        userInfo = {
                            fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.name || userData.username || 'Unknown User',
                        };
                    }

                    await notificationCallback({
                        projectId: data.projectId,
                        activityType: 'mini_section_updated',
                        staffName: userInfo?.fullName || 'User',
                        projectName: data.projectName || 'Project',
                        sectionName: data.sectionName || 'Section',
                        miniSectionName: data.name || 'Mini-Section',
                        details: `Updated mini-section "${data.name || 'Mini-Section'}" in ${data.sectionName || 'Section'}`,
                        category: 'mini_section',
                    });
                } catch (notificationError: any) {
                    console.error('Error sending mini-section update notification:', notificationError);
                    // Don't fail the whole operation if notification fails
                }
            }

            return res.data;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error updating mini-section:', error);
        return null;
    }
}

export const deleteMiniSection = async (miniSectionId: string, miniSectionData?: { name?: string; sectionName?: string; projectId?: string; projectName?: string }, notificationCallback?: (data: any) => Promise<boolean>) => {
    try {
        const res = await axios.delete(`${domain}/api/mini-section/${miniSectionId}`);

        if (res && res.data) {
            // 🔔 Send mini-section deletion notification using callback
            if (notificationCallback && miniSectionData?.projectId) {
                try {
                    // Get user data for notification
                    const userString = await AsyncStorage.getItem('user');
                    let userInfo = null;
                    
                    if (userString) {
                        const userData = JSON.parse(userString);
                        userInfo = {
                            fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.name || userData.username || 'Unknown User',
                        };
                    }

                    await notificationCallback({
                        projectId: miniSectionData.projectId,
                        activityType: 'mini_section_deleted',
                        staffName: userInfo?.fullName || 'User',
                        projectName: miniSectionData.projectName || 'Project',
                        sectionName: miniSectionData.sectionName || 'Section',
                        miniSectionName: miniSectionData.name || 'Mini-Section',
                        details: `Deleted mini-section "${miniSectionData.name || 'Mini-Section'}" from ${miniSectionData.sectionName || 'Section'}`,
                        category: 'mini_section',
                    });
                } catch (notificationError: any) {
                    console.error('Error sending mini-section deletion notification:', notificationError);
                    // Don't fail the whole operation if notification fails
                }
            }

            return res.data;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error deleting mini-section:', error);
        return null;
    }
}
