/**
 * ========================================
 * BRAND HANDLER SERVICE
 * ========================================
 * 
 * Purpose: Comprehensive brand name processing, validation, and storage management
 * 
 * Description:
 * This service handles all aspects of brand name processing from initial input
 * validation to storage in metadata files. It provides intelligent validation,
 * formatting suggestions, and maintains brand information history. The service
 * ensures brand names are properly formatted and stored consistently across the system.
 * 
 * Key Functions:
 * - processBrandInput(brandName, metadataFilename, userId): Processes and stores brand names
 * - updateBrandName(newBrandName, metadataFilename, userId): Updates existing brands
 * - validateBrandNameWithSuggestions(brandName): Comprehensive validation with suggestions
 * - formatBrandInfoForDisplay(brandInfo): Formats brand data for display
 * - exportBrandInfo(metadataFilename): Exports brand information
 * 
 * Helper Functions:
 * - getBrandNameSuggestions(brandName): Generates brand name suggestions
 * - cleanBrandName(brandName): Cleans and formats brand names
 * - toProperCase(str): Converts strings to proper case
 * 
 * Validation Features:
 * - Length validation (2-100 characters)
 * - Special character handling and cleaning
 * - Format consistency checking
 * - Business rule validation for brand naming standards
 * - Warning system for potential issues
 * - Input sanitization and security
 * 
 * Brand Processing:
 * - Input validation and cleaning
 * - Format standardization
 * - Metadata file updates
 * - Processing log creation
 * - History tracking and change management
 * 
 * Dependencies:
 * - fileValidator.js for basic validation utilities
 * - metadataManager.js for storing brand information
 * - Built-in string manipulation for cleaning and formatting
 * 
 * Used by:
 * - brandRoutes.js for all brand-related API endpoints
 * - Frontend components for brand name input and validation
 * - Analytics pipeline for brand-specific data processing
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Backend Team
 */

import { validateBrandName } from '../utils/fileValidator.js';
import { addBrandInfoToMetadata, addProcessingLogEntry } from './metadataManager.js';

/**
 * Processes brand name input and stores it in metadata
 * @param {string} brandName - Brand name to process
 * @param {string} metadataFilename - Name of the metadata file
 * @param {string} userId - User ID (optional)
 * @returns {Object} - Result with success or error
 */
