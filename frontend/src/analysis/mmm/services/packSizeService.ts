/**
 * ========================================
 * PACK SIZE SERVICE - RANKING AND ANALYSIS
 * ========================================
 * 
 * Purpose: Pack size intelligence and ranking analysis for media mix modeling
 * 
 * Description:
 * This service provides comprehensive pack size analysis functionality including
 * ranking, comparison, and RPI (Relative Price Index) analysis. It integrates
 * with the backend to provide pack size intelligence that helps optimize
 * marketing strategies based on package size performance.
 * 
 * Key Functionality:
 * - Pack size ranking and performance analysis
 * - RPI (Relative Price Index) calculation and comparison
 * - Pack size category analysis and classification
 * - Brand-specific pack size intelligence
 * - Integration with backend analytics for real-time data
 * - Export capabilities for pack size reports
 * 
 * Analysis Features:
 * - Rank pack sizes by performance metrics
 * - Compare pack size efficiency across brands
 * - Calculate relative pricing indices
 * - Identify optimal pack size strategies
 * - Provide actionable insights for product management
 * 
 * Data Sources:
 * - Backend pack size analytics API
 * - Real-time performance metrics
 * - Historical pack size data
 * - Competitor pack size intelligence
 * 
 * Used by:
 * - Pack size analysis components
 * - Marketing strategy optimization
 * - Product portfolio analysis
 * - Pricing strategy development
 * 
 * Dependencies:
 * - apiClient for backend communication
 * - Pack size type definitions
 * - Analytics data structures
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 */

import { httpClient } from '@/utils/apiClient';

// Type definitions for pack size analysis
export interface PackSizeDetail {
  column_name: string;
  pack_size: string;
  rank: number;
  category: string;
  is_smallest: boolean;
  is_largest: boolean;
}

export interface PackSizeRankingResponse {
  total_columns: number;
  columns_with_pack_size: number;
  pack_size_details: PackSizeDetail[];
  unique_pack_sizes: string[];
  size_distribution: Record<string, number>;
  ranking_order: string;
  error?: string;
}

export interface PackSizeComparisonRequest {
  size1: string;
  size2: string;
}

export interface PackSizeComparisonResponse {
  size1: string;
  size2: string;
  size1_rank: number;
  size2_rank: number;
  comparison_result: number;
  relationship: string;
  rpi_comparison_priority: number;
  priority_description: string;
  should_compare_in_rpi: boolean;
}

export interface PackSizeExtractionResponse {
  column_name: string;
  extracted_pack_size: string | null;
  category: string;
  rank: number;
  is_smallest: boolean;
  is_largest: boolean;
  success: boolean;
  message?: string;
}

export interface PackSizeRankResponse {
  pack_size: string;
  rank: number;
  category: string;
  is_smallest: boolean;
  is_largest: boolean;
  description: string;
}

export interface PackSizeSortResponse {
  original_sizes: string[];
  sorted_sizes: string[];
  reverse_order: boolean;
  size_details: Array<{
    pack_size: string;
    rank: number;
    category: string;
  }>;
  sorting_order: string;
}

export interface PackSizeCategoriesResponse {
  categories: Record<string, {
    rank: number;
    description: string;
    examples: string[];
  }>;
  ranking_logic: string;
  usage: string;
}

/**
 * Pack Size Analysis Service
 * Provides comprehensive pack size ranking and comparison functionality
 */
export class PackSizeService {
  
