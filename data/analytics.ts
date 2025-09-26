import { MaterialUsage, ProjectData, sectionDataProps } from "@/types/analytics";

export const projectData: ProjectData[] = [
  {
    _id: "1",
    name: "Project Alpha",
    budgetUsed: 2000000,
    description: "Core infrastructure development",
    status: "active",
  },
  {
    _id: "2",
    name: "Project Beta",
    budgetUsed: 1500000,
    description: "User interface redesign",
    status: "active",
  },
  {
    _id: "3",
    name: "Project Gamma",
    budgetUsed: 1050000,
    description: "Backend optimization",
    status: "completed",
  },
];

export const sectionData: sectionDataProps[] = [
  {
    _id: "1",
    budget: 50000,
    name: "Base",
  },

  {
    _id: "2",
    budget: 20000,
    name: "first slab",
  },
  {
    _id: "3",
    budget: 25000,
    name: "second slab",
  },
  {
    _id: "4",
    budget: 5000,
    name: "plumbing",
  },
];


export const materials: MaterialUsage[] = [
  {
    id: 'm1',
    name: 'Cement',
    category: 'Construction Material',
    quantity: 450,
    unit: 'bags',
    unitPrice: 350,
    totalPrice: 157500,
    supplier: 'UltraTech Cement',
    status: 'used',
    description: 'OPC 53 Grade cement for foundation concrete'
  },
  {
    id: 'm2',
    name: 'Steel Rods',
    category: 'Reinforcement',
    quantity: 12.5,
    unit: 'tons',
    unitPrice: 65000,
    totalPrice: 812500,
    supplier: 'TATA Steel',
    status: 'used',
    description: 'Fe 500 grade steel rods for reinforcement'
  },
  {
    id: 'm3',
    name: 'Sand',
    category: 'Construction Material',
    quantity: 85,
    unit: 'cubic meters',
    unitPrice: 1200,
    totalPrice: 102000,
    supplier: 'Local Suppliers',
    status: 'delivered',
    description: 'River sand for concrete mixing'
  },
  {
    id: 'm4',
    name: 'Aggregate',
    category: 'Construction Material',
    quantity: 120,
    unit: 'cubic meters',
    unitPrice: 1800,
    totalPrice: 216000,
    supplier: 'Stone Crushers Ltd',
    status: 'used',
    description: '20mm aggregate for concrete'
  },
  {
    id: 'm5',
    name: 'Waterproofing Chemical',
    category: 'Chemicals',
    quantity: 250,
    unit: 'liters',
    unitPrice: 450,
    totalPrice: 112500,
    supplier: 'Dr. Fixit',
    status: 'ordered',
    description: 'Foundation waterproofing treatment'
  }
]