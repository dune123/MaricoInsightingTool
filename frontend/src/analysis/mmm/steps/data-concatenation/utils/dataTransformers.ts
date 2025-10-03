/**
 * ========================================
 * DATA TRANSFORMERS - DATA CONCATENATION MODULE
 * ========================================
 * 
 * Purpose: Data transformation utility functions
 * 
 * Description:
 * Pure functions for transforming and processing data structures used in
 * the data concatenation step. Includes column categorization, data formatting,
 * and structure conversion utilities.
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

import { ColumnCategories, PreviewDataRow, BrandMetadata } from '../types';
import { BrandCategories } from '@/types/analysis';

/**
 * Categorize columns by business purpose based on naming patterns
 */
export function categorizeColumns(columns: string[]): ColumnCategories {
  return {
    Revenue: columns.filter(col => /volume|value|unit/i.test(col)),
    Distribution: columns.filter(col => /wtd|stores/i.test(col)),
    Pricing: columns.filter(col => /price|rpi/i.test(col)),
    Promotion: columns.filter(col => /promo|tup|btl/i.test(col)),
    Media: columns.filter(col => /grp|spend/i.test(col)),
    Others: columns.filter(col => 
      !/(volume|value|unit|wtd|stores|price|rpi|promo|tup|btl|grp|spend)/i.test(col)
    )
  };
}

/**
 * Extract brand names from column headers
 */
export function extractBrandNames(columns: string[]): string[] {
  const brands = new Set<string>();
  
  columns.forEach(col => {
    // Look for patterns like "Volume Brand Name" or "Value Brand Name"
    const match = col.match(/(?:volume|value|unit)\s+(.+?)(?:\s|$)/i);
    if (match && match[1]) {
      const brandName = match[1].trim();
      if (brandName && brandName.length > 1) {
        brands.add(brandName);
      }
    }
  });
  
  return Array.from(brands);
}

/**
 * Create brand metadata from target variable
 */
export function createBrandMetadata(
  targetVariable: string,
  allColumns: string[],
  columnCategories?: ColumnCategories
): BrandMetadata {
  // Extract our brand from target variable
  const ourBrandMatch = targetVariable.match(/(?:volume|value|unit)\s+(.+?)(?:\s|$)/i);
  const ourBrand = ourBrandMatch ? ourBrandMatch[1].trim() : '';
  
  // Get all brands from revenue columns
  const revenueColumns = columnCategories?.Revenue || 
    allColumns.filter(col => /volume|value|unit/i.test(col));
  
  const allBrands = extractBrandNames(revenueColumns);
  
  // Categorize brands
  const competitors = allBrands.filter(brand => 
    brand !== ourBrand && 
    !brand.toLowerCase().includes(ourBrand.toLowerCase())
  );
  
  const haloBrands = allBrands.filter(brand => 
    brand !== ourBrand && 
    brand.toLowerCase().includes(ourBrand.toLowerCase())
  );
  
  return {
    targetVariable,
    ourBrand,
    allBrands,
    categories: {
      ourBrand,
      competitors,
      haloBrands
    },
    extractedAt: new Date().toISOString()
  };
}

/**
 * Transform API response data to preview data format
 */
export function transformApiDataToPreview(apiData: any): PreviewDataRow[] {
  if (!apiData || !apiData.rows) {
    return [];
  }
  
  return apiData.rows.map((row: any) => {
    const transformedRow: PreviewDataRow = {};
    
    // Ensure all values are properly typed
    Object.keys(row).forEach(key => {
      const value = row[key];
      
      // Convert to appropriate type
      if (typeof value === 'number') {
        transformedRow[key] = value;
      } else if (typeof value === 'string') {
        // Try to parse as number if it looks numeric
        const numValue = parseFloat(value);
        transformedRow[key] = !isNaN(numValue) && isFinite(numValue) ? numValue : value;
      } else {
        transformedRow[key] = String(value || '');
      }
    });
    
    return transformedRow;
  });
}

/**
 * Create sample data row for placeholder display
 */
export function createSampleDataRow(columns: string[]): PreviewDataRow {
  const sampleRow: PreviewDataRow = {};
  
  columns.forEach(col => {
    sampleRow[col] = 'Data available - select target variable to view';
  });
  
  return sampleRow;
}

/**
 * Filter data by selected filters
 */
export function filterPreviewData(
  data: PreviewDataRow[],
  filters: Record<string, any>
): PreviewDataRow[] {
  if (!data || data.length === 0 || !filters || Object.keys(filters).length === 0) {
    return data;
  }
  
  return data.filter(row => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value || value === '') return true;
      return row[key] === value;
    });
  });
}

/**
 * Get unique values for a column
 */
export function getUniqueColumnValues(data: PreviewDataRow[], columnName: string): (string | number)[] {
  const values = new Set<string | number>();
  
  data.forEach(row => {
    const value = row[columnName];
    if (value !== undefined && value !== null && value !== '') {
      values.add(value);
    }
  });
  
  return Array.from(values).sort();
}

/**
 * Calculate basic statistics for numeric columns
 */
export function calculateColumnStats(data: PreviewDataRow[], columnName: string) {
  const numericValues = data
    .map(row => row[columnName])
    .filter(value => typeof value === 'number' && !isNaN(value)) as number[];
  
  if (numericValues.length === 0) {
    return null;
  }
  
  const sum = numericValues.reduce((acc, val) => acc + val, 0);
  const mean = sum / numericValues.length;
  const sortedValues = [...numericValues].sort((a, b) => a - b);
  const median = sortedValues.length % 2 === 0
    ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
    : sortedValues[Math.floor(sortedValues.length / 2)];
  
  return {
    count: numericValues.length,
    sum,
    mean: parseFloat(mean.toFixed(2)),
    median: parseFloat(median.toFixed(2)),
    min: Math.min(...numericValues),
    max: Math.max(...numericValues)
  };
}
