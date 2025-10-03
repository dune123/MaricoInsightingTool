/**
 * ========================================
 * NON-MMM CHART ANALYSIS STEP
 * ========================================
 * 
 * Purpose: Fifth step for non-MMM analysis workflow
 * 
 * Description:
 * This component generates charts for each variable against the target variable:
 * 1. Line charts with trendlines (target variable vs other variable vs month)
 * 2. Scatter plots with trendlines (target variable vs other variable)
 * 3. Trendline customization (linear, polynomial-2, polynomial-3)
 * 4. Expected vs unexpected result filtering
 * 
 * Key Features:
 * - Line charts and scatter plots for each variable
 * - Trendline customization options
 * - Expected vs unexpected result filtering
 * - Custom chart creation
 * - Bulk variable deletion functionality
 * - Chart container selection for deletion
 * - Target variable protection during deletion
 * 
 * Dependencies:
 * - AnalysisContext for state management
 * - Non-MMM specific types and interfaces
 * - Chart components for visualization
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 * Enhanced: Added bulk variable deletion functionality with chart container selection
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '@/context/AnalysisContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowRight, Filter, Plus, Trash2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NonMMMChartContainer } from '../components/NonMMMChartContainer';
import { NonMMMChartAnalysisService, ChartData } from '../services/NonMMMChartAnalysisService';
import { NonMMMStateService } from '../services/NonMMMStateService';
import { DataStructureSummary } from '@/components/DataStructureSummary';

export function NonMMMChartAnalysisStep() {
  const { state: analysisContext } = useAnalysis();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'expected' | 'unexpected'>('all');
  const [isContinuing, setIsContinuing] = useState(false);
  const chartsGeneratedRef = useRef(false);
  
  // Get analysis state
  const [nonmmmState, setNonmmmState] = useState<Record<string, unknown> | null>(null);
  const [analysisId, setAnalysisId] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [targetVariable, setTargetVariable] = useState<string>('');
  const [expectedSigns, setExpectedSigns] = useState<Record<string, string>>({});

  // Delete functionality state
  const [isDeleteMode, setIsDeleteMode] = useState<boolean>(false);
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set());
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Debug logging for state - only log when state actually changes
  const prevStateRef = useRef({
    analysisId: '',
    brand: '',
    filename: '',
    targetVariable: '',
    expectedSignsCount: 0
  });

  useEffect(() => {
    const currentState = {
      analysisId,
      brand,
      filename,
      targetVariable,
      expectedSignsCount: Object.keys(expectedSigns).length
    };

    // Only log if state has actually changed
    const hasChanged = Object.keys(currentState).some(key => 
      currentState[key as keyof typeof currentState] !== prevStateRef.current[key as keyof typeof prevStateRef.current]
    );

    if (hasChanged) {
      console.log('🔍 Chart Analysis Step - Current State:', {
        nonmmmState: !!nonmmmState,
        ...currentState
      });
      prevStateRef.current = currentState;
    }
  }, [analysisId, brand, filename, targetVariable, expectedSigns, nonmmmState]);

  useEffect(() => {
    const loadState = async () => {
      const state = await NonMMMStateService.getNonMMMState();
      setNonmmmState(state);
      
      // Reset chartsGeneratedRef for new analysis
      if (state && state.analysisId !== analysisId) {
        chartsGeneratedRef.current = false;
      }
    };
    loadState();
  }, [analysisId]);

  // Extract data from state when it's loaded and hydrate charts if they exist
  useEffect(() => {
    if (nonmmmState) {
      // SIMPLIFIED: Get data from ONE primary source
      const stepData = nonmmmState?.stepData as Record<string, unknown> || {};
      
      // Use analysisContext as primary source, fallback to state
      const extractedAnalysisId = analysisContext?.currentAnalysisId || nonmmmState?.analysisId as string || '';
      const extractedBrand = analysisContext?.selectedBrand || nonmmmState?.brandName as string || stepData?.brandName as string || '';
      const extractedFilename = (analysisContext?.analysisData as { filename?: string })?.filename || nonmmmState?.uploadedFile as string || stepData?.uploadedFile as string || '';
      const extractedTargetVariable = nonmmmState?.targetVariable as string || stepData?.targetVariable as string || '';
      const extractedExpectedSigns = (nonmmmState?.expectedSigns as Record<string, string>) || (stepData?.expectedSigns as Record<string, string>) || {};

      setAnalysisId(extractedAnalysisId);
      setBrand(extractedBrand);
      setFilename(extractedFilename);
      setTargetVariable(extractedTargetVariable);
      setExpectedSigns(extractedExpectedSigns);

      console.log('📊 Extracted data from state:', {
        analysisId: extractedAnalysisId,
        brand: extractedBrand,
        filename: extractedFilename,
        targetVariable: extractedTargetVariable,
        expectedSignsCount: Object.keys(extractedExpectedSigns).length
      });
    }
  }, [nonmmmState, analysisContext]);

  // Simple chart hydration - check if charts were already generated for this analysis
  useEffect(() => {
    if (isContinuing) return; // Don't run any chart operations when continuing
    
    if (nonmmmState && analysisId && !chartsGeneratedRef.current) {
      const stepData = nonmmmState?.stepData as Record<string, unknown> || {};
      const chartsGenerated = (nonmmmState?.chartsGenerated as boolean) || (stepData?.chartsGenerated as boolean) || false;
      const savedChartData = (nonmmmState?.chartData as ChartData[]) || (stepData?.chartData as ChartData[]) || [];
      
      // Only log once per analysis
      if (!chartsGeneratedRef.current) {
        console.log('🔍 Chart hydration check:', {
          chartsGenerated,
          savedChartDataLength: savedChartData.length,
          hasNonmmmState: !!nonmmmState,
          analysisId
        });
      }
      
      if (chartsGenerated && savedChartData.length > 0) {
        console.log('🔄 Charts already generated for this analysis, hydrating...');
        // Ensure trendlineType is set for all charts
        const hydratedCharts = savedChartData.map(chart => ({
          ...chart,
          trendlineType: chart.trendlineType || 'linear'
        }));
        setCharts(hydratedCharts);
        chartsGeneratedRef.current = true;
        setLoading(false);
        console.log('✅ Charts hydrated successfully');
      } else if (savedChartData.length > 0) {
        // Even if chartsGenerated flag is missing, if we have chart data, hydrate it
        console.log('🔄 Found saved chart data, hydrating even without chartsGenerated flag...');
        // Ensure trendlineType is set for all charts
        const hydratedCharts = savedChartData.map(chart => ({
          ...chart,
          trendlineType: chart.trendlineType || 'linear'
        }));
        setCharts(hydratedCharts);
        chartsGeneratedRef.current = true;
        setLoading(false);
        console.log('✅ Charts hydrated from saved data');
      } else {
        console.log('🔄 No charts generated yet, allowing generation');
        setLoading(false);
      }
    }
  }, [nonmmmState, analysisId, isContinuing]);

  const generateCharts = useCallback(async () => {
    if (isContinuing) return; // Don't generate charts when continuing
    
    if (chartsGeneratedRef.current) {
      console.log('🔄 Charts already exist locally, skipping generation...');
      return;
    }
    
    // SIMPLIFIED: Only check the ref - if charts were generated, don't generate again
    
    try {
      // Set loading to true for chart generation
      setLoading(true);
      console.log('🚀 Starting chart generation process...');
      console.log('📊 Current state:', { brand, filename, targetVariable });
      console.log('🎯 Expected signs count:', Object.keys(expectedSigns).length);
      console.log('📋 Expected signs:', expectedSigns);
      
      // Simple flag to prevent auto-sync during chart generation
      console.log('🚀 Starting chart generation - preventing auto-sync');
      
      // Validate that we have the required data
      if (!brand || !filename || !targetVariable) {
        throw new Error('Missing required data: brand, filename, or target variable');
      }
      
      if (Object.keys(expectedSigns).length === 0) {
        throw new Error('No expected signs configured. Please go back and configure expected signs.');
      }
      
      const request = {
        brand,
        filename,
        targetVariable,
        independentVariables: Object.keys(expectedSigns),
        expectedSigns,
        trendlineType: 'linear' // Default to linear trendline
      };

      console.log('📤 Sending request to chart service:', request);

      const result = await NonMMMChartAnalysisService.generateChartAnalysis(request);
      
      console.log('📥 Chart service response:', result);
      
      if (result.success && result.data) {
        console.log('✅ Charts generated successfully!');
        console.log('📈 Number of charts:', result.data.charts?.length || 0);
        if (result.data.charts && result.data.charts.length > 0) {
          console.log('📊 First chart sample:', result.data.charts[0]);
        }
        
        // Validate chart data structure
        if (!result.data.charts || !Array.isArray(result.data.charts)) {
          throw new Error('Invalid chart data structure received from backend');
        }
        
        // The service already transforms the data, so we can use it directly
        // Just update the expected result calculation based on our current expected signs
        const chartsWithIndividualTrendlines: ChartData[] = result.data.charts.map((chart: ChartData) => {
          const expectedSign = expectedSigns[chart.variable as string] || 'neutral';
          const slope = chart.scatterPlot?.slope || 0;
          
          // Calculate if result is expected based on slope and expected sign
          let isExpectedResult = true;
          if (expectedSign === 'positive' && slope <= 0) {
            isExpectedResult = false;
          } else if (expectedSign === 'negative' && slope >= 0) {
            isExpectedResult = false;
          } else if (expectedSign === 'neutral') {
            isExpectedResult = true;
          }
          
          return {
            ...chart,
            isExpectedResult: isExpectedResult,
            expectedSign: expectedSign,
            trendlineType: chart.trendlineType || 'linear' // Set default trendline type
          };
        });
        
        setCharts(chartsWithIndividualTrendlines);
        chartsGeneratedRef.current = true; // Mark charts as generated - NEVER RESETS
        
        // SIMPLIFIED: Save chart state once
        if (analysisId) {
          console.log('💾 Saving chart state...');
          const currentState = await NonMMMStateService.getNonMMMState() || {};
          await NonMMMStateService.saveNonMMMState({
            ...currentState,
            chartData: chartsWithIndividualTrendlines,
            chartsGenerated: true,
            lastUpdated: new Date().toISOString()
          });
          console.log('✅ Chart state saved successfully');
        }
      } else {
        console.error('❌ Chart generation failed:', result.error);
        throw new Error(result.error || 'Failed to generate charts');
      }
    } catch (error) {
      console.error('❌ Error generating charts:', error);
      
      // Simple error handling
      console.error('❌ Chart generation failed:', error);
      
      toast({
        title: "Chart Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate charts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('🏁 Chart generation process completed');
    }
  }, [brand, filename, targetVariable, expectedSigns, analysisId, toast, isContinuing]);

  // Auto-generate charts when all data is available - simplified logic
  useEffect(() => {
    if (isContinuing) return; // Don't run any chart operations when continuing
    
    // SIMPLIFIED: Only generate if we have all required data and haven't generated charts yet
    if (analysisId && brand && filename && targetVariable && !loading && !chartsGeneratedRef.current) {
      console.log('✅ All data available, generating charts...');
      generateCharts();
    }
  }, [analysisId, brand, filename, targetVariable, loading, generateCharts, isContinuing]);

  // Set step as valid when charts are loaded and ready
  useEffect(() => {
    if (charts.length > 0 && !loading) {
      // Notify the wizard that this step is valid
      // This will enable the Next button
      console.log('✅ Chart analysis step is valid - enabling Next button');
    }
  }, [charts.length, loading]);

  const handleTrendlineChange = async (variable: string, newType: string) => {
    console.log('🔄 Trendline change requested:', { variable, newType });
    
    // Update the trendline type for the specific chart only
    setCharts(prevCharts => 
      prevCharts.map(chart => 
        chart.variable === variable 
          ? { ...chart, trendlineType: newType }
          : chart
      )
    );
    
    console.log('✅ Trendline type updated for', variable, 'to:', newType);
  };

  const handleDeleteVariable = async (variable: string) => {
    console.log('🗑️ Delete variable requested:', { variable, filename, brand });
    
    try {
      // Call the backend to delete the column
      const result = await NonMMMChartAnalysisService.deleteColumn(filename, variable, brand);
      
      if (result.success) {
        // Remove the chart from the local state
        setCharts(prevCharts => 
          prevCharts.filter(chart => chart.variable !== variable)
        );
        
        // Update the expected signs to remove the deleted variable
        const updatedExpectedSigns = { ...expectedSigns };
        delete updatedExpectedSigns[variable];
        
        // Save the updated state
        if (analysisContext?.currentAnalysisId) {
          const currentState = await NonMMMStateService.getNonMMMState() || {};
          await NonMMMStateService.saveNonMMMState({
            ...currentState,
            analysisId: analysisContext.currentAnalysisId,
            expectedSigns: updatedExpectedSigns,
            lastUpdated: new Date().toISOString()
          });
        }
        
        toast({
          title: "Variable Deleted",
          description: `Variable "${variable}" has been successfully deleted from the data file.`,
        });
        
        console.log('✅ Variable deleted successfully:', result.data);
      }
    } catch (error) {
      console.error('❌ Error deleting variable:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete variable",
        variant: "destructive",
      });
    }
  };

  // Bulk delete functionality handlers
  const handleToggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    if (isDeleteMode) {
      setSelectedForDeletion(new Set());
    }
  };

  const handleChartSelectForDeletion = (variableName: string) => {
    if (!isDeleteMode) return;
    
    // Prevent deletion of target variable
    if (variableName === targetVariable) {
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

  const handleConfirmBulkDelete = async () => {
    if (selectedForDeletion.size === 0) return;

    setIsDeleting(true);
    try {
      const variablesToDelete = Array.from(selectedForDeletion);
      
      // Call backend to delete variables
      const deletePromises = variablesToDelete.map(variableName => 
        NonMMMChartAnalysisService.deleteColumn(filename, variableName, brand)
      );
      
      const results = await Promise.all(deletePromises);
      const allSuccessful = results.every(result => result && result.success);
      
      if (allSuccessful) {
        // Update local state by removing deleted charts
        setCharts(prevCharts => 
          prevCharts.filter(chart => !selectedForDeletion.has(chart.variable))
        );
        
        // Remove from expected signs and get the updated signs
        const updatedExpectedSigns = { ...expectedSigns };
        variablesToDelete.forEach(variableName => {
          delete updatedExpectedSigns[variableName];
        });
        setExpectedSigns(updatedExpectedSigns);

        // Save updated state
        const currentState = await NonMMMStateService.getNonMMMState() || {};
        await NonMMMStateService.saveNonMMMState({
          ...currentState,
          expectedSigns: updatedExpectedSigns,
          lastUpdated: new Date().toISOString()
        });

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

  const handleCancelBulkDelete = () => {
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

  const handleContinue = async () => {
    // Set continuing flag to prevent all chart operations
    setIsContinuing(true);
    
    // Prepare state updates for single save operation
    let stateUpdates: Record<string, unknown> = {
      analysisId: analysisContext?.currentAnalysisId || analysisId,
      brand: brand,
      uploadedFile: filename,
      targetVariable: targetVariable,
      expectedSigns: expectedSigns,
      currentStep: 4,
      chartAnalysisCompleted: true,
      chartsGenerated: true,
      expectedResults: charts.filter(c => c.isExpectedResult).length,
      chartData: charts,
      lastUpdated: new Date().toISOString()
    };

    // Auto-standardize data with min-max scaling for all variables (including target variable)
    try {
      console.log('🔍 Auto-Standardization Debug Info:', {
        filename,
        brand,
        analysisId,
        targetVariable
      });
      
      // If analysis ID is not in state, generate one and save it
      if (!analysisId) {
        const newAnalysisId = `nonmmm_${brand.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
        const currentState = await NonMMMStateService.getNonMMMState() || {};
        await NonMMMStateService.saveNonMMMState({
          ...currentState,
          analysisId: newAnalysisId,
          lastUpdated: new Date().toISOString()
        });
        console.log('💾 Generated and saved analysis ID to NonMMM state:', newAnalysisId);
      }

      if (filename && brand && analysisId && analysisId !== 'undefined') {
        console.log('🔄 Auto-creating standardized data with min-max scaling...');
        
        const response = await fetch('http://localhost:8000/api/nonmmm/create-standardized-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: filename,
            brand: brand,
            analysisId: analysisId,
            method: 'minmax' // Use min-max scaling as requested
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            console.log('✅ Auto-standardized data created successfully:', result.data);
            
            // Add standardization info to prepared state updates
            stateUpdates = {
              ...stateUpdates,
              standardizedFile: result.data.standardizedFilename,
              standardizationMethod: 'minmax',
              standardizationCompleted: true,
              standardizationMetadata: result.data.metadata
            };
            
            console.log('✅ Auto-standardized data state updated, proceeding to model building');
          } else {
            console.error('❌ Auto-standardized data creation failed:', result.message);
            throw new Error(`Auto-standardized data creation failed: ${result.message}`);
          }
        } else {
          const errorText = await response.text();
          console.error('❌ Failed to create auto-standardized data:', response.status, errorText);
          throw new Error(`Failed to create auto-standardized data: ${response.status} ${errorText}`);
        }
      } else {
        console.error('❌ Missing required data for auto-standardization:', { filename, brand, analysisId });
        throw new Error(`Missing required data for auto-standardization. Analysis ID: ${analysisId}, Filename: ${filename}, Brand: ${brand}`);
      }
    } catch (error) {
      console.error('❌ Error creating auto-standardized data:', error);
      toast({
        title: "Auto-Standardization Failed",
        description: "Failed to create standardized data automatically. Please try again or contact support.",
        variant: "destructive"
      });
      return; // Stop navigation if standardization fails
    }

    // Single save operation with all updates
    try {
      const currentState = await NonMMMStateService.getNonMMMState() || {};
      await NonMMMStateService.saveNonMMMState({
        ...currentState,
        ...stateUpdates
      });
      console.log('✅ All state updates saved in single operation');
    } catch (error) {
      console.error('❌ Failed to save final state:', error);
    }

    toast({
      title: "Chart Analysis Complete",
      description: `Data has been auto-standardized with min-max scaling. Proceeding to model building.`,
    });
    
    // Navigate immediately - no delay needed
    console.log('🚀 Navigating to Model Building step...');
    navigate('/nonmmm/modeling');
  };

  const filteredCharts = charts.filter(chart => {
    if (filter === 'expected') return chart.isExpectedResult;
    if (filter === 'unexpected') return !chart.isExpectedResult;
    return true;
  });

  const expectedCount = charts.filter(c => c.isExpectedResult).length;
  const unexpectedCount = charts.filter(c => !c.isExpectedResult).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto px-6 lg:px-12 space-y-12">
          {/* Premium Loading Header */}
          <div className="text-center space-y-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-xl border border-primary/30 rounded-3xl mb-8 shadow-2xl shadow-primary/10">
              <div className="text-4xl animate-pulse">📊</div>
            </div>
            
            <div className="space-y-6">
              <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
                <span className="text-gradient-primary">Chart Analysis</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mx-auto max-w-4xl leading-relaxed font-light">
                Generating charts for{' '}
                <span className="font-semibold text-gradient-secondary">{targetVariable}</span>
              </p>
            </div>
          </div>

          {/* Premium Loading Animation */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-primary/10"></div>
            </div>
          </div>

          {/* Premium Debug Info */}
          <Card className="card-premium bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-xl border border-border/60">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-muted-foreground">Analysis Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Brand:</span>
                    <span className="font-medium">{brand || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Filename:</span>
                    <span className="font-medium">{filename || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target Variable:</span>
                    <span className="font-medium">{targetVariable || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected Signs:</span>
                    <span className="font-medium">{Object.keys(expectedSigns).length} variables</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!targetVariable) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto px-6 lg:px-12 space-y-12">
          {/* Premium Error Header */}
          <div className="text-center space-y-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-500/20 to-rose-500/20 backdrop-blur-xl border border-red-500/30 rounded-3xl mb-8 shadow-2xl shadow-red-500/10">
              <div className="text-4xl">⚠️</div>
            </div>
            
            <div className="space-y-6">
              <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
                <span className="text-gradient-primary">Chart Analysis</span>
              </h1>
              <p className="text-xl md:text-2xl text-red-600 mx-auto max-w-4xl leading-relaxed font-medium">
                No target variable selected. Please go back and select a target variable.
              </p>
            </div>
          </div>

          {/* Premium Debug Info */}
          <Card className="card-premium bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-xl border border-border/60">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-muted-foreground">Current Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Brand:</span>
                    <span className="font-medium">{brand || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Filename:</span>
                    <span className="font-medium">{filename || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected Signs:</span>
                    <span className="font-medium">{Object.keys(expectedSigns).length} variables</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NonMMM State:</span>
                    <span className="font-medium">{nonmmmState ? 'Available' : 'Missing'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-7xl mx-auto px-8 lg:px-16 space-y-16">
        {/* Premium Hero Header */}
        <div className="text-center space-y-8 pt-8">

          {/* Premium Typography with Gradients */}
          <div className="space-y-6">
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
              <span className="text-gradient-primary">Chart Analysis</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mx-auto max-w-4xl leading-relaxed font-light">
              Analyzing relationships between{' '}
              <span className="font-semibold text-gradient-secondary">{targetVariable}</span>{' '}
              and all independent variables
            </p>
          </div>
          
          {/* Premium Feature Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm font-medium">
            <div className="flex items-center gap-3 px-6 py-3 bg-primary/5 border border-primary/20 rounded-2xl backdrop-blur-sm">
              <div className="w-3 h-3 bg-gradient-to-r from-primary to-primary/70 rounded-full shadow-lg shadow-primary/30"></div>
              <span className="text-primary font-semibold">Time Series Analysis</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-secondary/5 border border-secondary/20 rounded-2xl backdrop-blur-sm">
              <div className="w-3 h-3 bg-gradient-to-r from-secondary to-secondary/70 rounded-full shadow-lg shadow-secondary/30"></div>
              <span className="text-secondary font-semibold">Correlation Analysis</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-accent/5 border border-accent/20 rounded-2xl backdrop-blur-sm">
              <div className="w-3 h-3 bg-gradient-to-r from-accent to-accent/70 rounded-full shadow-lg shadow-accent/30"></div>
              <span className="text-accent font-semibold">Trendline Fitting</span>
            </div>
          </div>
        </div>

        {/* Data Structure Summary - Persistent Component */}
        {charts.length > 0 && (
          <DataStructureSummary
            columns={[targetVariable, ...charts.map(c => c.variable)]}
            rowCount={charts[0]?.lineChartData?.datasets[0]?.data.length || 0}
            className="max-w-4xl mx-auto"
          />
        )}

        {/* Delete Mode Indicator */}
        {isDeleteMode && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-center gap-2 text-red-700">
                <Trash2 className="h-5 w-5" />
                <span className="font-medium">Delete Mode Active</span>
                <span className="text-sm">- Click on chart containers to select them for deletion</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Premium Analysis Filters */}
        <Card className="card-premium bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-xl border border-border/60 shadow-xl shadow-primary/5">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border/40 p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-3">
                <CardTitle className="flex items-center gap-4 text-3xl font-bold">
                  <div className="p-3 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl">
                    <Filter className="h-8 w-8 text-primary" />
                  </div>
                  <span className="text-gradient-primary">Analysis Filters</span>
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground font-medium">
                  Filter charts by expected vs unexpected results
                </CardDescription>
              </div>

            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-wrap gap-6">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                size="lg"
                className={`px-10 py-4 text-lg font-semibold rounded-2xl transition-all duration-300 ${
                  filter === 'all' 
                    ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transform hover:-translate-y-0.5' 
                    : 'border-2 border-border hover:border-primary/30 hover:bg-primary/5'
                }`}
              >
                All Results ({charts.length})
              </Button>
              <Button
                variant={filter === 'expected' ? 'default' : 'outline'}
                onClick={() => setFilter('expected')}
                size="lg"
                className={`px-10 py-4 text-lg font-semibold rounded-2xl transition-all duration-300 ${
                  filter === 'expected' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transform hover:-translate-y-0.5' 
                    : 'border-2 border-border hover:border-green-500/30 hover:bg-green-500/5'
                }`}
              >
                Expected Results ({expectedCount})
              </Button>
              <Button
                variant={filter === 'unexpected' ? 'default' : 'outline'}
                onClick={() => setFilter('unexpected')}
                size="lg"
                className={`px-10 py-4 text-lg font-semibold rounded-2xl transition-all duration-300 ${
                  filter === 'unexpected' 
                    ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 transform hover:-translate-y-0.5' 
                    : 'border-2 border-border hover:border-red-500/30 hover:bg-red-500/5'
                }`}
              >
                Unexpected Results ({unexpectedCount})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Premium Charts Grid */}
        <div className="space-y-12">
          {filteredCharts.length > 0 ? (
            filteredCharts.map((chart) => (
              <div 
                key={chart.id} 
                className={`animate-fade-in-up transition-all ${
                  isDeleteMode && selectedForDeletion.has(chart.variable)
                    ? 'ring-2 ring-red-500 bg-red-50/30 rounded-lg p-2'
                    : ''
                }`}
                onClick={() => {
                  if (isDeleteMode) {
                    handleChartSelectForDeletion(chart.variable);
                  }
                }}
                style={{ cursor: isDeleteMode ? 'pointer' : 'default' }}
              >
                <NonMMMChartContainer
                  variable={chart.variable}
                  targetVariable={chart.targetVariable}
                  lineChart={chart.lineChart}
                  scatterPlot={chart.scatterPlot}
                  trendlineType={chart.trendlineType}
                  isExpectedResult={chart.isExpectedResult}
                  expectedSign={chart.expectedSign}
                  onTrendlineChange={handleTrendlineChange}
                  onDelete={handleDeleteVariable}
                />
              </div>
            ))
          ) : (
            <Card className="card-premium border-2 border-dashed border-border/60 bg-gradient-to-br from-muted/20 to-muted/10">
              <CardContent className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-muted/20 to-muted/10 rounded-3xl mb-8">
                  <div className="text-6xl">📊</div>
                </div>
                <h3 className="text-2xl font-bold text-muted-foreground mb-4">No Charts Available</h3>
                <p className="text-lg text-muted-foreground/80">No charts match the current filter criteria.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Premium Continue Button */}
        <div className="flex justify-center pt-16">
          <Button 
            onClick={handleContinue} 
            size="xl" 
            disabled={isDeleteMode || isContinuing}
            className="px-20 py-8 text-2xl font-bold bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-3xl shadow-2xl shadow-primary/25 hover:shadow-3xl hover:shadow-primary/30 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">{isContinuing ? '⏳' : '🚀'}</div>
              <span>{isContinuing ? 'Processing...' : 'Continue to Model Building'}</span>
              {!isContinuing && <ArrowRight className="h-8 w-8" />}
            </div>
          </Button>
        </div>
      </div>

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
              onClick={handleCancelBulkDelete}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmBulkDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
    </div>
  );
}
