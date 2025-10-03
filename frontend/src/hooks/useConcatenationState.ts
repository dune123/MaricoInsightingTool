/**
 * ========================================
 * CONCATENATION STATE MANAGEMENT HOOK
 * ========================================
 * 
 * Purpose: Reusable custom hook for concatenation state persistence and management
 * 
 * Description:
 * This hook encapsulates all state persistence logic for the data concatenation workflow.
 * It provides a clean interface for checking, saving, and restoring concatenation states
 * via the Node.js metadata backend. The hook handles graceful fallbacks, error recovery,
 * and automatic state synchronization with the analysis context.
 * 
 * Key Functionality:
 * - Smart state checking before processing
 * - Automatic state restoration from saved metadata
 * - Real-time state persistence after user interactions
 * - Graceful error handling with non-blocking failures
 * - Integration with AnalysisContext for global state management
 * 
 * State Management Features:
 * - Checks for existing state on hook initialization
 * - Auto-saves complete state after concatenation processing
 * - Auto-saves when target variable is selected
 * - Auto-saves when brand categories are modified
 * - Provides loading states and error handling
 * - Returns helper functions for state operations
 * 
 * Hook Interface:
 * - checkExistingState(): Promise<boolean> - Check and restore existing state
 * - saveProcessingState(): Promise<void> - Save current processing state
 * - saveTargetVariableState(): Promise<void> - Save target variable selection
 * - saveBrandCategoriesState(): Promise<void> - Save brand category changes
 * - isStateRestored: boolean - Whether state was restored from backend
 * - stateError: string | null - Any state operation errors
 * 
 * Integration Points:
 * - AnalysisContext for global state management
 * - MetadataService for Node.js backend communication
 * - Toast notifications for user feedback
 * - Component state synchronization
 * 
 * Dependencies:
 * - React hooks for state management
 * - MetadataService for backend persistence
 * - AnalysisContext for global state access
 * - Toast notifications for user feedback
 * 
 * Used by:
 * - DataConcatenationStep component
 * - Future components requiring state persistence
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Frontend Team
 */

import { useState, useCallback } from 'react';
import { useAnalysis } from '@/context/AnalysisContext';
import { metadataService, ConcatenationState, BrandMetadata } from '@/analysis/mmm/services';
import { useToast } from '@/hooks/use-toast';
import { BrandCategories } from '@/types/analysis';

interface UseConcatenationStateProps {
  originalFileName: string;
  concatenatedFileName: string;
  selectedSheets: Array<{ sheetName: string }>;
  concatenatedData: Record<string, string | number>[] | null;
  previewColumns: string[];
  columnCategories: Record<string, string[]> | null;
  totalRows: number;
  selectedTargetVariable: string | null;
  brandCategories: BrandCategories | null;
}

interface UseConcatenationStateReturn {
  checkExistingState: () => Promise<boolean>;
  saveProcessingState: () => Promise<void>;
  saveTargetVariableState: (targetVariable: string, brandMetadata: BrandMetadata) => Promise<void>;
  saveBrandCategoriesState: (categories: BrandCategories) => Promise<void>;
  isStateRestored: boolean;
  stateError: string | null;
}

