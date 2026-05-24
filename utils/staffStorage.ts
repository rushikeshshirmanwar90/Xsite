import AsyncStorage from '@react-native-async-storage/async-storage';
import { StaffMembers } from '@/types/staff';

const STAFF_STORAGE_KEY = 'cached_staff_members';

export const staffStorage = {
    // Save staff data to AsyncStorage
    async saveStaffData(clientId: string, staffData: StaffMembers[]): Promise<void> {
        try {
            const key = `${STAFF_STORAGE_KEY}_${clientId}`;
            await AsyncStorage.setItem(key, JSON.stringify({
                data: staffData,
                timestamp: Date.now(),
                clientId
            }));
            console.log('✅ Staff data saved to storage:', staffData.length, 'members');
        } catch (error) {
            console.error('❌ Error saving staff data to storage:', error);
        }
    },

    // Get staff data from AsyncStorage
    async getStaffData(clientId: string): Promise<StaffMembers[] | null> {
        try {
            const key = `${STAFF_STORAGE_KEY}_${clientId}`;
            const stored = await AsyncStorage.getItem(key);
            
            if (!stored) {
                return null;
            }

            const parsed = JSON.parse(stored);
            
            // Check if data is less than 5 minutes old
            const isRecent = (Date.now() - parsed.timestamp) < (5 * 60 * 1000);
            
            if (isRecent && parsed.clientId === clientId) {
                console.log('✅ Retrieved cached staff data:', parsed.data.length, 'members');
                return parsed.data;
            } else {
                console.log('⚠️ Cached staff data is stale, will fetch fresh data');
                return null;
            }
        } catch (error) {
            console.error('❌ Error getting staff data from storage:', error);
            return null;
        }
    },

    // Clear staff data from AsyncStorage
    async clearStaffData(clientId: string): Promise<void> {
        try {
            const key = `${STAFF_STORAGE_KEY}_${clientId}`;
            await AsyncStorage.removeItem(key);
            console.log('✅ Staff data cleared from storage');
        } catch (error) {
            console.error('❌ Error clearing staff data from storage:', error);
        }
    },

    // Add a single staff member to cached data
    async addStaffMember(clientId: string, newStaff: StaffMembers): Promise<void> {
        try {
            const currentData = await this.getStaffData(clientId) || [];
            const updatedData = [...currentData, newStaff];
            await this.saveStaffData(clientId, updatedData);
            console.log('✅ Staff member added to cache:', newStaff.fullName);
        } catch (error) {
            console.error('❌ Error adding staff member to cache:', error);
        }
    },

    // Remove a staff member from cached data
    async removeStaffMember(clientId: string, staffId: string): Promise<void> {
        try {
            const currentData = await this.getStaffData(clientId) || [];
            const updatedData = currentData.filter(staff => staff._id !== staffId);
            await this.saveStaffData(clientId, updatedData);
            console.log('✅ Staff member removed from cache:', staffId);
        } catch (error) {
            console.error('❌ Error removing staff member from cache:', error);
        }
    }
};