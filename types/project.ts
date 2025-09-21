import { StaffMembers } from "./staff";

// Types
export interface Project {
  _id?: number | string;
  name: string;
  address: string;
  description: string;
  assignedStaff: StaffMembers[];
  budget?: number;
  spent?: number;
  status?: "active" | "planning" | "completed";
  progress?: number;
}

export interface Activity {
  type: "received" | "issued" | "ordered";
  material: string;
  quantity: string;
  date: string;
}
