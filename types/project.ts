import { StaffMembers } from "./staff";

// Types
export interface Project {
  _id?: string | string;
  name: string;
  address: string;
  description: string;
  assignedStaff: StaffMembers[];
  budget?: number;
  spent?: number;
  progress?: number;
  section?: ProjectSection[];
  MaterialAvailable?: MaterialItem[];
  MaterialUsed?: MaterialItem[];
  Labors?: LaborItem[]; // Added for labor expense tracking
  clientName?: string; // Added for staff users to show client name
  clientId?: string; // Added for staff users to show client ID
}

export interface MaterialItem {
  _id: string;
  name: string;
  unit: string;
  specs: Record<string, any>;
  qnt: number;
  cost: number;
  totalCost?: number; // Added for consistency with labor items
}

export interface LaborItem {
  _id?: string;
  type: string;
  category: string;
  count: number;
  perLaborCost: number;
  totalCost: number;
  status?: string;
  addedAt?: Date;
  notes?: string;
  workDate?: Date;
  miniSectionId?: string;
  miniSectionName?: string;
  sectionId?: string;
}

export interface ProjectSection {
  _id: string;
  sectionId: string;
  name: string;
  type: string;

  // progress: number;
  // status: "not_started" | "in_progress" | "completed" | "delayed";
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
