/**
 * BrandAnalysisService
 * 
 * Purpose: Comprehensive frontend service for brand-based analysis management and state persistence
 * 
 * Description: This service handles all brand analysis operations for the frontend, providing
 * a complete solution for analysis lifecycle management. It replaces the hardcoded filename-based
 * system with proper brand organization, comprehensive state management, and advanced analysis
 * operations including creation, updates, deletion, and state restoration.
 * 
 * Key Functions:
 * - createAnalysis(): Creates new brand analysis with force overwrite support
 * - listAnalyses(): Lists existing analyses for review flow
 * - getAnalysis(): Loads analysis with full state restoration
 * - updateAnalysis(): Updates analysis state with partial updates
 * - deleteAnalysis(): Deletes analysis and associated data
 * - checkBrandExists(): Checks brand existence and handles conflicts
 * - generateAnalysisId(): Generates unique analysis ID with proper formatting
 * 
 * State Management:
 * - Concatenation state persistence
 * - Filter state management with metadata
 * - Model state tracking
 * - Progress tracking for all workflow steps
 * - File management and organization
 * - Analysis metadata persistence
 * 
 * API Endpoints:
 * - POST /api/analysis: Creates new analysis
 * - GET /api/analysis: Lists all analyses
 * - GET /api/analysis/{id}: Retrieves specific analysis
 * - PUT /api/analysis/{id}: Updates analysis state
 * - DELETE /api/analysis/{id}: Deletes analysis
 * - GET /api/analysis/brand/{brandName}: Checks brand existence
 * 
 * Data Structures:
 * - BrandAnalysis: Complete analysis representation
 * - FilterState: Filter configuration and metadata
 * - ModelState: Model configuration and results
 * - AnalysisListItem: Summary for listing operations
 * - CreateAnalysisRequest: Analysis creation parameters
 * - ApiResponse: Standardized API response format
 * 
 * Data Flow:
 * 1. Analysis creation: Brand validation → ID generation → Backend creation
 * 2. Analysis loading: ID lookup → Full state restoration → Context population
 * 3. State updates: Partial updates → Backend persistence → Context sync
 * 4. Analysis deletion: Data cleanup → Backend removal → Context clearing
 * 
 * Dependencies:
 * - ApiConfig: Backend configuration and endpoints
 * - ConcatenationState: State management types
 * - Fetch API: HTTP operations
 * - Console logging: Debugging and error tracking
 */

import { getStateApiUrl } from '@/config/apiConfig';
import { ConcatenationState } from '@/analysis/mmm/steps/data-concatenation/types';
import { logger } from '@/utils/logger';
import { NonMMMStateService } from '@/analysis/nonmmm/services/NonMMMStateService';

// Type definitions
export interface FilterState {
  selectedFilters: string[];
  updatedAt?: string;
  filterMetadata?: {
    selectedAt: string;
    category: string;
    selectionStep: string;
  };
}

export interface ModelState {
  [key: string]: unknown;
}
export interface BrandAnalysis {
  brandName: string;
  analysisId: string;
  createdAt: string;
  lastModified: string;
  currentStep: number;
  status: 'created' | 'in_progress' | 'completed' | 'paused' | 'error';
  analysisType: string;
  files: {
    originalFileName?: string;
    concatenatedFileName?: string;
    uploadedFiles: string[];
    processedFiles: string[];
  };
  progress: {
    dataUploaded: boolean;
    concatenationCompleted: boolean;
    targetVariableSelected: boolean;
    filtersApplied: boolean;
    brandCategorized: boolean;
    modelBuilt: boolean;
    resultsGenerated: boolean;
  };
  concatenationState?: ConcatenationState;
  filterState?: FilterState;
  modelState?: ModelState;
}

export interface AnalysisListItem {
  analysisId: string;
  brandName: string;
  lastModified: string;
  currentStep: number;
  status: string;
  analysisType: string;
}

export interface CreateAnalysisRequest {
  brandName: string;
  analysisType: string;
  forceOverwrite?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

class BrandAnalysisService {
  private getBaseUrl(): string {
    // Use Node.js backend for ALL analysis operations (state management)
    return `${getStateApiUrl()}/brands/analyses`;
  }

