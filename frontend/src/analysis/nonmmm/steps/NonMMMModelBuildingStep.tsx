/**
 * ========================================
 * NON-MMM MODEL BUILDING STEP
 * ========================================
 * 
 * Purpose: Eighth step for non-MMM analysis workflow
 * 
 * Description:
 * This component allows users to configure and build statistical models:
 * 1. Model type selection (linear, log-linear, log-log, ridge, bayesian)
 * 2. Independent variable selection via checkboxes
 * 3. Model execution and training
 * 4. Model configuration management
 * 
 * Key Features:
 * - Model type selection with descriptions
 * - Variable selection interface with checkboxes
 * - Model execution controls
 * - Configuration management and state persistence
 * - Real-time model training and results display
 * 
 * Dependencies:
 * - AnalysisContext for state management
 * - Non-MMM specific types and interfaces
 * - Model execution services
 * - State persistence for configuration
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '@/context/AnalysisContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Loader2, 
  AlertCircle,
  Star,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  NonMMMModelConfiguration, 
  NonMMMModelType, 
  NonMMMModelResults,
  NonMMMModelVariable 
} from '@/analysis/nonmmm/types/nonmmm';
import { NonMMMStateService } from '@/analysis/nonmmm/services/NonMMMStateService';
import { NonMMMModelingService } from '@/analysis/nonmmm/services/NonMMMModelingService';
import { NonMMMModelStateService, NonMMMModelState } from '@/analysis/nonmmm/services/NonMMMModelStateService';
import { DataStructureSummary } from '@/components/DataStructureSummary';

interface ModelBuildingStepState {
  selectedModelType: NonMMMModelType | null;
  selectedVariables: string[];
  availableVariables: string[];
  selectedDataType: 'original' | 'standardized';
  isProcessing: boolean;
  error: string | null;
  isComplete: boolean;
  modelResults: NonMMMModelState[];
  isExecuting: boolean;
}

const MODEL_TYPES = [
  {
    id: 'linear' as NonMMMModelType,
    name: 'Linear Regression',
    description: 'Standard linear regression model (y = β₀ + β₁x₁ + ... + βₙxₙ)'
  },
  {
    id: 'log-linear' as NonMMMModelType,
    name: 'Log-Linear Model',
    description: 'Log transformation on target variable (ln(y) = β₀ + β₁x₁ + ... + βₙxₙ)'
  },
  {
    id: 'log-log' as NonMMMModelType,
    name: 'Log-Log Model',
    description: 'Log transformation on both sides (ln(y) = β₀ + β₁ln(x₁) + ... + βₙln(xₙ))'
  },
  {
    id: 'ridge' as NonMMMModelType,
    name: 'Ridge Regression',
    description: 'Regularized linear regression with L2 penalty to reduce overfitting'
  },
  {
    id: 'bayesian' as NonMMMModelType,
    name: 'Bayesian Regression',
    description: 'Probabilistic model with uncertainty estimates and prior distributions'
  }
];

export function NonMMMModelBuildingStep() {
  const { state: analysisContext } = useAnalysis();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [stepState, setStepState] = useState<ModelBuildingStepState>({
    selectedModelType: null,
    selectedVariables: [],
    availableVariables: [],
    selectedDataType: 'original', // Default to original data
    isProcessing: false,
    error: null,
    isComplete: false,
    modelResults: [],
    isExecuting: false
  });

  // Get Non-MMM state data
  const [nonmmmState, setNonmmmState] = useState<Record<string, unknown> | null>(null);
  const stepData = useMemo(() => 
    nonmmmState?.stepData as Record<string, unknown> || {}, 
    [nonmmmState?.stepData]
  );
  
  // Memoize extracted values to prevent unnecessary recalculations
  const extractedValues = useMemo(() => {
    const analysisId = nonmmmState?.analysisId as string || stepData?.analysisId as string || `nonmmm_${(typeof nonmmmState?.brand === 'string' ? nonmmmState.brand : 'mbl').toLowerCase().replace(/\s+/g, '_')}`;
    const brand = nonmmmState?.brand as string || nonmmmState?.brandName as string || stepData?.brand as string || stepData?.brandName as string || analysisContext?.selectedBrand;
    const filename = nonmmmState?.uploadedFile as string || stepData?.uploadedFile as string;
    const targetVariable = nonmmmState?.targetVariable as string || stepData?.targetVariable as string;
    const expectedSigns = (nonmmmState?.expectedSigns as Record<string, string>) || 
      (stepData?.expectedSigns as Record<string, string>) || 
      {};
    const standardizedFile = nonmmmState?.standardizedFile as string || stepData?.standardizedFile as string;
    const standardizationCompleted = nonmmmState?.standardizationCompleted as boolean || stepData?.standardizationCompleted as boolean;
    
    return {
      analysisId,
      brand,
      filename,
      targetVariable,
      expectedSigns,
      standardizedFile,
      standardizationCompleted
    };
  }, [nonmmmState, stepData, analysisContext?.selectedBrand]);
  
  // Destructure for easier access
  const { analysisId, brand, filename, targetVariable, expectedSigns, standardizedFile, standardizationCompleted } = extractedValues;

  // Debug logging for standardization status (only in development and when values change)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 Model Building - Extracted Values:', {
        standardizedFile,
        standardizationCompleted,
        nonmmmStateStandardizedFile: nonmmmState?.standardizedFile,
        nonmmmStateStandardizationCompleted: nonmmmState?.standardizationCompleted,
        stepDataStandardizedFile: stepData?.standardizedFile,
        stepDataStandardizationCompleted: stepData?.standardizationCompleted
      });
    }
  }, [standardizedFile, standardizationCompleted, nonmmmState?.standardizedFile, nonmmmState?.standardizationCompleted, stepData?.standardizedFile, stepData?.standardizationCompleted]);

  // Load existing model results from Node.js backend
  const loadExistingModelResults = useCallback(async () => {
    if (!filename || !brand) return;
    
    try {
      const response = await NonMMMModelStateService.getModels(brand, filename);
      if (response.success && response.data?.models) {
        setStepState(prev => ({
          ...prev,
          modelResults: response.data.models
        }));
      }
    } catch (error) {
      console.error('Error loading existing model results:', error);
    }
  }, [filename, brand]);

  // Initialize available variables (excluding target variable)
  const initializeVariables = useCallback(async () => {
    if (!targetVariable || !filename || !brand) return;

    try {
      // Add timestamp to force fresh data (bypass any potential caching)
      const timestamp = Date.now();
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/nonmmm/data-summary/${encodeURIComponent(filename)}?brand=${encodeURIComponent(brand)}&_t=${timestamp}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data summary: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data?.variables) {
        // Get all variable names except the target variable
        const allVariables = data.data.variables.map((v: { name: string }) => v.name);
        const variablesForSelection = allVariables.filter((col: string) => col !== targetVariable);

        if (import.meta.env.DEV) {
          console.log('🔍 Model Building - Available Variables from Data File:', {
            targetVariable,
            allVariables,
            variablesForSelection,
            totalVariables: variablesForSelection.length,
            dataFileVariables: allVariables.length,
            timestamp
          });
        }

        setStepState(prev => ({
          ...prev,
          availableVariables: variablesForSelection,
          // Also clear selected variables that no longer exist
          selectedVariables: prev.selectedVariables.filter(v => variablesForSelection.includes(v))
        }));
      } else {
        // Fallback to expectedSigns if data summary fails
        console.warn('Failed to get variables from data file, falling back to expectedSigns');
        const variablesForSelection = Object.keys(expectedSigns || {}).filter(col => col !== targetVariable);
        setStepState(prev => ({
          ...prev,
          availableVariables: variablesForSelection
        }));
      }
    } catch (error) {
      console.error('Error fetching variables from data file:', error);
      // Fallback to expectedSigns
      const variablesForSelection = Object.keys(expectedSigns || {}).filter(col => col !== targetVariable);
      setStepState(prev => ({
        ...prev,
        availableVariables: variablesForSelection
      }));
    }
  }, [targetVariable, filename, brand, expectedSigns]);

  // Refresh variables from data file (useful when variables are deleted)
  const refreshVariables = async () => {
    console.log('🔄 Refreshing variables from data file...');
    await initializeVariables();
  };

  // Load existing model configuration if available
  const loadExistingConfiguration = useCallback(async () => {
    try {
      if (!analysisId) return;

      // For now, skip loading existing configuration since we don't have the method
      // This can be implemented later when the NonMMMStateService has the proper method
      console.log('Loading existing configuration for analysis:', analysisId);
    } catch (error) {
      console.error('Error loading existing configuration:', error);
    }
  }, [analysisId]);

  // Load Non-MMM state and initialize variables
  useEffect(() => {
    const loadState = async () => {
      const state = await NonMMMStateService.getNonMMMState();
      if (import.meta.env.DEV) {
        console.log('🔍 Model Building - Full NonMMM State:', state);
        console.log('🔍 Model Building - Uploaded File:', state?.uploadedFile);
        console.log('🔍 Model Building - Standardized File:', state?.standardizedFile);
        console.log('🔍 Model Building - Standardization Completed:', state?.standardizationCompleted);
      }
      setNonmmmState(state);
    };
    loadState();
  }, []);

  // Initialize with existing data and available variables
  useEffect(() => {
    if (filename && targetVariable && brand) {
      initializeVariables();
      loadExistingConfiguration();
      loadExistingModelResults();
    }
  }, [filename, targetVariable, brand, initializeVariables, loadExistingConfiguration, loadExistingModelResults]);

  // Handle model type selection
  const handleModelTypeChange = (modelType: NonMMMModelType) => {
    setStepState(prev => ({
      ...prev,
      selectedModelType: modelType,
      error: null
    }));
  };

  // Handle variable selection
  const handleVariableToggle = (variableName: string, checked: boolean) => {
    setStepState(prev => ({
      ...prev,
      selectedVariables: checked 
        ? [...prev.selectedVariables, variableName]
        : prev.selectedVariables.filter(v => v !== variableName),
      error: null
    }));
  };

  // Handle select all variables
  const handleSelectAll = () => {
    setStepState(prev => ({
      ...prev,
      selectedVariables: [...prev.availableVariables],
      error: null
    }));
  };

  // Handle deselect all variables
  const handleDeselectAll = () => {
    setStepState(prev => ({
      ...prev,
      selectedVariables: [],
      error: null
    }));
  };

  // Validate configuration before execution
  const validateConfiguration = (): boolean => {
    if (!stepState.selectedModelType) {
      setStepState(prev => ({ ...prev, error: 'Please select a model type' }));
      return false;
    }

    if (stepState.selectedVariables.length === 0) {
      setStepState(prev => ({ ...prev, error: 'Please select at least one independent variable' }));
      return false;
    }

    if (!targetVariable) {
      setStepState(prev => ({ ...prev, error: 'Target variable not found' }));
      return false;
    }

    return true;
  };

  // Execute model training
  const handleExecuteModel = async () => {
    if (!validateConfiguration()) return;

    setStepState(prev => ({ ...prev, isExecuting: true, error: null }));

    try {
      if (!filename || !targetVariable) {
        throw new Error('Missing required data for model execution');
      }

      const request = {
        filename: filename,
        targetVariable: targetVariable,
        independentVariables: stepState.selectedVariables,
        modelType: stepState.selectedModelType!,
        modelParameters: {},
        validationSplit: 0.2,
        brand: brand,
        dataType: stepState.selectedDataType
      };

      console.log('🚀 Model Training Request:', {
        filename,
        targetVariable,
        independentVariables: stepState.selectedVariables,
        modelType: stepState.selectedModelType,
        brand,
        request
      });

      const response = await NonMMMModelingService.trainModel(request);

      if (response.success && response.data) {
        const newModelResult: NonMMMModelResults = {
          id: response.data.modelId,
          modelType: stepState.selectedModelType!,
          executionStatus: 'completed',
          executedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          rSquared: response.data.rSquared,
          adjustedRSquared: response.data.adjustedRSquared,
          rootMeanSquareError: response.data.performanceMetrics.rmse,
          fStatistic: 0, // Would come from backend
          pValue: 0.001, // Would come from backend
          variables: response.data.variables.map((v: { name: string; coefficient?: number; pValue?: number; tStatistic?: number; vif?: number; elasticity10Percent?: number }) => ({
            name: v.name,
            coefficient: v.coefficient || 0,
            pValue: v.pValue || 0,
            tStatistic: v.tStatistic || 0,
            vif: v.vif || 0,
            elasticity10Percent: v.elasticity10Percent || 0, // Map elasticity from backend
            expectedSign: 'neutral',
            actualSign: v.coefficient && v.coefficient > 0 ? 'positive' : 'negative',
            isSignificant: (v.pValue || 0) < 0.05
          })),
          diagnostics: {
            residuals: [],
            durbinWatson: 0,
            jarqueBera: 0,
            breuschPagan: 0,
            vifMax: Math.max(...response.data.variables.map(v => v.vif || 0)),
            conditionIndex: 0
          },
          executionTime: response.data.trainingInfo.trainingTime
        };

        // Save the model to Node.js state
        const modelToSave = {
          ...newModelResult,
          filename,
          brand,
          targetVariable,
          independentVariables: stepState.selectedVariables,
          isSaved: false,
          isProduction: false,
          meanAbsoluteError: response.data.performanceMetrics.mae || 0,
          createdAt: new Date().toISOString(),
          executionTime: response.data.trainingInfo.trainingTime
        };

        await NonMMMModelStateService.saveModel({
          modelData: modelToSave,
          brand,
          filename
        });

        // Refresh the model list from backend to get the latest order
        await loadExistingModelResults();
        
        // Update step completion and progress
        if (analysisContext?.currentAnalysisId) {
          try {
            const currentState = await NonMMMStateService.getNonMMMState() || {};
            await NonMMMStateService.saveNonMMMState({
              ...currentState,
              analysisId: analysisContext.currentAnalysisId,
              currentStep: 9, // Model results step (step 9) - the latest completed step
              modelBuildingCompleted: true,
              modelsBuilt: (typeof currentState.modelsBuilt === 'number' ? currentState.modelsBuilt : 0) + 1,
              lastModelType: stepState.selectedModelType,
              lastModelRSquared: response.data.rSquared,
              lastUpdated: new Date().toISOString()
            });
            console.log('✅ Model building step completed, updated currentStep to 9');
          } catch (error) {
            console.error('❌ Failed to save model building completion state:', error);
          }
        }
        
        setStepState(prev => ({
          ...prev,
          isExecuting: false
        }));

        toast({
          title: "Model Training Complete",
          description: `${stepState.selectedModelType} model has been successfully trained with R² = ${(response.data.rSquared * 100).toFixed(1)}%`,
        });
      } else {
        throw new Error(response.error || 'Model training failed');
      }
    } catch (error) {
      console.error('Error executing model:', error);
      setStepState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Model execution failed',
        isExecuting: false
      }));

      toast({
        title: "Model Training Failed",
        description: error instanceof Error ? error.message : 'An error occurred during model training',
        variant: "destructive"
      });
    }
  };

  // Delete a model result
  const handleDeleteModel = async (modelId: string) => {
    try {
      if (!filename || !brand) return;
      
      // Delete from Node.js backend
      const response = await NonMMMModelStateService.deleteModel(modelId, brand, filename);
      
      if (response.success) {
        // Refresh the model list from backend
        await loadExistingModelResults();
        
        toast({
          title: "Model Deleted",
          description: "Model has been removed from the results",
        });
      } else {
        throw new Error(response.error || 'Failed to delete model');
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      toast({
        title: "Error",
        description: "Failed to delete model. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Set model to production
  const handleSetProduction = async (modelId: string) => {
    try {
      if (!filename || !brand) return;
      
      const response = await NonMMMModelStateService.setProductionModel({
        modelId,
        brand,
        filename
      });
      
      if (response.success) {
        await loadExistingModelResults();
        toast({
          title: "Production Model Set",
          description: "Model has been set as production model",
        });
      } else {
        throw new Error(response.error || 'Failed to set production model');
      }
    } catch (error) {
      console.error('Error setting production model:', error);
      toast({
        title: "Error",
        description: "Failed to set production model. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Save configuration and proceed
  const handleContinue = async () => {
    if (!validateConfiguration()) return;

    setStepState(prev => ({ ...prev, isProcessing: true }));

    try {
      if (!analysisId) {
        throw new Error('Analysis ID not found');
      }

      const modelConfiguration: NonMMMModelConfiguration = {
        selectedModelType: stepState.selectedModelType!,
        independentVariables: stepState.selectedVariables,
        targetVariable: targetVariable!,
        configurationAt: new Date().toISOString(),
        isComplete: true
      };

      // Save to Non-MMM state
      await NonMMMStateService.saveNonMMMState({
        ...nonmmmState,
        modelConfiguration,
        modelResults: stepState.modelResults,
        currentStep: 5, // Current step is model building (step 5)
        lastUpdated: new Date().toISOString()
      });

      setStepState(prev => ({ ...prev, isComplete: true, isProcessing: false }));

      // Save the current step state before continuing
      const currentState = await NonMMMStateService.getNonMMMState() || {};
      await NonMMMStateService.saveNonMMMState({
        ...currentState,
        currentStep: 5, // Current step is model building (step 5)
        modelBuildingCompleted: true,
        lastUpdated: new Date().toISOString()
      });
      console.log('✅ Model building state saved, moving to step 6');

      toast({
        title: "Model Configuration Saved",
        description: "Your model configuration has been saved successfully",
      });

      // Mark step as completed and navigate to next step (Download Analysis)
      await NonMMMStateService.saveNonMMMState({
        ...nonmmmState,
        modelBuildingCompleted: true,
        currentStep: 6, // Move to Download Analysis step
        lastUpdated: new Date().toISOString()
      });
      
      // Navigate to Download Analysis step using React Router
      navigate('/nonmmm/download');
    } catch (error) {
      console.error('Error saving model configuration:', error);
      setStepState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save configuration',
        isProcessing: false
      }));

      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : 'Failed to save model configuration',
        variant: "destructive"
      });
    }
  };

  // Get model quality badge
  const getModelQualityBadge = (rSquared: number) => {
    const quality = NonMMMModelingService.getModelQuality(rSquared);
    const colorMap = {
      high: 'bg-secondary/10 text-secondary',
      medium: 'bg-accent/10 text-accent',
      low: 'bg-destructive/10 text-destructive'
    };

    return (
      <Badge className={colorMap[quality.level]}>
        {quality.label} (R² = {(rSquared * 100).toFixed(1)}%)
      </Badge>
    );
  };

  return (
    <div className="w-full p-4 space-y-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Model Building</h1>
      </div>

      {/* Data Structure Summary - Persistent Component */}
      {stepState.availableVariables.length > 0 && targetVariable && (
        <DataStructureSummary
          columns={[targetVariable, ...stepState.availableVariables]}
          rowCount={0}
          className="max-w-4xl mx-auto"
        />
      )}

      {/* Error Alert */}
      {stepState.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{stepState.error}</AlertDescription>
        </Alert>
      )}

      {/* Data Type Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Select Data Type</CardTitle>
          <CardDescription>
            Choose whether to use original data or standardized data for modeling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                stepState.selectedDataType === 'original'
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setStepState(prev => ({ ...prev, selectedDataType: 'original' }))}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Original Data</h3>
                  <p className="text-sm text-gray-600">
                    Use the raw data as uploaded. Variables maintain their original scales and distributions.
                  </p>
                </div>
                {stepState.selectedDataType === 'original' && <CheckCircle className="h-5 w-5 text-primary" />}
              </div>
            </div>
            
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                stepState.selectedDataType === 'standardized'
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setStepState(prev => ({ ...prev, selectedDataType: 'standardized' }))}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Standardized Data</h3>
                  <p className="text-sm text-gray-600">
                    Use preprocessed data with standardized variables. Often improves model performance.
                  </p>
                </div>
                {stepState.selectedDataType === 'standardized' && <CheckCircle className="h-5 w-5 text-primary" />}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Standardized Data Warning */}
      {stepState.selectedDataType === 'standardized' && (!standardizationCompleted || !standardizedFile) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Standardized data not available!</strong> Please ensure standardized data has been created. 
            If you just completed the chart analysis step, please refresh the page or contact support.
          </AlertDescription>
        </Alert>
      )}

      {/* Model Type Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Select Model Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {MODEL_TYPES.map((modelType) => {
              const isSelected = stepState.selectedModelType === modelType.id;
              
              return (
                <div
                  key={modelType.id}
                  className={`p-3 border rounded cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleModelTypeChange(modelType.id)}
                >
                  <div className="text-center">
                    <h3 className="font-medium text-sm">{modelType.name}</h3>
                    {isSelected && <CheckCircle className="h-4 w-4 text-primary mx-auto mt-1" />}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Variable Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Select Independent Variables</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Selection Controls */}
          <div className="flex gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={stepState.availableVariables.length === 0}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
              disabled={stepState.selectedVariables.length === 0}
            >
              Deselect All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshVariables}
              disabled={!filename || !brand}
            >
              Refresh Variables
            </Button>
            <Badge variant="secondary">
              {stepState.selectedVariables.length} of {stepState.availableVariables.length} selected
            </Badge>
          </div>

          {/* Variable Checkboxes */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {stepState.availableVariables.map((variable) => (
              <div key={variable} className="flex items-center space-x-2">
                <Checkbox
                  id={variable}
                  checked={stepState.selectedVariables.includes(variable)}
                  onCheckedChange={(checked) => 
                    handleVariableToggle(variable, checked as boolean)
                  }
                />
                <Label htmlFor={variable} className="text-sm">
                  {variable}
                </Label>
              </div>
            ))}
          </div>

          {stepState.availableVariables.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <AlertCircle className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm">No variables available for selection</p>
              <p className="text-xs">Make sure you have uploaded data and selected a target variable</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Execution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Execute Model</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleExecuteModel}
            disabled={
              !stepState.selectedModelType ||
              stepState.selectedVariables.length === 0 ||
              stepState.isExecuting
            }
            className="w-full"
          >
            {stepState.isExecuting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Training Model...
              </>
            ) : (
              'Train Model'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Model Results */}
      {stepState.modelResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Model Results</CardTitle>
            <CardDescription>
              Results from your trained models (latest first)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {stepState.modelResults.map((model) => (
                <div key={model.id} className="space-y-4">
                  {/* Model Summary */}
                  <div className="border rounded-lg p-4 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-lg">{model.modelType} Model</h4>
                        {getModelQualityBadge(model.rSquared)}
                        {model.isProduction && (
                          <Badge variant="default" className="bg-green-600">
                            <Star className="w-3 h-3 mr-1" />
                            In Production
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={model.isProduction ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSetProduction(model.id)}
                          className={model.isProduction ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          <Star className="w-4 h-4 mr-1" />
                          {model.isProduction ? "In Production" : "Set to Prod"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteModel(model.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">R²:</span>
                        <span className="ml-1 font-medium">{(model.rSquared * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Adj. R²:</span>
                        <span className="ml-1 font-medium">{(model.adjustedRSquared * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">RMSE:</span>
                        <span className="ml-1 font-medium">{model.rootMeanSquareError.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Variables:</span>
                        <span className="ml-1 font-medium">{model.variables.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Variable Results for this Model */}
                  <div className="ml-4">
                    <h5 className="font-semibold mb-2 text-sm text-gray-700">Variable Statistics</h5>
                    <div className="overflow-x-auto max-w-full">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Variable</TableHead>
                            <TableHead>Coefficient</TableHead>
                            <TableHead>P-value</TableHead>
                            <TableHead>VIF</TableHead>
                            <TableHead>Elasticity @10%</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {model.variables.map((variable, index) => (
                            <TableRow key={`${model.id}-${index}`}>
                              <TableCell className="font-medium">
                                {variable.name}
                              </TableCell>
                              <TableCell className="font-mono">
                                {variable.coefficient.toFixed(4)}
                              </TableCell>
                              <TableCell className="font-mono">
                                {variable.pValue.toFixed(4)}
                              </TableCell>
                              <TableCell className="font-mono">
                                {variable.vif.toFixed(2)}
                              </TableCell>
                              <TableCell className="font-mono">
                                {(variable as { elasticity10Percent?: number }).elasticity10Percent !== undefined ? ((variable as { elasticity10Percent?: number }).elasticity10Percent! * 100).toFixed(2) + '%' : 'N/A'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      <div className="flex justify-center">
        <Button 
          onClick={handleContinue} 
          size="lg" 
          className="px-8"
          disabled={
            !stepState.selectedModelType ||
            stepState.selectedVariables.length === 0 ||
            stepState.isProcessing
          }
        >
          {stepState.isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Configuration...
            </>
          ) : (
            'Continue to Download Analysis'
          )}
        </Button>
      </div>
    </div>
  );
}
