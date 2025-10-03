/**
 * FilterSelectionStep Component
 * 
 * Purpose: Interactive filter column selection for data analysis customization
 * 
 * Description: This component allows users to select which columns from their
 * dataset will be used as filters for analysis. It provides an intuitive
 * interface with recommended filters and validation to ensure proper analysis
 * configuration.
 * 
 * Key Functions:
 * - handleColumnToggle(): Toggles column selection for filtering
 * - handleContinue(): Saves selected filters and proceeds to next step
 * - renderColumnRow(): Renders individual column row with selection state
 * - renderRecommendedBadge(): Shows recommended filter indicator
 * 
 * State Variables:
 * - selectedColumns: Array of selected column names for filtering
 * 
 * Filter Features:
 * - Shows all available columns from uploaded dataset
 * - Highlights recommended filters (Brand, Date, Seasonality)
 * - Allows multiple filter selection
 * - Updates global analysis state with selected filters
 * - Provides visual indicators for recommended vs custom filters
 * 
 * Recommended Filters:
 * - Brand: For brand-specific analysis
 * - Date: For temporal analysis and trends
 * - Seasonality: For seasonal adjustment and patterns
 * 
 * Data Flow:
 * 1. Component loads available columns from analysis data
 * 2. User selects/deselects columns for filtering
 * 3. Selected filters are stored in local state
 * 4. On continue, filters are saved to global context
 * 5. Navigation proceeds to next step
 * 
 * Dependencies:
 * - AnalysisContext: Global state and filter column management
 * - UI components: Card, Button, Checkbox, Badge
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAnalysis } from "@/context/AnalysisContext";
import { Badge } from "@/components/ui/badge";

export function FilterSelectionStep() {
  const { state, setFilterColumns } = useAnalysis();
  const [selectedColumns, setSelectedColumns] = useState<string[]>(state.filterColumns);

  const availableColumns = state.analysisData?.columns.map(col => col.name) || [];
  const recommendedFilters = ['Brand', 'Date', 'Seasonality'];

  const handleColumnToggle = (columnName: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnName)
        ? prev.filter(col => col !== columnName)
        : [...prev, columnName]
    );
  };

  const handleContinue = () => {
    setFilterColumns(selectedColumns);
    // Navigation is now handled by the page component
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Select Filter Columns</h2>
        <p className="text-muted-foreground">
          Choose which columns you'd like to use as filters for your analysis
        </p>
      </div>

              <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle>Available Columns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {availableColumns.map((columnName) => {
              const isRecommended = recommendedFilters.includes(columnName);
              const isSelected = selectedColumns.includes(columnName);
              
              return (
                <div
                  key={columnName}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={columnName}
                    checked={isSelected}
                    onCheckedChange={() => handleColumnToggle(columnName)}
                  />
                  <Label 
                    htmlFor={columnName}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span>{columnName}</span>
                      {isRecommended && (
                        <Badge variant="secondary" className="ml-2">
                          Recommended
                        </Badge>
                      )}
                    </div>
                  </Label>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t">
            <div className="mb-3">
              <Label className="text-sm font-medium">Selected Filters ({selectedColumns.length})</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedColumns.map((column) => (
                <Badge key={column} variant="default">
                  {column}
                </Badge>
              ))}
              {selectedColumns.length === 0 && (
                <span className="text-muted-foreground text-sm">No filters selected</span>
              )}
            </div>
          </div>

          <Button onClick={handleContinue} className="w-full">
            Continue to EDA
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}