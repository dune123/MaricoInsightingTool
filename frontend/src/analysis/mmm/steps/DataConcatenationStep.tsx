/**
 * DataConcatenationStep Component
 * 
 * Purpose: Advanced data concatenation interface for Excel sheet processing with state restoration
 * 
 * Description: This component handles the concatenation of multiple Excel sheets using Python backend
 * algorithms, provides data preview capabilities, manages target variable selection, filter management,
 * and brand categorization. It supports both new analyses and restoration of existing analysis states.
 * 
 * Recent Fixes (2025-01-27):
 * - Fixed premature filter loading: Only loads filters when analysis is truly existing with filters set
 * - Fixed state filename extraction: Properly extracts stateFileName from backend response data structure
 * - Improved initialization logic: Prevents duplicate executions and race conditions
 * - Enhanced error handling: Comprehensive error handling with user feedback
 * - SIMPLIFIED STATE PRESERVATION: Single-source logic that checks existing data and skips initialization
 * - CRITICAL FIX (2025-01-27): Fixed infinite loop in state restoration by adding proper guards
 *   - Added initialization flag check before restoration calls
 *   - Added early return for already restored states
 *   - Added context change detection to reset initialization appropriately
 * 
 * Key Functions:
 * - executeConcatenation(): Processes Excel sheets using Python backend concatenation algorithm
 * - loadExistingAnalysisData(): Restores analysis state from backend analysis.json
 * - handleTargetVariableChange(): Manages target variable selection and brand extraction
 * - handleFilterChange(): Manages filter selection and updates context
 * - handleBrandCategorizationChange(): Updates brand categorization metadata
 * - saveConcatenationState(): Persists concatenation state to backend
 * - downloadConcatenatedFile(): Downloads processed concatenated file
 * - restoreExistingState(): Restores existing state without re-initialization
 * 
 * State Variables:
 * - isProcessing: Tracks concatenation processing status
 * - isProcessed: Indicates if concatenation is complete
 * - concatenatedFile: Stores concatenated file name
 * - concatenatedData: Holds preview data (up to 100 rows)
 * - previewColumns: Array of column names from concatenated data
 * - columnCategories: Categorized columns (Revenue, Distribution, Pricing, Promotion, Media, Others)
 * - selectedTargetVariable: Currently selected target variable from Revenue category
 * - selectedFilters: Array of selected filter columns from Others category
 * - brandCategories: Brand categorization (Our Brand, Competitors, Halo)
 * - totalRows: Total number of rows in concatenated dataset
 * - error: Error message for user feedback
 * - priceSheet/rpiSheet: Sheet information for pricing and RPI data
 * - isLoadingExisting: Loading state for existing analysis restoration
 * - restoredSheetCount: Number of sheets from restored analysis
 * 
 * API Endpoints:
 * - POST /api/concatenate: Executes Excel sheet concatenation
 * - POST /api/data/filtered: Loads filtered data from concatenated files
 * - GET /api/analysis/{id}: Retrieves analysis metadata
 * - POST /api/analysis/{id}/concatenation: Saves concatenation state
 * 
 * Dependencies:
 * - AnalysisContext: Global state management
 * - ExcelService: Backend concatenation operations
 * - BrandExtractor: Brand name extraction and categorization
 * - MetadataService: State persistence
 * - BrandAnalysisService: Analysis metadata management
 * - ColumnCategorization: Variable and filter selection UI
 * - DataPreviewTable: Data preview display
 * - ProcessingStatus: Status updates UI
 * - BrandCategorization: Brand management UI
 * 
 * Data Flow:
 * 1. User uploads Excel files → DataUploadStep
 * 2. Sheets are selected → User selects sheets to concatenate
 * 3. Concatenation executed → Python backend processes sheets
 * 4. Data preview loaded → Shows actual concatenated data
 * 5. Target variable selected → From Revenue category columns
 * 6. Filters selected → From Others category columns
 * 7. Brand categorization → Automatic extraction and manual organization
 * 8. State persisted → Saved to backend analysis.json
 * 9. Next step → Proceeds to AddRPIsStep
 * 
 * State Preservation Logic (SIMPLIFIED):
 * 1. Component mounts → Check if we already have concatenated data
 * 2. If data exists → Skip initialization entirely, data is already loaded
 * 3. If no data → Run normal initialization process
 * 4. Navigation away → Data remains in component state
 * 5. Return visit → Component detects existing data, skips initialization
 * 6. Result → No data loss, no re-processing, smooth user experience
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalysis } from "@/context/AnalysisContext";
import { SheetData, BrandCategories, PriceSheetInfo, RPISheetInfo } from "@/types/analysis";
import { Database, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { excelService } from "@/analysis/mmm/services";
import { ColumnCategorization } from "./ColumnCategorization";
import { DataPreviewTable } from "./DataPreviewTable";
import { ProcessingStatus } from "./ProcessingStatus";
import { BrandCategorization } from "./BrandCategorization";
import { createBrandMetadata } from "@/analysis/mmm/services/brandExtractor";
import { metadataService } from "@/analysis/mmm/services";
import { brandAnalysisService } from "@/analysis/mmm/services/brandAnalysisService";
import { initializationService } from "@/analysis/mmm/services/initializationService";
import { ColumnCategories, ConcatenationState } from "./data-concatenation/types";

export function DataConcatenationStep() {
  const { state, setAnalysisData, setSelectedFilters: setContextSelectedFilters } = useAnalysis();
  const { analysisData, currentAnalysisId, selectedBrand } = state;
  const { toast } = useToast();
  
  // Component mount tracking
  const [hasMounted, setHasMounted] = useState(false);
  
  // Ref to track if initialization has already run (persists across re-renders)
  const initializationRef = useRef(false);
  
  // State to prevent duplicate concatenation executions
  const [isConcatenationInProgress, setIsConcatenationInProgress] = useState(false);

  // Stabilize analysisData to prevent unnecessary re-triggers
  const stableAnalysisData = useMemo(() => analysisData, [analysisData]);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isProcessed, setIsProcessed] = useState<boolean>(false);
  const [concatenatedFile, setConcatenatedFile] = useState<string | null>(null);
  const [concatenatedData, setConcatenatedData] = useState<Record<string, string | number>[] | null>(null);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const [columnCategories, setColumnCategories] = useState<ColumnCategories | null>(null);
  const [selectedTargetVariable, setSelectedTargetVariable] = useState<string | null>(analysisData?.targetVariable || null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(analysisData?.selectedFilters || state.selectedFilters || []);
  const [brandCategories, setBrandCategories] = useState<BrandCategories | null>(null);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [priceSheet, setPriceSheet] = useState<PriceSheetInfo | null>(null);
  const [rpiSheet, setRPISheet] = useState<RPISheetInfo | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState<boolean>(false);
  const [restoredSheetCount, setRestoredSheetCount] = useState<number | null>(null);

  // Get selected sheets from the previous step (memoized to prevent re-renders)
  // For existing analyses, sheets might not be loaded yet, so we handle that case separately
  const selectedSheets = useMemo(() => 
    analysisData?.sheets?.filter(sheet => sheet.isSelected) || [], 
    [analysisData?.sheets]
  );

  // Create a stable reference for selectedSheets to avoid dependency issues
  const selectedSheetsRef = useRef<SheetData[]>([]);
  
  // Update the ref whenever selectedSheets changes
  useEffect(() => {
    selectedSheetsRef.current = selectedSheets;
  }, [selectedSheets]);

  // Calculate actual sheet count for display (use restored count if available)
  const displaySheetCount = restoredSheetCount !== null ? restoredSheetCount : selectedSheets.length;
  
  // Helper function to safely get selectedSheets with fallback
  const getSelectedSheets = () => {
    return selectedSheetsRef.current || [];
  };

  // Helper function to convert between ConcatenationState types
  const convertToMetadataConcatenationState = (state: ConcatenationState) => {
    return {
      ...state,
      status: state.status === 'error' ? 'failed' as const : state.status === 'processing' ? 'processing' as const : 'completed' as const,
      previewData: state.previewData || []
    };
  };
  
  // Debug logging for sheet count (can be removed in production)
  // console.log('📋 Sheet Count Info:', { displaySheetCount, restoredSheetCount, currentSelectedSheets: selectedSheets.length });

  // SIMPLIFIED: Load filters directly from backend analysis.json (ONLY for existing analyses)
  useEffect(() => {
    const loadFiltersFromBackend = async () => {
      // Only load filters if this is an existing analysis with concatenation state AND filters were previously set
      if (currentAnalysisId && selectedFilters.length === 0 && analysisData?.isConcatenated && analysisData?.selectedFilters && analysisData.selectedFilters.length > 0) {
        try {
          console.log('🔍 Loading filters from backend for existing analysis:', currentAnalysisId);
          const backendResult = await brandAnalysisService.getAnalysis(currentAnalysisId);
          if (backendResult.success && backendResult.data?.filterState?.selectedFilters) {
            const backendFilters = backendResult.data.filterState.selectedFilters;
            setSelectedFilters(backendFilters);
            setContextSelectedFilters(backendFilters);
            console.log('🔍 Restored filters from analysis.json:', backendFilters);
          }
        } catch (error) {
          console.error('❌ Failed to load filters from backend:', error);
        }
      }
    };
    
    loadFiltersFromBackend();
  }, [currentAnalysisId, selectedFilters.length, setContextSelectedFilters, analysisData?.isConcatenated, analysisData?.selectedFilters]);

  // NEW: State restoration function that doesn't trigger re-initialization
  const restoreExistingState = useCallback(async () => {
    if (!currentAnalysisId || !selectedBrand) {
      return false;
    }

    // CRITICAL FIX: Check if we've already restored to prevent infinite loops
    if (isProcessed && concatenatedData && previewColumns.length > 0) {
      console.log('✅ State already restored, skipping restoration');
      return true;
    }
    
    try {
      console.log('🔄 Restoring existing state for:', selectedBrand);
      
      // Get the analysis metadata from analysis.json
      const analysisResult = await brandAnalysisService.getAnalysis(currentAnalysisId);
      if (!analysisResult.success || !analysisResult.data) {
        console.error('❌ Failed to load analysis metadata');
        return false;
      }
      
      const analysis = analysisResult.data;
      console.log('✅ Loaded analysis metadata:', {
        currentStep: analysis.currentStep,
        hasConcatenationState: !!analysis.concatenationState,
        hasFilterState: !!analysis.filterState
      });
      
      // Check if we have concatenation state
      if (!analysis.concatenationState?.concatenatedFileName) {
        console.log('ℹ️ No concatenation state found, cannot restore');
        return false;
      }
      
      const concatenatedFileName = analysis.concatenationState.concatenatedFileName;
      console.log('📄 Found concatenated file:', concatenatedFileName);
      
      // Load actual data from concatenated file
      const dataResponse = await fetch(`${import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000'}/api/data/filtered?brand=${encodeURIComponent(selectedBrand)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: concatenatedFileName,
          filters: {},
          limit: 100
        })
      });
      
      if (!dataResponse.ok) {
        const errorText = await dataResponse.text();
        console.error('❌ Failed to load data from file:', dataResponse.status, errorText);
        return false;
      }
      
      const dataResult = await dataResponse.json();
      console.log('✅ Loaded concatenated data:', {
        filename: concatenatedFileName,
        rows: dataResult.data.rows.length,
        columns: dataResult.data.columns.length,
        totalRows: dataResult.data.originalRows
      });
      
      // Restore the data state
      setPreviewColumns(dataResult.data.columns);
      setConcatenatedData(dataResult.data.rows);
      setTotalRows(dataResult.data.originalRows);
      setConcatenatedFile(concatenatedFileName);
      setIsProcessed(true);
      
      // Restore metadata from analysis.json
      const concatenationState = analysis.concatenationState;
      
      // Restore target variable
      if (concatenationState.targetVariable) {
        setSelectedTargetVariable(concatenationState.targetVariable);
        console.log('🎯 Restored target variable:', concatenationState.targetVariable);
      }
      
      // Restore brand categories
      if (concatenationState.brandMetadata?.categories) {
        setBrandCategories(concatenationState.brandMetadata.categories);
        console.log('🏷️ Restored brand categories');
      }
      
      // Restore column categories
      if (concatenationState.columnCategories) {
        setColumnCategories(concatenationState.columnCategories);
        console.log('📊 Restored column categories');
      } else {
        // Create basic categories if none saved
        const defaultCategories = {
          Revenue: dataResult.data.columns.filter(col => /volume|value|unit/i.test(col)),
          Distribution: dataResult.data.columns.filter(col => /wtd|stores/i.test(col)),
          Pricing: dataResult.data.columns.filter(col => /price|rpi/i.test(col)),
          Promotion: dataResult.data.columns.filter(col => /promo|tup|btl/i.test(col)),
          Media: dataResult.data.columns.filter(col => /grp|spend/i.test(col)),
          Others: dataResult.data.columns.filter(col => 
            !/(volume|value|unit|wtd|stores|price|rpi|promo|tup|btl|grp|spend)/i.test(col)
          )
        };
        setColumnCategories(defaultCategories);
        console.log('📊 Created default column categories');
      }
      
      // Restore sheet count
      if (concatenationState.selectedSheets) {
        setRestoredSheetCount(concatenationState.selectedSheets.length);
        console.log('📋 Restored sheet count:', concatenationState.selectedSheets.length);
      }
      
      console.log('✅ State restoration completed successfully');
      
      return true;
      
    } catch (error) {
      console.error('❌ Error restoring existing state:', error);
      return false;
    }
  }, [currentAnalysisId, selectedBrand, isProcessed, concatenatedData, previewColumns.length]);

  // SINGLE PATH: Load existing analysis data with metadata restoration
  const loadExistingAnalysisData = useCallback(async () => {
    if (!currentAnalysisId || !selectedBrand) return false;
    
    setIsLoadingExisting(true);
    setError(null);
    
    try {
      console.log('🔄 Loading existing analysis data for:', selectedBrand);
      
      // Step 1: Get the analysis metadata from analysis.json
      const analysisResult = await brandAnalysisService.getAnalysis(currentAnalysisId);
      if (!analysisResult.success || !analysisResult.data) {
        console.error('❌ Failed to load analysis metadata');
        setError('Failed to load analysis metadata. Please try again.');
        return false;
      }
      
      const analysis = analysisResult.data;
      console.log('✅ Loaded analysis metadata:', {
        currentStep: analysis.currentStep,
        hasConcatenationState: !!analysis.concatenationState,
        hasFilterState: !!analysis.filterState
      });
      
      // Step 2: Check if we have concatenation state
      if (!analysis.concatenationState?.concatenatedFileName) {
        console.log('ℹ️ No concatenation state found, analysis not ready');
        setError('Analysis not ready. Please complete data concatenation first.');
        return false;
      }
      
      const concatenatedFileName = analysis.concatenationState.concatenatedFileName;
      console.log('📄 Found concatenated file:', concatenatedFileName);
      
      // Step 3: Load actual data from concatenated file
      const dataResponse = await fetch(`${import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000'}/api/data/filtered?brand=${encodeURIComponent(selectedBrand)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: concatenatedFileName,
          filters: {},
          limit: 100
        })
      });
      
      if (!dataResponse.ok) {
        const errorText = await dataResponse.text();
        console.error('❌ Failed to load data from file:', dataResponse.status, errorText);
        setError(`Failed to load data from ${concatenatedFileName}. File may be corrupted.`);
        return false;
      }
      
      const dataResult = await dataResponse.json();
      console.log('✅ Loaded concatenated data:', {
        filename: concatenatedFileName,
        rows: dataResult.data.rows.length,
        columns: dataResult.data.columns.length,
        totalRows: dataResult.data.originalRows
      });
      
      // Step 4: Set the data
      setPreviewColumns(dataResult.data.columns);
      setConcatenatedData(dataResult.data.rows);
      setTotalRows(dataResult.data.originalRows);
      setConcatenatedFile(concatenatedFileName);
      setIsProcessed(true);
      
      // Step 5: Restore metadata from analysis.json (single source of truth)
      const concatenationState = analysis.concatenationState;
      
      // Restore target variable
      if (concatenationState.targetVariable) {
        setSelectedTargetVariable(concatenationState.targetVariable);
        console.log('🎯 Restored target variable:', concatenationState.targetVariable);
      }
      
      // Restore filters (already loaded by useEffect above)
      if (analysis.filterState?.selectedFilters) {
        console.log('🔍 Filters already restored from analysis.json');
      }
      
      // Restore brand categories
      if (concatenationState.brandMetadata?.categories) {
        setBrandCategories(concatenationState.brandMetadata.categories);
        console.log('🏷️ Restored brand categories');
      }
      
      // Restore column categories
      if (concatenationState.columnCategories) {
        setColumnCategories(concatenationState.columnCategories);
        console.log('📊 Restored column categories');
      } else {
        // Create basic categories if none saved
        const defaultCategories = {
          Revenue: dataResult.data.columns.filter(col => /volume|value|unit/i.test(col)),
          Distribution: dataResult.data.columns.filter(col => /wtd|stores/i.test(col)),
          Pricing: dataResult.data.columns.filter(col => /price|rpi/i.test(col)),
          Promotion: dataResult.data.columns.filter(col => /promo|tup|btl/i.test(col)),
          Media: dataResult.data.columns.filter(col => /grp|spend/i.test(col)),
          Others: dataResult.data.columns.filter(col => 
            !/(volume|value|unit|wtd|stores|price|rpi|promo|tup|btl|grp|spend)/i.test(col)
          )
        };
        setColumnCategories(defaultCategories);
        console.log('📊 Created default column categories');
      }
      
      // Restore sheet count
      if (concatenationState.selectedSheets) {
        setRestoredSheetCount(concatenationState.selectedSheets.length);
        console.log('📋 Restored sheet count:', concatenationState.selectedSheets.length);
      }
      
      // Step 6: Update analysis context
      const updatedData = {
        ...analysisData,
        isConcatenated: true,
        columns: dataResult.data.columns,
        targetVariable: concatenationState.targetVariable,
        selectedFilters: analysis.filterState?.selectedFilters || [],
        brandMetadata: concatenationState.brandMetadata,
        concatenationConfig: {
          selectedSheets: concatenationState.selectedSheets || [],
          resultingColumns: dataResult.data.columns,
          customFileName: concatenatedFileName
        },
        rowCount: dataResult.data.originalRows
      };
      
      setAnalysisData(updatedData);
      
      toast({
        title: "Analysis Restored",
        description: `Successfully loaded ${dataResult.data.originalRows} rows with all previous settings`,
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ Error loading existing analysis:', error);
      setError(error instanceof Error ? error.message : 'Failed to load existing analysis data.');
      return false;
    } finally {
      setIsLoadingExisting(false);
    }
  }, [currentAnalysisId, selectedBrand, analysisData, setAnalysisData, toast]);

  // File naming strategy:
  // - sourceFileName: processed filename (with timestamp) used for actual file operations
  // - originalFileName: base filename (no timestamp) used for metadata state tracking 
  // - concatenatedFileName: output filename for concatenated file
  const sourceFileName = useMemo(() => 
    analysisData?.processedFilename || analysisData?.filename || '', 
    [analysisData?.processedFilename, analysisData?.filename]
  );
  const originalFileName = useMemo(() => 
    analysisData?.filename || '', 
    [analysisData?.filename]
  ); // Base filename for metadata tracking
  const concatenatedFileName = useMemo(() => 
    sourceFileName.replace(/\.[^/.]+$/, "_concatenated.xlsx"), 
    [sourceFileName]
  );

  const processConcatenation = useCallback(async () => {
    if (getSelectedSheets().length === 0) {
      setError("No sheets were selected in the previous step.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Call backend to concatenate sheets using processed filename as source
      // Backend will check intermediate/ directory first (for modified files), then raw/ directory
      const result = await excelService.concatenateSheets(
        sourceFileName,  // Source file (backend checks intermediate/ then raw/ directory)
        getSelectedSheets().map(sheet => sheet.sheetName),
        concatenatedFileName.replace('.xlsx', ''),  // Output filename for concat/ directory
        state.selectedBrand || undefined  // Pass our brand for RPI sheet creation
      );

      // Use actual columns and data from backend response
      if (result.columns) {
        setPreviewColumns(result.columns);
      }

      // Use column categories from backend response
      if (result.columnCategories) {
        setColumnCategories(result.columnCategories);
      }

      // Use actual row count from backend
      if (result.totalRows) {
        setTotalRows(result.totalRows);
      }

      // Use real preview data from backend instead of generating mock data
      if (result.previewData && result.previewData.length > 0) {
        setConcatenatedData(result.previewData);
      } else {
        // Fallback: create minimal preview from column names
        const fallbackData = [{
          ...result.columns?.reduce((acc, col) => ({ ...acc, [col]: 'Loading...' }), {})
        }];
        setConcatenatedData(fallbackData);
      }

      setConcatenatedFile(concatenatedFileName);
      
      // Handle Price sheet information from backend response
      if (result.priceSheet) {
        setPriceSheet(result.priceSheet);
      }
      
      // Handle RPI sheet information from backend response
      if (result.rpiSheet) {
        setRPISheet(result.rpiSheet);
      }
      
      setIsProcessed(true);

      // NEW: Mark as visited after successful concatenation
      // Removed markStepVisited(5); // Step 5 is Data Concatenation

      // Update analysis data with concatenation info
      const updatedData = {
        ...analysisData,
        isConcatenated: true,
        concatenationConfig: {
          selectedSheets: getSelectedSheets().map(sheet => sheet.sheetName),
          resultingColumns: result.columns || [],
          customFileName: concatenatedFileName
        },
        filename: originalFileName, // Keep original filename for future steps
        rowCount: result.totalRows || 0,
        priceSheet: result.priceSheet,
        rpiSheet: result.rpiSheet
      };

      setAnalysisData(updatedData);

      // FIXED: Only save state after concatenation is fully validated and complete
      try {
        // Validate concatenation result before saving state
        if (!result.columns || result.columns.length === 0) {
          throw new Error('Concatenation result is invalid: no columns returned');
        }
        
        if (!result.totalRows || result.totalRows <= 0) {
          throw new Error('Concatenation result is invalid: no data rows returned');
        }
        
        if (!result.previewData || result.previewData.length === 0) {
          console.warn('⚠️ No preview data returned from concatenation, using placeholder');
        }
        
        console.log('✅ Concatenation result validated, preparing state for persistence');
        
        const stateToSave: ConcatenationState = {
          originalFileName: originalFileName,
          concatenatedFileName: concatenatedFileName,
          selectedSheets: getSelectedSheets().map(sheet => sheet.sheetName),
          targetVariable: selectedTargetVariable,
          brandMetadata: undefined, // Will be set when target variable is selected
          previewData: result.previewData, // Use fresh data from backend response
          columnCategories: result.columnCategories, // Use fresh categories from backend response
          totalRows: result.totalRows || 0,
          processedAt: new Date().toISOString(),
          status: 'completed',
          priceSheet: result.priceSheet
        };

        // FIXED: Serialize state saving operations to prevent race conditions
        console.log('💾 Starting state persistence operations...');
        
        // Step 1: Save to metadata backend first (primary state storage)
        const saveResult = await metadataService.saveConcatenationState(convertToMetadataConcatenationState(stateToSave));
        console.log('✅ State saved to metadata backend');
        
        // Step 2: Update analysis data with state information
        if (saveResult.success && saveResult.stateFileName && analysisData) {
          const updatedAnalysisData = {
            ...analysisData,
            stateFileName: saveResult.stateFileName,
            isConcatenated: true
          };
          setAnalysisData(updatedAnalysisData);
          console.log('💾 State filename stored in analysis data:', saveResult.stateFileName);
        }

        // Step 3: Update main analysis metadata (secondary state storage)
        // FIXED: Wait for previous operations to complete before updating analysis
        if (currentAnalysisId) {
          try {
            console.log('🔄 Updating analysis metadata with concatenation state...');
            await brandAnalysisService.updateAnalysis(currentAnalysisId, {
              concatenationState: stateToSave
            });
            console.log('✅ Analysis concatenationState updated with concatenation data');
          } catch (error) {
            console.error('❌ Failed to update concatenationState in analysis metadata:', error);
            // Continue execution - concatenation state was saved successfully to metadata backend
          }
        } else {
          console.warn('⚠️ No currentAnalysisId found, skipping analysis concatenationState update');
        }

      } catch (stateError) {
        console.error('❌ Failed to save state (non-critical):', stateError);
        // Don't fail the entire process if state saving fails
      }

      toast({
        title: "Concatenation completed",
        description: `Successfully concatenated ${getSelectedSheets().length} sheets into ${concatenatedFileName}`,
      });

    } catch (error) {
      console.error('Concatenation error:', error);
      setError(`Failed to concatenate sheets: ${error.message}`);
      toast({
        title: "Concatenation failed",
        description: "An error occurred while concatenating sheets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [originalFileName, concatenatedFileName, analysisData, setAnalysisData, toast, selectedTargetVariable, sourceFileName, state.selectedBrand, currentAnalysisId]);

  // Ref to store stable function references to avoid infinite loops
  const stableFunctionsRef = useRef({
    loadExistingAnalysisData,
    processConcatenation
  });
  
  // Update the ref when functions change
  useEffect(() => {
    stableFunctionsRef.current = {
      loadExistingAnalysisData,
      processConcatenation
    };
  }, [loadExistingAnalysisData, processConcatenation]);

  // Sync target variable when analysisData changes (separate from filter sync above)
  useEffect(() => {
    if (analysisData?.targetVariable && selectedTargetVariable !== analysisData.targetVariable) {
      setSelectedTargetVariable(analysisData.targetVariable);
      console.log('🔄 Restored target variable from analysisData:', analysisData.targetVariable);
    }
  }, [analysisData?.targetVariable, selectedTargetVariable]);

  // Component mount effect
  useEffect(() => {
    console.log('🚀 DataConcatenationStep component mounted');
    setHasMounted(true);
  }, []);

  // SINGLE INITIALIZATION: Run only once when all required context is available
  const runInitialization = useCallback(async () => {
    // FIXED: More robust initialization guard to prevent race conditions
    if (initializationRef.current) {
      console.log('⏭️  Initialization already in progress or completed, skipping');
      return;
    }
    
    // Double-check we have the required context before proceeding
    if (!currentAnalysisId || !selectedBrand) {
      console.log('⏭️  Missing required context for initialization, skipping');
      return;
    }
    
    // Mark as initialized BEFORE starting to prevent race conditions
    initializationRef.current = true;
    
    console.log('🔍 DataConcatenationStep initialization triggered:', {
      currentAnalysisId,
      selectedBrand,
      selectedSheetsCount: getSelectedSheets().length,
      hasAnalysisData: !!stableAnalysisData,
      isConcatenated: stableAnalysisData?.isConcatenated
    });
    
    try {
      // SIMPLE CHECK: If we already have concatenated data, skip initialization
      if (stableAnalysisData?.isConcatenated && stableAnalysisData?.concatenationConfig) {
        console.log('🔄 ALREADY HAS DATA: Skipping initialization, data already exists');
        
        // But we still need to restore the component state
        if (!isProcessed || !concatenatedData) {
          console.log('🔄 Restoring component state from existing data...');
          const restored = await restoreExistingState();
          if (restored) {
            console.log('✅ Component state restored successfully');
          }
        }
        
        return;
      }
      
      // Check if this is a new analysis or resumed analysis
      const isNewAnalysis = !stableAnalysisData || !stableAnalysisData.isConcatenated;
      
      if (isNewAnalysis) {
        console.log('🆕 NEW ANALYSIS: Checking if concatenation should be executed');
        
        // For new analyses, check if concatenation should be executed
        const selectedSheets = getSelectedSheets();
        
        if (selectedSheets && selectedSheets.length > 0 && !isConcatenationInProgress) {
          console.log('🚀 Executing concatenation for new analysis with', selectedSheets.length, 'sheets');
          
          // Set state to prevent duplicate executions
          setIsConcatenationInProgress(true);
          
          try {
            await processConcatenation();
            console.log('✅ Concatenation completed successfully for new analysis');
          } catch (error) {
            console.error('❌ Concatenation failed for new analysis:', error);
            // Reset state on error to allow retry
            setIsConcatenationInProgress(false);
            // Show error to user
            setError(error instanceof Error ? error.message : 'Concatenation failed. Please try again.');
          }
        } else if (isConcatenationInProgress) {
          console.log('⏸️ Concatenation already in progress, skipping duplicate execution');
        } else {
          console.log('⏸️ Waiting for user to select sheets for concatenation');
        }
      } else {
        console.log('🔄 RESUMING ANALYSIS: Attempting to load existing analysis data...');
        try {
          const result = await stableFunctionsRef.current.loadExistingAnalysisData();
          if (result) {
            console.log('✅ Successfully loaded existing analysis data');
            return;
          }
        } catch (error) {
          console.error('❌ Failed to load existing analysis:', error);
          setError(error instanceof Error ? error.message : 'Failed to load existing analysis data.');
        }
      }
      
      // Fallback: no sheets available
      if (!getSelectedSheets() || getSelectedSheets().length === 0) {
        console.log('⚠️ No sheets available for concatenation');
      }
    } catch (error) {
      console.error('❌ Error during initialization:', error);
      setError(error instanceof Error ? error.message : 'Initialization failed. Please try again.');
    }
  }, [currentAnalysisId, selectedBrand, stableAnalysisData, isConcatenationInProgress, processConcatenation, isProcessed, concatenatedData, restoreExistingState]);

  // FIXED: Combined initialization and restoration effect to prevent race conditions
  useEffect(() => {
    // Only run when component is mounted and has required context
    if (!hasMounted || !currentAnalysisId || !selectedBrand) {
      return;
    }

    // Prevent multiple simultaneous executions
    if (initializationRef.current) {
      console.log('⏭️  Initialization already completed, skipping effect');
      return;
    }

    console.log('🔄 DataConcatenationStep: Starting initialization/restoration logic');

    // Check if this is a return visit with existing data
    if (stableAnalysisData?.isConcatenated) {
      console.log('🔄 RETURNING TO VISITED STEP: Restoring existing state without re-initialization');
      // CRITICAL FIX: Set initialization flag BEFORE calling restore to prevent infinite loops
      initializationRef.current = true;
      restoreExistingState();
    } else {
      console.log('🆕 NEW OR INCOMPLETE ANALYSIS: Running initialization');
      runInitialization();
    }
  }, [hasMounted, currentAnalysisId, selectedBrand, stableAnalysisData?.isConcatenated, runInitialization, restoreExistingState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsConcatenationInProgress(false);
      initializationRef.current = false; // Reset initialization flag for re-mounting
      console.log('🧹 Cleanup: Reset concatenation state and initialization flag on unmount');
    };
  }, []);
  
  // CRITICAL FIX: Reset initialization flag when navigation context changes
  useEffect(() => {
    if (currentAnalysisId && selectedBrand) {
      // Only reset if we're switching to a different analysis
      const currentKey = `${currentAnalysisId}-${selectedBrand}`;
      const lastKey = localStorage.getItem('lastAnalysisKey');
      
      if (lastKey && lastKey !== currentKey) {
        console.log('🔄 Different analysis detected, resetting initialization flag');
        initializationRef.current = false;
      }
      
      localStorage.setItem('lastAnalysisKey', currentKey);
    }
  }, [currentAnalysisId, selectedBrand]);

  const handleTargetVariableSelection = useCallback((columnName: string) => {
    setSelectedTargetVariable(columnName);
    
    // Create brand metadata from target variable selection
    const brandMetadata = createBrandMetadata(
      columnName, 
      previewColumns, 
      columnCategories || undefined
    );
    
    // Update brand categories state
    setBrandCategories(brandMetadata.categories);
    
    // Update analysis context with selected target variable and brand metadata
    const updatedData = {
      ...analysisData,
      targetVariable: columnName,
      targetVariableMetadata: {
        selectedAt: new Date().toISOString(),
        category: 'Revenue',
        selectionStep: 'data-concatenation'
      },
      brandMetadata
    };

    setAnalysisData(updatedData);

    toast({
      title: "Target Variable Selected",
      description: `${columnName} selected as target variable. Our Brand: ${brandMetadata.ourBrand}`,
    });

    // Save updated state with target variable
    const saveUpdatedState = async () => {
      try {
        const stateToSave: ConcatenationState = {
          originalFileName,
          concatenatedFileName,
          selectedSheets: getSelectedSheets().map(sheet => sheet.sheetName),
          targetVariable: columnName,
          brandMetadata,
          previewData: concatenatedData || [], // Ensure we have an array
          columnCategories,
          totalRows,
          processedAt: new Date().toISOString(),
          status: 'completed'
        };

                  await metadataService.saveConcatenationState(convertToMetadataConcatenationState(stateToSave));
        console.log('✅ Updated state saved with target variable');
      } catch (error) {
        console.error('❌ Failed to save updated state:', error);
      }
    };

    saveUpdatedState();
  }, [analysisData, setAnalysisData, toast, previewColumns, columnCategories, originalFileName, concatenatedFileName, concatenatedData, totalRows]);

  const handleFilterSelection = useCallback(async (columnName: string) => {
    const updatedFilters = selectedFilters.includes(columnName)
      ? selectedFilters.filter(filter => filter !== columnName)
      : [...selectedFilters, columnName];

    setSelectedFilters(updatedFilters);
    setContextSelectedFilters(updatedFilters); // Also update context
    
    // Update analysis context with selected filters
    const updatedData = {
      ...analysisData,
      selectedFilters: updatedFilters,
      filterMetadata: {
        selectedAt: new Date().toISOString(),
        category: 'Others',
        selectionStep: 'data-concatenation'
      }
    };

    setAnalysisData(updatedData);

    // NEW: Mark as visited when making changes
    // Removed markStepVisited(5); // Step 5 is Data Concatenation

    toast({
      title: updatedFilters.includes(columnName) ? "Filter Added" : "Filter Removed",
      description: `${columnName} ${updatedFilters.includes(columnName) ? 'added to' : 'removed from'} filters. Total filters: ${updatedFilters.length}`,
    });

    // Save updated state with filters
    const saveUpdatedState = async () => {
      try {
        // CRITICAL FIX: Only save to concatenation state if we have complete file information
        const hasCompleteFileInfo = originalFileName && 
                                   concatenatedFileName && 
                                   getSelectedSheets().length > 0;

        if (hasCompleteFileInfo) {
          const stateToSave: ConcatenationState = {
            originalFileName,
            concatenatedFileName,
            selectedSheets: getSelectedSheets().map(sheet => sheet.sheetName),
            targetVariable: selectedTargetVariable,
            selectedFilters: updatedFilters,
            brandMetadata: analysisData?.brandMetadata,
            previewData: concatenatedData || [], // Ensure we have an array
            columnCategories,
            totalRows,
            processedAt: new Date().toISOString(),
            status: 'completed'
          };

          // 1. Save to concatenation state (existing logic)
          await metadataService.saveConcatenationState(convertToMetadataConcatenationState(stateToSave));
          console.log('✅ Concatenation state saved with filters');
        } else {
          console.log('⚠️ Skipping concatenation state save - missing required file information');
          console.log('📋 Available data:', {
            hasOriginalFileName: !!originalFileName,
            hasConcatenatedFileName: !!concatenatedFileName,
            selectedSheetsCount: getSelectedSheets().length
          });
        }
        
        // 2. CRITICAL FIX: Also save to main analysis.json filterState
        if (currentAnalysisId) {
          const filterState = {
            selectedFilters: updatedFilters,
            updatedAt: new Date().toISOString(),
            source: 'data-concatenation-step'
          };
          
          try {
            await brandAnalysisService.updateAnalysis(currentAnalysisId, {
              filterState: filterState
            });
            console.log('✅ Analysis filterState saved with filters:', updatedFilters);
          } catch (error) {
            console.error('❌ Failed to save filterState to analysis.json:', error);
            // Continue execution - concatenation state was saved successfully
          }
        } else {
          console.warn('⚠️ No currentAnalysisId found, skipping analysis filterState save');
        }
        
      } catch (error) {
        console.error('❌ Failed to save updated state:', error);
      }
    };

    saveUpdatedState();
  }, [selectedFilters, analysisData, setAnalysisData, setContextSelectedFilters, toast, originalFileName, concatenatedFileName, selectedTargetVariable, concatenatedData, columnCategories, totalRows, currentAnalysisId]);

  const handleBrandCategoriesChange = useCallback((categories: BrandCategories) => {
    setBrandCategories(categories);
    
    // Update analysis context with new brand categories
    const updatedData = {
      ...analysisData,
      brandMetadata: analysisData?.brandMetadata ? {
        ...analysisData.brandMetadata,
        categories,
        extractedAt: new Date().toISOString() // Update timestamp
      } : undefined
    };

    setAnalysisData(updatedData);

    // NEW: Mark as visited when making changes
    // Removed markStepVisited(5); // Step 5 is Data Concatenation

    toast({
      title: "Brand Categories Updated",
      description: `Moved brands between categories. Halo: ${categories.haloBrands.length}, Competitors: ${categories.competitors.length}`,
    });

    // Save updated state with brand categories
    const saveUpdatedState = async () => {
      try {
        // Create complete brand metadata structure
        const completeBrandMetadata = analysisData?.brandMetadata ? {
          ...analysisData.brandMetadata,
          categories,
          extractedAt: new Date().toISOString()
        } : undefined;

        const stateToSave: ConcatenationState = {
          originalFileName,
          concatenatedFileName,
          selectedSheets: getSelectedSheets().map(sheet => sheet.sheetName),
          targetVariable: selectedTargetVariable,
          brandMetadata: completeBrandMetadata,
          previewData: concatenatedData || [], // Ensure we have an array
          columnCategories,
          totalRows,
          processedAt: new Date().toISOString(),
          status: 'completed'
        };

        await metadataService.saveConcatenationState(convertToMetadataConcatenationState(stateToSave));
        console.log('✅ Updated state saved with brand categories');
      } catch (error) {
        console.error('❌ Failed to save updated state:', error);
      }
    };

    saveUpdatedState();
  }, [analysisData, setAnalysisData, toast, originalFileName, concatenatedFileName, selectedTargetVariable, concatenatedData, columnCategories, totalRows]);

  const handleDownload = async () => {
    if (!concatenatedFile) {
      toast({
        title: "No file available",
        description: "Please process concatenation first.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Download started",
        description: `Downloading ${concatenatedFile}...`,
      });
      
      // Use ExcelService to download the file
              await excelService.downloadFile(concatenatedFile);
      
      toast({
        title: "Download completed",
        description: `${concatenatedFile} has been downloaded to your computer.`,
      });

    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "An error occurred while downloading the file.",
        variant: "destructive",
      });
    }
  };

  // Show loading state for existing analysis
  if (isLoadingExisting) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Database className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
        <p>Loading existing analysis data for {selectedBrand}...</p>
        <p className="text-sm mt-2">Searching for concatenated files...</p>
      </div>
    );
  }

  // Show processed data if we have it, regardless of analysisData state
  if (isProcessed && concatenatedData && previewColumns.length > 0) {
    // Skip the normal checks and show the data
  } else if (!analysisData && (!currentAnalysisId || !selectedBrand)) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p>No analysis data available.</p>
        <p className="text-sm mt-2">
          Please upload a file first or go back to select an analysis.
        </p>
      </div>
    );
  }

  // Check if this is an existing analysis that should be resumed
  // We need to check if we have a currentAnalysisId and if the analysis has been loaded
  const hasExistingConcatenation = currentAnalysisId && analysisData?.isConcatenated;
  
  // Debug logging for analysis state (commented out to prevent render-time logging)
  // console.log('🔍 Analysis State Check:', {
  //   currentAnalysisId,
  //   hasAnalysisData: !!analysisData,
  //   isConcatenated: analysisData?.isConcatenated,
  //   hasExistingConcatenation,
  //   displaySheetCount,
  //   isProcessed,
  //   selectedSheetsCount: selectedSheets.length
  // });
  
  if (displaySheetCount === 0 && !isProcessed && !hasExistingConcatenation) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p>No sheets were selected for concatenation.</p>
        <p className="text-sm mt-2">Please go back to the data upload step and select sheets.</p>
      </div>
    );
  }
  
  // If we have existing concatenation but no sheets loaded, show a different message
  if (displaySheetCount === 0 && !isProcessed && hasExistingConcatenation) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading existing analysis...</p>
        <p className="text-sm mt-2">Resuming your previous concatenation session</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Database className="w-12 h-12 mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2">Data Concatenation</h2>
        <p className="text-muted-foreground">
          Processing and previewing your concatenated dataset
        </p>
      </div>

      {/* Processing Status */}
      <ProcessingStatus
        isProcessing={isProcessing}
        isProcessed={isProcessed}
        error={error}
        selectedSheetsCount={displaySheetCount}
        originalFileName={originalFileName}
        previewColumnsCount={previewColumns.length}
        totalRows={totalRows}
        concatenatedFile={concatenatedFile}
        onRetry={processConcatenation}
        onDownload={handleDownload}
      />



      {/* Price and RPI Sheet Information */}
      {isProcessed && (priceSheet || rpiSheet) && (
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
              <div className="p-4 bg-secondary/5 border border-secondary/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-secondary rounded-full"></div>
                  <h4 className="font-medium text-secondary">RPI Sheet</h4>
                </div>
                <p className="text-sm text-secondary/80 mb-2">
                  {rpiSheet.message}
                </p>
                {rpiSheet.created && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-secondary/70">
                      <div>
                        <span className="font-medium">Rows:</span> {rpiSheet.rowCount}
                      </div>
                      <div>
                        <span className="font-medium">Regions:</span> {rpiSheet.uniqueRegions}
                      </div>
                      <div>
                        <span className="font-medium">Months:</span> {rpiSheet.uniqueMonths}
                      </div>
                      <div>
                        <span className="font-medium">RPI Columns:</span> {rpiSheet.rpiColumns?.length}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-secondary/70">
                      <div>
                        <span className="font-medium">Our Brand:</span> {rpiSheet.ourBrand}
                      </div>
                      <div>
                        <span className="font-medium">Competitors:</span> {rpiSheet.competitorBrands?.join(', ')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      {isProcessed && concatenatedData && (
        <Card>
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
            <p className="text-sm text-muted-foreground">
              Actual data from the concatenated dataset (scrollable - up to 100 rows and first 10 columns)
            </p>
          </CardHeader>
          <CardContent>
            <DataPreviewTable 
              previewColumns={previewColumns}
              concatenatedData={concatenatedData}
            />
            
            {/* Column Categories with Target Variable and Filter Selection */}
            {columnCategories && (
              <>
                {/* Debug: ColumnCategorization props rendered successfully */}
                <ColumnCategorization
                  columnCategories={columnCategories}
                  selectedTargetVariable={selectedTargetVariable}
                  onTargetVariableSelect={handleTargetVariableSelection}
                  selectedFilters={selectedFilters}
                  onFilterSelect={handleFilterSelection}
                  brandCategories={brandCategories}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Brand Categorization - Shown after target variable selection */}
      {brandCategories && selectedTargetVariable && (
        <Card>
          <CardHeader>
            <CardTitle>Brand Categorization</CardTitle>
            <p className="text-sm text-muted-foreground">
              Organize brands for marketing mix modeling analysis
            </p>
          </CardHeader>
          <CardContent>
            <BrandCategorization
              brandCategories={brandCategories}
              onBrandCategoriesChange={handleBrandCategoriesChange}
            />
          </CardContent>
        </Card>
      )}

    </div>
  );
}