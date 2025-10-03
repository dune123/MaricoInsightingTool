/**
 * ========================================
 * BRANDBLOOM INSIGHTS - ANALYSIS CONTEXT
 * ========================================
 * 
 * Purpose: Global state management for the multi-step analysis wizard with advanced filter management
 * 
 * Description:
 * This React Context provides centralized state management for the entire
 * BrandBloom Insights analysis workflow. It manages the wizard progression,
 * analysis data, user selections, model results, and comprehensive filter
 * state across all steps with performance optimizations and type safety.
 * 
 * Key Functionality:
 * - Multi-step wizard state management (14 steps)
 * - Analysis data persistence across navigation
 * - Brand-specific analysis tracking
 * - Advanced filter state management (columns, selections, values)
 * - Model result and scenario input management
 * - Wizard navigation controls (next, previous, jump to step)
 * - Performance-optimized with memoized callbacks
 * 
 * State Management:
 * - Uses React useReducer for complex state logic
 * - Integrates with WizardManager for step navigation
 * - Provides type-safe actions and state updates
 * - Manages analysis lifecycle from creation to completion
 * - Handles filter state with columns, selections, and values
 * - Supports scenario-based analysis inputs
 * 
 * Filter Management:
 * - filterColumns: Available columns for filtering
 * - selectedFilters: Currently selected filter columns
 * - filterValues: Specific values for each filter column
 * - Comprehensive filter state persistence
 * - Filter state synchronization across components
 * 
 * Performance Features:
 * - All context functions memoized with useCallback
 * - Prevents unnecessary re-renders in consuming components
 * - Optimized state updates and dispatches
 * - Efficient context value creation
 * 
 * Used by:
 * - All wizard step components for state access
 * - App.tsx as the root provider
 * - Service layers for state updates
 * - Filter components for state management
 * - Analysis components for data access
 * 
 * Dependencies:
 * - WizardManager for step flow logic
 * - Analysis types for type safety
 * - React hooks for state management
 * - React Context for global state sharing
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 */

import React, { createContext, useContext, useReducer, ReactNode, useCallback, useMemo } from 'react';
import { AppState, UserType, AnalysisType, AnalysisMode, AnalysisData, ModelResult, ScenarioInput } from '@/types/analysis';
import { WizardManager } from '@/analysis/mmm/services';

interface AnalysisContextType {
  state: AppState;
  setUserType: (userType: UserType) => void;
  setAnalysisType: (analysisType: AnalysisType) => void;
  setAnalysisMode: (analysisMode: AnalysisMode) => void;
  setAnalysisData: (data: AnalysisData) => void;
  setSelectedBrand: (brand: string) => void;
  setCurrentAnalysisId: (analysisId: string) => void;
  setFilterColumns: (columns: string[]) => void;
  setSelectedFilters: (filters: string[]) => void;
  setFilterValues: (values: Record<string, string>) => void; // New: set filter values
  setModelResult: (result: ModelResult) => void;
  setScenarioInputs: (inputs: ScenarioInput[]) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  // NEW: Step visit tracking
  markStepVisited: (step: number) => void;
  isStepVisited: (step: number) => boolean;
  getVisitedSteps: () => number[];
  // NEW: Step completion tracking
  markStepCompleted: (step: number) => void;
  isStepCompleted: (step: number) => boolean;
  getCompletedSteps: () => number[];
  resetStepCompletion: (step: number) => void;
  resetAnalysis: () => void; // New: reset all analysis state
}

const initialState: AppState = {
  userType: null,
  analysisType: null,
  analysisMode: null,
  analysisData: null,
  selectedBrand: '',
  currentAnalysisId: '',
  filterColumns: [],
  selectedFilters: [],
  filterValues: {}, // New: initialize empty filter values
  modelResult: null,
  scenarioInputs: [],
  currentStep: 1,
  // NEW: Track visited steps to prevent re-initialization
  visitedSteps: [],
  // NEW: Track completed steps
  completedSteps: [],
};

