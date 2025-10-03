/**
 * ========================================
 * FILTER MANAGEMENT ROUTES
 * ========================================
 * 
 * Purpose: RESTful API endpoints for intelligent filter column selection and management
 * 
 * Description:
 * This module provides comprehensive API endpoints for managing filter column
 * selections with intelligent suggestions and validation. It enables users to
 * discover the most relevant columns for filtering operations and validates
 * their selections before storing them in metadata files.
 * 
 * API Endpoints:
 * - GET /:filename/suggestions: Get AI-powered column suggestions for filtering
 * - POST /:filename/validate: Validate filter selections without persistence
 * - POST /:filename/save: Save validated filter selections to metadata
 * - GET /:filename/available: List all available columns with statistics
 * 
 * Key Functions:
 * - Intelligent column suggestion generation
 * - Filter selection validation and processing
 * - Metadata storage and persistence
 * - Column availability and statistics
 * - Processing log tracking
 * 
 * Intelligent Features:
 * - Pattern-based column suggestions (date, brand, category, region, channel)
 * - Priority-based recommendation system with confidence scoring
 * - Comprehensive validation with detailed error explanations
 * - Selection tracking and history management
 * - Real-time validation feedback for user interface
 * - Column pattern recognition and categorization
 * 
 * Request Processing:
 * - Column analysis and pattern detection
 * - User selection validation against available columns
 * - Data formatting for metadata storage
 * - Error handling and user feedback
 * - Processing log entry creation
 * 
 * Dependencies:
 * - express for HTTP routing and request handling
 * - filterManager.js for intelligent filtering logic
 * - fileReader.js for column information extraction
 * - metadataManager.js for persistence and logging
 * 
 * Used by:
 * - Frontend filter selection interfaces
 * - Column suggestion components
 * - Data filtering and analysis workflows
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Backend Team
 */

import express from 'express';
import { 
  validateFilterColumns, 
  processFilterSelection, 
  suggestFilterColumns,
  formatFilterDataForStorage 
} from '../services/filterManager.js';
import { readFileColumns } from '../services/fileReader.js';
import { addFilterColumnsToMetadata, addProcessingLogEntry } from '../services/metadataManager.js';

const router = express.Router();

/**
 * GET /api/filters/:filename/suggestions
 * Get suggested filter columns for a file
 */
router.get('/:filename/suggestions', async (req, res) => {
  try {
    const { filename } = req.params;

    // Read file columns first
    const columnsResult = await readFileColumns(filename);
    if (!columnsResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Could not read file columns: ' + columnsResult.error
      });
    }

    // Get suggestions
    const suggestions = suggestFilterColumns(columnsResult.columns);

    res.json({
      success: true,
      data: {
        filename: filename,
        availableColumns: columnsResult.columns,
        totalColumns: columnsResult.columns.length,
        suggestions: suggestions.suggestions,
        totalSuggestions: suggestions.totalSuggestions,
        analysisDate: suggestions.analysisDate
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
 * POST /api/filters/:filename/validate
 * Validate filter column selection without saving
 */
router.post('/:filename/validate', async (req, res) => {
  try {
    const { filename } = req.params;
    const { selectedColumns } = req.body;

    if (!selectedColumns || !Array.isArray(selectedColumns)) {
      return res.status(400).json({
        success: false,
        error: 'selectedColumns array is required'
      });
    }

    // Read file columns first
    const columnsResult = await readFileColumns(filename);
    if (!columnsResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Could not read file columns: ' + columnsResult.error
      });
    }

    // Validate filter selection
    const validation = validateFilterColumns(selectedColumns, columnsResult.columns);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
        availableColumns: columnsResult.columns
      });
    }

    // Process the selection for detailed info
    const processResult = processFilterSelection(selectedColumns, columnsResult.columns);

    res.json({
      success: true,
      message: 'Filter selection is valid',
      data: {
        filename: filename,
        validation: {
          isValid: true,
          selectedColumns: processResult.filterColumns,
          totalSelected: processResult.totalSelected,
          totalAvailable: processResult.totalAvailable,
          selectionPercentage: ((processResult.totalSelected / processResult.totalAvailable) * 100).toFixed(2)
        },
        filterInfo: processResult.filterInfo,
        nonSelectedColumns: processResult.nonSelectedColumns.map(col => col.name)
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
 * POST /api/filters/:filename/save
 * Save filter column selection to metadata
 */
router.post('/:filename/save', async (req, res) => {
  try {
    const { filename } = req.params;
    const { selectedColumns, metadataFilename, userId } = req.body;

    if (!selectedColumns || !Array.isArray(selectedColumns)) {
      return res.status(400).json({
        success: false,
        error: 'selectedColumns array is required'
      });
    }

    if (!metadataFilename) {
      return res.status(400).json({
        success: false,
        error: 'metadataFilename is required'
      });
    }

    // Read file columns first
    const columnsResult = await readFileColumns(filename);
    if (!columnsResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Could not read file columns: ' + columnsResult.error
      });
    }

    // Format data for storage
    const storageResult = formatFilterDataForStorage(
      selectedColumns, 
      columnsResult.columns, 
      userId || 'anonymous'
    );

    if (!storageResult.success) {
      return res.status(400).json({
        success: false,
        error: storageResult.error
      });
    }

    // Save to metadata file
    const metadataResult = await addFilterColumnsToMetadata(metadataFilename, storageResult.data);
    if (!metadataResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save to metadata: ' + metadataResult.error
      });
    }

    // Add processing log entry
    await addProcessingLogEntry(
      metadataFilename,
      'Filter Columns Selected',
      `${selectedColumns.length} columns selected for filtering: ${selectedColumns.join(', ')}`
    );

    res.json({
      success: true,
      message: 'Filter columns saved successfully',
      data: {
        filename: filename,
        metadataFilename: metadataFilename,
        selectedColumns: storageResult.data.selection.selectedColumns,
        totalSelected: storageResult.data.metadata.totalColumnsSelected,
        savedAt: storageResult.data.metadata.timestamp,
        userId: storageResult.data.metadata.userId
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
 * GET /api/filters/:filename/available
 * Get all available columns for filtering
 */
router.get('/:filename/available', async (req, res) => {
  try {
    const { filename } = req.params;

    // Read file columns
    const columnsResult = await readFileColumns(filename);
    if (!columnsResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Could not read file columns: ' + columnsResult.error
      });
    }

    res.json({
      success: true,
      data: {
        filename: filename,
        availableColumns: columnsResult.columns,
        totalColumns: columnsResult.columns.length,
        fileStats: {
          totalRows: columnsResult.totalRows,
          totalColumns: columnsResult.totalColumns,
          sheetName: columnsResult.sheetName || null
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

export default router;