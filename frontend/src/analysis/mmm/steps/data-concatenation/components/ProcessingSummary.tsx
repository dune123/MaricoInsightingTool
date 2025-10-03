/**
 * ========================================
 * PROCESSING SUMMARY COMPONENT - DATA CONCATENATION MODULE
 * ========================================
 * 
 * Purpose: Display processing status and summary information
 * 
 * Description:
 * Component for showing processing status, completion information, and 
 * summary statistics for the data concatenation operation.
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, CheckCircle } from "lucide-react";
import { PriceSheetInfo, RPISheetInfo } from '@/types/analysis';

interface ProcessingSummaryProps {
  isProcessed: boolean;
  sheetsCount: number;
  totalColumns: number;
  totalRows: number;
  concatenatedFile: string | null;
  priceSheet?: PriceSheetInfo | null;
  rpiSheet?: RPISheetInfo | null;
  onDownload?: () => void;
}

export function ProcessingSummary({
  isProcessed,
  sheetsCount,
  totalColumns,
  totalRows,
  concatenatedFile,
  priceSheet,
  rpiSheet,
  onDownload
}: ProcessingSummaryProps) {
  if (!isProcessed) {
    return null;
  }
  
  return (
    <div className="space-y-6">
      {/* Main Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-secondary" />
            Concatenation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary/5 border border-secondary/20 rounded-lg">
              <div>
                <h3 className="font-semibold text-secondary">Concatenation completed successfully</h3>
                <p className="text-sm text-secondary/80">
                  Your data has been processed and is ready for analysis
                </p>
              </div>
              <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                ✅ Complete
              </Badge>
            </div>
            
            {/* Statistics Grid */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="text-2xl font-bold text-primary">{sheetsCount}</div>
                <div className="text-sm text-primary/80">Sheets Combined</div>
              </div>
              <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
                <div className="text-2xl font-bold text-accent">{totalColumns}</div>
                <div className="text-sm text-accent/80">Total Columns</div>
              </div>
              <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
                <div className="text-2xl font-bold text-accent">{totalRows.toLocaleString()}</div>
                <div className="text-sm text-accent/80">Total Rows</div>
              </div>
            </div>
            
            {/* File Information */}
            {concatenatedFile && (
              <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">
                    File Created: {concatenatedFile}
                  </span>
                </div>
                {onDownload && (
                  <Button
                    onClick={onDownload}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Generated Sheets Information */}
      {(priceSheet || rpiSheet) && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Sheets</CardTitle>
            <p className="text-sm text-muted-foreground">
              Additional analysis sheets created during concatenation
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Price Sheet Info */}
            {priceSheet && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <h4 className="font-medium text-primary">Price Sheet</h4>
                </div>
                <p className="text-sm text-primary/80 mb-2">
                  {priceSheet.message}
                </p>
                {priceSheet.created && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-primary/70">
                    <div>
                      <span className="font-medium">Rows:</span> {priceSheet.rowCount}
                    </div>
                    <div>
                      <span className="font-medium">Regions:</span> {priceSheet.uniqueRegions}
                    </div>
                    <div>
                      <span className="font-medium">Months:</span> {priceSheet.uniqueMonths}
                    </div>
                    <div>
                      <span className="font-medium">Price Columns:</span> {priceSheet.priceColumns?.length}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* RPI Sheet Info */}
            {rpiSheet && (
              <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-accent rounded-full"></div>
                  <h4 className="font-medium text-accent">RPI Sheet</h4>
                </div>
                <p className="text-sm text-accent/80 mb-2">
                  {rpiSheet.message}
                </p>
                {rpiSheet.created && (
                  <div className="text-xs text-accent/70">
                    <span className="font-medium">Rows:</span> {rpiSheet.rowCount}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