export async function processBrandInput(brandName, metadataFilename, userId = 'anonymous') {
  try {
    // Validate brand name
    const validation = validateBrandName(brandName);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Clean and format brand name
    const cleanedBrandName = cleanBrandName(brandName);

    // Store brand information in metadata file
    const metadataResult = await addBrandInfoToMetadata(metadataFilename, cleanedBrandName, userId);
    if (!metadataResult.success) {
      return {
        success: false,
        error: metadataResult.error
      };
    }

    // Add processing log entry
    await addProcessingLogEntry(
      metadataFilename,
      'Brand Name Added',
      `Brand name "${cleanedBrandName}" added by user ${userId}`
    );

    return {
      success: true,
      brandInfo: {
        originalInput: brandName,
        cleanedName: cleanedBrandName,
        userId: userId,
        timestamp: new Date().toISOString(),
        metadataUpdated: true
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to process brand input: ${error.message}`
    };
  }
}

/**
 * Updates existing brand name in metadata
 * @param {string} newBrandName - New brand name
 * @param {string} metadataFilename - Name of the metadata file
 * @param {string} userId - User ID (optional)
 * @returns {Object} - Result with success or error
 */
export async function updateBrandName(newBrandName, metadataFilename, userId = 'anonymous') {
  try {
    // Validate new brand name
    const validation = validateBrandName(newBrandName);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Clean and format brand name
    const cleanedBrandName = cleanBrandName(newBrandName);

    // Update brand information in metadata file
    const metadataResult = await addBrandInfoToMetadata(metadataFilename, cleanedBrandName, userId);
    if (!metadataResult.success) {
      return {
        success: false,
        error: metadataResult.error
      };
    }

    // Add processing log entry
    await addProcessingLogEntry(
      metadataFilename,
      'Brand Name Updated',
      `Brand name updated to "${cleanedBrandName}" by user ${userId}`
    );

    return {
      success: true,
      brandInfo: {
        originalInput: newBrandName,
        cleanedName: cleanedBrandName,
        userId: userId,
        timestamp: new Date().toISOString(),
        action: 'updated',
        metadataUpdated: true
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to update brand name: ${error.message}`
    };
  }
}

/**
 * Validates brand name format and business rules
 * @param {string} brandName - Brand name to validate
 * @returns {Object} - Extended validation result with suggestions
 */
export function validateBrandNameWithSuggestions(brandName) {
  const basicValidation = validateBrandName(brandName);
  
  if (!basicValidation.isValid) {
    return {
      ...basicValidation,
      suggestions: getBrandNameSuggestions(brandName)
    };
  }

  // Additional business rule validations
  const warnings = [];
  const suggestions = [];

  const cleanedName = cleanBrandName(brandName);

  // Check for common issues
  if (cleanedName !== brandName) {
    warnings.push('Brand name will be cleaned/formatted for consistency');
    suggestions.push(`Suggested format: "${cleanedName}"`);
  }

  if (cleanedName.length < 2) {
    warnings.push('Brand name is very short');
    suggestions.push('Consider using a more descriptive brand name');
  }

  if (cleanedName.length > 50) {
    warnings.push('Brand name is quite long');
    suggestions.push('Consider using a shorter, more memorable brand name');
  }

  // Check for special characters that might cause issues
  if (/[<>:"/\\|?*]/.test(cleanedName)) {
    warnings.push('Brand name contains characters that might cause file system issues');
    suggestions.push('Consider removing special characters');
  }

  return {
    isValid: true,
    error: null,
    warnings: warnings,
    suggestions: suggestions,
    cleanedName: cleanedName
  };
}

/**
 * Gets brand name suggestions based on common issues
 * @param {string} brandName - Original brand name
 * @returns {Array} - Array of suggestions
 */
function getBrandNameSuggestions(brandName) {
  const suggestions = [];

  if (!brandName || brandName.trim() === '') {
    suggestions.push('Enter a brand name (e.g., "Nike", "Apple", "Coca-Cola")');
    return suggestions;
  }

  const trimmed = brandName.trim();
  if (trimmed !== brandName) {
    suggestions.push(`Remove extra spaces: "${trimmed}"`);
  }

  if (trimmed.length > 100) {
    suggestions.push(`Shorten to under 100 characters: "${trimmed.substring(0, 50)}..."`);
  }

  // Suggest proper case if all caps or all lowercase
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 3) {
    suggestions.push(`Consider proper case: "${toProperCase(trimmed)}"`);
  }

  if (trimmed === trimmed.toLowerCase() && trimmed.length > 3) {
    suggestions.push(`Consider proper case: "${toProperCase(trimmed)}"`);
  }

  return suggestions;
}

/**
 * Cleans and formats brand name for consistency
 * @param {string} brandName - Brand name to clean
 * @returns {string} - Cleaned brand name
 */
function cleanBrandName(brandName) {
  return brandName
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>:"/\\|?*]/g, '') // Remove problematic characters
    .substring(0, 100); // Limit length
}

/**
 * Converts string to proper case
 * @param {string} str - String to convert
 * @returns {string} - String in proper case
 */
function toProperCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Formats brand information for display
 * @param {Object} brandInfo - Brand information object
 * @returns {Object} - Formatted brand information
 */
export function formatBrandInfoForDisplay(brandInfo) {
  return {
    displayName: brandInfo.cleanedName || brandInfo.originalInput,
    originalInput: brandInfo.originalInput,
    enteredBy: brandInfo.userId,
    enteredAt: brandInfo.timestamp,
    status: 'Active',
    lastModified: brandInfo.timestamp,
    hasWarnings: (brandInfo.warnings && brandInfo.warnings.length > 0),
    warnings: brandInfo.warnings || [],
    suggestions: brandInfo.suggestions || []
  };
}

/**
 * Exports brand information for external use
 * @param {string} metadataFilename - Name of the metadata file
 * @returns {Object} - Brand information for export
 */
export async function exportBrandInfo(metadataFilename) {
  try {
    // This would read from the metadata file and extract brand info
    // For now, returning a placeholder structure
    return {
      success: true,
      brandExport: {
        exportTimestamp: new Date().toISOString(),
        metadataFile: metadataFilename,
        note: 'Brand export functionality - to be implemented with full metadata reading'
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to export brand info: ${error.message}`
    };
  }
}