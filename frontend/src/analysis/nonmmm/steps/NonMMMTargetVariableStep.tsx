/**
 * ========================================
 * NON-MMM TARGET VARIABLE SELECTION STEP
 * ========================================
 * 
 * Purpose: Third step for non-MMM analysis workflow
 * 
 * Description:
 * This component allows users to select a target variable for analysis:
 * 1. Display all available columns from uploaded data
 * 2. Allow clicking on any column to select as target variable
 * 3. Show selected target variable with confirmation
 * 4. Enable proceeding to next step once target is selected
 * 
 * Key Features:
 * - Interactive column selection interface
 * - Visual feedback for selected target variable
 * - Column type and data information display
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

import React, { useState, useEffect } from 'react';
import { useAnalysis } from '@/context/AnalysisContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Target, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NonMMMColumnData } from '@/analysis/nonmmm/types/nonmmm';

interface TargetVariableStepState {
  selectedTargetVariable: string | null;
  isProcessing: boolean;
  error: string | null;
}

export function NonMMMTargetVariableStep() {
  const { state, setAnalysisData, nextStep } = useAnalysis();
  const { toast } = useToast();
  
  const [stepState, setStepState] = useState<TargetVariableStepState>({
    selectedTargetVariable: null,
    isProcessing: false,
    error: null
  });

  // Initialize with existing target variable if available
  useEffect(() => {
    if (state.analysisData?.targetVariable) {
      setStepState(prev => ({
        ...prev,
        selectedTargetVariable: state.analysisData.targetVariable
      }));
    }
  }, [state.analysisData?.targetVariable]);

  // Handle column selection
  const handleColumnSelection = (columnName: string) => {
    setStepState(prev => ({
      ...prev,
      selectedTargetVariable: columnName,
      error: null
    }));

    toast({
      title: "Target Variable Selected",
      description: `"${columnName}" has been selected as your target variable`,
    });
  };

  // Handle target variable confirmation
  const handleConfirmTargetVariable = async () => {
    if (!stepState.selectedTargetVariable) {
      toast({
        title: "No Target Variable Selected",
        description: "Please select a target variable before proceeding",
        variant: "destructive"
      });
      return;
    }

    setStepState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Update analysis data with target variable
      const updatedAnalysisData = {
        ...state.analysisData,
        targetVariable: stepState.selectedTargetVariable,
        targetVariableMetadata: {
          selectedAt: new Date().toISOString(),
          category: 'user-selected',
          selectionStep: 'target-variable-selection'
        }
      };

      setAnalysisData(updatedAnalysisData);

      toast({
        title: "Target Variable Confirmed",
        description: `"${stepState.selectedTargetVariable}" is now your target variable for analysis`,
      });

      // Proceed to next step
      nextStep();

    } catch (error) {
      console.error('Error confirming target variable:', error);
      setStepState(prev => ({
        ...prev,
        error: 'Failed to confirm target variable. Please try again.',
        isProcessing: false
      }));
      
      toast({
        title: "Error",
        description: "Failed to confirm target variable. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Get available columns from analysis data
  const getAvailableColumns = (): NonMMMColumnData[] => {
    if (!state.analysisData?.sheets) return [];

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

    return Array.from(allColumns).map(colName => ({
      name: colName,
      type: 'unknown',
      dataType: 'string',
      isTargetVariable: colName === stepState.selectedTargetVariable,
      isSelected: false
    }));
  };

  const availableColumns = getAvailableColumns();

  // Render column selection interface
  const renderColumnSelection = () => (
    <Card>
      <CardHeader>
                  <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Select Target Variable
          </CardTitle>
        <CardDescription>
          Click on any column below to select it as your target variable for analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableColumns.map((column, index) => (
              <div
                key={index}
                                 className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                   column.isTargetVariable
                     ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                     : 'border-border hover:border-primary/30'
                 }`}
                onClick={() => handleColumnSelection(column.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">
                      {column.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Type: {column.type} • Data: {column.dataType}
                    </div>
                  </div>
                                     {column.isTargetVariable && (
                     <CheckCircle className="h-5 w-5 text-primary" />
                   )}
                </div>
              </div>
            ))}
          </div>

          {stepState.selectedTargetVariable && (
                         <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
               <div className="flex items-center gap-3">
                 <CheckCircle className="h-6 w-6 text-primary" />
                 <div>
                   <div className="font-medium text-primary">
                     Target Variable Selected
                   </div>
                   <div className="text-sm text-muted-foreground">
                     "{stepState.selectedTargetVariable}" will be used as your dependent variable
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Render column details table
  const renderColumnDetails = () => (
    <Card>
      <CardHeader>
        <CardTitle>Column Information</CardTitle>
        <CardDescription>
          Detailed view of all available columns in your dataset
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto max-w-full">
          <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Column Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Data Type</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {availableColumns.map((column, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{column.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{column.type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{column.dataType}</Badge>
                </TableCell>
                <TableCell>
                  {column.isTargetVariable ? (
                    <Badge variant="default">Target Variable</Badge>
                  ) : (
                    <Badge variant="outline">Available</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
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
        onClick={handleConfirmTargetVariable}
        disabled={!stepState.selectedTargetVariable || stepState.isProcessing}
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
            Continue to Expected Signs
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
        <CardTitle>About Target Variables</CardTitle>
        <CardDescription>
          Understanding how target variables work in your analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">What is a Target Variable?</h4>
            <p className="text-sm text-gray-600">
              The target variable (also called dependent variable) is what you want to predict 
              or understand. It's the outcome you're trying to explain using other variables.
            </p>
            <div className="text-xs text-gray-500">
              Examples: Sales volume, customer satisfaction, conversion rate
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">How to Choose?</h4>
            <p className="text-sm text-gray-600">
              Select a variable that represents your business objective or the outcome 
              you want to analyze. It should be measurable and relevant to your goals.
            </p>
            <div className="text-xs text-gray-500">
              Tip: Choose a variable that directly impacts your business decisions
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
        <h1 className="text-3xl font-bold text-gradient-primary">Select Target Variable</h1>
        <p className="text-muted-foreground">
          Choose which variable you want to predict or analyze in your non-MMM analysis
        </p>
      </div>

      {/* Error Display */}
      {renderError()}

      {/* Column Selection */}
      {renderColumnSelection()}

      {/* Column Details */}
      {renderColumnDetails()}

      {/* Action Buttons */}
      {renderActionButtons()}

      {/* Information */}
      {renderInformation()}
    </div>
  );
}
