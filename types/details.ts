import { Ionicons } from "@expo/vector-icons";

export interface Material {
  id: number;
  _id?: string; // MongoDB _id for API calls
  name: string;
  quantity: number;
  unit: string;
  price: number;
  perUnitCost?: number; // Per-unit cost (same as price, but explicit)
  totalCost?: number; // Total cost for the quantity
  date: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  sectionId?: string;
  miniSectionId?: string;
  specs?: Record<string, any>;
  addedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  contractor_name?: string;
  paymentStatus?: 'full' | 'partial' | 'unpaid'; // Vendor payment state for this batch
  amountPaid?: number; // Amount already paid to the vendor for this batch
  phaseId?: string; // Construction phase this usage was recorded against (used materials only)
  phaseName?: string; // e.g. "Slab Work", "Column Work"
}

export interface MaterialEntry {
  name: string;
  unit: string;
  qnt: number;
  specs: Record<string, any>;
  cost?: number;
}

export interface ProjectDetails {
  projectName: string;
  projectId: string;
}

export interface MainSectionDetails {
  sectionName: string;
  sectionId: string;
}

export interface Section {
  _id: string;
  name: string;
  projectDetails: ProjectDetails;
  mainSectionDetails: MainSectionDetails;
  MaterialUsed: any[];
  MaterialAvailable: any[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  activePhaseId?: string;
}

export interface MaterialTemplate {
  name: string;
  unit: string;
  specFields: string[];
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export type SpecField =
  | { type: "text" | "number"; label: string; placeholder?: string }
  | { type: "select"; label: string; options: string[] };
