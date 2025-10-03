/**
 * ========================================
 * APPLICATION CONSTANTS
 * ========================================
 * 
 * Purpose: Centralized configuration constants for the backend application
 * 
 * Description:
 * This file contains all configuration constants used throughout the backend
 * system. It provides a single source of truth for file handling settings,
 * API configurations, Excel sheet definitions, and error messages.
 * 
 * Configuration Objects:
 * - FILE_CONFIG: File handling settings (size limits, extensions, directories)
 * - EXCEL_CONFIG: Excel sheet structure and limits
 * - API_CONFIG: Server configuration (port, host, prefix)
 * - ERROR_MESSAGES: Standardized error messages
 * 
 * File Configuration Details:
 * - MAX_FILE_SIZE: 10MB maximum file upload size
 * - ALLOWED_EXTENSIONS: ['.xlsx', '.csv'] only
 * - UPLOAD_DIR: './uploads' temporary storage
 * - PROCESSED_DIR: './processed' timestamped files
 * - METADATA_DIR: './metadata' Excel metadata files
 * 
 * Excel Configuration Details:
 * - METADATA_SHEETS: Four structured sheets for tracking
 * - MAX_COLUMNS: 1000 maximum columns per sheet
 * - MAX_ROWS: 100000 maximum rows per sheet
 * 
 * API Configuration Details:
 * - PORT: 3001 (environment configurable)
 * - HOST: localhost (environment configurable)
 * - API_PREFIX: '/api' route prefix
 * 
 * Dependencies: None (pure configuration)
 * 
 * Used by:
 * - All service modules for configuration values
 * - Route handlers for validation and settings
 * - Server initialization for API setup
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Backend Team
 */

export const FILE_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_EXTENSIONS: ['.xlsx', '.csv'],
  UPLOAD_DIR: './uploads',
  PROCESSED_DIR: './processed',
  METADATA_DIR: './metadata'
};

export const EXCEL_CONFIG = {
  METADATA_SHEETS: {
    FILTER_COLUMNS: 'FilterColumns',
    BRAND_INFO: 'BrandInfo',
    FILE_INFO: 'FileInfo',
    PROCESSING_LOG: 'ProcessingLog'
  },
  MAX_COLUMNS: 1000,
  MAX_ROWS: 100000
};

export const API_CONFIG = {
  PORT: process.env.PORT || 3001,
  HOST: process.env.HOST || 'localhost',
  API_PREFIX: '/api'
};

export const ERROR_MESSAGES = {
  FILE_NOT_FOUND: 'File not found',
  INVALID_FILE_TYPE: 'Invalid file type. Only .xlsx and .csv files are allowed',
  FILE_TOO_LARGE: 'File size exceeds maximum limit',
  PROCESSING_ERROR: 'Error processing file',
  METADATA_ERROR: 'Error managing metadata',
  INVALID_BRAND_NAME: 'Brand name must be provided and cannot be empty'
};