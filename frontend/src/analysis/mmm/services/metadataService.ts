/**
 * MetadataService
 * 
 * Purpose: Advanced concatenation state persistence with validation, health checking, and comprehensive metadata management
 * 
 * BACKEND ARCHITECTURE CLARIFICATION:
 * ===========================================
 * This service uses NODE.JS BACKEND EXCLUSIVELY for all metadata operations.
 * 
 * BACKEND RESPONSIBILITIES:
 * - Node.js Backend (port 3001): ALL state management, metadata operations, JSON persistence
 * - Python Backend (port 8000): Data processing, file operations, heavy computation
 * 
 * Description: This service provides a sophisticated interface for saving, retrieving, and managing
 * concatenation states using the Node.js backend exclusively for all metadata operations. It ensures
 * fast state persistence for all metadata operations, preventing data loss when users
 * navigate between pages by persisting processed data and allowing comprehensive state restoration
 * with validation and health monitoring.
 * 
 * Key Functions:
 * - saveConcatenationState(): Saves concatenation state with validation
 * - getConcatenationState(): Retrieves existing state for file
 * - deleteConcatenationState(): Removes state when workflow completes
 * - checkProcessedDataExists(): Checks if data exists to avoid re-computation
 * - validateState(): Performs comprehensive state validation
 * - checkBackendHealth(): Monitors backend availability
 * - sanitizeState(): Cleans state data for security
 * 
 * State Structure:
 * - originalFileName: The uploaded file name
 * - concatenatedFileName: Generated concatenated file name
 * - selectedSheets: Array of sheet names that were concatenated
 * - targetVariable: Selected target variable from Revenue columns
 * - selectedFilters: Array of selected filter columns from Others category
 * - brandMetadata: Extracted brand categories and metadata
 * - previewData: Sample rows from concatenated data
 * - columnCategories: Business-categorized columns
 * - totalRows: Total row count in concatenated data
 * - processedAt: Timestamp when concatenation was completed
 * 
 * API Endpoints:
 * - POST /api/metadata/save: Saves concatenation state
 * - GET /api/metadata/{filename}: Retrieves state for file
 * - DELETE /api/metadata/{filename}: Deletes state
 * - GET /api/metadata/health: Checks backend health
 * - GET /api/metadata/exists/{filename}: Checks if state exists
 * 
 * Data Flow:
 * 1. State saving: Validation → Sanitization → Backend persistence
 * 2. State retrieval: File lookup → Backend fetch → State restoration
 * 3. Health monitoring: Backend check → Status caching → Health reporting
 * 4. State validation: Structure check → Data integrity → Validation summary
 * 
 * Dependencies:
 * - MetadataBackendChecker: Backend health monitoring
 * - StateValidator: State validation and sanitization
 * - analysis.ts: Data structure type definitions
 * - Fetch API: HTTP operations
 * - AbortSignal: Timeout handling
 */

// Re-export types for backward compatibility
export type {
  BrandCategories,
  BrandMetadata,
  PreviewDataRow,
  ConcatenationState,
  MetadataResponse,
  StateValidationResult,
  BackendHealthStatus
} from './metadata/types';

import { MetadataBackendChecker } from './metadata/backendChecker';
import { StateValidator } from './metadata/stateValidator';
import type { ConcatenationState, MetadataResponse } from './metadata/types';
import { getStateApiUrl } from '@/config/apiConfig';

export class MetadataService {
  // BACKEND ARCHITECTURE DECISION: Use Node.js backend exclusively for all metadata operations
  // Python backend URL kept for legacy compatibility but not used for metadata
  private static readonly NODEJS_BASE_URL = getStateApiUrl(); // PRIMARY - all metadata operations use this
  private static readonly PYTHON_BASE_URL = 'http://localhost:8000/api/metadata'; // DEPRECATED - not used for metadata