export function useConcatenationState(props: UseConcatenationStateProps): UseConcatenationStateReturn {
  const { state, setAnalysisData } = useAnalysis();
  const { analysisData } = state;
  const { toast } = useToast();
  
  const [isStateRestored, setIsStateRestored] = useState<boolean>(false);
  const [stateError, setStateError] = useState<string | null>(null);

  /**
   * Check for existing concatenation state and restore if found
   */
  const checkExistingState = useCallback(async (): Promise<boolean> => {
    if (!props.originalFileName) {
      return false;
    }

    console.log('🔍 Checking for existing concatenation state...');
    setStateError(null);
    
    try {
      const stateResult = await metadataService.getConcatenationState(props.originalFileName);
      
      if (stateResult.success && stateResult.data) {
        console.log('✅ Found existing state, restoring...');
        const savedState = stateResult.data;
        
        // Update analysis context with restored data
        const updatedData = {
          ...analysisData,
          isConcatenated: true,
          concatenationConfig: {
            selectedSheets: savedState.selectedSheets,
            resultingColumns: savedState.previewData ? Object.keys(savedState.previewData[0] || {}) : [],
            customFileName: savedState.concatenatedFileName
          },
          filename: savedState.concatenatedFileName,
          rowCount: savedState.totalRows,
          targetVariable: savedState.targetVariable,
          brandMetadata: savedState.brandMetadata
        };

        setAnalysisData(updatedData);
        setIsStateRestored(true);

        toast({
          title: "Data Restored",
          description: `Restored previous concatenation of ${savedState.selectedSheets.length} sheets`,
        });
        
        return true; // State was restored
      }
    } catch (error) {
      console.error('❌ Error checking existing state:', error);
      setStateError(`Failed to check existing state: ${error.message}`);
    }
    
    return false; // No existing state
  }, [props.originalFileName, analysisData, setAnalysisData, toast]);

  /**
   * Save current processing state after concatenation
   */
  const saveProcessingState = useCallback(async (): Promise<void> => {
    if (!props.originalFileName || !props.concatenatedFileName) {
      return;
    }

    try {
      const stateToSave: ConcatenationState = {
        originalFileName: props.originalFileName,
        concatenatedFileName: props.concatenatedFileName,
        selectedSheets: props.selectedSheets.map(sheet => sheet.sheetName),
        targetVariable: props.selectedTargetVariable,
        brandMetadata: undefined, // Will be set when target variable is selected
        previewData: props.concatenatedData,
        columnCategories: props.columnCategories,
        totalRows: props.totalRows,
        processedAt: new Date().toISOString(),
        status: 'completed'
      };

      await metadataService.saveConcatenationState(stateToSave);
      console.log('✅ Processing state saved to metadata backend');
      setStateError(null);
    } catch (error) {
      console.error('❌ Failed to save processing state (non-critical):', error);
      setStateError(`Failed to save processing state: ${error.message}`);
      // Don't throw - this is non-critical
    }
  }, [
    props.originalFileName,
    props.concatenatedFileName,
    props.selectedSheets,
    props.selectedTargetVariable,
    props.concatenatedData,
    props.columnCategories,
    props.totalRows
  ]);

  /**
   * Save state with target variable selection
   */
  const saveTargetVariableState = useCallback(async (
    targetVariable: string,
    brandMetadata: BrandMetadata
  ): Promise<void> => {
    if (!props.originalFileName) {
      return;
    }

    try {
      const stateToSave: ConcatenationState = {
        originalFileName: props.originalFileName,
        concatenatedFileName: props.concatenatedFileName,
        selectedSheets: props.selectedSheets.map(sheet => sheet.sheetName),
        targetVariable,
        brandMetadata,
        previewData: props.concatenatedData,
        columnCategories: props.columnCategories,
        totalRows: props.totalRows,
        processedAt: new Date().toISOString(),
        status: 'completed'
      };

      await metadataService.saveConcatenationState(stateToSave);
      console.log('✅ Target variable state saved to metadata backend');
      setStateError(null);
    } catch (error) {
      console.error('❌ Failed to save target variable state:', error);
      setStateError(`Failed to save target variable state: ${error.message}`);
    }
  }, [
    props.originalFileName,
    props.concatenatedFileName,
    props.selectedSheets,
    props.concatenatedData,
    props.columnCategories,
    props.totalRows
  ]);

  /**
   * Save state with brand categories changes
   */
  const saveBrandCategoriesState = useCallback(async (categories: BrandCategories): Promise<void> => {
    if (!props.originalFileName) {
      return;
    }

    try {
      // Create complete brand metadata structure
      const completeBrandMetadata = analysisData?.brandMetadata ? {
        ...analysisData.brandMetadata,
        categories,
        extractedAt: new Date().toISOString()
      } : undefined;

      const stateToSave: ConcatenationState = {
        originalFileName: props.originalFileName,
        concatenatedFileName: props.concatenatedFileName,
        selectedSheets: props.selectedSheets.map(sheet => sheet.sheetName),
        targetVariable: props.selectedTargetVariable,
        brandMetadata: completeBrandMetadata,
        previewData: props.concatenatedData,
        columnCategories: props.columnCategories,
        totalRows: props.totalRows,
        processedAt: new Date().toISOString(),
        status: 'completed'
      };

      await metadataService.saveConcatenationState(stateToSave);
      console.log('✅ Brand categories state saved to metadata backend');
      setStateError(null);
    } catch (error) {
      console.error('❌ Failed to save brand categories state:', error);
      setStateError(`Failed to save brand categories state: ${error.message}`);
    }
  }, [
    props.originalFileName,
    props.concatenatedFileName,
    props.selectedSheets,
    props.selectedTargetVariable,
    props.concatenatedData,
    props.columnCategories,
    props.totalRows,
    analysisData
  ]);

  return {
    checkExistingState,
    saveProcessingState,
    saveTargetVariableState,
    saveBrandCategoriesState,
    isStateRestored,
    stateError
  };
}
