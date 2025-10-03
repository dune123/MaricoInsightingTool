/**
 * ========================================
 * METADATA MANAGEMENT ROUTES
 * ========================================
 * 
 * Purpose: RESTful API endpoints for concatenation state persistence and metadata operations
 * 
 * Description:
 * This module provides comprehensive API endpoints for managing concatenation state persistence
 * and metadata operations. It serves as the specialized backend for storing and retrieving
 * complete processing states, enabling seamless navigation without data loss. The module
 * handles JSON-based state storage in the Node.js backend while Python handles file operations.
 * 
 * API Endpoints:
 * - POST /create: Create new metadata files for uploaded data
 * - GET /:metadataFilename/info: Retrieve metadata file information and statistics
 * - POST /:metadataFilename/log: Add processing log entries for activity tracking
 * - GET /health: System health check and directory accessibility validation
 * - POST /state/save: Save complete concatenation state with all user selections
 * - GET /state/:originalFileName: Retrieve saved concatenation state for instant restoration
 * - DELETE /state/:originalFileName: Delete saved state when workflow is complete
 * - GET /states: List all saved concatenation states
 * - PUT /state/:originalFileName: Update existing concatenation state
 * - POST /cleanup: Cleanup old concatenation states (configurable age threshold)
 * - GET /state/:originalFileName/export: Export concatenation state as downloadable JSON
 * - GET /:metadataFilename/download: Download metadata files for external analysis
 * 
 * Key Functions:
 * - State persistence for concatenation workflows
 * - Metadata file creation and management
 * - Processing log tracking and history
 * - Health monitoring and validation
 * - File download and export capabilities
 * 
 * State Persistence Features:
 * - Complete ConcatenationState storage with user selections and brand metadata
 * - Automatic directory creation for concatenation_states storage
 * - JSON-based storage for fast read/write operations
 * - Type-safe state structure with BrandMetadata and preview data
 * - Error handling with graceful fallbacks
 * - Non-blocking operations for frontend reliability
 * 
 * File Organization:
 * - State storage: backend/nodejs/metadata/concatenation_states/
 * - JSON files named: {originalFileName}_state.json
 * - Automatic cleanup capabilities for completed workflows
 * 
 * Integration with Python Backend:
 * - Complementary to Python backend file operations
 * - No file duplication - only state metadata storage
 * - Supports concurrent operations without conflicts
 * - Clean separation of concerns (Node.js: metadata, Python: files)
 * 
 * Dependencies:
 * - express for HTTP routing and JSON handling
 * - fs-extra for file system operations and JSON storage
 * - path for file path manipulation
 * - metadataManager.js for legacy metadata operations
 * - constants.js for configuration settings
 * 
 * Used by:
 * - Frontend MetadataService for state persistence
 * - DataConcatenationStep for seamless navigation
 * - System monitoring and health check interfaces
 * - Administrative and debugging tools
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Backend Team
 */

import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { 
  createMetadataFile, 
  getMetadataInfo,
  addProcessingLogEntry 
} from '../services/metadataManager.js';

const router = express.Router();

/**
 * POST /api/metadata/create
 * Create a new metadata file for an uploaded file
 */