  /**
   * Check if brand analysis already exists for a specific analysis type
   */
  async checkBrandExists(brandName: string, analysisType: string = 'MMM'): Promise<ApiResponse<{exists: boolean, data?: BrandAnalysis}>> {
    logger.service(`Checking if brand exists: ${brandName} (${analysisType})`, null, 'BrandAnalysisService');
    
    try {
      const baseUrl = this.getBaseUrl();
      // URL encode the brand name to handle special characters and spaces
      const encodedBrandName = encodeURIComponent(brandName);
      const encodedAnalysisType = encodeURIComponent(analysisType);
      // Use Node.js backend endpoint for brand existence check with analysis type
      const response = await fetch(`${getStateApiUrl()}/brands/${encodedBrandName}/exists?analysisType=${encodedAnalysisType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      logger.service(`Brand check completed: ${result.data?.exists ? 'EXISTS' : 'NOT_FOUND'}`, {
        brandName,
        exists: result.data?.exists
      }, 'BrandAnalysisService');
      
      return {
        success: result.success,
        message: result.message,
        data: {
          exists: result.data?.exists || false,
          data: result.data?.exists ? result.data : undefined
        }
      };

    } catch (error) {
      console.error('❌ Error checking brand existence:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to check brand existence',
        data: { exists: false }
      };
    }
  }

  /**
   * Create a new brand analysis
   */
  async createAnalysis(brandName: string, analysisType: string = 'MMM', forceOverwrite: boolean = false): Promise<ApiResponse<BrandAnalysis>> {
    logger.service(`Creating analysis: ${brandName}`, {
      analysisType,
      forceOverwrite
    }, 'BrandAnalysisService');
    
    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandName,
          analysisType,
          forceOverwrite
        } as CreateAnalysisRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json() as ApiResponse<BrandAnalysis>;
      logger.service('Analysis created successfully', {
        analysisId: result.data?.analysisId,
        brandName
      }, 'BrandAnalysisService');
      
      return result;

    } catch (error) {
      console.error('❌ Failed to create analysis:', error);
      throw error;
    }
  }

  /**
   * List all existing brand analyses
   */
  async listAnalyses(): Promise<ApiResponse<AnalysisListItem[]>> {
    logger.service('Fetching analyses list', null, 'BrandAnalysisService');
    
    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json() as ApiResponse<AnalysisListItem[]>;
      logger.service(`Found ${result.data?.length || 0} analyses`, {
        count: result.data?.length || 0
      }, 'BrandAnalysisService');
      
      return result;

    } catch (error) {
      console.error('❌ Failed to list analyses:', error);
      throw error;
    }
  }

  /**
   * Get specific analysis by ID
   */
  async getAnalysis(analysisId: string): Promise<ApiResponse<BrandAnalysis>> {
    console.log('🔍 Loading analysis:', analysisId);
    
    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(`${baseUrl}/${analysisId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json() as ApiResponse<BrandAnalysis>;
      console.log('✅ Analysis loaded successfully');
      
      return result;

    } catch (error) {
      console.error('❌ Failed to load analysis:', error);
      throw error;
    }
  }

  /**
   * Update analysis state and progress
   */
  async updateAnalysis(
    analysisId: string, 
    updates: {
      currentStep?: number;
      status?: string;
      concatenationState?: ConcatenationState;
      filterState?: FilterState;
      modelState?: ModelState;
    }
  ): Promise<ApiResponse<BrandAnalysis>> {
    console.log('💾 Updating analysis:', analysisId, updates);
    
    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(`${baseUrl}/${analysisId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json() as ApiResponse<BrandAnalysis>;
      console.log('✅ Analysis updated successfully');
      
      return result;

    } catch (error) {
      console.error('❌ Failed to update analysis:', error);
      throw error;
    }
  }

  /**
   * Delete analysis and all associated data
   */
  async deleteAnalysis(analysisId: string): Promise<ApiResponse<null>> {
    console.log('🗑️ Deleting analysis:', analysisId);
    
    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(`${baseUrl}/${analysisId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json() as ApiResponse<null>;
      console.log('✅ Analysis deleted successfully');
      
      // Also clear non-MMM state if this was a non-MMM analysis
      if (analysisId.includes('non-mmm')) {
        try {
          await NonMMMStateService.clearNonMMMState();
          console.log('✅ Cleared non-MMM state after analysis deletion');
        } catch (error) {
          console.warn('⚠️ Failed to clear non-MMM state:', error);
        }
      }
      
      return result;

    } catch (error) {
      console.error('❌ Failed to delete analysis:', error);
      throw error;
    }
  }

  /**
   * Get analysis ID from brand name (for backward compatibility)
   */
  static createAnalysisId(brandName: string): string {
    // Convert to lowercase, replace spaces/special chars with hyphens
    let analysisId = brandName.toLowerCase()
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Ensure minimum length
    if (analysisId.length < 2) {
      analysisId = `brand-${analysisId}`;
    }
    
    return analysisId;
  }
}

// Create singleton instance
export const brandAnalysisService = new BrandAnalysisService();
export default brandAnalysisService;
