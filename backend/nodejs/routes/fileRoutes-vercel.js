/**
 * ========================================
 * VERCEL-COMPATIBLE FILE UPLOAD ROUTES
 * ========================================
 * 
 * Purpose: RESTful API endpoints for Vercel serverless environment
 * 
 * Description:
 * This module provides Vercel-compatible versions of file upload routes.
 * File operations are disabled and return appropriate error messages
 * since Vercel serverless functions don't support persistent file storage.
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Backend Team
 */

import express from 'express';
import { FILE_CONFIG } from '../config/constants.js';

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

// POST /upload - File upload (disabled in Vercel)
router.post('/upload', (req, res) => {
  vercelFileError(req, res);
});

// GET /:filename/columns - Get file columns (disabled in Vercel)
router.get('/:filename/columns', (req, res) => {
  vercelFileError(req, res);
});

// GET /:filename/sample - Get sample data (disabled in Vercel)
router.get('/:filename/sample', (req, res) => {
  vercelFileError(req, res);
});

// GET /:filename/info - Get file info (disabled in Vercel)
router.get('/:filename/info', (req, res) => {
  vercelFileError(req, res);
});

// GET /:filename/sheets - Get Excel sheets (disabled in Vercel)
router.get('/:filename/sheets', (req, res) => {
  vercelFileError(req, res);
});

export default router;