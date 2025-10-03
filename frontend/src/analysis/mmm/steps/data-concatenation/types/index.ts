/**
 * ========================================
 * TYPES INDEX - DATA CONCATENATION MODULE
 * ========================================
 * 
 * Purpose: Barrel export for all type definitions
 * 
 * Description:
 * Centralized export point for all type definitions used in the data concatenation
 * module. This provides a clean import interface for consuming components.
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

// Data types
export type {
  SheetData,
  DataColumn,
  ColumnCategories,
  BrandCategories,
  BrandMetadata,
  PreviewDataRow,
  FileInfo,
  ConcatenationConfig,
  ProcessingStatus,
  DataLoadingResult
} from './dataTypes';

// Import shared types from main analysis types
export type {
  PriceSheetInfo,
  RPISheetInfo
} from '@/types/analysis';

// State types
export type {
  ConcatenationState,
  AnalysisData,
  DataConcatenationStepState,
  StateRestorationResult,
  DataLoadingState,
  FileOperationState
} from './stateTypes';

// API types
export type {
  ApiResponse,
  FileListResponse,
  FilteredDataRequest,
  FilteredDataResponse,
  ConcatenationRequest,
  ConcatenationResponse,
  StatePersistenceRequest,
  StateRetrievalResponse,
  ApiError
} from './apiTypes';
