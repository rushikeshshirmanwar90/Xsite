/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param id - The string to validate
 * @returns true if the string is a valid 24-character hex string
 */
export const isValidMongoId = (id: string | null | undefined): boolean => {
  if (!id) return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Filters out placeholder section IDs and validates MongoDB IDs
 * @param sectionId - The section ID to validate
 * @returns The section ID if valid, null otherwise
 */
export const validateSectionId = (sectionId: string | null | undefined): string | null => {
  if (!sectionId) return null;
  
  // Filter out placeholder IDs
  const placeholderIds = ['all-sections', 'default-section'];
  if (placeholderIds.includes(sectionId)) return null;
  
  // Validate MongoDB ID format
  if (!isValidMongoId(sectionId)) return null;
  
  return sectionId;
};
