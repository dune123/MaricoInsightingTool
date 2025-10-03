/**
 * ========================================
 * USE DATA LOADING HOOK - DATA CONCATENATION MODULE
 * ========================================
 * 
 * Purpose: Custom hook for data loading and state restoration
 * 
 * Description:
 * Encapsulates all data loading logic for the data concatenation step.
 * Handles loading existing analysis data, state restoration, and error management.
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  DataLoadingState, 
  PreviewDataRow, 
  ColumnCategories, 
  BrandMetadata 
} from '../types';
import { 
  loadLatestBrandData, 
  loadConcatenationState,
  validateDataLoadingResult 
} from '../services';
import { 
  categorizeColumns, 
  transformApiDataToPreview,
  extractOriginalFilename 
} from '../utils';

interface UseDataLoadingResult {
  // State
  loadingState: DataLoadingState;
  
  // Data
  concatenatedData: PreviewDataRow[] | null;
  previewColumns: string[];
  columnCategories: ColumnCategories | null;
  concatenatedFile: string | null;
  totalRows: number;
  restoredSheetCount: number | null;
  
  // State restoration data
  restoredTargetVariable: string | null;
  restoredFilters: string[];
  restoredBrandCategories: BrandMetadata['categories'] | null;
  
  // Actions
  loadExistingAnalysisData: (currentAnalysisId: string, selectedBrand: string) => Promise<boolean>;
  clearData: () => void;
}

export function useDataLoading(): UseDataLoadingResult {
  const { toast } = useToast();
  
  // Loading state
  const [loadingState, setLoadingState] = useState<DataLoadingState>({
    isLoading: false,
    isLoaded: false,
    error: null
  });
  
  // Data state
  const [concatenatedData, setConcatenatedData] = useState<PreviewDataRow[] | null>(null);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const [columnCategories, setColumnCategories] = useState<ColumnCategories | null>(null);
  const [concatenatedFile, setConcatenatedFile] = useState<string | null>(null);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [restoredSheetCount, setRestoredSheetCount] = useState<number | null>(null);
  
  // Restored state data
  const [restoredTargetVariable, setRestoredTargetVariable] = useState<string | null>(null);
  const [restoredFilters, setRestoredFilters] = useState<string[]>([]);
  const [restoredBrandCategories, setRestoredBrandCategories] = useState<BrandMetadata['categories'] | null>(null);
  
  /**
   * Load existing analysis data dynamically
   */
  const loadExistingAnalysisData = useCallback(async (
    currentAnalysisId: string, 
    selectedBrand: string
  ): Promise<boolean> => {
    if (!currentAnalysisId || !selectedBrand) {
      return false;
    }
    
    setLoadingState({ isLoading: true, isLoaded: false, error: null });
    
    try {
      console.log('🔄 Loading existing analysis data dynamically for:', selectedBrand);
      
      // Load data from the latest concatenated file
      const dataResult = await loadLatestBrandData(selectedBrand, {}, 100);
      
      if (!dataResult.success || !validateDataLoadingResult(dataResult)) {
        const errorMessage = dataResult.error || 'Failed to load data';
        setLoadingState({ isLoading: false, isLoaded: false, error: errorMessage });
        
        toast({
          title: "Loading Failed",
          description: errorMessage,
          variant: "destructive"
        });
        
        return false;
      }
      
      // Set the loaded data
      const transformedData = transformApiDataToPreview({ rows: dataResult.data });
      setConcatenatedData(transformedData);
      setPreviewColumns(dataResult.columns || []);
      setTotalRows(dataResult.totalRows || 0);
      
      // Find the filename that was used (we need to get this from the service)
      // For now, we'll create a placeholder - this should be returned by the service
      const latestFile = `${selectedBrand}_latest_concatenated.xlsx`;
      setConcatenatedFile(latestFile);
      
      // Create default column categories
      const defaultCategories = categorizeColumns(dataResult.columns || []);
      setColumnCategories(defaultCategories);
      
      // Try to restore saved state
      try {
        const originalFileName = extractOriginalFilename(latestFile);
        const stateResult = await loadConcatenationState(originalFileName);
        
        if (stateResult.success && stateResult.data) {
          const savedState = stateResult.data;
          
          console.log('✅ Found saved state, restoring:', {
            targetVariable: savedState.targetVariable,
            selectedFilters: savedState.selectedFilters,
            brandCategories: savedState.brandMetadata?.categories
          });
          
          // Restore target variable
          if (savedState.targetVariable) {
            setRestoredTargetVariable(savedState.targetVariable);
          }
          
          // Restore filters from concatenation state
          // NOTE: Main analysis.json filterState takes priority in component
          if (savedState.selectedFilters && savedState.selectedFilters.length > 0) {
            setRestoredFilters(savedState.selectedFilters);
            console.log('🔍 Restored filters from concatenation state:', savedState.selectedFilters);
          } else {
            console.log('ℹ️ No filters found in concatenation state');
          }
          
          // Restore brand categorization
          if (savedState.brandMetadata?.categories) {
            setRestoredBrandCategories(savedState.brandMetadata.categories);
          }
          
          // Restore column categories if available
          if (savedState.columnCategories) {
            setColumnCategories(savedState.columnCategories);
          }
          
          // Restore sheet count
          if (savedState.selectedSheets && savedState.selectedSheets.length > 0) {
            setRestoredSheetCount(savedState.selectedSheets.length);
          }
          
          toast({
            title: "Analysis State Restored",
            description: `Loaded data and restored previous settings for ${selectedBrand}`
          });
        } else {
          toast({
            title: "Data Loaded",
            description: `Loaded ${dataResult.totalRows} rows from latest concatenated file`
          });
        }
      } catch (stateError) {
        console.warn('⚠️ Could not restore saved state:', stateError);
        toast({
          title: "Data Loaded",
          description: `Loaded ${dataResult.totalRows} rows (state restoration failed)`
        });
      }
      
      setLoadingState({ isLoading: false, isLoaded: true, error: null });
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Error loading existing analysis:', error);
      
      setLoadingState({ isLoading: false, isLoaded: false, error: errorMessage });
      
      toast({
        title: "Loading Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    }
  }, [toast]);
  
  /**
   * Clear all loaded data
   */
  const clearData = useCallback(() => {
    setConcatenatedData(null);
    setPreviewColumns([]);
    setColumnCategories(null);
    setConcatenatedFile(null);
    setTotalRows(0);
    setRestoredSheetCount(null);
    setRestoredTargetVariable(null);
    setRestoredFilters([]);
    setRestoredBrandCategories(null);
    setLoadingState({ isLoading: false, isLoaded: false, error: null });
  }, []);
  
  return {
    // State
    loadingState,
    
    // Data
    concatenatedData,
    previewColumns,
    columnCategories,
    concatenatedFile,
    totalRows,
    restoredSheetCount,
    
    // Restored state data
    restoredTargetVariable,
    restoredFilters,
    restoredBrandCategories,
    
    // Actions
    loadExistingAnalysisData,
    clearData
  };
}
