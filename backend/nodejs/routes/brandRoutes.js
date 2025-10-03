/**
 * ========================================
 * BRAND ANALYSIS LIFECYCLE ROUTES
 * ========================================
 * 
 * Purpose: RESTful API endpoints for brand analysis lifecycle management
 * 
 * Description:
 * This module provides comprehensive API endpoints for managing the complete brand analysis
 * lifecycle from creation to deletion. It handles analysis metadata, progress tracking,
 * step management, and state persistence using the Node.js backend for optimal performance.
 * 
 * API Endpoints:
 * - POST /api/brands/analyses: Create new brand analysis
 * - GET /api/brands/analyses: List all existing analyses
 * - GET /api/brands/analyses/:analysisId: Get specific analysis details
 * - PUT /api/brands/analyses/:analysisId: Update analysis metadata and state
 * - DELETE /api/brands/analyses/:analysisId: Delete analysis and cleanup
 * - GET /api/brands/:brandName/exists: Check if brand analysis already exists
 * 
 * Key Functions:
 * - Analysis creation with directory structure setup
 * - Progress tracking and step management
 * - State persistence and retrieval
 * - Analysis listing and metadata management
 * - Cleanup and deletion operations
 * 
 * Architecture Alignment:
 * - Node.js backend: ALL state management and metadata operations
 * - Python backend: File processing and data analysis only
 * - Clean separation of concerns for optimal performance
 * 
 * State Management Features:
 * - Complete analysis metadata storage
 * - Progress tracking with step validation
 * - Current step calculation based on progress
 * - Concatenation state integration
 * - Filter state management
 * 
 * File Organization:
 * - Analysis storage: backend/nodejs/metadata/analyses/
 * - JSON files named: {analysisId}.json
 * - Integration with concatenation states
 * - Automatic cleanup capabilities
 * 
 * Dependencies:
 * - express for HTTP routing and JSON handling
 * - fs-extra for file system operations
 * - path for file path manipulation
 * - brandHandler.js for brand operations
 * - constants.js for configuration
 * 
 * Used by:
 * - Frontend BrandAnalysisService for analysis lifecycle
 * - AnalysisTypeStep for creation and resume
 * - ExistingAnalysisSelection for listing and selection
 * - All wizard steps for state updates
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Backend Team
 */

import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// ES6 module __dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * Helper function to create analysis ID from brand name and analysis type
 * This ensures MMM and NonMMM analyses can coexist for the same brand
 */
function createAnalysisId(brandName, analysisType = 'MMM') {
  const brandPart = brandName.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .trim();
  
  const typePart = analysisType.toLowerCase().replace(/_/g, '-');
  return `${brandPart}-${typePart}`;
}

/**
 * Helper function to calculate current step based on progress
 * Handles both MMM and NON_MMM analysis types with different step progressions
 */
function calculateCurrentStep(progress, analysisType = 'MMM') {
  // CRITICAL: Step 2 (data upload) must be complete for analysis to be resumable
  if (!progress.dataUploaded) {
    return 2; // Data upload step - MUST be completed for resume
  }
  
  // For NON_MMM analysis, use different step progression
  if (analysisType === 'NON_MMM') {
    // Non-MMM steps: 2=Upload, 3=Data Summary (includes target variable + expected signs), 4=Chart Analysis, 5=Model Building, 6=Download
    if (!progress.dataSummaryCompleted) {
      return 3; // Data summary step (includes target variable selection and expected signs)
    } else if (!progress.chartAnalysisCompleted) {
      return 4; // Chart analysis step
    } else if (!progress.modelBuildingCompleted) {
      return 5; // Model building step
    } else {
      return 6; // Download analysis step (final for non-MMM)
    }
  }
  
  // For MMM analysis, use original logic
  if (!progress.concatenationCompleted) {
    return 5; // Should be at data concatenation step
  } else if (progress.concatenationCompleted) {
    // If concatenation is complete, user should continue from concatenation page
    // to review their processed data and make any adjustments
    return 5; // Stay at data concatenation step to review results
  } else if (!progress.filtersApplied) {
    return 6; // Data summary step
  } else if (!progress.modelBuilt) {
    return 11; // Model building step
  } else if (!progress.resultsGenerated) {
    return 12; // Model results step
  } else {
    return 13; // Optimizer step (final)
  }
}

