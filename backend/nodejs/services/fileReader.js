/**
 * ========================================
 * FILE READER SERVICE
 * ========================================
 * 
 * Purpose: Extract column information and data from Excel and CSV files
 * 
 * Description:
 * This service provides comprehensive file reading capabilities for processing
 * uploaded Excel and CSV files. It extracts column names, file statistics,
 * and sample data while handling various file formats gracefully. The service
 * acts as the primary data extraction layer for the analytics pipeline.
 * 
 * Key Functions:
 * - readFileColumns(filename): Extracts column headers from files
 * - getFileSampleData(filename, sampleSize): Gets sample data rows
 * - readAllExcelSheets(filename): Gets information about all Excel sheets
 * - readExcelColumns(filePath): Reads Excel file columns
 * - readCsvColumns(filePath): Reads CSV file columns
 * 
 * Helper Functions:
 * - parseCSVLine(line): Parses CSV lines with quote handling
 * - getExcelSampleData(filePath, sampleSize): Gets Excel sample data
 * - getCsvSampleData(filePath, sampleSize): Gets CSV sample data
 * 
 * File Format Support:
 * - Excel (.xlsx): Multi-sheet support with XLSX library
 * - CSV: Comma-separated values with proper quote handling
 * - Data extraction: Headers, sample data, file statistics
 * 
 * Data Processing:
 * - Header row identification and extraction
 * - Column name parsing and validation
 * - Row and column counting
 * - Sample data generation
 * - File statistics calculation
 * - Error handling for malformed files
 * 
 * Excel Features:
 * - Multi-sheet file support
 * - Sheet name extraction
 * - Column range detection
 * - Cell value extraction
 * - Sheet information aggregation
 * 
 * CSV Features:
 * - Quote-aware parsing
 * - Delimiter handling
 * - Line-by-line processing
 * - Empty line filtering
 * - Field trimming and cleaning
 * 
 * Dependencies:
 * - xlsx library for Excel file processing
 * - fs-extra for file system operations
 * - path for file path manipulation
 * - constants.js for file configuration and error messages
 * 
 * Used by:
 * - fileRoutes.js for column extraction API endpoints
 * - filterManager.js for available column information
 * - Frontend components for data preview and validation
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Backend Team
 */

import XLSX from 'xlsx';
import fs from 'fs-extra';
import path from 'path';
import { FILE_CONFIG, ERROR_MESSAGES } from '../config/constants.js';

/**
 * Reads Excel file and extracts column names
 * @param {string} filePath - Path to the Excel file
 * @returns {Object} - Result with columns or error
 */
export async function readExcelColumns(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Read first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Get range of the worksheet
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Extract headers (first row)
    const headers = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      const cell = worksheet[cellAddress];
      headers.push(cell ? cell.v : `Column${col + 1}`);
    }

    return {
      success: true,
      columns: headers,
      sheetName: sheetName,
      totalRows: range.e.r + 1,
      totalColumns: range.e.c + 1
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to read Excel file: ${error.message}`
    };
  }
}

/**
 * Reads CSV file and extracts column names
 * @param {string} filePath - Path to the CSV file
 * @returns {Object} - Result with columns or error
 */
export async function readCsvColumns(filePath) {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const lines = fileContent.split('\n');
    
    if (lines.length === 0) {
      return {
        success: false,
        error: 'CSV file is empty'
      };
    }

    // Parse first line to get headers
    const headers = parseCSVLine(lines[0]);
    
    return {
      success: true,
      columns: headers,
      totalRows: lines.filter(line => line.trim() !== '').length,
      totalColumns: headers.length
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to read CSV file: ${error.message}`
    };
  }
}

/**
 * Main function to read file columns based on file type
 * @param {string} filename - Name of the processed file
 * @returns {Object} - Result with columns or error
 */
export async function readFileColumns(filename) {
  try {
    const filePath = path.join(FILE_CONFIG.PROCESSED_DIR, filename);
    
    // Check if file exists
    const fileExists = await fs.pathExists(filePath);
    if (!fileExists) {
      return {
        success: false,
        error: ERROR_MESSAGES.FILE_NOT_FOUND
      };
    }

    // Determine file type and read accordingly
    const extension = path.extname(filename).toLowerCase();
    
    switch (extension) {
      case '.xlsx':
        return await readExcelColumns(filePath);
      case '.csv':
        return await readCsvColumns(filePath);
      default:
        return {
          success: false,
          error: `Unsupported file type: ${extension}`
        };
    }

  } catch (error) {
    return {
      success: false,
      error: `Error reading file: ${error.message}`
    };
  }
}

