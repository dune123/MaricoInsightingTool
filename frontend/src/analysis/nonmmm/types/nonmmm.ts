/**
 * ========================================
 * BRANDBLOOM INSIGHTS - NON-MMM ANALYSIS TYPE DEFINITIONS
 * ========================================
 * 
 * Purpose: Comprehensive type definitions for Non-MMM analysis workflow
 * 
 * Description:
 * This module contains all TypeScript interfaces and type definitions used
 * specifically for Non-MMM analysis in the BrandBloom Insights application.
 * It provides type safety for data structures, analysis states, wizard flow,
 * API responses, and advanced features like expected signs, chart analysis,
 * and statistical modeling.
 * 
 * Key Types:
 * - NonMMMAnalysisData: Complete Non-MMM analysis dataset
 * - NonMMMStepState: Individual step state tracking
 * - ExpectedSigns: Variable relationship expectations
 * - ChartConfiguration: Chart generation and customization
 * - ModelConfiguration: Statistical model setup and execution
 * - StatePersistence: Comprehensive state management
 * 
 * Type Categories:
 * - Analysis Types: Non-MMM specific analysis data and metadata
 * - Step Types: Individual step states and progress tracking
 * - Chart Types: Chart configurations, trendlines, and filtering
 * - Model Types: Statistical models, variables, and results
 * - State Types: Persistence, versioning, and conflict resolution
 * 
 * Advanced Features:
 * - Expected signs configuration for all variables
 * - Chart analysis with trendline customization
 * - Statistical modeling with multiple model types
 * - Comprehensive state persistence and resumption
 * - Workflow progress tracking and validation
 * 
 * Used by:
 * - Non-MMM step components for type safety
 * - Non-MMM services for API response typing
 * - State management for persistence and restoration
 * - Chart generation and analysis components
 * - Model building and statistical analysis
 * 
 * Dependencies:
 * - TypeScript for type definitions
 * - React types for component integration
 * - Existing analysis types for compatibility
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 */

// ========================================
// NON-MMM ANALYSIS DATA TYPES
// ========================================

export interface NonMMMAnalysisData {
  id: string;
  brandName: string;
  analysisType: 'non-mmm';
  createdAt: string;
  updatedAt: string;
  currentStep: number;
  currentSubstep: number;
  status: 'in-progress' | 'completed' | 'paused' | 'failed';
  
  // File and data information
  uploadedFile?: NonMMMFileData;
  extractedData?: NonMMMExtractedData;
  
  // Analysis configuration
  targetVariable?: string;
  expectedSigns?: ExpectedSignsConfiguration;
  dataSummary?: NonMMMDataSummary;
  dataDistribution?: NonMMMDataDistribution;
  chartAnalysis?: NonMMMChartAnalysis;
  modelConfiguration?: NonMMMModelConfiguration;
  modelResults?: NonMMMModelResults[];
  
  // State persistence
  stateVersion: number;
  lastSavedAt: string;
  autoSaveEnabled: boolean;
}

