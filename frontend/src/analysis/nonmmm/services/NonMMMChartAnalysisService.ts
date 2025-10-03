/**
 * ========================================
 * NON-MMM CHART ANALYSIS SERVICE
 * ========================================
 * 
 * Purpose: Handle chart generation and trendline analysis for Non-MMM analysis workflows
 * 
 * Description:
 * This service provides comprehensive chart analysis capabilities specifically for
 * Non-MMM analysis, including line charts, scatter plots, and trendline generation.
 * It supports multiple trendline types and provides expected vs. unexpected result
 * filtering based on user-defined expected signs.
 * 
 * Key Functionality:
 * - Generate line charts with trendlines
 * - Create scatter plots with trendline analysis
 * - Support multiple trendline types (linear, polynomial)
 * - Provide expected vs. unexpected result filtering
 * - Handle dynamic chart container management
 * 
 * Non-MMM Specific Features:
 * - Focus on target variable vs. independent variable relationships
 * - Simplified chart generation workflow
 * - Direct trendline type selection
 * - Streamlined result filtering
 * 
 * Chart Types:
 * - Line charts: Target variable vs. time with trendline
 * - Scatter plots: Target variable vs. independent variable with trendline
 * - Trendline options: Linear, Polynomial (degree 2), Polynomial (degree 3)
 * 
 * Dependencies:
 * - Python FastAPI backend for data processing
 * - Chart generation libraries
 * - Non-MMM type definitions
 * 
 * Used by:
 * - Non-MMM chart analysis components
 * - Trendline visualization steps
 * - Result filtering workflows
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 */

export interface NonMMMTrendlineType {
  type: 'linear' | 'polynomial-2' | 'polynomial-3';
  label: string;
  description: string;
}

export interface NonMMMChartData {
  xValues: (string | number)[];
  yValues: number[];
  xLabel: string;
  yLabel: string;
  title: string;
}

export interface NonMMMTrendlineData {
  xValues: (string | number)[];
  yValues: number[];
  equation: string;
  rSquared: number;
  slope?: number;
  intercept?: number;
  coefficients?: number[];
}

export interface DeleteColumnResponse {
  success: boolean;
  message: string;
  data: {
    deletedColumn: string;
    remainingColumns: string[];
    totalColumns: number;
    filePath: string;
  };
}

export interface NonMMMChartContainer {
  id: string;
  xVariable: string;
  yVariable: string;
  chartType: 'line' | 'scatter';
  trendlineType: NonMMMTrendlineType;
  lineChartData: NonMMMChartData;
  scatterChartData: NonMMMChartData;
  trendlineData: NonMMMTrendlineData;
  isExpectedResult: boolean;
  expectedSign: '+' | '-' | '~';
}

export interface NonMMMExpectedSignsMap {
  [variableName: string]: {
    expectedSign: '+' | '-' | '~';
    reason: string;
  };
}

export interface NonMMMChartAnalysisRequest {
  brand: string;
  filename: string;
  targetVariable: string;
  independentVariables: string[];
  expectedSigns: Record<string, string>; // Simplified to match what step sends
  trendlineType?: string; // Optional trendline type
}

export interface BackendChartData {
  variable: string;
  line_chart?: {
    time: string[];
    target_values: number[];
    variable_values: number[];
  };
  scatter_plot: {
    x: number[];
    y: number[];
    trendline: {
      x: number[];
      y: number[];
    };
    slope: number;
    r_squared: number;
  };
}

export interface ChartData {
  id: string;
  variable: string;
  targetVariable: string;
  trendlineType: string;
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
  isExpectedResult: boolean;
  expectedSign: string;
}

export interface NonMMMChartAnalysisResponse {
  success: boolean;
  data?: {
    charts: ChartData[];
    totalCharts: number;
    expectedResults: number;
    unexpectedResults: number;
  };
  error?: string;
}

export interface NonMMMNewChartRequest {
  filename: string;
  xVariable: string;
  yVariable: string;
  trendlineType: NonMMMTrendlineType;
  expectedSign: '+' | '-' | '~';
}

