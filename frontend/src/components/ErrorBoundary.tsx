/**
 * ========================================
 * MARICO INSIGHTS - ERROR BOUNDARY COMPONENT
 * ========================================
 * 
 * Purpose: Global error boundary to catch React errors and prevent infinite refresh loops
 * 
 * Description:
 * This component implements a robust error handling mechanism that:
 * - Catches JavaScript errors anywhere in the component tree
 * - Prevents infinite refresh loops by tracking retry attempts
 * - Redirects to homepage after 2 failed retry attempts
 * - Provides user-friendly error messages and recovery options
 * - Maintains error state persistence across page refreshes
 * 
 * Key Functionality:
 * - Error boundary with retry counter (max 2 attempts)
 * - Automatic homepage redirect after failed retries
 * - Error state persistence using sessionStorage
 * - User-friendly error UI with retry and home options
 * - Development vs production error display
 * - Clean error state reset on successful navigation
 * 
 * Error Flow:
 * 1. Error occurs → Error boundary catches it
 * 2. First attempt → Show retry button, increment counter
 * 3. Second attempt → Show retry button, increment counter  
 * 4. Third attempt → Auto-redirect to homepage
 * 5. Homepage loads → Reset error state, refresh once
 * 
 * Dependencies:
 * - React Error Boundary lifecycle methods
 * - React Router for navigation
 * - SessionStorage for state persistence
 * - Custom UI components for error display
 * 
 * Used by:
 * - App.tsx as the root error boundary
 * - All route components for error protection
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCw, Bug } from 'lucide-react';
import { forceRedirectToHomepage, addEmergencyRecoveryButton, removeEmergencyRecoveryButton, setupEmergencyRecoveryShortcut, setupGlobalRecoveryFunctions } from '@/utils/errorRecovery';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRedirecting: boolean;
}

// Constants for error handling
const MAX_RETRY_ATTEMPTS = 2;
const ERROR_STATE_KEY = 'marico_error_state';
const HOMEPAGE_REDIRECT_DELAY = 1000;

class ErrorBoundary extends Component<Props, State> {
  private navigate: any;
  private handleUnhandledError: (event: ErrorEvent) => void;
  private handleUnhandledRejection: (event: PromiseRejectionEvent) => void;

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRedirecting: false
    };

    // Get retry count from session storage
    this.loadErrorState();
  }

  componentDidMount() {
    // Set up navigation function
    this.navigate = this.getNavigateFunction();
    
    // Set up global error handlers
    this.setupGlobalErrorHandlers();
    
    // Add emergency recovery button
    addEmergencyRecoveryButton();
    
    // Set up keyboard shortcut
    setupEmergencyRecoveryShortcut();
    
    // Set up global recovery functions
    setupGlobalRecoveryFunctions();
  }

  componentWillUnmount() {
    // Clean up global error handlers
    this.cleanupGlobalErrorHandlers();
    
    // Remove emergency recovery button
    removeEmergencyRecoveryButton();
  }

  private getNavigateFunction() {
    // This is a workaround to use useNavigate in a class component
    // We'll use window.location for navigation instead
    return (path: string) => {
      window.location.href = path;
    };
  }

  private setupGlobalErrorHandlers() {
    // Handle unhandled JavaScript errors
    this.handleUnhandledError = (event: ErrorEvent) => {
      console.error('🚨 Unhandled error caught by global handler:', event.error);
      this.handleGlobalError(event.error, 'Unhandled JavaScript Error');
    };

    // Handle unhandled promise rejections
    this.handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 Unhandled promise rejection caught by global handler:', event.reason);
      this.handleGlobalError(event.reason, 'Unhandled Promise Rejection');
    };

    // Add event listeners
    window.addEventListener('error', this.handleUnhandledError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  private cleanupGlobalErrorHandlers() {
    // Remove event listeners
    window.removeEventListener('error', this.handleUnhandledError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  private handleGlobalError = (error: any, message: string) => {
    // Check if we should handle this error
    const retryCount = this.state.retryCount;
    
    if (retryCount >= MAX_RETRY_ATTEMPTS) {
      // Max retries reached, redirect to homepage immediately
      console.log('🚨 Max retries reached, redirecting to homepage');
      this.redirectToHomepage();
      return;
    }

    // Increment retry count and save state
    const newRetryCount = retryCount + 1;
    this.setState({ retryCount: newRetryCount });
    this.saveErrorState();

    // If this is the first error, try to reload the page
    if (newRetryCount === 1) {
      console.log('🔄 First error, attempting page reload');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      // Second error, redirect to homepage
      console.log('🚨 Second error, redirecting to homepage');
      this.redirectToHomepage();
    }
  };

  private redirectToHomepage() {
    // Use the utility function for more robust redirection
    forceRedirectToHomepage();
  }

  private loadErrorState() {
    try {
      const savedState = sessionStorage.getItem(ERROR_STATE_KEY);
      if (savedState) {
        const { retryCount, errorPath } = JSON.parse(savedState);
        this.setState({ retryCount: retryCount || 0 });
        
        // If we're on homepage and have error state, clear it
        if (window.location.pathname === '/' && retryCount > 0) {
          this.clearErrorState();
          // Refresh the page once to ensure clean state
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      }
    } catch (error) {
      console.error('Failed to load error state:', error);
    }
  }

  private saveErrorState() {
    try {
      const errorState = {
        retryCount: this.state.retryCount,
        errorPath: window.location.pathname,
        timestamp: Date.now()
      };
      sessionStorage.setItem(ERROR_STATE_KEY, JSON.stringify(errorState));
    } catch (error) {
      console.error('Failed to save error state:', error);
    }
  }

  private clearErrorState() {
    try {
      sessionStorage.removeItem(ERROR_STATE_KEY);
    } catch (error) {
      console.error('Failed to clear error state:', error);
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Save error state
    this.saveErrorState();
  }

  private handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    if (newRetryCount > MAX_RETRY_ATTEMPTS) {
      // Max retries reached, redirect to homepage
      this.handleGoHome();
      return;
    }

    this.setState({ 
      retryCount: newRetryCount,
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Save updated retry count
    this.saveErrorState();

    // Force a page refresh to retry
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  private handleGoHome = () => {
    this.setState({ isRedirecting: true });
    this.redirectToHomepage();
  };

  private handleReset = () => {
    this.clearErrorState();
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRedirecting: false
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, retryCount, isRedirecting } = this.state;
      const isDevelopment = import.meta.env.DEV;
      const canRetry = retryCount < MAX_RETRY_ATTEMPTS;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {isRedirecting ? 'Redirecting to Homepage...' : 'Something went wrong'}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {isRedirecting 
                  ? 'We\'re taking you back to the homepage to start fresh.'
                  : 'An unexpected error occurred. We\'re here to help you get back on track.'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error Details (Development Only) */}
              {isDevelopment && error && (
                <div className="rounded-lg bg-red-50 p-4">
                  <div className="flex items-center mb-2">
                    <Bug className="h-4 w-4 text-red-600 mr-2" />
                    <h4 className="text-sm font-medium text-red-800">Error Details (Development)</h4>
                  </div>
                  <pre className="text-xs text-red-700 overflow-auto max-h-32">
                    {error.message}
                    {error.stack && `\n\nStack Trace:\n${error.stack}`}
                  </pre>
                </div>
              )}

              {/* Retry Information */}
              {!isRedirecting && (
                <div className="text-center text-sm text-gray-600">
                  {canRetry ? (
                    <p>Retry attempt: {retryCount + 1} of {MAX_RETRY_ATTEMPTS + 1}</p>
                  ) : (
                    <p>Maximum retry attempts reached. Redirecting to homepage...</p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {!isRedirecting && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {canRetry && (
                    <Button 
                      onClick={this.handleRetry}
                      className="flex items-center gap-2"
                      variant="default"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Try Again
                    </Button>
                  )}
                  
                  <Button 
                    onClick={this.handleGoHome}
                    className="flex items-center gap-2"
                    variant="outline"
                  >
                    <Home className="h-4 w-4" />
                    Go to Homepage
                  </Button>
                </div>
              )}

              {/* Loading State for Redirect */}
              {isRedirecting && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-blue-600">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Redirecting...</span>
                  </div>
                </div>
              )}

              {/* Help Text */}
              <div className="text-center text-xs text-gray-500">
                <p>
                  If this problem persists, please contact support or try refreshing your browser.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
