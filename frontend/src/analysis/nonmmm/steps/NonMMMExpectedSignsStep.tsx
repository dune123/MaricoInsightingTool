/**
 * ========================================
 * NON-MMM EXPECTED SIGNS CONFIGURATION STEP
 * ========================================
 * 
 * Purpose: Fourth step for non-MMM analysis workflow
 * 
 * Description:
 * This component allows users to configure expected signs for all variables:
 * 1. Display all variables except target variable
 * 2. Allow setting expected signs (+ve, -ve, ~) for each variable
 * 3. Toggle between the three sign options
 * 4. Save configuration and proceed to next step
 * 
 * Key Features:
 * - Interactive sign selection for each variable
 * - Visual feedback for selected signs
 * - Toggle functionality between sign options
 * - Validation and confirmation before proceeding
 * 
 * Dependencies:
 * - AnalysisContext for state management
 * - Non-MMM specific types and interfaces
 * - UI components for interactive interface
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAnalysis } from '@/context/AnalysisContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, TrendingUp, TrendingDown, Minus, ArrowRight, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ExpectedSignsConfiguration, ExpectedSignVariable, EXPECTED_SIGNS } from '@/analysis/nonmmm/types/nonmmm';
import { NonMMMStateService } from '@/analysis/nonmmm/services/NonMMMStateService';
import { AlertCircle } from 'lucide-react';

interface ExpectedSignsStepState {
  expectedSigns: ExpectedSignVariable[];
  isProcessing: boolean;
  error: string | null;
  isComplete: boolean;
}

export function NonMMMExpectedSignsStep() {
  const { state, setAnalysisData, nextStep } = useAnalysis();
  const { toast } = useToast();
  
  const [stepState, setStepState] = useState<ExpectedSignsStepState>({
    expectedSigns: [],
    isProcessing: false,
    error: null,
    isComplete: false
  });

  // Initialize expected signs for all variables except target variable
  const initializeExpectedSigns = useCallback(() => {
    if (!state.analysisData?.sheets) return;

    const allColumns = new Set<string>();
    state.analysisData.sheets.forEach(sheet => {
      sheet.columns.forEach(col => {
        if (typeof col === 'string') {
          allColumns.add(col);
        } else if (col.name) {
          allColumns.add(col.name);
        }
      });
    });

    // Filter out target variable and create expected signs for all others
    const targetVariable = state.analysisData.targetVariable;
    const variablesForSigns = Array.from(allColumns).filter(col => col !== targetVariable);

    const expectedSigns: ExpectedSignVariable[] = variablesForSigns.map(colName => ({
      name: colName,
      expectedSign: 'neutral' as const,
      selectedAt: new Date().toISOString(),
      isConfirmed: false
    }));

    setStepState(prev => ({
      ...prev,
      expectedSigns
    }));
  }, [state.analysisData?.sheets, state.analysisData?.targetVariable]);

  // Initialize with existing expected signs if available
  useEffect(() => {
    if (state.analysisData?.targetVariable) {
      initializeExpectedSigns();
    }
  }, [state.analysisData?.targetVariable, initializeExpectedSigns]);

  // Handle sign selection for a variable
  const handleSignSelection = async (variableName: string, newSign: typeof EXPECTED_SIGNS[keyof typeof EXPECTED_SIGNS]) => {
    try {
      // Update local state immediately for responsive UI
      setStepState(prev => ({
        ...prev,
        expectedSigns: prev.expectedSigns.map(variable => 
          variable.name === variableName 
            ? { ...variable, expectedSign: newSign, selectedAt: new Date().toISOString() }
            : variable
        )
      }));

      // Save state immediately after every sign change
      if (state.currentAnalysisId) {
        const nonMMMStateService = NonMMMStateService.getInstance();
        await nonMMMStateService.saveStepState(
          state.currentAnalysisId,
          3, // Expected signs step
          1, // Substep 1 (sign selection)
          {
            type: 'expected_signs',
            targetVariable: state.analysisData?.targetVariable || '',
            variables: stepState.expectedSigns.map(v => 
              v.name === variableName 
                ? { ...v, expectedSign: newSign, selectedAt: new Date().toISOString() }
                : v
            ),
            configuredAt: new Date().toISOString(),
            isComplete: false
          },
          {
            variableChanged: variableName,
            newSign,
            totalVariables: stepState.expectedSigns.length,
            configuredVariables: stepState.expectedSigns.filter(v => v.expectedSign !== 'neutral').length
          },
          'expected_sign_changed'
        );

        console.log(`✅ Expected sign state saved for ${variableName}: ${newSign}`);
      }
    } catch (error) {
      console.error('❌ Error saving expected sign state:', error);
      // Revert local state if save failed
      setStepState(prev => ({
        ...prev,
        expectedSigns: prev.expectedSigns.map(variable => 
          variable.name === variableName 
            ? { ...variable, expectedSign: variable.expectedSign, selectedAt: variable.selectedAt }
            : variable
        )
      }));
      
      toast({
        title: "State Save Failed",
        description: "Failed to save expected sign change. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Toggle sign for a variable (cycle through +ve, -ve, ~)
  const toggleSign = (variableName: string) => {
    const currentVariable = stepState.expectedSigns.find(v => v.name === variableName);
    if (!currentVariable) return;

    const signOrder = [EXPECTED_SIGNS.POSITIVE, EXPECTED_SIGNS.NEGATIVE, EXPECTED_SIGNS.NEUTRAL];
    const currentIndex = signOrder.indexOf(currentVariable.expectedSign);
    const nextIndex = (currentIndex + 1) % signOrder.length;
    const nextSign = signOrder[nextIndex];

    handleSignSelection(variableName, nextSign);
  };

  // Get sign icon and color
  const getSignDisplay = (sign: string) => {
    switch (sign) {
      case EXPECTED_SIGNS.POSITIVE:
        return { icon: TrendingUp, color: 'text-secondary', bgColor: 'bg-secondary/10', borderColor: 'border-secondary/30' };
      case EXPECTED_SIGNS.NEGATIVE:
        return { icon: TrendingDown, color: 'text-destructive', bgColor: 'bg-destructive/10', borderColor: 'border-destructive/30' };
      case EXPECTED_SIGNS.NEUTRAL:
        return { icon: Minus, color: 'text-gray-600', bgColor: 'bg-gray-100', borderColor: 'border-gray-300' };
      default:
        return { icon: Minus, color: 'text-gray-600', bgColor: 'bg-gray-100', borderColor: 'border-gray-300' };
    }
  };

  // Handle confirmation and proceed to next step
  const handleConfirmExpectedSigns = async () => {
    if (stepState.expectedSigns.length === 0) {
      toast({
        title: "No Variables Available",
        description: "Please ensure you have uploaded data with variables",
        variant: "destructive"
      });
      return;
    }

    setStepState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Create expected signs configuration
      const expectedSignsConfig: ExpectedSignsConfiguration = {
        targetVariable: state.analysisData?.targetVariable || '',
        variables: stepState.expectedSigns,
        configuredAt: new Date().toISOString(),
        isComplete: true
      };

      // Update analysis data with expected signs
      const updatedAnalysisData = {
        ...state.analysisData,
        expectedSigns: expectedSignsConfig
      };

      setAnalysisData(updatedAnalysisData);

      toast({
        title: "Expected Signs Configured",
        description: `Successfully configured expected signs for ${stepState.expectedSigns.length} variables`,
      });

      // Mark step as complete and proceed
      setStepState(prev => ({ ...prev, isComplete: true }));
      nextStep();

    } catch (error) {
      console.error('Error confirming expected signs:', error);
      setStepState(prev => ({
        ...prev,
        error: 'Failed to confirm expected signs. Please try again.',
        isProcessing: false
      }));
      
      toast({
        title: "Error",
        description: "Failed to confirm expected signs. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Render expected signs configuration interface
  const renderExpectedSignsConfig = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Configure Expected Signs
        </CardTitle>
        <CardDescription>
          Set your expected relationship direction for each variable with the target variable
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stepState.expectedSigns.map((variable, index) => {
              const signDisplay = getSignDisplay(variable.expectedSign);
              const IconComponent = signDisplay.icon;
              
              return (
                <div
                  key={index}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${signDisplay.borderColor} ${signDisplay.bgColor}`}
                  onClick={() => toggleSign(variable.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">
                        {variable.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Click to change sign
                      </div>
                    </div>
                    <div className={`p-2 rounded-full ${signDisplay.bgColor}`}>
                      <IconComponent className={`h-5 w-5 ${signDisplay.color}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {stepState.expectedSigns.length > 0 && (
            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-primary" />
                <div>
                  <div className="font-medium text-primary">
                    Expected Signs Configuration
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Configured {stepState.expectedSigns.length} variables. Click on any variable to change its expected sign.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Render expected signs table
  const renderExpectedSignsTable = () => (
    <Card>
      <CardHeader>
        <CardTitle>Expected Signs Summary</CardTitle>
        <CardDescription>
          Overview of all configured expected signs for your variables
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto max-w-full">
          <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Variable Name</TableHead>
              <TableHead>Expected Sign</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stepState.expectedSigns.map((variable, index) => {
              const signDisplay = getSignDisplay(variable.expectedSign);
              const IconComponent = signDisplay.icon;
              
              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">{variable.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <IconComponent className={`h-4 w-4 ${signDisplay.color}`} />
                      <Badge variant="outline">
                        {variable.expectedSign === EXPECTED_SIGNS.POSITIVE ? '+ve' :
                         variable.expectedSign === EXPECTED_SIGNS.NEGATIVE ? '-ve' : '~'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {variable.expectedSign === EXPECTED_SIGNS.POSITIVE ? 'Positive relationship expected' :
                     variable.expectedSign === EXPECTED_SIGNS.NEGATIVE ? 'Negative relationship expected' : 'No specific relationship expected'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">Configured</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );

  // Render action buttons
  const renderActionButtons = () => (
    <div className="flex justify-center">
      <Button
        onClick={handleConfirmExpectedSigns}
        disabled={stepState.expectedSigns.length === 0 || stepState.isProcessing}
        size="lg"
        className="px-8"
      >
        {stepState.isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Confirming...
          </>
        ) : (
          <>
            Continue to Data Summary
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );

  // Render error display
  const renderError = () => {
    if (!stepState.error) return null;

    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{stepState.error}</AlertDescription>
      </Alert>
    );
  };

  // Render information card
  const renderInformation = () => (
    <Card>
      <CardHeader>
        <CardTitle>Understanding Expected Signs</CardTitle>
        <CardDescription>
          How expected signs help guide your analysis and model interpretation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <TrendingUp className="h-8 w-8 text-secondary" />
            </div>
            <h4 className="font-medium text-gray-900">Positive (+ve)</h4>
            <p className="text-sm text-gray-600">
              You expect this variable to have a positive relationship with your target variable
            </p>
            <div className="text-xs text-gray-500">
              Example: Higher advertising spend → Higher sales
            </div>
          </div>
          
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <TrendingDown className="h-8 w-8 text-destructive" />
            </div>
            <h4 className="font-medium text-gray-900">Negative (-ve)</h4>
            <p className="text-sm text-gray-600">
              You expect this variable to have a negative relationship with your target variable
            </p>
            <div className="text-xs text-gray-500">
              Example: Higher price → Lower demand
            </div>
          </div>
          
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <Minus className="h-8 w-8 text-gray-600" />
            </div>
            <h4 className="font-medium text-gray-900">Neutral (~)</h4>
            <p className="text-sm text-gray-600">
              You have no specific expectation about the relationship direction
            </p>
            <div className="text-xs text-gray-500">
              Example: Unknown or exploratory variables
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gradient-primary">Configure Expected Signs</h1>
        <p className="text-muted-foreground">
          Set your expectations for how each variable relates to your target variable
        </p>
      </div>

      {/* Error Display */}
      {renderError()}

      {/* Expected Signs Configuration */}
      {renderExpectedSignsConfig()}

      {/* Expected Signs Table */}
      {renderExpectedSignsTable()}

      {/* Action Buttons */}
      {renderActionButtons()}

      {/* Information */}
      {renderInformation()}
    </div>
  );
}
