import axios from 'axios';
import { API_CONFIG, PROJECT_NAMES, SECTION_NAMES } from './config';
import { MaterialRequest, MaterialRequestResponse, Notification } from './types';

export const fetchMaterialRequests = async (clientId: string): Promise<MaterialRequest[]> => {
    try {
        const response = await axios.get(`${API_CONFIG.baseUrl}/api/request-material?clientId=${clientId}`, {
            headers: API_CONFIG.headers,
            timeout: API_CONFIG.timeout,
        });

        if (!response || response.status < 200 || response.status >= 300) {
            throw new Error(`HTTP error! status: ${response?.status || 'unknown'}`);
        }

        const data = response.data as MaterialRequestResponse;

        if (data.success) {
            // Return all requests, not just pending ones
            return data.data;
        } else {
            throw new Error(data.message || 'Failed to fetch material requests');
        }
    } catch (error) {
        console.error('Error fetching material requests:', error);
        throw error;
    }
};

export const approveMaterialRequest = async (requestId: string): Promise<boolean> => {
    try {
        const response = await axios.post(`${API_CONFIG.baseUrl}/api/sanction`,
            {
                isApproved: true,
                id: requestId
            },
            {
                headers: API_CONFIG.headers,
                timeout: API_CONFIG.timeout,
            }
        );

        if (!response || response.status < 200 || response.status >= 300) {
            throw new Error(`HTTP error! status: ${response?.status || 'unknown'}`);
        }

        const data = response.data as { success: boolean };
        return data.success || false;
    } catch (error) {
        console.error('Error approving material request:', error);
        return false;
    }
};

export const rejectMaterialRequest = async (requestId: string): Promise<boolean> => {
    try {
        const response = await axios.post(`${API_CONFIG.baseUrl}/api/sanction`,
            {
                isApproved: false,
                id: requestId
            },
            {
                headers: API_CONFIG.headers,
                timeout: API_CONFIG.timeout,
            }
        );

        if (!response || response.status < 200 || response.status >= 300) {
            throw new Error(`HTTP error! status: ${response?.status || 'unknown'}`);
        }

        const data = response.data as { success: boolean };
        return data.success || false;
    } catch (error) {
        console.error('Error rejecting material request:', error);
        return false;
    }
};

// Helper function to convert MaterialRequest to Notification
export const convertMaterialRequestToNotification = (
    materialRequest: MaterialRequest,
    sectionName: string = 'Unknown Section',
    projectName: string = 'Unknown Project'
): Notification => {
    try {
        const materials = materialRequest.materials || [];
        const materialSummary = materials.map(m =>
            `${m.name || 'Unknown'} (${m.qnt || 0} ${m.unit || 'units'}${(m.cost && m.cost > 0) ? ` - ₹${m.cost.toLocaleString('en-IN')}` : ''})`
        ).join(', ');
        const materialCount = materials.length;
        const totalQuantity = materials.reduce((sum, m) => sum + (m.qnt || 0), 0);
        const totalCost = materials.reduce((sum, m) => sum + (m.cost || 0), 0);

        return {
            id: materialRequest._id,
            type: 'material_request',
            title: `Material Request - ${sectionName}`,
            message: `Request for ${materialCount} material type${materialCount > 1 ? 's' : ''} (Total: ${totalQuantity} items${totalCost > 0 ? `, Cost: ₹${totalCost.toLocaleString('en-IN')}` : ''}): ${materialSummary}. ${materialRequest.message || 'No additional message'}`,
            projectName: projectName,
            projectId: materialRequest.projectId,
            senderName: 'Site Engineer',
            timestamp: (materialRequest as any).createdAt || new Date().toISOString(),
            priority: 'high',
            isRead: false,
            requiresApproval: true,
            approvalStatus: materialRequest.status as 'pending' | 'approved' | 'rejected',
            permissionType: 'material_purchase',
            materialRequest: materialRequest,
            sectionName: sectionName,
        };
    } catch (error) {
        console.error('Error converting material request to notification:', error);
        // Return a fallback notification
        return {
            id: materialRequest._id || 'unknown',
            type: 'material_request',
            title: `Material Request - ${sectionName}`,
            message: 'Error processing material request details',
            projectName: projectName,
            projectId: materialRequest.projectId || 'unknown',
            senderName: 'Site Engineer',
            timestamp: new Date().toISOString(),
            priority: 'high',
            isRead: false,
            requiresApproval: true,
            approvalStatus: 'pending',
            permissionType: 'material_purchase',
            materialRequest: materialRequest,
            sectionName: sectionName,
        };
    }
};
// Helper function to get section name from sectionId
export const getSectionName = (sectionId: string): string => {
    return SECTION_NAMES[sectionId] || 'Unknown Section';
};

