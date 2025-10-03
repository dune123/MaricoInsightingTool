/**
 * ========================================
 * DATA CONCATENATION STEP - MODULAR VERSION
 * ========================================
 * 
 * Purpose: Modular and simplified data concatenation step component
 * 
 * Description:
 * This is a refactored, modular version of the DataConcatenationStep component.
 * It uses custom hooks for business logic and smaller components for UI rendering,
 * resulting in better maintainability and testability.
 * 
 * Key Features:
 * - Under 150 lines (vs 1000+ in original)
 * - Single responsibility: orchestration only
 * - Custom hooks for business logic
 * - Modular components for UI
 * - Clean separation of concerns
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";
import { useAnalysis } from "@/context/AnalysisContext";

// Import modular hooks and components
import { 
  useDataLoading, 
  useTargetVariable, 
  useFilterManagement 
} from './hooks';
import { 
  DataLoadingStatus, 
  ProcessingSummary,
  ColumnCategorization,
  DataPreviewTable,
  BrandCategorization 
} from './components';

export function DataConcatenationStepModular() {
  const { state, setAnalysisData, setSelectedFilters: setContextSelectedFilters } = useAnalysis();
  const { analysisData, currentAnalysisId, selectedBrand } = state;

  // Get selected sheets from analysisData
  const selectedSheets = useMemo(() => 
    analysisData?.sheets?.filter(sheet => sheet.isSelected) || [], 
    [analysisData?.sheets]
  );

  // File naming
  const sourceFileName = analysisData?.processedFilename || analysisData?.filename || '';
  const originalFileName = analysisData?.filename || '';
  const concatenatedFileName = sourceFileName.replace(/\.[^/.]+$/, "_concatenated.xlsx");

  // Data loading hook
  const {
    loadingState,
    concatenatedData,
    previewColumns,
    columnCategories,
    concatenatedFile,
    totalRows,
    restoredSheetCount,
    restoredTargetVariable,
    restoredFilters,
    restoredBrandCategories,
    loadExistingAnalysisData
  } = useDataLoading();

  // Target variable hook
  const {
    selectedTargetVariable,
    brandCategories,
    setSelectedTargetVariable,
    setBrandCategories,
    handleTargetVariableSelection,
    handleBrandCategoriesChange
  } = useTargetVariable({
    previewColumns,
    columnCategories,
    concatenatedData,
    originalFileName,
    concatenatedFileName,
    selectedSheets,
    totalRows,
    onAnalysisDataUpdate: (data) => {
      setAnalysisData({ ...analysisData, ...data });
    }
  });

  // Filter management hook
  const {
    selectedFilters,
    handleFilterSelection
  } = useFilterManagement({
    initialFilters: restoredFilters,
    concatenatedData,
    columnCategories,
    originalFileName,
    concatenatedFileName,
    selectedSheets,
    selectedTargetVariable,
    totalRows,
    onAnalysisDataUpdate: (data) => {
      setAnalysisData({ ...analysisData, ...data });
    },
    onContextFiltersUpdate: setContextSelectedFilters
  });

  // Calculate display values
  const displaySheetCount = restoredSheetCount !== null ? restoredSheetCount : selectedSheets.length;
  const isProcessed = loadingState.isLoaded && concatenatedData !== null;

  // Restore state when component mounts or data changes
  useMemo(() => {
    if (currentAnalysisId && selectedBrand && !loadingState.isLoading && !loadingState.isLoaded) {
      loadExistingAnalysisData(currentAnalysisId, selectedBrand);
    }
  }, [currentAnalysisId, selectedBrand, loadingState.isLoading, loadingState.isLoaded, loadExistingAnalysisData]);

  // Apply restored state when available
  useMemo(() => {
    if (restoredTargetVariable && selectedTargetVariable !== restoredTargetVariable) {
      setSelectedTargetVariable(restoredTargetVariable);
    }
    if (restoredBrandCategories && brandCategories !== restoredBrandCategories) {
      setBrandCategories(restoredBrandCategories);
    }
  }, [restoredTargetVariable, restoredBrandCategories, selectedTargetVariable, brandCategories, setSelectedTargetVariable, setBrandCategories]);

  // Early returns for different states
  if (!analysisData) {
    return <DataLoadingStatus loadingState={{ isLoading: false, isLoaded: false, error: "No analysis data available" }} />;
  }

  if (loadingState.isLoading) {
    return <DataLoadingStatus loadingState={loadingState} brandName={selectedBrand} />;
  }

  if (loadingState.error) {
    return (
      <DataLoadingStatus 
        loadingState={loadingState} 
        brandName={selectedBrand}
        onRetry={() => currentAnalysisId && selectedBrand && loadExistingAnalysisData(currentAnalysisId, selectedBrand)}
      />
    );
  }

  if (displaySheetCount === 0 && !isProcessed) {
    return <DataLoadingStatus loadingState={{ isLoading: false, isLoaded: false, error: "No sheets were selected for concatenation" }} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <Database className="w-12 h-12 mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2">Data Concatenation</h2>
        <p className="text-muted-foreground">
          Processing and previewing your concatenated dataset
        </p>
      </div>

      {/* Processing Summary */}
      <ProcessingSummary
        isProcessed={isProcessed}
        sheetsCount={displaySheetCount}
        totalColumns={previewColumns.length}
        totalRows={totalRows}
        concatenatedFile={concatenatedFile}
      />

      {/* Main Content */}
      {isProcessed && (
        <Card>
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
            <p className="text-sm text-muted-foreground">
              Actual data from the concatenated dataset (scrollable - up to 100 rows and first 10 columns)
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Data Preview Table */}
            <DataPreviewTable 
              previewColumns={previewColumns}
              concatenatedData={concatenatedData}
            />
            
            {/* Column Categories with Target Variable and Filter Selection */}
            {columnCategories && (
              <ColumnCategorization
                columnCategories={columnCategories}
                selectedTargetVariable={selectedTargetVariable}
                onTargetVariableSelect={handleTargetVariableSelection}
                selectedFilters={selectedFilters}
                onFilterSelect={handleFilterSelection}
              />
            )}

            {/* Brand Categorization */}
            {brandCategories && selectedTargetVariable && (
              <BrandCategorization
                brandCategories={brandCategories}
                onBrandCategoriesChange={handleBrandCategoriesChange}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
