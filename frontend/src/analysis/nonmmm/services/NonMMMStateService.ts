/**
 * ========================================
 * BRANDBLOOM INSIGHTS - NON-MMM STATE PERSISTENCE SERVICE
 * ========================================
 * 
 * Purpose: Comprehensive state management for Non-MMM analysis workflow
 * 
 * Description:
 * This service handles all state persistence operations for Non-MMM analysis,
 * ensuring that user progress is saved after every completed action and
 * can be seamlessly resumed from any point in the workflow.
 * 
 * Key Features:
 * - Granular state saving after every user action
 * - Step and substep state tracking
 * - User progress position management
 * - State versioning and conflict resolution
 * - Auto-save functionality
 * - Local storage and backend synchronization
 * 
 * State Persistence Strategy:
 * - Save state after EVERY completed action (not just step completion)
 * - Track user's exact position in workflow
 * - Maintain all user selections and configurations
 * - Enable resume functionality from any step
 * - Prevent data loss during navigation
 * 
 * Used by:
 * - All Non-MMM step components for state persistence
 * - Workflow navigation and resumption
 * - Progress tracking and validation
 * - Error recovery and state restoration
 * 
 * Dependencies:
 * - Non-MMM type definitions
 * - Local storage API
 * - Backend API for state persistence
 * - Analysis context for global state
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 */

import {
  NonMMMAnalysisData,
  NonMMMStepState,
  NonMMMStatePersistence,
  NonMMMStateSaveRequest,
  NonMMMStateLoadRequest,
  NonMMMStateResponse,
  NonMMMProgressTracker,
  NonMMMValidationResult,
  NON_MMM_STEPS,
  NON_MMM_STEP_NAMES,
  NonMMMFileData,
  NonMMMExtractedData,
  NonMMMChartAnalysis,
  NonMMMModelConfiguration,
} from '@/analysis/nonmmm/types/nonmmm';

import { httpClient, api } from '@/utils/apiClient';
import { nodejsClient } from '@/utils/nodejsClient';

// ========================================
// TYPE DEFINITIONS FOR STEP DATA
// ========================================

/**
 * Union type for step data across all Non-MMM analysis steps
 * Covers all possible data structures that can be saved for each step
 */
export type NonMMMStepDataType = 
  | NonMMMFileData
  | NonMMMExtractedData
  | NonMMMChartAnalysis
  | NonMMMModelConfiguration
  | Record<string, unknown>;

/**
 * Union type for substep data within each step
 * Represents granular data for specific substeps
 */
export type NonMMMSubstepDataType = 
  | Record<string, unknown>;

// ========================================
// STATE PERSISTENCE SERVICE CLASS
// ========================================

export class NonMMMStateService {
  private static instance: NonMMMStateService;
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private autoSaveEnabled: boolean = true;
  private lastSaveTimestamp: string = '';
  private saveQueue: NonMMMStateSaveRequest[] = [];
  private isProcessingQueue: boolean = false;

  private constructor() {
    this.initializeAutoSave();
  }

  public static getInstance(): NonMMMStateService {
    if (!NonMMMStateService.instance) {
      NonMMMStateService.instance = new NonMMMStateService();
    }
    return NonMMMStateService.instance;
  }

  // ========================================
  // PUBLIC STATE MANAGEMENT METHODS
  // ========================================

