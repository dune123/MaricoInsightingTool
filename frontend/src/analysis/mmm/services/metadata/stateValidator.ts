/**
 * ========================================
 * CONCATENATION STATE VALIDATOR
 * ========================================
 * 
 * Purpose: Validation utilities for concatenation state data integrity
 * 
 * Description:
 * This module provides comprehensive validation for concatenation state objects
 * before saving to the metadata backend. It ensures data integrity, completeness,
 * and consistency of state information, preventing corrupted state persistence.
 * 
 * Key Functionality:
 * - Complete state structure validation
 * - Required field verification
 * - Data type and format checking
 * - Brand metadata validation
 * - Preview data structure validation
 * - File name and path validation
 * 
 * Validation Rules:
 * - originalFileName: Must be non-empty string with valid file extension
 * - concatenatedFileName: Must follow naming convention
 * - selectedSheets: Must be non-empty array of valid sheet names
 * - totalRows: Must be positive integer
 * - processedAt: Must be valid ISO timestamp
 * - brandMetadata: Must have valid structure if present
 * - previewData: Must be array of valid data rows if present
 * 
 * Dependencies:
 * - Metadata types for state structure validation
 * 
 * Used by:
 * - State persistence services before saving
 * - Custom hooks for data validation
 * - Debugging and error reporting tools
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Frontend Team
 */

import { ConcatenationState, BrandMetadata, StateValidationResult } from './types';

export class StateValidator {
  
