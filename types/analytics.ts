interface ProjectData {
  _id: string;
  name: string;
  budgetUsed: number;
  description?: string;
  status?: "active" | "completed" | "pending";
}

interface PieSliceData {
  key: string;
  value: number;
  svg: {
    fill: string;
    gradientId?: string;
  };
  name: string;
  formattedBudget: string;
  percentage: string;
  pathData?: string;
  labelX?: number;
  labelY?: number;
  startAngle?: number;
  endAngle?: number;
}

interface sectionDataProps {
  _id: string;
  name: string;
  budget: number;
}

export { PieSliceData, ProjectData, sectionDataProps };

