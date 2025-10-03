/**
 * ========================================
 * COMPREHENSIVE VALIDATION SERVICE
 * ========================================
 * 
 * Purpose: Centralized validation system for all application data and user inputs
 * 
 * Description:
 * This service provides comprehensive validation functionality across the entire
 * application, ensuring data quality, user input validation, and system integrity.
 * It offers structured validation results with detailed error messages and warnings
 * to guide users through the analytics workflow with confidence.
 * 
 * Key Functionality:
 * - File upload validation with security and format checking
 * - Analysis data quality assessment and recommendations
 * - Model result validation with statistical significance checks
 * - Complete wizard state validation for workflow integrity
 * - Step-specific validation with contextual feedback
 * - Structured error and warning categorization
 * 
 * Validation Categories:
 * - File Security: Type, size, and format validation
 * - Data Quality: Completeness, consistency, and statistical validity
 * - Model Validation: Statistical significance and multicollinearity checks
 * - Workflow Validation: Step completion and dependency validation
 * - Business Rules: Domain-specific validation requirements
 * 
 * Dependencies:
 * - analysis.ts types for data structure validation
 * - appConstants.ts for validation thresholds and rules
 * 
 * Used by:
 * - All step components for input validation
 * - Data processing services for quality checks
 * - File upload components for security validation
 * - Model building services for statistical validation
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Frontend Team
 */

import { AppState, AnalysisData, ModelResult } from "@/types/analysis";
import { APP_CONFIG } from "@/constants/appConstants";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ValidationService {
  /**
   * Validates file upload
   */
  static validateFileUpload(file: File): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file type
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!APP_CONFIG.SUPPORTED_FILE_TYPES.includes(fileExtension)) {
      errors.push(`Invalid file type. Supported types: ${APP_CONFIG.SUPPORTED_FILE_TYPES.join(', ')}`);
    }

    // Check file size
    if (file.size > APP_CONFIG.MAX_FILE_SIZE) {
      errors.push(`File size too large. Maximum size: ${APP_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Check file name
    if (file.name.length > 255) {
      warnings.push("File name is very long and may cause issues");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates analysis data quality
   */
  static validateAnalysisData(data: AnalysisData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check minimum rows
    if (data.rowCount < 20) {
      errors.push("Insufficient data. At least 20 rows required for reliable analysis");
    } else if (data.rowCount < 52) {
      warnings.push("Limited data. Consider using more data for better model accuracy");
    }

    // Check for required column types
    const hasNumericColumns = data.columns.some(col => col.type === 'numeric');
    const hasDateColumn = data.columns.some(col => col.type === 'date');

    if (!hasNumericColumns) {
      errors.push("No numeric columns found. Numeric data is required for analysis");
    }

    if (!hasDateColumn) {
      warnings.push("No date column found. Time series analysis may be limited");
    }

    // Check for null values
    data.columns.forEach(column => {
      if (column.statistics?.nullCount && column.statistics.nullCount > data.rowCount * 0.1) {
        warnings.push(`Column '${column.name}' has high null values (${column.statistics.nullCount})`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates model results
   */
  static validateModelResults(result: ModelResult): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check R-squared
    if (result.rSquared < 0.3) {
      warnings.push("Low R-squared value. Model may not explain the data well");
    } else if (result.rSquared > 0.95) {
      warnings.push("Very high R-squared. Check for overfitting");
    }

    // Check variables
    if (result.variables.length === 0) {
      errors.push("No variables included in the model");
    }

    // Check for multicollinearity
    const highVIFVariables = result.variables.filter(v => (v.vif || 0) > APP_CONFIG.VIF_THRESHOLDS.ACCEPTABLE);
    if (highVIFVariables.length > 0) {
      warnings.push(`High VIF detected for: ${highVIFVariables.map(v => v.name).join(', ')}`);
    }

    // Check significance
    const insignificantVariables = result.variables.filter(v => 
      (v.pValue || 0) > APP_CONFIG.P_VALUE_THRESHOLDS.SIGNIFICANT
    );
    if (insignificantVariables.length > 0) {
      warnings.push(`Insignificant variables: ${insignificantVariables.map(v => v.name).join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates complete wizard state
   */
  static validateWizardState(state: AppState): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required selections
    if (!state.userType) {
      errors.push("User type not selected");
    }

    if (!state.analysisType) {
      errors.push("Analysis type not selected");
    }

    if (!state.analysisMode) {
      errors.push("Analysis mode not selected");
    }

    if (!state.analysisData) {
      errors.push("No data uploaded");
    } else {
      const dataValidation = this.validateAnalysisData(state.analysisData);
      errors.push(...dataValidation.errors);
      warnings.push(...dataValidation.warnings);
    }

    if (!state.selectedBrand) {
      errors.push("No brand selected");
    }

    if (state.modelResult) {
      const modelValidation = this.validateModelResults(state.modelResult);
      errors.push(...modelValidation.errors);
      warnings.push(...modelValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Gets validation summary for a specific step
   */
  static getStepValidation(stepId: number, state: AppState): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (stepId) {
      case 1:
        if (!state.userType) errors.push("Please select your user type");
        break;
      case 2:
        if (!state.analysisType) errors.push("Please select analysis type");
        break;
      case 3:
        if (!state.analysisMode) errors.push("Please select analysis mode");
        break;
      case 4:
        if (!state.analysisData) {
          errors.push("Please upload your data file");
        } else {
          const dataValidation = this.validateAnalysisData(state.analysisData);
          errors.push(...dataValidation.errors);
          warnings.push(...dataValidation.warnings);
        }
        break;
      case 6:
        if (!state.selectedBrand) errors.push("Please select a brand");
        break;
      case 10:
        if (!state.modelResult) {
          errors.push("Please build your model");
        } else {
          const modelValidation = this.validateModelResults(state.modelResult);
          errors.push(...modelValidation.errors);
          warnings.push(...modelValidation.warnings);
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Create singleton instance
export const validationService = new ValidationService();
export default validationService;