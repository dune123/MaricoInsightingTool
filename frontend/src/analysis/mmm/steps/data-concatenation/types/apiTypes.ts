/**
 * ========================================
 * API TYPES - DATA CONCATENATION MODULE
 * ========================================
 * 
 * Purpose: API response and request type definitions for data concatenation functionality
 * 
 * Description:
 * Type definitions for API interactions, including request payloads, response structures,
 * and error handling for the data concatenation step.
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

import { PreviewDataRow, ColumnCategories } from './dataTypes';
import { PriceSheetInfo, RPISheetInfo } from '@/types/analysis';

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * File list API response
 */
export interface FileListResponse {
  success: boolean;
  files: string[];
  count: number;
}

/**
 * Filtered data API request
 */
export interface FilteredDataRequest {
  filename: string;
  filters: Record<string, any>;
  limit?: number;
}

/**
 * Filtered data API response
 */
export interface FilteredDataResponse {
  success: boolean;
  data: {
    rows: PreviewDataRow[];
    columns: string[];
    originalRows: number;
  };
}

/**
 * Concatenation API request
 */
export interface ConcatenationRequest {
  filename: string;
  selectedSheets: string[];
  outputFilename?: string;
}

/**
 * Concatenation API response
 */
export interface ConcatenationResponse {
  success: boolean;
  data: {
    concatenatedFilename: string;
    previewData: PreviewDataRow[];
    columnCategories: ColumnCategories;
    totalRows: number;
    priceSheet?: PriceSheetInfo;
    rpiSheet?: RPISheetInfo;
  };
  message?: string;
}

/**
 * State persistence API request
 */
export interface StatePersistenceRequest {
  originalFileName: string;
  state: {
    originalFileName: string;
    concatenatedFileName: string;
    selectedSheets: string[];
    targetVariable?: string;
    selectedFilters?: string[];
    brandMetadata?: any;
    previewData: PreviewDataRow[];
    columnCategories?: ColumnCategories;
    totalRows: number;
    processedAt: string;
    status: string;
  };
}

/**
 * State retrieval API response
 */
export interface StateRetrievalResponse {
  success: boolean;
  data?: {
    originalFileName: string;
    concatenatedFileName: string;
    selectedSheets: string[];
    targetVariable?: string;
    selectedFilters?: string[];
    brandMetadata?: any;
    previewData: PreviewDataRow[];
    columnCategories?: ColumnCategories;
    totalRows: number;
    processedAt: string;
    status: string;
  };
}

/**
 * Error response structure
 */
export interface ApiError {
  success: false;
  error: string;
  details?: string;
  code?: string | number;
}
