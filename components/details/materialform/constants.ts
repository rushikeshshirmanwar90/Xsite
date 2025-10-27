import { MaterialTemplate, SpecFieldConfig } from './types';

// Top 8 Most Used Construction Materials
export const MATERIAL_TEMPLATES: Record<string, MaterialTemplate> = {
  // 1. Cement - Most essential binding material
  cement: {
    name: 'Cement',
    unit: 'bags',
    icon: 'business',
    specFields: ['brand', 'grade', 'weight']
  },

  // 2. Steel/TMT Bars - Primary reinforcement material
  steel: {
    name: 'Steel Rod (TMT Bar)',
    unit: 'kg',
    icon: 'barbell',
    specFields: ['diameter', 'grade', 'brand']
  },

  // 3. Bricks - Main wall construction material
  brick: {
    name: 'Brick',
    unit: 'pieces',
    icon: 'square',
    specFields: ['type', 'size', 'class']
  },

  // 4. Sand - Essential for mortar and concrete
  sand: {
    name: 'Sand',
    unit: 'cubic feet',
    icon: 'layers',
    specFields: ['type', 'grade']
  },

  // 5. Aggregate/Stone - For concrete and foundation
  aggregate: {
    name: 'Aggregate (Stone)',
    unit: 'cubic feet',
    icon: 'diamond',
    specFields: ['size', 'type']
  },

  // 6. Paint - Finishing material
  paint: {
    name: 'Paint',
    unit: 'liters',
    icon: 'color-palette',
    specFields: ['type', 'brand', 'color']
  },

  // 7. Tiles - Flooring and wall finishing
  tiles: {
    name: 'Tiles',
    unit: 'boxes',
    icon: 'grid',
    specFields: ['type', 'size', 'finish']
  },

  // 8. Wood/Timber - Doors, windows, and formwork
  wood: {
    name: 'Wood (Timber)',
    unit: 'cubic feet',
    icon: 'leaf',
    specFields: ['type', 'size', 'quality']
  },
};

// Specification Field Configurations
export const SPEC_FIELD_CONFIG: Record<string, SpecFieldConfig> = {
  // Cement specifications
  brand: {
    label: 'Brand',
    type: 'select',
    options: ['UltraTech', 'ACC', 'Ambuja', 'Shree', 'Birla', 'JK Cement', 'Dalmia', 'Other'],
    placeholder: 'Select brand'
  },
  grade: {
    label: 'Grade',
    type: 'select',
    options: ['OPC 33', 'OPC 43', 'OPC 53', 'PPC', 'PSC'],
    placeholder: 'Select grade'
  },
  weight: {
    label: 'Weight per Bag',
    type: 'select',
    options: ['50 kg', '40 kg', '25 kg'],
    placeholder: 'Select weight'
  },

  // Steel specifications
  diameter: {
    label: 'Diameter (mm)',
    type: 'select',
    options: ['6mm', '8mm', '10mm', '12mm', '16mm', '20mm', '25mm', '32mm'],
    placeholder: 'Select diameter'
  },

  // Brick specifications
  type: {
    label: 'Type',
    type: 'select',
    options: ['Red Clay', 'Fly Ash', 'Concrete', 'AAC Block', 'Hollow Block'],
    placeholder: 'Select type'
  },
  size: {
    label: 'Size',
    type: 'select',
    options: ['4 inch', '6 inch', '8 inch', '9 inch', '230x110x70mm', '230x110x100mm', 'Custom'],
    placeholder: 'Select size'
  },
  class: {
    label: 'Class',
    type: 'select',
    options: ['First Class', 'Second Class', 'Third Class'],
    placeholder: 'Select class'
  },

  // Sand specifications
  sandType: {
    label: 'Type',
    type: 'select',
    options: ['River Sand', 'M-Sand (Manufactured)', 'Coarse Sand', 'Fine Sand'],
    placeholder: 'Select sand type'
  },
  sandGrade: {
    label: 'Grade',
    type: 'select',
    options: ['Fine', 'Medium', 'Coarse'],
    placeholder: 'Select grade'
  },

  // Aggregate specifications
  aggregateSize: {
    label: 'Size',
    type: 'select',
    options: ['10mm', '20mm', '40mm', 'Mixed'],
    placeholder: 'Select size'
  },
  aggregateType: {
    label: 'Type',
    type: 'select',
    options: ['Crushed Stone', 'Gravel', 'Blue Metal'],
    placeholder: 'Select type'
  },

  // Paint specifications
  paintType: {
    label: 'Type',
    type: 'select',
    options: ['Emulsion', 'Enamel', 'Distemper', 'Primer', 'Putty', 'Texture'],
    placeholder: 'Select paint type'
  },
  paintBrand: {
    label: 'Brand',
    type: 'select',
    options: ['Asian Paints', 'Berger', 'Nerolac', 'Dulux', 'Indigo', 'Other'],
    placeholder: 'Select brand'
  },
  color: {
    label: 'Color',
    type: 'text',
    placeholder: 'Enter color name'
  },

  // Tiles specifications
  tilesType: {
    label: 'Type',
    type: 'select',
    options: ['Vitrified', 'Ceramic', 'Porcelain', 'Marble', 'Granite'],
    placeholder: 'Select tiles type'
  },
  tilesSize: {
    label: 'Size',
    type: 'select',
    options: ['2x2 feet', '2x4 feet', '600x600mm', '800x800mm', '1200x600mm'],
    placeholder: 'Select size'
  },
  finish: {
    label: 'Finish',
    type: 'select',
    options: ['Glossy', 'Matte', 'Polished', 'Rustic'],
    placeholder: 'Select finish'
  },

  // Wood specifications
  woodType: {
    label: 'Type',
    type: 'select',
    options: ['Teak', 'Sal', 'Pine', 'Plywood', 'MDF', 'Hardwood'],
    placeholder: 'Select wood type'
  },
  woodSize: {
    label: 'Size',
    type: 'text',
    placeholder: 'e.g., 4x2 inch, 6x3 inch'
  },
  quality: {
    label: 'Quality',
    type: 'select',
    options: ['A Grade', 'B Grade', 'C Grade', 'Commercial'],
    placeholder: 'Select quality'
  },
};

export const UNIT_OPTIONS = [
  'kg',           // Steel, cement (sometimes)
  'bags',         // Cement
  'pieces',       // Bricks, blocks
  'cubic feet',   // Sand, aggregate, wood
  'cubic meter',  // Large volume materials
  'liters',       // Paint, chemicals
  'boxes',        // Tiles, fittings
  'sqft',         // Area-based materials
  'meter',        // Length-based materials
  'sheets',       // Plywood, boards
  'tons',         // Bulk materials
];
