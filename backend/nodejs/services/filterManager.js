/**
 * ========================================
 * FILTER MANAGER SERVICE
 * ========================================
 * 
 * Purpose: Intelligent filter column selection and validation management
 * 
 * Description:
 * This service manages the entire filter column selection workflow, from providing
 * intelligent suggestions based on column name patterns to validating user selections
 * and formatting data for storage. It includes advanced pattern recognition to
 * suggest the most relevant columns for filtering operations.
 * 
 * Key Functions:
 * - validateFilterColumns(selectedColumns, availableColumns): Validates user selections
 * - suggestFilterColumns(availableColumns): Generates intelligent suggestions
 * - processFilterSelection(selectedColumns, availableColumns): Processes and formats selections
 * - formatFilterDataForStorage(selectedColumns, availableColumns, userId): Prepares data for storage
 * 
 * Helper Functions:
 * - calculateConfidence(columnName, pattern): Calculates confidence scores for suggestions
 * 
 * Filter Pattern Recognition:
 * - Date and time columns (priority 1)
 * - Brand, category, region, channel columns (priority 2)
 * - Status and type columns (priority 3)
 * - ID columns (priority 4)
 * 
 * Validation Features:
 * - Column existence verification
 * - Duplicate detection and removal
 * - Selection array validation
 * - Error message generation
 * - Selection processing and formatting
 * 
 * Suggestion System:
 * - Pattern-based column detection
 * - Priority-based ranking
 * - Confidence scoring
 * - Top 5 recommendation limit
 * - Duplicate removal and sorting
 * 
 * Dependencies:
 * - fileValidator.js for basic validation utilities
 * - Built-in JavaScript for pattern matching and data processing
 * 
 * Used by:
 * - filterRoutes.js for all filter-related API endpoints
 * - metadataManager.js for storing filter selections
 * - Frontend components for column selection interface
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Backend Team
 */

import { validateUploadedFile } from '../utils/fileValidator.js';

/**
 * Validates filter column selection
 * @param {Array} selectedColumns - Array of column names selected for filtering
 * @param {Array} availableColumns - Array of all available column names
 * @returns {Object} - Validation result
 */
export function validateFilterColumns(selectedColumns, availableColumns) {
  if (!Array.isArray(selectedColumns)) {
    return {
      isValid: false,
      error: 'Selected columns must be an array'
    };
  }

  if (!Array.isArray(availableColumns)) {
    return {
      isValid: false,
      error: 'Available columns must be an array'
    };
  }

  if (selectedColumns.length === 0) {
    return {
      isValid: false,
      error: 'At least one column must be selected for filtering'
    };
  }

  // Check if all selected columns exist in available columns
  const invalidColumns = selectedColumns.filter(col => !availableColumns.includes(col));
  if (invalidColumns.length > 0) {
    return {
      isValid: false,
      error: `Invalid columns selected: ${invalidColumns.join(', ')}`
    };
  }

  // Check for duplicates
  const uniqueColumns = [...new Set(selectedColumns)];
  if (uniqueColumns.length !== selectedColumns.length) {
    return {
      isValid: false,
      error: 'Duplicate columns found in selection'
    };
  }

  return {
    isValid: true,
    error: null
  };
}

/**
 * Processes filter column selection
 * @param {Array} selectedColumns - Array of column names selected for filtering
 * @param {Array} availableColumns - Array of all available column names
 * @returns {Object} - Processing result with filter info
 */
export function processFilterSelection(selectedColumns, availableColumns) {
  // Validate the selection
  const validation = validateFilterColumns(selectedColumns, availableColumns);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error
    };
  }

  // Remove duplicates and clean column names
  const cleanedColumns = [...new Set(selectedColumns)]
    .map(col => col.trim())
    .filter(col => col.length > 0);

  // Get column information
  const filterInfo = cleanedColumns.map(columnName => {
    const index = availableColumns.indexOf(columnName);
    return {
      name: columnName,
      index: index,
      selected: true,
      selectionOrder: cleanedColumns.indexOf(columnName) + 1
    };
  });

  // Get non-selected columns
  const nonSelectedColumns = availableColumns
    .filter(col => !cleanedColumns.includes(col))
    .map(columnName => {
      const index = availableColumns.indexOf(columnName);
      return {
        name: columnName,
        index: index,
        selected: false,
        selectionOrder: null
      };
    });

  return {
    success: true,
    filterColumns: cleanedColumns,
    filterInfo: filterInfo,
    nonSelectedColumns: nonSelectedColumns,
    totalSelected: cleanedColumns.length,
    totalAvailable: availableColumns.length,
    selectionTimestamp: new Date().toISOString()
  };
}

