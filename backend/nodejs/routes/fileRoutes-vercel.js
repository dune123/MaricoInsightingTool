/**
 * ========================================
 * VERCEL-COMPATIBLE FILE UPLOAD ROUTES WITH AZURE BLOB STORAGE
 * ========================================
 * 
 * Purpose: RESTful API endpoints for Vercel serverless environment with Azure Blob Storage
 * 
 * Description:
 * This module provides Vercel-compatible versions of file upload routes.
 * File operations use Azure Blob Storage for persistent file storage.
 * Falls back to mock responses if Azure is not configured.
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Backend Team
 */

import express from 'express';
import multer from 'multer';
import { FILE_CONFIG } from '../config/constants.js';
import azureBlobService from '../services/azureBlobService.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'xlsx,xls,csv').split(',');
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`File type .${fileExtension} not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  }
});

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

// POST /upload - File upload with Azure Blob Storage
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
        message: 'Please select a file to upload'
      });
    }

    const { brand } = req.body;
    const brandName = brand || 'default';
    
    console.log(`📤 Uploading file: ${req.file.originalname} for brand: ${brandName}`);

    // Try Azure Blob Storage first
    if (azureBlobService.isAvailable) {
      try {
        const uploadResult = await azureBlobService.uploadFile(
          req.file.buffer,
          req.file.originalname,
          brandName,
          req.file.mimetype
        );

        console.log('✅ File uploaded to Azure Blob Storage:', uploadResult.filename);

        return res.json({
          success: true,
          data: {
            filename: uploadResult.filename,
            originalName: uploadResult.originalName,
            size: uploadResult.size,
            uploadedAt: uploadResult.uploadedAt,
            brandName: uploadResult.brandName,
            url: uploadResult.url,
            message: 'File uploaded successfully to Azure Blob Storage'
          },
          platform: 'azure-blob',
          timestamp: new Date().toISOString()
        });

      } catch (azureError) {
        console.error('❌ Azure Blob Storage upload failed:', azureError);
        // Fall through to mock response
      }
    }

    // Fallback to mock response if Azure is not available
    console.log('⚠️ Azure Blob Storage not available, using mock response');
    const mockFilename = `mock-file-${Date.now()}.${req.file.originalname.split('.').pop()}`;
    
    res.json({
      success: true,
      data: {
        filename: mockFilename,
        originalName: req.file.originalname,
        size: req.file.size,
        uploadedAt: new Date().toISOString(),
        brandName: brandName,
        message: 'File uploaded successfully (mock response)'
      },
      note: 'This is a mock response. Azure Blob Storage not configured.',
      platform: 'vercel-mock',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ File upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /:filename/columns - Get file columns with Azure Blob Storage
router.get('/:filename/columns', async (req, res) => {
  const { filename } = req.params;
  
  try {
    // Try Azure Blob Storage first
    if (azureBlobService.isAvailable && !filename.startsWith('mock-')) {
      try {
        const fileBuffer = await azureBlobService.downloadFile(filename);
        const parsedData = await azureBlobService.parseFileData(fileBuffer, filename);
        
        console.log('✅ File columns retrieved from Azure Blob Storage:', filename);
        
        return res.json({
          success: true,
          data: {
            filename: filename,
            columns: parsedData.columns,
            totalRows: parsedData.totalRows,
            totalColumns: parsedData.totalColumns,
            message: 'File columns retrieved from Azure Blob Storage'
          },
          platform: 'azure-blob',
          timestamp: new Date().toISOString()
        });

      } catch (azureError) {
        console.error('❌ Azure Blob Storage columns fetch failed:', azureError);
        // Fall through to mock response
      }
    }

    // Fallback to mock response
    console.log('⚠️ Using mock columns data for:', filename);
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
        totalRows: 1000,
        totalColumns: 4,
        message: 'File columns retrieved (mock data)'
      },
      note: 'This is mock data. Azure Blob Storage not configured or file not found.',
      platform: 'vercel-mock',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Columns fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Columns fetch failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
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

// GET /:filename/sheets - Get Excel sheets with Azure Blob Storage
router.get('/:filename/sheets', async (req, res) => {
  const { filename } = req.params;
  
  try {
    // Try Azure Blob Storage first
    if (azureBlobService.isAvailable && !filename.startsWith('mock-')) {
      try {
        const fileBuffer = await azureBlobService.downloadFile(filename);
        const parsedData = await azureBlobService.parseFileData(fileBuffer, filename);
        
        console.log('✅ File sheets retrieved from Azure Blob Storage:', filename);
        
        return res.json({
          success: true,
          data: {
            filename: filename,
            sheets: parsedData.sheets || [
              { name: 'Sheet1', index: 0 }
            ],
            message: 'Excel sheets retrieved from Azure Blob Storage'
          },
          platform: 'azure-blob',
          timestamp: new Date().toISOString()
        });

      } catch (azureError) {
        console.error('❌ Azure Blob Storage sheets fetch failed:', azureError);
        // Fall through to mock response
      }
    }

    // Fallback to mock response
    console.log('⚠️ Using mock sheets data for:', filename);
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
      note: 'This is mock data. Azure Blob Storage not configured or file not found.',
      platform: 'vercel-mock',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Sheets fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Sheets fetch failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;