  /**
   * Analyze pack sizes from a list of column names
   * @param columnNames - Array of column names to analyze
   * @param includeInsights - Whether to include business insights
   * @returns Promise resolving to pack size analysis results
   */
  static async analyzePackSizes(
    columnNames: string[], 
    includeInsights: boolean = true
  ): Promise<PackSizeRankingResponse> {
    try {
      const response = await httpClient.post('/api/packsize/analyze', {
        column_names: columnNames,
        include_insights: includeInsights
      });
      
      return response.data;
    } catch (error) {
      console.error('Error analyzing pack sizes:', error);
      throw new Error(`Failed to analyze pack sizes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract pack size from a single column name
   * @param columnName - Column name to extract pack size from
   * @returns Promise resolving to pack size extraction results
   */
  static async extractPackSize(columnName: string): Promise<PackSizeExtractionResponse> {
    try {
      const encodedColumnName = encodeURIComponent(columnName);
      const response = await httpClient.get(`/api/packsize/extract/${encodedColumnName}`);
      
      return response.data;
    } catch (error) {
      console.error('Error extracting pack size:', error);
      throw new Error(`Failed to extract pack size: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Compare two pack sizes
   * @param size1 - First pack size to compare
   * @param size2 - Second pack size to compare
   * @returns Promise resolving to pack size comparison results
   */
  static async comparePackSizes(size1: string, size2: string): Promise<PackSizeComparisonResponse> {
    try {
      const response = await httpClient.post('/api/packsize/compare', {
        size1,
        size2
      });
      
      return response.data;
    } catch (error) {
      console.error('Error comparing pack sizes:', error);
      throw new Error(`Failed to compare pack sizes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the numeric rank of a specific pack size
   * @param packSize - Pack size string to rank
   * @returns Promise resolving to pack size rank information
   */
  static async getPackSizeRank(packSize: string): Promise<PackSizeRankResponse> {
    try {
      const encodedPackSize = encodeURIComponent(packSize);
      const response = await httpClient.get(`/api/packsize/rank/${encodedPackSize}`);
      
      return response.data;
    } catch (error) {
      console.error('Error getting pack size rank:', error);
      throw new Error(`Failed to get pack size rank: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sort a list of pack sizes by their ranking
   * @param packSizes - Array of pack size strings to sort
   * @param reverse - If true, sort from largest to smallest
   * @returns Promise resolving to sorted pack sizes
   */
  static async sortPackSizes(packSizes: string[], reverse: boolean = false): Promise<PackSizeSortResponse> {
    try {
      const params = new URLSearchParams();
      packSizes.forEach(size => params.append('pack_sizes', size));
      params.append('reverse', reverse.toString());
      
      const response = await httpClient.get(`/api/packsize/sort?${params.toString()}`);
      
      return response.data;
    } catch (error) {
      console.error('Error sorting pack sizes:', error);
      throw new Error(`Failed to sort pack sizes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all available pack size categories and their definitions
   * @returns Promise resolving to pack size categories information
   */
  static async getPackSizeCategories(): Promise<PackSizeCategoriesResponse> {
    try {
      const response = await httpClient.get('/api/packsize/categories');
      
      return response.data;
    } catch (error) {
      console.error('Error getting pack size categories:', error);
      throw new Error(`Failed to get pack size categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if one pack size is smaller than another
   * @param size1 - First pack size
   * @param size2 - Second pack size  
   * @returns Promise resolving to true if size1 is smaller than size2
   */
  static async isSmaller(size1: string, size2: string): Promise<boolean> {
    try {
      const comparison = await this.comparePackSizes(size1, size2);
      return comparison.comparison_result < 0;
    } catch (error) {
      console.error('Error checking pack size comparison:', error);
      return false;
    }
  }

  /**
   * Get pack size insights for RPI analysis
   * @param packSizeData - Dictionary of pack sizes to RPI values
   * @returns Array of business insights
   */
  static generatePackSizeInsights(packSizeData: Record<string, number>): string[] {
    const insights: string[] = [];
    
    try {
      const entries = Object.entries(packSizeData);
      
      // Find patterns in the data
      for (let i = 0; i < entries.length - 1; i++) {
        const [size1, rpi1] = entries[i];
        const [size2, rpi2] = entries[i + 1];
        
        if (rpi1 > rpi2) {
          const premium = ((rpi1 - rpi2) / rpi2) * 100;
          insights.push(`${size1} commands ${premium.toFixed(1)}% premium over ${size2}`);
        } else if (rpi2 > rpi1) {
          const discount = ((rpi2 - rpi1) / rpi2) * 100;
          insights.push(`${size1} offers ${discount.toFixed(1)}% discount vs ${size2}`);
        }
      }
      
      return insights.slice(0, 3); // Return top 3 insights
    } catch (error) {
      console.error('Error generating pack size insights:', error);
      return [];
    }
  }

  /**
   * Format pack size for display
   * @param packSize - Raw pack size string
   * @returns Formatted pack size string
   */
  static formatPackSize(packSize: string): string {
    if (!packSize) return 'Unknown';
    
    // Clean up common formatting issues
    return packSize
      .replace(/ml/gi, 'ML')
      .replace(/l$/gi, 'L')
      .replace(/sachet/gi, 'Sachet')
      .replace(/pouch/gi, 'Pouch')
      .trim();
  }

  /**
   * Get pack size category color for UI display
   * @param category - Pack size category
   * @returns CSS color class or hex color
   */
  static getPackSizeCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'SACHET': '#ef4444',      // Red
      'SMALL': '#f97316',       // Orange  
      'MEDIUM': '#eab308',      // Yellow
      'LARGE': '#22c55e',       // Green
      'EXTRA_LARGE': '#3b82f6', // Blue
      'UNKNOWN': '#6b7280'      // Gray
    };
    
    return colors[category.toUpperCase()] || colors['UNKNOWN'];
  }

  /**
   * Get pack size category icon for UI display
   * @param category - Pack size category
   * @returns Icon name or Unicode character
   */
  static getPackSizeCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'SACHET': '📦',
      'SMALL': '🍼',
      'MEDIUM': '🥤',
      'LARGE': '🧴',
      'EXTRA_LARGE': '🪣',
      'UNKNOWN': '❓'
    };
    
    return icons[category.toUpperCase()] || icons['UNKNOWN'];
  }
}

// Create singleton instance
export const packSizeService = new PackSizeService();
export default packSizeService;

