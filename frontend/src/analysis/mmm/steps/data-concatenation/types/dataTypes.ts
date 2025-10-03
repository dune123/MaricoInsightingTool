/**
 * ========================================
 * DATA TYPES - DATA CONCATENATION MODULE
 * ========================================
 * 
 * Purpose: Data structure type definitions for data concatenation functionality
 * 
 * Description:
 * Centralized type definitions for all data structures used in the data concatenation
 * step. This includes sheet data, column information, preview data, file metadata,
 * and expected signs for marketing mix modeling variables.
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

/**
 * Represents data from an Excel sheet
 */
export interface SheetData {
  sheetName: string;
  columns: DataColumn[];
  rowCount: number;
  isSelected: boolean;
}

/**
 * Represents a data column with its metadata
 */
export interface DataColumn {
  name: string;
  type: 'numeric' | 'categorical' | 'date';
  values: string[];
}

/**
 * Column categorization by business purpose
 */
export interface ColumnCategories {
  Revenue: string[];
  Distribution: string[];
  Pricing: string[];
  Promotion: string[];
  Media: string[];
  Others: string[];
}

// Brand categorization and metadata are now imported from @/types/analysis
// to maintain consistency and avoid duplicate definitions

/**
 * Brand metadata with categorization
 */
export interface BrandMetadata {
  targetVariable: string;
  ourBrand: string;
  allBrands: string[];
  categories: import('@/types/analysis').BrandCategories;
  extractedAt: string;
}

/**
 * Preview data row structure
 */
export interface PreviewDataRow {
  [columnName: string]: string | number;
}

/**
 * File information for concatenated files
 */
export interface FileInfo {
  filename: string;
  processedFilename?: string;
  concatenatedFilename?: string;
  rowCount: number;
  uploadedAt: Date;
  isConcatenated: boolean;
}

/**
 * Concatenation configuration
 */
export interface ConcatenationConfig {
  selectedSheets: string[];
  resultingColumns: string[];
  customFileName?: string;
}

// Note: PriceSheetInfo and RPISheetInfo are now imported from @/types/analysis 
// to maintain consistency across the application

/**
 * Processing status information
 */
export interface ProcessingStatus {
  isProcessing: boolean;
  isProcessed: boolean;
  error: string | null;
  progress?: number;
  message?: string;
}

/**
 * Data loading result
 */
export interface DataLoadingResult {
  success: boolean;
  data?: PreviewDataRow[];
  columns?: string[];
  totalRows?: number;
  error?: string;
}

// Expected sign types are now imported from @/analysis/mmm/services
// to maintain consistency and avoid duplicate definitions

/**
 * Enhanced column categories with expected signs
 */
export interface ColumnCategoriesWithSigns extends ColumnCategories {
  expectedSigns?: import('@/analysis/mmm/services').ExpectedSignsMap;
}
