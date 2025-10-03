/**
 * ========================================
 * NON-MMM DATA SUMMARY STEP
 * ========================================
 * 
 * Purpose: Data summary page showing statistical summary, histograms, and correlation matrix
 * 
 * Description:
 * This component provides a step-by-step data summary workflow:
 * 1. Target Variable Selection - Choose the dependent variable
 * 2. Statistical Summary - Review and modify data types and statistics
 * 3. Data Distribution - View histograms showing data patterns
 * 4. Correlation Matrix - Analyze variable relationships and multicollinearity
 * 
 * Key Features:
 * - Progressive step-by-step reveal system
 * - Interactive step navigation with progress indicator
 * - Variable deletion functionality across all stages
 * - Statistical summary table with data type controls
 * - Variable distribution histograms (4 per row layout)
 * - Correlation matrix visualization with multicollinearity warnings
 * - Smooth transitions between steps
 * - Bulk variable deletion with confirmation
 * - Target variable protection during deletion
 * - Continue to next step functionality
 * 
 * Dependencies:
 * - Python backend for data processing and statistics
 * - Chart.js or similar for histogram generation
 * - Correlation matrix calculation and visualization
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 * Fixed: JSX syntax error in correlation matrix section
 * Enhanced: Added step-by-step reveal system with smooth transitions
 * Enhanced: Added comprehensive variable deletion functionality across all stages
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, BarChart3, TrendingUp, Grid3X3, Calculator, AlertCircle, Target, CheckCircle, ArrowRight, Trash2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAnalysis } from '@/context/AnalysisContext';
import { NonMMMFileService } from '@/analysis/nonmmm/services/NonMMMFileService';
import { nonMMMStateService, NonMMMStateService } from '@/analysis/nonmmm/services/NonMMMStateService';
import { formatHistogramBinLabel, formatNumberForDisplay, formatPercentage } from '@/utils/numberFormatter';

// Mock data interfaces for development
interface VariableSummary {
  name: string;
  type: 'numeric' | 'datetime' | 'percentage' | 'character';
  count: number;
  mean?: number;
  median?: number;
  mode?: string | number;
  min?: number;
  max?: number;
  stdDev?: number;
  variance?: number;
  skewness?: number;
  kurtosis?: number;
  nullCount: number;
  uniqueCount: number;
}

interface HistogramData {
  variableName: string;
  bins: number[];
  counts: number[];
  binCount?: number; // Number of bins used
  chartData: Record<string, unknown>; // Chart.js format
}

interface CorrelationMatrix {
  variables: string[];
  correlations: number[][];
}

export function NonMMMDataSummaryStep() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state } = useAnalysis();
  
  // Get analysis ID from NonMMM state (primary source of truth)
  const [nonmmmState, setNonmmmState] = useState<Record<string, unknown> | null>(null);
  const stepData = nonmmmState?.stepData as Record<string, unknown> || {};
  const currentAnalysisId = nonmmmState?.analysisId as string || stepData?.analysisId as string || state.currentAnalysisId;
  const brandName = nonmmmState?.brandName as string || stepData?.brandName as string || state.selectedBrand;
  const filename = nonmmmState?.uploadedFile as string || stepData?.uploadedFile as string || '';
  
  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<VariableSummary[]>([]);
  const [histogramData, setHistogramData] = useState<HistogramData[]>([]);
  const [correlationMatrix, setCorrelationMatrix] = useState<CorrelationMatrix | null>(null);
  const [selectedSheets, setSelectedSheets] = useState<unknown[]>([]);
  const [targetVariable, setTargetVariable] = useState<string>('');
  const [expectedSigns, setExpectedSigns] = useState<Record<string, 'positive' | 'negative' | 'neutral'>>({});
  const [selectedTargetVariable, setSelectedTargetVariable] = useState<string>('');
  const [isTargetVariableSelected, setIsTargetVariableSelected] = useState<boolean>(false);
  const [isExpectedSignsConfigured, setIsExpectedSignsConfigured] = useState<boolean>(false);

  // Step reveal state management
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Delete functionality state
  const [isDeleteMode, setIsDeleteMode] = useState<boolean>(false);
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set());
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  // Step configuration
  const steps = [
    { id: 1, title: 'Target Variable Selection', description: 'Select the variable you want to predict or analyze' },
    { id: 2, title: 'Statistical Summary', description: 'Review statistical measures and modify data types' },
    { id: 3, title: 'Data Distribution', description: 'View histograms showing data distribution patterns' },
    { id: 4, title: 'Correlation Matrix', description: 'Analyze variable relationships and multicollinearity' }
  ];

  // Load NonMMM state on mount
  useEffect(() => {
    const loadState = async () => {
      const state = await NonMMMStateService.getNonMMMState();
      setNonmmmState(state);
      
      // Load existing target variable and expected signs if available
      if (state) {
        const existingTargetVariable = state.targetVariable as string;
        const existingExpectedSigns = state.expectedSigns as Record<string, 'positive' | 'negative' | 'neutral'>;
        
        if (existingTargetVariable) {
          setTargetVariable(existingTargetVariable);
          setSelectedTargetVariable(existingTargetVariable);
          setIsTargetVariableSelected(true);
        }
        
        if (existingExpectedSigns && Object.keys(existingExpectedSigns).length > 0) {
          setExpectedSigns(existingExpectedSigns);
          setIsExpectedSignsConfigured(true);
        }
      }
    };
    loadState();
  }, []);

  // Update expected signs configuration status when expectedSigns changes
  useEffect(() => {
    if (Object.keys(expectedSigns).length > 0) {
      setIsExpectedSignsConfigured(true);
    } else {
      setIsExpectedSignsConfigured(false);
    }
  }, [expectedSigns]);
  
  const [histogramBins, setHistogramBins] = useState<number>(10);
  const [histogramStrategy, setHistogramStrategy] = useState<'auto' | 'manual'>('auto');
  
  // Checkbox state for bulk operations
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isSelectAll, setIsSelectAll] = useState<boolean>(false);

  // Step navigation functions
  const handleNextStep = async () => {
    if (currentStep < steps.length) {
      setIsTransitioning(true);
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      
      // Small delay for smooth transition
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleStepClick = (stepId: number) => {
    if (completedSteps.has(stepId - 1) || stepId === 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(stepId);
        setIsTransitioning(false);
      }, 300);
    }
  };

  // Delete functionality handlers
  const handleToggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    if (isDeleteMode) {
      setSelectedForDeletion(new Set());
    }
  };

  const handleVariableSelectForDeletion = (variableName: string) => {
    if (!isDeleteMode) return;
    
    // Prevent deletion of target variable
    if (variableName === selectedTargetVariable) {
      toast({
        title: "Cannot Delete Target Variable",
        description: "Can't delete Target Variable. Please select a different target variable first.",
        variant: "destructive"
      });
      return;
    }

    setSelectedForDeletion(prev => {
      const newSet = new Set(prev);
      if (newSet.has(variableName)) {
        newSet.delete(variableName);
      } else {
        newSet.add(variableName);
      }
      return newSet;
    });
  };

  const handleConfirmDelete = async () => {
    if (selectedForDeletion.size === 0) return;

    setIsDeleting(true);
    try {
      const variablesToDelete = Array.from(selectedForDeletion);
      
      // Call backend to delete variables
      const deletePromises = variablesToDelete.map(variableName => 
        NonMMMFileService.deleteVariable(filename, variableName, state.selectedBrand)
      );
      
      const results = await Promise.all(deletePromises);
      const allSuccessful = results.every(result => result && result.success);
      
      if (allSuccessful) {
        // Update local state
        setSummaryData(prev => prev.filter(variable => !selectedForDeletion.has(variable.name)));
        
        // Remove from expected signs
        setExpectedSigns(prev => {
          const newExpectedSigns = { ...prev };
          variablesToDelete.forEach(variableName => {
            delete newExpectedSigns[variableName];
          });
          return newExpectedSigns;
        });

        // Clear histogram and correlation data to force refresh
        setHistogramData([]);
        setCorrelationMatrix(null);

        // Save updated state
        const currentState = await NonMMMStateService.getNonMMMState() || {};
        await NonMMMStateService.saveNonMMMState({
          ...currentState,
          expectedSigns: expectedSigns,
          lastUpdated: new Date().toISOString()
        });

        // Reload data to ensure consistency
        await loadDataSummary(true);

        toast({
          title: "Variables Deleted Successfully",
          description: `${variablesToDelete.length} variable(s) have been deleted from the data file.`,
        });

        // Exit delete mode
        setIsDeleteMode(false);
        setSelectedForDeletion(new Set());
        setShowDeleteConfirmation(false);
      } else {
        throw new Error('Some deletion operations failed');
      }
    } catch (error) {
      console.error('❌ Error deleting variables:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete selected variables. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
    setSelectedForDeletion(new Set());
    setIsDeleteMode(false);
  };

  const handleDeleteSelected = () => {
    if (selectedForDeletion.size > 0) {
      setShowDeleteConfirmation(true);
    } else {
      toast({
        title: "No Variables Selected",
        description: "Please select variables to delete first.",
        variant: "destructive"
      });
    }
  };

  // Target variable selection handlers
  const handleTargetVariableSelect = (variableName: string) => {
    setSelectedTargetVariable(variableName);
    setTargetVariable(variableName);
    setIsTargetVariableSelected(true);
    
    // Initialize expected signs for all other variables if not already set
    const otherVariables = summaryData.filter(v => v.name !== variableName);
    const newExpectedSigns = { ...expectedSigns };
    
    otherVariables.forEach(variable => {
      if (!newExpectedSigns[variable.name]) {
        newExpectedSigns[variable.name] = 'neutral';
      }
    });
    
    setExpectedSigns(newExpectedSigns);
    
    // Show success message
    toast({
      title: "Target Variable Selected",
      description: `${variableName} is now your target variable. Click 'Continue' to proceed.`,
    });
  };

  // Expected signs handlers
  const toggleExpectedSign = (variableName: string) => {
    const currentSign = expectedSigns[variableName] || 'neutral';
    const signOrder = ['positive', 'negative', 'neutral'];
    const currentIndex = signOrder.indexOf(currentSign);
    const nextIndex = (currentIndex + 1) % signOrder.length;
    const newSign = signOrder[nextIndex] as 'positive' | 'negative' | 'neutral';
    
    setExpectedSigns(prev => ({
      ...prev,
      [variableName]: newSign
    }));
  };

  const getSignDisplay = (sign: 'positive' | 'negative' | 'neutral') => {
    switch (sign) {
      case 'positive':
        return { icon: '↗', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
      case 'negative':
        return { icon: '↘', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
      default:
        return { icon: '→', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
    }
  };

  // Continue to next step handler
  const handleContinue = async () => {
    if (!isTargetVariableSelected) {
      toast({
        title: "Target Variable Required",
        description: "Please select a target variable before continuing.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Save target variable and expected signs to state
      const nonmmmGlobalState = {
        ...nonmmmState,
        targetVariable: selectedTargetVariable,
        expectedSigns: expectedSigns,
        dataSummaryCompleted: true,
        currentStep: 4, // Next step is chart analysis
        uploadedFile: filename, // Ensure filename is included (use same field name as data upload step)
        brandName: brandName, // Ensure brand is included (use same field name as data upload step)
        analysisId: currentAnalysisId, // Ensure analysis ID is included
      };

      await NonMMMStateService.saveNonMMMState(nonmmmGlobalState);

      toast({
        title: "Configuration Saved",
        description: "Target variable and expected signs have been configured successfully.",
      });

      // Navigate to chart analysis step
      navigate('/nonmmm/charts');
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Bulk operation states
  const [bulkExpectedSign, setBulkExpectedSign] = useState<'positive' | 'negative' | 'neutral' | null>(null);
  const [showBulkActions, setShowBulkActions] = useState<boolean>(false);
  
  // Correlation matrix variable selection state
  const [selectedCorrelationVariables, setSelectedCorrelationVariables] = useState<Set<string>>(new Set());
  const [isCorrelationSelectAll, setIsCorrelationSelectAll] = useState<boolean>(false);

  // Define histogram and correlation loading functions first
  const loadHistogramData = useCallback(async (variables: VariableSummary[]) => {
    try {
      console.log('🔄 Loading histogram data...');
      
      if (!filename) {
        console.log('⚠️ No filename available for histogram loading');
        return;
      }

      // Use intelligent binning if auto strategy is selected
      const binsToUse = histogramStrategy === 'auto' ? 'auto' : histogramBins;
      const response = await NonMMMFileService.getHistograms(filename, state.selectedBrand || 'Unknown', binsToUse);
      
      if (response && response.success && response.data && (response.data as { histograms?: HistogramData[] }).histograms) {
        setHistogramData((response.data as { histograms: HistogramData[] }).histograms);
        console.log(`✅ Loaded ${(response.data as { histograms: HistogramData[] }).histograms.length} histograms`);
      }
    } catch (error) {
      console.error('❌ Error loading histogram data:', error);
      // Don't show toast for histogram errors as they're not critical
    }
  }, [filename, state.selectedBrand, histogramStrategy, histogramBins]);

  const loadCorrelationMatrix = useCallback(async (selectedVars?: string[]) => {
    try {
      console.log('🔄 Loading correlation matrix...');
      
      if (!filename) {
        console.log('⚠️ No filename available for correlation matrix loading');
        return;
      }
      
      const response = await NonMMMFileService.getCorrelationMatrix(filename, state.selectedBrand || 'Unknown', 'pearson', selectedVars);
      
      if (response && response.success && response.data && (response.data as { correlationMatrix?: CorrelationMatrix }).correlationMatrix) {
        setCorrelationMatrix((response.data as { correlationMatrix: CorrelationMatrix }).correlationMatrix);
        console.log('✅ Correlation matrix loaded successfully');
      }
    } catch (error) {
      console.error('❌ Error loading correlation matrix:', error);
      // Don't show toast for correlation matrix errors as they're not critical
    }
  }, [filename, state.selectedBrand]);

  // Handle correlation variable selection
  const handleCorrelationVariableToggle = useCallback((variable: string) => {
    setSelectedCorrelationVariables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(variable)) {
        newSet.delete(variable);
      } else {
        newSet.add(variable);
      }
      return newSet;
    });
  }, []);

  // Save correlation variable selection to state
  const saveCorrelationVariableSelection = useCallback(async (selectedVars: string[]) => {
    try {
      const currentState = await NonMMMStateService.getNonMMMState() || {};
      await NonMMMStateService.saveNonMMMState({
        ...currentState,
        correlationMatrixVariables: selectedVars,
        lastUpdated: new Date().toISOString()
      });
      console.log('✅ Saved correlation matrix variable selection:', selectedVars);
    } catch (error) {
      console.error('❌ Error saving correlation variable selection:', error);
    }
  }, []);

  const handleCorrelationSelectAll = useCallback(() => {
    if (isCorrelationSelectAll) {
      setSelectedCorrelationVariables(new Set());
      setIsCorrelationSelectAll(false);
    } else {
      // Get all numeric variables from summary data
      const numericVariables = summaryData
        .filter(variable => variable.type === 'numeric')
        .map(variable => variable.name);
      setSelectedCorrelationVariables(new Set(numericVariables));
      setIsCorrelationSelectAll(true);
    }
  }, [isCorrelationSelectAll, summaryData]);

  // Update correlation matrix when selected variables change
  useEffect(() => {
    if (selectedCorrelationVariables.size > 0) {
      const selectedVarsArray = Array.from(selectedCorrelationVariables);
      loadCorrelationMatrix(selectedVarsArray);
      
      // Save correlation variable selection to state
      saveCorrelationVariableSelection(selectedVarsArray);
    } else if (summaryData.length > 0) {
      // If no variables selected, load with all numeric variables
      const numericVariables = summaryData
        .filter(variable => variable.type === 'numeric')
        .map(variable => variable.name);
      if (numericVariables.length > 0) {
        setSelectedCorrelationVariables(new Set(numericVariables));
        setIsCorrelationSelectAll(true);
        loadCorrelationMatrix(numericVariables);
        saveCorrelationVariableSelection(numericVariables);
      }
    }
  }, [selectedCorrelationVariables, summaryData, loadCorrelationMatrix, saveCorrelationVariableSelection]);

  // Load saved correlation variable selection from state
  const loadSavedCorrelationVariableSelection = useCallback(async (variablesData: VariableSummary[]) => {
    try {
      const savedState = await NonMMMStateService.getNonMMMState();
      if (savedState && savedState.correlationMatrixVariables && Array.isArray(savedState.correlationMatrixVariables)) {
        const savedVars = savedState.correlationMatrixVariables as string[];
        const numericVariables = variablesData
          .filter(variable => variable.type === 'numeric')
          .map(variable => variable.name);
        
        // Only use saved variables that are still available in the current data
        const validSavedVars = savedVars.filter(varName => numericVariables.includes(varName));
        
        if (validSavedVars.length > 0) {
          setSelectedCorrelationVariables(new Set(validSavedVars));
          setIsCorrelationSelectAll(validSavedVars.length === numericVariables.length);
          await loadCorrelationMatrix(validSavedVars);
          console.log('✅ Loaded saved correlation variable selection:', validSavedVars);
          return;
        }
      }
      
      // If no saved selection or invalid saved selection, use all numeric variables
      const numericVariables = variablesData
        .filter(variable => variable.type === 'numeric')
        .map(variable => variable.name);
      
      if (numericVariables.length > 0) {
        setSelectedCorrelationVariables(new Set(numericVariables));
        setIsCorrelationSelectAll(true);
        await loadCorrelationMatrix(numericVariables);
        console.log('✅ Using all numeric variables for correlation matrix');
      }
    } catch (error) {
      console.error('❌ Error loading saved correlation variable selection:', error);
      // Fallback to all numeric variables
      const numericVariables = variablesData
        .filter(variable => variable.type === 'numeric')
        .map(variable => variable.name);
      
      if (numericVariables.length > 0) {
        setSelectedCorrelationVariables(new Set(numericVariables));
        setIsCorrelationSelectAll(true);
        await loadCorrelationMatrix(numericVariables);
      }
    }
  }, [loadCorrelationMatrix]);

  const loadDataSummary = useCallback(async (forceRefresh: boolean = false) => {
    if (!filename || !selectedSheets) {
      console.log('ℹ️ No filename or selected sheets found');
      return;
    }

    try {
      console.log('🔄 Loading data summary from backend...');
      
      // Get the current analysis ID from context
      const currentAnalysisId = state.currentAnalysisId;
      if (!currentAnalysisId) {
        throw new Error('No current analysis ID found');
      }

      // Use the caching service to get data summary
      const summaryData = await NonMMMFileService.getDataSummaryWithCaching(
        currentAnalysisId,
        filename,
        state.selectedBrand || 'Unknown',
        forceRefresh
      );

      console.log('📊 Summary response:', summaryData);

      if (summaryData && summaryData.variables) {
        // Extract the variables array from the nested response structure
        const variablesData = summaryData.variables;
        setSummaryData(variablesData);
        setIsLoading(false);
        console.log('✅ Data summary loaded successfully');
        
        // Load histogram data for numeric variables
        await loadHistogramData(variablesData);
        
        // Load saved correlation variable selection
        await loadSavedCorrelationVariableSelection(variablesData);
      } else {
        throw new Error('Invalid data summary response from backend');
      }
    } catch (error) {
      console.error('❌ Error loading data summary:', error);
      toast({
        title: "Error Loading Data",
        description: error instanceof Error ? error.message : "Failed to load data summary. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  }, [filename, selectedSheets, state.currentAnalysisId, state.selectedBrand, toast, loadHistogramData, loadSavedCorrelationVariableSelection]);

  // Load data summary on component mount
  useEffect(() => {
    if (filename && selectedSheets) {
      loadDataSummary();
    }
  }, [filename, selectedSheets, loadDataSummary]); // Add dependencies to reload when these change

  // Debug logging for analysis context
  useEffect(() => {
    console.log('🔍 Analysis Context State:', {
      currentAnalysisId: state.currentAnalysisId,
      selectedBrand: state.selectedBrand,
      analysisData: state.analysisData,
      filename,
      selectedSheets,
      targetVariable
    });
  }, [state.currentAnalysisId, state.selectedBrand, state.analysisData, filename, selectedSheets, targetVariable]);

  // Load Non-MMM state first
  useEffect(() => {
    const loadState = async () => {
      const state = await NonMMMStateService.getNonMMMState();
      console.log('🔍 Data Summary - NonMMM State:', state);
      setNonmmmState(state);
    };
    loadState();
  }, []);

  // Load filename from NonMMM state and selectedSheets from analysis context
  useEffect(() => {
    console.log('🔄 Loading data from NonMMM state and analysis context:', { nonmmmState, analysisData: state.analysisData });
    
    if (nonmmmState) {
      const nonmmmFilename = nonmmmState.uploadedFile as string || '';
      const nonmmmTargetVariable = nonmmmState.targetVariable as string || '';
      const nonmmmExpectedSigns = (nonmmmState.expectedSigns as Record<string, 'positive' | 'negative' | 'neutral'>) || {};
      
      console.log('📁 Setting local state from NonMMM state:', { 
        nonmmmFilename, 
        nonmmmTargetVariable, 
        nonmmmExpectedSigns 
      });
      
      setTargetVariable(nonmmmTargetVariable);
      setExpectedSigns(nonmmmExpectedSigns);
    }
    
    // Still get selectedSheets from global context as it's not in NonMMM state
    if (state.analysisData) {
      const newSelectedSheets = state.analysisData.sheets?.filter(sheet => sheet.isSelected).map(sheet => sheet.sheetName) || [];
      setSelectedSheets(newSelectedSheets);
    } else {
      console.log('⚠️ No analysis data in context');
    }
  }, [nonmmmState, state.analysisData]);



  // Checkbox handling functions for bulk datatype editing
  const handleRowSelection = (variableName: string, isSelected: boolean) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(variableName);
      } else {
        newSet.delete(variableName);
      }
      setShowBulkActions(newSet.size > 0);
      return newSet;
    });
  };

  const handleSelectAll = (isSelected: boolean) => {
    setIsSelectAll(isSelected);
    if (isSelected) {
      const allVariableNames = summaryData.map(variable => variable.name);
      setSelectedRows(new Set(allVariableNames));
      setShowBulkActions(true);
    } else {
      setSelectedRows(new Set());
      setShowBulkActions(false);
    }
  };

  const handleBulkTypeChange = async (newType: string) => {
    if (selectedRows.size === 0) {
      toast({
        title: "No rows selected",
        description: "Please select at least one row to change the datatype.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const selectedVariableNames = Array.from(selectedRows);
      
      console.log(`🔄 Bulk changing ${selectedVariableNames.length} variables to ${newType}...`);
      
      // Process each selected variable
      const promises = selectedVariableNames.map(variableName => 
        NonMMMFileService.modifyColumnType(filename, variableName, state.selectedBrand, newType)
      );
      
      const responses = await Promise.all(promises);
      
      // Check if all operations were successful
      const allSuccessful = responses.every(response => response && response.success);
      
      if (allSuccessful) {
        // Update local state for all selected variables
        setSummaryData(prev => 
          prev.map(item => 
            selectedRows.has(item.name)
              ? { ...item, type: newType as 'numeric' | 'datetime' | 'percentage' | 'character' }
              : item
          )
        );

        // Save state after bulk changes
        if (currentAnalysisId) {
          await nonMMMStateService.saveStepState(
            currentAnalysisId,
            4, // Data summary step
            1, // Substep 1 (column type modification)
            {
              type: 'data_summary',
              filename,
              summaryData: summaryData.map(item => 
                selectedRows.has(item.name)
                  ? { ...item, type: newType as 'numeric' | 'datetime' | 'percentage' | 'character' }
                  : item
              ),
              histogramData,
              correlationMatrix,
              selectedSheets,
              targetVariable,
              expectedSigns,
              completedAt: new Date().toISOString()
            },
            {
              bulkOperation: true,
              variablesModified: selectedVariableNames,
              newType,
              totalVariables: summaryData.length,
              modifiedCount: selectedVariableNames.length
            }
          );
        }

        toast({
          title: "Bulk datatype change successful",
          description: `Successfully changed ${selectedVariableNames.length} variables to ${newType}.`,
        });

        // Clear selection after successful operation
        setSelectedRows(new Set());
        setIsSelectAll(false);
        setShowBulkActions(false);
        
        // Reload data to ensure consistency
        console.log('🔄 Reloading data after bulk changes...');
        // Force refresh to get updated column types from backend
        await loadDataSummary(true);
        console.log('✅ Data reloaded after bulk changes');
      } else {
        throw new Error('Some operations failed');
      }
    } catch (error) {
      console.error('❌ Error in bulk type change:', error);
      toast({
        title: "Bulk datatype change failed",
        description: "Failed to change datatypes for selected variables. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkExpectedSignChange = async (newSign: 'positive' | 'negative' | 'neutral') => {
    if (selectedRows.size === 0) {
      toast({
        title: "No rows selected",
        description: "Please select at least one row to change the expected sign.",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedVariableNames = Array.from(selectedRows);
      
      console.log(`🔄 Bulk changing expected signs for ${selectedVariableNames.length} variables to ${newSign}...`);
      
      // Update local state for all selected variables
      setExpectedSigns(prev => {
        const newExpectedSigns = { ...prev };
        selectedVariableNames.forEach(variableName => {
          newExpectedSigns[variableName] = newSign;
        });
        return newExpectedSigns;
      });

      // Save state after bulk changes
      if (currentAnalysisId) {
        const updatedExpectedSigns = { ...expectedSigns };
        selectedVariableNames.forEach(variableName => {
          updatedExpectedSigns[variableName] = newSign;
        });

        await nonMMMStateService.saveStepState(
          currentAnalysisId,
          4, // Data summary step
          1, // Substep 1 (expected sign modification)
          {
            type: 'data_summary',
            filename,
            summaryData,
            histogramData,
            correlationMatrix,
            selectedSheets,
            targetVariable,
            expectedSigns: updatedExpectedSigns,
            completedAt: new Date().toISOString()
          },
          {
            bulkOperation: true,
            operationType: 'expected_sign_change',
            variablesModified: selectedVariableNames,
            newExpectedSign: newSign,
            totalVariables: summaryData.length,
            modifiedCount: selectedVariableNames.length
          }
        );

        // Also save to global NonMMM state
        const currentState = await NonMMMStateService.getNonMMMState() || {};
        await NonMMMStateService.saveNonMMMState({
          ...currentState,
          expectedSigns: updatedExpectedSigns,
          lastUpdated: new Date().toISOString()
        });
      }

      toast({
        title: "Bulk expected sign change successful",
        description: `Successfully changed expected signs for ${selectedVariableNames.length} variables to ${newSign}.`,
      });

      // Clear selection after successful operation
      setSelectedRows(new Set());
      setIsSelectAll(false);
      setShowBulkActions(false);
      
    } catch (error) {
      console.error('❌ Error in bulk expected sign change:', error);
      toast({
        title: "Bulk expected sign change failed",
        description: "Failed to change expected signs for selected variables. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkVariableDeletion = async () => {
    if (selectedRows.size === 0) {
      toast({
        title: "No rows selected",
        description: "Please select at least one row to delete variables.",
        variant: "destructive",
      });
      return;
    }

    // Prevent deletion of target variable
    const targetVariableInSelection = Array.from(selectedRows).includes(targetVariable);
    if (targetVariableInSelection) {
      toast({
        title: "Cannot delete target variable",
        description: "The target variable cannot be deleted. Please deselect it first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const selectedVariableNames = Array.from(selectedRows);
      
      console.log(`🔄 Bulk deleting ${selectedVariableNames.length} variables...`);
      
      // Call backend to delete variables from the Excel file
      const promises = selectedVariableNames.map(variableName => 
        NonMMMFileService.deleteVariable(filename, variableName, state.selectedBrand)
      );
      
      const responses = await Promise.all(promises);
      
      // Check if all operations were successful
      const allSuccessful = responses.every(response => response && response.success);
      
      if (allSuccessful) {
        // Update local state by removing deleted variables
        setSummaryData(prev => 
          prev.filter(item => !selectedRows.has(item.name))
        );

        // Remove deleted variables from expected signs
        setExpectedSigns(prev => {
          const newExpectedSigns = { ...prev };
          selectedVariableNames.forEach(variableName => {
            delete newExpectedSigns[variableName];
          });
          return newExpectedSigns;
        });

        // Save state after bulk deletion
        if (currentAnalysisId) {
          const updatedSummaryData = summaryData.filter(item => !selectedRows.has(item.name));
          const updatedExpectedSigns = { ...expectedSigns };
          selectedVariableNames.forEach(variableName => {
            delete updatedExpectedSigns[variableName];
          });

          await nonMMMStateService.saveStepState(
            currentAnalysisId,
            4, // Data summary step
            1, // Substep 1 (variable deletion)
            {
              type: 'data_summary',
              filename,
              summaryData: updatedSummaryData,
              histogramData,
              correlationMatrix,
              selectedSheets,
              targetVariable,
              expectedSigns: updatedExpectedSigns,
              completedAt: new Date().toISOString()
            },
            {
              bulkOperation: true,
              operationType: 'variable_deletion',
              variablesDeleted: selectedVariableNames,
              totalVariables: summaryData.length,
              deletedCount: selectedVariableNames.length
            }
          );

          // Also save to global NonMMM state
          const currentState = await NonMMMStateService.getNonMMMState() || {};
          await NonMMMStateService.saveNonMMMState({
            ...currentState,
            expectedSigns: updatedExpectedSigns,
            lastUpdated: new Date().toISOString()
          });
        }

        toast({
          title: "Bulk variable deletion successful",
          description: `Successfully deleted ${selectedVariableNames.length} variables from the dataset.`,
        });

        // Clear selection after successful operation
        setSelectedRows(new Set());
        setIsSelectAll(false);
        setShowBulkActions(false);
        
        // Reload data to ensure consistency
        console.log('🔄 Reloading data after bulk deletion...');
        await loadDataSummary(true);
        console.log('✅ Data reloaded after bulk deletion');
      } else {
        throw new Error('Some deletion operations failed');
      }
    } catch (error) {
      console.error('❌ Error in bulk variable deletion:', error);
      toast({
        title: "Bulk variable deletion failed",
        description: "Failed to delete selected variables. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeChange = async (variableName: string, newType: string) => {
    try {
      if (!filename) {
        throw new Error('No filename available');
      }

      console.log(`🔄 Changing ${variableName} to ${newType}...`);
      
      // Call the Python backend to change column type
      const response = await NonMMMFileService.modifyColumnType(filename, variableName, state.selectedBrand, newType);
      
      if (response && response.success) {
        // Update local state
        setSummaryData(prev => 
          prev.map(item => 
            item.name === variableName 
              ? { ...item, type: newType as 'numeric' | 'datetime' | 'percentage' | 'character' }
              : item
          )
        );

        // Save state immediately after column type change
        if (currentAnalysisId) {
          try {
            await nonMMMStateService.saveStepState(
              currentAnalysisId,
              4, // Data summary step
              1, // Substep 1 (column type modification)
              {
                type: 'data_summary',
                filename,
                summaryData: summaryData.map(item => 
                  item.name === variableName 
                    ? { ...item, type: newType as 'numeric' | 'datetime' | 'percentage' | 'character' }
                    : item
                ),
                histogramData,
                correlationMatrix,
                selectedSheets,
                targetVariable,
                expectedSigns,
                completedAt: new Date().toISOString()
              },
              {
                variableModified: variableName,
                newType,
                totalVariables: summaryData.length,
                numericVariables: summaryData.filter(v => v.type === 'numeric').length,
                characterVariables: summaryData.filter(v => v.type === 'character').length,
                dateTimeVariables: summaryData.filter(v => v.type === 'datetime').length
              },
              'column_type_changed'
            );

            console.log(`✅ Column type change state saved for ${variableName}: ${newType}`);
          } catch (stateError) {
            console.error('❌ Error saving column type change state:', stateError);
            // Don't fail the operation if state save fails
          }
        }

        toast({
          title: "Type Changed Successfully",
          description: `${variableName} type changed to ${newType}`,
        });

        console.log('✅ Column type changed successfully');
        
        // Reload data to ensure consistency with backend
        console.log('🔄 Reloading data after individual column type change...');
        await loadDataSummary(true);
        console.log('✅ Data reloaded after individual column type change');
      } else {
        throw new Error('Backend returned unsuccessful response');
      }

    } catch (error) {
      console.error('❌ Error changing variable type:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update variable type",
        variant: "destructive"
      });
    }
  };

  const handleVariableClick = (variableName: string) => {
    setTargetVariable(variableName);
    
    // Generate expected signs for all other variables
    const otherVariables = summaryData.filter(v => v.name !== variableName && v.type === 'numeric');
    const newExpectedSigns: Record<string, 'positive' | 'negative' | 'neutral'> = {};
    
    otherVariables.forEach(variable => {
      newExpectedSigns[variable.name] = 'neutral'; // Default to neutral
    });
    
    setExpectedSigns(newExpectedSigns);
    
    toast({
      title: "Target Variable Selected",
      description: `${variableName} is now your target variable. Expected signs set for ${otherVariables.length} variables.`,
    });
  };

  const handleExpectedSignToggle = (variableName: string) => {
    setExpectedSigns(prev => {
      const currentSign = prev[variableName] || 'neutral';
      let newSign: 'positive' | 'negative' | 'neutral';
      
      if (currentSign === 'neutral') newSign = 'positive';
      else if (currentSign === 'positive') newSign = 'negative';
      else newSign = 'neutral';
      
      return { ...prev, [variableName]: newSign };
    });
  };

  const getExpectedSignColor = (sign: 'positive' | 'negative' | 'neutral') => {
    switch (sign) {
      case 'positive': return 'bg-secondary hover:bg-secondary/80';
      case 'negative': return 'bg-destructive hover:bg-destructive/80';
      case 'neutral': return 'bg-primary hover:bg-primary/80';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getExpectedSignText = (sign: 'positive' | 'negative' | 'neutral') => {
    switch (sign) {
      case 'positive': return '+';
      case 'negative': return '-';
      case 'neutral': return '~';
      default: return '?';
    }
  };


  // Show message if no data is available
  if (!filename || selectedSheets.length === 0) {
    return (
      <div className="w-full p-6 space-y-6">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-accent mx-auto" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">No Data Available</h2>
            <p className="text-gray-600 mt-2">
              {!filename ? 'No file has been uploaded yet.' : 
               'No sheets have been selected for analysis.'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Please go back to the data upload step and ensure you've uploaded a file and selected at least one sheet.
            </p>
            <Button 
              onClick={() => navigate('/nonmmm/upload')} 
              className="mt-4"
              variant="outline"
            >
              Go to Data Upload
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full p-6 space-y-6">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Loading Data Summary</h2>
            <p className="text-gray-600 mt-2">
              {!filename ? 'Waiting for file data...' : 
               !selectedSheets || selectedSheets.length === 0 ? 'Waiting for sheet selection...' :
               'Processing your data and generating summary statistics...'}
            </p>
            {filename && (
              <p className="text-sm text-gray-500 mt-1">
                File: {filename} | Sheets: {selectedSheets?.length || 0} selected
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full p-6 space-y-6 overflow-hidden">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Data Summary</h1>
        <p className="text-gray-600">
          Statistical overview of your dataset with type controls and distributions
        </p>
      </div>

      {/* Step Progress Indicator */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleStepClick(step.id)}
                    disabled={!completedSteps.has(step.id - 1) && step.id !== 1}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      currentStep === step.id
                        ? 'bg-primary text-white shadow-lg'
                        : completedSteps.has(step.id)
                        ? 'bg-green-500 text-white'
                        : step.id === 1
                        ? 'bg-primary/20 text-primary border-2 border-primary'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {completedSteps.has(step.id) ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      step.id
                    )}
                  </button>
                  <div className="mt-2 text-center">
                    <div className={`text-xs font-medium ${
                      currentStep === step.id ? 'text-primary' : 
                      completedSteps.has(step.id) ? 'text-green-600' : 
                      'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-400 max-w-24">
                      {step.description}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    completedSteps.has(step.id) ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Floating Delete Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {isDeleteMode ? (
          <>
            <Button
              onClick={handleDeleteSelected}
              variant="destructive"
              size="lg"
              disabled={selectedForDeletion.size === 0}
              className="shadow-lg"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Delete {selectedForDeletion.size} Selected
            </Button>
            <Button
              onClick={handleToggleDeleteMode}
              variant="outline"
              size="lg"
              className="shadow-lg bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
            >
              <X className="h-5 w-5 mr-2" />
              Cancel
            </Button>
          </>
        ) : (
          <Button
            onClick={handleToggleDeleteMode}
            variant="outline"
            size="lg"
            className="shadow-lg bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
          >
            <Trash2 className="h-5 w-5 mr-2" />
            Delete Variables
          </Button>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Variable Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedForDeletion.size} variable(s)? This action cannot be undone and will permanently remove the variables from your data file.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Variables to be deleted:</p>
              <div className="max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
                {Array.from(selectedForDeletion).map((variableName) => (
                  <div key={variableName} className="text-sm text-gray-600 py-1">
                    • {variableName}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete {selectedForDeletion.size} Variable(s)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Mode Indicator */}
      {isDeleteMode && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-center gap-2 text-red-700">
              <Trash2 className="h-5 w-5" />
              <span className="font-medium">Delete Mode Active</span>
              <span className="text-sm">- Click on variables to select them for deletion</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Content with Transition */}
      <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
        {/* Step 1: Target Variable Selection */}
        {currentStep === 1 && (
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Target Variable Selection
            </CardTitle>
            <CardDescription>
              Select the variable you want to predict or analyze as your target variable
            </CardDescription>
          </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto border rounded-lg p-2">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {summaryData.map((variable) => (
                <div
                  key={variable.name}
                  className={`p-2 border rounded cursor-pointer transition-all hover:shadow-sm ${
                    isDeleteMode && selectedForDeletion.has(variable.name)
                      ? 'border-red-500 bg-red-50'
                      : selectedTargetVariable === variable.name
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-primary/50'
                  }`}
                  onClick={() => {
                    if (isDeleteMode) {
                      handleVariableSelectForDeletion(variable.name);
                    } else {
                      handleTargetVariableSelect(variable.name);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs text-gray-900 truncate">
                        {variable.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {variable.type} • {variable.count}
                      </div>
                    </div>
                    {selectedTargetVariable === variable.name && (
                      <div className="p-1 rounded-full bg-primary/10 ml-1">
                        <CheckCircle className="h-3 w-3 text-primary" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {selectedTargetVariable && (
            <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-primary" />
                <div>
                  <div className="font-medium text-primary">
                    Target Variable Selected
                  </div>
                  <div className="text-sm text-muted-foreground">
                    "{selectedTargetVariable}" will be used as your dependent variable
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        </Card>
      )}

      {/* Step 1.5: Expected Signs Configuration (shown after target variable selection) */}
      {currentStep === 1 && isTargetVariableSelected && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Expected Signs Configuration
              <Badge variant="secondary" className="ml-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Optional
              </Badge>
            </CardTitle>
            <CardDescription>
              Set your expected relationship direction for each variable with the target variable
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {summaryData
                  .filter(variable => variable.name !== selectedTargetVariable)
                  .map((variable) => {
                    const currentSign = expectedSigns[variable.name] || 'neutral';
                    const signDisplay = getSignDisplay(currentSign);
                    
                    return (
                      <div
                        key={variable.name}
                        className={`p-2 border rounded cursor-pointer transition-all hover:shadow-sm ${
                          isDeleteMode && selectedForDeletion.has(variable.name)
                            ? 'border-red-500 bg-red-50'
                            : `${signDisplay.borderColor} ${signDisplay.bgColor}`
                        }`}
                        onClick={() => {
                          if (isDeleteMode) {
                            handleVariableSelectForDeletion(variable.name);
                          } else {
                            toggleExpectedSign(variable.name);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs text-gray-900 truncate">
                              {variable.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              Click to change
                            </div>
                          </div>
                          <div className={`p-1 rounded-full ${signDisplay.bgColor} ml-1`}>
                            <span className={`text-sm ${signDisplay.color}`}>
                              {signDisplay.icon}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {Object.keys(expectedSigns).length > 0 && (
                <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-primary" />
                    <div>
                      <div className="font-medium text-primary">
                        Expected Signs Configuration
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Configured {Object.keys(expectedSigns).length} variables. Click on any variable to change its expected sign.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Manual Continue Button for Step 1 */}
            {currentStep === 1 && isTargetVariableSelected && (
              <div className="mt-4 text-center">
                <Button 
                  onClick={handleNextStep}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Continue to Statistical Summary
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Statistical Summary Table */}
      {currentStep === 2 && (
        <Card className="max-w-full overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Statistical Summary
          </CardTitle>
          <CardDescription>
            Click on column types to modify data format. Statistical measures for each variable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Bulk Actions Section - Sticky */}
          {showBulkActions && selectedRows.size > 0 && (
            <div className="sticky top-12 z-10 mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">
                    {selectedRows.size} row{selectedRows.size > 1 ? 's' : ''} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRows(new Set());
                      setIsSelectAll(false);
                      setShowBulkActions(false);
                    }}
                  >
                    Clear Selection
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Bulk Data Type Change */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Change Data Type</label>
                    <div className="flex items-center gap-2">
                      <Select onValueChange={handleBulkTypeChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="numeric">Numeric</SelectItem>
                          <SelectItem value="datetime">Date</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="character">Character</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Bulk Expected Sign Change */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Set Expected Sign</label>
                    <div className="flex items-center gap-2">
                      <Select onValueChange={(value) => handleBulkExpectedSignChange(value as 'positive' | 'negative' | 'neutral')}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select sign" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="positive">Positive (+)</SelectItem>
                          <SelectItem value="negative">Negative (-)</SelectItem>
                          <SelectItem value="neutral">Neutral (~)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Bulk Variable Deletion */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Delete Variables</label>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkVariableDeletion}
                      className="w-full"
                      disabled={Array.from(selectedRows).includes(targetVariable)}
                    >
                      Delete Selected
                    </Button>
                    {Array.from(selectedRows).includes(targetVariable) && (
                      <p className="text-xs text-destructive">
                        Cannot delete target variable
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="overflow-x-auto max-w-full">
            <Table className="min-w-full">
              <TableHeader className="sticky top-0 z-10 bg-white shadow-sm">
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isSelectAll}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all rows"
                    />
                  </TableHead>
                  <TableHead>Variable</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Mean</TableHead>
                  <TableHead>Median</TableHead>
                  <TableHead>Std Dev</TableHead>
                  <TableHead>Min</TableHead>
                  <TableHead>Max</TableHead>
                  <TableHead>Null Count</TableHead>
                  <TableHead>Unique</TableHead>
                  <TableHead>Expected Sign</TableHead>
                  <TableHead>Significance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                                 {summaryData && summaryData.length > 0 ? (
                   summaryData.map((variable, index) => (
                     <TableRow key={index} className={`${
                       isDeleteMode && selectedForDeletion.has(variable.name)
                         ? 'bg-red-50 border-red-200'
                         : targetVariable === variable.name 
                         ? 'bg-accent/5 border-accent/20' 
                         : ''
                     }`}>
                       <TableCell>
                         <Checkbox
                           checked={selectedRows.has(variable.name)}
                           onCheckedChange={(checked) => handleRowSelection(variable.name, checked as boolean)}
                           aria-label={`Select ${variable.name}`}
                         />
                       </TableCell>
                       <TableCell className="font-medium">
                         <button
                           onClick={() => {
                             if (isDeleteMode) {
                               handleVariableSelectForDeletion(variable.name);
                             } else {
                               handleVariableClick(variable.name);
                             }
                           }}
                           className={`text-left hover:text-accent transition-colors ${
                             isDeleteMode && selectedForDeletion.has(variable.name)
                               ? 'text-red-600 font-bold'
                               : targetVariable === variable.name 
                               ? 'text-accent font-bold' 
                               : ''
                           }`}
                         >
                           {variable.name}
                         </button>
                       </TableCell>
                       <TableCell>
                         <Select
                           value={variable.type}
                           onValueChange={(value) => handleTypeChange(variable.name, value)}
                         >
                           <SelectTrigger className="w-32">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="numeric">Numeric</SelectItem>
                             <SelectItem value="datetime">Date</SelectItem>
                             <SelectItem value="percentage">Percentage</SelectItem>
                             <SelectItem value="character">Character</SelectItem>
                           </SelectContent>
                         </Select>
                       </TableCell>
                       <TableCell>{formatNumberForDisplay(variable.count)}</TableCell>
                                               <TableCell>
                          {variable.mean ? (
                            variable.type === 'percentage' 
                              ? formatPercentage(variable.mean)
                              : formatNumberForDisplay(variable.mean)
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {variable.median ? (
                            variable.type === 'percentage' 
                              ? formatPercentage(variable.median)
                              : formatNumberForDisplay(variable.median)
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {variable.stdDev ? (
                            variable.type === 'percentage' 
                              ? formatPercentage(variable.stdDev)
                              : formatNumberForDisplay(variable.stdDev)
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {variable.min ? (
                            variable.type === 'datetime' 
                              ? new Date(variable.min).toLocaleDateString() 
                              : variable.type === 'percentage'
                                ? formatPercentage(variable.min)
                                : formatNumberForDisplay(variable.min)
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {variable.max ? (
                            variable.type === 'datetime' 
                              ? new Date(variable.max).toLocaleDateString() 
                              : variable.type === 'percentage'
                                ? formatPercentage(variable.max)
                                : formatNumberForDisplay(variable.max)
                          ) : '-'}
                        </TableCell>
                       <TableCell>
                         <Badge variant={variable.nullCount > 0 ? "destructive" : "secondary"}>
                           {formatNumberForDisplay(variable.nullCount)}
                         </Badge>
                       </TableCell>
                       <TableCell>{formatNumberForDisplay(variable.uniqueCount)}</TableCell>
                       <TableCell>
                         <button
                           onClick={() => handleExpectedSignToggle(variable.name)}
                           className={`w-8 h-8 rounded-full text-white font-bold transition-all ${getExpectedSignColor(expectedSigns[variable.name] || 'neutral')}`}
                           title={`Expected sign: ${expectedSigns[variable.name] || 'neutral'}`}
                         >
                           {getExpectedSignText(expectedSigns[variable.name] || 'neutral')}
                         </button>
                       </TableCell>
                       <TableCell>
                         <Badge variant={targetVariable === variable.name ? "default" : "secondary"}>
                           {targetVariable === variable.name ? "Target" : "Independent"}
                         </Badge>
                       </TableCell>
                     </TableRow>
                   ))
                 ) : (
                   <TableRow>
                     <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                       No data available. Please check your file upload and sheet selection.
                     </TableCell>
                   </TableRow>
                 )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        </Card>
      )}

      {/* Step 3: Data Distribution Histograms */}
      {currentStep === 3 && (
        <Card className="max-w-full overflow-hidden">
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <BarChart3 className="h-5 w-5 text-secondary" />
             Data Distribution
           </CardTitle>
           <CardDescription>
             Histograms showing the distribution pattern for each variable (4 charts per row)
           </CardDescription>
         </CardHeader>
         <CardContent>
                       {/* Intelligent Bin Count Control */}
            <div className="mb-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Bin Strategy:</label>
                <Select value={histogramStrategy} onValueChange={(value) => setHistogramStrategy(value as 'auto' | 'manual')}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {histogramStrategy === 'manual' && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Manual Bins:</label>
                  <Select value={String(histogramBins)} onValueChange={(value) => setHistogramBins(parseInt(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="12">12</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => loadHistogramData(summaryData)}
                className="ml-2"
              >
                Refresh
              </Button>
            </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
             {histogramData && histogramData.length > 0 ? (
               histogramData.map((histogram, index) => (
                 <div 
                   key={index} 
                   className={`border rounded-lg p-4 cursor-pointer transition-all ${
                     isDeleteMode && selectedForDeletion.has(histogram.variableName)
                       ? 'border-red-500 bg-red-50'
                       : 'border-gray-200 hover:border-gray-300'
                   }`}
                   onClick={() => {
                     if (isDeleteMode) {
                       handleVariableSelectForDeletion(histogram.variableName);
                     }
                   }}
                 >
                   <h4 className={`font-medium text-sm mb-3 text-center ${
                     isDeleteMode && selectedForDeletion.has(histogram.variableName)
                       ? 'text-red-600'
                       : ''
                   }`}>
                     {histogram.variableName}
                   </h4>
                   
                   {/* Enhanced histogram with axes */}
                   <div className="relative h-48">
                     {/* Y-axis labels */}
                     <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-gray-500">
                       {(() => {
                         const maxCount = Math.max(...histogram.counts);
                         return [100, 75, 50, 25, 0].map(percent => (
                           <span key={percent} className="transform -translate-y-1">
                             {formatNumberForDisplay(Math.round((percent / 100) * maxCount))}
                           </span>
                         ));
                       })()}
                     </div>
                     
                                           {/* X-axis labels with intelligent spacing */}
                      <div className="absolute bottom-0 left-8 right-0 h-6 flex justify-between text-xs text-gray-500">
                        {(() => {
                          const binCount = histogram.bins.length;
                          // Show fewer labels for better readability
                          const labelIndices = [];
                          if (binCount <= 8) {
                            // For small bin counts, show all labels
                            for (let i = 0; i < binCount; i++) {
                              labelIndices.push(i);
                            }
                          } else if (binCount <= 15) {
                            // For medium bin counts, show every other label
                            for (let i = 0; i < binCount; i += 2) {
                              labelIndices.push(i);
                            }
                          } else {
                            // For large bin counts, show only key labels
                            labelIndices.push(0, Math.floor(binCount/4), Math.floor(binCount/2), Math.floor(3*binCount/4), binCount-1);
                          }
                          
                          return labelIndices.map(i => (
                            <span 
                              key={i} 
                              className="transform -translate-x-1/2 text-[10px]"
                              style={{ 
                                left: `${(i / (binCount - 1)) * 100}%`,
                                position: 'absolute'
                              }}
                            >
                              {histogram.bins[i] !== undefined ? formatHistogramBinLabel(histogram.bins[i]) : '0'}
                            </span>
                          ));
                        })()}
                      </div>
                     
                     {/* Histogram bars */}
                     <div className="absolute left-8 top-0 right-0 bottom-6 flex items-end justify-center gap-0.5 px-1">
                       {histogram.bins && histogram.counts ? (
                         histogram.counts.map((count, binIndex) => {
                           const maxCount = Math.max(...histogram.counts);
                           const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                           return (
                             <div 
                               key={binIndex} 
                               className="flex-1 bg-primary hover:bg-primary/80 transition-colors rounded-t cursor-pointer"
                               style={{ height: `${height}%` }}
                               title={`Bin ${binIndex + 1}: ${count} values (${histogram.bins[binIndex] !== undefined ? formatHistogramBinLabel(histogram.bins[binIndex]) : '0'} - ${histogram.bins[binIndex + 1] !== undefined ? formatHistogramBinLabel(histogram.bins[binIndex + 1]) : '0'})`}
                             >
                               <div className="text-xs text-center text-white -rotate-90 transform origin-center opacity-0 hover:opacity-100 transition-opacity">
                                 {formatNumberForDisplay(count)}
                               </div>
                             </div>
                           );
                         })
                       ) : (
                         <div className="text-sm text-gray-500 text-center">
                           <BarChart3 className="h-6 w-6 mx-auto mb-1" />
                           No histogram data
                         </div>
                       )}
                     </div>
                     
                     {/* Grid lines */}
                     <div className="absolute left-8 top-0 right-0 bottom-6">
                       {[0, 25, 50, 75, 100].map(percent => (
                         <div 
                           key={percent} 
                           className="absolute w-full border-t border-gray-200"
                           style={{ top: `${percent}%` }}
                         />
                       ))}
                     </div>
                   </div>
                   
                                       <div className="text-xs text-gray-500 text-center mt-2">
                      {histogram.binCount ? `${histogram.binCount} bins` : 
                       histogram.bins ? `${histogram.bins.length - 1} bins` : 'No bins'}
                      {histogramStrategy === 'auto' && histogram.binCount && (
                        <span className="block text-[9px] text-primary">(Auto-calculated)</span>
                      )}
                    </div>
                 </div>
               ))
             ) : (
               <div className="col-span-full text-center py-8 text-gray-500">
                 <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                 <p>Loading histogram data...</p>
               </div>
             )}
           </div>
         </CardContent>
        </Card>
      )}

      {/* Step 4: Correlation Matrix */}
      {currentStep === 4 && summaryData && summaryData.length > 0 && (
        <Card className="max-w-full overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5 text-accent" />
              Correlation Matrix Heatmap
            </CardTitle>
            <CardDescription>
              Select variables to include in the correlation matrix. Red indicates strong correlation (potential multicollinearity).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Variable Selection */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Select Variables for Correlation Matrix</h4>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="correlation-select-all"
                    checked={isCorrelationSelectAll}
                    onCheckedChange={handleCorrelationSelectAll}
                  />
                  <label htmlFor="correlation-select-all" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Select All Numeric Variables
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {summaryData
                  .filter(variable => variable.type === 'numeric')
                  .map((variable) => (
                    <div 
                      key={variable.name} 
                      className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-all ${
                        isDeleteMode && selectedForDeletion.has(variable.name)
                          ? 'bg-red-50 border border-red-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        if (isDeleteMode) {
                          handleVariableSelectForDeletion(variable.name);
                        }
                      }}
                    >
                      <Checkbox
                        id={`correlation-${variable.name}`}
                        checked={isDeleteMode ? selectedForDeletion.has(variable.name) : selectedCorrelationVariables.has(variable.name)}
                        onCheckedChange={() => {
                          if (isDeleteMode) {
                            handleVariableSelectForDeletion(variable.name);
                          } else {
                            handleCorrelationVariableToggle(variable.name);
                          }
                        }}
                      />
                      <label 
                        htmlFor={`correlation-${variable.name}`} 
                        className={`text-sm cursor-pointer truncate ${
                          isDeleteMode && selectedForDeletion.has(variable.name)
                            ? 'text-red-600 font-medium'
                            : 'text-gray-700'
                        }`}
                        title={variable.name}
                      >
                        {variable.name}
                      </label>
                    </div>
                  ))}
              </div>
              
              {summaryData.filter(variable => variable.type === 'numeric').length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                  <p>No numeric variables found for correlation analysis</p>
                </div>
              )}
            </div>

                        {/* Correlation Matrix Display */}
            {correlationMatrix && correlationMatrix.variables && correlationMatrix.variables.length > 0 && (
              <>
                <div className="overflow-x-auto max-w-full">
                  <table className="w-full border-collapse min-w-full">
                    <thead>
                      <tr>
                        <th className="p-2 text-left font-medium border border-gray-300 bg-gray-50">Variable</th>
                        {correlationMatrix.variables.map((variable, index) => (
                          <th key={index} className="p-2 text-center font-medium text-sm border border-gray-300 bg-gray-50 min-w-[80px]">
                            <div className="truncate" title={variable}>
                              {variable.length > 8 ? variable.substring(0, 8) + '...' : variable}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {correlationMatrix.variables.map((rowVariable, rowIndex) => (
                        <tr key={rowIndex}>
                          <td className="p-2 font-medium text-sm border border-gray-300 bg-gray-50">
                            <div className="truncate" title={rowVariable}>
                              {rowVariable.length > 12 ? rowVariable.substring(0, 12) + '...' : rowVariable}
                            </div>
                          </td>
                          {correlationMatrix.variables.map((colVariable, colIndex) => (
                            <td key={colIndex} className="p-1 text-center border border-gray-200">
                              {rowIndex <= colIndex ? (
                                <div
                                  className={`w-16 h-8 rounded text-xs flex items-center justify-center text-white font-medium transition-all hover:scale-110 ${
                                    rowIndex === colIndex 
                                      ? 'bg-gray-400' // Diagonal (self-correlation)
                                      : Math.abs(correlationMatrix.correlations[rowIndex][colIndex]) > 0.8
                                      ? 'bg-destructive' // Very strong correlation
                                      : Math.abs(correlationMatrix.correlations[rowIndex][colIndex]) > 0.7
                                      ? 'bg-destructive/80' // Strong correlation
                                      : Math.abs(correlationMatrix.correlations[rowIndex][colIndex]) > 0.5
                                      ? 'bg-accent' // Moderate correlation
                                      : Math.abs(correlationMatrix.correlations[rowIndex][colIndex]) > 0.3
                                      ? 'bg-accent' // Weak correlation
                                      : 'bg-secondary' // Very weak correlation
                                  }`}
                                  title={`${rowVariable} vs ${colVariable}: ${formatNumberForDisplay(correlationMatrix.correlations[rowIndex][colIndex])}`}
                                >
                                  {rowIndex === colIndex ? '1.00' : formatNumberForDisplay(correlationMatrix.correlations[rowIndex][colIndex])}
                                </div>
                              ) : (
                                <div className="w-16 h-8 bg-gray-100 rounded flex items-center justify-center">
                                  <span className="text-gray-400 text-xs">-</span>
                                </div>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Multicollinearity Warning */}
                {(() => {
                  const strongCorrelations = [];
                  for (let i = 0; i < correlationMatrix.variables.length; i++) {
                    for (let j = i + 1; j < correlationMatrix.variables.length; j++) {
                      const corr = Math.abs(correlationMatrix.correlations[i][j]);
                      if (corr > 0.7) {
                        strongCorrelations.push({
                          var1: correlationMatrix.variables[i],
                          var2: correlationMatrix.variables[j],
                          correlation: corr
                        });
                      }
                    }
                  }
                  
                  if (strongCorrelations.length > 0) {
                    return (
                      <div className="mt-4 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-medium">Multicollinearity Warning</span>
                        </div>
                        <p className="text-sm text-destructive/80 mt-1">
                          The following variable pairs show strong correlation (&gt;0.7) which may cause multicollinearity issues in modeling:
                        </p>
                        <ul className="text-xs text-destructive/70 mt-2 space-y-1">
                          {strongCorrelations.slice(0, 5).map((pair, index) => (
                            <li key={index}>
                              • {pair.var1} ↔ {pair.var2}: {formatNumberForDisplay(pair.correlation)}
                            </li>
                          ))}
                          {strongCorrelations.length > 5 && (
                            <li>• ... and {strongCorrelations.length - 5} more pairs</li>
                          )}
                        </ul>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                <div className="mt-4 flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-destructive rounded"></div>
                    <span>Very Strong (&gt;0.8)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-destructive/80 rounded"></div>
                    <span>Strong (&gt;0.7)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-accent rounded"></div>
                    <span>Moderate (&gt;0.5)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-accent rounded"></div>
                    <span>Weak (&gt;0.3)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-secondary rounded"></div>
                    <span>Very Weak (&lt;0.3)</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
      </div>

      {/* Step Navigation Buttons */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              disabled={currentStep === 1 || isDeleteMode}
              className="flex items-center gap-2"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Previous
            </Button>
            
            <div className="text-center">
              <div className="text-sm text-gray-600">
                Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.title}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {currentStep === 1 && "Select your target variable to begin analysis"}
                {currentStep === 2 && "Review and modify data types as needed"}
                {currentStep === 3 && "Examine data distribution patterns"}
                {currentStep === 4 && "Check for variable relationships and multicollinearity"}
              </div>
            </div>
            
            {currentStep < steps.length ? (
              <Button
                onClick={handleNextStep}
                className="flex items-center gap-2"
                disabled={
                  isDeleteMode ||
                  (currentStep === 1 && !isTargetVariableSelected) ||
                  (currentStep === 2 && summaryData.length === 0)
                }
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleContinue}
                size="lg"
                className="px-8"
                disabled={isDeleteMode || !isTargetVariableSelected}
              >
                Continue to Chart Analysis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Target Variable Summary */}
      {targetVariable && (
        <Card className="shadow-sm border-accent/20 bg-accent/5 max-w-full overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <TrendingUp className="h-5 w-5" />
              Target Variable Selected
            </CardTitle>
            <CardDescription className="text-accent/80">
              This variable will be used as the dependent variable in your analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-white border border-accent/20 rounded-lg">
              <p className="text-lg text-accent font-bold">
                {targetVariable}
              </p>
              <p className="text-sm text-accent/80 mt-1">
                Click on any variable name in the table above to change your selection
              </p>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}