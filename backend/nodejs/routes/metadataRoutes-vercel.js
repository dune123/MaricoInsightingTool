/**
 * ========================================
 * VERCEL-COMPATIBLE METADATA ROUTES
 * ========================================
 * 
 * Purpose: RESTful API endpoints for Vercel serverless environment
 * 
 * Description:
 * This module provides Vercel-compatible versions of metadata routes.
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

// POST /create - Create metadata file (mock response for Vercel)
router.post('/create', (req, res) => {
  res.json({
    success: true,
    data: {
      metadataId: 'mock-metadata-id',
      message: 'Metadata created successfully (mock response)'
    },
    note: 'This is a mock response. File operations require persistent storage.',
    platform: 'vercel',
    timestamp: new Date().toISOString()
  });
});

// GET /:metadataFilename/info - Get metadata info (mock response for Vercel)
router.get('/:metadataFilename/info', (req, res) => {
  res.json({
    success: true,
    data: {
      filename: req.params.metadataFilename,
      info: 'Mock metadata information',
      message: 'Metadata info retrieved (mock response)'
    },
    note: 'This is mock data. File operations require persistent storage.',
    platform: 'vercel',
    timestamp: new Date().toISOString()
  });
});

// POST /:metadataFilename/log - Add log entry (mock response for Vercel)
router.post('/:metadataFilename/log', (req, res) => {
  res.json({
    success: true,
    data: {
      logId: 'mock-log-id',
      message: 'Log entry added successfully (mock response)'
    },
    note: 'This is a mock response. File operations require persistent storage.',
    platform: 'vercel',
    timestamp: new Date().toISOString()
  });
});

// GET /:metadataFilename/download - Download metadata (disabled in Vercel)
router.get('/:metadataFilename/download', (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Download not supported in Vercel serverless environment',
    message: 'This feature requires persistent file storage. Please use Railway or Render for full functionality.',
    platform: 'vercel',
    timestamp: new Date().toISOString()
  });
});

// GET /health - Health check (works in Vercel)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Metadata service health check',
    status: 'healthy',
    platform: 'vercel',
    timestamp: new Date().toISOString(),
    note: 'File operations disabled in serverless environment'
  });
});

export default router;