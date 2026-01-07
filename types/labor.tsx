import { Ionicons } from "@expo/vector-icons";

export interface Labor {
  id: number;
  _id?: string; // MongoDB _id for API calls
  type: string;
  category: string;
  count: number;
  perLaborCost: number;
  totalCost: number;
  date: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  sectionId?: string;
  miniSectionId?: string;
  addedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LaborEntry {
  type: string;
  category: string;
  count: number;
  perLaborCost: number;
}

export interface LaborCategory {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  types: string[];
}

export const laborCategories: LaborCategory[] = [
  {
    id: 'civil',
    name: 'Civil Works Labour',
    icon: 'hammer-outline',
    color: '#EF4444',
    types: ['Mason', 'Helper', 'Concrete Worker', 'Excavator Operator', 'General Laborer']
  },
  {
    id: 'electrical',
    name: 'Electrical Works Labour',
    icon: 'flash-outline',
    color: '#F59E0B',
    types: ['Electrician', 'Electrical Helper', 'Cable Puller', 'Panel Fitter']
  },
  {
    id: 'plumbing',
    name: 'Plumbing & Sanitary Labour',
    icon: 'water-outline',
    color: '#3B82F6',
    types: ['Plumber', 'Pipe Fitter', 'Sanitary Fitter', 'Plumbing Helper']
  },
  {
    id: 'carpentry',
    name: 'Carpentry & Shuttering Labour',
    icon: 'construct-outline',
    color: '#84CC16',
    types: ['Carpenter', 'Shuttering Worker', 'Wood Worker', 'Formwork Specialist']
  },
  {
    id: 'steel',
    name: 'Steel / Reinforcement Labour',
    icon: 'barbell-outline',
    color: '#6B7280',
    types: ['Bar Bender', 'Steel Fixer', 'Welder', 'Steel Helper']
  },
  {
    id: 'finishing',
    name: 'Finishing Works Labour',
    icon: 'brush-outline',
    color: '#EC4899',
    types: ['Plasterer', 'Finisher', 'Polisher', 'Texture Worker']
  },
  {
    id: 'painting',
    name: 'Painting Labour',
    icon: 'color-palette-outline',
    color: '#8B5CF6',
    types: ['Painter', 'Spray Painter', 'Primer Applicator', 'Paint Helper']
  },
  {
    id: 'flooring',
    name: 'Flooring & Tiling Labour',
    icon: 'grid-outline',
    color: '#06B6D4',
    types: ['Tile Fitter', 'Flooring Specialist', 'Marble Fitter', 'Granite Worker']
  },
  {
    id: 'waterproofing',
    name: 'Waterproofing Labour',
    icon: 'shield-outline',
    color: '#10B981',
    types: ['Waterproofing Specialist', 'Membrane Applicator', 'Sealant Worker']
  },
  {
    id: 'hvac',
    name: 'HVAC / Mechanical Labour',
    icon: 'thermometer-outline',
    color: '#F97316',
    types: ['HVAC Technician', 'Duct Installer', 'AC Mechanic', 'Ventilation Worker']
  },
  {
    id: 'firefighting',
    name: 'Fire Fighting Labour',
    icon: 'flame-outline',
    color: '#DC2626',
    types: ['Fire System Installer', 'Sprinkler Fitter', 'Fire Safety Technician']
  },
  {
    id: 'external',
    name: 'External Development Labour',
    icon: 'leaf-outline',
    color: '#65A30D',
    types: ['Landscaper', 'Gardener', 'Paving Worker', 'External Finisher']
  },
  {
    id: 'equipment',
    name: 'Equipment Operator',
    icon: 'car-outline',
    color: '#7C2D12',
    types: ['Crane Operator', 'JCB Operator', 'Mixer Operator', 'Loader Operator']
  },
  {
    id: 'supervision',
    name: 'Site Supervision Staff',
    icon: 'people-outline',
    color: '#1E40AF',
    types: ['Site Engineer', 'Supervisor', 'Foreman', 'Quality Inspector']
  },
  {
    id: 'security',
    name: 'Security & Housekeeping',
    icon: 'shield-checkmark-outline',
    color: '#374151',
    types: ['Security Guard', 'Watchman', 'Cleaner', 'Housekeeping Staff']
  }
];