/**
 * ========================================
 * EXCEL SERVICE - SINGLE BACKEND INTEGRATION
 * ========================================
 * 
 * Purpose: Handle Excel file operations with Python backend integration
 * 
 * Description:
 * This service provides comprehensive Excel file processing capabilities using
 * exclusively the Python FastAPI backend. It handles sheet information retrieval,
 * step-by-step concatenation with intelligent column alignment, and file download
 * operations. The service ensures single source of truth by working only with
 * the Python backend's uploads directory.
 * 
 * Key Functionality:
 * - Retrieve all sheet names and column information from uploaded Excel files
 * - Execute step-by-step concatenation preserving first sheet structure
 * - Handle missing columns with NaN values and add new columns dynamically
 * - Download concatenated Excel files from backend processed directory
 * - Provide comprehensive error handling and user feedback
 * - Generate mock sheet data for development and testing scenarios
 * 
 * Concatenation Process:
 * 1. Send concatenation request to Python backend with selected sheets
 * 2. Backend performs step-by-step concatenation algorithm
 * 3. First sheet becomes base structure, subsequent sheets append rows
 * 4. Column alignment handles missing/new columns intelligently
 * 5. Source_Sheet column tracks data lineage
 * 6. Generated file saved to processed directory for download
 * 
 * Dependencies:
 * - apiConfig.ts for Python backend URL configuration
 * - Browser Fetch API for HTTP requests
 * - analysis.ts types for data structure definitions
 * 
 * Used by:
 * - DataUploadStep.tsx for sheet information display
 * - DataConcatenationStep.tsx for sheet concatenation operations
 * - Frontend components requiring Excel file operations
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Frontend Team
 */

import { SheetData } from '@/types/analysis';
import { getExcelApiUrl, getBackendInfo } from '@/config/apiConfig';

export class ExcelService {
  /**
   * Get all sheets information from an uploaded Excel file
   */
  static async getExcelSheets(filename: string): Promise<SheetData[]> {
    try {
      console.log(`🔍 Fetching sheets for: ${filename}`);
      const apiBaseUrl = await getExcelApiUrl();
      const encodedFilename = encodeURIComponent(filename);
      const url = `${apiBaseUrl}/api/sheets/${encodedFilename}`;
      console.log(`📡 API URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log(`📊 API Response Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error: ${response.status} - ${errorText}`);
        throw new Error(`Failed to get sheets: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Received ${data.sheets?.length || 0} sheets from API`);
      
      return data.sheets || [];
    } catch (error) {
      console.error('❌ Error fetching Excel sheets:', error);
      console.log('🔄 Falling back to mock data...');
      // Return mock data for demonstration if API fails
      return this.getMockSheets();
    }
  }

  /**
   * Concatenate selected sheets and save to local storage
   */
  static async concatenateSheets(
    originalFileName: string,
    selectedSheets: string[],
    customFileName: string,
    ourBrand?: string
  ) {
    try {
      const apiBaseUrl = await getExcelApiUrl();
      const response = await fetch(`${apiBaseUrl}/api/concatenate-sheets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalFileName,
          selectedSheets,
          customFileName,
          ourBrand,
        }),
      });

      if (!response.ok) {
        throw new Error(`Concatenation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error concatenating sheets:', error);
      throw error;
    }
  }

  /**
   * Download a concatenated Excel file
   */
  static async downloadFile(filename: string): Promise<void> {
    try {
      const apiBaseUrl = await getExcelApiUrl();
      const encodedFilename = encodeURIComponent(filename);
      const downloadUrl = `${apiBaseUrl}/api/download/${encodedFilename}`;
      
      console.log(`🔽 Downloading file from: ${downloadUrl}`);
      
      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.target = '_blank';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`✅ Download initiated for: ${filename}`);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  /**
   * Mock data for demonstration when API is not available
   */
  private static getMockSheets(): SheetData[] {
    const mockSheets: SheetData[] = [];
    
    // Generate 50+ mock sheets to simulate real workbook
    for (let i = 1; i <= 50; i++) {
      let sheetName = `Sheet_${i.toString().padStart(2, '0')}`;
      
      // Add some realistic sheet names
      if (i % 10 === 0) {
        sheetName = `Summary_Q${i / 10}`;
      } else if (i % 5 === 0) {
        sheetName = `Regional_Data_${i / 5}`;
      } else if (i % 3 === 0) {
        sheetName = `Campaign_${Math.ceil(i / 3)}`;
      } else if (i % 7 === 0) {
        sheetName = `Analytics_${Math.ceil(i / 7)}`;
      }

      const columns = [
        { name: "Date", type: "date" as const, values: [] },
        { name: "Revenue", type: "numeric" as const, values: [] },
        { name: "Brand", type: "categorical" as const, values: [] },
      ];

      // Add sheet-specific columns
      if (sheetName.includes('Campaign')) {
        columns.push(
          { name: "TV_Spend", type: "numeric" as const, values: [] },
          { name: "Digital_Spend", type: "numeric" as const, values: [] },
          { name: "Campaign_Type", type: "categorical" as const, values: [] }
        );
      } else if (sheetName.includes('Regional')) {
        columns.push(
          { name: "Region", type: "categorical" as const, values: [] },
          { name: "Population", type: "numeric" as const, values: [] },
          { name: "Market_Share", type: "numeric" as const, values: [] }
        );
      } else if (sheetName.includes('Analytics')) {
        columns.push(
          { name: "CTR", type: "numeric" as const, values: [] },
          { name: "Impressions", type: "numeric" as const, values: [] },
          { name: "Conversions", type: "numeric" as const, values: [] }
        );
      } else {
        columns.push(
          { name: `Metric_${i}`, type: "numeric" as const, values: [] },
          { name: `Category_${i}`, type: "categorical" as const, values: [] }
        );
      }

      mockSheets.push({
        sheetName,
        columns,
        rowCount: 50 + (i * 10), // Varying row counts
        isSelected: true
      });
    }

    return mockSheets;
  }

  /**
   * Validate Excel file format
   */
  static isValidExcelFile(filename: string): boolean {
    const validExtensions = ['.xlsx', '.xls', '.xlsm'];
    return validExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  /**
   * Extract base filename without extension
   */
  static getBaseFilename(filename: string): string {
    return filename.replace(/\.[^/.]+$/, "");
  }
}

// Create singleton instance
export const excelService = new ExcelService();
export default excelService;