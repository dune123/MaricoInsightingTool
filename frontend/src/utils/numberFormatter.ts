/**
 * Number Formatting Utilities for BrandBloom Insights Frontend
 * 
 * This module provides utility functions for formatting numbers in a user-friendly way,
 * specifically for histogram displays and data visualization.
 * 
 * Key Features:
 * - Remove decimals for values over 1
 * - Convert large numbers to thousands/lacs format
 * - Maintain precision for small decimal values
 * - Handle edge cases and special values
 * 
 * Author: BrandBloom Frontend Team
 * Last Updated: 2025-01-31
 */

/**
 * Format a number for display in histograms and charts.
 * 
 * @param value - The numeric value to format
 * @param removeDecimalsThreshold - Values above this threshold will not show decimals
 * @returns Formatted string representation of the number with K/L/Cr format for large values
 * 
 * @example
 * formatNumberForDisplay(0.5) // '0.5'
 * formatNumberForDisplay(1.5) // '2' (no decimal for values >= 1)
 * formatNumberForDisplay(2.0) // '2'
 * formatNumberForDisplay(1500) // '1.5K'
 * formatNumberForDisplay(150000) // '1.5L'
 * formatNumberForDisplay(15000000) // '1.5Cr'
 */
export function formatNumberForDisplay(
  value: number, 
  removeDecimalsThreshold: number = 1.0
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  // Handle zero and very small values
  if (Math.abs(value) < 0.01 && value !== 0) {
    return value.toFixed(3);
  }
  
  // For values below threshold, show appropriate decimals
  if (Math.abs(value) < removeDecimalsThreshold) {
    if (value === Math.floor(value)) {
      return Math.floor(value).toString();
    } else if (Math.abs(value) < 0.1) {
      return value.toFixed(3);
    } else {
      return value.toFixed(2);
    }
  }
  
  // For values above threshold, remove decimals if they're whole numbers
  if (value === Math.floor(value)) {
    return Math.floor(value).toString();
  }
  
  // For large numbers, use K/L/Cr format (NO decimals for values >= 1)
  const absValue = Math.abs(value);
  if (absValue >= 100000) { // 1 Lakh or more
    if (absValue >= 10000000) { // 1 Crore or more
      // For crores, use K/L/Cr format without decimals
      return `${Math.round(value/10000000)} Cr`;
    } else {
      // For lakhs, use K/L/Cr format without decimals
      return `${Math.round(value/100000)} L`;
    }
  } else if (absValue >= 1000) { // 1 Thousand or more
    return `${Math.round(value/1000)} K`;
  } else {
    // For values between 1 and 1000, round to nearest integer (NO decimals)
    return Math.round(value).toString();
  }
}

/**
 * Add standard comma separation to numbers (1,234,567).
 * 
 * @param value - Integer value to format
 * @returns String with comma separation
 */
function addCommas(value: number): string {
  return value.toLocaleString();
}

/**
 * Add Indian comma separation to numbers (1,50,000).
 * 
 * @param value - Numeric value to format
 * @returns String with Indian comma separation
 */
function addCommasIndian(value: number): string {
  if (value === Math.floor(value)) {
    // For whole numbers, use Indian comma system
    const numStr = Math.floor(value).toString();
    if (numStr.length <= 3) {
      return numStr;
    }
    
    // Indian numbering system: last 3 digits, then groups of 2
    let result = numStr.slice(-3); // Last 3 digits
    let remaining = numStr.slice(0, -3);
    
    while (remaining.length > 0) {
      if (remaining.length <= 2) {
        result = remaining + ',' + result;
        break;
      }
      result = remaining.slice(-2) + ',' + result;
      remaining = remaining.slice(0, -2);
    }
    
    return result;
  } else {
    // For decimal numbers, format the whole part with commas and keep decimals
    const wholePart = Math.floor(value);
    const decimalPart = value - wholePart;
    
    const formattedWhole = addCommasIndian(wholePart);
    if (decimalPart !== 0) {
      // Keep up to 2 decimal places
      const decimalStr = decimalPart.toFixed(2).replace(/^0+/, '');
      return formattedWhole + decimalStr;
    }
    return formattedWhole;
  }
}

