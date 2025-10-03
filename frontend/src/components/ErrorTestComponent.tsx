/**
 * ========================================
 * MARICO INSIGHTS - ERROR TEST COMPONENT
 * ========================================
 * 
 * Purpose: Test component to demonstrate error handling mechanism
 * 
 * Description:
 * This component is used for testing the error boundary and retry logic.
 * It provides buttons to trigger different types of errors to verify
 * that the error handling system works correctly.
 * 
 * Key Functionality:
 * - Trigger JavaScript errors
 * - Test retry mechanism
 * - Verify homepage redirect
 * - Test error state persistence
 * 
 * Usage:
 * - Only use in development mode
 * - Add to any page for testing error handling
 * - Remove from production builds
 * 
 * Dependencies:
 * - React hooks
 * - UI components
 * - Error boundary system
 * 
 * Used by:
 * - Development testing only
 * - Error handling verification
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Bug, RefreshCw } from 'lucide-react';

interface ErrorTestComponentProps {
  className?: string;
}

export function ErrorTestComponent({ className }: ErrorTestComponentProps) {
  const [shouldThrowError, setShouldThrowError] = useState(false);

  // Only show in development
  if (!import.meta.env.DEV) {
    return null;
  }

  const triggerError = () => {
    setShouldThrowError(true);
  };

  const triggerAsyncError = async () => {
    // Simulate an async error
    await new Promise(resolve => setTimeout(resolve, 100));
    throw new Error('Simulated async error for testing');
  };

  const triggerNetworkError = () => {
    // Simulate a network error
    fetch('/non-existent-endpoint')
      .then(() => {})
      .catch(() => {
        throw new Error('Network error simulation');
      });
  };

  // This will trigger the error boundary
  if (shouldThrowError) {
    throw new Error('Test error triggered by ErrorTestComponent');
  }

  return (
    <Card className={`border-orange-200 bg-orange-50 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Bug className="h-5 w-5" />
          Error Handling Test (Development Only)
        </CardTitle>
        <CardDescription className="text-orange-700">
          Use these buttons to test the error boundary and retry mechanism.
          The error boundary should catch these errors and show retry options.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={triggerError}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Trigger Sync Error
          </Button>
          
          <Button
            onClick={triggerAsyncError}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Trigger Async Error
          </Button>
          
          <Button
            onClick={triggerNetworkError}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Trigger Network Error
          </Button>
        </div>
        
        <div className="text-xs text-orange-600">
          <p><strong>Expected behavior:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Error boundary catches the error</li>
            <li>Shows retry button (up to 2 attempts)</li>
            <li>After 2 failed retries, redirects to homepage</li>
            <li>Homepage refreshes once to ensure clean state</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
