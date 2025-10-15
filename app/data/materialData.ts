import { Material } from '../types/materialTypes';

// Sample data for imported materials
export const importedMaterials: Material[] = [
  {
    id: '1',
    name: 'Steel Rebar',
    category: 'Steel',
    quantity: 500,
    unit: 'kg',
    price: 65,
    date: '2023-06-15',
    characteristics: {
      type: 'steel_rod',
      details: {
        sizes: ['8mm', '10mm', '12mm'],
        rodLength: 12
      }
    }
  },
  {
    id: '2',
    name: 'Bricks',
    category: 'Masonry',
    quantity: 2000,
    unit: 'pcs',
    price: 8,
    date: '2023-06-10',
    characteristics: {
      type: 'brick',
      details: {
        brickQuantity: 2000
      }
    }
  },
  {
    id: '3',
    name: 'Electrical Wiring',
    category: 'Electrical',
    quantity: 200,
    unit: 'm',
    price: 45,
    date: '2023-06-05',
    characteristics: {
      type: 'electrical',
      details: {
        wireSqmm: 2.5,
        wireMeters: 200,
        hasPipes: true
      }
    }
  },
  {
    id: '4',
    name: 'PVC Pipes',
    category: 'Plumbing',
    quantity: 100,
    unit: 'm',
    price: 120,
    date: '2023-06-01',
    characteristics: {
      type: 'plumbing',
      details: {
        pipeType: 'PVC',
        pipeDiameter: 25,
        pipeLength: 100
      }
    }
  },
  {
    id: '5',
    name: 'Granite',
    category: 'Finishing',
    quantity: 50,
    unit: 'sqm',
    price: 1800,
    date: '2023-05-28',
    characteristics: {
      type: 'granite',
      details: {
        color: 'Black',
        thickness: 20,
        area: 50
      }
    }
  },
  {
    id: '6',
    name: 'Wall Putty',
    category: 'Finishing',
    quantity: 200,
    unit: 'kg',
    price: 35,
    date: '2023-05-25',
    characteristics: {
      type: 'wall_putty',
      details: {
        brand: 'Birla',
        coverage: 200,
        coats: 2
      }
    }
  },
];

// Sample data for used materials
export const usedMaterials: Material[] = [
  {
    id: '1',
    name: 'Steel Rebar',
    category: 'Steel',
    quantity: 350,
    unit: 'kg',
    price: 65,
    date: '2023-06-20',
    characteristics: {
      type: 'steel_rod',
      details: {
        sizes: ['8mm', '10mm'],
        rodLength: 12
      }
    }
  },
  {
    id: '2',
    name: 'Bricks',
    category: 'Masonry',
    quantity: 1500,
    unit: 'pcs',
    price: 8,
    date: '2023-06-18',
    characteristics: {
      type: 'brick',
      details: {
        brickQuantity: 1500
      }
    }
  },
  {
    id: '3',
    name: 'Electrical Wiring',
    category: 'Electrical',
    quantity: 150,
    unit: 'm',
    price: 45,
    date: '2023-06-15',
    characteristics: {
      type: 'electrical',
      details: {
        wireSqmm: 2.5,
        wireMeters: 150,
        hasPipes: true
      }
    }
  },
  {
    id: '4',
    name: 'PVC Pipes',
    category: 'Plumbing',
    quantity: 80,
    unit: 'm',
    price: 120,
    date: '2023-06-12',
    characteristics: {
      type: 'plumbing',
      details: {
        pipeType: 'PVC',
        pipeDiameter: 25,
        pipeLength: 80
      }
    }
  },
];

// Sample periods data
export const periods = [
  { id: '1', name: 'This Week' },
  { id: '2', name: 'This Month' },
  { id: '3', name: 'Last Month' },
  { id: '4', name: 'Last 3 Months' },
  { id: '5', name: 'This Year' },
];