  /**
   * Save state for a specific step and substep
   * This is the PRIMARY method for saving state after every completed action
   */
  public async saveStepState(
    analysisId: string,
    stepId: number,
    substepId: number,
    stepData: NonMMMStepDataType,
    substepData?: NonMMMSubstepDataType,
    userAction: string = 'user_action'
  ): Promise<NonMMMStateResponse> {
    try {
      const timestamp = new Date().toISOString();
      
      const saveRequest: NonMMMStateSaveRequest = {
        analysisId,
        stepId,
        substepId,
        stepData,
        substepData,
        timestamp,
        userAction,
      };

      // Add to save queue for batch processing
      this.saveQueue.push(saveRequest);

      // Process queue if not already processing
      if (!this.isProcessingQueue) {
        await this.processSaveQueue();
      }

      // Also save to local storage immediately for quick access
      await this.saveToLocalStorage(analysisId, stepId, substepData, stepData);

      const response: NonMMMStateResponse = {
        success: true,
        stateVersion: Date.now(),
        lastSavedAt: timestamp,
      };

      console.log(`✅ State saved for step ${stepId}, substep ${substepId}: ${userAction}`);
      return response;

    } catch (error) {
      console.error('❌ Error saving step state:', error);
      return {
        success: false,
        errorMessage: `Failed to save state: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stateVersion: 0,
        lastSavedAt: '',
      };
    }
  }

  /**
   * Load state for a specific step
   * Used for state restoration when resuming analysis
   */
  public async loadStepState(
    analysisId: string,
    stepId?: number,
    includeSubsteps: boolean = true
  ): Promise<NonMMMStateResponse> {
    try {
      // First try to load from local storage for immediate access
      const localState = await this.loadFromLocalStorage(analysisId, stepId);
      
      if (localState && localState.success) {
        console.log(`✅ State loaded from local storage for step ${stepId || 'all'}`);
        return localState;
      }

      // For now, just use local storage since backend endpoints don't exist yet
      console.log('ℹ️ Backend state endpoints not available, using local storage only');
      return localState;

    } catch (error) {
      console.error('❌ Error loading step state:', error);
      return {
        success: false,
        errorMessage: `Failed to load state: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stateVersion: 0,
        lastSavedAt: '',
      };
    }
  }

  /**
   * Save user progress and current position in workflow
   * Critical for enabling resume functionality from any step
   */
  public async saveUserProgress(
    analysisId: string,
    currentStep: number,
    currentSubstep: number,
    completedSteps: number[],
    additionalData?: Record<string, unknown>
  ): Promise<NonMMMStateResponse> {
    try {
      const timestamp = new Date().toISOString();
      
      const progressData = {
        currentStep,
        currentSubstep,
        completedSteps,
        progressPercentage: this.calculateProgressPercentage(completedSteps),
        lastUpdated: timestamp,
        additionalData,
      };

      // For now, just save to local storage since backend endpoints don't exist yet
      await this.saveProgressToLocalStorage(analysisId, progressData);

      console.log(`✅ User progress saved: Step ${currentStep}, Substep ${currentSubstep}`);

      return {
        success: true,
        stateVersion: Date.now(),
        lastSavedAt: timestamp,
      };

    } catch (error) {
      console.error('❌ Error saving user progress:', error);
      return {
        success: false,
        errorMessage: `Failed to save progress: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stateVersion: 0,
        lastSavedAt: '',
      };
    }
  }

  /**
   * Resume analysis from a specific step
   * Restores all previous state and enables workflow continuation
   */
  public async resumeFromStep(
    analysisId: string,
    targetStep: number
  ): Promise<NonMMMStateResponse> {
    try {
      console.log(`🔄 Attempting to resume analysis from step ${targetStep}`);

      // Load complete state for the analysis
      const stateResponse = await this.loadStepState(analysisId);
      
      if (!stateResponse.success || !stateResponse.data) {
        throw new Error('Failed to load analysis state for resumption');
      }

      const state = stateResponse.data;
      
      // Validate that the target step is valid for resumption
      if (targetStep > state.currentStep) {
        throw new Error(`Cannot resume from step ${targetStep} - analysis is only at step ${state.currentStep}`);
      }

      // Update current position to target step
      const updatedState: NonMMMStatePersistence = {
        ...state,
        currentStep: targetStep,
        currentSubstep: 1, // Reset to first substep of target step
        updatedAt: new Date().toISOString(),
        lastModifiedBy: 'user_resume',
      };

      // Save the entire updated state to local storage
      await this.saveCompleteStateToLocalStorage(analysisId, updatedState);

      console.log(`✅ Successfully resumed analysis from step ${targetStep}`);

      return {
        success: true,
        data: updatedState,
        stateVersion: updatedState.stateVersion,
        lastSavedAt: updatedState.lastSavedAt,
      };

    } catch (error) {
      console.error('❌ Error resuming from step:', error);
      return {
        success: false,
        errorMessage: `Failed to resume from step: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stateVersion: 0,
        lastSavedAt: '',
      };
    }
  }

