/**
 * ========================================
 * VERCEL-COMPATIBLE SERVER APPLICATION
 * ========================================
 * 
 * Purpose: Express server for Vercel serverless deployment
 * 
 * Description:
 * This is a Vercel-compatible version of the BrandBloom Insights backend server.
 * It removes file system operations and server startup code to work with Vercel's
 * serverless environment. File operations are disabled and will return appropriate
 * error messages.
 * 
 * Key Changes for Vercel:
 * - No directory initialization (not allowed in Vercel)
 * - No server startup (Vercel handles this)
 * - File operations disabled (use external storage)
 * - Exports Express app instead of starting server
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Backend Team
 */

import express from 'express';
import cors from 'cors';
import { API_CONFIG } from './config/constants.js';

// Import Vercel-compatible route modules
import fileRoutes from './routes/fileRoutes-vercel.js';
import filterRoutes from './routes/filterRoutes-vercel.js';
import brandRoutes from './routes/brandRoutes-vercel.js';
import metadataRoutes from './routes/metadataRoutes-vercel.js';
import nonmmmRoutes from './routes/nonmmmRoutes-vercel.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Vercel file system warning middleware
app.use((req, res, next) => {
  if (req.path.includes('/files/upload') || req.path.includes('/files/')) {
    console.warn('⚠️ File operations disabled in Vercel serverless environment');
  }
  next();
});

// API Routes
app.use(`${API_CONFIG.API_PREFIX}/files`, fileRoutes);
app.use(`${API_CONFIG.API_PREFIX}/filters`, filterRoutes);
app.use(`${API_CONFIG.API_PREFIX}/brands`, brandRoutes);
app.use(`${API_CONFIG.API_PREFIX}/metadata`, metadataRoutes);
app.use(`${API_CONFIG.API_PREFIX}/nonmmm`, nonmmmRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'vercel-serverless',
    platform: 'vercel',
    note: 'File operations disabled in serverless environment'
  });
});

// API documentation endpoint
app.get(`${API_CONFIG.API_PREFIX}`, (req, res) => {
  res.json({
    message: 'BrandBloom Insights Backend API (Vercel Serverless)',
    version: '1.0.0',
    platform: 'vercel',
    note: 'File operations require external storage (AWS S3, etc.)',
    endpoints: {
      files: {
        'POST /files/upload': 'File upload (requires external storage)',
        'GET /files/:filename/columns': 'Get columns from a processed file',
        'GET /files/:filename/sample': 'Get sample data from a processed file',
        'GET /files/:filename/info': 'Get file information'
      },
      filters: {
        'GET /filters/:filename/suggestions': 'Get suggested filter columns',
        'POST /filters/:filename/validate': 'Validate filter column selection',
        'POST /filters/:filename/save': 'Save filter column selection',
        'GET /filters/:filename/available': 'Get all available columns'
      },
      brands: {
        'POST /brands/validate': 'Validate brand name with suggestions',
        'POST /brands/save': 'Save brand name to metadata',
        'PUT /brands/update': 'Update existing brand name',
        'GET /brands/:metadataFilename/export': 'Export brand information',
        'POST /brands/suggestions': 'Get brand name suggestions'
      },
      metadata: {
        'POST /metadata/create': 'Create a new metadata file',
        'GET /metadata/:metadataFilename/info': 'Get metadata file information',
        'POST /metadata/:metadataFilename/log': 'Add processing log entry',
        'GET /metadata/:metadataFilename/download': 'Download metadata file',
        'GET /metadata/health': 'Health check for metadata service'
      }
    },
    documentation: 'Each endpoint returns standardized JSON responses with success/error status'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
    platform: 'vercel'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    platform: 'vercel'
  });
});

// Export the app for Vercel
export default app;