type Action =
  | { type: 'SET_USER_TYPE'; payload: UserType }
  | { type: 'SET_ANALYSIS_TYPE'; payload: AnalysisType }
  | { type: 'SET_ANALYSIS_MODE'; payload: AnalysisMode }
  | { type: 'SET_ANALYSIS_DATA'; payload: AnalysisData }
  | { type: 'SET_SELECTED_BRAND'; payload: string }
  | { type: 'SET_CURRENT_ANALYSIS_ID'; payload: string }
  | { type: 'SET_FILTER_COLUMNS'; payload: string[] }
  | { type: 'SET_SELECTED_FILTERS'; payload: string[] }
  | { type: 'SET_FILTER_VALUES'; payload: Record<string, string> } // New: set filter values action
  | { type: 'SET_MODEL_RESULT'; payload: ModelResult }
  | { type: 'SET_SCENARIO_INPUTS'; payload: ScenarioInput[] }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; payload: number }
  | { type: 'MARK_STEP_VISITED'; payload: number }
  | { type: 'MARK_STEP_COMPLETED'; payload: number }
  | { type: 'RESET_STEP_COMPLETION'; payload: number }
  | { type: 'RESET_ANALYSIS' }; // New: reset all analysis state

function analysisReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER_TYPE':
      return { ...state, userType: action.payload };
    case 'SET_ANALYSIS_TYPE':
      return { ...state, analysisType: action.payload };
    case 'SET_ANALYSIS_MODE':
      return { ...state, analysisMode: action.payload };
    case 'SET_ANALYSIS_DATA':
      return { ...state, analysisData: action.payload };
    case 'SET_SELECTED_BRAND':
      return { ...state, selectedBrand: action.payload };
    case 'SET_CURRENT_ANALYSIS_ID':
      return { ...state, currentAnalysisId: action.payload };
    case 'SET_FILTER_COLUMNS':
      return { ...state, filterColumns: action.payload };
    case 'SET_SELECTED_FILTERS':
      return { ...state, selectedFilters: action.payload };
    case 'SET_FILTER_VALUES':
      return { ...state, filterValues: action.payload }; // New: handle filter values action
    case 'SET_MODEL_RESULT':
      return { ...state, modelResult: action.payload };
    case 'SET_SCENARIO_INPUTS':
      return { ...state, scenarioInputs: action.payload };
    case 'NEXT_STEP':
      return { ...state, currentStep: WizardManager.getNextStep(state.currentStep, state) };
    case 'PREV_STEP':
      return { ...state, currentStep: WizardManager.getPreviousStep(state.currentStep, state) };
    case 'GO_TO_STEP':
      return { ...state, currentStep: action.payload };
    case 'MARK_STEP_VISITED':
      // Add step to visited steps if not already there
      return {
        ...state,
        visitedSteps: state.visitedSteps.includes(action.payload)
          ? state.visitedSteps
          : [...state.visitedSteps, action.payload]
      };
    case 'MARK_STEP_COMPLETED':
      return {
        ...state,
        completedSteps: state.completedSteps.includes(action.payload)
          ? state.completedSteps
          : [...state.completedSteps, action.payload]
      };
    case 'RESET_STEP_COMPLETION':
      return {
        ...state,
        completedSteps: state.completedSteps.filter(step => step !== action.payload)
      };
    case 'RESET_ANALYSIS':
      return initialState; // Reset to initial state
    default:
      return state;
  }
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(analysisReducer, initialState);

  // Memoize all context functions to prevent unnecessary re-renders
  const setUserType = useCallback((userType: UserType) => {
    dispatch({ type: 'SET_USER_TYPE', payload: userType });
  }, []);

  const setAnalysisType = useCallback((analysisType: AnalysisType) => {
    dispatch({ type: 'SET_ANALYSIS_TYPE', payload: analysisType });
  }, []);

  const setAnalysisMode = useCallback((analysisMode: AnalysisMode) => {
    dispatch({ type: 'SET_ANALYSIS_MODE', payload: analysisMode });
  }, []);

  const setAnalysisData = useCallback((data: AnalysisData) => {
    dispatch({ type: 'SET_ANALYSIS_DATA', payload: data });
  }, []);

  const setSelectedBrand = useCallback((brand: string) => {
    dispatch({ type: 'SET_SELECTED_BRAND', payload: brand });
  }, []);

  const setCurrentAnalysisId = useCallback((analysisId: string) => {
    dispatch({ type: 'SET_CURRENT_ANALYSIS_ID', payload: analysisId });
  }, []);

  const setFilterColumns = useCallback((columns: string[]) => {
    dispatch({ type: 'SET_FILTER_COLUMNS', payload: columns });
  }, []);

  const setSelectedFilters = useCallback((filters: string[]) => {
    dispatch({ type: 'SET_SELECTED_FILTERS', payload: filters });
  }, []);

  const setFilterValues = useCallback((values: Record<string, string>) => {
    dispatch({ type: 'SET_FILTER_VALUES', payload: values });
  }, []);

  const setModelResult = useCallback((result: ModelResult) => {
    dispatch({ type: 'SET_MODEL_RESULT', payload: result });
  }, []);

  const setScenarioInputs = useCallback((inputs: ScenarioInput[]) => {
    dispatch({ type: 'SET_SCENARIO_INPUTS', payload: inputs });
  }, []);

  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
  }, []);

  const prevStep = useCallback(() => {
    dispatch({ type: 'PREV_STEP' });
  }, []);

  const goToStep = useCallback((step: number) => {
    dispatch({ type: 'GO_TO_STEP', payload: step });
  }, []);

  const markStepVisited = useCallback((step: number) => {
    dispatch({ type: 'MARK_STEP_VISITED', payload: step });
  }, []);

  const isStepVisited = useCallback((step: number) => {
    return state.visitedSteps.includes(step);
  }, [state.visitedSteps]);

  const getVisitedSteps = useCallback(() => {
    return state.visitedSteps;
  }, [state.visitedSteps]);

  // NEW: Step completion tracking functions
  const markStepCompleted = useCallback((step: number) => {
    dispatch({ type: 'MARK_STEP_COMPLETED', payload: step });
  }, []);

  const isStepCompleted = useCallback((step: number) => {
    return state.completedSteps.includes(step);
  }, [state.completedSteps]);

  const getCompletedSteps = useCallback(() => {
    return state.completedSteps;
  }, [state.completedSteps]);

  const resetStepCompletion = useCallback((step: number) => {
    dispatch({ type: 'RESET_STEP_COMPLETION', payload: step });
  }, []);

  const resetAnalysis = useCallback(() => {
    dispatch({ type: 'RESET_ANALYSIS' });
  }, []);

  const contextValue = useMemo(() => ({
    state,
    setUserType,
    setAnalysisType,
    setAnalysisMode,
    setAnalysisData,
    setSelectedBrand,
    setCurrentAnalysisId,
    setFilterColumns,
    setSelectedFilters,
    setFilterValues,
    setModelResult,
    setScenarioInputs,
    nextStep,
    prevStep,
    goToStep,
    markStepVisited,
    isStepVisited,
    getVisitedSteps,
    markStepCompleted,
    isStepCompleted,
    getCompletedSteps,
    resetStepCompletion,
    resetAnalysis,
  }), [
    state,
    setUserType,
    setAnalysisType,
    setAnalysisMode,
    setAnalysisData,
    setSelectedBrand,
    setCurrentAnalysisId,
    setFilterColumns,
    setSelectedFilters,
    setFilterValues,
    setModelResult,
    setScenarioInputs,
    nextStep,
    prevStep,
    goToStep,
    markStepVisited,
    isStepVisited,
    getVisitedSteps,
    markStepCompleted,
    isStepCompleted,
    getCompletedSteps,
    resetStepCompletion,
    resetAnalysis,
  ]);

  return (
    <AnalysisContext.Provider value={contextValue}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}