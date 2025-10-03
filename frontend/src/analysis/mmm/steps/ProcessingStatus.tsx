/**
 * ========================================
 * PROCESSING STATUS COMPONENT
 * ========================================
 * 
 * Purpose: Displays concatenation processing status and completion feedback
 * 
 * Description:
 * This component shows the current status of the concatenation process including
 * loading states, success messages, error handling, and summary statistics.
 * It provides visual feedback to users about the progress and results of the
 * concatenation operation.
 * 
 * Key Functionality:
 * - Processing state indicators with animations
 * - Success state with completion statistics
 * - Error state with retry functionality
 * - Summary cards showing sheets, columns, and rows count
 * - Download functionality for processed files
 * 
 * Dependencies:
 * - React for component structure
 * - UI components (Card, Button, Badge) for interface
 * - Lucide React for icons
 * - Tailwind CSS for styling
 * 
 * Used by:
 * - DataConcatenationStep component
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Frontend Team
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Download, AlertCircle, CheckCircle, FileCheck, Table } from "lucide-react";
import { PriceSheetInfo } from "@/types/analysis";

interface ProcessingStatusProps {
  isProcessing: boolean;
  isProcessed: boolean;
  error: string | null;
  selectedSheetsCount: number;
  originalFileName: string;
  previewColumnsCount: number;
  totalRows: number;
  concatenatedFile: string | null;
  priceSheet?: PriceSheetInfo;
  onRetry: () => void;
  onDownload: () => void;
}

export function ProcessingStatus({
  isProcessing,
  isProcessed,
  error,
  selectedSheetsCount,
  originalFileName,
  previewColumnsCount,
  totalRows,
  concatenatedFile,
  priceSheet,
  onRetry,
  onDownload
}: ProcessingStatusProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isProcessing ? (
            <div className="w-5 h-5 animate-spin">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          ) : isProcessed ? (
            <CheckCircle className="w-5 h-5 text-secondary" />
          ) : (
            <AlertCircle className="w-5 h-5 text-accent" />
          )}
          Concatenation Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isProcessing && (
          <div className="text-center py-4">
            <p className="font-medium">Processing concatenation...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Merging {selectedSheetsCount} sheets from {originalFileName}
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 border border-destructive rounded-lg bg-destructive/5">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Concatenation Error</span>
            </div>
            <p className="text-sm mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={onRetry}
            >
              Retry Concatenation
            </Button>
          </div>
        )}

        {isProcessed && !error && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-secondary">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Concatenation completed successfully</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{selectedSheetsCount}</div>
                <div className="text-sm text-muted-foreground">Sheets Combined</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{previewColumnsCount}</div>
                <div className="text-sm text-muted-foreground">Total Columns</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{totalRows.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Rows</div>
              </div>
            </div>

            {/* Price Sheet Information */}
            {priceSheet && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Table className="w-5 h-5 text-primary" />
                  <span className="font-medium text-primary">Price Sheet</span>
                  <Badge variant={priceSheet.created ? "default" : "secondary"} className="ml-auto">
                    {priceSheet.created ? "Created" : "Not Available"}
                  </Badge>
                </div>
                
                {priceSheet.created ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-primary/70">Region-Month Combinations:</span>
                      <span className="font-medium text-primary">{priceSheet.rowCount}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-primary/70">Price Columns Found:</span>
                      <span className="font-medium text-primary">{priceSheet.columns.length - 2}</span>
                    </div>
                    {priceSheet.columns.length > 2 && (
                      <div className="mt-2">
                        <div className="text-xs text-primary mb-1">Price Columns:</div>
                        <div className="flex flex-wrap gap-1">
                          {priceSheet.columns.slice(2).map((column, index) => (
                            <Badge key={index} variant="outline" className="text-xs text-primary/70 border-primary/30">
                              {column}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-primary/70">
                    No region-month data or price columns found in selected sheets.
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-secondary/5 border border-secondary/20 rounded-lg">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-secondary" />
                <span className="font-medium text-secondary">File Created: {concatenatedFile}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onDownload}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
