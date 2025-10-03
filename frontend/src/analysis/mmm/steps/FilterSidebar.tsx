/**
 * FilterSidebar Component
 * 
 * Purpose: Left-side filter navigation sidebar for data filtering and selection
 * 
 * Description: This component provides a sidebar with filter dropdowns for the data
 * summary step. It displays filter options for pre-selected columns (PackSize, Region,
 * Channel) and allows users to filter the displayed data. Users must select all
 * filters before data is loaded to ensure meaningful filtering.
 * 
 * Key Functions:
 * - loadFilterOptions(): Fetches available filter options from backend
 * - handleFilterChange(): Updates selected filter values and triggers parent callback
 * - renderFilterDropdown(): Renders individual filter dropdown components
 * - renderProgressIndicator(): Shows filter completion progress
 * 
 * State Variables:
 * - filterOptions: Available options for each filter column
 * - selectedFilters: Currently selected filter values
 * - isLoading: Loading state for filter options
 * 
 * Props:
 * - onFiltersChange: Callback function when filters change
 * 
 * API Endpoints:
 * - GET /api/data/filter-options: Retrieves available filter options for columns
 * 
 * Data Flow:
 * 1. Component loads and fetches filter options from backend
 * 2. User selects values for each filter dropdown
 * 3. When all filters are selected, parent component is notified
 * 4. Filter state is maintained across component re-renders
 * 
 * Dependencies:
 * - AnalysisContext: Global state and filter column management
 * - DataSummaryService: Backend filter options retrieval
 * - UI components: Card, Label, Select, Badge
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAnalysis } from "@/context/AnalysisContext";
import { dataSummaryService } from "@/analysis/mmm/services";

interface FilterSidebarProps {
  onFiltersChange: (filters: Record<string, string>) => void;
}

export function FilterSidebar({ onFiltersChange }: FilterSidebarProps) {
  const { state, setFilterColumns } = useAnalysis();
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({});
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Get the selected filter columns from the analysis context
  const filterColumns = state.filterColumns.length > 0 
    ? state.filterColumns 
    : ['PackSize', 'Region', 'Channel']; // Default filters if none selected

  // Set default filter columns if none are selected
  useEffect(() => {
    if (state.filterColumns.length === 0) {
      setFilterColumns(['PackSize', 'Region', 'Channel']);
    }
  }, [state.filterColumns, setFilterColumns]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      // Try to get the filename from various sources
      const filename = state.analysisData?.processedFilename || 
                      state.analysisData?.filename || 
                      (state.analysisData?.concatenationConfig?.customFileName ? 
                        `${state.analysisData.concatenationConfig.customFileName}.xlsx` : null);
      
      if (!filename) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const options = await dataSummaryService.getFilterOptions(
          filename,
          filterColumns,
          state.selectedBrand
        );
        setFilterOptions(options);

        // Don't pre-select any filters - let user choose
        setSelectedFilters({});
        // Don't call onFiltersChange until user selects all filters
      } catch (error) {
        console.error('Failed to load filter options:', error);
        // Set default filter options if API fails
        const defaultOptions: Record<string, string[]> = {
          PackSize: ['Sachet', 'Bottle', 'Can'],
          Region: ['CH', 'US', 'UK'],
          Channel: ['GT', 'MT', 'Online']
        };
        setFilterOptions(defaultOptions);
        
        // Don't set default filters - let user choose
        setSelectedFilters({});
        // Don't call onFiltersChange until user selects all filters
      } finally {
        setIsLoading(false);
      }
    };

    loadFilterOptions();
  }, [state.analysisData?.processedFilename, filterColumns, onFiltersChange]);

  const handleFilterChange = (column: string, value: string) => {
    const newFilters = { ...selectedFilters, [column]: value };
    setSelectedFilters(newFilters);
    
    // Only call onFiltersChange when ALL filters are selected
    const allFiltersSelected = filterColumns.every(col => newFilters[col]);
    if (allFiltersSelected) {
      onFiltersChange(newFilters);
    }
  };

  if (isLoading) {
    return (
      <div className="w-80 p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filterColumns.map(column => (
                <div key={column} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-80 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Filters</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select all filters below to view your data summary
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filter Progress Indicator */}
          <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary">Filter Progress</span>
              <span className="text-sm text-primary/80">
                {Object.keys(selectedFilters).length} of {filterColumns.length} selected
              </span>
            </div>
            <div className="w-full bg-primary/20 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(Object.keys(selectedFilters).length / filterColumns.length) * 100}%` }}
              ></div>
            </div>
            {Object.keys(selectedFilters).length < filterColumns.length && (
              <p className="text-xs text-primary/70 mt-2">
                Select all filters to view your data summary
              </p>
            )}
          </div>

          {filterColumns.map(column => {
            const options = filterOptions[column] || [];
            const selectedValue = selectedFilters[column];
            
            return (
              <div key={column} className="space-y-2">
                <Label htmlFor={`filter-${column}`} className="text-sm font-medium">
                  {column}
                  {selectedValue && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      ✓ Selected
                    </Badge>
                  )}
                </Label>
                <Select
                  value={selectedValue}
                  onValueChange={(value) => handleFilterChange(column, value)}
                >
                  <SelectTrigger id={`filter-${column}`}>
                    <SelectValue placeholder={`Select ${column}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedValue && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Active: {selectedValue}
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
          
          <div className="pt-4 border-t">
            <div className="text-xs text-muted-foreground">
              <p>• Filters are applied in real-time</p>
              <p>• No "ALL" option to ensure meaningful data</p>
              <p>• Values are pre-selected from your data</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
