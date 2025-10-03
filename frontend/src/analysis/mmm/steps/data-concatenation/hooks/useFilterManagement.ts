/**
 * ========================================
 * USE FILTER MANAGEMENT HOOK - DATA CONCATENATION MODULE
 * ========================================
 * 
 * Purpose: Custom hook for filter selection and management
 * 
 * Description:
 * Encapsulates filter selection logic, state synchronization with context,
 * and state persistence for the data concatenation step.
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  ColumnCategories, 
  PreviewDataRow 
} from '../types';
import { 
  saveConcatenationState,
  createConcatenationState 
} from '../services';

interface UseFilterManagementParams {
  initialFilters?: string[];
  concatenatedData: PreviewDataRow[] | null;
  columnCategories: ColumnCategories | null;
  originalFileName: string;
  concatenatedFileName: string;
  selectedSheets: Array<{ sheetName: string }>;
  selectedTargetVariable: string | null;
  totalRows: number;
  onAnalysisDataUpdate?: (data: any) => void;
  onContextFiltersUpdate?: (filters: string[]) => void;
}

interface UseFilterManagementResult {
  selectedFilters: string[];
  setSelectedFilters: (filters: string[]) => void;
  handleFilterSelection: (columnName: string) => Promise<void>;
  clearFilters: () => void;
  getFilterOptions: () => string[];
}

export function useFilterManagement({
  initialFilters = [],
  concatenatedData,
  columnCategories,
  originalFileName,
  concatenatedFileName,
  selectedSheets,
  selectedTargetVariable,
  totalRows,
  onAnalysisDataUpdate,
  onContextFiltersUpdate
}: UseFilterManagementParams): UseFilterManagementResult {
  const { toast } = useToast();
  
  const [selectedFilters, setSelectedFilters] = useState<string[]>(initialFilters);
  
  // Sync with initial filters when they change
  useEffect(() => {
    if (JSON.stringify(selectedFilters) !== JSON.stringify(initialFilters)) {
      setSelectedFilters(initialFilters);
    }
  }, [initialFilters, selectedFilters]);
  
  /**
   * Handle filter selection/deselection
   */
  const handleFilterSelection = useCallback(async (columnName: string) => {
    const updatedFilters = selectedFilters.includes(columnName)
      ? selectedFilters.filter(filter => filter !== columnName)
      : [...selectedFilters, columnName];
    
    setSelectedFilters(updatedFilters);
    
    console.log('🔍 Filters updated:', {
      added: !selectedFilters.includes(columnName) ? columnName : null,
      removed: selectedFilters.includes(columnName) ? columnName : null,
      totalFilters: updatedFilters.length
    });
    
    // Update analysis context if callback provided
    if (onAnalysisDataUpdate) {
      const updatedData = {
        selectedFilters: updatedFilters,
        filterMetadata: {
          selectedAt: new Date().toISOString(),
          category: 'Others',
          selectionStep: 'data-concatenation'
        }
      };
      
      onAnalysisDataUpdate(updatedData);
    }
    
    // Update context filters if callback provided
    if (onContextFiltersUpdate) {
      onContextFiltersUpdate(updatedFilters);
    }
    
    // Save updated state
    await saveStateWithFilters(updatedFilters);
    
    // Show toast notification
    const action = selectedFilters.includes(columnName) ? 'removed' : 'added';
    toast({
      title: `Filter ${action}`,
      description: `${columnName} ${action} ${action === 'added' ? 'to' : 'from'} selected filters`,
    });
  }, [
    selectedFilters,
    onAnalysisDataUpdate,
    onContextFiltersUpdate,
    originalFileName,
    concatenatedFileName,
    selectedSheets,
    selectedTargetVariable,
    concatenatedData,
    columnCategories,
    totalRows,
    toast
  ]);
  
  /**
   * Clear all selected filters
   */
  const clearFilters = useCallback(async () => {
    setSelectedFilters([]);
    
    console.log('🧹 All filters cleared');
    
    // Update analysis context if callback provided
    if (onAnalysisDataUpdate) {
      const updatedData = {
        selectedFilters: [],
        filterMetadata: {
          selectedAt: new Date().toISOString(),
          category: 'Others',
          selectionStep: 'data-concatenation'
        }
      };
      
      onAnalysisDataUpdate(updatedData);
    }
    
    // Update context filters if callback provided
    if (onContextFiltersUpdate) {
      onContextFiltersUpdate([]);
    }
    
    // Save updated state
    await saveStateWithFilters([]);
    
    toast({
      title: "Filters Cleared",
      description: "All selected filters have been removed",
    });
  }, [
    onAnalysisDataUpdate,
    onContextFiltersUpdate,
    originalFileName,
    concatenatedFileName,
    selectedSheets,
    selectedTargetVariable,
    concatenatedData,
    columnCategories,
    totalRows,
    toast
  ]);
  
  /**
   * Get available filter options (from Others category)
   */
  const getFilterOptions = useCallback(() => {
    return columnCategories?.Others || [];
  }, [columnCategories]);
  
  /**
   * Save state with updated filters
   */
  const saveStateWithFilters = async (updatedFilters: string[]) => {
    try {
      const stateToSave = createConcatenationState({
        originalFileName,
        concatenatedFileName,
        selectedSheets: selectedSheets.map(sheet => sheet.sheetName),
        targetVariable: selectedTargetVariable || undefined,
        selectedFilters: updatedFilters,
        previewData: concatenatedData || [],
        columnCategories,
        totalRows
      });
      
      // CRITICAL FIX: Save filters to BOTH locations for proper persistence
      
      // 1. Save to concatenation state (existing logic)
      await saveConcatenationState(stateToSave);
      console.log('✅ Concatenation state saved with filters');
      
      // 2. CRITICAL FIX: Also save to main analysis.json filterState
      if (originalFileName && originalFileName.trim()) {
        // Extract brand name from original filename for analysis save
        const brandName = originalFileName.toLowerCase().includes('x-men') ? 'x-men' :
                          originalFileName.toLowerCase().includes('clear') ? 'clear-men' :
                          originalFileName.toLowerCase().includes('romano') ? 'romano' :
                          'x-men'; // Default fallback
        
        const filterState = {
          selectedFilters: updatedFilters,
          updatedAt: new Date().toISOString(),
          source: 'data-concatenation-hook'
        };
        
        try {
          const { brandAnalysisService } = await import('@/analysis/mmm/services/brandAnalysisService');
          await brandAnalysisService.updateAnalysis(brandName, {
            filterState: filterState
          });
          console.log('✅ Analysis filterState saved with filters:', updatedFilters);
        } catch (error) {
          console.error('❌ Failed to save filterState to analysis.json:', error);
          // Continue execution - concatenation state was saved successfully
        }
      } else {
        console.warn('⚠️ No originalFileName found, skipping analysis filterState save');
      }
      
    } catch (error) {
      console.error('❌ Failed to save updated state:', error);
    }
  };
  
  return {
    selectedFilters,
    setSelectedFilters,
    handleFilterSelection,
    clearFilters,
    getFilterOptions
  };
}
