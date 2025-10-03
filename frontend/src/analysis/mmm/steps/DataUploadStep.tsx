/**
 * DataUploadStep Component
 * 
 * Purpose: File upload interface with drag-and-drop functionality, validation, and data quality enhancement
 * 
 * Description: This component provides a comprehensive file upload interface for the
 * analytics workflow with advanced data quality enhancement capabilities. It supports
 * drag-and-drop file uploads, validates file types and sizes, integrates with the
 * backend data processing service, and provides real-time feedback on upload status
 * and file processing results.
 * 
 * Key Functions:
 * - handleDrag(): Manages drag-and-drop file upload events
 * - handleDrop(): Processes dropped files and initiates upload
 * - handleFileSelect(): Handles file selection from file input
 * - handleUpload(): Executes file upload to backend
 * - handleSheetToggle(): Toggles sheet selection for concatenation
 * - handleContinue(): Proceeds to next step after successful upload
 * - handleDataQualityEnhancement(): Applies data quality improvements
 * 
 * State Variables:
 * - dragActive: Tracks drag-and-drop state
 * - uploadedFile: Currently uploaded file
 * - isUploading: Upload process status
 * - sheetsInfo: Information about Excel sheets
 * - processedFilename: Name of processed file
 * - selectedSheets: Set of selected sheet indices
 * - isModifyingColumns: Data quality enhancement status
 * - modificationApplied: Whether enhancement was applied
 * - dataQualityInfo: Information about data quality improvements
 * 
 * Data Quality Features:
 * - Automatic column removal for columns with <18 data records
 * - Business column preservation (PackSize, Region, Channel, Month)
 * - Business column enhancement: PackSize, Region, Channel auto-population
 * - Smart sheet naming logic for automatic business value assignment
 * 
 * API Endpoints:
 * - POST /api/upload: Uploads file to backend
 * - POST /api/process: Processes uploaded file
 * - POST /api/enhance: Applies data quality enhancements
 * 
 * Data Flow:
 * 1. User uploads Excel/CSV file via drag-and-drop or file selection
 * 2. File is validated and uploaded to backend
 * 3. Backend processes file and extracts sheet information
 * 4. User selects sheets for concatenation
 * 5. Optional data quality enhancement is applied
 * 6. File is prepared for concatenation step
 * 
 * Dependencies:
 * - AnalysisContext: Global state and workflow management
 * - DataProcessor: File processing and validation
 * - FileService: Backend API communication
 * - useToast: User feedback notifications
 * - useNavigate: React Router navigation
 * - UI components: Card, Button, Checkbox, Info
 * - Lucide React icons: Upload, FileText, CheckCircle, FileSpreadsheet, Info
 */

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAnalysis } from "@/context/AnalysisContext";
import { Upload, FileText, CheckCircle, FileSpreadsheet, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { dataProcessor, fileService } from "@/analysis/mmm/services";
import { SheetInfo } from "@/types/analysis";

export function DataUploadStep() {
  const { setAnalysisData, nextStep, state } = useAnalysis();
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [sheetsInfo, setSheetsInfo] = useState<SheetInfo[] | null>(null);
  const [processedFilename, setProcessedFilename] = useState<string | null>(null);
  const [selectedSheets, setSelectedSheets] = useState<Set<number>>(new Set());
  const [isModifyingColumns, setIsModifyingColumns] = useState(false);
  const [modificationApplied, setModificationApplied] = useState(false);
  const [dataQualityInfo, setDataQualityInfo] = useState<{
    totalColumnsRemoved: number;
    sheetsWithRemovedColumns: number;
    removedColumnsBySheet: Record<string, string[]>;
  } | null>(null);

  // Automatically select all sheets when sheets info is loaded
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

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleFile = useCallback(async (file: File) => {
          const validation = dataProcessor.validateFile(file);
    
    if (!validation.isValid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadedFile(file);
    setSheetsInfo(null);
    setProcessedFilename(null);
    setSelectedSheets(new Set());

    try {
      // Upload file to backend with brand context
      const uploadResult = await fileService.uploadFile(file, state.selectedBrand);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      const processedName = uploadResult.data?.file.processedName;
      if (!processedName) {
        throw new Error('No processed filename received');
      }

      setProcessedFilename(processedName);

      // Check if it's an Excel file to get sheet information
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (fileExtension === '.xlsx') {
        // Get all sheets information with brand context
        const sheetsResult = await fileService.getAllSheets(processedName, state.selectedBrand);
        
        if (sheetsResult.success && sheetsResult.data) {
          setSheetsInfo(sheetsResult.data.sheets);
          
          toast({
            title: "Analysis Created Successfully",
            description: `${file.name} has been processed. Found ${sheetsResult.data.totalSheets} sheets. Analysis is now ready to proceed.`,
          });
        } else {
          throw new Error(sheetsResult.error || 'Failed to read sheets');
        }
      } else {
        // For CSV files, just show success message
        toast({
          title: "Analysis Created Successfully",
          description: `${file.name} has been processed and analysis is ready to proceed.`,
        });
      }

    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
      });
      setUploadedFile(null);
      setSheetsInfo(null);
      setProcessedFilename(null);
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleModifyColumns = async () => {
    if (!processedFilename) {
      toast({
        title: "Error",
        description: "No file available for modification.",
        variant: "destructive",
      });
      return;
    }

    if (!sheetsInfo || selectedSheets.size === 0) {
      toast({
        title: "No sheets selected",
        description: "Please select at least one sheet to modify.",
        variant: "destructive",
      });
      return;
    }

    setIsModifyingColumns(true);

    try {
      // Get selected sheet names from indices
      const selectedSheetNames = Array.from(selectedSheets).map(index => sheetsInfo[index].sheetName);
      
      const modificationResult = await fileService.modifyExcelColumns(processedFilename, selectedSheetNames, state.selectedBrand);
      
      if (modificationResult.success && modificationResult.data) {
        // Update sheets info with the modified file data
        if (modificationResult.data.sheets) {
          console.log('Raw modification result:', modificationResult.data.sheets);
          
          // Ensure the updated sheets maintain the correct format
          const updatedSheets = modificationResult.data.sheets.map(sheet => {
            console.log('Processing sheet:', sheet);
            return {
              sheetName: sheet.sheetName,
              columns: Array.isArray(sheet.columns) ? sheet.columns : [],
              totalRows: sheet.totalRows || 0,
              totalColumns: sheet.totalColumns || 0
            };
          });
          
          console.log('Updated sheets:', updatedSheets);
          setSheetsInfo(updatedSheets);
        }
        
        setModificationApplied(true);
        
        // Store data quality information
        setDataQualityInfo(modificationResult.data.dataQuality);
        
        // Create enhanced success message with data quality information
        let description = `Added PackSize, Region, and Channel columns to ${modificationResult.data.sheetsModified} selected sheets.`;
        
        // Add data quality information if columns were removed
        if (modificationResult.data.dataQuality.totalColumnsRemoved > 0) {
          description += ` Data quality improvement: Removed ${modificationResult.data.dataQuality.totalColumnsRemoved} columns with insufficient data (<18 records).`;
        }
        
        toast({
          title: "File enhanced successfully",
          description: description,
        });
      } else {
        throw new Error(modificationResult.error || 'Failed to modify columns');
      }
    } catch (error) {
      toast({
        title: "Modification failed",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsModifyingColumns(false);
    }
  };

  const handleContinue = () => {
    if (!uploadedFile) {
      toast({
        title: "No file uploaded",
        description: "Please upload a data file to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!processedFilename) {
      toast({
        title: "File processing incomplete",
        description: "Please wait for file processing to complete.",
        variant: "destructive",
      });
      return;
    }

    // Create analysis data with uploaded file information
          const analysisData = dataProcessor.generateMockData(uploadedFile.name);
    
    // Add sheet information if available (for Excel files)
    if (sheetsInfo && sheetsInfo.length > 0) {
      analysisData.sheets = sheetsInfo.map((sheet, index) => ({
        sheetName: sheet.sheetName,
        columns: sheet.columns.map(col => ({ name: col, type: 'categorical' as const, values: [] })),
        rowCount: sheet.totalRows,
        isSelected: selectedSheets.has(index), // Use current selection state
      }));
    }
    
    // Store processed filename for backend operations
    // Use the same filename - backend will check intermediate folder first, then raw
    analysisData.processedFilename = processedFilename;
    
    // Flag to indicate if columns were modified (for backend to prioritize intermediate file)
    analysisData.columnsModified = modificationApplied;
    
    // Set the analysis data in context
    setAnalysisData(analysisData);
    
    // Use nextStep() from context instead of hardcoded navigation
    // This ensures proper wizard step management and state updates
    nextStep();
    
    toast({
      title: "File processed successfully",
      description: "Proceeding to data concatenation step.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Upload Your Data</h2>
        <p className="text-muted-foreground">
          Upload your marketing and sales data file to begin the analysis
        </p>
      </div>

              <Card className="w-full mx-auto">
        <CardContent className="p-6">
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              dragActive 
                ? "border-primary bg-primary/5" 
                : uploadedFile 
                ? "border-success bg-success/5" 
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {uploadedFile ? (
              <div className="space-y-4">
                <CheckCircle className="w-12 h-12 text-success mx-auto" />
                <div>
                  <h3 className="font-semibold text-success">File Uploaded Successfully</h3>
                  <p className="text-sm text-muted-foreground mt-1">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : isUploading ? (
              <div className="space-y-4">
                <div className="w-12 h-12 mx-auto animate-spin">
                  <FileSpreadsheet className="w-12 h-12 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Processing your data...</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Uploading and analyzing your file structure
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="font-semibold">Drop your file here</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse files
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>Supports CSV, Excel files</span>
                </div>
              </div>
            )}
            
            <input
              type="file"
              onChange={handleFileInput}
              accept=".csv,.xlsx,.xls"
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
          </div>

          {sheetsInfo && sheetsInfo.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  Available Sheets ({sheetsInfo.length} total)
                </h4>
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
                          <label htmlFor={`sheet-${index}`} className="font-medium text-sm cursor-pointer">
                            {sheet.sheetName}
                          </label>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {sheet.totalRows} rows × {sheet.totalColumns} columns
                          </span>
                        </div>
                        {sheet.columns.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">All columns ({sheet.columns.length}):</p>
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
              
              {selectedSheets.size > 0 && (
                <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm text-primary font-medium">
                    {selectedSheets.size} sheet{selectedSheets.size !== 1 ? 's' : ''} selected for concatenation
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    These sheets will be combined in the next step. You can modify your selection before proceeding.
                  </p>
                </div>
              )}
            </div>
          )}

          {uploadedFile && (
            <div className="mt-6 pt-6 border-t space-y-3">
              {/* Add Necessary Columns Button (only for Excel files with selected sheets) */}
              {sheetsInfo && sheetsInfo.length > 0 && selectedSheets.size > 0 && !modificationApplied && (
                <Button 
                  onClick={handleModifyColumns} 
                  variant="outline" 
                  className="w-full" 
                  disabled={isModifyingColumns || isUploading}
                >
                  {isModifyingColumns ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      Adding columns to {selectedSheets.size} sheet{selectedSheets.size !== 1 ? 's' : ''}...
                    </>
                  ) : (
                    <>
                      <Info className="w-4 h-4 mr-2" />
                      Add Necessary Columns ({selectedSheets.size} sheet{selectedSheets.size !== 1 ? 's' : ''})
                    </>
                  )}
                </Button>
              )}

              {/* Success message for applied modifications */}
              {modificationApplied && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center p-3 bg-secondary/5 border border-secondary/20 rounded-lg text-secondary">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">File enhanced successfully</span>
                  </div>
                  
                  {/* Data quality information */}
                  {dataQualityInfo && dataQualityInfo.totalColumnsRemoved > 0 && (
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Info className="w-4 h-4 mr-2 text-primary" />
                        <span className="text-sm font-medium text-primary">Data Quality Improvements</span>
                      </div>
                      <div className="text-xs text-primary/80 space-y-1">
                        <p>• Removed {dataQualityInfo.totalColumnsRemoved} columns with insufficient data (&lt;18 records)</p>
                        <p>• Affected {dataQualityInfo.sheetsWithRemovedColumns} out of {selectedSheets.size} selected sheets</p>
                        {Object.keys(dataQualityInfo.removedColumnsBySheet).length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-primary hover:text-primary/80">View detailed breakdown</summary>
                            <div className="mt-1 pl-4 space-y-1">
                              {Object.entries(dataQualityInfo.removedColumnsBySheet).map(([sheetName, columns]) => (
                                <div key={sheetName}>
                                  <span className="font-medium">{sheetName}:</span> {columns.join(', ')}
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button onClick={handleContinue} className="w-full" disabled={isUploading}>
                Continue to Data Concatenation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

              <div className="w-full mx-auto">
        <Card className="bg-info/5 border-info/20">
          <CardContent className="p-4">
            <h4 className="font-semibold text-info mb-2">Data Requirements</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Include date column for time series analysis</li>
              <li>• Revenue/sales data as the dependent variable</li>
              <li>• Marketing spend data across different channels</li>
              <li>• Any relevant external factors (seasonality, events, etc.)</li>
              <li>• Data should be at weekly or monthly level</li>
            </ul>
          </CardContent>
        </Card>
      </div>


    </div>
  );
}