  /**
   * Enable/disable auto-save functionality
   * Auto-save ensures critical user actions are never lost
   */
  public setAutoSaveEnabled(enabled: boolean): void {
    this.autoSaveEnabled = enabled;
    
    if (enabled) {
      this.initializeAutoSave();
      console.log('✅ Auto-save enabled');
    } else {
      this.disableAutoSave();
      console.log('⚠️ Auto-save disabled');
    }
  }

  /**
   * Get current auto-save status
   */
  public isAutoSaveEnabled(): boolean {
    return this.autoSaveEnabled;
  }

  /**
   * Resolve state conflicts between frontend and backend
   * Implements versioning to prevent data loss
   */
  public async resolveStateConflicts(
    analysisId: string,
    frontendState: NonMMMStatePersistence,
    backendState: NonMMMStatePersistence
  ): Promise<NonMMMStatePersistence> {
    try {
      console.log('🔄 Resolving state conflicts...');

      // If backend state is newer, use it
      if (backendState.stateVersion > frontendState.stateVersion) {
        console.log('✅ Using backend state (newer version)');
        return backendState;
      }

      // If frontend state is newer, merge and save to backend
      if (frontendState.stateVersion > backendState.stateVersion) {
        console.log('✅ Using frontend state (newer version)');
        const mergedState = this.mergeStates(frontendState, backendState);
        await this.saveStateToBackend(analysisId, mergedState);
        return mergedState;
      }

      // If versions are equal, merge and create new version
      console.log('✅ Versions equal, merging states');
      const mergedState = this.mergeStates(frontendState, backendState);
      mergedState.stateVersion = Date.now();
      await this.saveStateToBackend(analysisId, mergedState);
      return mergedState;

    } catch (error) {
      console.error('❌ Error resolving state conflicts:', error);
      // Fallback to frontend state if conflict resolution fails
      return frontendState;
    }
  }

