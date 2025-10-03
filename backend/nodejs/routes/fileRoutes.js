/**
 * ========================================
 * FILE UPLOAD ROUTES
 * ========================================
 * 
 * Purpose: RESTful API endpoints for file upload and data extraction operations
 * 
 * Description:
 * This module defines all HTTP API endpoints related to file upload, processing,
 * and data extraction. It handles multipart file uploads, triggers the processing
 * pipeline, and provides endpoints for accessing file information and data.
 * These routes serve as the primary interface between the frontend and backend
 * file processing services.
 * 
 * API Endpoints:
 * - POST /upload: Upload file and create timestamped copy with metadata
 * - GET /:filename/columns: Extract and return column names from processed file
 * - GET /:filename/sample: Get sample data rows for preview and validation
 * - GET /:filename/info: Retrieve file metadata and processing information
 * - GET /:filename/sheets: Get all Excel sheet names and column information
 * 
 * Key Functions:
 * - Multipart file upload processing with validation
 * - Automatic metadata file creation for tracking
 * - Column extraction for both Excel and CSV formats
 * - Sample data generation for user validation
 * - Excel sheet information extraction
 * - Comprehensive error handling with detailed messages
 * 
 * Request Handling:
 * - File type and size validation (.xlsx, .csv, max 10MB)
 * - Timestamped filename generation for processed files
 * - Automatic directory structure creation
 * - File cleanup and temporary storage management
 * - Column header extraction and analysis
 * - Sample data preview generation
 * 
 * Dependencies:
 * - express for HTTP routing and middleware
 * - multer for multipart file upload handling
 * - fileUploadHandler.js for file processing operations
 * - fileReader.js for data extraction services
 * - metadataManager.js for metadata creation
 * - constants.js for configuration settings
 * 
 * Used by:
 * - Frontend file upload components
 * - Data preview and validation interfaces
 * - File management dashboard
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Backend Team
 */

import express from 'express';
import multer from 'multer';
import { handleFileUpload, fileExists, getFileInfo } from '../services/fileUploadHandler.js';
import { readFileColumns, getFileSampleData, readAllExcelSheets } from '../services/fileReader.js';
import { createMetadataFile } from '../services/metadataManager.js';
import { FILE_CONFIG } from '../config/constants.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: FILE_CONFIG.UPLOAD_DIR,
  limits: {
    fileSize: FILE_CONFIG.MAX_FILE_SIZE
  }
});

/**
 * POST /api/files/upload
 * Upload a file and create initial processing
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Handle file upload and create timestamped copy
    const uploadResult = await handleFileUpload(req.file);
    if (!uploadResult.success) {
      return res.status(400).json(uploadResult);
    }

    // Create metadata file
    const metadataResult = await createMetadataFile(uploadResult.fileInfo.originalName);
    if (!metadataResult.success) {
      return res.status(500).json({
        success: false,
        error: 'File uploaded but metadata creation failed: ' + metadataResult.error
      });
    }

    // Read file columns
    const columnsResult = await readFileColumns(uploadResult.fileInfo.processedName);
    if (!columnsResult.success) {
      return res.status(500).json({
        success: false,
        error: 'File uploaded but column reading failed: ' + columnsResult.error
      });
    }

    res.json({
      success: true,
      message: 'File uploaded and processed successfully',
      data: {
        file: uploadResult.fileInfo,
        metadata: metadataResult.metadataFile,
        columns: columnsResult.columns,
        fileStats: {
          totalRows: columnsResult.totalRows,
          totalColumns: columnsResult.totalColumns
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
});

/**
 * GET /api/files/:filename/columns
 * Get columns from a processed file
 */
router.get('/:filename/columns', async (req, res) => {
  try {
    const { filename } = req.params;

    // Check if file exists
    const exists = await fileExists(filename);
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Read file columns
    const result = await readFileColumns(filename);
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      data: {
        filename: filename,
        columns: result.columns,
        totalRows: result.totalRows,
        totalColumns: result.totalColumns,
        sheetName: result.sheetName || null
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
});

/**
 * GET /api/files/:filename/sample
 * Get sample data from a processed file
 */
router.get('/:filename/sample', async (req, res) => {
  try {
    const { filename } = req.params;
    const sampleSize = parseInt(req.query.size) || 5;

    // Check if file exists
    const exists = await fileExists(filename);
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Get sample data
    const result = await getFileSampleData(filename, sampleSize);
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      data: {
        filename: filename,
        headers: result.headers,
        sampleData: result.sampleData,
        totalSampled: result.totalSampled,
        sampleSize: sampleSize
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
});

/**
 * GET /api/files/:filename/info
 * Get file information
 */
router.get('/:filename/info', async (req, res) => {
  try {
    const { filename } = req.params;

    const result = await getFileInfo(filename);
    if (!result.exists) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
});

/**
 * GET /api/files/:filename/sheets
 * Get all sheet names and their first 5 column names from Excel file
 */
router.get('/:filename/sheets', async (req, res) => {
  try {
    const { filename } = req.params;

    // Check if file exists
    const exists = await fileExists(filename);
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Read all sheets information
    const result = await readAllExcelSheets(filename);
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
});

export default router;