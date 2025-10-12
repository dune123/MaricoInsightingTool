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

// All non-MMM routes disabled in Vercel
router.use('*', (req, res) => {
  vercelFileError(req, res);
});

export default router;