/**
 * ========================================
 * RPI ADDITION SERVICE - FRONTEND
 * ========================================
 * 
 * Purpose: Frontend service for RPI addition functionality
 * 
 * Description:
 * This service handles the "Add RPIs" step that comes after data concatenation.
 * It provides frontend functionality to add relevant RPI columns from the RPI sheet
 * to the main concatenated data based on pack size relationships and matching criteria.
 * 
 * Key Functionality:
 * - Process RPI addition for concatenated files
 * - Analyze pack size relationships for RPI matching
 * - Preview what RPI columns will be added
 * - Monitor RPI addition progress
 * - Handle RPI addition results and enhanced files
 * 
 * Business Logic:
 * - For each row in main data: check month, packsize, region, channel
 * - From RPI sheet: find columns with same size, 1 size smaller, 1 size larger
 * - Add relevant RPI values to main sheet for matching rows
 * 
 * Used by:
 * - Add RPIs step component
 * - RPI addition workflow
 * - Pack size analysis components
 * 
 * Dependencies:
 * - apiClient for backend communication
 * - Pack size analysis types
 * - Brand analysis context
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 */

import { API_CONFIG } from '@/utils/apiClient';

// Type definitions for RPI addition
export interface RPIColumnInfo {
  original_rpi_column: string;
  new_column_name: string;
  pack_size: string;
  pack_size_rank: number;
  matches_found: number;
  total_rows: number;
}

export interface RPIAdditionResponse {
  success: boolean;
  message: string;
  main_rows_processed: number;
  rpi_columns_added: number;
  rpi_columns_info: RPIColumnInfo[];
  enhanced_file_path: string;
  pack_size_analysis: {
    main_packsize_column: string;
    region_column: string;
    month_column: string;
    channel_column: string;
    main_pack_sizes: string[];
    rpi_columns_info: Array<{
      column_name: string;
      pack_size: string;
      rank: number;
      category: string;
    }>;
    total_rpi_columns: number;
  };
}

export interface PackSizeCoverageAnalysis {
  total_main_pack_sizes: number;
  total_rpi_columns: number;
  pack_size_coverage: Record<string, {
    relevant_rpi_columns: number;
    rpi_details: Array<{
      column_name: string;
      pack_size: string;
      rank: number;
      category: string;
    }>;
  }>;
  missing_coverage: string[];
  excess_rpi_columns: Array<{
    column_name: string;
    pack_size: string;
    rank: number;
    category: string;
  }>;
}

export interface RPIAnalysisResponse {
  success: boolean;
  message: string;
  file_path: string;
  pack_size_analysis: {
    main_packsize_column: string;
    region_column: string;
    month_column: string;
    channel_column: string;
    main_pack_sizes: string[];
    rpi_columns_info: Array<{
      column_name: string;
      pack_size: string;
      rank: number;
      category: string;
    }>;
    total_rpi_columns: number;
  };
  coverage_analysis: PackSizeCoverageAnalysis;
}

export interface RPIPreviewResponse {
  success: boolean;
  message: string;
  file_path: string;
  main_sheet_rows: number;
  rpi_sheet_rows: number;
  main_pack_sizes: string[];
  available_rpi_columns: number;
  preview_columns: Array<{
    new_column_name: string;
    original_rpi_column: string;
    pack_size: string;
    pack_size_rank: number;
    relevant_for_main_size: string;
  }>;
  estimated_columns_to_add: number;
}

/**
 * RPI Addition Service
 * Provides comprehensive RPI addition functionality for the frontend
 */
export class RPIAdditionService {
  
