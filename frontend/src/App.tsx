/**
 * ========================================
 * MARICO INSIGHTS - MAIN APPLICATION COMPONENT
 * ========================================
 * 
 * Purpose: Root React component that sets up the entire application structure
 * 
 * Description:
 * This is the main App component that configures the entire Marico Insights
 * frontend application. It sets up routing, global providers, UI components,
 * and the complete wizard-based analysis workflow. Now includes an epic
 * loading screen with animated Marico logo for premium user experience.
 * 
 * Key Functionality:
 * - Epic animated loading screen with Marico logo
 * - React Router configuration for multi-step wizard
 * - Global state management via AnalysisProvider
 * - UI component providers (Toast, Tooltip, Query)
 * - Complete step-by-step analysis workflow routing
 * - Error handling and 404 page routing
 * 
 * Application Flow:
 * 1. Loading Screen → Animated Marico logo (2 seconds)
 * 2. InitialWizard (/) → User Type Selection
 * 3. BrandLeaderWizard (/brand-leader) → Brand Leader workflow
 * 4. DataScientistWizard (/data-scientist) → Analysis Type Selection
 * 5. MMMWizard (/mmm/*) → Only after Data Scientist → MMM → Analysis Mode
 * 6. NonMMMWizard (/nonmmm/*) → Only after Data Scientist → Non-MMM
 * 
 * Dependencies:
 * - React Router for navigation
 * - TanStack Query for server state
 * - Radix UI components for UI
 * - Custom AnalysisContext for state management
 * - LoadingScreen component for initial experience
 * 
 * Used by:
 * - main.tsx as the root component
 * - All step pages for navigation context
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AnalysisProvider } from "@/context/AnalysisContext";
import LoadingScreen from "@/components/LoadingScreen";

// Route Guards
import { MMMRouteGuard, NonMMMRouteGuard } from "@/components/wizard/RouteGuard";

// MMM Analysis Components
import { MMMWizard } from "@/analysis/mmm/wizard/MMMWizard";

// Non-MMM Analysis Components
import { NonMMMWizard } from "@/analysis/nonmmm/wizard/NonMMMWizard";

// Brand Leader and Data Scientist Wizards
import { BrandLeaderWizard } from "@/components/wizard/BrandLeaderWizard";
import { DataScientistWizard } from "@/components/wizard/DataScientistWizard";

const queryClient = new QueryClient();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        
        {/* Epic Loading Screen */}
        {isLoading && (
          <LoadingScreen 
            onLoadingComplete={handleLoadingComplete}
            duration={3000}
          />
        )}
        
        {/* Main Application */}
        {!isLoading && (
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AnalysisProvider>
              <Routes>
                {/* Main entry point - InitialWizard for user type selection */}
                <Route path="/" element={<Index />} />
                
                {/* Brand Leader Routes */}
                <Route path="/brand-leader" element={<BrandLeaderWizard />} />
                
                {/* Data Scientist Routes */}
                <Route path="/data-scientist" element={<DataScientistWizard />} />
                
                {/* MMM Analysis Routes - ONLY accessible after proper user flow */}
                <Route path="/mmm" element={
                  <MMMRouteGuard>
                    <MMMWizard />
                  </MMMRouteGuard>
                } />
                <Route path="/mmm/*" element={
                  <MMMRouteGuard>
                    <MMMWizard />
                  </MMMRouteGuard>
                } />
                
                {/* Non-MMM Analysis Routes - ONLY accessible after proper user flow */}
                <Route path="/nonmmm" element={
                  <NonMMMRouteGuard>
                    <NonMMMWizard />
                  </NonMMMRouteGuard>
                } />
                <Route path="/nonmmm/*" element={
                  <NonMMMRouteGuard>
                    <NonMMMWizard />
                  </NonMMMRouteGuard>
                } />
                
                {/* Specific 404 route for features not yet implemented */}
                <Route path="/404" element={<NotFound />} />
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnalysisProvider>
          </BrowserRouter>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
