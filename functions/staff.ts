import { domain } from "@/lib/domain";
import { Staff } from "@/types/staff";
import axios from "axios";

export const addStaff = async (staff: Staff): Promise<any | null> => {
  try {
    console.log('📤 Adding staff via API:', `${domain}/api/users/staff`);
    console.log('📋 Staff payload:', staff);
    
    const res = await axios.post(`${domain}/api/users/staff`, staff);
    console.log('✅ Staff API response:', res.data);
    
    return res.data?.data ?? null;
  } catch (error: any) {
    console.error('❌ Error in addStaff function:', error);
    console.error('❌ Error response:', error.response?.data);
    return null;
  }
};
