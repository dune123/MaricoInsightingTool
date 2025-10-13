/**
 * ========================================
 * AZURE BLOB STORAGE SERVICE
 * ========================================
 * 
 * Purpose: Handle file uploads and operations with Azure Blob Storage
 * 
 * Description:
 * This service provides methods to upload, download, and manage files
 * in Azure Blob Storage for the BrandBloom Insights application.
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Backend Team
 */

import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

class AzureBlobService {
  constructor() {
    this.connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    this.containerName = process.env.AZURE_CONTAINER_NAME || 'brandbloom-files';
    this.accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    
    if (!this.connectionString) {
      console.warn('⚠️ Azure Storage connection string not found. File operations will use mock responses.');
      this.isAvailable = false;
      return;
    }
    
    try {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString);
      this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      this.isAvailable = true;
      console.log('✅ Azure Blob Storage initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Azure Blob Storage:', error);
      this.isAvailable = false;
    }
  }

  /**
   * Upload a file to Azure Blob Storage
   * @param {Buffer} fileBuffer - File content as buffer
   * @param {string} originalName - Original filename
   * @param {string} brandName - Brand name for organization
   * @param {string} contentType - MIME type of the file
   * @returns {Promise<Object>} Upload result with blob info
   */
  async uploadFile(fileBuffer, originalName, brandName = 'default', contentType = 'application/octet-stream') {
    if (!this.isAvailable) {
      throw new Error('Azure Blob Storage not available');
    }

    try {
      // Create unique filename with timestamp and UUID
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileExtension = originalName.split('.').pop();
      const uniqueFilename = `${brandName}/${timestamp}-${uuidv4()}.${fileExtension}`;
      
      // Get blob client
      const blockBlobClient = this.containerClient.getBlockBlobClient(uniqueFilename);
      
      // Upload options
      const uploadOptions = {
        blobHTTPHeaders: {
          blobContentType: contentType,
          blobContentDisposition: `attachment; filename="${originalName}"`
        },
        metadata: {
          originalName: originalName,
          brandName: brandName,
          uploadedAt: new Date().toISOString(),
          fileSize: fileBuffer.length.toString()
        }
      };
      
      // Upload the file
      const uploadResponse = await blockBlobClient.upload(fileBuffer, fileBuffer.length, uploadOptions);
      
      console.log(`✅ File uploaded to Azure Blob Storage: ${uniqueFilename}`);
      
      return {
        success: true,
        filename: uniqueFilename,
        originalName: originalName,
        size: fileBuffer.length,
        url: blockBlobClient.url,
        etag: uploadResponse.etag,
        lastModified: uploadResponse.lastModified,
        uploadedAt: new Date().toISOString(),
        brandName: brandName
      };
      
    } catch (error) {
      console.error('❌ Azure Blob Storage upload failed:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Download a file from Azure Blob Storage
   * @param {string} filename - Blob filename
   * @returns {Promise<Buffer>} File content as buffer
   */
  async downloadFile(filename) {
    if (!this.isAvailable) {
      throw new Error('Azure Blob Storage not available');
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(filename);
      const downloadResponse = await blockBlobClient.download();
      
      // Convert stream to buffer
      const chunks = [];
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
      
    } catch (error) {
      console.error('❌ Azure Blob Storage download failed:', error);
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  /**
   * Get file metadata from Azure Blob Storage
   * @param {string} filename - Blob filename
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(filename) {
    if (!this.isAvailable) {
      throw new Error('Azure Blob Storage not available');
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(filename);
      const properties = await blockBlobClient.getProperties();
      
      return {
        filename: filename,
        size: properties.contentLength,
        contentType: properties.contentType,
        lastModified: properties.lastModified,
        metadata: properties.metadata,
        etag: properties.etag
      };
      
    } catch (error) {
      console.error('❌ Azure Blob Storage metadata fetch failed:', error);
      throw new Error(`Metadata fetch failed: ${error.message}`);
    }
  }

  /**
   * Parse Excel/CSV file and extract columns and sample data
   * @param {Buffer} fileBuffer - File content as buffer
   * @param {string} filename - Original filename
   * @returns {Promise<Object>} Parsed file data
   */
  async parseFileData(fileBuffer, filename) {
    try {
      const fileExtension = filename.split('.').pop().toLowerCase();
      
      if (fileExtension === 'csv') {
        return this.parseCSV(fileBuffer);
      } else if (['xlsx', 'xls'].includes(fileExtension)) {
        return this.parseExcel(fileBuffer);
      } else {
        throw new Error(`Unsupported file type: ${fileExtension}`);
      }
    } catch (error) {
      console.error('❌ File parsing failed:', error);
      throw new Error(`File parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse CSV file
   * @param {Buffer} fileBuffer - CSV file buffer
   * @returns {Object} Parsed CSV data
   */
  parseCSV(fileBuffer) {
    const csvContent = fileBuffer.toString('utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = lines.slice(1, 6); // First 5 data rows for sample
    const sampleData = dataRows.map(row => {
      const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
    
    return {
      columns: headers.map(header => ({
        name: header,
        type: this.detectColumnType(sampleData.map(row => row[header]))
      })),
      sampleData: sampleData,
      totalRows: lines.length - 1,
      totalColumns: headers.length
    };
  }

  /**
   * Parse Excel file
   * @param {Buffer} fileBuffer - Excel file buffer
   * @returns {Object} Parsed Excel data
   */
  parseExcel(fileBuffer) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    
    if (sheetNames.length === 0) {
      throw new Error('Excel file has no sheets');
    }
    
    // Use first sheet for analysis
    const firstSheet = workbook.Sheets[sheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    
    if (jsonData.length === 0) {
      throw new Error('Excel sheet is empty');
    }
    
    const headers = jsonData[0];
    const dataRows = jsonData.slice(1, 6); // First 5 data rows for sample
    const sampleData = dataRows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
    
    return {
      columns: headers.map(header => ({
        name: header,
        type: this.detectColumnType(sampleData.map(row => row[header]))
      })),
      sampleData: sampleData,
      totalRows: jsonData.length - 1,
      totalColumns: headers.length,
      sheets: sheetNames.map((name, index) => ({ name, index }))
    };
  }

  /**
   * Detect column data type
   * @param {Array} values - Column values
   * @returns {string} Detected type
   */
  detectColumnType(values) {
    const nonEmptyValues = values.filter(v => v !== '' && v !== null && v !== undefined);
    
    if (nonEmptyValues.length === 0) return 'unknown';
    
    // Check for numeric values
    const numericCount = nonEmptyValues.filter(v => !isNaN(parseFloat(v)) && isFinite(v)).length;
    if (numericCount / nonEmptyValues.length > 0.8) return 'numeric';
    
    // Check for date values
    const dateCount = nonEmptyValues.filter(v => !isNaN(Date.parse(v))).length;
    if (dateCount / nonEmptyValues.length > 0.8) return 'datetime';
    
    // Check for percentage values
    const percentageCount = nonEmptyValues.filter(v => 
      typeof v === 'string' && (v.includes('%') || v.includes('percent'))
    ).length;
    if (percentageCount / nonEmptyValues.length > 0.5) return 'percentage';
    
    return 'categorical';
  }

  /**
   * Delete a file from Azure Blob Storage
   * @param {string} filename - Blob filename
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(filename) {
    if (!this.isAvailable) {
      throw new Error('Azure Blob Storage not available');
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(filename);
      await blockBlobClient.delete();
      
      console.log(`✅ File deleted from Azure Blob Storage: ${filename}`);
      return true;
      
    } catch (error) {
      console.error('❌ Azure Blob Storage delete failed:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * List files for a specific brand
   * @param {string} brandName - Brand name
   * @returns {Promise<Array>} List of files
   */
  async listBrandFiles(brandName) {
    if (!this.isAvailable) {
      throw new Error('Azure Blob Storage not available');
    }

    try {
      const files = [];
      const prefix = `${brandName}/`;
      
      for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
        files.push({
          name: blob.name,
          size: blob.properties.contentLength,
          lastModified: blob.properties.lastModified,
          contentType: blob.properties.contentType,
          metadata: blob.metadata
        });
      }
      
      return files;
      
    } catch (error) {
      console.error('❌ Azure Blob Storage list failed:', error);
      throw new Error(`List files failed: ${error.message}`);
    }
  }
}

// Create singleton instance
const azureBlobService = new AzureBlobService();

export default azureBlobService;
