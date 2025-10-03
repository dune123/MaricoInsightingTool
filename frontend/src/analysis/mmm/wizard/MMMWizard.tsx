/**
 * ========================================
 * BRANDBLOOM INSIGHTS - MMM WIZARD
 * ========================================
 * 
 * Purpose: MMM-specific wizard orchestrator for the 11-step MMM analytics workflow
 * 
 * Description:
 * The MMM-specific wizard that manages the complete Media Mix Modeling analytics pipeline
 * from data upload through model optimization. This component handles step routing,
 * navigation logic, validation rules, and step-specific rendering for MMM analysis.
 * 
 * Current Step Configuration (11 analysis steps):
 * 1. Data Upload
 * 2. Data Concatenation
 * 3. Add RPIs
 * 4. Data Summary
 * 5. Brand Selection
 * 6. Filter Selection
 * 7. EDA (Exploratory Data Analysis)
 * 8. Expected Signs
 * 9. Model Building
 * 10. Model Results
 * 11. Optimizer
 * 
 * Key Features:
 * - Complete MMM analysis workflow (11 steps starting from data upload)
 * - Step validation and navigation logic
 * - Integration with MMM-specific step components
 * - State management for MMM analysis
 * 
 * Dependencies:
 * - All MMM step components for rendering
 * - AnalysisContext for state management
 * - appConstants for step configuration
 * - RouteGuard for access control
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 */

