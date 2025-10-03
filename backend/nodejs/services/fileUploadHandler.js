/**
 * ========================================
 * FILE UPLOAD HANDLER SERVICE
 * ========================================
 * 
 * Purpose: Complete file upload processing and local copy management
 * 
 * Description:
 * This service handles the entire file upload workflow from receiving uploaded
 * files to creating timestamped copies in the processed directory. It manages
 * file validation, directory setup, file copying, and cleanup operations.
 * This is the primary entry point for all file upload operations in the system.
 * 
 * Key Functions:
 * - handleFileUpload(file): Processes uploaded files and creates timestamped copies
 * - fileExists(filename): Checks if processed file exists
 * - getFileInfo(filename): Gets detailed file information
 * - ensureUploadDirectories(): Creates necessary directory structure
 * 
 * Upload Process Flow:
 * 1. File validation (type, size, format)
 * 2. Timestamped filename generation
 * 3. Directory structure creation
 * 4. File copying to processed directory
 * 5. Temporary file cleanup
 * 6. File information return
 * 
 * File Operations:
 * - Multipart file processing and validation
 * - Timestamped filename creation
 * - Directory structure management
 * - File copying and cleanup
 * - File existence checking
 * - File metadata extraction
 * 
 * Dependencies:
 * - fs-extra for enhanced file operations
 * - path for file path manipulation
 * - fileValidator.js for upload validation
 * - timestampGenerator.js for consistent naming
 * - constants.js for directory and configuration settings
 * 
 * Used by:
 * - fileRoutes.js for handling upload API endpoints
 * - Other services requiring file existence checks
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Backend Team
 */

import fs from 'fs-extra';
import path from 'path';
import { FILE_CONFIG } from '../config/constants.js';
import { validateUploadedFile } from '../utils/fileValidator.js';
import { generateTimestampedFilename, getBaseFilename, getFileExtension } from '../utils/timestampGenerator.js';

/**
 * Ensures upload directories exist
 */
export async function ensureUploadDirectories() {
  await fs.ensureDir(FILE_CONFIG.UPLOAD_DIR);
  await fs.ensureDir(FILE_CONFIG.PROCESSED_DIR);
  await fs.ensureDir(FILE_CONFIG.METADATA_DIR);
}

/**
 * Handles file upload and creates local copy with timestamp
 * @param {Object} file - Multer file object
 * @returns {Object} - Result with file info or error
 */
export async function handleFileUpload(file) {
  try {
    // Validate the uploaded file
    const validation = validateUploadedFile(file);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Ensure directories exist
    await ensureUploadDirectories();

    // Generate timestamped filename
    const baseFilename = getBaseFilename(file.originalname);
    const fileExtension = getFileExtension(file.originalname);
    const timestampedFilename = generateTimestampedFilename(baseFilename, fileExtension);

    // Create file paths
    const originalPath = file.path;
    const processedPath = path.join(FILE_CONFIG.PROCESSED_DIR, timestampedFilename);

    // Copy file to processed directory
    await fs.copy(originalPath, processedPath);

    // Clean up temporary file
    await fs.remove(originalPath);

    return {
      success: true,
      fileInfo: {
        originalName: file.originalname,
        processedName: timestampedFilename,
        processedPath: processedPath,
        size: file.size,
        uploadTime: new Date().toISOString(),
        baseFilename: baseFilename,
        extension: fileExtension
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `File upload failed: ${error.message}`
    };
  }
}

/**
 * Checks if a processed file exists
 * @param {string} filename - Name of the processed file
 * @returns {boolean} - True if file exists
 */
export async function fileExists(filename) {
  const filePath = path.join(FILE_CONFIG.PROCESSED_DIR, filename);
  return await fs.pathExists(filePath);
}

/**
 * Gets file info for a processed file
 * @param {string} filename - Name of the processed file
 * @returns {Object} - File information or null if not found
 */
export async function getFileInfo(filename) {
  try {
    const filePath = path.join(FILE_CONFIG.PROCESSED_DIR, filename);
    const stats = await fs.stat(filePath);
    
    return {
      name: filename,
      path: filePath,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      exists: true
    };
  } catch (error) {
    return {
      name: filename,
      exists: false,
      error: error.message
    };
  }
}