/**
 * Helper function to clean up files in a directory based on analysis ID and brand name
 * @param {string} directoryPath - Path to the directory to clean
 * @param {string} analysisId - Analysis ID to match against
 * @param {string} brandName - Brand name to match against
 * @param {string} fileType - Type of files being cleaned (for logging)
 * @returns {Array} Array of cleaned up file names
 */
async function cleanupFilesByAnalysis(directoryPath, analysisId, brandName, fileType) {
  const cleanupSummary = [];
  
  if (!(await fs.pathExists(directoryPath))) {
    return cleanupSummary;
  }
  
  const files = await fs.readdir(directoryPath);
  
  for (const file of files) {
    if (file.endsWith('.json')) {
      // Extract brand name from analysisId (remove 'nonmmm_' prefix if present)
      const brandFromAnalysisId = analysisId.replace(/^nonmmm_/, '').toLowerCase();
      const brandFromData = brandName ? brandName.toLowerCase().replace(/\s+/g, '_') : '';
      
      // Check if file matches any of these patterns:
      // 1. {analysisId}_*.json
      // 2. {brand}_*.json
      // 3. {analysisId}.json
      const fileMatches = 
        file.toLowerCase().includes(brandFromAnalysisId) ||
        (brandFromData && file.toLowerCase().includes(brandFromData)) ||
        file.toLowerCase().includes(analysisId.toLowerCase());
      
      if (fileMatches) {
        try {
          const filePath = path.join(directoryPath, file);
          await fs.remove(filePath);
          cleanupSummary.push(`${fileType}: ${file}`);
          console.log(`✅ Deleted ${fileType}: ${file}`);
        } catch (error) {
          console.warn(`⚠️ Failed to delete ${fileType} ${file}:`, error.message);
        }
      }
    }
  }
  
  return cleanupSummary;
}

/**
 * Helper function to detect progress from actual files and update progress flags
 * This ensures progress is accurately reflected based on what files actually exist
 */
async function detectAndUpdateProgress(analysisData) {
  const { analysisId, brandName, analysisType } = analysisData;
  
  if (!analysisId || !brandName) {
    return analysisData;
  }
  
  try {
    const progress = analysisData.progress || {};
    
    // Check for uploaded files in brand-specific directory structure
    const safeBrandName = brandName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const brandDataDir = path.join(__dirname, '..', '..', 'python', safeBrandName, 'data');
    const rawUploadsDir = path.join(brandDataDir, 'uploads', 'raw');
    
    // Check if raw uploads directory exists and has files
    if (await fs.pathExists(rawUploadsDir)) {
      const files = await fs.readdir(rawUploadsDir);
      const dataFiles = files.filter(file => 
        file.endsWith('.xlsx') || file.endsWith('.csv')
      );
      
      if (dataFiles.length > 0) {
        progress.dataUploaded = true;
        console.log(`✅ Found uploaded files in brand directory: ${dataFiles.length} files`);
      }
    }
    
    // For non-MMM analysis, check for non-MMM state files
    if (analysisType === 'NON_MMM' && progress.dataUploaded) {
      const nonmmmStatesDir = path.join(brandDataDir, 'metadata', 'nonmmm_summaries');
      const nonmmmStateFile = path.join(nonmmmStatesDir, `${analysisId}.json`);
      
      if (await fs.pathExists(nonmmmStateFile)) {
        try {
          const nonmmmState = await fs.readJson(nonmmmStateFile);
          
          // Update progress based on non-MMM state using correct flags
          if (nonmmmState.dataUploadCompleted) {
            progress.concatenationCompleted = true;
          }
          
          // Check for data summary completion (target variable + expected signs)
          if (nonmmmState.targetVariable && nonmmmState.expectedSigns && Object.keys(nonmmmState.expectedSigns).length > 0) {
            progress.dataSummaryCompleted = true;
          }
          
          // Check for chart analysis completion
          if (nonmmmState.chartData) {
            progress.chartAnalysisCompleted = true;
          }
          
          // Check for model building completion
          if (nonmmmState.modelResults) {
            progress.modelBuildingCompleted = true;
          }
          
          console.log(`✅ Found non-MMM state file with progress data`);
        } catch (error) {
          console.warn(`Warning: Could not read non-MMM state file: ${error.message}`);
        }
      }
      
      // Check for model files in the raw directory
      const modelsDir = path.join(rawUploadsDir, 'models');
      if (await fs.pathExists(modelsDir)) {
        const modelFiles = await fs.readdir(modelsDir);
        const jsonModels = modelFiles.filter(file => file.endsWith('.json'));
        
        if (jsonModels.length > 0) {
          progress.modelBuilt = true;
          progress.resultsGenerated = true;
          console.log(`✅ Found model files in brand directory: ${jsonModels.length} models`);
        }
      }
    }
    
    // Update the analysis data with detected progress
    analysisData.progress = progress;
    
    return analysisData;
    
  } catch (error) {
    console.warn(`Warning: Could not detect progress for analysis ${analysisId}: ${error.message}`);
    return analysisData;
  }
}

