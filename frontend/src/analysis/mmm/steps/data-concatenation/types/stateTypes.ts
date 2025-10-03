/**
 * ========================================
 * STATE TYPES - DATA CONCATENATION MODULE
 * ========================================
 * 
 * Purpose: State management type definitions for data concatenation functionality
 * 
 * Description:
 * Type definitions for state management, including local component state,
 * analysis context state, and state persistence structures.
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

import { BrandMetadata, ColumnCategories, PreviewDataRow } from './dataTypes';
import { PriceSheetInfo, RPISheetInfo } from '@/types/analysis';

/**
 * Concatenation state for persistence
 */
export interface ConcatenationState {
  originalFileName: string;
  concatenatedFileName: string;
  selectedSheets: string[];
  targetVariable?: string;
  selectedFilters?: string[];
  brandMetadata?: BrandMetadata;
  previewData: PreviewDataRow[];
  columnCategories?: ColumnCategories;
  totalRows: number;
  processedAt: string;
  status: 'processing' | 'completed' | 'error';
  priceSheet?: PriceSheetInfo;
  rpiSheet?: RPISheetInfo;
}

/**
 * Analysis data structure in context
 */
export interface AnalysisData {
  filename: string;
  processedFilename?: string;
  sheets: Array<{
    sheetName: string;
    columns: any[];
    rowCount: number;
    isSelected: boolean;
  }>;
  columns: Array<{
    name: string;
    type: 'numeric' | 'categorical' | 'date';
    values: string[];
  }>;
  rowCount: number;
  uploadedAt: Date;
  isConcatenated: boolean;
  concatenationConfig?: {
    selectedSheets: string[];
    resultingColumns: string[];
    customFileName?: string;
  };
  targetVariable?: string;
  selectedFilters?: string[];
  brandMetadata?: BrandMetadata;
  filterMetadata?: {
    selectedAt: string;
    category: string;
    selectionStep: string;
  };
  targetVariableMetadata?: {
    selectedAt: string;
    category: string;
    selectionStep: string;
  };
}

/**
 * Component state for data concatenation step
 */
export interface DataConcatenationStepState {
  isProcessing: boolean;
  isProcessed: boolean;
  concatenatedFile: string | null;
  concatenatedData: PreviewDataRow[] | null;
  previewColumns: string[];
  columnCategories: ColumnCategories | null;
  selectedTargetVariable: string | null;
  selectedFilters: string[];
  brandCategories: BrandMetadata['categories'] | null;
  totalRows: number;
  error: string | null;
  isLoadingExisting: boolean;
  restoredSheetCount: number | null;
}

/**
 * State restoration result
 */
export interface StateRestorationResult {
  success: boolean;
  restored: boolean;
  data?: ConcatenationState;
  error?: string;
}

/**
 * Data loading operation state
 */
export interface DataLoadingState {
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  progress?: number;
}

/**
 * File operation state
 */
export interface FileOperationState {
  isUploading: boolean;
  isProcessing: boolean;
  isComplete: boolean;
  error: string | null;
  filename?: string;
}
