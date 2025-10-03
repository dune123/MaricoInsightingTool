/**
 * ========================================
 * NON-MMM DATA STANDARDIZATION STEP
 * ========================================
 * 
 * Purpose: Fourth step for non-MMM analysis workflow - Data Standardization
 * 
 * Description:
 * This component allows users to standardize their data before modeling:
 * 1. Standardization method selection (Z-Score, Min-Max, Robust, Unit Vector)
 * 2. Variable selection for standardization
 * 3. Preview of standardization effects
 * 4. Progress tracking and validation
 * 
 * Key Features:
 * - Multiple standardization methods with descriptions
 * - Variable selection interface
 * - Standardization preview and validation
 * - Progress tracking and state persistence
 * - Integration with Non-MMM workflow
 * 
 * Dependencies:
 * - AnalysisContext for state management
 * - Non-MMM specific types and interfaces
 * - Data standardization services
 * - State persistence for configuration
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '@/context/AnalysisContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckCircle, 
  Loader2, 
  AlertCircle,
  Info,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NonMMMStateService } from '@/analysis/nonmmm/services/NonMMMStateService';
import { httpClient } from '@/utils/apiClient';

interface StandardizationMethod {
  id: string;
  name: string;
  description: string;
  formula: string;
  useCase: string;
}

interface StandardizationStepState {
  selectedMethod: string | null;
  selectedVariables: string[];
  availableVariables: string[];
  isProcessing: boolean;
  error: string | null;
  isComplete: boolean;
  standardizationResult: any | null;
  isStandardized: boolean;
}

const STANDARDIZATION_METHODS: StandardizationMethod[] = [
  {
    id: 'zscore',
    name: 'Z-Score Standardization',
    description: 'Standardizes data to have mean = 0 and standard deviation = 1',
    formula: '(x - mean) / std',
    useCase: 'Best for normally distributed data and when you want to preserve the shape of the distribution'
  },
  {
    id: 'minmax',
    name: 'Min-Max Scaling',
    description: 'Scales data to a fixed range, typically [0, 1]',
    formula: '(x - min) / (max - min)',
    useCase: 'Good when you know the bounds of your data and want to preserve the original distribution shape'
  },
  {
    id: 'robust',
    name: 'Robust Scaling',
    description: 'Uses median and IQR instead of mean and std, more robust to outliers',
    formula: '(x - median) / IQR',
    useCase: 'Best when your data has outliers that you want to handle gracefully'
  },
  {
    id: 'unit_vector',
    name: 'Unit Vector Scaling',
    description: 'Scales each observation to have unit norm (length = 1)',
    formula: 'x / ||x||',
    useCase: 'Useful for text data or when the magnitude of individual features is not important'
  }
];

export function NonMMMDataStandardizationStep() {
  const { analysisContext } = useAnalysis();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [stepState, setStepState] = useState<StandardizationStepState>({
    selectedMethod: null,
    selectedVariables: [],
    availableVariables: [],
    isProcessing: false,
    error: null,
    isComplete: false,
    standardizationResult: null,
    isStandardized: false
  });

  // Get Non-MMM state data
  const [nonmmmState, setNonmmmState] = useState<Record<string, unknown> | null>(null);
  const stepData = nonmmmState?.stepData as Record<string, unknown> || {};
  const analysisId = analysisContext?.currentAnalysisId || `nonmmm_${(nonmmmState?.brand || stepData?.brand || 'mbl').toLowerCase().replace(/\s+/g, '_')}`;
  const brand = nonmmmState?.brand as string || stepData?.brand as string || analysisContext?.brandName;
  const filename = nonmmmState?.uploadedFile as string || stepData?.uploadedFile as string;
  const targetVariable = nonmmmState?.targetVariable as string || stepData?.targetVariable as string;
  const expectedSigns = (nonmmmState?.expectedSigns as Record<string, string>) || (stepData?.expectedSigns as Record<string, string>) || {};

  // Load Non-MMM state and initialize variables
  useEffect(() => {
    const loadState = async () => {
      const state = await NonMMMStateService.getNonMMMState();
      console.log('🔍 Data Standardization - NonMMM State:', state);
      setNonmmmState(state);
    };
    loadState();
  }, []);

  // Initialize available variables and check if already standardized
  useEffect(() => {
    if (filename && targetVariable && expectedSigns) {
      initializeVariables();
      checkStandardizationStatus();
    }
  }, [filename, targetVariable, expectedSigns]);

  // Initialize available variables (excluding target variable)
  const initializeVariables = () => {
    if (!targetVariable || !expectedSigns) return;

    // Get all variables from expected signs (these are the available variables)
    const variablesForSelection = Object.keys(expectedSigns).filter(col => col !== targetVariable);

    console.log('🔍 Data Standardization - Available Variables:', {
      targetVariable,
      expectedSigns,
      variablesForSelection,
      totalVariables: variablesForSelection.length
    });

    setStepState(prev => ({
      ...prev,
      availableVariables: variablesForSelection
    }));
  };

  // Check if data is already standardized
  const checkStandardizationStatus = async () => {
    if (!filename || !brand) return;
    
    try {
      const response = await httpClient.get(`/nonmmm/standardization-status/${filename}?brand=${encodeURIComponent(brand)}`);
      
      if (response.data.success) {
        const isStandardized = response.data.data.isStandardized;
        setStepState(prev => ({
          ...prev,
          isStandardized,
          isComplete: isStandardized
        }));
        
        if (isStandardized) {
          console.log('✅ Data is already standardized');
        }
      }
    } catch (error) {
      console.error('Error checking standardization status:', error);
    }
  };

  // Handle method selection
  const handleMethodChange = (method: string) => {
    setStepState(prev => ({
      ...prev,
      selectedMethod: method,
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
    if (!stepState.selectedMethod) {
      setStepState(prev => ({ ...prev, error: 'Please select a standardization method' }));
      return false;
    }

    if (stepState.selectedVariables.length === 0) {
      setStepState(prev => ({ ...prev, error: 'Please select at least one variable to standardize' }));
      return false;
    }

    if (!filename || !brand || !analysisId) {
      setStepState(prev => ({ ...prev, error: 'Missing required data for standardization' }));
      return false;
    }

    return true;
  };

  // Execute standardization
  const handleStandardizeData = async () => {
    if (!validateConfiguration()) return;

    setStepState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const request = {
        filename: filename,
        brand: brand,
        analysisId: analysisId,
        method: stepState.selectedMethod,
        columnsToStandardize: stepState.selectedVariables,
        preserveColumns: [targetVariable] // Preserve target variable
      };

      console.log('🚀 Data Standardization Request:', request);

      const response = await httpClient.post('/nonmmm/standardize-data', request);

      if (response.data.success) {
        setStepState(prev => ({
          ...prev,
          isProcessing: false,
          isComplete: true,
          standardizationResult: response.data.data
        }));

        // Update Non-MMM state
        const currentState = await NonMMMStateService.getNonMMMState() || {};
        await NonMMMStateService.saveNonMMMState({
          ...currentState,
          analysisId: analysisId,
          standardizedFile: response.data.data.standardizedFilename,
          standardizationMethod: stepState.selectedMethod,
          standardizationCompleted: true,
          standardizationMetadata: response.data.data.metadata,
          currentStep: 5, // Move to Model Building step
          lastUpdated: new Date().toISOString()
        });

        toast({
          title: "Data Standardization Complete",
          description: `Data has been standardized using ${stepState.selectedMethod} method`,
        });

        // Navigate to Model Building step
        navigate('/nonmmm/modeling');
      } else {
        throw new Error(response.data.error || 'Standardization failed');
      }
    } catch (error) {
      console.error('Error standardizing data:', error);
      setStepState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Data standardization failed',
        isProcessing: false
      }));

      toast({
        title: "Standardization Failed",
        description: error instanceof Error ? error.message : 'An error occurred during standardization',
        variant: "destructive"
      });
    }
  };

  // Skip standardization and continue
  const handleSkipStandardization = async () => {
    try {
      // Update Non-MMM state to skip standardization
      const currentState = await NonMMMStateService.getNonMMMState() || {};
      await NonMMMStateService.saveNonMMMState({
        ...currentState,
        analysisId: analysisId,
        standardizationCompleted: false,
        standardizationSkipped: true,
        currentStep: 5, // Move to Model Building step
        lastUpdated: new Date().toISOString()
      });

      toast({
        title: "Skipped Standardization",
        description: "You can still standardize data later if needed",
      });

      // Navigate to Model Building step
      navigate('/nonmmm/modeling');
    } catch (error) {
      console.error('Error skipping standardization:', error);
      toast({
        title: "Error",
        description: "Failed to skip standardization",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="w-full p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Data Standardization</h1>
        <p className="text-gray-600 mt-2">
          Standardize your data to improve model performance and variable comparability
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Data standardization transforms your variables to have similar scales, which can improve model performance 
          and make coefficients more comparable. You can choose to skip this step and use original data for modeling.
        </AlertDescription>
      </Alert>

      {/* Error Alert */}
      {stepState.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{stepState.error}</AlertDescription>
        </Alert>
      )}

      {/* Already Standardized Alert */}
      {stepState.isStandardized && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Your data has already been standardized. You can proceed to model building or create a new standardization.
          </AlertDescription>
        </Alert>
      )}

      {/* Standardization Method Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Select Standardization Method</CardTitle>
          <CardDescription>
            Choose the method that best fits your data characteristics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STANDARDIZATION_METHODS.map((method) => {
              const isSelected = stepState.selectedMethod === method.id;
              
              return (
                <div
                  key={method.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleMethodChange(method.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{method.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{method.description}</p>
                      <div className="bg-gray-100 p-2 rounded text-xs font-mono mb-2">
                        {method.formula}
                      </div>
                      <p className="text-xs text-gray-500">{method.useCase}</p>
                    </div>
                    {isSelected && <CheckCircle className="h-5 w-5 text-primary ml-2" />}
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
          <CardTitle>Select Variables to Standardize</CardTitle>
          <CardDescription>
            Choose which variables to standardize. The target variable will be preserved as-is.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Selection Controls */}
          <div className="flex gap-2 mb-4">
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
            <Badge variant="secondary">
              {stepState.selectedVariables.length} of {stepState.availableVariables.length} selected
            </Badge>
          </div>

          {/* Variable Checkboxes */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No variables available for standardization</p>
              <p className="text-xs">Make sure you have uploaded data and selected a target variable</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        {!stepState.isComplete && (
          <Button
            variant="outline"
            onClick={handleSkipStandardization}
            disabled={stepState.isProcessing}
          >
            Skip Standardization
          </Button>
        )}
        
        {!stepState.isComplete ? (
          <Button
            onClick={handleStandardizeData}
            disabled={
              !stepState.selectedMethod ||
              stepState.selectedVariables.length === 0 ||
              stepState.isProcessing
            }
            className="min-w-[200px]"
          >
            {stepState.isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Standardizing Data...
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                Standardize Data
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={() => navigate('/nonmmm/modeling')}
            className="min-w-[200px] bg-gradient-to-r from-primary to-primary/90 text-primary-foreground"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Continue to Model Building
          </Button>
        )}
      </div>

      {/* Standardization Result */}
      {stepState.standardizationResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Standardization Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Method:</strong> {stepState.standardizationResult.method}</p>
              <p><strong>Variables Standardized:</strong> {stepState.standardizationResult.metadata.columns_standardized.length}</p>
              <p><strong>Original Shape:</strong> {stepState.standardizationResult.metadata.original_shape[0]} rows × {stepState.standardizationResult.metadata.original_shape[1]} columns</p>
              <p><strong>Standardized File:</strong> {stepState.standardizationResult.standardizedFilename}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