/**
 * Helper function to get analysis directory path
 */
function getAnalysisDir() {
  return path.join('metadata', 'analyses');
}

/**
 * Helper function to ensure analysis directory exists
 */
async function ensureAnalysisDir() {
  const analysisDir = getAnalysisDir();
  await fs.ensureDir(analysisDir);
  return analysisDir;
}

/**
 * POST /api/brands/analyses
 * Create a new brand analysis
 */
router.post('/analyses', async (req, res) => {
  try {
    const { brandName, analysisType = 'MMM', forceOverwrite = false } = req.body;

    if (!brandName || brandName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Brand name is required'
      });
    }

    const trimmedBrandName = brandName.trim();
    const analysisId = createAnalysisId(trimmedBrandName, analysisType);

    // Ensure analysis directory exists
    const analysisDir = await ensureAnalysisDir();
    const analysisFile = path.join(analysisDir, `${analysisId}.json`);

    // Check if analysis already exists
    const exists = await fs.pathExists(analysisFile);
    if (exists && !forceOverwrite) {
      return res.status(409).json({
        success: false,
        error: 'Analysis already exists',
        data: {
          analysisId,
          brandName: trimmedBrandName,
          exists: true
        }
      });
    }

    // Create brand directory structure (delegated to Python backend)
    // Note: This will be handled by Python backend when files are uploaded
    
    // Create analysis metadata
    const now = new Date().toISOString();
    const analysisData = {
      analysisId,
      brandName: trimmedBrandName,
      analysisType,
      createdAt: now,
      lastModified: now,
      currentStep: 1, // Start at Data Upload step
      status: 'created',
      files: {
        originalFileName: null,
        concatenatedFileName: null,
        uploadedFiles: [],
        processedFiles: []
      },
      progress: {
        dataUploaded: false,
        concatenationCompleted: false,
        targetVariableSelected: false,
        filtersApplied: false,
        brandCategorized: false,
        modelBuilt: false,
        resultsGenerated: false
      },
      concatenationState: null,
      filterState: null,
      modelState: null
    };

    // Save analysis metadata
    await fs.writeJson(analysisFile, analysisData, { spaces: 2 });

    res.json({
      success: true,
      message: 'Analysis created successfully',
      data: analysisData
    });

  } catch (error) {
    console.error('Error creating analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create analysis: ' + error.message
    });
  }
});

/**
 * GET /api/brands/analyses
 * List all existing analyses
 */
router.get('/analyses', async (req, res) => {
  try {
    const analysisDir = await ensureAnalysisDir();
    
    const files = await fs.readdir(analysisDir);
    const analysisFiles = files.filter(file => file.endsWith('.json'));
    
    const analyses = [];
    for (const file of analysisFiles) {
      try {
        const analysisPath = path.join(analysisDir, file);
        const analysisData = await fs.readJson(analysisPath);
        
        // Detect and update progress from actual files
        const updatedAnalysisData = await detectAndUpdateProgress(analysisData);
        
        // Calculate current step based on updated progress and analysis type
        updatedAnalysisData.currentStep = calculateCurrentStep(
          updatedAnalysisData.progress || {}, 
          updatedAnalysisData.analysisType
        );
        
        // Add to list
        analyses.push({
          analysisId: updatedAnalysisData.analysisId,
          brandName: updatedAnalysisData.brandName,
          analysisType: updatedAnalysisData.analysisType,
          currentStep: updatedAnalysisData.currentStep,
          status: updatedAnalysisData.status,
          lastModified: updatedAnalysisData.lastModified,
          createdAt: updatedAnalysisData.createdAt
        });
      } catch (error) {
        console.warn(`Skipping corrupted analysis file ${file}:`, error.message);
      }
    }
    
    // Sort by most recent first
    analyses.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    
    res.json({
      success: true,
      message: `Found ${analyses.length} analyses`,
      data: analyses
    });

  } catch (error) {
    console.error('Error listing analyses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list analyses: ' + error.message
    });
  }
});