  /**
   * Get progress tracker for current analysis
   * Provides comprehensive progress information
   */
  public async getProgressTracker(analysisId: string): Promise<NonMMMProgressTracker | null> {
    try {
      const stateResponse = await this.loadStepState(analysisId);
      
      if (!stateResponse.success || !stateResponse.data) {
        return null;
      }

      const state = stateResponse.data;
      
      return {
        currentStep: state.currentStep,
        currentSubstep: state.currentSubstep,
        totalSteps: Object.keys(NON_MMM_STEPS).length,
        completedSteps: state.completedSteps,
        stepNames: Object.values(NON_MMM_STEP_NAMES),
        progressPercentage: state.progressPercentage,
        estimatedTimeRemaining: this.estimateTimeRemaining(state.completedSteps),
      };

    } catch (error) {
      console.error('❌ Error getting progress tracker:', error);
      return null;
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Process the save queue for batch operations
   */
  private async processSaveQueue(): Promise<void> {
    if (this.isProcessingQueue || this.saveQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    let requests: NonMMMStateSaveRequest[] = [];

    try {
      // Process all queued save requests
      requests = [...this.saveQueue];
      this.saveQueue = [];

      for (const request of requests) {
        // For now, just save to local storage since backend endpoints don't exist yet
        await this.saveToLocalStorage(
          request.analysisId, 
          request.stepId, 
          request.substepData || {}, 
          request.stepData
        );
      }

      console.log(`✅ Processed ${requests.length} save requests`);

    } catch (error) {
      console.error('❌ Error processing save queue:', error);
      // Re-queue failed requests
      this.saveQueue.unshift(...requests);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Initialize auto-save functionality
   */
  private initializeAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = setInterval(async () => {
      if (this.autoSaveEnabled && this.saveQueue.length > 0) {
        await this.processSaveQueue();
      }
    }, 5000); // Auto-save every 5 seconds if there are pending saves
  }

  /**
   * Disable auto-save functionality
   */
  private disableAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * Save state to local storage for immediate access
   */
  private async saveToLocalStorage(
    analysisId: string,
    stepId: number,
    substepData: NonMMMSubstepDataType,
    stepData: NonMMMStepDataType
  ): Promise<void> {
    try {
      const key = `nonmmm_state_${analysisId}_${stepId}`;
      const data = {
        stepId,
        substepData,
        stepData,
        timestamp: new Date().toISOString(),
      };
      
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('⚠️ Failed to save to local storage:', error);
    }
  }

  /**
   * Save complete state to local storage
   * Used for saving the entire analysis state, not just step data
   */
  private async saveCompleteStateToLocalStorage(
    analysisId: string,
    state: NonMMMStatePersistence
  ): Promise<void> {
    try {
      const key = `nonmmm_complete_state_${analysisId}`;
      const data = {
        ...state,
        timestamp: new Date().toISOString(),
      };
      
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('⚠️ Failed to save complete state to local storage:', error);
    }
  }

  /**
   * Load state from local storage
   */
  private async loadFromLocalStorage(
    analysisId: string,
    stepId?: number
  ): Promise<NonMMMStateResponse | null> {
    try {
      // First, try to load the complete state
      const completeState = await this.loadCompleteStateFromLocalStorage(analysisId);
      if (completeState) {
        return completeState;
      }

      if (stepId) {
        const key = `nonmmm_state_${analysisId}_${stepId}`;
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          return {
            success: true,
            data: parsed,
            stateVersion: Date.now(),
            lastSavedAt: parsed.timestamp,
          };
        }
      } else {
        // Load all steps from local storage
        const allData: Record<number, NonMMMStepState> = {};
        let hasData = false;
        
        for (let i = 1; i <= Object.keys(NON_MMM_STEPS).length; i++) {
          const key = `nonmmm_state_${analysisId}_${i}`;
          const data = localStorage.getItem(key);
          if (data) {
            allData[i] = JSON.parse(data) as NonMMMStepState;
            hasData = true;
          }
        }
        
        if (hasData) {
          return {
            success: true,
            data: {
              analysisId,
              brandName: '',
              currentStep: 1,
              currentSubstep: 1,
              stepStates: Object.values(allData),
              lastSavedAt: new Date().toISOString(),
              stateVersion: Date.now(),
              autoSaveEnabled: true,
              completedSteps: [],
              totalSteps: Object.keys(NON_MMM_STEPS).length,
              progressPercentage: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              createdBy: 'user',
              lastModifiedBy: 'user',
            } as NonMMMStatePersistence,
            stateVersion: Date.now(),
            lastSavedAt: new Date().toISOString(),
          };
        }
      }
      
      return null;
    } catch (error) {
      console.warn('⚠️ Failed to load from local storage:', error);
      return null;
    }
  }

  /**
   * Load complete state from local storage
   * Used for loading the entire analysis state, not just step data
   */
  private async loadCompleteStateFromLocalStorage(
    analysisId: string
  ): Promise<NonMMMStateResponse | null> {
    try {
      const key = `nonmmm_complete_state_${analysisId}`;
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          success: true,
          data: parsed,
          stateVersion: parsed.stateVersion || Date.now(),
          lastSavedAt: parsed.lastSavedAt || parsed.timestamp || new Date().toISOString(),
        };
      }
      return null;
    } catch (error) {
      console.warn('⚠️ Failed to load complete state from local storage:', error);
      return null;
    }
  }

  /**
   * Cache state in local storage after loading from backend
   */
  private async cacheStateInLocalStorage(
    analysisId: string,
    stateResponse: NonMMMStateResponse
  ): Promise<void> {
    try {
      if (stateResponse.data) {
        const key = `nonmmm_state_${analysisId}_cache`;
        localStorage.setItem(key, JSON.stringify({
          ...stateResponse.data,
          cachedAt: new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.warn('⚠️ Failed to cache state in local storage:', error);
    }
  }

  /**
   * Save progress to local storage
   */
  private async saveProgressToLocalStorage(
    analysisId: string,
    progressData: Record<string, unknown>
  ): Promise<void> {
    try {
      const key = `nonmmm_progress_${analysisId}`;
      localStorage.setItem(key, JSON.stringify(progressData));
    } catch (error) {
      console.warn('⚠️ Failed to save progress to local storage:', error);
    }
  }

  /**
   * Save progress to backend
   */
  private async saveProgressToBackend(
    analysisId: string,
    progressData: Record<string, unknown>
  ): Promise<void> {
    try {
              await nodejsClient.post('/nonmmm/progress/save', {
        analysisId,
        progressData,
      });
    } catch (error) {
      console.warn('⚠️ Failed to save progress to backend:', error);
    }
  }

  /**
   * Save complete state to backend
   */
  private async saveStateToBackend(
    analysisId: string,
    state: NonMMMStatePersistence
  ): Promise<void> {
    try {
              await nodejsClient.post('/nonmmm/state/save', {
        analysisId,
        state,
      });
    } catch (error) {
      console.warn('⚠️ Failed to save state to backend:', error);
    }
  }

  /**
   * Calculate progress percentage based on completed steps
   */
  private calculateProgressPercentage(completedSteps: number[]): number {
    const totalSteps = Object.keys(NON_MMM_STEPS).length;
    return Math.round((completedSteps.length / totalSteps) * 100);
  }

  /**
   * Estimate time remaining based on completed steps
   */
  private estimateTimeRemaining(completedSteps: number[]): string {
    const totalSteps = Object.keys(NON_MMM_STEPS).length;
    const remainingSteps = totalSteps - completedSteps.length;
    const estimatedMinutesPerStep = 5; // Rough estimate
    const totalMinutes = remainingSteps * estimatedMinutesPerStep;
    
    if (totalMinutes < 60) {
      return `${totalMinutes} minutes`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  }

  /**
   * Merge two states, preferring newer data
   */
  private mergeStates(
    state1: NonMMMStatePersistence,
    state2: NonMMMStatePersistence
  ): NonMMMStatePersistence {
    // Prefer the state with more completed steps
    if (state1.completedSteps.length > state2.completedSteps.length) {
      return state1;
    } else if (state2.completedSteps.length > state1.completedSteps.length) {
      return state2;
    }
    
    // If step counts are equal, prefer the more recent update
    return new Date(state1.updatedAt) > new Date(state2.updatedAt) ? state1 : state2;
  }

  // ========================================
  // GLOBAL STATE METHODS
  // ========================================

  /**
   * Clear all NonMMM state from localStorage and backend
   */
  public static async clearNonMMMState(): Promise<void> {
    try {
      // Clear localStorage
      localStorage.removeItem('nonmmm_global_state');
      console.log('✅ Cleared NonMMM state from localStorage');
      
      // If there's a current analysis ID, also clear from backend
      const currentState = localStorage.getItem('nonmmm_global_state');
      if (currentState) {
        const state = JSON.parse(currentState);
        if (state.analysisId) {
          try {
            await nodejsClient.delete(`/nonmmm/state/${state.analysisId}`);
            console.log('✅ Cleared NonMMM state from backend');
          } catch (error) {
            console.warn('⚠️ Failed to clear state from backend:', error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error clearing NonMMM state:', error);
    }
  }

  // REMOVED: Complex sync management - now using simple localStorage-only approach

  /**
   * Get the global NonMMM state from localStorage ONLY
   * No auto-sync, no backend calls, just get local state
   */
  public static async getNonMMMState(): Promise<Record<string, unknown> | null> {
    try {
      const localStateData = localStorage.getItem('nonmmm_global_state');
      if (localStateData) {
        const localState = JSON.parse(localStateData);
        console.log('📱 Retrieved NonMMM state from localStorage');
        return localState;
      }
      
      console.log('🔄 No local state found');
      return null;
    } catch (error) {
      console.error('❌ Error reading NonMMM global state:', error);
      return null;
    }
  }

  /**
   * Load state from backend for a specific analysis ID
   */
  public static async loadStateFromBackend(analysisId: string): Promise<Record<string, unknown> | null> {
    try {
      console.log('🔄 Loading state from backend for analysis:', analysisId);
      const response = await nodejsClient.get(`/nonmmm/state/${analysisId}`);
      
      if (response.data && response.data.success && response.data.data) {
        const backendState = response.data.data;
        console.log('✅ Loaded state from backend');
        
        // Save to localStorage for future access
        localStorage.setItem('nonmmm_global_state', JSON.stringify(backendState));
        console.log('💾 Cached backend state in localStorage');
        
        return backendState;
      } else {
        console.log('❌ No state found in backend for analysis:', analysisId);
        return null;
      }
    } catch (error) {
      // If it's a 404, the analysis doesn't exist - don't retry
      if (error instanceof Error && error.message.includes('404')) {
        console.log('📭 Analysis not found in backend (404) - treating as new analysis');
        return null;
      }
      
      console.warn('⚠️ Failed to load state from backend:', error);
      return null;
    }
  }

  /**
   * Save the global NonMMM state to localStorage ONLY
   * No backend calls, just save locally
   */
  public static async saveNonMMMState(state: Record<string, unknown>): Promise<void> {
    try {
      localStorage.setItem('nonmmm_global_state', JSON.stringify({
        ...state,
        lastUpdated: new Date().toISOString()
      }));
      console.log('✅ NonMMM state saved to localStorage');
    } catch (error) {
      console.error('❌ Error saving NonMMM state:', error);
    }
  }

  // REMOVED: Complex backend sync and save operations
  // Now using simple localStorage-only approach

  /**
   * Save distribution state for histogram data
   */
  public static async saveDistributionState(distributionData: {
    analysisId: string;
    brandName: string;
    filename: string;
    histograms: Array<{
      variable: string;
      bins: number[];
      frequencies: number[];
      min: number;
      max: number;
      mean: number;
      median: number;
      std: number;
    }>;
    generatedAt: string;
  }): Promise<void> {
    try {
      const stateKey = `nonmmm_distribution_${distributionData.analysisId}`;
      const stateData = {
        ...distributionData,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(stateKey, JSON.stringify(stateData));
      console.log('✅ Distribution state saved for analysis:', distributionData.analysisId);
    } catch (error) {
      console.error('❌ Error saving distribution state:', error);
      throw error;
    }
  }

  /**
   * Get distribution state for an analysis
   */
  public static getDistributionState(analysisId: string): {
    analysisId: string;
    brandName: string;
    filename: string;
    histograms: Array<{
      variable: string;
      bins: number[];
      frequencies: number[];
      min: number;
      max: number;
      mean: number;
      median: number;
      std: number;
    }>;
    generatedAt: string;
    lastUpdated: string;
  } | null {
    try {
      const stateKey = `nonmmm_distribution_${analysisId}`;
      const stateData = localStorage.getItem(stateKey);
      return stateData ? JSON.parse(stateData) : null;
    } catch (error) {
      console.error('❌ Error reading distribution state:', error);
      return null;
    }
  }

  /**
   * Save model results for an analysis
   */
  public static async saveModelResults(analysisId: string, modelResults: Array<{
    id: string;
    name: string;
    type: string;
    rSquared: number;
    adjustedRSquared: number;
    mse: number;
    mae: number;
    variables: Array<{
      name: string;
      coefficient: number;
      pValue: number;
      vif: number;
      significance: 'high' | 'medium' | 'low';
      expectedSign: string;
      actualSign: string;
      isExpected: boolean;
    }>;
    trainingTime: number;
    createdAt: string;
  }>): Promise<void> {
    try {
      const stateKey = `nonmmm_model_results_${analysisId}`;
      const stateData = {
        analysisId,
        models: modelResults,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(stateKey, JSON.stringify(stateData));
      console.log('✅ Model results saved for analysis:', analysisId);
    } catch (error) {
      console.error('❌ Error saving model results:', error);
      throw error;
    }
  }

  /**
   * Get model results for an analysis
   */
  public static async getModelResults(analysisId: string): Promise<{
    analysisId: string;
    models: Array<{
      id: string;
      name: string;
      type: string;
      rSquared: number;
      adjustedRSquared: number;
      mse: number;
      mae: number;
      variables: Array<{
        name: string;
        coefficient: number;
        pValue: number;
        vif: number;
        significance: 'high' | 'medium' | 'low';
        expectedSign: string;
        actualSign: string;
        isExpected: boolean;
      }>;
      trainingTime: number;
      createdAt: string;
    }>;
    lastUpdated: string;
  } | null> {
    try {
      const stateKey = `nonmmm_model_results_${analysisId}`;
      const stateData = localStorage.getItem(stateKey);
      return stateData ? JSON.parse(stateData) : null;
    } catch (error) {
      console.error('❌ Error reading model results:', error);
      return null;
    }
  }

  // ========================================
  // CLEANUP AND DESTRUCTION
  // ========================================

  /**
   * Cleanup resources when service is no longer needed
   */
  public destroy(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
    
    this.saveQueue = [];
    this.isProcessingQueue = false;
    
    console.log('🧹 NonMMMStateService destroyed');
  }
}

// Export singleton instance
export const nonMMMStateService = NonMMMStateService.getInstance();
