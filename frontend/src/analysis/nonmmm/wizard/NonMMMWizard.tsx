/**
 * ========================================
 * BRANDBLOOM INSIGHTS - NON-MMM WIZARD
 * ========================================
 * 
 * Purpose: Main wizard orchestrator for Non-MMM analysis workflow
 * 
 * Description:
 * The central component that manages the complete Non-MMM analysis pipeline
 * from brand setup through model results. This component handles step routing,
 * navigation logic, validation rules, and step-specific rendering.
 * 
 * Current Step Configuration (8 steps):
 * 1. [SKIPPED] Analysis Type Selection - handled in DataScientistWizard
 * 2. Data Upload (First Step)
 * 3. Target Variable Selection
 * 4. Expected Signs Configuration
 * 5. Data Summary
 * 6. Data Distribution
 * 7. Chart Analysis
 * 8. Model Building
 * 9. Model Results
 * 
 * Key Features:
 * - Starts directly at data upload step (brand setup handled in DataScientistWizard)
 * - Streamlined workflow from data upload to model results
 * - Statistical analysis and modeling pipeline
 * - Step-by-step data processing and visualization
 * 
 * Dependencies:
 * - All Non-MMM step components for rendering
 * - Non-MMM state service for persistence
 * - Non-MMM types for data structures
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Home, TrendingUp, BarChart3, Zap, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LayoutWrapper } from '@/components/wizard/LayoutWrapper';

// Lazy load non-MMM components to prevent them from being loaded on app startup
const NonMMMDataUploadStep = lazy(() => import('@/analysis/nonmmm/steps/NonMMMDataUploadStep').then(module => ({ default: module.NonMMMDataUploadStep })));
const NonMMMDataSummaryStep = lazy(() => import('@/analysis/nonmmm/steps/NonMMMDataSummaryStep').then(module => ({ default: module.NonMMMDataSummaryStep })));
const NonMMMChartAnalysisStep = lazy(() => import('@/analysis/nonmmm/steps/NonMMMChartAnalysisStep').then(module => ({ default: module.NonMMMChartAnalysisStep })));
const NonMMMDataStandardizationStep = lazy(() => import('@/analysis/nonmmm/steps/NonMMMDataStandardizationStep').then(module => ({ default: module.NonMMMDataStandardizationStep })));
const NonMMMModelBuildingStep = lazy(() => import('@/analysis/nonmmm/steps/NonMMMModelBuildingStep').then(module => ({ default: module.NonMMMModelBuildingStep })));
const NonMMMDownloadAnalysisStep = lazy(() => import('@/analysis/nonmmm/steps/NonMMMDownloadAnalysisStep').then(module => ({ default: module.NonMMMDownloadAnalysisStep })));
import { 
  NON_MMM_STEPS,
  NON_MMM_STEP_NAMES,
  NonMMMAnalysisData,
  NonMMMStepState
} from '@/analysis/nonmmm/types/nonmmm';
import { NonMMMStateService } from '@/analysis/nonmmm/services/NonMMMStateService';
import { useAnalysis } from '@/context/AnalysisContext';
import { BrandAnalysis } from '@/analysis/mmm/services/brandAnalysisService';

// Extended AnalysisData type that includes BrandAnalysis data
interface ExtendedAnalysisData {
  filename: string;
  columns: unknown[];
  rowCount: number;
  uploadedAt: Date;
  sheets?: unknown[];
  isConcatenated?: boolean;
  targetVariable?: string;
  selectedFilters?: string[];
  brandMetadata?: unknown;
  _brandAnalysis?: BrandAnalysis;
}

// ========================================
// NON-MMM WIZARD COMPONENT
// ========================================

export const NonMMMWizard: React.FC = () => {
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [stepData, setStepData] = useState<Partial<NonMMMAnalysisData>>({});
  const [isStepValid, setIsStepValid] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { state: analysisState } = useAnalysis();

  // ========================================
  // EFFECTS AND INITIALIZATION
  // ========================================
  
  // Initialize step on mount and when analysis ID changes
  useEffect(() => {
    const initializeStep = async () => {
      if (isInitialized) return;
      
      try {
        // Check if we have a current analysis ID (resuming existing analysis)
        const currentAnalysisId = analysisState.currentAnalysisId;
        
        // Only load completed steps if we're resuming an existing analysis with the same ID
        const savedState = await NonMMMStateService.getNonMMMState();
        if (savedState && currentAnalysisId && savedState.analysisId === currentAnalysisId) {
          const completedStepsFromState: number[] = [];
          
          // Check for completion flags in the saved state
          // Step 2: Data Upload
          if (savedState.dataUploadCompleted) completedStepsFromState.push(2);
          // Step 3: Data Summary (includes target variable + expected signs)
          if (savedState.dataSummaryCompleted) completedStepsFromState.push(3);
          // Step 4: Chart Analysis
          if (savedState.chartAnalysisCompleted) completedStepsFromState.push(4);
          // Step 5: Model Building
          if (savedState.modelBuildingCompleted) completedStepsFromState.push(5);
          // Step 6: Download Analysis
          if (savedState.downloadAnalysisCompleted) completedStepsFromState.push(6);
          
          setCompletedSteps(completedStepsFromState);
          console.log('✅ Loaded completed steps from state for analysis:', currentAnalysisId, completedStepsFromState);
        } else {
          // New analysis or different analysis ID - start with no completed steps
          setCompletedSteps([]);
          console.log('🔄 New analysis or different ID - starting with no completed steps');
        }
        
        // If we have an analysis ID, check if it's different from any stored state
        if (currentAnalysisId) {
          const storedState = await NonMMMStateService.getNonMMMState();
          if (storedState && storedState.analysisId && storedState.analysisId !== currentAnalysisId) {
            console.log('🔄 Analysis ID changed, clearing stale state');
            await NonMMMStateService.clearNonMMMState();
          }
        }
        
        if (currentAnalysisId && currentAnalysisId.trim() !== '') {
          console.log('🔄 Resuming Non-MMM analysis:', currentAnalysisId);
          console.log('🔍 Wizard context state:', {
            currentAnalysisId: analysisState.currentAnalysisId,
            selectedBrand: analysisState.selectedBrand,
            analysisType: analysisState.analysisType,
            analysisMode: analysisState.analysisMode,
            analysisData: analysisState.analysisData
          });
          
          // Check if we have analysis data in context with currentStep
          if (analysisState.analysisData && (analysisState.analysisData as ExtendedAnalysisData)._brandAnalysis?.currentStep) {
            const currentStep = (analysisState.analysisData as ExtendedAnalysisData)._brandAnalysis!.currentStep;
            console.log('✅ Using currentStep from analysis data:', currentStep);
            setCurrentStep(currentStep);
            setIsInitialized(true);
            return;
          }
          
          // First try to get from localStorage, then from backend
          let savedState = await NonMMMStateService.getNonMMMState();
          
          // If no local state, try to load from backend
          if (!savedState) {
            console.log('🔄 No local state found, loading from backend...');
            try {
              savedState = await NonMMMStateService.loadStateFromBackend(currentAnalysisId);
            } catch (error) {
              console.log('🔄 Backend state not found, treating as new analysis');
              savedState = null;
            }
          }
          
          if (savedState && savedState.currentStep && savedState.analysisId === currentAnalysisId) {
            const savedStep = savedState.currentStep as number;
            console.log('📊 Found saved step:', savedStep);
            
            // Navigate to the saved step
            setCurrentStep(savedStep);
            
            // Map step to route and navigate
            const stepRoutes: { [key: number]: string } = {
              1: '/nonmmm/start',
              2: '/nonmmm/upload',
              3: '/nonmmm/summary',
              4: '/nonmmm/charts',
              5: '/nonmmm/modeling',  // Skip standardization step, go directly to modeling
              6: '/nonmmm/download',
            };
            
            const route = stepRoutes[savedStep];
            if (route && route !== location.pathname) {
              console.log('🧭 Navigating to saved step route:', route);
              navigate(route);
            }
          } else {
            // No valid saved state, but we're resuming an analysis
            // Try to use the currentStep from analysis data if available
            if (analysisState.analysisData && (analysisState.analysisData as ExtendedAnalysisData)._brandAnalysis?.currentStep) {
              const currentStep = (analysisState.analysisData as ExtendedAnalysisData)._brandAnalysis!.currentStep;
              console.log('✅ Using currentStep from analysis data (no saved state):', currentStep);
              setCurrentStep(currentStep);
            } else {
              // Clear stale state and determine from URL
              console.log('🔄 No valid saved state found, clearing stale state and determining from URL');
              if (savedState && savedState.analysisId !== currentAnalysisId) {
                await NonMMMStateService.clearNonMMMState();
              }
              // Determine step from URL
              const path = location.pathname;
              if (path.includes('/nonmmm/upload')) {
                setCurrentStep(2);
              } else if (path.includes('/nonmmm/summary')) {
                setCurrentStep(3);
              } else if (path.includes('/nonmmm/charts')) {
                setCurrentStep(4);
              } else if (path.includes('/nonmmm/modeling')) {
                setCurrentStep(5);
              } else if (path.includes('/nonmmm/download')) {
                setCurrentStep(6);
              } else {
                setCurrentStep(2); // Default to data upload
              }
            }
          }
        } else {
          // New analysis, clear any stale state and determine from URL
          console.log('🔄 New analysis, clearing stale state and determining from URL');
          console.log('🔍 No currentAnalysisId found. Context state:', {
            currentAnalysisId: analysisState.currentAnalysisId,
            selectedBrand: analysisState.selectedBrand,
            analysisType: analysisState.analysisType,
            analysisMode: analysisState.analysisMode
          });
          await NonMMMStateService.clearNonMMMState();
          // Determine step from URL
          const path = location.pathname;
          if (path.includes('/nonmmm/upload')) {
            setCurrentStep(2);
          } else if (path.includes('/nonmmm/summary')) {
            setCurrentStep(3);
          } else if (path.includes('/nonmmm/charts')) {
            setCurrentStep(4);
          } else if (path.includes('/nonmmm/modeling')) {
            setCurrentStep(5);
          } else if (path.includes('/nonmmm/results')) {
            setCurrentStep(6);
          } else {
            setCurrentStep(2); // Default to data upload
          }
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ Error initializing Non-MMM wizard step:', error);
        // Fallback to URL-based step determination
        // Determine step from URL
        const path = location.pathname;
        if (path.includes('/nonmmm/upload')) {
          setCurrentStep(2);
                  } else if (path.includes('/nonmmm/summary')) {
            setCurrentStep(3);
          } else if (path.includes('/nonmmm/charts')) {
            setCurrentStep(4);
          } else if (path.includes('/nonmmm/modeling')) {
            setCurrentStep(5);
          } else if (path.includes('/nonmmm/download')) {
            setCurrentStep(6);
          } else {
            setCurrentStep(2); // Default to data upload
          }
        setIsInitialized(true);
      }
    };

    initializeStep();
  }, [analysisState.currentAnalysisId, analysisState.analysisData, analysisState.analysisType, analysisState.analysisMode, analysisState.selectedBrand, isInitialized, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle URL changes after initialization
  useEffect(() => {
    if (!isInitialized) return;
    
    const determineStepFromURL = () => {
      // Determine current step from URL
      // Skip step 1 (brand selection) as it's handled in DataScientistWizard
      const path = location.pathname;
      console.log('🔍 Determining step from URL:', path);
      
      if (path === '/nonmmm') {
        // Check if we're resuming an analysis and use the correct step
        if (analysisState.currentAnalysisId && analysisState.analysisData && (analysisState.analysisData as ExtendedAnalysisData)._brandAnalysis?.currentStep) {
          const currentStep = (analysisState.analysisData as ExtendedAnalysisData)._brandAnalysis!.currentStep;
          console.log('📍 Using currentStep from analysis data for /nonmmm route:', currentStep);
          setCurrentStep(currentStep);
        } else {
          // Start directly at data upload step (step 2) when coming from DataScientistWizard for new analysis
          console.log('📍 Setting current step to 2 (data upload) for new analysis');
          setCurrentStep(2);
        }
      } else if (path.includes('/nonmmm/upload')) {
        console.log('📍 Setting current step to 2 (data upload)');
        setCurrentStep(2);
      } else if (path.includes('/nonmmm/summary')) {
        console.log('📍 Setting current step to 3 (data summary)');
        setCurrentStep(3);
      } else if (path.includes('/nonmmm/charts')) {
        console.log('📍 Setting current step to 4 (chart analysis)');
        setCurrentStep(4);
      } else if (path.includes('/nonmmm/modeling')) {
        console.log('📍 Setting current step to 5 (modeling)');
        setCurrentStep(5);
        console.log('📍 Step set to 5, should render modeling component');
      } else if (path.includes('/nonmmm/download')) {
        console.log('📍 Setting current step to 6 (download)');
        setCurrentStep(6);
      }
      // Add more steps as they're implemented
    };

    determineStepFromURL();
  }, [location.pathname, analysisState.analysisData, analysisState.currentAnalysisId, isInitialized]);

  // Step completion is now handled event-driven by individual steps
  // No need for periodic polling - each step updates completion status immediately

  // ========================================
  // STEP MANAGEMENT METHODS
  // ========================================
  
  /**
   * Handle step completion
   * Saves step data and proceeds to next step
   */
  const handleStepComplete = (data: Partial<NonMMMAnalysisData>) => {
    // Save step data
    setStepData(prev => ({ ...prev, ...data }));
    
    // Mark step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }
    
    // Navigate to next step
    const nextStep = currentStep + 1;
    if (nextStep <= Object.keys(NON_MMM_STEPS).length) {
      // Save the current step to global state before navigating
      const currentAnalysisId = analysisState.currentAnalysisId;
      if (currentAnalysisId) {
        const currentState = NonMMMStateService.getNonMMMState() || {};
        NonMMMStateService.saveNonMMMState({
          ...currentState,
          currentStep: nextStep,
          lastUpdated: new Date().toISOString()
        });
        console.log('✅ Updated current step to:', nextStep);
      }
      
      navigateToStep(nextStep);
    } else {
      // Analysis complete
      toast({
        title: 'Analysis Complete!',
        description: 'Your Non-MMM analysis has been completed successfully.',
      });
    }
  };

  /**
   * Handle step validation
   * Updates validation state for current step
   */
  const handleStepValidation = (isValid: boolean) => {
    setIsStepValid(isValid);
  };

  /**
   * Navigate to specific step
   * Updates current step and navigates to appropriate route
   */
  const navigateToStep = async (step: number) => {
    setCurrentStep(step);
    
    // Save the current step to global state
    const currentAnalysisId = analysisState.currentAnalysisId;
    if (currentAnalysisId) {
      const currentState = await NonMMMStateService.getNonMMMState() || {};
      await NonMMMStateService.saveNonMMMState({
        ...currentState,
        analysisId: currentAnalysisId,
        currentStep: step,
        lastUpdated: new Date().toISOString()
      });
      console.log('✅ Updated current step to:', step);
    }
    
    // For non-MMM wizard, all steps are handled internally within the same route
    // No need to navigate to different routes - just update the step state
    console.log('✅ Step updated to:', step);
  };

  /**
   * Go to previous step
   */
  const goToPreviousStep = async () => {
    if (currentStep > 1) {
      await navigateToStep(currentStep - 1);
    }
  };

  /**
   * Go to next step
   */
  const goToNextStep = async () => {
    if (currentStep < Object.keys(NON_MMM_STEPS).length && isStepValid) {
      await navigateToStep(currentStep + 1);
    }
  };

  /**
   * Go to home (MMM analysis)
   */
  const goToHome = () => {
            navigate('/data-scientist');
  };

  // ========================================
  // STEP RENDERING
  // ========================================
  
  const getCurrentStepComponent = (() => {
    let lastStep = 0;
    return () => {
      // Only log when step actually changes
      if (currentStep !== lastStep) {
        console.log('🎯 Rendering step component for currentStep:', currentStep);
        lastStep = currentStep;
      }
    
    const LoadingSpinner = () => (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );

    switch (currentStep) {
      case 1:
        // Step 1 (brand selection) is skipped - handled in DataScientistWizard
        // Redirect to step 2 if somehow we end up here
        setCurrentStep(2);
        return <LoadingSpinner />;
      case 2:
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <NonMMMDataUploadStep />
          </Suspense>
        );
      case 3:
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <NonMMMDataSummaryStep />
          </Suspense>
        );
      case 4:
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <NonMMMChartAnalysisStep />
          </Suspense>
        );
      case 5:
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <NonMMMModelBuildingStep />
          </Suspense>
        );
      case 6:
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <NonMMMDownloadAnalysisStep />
          </Suspense>
        );
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Step {currentStep}</h2>
            <p className="text-muted-foreground">This step is coming soon...</p>
          </div>
        );
    }
    };
  })();

  // ========================================
  // PROGRESS CALCULATION
  // ========================================
  
  // The actual workflow has 5 steps: 2 (Data Upload), 3 (Data Summary), 4 (Chart Analysis), 5 (Model Building), 6 (Download Analysis)
  // Step 1 (Analysis Type Selection) is skipped as it's handled in DataScientistWizard
  // Data Standardization is now handled automatically in Chart Analysis step
  const actualWorkflowSteps = 5; // Steps 2, 3, 4, 5, 6 (5 visible steps, step 1 is skipped)
  const progressPercentage = Math.round((completedSteps.length / actualWorkflowSteps) * 100);
  const canGoNext = isStepValid && currentStep < 6; // Can go to step 6 (Download Analysis) max
  const canGoPrevious = currentStep > 2; // Can't go back from step 2 (first visible step)

  // ========================================
  // MAIN RENDER
  // ========================================
  
  return (
    <LayoutWrapper showSidebar={true} showFooter={true}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToHome}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Back to MMM
                </Button>
                                 <div>
                   <h1 className="text-xl font-semibold">Non-MMM Analysis</h1>
                   <p className="text-sm text-muted-foreground">
                     Step {currentStep - 1} of {actualWorkflowSteps}: {NON_MMM_STEP_NAMES[currentStep as keyof typeof NON_MMM_STEP_NAMES]}
                   </p>
                 </div>
              </div>
              
                             <div className="text-right">
                 <div className="text-sm font-medium mb-1">
                   {progressPercentage}% Complete
                   {completedSteps.length > 0 && (
                     <span className="ml-2 text-xs text-muted-foreground">
                       ({completedSteps.length} steps completed)
                     </span>
                   )}
                 </div>
                 <Progress value={progressPercentage} className="w-32" />
                 {completedSteps.includes(currentStep) && (
                   <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                     <CheckCircle className="h-3 w-3" />
                     Step {currentStep} Completed
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 max-w-full overflow-hidden">
          <div className="w-full max-w-full overflow-hidden">
            {/* Step Component */}
            <div className="mb-8">
              {getCurrentStepComponent()}
            </div>

            {/* Navigation - Only show for steps after brand setup */}
            {currentStep > 1 && (
              <div className="flex items-center justify-between pt-8 border-t">
                <Button
                  variant="outline"
                  onClick={goToPreviousStep}
                  disabled={!canGoPrevious}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                                 <div className="flex items-center gap-2">
                   <span className="text-sm text-muted-foreground">
                     Step {currentStep - 1} of {actualWorkflowSteps}
                   </span>
                 </div>

                <Button
                  onClick={goToNextStep}
                  disabled={!canGoNext}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
};

export default NonMMMWizard;

