/**
 * ========================================
 * USE TARGET VARIABLE HOOK - DATA CONCATENATION MODULE
 * ========================================
 * 
 * Purpose: Custom hook for target variable selection and management
 * 
 * Description:
 * Encapsulates target variable selection logic, brand metadata creation,
 * and state persistence for the data concatenation step.
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  BrandCategories, 
  BrandMetadata, 
  ColumnCategories, 
  PreviewDataRow,
  ConcatenationState 
} from '../types';
import { 
  createBrandMetadata, 
  saveConcatenationState,
  createConcatenationState 
} from '../services';

interface UseTargetVariableParams {
  previewColumns: string[];
  columnCategories: ColumnCategories | null;
  concatenatedData: PreviewDataRow[] | null;
  originalFileName: string;
  concatenatedFileName: string;
  selectedSheets: Array<{ sheetName: string }>;
  totalRows: number;
  onAnalysisDataUpdate?: (data: any) => void;
}

interface UseTargetVariableResult {
  selectedTargetVariable: string | null;
  brandCategories: BrandCategories | null;
  setSelectedTargetVariable: (variable: string | null) => void;
  setBrandCategories: (categories: BrandCategories | null) => void;
  handleTargetVariableSelection: (columnName: string) => Promise<void>;
  handleBrandCategoriesChange: (categories: BrandCategories) => Promise<void>;
}

export function useTargetVariable({
  previewColumns,
  columnCategories,
  concatenatedData,
  originalFileName,
  concatenatedFileName,
  selectedSheets,
  totalRows,
  onAnalysisDataUpdate
}: UseTargetVariableParams): UseTargetVariableResult {
  const { toast } = useToast();
  
  const [selectedTargetVariable, setSelectedTargetVariable] = useState<string | null>(null);
  const [brandCategories, setBrandCategories] = useState<BrandCategories | null>(null);
  
  /**
   * Handle target variable selection
   */
  const handleTargetVariableSelection = useCallback(async (columnName: string) => {
    setSelectedTargetVariable(columnName);
    
    // Create brand metadata from target variable selection
    const brandMetadata = createBrandMetadata(
      columnName, 
      previewColumns, 
      columnCategories || undefined
    );
    
    // Update brand categories state
    setBrandCategories(brandMetadata.categories);
    
    console.log('🎯 Target variable selected:', {
      variable: columnName,
      ourBrand: brandMetadata.ourBrand,
      competitors: brandMetadata.categories.competitors,
      haloBrands: brandMetadata.categories.haloBrands
    });
    
    // Update analysis context if callback provided
    if (onAnalysisDataUpdate) {
      const updatedData = {
        targetVariable: columnName,
        brandMetadata,
        targetVariableMetadata: {
          selectedAt: new Date().toISOString(),
          category: 'Revenue',
          selectionStep: 'data-concatenation'
        }
      };
      
      onAnalysisDataUpdate(updatedData);
    }
    
    // Save updated state with target variable
    await saveStateWithTargetVariable(columnName, brandMetadata);
    
    toast({
      title: "Target Variable Selected",
      description: `${columnName} selected as target variable. Our Brand: ${brandMetadata.ourBrand}`,
    });
  }, [
    previewColumns, 
    columnCategories, 
    onAnalysisDataUpdate, 
    originalFileName, 
    concatenatedFileName, 
    selectedSheets, 
    concatenatedData, 
    totalRows, 
    toast
  ]);
  
  /**
   * Handle brand categories change
   */
  const handleBrandCategoriesChange = useCallback(async (categories: BrandCategories) => {
    setBrandCategories(categories);
    
    console.log('🏷️ Brand categories updated:', categories);
    
    // Create complete brand metadata
    const completeBrandMetadata: BrandMetadata = {
      targetVariable: selectedTargetVariable || '',
      ourBrand: categories.ourBrand,
      allBrands: [categories.ourBrand, ...categories.competitors, ...categories.haloBrands],
      categories,
      extractedAt: new Date().toISOString()
    };
    
    // Update analysis context if callback provided
    if (onAnalysisDataUpdate) {
      const updatedData = {
        brandMetadata: completeBrandMetadata
      };
      
      onAnalysisDataUpdate(updatedData);
    }
    
    // Save updated state with brand categories
    await saveStateWithBrandCategories(completeBrandMetadata);
    
    toast({
      title: "Brand Categories Updated",
      description: `Updated brand categorization: ${categories.competitors.length} competitors, ${categories.haloBrands.length} halo brands`,
    });
  }, [
    selectedTargetVariable, 
    onAnalysisDataUpdate, 
    originalFileName, 
    concatenatedFileName, 
    selectedSheets, 
    concatenatedData, 
    columnCategories, 
    totalRows, 
    toast
  ]);
  
  /**
   * Save state with target variable
   */
  const saveStateWithTargetVariable = async (columnName: string, brandMetadata: BrandMetadata) => {
    // CRITICAL FIX: Don't try to save state if file names are missing
    if (!originalFileName.trim() || !concatenatedFileName.trim()) {
      console.warn('⚠️ saveStateWithTargetVariable: Skipping save - missing file names', {
        originalFileName: !!originalFileName.trim(),
        concatenatedFileName: !!concatenatedFileName.trim()
      });
      return;
    }
    
    try {
      const stateToSave = createConcatenationState({
        originalFileName,
        concatenatedFileName,
        selectedSheets: selectedSheets.map(sheet => sheet.sheetName),
        targetVariable: columnName,
        brandMetadata,
        previewData: concatenatedData || [],
        columnCategories,
        totalRows
      });
      
      await saveConcatenationState(stateToSave);
      console.log('✅ Updated state saved with target variable');
    } catch (error) {
      console.error('❌ Failed to save updated state:', error);
    }
  };
  
  /**
   * Save state with brand categories
   */
  const saveStateWithBrandCategories = async (brandMetadata: BrandMetadata) => {
    // CRITICAL FIX: Don't try to save state if file names are missing
    if (!originalFileName.trim() || !concatenatedFileName.trim()) {
      console.warn('⚠️ saveStateWithBrandCategories: Skipping save - missing file names', {
        originalFileName: !!originalFileName.trim(),
        concatenatedFileName: !!concatenatedFileName.trim()
      });
      return;
    }
    
    try {
      const stateToSave = createConcatenationState({
        originalFileName,
        concatenatedFileName,
        selectedSheets: selectedSheets.map(sheet => sheet.sheetName),
        targetVariable: selectedTargetVariable || '',
        brandMetadata,
        previewData: concatenatedData || [],
        columnCategories,
        totalRows
      });
      
      await saveConcatenationState(stateToSave);
      console.log('✅ Updated state saved with brand categories');
    } catch (error) {
      console.error('❌ Failed to save updated state:', error);
    }
  };
  
  return {
    selectedTargetVariable,
    brandCategories,
    setSelectedTargetVariable,
    setBrandCategories,
    handleTargetVariableSelection,
    handleBrandCategoriesChange
  };
}
