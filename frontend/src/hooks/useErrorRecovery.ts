/**
 * ========================================
 * MARICO INSIGHTS - ERROR RECOVERY HOOK
 * ========================================
 * 
 * Purpose: React hook for error recovery and stuck user detection
 * 
 * Description:
 * This hook provides error recovery functionality that can be used
 * in React components to detect if users are stuck and provide
 * recovery options.
 * 
 * Key Functionality:
 * - Detect if user is stuck on a page
 * - Provide emergency recovery options
 * - Monitor page health and error states
 * - Automatic recovery mechanisms
 * 
 * Usage:
 * const { isStuck, forceRecovery, addEmergencyButton } = useErrorRecovery();
 * 
 * // Check if user is stuck
 * if (isStuck) {
 *   // Show recovery options
 * }
 * 
 * // Force recovery
 * forceRecovery();
 * 
 * Dependencies:
 * - React hooks (useState, useEffect, useCallback)
 * - Error recovery utilities
 * 
 * Used by:
 * - Components that need error recovery
 * - Pages that might get stuck
 * - Error handling scenarios
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  checkIfUserIsStuck, 
  forceRedirectToHomepage, 
  clearAllState,
  addEmergencyRecoveryButton,
  removeEmergencyRecoveryButton
} from '@/utils/errorRecovery';

interface UseErrorRecoveryOptions {
  enableAutoRecovery?: boolean;
  recoveryDelay?: number;
  showEmergencyButton?: boolean;
}

export function useErrorRecovery(options: UseErrorRecoveryOptions = {}) {
  const {
    enableAutoRecovery = true,
    recoveryDelay = 30000, // 30 seconds
    showEmergencyButton = true
  } = options;

  const [isStuck, setIsStuck] = useState(false);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);

  // Check if user is stuck
  const checkStuckStatus = useCallback(() => {
    const stuck = checkIfUserIsStuck();
    setIsStuck(stuck);
    return stuck;
  }, []);

  // Force recovery to homepage
  const forceRecovery = useCallback(() => {
    console.log('🚨 Force recovery initiated');
    setRecoveryAttempts(prev => prev + 1);
    forceRedirectToHomepage();
  }, []);

  // Clear all state and recover
  const clearAndRecover = useCallback(() => {
    console.log('🧹 Clear and recover initiated');
    setRecoveryAttempts(prev => prev + 1);
    clearAllState();
  }, []);

  // Add emergency recovery button
  const addEmergencyButton = useCallback(() => {
    if (showEmergencyButton) {
      addEmergencyRecoveryButton();
    }
  }, [showEmergencyButton]);

  // Remove emergency recovery button
  const removeEmergencyButton = useCallback(() => {
    removeEmergencyRecoveryButton();
  }, []);

  // Monitor stuck status
  useEffect(() => {
    // Check immediately
    checkStuckStatus();

    // Set up interval to check periodically
    const interval = setInterval(() => {
      const stuck = checkStuckStatus();
      
      if (stuck && enableAutoRecovery) {
        console.log('🚨 User detected as stuck, initiating auto-recovery');
        setTimeout(() => {
          forceRecovery();
        }, recoveryDelay);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [checkStuckStatus, enableAutoRecovery, recoveryDelay, forceRecovery]);

  // Add emergency button when stuck
  useEffect(() => {
    if (isStuck) {
      addEmergencyButton();
    } else {
      removeEmergencyButton();
    }

    return () => {
      removeEmergencyButton();
    };
  }, [isStuck, addEmergencyButton, removeEmergencyButton]);

  return {
    isStuck,
    recoveryAttempts,
    checkStuckStatus,
    forceRecovery,
    clearAndRecover,
    addEmergencyButton,
    removeEmergencyButton
  };
}
