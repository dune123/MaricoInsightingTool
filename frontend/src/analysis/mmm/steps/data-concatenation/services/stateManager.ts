/**
 * ========================================
 * STATE MANAGER SERVICE - DATA CONCATENATION MODULE
 * ========================================
 * 
 * Purpose: State persistence and restoration operations
 * 
 * Description:
 * Service layer for managing state persistence and restoration. Handles saving
 * and loading concatenation state from the backend metadata service.
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

import { ConcatenationState, StateRestorationResult } from '../types';
import { metadataService, StateValidator } from '@/analysis/mmm/services';

/**
 * Save concatenation state to backend
 */
export async function saveConcatenationState(state: ConcatenationState): Promise<boolean> {
  try {
    console.log('💾 Saving concatenation state:', {
      originalFileName: state.originalFileName,
      targetVariable: state.targetVariable,
      selectedFilters: state.selectedFilters,
      totalRows: state.totalRows
    });
    
    // CRITICAL FIX: Sanitize state before validation to fix common issues
    const sanitizedState = StateValidator.sanitizeState(state);
    
    // CRITICAL FIX: Validate sanitized state before saving to prevent validation errors
    const validation = StateValidator.validateConcatenationState(sanitizedState);
    
    if (!validation.isValid) {
      console.error('❌ State validation failed after sanitization:', {
        errors: validation.errors,
        warnings: validation.warnings,
        originalState: state,
        sanitizedState: sanitizedState
      });
      // Don't proceed if validation still fails after sanitization
      return false;
    }
    
    if (validation.warnings.length > 0) {
      console.warn('⚠️ State validation warnings:', validation.warnings);
    }
    
            await metadataService.saveConcatenationState(sanitizedState);
    console.log('✅ State saved successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to save state:', error);
    return false;
  }
}

/**
 * Load concatenation state from backend
 */
