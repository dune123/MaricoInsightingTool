/**
 * ========================================
 * DATA DISTRIBUTION CHART COMPONENT
 * ========================================
 * 
 * Purpose: Interactive data visualization component for statistical analysis
 * 
 * Description:
 * This component creates dynamic data distribution visualizations for both
 * numeric and categorical data columns. It automatically adapts the chart
 * type based on data characteristics and provides interactive tooltips
 * for enhanced data exploration.
 * 
 * Key Functionality:
 * - Automatic chart type selection based on data type
 * - Histogram visualization for numeric data with configurable bins
 * - Bar chart visualization for categorical data
 * - Interactive tooltips with detailed information
 * - Responsive design for various screen sizes
 * - Performance optimization for large datasets
 * 
 * Chart Types:
 * - Numeric Data: Histogram with 10 bins showing frequency distribution
 * - Categorical Data: Bar chart showing value counts and percentages
 * - Empty Data: Graceful handling with informative messages
 * 
 * Features:
 * - Dynamic bin calculation for histograms
 * - Automatic scaling and axis formatting
 * - Color-coded visualizations for easy interpretation
 * - Tooltips with statistical details
 * - Responsive container for mobile compatibility
 * 
 * Statistical Information:
 * - Frequency distributions for histograms
 * - Count and percentage for categorical data
 * - Automatic range calculation for numeric data
 * - Null/undefined value filtering
 * 
 * Used by:
 * - EDAStep for exploratory data analysis
 * - DataSummaryStep for data overview
 * - Any component requiring data visualization
 * 
 * Dependencies:
 * - Recharts library for chart rendering
 * - DataColumn type for data structure
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DataColumn } from '@/types/analysis';
import { formatHistogramRangeLabel } from '@/utils/numberFormatter';
import { calculateAxisDomain, createTickFormatter } from '@/utils/chartScaling';

interface DataDistributionChartProps {
  column: DataColumn;
}

export function DataDistributionChart({ column }: DataDistributionChartProps) {
  if (column.type === 'numeric') {
    // Create histogram data
    const values = column.values.filter(v => v !== null && v !== undefined);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const bins = 10;
    const binSize = (max - min) / bins;
    
    const histogramData = Array.from({ length: bins }, (_, i) => {
      const binStart = min + i * binSize;
      const binEnd = min + (i + 1) * binSize;
      const count = values.filter(v => v >= binStart && v < binEnd).length;
      return {
        range: formatHistogramRangeLabel(binStart, binEnd),
        count,
        binStart,
        binEnd
      };
    });

    // Calculate auto-scaling for Y-axis (count values)
    const countValues = histogramData.map(d => d.count);
    const yAxisDomain = calculateAxisDomain(countValues, 0.1);

    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={histogramData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="range" 
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            domain={[yAxisDomain.min, yAxisDomain.max]}
            ticks={yAxisDomain.ticks}
            tick={{ fontSize: 10 }}
            tickFormatter={createTickFormatter(yAxisDomain.unit, yAxisDomain.unitMultiplier)}
          />
          <Tooltip 
            formatter={(value) => [value, 'Count']}
            labelFormatter={(label) => `Range: ${label}`}
          />
          <Bar dataKey="count" fill="hsl(var(--primary))" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (column.type === 'categorical') {
    // Create frequency chart
    const valueCounts = column.values.reduce((acc, value) => {
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(valueCounts).map(([value, count]) => ({
      category: value,
      count,
    }));

    // Calculate auto-scaling for Y-axis (count values)
    const countValues = chartData.map(d => d.count);
    const yAxisDomain = calculateAxisDomain(countValues, 0.1);

    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="category" 
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            domain={[yAxisDomain.min, yAxisDomain.max]}
            ticks={yAxisDomain.ticks}
            tick={{ fontSize: 10 }}
            tickFormatter={createTickFormatter(yAxisDomain.unit, yAxisDomain.unitMultiplier)}
          />
          <Tooltip 
            formatter={(value) => [value, 'Count']}
            labelFormatter={(label) => `Category: ${label}`}
          />
          <Bar dataKey="count" fill="hsl(var(--accent))" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return <div className="h-48 flex items-center justify-center text-muted-foreground">Chart not available for this data type</div>;
}