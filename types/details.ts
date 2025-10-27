import { Ionicons } from "@expo/vector-icons";

export interface Material {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  date: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  sectionId?: string;
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
