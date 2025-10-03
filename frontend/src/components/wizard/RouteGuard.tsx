/**
 * ========================================
 * BRANDBLOOM INSIGHTS - ROUTE GUARD COMPONENT
 * ========================================
 * 
 * Purpose: Protects routes from unauthorized access and ensures proper user flow
 * 
 * Description:
 * This component acts as a route guard that prevents users from accessing
 * protected routes (like MMMWizard or NonMMMWizard) unless they have completed
 * the proper user flow (User Type → Analysis Type).
 * 
 * Key Functionality:
 * - Route access validation based on user selections
 * - Redirects to appropriate starting point if flow is incomplete
 * - Ensures proper wizard progression
 * - Prevents premature mounting of specialized wizards
 * 
 * Component Structure:
 * - RouteGuard: Main guard component with validation logic
 * - MMMRouteGuard: Specific guard for MMM analysis routes
 * - NonMMMRouteGuard: Specific guard for Non-MMM analysis routes
 * 
 * Used by:
 * - App.tsx for route protection
 * - MMMWizard and NonMMMWizard for access control
 * 
 * Dependencies:
 * - AnalysisContext for state validation
 * - React Router for navigation and redirects
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '@/context/AnalysisContext';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredUserType?: 'brand-leader' | 'data-scientist';
  requiredAnalysisType?: 'mmm' | 'non-mmm';
  requiredAnalysisMode?: boolean;
  redirectTo?: string;
}

/**
 * Generic route guard that validates user flow completion
 */
export function RouteGuard({ 
  children, 
  requiredUserType, 
  requiredAnalysisType, 
  requiredAnalysisMode = false,
  redirectTo = '/'
}: RouteGuardProps) {
  const { state } = useAnalysis();
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('bb_debug_verbose') === 'true') {
      console.log('🔒 RouteGuard: Validating access with state:', {
        userType: state.userType,
        analysisType: state.analysisType,
        analysisMode: state.analysisMode,
        requiredUserType,
        requiredAnalysisType,
        requiredAnalysisMode
      });
    }

    // Check if user type is required and matches
    if (requiredUserType && state.userType !== requiredUserType) {
      if (localStorage.getItem('bb_debug_verbose') === 'true') {
        console.log('❌ RouteGuard: User type mismatch, redirecting to', redirectTo);
      }
      navigate(redirectTo, { replace: true });
      return;
    }

    // Check if analysis type is required and matches
    if (requiredAnalysisType && state.analysisType !== requiredAnalysisType) {
      if (localStorage.getItem('bb_debug_verbose') === 'true') {
        console.log('❌ RouteGuard: Analysis type mismatch, redirecting to', redirectTo);
      }
      navigate(redirectTo, { replace: true });
      return;
    }

    // Check if analysis mode is required and exists
    if (requiredAnalysisMode && !state.analysisMode) {
      if (localStorage.getItem('bb_debug_verbose') === 'true') {
        console.log('❌ RouteGuard: Analysis mode not set, redirecting to', redirectTo);
      }
      navigate(redirectTo, { replace: true });
      return;
    }

    if (localStorage.getItem('bb_debug_verbose') === 'true') {
      console.log('✅ RouteGuard: Access granted');
    }
  }, [state.userType, state.analysisType, state.analysisMode, requiredUserType, requiredAnalysisType, requiredAnalysisMode, navigate, redirectTo]);

  // Show loading or nothing while validating
  if (!state.userType || (requiredAnalysisType && !state.analysisType) || (requiredAnalysisMode && !state.analysisMode)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Validating access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Specific route guard for MMM analysis routes
 */
export function MMMRouteGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard
      requiredUserType="data-scientist"
      requiredAnalysisType="mmm"
      requiredAnalysisMode={false} // No longer required since we removed the Analysis Mode step
      redirectTo="/data-scientist"
    >
      {children}
    </RouteGuard>
  );
}

/**
 * Specific route guard for Non-MMM analysis routes
 */
export function NonMMMRouteGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard
      requiredUserType="data-scientist"
      requiredAnalysisType="non-mmm"
      redirectTo="/data-scientist"
    >
      {children}
    </RouteGuard>
  );
}
