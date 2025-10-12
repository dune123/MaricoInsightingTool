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

// POST /validate - Validate brand name (disabled in Vercel)
router.post('/validate', (req, res) => {
  vercelFileError(req, res);
});

// POST /save - Save brand information (disabled in Vercel)
router.post('/save', (req, res) => {
  vercelFileError(req, res);
});

// PUT /update - Update brand name (disabled in Vercel)
router.put('/update', (req, res) => {
  vercelFileError(req, res);
});

// GET /:metadataFilename/export - Export brand data (disabled in Vercel)
router.get('/:metadataFilename/export', (req, res) => {
  vercelFileError(req, res);
});

// POST /suggestions - Get brand suggestions (disabled in Vercel)
router.post('/suggestions', (req, res) => {
  vercelFileError(req, res);
});

// GET /analyses - List analyses (disabled in Vercel)
router.get('/analyses', (req, res) => {
  vercelFileError(req, res);
});

// POST /analyses - Create analysis (disabled in Vercel)
router.post('/analyses', (req, res) => {
  vercelFileError(req, res);
});

// GET /analyses/:id - Get analysis (disabled in Vercel)
router.get('/analyses/:id', (req, res) => {
  vercelFileError(req, res);
});

// DELETE /analyses/:id - Delete analysis (disabled in Vercel)
router.delete('/analyses/:id', (req, res) => {
  vercelFileError(req, res);
});

export default router;