// Utility functions for analytics and data processing

/**
 * Format currency amount to Indian Rupees with appropriate suffixes
 */
export const formatCurrency = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount}`;
};

/**
 * Calculate percentage from value and total
 */
export const calculatePercentage = (value: number, total: number): string => {
  return total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
};

/**
 * Transform project data to pie slice data
 */
export const transformProjectDataToPieSlices = (
  projectData: {
    _id: string;
    name: string;
    budgetUsed: number;
    description?: string;
  }[],
  colors: { primary: string; secondary: string }[]
) => {
  const totalBudget = projectData.reduce(
    (sum, project) => sum + project.budgetUsed,
    0
  );

  return projectData.map((project, index) => ({
    key: project._id,
    value: project.budgetUsed,
    svg: {
      fill: colors[index % colors.length].primary,
      gradientId: `gradient_${project._id}`,
    },
    name: project.name,
    formattedBudget: formatCurrency(project.budgetUsed),
    percentage: calculatePercentage(project.budgetUsed, totalBudget),
    description: project.description,
  }));
};

/**
 * Transform section data to pie slice data
 */
export const transformSectionDataToPieSlices = (
  sectionData: { _id: string; name: string; budget: number }[],
  colors: { primary: string; secondary: string }[]
) => {
  const totalBudget = sectionData.reduce(
    (sum, section) => sum + section.budget,
    0
  );

  return sectionData.map((section, index) => ({
    key: section._id,
    value: section.budget,
    svg: {
      fill: colors[index % colors.length].primary,
      gradientId: `gradient_${section._id}`,
    },
    name: section.name,
    formattedBudget: formatCurrency(section.budget),
    percentage: calculatePercentage(section.budget, totalBudget),
  }));
};

/**
 * Calculate total budget from data array
 */
export const calculateTotalBudget = (
  data: { budgetUsed?: number; budget?: number }[]
): number => {
  return data.reduce(
    (sum, item) => sum + (item.budgetUsed || item.budget || 0),
    0
  );
};
