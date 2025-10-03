/**
 * ========================================
 * DATA LOADING STATUS COMPONENT - DATA CONCATENATION MODULE
 * ========================================
 * 
 * Purpose: Display loading states and error messages for data operations
 * 
 * Description:
 * Reusable component for showing loading indicators, error states, and
 * success messages during data loading operations in the concatenation step.
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

import { AlertCircle, Database, CheckCircle } from "lucide-react";
import { DataLoadingState } from '../types';

interface DataLoadingStatusProps {
  loadingState: DataLoadingState;
  brandName?: string;
  onRetry?: () => void;
}

export function DataLoadingStatus({ 
  loadingState, 
  brandName, 
  onRetry 
}: DataLoadingStatusProps) {
  // Loading state
  if (loadingState.isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Database className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
        <p>Loading existing analysis data{brandName ? ` for ${brandName}` : ''}...</p>
        <p className="text-sm mt-2">Searching for concatenated files...</p>
        {loadingState.progress && (
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4 mx-auto">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${loadingState.progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }
  
  // Error state
  if (loadingState.error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
        <p className="text-destructive font-medium mb-2">Failed to Load Data</p>
        <p className="text-sm text-muted-foreground mb-4">{loadingState.error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }
  
  // Success state (loaded)
  if (loadingState.isLoaded) {
    return (
      <div className="text-center py-6">
        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-secondary" />
        <p className="text-sm text-secondary/80">
          Data loaded successfully{brandName ? ` for ${brandName}` : ''}
        </p>
      </div>
    );
  }
  
  // No data available state
  return (
    <div className="text-center py-12 text-muted-foreground">
      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
      <p>No analysis data available.</p>
      <p className="text-sm mt-2">
        Please upload a file first or go back to select an analysis.
      </p>
    </div>
  );
}
