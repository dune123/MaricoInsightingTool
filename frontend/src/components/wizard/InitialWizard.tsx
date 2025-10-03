/**
 * ========================================
 * BRANDBLOOM INSIGHTS - PREMIUM HOME PAGE
 * ========================================
 * 
 * Purpose: Premium entry point wizard with enhanced user experience and visual appeal
 * 
 * Description:
 * This is a completely redesigned home page that provides a premium, engaging
 * experience for users entering the BrandBloom Insights platform. It features
 * sophisticated animations, enhanced visual hierarchy, and premium design elements.
 * 
 * Key Features:
 * - Premium hero section with animated elements
 * - Enhanced role selection cards with better interactions
 * - Sophisticated animations and micro-interactions
 * - Improved visual hierarchy and typography
 * - Premium branding and messaging
 * - Enhanced user engagement elements
 * 
 * Component Structure:
 * - PremiumHero: Engaging hero section with animations
 * - EnhancedRoleSelection: Improved role selection interface
 * - PremiumFooter: Sophisticated footer with additional information
 * 
 * Used by:
 * - Index.tsx as the main application entry point
 * - Routes to BrandLeaderWizard or DataScienceWizard based on user choice
 * 
 * Dependencies:
 * - Enhanced UserTypeStep component for role selection
 * - React Router for navigation
 * - AnalysisContext for state management
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Design Team
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { WizardLayout } from "./WizardLayout";
import { UserTypeStep } from "@/analysis/mmm/steps/UserTypeStep";
import { useAnalysis } from "@/context/AnalysisContext";
import { PremiumHero } from "./PremiumHero";
import { EnhancedRoleSelection } from "./EnhancedRoleSelection";
import { PremiumFooter } from "./PremiumFooter";

export interface InitialWizardState {
  userType: 'brand-leader' | 'data-scientist' | null;
  showHero: boolean;
  showRoles: boolean;
  showFooter: boolean;
}

export function InitialWizard() {
  const [wizardState, setWizardState] = useState<InitialWizardState>({
    userType: null,
    showHero: true,
    showRoles: false,
    showFooter: false
  });
  
  const navigate = useNavigate();
  const { setUserType } = useAnalysis();
  
  // Use ref to prevent duplicate logs in React StrictMode
  const hasMounted = useRef(false);
  
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      if (localStorage.getItem('bb_debug_verbose') === 'true') {
        console.log('🏁 InitialWizard mounted');
      }
      
      // Staggered animation sequence
      const timer1 = setTimeout(() => setWizardState(prev => ({ ...prev, showRoles: true })), 800);
      const timer2 = setTimeout(() => setWizardState(prev => ({ ...prev, showFooter: true })), 1200);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, []);

  const totalSteps = 1;
  const stepNames = ["User Type"];
  const stepTitles = ["Welcome to Marico's Insighting Tool"];

  const handleUserTypeSelect = (userType: 'brand-leader' | 'data-scientist') => {
    if (localStorage.getItem('bb_debug_verbose') === 'true') {
      console.log('🎯 InitialWizard: User type selected:', userType);
    }
    setWizardState(prev => ({ ...prev, userType }));
    
    // FIXED: Set user type in AnalysisContext before routing
    if (localStorage.getItem('bb_debug_verbose') === 'true') {
      console.log('🔧 InitialWizard: Setting user type in context:', userType);
    }
    setUserType(userType);
    
    // Route to appropriate wizard based on user type selection
    if (userType === 'brand-leader') {
      if (localStorage.getItem('bb_debug_verbose') === 'true') {
        console.log('🚀 InitialWizard: Navigating to brand-leader route');
      }
      navigate('/brand-leader');
    } else if (userType === 'data-scientist') {
      if (localStorage.getItem('bb_debug_verbose') === 'true') {
        console.log('🚀 InitialWizard: Navigating to data-scientist route');
      }
      navigate('/data-scientist');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-premium overflow-hidden">
      {/* Premium Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm relative z-10">
        <div className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">Marico's Insighting Tool</h1>
                <span className="text-sm font-medium text-muted-foreground">Advanced Analytics Platform</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-4 py-2 bg-gradient-premium rounded-full border border-border/40 shadow-sm">
            <span className="text-sm font-semibold text-primary">Step {totalSteps}</span>
            <div className="w-px h-4 bg-border/60" />
            <span className="text-sm text-muted-foreground">of {totalSteps}</span>
          </div>
        </div>
      </header>

      {/* Premium Main Content */}
      <main className="flex-1 relative">
        {/* Premium Hero Section */}
        {wizardState.showHero && (
          <PremiumHero />
        )}

        {/* Enhanced Role Selection */}
        {wizardState.showRoles && (
          <div className="px-8 py-12 animate-fade-in-up">
            <div className="w-full">
              <div className="text-center mb-16">
                <h2 className="text-5xl font-bold text-primary mb-6 animate-fade-in-up">
                  Choose Your Journey
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed font-medium animate-fade-in-up">
                  Select your role to unlock a personalized analytics experience designed for your specific needs
                </p>
              </div>
              
              <EnhancedRoleSelection 
                onUserTypeSelect={handleUserTypeSelect}
                selectedUserType={wizardState.userType}
              />
            </div>
          </div>
        )}

        {/* Premium Footer */}
        {wizardState.showFooter && (
          <PremiumFooter />
        )}
      </main>
    </div>
  );
}
