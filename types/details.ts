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
  id: string;
  name: string;
  unit: string;
  quantity: number;
  specs: Record<string, any>;
  notes: string;
  date: string;
  sectionId?: string;
}

export interface Section {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
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
