/**
 * ========================================
 * BRAND EXTRACTOR SERVICE
 * ========================================
 * 
 * Purpose: Extract brand names from target variable names and categorize column brands
 * 
 * Description:
 * This service provides functionality to extract brand names from target variable
 * names by removing measurement type prefixes (Volume, Value, Units) and identify
 * brand categories (Our Brand, Competitors, Halo Brands) from column names.
 * It supports the marketing mix modeling workflow by organizing brands for analysis.
 * 
 * Key Functionality:
 * - Extract brand name from target variable by removing measurement prefixes
 * - Categorize all column brands into Our Brand, Competitors, and Halo Brands
 * - Handle various naming patterns (spaces, hyphens, underscores)
 * - Support case-insensitive brand matching
 * - Provide brand metadata for analysis context
 * 
 * Brand Extraction Logic:
 * - Remove only measurement prefixes: "Volume", "Value", "Units", "Vol", "Val", "Unit"
 * - Preserve complete brand names including variants like "X-Men For Boss"
 * - Only clean up excessive whitespace, keep all other brand components
 * - Return complete brand name for "Our Brand" identification
 * 
 * Dependencies:
 * - No external dependencies - pure utility functions
 * 
 * Used by:
 * - DataConcatenationStep for target variable selection
 * - BrandCategorizationComponent for brand organization
 * - AnalysisContext for metadata storage
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Frontend Team
 */

import { ColumnCategories } from '@/analysis/mmm/steps/data-concatenation/types';
import { BrandCategories } from '@/types/analysis';

export interface BrandMetadata {
  targetVariable: string;
  ourBrand: string;
  allBrands: string[];
  categories: BrandCategories;
  extractedAt: string;
}

/**
 * Extract brand name from target variable name
 * Removes only measurement prefixes like "Volume", "Value", "Units"
 * Preserves complete brand names including variants like "X-Men For Boss"
 */
export function extractBrandFromTargetVariable(targetVariable: string): string {
  if (!targetVariable) return '';

  // Convert to string and trim whitespace
  let brandName = targetVariable.toString().trim();

  // Remove common measurement prefixes (case insensitive)
  const prefixesToRemove = [
    /^Volume\s+/i,
    /^Value\s+/i, 
    /^Units\s+/i,
    /^Vol\s+/i,
    /^Val\s+/i,
    /^Unit\s+/i,
    /^Offtakes+/i
  ];

  for (const prefix of prefixesToRemove) {
    brandName = brandName.replace(prefix, '');
  }

  // Only clean up excessive whitespace, preserve brand names as-is
  brandName = brandName
    .replace(/\s+/g, ' ')         // Multiple spaces to single space
    .trim();

  return brandName;
}

/**
 * Extract all brand names from column list
 * Identifies brands from revenue columns specifically
 */
export function extractAllBrandsFromColumns(columns: string[], columnCategories?: Record<string, string[]> | ColumnCategories): string[] {
  const brands = new Set<string>();

  // Focus on Revenue columns if categories are available, otherwise use all columns
  const relevantColumns = columnCategories?.Revenue || columns;

  for (const column of relevantColumns) {
    const brand = extractBrandFromTargetVariable(column);
    if (brand && brand.length > 0) {
      brands.add(brand);
    }
  }

  return Array.from(brands).sort();
}

/**
 * Categorize brands into Our Brand, Competitors, and Halo Brands
 */
export function categorizeBrands(allBrands: string[], ourBrand: string): BrandCategories {
  const ourBrandLower = ourBrand.toLowerCase().trim();
  
  const competitors = allBrands.filter(brand => 
    brand.toLowerCase().trim() !== ourBrandLower
  );

  return {
    ourBrand,
    competitors,
    haloBrands: [] // Initially empty, user can move competitors here
  };
}

/**
 * Create complete brand metadata from target variable selection
 */
export function createBrandMetadata(
  targetVariable: string, 
  allColumns: string[], 
  columnCategories?: Record<string, string[]> | ColumnCategories
): BrandMetadata {
  const ourBrand = extractBrandFromTargetVariable(targetVariable);
  const allBrands = extractAllBrandsFromColumns(allColumns, columnCategories);
  const categories = categorizeBrands(allBrands, ourBrand);

  return {
    targetVariable,
    ourBrand,
    allBrands,
    categories,
    extractedAt: new Date().toISOString()
  };
}

/**
 * Move a brand from competitors to halo brands
 */
export function moveBrandToHalo(categories: BrandCategories, brandName: string): BrandCategories {
  const updatedCompetitors = categories.competitors.filter(brand => brand !== brandName);
  const updatedHaloBrands = [...categories.haloBrands];
  
  if (!updatedHaloBrands.includes(brandName)) {
    updatedHaloBrands.push(brandName);
  }

  return {
    ...categories,
    competitors: updatedCompetitors,
    haloBrands: updatedHaloBrands.sort()
  };
}

/**
 * Move a brand from halo brands back to competitors
 */
export function moveBrandToCompetitors(categories: BrandCategories, brandName: string): BrandCategories {
  const updatedHaloBrands = categories.haloBrands.filter(brand => brand !== brandName);
  const updatedCompetitors = [...categories.competitors];
  
  if (!updatedCompetitors.includes(brandName)) {
    updatedCompetitors.push(brandName);
  }

  return {
    ...categories,
    competitors: updatedCompetitors.sort(),
    haloBrands: updatedHaloBrands
  };
}
