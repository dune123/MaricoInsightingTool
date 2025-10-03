/**
 * ========================================
 * COLUMN CATEGORIZATION COMPONENT
 * ========================================
 * 
 * Purpose: Displays categorized columns with target variable and filter selection functionality
 * 
 * Description:
 * This component handles the display of categorized columns (Revenue, Distribution, 
 * Pricing, Promotion, Media, Others) with interactive target variable selection 
 * for Revenue category columns and filter selection for Others category columns. 
 * It provides color-coded badges and visual feedback for better user experience.
 * Now includes expected signs functionality for marketing mix modeling.
 * 
 * Key Functionality:
 * - Display columns organized by business categories
 * - Interactive target variable selection from Revenue category (green theme)
 * - Interactive filter selection from Others category (purple theme)
 * - Color-coded category badges for easy identification
 * - Visual highlighting for selected target variable and filters
 * - Prominent selection prompts for both target variable and filters
 * - Multi-select support for filters with toggle functionality
 * - Expected signs integrated into variable highlighting (no separate boxes)
 * - Brand-based color coding and highlighting for expected signs
 * 
 * Categories:
 * - Revenue: Contains "Volume", "Value", or "Unit" (green theme, single-select for target)
 * - Distribution: Contains "WTD" or "Stores" (blue theme, with expected signs)
 * - Pricing: Contains "Price" or "RPI" (purple theme, with expected signs)
 * - Promotion: Contains "Promo", "TUP", or "BTL" (orange theme, with expected signs)
 * - Media: Contains "GRP" or "Spend" (red theme, with expected signs)
 * - Others: All remaining columns (gray theme, multi-select for filters)
 * 
 * Expected Signs Rules:
 * 1. Distribution: Our brand (+, green), Other brands (-, red)
 * 2. Pricing: Our brand (-, red), Other brands (+, green), RPI variables (all red)
 * 3. Promotion: Our brand (+, green), Other brands (-, red)
 * 4. Media: Our brand (+, green), Competitors (-, red), Halo brands (+, blue)
 * 
 * Dependencies:
 * - React hooks for state management
 * - UI components (Badge) for interface
 * - Tailwind CSS for styling
 * - ExpectedSigns service for sign calculation
 * 
 * Used by:
 * - DataConcatenationStep component
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

import { Badge } from "@/components/ui/badge";
import { BrandCategories } from "@/types/analysis";
import { calculateExpectedSigns, getExpectedSignClasses, ExpectedSignsMap } from "@/analysis/mmm/services";
import { useMemo } from "react";
import { ColumnCategories } from "../data-concatenation/types";

interface ColumnCategorizationProps {
  columnCategories: Record<string, string[]> | ColumnCategories;
  selectedTargetVariable: string | null;
  onTargetVariableSelect: (columnName: string) => void;
  selectedFilters: string[];
  onFilterSelect: (columnName: string) => void;
  brandCategories?: BrandCategories | null;
}

export function ColumnCategorization({ 
  columnCategories, 
  selectedTargetVariable, 
  onTargetVariableSelect,
  selectedFilters,
  onFilterSelect,
  brandCategories
}: ColumnCategorizationProps) {
  
  // Calculate expected signs when brand categories are available
  const expectedSigns: ExpectedSignsMap = useMemo(() => {
    if (!brandCategories) return {};
    return calculateExpectedSigns(columnCategories, brandCategories);
  }, [columnCategories, brandCategories]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Revenue': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'Distribution': return 'bg-primary/10 text-primary border-primary/20';
      case 'Pricing': return 'bg-accent/10 text-accent border-accent/20';
      case 'Promotion': return 'bg-accent/10 text-accent border-accent/20';
      case 'Media': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Others': return 'bg-muted/10 text-muted-foreground border-muted/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  // Categories that should show expected signs
  const categoriesWithSigns = ['Distribution', 'Pricing', 'Promotion', 'Media'];

  return (
    <>
      {/* Target Variable Selection Prompt */}
      {columnCategories.Revenue && columnCategories.Revenue.length > 0 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-secondary/5 to-secondary/10 border-2 border-secondary/20 rounded-lg">
          <div className="text-center">
            <h3 className="text-lg font-bold text-secondary mb-1">
              📊 SELECT TARGET VARIABLE
            </h3>
            <p className="text-sm text-secondary/80 font-medium">
              Choose your dependent variable from the Revenue columns below
            </p>
          </div>
        </div>
      )}

      {/* Filter Selection Prompt */}
      {columnCategories.Others && columnCategories.Others.length > 0 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-accent/5 to-accent/10 border-2 border-accent/20 rounded-lg">
          <div className="text-center">
            <h3 className="text-lg font-bold text-accent mb-1">
              🔍 SELECT FILTERS
            </h3>
            <p className="text-sm text-accent/80 font-medium">
              Choose your filter variables from the Others columns below
            </p>
          </div>
        </div>
      )}

      {/* Column Categories */}
      <div className="mt-4 space-y-4">
        <h4 className="font-medium text-sm">Columns by Category:</h4>
        
        {Object.entries(columnCategories).map(([category, columns]) => {
          if (columns.length === 0) return null;
          
          return (
            <div key={category} className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${getCategoryColor(category)} font-medium`}>
                  {category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {columns.length} column{columns.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {columns.map((column) => {
                  const isSelectedTarget = category === 'Revenue' && selectedTargetVariable === column;
                  const isSelectedFilter = category === 'Others' && selectedFilters.includes(column);
                  const expectedSign = expectedSigns[column];
                  const showExpectedSign = categoriesWithSigns.includes(category) && expectedSign && brandCategories;
                  
                  return (
                    <div key={column} className="flex flex-col gap-1">
                      <Badge 
                        variant={
                          isSelectedTarget || isSelectedFilter 
                            ? "default" 
                            : "outline"
                        }
                        className={`text-xs cursor-pointer transition-all duration-200 ${
                          category === 'Revenue' 
                            ? isSelectedTarget 
                              ? 'bg-secondary text-white border-secondary shadow-md' 
                              : 'hover:bg-secondary/5 hover:border-secondary/20 hover:text-secondary/80'
                            : category === 'Others'
                            ? isSelectedFilter
                              ? 'bg-accent text-white border-accent shadow-md'
                              : 'hover:bg-accent/5 hover:border-accent/20 hover:text-accent/80'
                            : showExpectedSign
                            ? expectedSign.color === 'green'
                              ? 'border-l-4 border-l-secondary bg-secondary/5 text-secondary hover:bg-secondary/10'
                              : expectedSign.color === 'red'
                              ? 'border-l-4 border-l-destructive bg-destructive/5 text-destructive hover:bg-destructive/10'
                              : expectedSign.color === 'blue'
                              ? 'border-l-4 border-l-primary bg-primary/5 text-primary hover:bg-primary/10'
                              : ''
                            : ''
                        }`}
                        onClick={
                          category === 'Revenue' 
                            ? () => onTargetVariableSelect(column)
                            : category === 'Others'
                            ? () => onFilterSelect(column)
                            : undefined
                        }
                        title={showExpectedSign ? expectedSign.reason : undefined}
                      >
                        {column}
                        {isSelectedTarget && (
                          <span className="ml-1 text-white">✓</span>
                        )}
                        {isSelectedFilter && (
                          <span className="ml-1 text-white">✓</span>
                        )}
                        {showExpectedSign && (
                          <span className={`ml-1 font-bold ${
                            expectedSign.color === 'green' ? 'text-secondary' :
                            expectedSign.color === 'red' ? 'text-destructive' :
                            expectedSign.color === 'blue' ? 'text-primary' : ''
                          }`}>
                            {expectedSign.expectedSign}
                          </span>
                        )}
                      </Badge>
                    </div>
                  );
                })}
              </div>
              {category === 'Revenue' && selectedTargetVariable && (
                <div className="mt-2 p-3 bg-secondary/5 border border-secondary/20 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-secondary">✅ Selected Target Variable:</span>
                    <Badge className="bg-secondary text-white font-medium">
                      {selectedTargetVariable}
                    </Badge>
                  </div>
                  <p className="text-xs text-secondary/80 mt-1">
                    This will be used as the dependent variable for modeling and analysis.
                  </p>
                </div>
              )}
              {category === 'Others' && selectedFilters.length > 0 && (
                <div className="mt-2 p-3 bg-accent/5 border border-accent/20 rounded">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-accent">🔍 Selected Filters:</span>
                    {selectedFilters.map((filter) => (
                      <Badge key={filter} className="bg-accent text-white font-medium">
                        {filter}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-accent/80 mt-1">
                    These will be used as filter variables for data analysis and segmentation.
                  </p>
                </div>
              )}
              
              {/* Expected Signs Information */}
              {categoriesWithSigns.includes(category) && columns.length > 0 && brandCategories && (
                <div className="mt-2 p-2 bg-primary/5 border border-primary/20 rounded">
                  <div className="text-xs text-primary">
                    <span className="font-medium">Expected Signs:</span> 
                    <span className="text-secondary mx-1">+ (Green)</span> = Positive impact on {brandCategories.ourBrand}, 
                    <span className="text-destructive mx-1">- (Red)</span> = Negative impact, 
                    <span className="text-primary mx-1">+ (Blue)</span> = Halo brand positive impact
                  </div>
                  <div className="text-xs text-primary/70 mt-1">
                    Hover over expected signs to see the reasoning behind each assignment.
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Expected Signs Legend */}
      {brandCategories && Object.keys(expectedSigns).length > 0 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-2 border-primary/20 rounded-lg">
          <h4 className="font-bold text-primary mb-2">📋 Expected Signs Logic</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-primary/70">
            <div>
              <span className="font-medium">Distribution:</span> Our brand (+), Others (-)
            </div>
            <div>
              <span className="font-medium">Pricing:</span> Our brand (-), Others (+), RPI (all -)
            </div>
            <div>
              <span className="font-medium">Promotion:</span> Our brand (+), Others (-)
            </div>
            <div>
              <span className="font-medium">Media:</span> Our brand (+), Competitors (-), Halo (+)
            </div>
          </div>
          <div className="mt-2 text-xs text-primary/80">
            <span className="font-medium">Our Brand:</span> {brandCategories.ourBrand} | 
            <span className="font-medium ml-2">Competitors:</span> {brandCategories.competitors.length} | 
            <span className="font-medium ml-2">Halo Brands:</span> {brandCategories.haloBrands.length}
          </div>
        </div>
      )}
    </>
  );
}
