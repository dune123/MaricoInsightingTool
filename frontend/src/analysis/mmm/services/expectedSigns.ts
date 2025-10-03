/**
 * ========================================
 * EXPECTED SIGNS SERVICE
 * ========================================
 * 
 * Purpose: Determine expected signs and color coding for variables based on category and brand
 * 
 * Description:
 * This service implements business logic for determining expected signs (positive/negative)
 * and appropriate color coding for variables in different categories based on their relationship
 * to our brand, competitors, and halo brands. Used in marketing mix modeling analysis.
 * 
 * Key Functionality:
 * - Determine expected signs for Distribution, Pricing, Promotion, and Media variables
 * - Apply color coding based on expected signs and business logic
 * - Handle special cases like RPI (Relative Price Index) variables
 * - Support brand categorization (Our Brand, Competitors, Halo Brands)
 * - Exact brand matching using established brand categories from brand categorization
 * 
 * Business Rules:
 * 1. Distribution: Our brand (+, green), Other brands (-, red)
 * 2. Pricing: Our brand (-, red), Other brands (+, green), RPI variables (all red)
 * 3. Promotion: Our brand (+, green), Other brands (-, red)
 * 4. Media: Our brand (+, green), Competitors (-, red), Halo brands (+, blue)
 * 
 * Dependencies:
 * - BrandCategories interface from @/types/analysis
 * 
 * Used by:
 * - ColumnCategorization component for display
 * - DataConcatenationStep for expected signs logic
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

import { BrandCategories } from '@/types/analysis';

export type ExpectedSign = '+' | '-';

export interface VariableExpectedSign {
  variable: string;
  category: string;
  expectedSign: ExpectedSign;
  color: 'green' | 'red' | 'blue';
  reason: string;
}

export interface ExpectedSignsMap {
  [variableName: string]: VariableExpectedSign;
}

/**
 * Extract brand name from variable name by removing common prefixes
 * Uses same logic as brandExtractor.ts to ensure consistency
 */
function extractBrandFromVariable(variableName: string): string {
  const prefixesToRemove = [
    /^Volume\s+/i,
    /^Value\s+/i, 
    /^Units?\s+/i,
    /^Vol\s+/i,
    /^Val\s+/i,
    /^Unit\s+/i,
    /^WTD\s+/i,
    /^Price\s+per\s+ml\s+/i,
    /^Price\s+/i,
    /^RPI\s+/i,
    /^Promo\s+/i,
    /^TUP\s+/i,
    /^BTL\s+/i,
    /^GRP\s+/i,
    /^Spend\s+/i,
    /^Adstocked\s+GRP\s+/i
  ];

  let brandName = variableName.trim();
  for (const prefix of prefixesToRemove) {
    brandName = brandName.replace(prefix, '');
  }

  // CRITICAL FIX: Only clean up whitespace, preserve brand names as-is
  // Don't remove suffixes like "(Entire Brand)", "150-250ML", etc.
  // This ensures consistency with brandExtractor.ts
  brandName = brandName
    .replace(/\s+/g, ' ')
    .trim();

  return brandName;
}

/**
 * Normalize brand name by removing pack sizes and variant suffixes
 * This helps match variable brands like "X-Men Sachet" with category brands like "X-Men"
 */
function normalizeBrandForMatching(brand: string): string {
  return brand
    .replace(/\s*\(entire brand\)/gi, '') // Remove "(Entire Brand)" suffix
    .replace(/\s*\(sachet\)/gi, '') // Remove "(Sachet)" suffix  
    .replace(/\s+sachet$/gi, '') // Remove "Sachet" pack size suffix
    .replace(/\s+(150-250ml|251-500ml|501-650ml|>650ml|<150ml)$/gi, '') // Remove size segments
    .trim();
}

/**
 * Determine which brand category a variable belongs to
 * Uses EXACT matching with the established brand categories from brand categorization
 * Normalizes pack sizes and variants to match with category brands
 */
function getBrandCategory(variableName: string, brandCategories: BrandCategories): 'our' | 'competitor' | 'halo' | 'unknown' {
  const brandFromVariable = extractBrandFromVariable(variableName);
  const normalizedBrand = normalizeBrandForMatching(brandFromVariable);
  
  // CRITICAL: Use EXACT matching with the established brand categories after normalization
  // Check our brand - exact match
  if (normalizedBrand.toLowerCase().trim() === brandCategories.ourBrand.toLowerCase().trim()) {
    return 'our';
  }
  
  // Check competitors - exact match
  if (brandCategories.competitors.some(comp => 
    normalizedBrand.toLowerCase().trim() === comp.toLowerCase().trim()
  )) {
    return 'competitor';
  }
  
  // Check halo brands - exact match  
  if (brandCategories.haloBrands.some(halo => 
    normalizedBrand.toLowerCase().trim() === halo.toLowerCase().trim()
  )) {
    return 'halo';
  }
  
  return 'unknown';
}



/**
 * Determine expected sign and color for Distribution variables
 * Rule: Our brand (+, green), Other brands (-, red)
 */
function getDistributionExpectedSign(variableName: string, brandCategories: BrandCategories): VariableExpectedSign {
  const brandCategory = getBrandCategory(variableName, brandCategories);
  
  if (brandCategory === 'our') {
    return {
      variable: variableName,
      category: 'Distribution',
      expectedSign: '+',
      color: 'green',
      reason: 'Our brand distribution has positive impact'
    };
  } else {
    return {
      variable: variableName,
      category: 'Distribution',
      expectedSign: '-',
      color: 'red',
      reason: 'Competitor/other brand distribution has negative impact'
    };
  }
}

