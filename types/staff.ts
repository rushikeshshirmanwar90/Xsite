import { Project } from "./project";

// Project assignment interface to match backend structure
export interface ProjectAssignment {
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  assignedAt: string;
  status: "active" | "completed" | "paused";
}

// types/Staff.ts
export interface Staff {
  _id?: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  assignedProjects: ProjectAssignment[]; // Updated to match backend structure
  role: string;
  clientId?: string;
  emailVerified?: boolean;
  emailVerifiedAt?: string;
}

export interface StaffMembers {
  fullName: string;
  _id?: string;
}

export interface AddStaffModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (staff: Omit<Staff, "id">) => void;
  companyName?: string;
}

export interface StaffCardProps {
  staff: Staff;
  onPress?: () => void;
}

export interface AddProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (project: Project) => void;
  staffMembers: StaffMembers[];
}
