import { MaterialTemplate, SpecField } from "@/types/details";

export const MATERIAL_TEMPLATES: Record<string, MaterialTemplate> = {
  steel_road: {
    name: "Steel Road",
    category: "structural",
    unit: "meter",
    specFields: ["diameter", "length", "weight"],
    icon: "barbell-outline",
    color: "#64748B",
  },
  brick: {
    name: "Brick",
    category: "walls",
    unit: "pieces",
    specFields: ["type", "quality"],
    icon: "grid-outline",
    color: "#DC2626",
  },
  electric_pipe: {
    name: "Electric Pipe",
    category: "electrical",
    unit: "meter",
    specFields: ["diameter", "material"],
    icon: "flash-outline",
    color: "#F59E0B",
  },
  electric_wire: {
    name: "Electric Wire",
    category: "electrical",
    unit: "meter",
    specFields: ["sqmm", "meter", "material", "color"],
    icon: "flash-outline",
    color: "#F59E0B",
  },
  plumbing_pipe: {
    name: "Plumbing Pipe",
    category: "plumbing",
    unit: "meter",
    specFields: ["itemType", "diameter", "material"],
    icon: "water-outline",
    color: "#3B82F6",
  },
  granite_sheet: {
    name: "Granite Sheet",
    category: "finishing",
    unit: "sheets",
    specFields: ["size", "thickness", "color"],
    icon: "cube-outline",
    color: "#8B5CF6",
  },
  wall_putty: {
    name: "Wall Putty",
    category: "finishing",
    unit: "bags",
    specFields: ["brand", "coverage"],
    icon: "color-palette-outline",
    color: "#EF4444",
  },
};

export const SPEC_FIELD_CONFIG: Record<string, SpecField> = {
  diameter: {
    type: "text",
    label: "Diameter",
    placeholder: "e.g., 8mm, 2inch",
  },
  length: { type: "text", label: "Length", placeholder: "e.g., 20feet, 100m" },
  weight: { type: "text", label: "Weight", placeholder: "e.g., 50kg" },
  sqmm: { type: "number", label: "SQ.MM", placeholder: "e.g., 6, 10" },
  meter: { type: "number", label: "Meter", placeholder: "Enter meters" },
  size: { type: "text", label: "Size", placeholder: "e.g., 2x4 feet" },
  thickness: { type: "text", label: "Thickness", placeholder: "e.g., 16mm" },
  material: {
    type: "select",
    label: "Material",
    options: ["copper", "aluminum", "PVC", "metal", "other"],
  },
  itemType: {
    type: "select",
    label: "Item Type",
    options: ["pipe", "fitting", "valve", "junction", "other"],
  },
  color: { type: "text", label: "Color", placeholder: "Enter color" },
  brand: { type: "text", label: "Brand", placeholder: "Enter brand" },
  coverage: { type: "text", label: "Coverage", placeholder: "sq ft per bag" },
  type: {
    type: "select",
    label: "Type",
    options: ["standard", "jumbo", "interlocking"],
  },
  quality: {
    type: "select",
    label: "Quality",
    options: ["A1", "B1", "C1"],
  },
};

export const CATEGORIES = [
  "foundation",
  "structural",
  "walls",
  "electrical",
  "plumbing",
  "finishing",
  "other",
];

export const UNITS = [
  "kg",
  "meter",
  "sqmm",
  "pieces",
  "sheets",
  "cubic_meter",
  "bags",
];

export const STATUSES = ["received", "in_use", "stored", "damaged"] as const;
