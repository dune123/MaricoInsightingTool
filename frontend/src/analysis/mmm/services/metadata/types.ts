/**
 * ========================================
 * METADATA SERVICE TYPE DEFINITIONS
 * ========================================
 * 
 * Purpose: Centralized type definitions for metadata and state persistence
 * 
 * Description:
 * This module contains all TypeScript interfaces and types used across the metadata
 * persistence system. It provides type safety for concatenation state, brand metadata,
 * and API response structures used by the Node.js metadata backend.
 * 
 * Key Types:
 * - ConcatenationState: Complete state structure for processed concatenations
 * - BrandMetadata: Brand extraction and categorization data
 * - BrandCategories: Organization of brands into business categories
 * - MetadataResponse: Standard API response wrapper
 * - PreviewDataRow: Type-safe structure for preview data
 * 
 * Usage:
 * - Import specific types as needed across metadata services
 * - Ensures consistency in data structures
 * - Provides compile-time type checking
 * - Supports IntelliSense and auto-completion
 * 
 * Dependencies:
 * - None (pure TypeScript types)
 * 
 * Used by:
 * - MetadataService and specialized metadata services
 * - State persistence hooks
 * - Components handling metadata operations
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Frontend Team
 */

import { ColumnCategories } from '@/analysis/mmm/steps/data-concatenation/types';

export interface BrandCategories {
  ourBrand: string;
  competitors: string[];
  haloBrands: string[];
}

export interface BrandMetadata {
  targetVariable: string;
  ourBrand: string;
  allBrands: string[];
  categories: BrandCategories;
  extractedAt: string;
}

export interface PreviewDataRow {
  [columnName: string]: string | number | null;
}

export interface PriceSheetInfo {
  created: boolean;
  rowCount: number;
  columns: string[];
}

export interface ConcatenationState {
  originalFileName: string;
  concatenatedFileName: string;
  selectedSheets: string[];
  targetVariable?: string;
  selectedFilters?: string[];
  brandMetadata?: BrandMetadata;
  previewData?: PreviewDataRow[];
  columnCategories?: Record<string, string[]> | ColumnCategories;
  totalRows: number;
  processedAt: string;
  savedAt?: string;
  status: 'completed' | 'processing' | 'failed';
  priceSheet?: PriceSheetInfo;
}

export interface MetadataResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  stateFileName?: string; // Filename of the saved state
  stateFilePath?: string; // Full path of the saved state
}

export interface StateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BackendHealthStatus {
  isAvailable: boolean;
  responseTime?: number;
  lastChecked: string;
  error?: string;
}

