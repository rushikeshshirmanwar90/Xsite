import { Project } from "./project";

// types/Staff.ts
export interface Staff {
  _id?: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  assignedProjects: string[];
  role: string;
  clientId?: string;
}

export interface StaffMembers {
  fullName: string;
  _id?: string;
}

export interface AddStaffModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (staff: Omit<Staff, "id">) => void;
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