import { useAnalysis } from "@/context/AnalysisContext";
import { WizardLayout } from "@/components/wizard/WizardLayout";
import { LayoutWrapper } from "@/components/wizard/LayoutWrapper";
import { DataUploadStep } from "@/analysis/mmm/steps/DataUploadStep";
import { DataConcatenationStep } from "@/analysis/mmm/steps/DataConcatenationStep";
import { AddRPIsStep } from "@/analysis/mmm/steps/AddRPIsStep";
import { DataSummaryStep } from "@/analysis/mmm/steps/DataSummaryStep";
import { BrandSelectionStep } from "@/analysis/mmm/steps/BrandSelectionStep";
import { FilterSelectionStep } from "@/analysis/mmm/steps/FilterSelectionStep";
import { EDAStep } from "@/analysis/mmm/steps/EDAStep";
import { ExpectedSignsStep } from "@/analysis/mmm/steps/ExpectedSignsStep";
import { ModelBuildingStep } from "@/analysis/mmm/steps/ModelBuildingStep";
import { ModelResultsStep } from "@/analysis/mmm/steps/ModelResultsStep";
import { OptimizerStep } from "@/analysis/mmm/steps/OptimizerStep";
import { STEP_NAMES, STEP_TITLES } from "@/constants/appConstants";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export function MMMWizard() {
  const { state, nextStep, prevStep, goToStep, resetAnalysis } = useAnalysis();
  const hasMounted = useRef(false);

  // Log when MMMWizard mounts (should only happen after proper user flow)
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      if (localStorage.getItem('bb_debug_verbose') === 'true') {
        console.log('🏗️ MMMWizard mounted for MMM analysis with state:', {
          userType: state.userType,
          analysisType: state.analysisType,
          currentStep: state.currentStep
        });
      }
    }
  }, [state.userType, state.analysisType, state.currentStep]);

  const getCompletedSteps = () => {
    const completedSteps: number[] = [];
    
    if (localStorage.getItem('bb_debug_verbose') === 'true') {
      console.log('🔍 Checking analysis state for completed steps:', {
        userType: state.userType,
        analysisType: state.analysisType,
        currentAnalysisId: state.currentAnalysisId,
        hasAnalysisData: !!state.analysisData
      });
    }
    
    // CRITICAL: Only show "Welcome Back" for existing analyses with data uploaded
    // For new analyses or analyses without data upload, return empty array
    if (!state.currentAnalysisId || !state.analysisData?.filename) {
      if (localStorage.getItem('bb_debug_verbose') === 'true') {
        console.log('ℹ️ New analysis or no data uploaded - no completed steps');
      }
      return completedSteps; // Return empty array for new analyses
    }
    
    if (localStorage.getItem('bb_debug_verbose') === 'true') {
      console.log('📋 Existing analysis with data detected, checking completed workflow steps...');
    }
    
    // MMMWizard-specific step completion checking
    // Steps are numbered based on MMMWizard internal mapping (1-13)
    
    // Step 1: Data Upload - Only mark as completed if data is actually uploaded
    if (state.currentAnalysisId && state.analysisData?.filename && state.analysisData?.sheets && state.analysisData.sheets.length > 0) {
      completedSteps.push(1);
    }
    
    // Step 2: Data Concatenation - Only mark as completed if concatenation is done
    if (state.currentAnalysisId && state.analysisData?.isConcatenated === true && 
        state.analysisData?.concatenationConfig?.selectedSheets && 
        state.analysisData.concatenationConfig.selectedSheets.length > 0) {
      completedSteps.push(2);
    }
    
    // Step 3: Add RPIs - Only mark as completed if RPI is done
    if (state.currentAnalysisId && state.analysisData?.rpiSheet?.created === true && 
        state.analysisData.rpiSheet.rowCount > 0) {
      completedSteps.push(3);
    }
    
    // Step 4: Data Summary - Only mark as completed if target variable is set
    if (state.currentAnalysisId && state.analysisData?.targetVariable && 
        state.analysisData?.targetVariableMetadata?.selectedAt) {
      completedSteps.push(4);
    }
    
    // Step 5: Brand Selection - Only mark as completed if brand is selected
    if (state.currentAnalysisId && state.selectedBrand && 
        state.selectedBrand.length > 0 && 
        state.analysisData?.brandMetadata?.extractedAt) {
      completedSteps.push(5);
    }
    
    // Step 6: Filter Selection - Only mark as completed if filters are set
    if (state.currentAnalysisId && state.selectedFilters && 
        state.selectedFilters.length > 0 && 
        state.analysisData?.filterMetadata?.selectedAt) {
      completedSteps.push(6);
    }
    
    // Step 7: EDA - Only mark as completed if EDA results exist
    if (state.currentAnalysisId && state.modelResult?.variables && state.modelResult.variables.length > 0) {
      completedSteps.push(7);
    }
    
    // Step 8: Expected Signs - Only mark as completed if signs are set
    if (state.currentAnalysisId && state.modelResult?.variables && 
        state.modelResult.variables.some(v => v.expectedSign !== undefined)) {
      completedSteps.push(8);
    }
    
    // Step 9: Model Building - Only mark as completed if model is built
    if (state.currentAnalysisId && state.modelResult && 
        state.modelResult.rSquared !== undefined && 
        state.modelResult.variables.length > 0) {
      completedSteps.push(9);
    }
    
    // Step 10: Model Results - Only mark as completed if results are available
    if (state.currentAnalysisId && state.modelResult && 
        state.modelResult.rSquared !== undefined && 
        state.modelResult.variables.length > 0) {
      completedSteps.push(10);
    }
    
    // Step 11: Optimizer - Only mark as completed if optimizer is run
    if (state.currentAnalysisId && state.scenarioInputs && state.scenarioInputs.length > 0) {
      completedSteps.push(11);
    }
    
    if (localStorage.getItem('bb_debug_verbose') === 'true') {
      console.log('📋 Completed steps detected:', completedSteps);
    }
    return completedSteps;
  };

  const getCurrentStepComponent = () => {
    // Check if user has completed steps and show resume option
    const completedSteps = getCompletedSteps();
    const hasCompletedSteps = completedSteps.length > 0;
    
    // MMMWizard starts from step 1 (Data Upload) since steps 1-2 are handled by other wizards
    if (state.currentStep === 1 && hasCompletedSteps) {
      const highestCompletedStep = Math.max(...completedSteps);
      return (
        <div className="space-y-6 text-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Welcome Back to MMM Analysis!</h2>
            <p className="text-muted-foreground">
              You have completed {highestCompletedStep} steps in your MMM analysis.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Completed Steps:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {completedSteps.sort((a, b) => a - b).map(step => (
                  <span key={step} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                    Step {step}: {STEP_NAMES[step - 1]}
                  </span>
                ))}
              </div>
            </div>
            <Button 
              onClick={() => {
                const targetStep = Math.max(1, highestCompletedStep + 1);
                if (localStorage.getItem('bb_debug_verbose') === 'true') {
                  console.log('🚀 MMMWizard: Resuming from step', targetStep);
                }
                goToStep(targetStep);
              }}
              className="px-8"
            >
              Resume Analysis from Step {Math.max(1, highestCompletedStep + 1)}
            </Button>
            <Button 
              onClick={() => {
                if (localStorage.getItem('bb_debug_verbose') === 'true') {
                  console.log('🧹 Starting fresh analysis...');
                }
                resetAnalysis();
                goToStep(1);
              }}
              variant="outline"
              className="w-full mb-4"
            >
              Start Fresh Analysis
            </Button>
            <div className="text-xs text-muted-foreground">
              Or start over by uploading new data below
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Start New Data Upload</h3>
            <DataUploadStep />
          </div>
        </div>
      );
    }
    
    // MMMWizard handles steps 1-11 (Data Upload through Optimizer)
    switch (state.currentStep) {
      case 1:
        return <DataUploadStep />;
      case 2:
        return <DataConcatenationStep />;
      case 3:
        return <AddRPIsStep />;
      case 4:
        return <DataSummaryStep />;
      case 5:
        return <BrandSelectionStep />;
      case 6:
        return <FilterSelectionStep />;
      case 7:
        return <EDAStep />;
      case 8:
        return <ExpectedSignsStep />;
      case 9:
        return <ModelBuildingStep />;
      case 10:
        return <ModelResultsStep />;
      case 11:
        return <OptimizerStep />;
      default:
        // If somehow we're on an invalid step, redirect to data upload
        console.warn('MMMWizard: Invalid step, redirecting to data upload');
        goToStep(1);
        return <DataUploadStep />;
    }
  };

  const canGoNext = () => {
    switch (state.currentStep) {
      case 1:
        return state.analysisData !== null;
      case 2:
        return !state.analysisData?.sheets || 
               state.analysisData.concatenationConfig?.selectedSheets?.length > 0 ||
               state.analysisData.sheets.some(sheet => sheet.isSelected);
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return state.selectedBrand.length > 0;
      case 6:
        return true;
      case 7:
        return true;
      case 8:
        return true;
      case 9:
        return state.modelResult !== null;
      case 10:
        return true;
      case 11:
        return false; // Last step
      default:
        return false;
    }
  };

  return (
    <LayoutWrapper showSidebar={true} showFooter={true}>
      <WizardLayout
        title={STEP_TITLES[state.currentStep - 1] || "MMM Analysis"}
        subtitle="Media Mix Modeling Analysis Workflow"
        currentStep={state.currentStep}
        totalSteps={11} // MMM analysis has 11 steps (1-11)
        onNext={nextStep}
        onPrev={prevStep}
        canGoNext={canGoNext()}
        canGoPrev={state.currentStep > 1} // Can only go back to step 1 and beyond
        steps={STEP_NAMES} // All 11 analysis step names
        nextLabel={state.currentStep === 11 ? "Complete" : "Next"}
      >
        {getCurrentStepComponent()}
      </WizardLayout>
    </LayoutWrapper>
  );
}
