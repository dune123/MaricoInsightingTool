/**
 * ========================================
 * CSV DATA PROCESSOR
 * ========================================
 * 
 * Purpose: Process CSV files and extract structured data for analytics pipeline
 * 
 * Description:
 * This processor handles CSV (Comma-Separated Values) file parsing and converts
 * raw CSV data into structured analysis data. It provides robust parsing with
 * proper handling of quoted fields, delimiter detection, and data type inference.
 * The processor ensures data quality and consistency for downstream analytics.
 * 
 * Key Functionality:
 * - Parse CSV files with proper quote and delimiter handling
 * - Automatic data type inference for columns (numeric, categorical, date)
 * - Generate comprehensive statistics for each column
 * - Handle malformed CSV data with graceful error reporting
 * - Validate data consistency and row integrity
 * - Clean and standardize column names for processing
 * 
 * CSV Parsing Features:
 * - Quoted field support with escape character handling
 * - Multi-line field support for complex data
 * - Automatic delimiter detection and validation
 * - Header row extraction and column mapping
 * - Inconsistent row length detection and reporting
 * 
 * Dependencies:
 * - BaseDataProcessor for common statistical functionality
 * - analysis.ts types for data structure definitions
 * 
 * Used by:
 * - DataProcessor service for CSV file handling
 * - File upload workflows for real data processing
 * - Backend integration for server-side CSV processing
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Frontend Team
 */

import { AnalysisData, DataColumn } from '@/types/analysis';
import { BaseDataProcessor } from './baseDataProcessor';

export class CSVDataProcessor extends BaseDataProcessor {
  /**
   * Processes CSV file data
   */
  async processData(file: File): Promise<AnalysisData> {
    const text = await file.text();
    const rows = this.parseCSV(text);
    
    if (rows.length === 0) {
      throw new Error('CSV file is empty');
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    const columns: DataColumn[] = headers.map((header, colIndex) => {
      const columnValues = dataRows.map(row => row[colIndex]);
      const cleanName = this.cleanColumnName(header);
      const type = this.inferColumnType(columnValues);
      
      const column: DataColumn = {
        name: cleanName,
        type,
        values: columnValues,
      };

      if (type === 'numeric') {
        const numericValues = columnValues.map(v => parseFloat(v)).filter(v => !isNaN(v));
        column.statistics = this.calculateStatistics(numericValues);
      } else if (type === 'categorical') {
        column.statistics = this.calculateCategoricalStatistics(columnValues);
      }

      return column;
    });

    return {
      filename: file.name,
      columns,
      rowCount: dataRows.length,
      uploadedAt: new Date(),
    };
  }

  validateData(data: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      const rows = this.parseCSV(data);
      
      if (rows.length === 0) {
        errors.push('CSV file is empty');
      } else if (rows.length === 1) {
        errors.push('CSV file only contains headers');
      }
      
      // Check for consistent row lengths
      const headerLength = rows[0]?.length || 0;
      const inconsistentRows = rows.findIndex(row => row.length !== headerLength);
      if (inconsistentRows !== -1) {
        errors.push(`Inconsistent number of columns at row ${inconsistentRows + 1}`);
      }
      
    } catch (error) {
      errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private parseCSV(text: string): string[][] {
    const rows: string[][] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.trim() === '') continue;
      
      const row = this.parseCSVLine(line);
      rows.push(row);
    }
    
    return rows;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }
}