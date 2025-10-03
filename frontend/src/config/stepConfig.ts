/**
 * ========================================
 * WIZARD STEP CONFIGURATION
 * ========================================
 * 
 * Purpose: Centralized configuration system for the analytics wizard workflow
 * 
 * Description:
 * This module provides a comprehensive configuration system for managing the
 * 14-step analytics wizard. It defines step properties, navigation rules,
 * validation logic, and component mappings in a centralized, maintainable way.
 * This replaces hard-coded step logic with a flexible, data-driven approach.
 * 
 * Key Functionality:
 * - Define step components, titles, and navigation properties
 * - Centralize validation rules for step advancement
 * - Provide utilities for step management and navigation
 * - Support conditional step flows based on user type
 * - Enable easy addition/removal of wizard steps
 * 
 * Step Configuration Structure:
 * - id: Unique step identifier
 * - name: Display name for step indicator
 * - title: Page title for step
 * - component: React component for step content
 * - canAdvance: Function to validate step completion
 * - isRequired: Whether step is mandatory for workflow completion
 * - nextLabel: Custom label for next button (optional)
 * 
 * Dependencies:
 * - All wizard step components for component mapping
 * - analysis.ts types for state validation
 * 
 * Used by:
 * - DataScienceWizard.tsx for step rendering and navigation
 * - WizardManager.ts for step flow management
 * - StepIndicator.tsx for progress visualization
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Frontend Team
 */

import { UserTypeStep } from "@/analysis/mmm/steps/UserTypeStep";
import { AnalysisTypeStep } from "@/analysis/mmm/steps/AnalysisTypeStep";
import { AnalysisModeStep } from "@/analysis/mmm/steps/AnalysisModeStep";
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
import { AppState } from "@/types/analysis";

export interface StepConfig {
  id: number;
  name: string;
  title: string;
  component: React.ComponentType;
  canAdvance: (state: AppState) => boolean;
  isRequired: boolean;
  nextLabel?: string;
}

export const STEP_CONFIGURATIONS: StepConfig[] = [
  {
    id: 1,
    name: "User Type",
    title: "Select User Type",
    component: UserTypeStep,
    canAdvance: (state) => state.userType !== null,
    isRequired: true,
  },
  {
    id: 2,
    name: "Analysis Type",
    title: "Choose Analysis Type",
    component: AnalysisTypeStep,
    canAdvance: (state) => state.analysisType !== null,
    isRequired: true,
  },
  {
    id: 3,
    name: "Analysis Mode",
    title: "Select Analysis Mode",
    component: AnalysisModeStep,
    canAdvance: (state) => state.analysisMode !== null,
    isRequired: true,
  },
  {
    id: 4,
    name: "Data Upload",
    title: "Upload Your Data",
    component: DataUploadStep,
    canAdvance: (state) => state.analysisData !== null,
    isRequired: true,
  },
  {
    id: 5,
    name: "Data Concatenation",
    title: "Concatenate Data Sheets",
    component: DataConcatenationStep,
    canAdvance: (state) => {
      // For existing analyses, check if concatenation is completed
      if (state.analysisMode === 'existing') {
        return state.analysisData?.isConcatenated === true && 
               state.analysisData?.targetVariable &&
               state.analysisData?.selectedFilters?.length > 0;
      }
      
      // For new analyses, check sheet selection
      return !state.analysisData?.sheets || 
             state.analysisData.concatenationConfig?.selectedSheets?.length > 0 ||
             state.analysisData.sheets.some(sheet => sheet.isSelected);
    },
    isRequired: false,
  },
  {
    id: 6,
    name: "Add RPIs",
    title: "Add RPI Columns",
    component: AddRPIsStep,
    canAdvance: () => true, // RPI addition is optional, can always proceed
    isRequired: false,
    nextLabel: "Continue",
  },
  {
    id: 7,
    name: "Data Summary",
    title: "Review Data Summary",
    component: DataSummaryStep,
    canAdvance: () => true,
    isRequired: false,
  },
  {
    id: 8,
    name: "Brand Selection",
    title: "Select Your Brand",
    component: BrandSelectionStep,
    canAdvance: (state) => state.selectedBrand.length > 0,
    isRequired: true,
  },
  {
    id: 9,
    name: "Filter Selection",
    title: "Choose Filter Columns",
    component: FilterSelectionStep,
    canAdvance: () => true,
    isRequired: false,
  },
  {
    id: 10,
    name: "EDA",
    title: "Exploratory Data Analysis",
    component: EDAStep,
    canAdvance: () => true,
    isRequired: false,
  },
  {
    id: 11,
    name: "Expected Signs",
    title: "Set Expected Signs",
    component: ExpectedSignsStep,
    canAdvance: () => true,
    isRequired: false,
  },
  {
    id: 12,
    name: "Model Building",
    title: "Build Your Model",
    component: ModelBuildingStep,
    canAdvance: (state) => state.modelResult !== null,
    isRequired: true,
  },
  {
    id: 13,
    name: "Model Results",
    title: "Model Results",
    component: ModelResultsStep,
    canAdvance: () => true,
    isRequired: false,
  },
  {
    id: 14,
    name: "Optimizer",
    title: "Scenario Optimization",
    component: OptimizerStep,
    canAdvance: () => false, // Last step
    isRequired: false,
    nextLabel: "Complete",
  },
];

export const getStepConfig = (stepId: number): StepConfig | undefined => {
  return STEP_CONFIGURATIONS.find(step => step.id === stepId);
};

export const getStepNames = (): string[] => {
  return STEP_CONFIGURATIONS.map(step => step.name);
};

export const getStepTitles = (): string[] => {
  return STEP_CONFIGURATIONS.map(step => step.title);
};

export const getTotalSteps = (): number => {
  return STEP_CONFIGURATIONS.length;
};