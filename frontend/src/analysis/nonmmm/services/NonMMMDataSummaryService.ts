/**
 * ========================================
 * NON-MMM DATA SUMMARY SERVICE
 * ========================================
 * 
 * Purpose: Handle data summary and statistics for Non-MMM analysis workflows
 * 
 * Description:
 * This service provides comprehensive data summary capabilities specifically for
 * Non-MMM analysis, including statistical summaries, data type detection,
 * and column analysis. It's designed to work with the Python FastAPI backend
 * and provides detailed insights into the uploaded data.
 * 
 * Key Functionality:
 * - Generate comprehensive data summaries
 * - Provide column statistics and data types
 * - Handle data distribution analysis
 * - Support column format modifications
 * - Generate histogram data for visualization
 * 
 * Non-MMM Specific Features:
 * - Focus on single dataset analysis
 * - Simplified statistical calculations
 * - Direct column type modification
 * - Streamlined data quality assessment
 * 
 * API Endpoints:
 * - GET /api/data/summary/{filename}: Data summary
 * - GET /api/data/column-stats/{filename}/{column}: Column statistics
 * - POST /api/data/modify-column-type: Column type modification
 * - GET /api/data/distribution/{filename}/{column}: Data distribution
 * 
 * Dependencies:
 * - Python FastAPI backend
 * - ApiConfig for backend URL configuration
 * - Non-MMM type definitions
 * 
 * Used by:
 * - Non-MMM data summary components
 * - Data quality assessment steps
 * - Column modification workflows
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 */

import { getFileApiUrl } from '@/config/apiConfig';

export interface NonMMMDataRow {
  [columnName: string]: string | number | null;
}

export interface NonMMMColumnStatistics {
  column: string;
  dataType: string;
  uniqueValues: number;
  nullCount: number;
  mean?: number;
  median?: number;
  stdDev?: number;
  min?: number;
  max?: number;
  sampleValues: (string | number)[];
}

export interface NonMMMDataSummary {
  filename: string;
  totalRows: number;
  totalColumns: number;
  columns: string[];
  dataTypes: Record<string, string>;
  nullCounts: Record<string, number>;
  memoryUsageMB: number;
  columnStatistics: NonMMMColumnStatistics[];
}

export interface NonMMMDataSummaryResponse {
  success: boolean;
  data?: NonMMMDataSummary;
  error?: string;
}

export interface NonMMMColumnStatsResponse {
  success: boolean;
  data?: NonMMMColumnStatistics;
  error?: string;
}

export interface NonMMMColumnTypeModification {
  filename: string;
  column: string;
  newType: 'date' | 'numeric' | 'percentage' | 'character';
  formatOptions?: Record<string, unknown>;
}

export interface NonMMMColumnModificationResponse {
  success: boolean;
  data?: {
    modifiedColumn: string;
    newType: string;
    sampleValues: (string | number)[];
  };
  error?: string;
}

export interface NonMMMHistogramData {
  column: string;
  bins: number[];
  frequencies: number[];
  binEdges: number[];
  dataType: string;
}

export interface NonMMMHistogramResponse {
  success: boolean;
  data?: NonMMMHistogramData[];
  error?: string;
}

export class NonMMMDataSummaryService {
  /**
   * Get comprehensive data summary for uploaded file
   */
  static async getDataSummary(filename: string): Promise<NonMMMDataSummaryResponse> {
    try {
      const apiBaseUrl = await getFileApiUrl();
      const encodedFilename = encodeURIComponent(filename);
      const url = `${apiBaseUrl}/api/data/summary/${encodedFilename}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get data summary: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error fetching data summary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch data summary'
      };
    }
  }

  /**
   * Get detailed statistics for a specific column
   */
  static async getColumnStatistics(
    filename: string, 
    column: string
  ): Promise<NonMMMColumnStatsResponse> {
    try {
      const apiBaseUrl = await getFileApiUrl();
      const encodedFilename = encodeURIComponent(filename);
      const encodedColumn = encodeURIComponent(column);
      const url = `${apiBaseUrl}/api/data/column-stats/${encodedFilename}/${encodedColumn}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get column statistics: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error fetching column statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch column statistics'
      };
    }
  }

  /**
   * Modify column data type
   */
  static async modifyColumnType(
    modification: NonMMMColumnTypeModification
  ): Promise<NonMMMColumnModificationResponse> {
    try {
      const apiBaseUrl = await getFileApiUrl();
      const url = `${apiBaseUrl}/api/data/modify-column-type`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(modification)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to modify column type: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error modifying column type:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to modify column type'
      };
    }
  }

  /**
   * Get histogram data for all columns
   */
  static async getHistogramData(filename: string): Promise<NonMMMHistogramResponse> {
    try {
      const apiBaseUrl = await getFileApiUrl();
      const encodedFilename = encodeURIComponent(filename);
      const url = `${apiBaseUrl}/api/data/distribution/${encodedFilename}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get histogram data: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error fetching histogram data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch histogram data'
      };
    }
  }

  /**
   * Generate mock histogram data for development
   */
  static generateMockHistogramData(columns: string[]): NonMMMHistogramData[] {
    return columns.map(column => {
      const bins = Array.from({ length: 10 }, (_, i) => i * 10);
      const frequencies = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100));
      const binEdges = Array.from({ length: 11 }, (_, i) => i * 10);
      
      return {
        column,
        bins,
        frequencies,
        binEdges,
        dataType: 'numeric'
      };
    });
  }
}
