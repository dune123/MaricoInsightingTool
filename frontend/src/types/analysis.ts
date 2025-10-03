/**
 * ========================================
 * BRANDBLOOM INSIGHTS - ANALYSIS TYPE DEFINITIONS
 * ========================================
 * 
 * Purpose: Comprehensive type definitions for the entire analysis workflow with advanced data structures
 * 
 * Description:
 * This module contains all TypeScript interfaces and type definitions used
 * throughout the BrandBloom Insights application. It provides type safety
 * for data structures, analysis states, wizard flow, API responses, and
 * advanced features like brand categorization, price/RPI sheet management,
 * and comprehensive filter state management.
 * 
 * Key Types:
 * - DataColumn: Column metadata with statistics and type information
 * - SheetInfo: Excel sheet structure and metadata
 * - SheetData: Extended sheet data with selection state
 * - AnalysisData: Complete analysis dataset with preprocessing info
 * - AppState: Global application state for the wizard
 * - ModelResult: MMM model outputs and predictions
 * - ScenarioInput: What-if scenario configuration
 * - BrandCategories: Brand classification system
 * - BrandMetadata: Comprehensive brand information
 * - PriceSheetInfo: Price sheet creation and management
 * - RPISheetInfo: RPI sheet creation and management
 * - ModelVariable: Individual model variable with statistics
 * 
 * Type Categories:
 * - Data Types: Column types, sheet info, analysis data, brand metadata
 * - Wizard Types: User types, analysis types, modes, step management
 * - State Types: App state, step validation, progress tracking, filter management
 * - Model Types: Results, scenarios, optimization, variable statistics
 * - Brand Types: Categories, metadata, extraction information
 * - Sheet Types: Price sheets, RPI sheets, concatenation configuration
 * 
 * Advanced Features:
 * - Brand categorization (Our Brand, Competitors, Halo Brands)
 * - Price sheet management with region/month tracking
 * - RPI sheet management with competitor analysis
 * - Filter state management with values and metadata
 * - Target variable selection with metadata tracking
 * - Concatenation configuration and file management
 * - Model variable statistics (coefficients, p-values, VIF)
 * - Scenario-based impact analysis
 * 
 * Used by:
 * - All components for type safety
 * - Services for API response typing
 * - Context providers for state management
 * - Data processing components
 * - Model building and analysis components
 * - Filter and brand management components
 * 
 * Dependencies:
 * - TypeScript for type definitions
 * - React types for component integration
 * - Analysis workflow types for wizard management
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 */

export interface DataColumn {
  name: string;
  type: 'numeric' | 'categorical' | 'date';
  values: (string | number | Date | null)[];
  statistics?: {
    mean?: number;
    median?: number;
    std?: number;
    min?: number;
    max?: number;
    unique?: number;
    nullCount?: number;
  };
}

export interface SheetInfo {
  sheetName: string;
  columns: string[];
  totalRows: number;
  totalColumns: number;
}

export interface SheetData {
  sheetName: string;
  columns: DataColumn[];
  rowCount: number;
  isSelected: boolean;
}

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

export interface PriceSheetInfo {
  created: boolean;
  rowCount: number;
  columns: string[];
  uniqueRegions?: number;
  uniqueMonths?: number;
  priceColumns?: string[];
  message?: string;
}

export interface RPISheetInfo {
  created: boolean;
  rowCount: number;
  columns: string[];
  uniqueRegions: number;
  uniqueMonths: number;
  rpiColumns: string[];
  ourBrand: string;
  competitorBrands: string[];
  message: string;
}

export interface AnalysisData {
  filename: string;
  columns: DataColumn[];
  rowCount: number;
  uploadedAt: Date;
  sheets?: SheetData[];
  isConcatenated?: boolean;
  concatenationConfig?: {
    selectedSheets: string[];
    resultingColumns: string[];
    customFileName?: string;
  };
  processedFilename?: string;
  stateFileName?: string; // Filename of the saved concatenation state
  columnsModified?: boolean;
  targetVariable?: string;
  targetVariableMetadata?: {
    selectedAt: string;
    category: string;
    selectionStep: string;
  };
  selectedFilters?: string[];
  filterMetadata?: {
    selectedAt: string;
    category: string;
    selectionStep: string;
  };
  brandMetadata?: BrandMetadata;
  priceSheet?: PriceSheetInfo;
  rpiSheet?: RPISheetInfo;
}

export interface ModelVariable {
  name: string;
  expectedSign: 'positive' | 'negative' | 'neutral';
  included: boolean;
  coefficient?: number;
  pValue?: number;
  elasticity?: number;
  vif?: number;
}

export interface ModelResult {
  rSquared: number;
  adjustedRSquared: number;
  intercept: number;
  variables: ModelVariable[];
  modelType: 'linear' | 'log-linear' | 'log-log' | 'ridge' | 'bayesian';
}

export interface ScenarioInput {
  variable: string;
  p6mValue: number;
  scenarioValue: number;
  impact: number;
}

export type UserType = 'brand-leader' | 'data-scientist';
export type AnalysisType = 'mmm' | 'fresh' | 'non-mmm';
export type AnalysisMode = 'new' | 'existing';

export interface AppState {
  userType: UserType | null;
  analysisType: AnalysisType | null;
  analysisMode: AnalysisMode | null;
  analysisData: AnalysisData | null;
  selectedBrand: string;
  currentAnalysisId: string;
  filterColumns: string[];
  selectedFilters: string[];
  filterValues: Record<string, string>; // New: stores actual filter values (e.g., PackSize: "Sachet")
  modelResult: ModelResult | null;
  scenarioInputs: ScenarioInput[];
  currentStep: number;
  // NEW: Track visited steps to prevent re-initialization when returning to steps
  visitedSteps: number[];
  // NEW: Track completed steps to enable resume functionality and prevent re-initialization
  completedSteps: number[];
}