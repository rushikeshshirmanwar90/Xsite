export const generateOTP = (): number => {
  return Math.floor(Math.random() * 1000000);
};

// Utility functions
export const generateInitials = (companyName: string): string => {
  if (!companyName) return "XX";

  const words = companyName
    .split(/[\s\-_&]+/)
    .filter((word) => word.length > 0)
    .map((word) => word.trim());

  if (words.length === 0) return "XX";

  if (words.length === 1) {
    const word = words[0];
    return word.length >= 2
      ? word.substring(0, 2).toUpperCase()
      : word.toUpperCase();
  }

  const skipWords = ["and", "the", "of", "in", "at", "on", "&"];
  const significantWords = words.filter(
    (word) => !skipWords.includes(word.toLowerCase()) && word.length > 0
  );

  if (significantWords.length === 0) {
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }

  return significantWords
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return { bg: "#0EA5E9", text: "#ffffff", light: "#E0F2FE" };
    case "planning":
      return { bg: "#8B5CF6", text: "#ffffff", light: "#EDE9FE" };
    case "completed":
      return { bg: "#10B981", text: "#ffffff", light: "#D1FAE5" };
    default:
      return { bg: "#64748B", text: "#ffffff", light: "#F1F5F9" };
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
