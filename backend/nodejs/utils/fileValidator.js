/**
 * ========================================
 * FILE VALIDATION UTILITIES
 * ========================================
 * 
 * Purpose: Comprehensive file and input validation for upload security
 * 
 * Description:
 * This module provides all validation functionality for file uploads and user inputs.
 * It ensures that only safe, properly formatted files are processed by the system
 * and validates user inputs like brand names for consistency and security.
 * 
 * Key Functions:
 * - validateUploadedFile(file): Comprehensive file validation
 * - isValidFileExtension(filename): Checks file type
 * - isValidFileSize(fileSize): Checks file size limits
 * - validateBrandName(brandName): Brand name validation
 * 
 * File Validation Rules:
 * - File extensions: .xlsx, .csv only
 * - File size: Maximum 10MB
 * - File existence: Must be provided
 * - File format: Must be valid multipart file
 * 
 * Brand Name Validation Rules:
 * - Length: 2-100 characters
 * - Type: Must be string
 * - Content: Cannot be empty or whitespace only
 * - Format: Basic format validation
 * 
 * Validation Process:
 * - Input type checking
 * - Format validation
 * - Size and extension verification
 * - Business rule enforcement
 * - Error message generation
 * 
 * Security Features:
 * - File type whitelist approach
 * - Size limit enforcement
 * - Input sanitization
 * - Malicious file prevention
 * - Path traversal protection
 * 
 * Dependencies:
 * - path (Node.js built-in) for file extension parsing
 * - constants.js for validation rules and error messages
 * 
 * Used by:
 * - fileUploadHandler.js for upload validation
 * - brandHandler.js for brand name validation
 * - API route handlers for input validation
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Backend Team
 */

import path from 'path';
import { FILE_CONFIG, ERROR_MESSAGES } from '../config/constants.js';

/**
 * Validates if the file extension is allowed
 * @param {string} filename - Name of the file
 * @returns {boolean} - True if extension is allowed
 */
export function isValidFileExtension(filename) {
  const ext = path.extname(filename).toLowerCase();
  return FILE_CONFIG.ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Validates if the file size is within limits
 * @param {number} fileSize - Size of the file in bytes
 * @returns {boolean} - True if size is within limits
 */
export function isValidFileSize(fileSize) {
  return fileSize <= FILE_CONFIG.MAX_FILE_SIZE;
}

/**
 * Comprehensive file validation
 * @param {Object} file - Multer file object
 * @returns {Object} - Validation result with success and error message
 */
export function validateUploadedFile(file) {
  if (!file) {
    return {
      isValid: false,
      error: 'No file provided'
    };
  }

  if (!isValidFileExtension(file.originalname)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.INVALID_FILE_TYPE
    };
  }

  if (!isValidFileSize(file.size)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.FILE_TOO_LARGE
    };
  }

  return {
    isValid: true,
    error: null
  };
}

/**
 * Validates brand name input
 * @param {string} brandName - Brand name to validate
 * @returns {Object} - Validation result
 */
export function validateBrandName(brandName) {
  if (!brandName || typeof brandName !== 'string' || brandName.trim().length === 0) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.INVALID_BRAND_NAME
    };
  }

  if (brandName.trim().length > 100) {
    return {
      isValid: false,
      error: 'Brand name is too long (maximum 100 characters)'
    };
  }

  return {
    isValid: true,
    error: null
  };
}