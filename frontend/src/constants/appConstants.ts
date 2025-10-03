/**
 * ========================================
 * APPLICATION CONSTANTS - CORE CONFIGURATION
 * ========================================
 * 
 * Purpose: Core application constants and configuration values
 * 
 * Description:
 * This module contains all fundamental application constants including
 * workflow configuration, file handling limits, statistical thresholds,
 * and data processing settings. These constants drive the behavior of
 * the entire BrandBloom Insights application.
 * 
 * Key Constants:
 * - APP_CONFIG: Core application settings and limits
 * - STEP_NAMES/TITLES: Analysis step configuration (1-11, starts from Data Upload)
 * - COLUMN_TYPES: Data type definitions
 * - MODEL_TYPES: Available model configurations
 * - EXPECTED_SIGNS: Variable relationship types
 * - RECOMMENDED_*: Default suggestions for users
 * 
 * Step Numbering System:
 * - Analysis steps start from Data Upload as step 1 (not User Type/Analysis Type)
 * - User Type and Analysis Type selection are prerequisites, not counted as steps
 * - Total analysis workflow: 11 steps (Data Upload through Optimizer)
 * 
 * Configuration Categories:
 * - Workflow: Total analysis steps, step names, and titles
 * - File Handling: Size limits and supported formats
 * - Statistical: Correlation, VIF, and p-value thresholds
 * - Data Processing: Column types and validation
 * - User Guidance: Recommended settings and defaults
 * 
 * Statistical Thresholds:
 * - Correlation: High (0.7), Medium (0.5), Low (0.3)
 * - VIF: Good (<2), Acceptable (<5)
 * - P-Values: Highly Significant (<0.01), Significant (<0.05)
 * 
 * Used by:
 * - All wizard components for step configuration
 * - File upload components for validation
 * - Statistical analysis components for thresholds
 * - Model building components for type selection
 * 
 * Dependencies:
 * - None (pure constants)
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

// Application Constants
export const APP_CONFIG = {
  TOTAL_ANALYSIS_STEPS: 11, // Analysis steps only (Data Upload through Optimizer)
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FILE_TYPES: ['.csv', '.xlsx', '.xls'],
  MOCK_DATA_ROWS: 104,
  CORRELATION_THRESHOLDS: {
    HIGH: 0.7,
    MEDIUM: 0.5,
    LOW: 0.3
  },
  VIF_THRESHOLDS: {
    GOOD: 2,
    ACCEPTABLE: 5
  },
  P_VALUE_THRESHOLDS: {
    HIGHLY_SIGNIFICANT: 0.01,
    SIGNIFICANT: 0.05
  }
} as const;

// Step Configuration - Analysis Steps Only (starts from Data Upload as step 1)
export const STEP_NAMES = [
  "Data Upload",
  "Data Concatenation",
  "Add RPIs",
  "Data Summary",
  "Brand Selection",
  "Filter Selection",
  "EDA",
  "Expected Signs",
  "Model Building",
  "Model Results",
  "Optimizer"
];

export const STEP_TITLES = [
  "Upload Your Data",
  "Concatenate Data Sheets",
  "Add Revenue Per Item Variables",
  "Review Data Summary",
  "Select Your Brand",
  "Choose Filter Columns",
  "Exploratory Data Analysis",
  "Set Expected Signs",
  "Build Your Model",
  "Model Results",
  "Scenario Optimization"
];

// Data Processing Constants
export const COLUMN_TYPES = {
  NUMERIC: 'numeric',
  CATEGORICAL: 'categorical',
  DATE: 'date'
} as const;

export const MODEL_TYPES = [
  'linear',
  'log-linear', 
  'log-log',
  'ridge',
  'bayesian'
] as const;

export const EXPECTED_SIGNS = [
  'positive',
  'negative', 
  'neutral'
] as const;

// Recommended Settings
export const RECOMMENDED_FILTERS = ['Brand', 'Date', 'Seasonality'];

export const RECOMMENDED_SIGNS: Record<string, 'positive' | 'negative' | 'neutral'> = {
  'TV_Spend': 'positive',
  'Digital_Spend': 'positive',
  'Print_Spend': 'positive',
  'Radio_Spend': 'positive',
  'Seasonality': 'neutral'
};