export class NonMMMChartAnalysisService {
  private static readonly NODEJS_BASE_URL = 'http://localhost:3001/api/nonmmm';
  private static readonly PYTHON_BASE_URL = 'http://localhost:8000';
  private static readonly TRENDLINE_TYPES: NonMMMTrendlineType[] = [
    {
      type: 'linear',
      label: 'Linear',
      description: 'Linear trendline (y = mx + b)'
    },
    {
      type: 'polynomial-2',
      label: 'Polynomial (Degree 2)',
      description: 'Quadratic trendline (y = ax² + bx + c)'
    },
    {
      type: 'polynomial-3',
      label: 'Polynomial (Degree 3)',
      description: 'Cubic trendline (y = ax³ + bx² + cx + d)'
    }
  ];

  /**
   * Get available trendline types
   */
  static getTrendlineTypes(): NonMMMTrendlineType[] {
    return [...this.TRENDLINE_TYPES];
  }

  /**
   * Generate chart analysis for all variables
   */
  static async generateChartAnalysis(
    request: NonMMMChartAnalysisRequest
  ): Promise<NonMMMChartAnalysisResponse> {
    try {
      console.log('🔄 Chart Analysis Service - Starting chart generation');
      console.log('📤 Request:', request);
      
             const apiUrl = `http://localhost:8000/api/nonmmm/chart-data/${request.filename}?brand=${encodeURIComponent(request.brand)}&target_variable=${encodeURIComponent(request.targetVariable)}&trendline_type=linear`;
      console.log('🌐 API URL:', apiUrl);
      
      // Call Python backend for chart data
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

             console.log('📡 HTTP Response status:', response.status, response.statusText);

       if (!response.ok) {
         const errorText = await response.text();
         console.error('❌ HTTP Error Response:', errorText);
         throw new Error(`Failed to fetch chart data: ${response.statusText} - ${errorText}`);
       }

       // Debug: Log the raw response text to see what we're actually getting
       const responseText = await response.text();
       console.log('📄 Raw response text (first 500 chars):', responseText.substring(0, 500));
       
       // Try to parse as JSON
       let result;
       try {
         result = JSON.parse(responseText);
       } catch (parseError) {
         console.error('❌ JSON Parse Error:', parseError);
         console.error('📄 Full response text:', responseText);
         throw new Error(`Invalid JSON response from backend: ${parseError.message}`);
       }
       console.log('📥 Python backend response:', result);
       
       if (!result.success) {
         console.error('❌ Backend reported failure:', result.error);
         throw new Error(result.error || 'Failed to generate chart data');
       }

       console.log('🔄 Transforming backend data to frontend format...');
       console.log('📊 Raw charts data:', result.data.charts);
       
      // Transform backend data to frontend format
      const charts = result.data.charts.map((chartData: BackendChartData) => {
         console.log('📈 Processing chart for variable:', chartData.variable);
         console.log('📊 Chart data structure:', chartData);
         
         const slope = chartData.scatter_plot?.slope || 0;
         const expectedSign = request.expectedSigns[chartData.variable] || 'neutral';
         
         console.log('📈 Slope:', slope, 'Expected sign:', expectedSign);
         
         // Determine if result is expected based on slope direction
        // COMMENTED OUT: Logic that filters unexpected signed variables
        // The user wants to be able to model on variables irrespective of their sign
        const isExpectedResult = true; // Always treat as expected for modeling purposes
         // if (expectedSign === 'positive' && slope > 0) isExpectedResult = true;
         // if (expectedSign === 'negative' && slope < 0) isExpectedResult = true;
         // if (expectedSign === 'neutral') isExpectedResult = true; // Neutral is always expected
         
         const transformedChart = {
           id: `chart-${chartData.variable}`,
           variable: chartData.variable,
           targetVariable: request.targetVariable,
           trendlineType: request.trendlineType,
           lineChart: chartData.line_chart ? {
             xValues: chartData.line_chart.time,
             yValues: chartData.line_chart.target_values,
             secondaryYValues: chartData.line_chart.variable_values
           } : null,
           scatterPlot: {
             xValues: chartData.scatter_plot.x,
             yValues: chartData.scatter_plot.y,
             trendline: chartData.scatter_plot.trendline,
             slope: chartData.scatter_plot.slope,
             rSquared: chartData.scatter_plot.r_squared
           },
           isExpectedResult,
           expectedSign
         };
         
         console.log('✅ Transformed chart:', transformedChart);
         return transformedChart;
       });

       const expectedResults = charts.filter(chart => chart.isExpectedResult).length;
       const unexpectedResults = charts.filter(chart => !chart.isExpectedResult).length;

       console.log('📊 Final chart summary:', {
         totalCharts: charts.length,
         expectedResults,
         unexpectedResults
       });

       const serviceResponse = {
         success: true,
         data: {
           charts,
           totalCharts: charts.length,
           expectedResults,
           unexpectedResults
         }
       };

       console.log('✅ Chart analysis service response:', serviceResponse);
       return serviceResponse;
    } catch (error) {
      console.error('❌ Chart Analysis Service Error:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate chart analysis'
      };
    }
  }

