interface Project {
  id: number;
  name: string;
  address: string;
  assignedStaff: string;
  status: 'active' | 'planning' | 'completed';
  startDate: string;
  endDate: string;
  progress: number;
  totalMaterials: number;
  materialsReceived: number;
  materialsIssued: number;
  recentActivities: Activity[];
}

interface Activity {
  type: 'received' | 'issued' | 'ordered';
  material: string;
  quantity: string;
  date: string;
}

export { Activity, Project };
