/**
 * Initialization Service
 * 
 * Purpose: Single point of control for analysis initialization to prevent race conditions
 * and multiple execution paths between components.
 * 
 * This service handles:
 * - New analysis workflow initialization
 * - Resume analysis workflow initialization  
 * - Prevents duplicate initialization attempts
 * - Coordinates between different components
 */

import { brandAnalysisService } from './brandAnalysisService';
import { logger } from '@/utils/logger';

export interface InitializationState {
  isInitializing: boolean;
  currentAnalysisId: string | null;
  selectedBrand: string | null;
  analysisType: string | null;
  isNewAnalysis: boolean; // Track whether this is a new or resumed analysis
}

export interface InitializationResult {
  success: boolean;
  analysisId?: string;
  brandName?: string;
  error?: string;
}

class InitializationService {
  private isInitializing = false;
  private currentState: InitializationState = {
    isInitializing: false,
    currentAnalysisId: null,
    selectedBrand: null,
    analysisType: null,
    isNewAnalysis: false
  };

  /**
   * Initialize a new analysis workflow
   * This is the ONLY entry point for new analysis creation
   */
  async initializeNewAnalysis(brandName: string, analysisType: string = 'MMM', forceOverwrite: boolean = false): Promise<InitializationResult> {
    // Prevent multiple simultaneous initializations
    if (this.isInitializing) {
      console.log('⏸️ Initialization already in progress, skipping duplicate request');
      return {
        success: false,
        error: 'Initialization already in progress'
      };
    }

    // Prevent re-initializing the same brand (unless overwriting)
    if (!forceOverwrite && this.currentState.selectedBrand === brandName && this.currentState.analysisType === analysisType) {
      console.log('⏸️ Analysis already initialized for this brand and type');
      return {
        success: true,
        analysisId: this.currentState.currentAnalysisId || undefined,
        brandName: this.currentState.selectedBrand || undefined
      };
    }

    this.isInitializing = true;
    this.currentState.isInitializing = true;

    try {
      logger.service(`Starting new analysis initialization: ${brandName}`, {
        analysisType,
        forceOverwrite
      }, 'InitializationService');

      // Step 1: Check if brand already exists for this analysis type (only if not overwriting)
      if (!forceOverwrite) {
        const existsResult = await brandAnalysisService.checkBrandExists(brandName, analysisType);

        if (existsResult.success && existsResult.data?.exists) {
          // Brand exists for this analysis type - this should trigger resume workflow, not new analysis
          console.log(`⚠️ ${analysisType} analysis already exists for brand ${brandName}, should use resume workflow instead`);
          return {
            success: false,
            error: `${analysisType} analysis already exists for brand ${brandName}. Please use resume analysis instead.`
          };
        }
      }

      // Step 2: Create new analysis (with forceOverwrite support)
      const createResult = await brandAnalysisService.createAnalysis(brandName.trim(), analysisType, forceOverwrite);

      if (!createResult.success || !createResult.data) {
        throw new Error(createResult.message || 'Failed to create analysis');
      }

      // Step 3: Update internal state
      this.currentState = {
        isInitializing: false,
        currentAnalysisId: createResult.data.analysisId,
        selectedBrand: createResult.data.brandName,
        analysisType: createResult.data.analysisType,
        isNewAnalysis: true
      };
      
      // IMPORTANT: This analysis is now in "pending" state
      // - Analysis folder will be created when user uploads data
      // - Analysis will not appear in listings until data is uploaded
      // - This creates a clean flow: create intent → upload data → analysis becomes real

      logger.service('Analysis initialized successfully', {
        analysisId: createResult.data.analysisId,
        brandName: createResult.data.brandName,
        analysisType: createResult.data.analysisType
      }, 'InitializationService');

      return {
        success: true,
        analysisId: createResult.data.analysisId,
        brandName: createResult.data.brandName
      };

    } catch (error) {
      console.error('❌ Failed to initialize new analysis:', error);
      
      // Reset state on error
      this.currentState = {
        isInitializing: false,
        currentAnalysisId: null,
        selectedBrand: null,
        analysisType: null,
        isNewAnalysis: false
      };

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      this.isInitializing = false;
      this.currentState.isInitializing = false;
    }
  }

