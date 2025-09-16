// data/staffData.ts
import { Staff } from "@/types/staff";

export const dummyStaff: Staff[] = [
  {
    id: 1,
    firstName: "Rajesh",
    lastName: "Kumar",
    phoneNumber: "+91 98765 43210",
    email: "rajesh.kumar@company.com",
    assignedProjects: ["Manthan Tower A", "Green Valley Villas"],
    joinDate: "2023-01-15",
    role: "Site Manager",
  },
  {
    id: 2,
    firstName: "Priya",
    lastName: "Sharma",
    phoneNumber: "+91 87654 32109",
    email: "priya.sharma@company.com",
    assignedProjects: ["Skyline Apartments B"],
    joinDate: "2023-03-20",
    role: "Project Coordinator",
  },
  {
    id: 3,
    firstName: "Amit",
    lastName: "Patel",
    phoneNumber: "+91 76543 21098",
    email: "amit.patel@company.com",
    assignedProjects: ["Metro Plaza Complex"],
    joinDate: "2023-02-10",
    role: "Materials Manager",
  },
  {
    id: 4,
    firstName: "Sneha",
    lastName: "Reddy",
    phoneNumber: "+91 65432 10987",
    email: "sneha.reddy@company.com",
    assignedProjects: ["Green Valley Villas", "Manthan Tower A"],
    joinDate: "2023-04-05",
    role: "Quality Inspector",
  },
  {
    id: 5,
    firstName: "Vikram",
    lastName: "Singh",
    phoneNumber: "+91 54321 09876",
    email: "vikram.singh@company.com",
    assignedProjects: [],
    joinDate: "2023-08-12",
    role: "Junior Engineer",
  },
];

export const roles = [
  "Site Manager",
  "Project Coordinator",
  "Materials Manager",
  "Quality Inspector",
  "Junior Engineer",
  "Senior Engineer",
  "Supervisor",
];
