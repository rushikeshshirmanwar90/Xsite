import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { StaffMembers } from '@/types/staff';
import apiClient from '@/utils/axiosConfig';

interface StaffContextType {
    staffMembers: StaffMembers[];
    loading: boolean;
    refreshStaffData: (clientId: string) => Promise<void>;
    addStaffMember: (staff: StaffMembers) => void;
    removeStaffMember: (staffId: string) => void;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

interface StaffProviderProps {
    children: ReactNode;
}

export const StaffProvider: React.FC<StaffProviderProps> = ({ children }) => {
    const [staffMembers, setStaffMembers] = useState<StaffMembers[]>([]);
    const [loading, setLoading] = useState(false);

    const refreshStaffData = useCallback(async (clientId: string) => {
        if (!clientId || clientId === 'unknown') {
            console.log('⏸️ Skipping staff fetch - clientId not available yet');
            return;
        }

        setLoading(true);
        try {
            console.log('📡 Fetching staff for clientId:', clientId);
            const res = await apiClient.get(`/api/staff?clientId=${clientId}`);
            const data = (res.data as any)?.data || [];
            const filterData = data.map((item: any) => ({
                fullName: `${item.firstName} ${item.lastName}`,
                _id: item._id,
            }));
            setStaffMembers(filterData);
            console.log('✅ Staff data loaded:', filterData.length, 'members');
        } catch (error) {
            console.error('Error fetching staff:', error);
            if ((error as any)?.response?.status !== 400) {
                console.error('Staff fetch error details:', (error as any)?.response?.data);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const addStaffMember = useCallback((staff: StaffMembers) => {
        setStaffMembers(prev => [...prev, staff]);
    }, []);

    const removeStaffMember = useCallback((staffId: string) => {
        setStaffMembers(prev => prev.filter(staff => staff._id !== staffId));
    }, []);

    const value: StaffContextType = {
        staffMembers,
        loading,
        refreshStaffData,
        addStaffMember,
        removeStaffMember,
    };

    return (
        <StaffContext.Provider value={value}>
            {children}
        </StaffContext.Provider>
    );
};

export const useStaff = (): StaffContextType => {
    const context = useContext(StaffContext);
    if (!context) {
        throw new Error('useStaff must be used within a StaffProvider');
    }
    return context;
};