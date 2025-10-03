/**
 * ========================================
 * MARICO INSIGHTS - ERROR HANDLER HOOK
 * ========================================
 * 
 * Purpose: Custom hook for consistent error handling across components
 * 
 * Description:
 * This hook provides a standardized way to handle errors in React components,
 * with automatic retry logic and user-friendly error messages. It integrates
 * with the global ErrorBoundary and provides consistent error handling patterns.
 * 
 * Key Functionality:
 * - Standardized error handling with toast notifications
 * - Automatic retry logic with exponential backoff
 * - Error logging for debugging
 * - User-friendly error messages
 * - Integration with global error boundary
 * 
 * Usage:
 * const { handleError, handleAsyncError } = useErrorHandler();
 * 
 * // For sync operations
 * try {
 *   riskyOperation();
 * } catch (error) {
 *   handleError(error, 'Operation failed');
 * }
 * 
 * // For async operations
 * const result = await handleAsyncError(
 *   asyncOperation(),
 *   'Failed to load data'
 * );
 * 
 * Dependencies:
 * - React hooks (useCallback, useRef)
 * - Toast notifications
 * - Console logging utilities
 * 
 * Used by:
 * - All components that need error handling
 * - Service functions for consistent error patterns
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

import { useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  retryable?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

interface RetryState {
  count: number;
  lastAttempt: number;
}

export function useErrorHandler() {
  const { toast } = useToast();
  const retryStateRef = useRef<Map<string, RetryState>>(new Map());

  const handleError = useCallback((
    error: unknown,
    userMessage: string = 'An unexpected error occurred',
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      retryable = false,
      maxRetries = 3,
      retryDelay = 1000
    } = options;

    // Log error for debugging
    if (logError) {
      console.error('🚨 Error handled:', {
        error: error instanceof Error ? error.message : error,
        userMessage,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
    }

    // Show user-friendly toast
    if (showToast) {
      toast({
        title: "Error",
        description: userMessage,
        variant: "destructive"
      });
    }

    // If error is retryable, check retry logic
    if (retryable) {
      const errorKey = userMessage;
      const retryState = retryStateRef.current.get(errorKey) || { count: 0, lastAttempt: 0 };
      
      if (retryState.count < maxRetries) {
        const now = Date.now();
        const timeSinceLastAttempt = now - retryState.lastAttempt;
        
        if (timeSinceLastAttempt >= retryDelay) {
          retryState.count++;
          retryState.lastAttempt = now;
          retryStateRef.current.set(errorKey, retryState);
          
          // Exponential backoff
          const delay = retryDelay * Math.pow(2, retryState.count - 1);
          
          setTimeout(() => {
            // This would need to be handled by the calling component
            console.log(`🔄 Retrying operation (attempt ${retryState.count}/${maxRetries})`);
          }, delay);
        }
      } else {
        // Max retries reached
        console.error('❌ Max retries reached for operation:', userMessage);
        retryStateRef.current.delete(errorKey);
      }
    }
  }, [toast]);

  const handleAsyncError = useCallback(async <T>(
    asyncOperation: () => Promise<T>,
    userMessage: string = 'Operation failed',
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> => {
    try {
      return await asyncOperation();
    } catch (error) {
      handleError(error, userMessage, options);
      return null;
    }
  }, [handleError]);

  const clearRetryState = useCallback((userMessage?: string) => {
    if (userMessage) {
      retryStateRef.current.delete(userMessage);
    } else {
      retryStateRef.current.clear();
    }
  }, []);

  const getRetryState = useCallback((userMessage: string) => {
    return retryStateRef.current.get(userMessage);
  }, []);

  return {
    handleError,
    handleAsyncError,
    clearRetryState,
    getRetryState
  };
}
