/**
 * Chart Scaling Utilities for BrandBloom Insights Frontend
 * 
 * This module provides utility functions for auto-scaling chart axes and formatting
 * numbers for better data visualization. It ensures all data points are visible
 * and axes are properly formatted with appropriate units (Thousands, Lacs, Crores).
 * 
 * Key Features:
 * - Auto-scaling for line charts (primary and secondary axes)
 * - Auto-scaling for scatter plots (X and Y axes)
 * - Smart number formatting with K/L/Cr units
 * - Consistent scaling across different chart types
 * - Proper handling of edge cases and special values
 * 
 * Author: BrandBloom Frontend Team
 * Last Updated: 2025-01-31
 */

/**
 * Calculate optimal axis domain with padding for better data visibility
 * 
 * @param values - Array of numeric values
 * @param padding - Padding percentage (0-1, default 0.1 for 10% padding)
 * @returns Object with min, max, and formatted tick values
 */
export interface AxisDomain {
  min: number;
  max: number;
  ticks: number[];
  unit: string;
  unitMultiplier: number;
  formatter: (value: number) => string;
}

export function calculateAxisDomain(
  values: number[], 
  padding: number = 0.1
): AxisDomain {
  if (!values || values.length === 0) {
    return {
      min: 0,
      max: 100,
      ticks: [0, 25, 50, 75, 100],
      unit: '',
      unitMultiplier: 1,
      formatter: (value: number) => value.toString()
    };
  }

  // Filter out null, undefined, and NaN values
  const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  
  if (validValues.length === 0) {
    return {
      min: 0,
      max: 100,
      ticks: [0, 25, 50, 75, 100],
      unit: '',
      unitMultiplier: 1,
      formatter: (value: number) => value.toString()
    };
  }

  const minValue = Math.min(...validValues);
  const maxValue = Math.max(...validValues);
  
  // Handle case where all values are the same
  if (minValue === maxValue) {
    const center = minValue;
    const range = Math.max(Math.abs(center) * 0.1, 1);
    return {
      min: center - range,
      max: center + range,
      ticks: [center - range, center, center + range],
      unit: '',
      unitMultiplier: 1,
      formatter: (value: number) => formatAxisValue(value)
    };
  }

  const range = maxValue - minValue;
  const paddingAmount = range * padding;
  
  let domainMin = minValue - paddingAmount;
  let domainMax = maxValue + paddingAmount;
  
  // Ensure minimum range for very small values
  if (range < 0.01) {
    const center = (minValue + maxValue) / 2;
    const minRange = 0.01;
    domainMin = center - minRange / 2;
    domainMax = center + minRange / 2;
  }

  // Calculate appropriate unit and multiplier
  const { unit, unitMultiplier } = calculateUnit(domainMax);
  
  // Generate nice tick values
  const ticks = generateNiceTicks(domainMin, domainMax, unitMultiplier);
  
  return {
    min: domainMin,
    max: domainMax,
    ticks,
    unit,
    unitMultiplier,
    formatter: (value: number) => formatAxisValue(value / unitMultiplier) + unit
  };
}

/**
 * Calculate appropriate unit and multiplier for large numbers
 */
function calculateUnit(maxValue: number): { unit: string; unitMultiplier: number } {
  const absValue = Math.abs(maxValue);
  
  if (absValue >= 10000000) { // 1 Crore or more
    return { unit: ' Cr', unitMultiplier: 10000000 };
  } else if (absValue >= 100000) { // 1 Lakh or more
    return { unit: ' L', unitMultiplier: 100000 };
  } else if (absValue >= 1000) { // 1 Thousand or more
    return { unit: ' K', unitMultiplier: 1000 };
  } else {
    return { unit: '', unitMultiplier: 1 };
  }
}

/**
 * Generate nice tick values for the axis
 */
function generateNiceTicks(min: number, max: number, unitMultiplier: number): number[] {
  const range = max - min;
  const rawStep = range / 4; // Aim for 5 ticks (including endpoints)
  
  // Calculate nice step size
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalizedStep = rawStep / magnitude;
  
  let niceStep: number;
  if (normalizedStep <= 1) {
    niceStep = 1 * magnitude;
  } else if (normalizedStep <= 2) {
    niceStep = 2 * magnitude;
  } else if (normalizedStep <= 5) {
    niceStep = 5 * magnitude;
  } else {
    niceStep = 10 * magnitude;
  }
  
  // Generate ticks
  const ticks: number[] = [];
  const startTick = Math.ceil(min / niceStep) * niceStep;
  
  for (let tick = startTick; tick <= max; tick += niceStep) {
    ticks.push(tick);
  }
  
  // Ensure we have at least the min and max values
  if (ticks.length === 0 || ticks[0] > min) {
    ticks.unshift(min);
  }
  if (ticks[ticks.length - 1] < max) {
    ticks.push(max);
  }
  
  return ticks;
}

/**
 * Format axis value with appropriate precision
 */
function formatAxisValue(value: number): string {
  if (value === 0) return '0';
  
  const absValue = Math.abs(value);
  
  if (absValue < 0.01) {
    return value.toFixed(3);
  } else if (absValue < 0.1) {
    return value.toFixed(2);
  } else if (absValue < 1) {
    return value.toFixed(1);
  } else if (absValue < 10) {
    return value.toFixed(1);
  } else if (absValue < 100) {
    return Math.round(value).toString();
  } else {
    return Math.round(value).toString();
  }
}

/**
 * Calculate domain for dual-axis line chart
 */
export function calculateDualAxisDomain(
  primaryValues: number[],
  secondaryValues: number[],
  padding: number = 0.1
): {
  primary: AxisDomain;
  secondary: AxisDomain;
} {
  return {
    primary: calculateAxisDomain(primaryValues, padding),
    secondary: calculateAxisDomain(secondaryValues, padding)
  };
}

/**
 * Calculate domain for scatter plot
 */
export function calculateScatterPlotDomain(
  xValues: number[],
  yValues: number[],
  padding: number = 0.1
): {
  x: AxisDomain;
  y: AxisDomain;
} {
  return {
    x: calculateAxisDomain(xValues, padding),
    y: calculateAxisDomain(yValues, padding)
  };
}

/**
 * Format tooltip values with proper units
 */
export function formatTooltipValue(value: number, unit: string, unitMultiplier: number): string {
  const displayValue = value / unitMultiplier;
  return formatAxisValue(displayValue) + unit;
}

/**
 * Create custom tick formatter for Recharts
 */
export function createTickFormatter(unit: string, unitMultiplier: number) {
  return (value: number) => {
    return formatTooltipValue(value, unit, unitMultiplier);
  };
}

/**
 * Calculate optimal domain for time series data
 */
export function calculateTimeSeriesDomain(
  timeValues: string[],
  primaryValues: number[],
  secondaryValues: number[],
  padding: number = 0.1
): {
  time: string[];
  primary: AxisDomain;
  secondary: AxisDomain;
} {
  return {
    time: timeValues,
    primary: calculateAxisDomain(primaryValues, padding),
    secondary: calculateAxisDomain(secondaryValues, padding)
  };
}
