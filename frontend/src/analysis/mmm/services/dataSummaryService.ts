/**
 * DataSummaryService
 * 
 * Purpose: Service layer for data summary operations and filtering
 * 
 * Description: This service handles all data summary related API calls including
 * fetching filtered data, filter options, and data statistics from the Python
 * backend. It provides a clean interface for the DataSummaryStep component to
 * interact with the backend data filtering endpoints.
 * 
 * Key Functions:
 * - getFilteredData(): Fetches filtered data based on selected filters
 * - getFilterOptions(): Retrieves available filter options for specified columns
 * - getDataSummary(): Gets comprehensive data summary statistics
 * - validateFilters(): Validates filter requests without execution
 * - getColumnStatistics(): Retrieves detailed statistics for specific columns
 * 
 * State Variables:
 * - Uses synchronous API URL configuration for reduced async calls
 * - Handles fallback data when API endpoints fail
 * - Provides default filter options for common columns
 * 
 * API Endpoints:
 * - POST /api/data/filtered: Get filtered data with applied filters
 * - GET /api/data/summary/{filename}: Get comprehensive data summary
 * - GET /api/data/column-stats/{filename}/{column}: Get column statistics
 * - POST /api/data/validate: Validate filter configuration
 * 
 * Data Flow:
 * 1. Service receives filter parameters and column specifications
 * 2. Makes API calls to Python backend with proper error handling
 * 3. Processes responses and validates data structure
 * 4. Returns formatted data or fallback options on failure
 * 5. Provides comprehensive error messages for debugging
 * 
 * Dependencies:
 * - Backend Python FastAPI endpoints for data operations
 * - ApiConfig for backend URL configuration
 * - TypeScript interfaces for type safety and validation
 * - Error handling with fallback mechanisms
 */

import { getFileApiUrl, getFileApiUrlSync } from '@/config/apiConfig';

// Type for data row values - matches the structure used in the application
export type DataRowValue = string | number | null;

// Type for a data row with dynamic column names
export interface DataRow {
  [columnName: string]: DataRowValue;
}

// Type for filter values
export type FilterValue = string | number;

export interface FilteredDataResponse {
  success: boolean;
  data: {
    rows: DataRow[];
    totalRows: number;
    originalRows: number;
    columns: string[];
    appliedFilters: Record<string, FilterValue[]>;
    filterOptions: Record<string, FilterValue[]>;
    filename: string;
  };
  message?: string;
  error?: string;
}

export interface DataSummaryResponse {
  success: boolean;
  data: {
    total_rows: number;
    total_columns: number;
    columns: string[];
    data_types: Record<string, string>;
    null_counts: Record<string, number>;
    memory_usage_mb: number;
  };
  message?: string;
  error?: string;
}

export interface FilterOptionsResponse {
  success: boolean;
  data: Record<string, FilterValue[]>;
  message?: string;
  error?: string;
}

// Type for column statistics response
export interface ColumnStatisticsResponse {
  success: boolean;
  data: {
    column: string;
    unique_values: number;
    null_count: number;
    data_type: string;
    sample_values: FilterValue[];
    value_counts?: Record<string, number>;
  };
  message?: string;
  error?: string;
}

export class DataSummaryService {
  /**
   * Get filtered data based on selected filters
   */
  static async getFilteredData(
    filename: string,
    filters: Record<string, string>,
    columns?: string[],
    limit: number = 1000,
    brand?: string
  ): Promise<FilteredDataResponse> {
    try {
      const apiUrl = getFileApiUrlSync(); // Use synchronous version to reduce async calls
      const response = await fetch(`${apiUrl.replace('/api/files', '/api/data')}/filtered${brand ? `?brand=${encodeURIComponent(brand)}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename,
          filters: Object.fromEntries(
            Object.entries(filters).map(([key, value]) => [key, [value]])
          ),
          columns,
          limit
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to fetch filtered data:', error);
      throw new Error(`Failed to fetch filtered data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available filter options for specified columns
   */
  static async getFilterOptions(
    filename: string,
    columns: string[],
    brand?: string
  ): Promise<Record<string, string[]>> {
    try {
      const apiUrl = getFileApiUrlSync(); // Use synchronous version to reduce async calls
      const response = await fetch(`${apiUrl.replace('/api/files', '/api/data')}/filtered${brand ? `?brand=${encodeURIComponent(brand)}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename,
          filters: {},
          columns,
          limit: 1 // We only need the filter options, not the actual data
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data?.filterOptions) {
        return result.data.filterOptions;
      }
      
      throw new Error('Invalid response format from filter options API');
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
      
      // Return default filter options as fallback
      const defaultOptions: Record<string, string[]> = {
        PackSize: ['Sachet', 'Bottle', 'Can', 'Pouch'],
        Region: ['CH', 'US', 'UK', 'DE', 'FR'],
        Channel: ['GT', 'MT', 'Online', 'Convenience']
      };
      
      // Only return options for requested columns
      const fallbackOptions: Record<string, string[]> = {};
      columns.forEach(col => {
        if (defaultOptions[col]) {
          fallbackOptions[col] = defaultOptions[col];
        }
      });
      
      return fallbackOptions;
    }
  }

  /**
   * Get data summary statistics
   */
  static async getDataSummary(filename: string): Promise<DataSummaryResponse> {
    try {
      const apiUrl = getFileApiUrlSync(); // Use synchronous version to reduce async calls
      const response = await fetch(`${apiUrl.replace('/api/files', '/api/data')}/summary/${encodeURIComponent(filename)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to fetch data summary:', error);
      throw new Error(`Failed to fetch data summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate filter request without executing it
   */
  static async validateFilters(
    filename: string,
    filters: Record<string, string>
  ): Promise<boolean> {
    try {
      const apiUrl = getFileApiUrlSync(); // Use synchronous version to reduce async calls
      const response = await fetch(`${apiUrl.replace('/api/files', '/api/data')}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename,
          filters: Object.fromEntries(
            Object.entries(filters).map(([key, value]) => [key, [value]])
          ),
          columns: [],
          limit: 1
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Failed to validate filters:', error);
      return false;
    }
  }

  /**
   * Get column statistics for a specific column
   */
  static async getColumnStatistics(
    filename: string,
    column: string
  ): Promise<ColumnStatisticsResponse> {
    try {
      const apiUrl = getFileApiUrlSync(); // Use synchronous version to reduce async calls
      const response = await fetch(`${apiUrl.replace('/api/files', '/api/data')}/column-stats/${encodeURIComponent(filename)}/${encodeURIComponent(column)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to fetch column statistics:', error);
      throw new Error(`Failed to fetch column statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Create singleton instance
export const dataSummaryService = new DataSummaryService();
export default dataSummaryService;