/**
 * GET /api/brands/analyses/:analysisId
 * Get specific analysis details
 */
router.get('/analyses/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;
    
    const analysisDir = await ensureAnalysisDir();
    const analysisFile = path.join(analysisDir, `${analysisId}.json`);
    
    const exists = await fs.pathExists(analysisFile);
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }
    
    const analysisData = await fs.readJson(analysisFile);
    
    // Detect and update progress from actual files
    const updatedAnalysisData = await detectAndUpdateProgress(analysisData);
    
    // Calculate current step based on updated progress and analysis type
    updatedAnalysisData.currentStep = calculateCurrentStep(
      updatedAnalysisData.progress || {}, 
      updatedAnalysisData.analysisType
    );
    
    // Update last modified timestamp
    updatedAnalysisData.lastModified = new Date().toISOString();
    
    // Save updated analysis data if progress was detected
    if (updatedAnalysisData.progress !== analysisData.progress) {
      await fs.writeJson(analysisFile, updatedAnalysisData, { spaces: 2 });
      console.log(`✅ Updated analysis progress for ${analysisId}: step ${updatedAnalysisData.currentStep}`);
    }
    
    res.json({
      success: true,
      message: 'Analysis retrieved successfully',
      data: updatedAnalysisData
    });

  } catch (error) {
    console.error('Error getting analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analysis: ' + error.message
    });
  }
});

/**
 * PUT /api/brands/analyses/:analysisId
 * Update analysis metadata and state
 */
router.put('/analyses/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;
    const updates = req.body;
    
    const analysisDir = await ensureAnalysisDir();
    const analysisFile = path.join(analysisDir, `${analysisId}.json`);
    
    const exists = await fs.pathExists(analysisFile);
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }
    
    const currentAnalysis = await fs.readJson(analysisFile);
    
    // Merge updates with current data
    const updatedAnalysis = {
      ...currentAnalysis,
      ...updates,
      lastModified: new Date().toISOString()
    };
    
    // Recalculate current step if progress was updated
    if (updates.progress) {
      updatedAnalysis.currentStep = calculateCurrentStep(updatedAnalysis.progress);
    }
    
    // Save updated analysis
    await fs.writeJson(analysisFile, updatedAnalysis, { spaces: 2 });
    
    res.json({
      success: true,
      message: 'Analysis updated successfully', 
      data: updatedAnalysis
    });

  } catch (error) {
    console.error('Error updating analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update analysis: ' + error.message
    });
  }
});

/**
 * DELETE /api/brands/analyses/:analysisId
 * Delete analysis and comprehensive cleanup
 * 
 * COMPREHENSIVE CLEANUP IMPLEMENTATION:
 * - Deletes analysis metadata file
 * - Cleans up concatenation states
 * - Removes non-MMM states and preferences
 * - 🆕 CALLS PYTHON BACKEND to delete actual data folders
 * - Provides detailed cleanup summary
 */
