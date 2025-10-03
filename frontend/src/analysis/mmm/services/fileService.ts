/**
 * FileService
 * 
 * Purpose: Handle file upload, processing, and data quality enhancement API calls to backend
 * 
 * Description: This service provides a comprehensive interface for uploading files to the
 * backend, retrieving file information, and performing data quality enhancements. It handles
 * communication with the Python FastAPI backend for all file operations including Excel
 * column modification with automatic data quality filtering. The service emphasizes type
 * safety by using proper TypeScript types instead of `any` for all API responses.
 * 
 * Key Functions:
 * - uploadFile(): Uploads files to backend with error handling and validation
 * - getAllSheets(): Retrieves sheet names and column information from Excel files
 * - modifyColumns(): Modifies Excel files with business column enhancement and data quality filtering
 * - getBackendInfo(): Gets backend connectivity information
 * - handleApiResponse(): Processes API responses with error handling
 * 
 * Type Safety Features:
 * - Uses `Record<string, unknown>` instead of `any` for dynamic API responses
 * - Properly typed interfaces for all API response structures
 * - Linter-compliant code following TypeScript best practices
 * - Enhanced developer experience with better type checking
 * 
 * Data Quality Features:
 * - Automatic column removal for columns with <18 valid data records
 * - Business column preservation (PackSize, Region, Channel, Month always kept)
 * - Comprehensive tracking and reporting of data quality improvements
 * - User transparency with detailed feedback on removed columns by sheet
 * - Enhanced API response structure with dataQuality section
 * 
 * API Endpoints:
 * - POST /api/files/upload: File upload to raw directory
 * - GET /api/files/{filename}/sheets: Excel sheet information retrieval
 * - POST /api/files/{filename}/modify-columns: Enhanced column modification with data quality
 * 
 * Data Flow:
 * 1. File upload: Validation → Backend upload → Response processing
 * 2. Sheet retrieval: File lookup → Backend processing → Sheet information
 * 3. Column modification: Business logic → Data quality filtering → File enhancement
 * 4. Backend detection: Health check → Dynamic configuration → Fallback handling
 * 
 * Dependencies:
 * - ApiConfig: Dynamic backend detection and configuration
 * - SheetInfo: Type definitions for sheet information
 * - Fetch API: HTTP operations
 * - TypeScript interfaces: Type-safe API communication with proper typing
 */

import { getFileApiUrl, getFileApiUrlSync, getBackendInfo } from '@/config/apiConfig';
import { SheetInfo } from '@/types/analysis';

export interface AllSheetsResponse {
  success: boolean;
  data?: {
    filename: string;
    totalSheets: number;
    sheets: SheetInfo[];
  };
  error?: string;
}

export interface FileUploadResponse {
  success: boolean;
  data?: {
    file: {
      originalName: string;
      processedName: string;
      processedPath: string;
      size: number;
      uploadTime: string;
      baseFilename: string;
      extension: string;
    };
    metadata: Record<string, unknown>;
    columns: string[];
    fileStats: {
      totalRows: number;
      totalColumns: number;
    };
  };
  error?: string;
}

export interface ColumnModificationResponse {
  success: boolean;
  data?: {
    modifiedFile: string;
    sheetsModified: number;
    sheets: SheetInfo[];
    modifications: {
      columnsAdded: string[];
      modifiedSheets: string[];
      skippedSheets: string[];
    };
    dataQuality: {
      sheetsWithRemovedColumns: number;
      totalColumnsRemoved: number;
      removedColumnsBySheet: Record<string, string[]>;
    };
  };
  error?: string;
}

export interface FileExistsResponse {
  success: boolean;
  exists: boolean;
  filePath?: string;
  error?: string;
}

