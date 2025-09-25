import { ProjectData, sectionDataProps } from "@/types/analytics";

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
  {
    _id: "5",
    budget: 10000,
    name: "painting",
  },
];
