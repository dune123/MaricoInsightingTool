/**
 * AddRPIsStep Component
 * 
 * Purpose: Step for adding relevant RPI (Revenue Per Item) columns to main concatenated data
 * 
 * Description: This component handles the "Add RPIs" step that comes after data concatenation.
 * It processes the concatenated file to add relevant RPI columns from the RPI sheet to the
 * main data based on pack size relationships and matching criteria (same, +1, -1 sizes).
 * 
 * Recent Fixes (2025-01-31):
 * - Fixed duplicate logs caused by multiple useEffect executions
 * - Added useRef-based execution prevention for RPI completion checks
 * - Added useRef-based execution prevention for pack size analysis
 * - Improved component mounting stability to prevent race conditions
 * - Removed duplicate logging in rpiAdditionService.ts
 * 
 * Key Functions:
 * - handleAnalyzePackSizes(): Analyzes pack sizes in main data and RPI sheet
 * - handlePreviewRPIs(): Previews what RPI columns will be added
 * - handleProcessRPIs(): Processes RPI addition with progress tracking
 * - handlePackSizeOrderChange(): Manages user-defined pack size ordering
 * - handleDownloadEnhancedFile(): Downloads the enhanced file with RPI data
 * 
 * State Variables:
 * - analysisData: Pack size analysis results from backend
 * - previewData: Preview of RPI columns to be added
 * - additionResult: Results of RPI addition process
 * - isAnalyzing/isPreviewing/isProcessing: Processing state flags
 * - currentStep: Current workflow step (analyze, preview, process, complete)
 * - allPackSizes: All available pack sizes from data
 * - userPackSizeOrder: User-defined pack size ordering
 * - isOrderingComplete: Whether pack size ordering is finished
 * - rpiCheckRef/analysisExecutionRef: Refs to prevent duplicate executions
 * 
 * API Endpoints:
 * - POST /api/rpi/analyze: Analyzes pack sizes and RPI relationships
 * - POST /api/rpi/preview: Previews RPI columns to be added
 * - POST /api/rpi/process: Processes RPI addition to main data
 * - GET /api/rpi/download/{filename}: Downloads enhanced file
 * 
 * Data Flow:
 * 1. Analyze pack sizes in main data and RPI sheet
 * 2. User orders pack sizes if needed
 * 3. Preview RPI columns to be added
 * 4. Process RPI addition with progress tracking
 * 5. Display results and provide download option
 * 
 * Dependencies:
 * - RPIAdditionService: Backend RPI operations
 * - AnalysisContext: Global state management
 * - UI components: Card, Button, Alert, Progress, Tabs
 * - Lucide React icons for visual elements
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Play,
  Eye,
  Package
} from 'lucide-react';
import { useAnalysis } from '@/context/AnalysisContext';
import { 
  RPIAdditionService, 
  RPIAdditionResponse, 
  RPIAnalysisResponse, 
  RPIPreviewResponse 
} from '@/analysis/mmm/services/rpiAdditionService';
import { API_CONFIG } from '@/utils/apiClient';
import { useToast } from '@/hooks/use-toast';
import { fileService } from '@/analysis/mmm/services';

// Interface for RPI completion state
interface RPICompletionState {
  isCompleted: boolean;
  completionTimestamp: string;
  columnsAdded: number;
  rowsProcessed: number;
  successRate: number;
  packSizes: number;
  enhancedFilePath: string;
}

export function AddRPIsStep() {
  const { state } = useAnalysis();
  const { currentAnalysisId, selectedBrand } = state;
  const { toast } = useToast();

  // State management
  const [analysisData, setAnalysisData] = useState<RPIAnalysisResponse | null>(null);
  const [previewData, setPreviewData] = useState<RPIPreviewResponse | null>(null);
  const [additionResult, setAdditionResult] = useState<RPIAdditionResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'analyze' | 'preview' | 'process' | 'complete'>('analyze');
  
  // Pack size ordering state
  const [allPackSizes, setAllPackSizes] = useState<string[]>([]);
  const [userPackSizeOrder, setUserPackSizeOrder] = useState<string[]>([]);
  const [isOrderingComplete, setIsOrderingComplete] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Visit logic state - SIMPLIFIED
  const [hasVisited, setHasVisited] = useState(false);
  const [isCheckingVisit, setIsCheckingVisit] = useState(false);
  const [rpiCompletionState, setRpiCompletionState] = useState<RPICompletionState | null>(null);
  
  // Refs to prevent duplicate executions
  const rpiCheckRef = useRef(false);
  const analysisExecutionRef = useRef(false);

  // Manual progression only - no auto-proceed to next steps

  // Extract pack sizes when analysis data is available
  useEffect(() => {
    if (analysisData?.pack_size_analysis?.main_pack_sizes) {
      // Only use MAIN pack sizes from concatenated data, not all pack sizes found
      const mainPackSizes = analysisData.pack_size_analysis.main_pack_sizes;
      setAllPackSizes(mainPackSizes);
      setUserPackSizeOrder([...mainPackSizes]); // Initialize with main pack sizes only
      
      console.log('🎯 Using main pack sizes only:', mainPackSizes);
      console.log('📊 Total main pack sizes:', mainPackSizes.length);
      console.log('📊 Analysis shows main pack sizes count:', analysisData.pack_size_analysis.main_pack_sizes.length);
      console.log('📊 Showing in drag-drop interface:', mainPackSizes.length, 'items');
    }
  }, [analysisData]);

  // RPI completion check - WITH DUPLICATE PREVENTION
  useEffect(() => {
    const checkRPICompletion = async () => {
      if (!currentAnalysisId || !selectedBrand || rpiCheckRef.current) return;
      
      rpiCheckRef.current = true;
      
      try {
        setIsCheckingVisit(true);
        
        console.log('🔍 Checking RPI completion status...');
        
        // Look for any concatenated file in the brand's concatenated directory
        const concatFilesResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/files/list-concatenated?brand=${encodeURIComponent(selectedBrand)}`);
        
        if (!concatFilesResponse.ok) {
          console.log('⚠️ Could not fetch concatenated files list');
          setHasVisited(false);
          setRpiCompletionState(null);
          return;
        }
        
        const concatFilesData = await concatFilesResponse.json();
        console.log('🔍 Concatenated files found:', concatFilesData);
        
        if (!concatFilesData.success || !concatFilesData.files || concatFilesData.files.length === 0) {
          console.log('ℹ️ No concatenated files found');
          setHasVisited(false);
          setRpiCompletionState(null);
          return;
        }
        
        // Check if any file already contains 'with_rpis' - if so, RPI is already complete!
        const rpiCompletedFile = concatFilesData.files.find((filename: string) => 
          filename.includes('with_rpis')
        );
        
        if (rpiCompletedFile) {
          console.log('✅ RPI-enhanced file found:', rpiCompletedFile);
          setHasVisited(true);
          
          // Try to retrieve completion state from localStorage or create default
          const savedState = localStorage.getItem(`rpi_completion_${currentAnalysisId}`);
          if (savedState) {
            try {
              const parsedState = JSON.parse(savedState);
              setRpiCompletionState(parsedState);
              console.log('📊 Retrieved saved RPI completion state:', parsedState);
            } catch (e) {
              console.log('⚠️ Could not parse saved state, using default');
              setRpiCompletionState({
                isCompleted: true,
                completionTimestamp: new Date().toISOString(),
                columnsAdded: 0, // Will be updated when we can get actual data
                rowsProcessed: 0,
                successRate: 0,
                packSizes: 0,
                enhancedFilePath: rpiCompletedFile
              });
            }
          } else {
            // Create default completion state
            setRpiCompletionState({
              isCompleted: true,
              completionTimestamp: new Date().toISOString(),
              columnsAdded: 0,
              rowsProcessed: 0,
              successRate: 0,
              packSizes: 0,
              enhancedFilePath: rpiCompletedFile
            });
          }
          
          // If RPI is complete, skip to the final step
          setCurrentStep('complete');
          
          toast({
            title: "RPI Analysis Complete",
            description: "RPI columns have already been added. File is ready for download.",
          });
        } else {
          console.log('ℹ️ RPI-enhanced file not found - first time visit');
          setHasVisited(false);
          setRpiCompletionState(null);
        }
      } catch (error) {
        console.error('❌ Error checking RPI completion:', error);
        setHasVisited(false);
        setRpiCompletionState(null);
      } finally {
        setIsCheckingVisit(false);
      }
    };

    // Only run once per mount
    checkRPICompletion();
    
    // Cleanup function to reset ref on unmount
    return () => {
      rpiCheckRef.current = false;
    };
  }, [currentAnalysisId, selectedBrand, toast]);

  const handleAnalyzePackSizes = useCallback(async () => {
    if (!currentAnalysisId || !selectedBrand) {
      setError('Missing analysis ID or brand name');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);
      
      const result = await RPIAdditionService.analyzePackSizesForRPI(
        selectedBrand,
        currentAnalysisId
      );
      
      setAnalysisData(result);
      // Don't auto-set step - let user manually proceed
      
      toast({
        title: "Pack Size Analysis Complete",
        description: `Found ${result.pack_size_analysis.total_rpi_columns} RPI columns for analysis`,
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze pack sizes';
      setError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentAnalysisId, selectedBrand, toast]);

  // Auto-start analysis when component mounts (but don't auto-proceed) - WITH DUPLICATE PREVENTION
  useEffect(() => {
    if (currentAnalysisId && selectedBrand && currentStep === 'analyze' && !analysisData && !isAnalyzing && !analysisExecutionRef.current) {
      analysisExecutionRef.current = true;
      handleAnalyzePackSizes().finally(() => {
        analysisExecutionRef.current = false;
      });
    }
    
    // Cleanup function to reset ref on unmount
    return () => {
      analysisExecutionRef.current = false;
    };
  }, [currentAnalysisId, selectedBrand, currentStep, analysisData, isAnalyzing, handleAnalyzePackSizes]);

  const handlePreviewRPIColumns = async () => {
    if (!currentAnalysisId || !selectedBrand) {
      setError('Missing analysis ID or brand name');
      return;
    }

    try {
      setIsPreviewing(true);
      setError(null);
      
      const result = await RPIAdditionService.previewRPIColumns(
        selectedBrand,
        currentAnalysisId
      );
      
      setPreviewData(result);
      setCurrentStep('preview'); // Set step only after successful preview
      
      toast({
        title: "Preview Generated",
        description: `${result.estimated_columns_to_add} RPI columns will be added`,
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate preview';
      setError(errorMessage);
      toast({
        title: "Preview Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleStartProcessing = async () => {
    setCurrentStep('process');
    await handleAddRPIs();
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, packSize: string) => {
    setDraggedItem(packSize);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetPackSize: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetPackSize) return;

    const newOrder = [...userPackSizeOrder];
    const draggedIndex = newOrder.indexOf(draggedItem);
    const targetIndex = newOrder.indexOf(targetPackSize);

    // Remove dragged item and insert at target position
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    setUserPackSizeOrder(newOrder);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Save pack size order to backend
  const savePackSizeOrder = async () => {
    if (!currentAnalysisId || !selectedBrand) {
      setError('Missing analysis ID or brand name');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('brand_name', selectedBrand);
      formData.append('analysis_id', currentAnalysisId);
      formData.append('pack_size_order', JSON.stringify(userPackSizeOrder));

      const response = await fetch(`${API_CONFIG.BASE_URL.replace('/api', '')}/api/rpi/save-pack-size-order`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setIsOrderingComplete(true);
        toast({
          title: "Pack Size Order Saved",
          description: "Your pack size ordering has been saved successfully",
        });
      } else {
        throw new Error(result.message || 'Failed to save pack size order');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save pack size order';
      setError(errorMessage);
      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleAddRPIs = async () => {
    if (!currentAnalysisId || !selectedBrand) {
      setError('Missing analysis ID or brand name');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      // Don't set step here - it's set by handleStartProcessing
      
      const result = await RPIAdditionService.addRPIsToData(
        selectedBrand,
        currentAnalysisId
      );
      
      setAdditionResult(result);
      setCurrentStep('complete');
      
      // Save completion state to localStorage for persistence
      const completionState: RPICompletionState = {
        isCompleted: true,
        completionTimestamp: new Date().toISOString(),
        columnsAdded: result.rpi_columns_added,
        rowsProcessed: result.main_rows_processed,
        successRate: RPIAdditionService.calculateSuccessRate(result.rpi_columns_info),
        packSizes: new Set(result.rpi_columns_info.map(col => col.pack_size)).size,
        enhancedFilePath: result.enhanced_file_path || ''
      };
      
      setRpiCompletionState(completionState);
      
      // Save to localStorage for persistence across navigation
      localStorage.setItem(`rpi_completion_${currentAnalysisId}`, JSON.stringify(completionState));
      
      console.log('💾 RPI completion state saved:', completionState);
      
      toast({
        title: "RPI Addition Complete",
        description: `Successfully added ${result.rpi_columns_added} RPI columns to ${result.main_rows_processed} rows`,
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add RPIs';
      setError(errorMessage);
      setCurrentStep('preview'); // Go back to preview on error
      toast({
        title: "RPI Addition Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadEnhancedFile = async () => {
    if (!currentAnalysisId || !selectedBrand) {
      setError('Missing analysis ID or brand name');
      return;
    }

    try {
      await RPIAdditionService.downloadEnhancedFile(
        selectedBrand,
        currentAnalysisId
      );
      
      toast({
        title: "Download Started",
        description: "Enhanced file download has started",
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download file';
      setError(errorMessage);
      toast({
        title: "Download Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Render loading state
  if (isAnalyzing) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Database className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <h2 className="text-xl font-semibold mb-2">Analyzing Pack Sizes</h2>
          <p className="text-muted-foreground">
            Examining pack size relationships between main data and RPI sheet...
          </p>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span>Analyzing pack size data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render error state
  if (error && !analysisData) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-semibold mb-2">Analysis Error</h2>
          <p className="text-muted-foreground">
            Unable to analyze pack sizes for RPI addition
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Button onClick={handleAnalyzePackSizes} variant="outline">
                Retry Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render processing state
  if (isProcessing) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Database className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <h2 className="text-xl font-semibold mb-2">Adding RPI Columns</h2>
          <p className="text-muted-foreground">
            Processing RPI addition to main data...
          </p>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="space-y-4">
              <Progress value={66} className="w-full" />
              <div className="text-center text-sm text-muted-foreground">
                Adding RPI columns based on pack size relationships...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render main interface
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2">Add RPIs basis Packsize & Region</h2>
        <p className="text-muted-foreground">
          Add relevant RPI columns to main data based on pack size relationships
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={currentStep} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analyze" disabled={currentStep === 'process'}>
            Analyze
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!analysisData || currentStep === 'process'}>
            Preview
          </TabsTrigger>
          <TabsTrigger value="process" disabled={!previewData || currentStep === 'process'}>
            Process
          </TabsTrigger>
          <TabsTrigger value="complete" disabled={!additionResult && !rpiCompletionState?.isCompleted}>
            Complete
          </TabsTrigger>
        </TabsList>

        {/* Analysis Tab */}
        <TabsContent value="analyze" className="space-y-4">
          {analysisData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Pack Size Analysis
                </CardTitle>
                <CardDescription>
                  Analysis of pack sizes in main data and RPI sheet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {analysisData.pack_size_analysis.main_pack_sizes.length}
                    </div>
                    <div className="text-xs text-gray-600">Main Pack Sizes</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-secondary">
                      {analysisData.pack_size_analysis.total_rpi_columns}
                    </div>
                    <div className="text-xs text-gray-600">RPI Columns</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-accent">
                      {analysisData.coverage_analysis.missing_coverage.length}
                    </div>
                    <div className="text-xs text-gray-600">Missing Coverage</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-accent">
                      {Object.keys(analysisData.coverage_analysis.pack_size_coverage).length}
                    </div>
                    <div className="text-xs text-gray-600">Covered Sizes</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">🎯 Order Your Main Pack Sizes (Drag & Drop)</h4>
                    <p className="text-sm text-muted-foreground">
                      These are the pack sizes found in your main data. Drag and drop to arrange from smallest to largest. 
                      RPI comparisons will use: same size, one smaller, one larger based on this order.
                    </p>
                  </div>
                  
                  <div className="space-y-2 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                    {userPackSizeOrder.map((size, index) => (
                      <div
                        key={size}
                        draggable
                        onDragStart={(e) => handleDragStart(e, size)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, size)}
                        onDragEnd={handleDragEnd}
                        className={`
                          flex items-center justify-between p-3 bg-white border rounded-lg cursor-move
                          transition-all duration-200 hover:shadow-md
                          ${draggedItem === size ? 'opacity-50 scale-95' : ''}
                          ${isOrderingComplete ? 'border-secondary bg-secondary/5' : 'border-gray-200'}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium">
                            {index + 1}
                          </div>
                          <span className="font-medium">{RPIAdditionService.formatPackSize(size)}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          ⋮⋮ Drag to reorder
                        </div>
                      </div>
                    ))}
                  </div>

                  {!isOrderingComplete ? (
                    <div className="text-center">
                      <Button 
                        onClick={savePackSizeOrder}
                        className="flex items-center gap-2"
                        disabled={userPackSizeOrder.length === 0}
                      >
                        💾 Save Pack Size Order
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-2 text-secondary">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">Pack Size Order Saved!</span>
                      </div>
                      <Button 
                        onClick={handlePreviewRPIColumns}
                        disabled={isPreviewing}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        {isPreviewing ? 'Generating Preview...' : 'Preview RPI Columns'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          {previewData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  RPI Columns Preview
                </CardTitle>
                <CardDescription>
                  {previewData.estimated_columns_to_add} RPI columns will be added to {previewData.main_sheet_rows} rows
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-primary/5 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {previewData.main_sheet_rows}
                    </div>
                    <div className="text-xs text-gray-600">Main Sheet Rows</div>
                  </div>
                  <div className="text-center p-3 bg-secondary/5 rounded-lg">
                    <div className="text-2xl font-bold text-secondary">
                      {previewData.estimated_columns_to_add}
                    </div>
                    <div className="text-xs text-gray-600">Columns to Add</div>
                  </div>
                  <div className="text-center p-3 bg-accent/5 rounded-lg">
                    <div className="text-2xl font-bold text-accent">
                      {previewData.available_rpi_columns}
                    </div>
                    <div className="text-xs text-gray-600">Available RPIs</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">RPI Columns to be Added:</h4>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {previewData.preview_columns.map((column, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium text-sm">{column.new_column_name}</div>
                          <div className="text-xs text-gray-500">
                            From: {column.original_rpi_column}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {RPIAdditionService.formatPackSize(column.pack_size)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button 
                    onClick={handleStartProcessing}
                    disabled={isProcessing}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    {isProcessing ? 'Processing...' : 'Add RPI Columns'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Process Tab */}
        <TabsContent value="process" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Processing RPI Addition</h3>
              <p className="text-muted-foreground">
                Adding RPI columns to main data based on pack size relationships...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Complete Tab */}
        <TabsContent value="complete" className="space-y-4">
          {/* Show either the current result or the saved completion state */}
          {(additionResult || rpiCompletionState) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-secondary" />
                  RPI Addition Complete
                </CardTitle>
                <CardDescription>
                  Successfully added RPI columns to your main data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-secondary/5 rounded-lg">
                    <div className="text-2xl font-bold text-secondary">
                      {additionResult?.main_rows_processed || rpiCompletionState?.rowsProcessed || 0}
                    </div>
                    <div className="text-xs text-gray-600">Rows Processed</div>
                  </div>
                  <div className="text-center p-3 bg-primary/5 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {additionResult?.rpi_columns_added || rpiCompletionState?.columnsAdded || 0}
                    </div>
                    <div className="text-xs text-gray-600">Columns Added</div>
                  </div>
                  <div className="text-center p-3 bg-accent/5 rounded-lg">
                    <div className="text-2xl font-bold text-accent">
                      {additionResult ? 
                        RPIAdditionService.calculateSuccessRate(additionResult.rpi_columns_info).toFixed(1) :
                        (rpiCompletionState?.successRate || 0).toFixed(1)
                      }%
                    </div>
                    <div className="text-xs text-gray-600">Success Rate</div>
                  </div>
                  <div className="text-center p-3 bg-accent/5 rounded-lg">
                    <div className="text-2xl font-bold text-accent">
                      {additionResult ? 
                        new Set(additionResult.rpi_columns_info.map(col => col.pack_size)).size :
                        rpiCompletionState?.packSizes || 0
                      }
                    </div>
                    <div className="text-xs text-gray-600">Pack Sizes</div>
                  </div>
                </div>

                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    {additionResult?.message || 'RPI columns added successfully'} Enhanced file has been created with RPI data.
                  </AlertDescription>
                </Alert>

                {/* Show download button if we have file path info */}
                {(additionResult?.enhanced_file_path || rpiCompletionState?.enhancedFilePath) && (
                  <div className="text-center">
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={handleDownloadEnhancedFile}
                    >
                      <Download className="h-4 w-4" />
                      Download Enhanced File
                    </Button>
                  </div>
                )}
                
                {/* Show completion timestamp if available */}
                {rpiCompletionState?.completionTimestamp && (
                  <div className="text-center text-sm text-muted-foreground">
                    Completed on: {new Date(rpiCompletionState.completionTimestamp).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AddRPIsStep;