  /**
   * Add a new chart container
   */
  static async addNewChart(
    request: NonMMMNewChartRequest
  ): Promise<{ success: boolean; data?: NonMMMChartContainer; error?: string }> {
    try {
      // Generate mock chart data for the new variables
      const chart = this.generateMockChart(
        request.xVariable,
        request.yVariable,
        request.trendlineType,
        request.expectedSign
      );

      return {
        success: true,
        data: chart
      };
    } catch (error) {
      console.error('Error adding new chart:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add new chart'
      };
    }
  }

  /**
   * Filter charts by expected/unexpected results
   */
  static filterChartsByResult(
    charts: NonMMMChartContainer[],
    filterType: 'expected' | 'unexpected' | 'all'
  ): NonMMMChartContainer[] {
    switch (filterType) {
      case 'expected':
        return charts.filter(chart => chart.isExpectedResult);
      case 'unexpected':
        return charts.filter(chart => !chart.isExpectedResult);
      default:
        return charts;
    }
  }

  /**
   * Determine if a result is expected based on trendline slope and expected sign
   */
  private static isExpectedResult(slope: number, expectedSign: '+' | '-' | '~'): boolean {
    if (expectedSign === '~') return true; // Neutral expectations always match
    
    if (expectedSign === '+') {
      return slope > 0;
    } else if (expectedSign === '-') {
      return slope < 0;
    }
    
    return true; // Default to expected if sign is not recognized
  }

  /**
   * Generate mock chart data for development
   */
  private static generateMockCharts(
    targetVariable: string,
    independentVariables: string[],
    expectedSigns: NonMMMExpectedSignsMap,
    trendlineType: NonMMMTrendlineType
  ): NonMMMChartContainer[] {
    return independentVariables.map(variable => {
      const expectedSign = expectedSigns[variable]?.expectedSign || '~';
      const slope = this.generateMockSlope(expectedSign);
      
      return this.generateMockChart(
        variable,
        targetVariable,
        trendlineType,
        expectedSign,
        slope
      );
    });
  }

