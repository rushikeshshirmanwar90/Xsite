import { StaffMembers } from "./staff";

// Types
export interface Project {
  _id?: number | string;
  name: string;
  address: string;
  location?: string; // For backward compatibility
  description: string;
  assignedStaff: StaffMembers[];
  budget?: number;
  spent?: number;
  status?: "active" | "planning" | "completed";
  progress?: number;
  startDate?: string;
  endDate?: string;
}

export interface Activity {
  id?: number | string;
  type: "received" | "issued" | "ordered";
  material: string;
  quantity: string;
  date: string;
}
