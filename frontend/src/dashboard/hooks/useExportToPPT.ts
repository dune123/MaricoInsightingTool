/**
 * ========================================
 * USE EXPORT TO PPT HOOK
 * ========================================
 * 
 * Purpose: Custom hook for managing PPT export functionality
 * 
 * Description:
 * This hook provides state management and functions for exporting
 * dashboard charts to PowerPoint presentations.
 * 
 * Key Functionality:
 * - Export state management (loading, error, success)
 * - Chart element collection and validation
 * - Export progress tracking
 * - Error handling and user feedback
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

import { useState, useCallback } from 'react';
import { exportDashboardToPPT, ExportOptions } from '../lib/exportService';
import { ChartData } from '../types/chart';

export interface UseExportToPPTReturn {
  isExporting: boolean;
  exportProgress: number;
  error: string | null;
  success: boolean;
  exportToPPT: (chartData: ChartData[], options?: ExportOptions) => Promise<void>;
  resetExport: () => void;
}

export const useExportToPPT = (): UseExportToPPTReturn => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const exportToPPT = useCallback(async (
    chartData: ChartData[],
    options: ExportOptions = {}
  ) => {
    try {
      console.log('🚀 EXPORT STARTED - Debug Information:');
      console.log('📊 Chart Data:', chartData);
      console.log('⚙️ Options:', options);
      
      setIsExporting(true);
      setError(null);
      setSuccess(false);
      setExportProgress(0);

      // Validate chart data
      if (!chartData || chartData.length === 0) {
        console.error('❌ No chart data provided');
        throw new Error('No charts available to export');
      }
      
      console.log(`✅ Found ${chartData.length} charts to export`);

      // Find chart elements in the DOM by their data-chart-id attributes
      console.log('🔍 Searching for chart elements in DOM...');
      
      // Create a map of chart ID to element for proper ordering
      const elementMap = new Map<string, HTMLElement>();
      
      // Look for elements with data-chart-id attribute
      const elementsWithChartId = document.querySelectorAll('[data-chart-id]');
      console.log(`🎯 Found ${elementsWithChartId.length} elements with data-chart-id`);
      
      elementsWithChartId.forEach((element, index) => {
        if (element instanceof HTMLElement) {
          const chartId = element.getAttribute('data-chart-id');
          if (chartId) {
            elementMap.set(chartId, element);
            console.log(`🔗 Mapped chart element ${index}: ${chartId}`);
            
            // Debug: Check if the element contains chart content
            const hasSvg = element.querySelector('svg');
            const hasCanvas = element.querySelector('canvas');
            const hasRecharts = element.querySelector('.recharts-wrapper');
            console.log(`📊 Element ${chartId} contains:`, {
              svg: !!hasSvg,
              canvas: !!hasCanvas,
              recharts: !!hasRecharts,
              dimensions: `${element.offsetWidth}x${element.offsetHeight}`,
              visible: element.offsetWidth > 0 && element.offsetHeight > 0
            });
          }
        }
      });

      // If no data-chart-id elements found, try alternative selectors
      if (elementMap.size === 0) {
        console.log('⚠️ No data-chart-id elements found, trying alternative selectors...');
        const alternativeSelectors = [
          '.recharts-wrapper',
          '[data-testid="chart-container"]',
          '.chart-container'
        ];

        for (const selector of alternativeSelectors) {
          const elements = document.querySelectorAll(selector);
          console.log(`🔍 Found ${elements.length} elements with selector: ${selector}`);
          elements.forEach((element, index) => {
            if (element instanceof HTMLElement && index < chartData.length) {
              // Use index as fallback ID
              const fallbackId = `fallback-${index}`;
              elementMap.set(fallbackId, element);
              console.log(`🔄 Mapped fallback element: ${fallbackId}`);
            }
          });
        }
      }

      if (elementMap.size === 0) {
        console.error('❌ No chart elements found in the dashboard');
        throw new Error('No chart elements found in the dashboard');
      }

      setExportProgress(25);

      // Wait a moment to ensure all charts are fully rendered
      console.log('⏳ Waiting for charts to fully render...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Increased wait time for better rendering

      // Get elements in the order of chartData, respecting layout
      const elementsToUse: HTMLElement[] = [];
      const missingCharts: string[] = [];
      
      console.log('📋 Processing charts in order:');
      for (const chart of chartData) {
        console.log(`📊 Processing chart: ${chart.title} (ID: ${chart.id})`);
        const element = elementMap.get(chart.id);
        if (element) {
          elementsToUse.push(element);
          console.log(`✅ Found element for chart: ${chart.title} (ID: ${chart.id})`);
        } else {
          console.warn(`⚠️ Chart element not found for chart: ${chart.title} (ID: ${chart.id})`);
          missingCharts.push(chart.title);
        }
      }

      if (elementsToUse.length === 0) {
        console.error('❌ No matching chart elements found for the provided chart data');
        throw new Error('No matching chart elements found for the provided chart data');
      }

      if (missingCharts.length > 0) {
        console.warn(`⚠️ Missing elements for ${missingCharts.length} charts:`, missingCharts);
        // Continue with available charts rather than failing completely
      }
      
      console.log(`🎯 Using ${elementsToUse.length} elements for export`);
      setExportProgress(50);

      // Export to PPT
      console.log('📤 Starting PPT generation...');
      await exportDashboardToPPT(elementsToUse, chartData, options);
      
      setExportProgress(100);
      setSuccess(true);
      
      console.log('🎉 Export completed successfully!');
      
      // Reset after a short delay
      setTimeout(() => {
        setSuccess(false);
        setExportProgress(0);
      }, 3000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      console.error('❌ Export error:', err);
      setError(errorMessage);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const resetExport = useCallback(() => {
    setIsExporting(false);
    setExportProgress(0);
    setError(null);
    setSuccess(false);
  }, []);

  return {
    isExporting,
    exportProgress,
    error,
    success,
    exportToPPT,
    resetExport
  };
};