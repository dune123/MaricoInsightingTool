/**
 * ========================================
 * BRANDBLOOM INSIGHTS - PREMIUM DATA SCIENTIST WIZARD
 * ========================================
 * 
 * Purpose: Premium Data Scientist wizard with enhanced design and user experience
 * 
 * Description:
 * This is an enhanced wizard specifically designed for Data Scientists who want to perform
 * detailed analysis. It features premium design elements, better animations, and
 * an improved interface for analysis type selection.
 * 
 * Key Features:
 * - Premium design with sophisticated styling
 * - Enhanced analysis type selection interface
 * - Better visual hierarchy and animations
 * - Improved user engagement elements
 * - Sophisticated routing and state management
 * 
 * Component Structure:
 * - Enhanced AnalysisTypeStep: Premium analysis type selection
 * - Premium header and navigation
 * - Enhanced visual elements and interactions
 * 
 * Used by:
 * - InitialWizard when user selects "Data Scientist"
 * - Routes to MMMWizard or NonMMMWizard based on selection
 * 
 * Dependencies:
 * - Enhanced AnalysisTypeStep component for analysis type selection
 * - React Router for navigation
 * - AnalysisContext for state management
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Design Team
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { WizardLayout } from "./WizardLayout";
import { AnalysisTypeStep } from "@/analysis/mmm/steps/AnalysisTypeStep";
import { useAnalysis } from "@/context/AnalysisContext";
import { LayoutWrapper } from "./LayoutWrapper";
import { Button } from "@/components/ui/button";
import { Home, Brain } from "lucide-react";

export interface DataScientistWizardState {
  analysisType: 'mmm' | 'non-mmm' | null;
  showSelection: boolean;
}

export function DataScientistWizard() {
  const [wizardState, setWizardState] = useState<DataScientistWizardState>({
    analysisType: null,
    showSelection: true
  });
  
  // Add a key that changes when we want to reset the component
  const [resetKey, setResetKey] = useState(0);
  
  const navigate = useNavigate();
  const { setAnalysisType, markStepCompleted } = useAnalysis();
  
  // Use ref to prevent duplicate logs in React StrictMode
  const hasMounted = useRef(false);
  
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      if (localStorage.getItem('bb_debug_verbose') === 'true') {
        console.log('🏗️ DataScientistWizard: Enhanced wizard mounted');
      }
    }
  }, []);
  
  // Function to force reset of the AnalysisTypeStep
  const forceReset = () => {
    setResetKey(prev => prev + 1);
    setWizardState({ analysisType: null, showSelection: true });
  };
  
  // Expose reset function globally for debugging
  useEffect(() => {
    (window as Window & { resetDataScientistWizard?: () => void }).resetDataScientistWizard = forceReset;
    return () => {
      delete (window as Window & { resetDataScientistWizard?: () => void }).resetDataScientistWizard;
    };
  }, []);
  
  const totalSteps = 1; // Only Analysis Type selection
  const stepNames = ["Analysis Type"];
  const stepTitles = ["Choose Your Analysis Approach"];

  const handleAnalysisTypeSelect = (analysisType: 'mmm' | 'non-mmm') => {
    if (localStorage.getItem('bb_debug_verbose') === 'true') {
      console.log(`🎯 DataScientistWizard: Analysis type selected: ${analysisType}, setting context and navigating to ${analysisType === 'non-mmm' ? 'Non-MMM' : 'MMM'} wizard`);
    }
    
    setWizardState(prev => ({ ...prev, analysisType }));
    setAnalysisType(analysisType);
    
    // Navigate to appropriate wizard
    if (analysisType === 'non-mmm') {
      navigate('/nonmmm');
    } else {
      navigate('/mmm');
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const canGoNext = () => {
    return wizardState.analysisType !== null;
  };

  const canGoPrev = () => {
    return true; // Can always go back to InitialWizard
  };

  const getCurrentStepComponent = () => {
    return (
      <AnalysisTypeStep 
        key={resetKey} // Add key to force re-render
        onAnalysisTypeSelect={handleAnalysisTypeSelect}
        selectedAnalysisType={wizardState.analysisType}
        userType="data-scientist"
      />
    );
  };

  return (
    <LayoutWrapper showSidebar={true} showFooter={true}>
      <div className="min-h-screen bg-gradient-premium overflow-hidden flex">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Premium Header */}
          <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm relative z-10">
            <div className="flex items-center justify-between px-8 py-6">
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/60"
                >
                  <Home className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-secondary to-secondary/80 rounded-xl flex items-center justify-center shadow-lg">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-primary">Data Scientist Portal</h1>
                    <span className="text-sm font-medium text-muted-foreground">Advanced Analytics & Statistical Modeling</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Premium Main Content */}
          <main className="flex-1 relative">
            {/* Full-Featured Analysis Type Selection */}
            {wizardState.showSelection && (
              <div className="px-8 py-8 animate-fade-in-up">
                <div className="w-full max-w-6xl mx-auto">
                  {getCurrentStepComponent()}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </LayoutWrapper>
  );
}
