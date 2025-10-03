/**
 * ========================================
 * ENHANCED DATA PROCESSING SERVICE
 * ========================================
 * 
 * Purpose: Unified data processing interface with modular processor architecture
 * 
 * Description:
 * This service provides a comprehensive data processing interface that abstracts
 * different data sources and formats behind a unified API. It supports multiple
 * data processors (mock, CSV, Excel) and provides enhanced data analysis
 * capabilities including statistical calculations, data quality assessment,
 * and visualization data preparation.
 * 
 * Key Functionality:
 * - Unified interface for multiple data formats (CSV, Excel, Mock)
 * - Enhanced statistical analysis and data profiling
 * - Data quality assessment with issue detection
 * - Histogram and frequency distribution calculation
 * - Column summary generation with detailed statistics
 * - Processing configuration based on file types
 * - Backward compatibility with legacy interfaces
 * 
 * Processor Architecture:
 * - MockDataProcessor: Generates demonstration data
 * - CSVDataProcessor: Handles comma-separated value files
 * - ExcelDataProcessor: Processes Excel workbooks (future enhancement)
 * - BaseDataProcessor: Common functionality and interfaces
 * 
 * Dependencies:
 * - MockDataProcessor for demonstration data generation
 * - CSVDataProcessor for CSV file handling
 * - ValidationService for data quality checks
 * - analysis.ts types for data structure definitions
 * - appConstants.ts for processing configuration
 * 
 * Used by:
 * - DataUploadStep.tsx for file processing
 * - DataSummaryStep.tsx for data analysis
 * - EDAStep.tsx for exploratory data analysis
 * - Backend integration for real data processing
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Frontend Team
 */

import { DataColumn, AnalysisData } from '@/types/analysis';
import { MockDataProcessor } from './dataProcessors/mockDataProcessor';
import { CSVDataProcessor } from './dataProcessors/csvDataProcessor';
import { ValidationService } from './validationService';
import { APP_CONFIG } from '@/constants/appConstants';

export class DataProcessor {
  private static mockProcessor = new MockDataProcessor();
  private static csvProcessor = new CSVDataProcessor();

  /**
   * Main entry point for processing uploaded files
   */
  static async processFile(file: File, useMockData: boolean = true): Promise<AnalysisData> {
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    if (useMockData) {
      return this.mockProcessor.processData(file);
    }

    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    switch (fileExtension) {
      case '.csv':
        return this.csvProcessor.processData(file);
      case '.xlsx':
      case '.xls':
        // For now, fall back to mock data for Excel files
        // In a real implementation, you'd use a library like xlsx
        return this.mockProcessor.processData(file);
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  static generateMockData(filename: string): AnalysisData {
    return this.mockProcessor.generateMockData(filename);
  }

  /**
   * Validates file before processing
   */
  static validateFile(file: File): { isValid: boolean; error?: string } {
    const validation = ValidationService.validateFileUpload(file);
    return {
      isValid: validation.isValid,
      error: validation.errors[0]
    };
  }

  /**
   * Calculates histogram data for numeric columns
   */
  static calculateHistogramData(values: number[], bins: number = 10) {
    const filteredValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
    
    if (filteredValues.length === 0) {
      return [];
    }
    
    const min = Math.min(...filteredValues);
    const max = Math.max(...filteredValues);
    const binSize = (max - min) / bins;
    
    if (binSize === 0) {
      return [{
        range: `${min.toFixed(0)}`,
        count: filteredValues.length,
      }];
    }
    
    // Import the formatting function
    const { formatHistogramRangeLabel } = require('@/utils/numberFormatter');
    
    return Array.from({ length: bins }, (_, i) => {
      const binStart = min + i * binSize;
      const binEnd = min + (i + 1) * binSize;
      const count = filteredValues.filter(v => v >= binStart && (i === bins - 1 ? v <= binEnd : v < binEnd)).length;
      return {
        range: formatHistogramRangeLabel(binStart, binEnd),
        count,
      };
    });
  }

  /**
   * Calculates frequency data for categorical columns
   */
  static calculateFrequencyData(values: any[]) {
    const valueCounts = values.reduce((acc, value) => {
      const key = value === null || value === undefined ? '(null)' : String(value);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(valueCounts)
      .map(([value, count]) => ({
        category: value,
        count,
      }))
      .sort((a, b) => b.count - a.count); // Sort by frequency
  }

  /**
   * Gets column summary statistics
   */
  static getColumnSummary(column: DataColumn): Record<string, any> {
    const summary: Record<string, any> = {
      name: column.name,
      type: column.type,
      totalValues: column.values.length,
    };

    if (column.statistics) {
      Object.assign(summary, column.statistics);
    }

    if (column.type === 'numeric') {
      const numericValues = column.values.filter(v => v !== null && v !== undefined && !isNaN(Number(v)));
      summary.validValues = numericValues.length;
      summary.invalidValues = column.values.length - numericValues.length;
    }

    return summary;
  }

  /**
   * Detects potential issues in the data
   */
  static detectDataIssues(data: AnalysisData): string[] {
    const issues: string[] = [];

    // Check for minimum data requirements
    if (data.rowCount < 20) {
      issues.push(`Low data volume: Only ${data.rowCount} rows available`);
    }

    // Check each column for issues
    data.columns.forEach(column => {
      const nullPercentage = ((column.statistics?.nullCount || 0) / data.rowCount) * 100;
      
      if (nullPercentage > 50) {
        issues.push(`High null values in '${column.name}': ${nullPercentage.toFixed(1)}%`);
      }

      if (column.type === 'numeric' && column.statistics) {
        const { min, max, std, mean } = column.statistics;
        
        // Check for potential outliers (values beyond 3 standard deviations)
        if (std > 0) {
          const outlierThreshold = 3 * std;
          if (Math.abs(max - mean) > outlierThreshold || Math.abs(min - mean) > outlierThreshold) {
            issues.push(`Potential outliers detected in '${column.name}'`);
          }
        }
      }

      if (column.type === 'categorical' && column.statistics) {
        const { unique } = column.statistics;
        const uniquePercentage = (unique / data.rowCount) * 100;
        
        if (uniquePercentage > 90) {
          issues.push(`High cardinality in '${column.name}': ${unique} unique values`);
        }
      }
    });

    return issues;
  }

  /**
   * Gets processing configuration based on file type
   */
  static getProcessingConfig(file: File): {
    processor: string;
    expectedColumns: string[];
    recommendations: string[];
  } {
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    const config = {
      processor: 'unknown',
      expectedColumns: ['Date', 'Revenue', 'TV_Spend', 'Digital_Spend', 'Print_Spend', 'Radio_Spend'],
      recommendations: [
        'Include a date column for time series analysis',
        'Ensure revenue/sales data is present as the dependent variable',
        'Include marketing spend data across different channels',
        'Consider external factors like seasonality'
      ]
    };

    switch (fileExtension) {
      case '.csv':
        config.processor = 'CSV';
        break;
      case '.xlsx':
      case '.xls':
        config.processor = 'Excel';
        break;
      default:
        config.processor = 'Mock (for demonstration)';
    }

    return config;
  }
}

// Create singleton instance
export const dataProcessor = new DataProcessor();
export default dataProcessor;