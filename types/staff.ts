// types/Staff.ts
export interface Staff {
  id?: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  assignedProjects: string[];
  role: string;
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
