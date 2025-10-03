/**
 * ========================================
 * FILTERED DATA TABLE COMPONENT
 * ========================================
 * 
 * Purpose: Reusable table component for displaying filtered Excel data
 * 
 * Description:
 * This component provides a comprehensive data table interface with built-in
 * filtering capabilities. It integrates with the FilterService and useFilteredData
 * hook to provide real-time data filtering and display.
 * 
 * Key Functionality:
 * - Display filtered data in a responsive table
 * - Show filter controls for selected filter columns
 * - Real-time filter application and data updates
 * - Loading states and error handling
 * - Pagination for large datasets
 * - Export functionality for filtered data
 * 
 * Dependencies:
 * - useFilteredData hook for data management
 * - UI components (Table, Select, Button) for interface
 * - FilterService for backend integration
 * 
 * Used by:
 * - EDA step for data exploration
 * - Analysis components requiring filtered data
 * - Data preview components
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Filter, Download, RefreshCw, X } from 'lucide-react';
import { useFilteredData, UseFilteredDataOptions } from '@/hooks/useFilteredData';
import { useAnalysis } from '@/context/AnalysisContext';

export interface FilteredDataTableProps {
  title?: string;
  subtitle?: string;
  showFilterControls?: boolean;
  maxRows?: number;
  options?: UseFilteredDataOptions;
  onDataChange?: (data: Record<string, any>[]) => void;
}

export function FilteredDataTable({
  title = "Filtered Data",
  subtitle = "Data filtered by selected criteria",
  showFilterControls = true,
  maxRows = 100,
  options = {},
  onDataChange
}: FilteredDataTableProps) {
  const { state } = useAnalysis();
  const [selectedPage, setSelectedPage] = useState(0);
  
  const {
    data,
    originalRows,
    totalRows,
    columns,
    filterValues,
    filterOptions,
    appliedFilters,
    isLoading,
    error,
    setFilterValue,
    clearFilter,
    clearAllFilters,
    applyFilters,
    refreshData,
    getUniqueValues,
    isFilterActive
  } = useFilteredData({
    autoFetch: true,
    limit: maxRows,
    ...options
  });

  // Notify parent component of data changes
  React.useEffect(() => {
    if (onDataChange) {
      onDataChange(data);
    }
  }, [data, onDataChange]);

  // Pagination
  const itemsPerPage = 20;
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = selectedPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, data.length);
  const paginatedData = data.slice(startIndex, endIndex);

  const handleFilterChange = (column: string, value: string) => {
    if (value === "clear") {
      clearFilter(column);
    } else {
      const currentValues = filterValues[column] || [];
      const newValues = currentValues.includes(value) 
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      setFilterValue(column, newValues);
    }
  };

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') return value.toLocaleString();
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  const exportData = () => {
    // Create CSV content
    const headers = columns.join(',');
    const csvRows = data.map(row => 
      columns.map(col => {
        const value = row[col];
        const stringValue = formatCellValue(value);
        // Escape quotes and wrap in quotes if contains comma
        return stringValue.includes(',') ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
      }).join(',')
    );
    const csvContent = [headers, ...csvRows].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `filtered_data_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Error loading data: {error}
              <Button variant="outline" size="sm" onClick={refreshData} className="ml-2">
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              {title}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {subtitle} • Showing {totalRows.toLocaleString()} of {originalRows.toLocaleString()} rows
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportData} disabled={data.length === 0}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filter Controls */}
        {showFilterControls && state.selectedFilters.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Filter Controls</h4>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={applyFilters} disabled={isLoading}>
                  Apply Filters
                </Button>
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {state.selectedFilters.map(filterColumn => (
                <div key={filterColumn} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">{filterColumn}</label>
                    {isFilterActive(filterColumn) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearFilter(filterColumn)}
                        className="h-auto p-1"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  
                  <Select onValueChange={(value) => handleFilterChange(filterColumn, value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={`Filter by ${filterColumn}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clear">Clear Filter</SelectItem>
                      {getUniqueValues(filterColumn).map((value, index) => (
                        <SelectItem key={index} value={String(value)}>
                          {formatCellValue(value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Show applied filter values */}
                  {filterValues[filterColumn] && filterValues[filterColumn].length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {filterValues[filterColumn].map((value, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {formatCellValue(value)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Applied Filters Summary */}
            {Object.keys(appliedFilters).length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Active Filters:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(appliedFilters).map(([column, values]) => (
                    <Badge key={column} variant="default" className="text-xs">
                      {column}: {values.join(', ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Data Table */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="w-full h-8" />
            <Skeleton className="w-full h-64" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No data available with current filters
          </div>
        ) : (
          <>
            <div className="rounded-md border max-h-[400px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column} className="font-medium">
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {columns.map((column) => (
                        <TableCell key={column} className="py-2">
                          {formatCellValue(row[column])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{endIndex} of {data.length} rows
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPage(prev => Math.max(0, prev - 1))}
                    disabled={selectedPage === 0}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {selectedPage + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPage(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={selectedPage === totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