/**
 * Suggests filter columns based on common patterns
 * @param {Array} availableColumns - Array of all available column names
 * @returns {Object} - Suggested columns with reasoning
 */
export function suggestFilterColumns(availableColumns) {
  const suggestions = [];
  const commonFilterPatterns = [
    { pattern: /date/i, reason: 'Date columns are commonly used for time-based filtering', priority: 1 },
    { pattern: /time/i, reason: 'Time columns are useful for temporal filtering', priority: 1 },
    { pattern: /brand/i, reason: 'Brand columns help segment data by brand', priority: 2 },
    { pattern: /category/i, reason: 'Category columns help group similar items', priority: 2 },
    { pattern: /region/i, reason: 'Region columns enable geographic filtering', priority: 2 },
    { pattern: /channel/i, reason: 'Channel columns help analyze different marketing channels', priority: 2 },
    { pattern: /status/i, reason: 'Status columns help filter by current state', priority: 3 },
    { pattern: /type/i, reason: 'Type columns help categorize data', priority: 3 },
    { pattern: /id$/i, reason: 'ID columns can be useful for unique identification', priority: 4 }
  ];

  // Find matching columns
  availableColumns.forEach(column => {
    commonFilterPatterns.forEach(({ pattern, reason, priority }) => {
      if (pattern.test(column)) {
        suggestions.push({
          columnName: column,
          reason: reason,
          priority: priority,
          confidence: calculateConfidence(column, pattern)
        });
      }
    });
  });

  // Remove duplicates and sort by priority and confidence
  const uniqueSuggestions = suggestions
    .filter((suggestion, index, self) => 
      index === self.findIndex(s => s.columnName === suggestion.columnName)
    )
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // Lower priority number = higher priority
      }
      return b.confidence - a.confidence; // Higher confidence first
    });

  return {
    suggestions: uniqueSuggestions.slice(0, 5), // Top 5 suggestions
    totalSuggestions: uniqueSuggestions.length,
    analysisDate: new Date().toISOString()
  };
}

/**
 * Calculates confidence score for pattern matching
 * @param {string} columnName - Name of the column
 * @param {RegExp} pattern - Pattern that matched
 * @returns {number} - Confidence score (0-1)
 */
function calculateConfidence(columnName, pattern) {
  const matches = columnName.match(pattern);
  if (!matches) return 0;

  // Exact match gets higher confidence
  if (matches[0].toLowerCase() === columnName.toLowerCase()) {
    return 1.0;
  }

  // Partial match confidence based on match length vs total length
  return matches[0].length / columnName.length;
}

/**
 * Validates and formats filter column data for storage
 * @param {Array} selectedColumns - Array of selected column names
 * @param {Array} availableColumns - Array of all available columns
 * @param {string} userId - User ID (optional)
 * @returns {Object} - Formatted data for metadata storage
 */
export function formatFilterDataForStorage(selectedColumns, availableColumns, userId = 'anonymous') {
  const processResult = processFilterSelection(selectedColumns, availableColumns);
  
  if (!processResult.success) {
    return {
      success: false,
      error: processResult.error
    };
  }

  const storageData = {
    metadata: {
      userId: userId,
      timestamp: new Date().toISOString(),
      totalColumnsAvailable: availableColumns.length,
      totalColumnsSelected: processResult.totalSelected,
      selectionPercentage: ((processResult.totalSelected / availableColumns.length) * 100).toFixed(2)
    },
    selection: {
      selectedColumns: processResult.filterColumns,
      selectedColumnsInfo: processResult.filterInfo,
      nonSelectedColumns: processResult.nonSelectedColumns.map(col => col.name)
    },
    validation: {
      isValid: true,
      validationTimestamp: new Date().toISOString()
    }
  };

  return {
    success: true,
    data: storageData
  };
}