import { domain } from "@/lib/domain";
import { Staff } from "@/types/staff";
import axios from "axios";

export const addStaff = async (staff: Staff): Promise<any | null> => {
  try {
    const res = await axios.post(`${domain}/api/staff`, staff);
    return res.data?.data ?? null;
  } catch {
    return null;
  }
};
