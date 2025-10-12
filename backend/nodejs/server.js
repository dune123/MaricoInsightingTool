/**
 * ========================================
 * MAIN SERVER APPLICATION
 * ========================================
 * 
 * Purpose: Express server initialization and configuration for BrandBloom Insights Backend
 * 
 * Description:
 * This is the main entry point for the BrandBloom Insights backend server. It initializes
 * the Express application, configures middleware, sets up API routes, handles system
 * initialization, and provides comprehensive error handling. The server follows RESTful
 * API principles and provides detailed logging and monitoring capabilities.
 * 
 * Key Functions:
 * - initializeDirectories(): Creates upload, processed, and metadata directories
 * - startServer(): Initializes directories and starts the Express server
 * - Request logging middleware: Logs all incoming requests with timestamps
 * - Error handling middleware: Provides standardized error responses
 * - 404 handler: Returns proper error for undefined routes
 * - Graceful shutdown: Handles SIGTERM and SIGINT signals
 * 
 * API Routes Registered:
 * - /api/files: File upload and processing endpoints
 * - /api/filters: Filter management endpoints  
 * - /api/brands: Brand processing endpoints
 * - /api/metadata: Metadata and state management endpoints
 * - /health: System health check
 * - /api: Complete API documentation
 * 
 * Server Configuration:
 * - Port: 3001 (configurable via environment)
 * - Host: localhost (configurable via environment)
 * - API Prefix: /api
 * - File size limit: 50MB for JSON and URL-encoded data
 * - CORS enabled for cross-origin requests
 * 
 * Dependencies:
 * - express for HTTP server and routing
 * - cors for cross-origin request handling
 * - fs-extra for file system operations
 * - path for file path manipulation
 * - All route modules for API endpoint definitions
 * - constants.js for server configuration
 * 
 * Used by:
 * - Frontend React application for data processing operations
 * - External integrations requiring analytics capabilities
 * - Development and testing tools
 * - System monitoring and health check services
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Backend Team
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs-extra';
import { API_CONFIG, FILE_CONFIG } from './config/constants.js';

// Import route modules
import fileRoutes from './routes/fileRoutes.js';
import filterRoutes from './routes/filterRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import metadataRoutes from './routes/metadataRoutes.js';
import nonmmmRoutes from './routes/nonmmmRoutes.js';

const app = express();

// CORS configuration for production
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', 
    'https://marico-insighting-tool.vercel.app',
    'https://frontend-4lj9zgiar-sameers-projects-c785670d.vercel.app',
    'https://frontend-q5yz1zc5s-sameers-projects-c785670d.vercel.app',
    'https://frontend-28mk4syu3-sameers-projects-c785670d.vercel.app',
    'https://frontend-wn4aIZcW-sameers-projects-c785670d.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize directories
async function initializeDirectories() {
  try {
    await fs.ensureDir(FILE_CONFIG.UPLOAD_DIR);
    await fs.ensureDir(FILE_CONFIG.PROCESSED_DIR);
    await fs.ensureDir(FILE_CONFIG.METADATA_DIR);
    console.log('✅ All directories initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize directories:', error.message);
    process.exit(1);
  }
}

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
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation endpoint
app.get(`${API_CONFIG.API_PREFIX}`, (req, res) => {
  res.json({
    message: 'BrandBloom Insights Backend API',
    version: '1.0.0',
    endpoints: {
      files: {
        'POST /files/upload': 'Upload a file and create initial processing',
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
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Start server
async function startServer() {
  try {
    // Initialize directories first
    await initializeDirectories();
    
    // Start the server
    app.listen(API_CONFIG.PORT, API_CONFIG.HOST, () => {
      console.log('🚀 BrandBloom Insights Backend Server Started');
      console.log(`📍 Server running at http://${API_CONFIG.HOST}:${API_CONFIG.PORT}`);
      console.log(`📚 API Documentation: http://${API_CONFIG.HOST}:${API_CONFIG.PORT}${API_CONFIG.API_PREFIX}`);
      console.log(`💚 Health Check: http://${API_CONFIG.HOST}:${API_CONFIG.PORT}/health`);
      console.log('📁 Directory Structure:');
      console.log(`   📂 Upload: ${FILE_CONFIG.UPLOAD_DIR}`);
      console.log(`   📂 Processed: ${FILE_CONFIG.PROCESSED_DIR}`);
      console.log(`   📂 Metadata: ${FILE_CONFIG.METADATA_DIR}`);
      console.log('🔥 Server ready to accept requests!');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();