/**
 * Gets sample data from file (first few rows)
 * @param {string} filename - Name of the processed file
 * @param {number} sampleSize - Number of rows to sample (default: 5)
 * @returns {Object} - Result with sample data or error
 */
export async function getFileSampleData(filename, sampleSize = 5) {
  try {
    const filePath = path.join(FILE_CONFIG.PROCESSED_DIR, filename);
    const extension = path.extname(filename).toLowerCase();
    
    switch (extension) {
      case '.xlsx':
        return await getExcelSampleData(filePath, sampleSize);
      case '.csv':
        return await getCsvSampleData(filePath, sampleSize);
      default:
        return {
          success: false,
          error: `Unsupported file type: ${extension}`
        };
    }

  } catch (error) {
    return {
      success: false,
      error: `Error reading sample data: ${error.message}`
    };
  }
}

/**
 * Helper function to parse CSV line (handles quoted fields)
 * @param {string} line - CSV line to parse
 * @returns {Array} - Array of field values
 */
function parseCSVLine(line) {
  const result = [];
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

/**
 * Gets sample data from Excel file
 * @param {string} filePath - Path to Excel file
 * @param {number} sampleSize - Number of rows to sample
 * @returns {Object} - Sample data result
 */
async function getExcelSampleData(filePath, sampleSize) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with range limit
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      range: sampleSize + 1 // Include header + sample rows
    });
    
    return {
      success: true,
      headers: jsonData[0] || [],
      sampleData: jsonData.slice(1, sampleSize + 1),
      totalSampled: Math.min(sampleSize, jsonData.length - 1)
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to get Excel sample: ${error.message}`
    };
  }
}

/**
 * Gets sample data from CSV file
 * @param {string} filePath - Path to CSV file
 * @param {number} sampleSize - Number of rows to sample
 * @returns {Object} - Sample data result
 */
async function getCsvSampleData(filePath, sampleSize) {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      return {
        success: false,
        error: 'CSV file is empty'
      };
    }

    const headers = parseCSVLine(lines[0]);
    const sampleData = [];
    
    for (let i = 1; i <= Math.min(sampleSize, lines.length - 1); i++) {
      sampleData.push(parseCSVLine(lines[i]));
    }
    
    return {
      success: true,
      headers: headers,
      sampleData: sampleData,
      totalSampled: sampleData.length
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to get CSV sample: ${error.message}`
    };
  }
}

/**
 * Reads all sheets from Excel file and returns sheet names with first 5 columns
 * @param {string} filename - Name of the processed file
 * @returns {Object} - Result with all sheets info or error
 */
export async function readAllExcelSheets(filename) {
  try {
    const filePath = path.join(FILE_CONFIG.PROCESSED_DIR, filename);
    
    // Check if file exists
    const fileExists = await fs.pathExists(filePath);
    if (!fileExists) {
      return {
        success: false,
        error: ERROR_MESSAGES.FILE_NOT_FOUND
      };
    }

    // Check if it's an Excel file
    const extension = path.extname(filename).toLowerCase();
    if (extension !== '.xlsx') {
      return {
        success: false,
        error: 'This endpoint only supports Excel (.xlsx) files'
      };
    }

    const workbook = XLSX.readFile(filePath);
    const sheetsInfo = [];

    // Read each sheet
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet['!ref']) {
        // Empty sheet
        sheetsInfo.push({
          sheetName: sheetName,
          columns: [],
          totalRows: 0,
          totalColumns: 0
        });
        continue;
      }

      // Get range of the worksheet
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      
      // Extract headers (first row) - limit to first 5 columns
      const headers = [];
      const maxColumns = Math.min(range.e.c + 1, 5); // First 5 columns or total columns if less than 5
      
      for (let col = range.s.c; col < range.s.c + maxColumns; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        const cell = worksheet[cellAddress];
        headers.push(cell ? cell.v : `Column${col + 1}`);
      }

      sheetsInfo.push({
        sheetName: sheetName,
        columns: headers,
        totalRows: range.e.r + 1,
        totalColumns: range.e.c + 1
      });
    }

    return {
      success: true,
      filename: filename,
      totalSheets: workbook.SheetNames.length,
      sheets: sheetsInfo
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to read Excel sheets: ${error.message}`
    };
  }
}