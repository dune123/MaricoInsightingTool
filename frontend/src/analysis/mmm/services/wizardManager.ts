/**
 * WizardManager Service
 * 
 * Purpose: Intelligent wizard navigation and flow control for the 14-step analytics pipeline
 * 
 * Description: This service provides comprehensive wizard flow management, handling step
 * navigation, validation, completion tracking, and user-type-specific workflows. It abstracts
 * navigation logic from UI components and enables intelligent step skipping and conditional
 * flows based on user preferences and analysis requirements.
 * 
 * Key Functions:
 * - canAdvanceFromStep(): Validates step advancement based on completion criteria
 * - getNextStep(): Gets next valid step with user-type-specific logic
 * - getPreviousStep(): Gets previous valid step
 * - canNavigateToStep(): Validates direct step navigation
 * - calculateCompletionPercentage(): Calculates workflow completion percentage
 * - validateWizardState(): Provides comprehensive wizard state validation
 * - getVisibleSteps(): Returns steps visible for current user type
 * 
 * Navigation Features:
 * - Smart next/previous step calculation with conditional logic
 * - Step accessibility validation for direct navigation
 * - User-type-aware step filtering (technical vs business-focused)
 * - Completion percentage calculation for progress indicators
 * - Wizard state validation for quality assurance
 * - Recursive step navigation for skipped steps
 * 
 * User Type Handling:
 * - Brand Leader: Skips highly technical steps (EDA, Expected Signs)
 * - Data Scientist: Full access to all technical steps
 * - Conditional step filtering for streamlined workflows
 * - User-type-aware completion percentage calculation
 * 
 * Step Management:
 * - Support for 14-step workflow
 * - Required step validation
 * - Conditional step visibility
 * - Step completion tracking
 * - Navigation state management
 * 
 * Data Flow:
 * 1. Step validation: Check completion criteria → Validate prerequisites
 * 2. Navigation calculation: Current step → User type filtering → Next step
 * 3. Completion tracking: Step completion → Progress calculation → Percentage update
 * 4. State validation: Wizard state → Validation rules → Error reporting
 * 
 * Dependencies:
 * - stepConfig.ts: Step configuration and validation rules
 * - analysis.ts: State management types
 * - STEP_CONFIGURATIONS: Step definitions and configurations
 */

import { AppState } from "@/types/analysis";
import { STEP_CONFIGURATIONS, StepConfig, getStepConfig } from "@/config/stepConfig";

export class WizardManager {
  /**
   * Determines if the user can advance from the current step
   */
  static canAdvanceFromStep(stepId: number, state: AppState): boolean {
    const stepConfig = getStepConfig(stepId);
    if (!stepConfig) return false;
    
    return stepConfig.canAdvance(state);
  }

  /**
   * Gets the next valid step based on user type and current state
   */
  static getNextStep(currentStep: number, state: AppState): number {
    const nextStep = currentStep + 1;
    const maxSteps = STEP_CONFIGURATIONS.length;
    
    if (nextStep > maxSteps) return currentStep;
    
    // Apply conditional logic based on user type
    if (state.userType === 'brand-leader') {
      // Brand leaders might skip technical steps
      const skipForBrandLeader = [11, 12]; // EDA and Expected Signs might be skipped (updated for new numbering)
      if (skipForBrandLeader.includes(nextStep)) {
        return this.getNextStep(nextStep, state);
      }
    }
    
    return nextStep;
  }

  /**
   * Gets the previous valid step
   */
  static getPreviousStep(currentStep: number, state: AppState): number {
    const prevStep = currentStep - 1;
    
    if (prevStep < 1) return 1;
    
    // Apply same conditional logic for skipped steps
    if (state.userType === 'brand-leader') {
      const skipForBrandLeader = [11, 12]; // Updated for new numbering (EDA and Expected Signs)
      if (skipForBrandLeader.includes(prevStep)) {
        return this.getPreviousStep(prevStep, state);
      }
    }
    
    return prevStep;
  }

  /**
   * Validates if a direct step navigation is allowed
   */
  static canNavigateToStep(targetStep: number, state: AppState): boolean {
    // Check if all required previous steps are completed
    for (let i = 1; i < targetStep; i++) {
      const stepConfig = getStepConfig(i);
      if (stepConfig?.isRequired && !this.canAdvanceFromStep(i, state)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Gets all steps that should be shown for the current user type
   */
  static getVisibleSteps(userType: AppState['userType']): StepConfig[] {
    let visibleSteps = [...STEP_CONFIGURATIONS];
    
    if (userType === 'brand-leader') {
      // Filter out highly technical steps for brand leaders
      visibleSteps = visibleSteps.filter(step => ![10, 11].includes(step.id)); // Updated for new numbering
    }
    
    return visibleSteps;
  }

  /**
   * Gets the completion percentage for the wizard
   */
  static getCompletionPercentage(currentStep: number, userType: AppState['userType']): number {
    const visibleSteps = this.getVisibleSteps(userType);
    return Math.round((currentStep / visibleSteps.length) * 100);
  }

  /**
   * Gets the current step configuration
   */
  static getCurrentStepConfig(stepId: number): StepConfig | undefined {
    return getStepConfig(stepId);
  }

  /**
   * Validates the entire wizard state for completeness
   */
  static validateWizardCompletion(state: AppState): { isComplete: boolean; missingSteps: string[] } {
    const missingSteps: string[] = [];
    
    STEP_CONFIGURATIONS.forEach(stepConfig => {
      if (stepConfig.isRequired && !stepConfig.canAdvance(state)) {
        missingSteps.push(stepConfig.name);
      }
    });
    
    return {
      isComplete: missingSteps.length === 0,
      missingSteps
    };
  }
}

// Create singleton instance
export const wizardManager = new WizardManager();
export default wizardManager;