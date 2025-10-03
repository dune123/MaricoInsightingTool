/**
 * ========================================
 * MARICO INSIGHTS - EMERGENCY RECOVERY COMPONENT
 * ========================================
 * 
 * Purpose: Emergency recovery component for stuck users
 * 
 * Description:
 * This component provides a visible emergency recovery option
 * that users can access if they get stuck on a page. It includes
 * a floating button that appears when needed.
 * 
 * Key Functionality:
 * - Floating emergency recovery button
 * - Clear all state and redirect to homepage
 * - User confirmation before recovery
 * - Automatic positioning and styling
 * 
 * Usage:
 * <EmergencyRecovery />
 * 
 * Dependencies:
 * - React hooks
 * - Error recovery utilities
 * - UI components
 * 
 * Used by:
 * - Any page that might get stuck
 * - Error recovery scenarios
 * - Manual recovery options
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { forceRedirectToHomepage, clearAllState, nuclearRecovery } from '@/utils/errorRecovery';

interface EmergencyRecoveryProps {
  show?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoShow?: boolean;
  autoShowDelay?: number;
}

export function EmergencyRecovery({ 
  show = false, 
  position = 'top-right',
  autoShow = true,
  autoShowDelay = 60000 // 1 minute
}: EmergencyRecoveryProps) {
  const [isVisible, setIsVisible] = useState(show);
  const [isRecovering, setIsRecovering] = useState(false);

  // Auto-show after delay if enabled
  useEffect(() => {
    if (autoShow && !show) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, autoShowDelay);

      return () => clearTimeout(timer);
    }
  }, [autoShow, autoShowDelay, show]);

  // Handle emergency recovery
  const handleEmergencyRecovery = async () => {
    if (isRecovering) return;

    const confirmed = window.confirm(
      'This will clear ALL your progress and take you back to the homepage. Are you sure you want to continue?'
    );

    if (confirmed) {
      setIsRecovering(true);
      
      try {
        // Use nuclear recovery to clear everything
        nuclearRecovery();
      } catch (error) {
        console.error('Error during emergency recovery:', error);
        // Force redirect even if clearing state fails
        forceRedirectToHomepage();
      }
    }
  };

  // Handle simple redirect (keep state)
  const handleSimpleRedirect = () => {
    if (isRecovering) return;

    const confirmed = window.confirm(
      'This will take you back to the homepage without clearing your progress. Continue?'
    );

    if (confirmed) {
      setIsRecovering(true);
      forceRedirectToHomepage();
    }
  };

  if (!isVisible) {
    return null;
  }

  // Position styles
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div className={`fixed ${positionStyles[position]} z-50`}>
      <div className="bg-white border border-red-200 rounded-lg shadow-lg p-3 max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-sm font-medium text-red-800">Need Help?</span>
        </div>
        
        <p className="text-xs text-gray-600 mb-3">
          If you're stuck on this page, you can use these recovery options:
        </p>
        
        <div className="space-y-2">
          <Button
            onClick={handleSimpleRedirect}
            disabled={isRecovering}
            size="sm"
            variant="outline"
            className="w-full text-xs"
          >
            <Home className="h-3 w-3 mr-1" />
            Go to Homepage
          </Button>
          
          <Button
            onClick={handleEmergencyRecovery}
            disabled={isRecovering}
            size="sm"
            variant="destructive"
            className="w-full text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            {isRecovering ? 'Recovering...' : 'Emergency Recovery'}
          </Button>
        </div>
        
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 text-xs"
        >
          ×
        </button>
      </div>
    </div>
  );
}
