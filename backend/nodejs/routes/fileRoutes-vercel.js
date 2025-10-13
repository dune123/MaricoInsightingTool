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

// POST /upload - File upload (mock response for Vercel)
router.post('/upload', (req, res) => {
  // Generate a mock filename
  const mockFilename = `mock-file-${Date.now()}.xlsx`;
  
  res.json({
    success: true,
    data: {
      filename: mockFilename,
      originalName: 'demo-file.xlsx',
      size: 1024000,
      uploadedAt: new Date().toISOString(),
      message: 'File uploaded successfully (mock response)'
    },
    note: 'This is a mock response. File operations require persistent storage.',
    platform: 'vercel',
    timestamp: new Date().toISOString()
  });
});

// GET /:filename/columns - Get file columns (mock response for Vercel)
router.get('/:filename/columns', (req, res) => {
  const { filename } = req.params;
  
  res.json({
    success: true,
    data: {
      filename: filename,
      columns: [
        { name: 'Date', type: 'datetime' },
        { name: 'Sales', type: 'numeric' },
        { name: 'Price', type: 'numeric' },
        { name: 'Category', type: 'categorical' }
      ],
      message: 'File columns retrieved (mock data)'
    },
    note: 'This is mock data. File operations require persistent storage.',
    platform: 'vercel',
    timestamp: new Date().toISOString()
  });
});

// GET /:filename/sample - Get sample data (mock response for Vercel)
router.get('/:filename/sample', (req, res) => {
  const { filename } = req.params;
  
  res.json({
    success: true,
    data: {
      filename: filename,
      sampleData: [
        { Date: '2024-01-01', Sales: 1000, Price: 10.5, Category: 'A' },
        { Date: '2024-01-02', Sales: 1200, Price: 11.0, Category: 'B' },
        { Date: '2024-01-03', Sales: 900, Price: 9.8, Category: 'A' }
      ],
      message: 'Sample data retrieved (mock data)'
    },
    note: 'This is mock data. File operations require persistent storage.',
    platform: 'vercel',
    timestamp: new Date().toISOString()
  });
});

// GET /:filename/info - Get file info (mock response for Vercel)
router.get('/:filename/info', (req, res) => {
  const { filename } = req.params;
  
  res.json({
    success: true,
    data: {
      filename: filename,
      size: 1024000,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      uploadedAt: new Date().toISOString(),
      message: 'File info retrieved (mock data)'
    },
    note: 'This is mock data. File operations require persistent storage.',
    platform: 'vercel',
    timestamp: new Date().toISOString()
  });
});

// GET /:filename/sheets - Get Excel sheets (mock response for Vercel)
router.get('/:filename/sheets', (req, res) => {
  const { filename } = req.params;
  
  res.json({
    success: true,
    data: {
      filename: filename,
      sheets: [
        { name: 'Sheet1', index: 0 },
        { name: 'Sheet2', index: 1 },
        { name: 'Data', index: 2 }
      ],
      message: 'Excel sheets retrieved (mock data)'
    },
    note: 'This is mock data. File operations require persistent storage.',
    platform: 'vercel',
    timestamp: new Date().toISOString()
  });
});

export default router;