  /**
   * Overwrite an existing analysis workflow
   * This is the ONLY entry point for overwriting existing analyses
   */
  async overwriteExistingAnalysis(brandName: string, analysisType: string = 'MMM'): Promise<InitializationResult> {
    return this.initializeNewAnalysis(brandName, analysisType, true);
  }

  /**
   * Resume an existing analysis workflow
   * This is the ONLY entry point for resuming existing analyses
   */
  async resumeExistingAnalysis(analysisId: string): Promise<InitializationResult> {
    if (this.isInitializing) {
      console.log('⏸️ Initialization already in progress, skipping duplicate request');
      return {
        success: false,
        error: 'Initialization already in progress'
      };
    }

    this.isInitializing = true;
    this.currentState.isInitializing = true;

    try {
      console.log('🔄 Resuming existing analysis:', analysisId);

      // Load existing analysis data
      const analysisResult = await brandAnalysisService.getAnalysis(analysisId);

      if (!analysisResult.success || !analysisResult.data) {
        throw new Error(analysisResult.message || 'Failed to load existing analysis');
      }

      // Update internal state
      this.currentState = {
        isInitializing: false,
        currentAnalysisId: analysisResult.data.analysisId,
        selectedBrand: analysisResult.data.brandName,
        analysisType: analysisResult.data.analysisType,
        isNewAnalysis: false
      };

      console.log('✅ Existing analysis resumed successfully:', {
        analysisId: analysisResult.data.analysisId,
        brandName: analysisResult.data.brandName,
        analysisType: analysisResult.data.analysisType
      });

      return {
        success: true,
        analysisId: analysisResult.data.analysisId,
        brandName: analysisResult.data.brandName
      };

    } catch (error) {
      console.error('❌ Failed to resume existing analysis:', error);
      
      // Reset state on error
      this.currentState = {
        isInitializing: false,
        currentAnalysisId: null,
        selectedBrand: null,
        analysisType: null,
        isNewAnalysis: false
      };

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      this.isInitializing = false;
      this.currentState.isInitializing = false;
    }
  }

  /**
   * Get current initialization state
   */
  getCurrentState(): InitializationState {
    return { ...this.currentState };
  }

  /**
   * Check if initialization is currently in progress
   */
  isCurrentlyInitializing(): boolean {
    return this.isInitializing || this.currentState.isInitializing;
  }

  /**
   * Check if current analysis is a new analysis (not resumed)
   */
  isNewAnalysis(): boolean {
    return this.currentState.isNewAnalysis;
  }

  /**
   * Reset initialization state (useful for cleanup)
   */
  resetState(): void {
    this.isInitializing = false;
    this.currentState = {
      isInitializing: false,
      currentAnalysisId: null,
      selectedBrand: null,
      analysisType: null,
      isNewAnalysis: false
    };
    console.log('🔄 Initialization state reset');
  }

  /**
   * List all analyses - DELEGATED to brandAnalysisService (no redundant logging)
   */
  async listAnalyses(): Promise<{success: boolean, data?: unknown[], message?: string}> {
    // Direct delegation to analysisService - no additional logging to prevent duplicates
    return brandAnalysisService.listAnalyses();
  }

  /**
   * Clean up analysis (delete and reset state)
   */
  async cleanupAnalysis(analysisId: string): Promise<boolean> {
    try {
      console.log('🧹 Cleaning up analysis:', analysisId);
      
      const deleteResult = await brandAnalysisService.deleteAnalysis(analysisId);
      
      if (deleteResult.success) {
        // Reset internal state if this was the current analysis
        if (this.currentState.currentAnalysisId === analysisId) {
          this.resetState();
        }
        console.log('✅ Analysis cleaned up successfully');
        return true;
      } else {
        console.error('❌ Failed to cleanup analysis:', deleteResult.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Error during analysis cleanup:', error);
      return false;
    }
  }
}

// Create singleton instance
export const initializationService = new InitializationService();
export default initializationService;
