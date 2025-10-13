/**
 * ========================================
 * VERCEL-COMPATIBLE BRAND ROUTES
 * ========================================
 * 
 * Purpose: RESTful API endpoints for Vercel serverless environment
 * 
 * Description:
 * This module provides Vercel-compatible versions of brand routes.
 * File operations are disabled and return appropriate error messages.
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Backend Team
 */

import express from 'express';

const router = express.Router();

// Vercel file operation error response
const vercelFileError = (req, res) => {
  res.status(501).json({
    success: false,
    error: 'File operations not supported in Vercel serverless environment',
    message: 'This backend requires persistent file storage. Please use Railway, Render, or AWS for file operations.',
    platform: 'vercel',
    suggestion: 'Deploy to Railway or Render for full file processing capabilities',
    timestamp: new Date().toISOString()
  });
};

// POST /validate - Validate brand name (mock response for Vercel)
router.post('/validate', (req, res) => {
  res.json({
    success: true,
    data: {
      isValid: true,
      suggestions: [],
      message: 'Brand validation successful (mock response)'
    },
    note: 'This is a mock response. File operations require persistent storage.',
    platform: 'vercel',
    timestamp: new Date().toISOString()
  });
});

// POST /save - Save brand information (mock response for Vercel)
router.post('/save', (req, res) => {
  res.json({
    success: true,
    data: {
      brandId: 'mock-brand-id',
      message: 'Brand saved successfully (mock response)'
    },
    note: 'This is a mock response. File operations require persistent storage.',
    platform: 'vercel',
    timestamp: new Date().toISOString()
  });
});

// PUT /update - Update brand name (mock response for Vercel)
router.put('/update', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Brand updated successfully (mock response)'
    },
    note: 'This is a mock response. File operations require persistent storage.',
    platform: 'vercel',
    timestamp: new Date().toISOString()
  });
});

// GET /:metadataFilename/export - Export brand data (mock response for Vercel)
router.get('/:metadataFilename/export', (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Export not supported in Vercel serverless environment',
    message: 'This feature requires persistent file storage. Please use Railway or Render for full functionality.',
    platform: 'vercel',
    timestamp: new Date().toISOString()
  });
});

// POST /suggestions - Get brand suggestions (mock response for Vercel)
router.post('/suggestions', (req, res) => {
  res.json({
    success: true,
    data: {
      suggestions: ['Sample Brand 1', 'Sample Brand 2', 'Sample Brand 3'],
      message: 'Brand suggestions (mock data)'
    },
    note: 'This is mock data. File operations require persistent storage.',
    platform: 'vercel',
    timestamp: new Date().toISOString()
  });
});

// GET /:brandName/exists - Check if brand exists (mock response for Vercel)
router.get('/:brandName/exists', (req, res) => {
  const { brandName } = req.params;
  const { analysisType } = req.query;
  
  res.json({
    success: true,
    data: {
      exists: false,
      message: `Brand '${brandName}' does not exist (mock response)`
    },
    note: 'This is a mock response. File operations require persistent storage.',
    platform: 'vercel',
    analysisType: analysisType || 'MMM',
    timestamp: new Date().toISOString()
  });
});

// GET /analyses - List analyses (mock data for Vercel)
router.get('/analyses', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'No analyses available in Vercel serverless environment',
    note: 'File operations require persistent storage. Deploy to Railway or Render for full functionality.',
    platform: 'vercel',
    timestamp: new Date().toISOString()
  });
});

// POST /analyses - Create analysis (mock response for Vercel)
router.post('/analyses', (req, res) => {
  const { brandName, analysisType } = req.body;
  
  // Generate a mock analysis ID
  const mockAnalysisId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  res.json({
    success: true,
    data: {
      analysisId: mockAnalysisId,
      brandName: brandName || 'Mock Brand',
      analysisType: analysisType || 'MMM',
      status: 'created',
      message: 'Analysis created successfully (mock response)',
      note: 'This is a mock analysis. File operations require persistent storage.',
      createdAt: new Date().toISOString(),
      currentStep: 1
    },
    platform: 'vercel',
    timestamp: new Date().toISOString()
  });
});

// GET /analyses/:id - Get analysis (mock response for Vercel)
router.get('/analyses/:id', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Analysis not found',
    message: 'File operations not supported in Vercel serverless environment',
    platform: 'vercel',
    timestamp: new Date().toISOString()
  });
});

// DELETE /analyses/:id - Delete analysis (mock response for Vercel)
router.delete('/analyses/:id', (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Analysis deletion not supported in Vercel serverless environment',
    message: 'This feature requires persistent file storage. Please use Railway or Render for full functionality.',
    platform: 'vercel',
    timestamp: new Date().toISOString()
  });
});

export default router;