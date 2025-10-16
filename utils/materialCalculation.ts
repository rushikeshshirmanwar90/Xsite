import {
  importedMaterials,
  predefinedSections,
  usedMaterials,
} from "@/data/details";
import { Material } from "@/types/details";

export const formatPrice = (price: number): string => {
  return `₹${price.toLocaleString("en-IN")}`;
};

export const getImportedQuantity = (material: Material): number => {
  const importedMaterial = importedMaterials.find((m) => m.id === material.id);
  return importedMaterial ? importedMaterial.quantity : 0;
};

export const getAvailableQuantity = (material: Material): number => {
  const importedMaterial = importedMaterials.find((m) => m.id === material.id);
  const usedMaterial = usedMaterials.find((m) => m.id === material.id);

  if (!importedMaterial) return 0;
  if (!usedMaterial) return importedMaterial.quantity;

  return importedMaterial.quantity - usedMaterial.quantity;
};

export const getAvailabilityPercentage = (material: Material): number => {
  const importedMaterial = importedMaterials.find((m) => m.id === material.id);
  const usedMaterial = usedMaterials.find((m) => m.id === material.id);

  if (!importedMaterial) return 0;
  if (!usedMaterial) return 100;

  const available = importedMaterial.quantity - usedMaterial.quantity;
  return Math.round((available / importedMaterial.quantity) * 100);
};

export const getQuantityWasted = (material: Material): number => {
  const usedMaterial = usedMaterials.find((m) => m.id === material.id);
  if (!usedMaterial) return 0;
  return Math.round(usedMaterial.quantity * 0.1);
};

export const getSectionName = (sectionId: string | undefined): string => {
  if (!sectionId) return "Unassigned";
  const section = predefinedSections.find((s) => s.id === sectionId);
  return section ? section.name : "Unassigned";
};

export const calculateTotalCost = (materials: Material[]): number => {
  return materials.reduce((sum, material) => sum + material.price, 0);
};
