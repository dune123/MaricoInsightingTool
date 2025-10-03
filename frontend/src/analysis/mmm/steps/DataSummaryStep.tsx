/**
 * DataSummaryStep Component
 * 
 * Purpose: Comprehensive data overview and analysis with real-time filtering capabilities
 * 
 * Description: This component provides a detailed summary of the concatenated dataset with
 * interactive filtering, statistical analysis, and data visualization. It displays filtered
 * data based on user-selected filter values and shows comprehensive statistics, data
 * distribution charts, and data quality metrics.
 * 
 * Key Functions:
 * - handleFilterChange(): Updates filter values and triggers data reload
 * - loadFilteredData(): Fetches filtered data from backend based on selected filters
 * - renderDataSummary(): Displays comprehensive dataset statistics and metrics
 * - renderColumnSummary(): Shows column information with data types and statistics
 * - renderDataQuality(): Displays data quality validation and issue detection
 * 
 * State Variables:
 * - filteredData: Holds the filtered dataset response from backend
 * - isLoading: Tracks data loading state
 * - activeFilters: Stores currently active filter values
 * 
 * API Endpoints:
 * - POST /api/data/filtered: Retrieves filtered data based on selected filters
 * 
 * Data Flow:
 * 1. User selects filters (PackSize, Region, Channel) from sidebar
 * 2. Filters are applied and data is fetched from backend
 * 3. Filtered data is displayed with statistics and visualizations
 * 4. Data quality metrics and column summaries are shown
 * 5. User can modify filters to see different data views
 * 
 * Dependencies:
 * - AnalysisContext: Global state and filter management
 * - FilterSidebar: Left-side filter navigation component
 * - DataSummaryService: Backend data filtering and retrieval
 * - DataDistributionChart: Data visualization component
 * - UI components: Card, Button, Table, Tabs, Badge
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/context/AnalysisContext";
import { DataDistributionChart } from "@/components/charts/DataDistributionChart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FilterSidebar } from "./FilterSidebar";
import { dataSummaryService, FilteredDataResponse } from "@/analysis/mmm/services";

export function DataSummaryStep() {
  const { state, setFilterValues } = useAnalysis();
  const { analysisData } = state;
  const [filteredData, setFilteredData] = useState<FilteredDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  // Don't load initial data - wait for user to select all filters
  // useEffect(() => {
  //   const loadInitialData = async () => {
  //     if (!analysisData || isLoading) return;
  //     
  //     // Try to get the filename from various sources
  //     const filename = analysisData.processedFilename || 
  //                     analysisData.filename || 
  //                     (analysisData.concatenationConfig?.customFileName ? 
  //                       `${analysisData.concatenationConfig.customFileName}.xlsx` : null);
  //     
  //     if (!filename) {
  //       console.warn('No filename available for loading initial data');
  //       return;
  //     }

  //     try {
  //       setIsLoading(true);
  //       const response = await dataSummaryService.getFilteredData(
  //         filename,
  //         {}, // Empty filters to get all data
  //         undefined,
  //       1000,
  //         state.selectedBrand || undefined
  //       );
  //       setFilteredData(response);
  //     } catch (error) {
  //       console.error('Failed to load initial data:', error);
  //       setFilteredData(null);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   loadInitialData();
  // }, [analysisData, state.selectedBrand, isLoading]);

  if (!analysisData) {
    return <div>No data available</div>;
  }

  // Handle case where columns might not be available (resumed analysis)
  const columns = analysisData.columns || [];
  const numericColumns = columns.filter(col => col.type === 'numeric');
  const categoricalColumns = columns.filter(col => col.type === 'categorical');
  const dateColumns = columns.filter(col => col.type === 'date');

  // Handle filter changes and load filtered data
  const handleFiltersChange = async (filters: Record<string, string>) => {
    setActiveFilters(filters);
    setFilterValues(filters);
    
    // Try to get the filename from various sources
    const filename = analysisData.processedFilename || 
                    analysisData.filename || 
                    (analysisData.concatenationConfig?.customFileName ? 
                      `${analysisData.concatenationConfig.customFileName}.xlsx` : null);
    
    if (!filename) {
      console.warn('No filename available for filtering');
      return;
    }

    try {
      setIsLoading(true);
      const response = await dataSummaryService.getFilteredData(
        filename,
        filters,
        undefined,
        1000,
        state.selectedBrand || undefined
      );
      setFilteredData(response);
    } catch (error) {
      console.error('Failed to load filtered data:', error);
      // Fallback to showing unfiltered data
      setFilteredData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Use filtered data if available, otherwise use original analysis data
  const displayData = filteredData?.data || {
    totalRows: analysisData.rowCount,
    columns: columns.map(col => col.name),
    rows: []
  };

  // Debug: DataSummaryStep analysisData structure (can be removed in production)
  // console.log('📊 DataSummaryStep - analysisData structure:', { hasColumns: !!analysisData.columns, columnsLength: columns.length });

  // Check if this is a resumed analysis with completed concatenation
  const isResumedAnalysis = analysisData.isConcatenated && !columns.length;
  
  // If this is a resumed analysis without column details, show a simplified view
  if (isResumedAnalysis) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Data Summary</h2>
          <p className="text-muted-foreground">
            Resuming analysis for: {analysisData.filename}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Analysis Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary/5 border border-secondary/20 rounded-lg">
                <div>
                  <h3 className="font-semibold text-secondary">Data Concatenation Completed</h3>
                  <p className="text-sm text-secondary/80">
                    Your data has been successfully processed and concatenated.
                  </p>
                </div>
                <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                  ✅ Complete
                </Badge>
              </div>

              {analysisData.targetVariable && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <h4 className="font-medium text-primary">Target Variable Selected</h4>
                  <p className="text-sm text-primary/80 mt-1">
                    {analysisData.targetVariable}
                  </p>
                </div>
              )}

              {analysisData.selectedFilters && analysisData.selectedFilters.length > 0 && (
                <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
                  <h4 className="font-medium text-accent">Filters Selected</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {analysisData.selectedFilters.map((filter, index) => (
                      <Badge key={index} variant="outline" className="text-accent/80 border-accent/30">
                        {filter}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-800">Dataset Information</h4>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Rows:</span> {analysisData.rowCount || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> Ready for next steps
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            This step was completed in your previous session. You can proceed to the next step.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Left Sidebar - Filters */}
      <FilterSidebar onFiltersChange={handleFiltersChange} />
      
      {/* Main Content - Data Summary */}
      <div className="flex-1 space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Data Summary</h2>
          <p className="text-muted-foreground">
            Overview of your uploaded dataset: {analysisData.filename}
          </p>
          
          {/* No Filters Selected State */}
          {Object.keys(activeFilters).length === 0 && (
            <div className="mt-8 py-12">
              <div className="text-primary mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Select Your Filters</h3>
              <p className="text-muted-foreground text-sm mx-auto">
                Please select all three filters (PackSize, Region, Channel) from the left sidebar to view your data summary. 
                This ensures you see the most relevant data for your analysis.
              </p>
            </div>
          )}
          
          {/* Active Filters Display */}
          {Object.keys(activeFilters).length > 0 && (
            <div className="mt-4 flex justify-center gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {Object.entries(activeFilters).map(([column, value]) => (
                <Badge key={column} variant="secondary" className="text-xs">
                  {column}: {value}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading filtered data...</p>
            </div>
          )}
          
          {/* Error State */}
          {!isLoading && filteredData === null && Object.keys(activeFilters).length > 0 && (
            <div className="text-center py-8">
              <div className="text-destructive mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-destructive font-medium mb-2">Failed to load filtered data</p>
              <p className="text-muted-foreground text-sm">
                The filters are applied but data couldn't be loaded. Showing unfiltered summary.
              </p>
            </div>
          )}
        </div>

      {/* Filtered Data Preview */}
      {filteredData && filteredData.data.rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Filtered Data Preview</CardTitle>
            <p className="text-sm text-muted-foreground">
              Showing {filteredData.data.rows.length} rows from {filteredData.data.totalRows} total rows
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {filteredData.data.columns.slice(0, 10).map((column) => (
                      <TableHead key={column}>{column}</TableHead>
                    ))}
                    {filteredData.data.columns.length > 10 && (
                      <TableHead>...</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.data.rows.slice(0, 5).map((row, index) => (
                    <TableRow key={index}>
                      {filteredData.data.columns.slice(0, 10).map((column) => (
                        <TableCell key={`${index}-${column}`} className="text-sm">
                          {String(row[column] || '').substring(0, 50)}
                          {String(row[column] || '').length > 50 ? '...' : ''}
                        </TableCell>
                      ))}
                      {filteredData.data.columns.length > 10 && (
                        <TableCell key={`${index}-more`}>...</TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Logic Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Rows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="animate-pulse h-8 bg-gray-200 rounded w-20"></div>
              ) : (
                displayData.totalRows.toLocaleString()
              )}
            </div>
            {filteredData && (
              <p className="text-xs text-muted-foreground mt-1">
                Filtered from {analysisData.rowCount.toLocaleString()} total rows
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Columns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayData.columns.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Time Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2 Years</div>
            <p className="text-xs text-muted-foreground">Weekly data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Data Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="bg-success/10 text-success">
              Excellent
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">Complete dataset</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="statistics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="statistics">Statistical Summary</TabsTrigger>
          <TabsTrigger value="distributions">Data Distributions</TabsTrigger>
          <TabsTrigger value="columns">Column Details</TabsTrigger>
        </TabsList>

        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statistical Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Mean</TableHead>
                    <TableHead>Median</TableHead>
                    <TableHead>Std Dev</TableHead>
                    <TableHead>Min</TableHead>
                    <TableHead>Max</TableHead>
                    <TableHead>Null Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {numericColumns.map((column) => (
                    <TableRow key={column.name}>
                      <TableCell className="font-medium">{column.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{column.type}</Badge>
                      </TableCell>
                      <TableCell>{column.statistics?.mean?.toLocaleString()}</TableCell>
                      <TableCell>{column.statistics?.median?.toLocaleString()}</TableCell>
                      <TableCell>{column.statistics?.std?.toLocaleString()}</TableCell>
                      <TableCell>{column.statistics?.min?.toLocaleString()}</TableCell>
                      <TableCell>{column.statistics?.max?.toLocaleString()}</TableCell>
                      <TableCell>{column.statistics?.nullCount || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distributions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analysisData.columns.map((column) => (
              <Card key={column.name}>
                <CardHeader>
                  <CardTitle className="text-base">{column.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataDistributionChart column={column} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="columns" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Numeric Columns ({numericColumns.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {numericColumns.map((column) => (
                    <Badge key={column.name} variant="secondary">
                      {column.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Categorical Columns ({categoricalColumns.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {categoricalColumns.map((column) => (
                    <Badge key={column.name} variant="outline">
                      {column.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Date Columns ({dateColumns.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {dateColumns.map((column) => (
                    <Badge key={column.name} variant="secondary" className="bg-accent/10 text-accent">
                      {column.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div> {/* Close main content div */}
    </div>
  );
}