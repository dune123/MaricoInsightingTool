/**
 * ========================================
 * NON-MMM FILE SERVICE
 * ========================================
 * 
 * Purpose: Dedicated file service for Non-MMM analysis workflow
 * 
 * Description:
 * This service handles all file operations specific to Non-MMM analysis.
 * It's completely separate from MMM file operations to avoid any conflicts.
 * Uses Python backend for file processing while maintaining separation.
 * 
 * Key Features:
 * - File upload for Non-MMM analysis
 * - Sheet extraction and display with proper row counts
 * - No concatenation functionality
 * - State persistence integration
 * - Proper API response mapping for sheet data
 * 
 * API Response Mapping:
 * - Maps backend 'sheetName' to frontend 'name' 
 * - Maps backend 'totalRows' to frontend 'rows'
 * - Ensures consistent data display with MMM analysis
 * 
 * Dependencies:
 * - Python backend endpoints
 * - Separate from MMM file service
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

import { httpClient } from '@/utils/apiClient';

interface NonMMMFileUploadResult {
  filename: string;
  totalRows: number;
  totalColumns: number;
}

interface NonMMMSheetInfo {
  name: string;
  columns: string[];
  rows: number;
}

export class NonMMMFileService {
  /**
   * Upload file for Non-MMM analysis
   */
  static async uploadFile(file: File, brandName?: string): Promise<NonMMMFileUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add brand name if provided (required by Python backend)
    if (brandName) {
      formData.append('brand', brandName);
    }
    
    // Use fetch directly for file upload as httpClient is designed for JSON
    // Use Node.js backend for Vercel deployment
    const response = await fetch(`${import.meta.env.VITE_NODE_API_URL || 'http://localhost:3001'}/api/files/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Debug logging to help identify response structure issues
    console.log('📤 File upload response:', data);
    
    const filename = data.data?.filename || data.data?.file?.processedName || data.data?.file?.originalName || data.filename;
    console.log('📁 Extracted filename:', filename);
    
    // Save uploaded file data to localStorage for persistence
    const fileData = {
      filename: filename,
      originalName: file.name,
      size: file.size,
      type: file.type,
      totalRows: data.data?.fileStats?.totalRows || data.data?.totalRows || data.totalRows || 0,
      totalColumns: data.data?.fileStats?.totalColumns || data.data?.totalColumns || data.totalColumns || 0,
      uploadedAt: new Date().toISOString(),
      brandName: brandName
    };
    
    // Save to localStorage with brand-specific key
    const storageKey = `nonmmm_uploaded_file_${brandName || 'default'}`;
    localStorage.setItem(storageKey, JSON.stringify(fileData));
    console.log('💾 File data saved to localStorage:', fileData);
    
    return {
      filename: filename,
      totalRows: fileData.totalRows,
      totalColumns: fileData.totalColumns
    };
  }

  /**
   * Get sheet information for Non-MMM analysis
   */
  static async getSheets(filename: string, brandName?: string): Promise<NonMMMSheetInfo[]> {
    // Use Node.js backend for Vercel deployment
    const url = `${import.meta.env.VITE_NODE_API_URL || 'http://localhost:3001'}/api/files/${encodeURIComponent(filename)}/sheets${brandName ? `?brand=${encodeURIComponent(brandName)}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get sheets: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check if the response was successful
    if (!data.success) {
      throw new Error(data.error || 'Failed to get sheets');
    }
    
    // Type-safe access to response data - the Node.js backend returns sheet data differently
    const responseData = data.data as { 
      sheets?: { 
        name: string; 
        columns: string[]; 
        rows?: number;
      }[] 
    };
    
    if (responseData && responseData.sheets) {
      return responseData.sheets.map((sheet) => ({
        name: sheet.name,
        columns: sheet.columns || [],
        rows: sheet.rows || 0
      }));
    }
    
    return [];
  }

  /**
   * Get data summary for Non-MMM analysis
   */
  static async getDataSummary(filename: string, brand: string) {
    const response = await httpClient.get(`/nonmmm/data-summary/${encodeURIComponent(filename)}?brand=${encodeURIComponent(brand)}`);
    
    return response.data;
  }

  /**
   * Get saved file data from localStorage
   */
  static getSavedFileData(brandName?: string): any | null {
    try {
      const storageKey = `nonmmm_uploaded_file_${brandName || 'default'}`;
      const savedData = localStorage.getItem(storageKey);
      
      if (savedData) {
        const fileData = JSON.parse(savedData);
        console.log('📁 Retrieved saved file data from localStorage:', fileData);
        return fileData;
      }
      
      console.log('📭 No saved file data found for brand:', brandName);
      return null;
    } catch (error) {
      console.error('❌ Error retrieving saved file data:', error);
      return null;
    }
  }

  /**
   * Clear saved file data from localStorage
   */
  static clearSavedFileData(brandName?: string): void {
    try {
      const storageKey = `nonmmm_uploaded_file_${brandName || 'default'}`;
      localStorage.removeItem(storageKey);
      console.log('🗑️ Cleared saved file data for brand:', brandName);
    } catch (error) {
      console.error('❌ Error clearing saved file data:', error);
    }
  }

  /**
   * Save analysis data to localStorage
   */
  static saveAnalysisData(brandName: string, analysisData: any): void {
    try {
      const storageKey = `nonmmm_analysis_data_${brandName}`;
      const dataToSave = {
        ...analysisData,
        savedAt: new Date().toISOString(),
        brandName: brandName
      };
      
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      console.log('💾 Analysis data saved to localStorage:', dataToSave);
    } catch (error) {
      console.error('❌ Error saving analysis data:', error);
    }
  }

  /**
   * Get saved analysis data from localStorage
   */
  static getSavedAnalysisData(brandName: string): any | null {
    try {
      const storageKey = `nonmmm_analysis_data_${brandName}`;
      const savedData = localStorage.getItem(storageKey);
      
      if (savedData) {
        const analysisData = JSON.parse(savedData);
        console.log('📊 Retrieved saved analysis data from localStorage:', analysisData);
        return analysisData;
      }
      
      console.log('📭 No saved analysis data found for brand:', brandName);
      return null;
    } catch (error) {
      console.error('❌ Error retrieving saved analysis data:', error);
      return null;
    }
  }

  /**
   * Store data summary in Node.js backend for persistence
   */
  static async storeDataSummary(analysisId: string, brand: string, filename: string, dataSummary: any) {
    try {
      console.log(`💾 Storing data summary for analysis: ${analysisId}`);
      
      // Store in Python backend (not Node.js)
      const response = await httpClient.post(`/nonmmm/store-summary?brand=${encodeURIComponent(brand)}`, {
        analysisId,
        brand,
        filename,
        dataSummary
      });
      
      if (response.success) {
        console.log(`✅ Data summary stored successfully for analysis: ${analysisId}`);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to store data summary');
      }
    } catch (error) {
      console.error(`❌ Error storing data summary: ${error}`);
      throw error;
    }
  }

  /**
   * Retrieve stored data summary from Python backend
   */
  static async getStoredDataSummary(analysisId: string, brand: string) {
    try {
      console.log(`🔍 Retrieving stored data summary for analysis: ${analysisId}`);
      
      const response = await httpClient.get(`/nonmmm/get-summary/${analysisId}?brand=${encodeURIComponent(brand)}`);
      
      if (response.success) {
        console.log(`✅ Stored data summary retrieved successfully for analysis: ${analysisId}`);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to retrieve stored data summary');
      }
    } catch (error) {
      console.error(`❌ Error retrieving stored data summary: ${error}`);
      throw error;
    }
  }

  /**
   * Get data summary with caching - first try stored, then calculate if needed
   */
  static async getDataSummaryWithCaching(analysisId: string, filename: string, brand: string, forceRefresh: boolean = false) {
    try {
      // If force refresh is requested, skip cache and calculate fresh
      if (forceRefresh) {
        console.log(`🔄 Force refresh requested, calculating fresh data summary for analysis: ${analysisId}`);
        const freshSummary = await this.getDataSummary(filename, brand);
        
        // Store the fresh summary for future use
        try {
          await this.storeDataSummary(analysisId, brand, filename, freshSummary);
          console.log(`✅ Fresh data summary calculated and stored for analysis: ${analysisId}`);
        } catch (storeError) {
          console.warn(`⚠️ Failed to store fresh data summary, but returning calculated data: ${storeError}`);
        }
        
        return freshSummary;
      }
      
      // First, try to get stored summary
      try {
        const storedSummary = await this.getStoredDataSummary(analysisId, brand);
        const storedData = storedSummary as any;
        const cachedFilename = storedData.data?.filename || storedData.filename;
        
        // Check if the cached summary is for the same file
        if (cachedFilename && cachedFilename !== filename) {
          console.log(`⚠️ Cached summary is for different file (${cachedFilename} vs ${filename}), calculating fresh summary`);
          throw new Error('File mismatch - need fresh calculation');
        }
        
        console.log(`✅ Using cached data summary for analysis: ${analysisId}`);
        return storedData.data?.dataSummary || storedData.dataSummary;
      } catch (storedError) {
        console.log(`ℹ️ No valid cached summary found, calculating fresh data summary for analysis: ${analysisId}`);
      }
      
      // If no stored summary or file mismatch, calculate fresh one
      const freshSummary = await this.getDataSummary(filename, brand);
      
      // Store the fresh summary for future use
      try {
        await this.storeDataSummary(analysisId, brand, filename, freshSummary);
        console.log(`✅ Fresh data summary calculated and stored for analysis: ${analysisId}`);
      } catch (storeError) {
        console.warn(`⚠️ Failed to store fresh data summary, but returning calculated data: ${storeError}`);
      }
      
      return freshSummary;
    } catch (error) {
      console.error(`❌ Error in getDataSummaryWithCaching: ${error}`);
      throw error;
    }
  }

  /**
   * Modify column type for Non-MMM analysis
   */
  static async modifyColumnType(filename: string, columnName: string, brand: string, newType: string) {
    const response = await httpClient.post(`/nonmmm/modify-column-type/${encodeURIComponent(filename)}?brand=${encodeURIComponent(brand)}`, {
      columnName,
      newType
    });
    
    // Clear the cached data summary since column types have changed
    // This forces a fresh reload from the backend
    try {
      const cacheKey = `data_summary_${filename}_${brand}`;
      if (typeof window !== 'undefined' && window.localStorage) {
        // Clear any cached data for this file
        Object.keys(localStorage).forEach(key => {
          if (key.includes(filename) && key.includes('data_summary')) {
            localStorage.removeItem(key);
            console.log(`🗑️ Cleared cached data: ${key}`);
          }
        });
      }
      console.log(`🗑️ Cleared cache for ${filename} after column type change`);
    } catch (cacheError) {
      console.warn(`⚠️ Failed to clear cache: ${cacheError}`);
    }
    
    // Return the entire response since it contains success, message, and data
    return response;
  }

  /**
   * Get histograms for Non-MMM analysis
   */
  static async getHistograms(filename: string, brand: string, bins: number | 'auto' = 10) {
    const binsParam = bins === 'auto' ? 'auto' : bins;
    const response = await httpClient.get(`/nonmmm/histograms/${encodeURIComponent(filename)}?brand=${encodeURIComponent(brand)}&bins=${binsParam}`);
    
    // Return the entire response since it contains success, message, and data
    return response;
  }

  /**
   * Get correlation matrix for Non-MMM analysis
   */
  static async getCorrelationMatrix(filename: string, brand: string, method: string = 'pearson', selectedVariables?: string[]) {
    let url = `/nonmmm/correlation-matrix/${encodeURIComponent(filename)}?brand=${encodeURIComponent(brand)}&method=${encodeURIComponent(method)}`;
    
    // Add selected variables as query parameter if provided
    if (selectedVariables && selectedVariables.length > 0) {
      const variablesParam = selectedVariables.map(v => encodeURIComponent(v)).join(',');
      url += `&variables=${variablesParam}`;
    }
    
    const response = await httpClient.get(url);
    
    // Return the entire response since it contains success, message, and data
    return response;
  }

  /**
   * Delete variable from Non-MMM analysis
   */
  static async deleteVariable(filename: string, columnName: string, brand: string) {
    const response = await httpClient.delete(`/nonmmm/delete-variable/${encodeURIComponent(filename)}?brand=${encodeURIComponent(brand)}&column=${encodeURIComponent(columnName)}`);
    
    // Clear the cached data summary since variables have been deleted
    // This forces a fresh reload from the backend
    try {
      const cacheKey = `data_summary_${filename}_${brand}`;
      if (typeof window !== 'undefined' && window.localStorage) {
        // Clear any cached data for this file
        Object.keys(localStorage).forEach(key => {
          if (key.includes(filename) && key.includes('data_summary')) {
            localStorage.removeItem(key);
            console.log(`🗑️ Cleared cached data: ${key}`);
          }
        });
      }
      console.log(`🗑️ Cleared cache for ${filename} after variable deletion`);
    } catch (cacheError) {
      console.warn(`⚠️ Failed to clear cache: ${cacheError}`);
    }
    
    // Return the entire response since it contains success, message, and data
    return response;
  }
}