import { MaterialTemplate, SpecFieldConfig } from './types';

export const MATERIAL_TEMPLATES: Record<string, MaterialTemplate> = {
  steel: { name: 'Steel Rod', unit: 'kg', icon: 'build', specFields: ['grade', 'diameter'] },
  brick: { name: 'Brick', unit: 'pieces', icon: 'cube', specFields: ['type'] },
  cement: { name: 'Cement', unit: 'bags', icon: 'business', specFields: ['grade'] },
};

export const SPEC_FIELD_CONFIG: Record<string, SpecFieldConfig> = {
  diameter: { label: 'Diameter', type: 'number', placeholder: 'Enter diameter in mm' },
  type: { label: 'Type', type: 'select', options: ['Red', 'Concrete', 'Fly Ash'], placeholder: 'Select type' },
};

export const UNIT_OPTIONS = ['kg', 'meter', 'sqmm', 'pieces', 'sheets', 'cubic_meter', 'bags'];