  /**
   * Validate complete concatenation state object
   */
  static validateConcatenationState(state: ConcatenationState): StateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!state.originalFileName || typeof state.originalFileName !== 'string') {
      errors.push('originalFileName is required and must be a non-empty string');
    } else if (!this.isValidFileName(state.originalFileName)) {
      errors.push('originalFileName must have a valid file extension (.xlsx, .xls, .csv)');
    }

    if (!state.concatenatedFileName || typeof state.concatenatedFileName !== 'string') {
      errors.push('concatenatedFileName is required and must be a non-empty string');
    } else if (!state.concatenatedFileName.endsWith('.xlsx')) {
      warnings.push('concatenatedFileName should end with .xlsx extension');
    }

    if (!Array.isArray(state.selectedSheets) || state.selectedSheets.length === 0) {
      errors.push('selectedSheets must be a non-empty array');
    } else {
      state.selectedSheets.forEach((sheet, index) => {
        if (!sheet || typeof sheet !== 'string') {
          errors.push(`selectedSheets[${index}] must be a non-empty string`);
        }
      });
    }

    if (typeof state.totalRows !== 'number' || state.totalRows < 0) {
      errors.push('totalRows must be a non-negative number');
    }

    if (!state.processedAt || !this.isValidISODate(state.processedAt)) {
      errors.push('processedAt must be a valid ISO timestamp');
    }

    if (!['completed', 'processing', 'failed'].includes(state.status)) {
      errors.push('status must be one of: completed, processing, failed');
    }

    // CRITICAL FIX: Add selectedFilters validation
    if (state.selectedFilters !== undefined && state.selectedFilters !== null) {
      if (!Array.isArray(state.selectedFilters)) {
        errors.push('selectedFilters must be an array if provided');
      } else {
        state.selectedFilters.forEach((filter, index) => {
          if (!filter || typeof filter !== 'string' || filter.trim() === '') {
            errors.push(`selectedFilters[${index}] must be a non-empty string`);
          }
        });
      }
    }

    // Optional field validation - only validate if explicitly provided and not null
    if (state.targetVariable !== undefined && state.targetVariable !== null) {
      if (typeof state.targetVariable !== 'string' || state.targetVariable.trim() === '') {
        errors.push('targetVariable must be a non-empty string if provided');
      }
    }

    if (state.brandMetadata !== undefined && state.brandMetadata !== null) {
      const brandValidation = this.validateBrandMetadata(state.brandMetadata);
      errors.push(...brandValidation.errors.map(err => `brandMetadata.${err}`));
      warnings.push(...brandValidation.warnings.map(warn => `brandMetadata.${warn}`));
    }

    if (state.previewData !== undefined && state.previewData !== null) {
      if (!Array.isArray(state.previewData)) {
        errors.push('previewData must be an array if provided');
      } else if (state.previewData.length > 100) {
        warnings.push('previewData contains more than 100 rows - consider limiting for performance');
      }
    }

    if (state.columnCategories !== undefined && state.columnCategories !== null) {
      if (typeof state.columnCategories !== 'object' || state.columnCategories === null) {
        errors.push('columnCategories must be an object if provided');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate brand metadata structure
   */
  static validateBrandMetadata(metadata: BrandMetadata): StateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!metadata.targetVariable || typeof metadata.targetVariable !== 'string') {
      errors.push('targetVariable is required and must be a non-empty string');
    }

    if (!metadata.ourBrand || typeof metadata.ourBrand !== 'string') {
      errors.push('ourBrand is required and must be a non-empty string');
    }

    if (!Array.isArray(metadata.allBrands) || metadata.allBrands.length === 0) {
      errors.push('allBrands must be a non-empty array');
    }

    if (!metadata.extractedAt || !this.isValidISODate(metadata.extractedAt)) {
      errors.push('extractedAt must be a valid ISO timestamp');
    }

    // Validate categories
    if (!metadata.categories) {
      errors.push('categories object is required');
    } else {
      const { categories } = metadata;
      
      if (!categories.ourBrand || typeof categories.ourBrand !== 'string') {
        errors.push('categories.ourBrand is required and must be a non-empty string');
      }

      if (!Array.isArray(categories.competitors)) {
        errors.push('categories.competitors must be an array');
      }

      if (!Array.isArray(categories.haloBrands)) {
        errors.push('categories.haloBrands must be an array');
      }

      // Check for brand consistency
      if (categories.ourBrand !== metadata.ourBrand) {
        warnings.push('categories.ourBrand does not match metadata.ourBrand');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate file name format
   */
  static isValidFileName(filename: string): boolean {
    const validExtensions = ['.xlsx', '.xls', '.xlsm', '.csv'];
    return validExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  /**
   * Validate ISO date string
   */
  static isValidISODate(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      return date.toISOString() === dateString;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize state object for safe storage
   */
  static sanitizeState(state: ConcatenationState): ConcatenationState {
    return {
      ...state,
      originalFileName: state.originalFileName?.trim() || '',
      concatenatedFileName: state.concatenatedFileName?.trim() || '',
      selectedSheets: state.selectedSheets?.filter(sheet => sheet && sheet.trim()) || [],
      targetVariable: state.targetVariable?.trim() || undefined,
      selectedFilters: Array.isArray(state.selectedFilters) 
        ? state.selectedFilters.filter(filter => filter && typeof filter === 'string' && filter.trim() !== '')
        : [],
      totalRows: Math.max(0, Math.floor(state.totalRows || 0)),
      processedAt: state.processedAt || new Date().toISOString(),
      status: state.status || 'completed'
    };
  }

  /**
   * Get validation summary for debugging
   */
  static getValidationSummary(state: ConcatenationState): string {
    const validation = this.validateConcatenationState(state);
    
    let summary = `State Validation: ${validation.isValid ? 'PASSED' : 'FAILED'}\n`;
    
    if (validation.errors.length > 0) {
      summary += `\nErrors (${validation.errors.length}):\n`;
      validation.errors.forEach((error, index) => {
        summary += `  ${index + 1}. ${error}\n`;
      });
    }
    
    if (validation.warnings.length > 0) {
      summary += `\nWarnings (${validation.warnings.length}):\n`;
      validation.warnings.forEach((warning, index) => {
        summary += `  ${index + 1}. ${warning}\n`;
      });
    }
    
    return summary;
  }
}
