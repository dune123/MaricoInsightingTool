/**
 * ========================================
 * METADATA MANAGER SERVICE
 * ========================================
 * 
 * Purpose: Comprehensive metadata Excel file creation and management
 * 
 * Description:
 * This service manages the complete lifecycle of metadata Excel files that track
 * all processing activities, filter selections, brand information, and file details.
 * Each uploaded file gets a corresponding metadata file with organized sheets
 * containing structured information about the processing workflow.
 * 
 * Key Functions:
 * - createMetadataFile(originalFilename): Creates new metadata Excel files
 * - addFilterColumnsToMetadata(metadataFilename, filterData): Stores filter selections
 * - addBrandInfoToMetadata(metadataFilename, brandName, userId): Stores brand information
 * - addProcessingLogEntry(metadataFilename, action, details): Logs processing activities
 * - getMetadataInfo(metadataFilename): Retrieves metadata information
 * 
 * Metadata File Structure:
 * - FileInfo: Original file details, upload info, processing status
 * - FilterColumns: Selected columns, indices, selection order, timestamps
 * - BrandInfo: Brand name, entry details, status tracking
 * - ProcessingLog: Chronological log of all processing activities
 * 
 * Helper Functions:
 * - addFileInfoSheet(workbook, originalFilename): Creates file info sheet
 * - addProcessingLogSheet(workbook): Creates processing log sheet
 * - addFilterColumnsSheet(workbook): Creates filter columns sheet
 * - addBrandInfoSheet(workbook): Creates brand info sheet
 * 
 * File Operations:
 * - Excel workbook creation and manipulation
 * - Multi-sheet structure management
 * - Data formatting and validation
 * - File writing and storage
 * - Concurrent update handling
 * 
 * Dependencies:
 * - xlsx library for Excel file creation and manipulation
 * - path for file path operations
 * - fs-extra for file system operations
 * - constants.js for sheet names and configuration
 * - timestampGenerator.js for consistent file naming
 * 
 * Used by:
 * - metadataRoutes.js for metadata API endpoints
 * - filterManager.js for storing filter selections
 * - brandHandler.js for storing brand information
 * - All services requiring activity logging
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Backend Team
 */

import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs-extra';
import { FILE_CONFIG, EXCEL_CONFIG } from '../config/constants.js';
import { generateTimestampedFilename, getBaseFilename } from '../utils/timestampGenerator.js';

/**
 * Creates a new metadata Excel file for the uploaded file
 * @param {string} originalFilename - Original filename of the uploaded file
 * @returns {Object} - Result with metadata file info or error
 */
