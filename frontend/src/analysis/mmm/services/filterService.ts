/**
 * ========================================
 * FILTER SERVICE - DATA FILTERING OPERATIONS
 * ========================================
 * 
 * Purpose: Handle data filtering operations with Python backend integration
 * 
 * Description:
 * This service provides comprehensive data filtering capabilities for Excel data
 * using the Python FastAPI backend. It supports applying multiple filters,
 * column selection, and retrieving filter options for UI components.
 * 
 * Key Functionality:
 * - Apply filters to concatenated Excel data
 * - Get unique values for filter dropdowns
 * - Support multiple filter criteria simultaneously
 * - Handle both string and numeric column filtering
 * - Provide filtered data for charts and analysis components
 * 
 * Filter Structure:
 * - filters: Record<string, string[]> - column name to array of values
 * - columns: string[] - specific columns to return (optional)
 * - limit: number - maximum rows to return (default: 1000)
 * 
 * Dependencies:
 * - apiConfig.ts for Python backend URL configuration
 * - Browser Fetch API for HTTP requests
 * - analysis.ts types for data structure definitions
 * 
 * Used by:
 * - Data visualization components requiring filtered data
 * - Filter selection components needing filter options
 * - Analysis steps that process filtered datasets
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

import { getFileApiUrl } from '@/config/apiConfig';

export interface FilterCriteria {
  [columnName: string]: string[];
}

export interface FilteredDataRequest {
  filename: string;
  filters?: FilterCriteria;
  columns?: string[];
  limit?: number;
  brand?: string;
}

export interface FilteredDataResponse {
  success: boolean;
  data?: {
    rows: Record<string, any>[];
    totalRows: number;
    originalRows: number;
    columns: string[];
    appliedFilters: FilterCriteria;
    filterOptions: Record<string, any[]>;
    filename: string;
  };
  error?: string;
}

export class FilterService {
  private static readonly PYTHON_BASE_URL = getFileApiUrl();

  /**
   * Get filtered data from Excel file based on filter criteria
   */
  static async getFilteredData(request: FilteredDataRequest): Promise<FilteredDataResponse> {
    try {
      console.log('🔍 Requesting filtered data:', request);

      let url = `${this.PYTHON_BASE_URL}/api/data/filtered`;
      if (request.brand) {
        url += `?brand=${encodeURIComponent(request.brand)}`;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Filtered data received:', {
        originalRows: result.data?.originalRows,
        filteredRows: result.data?.totalRows,
        appliedFilters: result.data?.appliedFilters
      });

      return result;
    } catch (error) {
      console.error('❌ Filter service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get filter options (unique values) for specific columns
   */
  static async getFilterOptions(filename: string, columns?: string[]): Promise<Record<string, any[]>> {
    try {
      console.log('🎛️ Getting filter options for:', filename, columns);

      const response = await this.getFilteredData({
        filename,
        filters: {}, // No filters to get all unique values
        columns: columns,
        limit: 1 // We only need the filterOptions, not the actual data
      });

      if (response.success && response.data) {
        console.log('✅ Filter options retrieved for', Object.keys(response.data.filterOptions).length, 'columns');
        return response.data.filterOptions;
      } else {
        throw new Error(response.error || 'Failed to get filter options');
      }
    } catch (error) {
      console.error('❌ Error getting filter options:', error);
      return {};
    }
  }

  /**
   * Apply filters based on selected filter columns and values
   */
  static async applySelectedFilters(
    filename: string, 
    selectedFilters: string[], 
    filterValues: Record<string, string[]>,
    columns?: string[],
    limit?: number
  ): Promise<FilteredDataResponse> {
    try {
      // Build filter criteria from selected filters and their values
      const filters: FilterCriteria = {};
      
      selectedFilters.forEach(filterColumn => {
        if (filterValues[filterColumn] && filterValues[filterColumn].length > 0) {
          filters[filterColumn] = filterValues[filterColumn];
        }
      });

      console.log('🎯 Applying selected filters:', filters);

      return await this.getFilteredData({
        filename,
        filters,
        columns,
        limit
      });
    } catch (error) {
      console.error('❌ Error applying selected filters:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to apply filters'
      };
    }
  }

  /**
   * Get data for a specific target variable with applied filters
   */
  static async getTargetVariableData(
    filename: string,
    targetVariable: string,
    selectedFilters: string[],
    filterValues: Record<string, string[]>
  ): Promise<FilteredDataResponse> {
    try {
      console.log('🎯 Getting target variable data:', targetVariable);

      // Always include the target variable in the columns
      const columns = [targetVariable, ...selectedFilters].filter((col, index, arr) => 
        arr.indexOf(col) === index // Remove duplicates
      );

      return await this.applySelectedFilters(
        filename,
        selectedFilters,
        filterValues,
        columns,
        5000 // Higher limit for analysis data
      );
    } catch (error) {
      console.error('❌ Error getting target variable data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get target variable data'
      };
    }
  }

  /**
   * Validate filter values against available options
   */
  static async validateFilters(
    filename: string,
    filters: FilterCriteria
  ): Promise<{ isValid: boolean; invalidFilters: string[]; availableOptions: Record<string, any[]> }> {
    try {
      const filterOptions = await this.getFilterOptions(filename, Object.keys(filters));
      const invalidFilters: string[] = [];

      // Check each filter against available options
      Object.entries(filters).forEach(([column, values]) => {
        const availableValues = filterOptions[column] || [];
        const hasInvalidValues = values.some(value => 
          !availableValues.some(availableValue => 
            String(availableValue).toLowerCase() === String(value).toLowerCase()
          )
        );

        if (hasInvalidValues) {
          invalidFilters.push(column);
        }
      });

      return {
        isValid: invalidFilters.length === 0,
        invalidFilters,
        availableOptions: filterOptions
      };
    } catch (error) {
      console.error('❌ Error validating filters:', error);
      return {
        isValid: false,
        invalidFilters: Object.keys(filters),
        availableOptions: {}
      };
    }
  }
}

// Create singleton instance
export const filterService = new FilterService();
export default filterService;
