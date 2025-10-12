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

// POST /create - Create metadata file (disabled in Vercel)
router.post('/create', (req, res) => {
  vercelFileError(req, res);
});

// GET /:metadataFilename/info - Get metadata info (disabled in Vercel)
router.get('/:metadataFilename/info', (req, res) => {
  vercelFileError(req, res);
});

// POST /:metadataFilename/log - Add log entry (disabled in Vercel)
router.post('/:metadataFilename/log', (req, res) => {
  vercelFileError(req, res);
});

// GET /:metadataFilename/download - Download metadata (disabled in Vercel)
router.get('/:metadataFilename/download', (req, res) => {
  vercelFileError(req, res);
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
