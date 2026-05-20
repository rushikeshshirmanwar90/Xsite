export type SpecFieldType = 'select' | 'number' | 'text';

export interface SpecFieldConfig {
  label: string;
  type: SpecFieldType;
  options?: string[];
  placeholder: string;
}

export interface MaterialTemplate {
  name: string;
  unit: string;
  icon: string;
  specFields: string[];
}

export interface InternalMaterial {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  perUnitCost: number; // ✅ UPDATED: Use perUnitCost instead of cost
  specs: Record<string, string | number | boolean>;
  date: string;
  contractor_name?: string; // ✅ NEW: Contractor name field
}

export interface MaterialFormData {
  name: string;
  unit: string;
  quantity: string;
  perUnitCost: string; // ✅ UPDATED: Use perUnitCost instead of cost
  specs: Record<string, any>;
  contractor_name?: string; // ✅ NEW: Contractor name field
}

export interface CustomSpec {
  key: string;
  value: string;
}