router.post('/create', async (req, res) => {
  try {
    const { originalFilename } = req.body;

    if (!originalFilename) {
      return res.status(400).json({
        success: false,
        error: 'originalFilename is required'
      });
    }

    const result = await createMetadataFile(originalFilename);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      message: 'Metadata file created successfully',
      data: result.metadataFile
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
});

/**
 * GET /api/metadata/:metadataFilename/info
 * Get metadata file information
 */
router.get('/:metadataFilename/info', async (req, res) => {
  try {
    const { metadataFilename } = req.params;

    const result = await getMetadataInfo(metadataFilename);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({
      success: true,
      data: result.metadataInfo
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
});

/**
 * POST /api/metadata/:metadataFilename/log
 * Add an entry to the processing log
 */
router.post('/:metadataFilename/log', async (req, res) => {
  try {
    const { metadataFilename } = req.params;
    const { action, details } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'action is required'
      });
    }

    if (!details) {
      return res.status(400).json({
        success: false,
        error: 'details is required'
      });
    }

    const result = await addProcessingLogEntry(metadataFilename, action, details);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({
      success: true,
      message: 'Processing log entry added successfully',
      data: {
        action: result.action,
        timestamp: result.timestamp,
        metadataFilename: metadataFilename
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
 * GET /api/metadata/health
 * Health check for metadata service
 */
router.get('/health', async (req, res) => {
  try {
    // Check if directories exist and are writable
    const { FILE_CONFIG } = await import('../config/constants.js');
    
    const checks = {
      metadataDir: await fs.pathExists(FILE_CONFIG.METADATA_DIR),
      processedDir: await fs.pathExists(FILE_CONFIG.PROCESSED_DIR),
      uploadDir: await fs.pathExists(FILE_CONFIG.UPLOAD_DIR)
    };

    const allHealthy = Object.values(checks).every(check => check === true);

    res.json({
      success: true,
      data: {
        status: allHealthy ? 'healthy' : 'unhealthy',
        checks: checks,
        timestamp: new Date().toISOString(),
        directories: {
          metadata: FILE_CONFIG.METADATA_DIR,
          processed: FILE_CONFIG.PROCESSED_DIR,
          upload: FILE_CONFIG.UPLOAD_DIR
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed: ' + error.message
    });
  }
});

/**
 * POST /api/metadata/state/save
 * Save concatenation state for a processed file
 */
router.post('/state/save', async (req, res) => {
  try {
    const { 
      originalFileName,
      concatenatedFileName,
      selectedSheets,
      targetVariable,
      brandMetadata,
      previewData,
      columnCategories,
      totalRows,
      processedAt
    } = req.body;

    if (!originalFileName || !concatenatedFileName) {
      return res.status(400).json({
        success: false,
        error: 'originalFileName and concatenatedFileName are required'
      });
    }

    // Create state storage directory
    const stateDir = path.join('metadata', 'concatenation_states');
    await fs.ensureDir(stateDir);

    // Create state metadata file
    const stateData = {
      originalFileName,
      concatenatedFileName,
      selectedSheets: selectedSheets || [],
      targetVariable: targetVariable || null,
      brandMetadata: brandMetadata || null,
      previewData: previewData || null,
      columnCategories: columnCategories || null,
      totalRows: totalRows || 0,
      processedAt: processedAt || new Date().toISOString(),
      savedAt: new Date().toISOString(),
      status: 'completed'
    };

    const stateFileName = `${originalFileName.replace(/\.[^/.]+$/, '')}_state.json`;
    const stateFilePath = path.join(stateDir, stateFileName);
    
    await fs.writeJson(stateFilePath, stateData, { spaces: 2 });

    res.json({
      success: true,
      message: 'Concatenation state saved successfully',
      data: {
        stateFileName,
        stateFilePath,
        originalFileName,
        concatenatedFileName,
        savedAt: stateData.savedAt
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to save state: ' + error.message
    });
  }
});

/**
 * GET /api/metadata/state/:originalFileName
 * Retrieve concatenation state for a file
 */
router.get('/state/:originalFileName', async (req, res) => {
  try {
    const { originalFileName } = req.params;
    
    const stateDir = path.join('metadata', 'concatenation_states');
    const stateFileName = `${originalFileName.replace(/\.[^/.]+$/, '')}_state.json`;
    const stateFilePath = path.join(stateDir, stateFileName);

    const exists = await fs.pathExists(stateFilePath);
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'No saved state found for this file'
      });
    }

    const stateData = await fs.readJson(stateFilePath);

    res.json({
      success: true,
      message: 'State retrieved successfully',
      data: stateData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve state: ' + error.message
    });
  }
});

/**
 * DELETE /api/metadata/state/:originalFileName
 * Delete concatenation state for a file
 */
router.delete('/state/:originalFileName', async (req, res) => {
  try {
    const { originalFileName } = req.params;
    
    const stateDir = path.join('metadata', 'concatenation_states');
    const stateFileName = `${originalFileName.replace(/\.[^/.]+$/, '')}_state.json`;
    const stateFilePath = path.join(stateDir, stateFileName);

    const exists = await fs.pathExists(stateFilePath);
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'No saved state found for this file'
      });
    }

    await fs.remove(stateFilePath);

    res.json({
      success: true,
      message: 'State deleted successfully',
      data: {
        originalFileName,
        stateFileName,
        deletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete state: ' + error.message
    });
  }
});

/**
 * GET /api/metadata/states
 * List all saved concatenation states
 */
router.get('/states', async (req, res) => {
  try {
    const stateDir = path.join('metadata', 'concatenation_states');
    await fs.ensureDir(stateDir);
    
    const files = await fs.readdir(stateDir);
    const stateFiles = files.filter(file => file.endsWith('_state.json'));
    
    const states = [];
    for (const file of stateFiles) {
      try {
        const stateData = await fs.readJson(path.join(stateDir, file));
        states.push({
          stateFileName: file,
          originalFileName: stateData.originalFileName,
          savedAt: stateData.savedAt,
          status: stateData.status || 'completed'
        });
      } catch (error) {
        console.warn(`Skipping corrupted state file ${file}`);
      }
    }
    
    // Sort by most recent first
    states.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    
    res.json({
      success: true,
      message: `Found ${states.length} states`,
      data: { states, total_count: states.length }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to list states: ' + error.message
    });
  }
});

/**
 * PUT /api/metadata/state/:originalFileName
 * Update existing concatenation state
 */
router.put('/state/:originalFileName', async (req, res) => {
  try {
    const { originalFileName } = req.params;
    const updates = req.body;
    
    const stateDir = path.join('metadata', 'concatenation_states');
    const stateFileName = `${originalFileName.replace(/\.[^/.]+$/, '')}_state.json`;
    const stateFilePath = path.join(stateDir, stateFileName);
    
    const exists = await fs.pathExists(stateFilePath);
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'State not found'
      });
    }
    
    const currentState = await fs.readJson(stateFilePath);
    const updatedState = {
      ...currentState,
      ...updates,
      lastModified: new Date().toISOString()
    };
    
    await fs.writeJson(stateFilePath, updatedState, { spaces: 2 });
    
    res.json({
      success: true,
      message: 'State updated successfully',
      data: updatedState
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update state: ' + error.message
    });
  }
});

/**
 * POST /api/metadata/cleanup
 * Cleanup old concatenation states
 */
router.post('/cleanup', async (req, res) => {
  try {
    const daysOld = parseInt(req.query.days_old) || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const stateDir = path.join('metadata', 'concatenation_states');
    await fs.ensureDir(stateDir);
    
    const files = await fs.readdir(stateDir);
    const stateFiles = files.filter(file => file.endsWith('_state.json'));
    
    let cleanedCount = 0;
    for (const file of stateFiles) {
      const filePath = path.join(stateDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtime < cutoffDate) {
        await fs.remove(filePath);
        cleanedCount++;
      }
    }
    
    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} old states`,
      data: { cleanedCount, daysOld }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup: ' + error.message
    });
  }
});

/**
 * GET /api/metadata/state/:originalFileName/export
 * Export concatenation state as downloadable file
 */
router.get('/state/:originalFileName/export', async (req, res) => {
  try {
    const { originalFileName } = req.params;
    
    const stateDir = path.join('metadata', 'concatenation_states');
    const stateFileName = `${originalFileName.replace(/\.[^/.]+$/, '')}_state.json`;
    const stateFilePath = path.join(stateDir, stateFileName);
    
    const exists = await fs.pathExists(stateFilePath);
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'State not found'
      });
    }
    
    res.download(stateFilePath, `${originalFileName}_state.json`);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to export: ' + error.message
    });
  }
});

/**
 * GET /api/metadata/:metadataFilename/download
 * Download metadata file
 */
router.get('/:metadataFilename/download', async (req, res) => {
  try {
    const { metadataFilename } = req.params;
    const { FILE_CONFIG } = await import('../config/constants.js');

    const metadataPath = path.join(FILE_CONFIG.METADATA_DIR, metadataFilename);
    
    // Check if file exists
    const exists = await fs.pathExists(metadataPath);
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'Metadata file not found'
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${metadataFilename}"`);

    // Stream the file
    const fileStream = fs.createReadStream(metadataPath);
    fileStream.pipe(res);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Download failed: ' + error.message
    });
  }
});

export default router;