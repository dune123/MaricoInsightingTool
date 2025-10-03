/**
 * ========================================
 * BUSINESS RULES - SHARED CONSTANTS
 * ========================================
 * 
 * Purpose: Business logic constants and validation rules
 * 
 * Description:
 * Contains all business rules, validation constraints, and domain-specific
 * constants used throughout the application.
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

/**
 * File validation rules
 */
export const FILE_RULES = {
  ALLOWED_EXTENSIONS: ['.xlsx', '.csv'],
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MIN_FILE_SIZE: 1024, // 1KB
  MAX_FILENAME_LENGTH: 255
} as const;

/**
 * Data validation rules
 */
export const DATA_RULES = {
  MIN_DATA_RECORDS: 18,
  MAX_PREVIEW_ROWS: 100,
  MAX_COLUMNS: 1000,
  MIN_COLUMNS: 1,
  PRESERVE_COLUMNS: ['packsize', 'region', 'channel', 'month'] as const
} as const;

/**
 * Column categorization patterns
 */
export const COLUMN_PATTERNS = {
  REVENUE: /volume|value|unit/i,
  DISTRIBUTION: /wtd|stores/i,
  PRICING: /price|rpi/i,
  PROMOTION: /promo|tup|btl/i,
  MEDIA: /grp|spend/i
} as const;

/**
 * Brand extraction patterns
 */
export const BRAND_PATTERNS = {
  TARGET_VARIABLE: /(?:volume|value|unit)\s+(.+?)(?:\s|$)/i,
  BRAND_SEPARATOR: /[\s-]+/,
  EXCLUDE_WORDS: ['for', 'and', 'or', 'the', 'of', 'in', 'on', 'at', 'to', 'from']
} as const;

/**
 * Analysis workflow rules
 */
export const WORKFLOW_RULES = {
  TOTAL_STEPS: 13,
  REQUIRED_STEPS: [1, 2, 3, 4, 5], // User Type, Analysis Type, Mode, Upload, Concatenation
  OPTIONAL_STEPS: [6, 7, 8, 9, 10, 11, 12, 13],
  MIN_SHEETS_SELECTION: 1,
  MAX_SHEETS_SELECTION: 100
} as const;

/**
 * UI constraints
 */
export const UI_RULES = {
  MAX_COMPONENT_LINES: 150,
  MAX_HOOK_LINES: 80,
  MAX_SERVICE_LINES: 200,
  MAX_UTILITY_LINES: 100,
  TOAST_DURATION: 5000, // 5 seconds
  LOADING_TIMEOUT: 30000 // 30 seconds
} as const;

/**
 * Performance rules
 */
export const PERFORMANCE_RULES = {
  DEBOUNCE_DELAY: 300, // milliseconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // milliseconds
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  MAX_CONCURRENT_REQUESTS: 5
} as const;

/**
 * Validation functions
 */
export const validation = {
  /**
   * Validate file extension
   */
  isValidFileExtension: (filename: string): boolean => {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return FILE_RULES.ALLOWED_EXTENSIONS.includes(extension as any);
  },

  /**
   * Validate file size
   */
  isValidFileSize: (size: number): boolean => {
    return size >= FILE_RULES.MIN_FILE_SIZE && size <= FILE_RULES.MAX_FILE_SIZE;
  },

  /**
   * Validate data record count
   */
  isValidDataRecordCount: (count: number): boolean => {
    return count >= DATA_RULES.MIN_DATA_RECORDS;
  },

  /**
   * Validate column count
   */
  isValidColumnCount: (count: number): boolean => {
    return count >= DATA_RULES.MIN_COLUMNS && count <= DATA_RULES.MAX_COLUMNS;
  },

  /**
   * Check if column should be preserved
   */
  shouldPreserveColumn: (columnName: string): boolean => {
    return DATA_RULES.PRESERVE_COLUMNS.includes(columnName.toLowerCase() as any);
  },

  /**
   * Validate brand name
   */
  isValidBrandName: (brandName: string): boolean => {
    return brandName.length >= 2 && brandName.length <= 50 && !/^\d+$/.test(brandName);
  },

  /**
   * Validate step number
   */
  isValidStepNumber: (step: number): boolean => {
    return step >= 1 && step <= WORKFLOW_RULES.TOTAL_STEPS;
  },

  /**
   * Check if step is required
   */
  isRequiredStep: (step: number): boolean => {
    return WORKFLOW_RULES.REQUIRED_STEPS.includes(step);
  }
};

/**
 * Business logic helpers
 */
export const businessLogic = {
  /**
   * Calculate completion percentage
   */
  calculateProgress: (completedSteps: number): number => {
    return Math.round((completedSteps / WORKFLOW_RULES.TOTAL_STEPS) * 100);
  },

  /**
   * Get next required step
   */
  getNextRequiredStep: (currentStep: number): number | null => {
    const nextRequired = WORKFLOW_RULES.REQUIRED_STEPS.find(step => step > currentStep);
    return nextRequired || null;
  },

  /**
   * Check if analysis can proceed
   */
  canProceedToStep: (targetStep: number, completedSteps: number[]): boolean => {
    const requiredSteps = WORKFLOW_RULES.REQUIRED_STEPS.filter(step => step < targetStep);
    return requiredSteps.every(step => completedSteps.includes(step));
  },

  /**
   * Format file size for display
   */
  formatFileSize: (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  },

  /**
   * Generate safe filename
   */
  generateSafeFilename: (originalName: string, suffix?: string): string => {
    const baseName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    return suffix ? `${baseName}_${timestamp}_${suffix}` : `${baseName}_${timestamp}`;
  }
};