export interface NonMMMFileData {
  filename: string;
  originalName: string;
  fileSize: number;
  fileType: 'xlsx' | 'csv';
  uploadedAt: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

export interface NonMMMExtractedData {
  sheets: NonMMMSheetData[];
  totalColumns: number;
  totalRows: number;
  extractedAt: string;
  columns: NonMMMColumnData[];
}

export interface NonMMMSheetData {
  sheetName: string;
  columns: string[];
  rowCount: number;
  isSelected: boolean;
}

export interface NonMMMColumnData {
  name: string;
  type: 'numeric' | 'datetime' | 'percentage' | 'character' | 'unknown';
  dataType: 'integer' | 'float' | 'date' | 'string' | 'boolean';
  statistics?: NonMMMColumnStatistics;
  isTargetVariable: boolean;
  isSelected: boolean;
}

export interface NonMMMColumnStatistics {
  mean?: number;
  median?: number;
  stdDeviation?: number;
  min?: number;
  max?: number;
  uniqueCount?: number;
  nullCount?: number;
  dataQuality?: 'excellent' | 'good' | 'fair' | 'poor';
}

// ========================================
// EXPECTED SIGNS CONFIGURATION
// ========================================

export interface ExpectedSignsConfiguration {
  targetVariable: string;
  variables: ExpectedSignVariable[];
  configuredAt: string;
  isComplete: boolean;
}

export interface ExpectedSignVariable {
  name: string;
  expectedSign: 'positive' | 'negative' | 'neutral';
  selectedAt: string;
  isConfirmed: boolean;
}

// ========================================
// DATA SUMMARY AND DISTRIBUTION
// ========================================

export interface NonMMMDataSummary {
  variables: NonMMMVariableSummary[];
  summaryGeneratedAt: string;
  isComplete: boolean;
}

export interface NonMMMVariableSummary {
  name: string;
  originalType: string;
  currentType: string;
  statistics: NonMMMColumnStatistics;
  typeModifiedAt?: string;
  dataQuality: string;
}

export interface NonMMMDataDistribution {
  histograms: NonMMMHistogram[];
  layout: '4-per-row' | 'custom';
  generatedAt: string;
  isComplete: boolean;
}

export interface NonMMMHistogram {
  variableName: string;
  chartData: any; // Chart.js or similar chart library data
  configuration: NonMMMChartConfig;
  generatedAt: string;
}

// ========================================
// CHART ANALYSIS TYPES
// ========================================

export interface NonMMMChartAnalysis {
  variableCharts: NonMMMVariableChart[];
  customCharts: NonMMMCustomChart[];
  filtering: NonMMMChartFiltering;
  generatedAt: string;
  isComplete: boolean;
}

export interface NonMMMVariableChart {
  variableName: string;
  lineChart: NonMMMLineChart;
  scatterPlot: NonMMMScatterPlot;
  trendlineType: 'linear' | 'polynomial-2' | 'polynomial-3';
  isExpectedResult: boolean;
  generatedAt: string;
}

export interface NonMMMLineChart {
  chartData: any; // Chart.js data structure
  trendline: NonMMMTrendline;
  configuration: NonMMMChartConfig;
}

export interface NonMMMScatterPlot {
  chartData: any; // Chart.js data structure
  trendline: NonMMMTrendline;
  configuration: NonMMMChartConfig;
  slope: number;
  correlation: number;
}

export interface NonMMMTrendline {
  type: 'linear' | 'polynomial-2' | 'polynomial-3';
  equation: string;
  rSquared: number;
  slope?: number;
  coefficients?: number[];
}

export interface NonMMMCustomChart {
  id: string;
  variable1: string;
  variable2: string;
  lineChart: NonMMMLineChart;
  scatterPlot: NonMMMScatterPlot;
  createdAt: string;
}

export interface NonMMMChartConfig {
  chartType: 'line' | 'scatter' | 'histogram';
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  colors: string[];
  gridLines: boolean;
  legend: boolean;
}

export interface NonMMMChartFiltering {
  showExpectedResults: boolean;
  showUnexpectedResults: boolean;
  activeFilters: string[];
  lastUpdated: string;
}

// ========================================
// MODEL CONFIGURATION AND RESULTS
// ========================================

export interface NonMMMModelConfiguration {
  selectedModelType: NonMMMModelType;
  independentVariables: string[];
  targetVariable: string;
  configurationAt: string;
  isComplete: boolean;
}

export type NonMMMModelType = 'linear' | 'log-linear' | 'log-log' | 'ridge' | 'bayesian';

export interface NonMMMModelResults {
  id: string;
  modelType: NonMMMModelType;
  executionStatus: 'pending' | 'running' | 'completed' | 'failed';
  executedAt: string;
  completedAt?: string;
  
  // Model performance
  rSquared: number;
  adjustedRSquared: number;
  rootMeanSquareError: number;
  fStatistic: number;
  pValue: number;
  intercept?: number;
  
  // Variable results
  variables: NonMMMModelVariable[];
  
  // Model diagnostics
  diagnostics: NonMMMModelDiagnostics;
  
  // Error handling
  errorMessage?: string;
  executionTime?: number;
}

export interface NonMMMModelVariable {
  name: string;
  coefficient: number;
  pValue: number;
  tStatistic: number;
  vif: number;
  expectedSign: 'positive' | 'negative' | 'neutral';
  actualSign: 'positive' | 'negative' | 'neutral';
  isSignificant: boolean;
  elasticity?: number;
  elasticity10Percent?: number;
}

export interface NonMMMModelDiagnostics {
  residuals: number[];
  durbinWatson: number;
  jarqueBera: number;
  breuschPagan: number;
  vifMax: number;
  conditionIndex: number;
}

// ========================================
// STATE PERSISTENCE TYPES
// ========================================

export interface NonMMMStepState {
  stepId: number;
  stepName: string;
  substepId: number;
  substepName: string;
  isCompleted: boolean;
  completedAt?: string;
  data: any; // Step-specific data
  validationStatus: 'pending' | 'valid' | 'invalid' | 'warning';
  errorMessages?: string[];
}

export interface NonMMMStatePersistence {
  analysisId: string;
  brandName: string;
  currentStep: number;
  currentSubstep: number;
  stepStates: NonMMMStepState[];
  lastSavedAt: string;
  stateVersion: number;
  autoSaveEnabled: boolean;
  
