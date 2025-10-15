// Material Types and Interfaces

// Base Material Interface
export interface Material {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  date: string;
  period?: string;
  wastedQuantity?: number;
  characteristics?: MaterialCharacteristics;
}

// Material Characteristics Interface
export interface MaterialCharacteristics {
  type: 'steel_rod' | 'brick' | 'electrical' | 'plumbing' | 'granite' | 'wall_putty';
  details: SteelRodCharacteristics | BrickCharacteristics | ElectricalCharacteristics | 
           PlumbingCharacteristics | GraniteCharacteristics | WallPuttyCharacteristics;
}

// Steel Rod Characteristics
export interface SteelRodCharacteristics {
  sizes: string[];
  rodLength: number;
}

// Brick Characteristics
export interface BrickCharacteristics {
  brickQuantity: number;
}

// Electrical Characteristics
export interface ElectricalCharacteristics {
  wireSqmm: number;
  wireMeters: number;
  hasPipes: boolean;
}

// Plumbing Characteristics
export interface PlumbingCharacteristics {
  pipeType: string;
  pipeDiameter: number;
  pipeLength: number;
}

// Granite Characteristics
export interface GraniteCharacteristics {
  color: string;
  thickness: number;
  area: number;
}

// Wall Putty Characteristics
export interface WallPuttyCharacteristics {
  brand: string;
  coverage: number;
  coats: number;
}

// Period Type
export interface Period {
  id: string;
  name: string;
}