export class FileService {
  /**
   * Upload a file to the backend
   */
  static async uploadFile(file: File, brand?: string): Promise<FileUploadResponse> {
    try {
      const apiBaseUrl = getFileApiUrlSync(); // Use synchronous version to reduce async calls
      const formData = new FormData();
      formData.append('file', file);
      
      // Add brand context if available
      if (brand) {
        formData.append('brand', brand);
      }

      const response = await fetch(`${apiBaseUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const backendInfo = await getBackendInfo();
        return {
          success: false,
          error: `Cannot connect to backend server. ${backendInfo.backend ? `Tried ${backendInfo.backend.name} at ${backendInfo.backend.baseUrl}` : 'No backend detected'}. Please ensure a backend server is running.`,
        };
      }
      return {
        success: false,
        error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get all sheet names and their first 5 column names from an Excel file
   */
  static async getAllSheets(filename: string, brand?: string): Promise<AllSheetsResponse> {
    try {
      const apiBaseUrl = getFileApiUrlSync(); // Use synchronous version to reduce async calls
      let url = `${apiBaseUrl}/${encodeURIComponent(filename)}/sheets`;
      
      // Add brand parameter if provided
      if (brand) {
        url += `?brand=${encodeURIComponent(brand)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const backendInfo = await getBackendInfo();
        return {
          success: false,
          error: `Cannot connect to backend server. ${backendInfo.backend ? `Tried ${backendInfo.backend.name} at ${backendInfo.backend.baseUrl}` : 'No backend detected'}. Please ensure a backend server is running.`,
        };
      }
      return {
        success: false,
        error: `Failed to get sheets: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get file information
   */
  static async getFileInfo(filename: string): Promise<Record<string, unknown>> {
    try {
      const apiBaseUrl = getFileApiUrlSync(); // Use synchronous version to reduce async calls
      const response = await fetch(`${apiBaseUrl}/${encodeURIComponent(filename)}/info`);
      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get file columns (for backward compatibility)
   */
  static async getFileColumns(filename: string): Promise<Record<string, unknown>> {
    try {
      const apiBaseUrl = await getFileApiUrl();
      const response = await fetch(`${apiBaseUrl}/${encodeURIComponent(filename)}/columns`);
      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to get columns: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get sample data from file
   */
  static async getFileSample(filename: string, size: number = 5): Promise<Record<string, unknown>> {
    try {
      const apiBaseUrl = await getFileApiUrl();
      const response = await fetch(`${apiBaseUrl}/${encodeURIComponent(filename)}/sample?size=${size}`);
      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to get sample: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check if a file exists in the backend
   */
  static async checkFileExists(filename: string, brand?: string): Promise<FileExistsResponse> {
    try {
      const apiBaseUrl = await getFileApiUrl();
      let url = `${apiBaseUrl}/${encodeURIComponent(filename)}/exists`;
      
      // Add brand parameter if provided
      if (brand) {
        url += `?brand=${encodeURIComponent(brand)}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: true,
            exists: false,
          };
        }
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        exists: result.exists || false,
        filePath: result.filePath,
      };
    } catch (error) {
      return {
        success: false,
        exists: false,
        error: `Failed to check file existence: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Modify Excel file to add/update packsize, region, and channel columns to selected sheets
   */
  static async modifyExcelColumns(filename: string, selectedSheets: string[], brand?: string): Promise<ColumnModificationResponse> {
    try {
      const apiBaseUrl = await getFileApiUrl();
      let url = `${apiBaseUrl}/${encodeURIComponent(filename)}/modify-columns`;
      
      // Add brand parameter if provided
      if (brand) {
        url += `?brand=${encodeURIComponent(brand)}`;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedSheets }), // Send selected sheets array
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const backendInfo = await getBackendInfo();
        return {
          success: false,
          error: `Cannot connect to backend server. ${backendInfo.backend ? `Tried ${backendInfo.backend.name} at ${backendInfo.backend.baseUrl}` : 'No backend detected'}. Please ensure a backend server is running.`,
        };
      }
      return {
        success: false,
        error: `Failed to modify Excel columns: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

// Create singleton instance
export const fileService = new FileService();
export default fileService;