  /**
   * Save concatenation state to Node.js backend (write operations)
   */
  async saveConcatenationState(state: ConcatenationState): Promise<MetadataResponse> {
    try {
      console.log('💾 Saving concatenation state:', state.originalFileName);
      
      // Validate state before saving
      const validation = StateValidator.validateConcatenationState(state);
      if (!validation.isValid) {
        console.error('❌ State validation failed:', validation.errors);
        return {
          success: false,
          error: `Invalid state data: ${validation.errors.join(', ')}`
        };
      }

      if (validation.warnings.length > 0) {
        console.warn('⚠️ State validation warnings:', validation.warnings);
      }
      
      // FIXED: Always assume Node.js backend is running per workspace rules
      // Skip health check to prevent 404 errors due to timing issues
      console.log('🚀 Proceeding with state save (assuming Node.js backend is running per workspace rules)');

      // Sanitize state before sending
      const sanitizedState = StateValidator.sanitizeState(state);
      
      const response = await fetch(`${MetadataService.NODEJS_BASE_URL}/metadata/state/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalFileName: sanitizedState.originalFileName,
          concatenatedFileName: sanitizedState.concatenatedFileName,
          selectedSheets: sanitizedState.selectedSheets,
          targetVariable: sanitizedState.targetVariable,
          selectedFilters: sanitizedState.selectedFilters,
          brandMetadata: sanitizedState.brandMetadata,
          previewData: sanitizedState.previewData,
          columnCategories: sanitizedState.columnCategories,
          totalRows: sanitizedState.totalRows,
          processedAt: sanitizedState.processedAt
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP error saving state:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const result = await response.json();
      
      // Validate the response structure
      if (!result.success) {
        console.error('❌ Backend returned failure:', result);
        return {
          success: false,
          error: result.error || 'Backend save operation failed'
        };
      }
      
      // Debug the response structure
      console.log('🔍 Backend response structure:', {
        success: result.success,
        message: result.message,
        data: result.data,
        stateFileName: result.stateFileName,
        stateFilePath: result.stateFilePath,
        dataStateFileName: result.data?.stateFileName,
        dataStateFilePath: result.data?.stateFilePath
      });
      
      // Extract the state filename and path from the response
      // FIXED (2025-01-27): Backend now returns stateFileName at root level, but also check data object as fallback
      const stateFileName = result.stateFileName || result.data?.stateFileName;
      const stateFilePath = result.stateFilePath || result.data?.stateFilePath;
      
      if (stateFileName) {
        console.log('✅ State saved successfully:', stateFileName);
        // Store the filename for later retrieval - add to the response object
        result.stateFileName = stateFileName;
        result.stateFilePath = stateFilePath;
      } else {
        console.warn('⚠️ State saved but filename not returned in response');
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Failed to save state:', error);
      return {
        success: false,
        error: `Failed to save state: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Retrieve concatenation state from Node.js backend (read operations)
   */
  async getConcatenationState(originalFileName: string): Promise<MetadataResponse<ConcatenationState>> {
    try {
      console.log('🔍 Retrieving concatenation state for:', originalFileName);
      
      // FIXED: Always assume Node.js backend is running per workspace rules
      // Skip health check to prevent unnecessary delays and 404 errors
      console.log('🚀 Proceeding with state retrieval (assuming Node.js backend is running per workspace rules)');
      
      const response = await fetch(`${MetadataService.NODEJS_BASE_URL}/metadata/state/${encodeURIComponent(originalFileName)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('ℹ️ No saved state found for:', originalFileName);
          return {
            success: false,
            error: 'No saved state found'
          };
        }
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ State retrieved successfully:', result.data?.concatenatedFileName);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to retrieve state:', error);
      return {
        success: false,
        error: `Failed to retrieve state: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Delete concatenation state from Node.js backend (write operations)
   */
  async deleteConcatenationState(originalFileName: string): Promise<MetadataResponse> {
    try {
      console.log('🗑️ Deleting concatenation state for:', originalFileName);
      
      // Check if Node.js backend is available for write operations
      const nodejsAvailable = await this.isNodejsBackendAvailable();
      if (!nodejsAvailable) {
        console.warn('⚠️ Node.js backend unavailable, no state to delete');
        return {
          success: true,
          message: 'Node.js backend unavailable - no state to delete'
        };
      }
      
      const response = await fetch(`${MetadataService.NODEJS_BASE_URL}/metadata/state/${encodeURIComponent(originalFileName)}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('ℹ️ No state to delete for:', originalFileName);
          return {
            success: true,
            message: 'No state to delete'
          };
        }
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ State deleted successfully:', originalFileName);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to delete state:', error);
      return {
        success: false,
        error: `Failed to delete state: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check if concatenation state exists for a file
   */
  async hasExistingState(originalFileName: string): Promise<boolean> {
    try {
      const result = await this.getConcatenationState(originalFileName);
      return result.success && !!result.data;
    } catch (error) {
      console.error('❌ Error checking existing state:', error);
      return false;
    }
  }

  /**
   * Health check for metadata service
   */
  async healthCheck(): Promise<MetadataResponse> {
    return MetadataBackendChecker.getHealthDetails();
  }

  /**
   * Get backend health status with caching
   */
  async getBackendStatus() {
    return MetadataBackendChecker.checkBackendHealth();
  }

  /**
   * Force refresh backend health status
   */
  async refreshBackendStatus() {
    return MetadataBackendChecker.refreshHealth();
  }

  /**
   * Validate state structure
   */
  static validateState(state: ConcatenationState) {
    return StateValidator.validateConcatenationState(state);
  }

  /**
   * Get validation summary for debugging
   */
  static getValidationSummary(state: ConcatenationState): string {
    return StateValidator.getValidationSummary(state);
  }

  /**
   * Check if Node.js backend is available for write operations
   */
  private async isNodejsBackendAvailable(): Promise<boolean> {
    try {
      const nodeUrl = import.meta.env.VITE_NODE_API_URL || 'http://localhost:3001';
      console.log('🔍 Checking Node.js backend availability at', `${nodeUrl}/api/metadata/health`);
      const response = await fetch(`${nodeUrl}/api/metadata/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      console.log('📡 Node.js backend health check response:', response.status, response.ok);
      return response.ok;
    } catch (error) {
      console.error('❌ Node.js backend health check failed:', error);
      console.error('💡 Make sure Node.js backend is running on port 3001');
      return false;
    }
  }
}

// Create singleton instance
export const metadataService = new MetadataService();
export default metadataService;