/**
 * Determine expected sign and color for Pricing variables
 * Rule: Our brand (-, red), Other brands (+, green), RPI variables (all red)
 */
function getPricingExpectedSign(variableName: string, brandCategories: BrandCategories): VariableExpectedSign {
  // Special case: RPI variables are always red
  if (/RPI/i.test(variableName)) {
    return {
      variable: variableName,
      category: 'Pricing',
      expectedSign: '-',
      color: 'red',
      reason: 'RPI variables always have negative expected sign'
    };
  }
  
  const brandCategory = getBrandCategory(variableName, brandCategories);
  
  if (brandCategory === 'our') {
    return {
      variable: variableName,
      category: 'Pricing',
      expectedSign: '-',
      color: 'red',
      reason: 'Our brand price increase has negative impact on volume'
    };
  } else {
    return {
      variable: variableName,
      category: 'Pricing',
      expectedSign: '+',
      color: 'green',
      reason: 'Competitor price increase has positive impact on our volume'
    };
  }
}

/**
 * Determine expected sign and color for Promotion variables
 * Rule: Our brand (+, green), Other brands (-, red)
 */
function getPromotionExpectedSign(variableName: string, brandCategories: BrandCategories): VariableExpectedSign {
  const brandCategory = getBrandCategory(variableName, brandCategories);
  
  if (brandCategory === 'our') {
    return {
      variable: variableName,
      category: 'Promotion',
      expectedSign: '+',
      color: 'green',
      reason: 'Our brand promotions have positive impact'
    };
  } else {
    return {
      variable: variableName,
      category: 'Promotion',
      expectedSign: '-',
      color: 'red',
      reason: 'Competitor promotions have negative impact on our brand'
    };
  }
}

/**
 * Determine expected sign and color for Media variables
 * Rule: Our brand (+, green), Competitors (-, red), Halo brands (+, blue)
 */
function getMediaExpectedSign(variableName: string, brandCategories: BrandCategories): VariableExpectedSign {
  const brandCategory = getBrandCategory(variableName, brandCategories);
  
  switch (brandCategory) {
    case 'our':
      return {
        variable: variableName,
        category: 'Media',
        expectedSign: '+',
        color: 'green',
        reason: 'Our brand media has positive impact'
      };
    case 'competitor':
      return {
        variable: variableName,
        category: 'Media',
        expectedSign: '-',
        color: 'red',
        reason: 'Competitor media has negative impact on our brand'
      };
    case 'halo':
      return {
        variable: variableName,
        category: 'Media',
        expectedSign: '+',
        color: 'blue',
        reason: 'Halo brand media has positive impact'
      };
    default:
      return {
        variable: variableName,
        category: 'Media',
        expectedSign: '+',
        color: 'green',
        reason: 'Unknown brand media - default positive'
      };
  }
}

/**
 * Calculate expected signs for all variables in specified categories
 */
export function calculateExpectedSigns(
  columnCategories: Record<string, string[]>,
  brandCategories: BrandCategories
): ExpectedSignsMap {
  const expectedSigns: ExpectedSignsMap = {};
  
  // Process Distribution variables
  if (columnCategories.Distribution) {
    for (const variable of columnCategories.Distribution) {
      expectedSigns[variable] = getDistributionExpectedSign(variable, brandCategories);
    }
  }
  
  // Process Pricing variables
  if (columnCategories.Pricing) {
    for (const variable of columnCategories.Pricing) {
      expectedSigns[variable] = getPricingExpectedSign(variable, brandCategories);
    }
  }
  
  // Process Promotion variables
  if (columnCategories.Promotion) {
    for (const variable of columnCategories.Promotion) {
      expectedSigns[variable] = getPromotionExpectedSign(variable, brandCategories);
    }
  }
  
  // Process Media variables
  if (columnCategories.Media) {
    for (const variable of columnCategories.Media) {
      expectedSigns[variable] = getMediaExpectedSign(variable, brandCategories);
    }
  }
  
  return expectedSigns;
}

/**
 * Get expected sign for a specific variable
 */
export function getExpectedSignForVariable(
  variableName: string,
  category: string,
  brandCategories: BrandCategories
): VariableExpectedSign | null {
  switch (category.toLowerCase()) {
    case 'distribution':
      return getDistributionExpectedSign(variableName, brandCategories);
    case 'pricing':
      return getPricingExpectedSign(variableName, brandCategories);
    case 'promotion':
      return getPromotionExpectedSign(variableName, brandCategories);
    case 'media':
      return getMediaExpectedSign(variableName, brandCategories);
    default:
      return null;
  }
}

/**
 * Get CSS classes for expected sign color coding
 */
export function getExpectedSignClasses(expectedSign: VariableExpectedSign): string {
  const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
  
  switch (expectedSign.color) {
    case 'green':
      return `${baseClasses} bg-secondary/10 text-secondary border border-secondary/20`;
    case 'red':
      return `${baseClasses} bg-destructive/10 text-destructive border border-destructive/20`;
    case 'blue':
      return `${baseClasses} bg-primary/10 text-primary border border-primary/20`;
    default:
      return `${baseClasses} bg-muted/10 text-muted-foreground border border-muted/20`;
  }
}
