/**
 * ========================================
 * NON-MMM CHART CONTAINER COMPONENT
 * ========================================
 * 
 * Purpose: Individual chart container for Non-MMM analysis
 * 
 * Description:
 * This component renders a single chart container containing both line and scatter plots
 * for a variable against the target variable. It provides trendline selection and
 * displays statistical information.
 * 
 * Key Features:
 * - Line chart with dual Y-axes (target variable vs time)
 * - Scatter plot with trendline
 * - Trendline type selector dropdown
 * - Statistical information display (R², slope)
 * - Expected vs unexpected result indicator
 * 
 * Dependencies:
 * - Recharts for chart rendering
 * - React hooks for state management
 * - shadcn/ui components for UI elements
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

import React, { useMemo, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Trash2, Copy } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ComposedChart } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { 
  calculateDualAxisDomain, 
  calculateScatterPlotDomain, 
  createTickFormatter,
  formatTooltipValue 
} from '@/utils/chartScaling';

export interface NonMMMChartContainerProps {
  variable: string;
  targetVariable: string;
  lineChart?: {
    xValues: string[];
    yValues: number[];
    secondaryYValues: number[];
  } | null;
  scatterPlot: {
    xValues: number[];
    yValues: number[];
    trendline: {
      x: number[];
      y: number[];
    };
    slope: number;
    rSquared: number;
  };
  trendlineType: string;
  isExpectedResult: boolean;
  expectedSign: string;
  onTrendlineChange: (variable: string, newType: string) => void;
  onDelete?: (variable: string) => void;
}

export function NonMMMChartContainer({
  variable,
  targetVariable,
  lineChart,
  scatterPlot,
  trendlineType,
  isExpectedResult,
  expectedSign,
  onTrendlineChange,
  onDelete,
}: NonMMMChartContainerProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Trendline options
  const trendlineOptions = [
    { value: 'linear', label: 'Linear' },
    { value: 'polynomial-2', label: 'Polynomial (Degree 2)' },
    { value: 'polynomial-3', label: 'Polynomial (Degree 3)' },
  ];

  // Copy chart container to clipboard as image
  const handleCopyChart = async () => {
    if (!chartContainerRef.current) return;

    try {
      // Use html2canvas to capture only the chart content area
      const { default: html2canvas } = await import('html2canvas');
      
      // Find the grid container that contains only the two charts (without summary cards)
      const chartsGrid = chartContainerRef.current.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2.gap-10');
      if (!chartsGrid) {
        throw new Error('Charts grid not found');
      }
      
      const canvas = await html2canvas(chartsGrid as HTMLElement, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution for better quality
        useCORS: true,
        allowTaint: true,
        logging: false,
        x: -20, // Capture a bit more on the left
        y: 0, // Start from the top of the grid (omits the titles)
        width: (chartsGrid as HTMLElement).offsetWidth + 40, // Add 40px total width (20px on each side)
        height: (chartsGrid as HTMLElement).offsetHeight, // Keep same height
      });

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            // Copy to clipboard
            await navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blob
              })
            ]);
            
            // Show success toast
            toast({
              title: "Chart Copied!",
              description: `Chart for ${variable} has been copied to clipboard. You can now paste it into PowerPoint.`,
              duration: 3000,
            });
          } catch (clipboardError) {
            console.error('Failed to copy to clipboard:', clipboardError);
            
            // Only show error toast, don't download automatically
            toast({
              title: "Copy Failed",
              description: `Failed to copy chart for ${variable} to clipboard. Please try again.`,
              variant: "destructive",
              duration: 3000,
            });
          }
        }
      }, 'image/png');
    } catch (error) {
      console.error('Failed to capture chart:', error);
      toast({
        title: "Copy Failed",
        description: `Failed to copy chart for ${variable}. Please try again.`,
        variant: "destructive",
        duration: 3000,
      });
    }
  };

    // Function to calculate trendline points dynamically using proper regression
  const calculateTrendline = useCallback((xValues: number[], yValues: number[], type: string) => {
    if (xValues.length < 2) return { x: [], y: [], slope: 0, rSquared: 0 };
    
    // Calculate trendline for the given type
    
    try {
      // Calculate the range of x values
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      const range = maxX - minX;
      
      // Generate evenly spaced points across the entire range
      
      // Generate evenly spaced points across the entire range
      const numPoints = 50;
      const step = range / (numPoints - 1);
      
      const trendlineX = [];
      const trendlineY = [];
      
      if (type === 'linear') {
        // Linear regression: y = mx + b
        const n = xValues.length;
        const sumX = xValues.reduce((a, b) => a + b, 0);
        const sumY = yValues.reduce((a, b) => a + b, 0);
        const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
        const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Linear regression calculation complete
        
        // Generate evenly spaced trendline points
        for (let i = 0; i < numPoints; i++) {
          const x = minX + (i * step);
          const y = slope * x + intercept;
          trendlineX.push(x);
          trendlineY.push(y);
        }
        
        // Calculate R-squared for linear regression
        const yMean = yValues.reduce((a, b) => a + b, 0) / yValues.length;
        const ssRes = yValues.reduce((sum, y, i) => {
          const yPred = slope * xValues[i] + intercept;
          return sum + Math.pow(y - yPred, 2);
        }, 0);
        const ssTot = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
        const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
        
        return { x: trendlineX, y: trendlineY, slope, rSquared };
      } else if (type === 'polynomial-2') {
        // Polynomial regression degree 2: y = ax² + bx + c
        const n = xValues.length;
        
        try {
          // Direct polynomial-2 calculation using normal equations
          // For y = ax² + bx + c, we solve: X^T * X * coeffs = X^T * y
          // where X = [1, x, x²] for each data point
          
          const X = xValues.map(x => [1, x, x * x]); // Design matrix
          const y = yValues;
          
          // Calculate X^T * X
          const XTX = [
            [0, 0, 0],
            [0, 0, 0], 
            [0, 0, 0]
          ];
          
          for (let i = 0; i < X.length; i++) {
            for (let j = 0; j < 3; j++) {
              for (let k = 0; k < 3; k++) {
                XTX[j][k] += X[i][j] * X[i][k];
              }
            }
          }
          
          // Calculate X^T * y
          const XTy = [0, 0, 0];
          for (let i = 0; i < X.length; i++) {
            for (let j = 0; j < 3; j++) {
              XTy[j] += X[i][j] * y[i];
            }
          }
          
          // Solving polynomial-2 normal equations
          
          // Solve using Cramer's rule for 3x3 system
          const det = XTX[0][0] * (XTX[1][1] * XTX[2][2] - XTX[1][2] * XTX[2][1]) -
                     XTX[0][1] * (XTX[1][0] * XTX[2][2] - XTX[1][2] * XTX[2][0]) +
                     XTX[0][2] * (XTX[1][0] * XTX[2][1] - XTX[1][1] * XTX[2][0]);
          
          if (Math.abs(det) < 1e-10) {
            throw new Error('Singular matrix - cannot solve polynomial regression');
          }
          
          // Cramer's rule - coefficients are [c, b, a] for y = ax² + bx + c
          // detA = det of matrix with first column replaced by XTy
          const detA = XTy[0] * (XTX[1][1] * XTX[2][2] - XTX[1][2] * XTX[2][1]) -
                      XTy[1] * (XTX[0][1] * XTX[2][2] - XTX[0][2] * XTX[2][1]) +
                      XTy[2] * (XTX[0][1] * XTX[1][2] - XTX[0][2] * XTX[1][1]);
                      
          // detB = det of matrix with second column replaced by XTy  
          const detB = XTX[0][0] * (XTy[1] * XTX[2][2] - XTy[2] * XTX[2][1]) -
                      XTX[0][1] * (XTy[0] * XTX[2][2] - XTy[2] * XTX[2][0]) +
                      XTX[0][2] * (XTy[0] * XTX[2][1] - XTy[1] * XTX[2][0]);
                      
          // detC = det of matrix with third column replaced by XTy
          const detC = XTX[0][0] * (XTX[1][1] * XTy[2] - XTX[1][2] * XTy[1]) -
                      XTX[0][1] * (XTX[1][0] * XTy[2] - XTX[1][2] * XTy[0]) +
                      XTX[0][2] * (XTX[1][0] * XTy[1] - XTX[1][1] * XTy[0]);
          
          // coefficients = [c, b, a] for y = ax² + bx + c
          const coefficients = [detA / det, detB / det, detC / det];
          
          // Polynomial-2 regression calculation complete
          
          // Generate evenly spaced trendline points
          // coefficients = [c, b, a] for y = ax² + bx + c
          for (let i = 0; i < numPoints; i++) {
            const x = minX + (i * step);
            const y = coefficients[2] * x * x + coefficients[1] * x + coefficients[0]; // ax² + bx + c
            trendlineX.push(x);
            trendlineY.push(y);
          }
          
          // Polynomial-2 trendline points generated
          
          // Calculate slope and R-squared for polynomial-2
          const slope = (trendlineY[trendlineY.length - 1] - trendlineY[0]) / (trendlineX[trendlineX.length - 1] - trendlineX[0]);
          const yMean = yValues.reduce((a, b) => a + b, 0) / yValues.length;
          const ssRes = yValues.reduce((sum, y, i) => {
            const yPred = coefficients[2] * xValues[i] * xValues[i] + coefficients[1] * xValues[i] + coefficients[0]; // ax² + bx + c
            return sum + Math.pow(y - yPred, 2);
          }, 0);
          const ssTot = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
          const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
          
          return { x: trendlineX, y: trendlineY, slope, rSquared };
        } catch (error) {
          console.error('❌ Polynomial-2 calculation failed:', error);
          // Fallback to linear regression
          const n = xValues.length;
          const sumX = xValues.reduce((a, b) => a + b, 0);
          const sumY = yValues.reduce((a, b) => a + b, 0);
          const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
          const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
          
          const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
          const intercept = (sumY - slope * sumX) / n;
          
          for (let i = 0; i < numPoints; i++) {
            const x = minX + (i * step);
            const y = slope * x + intercept;
            trendlineX.push(x);
            trendlineY.push(y);
          }
          
          const yMean = yValues.reduce((a, b) => a + b, 0) / yValues.length;
          const ssRes = yValues.reduce((sum, y, i) => {
            const yPred = slope * xValues[i] + intercept;
            return sum + Math.pow(y - yPred, 2);
          }, 0);
          const ssTot = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
          const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
          
          return { x: trendlineX, y: trendlineY, slope, rSquared };
        }
      } else if (type === 'polynomial-3') {
        // Polynomial regression degree 3: y = ax³ + bx² + cx + d
        const n = xValues.length;
        
        try {
          // Direct polynomial-3 calculation using normal equations
          // For y = ax³ + bx² + cx + d, we solve: X^T * X * coeffs = X^T * y
          // where X = [1, x, x², x³] for each data point
          
          const X = xValues.map(x => [1, x, x * x, x * x * x]); // Design matrix
          const y = yValues;
          
          // Calculate X^T * X
          const XTX = [
            [0, 0, 0, 0],
            [0, 0, 0, 0], 
            [0, 0, 0, 0],
            [0, 0, 0, 0]
          ];
          
          for (let i = 0; i < X.length; i++) {
            for (let j = 0; j < 4; j++) {
              for (let k = 0; k < 4; k++) {
                XTX[j][k] += X[i][j] * X[i][k];
              }
            }
          }
          
          // Calculate X^T * y
          const XTy = [0, 0, 0, 0];
          for (let i = 0; i < X.length; i++) {
            for (let j = 0; j < 4; j++) {
              XTy[j] += X[i][j] * y[i];
            }
          }
          
          // Solving polynomial-3 normal equations
          
          // Use the existing solveLinearSystem for 4x4 system
          const coefficients = solveLinearSystem(XTX, XTy);
          
          // Polynomial-3 regression calculation complete
          
          // Generate evenly spaced trendline points
          for (let i = 0; i < numPoints; i++) {
            const x = minX + (i * step);
            const y = coefficients[0] + coefficients[1] * x + coefficients[2] * x * x + coefficients[3] * x * x * x;
            trendlineX.push(x);
            trendlineY.push(y);
          }
          
          // Calculate slope and R-squared for polynomial-3
          const slope = (trendlineY[trendlineY.length - 1] - trendlineY[0]) / (trendlineX[trendlineX.length - 1] - trendlineX[0]);
          const yMean = yValues.reduce((a, b) => a + b, 0) / yValues.length;
          const ssRes = yValues.reduce((sum, y, i) => {
            const yPred = coefficients[0] + coefficients[1] * xValues[i] + coefficients[2] * xValues[i] * xValues[i] + coefficients[3] * xValues[i] * xValues[i] * xValues[i];
            return sum + Math.pow(y - yPred, 2);
          }, 0);
          const ssTot = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
          const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
          
          return { x: trendlineX, y: trendlineY, slope, rSquared };
        } catch (error) {
          console.error('❌ Polynomial-3 calculation failed:', error);
          // Fallback to linear regression
          const n = xValues.length;
          const sumX = xValues.reduce((a, b) => a + b, 0);
          const sumY = yValues.reduce((a, b) => a + b, 0);
          const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
          const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
          
          const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
          const intercept = (sumY - slope * sumX) / n;
          
          for (let i = 0; i < numPoints; i++) {
            const x = minX + (i * step);
            const y = slope * x + intercept;
            trendlineX.push(x);
            trendlineY.push(y);
          }
          
          const yMean = yValues.reduce((a, b) => a + b, 0) / yValues.length;
          const ssRes = yValues.reduce((sum, y, i) => {
            const yPred = slope * xValues[i] + intercept;
            return sum + Math.pow(y - yPred, 2);
          }, 0);
          const ssTot = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
          const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
          
          return { x: trendlineX, y: trendlineY, slope, rSquared };
        }
      } else {
        // Default to linear
        const n = xValues.length;
        const sumX = xValues.reduce((a, b) => a + b, 0);
        const sumY = yValues.reduce((a, b) => a + b, 0);
        const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
        const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        for (let i = 0; i < numPoints; i++) {
          const x = minX + (i * step);
          const y = slope * x + intercept;
          trendlineX.push(x);
          trendlineY.push(y);
        }
        
        // Calculate R-squared for fallback linear regression
        const yMean = yValues.reduce((a, b) => a + b, 0) / yValues.length;
        const ssRes = yValues.reduce((sum, y, i) => {
          const yPred = slope * xValues[i] + intercept;
          return sum + Math.pow(y - yPred, 2);
        }, 0);
        const ssTot = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
        const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
        
        return { x: trendlineX, y: trendlineY, slope, rSquared };
      }
      
      return { x: trendlineX, y: trendlineY, slope: 0, rSquared: 0 };
    } catch (error) {
      console.error('Error calculating trendline:', error);
      // Fallback to original trendline data
      return {
        x: scatterPlot.trendline?.x || [],
        y: scatterPlot.trendline?.y || [],
        slope: scatterPlot.slope || 0,
        rSquared: scatterPlot.rSquared || 0
      };
    }
  }, [scatterPlot.trendline, scatterPlot.slope, scatterPlot.rSquared]);

  // Helper function to solve linear system using Gaussian elimination
  const solveLinearSystem = (A: number[][], b: number[]): number[] => {
    const n = A.length;
    const augmented = A.map((row, i) => [...row, b[i]]);
    
    // Forward elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      
      // Swap rows
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
      
      // Eliminate column
      for (let k = i + 1; k < n; k++) {
        const factor = augmented[k][i] / augmented[i][i];
        for (let j = i; j <= n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }
    
    // Back substitution
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let sum = 0;
      for (let j = i + 1; j < n; j++) {
        sum += augmented[i][j] * x[j];
      }
      x[i] = (augmented[i][n] - sum) / augmented[i][i];
    }
    
    return x;
  };

  // Line chart data for recharts
  const lineChartData = lineChart ? lineChart.xValues.map((x, index) => ({
    time: x,
    [targetVariable]: lineChart.yValues[index],
    [variable]: lineChart.secondaryYValues[index],
  })) : [];

  // Scatter plot data for recharts - use fixed property names for Scatter component
  const scatterPlotData = scatterPlot.xValues.map((x, i) => ({
    x: x,
    y: scatterPlot.yValues[i],
  }));

  // Calculate auto-scaling domains
  const lineChartDomains = lineChart ? calculateDualAxisDomain(
    lineChart.yValues, // primary values (target variable)
    lineChart.secondaryYValues, // secondary values (other variable)
    0.1 // 10% padding
  ) : null;

  const scatterPlotDomains = calculateScatterPlotDomain(
    scatterPlot.xValues,
    scatterPlot.yValues,
    0.1 // 10% padding
  );

  // Memoize trendline calculation to prevent unnecessary recalculations
  const dynamicTrendline = useMemo(() => {
    const result = calculateTrendline(scatterPlot.xValues, scatterPlot.yValues, trendlineType);
    return result;
  }, [scatterPlot.xValues, scatterPlot.yValues, trendlineType, calculateTrendline]);

  const trendlineData = useMemo(() => {
    const data = dynamicTrendline.x.map((x, i) => ({
      x: x,
      y: dynamicTrendline.y[i],
    }));
    return data;
  }, [dynamicTrendline.x, dynamicTrendline.y]);
  
  // Calculate dynamic slope and R² based on current trendline type
  const dynamicSlope = dynamicTrendline.slope || scatterPlot.slope;
  const dynamicRSquared = dynamicTrendline.rSquared || scatterPlot.rSquared;
  
  // Recalculate expected/unexpected result based on dynamic slope
  let dynamicIsExpectedResult = true; // Default to expected
  
  if (expectedSign === 'positive' && dynamicSlope > 0) {
    dynamicIsExpectedResult = true;
  } else if (expectedSign === 'negative' && dynamicSlope < 0) {
    dynamicIsExpectedResult = true;
  } else if (expectedSign === 'neutral') {
    dynamicIsExpectedResult = true; // Neutral expectations always match
  } else if (expectedSign === 'positive' && dynamicSlope <= 0) {
    dynamicIsExpectedResult = false; // Expected positive but got negative/zero slope
  } else if (expectedSign === 'negative' && dynamicSlope >= 0) {
    dynamicIsExpectedResult = false; // Expected negative but got positive/zero slope
  }
  // else if (expectedSign === 'negative' && dynamicSlope < 0) dynamicIsExpectedResult = true;
  // else if (expectedSign === 'neutral') dynamicIsExpectedResult = true; // Neutral is always expected
  // else dynamicIsExpectedResult = false;
  
  // Debug trendline calculation - only log when values actually change
  const prevDebugValues = useRef({
    trendlineType: '',
    dynamicSlope: 0,
    dynamicRSquared: 0,
    expectedSign: '',
    dynamicIsExpectedResult: false
  });

  React.useEffect(() => {
    const currentValues = {
      trendlineType,
      dynamicSlope,
      dynamicRSquared,
      expectedSign,
      dynamicIsExpectedResult
    };

    // Only log if values have actually changed
    const hasChanged = Object.keys(currentValues).some(key => 
      currentValues[key as keyof typeof currentValues] !== prevDebugValues.current[key as keyof typeof prevDebugValues.current]
    );

    if (hasChanged) {
      console.log('🔍 Chart Container Debug for', variable, ':', {
        trendlineType,
        frontendTrendlineLength: dynamicTrendline.x.length,
        scatterPlotDataLength: scatterPlotData.length,
        dynamicSlope,
        dynamicRSquared,
        expectedSign,
        dynamicIsExpectedResult
      });
      prevDebugValues.current = currentValues;
    }
  }, [variable, trendlineType, dynamicSlope, dynamicRSquared, expectedSign, dynamicIsExpectedResult, dynamicTrendline.x.length, scatterPlotData.length]);

  return (
    <Card ref={chartContainerRef} className="w-full border-2 hover:border-primary/30 transition-all duration-300 shadow-lg hover:shadow-xl mx-2" style={{ width: 'calc(100% + 10px)' }}>
             <CardHeader className="bg-primary/5 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <CardTitle className="text-xl font-bold text-gray-800">{variable}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant={dynamicIsExpectedResult ? "default" : "destructive"}
                  className={`px-3 py-1 text-sm font-medium ${
                    dynamicIsExpectedResult 
                      ? 'bg-secondary/10 text-secondary border-secondary/20' 
                      : 'bg-destructive/10 text-destructive border-destructive/20'
                  }`}
                >
                  {dynamicIsExpectedResult ? (
                    <>
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Expected Result
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 mr-1" />
                      Unexpected Result
                    </>
                  )}
                </Badge>
                <div className="text-sm text-gray-600 bg-white px-2 py-1 rounded border">
                  Expected: <span className="font-semibold text-gray-800">
                    {expectedSign === 'positive' ? '+ve' : expectedSign === 'negative' ? '-ve' : 'Neutral'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={trendlineType} onValueChange={(value) => onTrendlineChange(variable, value)}>
              <SelectTrigger className="w-56 bg-white border-2 border-gray-200 hover:border-primary/30">
                <SelectValue placeholder="Select trendline type" />
              </SelectTrigger>
              <SelectContent>
                {trendlineOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyChart}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-300"
              title={`Copy chart for ${variable} to clipboard`}
            >
              <Copy className="h-4 w-4" />
            </Button>
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(variable)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                title={`Delete variable ${variable}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Line Chart */}
          {lineChart && lineChartData.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  Time Series Analysis
                </h4>
              </div>
              <div className="h-80 bg-white border border-gray-200 rounded-lg p-4 mr-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 12, fill: '#666' }}
                      axisLine={{ stroke: '#ddd' }}
                    />
                    <YAxis 
                      yAxisId="left" 
                      domain={lineChartDomains ? [lineChartDomains.primary.min, lineChartDomains.primary.max] : ['dataMin', 'dataMax']}
                      ticks={lineChartDomains ? lineChartDomains.primary.ticks : undefined}
                      tick={{ fontSize: 12, fill: '#666' }}
                      axisLine={{ stroke: '#ddd' }}
                      tickFormatter={lineChartDomains ? createTickFormatter(lineChartDomains.primary.unit, lineChartDomains.primary.unitMultiplier) : undefined}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      domain={lineChartDomains ? [lineChartDomains.secondary.min, lineChartDomains.secondary.max] : ['dataMin', 'dataMax']}
                      ticks={lineChartDomains ? lineChartDomains.secondary.ticks : undefined}
                      tick={{ fontSize: 12, fill: '#666' }}
                      axisLine={{ stroke: '#ddd' }}
                      tickFormatter={lineChartDomains ? createTickFormatter(lineChartDomains.secondary.unit, lineChartDomains.secondary.unitMultiplier) : undefined}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value, name) => {
                        if (name === targetVariable && lineChartDomains) {
                          return [formatTooltipValue(value as number, lineChartDomains.primary.unit, lineChartDomains.primary.unitMultiplier), targetVariable];
                        } else if (name === variable && lineChartDomains) {
                          return [formatTooltipValue(value as number, lineChartDomains.secondary.unit, lineChartDomains.secondary.unitMultiplier), variable];
                        }
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey={targetVariable} 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={false}
                      connectNulls={false}
                      name={targetVariable}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey={variable} 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={false}
                      connectNulls={false}
                      strokeDasharray="5 5"
                      name={variable}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-gray-800">Time Series Analysis</h4>
              <div className="h-80 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 mr-4">
                <div className="text-center">
                  <div className="text-gray-400 text-4xl mb-2">📊</div>
                  <p className="text-gray-500 text-sm">No time data available</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Scatter Plot */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-3 h-3 bg-secondary rounded-full"></div>
                Correlation Analysis
              </h4>
            </div>
            <div className="h-80 bg-white border border-gray-200 rounded-lg p-4 ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart key={`scatter-${trendlineType}-${variable}`} data={scatterPlotData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    type="number"
                    dataKey="x" 
                    domain={[scatterPlotDomains.x.min, scatterPlotDomains.x.max]}
                    ticks={scatterPlotDomains.x.ticks}
                    tick={{ fontSize: 12, fill: '#666' }}
                    axisLine={{ stroke: '#ddd' }}
                    name={variable}
                    tickFormatter={createTickFormatter(scatterPlotDomains.x.unit, scatterPlotDomains.x.unitMultiplier)}
                  />
                  <YAxis 
                    type="number"
                    dataKey="y" 
                    domain={[scatterPlotDomains.y.min, scatterPlotDomains.y.max]}
                    ticks={scatterPlotDomains.y.ticks}
                    tick={{ fontSize: 12, fill: '#666' }}
                    axisLine={{ stroke: '#ddd' }}
                    name={targetVariable}
                    tickFormatter={createTickFormatter(scatterPlotDomains.y.unit, scatterPlotDomains.y.unitMultiplier)}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value, name) => {
                      if (name === 'x') {
                        return [formatTooltipValue(value as number, scatterPlotDomains.x.unit, scatterPlotDomains.x.unitMultiplier), variable];
                      } else if (name === 'y') {
                        return [formatTooltipValue(value as number, scatterPlotDomains.y.unit, scatterPlotDomains.y.unitMultiplier), targetVariable];
                      }
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Scatter 
                    data={scatterPlotData} 
                    fill="#3b82f6" 
                    stroke="#3b82f6"
                    r={5}
                    name={`${variable} vs ${targetVariable}`}
                  />
                  {/* Trendline as a separate line with its own data */}
                  {trendlineData.length > 0 && (
                    <Line 
                      key={`trendline-${trendlineType}-${variable}`}
                      data={trendlineData}
                      type="monotone" 
                      dataKey="y" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="8 4"
                      name="Trendline"
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Enhanced Statistics */}
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {dynamicSlope > 0 ? '+' : ''}{formatTooltipValue(dynamicSlope, '', 1)}
              </div>
              <div className="text-sm text-primary font-medium">Slope</div>
              <div className="text-xs text-primary/80 mt-1">
                {dynamicSlope > 0 ? 'Positive' : dynamicSlope < 0 ? 'Negative' : 'Zero'} relationship
              </div>
            </div>
          </div>
          <div className="bg-success/5 p-4 rounded-lg border border-success/20">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {dynamicRSquared.toFixed(3)}
              </div>
              <div className="text-sm text-secondary font-medium">R² (Goodness of Fit)</div>
              <div className="text-xs text-secondary/80 mt-1">
                {dynamicRSquared > 0.7 ? 'Strong' : dynamicRSquared > 0.3 ? 'Moderate' : 'Weak'} correlation
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