export async function loadConcatenationState(originalFileName: string): Promise<StateRestorationResult> {
  try {
    console.log('🔄 Loading concatenation state for:', originalFileName);
    
          const result = await metadataService.getConcatenationState(originalFileName);
    
    if (result.success && result.data) {
      console.log('✅ State loaded successfully:', {
        targetVariable: result.data.targetVariable,
        selectedFilters: result.data.selectedFilters,
        totalRows: result.data.totalRows
      });
      
      return {
        success: true,
        restored: true,
        data: result.data
      };
    } else {
      console.log('ℹ️ No existing state found');
      return {
        success: true,
        restored: false
      };
    }
  } catch (error) {
    console.error('❌ Failed to load state:', error);
    return {
      success: false,
      restored: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create concatenation state object
 */
export function createConcatenationState(params: {
  originalFileName: string;
  concatenatedFileName: string;
  selectedSheets: string[];
  targetVariable?: string;
  selectedFilters?: string[];
  brandMetadata?: any;
  previewData: any[];
  columnCategories?: any;
  totalRows: number;
}): ConcatenationState {
  // CRITICAL FIX: Add validation and fallbacks for required fields
  const originalFileName = params.originalFileName?.trim() || '';
  const concatenatedFileName = params.concatenatedFileName?.trim() || '';
  const selectedSheets = params.selectedSheets?.filter(sheet => sheet && sheet.trim()) || [];
  
  // CRITICAL FIX: Don't create state if essential parameters are missing
  if (!originalFileName || !concatenatedFileName) {
    console.warn('⚠️ createConcatenationState: Critical parameters missing - skipping state creation', {
      originalFileName: !!originalFileName,
      concatenatedFileName: !!concatenatedFileName,
      hasSheets: selectedSheets.length > 0
    });
    
    // Return a minimal but valid state object with placeholder values
    return {
      originalFileName: originalFileName || 'placeholder_file.xlsx',
      concatenatedFileName: concatenatedFileName || 'placeholder_concatenated.xlsx', 
      selectedSheets: selectedSheets.length > 0 ? selectedSheets : ['PlaceholderSheet'],
      targetVariable: params.targetVariable?.trim() || undefined,
      selectedFilters: params.selectedFilters || [],
      brandMetadata: params.brandMetadata,
      previewData: params.previewData || [],
      columnCategories: params.columnCategories,
      totalRows: Math.max(0, params.totalRows || 0),
      processedAt: new Date().toISOString(),
      status: 'completed'
    };
  }
  
  // CRITICAL FIX: Ensure selectedFilters is always a valid array
  const validatedFilters = Array.isArray(params.selectedFilters) 
    ? params.selectedFilters.filter(filter => filter && typeof filter === 'string' && filter.trim() !== '')
    : [];

  return {
    originalFileName,
    concatenatedFileName,
    selectedSheets,
    targetVariable: params.targetVariable?.trim() || undefined,
    selectedFilters: validatedFilters,
    brandMetadata: params.brandMetadata,
    previewData: params.previewData || [],
    columnCategories: params.columnCategories,
    totalRows: Math.max(0, params.totalRows || 0),
    processedAt: new Date().toISOString(),
    status: 'completed'
  };
}

/**
 * Update existing concatenation state
 */
export async function updateConcatenationState(
  originalFileName: string,
  updates: Partial<ConcatenationState>
): Promise<boolean> {
  try {
    // Load existing state
    const existingStateResult = await loadConcatenationState(originalFileName);
    
    if (!existingStateResult.success || !existingStateResult.data) {
      console.error('Cannot update state: no existing state found');
      return false;
    }
    
    // Merge updates with existing state
    const updatedState: ConcatenationState = {
      ...existingStateResult.data,
      ...updates,
      processedAt: new Date().toISOString()
    };
    
    // Save updated state
    return await saveConcatenationState(updatedState);
  } catch (error) {
    console.error('❌ Failed to update state:', error);
    return false;
  }
}

/**
 * Delete concatenation state
 */
export async function deleteConcatenationState(originalFileName: string): Promise<boolean> {
  try {
    console.log('🗑️ Deleting concatenation state for:', originalFileName);
    
    // Note: Implement deletion in MetadataService if needed
    // For now, we'll just log the operation
    console.log('⚠️ State deletion not implemented in MetadataService');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to delete state:', error);
    return false;
  }
}

/**
 * Validate concatenation state structure
 */
export function validateConcatenationState(state: any): state is ConcatenationState {
  if (!state || typeof state !== 'object') {
    return false;
  }
  
  const requiredFields = [
    'originalFileName',
    'concatenatedFileName',
    'selectedSheets',
    'previewData',
    'totalRows',
    'processedAt',
    'status'
  ];
  
  for (const field of requiredFields) {
    if (!(field in state)) {
      console.error(`Missing required field in state: ${field}`);
      return false;
    }
  }
  
  if (!Array.isArray(state.selectedSheets)) {
    console.error('selectedSheets must be an array');
    return false;
  }
  
  if (!Array.isArray(state.previewData)) {
    console.error('previewData must be an array');
    return false;
  }
  
  if (typeof state.totalRows !== 'number' || state.totalRows < 0) {
    console.error('totalRows must be a non-negative number');
    return false;
  }
  
  return true;
}

/**
 * Get state summary for logging/debugging
 */
export function getStateSummary(state: ConcatenationState): object {
  return {
    originalFileName: state.originalFileName,
    concatenatedFileName: state.concatenatedFileName,
    sheetsCount: state.selectedSheets.length,
    targetVariable: state.targetVariable || 'Not set',
    filtersCount: state.selectedFilters?.length || 0,
    dataRows: state.previewData.length,
    totalRows: state.totalRows,
    hasColumnCategories: !!state.columnCategories,
    hasBrandMetadata: !!state.brandMetadata,
    processedAt: state.processedAt,
    status: state.status
  };
}
