/**
 * ========================================
 * USE FILTERED DATA HOOK
 * ========================================
 * 
 * Purpose: Custom hook for managing filtered data state and operations
 * 
 * Description:
 * This hook provides a comprehensive interface for managing filtered data
 * throughout the application. It handles filter state, data fetching,
 * and provides utilities for working with filtered datasets.
 * 
 * Key Functionality:
 * - Manage filter state and values
 * - Fetch filtered data from backend
 * - Provide loading and error states
 * - Cache filter options for performance
 * - Sync with AnalysisContext selected filters
 * 
 * Dependencies:
 * - FilterService for backend operations
 * - AnalysisContext for global state management
 * - React hooks for state management
 * 
 * Used by:
 * - Components that need filtered data (charts, tables, analysis)
 * - Filter selection components
 * - Data visualization components
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAnalysis } from '@/context/AnalysisContext';
import { filterService, FilterCriteria, FilteredDataResponse } from '@/analysis/mmm/services';

export interface FilterValue {
  column: string;
  values: string[];
}

export interface UseFilteredDataOptions {
  filename?: string;
  autoFetch?: boolean;
  limit?: number;
  columns?: string[];
}

export interface UseFilteredDataReturn {
  // Data state
  data: Record<string, any>[];
  originalRows: number;
  totalRows: number;
  columns: string[];
  
  // Filter state
  filterValues: Record<string, string[]>;
  filterOptions: Record<string, any[]>;
  appliedFilters: FilterCriteria;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setFilterValue: (column: string, values: string[]) => void;
  clearFilter: (column: string) => void;
  clearAllFilters: () => void;
  applyFilters: () => Promise<void>;
  refreshData: () => Promise<void>;
  
  // Utilities
  getUniqueValues: (column: string) => any[];
  isFilterActive: (column: string) => boolean;
  getFilteredValue: (column: string, defaultValue?: any) => any;
}

export function useFilteredData(options: UseFilteredDataOptions = {}): UseFilteredDataReturn {
  const { state } = useAnalysis();
  const { analysisData } = state;
  
  // Default filename from analysisData or concatenated file
  const defaultFilename = useMemo(() => {
    if (options.filename) return options.filename;
    if (analysisData?.concatenationConfig?.customFileName) {
      return analysisData.concatenationConfig.customFileName;
    }
    if (analysisData?.filename) {
      return analysisData.filename.replace(/\.[^/.]+$/, "_concatenated.xlsx");
    }
    return null;
  }, [options.filename, analysisData]);

  // State
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [originalRows, setOriginalRows] = useState<number>(0);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [columns, setColumns] = useState<string[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({});
  const [filterOptions, setFilterOptions] = useState<Record<string, any[]>>({});
  const [appliedFilters, setAppliedFilters] = useState<FilterCriteria>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize filter values from context selected filters
  useEffect(() => {
    if (state.selectedFilters && state.selectedFilters.length > 0) {
      const initialFilterValues: Record<string, string[]> = {};
      state.selectedFilters.forEach(filter => {
        if (!filterValues[filter]) {
          initialFilterValues[filter] = [];
        }
      });
      
      if (Object.keys(initialFilterValues).length > 0) {
        setFilterValues(prev => ({ ...prev, ...initialFilterValues }));
      }
    }
  }, [state.selectedFilters]);

  // Fetch filtered data
  const fetchFilteredData = useCallback(async (filters?: FilterCriteria) => {
    if (!defaultFilename) {
      setError('No filename available for filtering');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await filterService.getFilteredData({
        filename: defaultFilename,
        filters: filters || {},
        columns: options.columns,
        limit: options.limit || 1000
      });

      if (response.success && response.data) {
        setData(response.data.rows);
        setOriginalRows(response.data.originalRows);
        setTotalRows(response.data.totalRows);
        setColumns(response.data.columns);
        setAppliedFilters(response.data.appliedFilters);
        setFilterOptions(prev => ({ ...prev, ...response.data!.filterOptions }));
      } else {
        throw new Error(response.error || 'Failed to fetch filtered data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ Error fetching filtered data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [defaultFilename, options.columns, options.limit]);

  // Fetch filter options only
  const fetchFilterOptions = useCallback(async () => {
    if (!defaultFilename) return;

    try {
      const options = await filterService.getFilterOptions(
        defaultFilename,
        state.selectedFilters.length > 0 ? state.selectedFilters : undefined
      );
      setFilterOptions(prev => ({ ...prev, ...options }));
    } catch (err) {
      console.error('❌ Error fetching filter options:', err);
    }
  }, [defaultFilename, state.selectedFilters]);

  // Auto-fetch data on mount if enabled
  useEffect(() => {
    if (options.autoFetch !== false && defaultFilename) {
      fetchFilteredData();
    }
  }, [defaultFilename, options.autoFetch, fetchFilteredData]);

  // Fetch filter options when selected filters change
  useEffect(() => {
    if (state.selectedFilters.length > 0) {
      fetchFilterOptions();
    }
  }, [state.selectedFilters, fetchFilterOptions]);

  // Actions
  const setFilterValue = useCallback((column: string, values: string[]) => {
    setFilterValues(prev => ({
      ...prev,
      [column]: values
    }));
  }, []);

  const clearFilter = useCallback((column: string) => {
    setFilterValues(prev => {
      const newValues = { ...prev };
      delete newValues[column];
      return newValues;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilterValues({});
  }, []);

  const applyFilters = useCallback(async () => {
    // Build filter criteria from current filter values and selected filters
    const filters: FilterCriteria = {};
    
    state.selectedFilters.forEach(filterColumn => {
      if (filterValues[filterColumn] && filterValues[filterColumn].length > 0) {
        filters[filterColumn] = filterValues[filterColumn];
      }
    });

    await fetchFilteredData(filters);
  }, [state.selectedFilters, filterValues, fetchFilteredData]);

  const refreshData = useCallback(async () => {
    await fetchFilteredData(appliedFilters);
  }, [fetchFilteredData, appliedFilters]);

  // Utilities
  const getUniqueValues = useCallback((column: string): any[] => {
    return filterOptions[column] || [];
  }, [filterOptions]);

  const isFilterActive = useCallback((column: string): boolean => {
    return filterValues[column] && filterValues[column].length > 0;
  }, [filterValues]);

  const getFilteredValue = useCallback((column: string, defaultValue: any = null): any => {
    if (!data.length) return defaultValue;
    
    // If filters are applied, return filtered data
    if (Object.keys(appliedFilters).length > 0) {
      return data.map(row => row[column]).filter(val => val != null);
    }
    
    return defaultValue;
  }, [data, appliedFilters]);

  return {
    // Data state
    data,
    originalRows,
    totalRows,
    columns,
    
    // Filter state
    filterValues,
    filterOptions,
    appliedFilters,
    
    // Loading and error states
    isLoading,
    error,
    
    // Actions
    setFilterValue,
    clearFilter,
    clearAllFilters,
    applyFilters,
    refreshData,
    
    // Utilities
    getUniqueValues,
    isFilterActive,
    getFilteredValue
  };
}
