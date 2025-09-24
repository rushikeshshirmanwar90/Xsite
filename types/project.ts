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
  sections?: ProjectSection[];
  materialUsage?: MaterialUsage[];
}

export interface ProjectSection {
  id: string;
  name: string;
  description: string;
  budget: number;
  spent: number;
  progress: number;
  startDate?: string;
  endDate?: string;
  status: "not_started" | "in_progress" | "completed" | "delayed";
  materials: SectionMaterial[];
  dependencies?: string[]; // IDs of sections that must be completed first
}

export interface SectionMaterial {
  materialId: string;
  name: string;
  plannedQuantity: number;
  usedQuantity: number;
  wastedQuantity: number;
  unit: string;
  costPerUnit: number;
}

export interface MaterialUsage {
  id: string;
  name: string;
  totalUsed: number;
  totalWasted: number;
  totalOrdered: number;
  unit: string;
  costPerUnit: number;
  category: "construction" | "finishing" | "electrical" | "plumbing" | "other";
}

export interface Activity {
  id?: number | string;
  type: "received" | "issued" | "ordered";
  material: string;
  quantity: string;
  date: string;
  sectionId?: string; // Which section this activity belongs to
}

export interface BudgetAnalysis {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  budgetUtilization: number;
  projectedOverspend?: number;
  sectionBreakdown: SectionBudget[];
}

export interface SectionBudget {
  sectionId: string;
  sectionName: string;
  allocatedBudget: number;
  spentBudget: number;
  remainingBudget: number;
  utilizationPercentage: number;
}