  // Progress tracking
  completedSteps: number[];
  totalSteps: number;
  progressPercentage: number;
  
  // State metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastModifiedBy: string;
}

export interface NonMMMStateSaveRequest {
  analysisId: string;
  stepId: number;
  substepId: number;
  stepData: any;
  substepData?: any;
  timestamp: string;
  userAction: string;
}

export interface NonMMMStateLoadRequest {
  analysisId: string;
  stepId?: number;
  includeSubsteps?: boolean;
}

export interface NonMMMStateResponse {
  success: boolean;
  data?: NonMMMStatePersistence;
  errorMessage?: string;
  stateVersion: number;
  lastSavedAt: string;
}

// ========================================
// API REQUEST/RESPONSE TYPES
// ========================================

export interface NonMMMFileUploadRequest {
  file: File;
  brandName: string;
  analysisId: string;
}

export interface NonMMMFileUploadResponse {
  success: boolean;
  data?: {
    filename: string;
    processingStatus: string;
    extractedData?: NonMMMExtractedData;
  };
  errorMessage?: string;
}

export interface NonMMMTargetVariableRequest {
  analysisId: string;
  targetVariable: string;
  brandName: string;
}

export interface NonMMMExpectedSignsRequest {
  analysisId: string;
  expectedSigns: ExpectedSignsConfiguration;
  brandName: string;
}

export interface NonMMMDataSummaryRequest {
  analysisId: string;
  brandName: string;
  includeHistograms?: boolean;
}

export interface NonMMMChartGenerationRequest {
  analysisId: string;
  variableName: string;
  trendlineType: 'linear' | 'polynomial-2' | 'polynomial-3';
  brandName: string;
}

export interface NonMMMModelExecutionRequest {
  analysisId: string;
  modelType: NonMMMModelType;
  independentVariables: string[];
  targetVariable: string;
  brandName: string;
}

// ========================================
// UTILITY AND HELPER TYPES
// ========================================

export interface NonMMMValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface NonMMMProgressTracker {
  currentStep: number;
  currentSubstep: number;
  totalSteps: number;
  completedSteps: number[];
  stepNames: string[];
  progressPercentage: number;
  estimatedTimeRemaining?: string;
}

export interface NonMMMErrorInfo {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  stepId?: number;
  substepId?: number;
  userAction?: string;
}

// ========================================
// CONSTANTS AND ENUMS
// ========================================

export const NON_MMM_STEPS = {
  ANALYSIS_TYPE: 1,
  DATA_UPLOAD: 2,
  TARGET_VARIABLE: 3,
  EXPECTED_SIGNS: 4,
  DATA_SUMMARY: 5,
  DATA_DISTRIBUTION: 6,
  CHART_ANALYSIS: 7,
  MODEL_BUILDING: 8,
  DOWNLOAD_ANALYSIS: 9,
} as const;

export const NON_MMM_STEP_NAMES = {
  1: 'Analysis Type Selection',
  2: 'Data Upload',
  3: 'Data Summary & Target Variable',
  4: 'Chart Analysis',
  5: 'Data Distribution',
  6: 'Expected Signs Configuration',
  7: 'Advanced Analysis',
  8: 'Model Building',
  9: 'Download Analysis',
} as const;

export const TRENDLINE_TYPES = {
  LINEAR: 'linear',
  POLYNOMIAL_2: 'polynomial-2',
  POLYNOMIAL_3: 'polynomial-3',
} as const;

export const MODEL_TYPES = {
  LINEAR: 'linear',
  LOG_LINEAR: 'log-linear',
  LOG_LOG: 'log-log',
  RIDGE: 'ridge',
  BAYESIAN: 'bayesian',
} as const;

export const EXPECTED_SIGNS = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  NEUTRAL: 'neutral',
} as const;

export const COLUMN_TYPES = {
  NUMERIC: 'numeric',
  DATETIME: 'datetime',
  PERCENTAGE: 'percentage',
  CHARACTER: 'character',
  UNKNOWN: 'unknown',
} as const;

export const DATA_QUALITY_LEVELS = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
} as const;