/**
 * Format a number as currency with proper comma separation.
 * 
 * @param value - The numeric value to format
 * @param currencySymbol - Currency symbol to prepend
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1500.50) // '₹1,500.50'
 * formatCurrency(150000) // '₹1,50,000'
 */
export function formatCurrency(value: number, currencySymbol: string = "₹"): string {
  if (value === null || value === undefined || isNaN(value)) {
    return `${currencySymbol}0`;
  }
  
  if (value === Math.floor(value)) {
    return `${currencySymbol}${addCommasIndian(Math.floor(value))}`;
  } else {
    // For decimal values, use standard comma separation for better readability
    return `${currencySymbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

/**
 * Format a histogram bin label specifically for display.
 * For histogram bin labels, use K/L/Cr format for big numbers, NO decimals for values >= 1
 * 
 * @param value - The numeric value to format
 * @returns Formatted string for histogram bin labels
 * 
 * @example
 * formatHistogramBinLabel(0.5) // '0.5'
 * formatHistogramBinLabel(1.5) // '2' (no decimal for values >= 1)
 * formatHistogramBinLabel(1500) // '1.5K'
 * formatHistogramBinLabel(150000) // '1.5L'
 */
export function formatHistogramBinLabel(value: number): string {
  // For histogram bin labels, use K/L/Cr format for big numbers, NO decimals for values >= 1
  const absValue = Math.abs(value);
  if (absValue >= 100000) { // 1 Lakh or more
    if (absValue >= 10000000) { // 1 Crore or more
      return `${Math.round(value/10000000)} Cr`;
    } else {
      return `${Math.round(value/100000)} L`;
    }
  } else if (absValue >= 1000) { // 1 Thousand or more
    return `${Math.round(value/1000)} K`;
  } else if (absValue >= 1) {
    // For values between 1 and 1000, round to nearest integer and remove decimals
    return Math.round(value).toString();
  } else {
    // For values < 1, show appropriate decimals
    return formatNumberForDisplay(value, 1.0);
  }
}

/**
 * Format a histogram range label (start-end).
 * 
 * @param startValue - The start value of the bin
 * @param endValue - The end value of the bin
 * @returns Formatted string for histogram range labels
 */
export function formatHistogramRangeLabel(startValue: number, endValue: number): string {
  const startFormatted = formatHistogramBinLabel(startValue);
  const endFormatted = formatHistogramBinLabel(endValue);
  return `${startFormatted}-${endFormatted}`;
}

/**
 * Format a percentage value with K/L/Cr formatting for large values.
 * 
 * @param value - The percentage value (0-1 for 0-100%)
 * @param showPercentSign - Whether to append % symbol
 * @returns Formatted percentage string
 * 
 * @example
 * formatPercentage(0.05) // '5%'
 * formatPercentage(0.15) // '15%'
 * formatPercentage(1.5) // '150%'
 * formatPercentage(15.0) // '15K%'
 * formatPercentage(150.0) // '150L%'
 */
export function formatPercentage(value: number, showPercentSign: boolean = true): string {
  if (value === null || value === undefined || isNaN(value)) {
    return showPercentSign ? '0%' : '0';
  }
  
  // Convert to percentage (0-1 to 0-100)
  const percentageValue = value * 100;
  
  // For small percentages (< 1%), show with 1 decimal place
  if (Math.abs(percentageValue) < 1) {
    const formatted = percentageValue.toFixed(1);
    return showPercentSign ? `${formatted}%` : formatted;
  }
  
  // For larger percentages, apply K/L/Cr formatting without decimals
  const absValue = Math.abs(percentageValue);
  let formatted: string;
  
  if (absValue >= 100000) { // 1 Lakh % or more
    if (absValue >= 10000000) { // 1 Crore % or more
      formatted = `${Math.round(percentageValue / 10000000)} Cr`;
    } else {
      formatted = `${Math.round(percentageValue / 100000)} L`;
    }
  } else if (absValue >= 1000) { // 1 Thousand % or more
    formatted = `${Math.round(percentageValue / 1000)} K`;
  } else {
    // For values between 1% and 1000%, show as whole numbers
    formatted = Math.round(percentageValue).toString();
  }
  
  return showPercentSign ? `${formatted}%` : formatted;
}
