/**
 * ========================================
 * EXPORT BUTTON COMPONENT
 * ========================================
 * 
 * Purpose: Export to PPT button with progress and status indicators
 * 
 * Description:
 * This component provides a user-friendly interface for exporting
 * dashboard charts to PowerPoint presentations with visual feedback.
 * 
 * Key Functionality:
 * - Export button with loading states
 * - Progress indicator during export
 * - Success/error feedback
 * - Responsive design
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

import React from 'react';
import { Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useExportToPPT } from '../hooks/useExportToPPT';
import { ChartData } from '../types/chart';

interface ExportButtonProps {
  chartData: ChartData[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  chartData,
  className = '',
  size = 'md',
  variant = 'primary'
}) => {
  const {
    isExporting,
    exportProgress,
    error,
    success,
    exportToPPT,
    resetExport
  } = useExportToPPT();

  const handleExport = async () => {
    if (isExporting) return;
    
    try {
      await exportToPPT(chartData, {
        fileName: `Dashboard_Export_${new Date().toISOString().split('T')[0]}.pptx`,
        slideTitle: 'Dashboard Analysis',
        includeInsights: true
      });
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300';
      case 'outline':
        return 'bg-transparent text-blue-600 hover:bg-blue-50 border border-blue-300';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-5 h-5';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={isExporting || chartData.length === 0}
        className={`
          inline-flex items-center space-x-2 rounded-lg font-medium transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${getSizeClasses()}
          ${getVariantClasses()}
          ${className}
        `}
      >
        {isExporting ? (
          <>
            <Loader2 className={`${getIconSize()} animate-spin`} />
            <span>Exporting...</span>
          </>
        ) : success ? (
          <>
            <CheckCircle className={`${getIconSize()} text-green-600`} />
            <span>Exported!</span>
          </>
        ) : error ? (
          <>
            <AlertCircle className={`${getIconSize()} text-red-600`} />
            <span>Error</span>
          </>
        ) : (
          <>
            <Download className={getIconSize()} />
            <span>Export to PPT</span>
          </>
        )}
      </button>

      {/* Progress Bar */}
      {isExporting && (
        <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${exportProgress}%` }}
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-50 border border-red-200 rounded-lg shadow-lg z-10 min-w-max">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
            <button
              onClick={resetExport}
              className="text-red-600 hover:text-red-800 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-green-50 border border-green-200 rounded-lg shadow-lg z-10 min-w-max">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">PowerPoint exported successfully!</span>
          </div>
        </div>
      )}

      {/* Chart Count Badge */}
      {chartData.length > 0 && !isExporting && (
        <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {chartData.length}
        </div>
      )}
    </div>
  );
};