  /**
   * Add RPI columns to main concatenated data
   * @param brandName - Name of the brand for analysis
   * @param analysisId - Analysis ID for file location
   * @param mainSheetName - Name of main data sheet
   * @param rpiSheetName - Name of RPI data sheet
   * @returns Promise resolving to RPI addition results
   */
  static async addRPIsToData(
    brandName: string,
    analysisId: string,
    mainSheetName: string = "Concatenated_Data_Enhanced",
    rpiSheetName: string = "RPI"
  ): Promise<RPIAdditionResponse> {
    try {
      // Starting RPI addition process
      
      const params = new URLSearchParams();
      params.append('brand_name', brandName);
      params.append('analysis_id', analysisId);
      params.append('main_sheet_name', mainSheetName);
      params.append('rpi_sheet_name', rpiSheetName);
      
      const response = await fetch(`${API_CONFIG.BASE_URL.replace('/api', '')}/api/rpi/add-rpis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      // RPI addition completed successfully
      return result;
    } catch (error) {
      console.error('❌ Error adding RPIs to data:', error);
      throw new Error(`Failed to add RPIs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze pack sizes for RPI addition planning
   * @param brandName - Name of the brand for analysis
   * @param analysisId - Analysis ID for file location
   * @param mainSheetName - Name of main data sheet
   * @param rpiSheetName - Name of RPI data sheet
   * @returns Promise resolving to pack size analysis results
   */
  static async analyzePackSizesForRPI(
    brandName: string,
    analysisId: string,
    mainSheetName: string = "Concatenated_Data_Enhanced",
    rpiSheetName: string = "RPI"
  ): Promise<RPIAnalysisResponse> {
    try {
      // Analyzing pack sizes for RPI addition
      
      const params = new URLSearchParams();
      params.append('brand_name', brandName);
      params.append('analysis_id', analysisId);
      params.append('main_sheet_name', mainSheetName);
      params.append('rpi_sheet_name', rpiSheetName);
      
      const response = await fetch(`${API_CONFIG.BASE_URL.replace('/api', '')}/api/rpi/analyze-pack-sizes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      // ✅ Pack size analysis completed (log removed to prevent duplicates in AddRPIsStep)
      return result;
    } catch (error) {
      console.error('❌ Error analyzing pack sizes:', error);
      throw new Error(`Failed to analyze pack sizes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Preview RPI columns that would be added
   * @param brandName - Name of the brand for analysis
   * @param analysisId - Analysis ID for file location
   * @param mainSheetName - Name of main data sheet
   * @param rpiSheetName - Name of RPI data sheet
   * @returns Promise resolving to RPI preview results
   */
  static async previewRPIColumns(
    brandName: string,
    analysisId: string,
    mainSheetName: string = "Concatenated_Data_Enhanced",
    rpiSheetName: string = "RPI"
  ): Promise<RPIPreviewResponse> {
    try {
      console.log('👀 Previewing RPI columns...', { brandName, analysisId });
      
      const params = new URLSearchParams({
        main_sheet_name: mainSheetName,
        rpi_sheet_name: rpiSheetName,
      });
      
      const response = await fetch(`${API_CONFIG.BASE_URL.replace('/api', '')}/api/rpi/preview-rpi-columns/${encodeURIComponent(brandName)}/${encodeURIComponent(analysisId)}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to preview RPI columns');
      }
      
      // RPI columns preview generated
      return result;
    } catch (error) {
      console.error('❌ Error previewing RPI columns:', error);
      throw new Error(`Failed to preview RPI columns: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Format pack size for display
   * @param packSize - Raw pack size string
   * @returns Formatted pack size string
   */
  static formatPackSize(packSize: string): string {
    if (!packSize) return 'Unknown';
    
    return packSize
      .replace(/ml/gi, 'ML')
      .replace(/l$/gi, 'L')
      .replace(/sachet/gi, 'Sachet')
      .replace(/pouch/gi, 'Pouch')
      .trim();
  }

  /**
   * Get pack size category color for UI display
   * @param rank - Pack size rank (1-5)
   * @returns CSS color code
   */
  static getPackSizeRankColor(rank: number): string {
    const colors: Record<number, string> = {
      1: '#ef4444',      // Red - Sachet
      2: '#f97316',      // Orange - Small
      3: '#eab308',      // Yellow - Medium
      4: '#22c55e',      // Green - Large
      5: '#3b82f6',      // Blue - Extra Large
    };
    
    return colors[rank] || '#6b7280'; // Gray for unknown
  }

  /**
   * Get pack size category icon for UI display
   * @param rank - Pack size rank (1-5)
   * @returns Icon emoji or Unicode character
   */
  static getPackSizeRankIcon(rank: number): string {
    const icons: Record<number, string> = {
      1: '📦',  // Sachet
      2: '🍼',  // Small
      3: '🥤',  // Medium
      4: '🧴',  // Large
      5: '🪣',  // Extra Large
    };
    
    return icons[rank] || '❓'; // Question mark for unknown
  }

  /**
   * Calculate RPI addition success rate
   * @param rpiColumns - Array of RPI column info
   * @returns Success rate as percentage
   */
  static calculateSuccessRate(rpiColumns: RPIColumnInfo[]): number {
    if (rpiColumns.length === 0) return 0;
    
    const totalMatches = rpiColumns.reduce((sum, col) => sum + col.matches_found, 0);
    const totalPossible = rpiColumns.reduce((sum, col) => sum + col.total_rows, 0);
    
    return totalPossible > 0 ? (totalMatches / totalPossible) * 100 : 0;
  }

  /**
   * Group RPI columns by pack size for organized display
   * @param rpiColumns - Array of RPI column info
   * @returns Grouped RPI columns by pack size
   */
  static groupRPIColumnsByPackSize(rpiColumns: RPIColumnInfo[]): Record<string, RPIColumnInfo[]> {
    return rpiColumns.reduce((groups, column) => {
      const packSize = column.pack_size;
      if (!groups[packSize]) {
        groups[packSize] = [];
      }
      groups[packSize].push(column);
      return groups;
    }, {} as Record<string, RPIColumnInfo[]>);
  }

  /**
   * Download enhanced file with RPI columns added
   * @param brandName - Name of the brand for analysis
   * @param analysisId - Analysis ID for file location
   * @returns Promise resolving when download starts
   */
  static async downloadEnhancedFile(
    brandName: string,
    analysisId: string
  ): Promise<void> {
    try {
      console.log('📥 Starting enhanced file download...', { brandName, analysisId });
      
      const response = await fetch(`${API_CONFIG.BASE_URL.replace('/api', '')}/api/rpi/download-enhanced/${encodeURIComponent(brandName)}/${encodeURIComponent(analysisId)}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Get the filename from the response headers (server returns actual saved filename)
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `${brandName}_${analysisId}_with_rpis.xlsx`; // Use correct pattern as fallback
      
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename="?([^"]+)"?/);
        if (matches && matches[1]) {
          filename = matches[1]; // Use server-provided filename (e.g., <original>_with_rpis.xlsx)
        }
      }
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Enhanced file download started');
    } catch (error) {
      console.error('❌ Error downloading enhanced file:', error);
      throw new Error(`Failed to download enhanced file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate summary statistics for RPI addition
   * @param response - RPI addition response
   * @returns Summary statistics object
   */
  static generateSummaryStats(response: RPIAdditionResponse): {
    totalRows: number;
    columnsAdded: number;
    successRate: number;
    packSizesCovered: number;
    avgMatchesPerColumn: number;
  } {
    const successRate = this.calculateSuccessRate(response.rpi_columns_info);
    const packSizesCovered = new Set(response.rpi_columns_info.map(col => col.pack_size)).size;
    const avgMatches = response.rpi_columns_info.length > 0 
      ? response.rpi_columns_info.reduce((sum, col) => sum + col.matches_found, 0) / response.rpi_columns_info.length
      : 0;

    return {
      totalRows: response.main_rows_processed,
      columnsAdded: response.rpi_columns_added,
      successRate: Math.round(successRate * 100) / 100,
      packSizesCovered,
      avgMatchesPerColumn: Math.round(avgMatches * 100) / 100,
    };
  }
}

// Create singleton instance
export const rpiAdditionService = new RPIAdditionService();
export default rpiAdditionService;