export async function createMetadataFile(originalFilename) {
  try {
    await fs.ensureDir(FILE_CONFIG.METADATA_DIR);

    const baseFilename = getBaseFilename(originalFilename);
    const metadataFilename = generateTimestampedFilename(`${baseFilename}_metadata`, '.xlsx');
    const metadataPath = path.join(FILE_CONFIG.METADATA_DIR, metadataFilename);

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Create initial sheets
    await addFileInfoSheet(workbook, originalFilename);
    await addProcessingLogSheet(workbook);
    await addFilterColumnsSheet(workbook);
    await addBrandInfoSheet(workbook);

    // Write the workbook to file
    XLSX.writeFile(workbook, metadataPath);

    return {
      success: true,
      metadataFile: {
        filename: metadataFilename,
        path: metadataPath,
        originalFile: originalFilename,
        createdAt: new Date().toISOString(),
        sheets: Object.values(EXCEL_CONFIG.METADATA_SHEETS)
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to create metadata file: ${error.message}`
    };
  }
}

/**
 * Adds filter columns data to metadata file
 * @param {string} metadataFilename - Name of the metadata file
 * @param {Object} filterData - Filter column data
 * @returns {Object} - Result with success or error
 */
export async function addFilterColumnsToMetadata(metadataFilename, filterData) {
  try {
    const metadataPath = path.join(FILE_CONFIG.METADATA_DIR, metadataFilename);
    
    // Check if metadata file exists
    const exists = await fs.pathExists(metadataPath);
    if (!exists) {
      return {
        success: false,
        error: 'Metadata file not found'
      };
    }

    // Read existing workbook
    const workbook = XLSX.readFile(metadataPath);

    // Prepare filter columns data
    const filterColumnsData = [
      ['Column Name', 'Index', 'Selected', 'Selection Order', 'Timestamp'],
      ...filterData.selection.selectedColumnsInfo.map(col => [
        col.name,
        col.index,
        'Yes',
        col.selectionOrder,
        filterData.metadata.timestamp
      ]),
      ...filterData.selection.nonSelectedColumns.map((colName, index) => [
        colName,
        filterData.selection.selectedColumnsInfo.length + index,
        'No',
        '',
        filterData.metadata.timestamp
      ])
    ];

    // Update filter columns sheet
    const filterSheet = XLSX.utils.aoa_to_sheet(filterColumnsData);
    workbook.Sheets[EXCEL_CONFIG.METADATA_SHEETS.FILTER_COLUMNS] = filterSheet;

    // Write updated workbook
    XLSX.writeFile(workbook, metadataPath);

    return {
      success: true,
      message: 'Filter columns added to metadata file',
      updatedAt: new Date().toISOString()
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to add filter columns to metadata: ${error.message}`
    };
  }
}

/**
 * Adds brand information to metadata file
 * @param {string} metadataFilename - Name of the metadata file
 * @param {string} brandName - Brand name to store
 * @param {string} userId - User ID (optional)
 * @returns {Object} - Result with success or error
 */
export async function addBrandInfoToMetadata(metadataFilename, brandName, userId = 'anonymous') {
  try {
    const metadataPath = path.join(FILE_CONFIG.METADATA_DIR, metadataFilename);
    
    // Check if metadata file exists
    const exists = await fs.pathExists(metadataPath);
    if (!exists) {
      return {
        success: false,
        error: 'Metadata file not found'
      };
    }

    // Read existing workbook
    const workbook = XLSX.readFile(metadataPath);

    // Prepare brand info data
    const brandInfoData = [
      ['Property', 'Value'],
      ['Brand Name', brandName],
      ['Entered By', userId],
      ['Entry Timestamp', new Date().toISOString()],
      ['Status', 'Active'],
      ['Last Updated', new Date().toISOString()]
    ];

    // Update brand info sheet
    const brandSheet = XLSX.utils.aoa_to_sheet(brandInfoData);
    workbook.Sheets[EXCEL_CONFIG.METADATA_SHEETS.BRAND_INFO] = brandSheet;

    // Write updated workbook
    XLSX.writeFile(workbook, metadataPath);

    return {
      success: true,
      message: 'Brand information added to metadata file',
      brandName: brandName,
      updatedAt: new Date().toISOString()
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to add brand info to metadata: ${error.message}`
    };
  }
}

/**
 * Adds an entry to the processing log
 * @param {string} metadataFilename - Name of the metadata file
 * @param {string} action - Action performed
 * @param {string} details - Details about the action
 * @returns {Object} - Result with success or error
 */
export async function addProcessingLogEntry(metadataFilename, action, details) {
  try {
    const metadataPath = path.join(FILE_CONFIG.METADATA_DIR, metadataFilename);
    
    // Check if metadata file exists
    const exists = await fs.pathExists(metadataPath);
    if (!exists) {
      return {
        success: false,
        error: 'Metadata file not found'
      };
    }

    // Read existing workbook
    const workbook = XLSX.readFile(metadataPath);

    // Read current processing log
    const currentSheet = workbook.Sheets[EXCEL_CONFIG.METADATA_SHEETS.PROCESSING_LOG];
    const currentData = XLSX.utils.sheet_to_json(currentSheet, { header: 1 });

    // Add new entry
    const newEntry = [
      new Date().toISOString(),
      action,
      details,
      'System'
    ];

    currentData.push(newEntry);

    // Update processing log sheet
    const updatedSheet = XLSX.utils.aoa_to_sheet(currentData);
    workbook.Sheets[EXCEL_CONFIG.METADATA_SHEETS.PROCESSING_LOG] = updatedSheet;

    // Write updated workbook
    XLSX.writeFile(workbook, metadataPath);

    return {
      success: true,
      message: 'Processing log entry added',
      action: action,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to add processing log entry: ${error.message}`
    };
  }
}

/**
 * Retrieves metadata file information
 * @param {string} metadataFilename - Name of the metadata file
 * @returns {Object} - Metadata file information or error
 */
export async function getMetadataInfo(metadataFilename) {
  try {
    const metadataPath = path.join(FILE_CONFIG.METADATA_DIR, metadataFilename);
    
    // Check if metadata file exists
    const exists = await fs.pathExists(metadataPath);
    if (!exists) {
      return {
        success: false,
        error: 'Metadata file not found'
      };
    }

    // Get file stats
    const stats = await fs.stat(metadataPath);
    
    // Read workbook to get sheet names
    const workbook = XLSX.readFile(metadataPath);
    const sheetNames = workbook.SheetNames;

    return {
      success: true,
      metadataInfo: {
        filename: metadataFilename,
        path: metadataPath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        sheets: sheetNames,
        totalSheets: sheetNames.length
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to get metadata info: ${error.message}`
    };
  }
}

/**
 * Helper function to add File Info sheet
 */
async function addFileInfoSheet(workbook, originalFilename) {
  const fileInfoData = [
    ['Property', 'Value'],
    ['Original Filename', originalFilename],
    ['Upload Timestamp', new Date().toISOString()],
    ['Processing Status', 'Initialized'],
    ['Metadata Version', '1.0'],
    ['Created By', 'System']
  ];

  const fileInfoSheet = XLSX.utils.aoa_to_sheet(fileInfoData);
  XLSX.utils.book_append_sheet(workbook, fileInfoSheet, EXCEL_CONFIG.METADATA_SHEETS.FILE_INFO);
}

/**
 * Helper function to add Processing Log sheet
 */
async function addProcessingLogSheet(workbook) {
  const processingLogData = [
    ['Timestamp', 'Action', 'Details', 'User'],
    [new Date().toISOString(), 'Metadata File Created', 'Initial metadata file creation', 'System']
  ];

  const processingLogSheet = XLSX.utils.aoa_to_sheet(processingLogData);
  XLSX.utils.book_append_sheet(workbook, processingLogSheet, EXCEL_CONFIG.METADATA_SHEETS.PROCESSING_LOG);
}

/**
 * Helper function to add Filter Columns sheet
 */
async function addFilterColumnsSheet(workbook) {
  const filterColumnsData = [
    ['Column Name', 'Index', 'Selected', 'Selection Order', 'Timestamp'],
    ['(Pending selection)', '', '', '', '']
  ];

  const filterColumnsSheet = XLSX.utils.aoa_to_sheet(filterColumnsData);
  XLSX.utils.book_append_sheet(workbook, filterColumnsSheet, EXCEL_CONFIG.METADATA_SHEETS.FILTER_COLUMNS);
}

/**
 * Helper function to add Brand Info sheet
 */
async function addBrandInfoSheet(workbook) {
  const brandInfoData = [
    ['Property', 'Value'],
    ['Brand Name', '(Pending input)'],
    ['Entered By', ''],
    ['Entry Timestamp', ''],
    ['Status', 'Pending'],
    ['Last Updated', '']
  ];

  const brandInfoSheet = XLSX.utils.aoa_to_sheet(brandInfoData);
  XLSX.utils.book_append_sheet(workbook, brandInfoSheet, EXCEL_CONFIG.METADATA_SHEETS.BRAND_INFO);
}