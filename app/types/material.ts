import { MaterialIconName } from '../components/types/common';

export interface Material {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  date: string;
  icon: MaterialIconName;
  color: string;
}

export interface MaterialEntry {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  location: string;
  status: 'received' | 'in_use' | 'stored' | 'damaged';
  specs: Record<string, any>;
  notes: string;
  date: string;
}

export interface MaterialTemplate {
  name: string;
  category: string;
  unit: string;
  specFields: string[];
  icon: MaterialIconName;
  color: string;
}

export type SpecField = {
  type: 'text' | 'number' | 'select';
  label: string;
  placeholder?: string;
  options?: string[];
};

export type MaterialFormData = {
  name: string;
  category: string;
  unit: string;
  quantity: string;
  location: string;
  status: 'received' | 'in_use' | 'stored' | 'damaged';
  specs: Record<string, any>;
  notes: string;
};
