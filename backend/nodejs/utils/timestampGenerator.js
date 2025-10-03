/**
 * ========================================
 * TIMESTAMP GENERATION UTILITIES
 * ========================================
 * 
 * Purpose: Consistent timestamp generation for file naming and tracking
 * 
 * Description:
 * This module provides standardized timestamp generation functionality used
 * throughout the application for creating unique, time-based file names and
 * tracking processing activities. All timestamps follow a consistent format
 * to ensure proper sorting and readability.
 * 
 * Key Functions:
 * - generateTimestamp(): Creates standardized timestamps (YYYYMMDD_HHMMSS)
 * - generateTimestampedFilename(originalName, extension): Creates unique filenames
 * - getBaseFilename(filename): Extracts base name without extension
 * - getFileExtension(filename): Extracts file extension
 * 
 * Timestamp Format:
 * - Format: YYYYMMDD_HHMMSS
 * - Example: 20241220_143052
 * - Components: Year, Month, Day, Hour, Minute, Second
 * - Zero-padding: Ensures consistent 15-character length
 * 
 * Filename Generation:
 * - Format: {originalName}_{YYYYMMDD_HHMMSS}.{extension}
 * - Example: sales_data_20241220_143052.xlsx
 * - Uniqueness: Timestamp ensures no filename conflicts
 * - Sorting: Chronological ordering by filename
 * 
 * File Processing:
 * - Base name extraction without extension
 * - Extension parsing and validation
 * - Path manipulation and normalization
 * - Filename sanitization and cleaning
 * 
 * Usage Examples:
 * - Processed files: filename_timestamp.ext
 * - Metadata files: filename_metadata_timestamp.xlsx
 * - State files: filename_state.json
 * - Log files: filename_log_timestamp.txt
 * 
 * Dependencies: None (uses built-in Date object only)
 * 
 * Used by:
 * - fileUploadHandler.js for creating timestamped file copies
 * - metadataManager.js for metadata file naming
 * - All services requiring consistent timestamp formatting
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Backend Team
 */

/**
 * Generates a timestamp string for file naming
 * @returns {string} - Timestamp in format YYYYMMDD_HHMMSS
 */
export function generateTimestamp() {
  const now = new Date();
  
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * Generates a filename with timestamp
 * @param {string} originalName - Original filename without extension
 * @param {string} extension - File extension (including dot)
 * @returns {string} - Filename with timestamp
 */
export function generateTimestampedFilename(originalName, extension) {
  const timestamp = generateTimestamp();
  return `${originalName}_${timestamp}${extension}`;
}

/**
 * Extracts base filename without extension
 * @param {string} filename - Full filename with extension
 * @returns {string} - Base filename without extension
 */
export function getBaseFilename(filename) {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return filename;
  }
  return filename.substring(0, lastDotIndex);
}

/**
 * Gets file extension from filename
 * @param {string} filename - Full filename
 * @returns {string} - File extension including dot
 */
export function getFileExtension(filename) {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return '';
  }
  return filename.substring(lastDotIndex);
}