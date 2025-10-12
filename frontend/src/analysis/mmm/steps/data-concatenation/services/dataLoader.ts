/**
 * ========================================
 * DATA LOADER SERVICE - DATA CONCATENATION MODULE
 * ========================================
 * 
 * Purpose: Pure data loading functions for concatenated files
 * 
 * Description:
 * Service layer for loading data from concatenated files. Contains pure functions
 * for API calls and data retrieval without side effects or state management.
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

import { 
  FileListResponse, 
  FilteredDataResponse, 
  DataLoadingResult, 
  PreviewDataRow 
} from '../types';
import { filterFilesByBrand, sortFilesByTimestamp } from '../utils';

/**
 * API base URL for data operations
 */
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api';

/**
 * Fetch list of concatenated files from backend
 */
export async function fetchConcatenatedFiles(): Promise<FileListResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/files/list-concatenated`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching concatenated files:', error);
    throw new Error(`Failed to fetch file list: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Load data from a specific concatenated file
 */
export async function loadDataFromFile(
  filename: string,
  filters: Record<string, any> = {},
  limit: number = 100,
  brand?: string
): Promise<DataLoadingResult> {
  try {
    let url = `${API_BASE_URL}/data/filtered`;
    if (brand) {
      url += `?brand=${encodeURIComponent(brand)}`;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename,
        filters,
        limit
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result: FilteredDataResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.data ? 'Invalid response format' : 'Request failed');
    }
    
    return {
      success: true,
      data: result.data.rows,
      columns: result.data.columns,
      totalRows: result.data.originalRows
    };
  } catch (error) {
    console.error('Error loading data from file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Find and load the latest concatenated file for a specific brand
 */
export async function loadLatestBrandData(
  brandName: string,
  filters: Record<string, any> = {},
  limit: number = 100
): Promise<DataLoadingResult> {
  try {
    // Get all concatenated files
    const fileListResponse = await fetchConcatenatedFiles();
    
    if (!fileListResponse.success || !fileListResponse.files) {
      return {
        success: false,
        error: 'No concatenated files available'
      };
    }
    
    // Filter files by brand name
    const brandFiles = filterFilesByBrand(fileListResponse.files, brandName);
    
    if (brandFiles.length === 0) {
      return {
        success: false,
        error: `No concatenated files found for brand: ${brandName}`
      };
    }
    
    // Sort files by timestamp (newest first)
    const sortedFiles = sortFilesByTimestamp(brandFiles);
    const latestFile = sortedFiles[0];
    
    console.log(`Loading latest file for ${brandName}:`, latestFile);
    
    // Load data from the latest file
    return await loadDataFromFile(latestFile, filters, limit);
  } catch (error) {
    console.error('Error loading latest brand data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load brand data'
    };
  }
}

/**
 * Validate data loading result
 */
export function validateDataLoadingResult(result: DataLoadingResult): boolean {
  if (!result.success) {
    return false;
  }
  
  if (!result.data || !Array.isArray(result.data)) {
    return false;
  }
  
  if (!result.columns || !Array.isArray(result.columns)) {
    return false;
  }
  
  if (typeof result.totalRows !== 'number' || result.totalRows < 0) {
    return false;
  }
  
  return true;
}

/**
 * Retry data loading with exponential backoff
 */
export async function retryDataLoading(
  loadFunction: () => Promise<DataLoadingResult>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<DataLoadingResult> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await loadFunction();
      
      if (result.success) {
        return result;
      }
      
      lastError = new Error(result.error || 'Loading failed');
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
    }
    
    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries - 1) {
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return {
    success: false,
    error: `Failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
  };
}
