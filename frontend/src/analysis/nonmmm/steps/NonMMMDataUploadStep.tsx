/**
 * ========================================
 * NON-MMM DATA UPLOAD STEP
 * ========================================
 * 
 * Purpose: Data file upload step for non-MMM analysis workflow based on MMM data upload
 * 
 * Description:
 * This component handles data file upload for non-MMM analysis:
 * 1. File upload (xlsx/csv) with drag-and-drop - copied from MMM
 * 2. File processing and validation - simplified from MMM
 * 3. Show all sheets and columns with actual row counts - like MMM but no concatenation
 * 4. Direct navigation to next step after upload
 * 
 * Key Features:
 * - File upload with drag-and-drop interface (copied from MMM)
 * - Excel/CSV file processing (like MMM)
 * - Sheet and column display with proper row counts (like MMM data upload display)
 * - No concatenation/processing options (unlike MMM)
 * - Direct continue to next step
 * - Fixed API response mapping to show actual data row counts
 * 
 * Bug Fixes:
 * - Fixed sheet data display to show actual row counts instead of 0
 * - Properly mapped backend API response fields (sheetName->name, totalRows->rows)
 * - Updated interface definitions for type safety
 * 
 * UI/UX Improvements:
 * - Redesigned sheet display to match MMM's beautiful interface
 * - Added elegant pill-style column badges with "First 5 columns" display
 * - Implemented checkboxes for sheet selection with individual and "Select All" functionality
 * - Added summary cards with total row counts and sheet statistics
 * - Enhanced "What Happens Next?" section with numbered workflow steps
 * - Applied consistent shadows and color schemes throughout
 * - Made entire upload area clickable (not just browse button) like MMM
 * - Added validation for sheet selection before proceeding to next step
 * 
 * Dependencies:
 * - Python backend for file upload and processing
 * - AnalysisContext for state management
 * - NonMMMFileService for API communication
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Upload, FileText, Database, CheckCircle, AlertCircle, X, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAnalysis } from '@/context/AnalysisContext';
import { NonMMMFileService } from '@/analysis/nonmmm/services/NonMMMFileService';
import { brandAnalysisService } from '@/analysis/mmm/services/brandAnalysisService';
import { NonMMMStateService } from '@/analysis/nonmmm/services/NonMMMStateService';

interface NonMMMSheetInfo {
  name: string;
  columns: string[];
  rows: number;
}

export function NonMMMDataUploadStep() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state, setAnalysisData } = useAnalysis(); // Get analysis context for brand name and setAnalysisData
  const currentAnalysisId = state.currentAnalysisId;
  
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [sheetsInfo, setSheetsInfo] = useState<NonMMMSheetInfo[] | null>(null);
  const [processedFilename, setProcessedFilename] = useState<string | null>(null);
  const [selectedSheets, setSelectedSheets] = useState<Set<number>>(new Set());

  // Automatically select all sheets when sheets info is loaded (like MMM)
  useEffect(() => {
    if (sheetsInfo && sheetsInfo.length > 0) {
      setSelectedSheets(new Set(sheetsInfo.map((_, index) => index)));
    }
  }, [sheetsInfo]);

  // Handler for individual sheet selection
  const handleSheetSelection = useCallback((sheetIndex: number, checked: boolean) => {
    setSelectedSheets(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(sheetIndex);
      } else {
        newSet.delete(sheetIndex);
      }
      return newSet;
    });
  }, []);

  // Handler for select all/none functionality
  const handleSelectAll = useCallback((checked: boolean) => {
    if (sheetsInfo) {
      if (checked) {
        setSelectedSheets(new Set(sheetsInfo.map((_, index) => index)));
      } else {
        setSelectedSheets(new Set());
      }
    }
  }, [sheetsInfo]);

  // Handle file selection and auto-upload (like MMM)
  const handleFileSelect = useCallback(async (file: File) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an Excel (.xlsx) or CSV (.csv) file",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 100MB",
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(file);
    
    // Auto-upload immediately after file selection (like MMM)
    setIsUploading(true);
    try {
      // Upload file using dedicated Non-MMM file service with brand name
      const uploadResult = await NonMMMFileService.uploadFile(file, state.selectedBrand);
      
      if (!uploadResult || !uploadResult.filename) {
        throw new Error('Upload failed - no filename returned');
      }

      setProcessedFilename(uploadResult.filename);

      // Get sheet information (only for Excel files)
      let sheetsData: NonMMMSheetInfo[] = [];
      try {
        if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
          sheetsData = await NonMMMFileService.getSheets(uploadResult.filename, state.selectedBrand);
          setSheetsInfo(sheetsData);
        } else {
          // For CSV files, create a mock sheet info
          sheetsData = [{
            name: 'Sheet1',
            columns: [],
            rows: uploadResult.totalRows
          }];
          setSheetsInfo(sheetsData);
        }
      } catch (sheetsError) {
        console.error('❌ Failed to load sheets data:', sheetsError);
        // Set empty sheets data so upload can still complete
        sheetsData = [];
        setSheetsInfo([]);
        // Don't throw here - let the upload complete even if sheets fail
      }

      // Update analysis metadata after successful upload
      if (currentAnalysisId) {
        try {
          await brandAnalysisService.updateAnalysis(currentAnalysisId, {
            status: 'in_progress',
            currentStep: 1
          });
          console.log('✅ Analysis metadata updated after file upload');
        } catch (error) {
          console.error('❌ Failed to update analysis metadata:', error);
          // Continue execution - file was uploaded successfully
        }
      }

      toast({
        title: "File Uploaded Successfully",
        description: `File processed successfully with ${sheetsData.length} sheet${sheetsData.length !== 1 ? 's' : ''}`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive"
      });
      // Reset file on error
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  }, [toast, state.selectedBrand, currentAnalysisId]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Note: Upload now happens automatically in handleFileSelect

  // Handle continue to next step
  const handleContinue = async () => {
    console.log('🔄 handleContinue called with:', {
      processedFilename,
      sheetsInfo: !!sheetsInfo,
      selectedSheetsSize: selectedSheets.size,
      currentAnalysisId
    });

    if (!processedFilename || !sheetsInfo) {
      console.log('❌ Missing processedFilename or sheetsInfo');
      toast({
        title: "Upload Required",
        description: "Please upload and process a file first",
        variant: "destructive"
      });
      return;
    }

    if (selectedSheets.size === 0) {
      console.log('❌ No sheets selected');
      toast({
        title: "No Sheets Selected",
        description: "Please select at least one sheet to continue with the analysis",
        variant: "destructive"
      });
      return;
    }

    console.log('✅ Validation passed, proceeding with state save and navigation');

    // Save the sheet selection and file data to state for the Data Summary step
    // Ensure we have an analysis ID - generate one if needed
    let analysisId = currentAnalysisId;
    if (!analysisId) {
      // Generate a consistent analysis ID based on brand and timestamp
      const brandSlug = (state.selectedBrand || 'unknown').toLowerCase().replace(/\s+/g, '_');
      const timestamp = Date.now();
      analysisId = `nonmmm_${brandSlug}_${timestamp}`;
      console.log('⚠️ No analysis ID from context, generated:', analysisId);
    }

    try {
      const selectedSheetsData = Array.from(selectedSheets).map(index => sheetsInfo[index]);
      
      // Save state for data upload step (step 1) - using static method
      const currentState = await NonMMMStateService.getNonMMMState() || {};
      await NonMMMStateService.saveNonMMMState({
        ...currentState,
        analysisId: analysisId, // Use the ensured analysis ID
        currentStep: 2, // Current step is data upload (step 2)
        dataUploadCompleted: true,
        uploadedFile: processedFilename,
        selectedSheets: selectedSheetsData,
        allSheets: sheetsInfo,
        brandName: state.selectedBrand,
        uploadedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });

      // Update the analysis context with the file data
      if (state.analysisData) {
        setAnalysisData({
          ...state.analysisData,
          filename: processedFilename,
          sheets: selectedSheetsData.map((sheet, index) => ({
            sheetName: sheet.name,
            columns: sheet.columns.map(col => ({
              name: col,
              type: 'categorical' as const,
              values: []
            })),
            rowCount: sheet.rows,
            isSelected: true
          }))
        });
      } else {
        // Create new analysis data if it doesn't exist
        setAnalysisData({
          filename: processedFilename,
          columns: [],
          rowCount: selectedSheetsData.reduce((sum, sheet) => sum + (sheet.rows || 0), 0),
          uploadedAt: new Date(),
          sheets: selectedSheetsData.map((sheet, index) => ({
            sheetName: sheet.name,
            columns: sheet.columns.map(col => ({
              name: col,
              type: 'categorical' as const,
              values: []
            })),
            rowCount: sheet.rows,
            isSelected: true
          }))
        });
      }

      // State already saved above
      console.log('✅ Non-MMM data upload state saved and analysis context updated');
    } catch (error) {
      console.error('❌ Failed to save data upload state:', error);
      // Continue navigation even if state save fails
    }

    console.log('🧭 Navigating to /nonmmm/summary');
    navigate('/nonmmm/summary');
  };

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gradient-primary">Upload Your Data</h1>
        <p className="text-muted-foreground">
          Upload your Excel or CSV file to begin the non-MMM analysis
        </p>
      </div>

      {/* File Upload Area */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gradient-primary">
            <Upload className="h-5 w-5 text-primary" />
            Upload Data File
          </CardTitle>
          <CardDescription>
            Upload your Excel (.xlsx) or CSV file for non-MMM analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : uploadedFile 
                  ? 'border-success bg-success/5' 
                  : 'border-border hover:border-primary/50 hover:bg-primary/5'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {uploadedFile ? (
              <div className="space-y-4">
                {isUploading ? (
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-lg font-medium">Processing...</span>
                  </div>
                ) : sheetsInfo ? (
                  <div className="flex items-center justify-center gap-2 text-secondary">
                    <CheckCircle className="h-8 w-8" />
                    <span className="text-lg font-medium">Upload Complete</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-secondary">
                    <CheckCircle className="h-8 w-8" />
                    <span className="text-lg font-medium">File Selected</span>
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
                {!isUploading && (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUploadedFile(null);
                        setSheetsInfo(null);
                        setProcessedFilename(null);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Drop your file here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Supports .xlsx and .csv files up to 100MB
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <FileText className="w-4 h-4" />
                  <span>Click anywhere in this area to select files</span>
                </div>
              </div>
            )}
            
            {/* Invisible file input that covers the entire upload area */}
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              accept=".csv,.xlsx,.xls"
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Preview - Beautiful sheet display inspired by MMM */}
      {sheetsInfo && (
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-secondary" />
                  Available Sheets ({sheetsInfo.length} total)
                </CardTitle>
                <CardDescription>
                  Select the sheets you want to include in your analysis
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all-sheets"
                  checked={selectedSheets.size === sheetsInfo.length && sheetsInfo.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all-sheets" className="text-sm text-muted-foreground cursor-pointer">
                  Select All ({selectedSheets.size} selected)
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {sheetsInfo.map((sheet, index) => (
                <div key={index} className="p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`sheet-${index}`}
                      checked={selectedSheets.has(index)}
                      onCheckedChange={(checked) => handleSheetSelection(index, !!checked)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor={`sheet-${index}`} className="font-medium text-sm cursor-pointer">{sheet.name}</label>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {(sheet.rows || 0).toLocaleString()} rows × {sheet.columns.length} columns
                        </span>
                      </div>
                      {sheet.columns.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            All columns ({sheet.columns.length}):
                          </p>
                          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                            {sheet.columns.map((column, colIndex) => (
                              <span 
                                key={colIndex}
                                className="px-2 py-1 bg-background border rounded text-xs"
                              >
                                {column}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Summary card showing selected sheets */}
            {selectedSheets.size > 0 ? (
              <div className="mt-4 p-3 bg-secondary/5 border border-secondary/20 rounded-lg">
                <p className="text-sm text-secondary font-medium">
                  {selectedSheets.size} sheet{selectedSheets.size !== 1 ? 's' : ''} selected for analysis
                </p>
                <p className="text-xs text-secondary/80 mt-1">
                  Total: {sheetsInfo
                    .filter((_, index) => selectedSheets.has(index))
                    .reduce((sum, sheet) => sum + (sheet.rows || 0), 0)
                    .toLocaleString()} rows from selected sheets
                </p>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-accent/5 border border-accent/20 rounded-lg">
                <p className="text-sm text-accent font-medium">
                  No sheets selected
                </p>
                <p className="text-xs text-accent/80 mt-1">
                  Please select at least one sheet to continue with the analysis
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      {processedFilename && sheetsInfo && (
        <div className="flex justify-center pt-6">
          <Button 
            onClick={() => {
              console.log('🔘 Button clicked!');
              handleContinue();
            }} 
            size="lg" 
            className="px-8"
            disabled={selectedSheets.size === 0}
          >
            Continue to Data Summary
          </Button>
        </div>
      )}

      {/* Information Card - Improved styling */}
              <Card className="card-premium bg-primary/5 border-primary/20">
          <CardHeader>
                         <CardTitle className="text-primary">What Happens Next?</CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
            After uploading your data, you'll be guided through a comprehensive analysis workflow:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white border border-primary/20 rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-semibold text-sm">1</span>
              </div>
                             <div className="text-lg font-medium text-primary mb-2">Data Summary</div>
               <div className="text-sm text-muted-foreground">View statistical summary and data types for all variables</div>
             </div>
             <div className="text-center p-4 bg-white border border-secondary/20 rounded-lg shadow-sm">
               <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                 <span className="text-secondary font-semibold text-sm">2</span>
               </div>
               <div className="text-lg font-medium text-primary mb-2">Data Visualization</div>
               <div className="text-sm text-muted-foreground">Explore histograms and data distribution patterns</div>
             </div>
             <div className="text-center p-4 bg-white border border-accent/20 rounded-lg shadow-sm">
               <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                 <span className="text-accent font-semibold text-sm">3</span>
               </div>
               <div className="text-lg font-medium text-primary mb-2">Statistical Modeling</div>
              <div className="text-sm text-muted-foreground">Build and compare multiple regression models</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
