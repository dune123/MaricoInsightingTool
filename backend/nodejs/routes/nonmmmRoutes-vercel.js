/**
 * ========================================
 * VERCEL-COMPATIBLE NON-MMM ROUTES
 * ========================================
 * 
 * Purpose: RESTful API endpoints for Vercel serverless environment
 * 
 * Description:
 * This module provides Vercel-compatible versions of non-MMM routes.
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

// GET /state - Get Non-MMM analysis state (mock response for Vercel)
router.get('/state', (req, res) => {
  res.json({
    success: true,
    data: {
      currentStep: 2,
      analysisType: 'non-mmm',
      brandName: 'Demo Brand',
      status: 'active',
      message: 'Non-MMM analysis state (mock response)'
    },
    note: 'This is mock data. File operations require persistent storage.',
    platform: 'vercel',
    timestamp: new Date().toISOString()
  });
});

// POST /state - Save Non-MMM analysis state (mock response for Vercel)
router.post('/state', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'State saved successfully (mock response)',
      savedAt: new Date().toISOString()
    },
    note: 'This is a mock response. File operations require persistent storage.',
    platform: 'vercel',
    timestamp: new Date().toISOString()
  });
});

// GET /data - Get Non-MMM analysis data (mock response for Vercel)
router.get('/data', (req, res) => {
  res.json({
    success: true,
    data: {
      variables: [],
      targetVariable: null,
      dataSummary: null,
      charts: [],
      models: [],
      message: 'No data available (mock response)'
    },
    note: 'This is mock data. File operations require persistent storage.',
    platform: 'vercel',
    timestamp: new Date().toISOString()
  });
});

// POST /data - Save Non-MMM analysis data (mock response for Vercel)
router.post('/data', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Data saved successfully (mock response)',
      savedAt: new Date().toISOString()
    },
    note: 'This is a mock response. File operations require persistent storage.',
    platform: 'vercel',
    timestamp: new Date().toISOString()
  });
});

// All other non-MMM routes disabled in Vercel
router.use('*', (req, res) => {
  vercelFileError(req, res);
});

export default router;