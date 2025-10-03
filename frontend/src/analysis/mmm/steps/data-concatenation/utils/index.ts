/**
 * ========================================
 * UTILS INDEX - DATA CONCATENATION MODULE
 * ========================================
 * 
 * Purpose: Barrel export for all utility functions
 * 
 * Description:
 * Centralized export point for all utility functions used in the data concatenation
 * module. This provides a clean import interface for consuming components.
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

// File utilities
export {
  generateConcatenatedFilename,
  extractOriginalFilename,
  extractTimestamp,
  sortFilesByTimestamp,
  filterFilesByBrand,
  isValidFilename,
  getFileExtension,
  getBaseFilename,
  isConcatenatedFile,
  generateUniqueFilename
} from './fileHelpers';

// Data transformation utilities
export {
  categorizeColumns,
  extractBrandNames,
  createBrandMetadata,
  transformApiDataToPreview,
  createSampleDataRow,
  filterPreviewData,
  getUniqueColumnValues,
  calculateColumnStats
} from './dataTransformers';
