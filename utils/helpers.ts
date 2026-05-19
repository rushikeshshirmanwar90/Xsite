/**
 * Safe utility functions to prevent crashes
 * These helpers handle edge cases that could cause runtime errors
 */

/**
 * Safely parse JSON with fallback value
 * Prevents crashes from invalid JSON strings
 * 
 * @param jsonString - The JSON string to parse
 * @param fallback - Value to return if parsing fails
 * @returns Parsed object or fallback value
 * 
 * @example
 * const data = safeJsonParse(userString, { name: 'Guest' });
 */
export const safeJsonParse = <T>(
  jsonString: string | null | undefined,
  fallback: T
): T => {
  if (!jsonString || jsonString.trim() === '') {
    return fallback;
  }
  
  try {
    const parsed = JSON.parse(jsonString);
    return parsed as T;
  } catch (error) {
    console.error('[safeJsonParse] Failed to parse JSON:', error);
    console.error('[safeJsonParse] Input was:', jsonString?.substring(0, 100));
    return fallback;
  }
};

/**
 * Safely divide two numbers with zero check
 * Prevents NaN and Infinity from division by zero
 * 
 * @param numerator - The number to divide
 * @param denominator - The number to divide by
 * @param fallback - Value to return if denominator is zero (default: 0)
 * @returns Result of division or fallback value
 * 
 * @example
 * const result = safeDivide(100, total, 0);
 */
export const safeDivide = (
  numerator: number,
  denominator: number,
  fallback: number = 0
): number => {
  if (denominator === 0 || !isFinite(denominator)) {
    return fallback;
  }
  
  const result = numerator / denominator;
  
  // Check if result is valid
  if (!isFinite(result)) {
    return fallback;
  }
  
  return result;
};

/**
 * Calculate percentage safely with zero check
 * Returns formatted percentage string
 * 
 * @param value - The value to calculate percentage for
 * @param total - The total value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 * 
 * @example
 * const percent = safePercentage(75, 100); // "75.0"
 * const percent = safePercentage(50, 0);   // "0.0"
 */
export const safePercentage = (
  value: number,
  total: number,
  decimals: number = 1
): string => {
  if (total === 0 || !isFinite(total) || !isFinite(value)) {
    return '0.' + '0'.repeat(decimals);
  }
  
  const percentage = (value / total) * 100;
  
  if (!isFinite(percentage)) {
    return '0.' + '0'.repeat(decimals);
  }
  
  return percentage.toFixed(decimals);
};

/**
 * Safely access array element with bounds checking
 * Prevents crashes from accessing undefined array elements
 * 
 * @param array - The array to access
 * @param index - The index to access
 * @returns Array element or null if out of bounds
 * 
 * @example
 * const first = safeArrayAccess(users, 0);
 * const name = first?.name ?? 'Unknown';
 */
export const safeArrayAccess = <T>(
  array: T[] | null | undefined,
  index: number
): T | null => {
  if (!array || !Array.isArray(array)) {
    return null;
  }
  
  if (index < 0 || index >= array.length) {
    return null;
  }
  
  return array[index];
};

/**
 * Safely get first element of array
 * Common pattern for accessing first element
 * 
 * @param array - The array to access
 * @returns First element or null
 * 
 * @example
 * const firstUser = safeFirst(users);
 */
export const safeFirst = <T>(
  array: T[] | null | undefined
): T | null => {
  return safeArrayAccess(array, 0);
};

/**
 * Safely get last element of array
 * Common pattern for accessing last element
 * 
 * @param array - The array to access
 * @returns Last element or null
 * 
 * @example
 * const lastUser = safeLast(users);
 */
export const safeLast = <T>(
  array: T[] | null | undefined
): T | null => {
  if (!array || !Array.isArray(array) || array.length === 0) {
    return null;
  }
  return array[array.length - 1];
};

/**
 * Safely parse route params that might be arrays
 * Expo router sometimes wraps params in arrays
 * 
 * @param param - The param value (string or string array)
 * @returns Single string value
 * 
 * @example
 * const id = safeParam(params.id);
 */
export const safeParam = (
  param: string | string[] | undefined
): string => {
  if (!param) return '';
  return Array.isArray(param) ? param[0] || '' : param;
};

/**
 * Safely parse JSON from route params
 * Combines safeParam and safeJsonParse
 * 
 * @param param - The param value (string or string array)
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback
 * 
 * @example
 * const data = safeParamJson(params.data, []);
 */
export const safeParamJson = <T>(
  param: string | string[] | undefined,
  fallback: T
): T => {
  const paramString = safeParam(param);
  return safeJsonParse(paramString, fallback);
};

/**
 * Format currency safely
 * Handles edge cases in number formatting
 * 
 * @param amount - The amount to format
 * @param currency - Currency symbol (default: ₹)
 * @returns Formatted currency string
 * 
 * @example
 * const formatted = formatCurrency(1000000); // "₹10.0L"
 */
export const formatCurrency = (
  amount: number,
  currency: string = '₹'
): string => {
  if (!isFinite(amount) || isNaN(amount)) {
    return `${currency}0`;
  }
  
  if (amount >= 10000000) {
    return `${currency}${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) {
    return `${currency}${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `${currency}${(amount / 1000).toFixed(1)}K`;
  }
  
  return `${currency}${amount.toLocaleString('en-IN')}`;
};

/**
 * Check if a value is a valid MongoDB ObjectId
 * Prevents sending invalid IDs to API
 * 
 * @param id - The ID to validate
 * @returns true if valid MongoDB ObjectId format
 * 
 * @example
 * if (isValidMongoId(projectId)) {
 *   // Safe to use
 * }
 */
export const isValidMongoId = (id: string | null | undefined): boolean => {
  if (!id) return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate and sanitize section ID
 * Filters out placeholder IDs
 * 
 * @param sectionId - The section ID to validate
 * @returns Valid section ID or null
 * 
 * @example
 * const validId = validateSectionId(selectedSection);
 */
export const validateSectionId = (
  sectionId: string | null | undefined
): string | null => {
  if (!sectionId) return null;
  
  // Filter out placeholder IDs
  const placeholderIds = ['all-sections', 'default-section', 'all', 'default'];
  if (placeholderIds.includes(sectionId.toLowerCase())) {
    return null;
  }
  
  // Validate MongoDB ID format
  if (!isValidMongoId(sectionId)) {
    return null;
  }
  
  return sectionId;
};

/**
 * Create a debounced function
 * Prevents excessive function calls
 * 
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 * 
 * @example
 * const debouncedSearch = debounce(handleSearch, 300);
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

/**
 * Sleep/delay function for async operations
 * Useful for adding delays in async flows
 * 
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after delay
 * 
 * @example
 * await sleep(1000); // Wait 1 second
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry an async function with exponential backoff
 * Useful for API calls that might fail temporarily
 * 
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param delay - Initial delay in ms (default: 1000)
 * @returns Result of function or throws last error
 * 
 * @example
 * const data = await retry(() => apiClient.get('/api/data'));
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        // Exponential backoff
        await sleep(delay * Math.pow(2, i));
      }
    }
  }
  
  throw lastError;
};