  /**
   * Generate a single mock chart
   */
  private static generateMockChart(
    xVariable: string,
    yVariable: string,
    trendlineType: NonMMMTrendlineType,
    expectedSign: '+' | '-' | '~',
    slope?: number
  ): NonMMMChartContainer {
    const mockSlope = slope || this.generateMockSlope(expectedSign);
    const isExpected = this.isExpectedResult(mockSlope, expectedSign);

    // Generate mock data points
    const xValues = Array.from({ length: 12 }, (_, i) => i + 1);
    const yValues = xValues.map(x => 100 + mockSlope * x + (Math.random() - 0.5) * 20);

    const chartData: NonMMMChartData = {
      xValues,
      yValues,
      xLabel: xVariable,
      yLabel: yVariable,
      title: `${yVariable} vs ${xVariable}`
    };

    const trendlineData: NonMMMTrendlineData = {
      xValues,
      yValues: xValues.map(x => 100 + mockSlope * x),
      equation: `y = ${mockSlope.toFixed(2)}x + 100`,
      rSquared: 0.7 + Math.random() * 0.25,
      slope: mockSlope,
      intercept: 100
    };

    return {
      id: `chart-${xVariable}-${yVariable}`,
      xVariable,
      yVariable,
      chartType: 'scatter',
      trendlineType,
      lineChartData: chartData,
      scatterChartData: chartData,
      trendlineData,
      isExpectedResult: isExpected,
      expectedSign
    };
  }

  /**
   * Generate mock slope based on expected sign
   */
  private static generateMockSlope(expectedSign: '+' | '-' | '~'): number {
    const baseSlope = 5 + Math.random() * 10;
    
    switch (expectedSign) {
      case '+':
        return baseSlope;
      case '-':
        return -baseSlope;
      case '~':
        return (Math.random() - 0.5) * 2; // Small random slope around 0
      default:
        return baseSlope;
    }
  }

  /**
   * Save chart analysis state to Node.js backend
   */
  static async saveChartState(analysisId: string, chartState: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.NODEJS_BASE_URL}/save-chart-state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisId,
          chartState
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save chart state: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save chart state');
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving chart state:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save chart state'
      };
    }
  }

  /**
   * Get chart analysis state from Node.js backend
   */
  static async getChartState(analysisId: string): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
    try {
      const response = await fetch(`${this.NODEJS_BASE_URL}/get-chart-state/${analysisId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        // No state found - this is not an error for new analyses
        return { success: true, data: null };
      }

      if (!response.ok) {
        throw new Error(`Failed to get chart state: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get chart state');
      }

      return { success: true, data: result.data?.chartState };
    } catch (error) {
      console.error('Error getting chart state:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get chart state'
      };
    }
  }

  /**
   * Delete a column from the data file
   */
  static async deleteColumn(
    filename: string, 
    columnName: string, 
    brand: string
  ): Promise<DeleteColumnResponse> {
    try {
      const url = `${this.PYTHON_BASE_URL}/api/nonmmm/delete-variable/${encodeURIComponent(filename)}?brand=${encodeURIComponent(brand)}&column=${encodeURIComponent(columnName)}`;
      console.log('🔗 Delete column URL:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Delete column response status:', response.status);
      console.log('📡 Delete column response headers:', Object.fromEntries(response.headers.entries()));

      // Check if response is ok
      if (!response.ok) {
        let errorMessage = `Failed to delete column: ${response.statusText}`;
        try {
          const errorText = await response.text();
          console.log('❌ Error response text:', errorText);
          if (errorText) {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.detail || errorMessage;
          } else {
            // Handle empty response
            if (response.status === 404) {
              errorMessage = `Column deletion endpoint not found. Please ensure the Python backend is running on port 8000.`;
            } else {
              errorMessage = `Server error (${response.status}): ${response.statusText}`;
            }
          }
        } catch (jsonError) {
          // If response is not JSON, use the status text
          console.warn('Error response is not JSON:', jsonError);
          if (response.status === 404) {
            errorMessage = `Column deletion endpoint not found. Please ensure the Python backend is running on port 8000.`;
          }
        }
        throw new Error(errorMessage);
      }

      // Check if response has content
      const contentType = response.headers.get('content-type');
      console.log('📄 Response content type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.log('❌ Non-JSON response:', responseText);
        throw new Error('Response is not JSON format');
      }

      const responseText = await response.text();
      console.log('📄 Response text:', responseText);
      
      const result = JSON.parse(responseText);
      console.log('✅ Parsed result:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete column');
      }

      return result;
    } catch (error) {
      console.error('Error deleting column:', error);
      throw error;
    }
  }
}
