/**
 * ========================================
 * DATA PREVIEW TABLE COMPONENT
 * ========================================
 * 
 * Purpose: Displays scrollable preview table of concatenated data
 * 
 * Description:
 * This component renders a scrollable table showing the actual concatenated data
 * with sticky headers and support for large datasets. It displays up to 100 rows
 * and the first 10 columns for better readability, with an indicator for additional columns.
 * 
 * Key Functionality:
 * - Scrollable table with sticky headers
 * - Support for large datasets (up to 100 rows)
 * - First 10 columns displayed for optimal readability
 * - Indicator for additional columns when more than 10 exist
 * - Responsive design with proper spacing
 * - Empty value handling with dash placeholders
 * 
 * Dependencies:
 * - React for component structure
 * - UI components (Table) for interface
 * - Tailwind CSS for styling
 * 
 * Used by:
 * - DataConcatenationStep component
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DataPreviewTableProps {
  previewColumns: string[];
  concatenatedData: Record<string, string | number>[];
}

export function DataPreviewTable({ previewColumns, concatenatedData }: DataPreviewTableProps) {
  // Limit to first 10 columns for better readability
  const displayColumns = previewColumns.slice(0, 10);
  const hasMoreColumns = previewColumns.length > 10;
  
  return (
    <div className="overflow-auto max-h-96 border rounded-lg">
      <Table>
        <TableHeader className="sticky top-0 bg-background">
          <TableRow>
            {displayColumns.map((column) => (
              <TableHead key={column} className="text-xs min-w-[120px] px-2">
                {column}
              </TableHead>
            ))}
            {hasMoreColumns && (
              <TableHead className="text-xs min-w-[120px] px-2 text-center">
                ...
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {concatenatedData.map((row, index) => (
            <TableRow key={index}>
              {displayColumns.map((column) => (
                <TableCell key={column} className="text-xs px-2">
                  {row[column] || '-'}
                </TableCell>
              ))}
              {hasMoreColumns && (
                <TableCell className="text-xs px-2 text-center text-muted-foreground">
                  ...
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {hasMoreColumns && (
        <div className="p-2 text-xs text-muted-foreground text-center border-t bg-muted/30">
          Showing first 10 columns of {previewColumns.length} total columns
        </div>
      )}
    </div>
  );
}