router.delete('/analyses/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;
    
    const analysisDir = await ensureAnalysisDir();
    const analysisFile = path.join(analysisDir, `${analysisId}.json`);
    
    const exists = await fs.pathExists(analysisFile);
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }
    
    // Get analysis data for cleanup
    const analysisData = await fs.readJson(analysisFile);
    const cleanupSummary = [];
    
    // 🆕 STEP 1: CALL PYTHON BACKEND TO DELETE DATA FOLDERS (BEFORE DELETING METADATA)
    // This ensures Python backend can still access brand name from metadata
    try {
      console.log(`🔄 Calling Python backend to delete data folders for analysis: ${analysisId}`);
      
      const pythonBackendUrl = 'http://localhost:8000';
      const pythonResponse = await fetch(`${pythonBackendUrl}/api/analyses/${analysisId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (pythonResponse.ok) {
        const pythonResult = await pythonResponse.json();
        console.log(`✅ Python backend deletion successful:`, pythonResult.message);
        
        // Add Python backend cleanup results to summary
        if (pythonResult.data && pythonResult.data.cleanup_summary) {
          cleanupSummary.push(`🐍 Python Backend: ${pythonResult.data.cleanup_summary.join(', ')}`);
        }
      } else {
        console.warn(`⚠️ Python backend deletion failed: ${pythonResponse.status} - ${pythonResponse.statusText}`);
        cleanupSummary.push(`⚠️ Python Backend: Deletion failed (${pythonResponse.status})`);
      }
    } catch (pythonError) {
      console.warn(`⚠️ Failed to call Python backend for deletion:`, pythonError.message);
      cleanupSummary.push(`⚠️ Python Backend: Connection failed`);
    }
    
    // STEP 2: Delete analysis metadata file (AFTER Python backend has processed it)
    await fs.remove(analysisFile);
    cleanupSummary.push(`Analysis metadata: ${analysisId}.json`);
    
    // 🆕 COMPREHENSIVE CLEANUP: Remove any remaining analysis files in analyses directory
    const analysesDir = path.join(__dirname, '..', 'metadata', 'analyses');
    const analysisCleanup = await cleanupFilesByAnalysis(analysesDir, analysisId, analysisData.brandName, 'Analysis file');
    cleanupSummary.push(...analysisCleanup);
    
    // 🆕 COMPREHENSIVE CLEANUP: Remove concatenation states
    const concatenationStatesDir = path.join(__dirname, '..', 'metadata', 'concatenation_states');
    const concatenationCleanup = await cleanupFilesByAnalysis(concatenationStatesDir, analysisId, analysisData.brandName, 'Concatenation state');
    cleanupSummary.push(...concatenationCleanup);
    
    // 🆕 COMPREHENSIVE CLEANUP: Remove non-MMM states
    const nonmmmStatesDir = path.join(__dirname, '..', 'metadata', 'nonmmm_states');
    const nonmmmCleanup = await cleanupFilesByAnalysis(nonmmmStatesDir, analysisId, analysisData.brandName, 'Non-MMM state');
    cleanupSummary.push(...nonmmmCleanup);
    
    // 🆕 COMPREHENSIVE CLEANUP: Remove non-MMM preferences
    const nonmmmPrefsDir = path.join(__dirname, '..', 'metadata', 'nonmmm_preferences');
    const prefsCleanup = await cleanupFilesByAnalysis(nonmmmPrefsDir, analysisId, analysisData.brandName, 'Non-MMM preferences');
    cleanupSummary.push(...prefsCleanup);
    
    console.log(`🎯 Analysis '${analysisId}' deletion complete. Cleaned up: ${cleanupSummary.join(', ')}`);
    
    res.json({
      success: true,
      message: 'Analysis deleted successfully with comprehensive cleanup',
      data: {
        analysisId,
        brandName: analysisData.brandName,
        deletedAt: new Date().toISOString(),
        cleanupSummary,
        totalItemsCleaned: cleanupSummary.length,
        pythonBackendCalled: true
      }
    });

  } catch (error) {
    console.error('❌ Error deleting analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete analysis: ' + error.message
    });
  }
});

/**
 * GET /api/brands/:brandName/exists
 * Check if brand analysis already exists
 */
router.get('/:brandName/exists', async (req, res) => {
  try {
    const { brandName } = req.params;
    const { analysisType = 'MMM' } = req.query; // Get analysis type from query params
    const analysisId = createAnalysisId(brandName, analysisType);
    
    const analysisDir = await ensureAnalysisDir();
    const analysisFile = path.join(analysisDir, `${analysisId}.json`);
    
    const exists = await fs.pathExists(analysisFile);
    
    if (exists) {
      const analysisData = await fs.readJson(analysisFile);
      
      // Detect and update progress from actual files
      const updatedAnalysisData = await detectAndUpdateProgress(analysisData);
      
      // Calculate current step based on updated progress and analysis type
      updatedAnalysisData.currentStep = calculateCurrentStep(
        updatedAnalysisData.progress || {}, 
        updatedAnalysisData.analysisType
      );
      
      res.json({
        success: true,
        message: 'Brand analysis exists',
        data: {
          exists: true,
          analysisId,
          brandName: updatedAnalysisData.brandName,
          currentStep: updatedAnalysisData.currentStep,
          status: updatedAnalysisData.status,
          lastModified: updatedAnalysisData.lastModified,
          analysisType: updatedAnalysisData.analysisType
        }
      });
    } else {
      res.json({
        success: true,
        message: 'Brand analysis does not exist',
        data: {
          exists: false,
          analysisId,
          brandName
        }
      });
    }

  } catch (error) {
    console.error('Error checking brand existence:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check brand existence: ' + error.message
    });
  }
});

export default router;