/**
 * ========================================
 * BASE DATA PROCESSOR CLASS
 * ========================================
 * 
 * Purpose: Abstract base class providing common data processing functionality
 * 
 * Description:
 * This abstract class defines the common interface and shared functionality
 * for all data processors in the system. It provides standardized methods
 * for data validation, statistical calculations, and type inference that
 * are used across different data source implementations.
 * 
 * Key Functionality:
 * - Abstract interface definition for data processors
 * - Common statistical calculation methods (mean, median, std dev)
 * - Categorical data statistics (unique counts, null handling)
 * - Automatic column type inference (numeric, categorical, date)
 * - Column name cleaning and standardization
 * - Shared validation and error handling patterns
 * 
 * Statistical Methods:
 * - Numeric statistics: mean, median, standard deviation, min/max
 * - Categorical statistics: unique value counts, null value tracking
 * - Data quality metrics: completeness, consistency checks
 * - Type inference: automatic detection of data types
 * 
 * Dependencies:
 * - analysis.ts types for data structure definitions
 * 
 * Used by:
 * - MockDataProcessor for demonstration data generation
 * - CSVDataProcessor for CSV file processing
 * - Future Excel and JSON processors
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Frontend Team
 */

import { DataColumn, AnalysisData } from '@/types/analysis';

export abstract class BaseDataProcessor {
  /**
   * Processes raw data into structured format
   */
  abstract processData(file: File): Promise<AnalysisData>;

  /**
   * Validates data format and content
   */
  abstract validateData(data: any): { isValid: boolean; errors: string[] };

  /**
   * Generates statistics for numeric columns
   */
  protected calculateStatistics(values: number[]): {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
    nullCount: number;
  } {
    const filteredValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
    const nullCount = values.length - filteredValues.length;
    
    if (filteredValues.length === 0) {
      return { mean: 0, median: 0, std: 0, min: 0, max: 0, nullCount };
    }

    const sorted = filteredValues.sort((a, b) => a - b);
    const mean = filteredValues.reduce((sum, val) => sum + val, 0) / filteredValues.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const std = Math.sqrt(
      filteredValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / filteredValues.length
    );

    return {
      mean,
      median,
      std,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      nullCount
    };
  }

  /**
   * Generates statistics for categorical columns
   */
  protected calculateCategoricalStatistics(values: any[]): {
    unique: number;
    nullCount: number;
  } {
    const nonNullValues = values.filter(v => v !== null && v !== undefined);
    const uniqueValues = new Set(nonNullValues);
    
    return {
      unique: uniqueValues.size,
      nullCount: values.length - nonNullValues.length
    };
  }

  /**
   * Infers column type from values
   */
  protected inferColumnType(values: any[]): 'numeric' | 'categorical' | 'date' {
    const sample = values.slice(0, 10).filter(v => v !== null && v !== undefined);
    
    if (sample.length === 0) return 'categorical';
    
    // Check if all values are numbers
    const isNumeric = sample.every(v => !isNaN(Number(v)));
    if (isNumeric) return 'numeric';
    
    // Check if values look like dates
    const isDate = sample.every(v => !isNaN(Date.parse(v)));
    if (isDate) return 'date';
    
    return 'categorical';
  }

  /**
   * Cleans and normalizes column names
   */
  protected cleanColumnName(name: string): string {
    return name
      .trim()
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}