// Helper function to get project name from projectId
export const getProjectName = (projectId: string): string => {
    return PROJECT_NAMES[projectId] || 'Unknown Project';
};

// Generic function to handle both approve and reject
export const sanctionMaterialRequest = async (requestId: string, isApproved: boolean): Promise<boolean> => {
    try {
        const response = await axios.post(`${API_CONFIG.baseUrl}/api/sanction`,
            {
                isApproved: isApproved,
                id: requestId
            },
            {
                headers: API_CONFIG.headers,
                timeout: API_CONFIG.timeout,
            }
        );

        if (!response || response.status < 200 || response.status >= 300) {
            throw new Error(`HTTP error! status: ${response?.status || 'unknown'}`);
        }

        const data = response.data as { success: boolean };
        return data.success || false;
    } catch (error) {
        console.error(`Error ${isApproved ? 'approving' : 'rejecting'} material request:`, error);
        return false;
    }
};

// Function to mark material as imported
export const markMaterialAsImported = async (payload: any): Promise<boolean> => {
    try {
        const response = await axios.post(`${API_CONFIG.baseUrl}/api/import`, payload
        );

        if (!response || response.status < 200 || response.status >= 300) {
            throw new Error(`HTTP error! status: ${response?.status || 'unknown'}`);
        }

        const data = response.data as { success: boolean };
        return data.success || false;
    } catch (error) {
        console.error('Error marking material as imported:', error);
        return false;
    }
};

// Interface for import material request
interface IMaterial {
    _id?: string;
    name: string;
    unit: string;
    specs?: { [key: string]: string | number };
    qnt: number;
    cost: number;
}

interface IImportMaterialRequest {
    requestId: string;
    materials: IMaterial[];
}

interface IImportMaterialResponse {
    success: boolean;
    message: string;
    data?: any;
    error?: string;
}

// Function to import materials with costs
export const importMaterialsWithCosts = async (requestId: string, materials: IMaterial[]): Promise<boolean> => {
    try {
        // Create the payload according to your API specification
        const payload: IImportMaterialRequest = {
            requestId: requestId,
            materials: materials
        };

        // Console log the payload as requested
        console.log('=== IMPORT MATERIAL API PAYLOAD ===');
        console.log('Request ID:', payload.requestId);
        console.log('Materials Count:', payload.materials.length);
        console.log('Full Payload:', JSON.stringify(payload, null, 2));
        console.log('Materials Details:');
        payload.materials.forEach((material, index) => {
            console.log(`${index + 1}. ${material.name}:`);
            console.log(`   - ID: ${material._id || 'N/A'}`);
            console.log(`   - Quantity: ${material.qnt} ${material.unit}`);
            console.log(`   - Cost: ₹${material.cost.toLocaleString('en-IN')}`);
            console.log(`   - Specs:`, material.specs || {});
        });
        console.log('=====================================');

        const response = await axios.post(`${API_CONFIG.baseUrl}/api/import-material`,
            payload,
            {
                headers: API_CONFIG.headers,
                timeout: API_CONFIG.timeout,
            }
        );

        if (!response || response.status < 200 || response.status >= 300) {
            throw new Error(`HTTP error! status: ${response?.status || 'unknown'}`);
        }

        const data = response.data as IImportMaterialResponse;

        if (data.success) {
            console.log('✅ Material import successful:', data.message);
            return true;
        } else {
            console.error('❌ Material import failed:', data.error || data.message);
            return false;
        }
    } catch (error) {
        console.error('Error importing materials with costs:', error);
        return false;
    }
};