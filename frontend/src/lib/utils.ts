/**
 * ========================================
 * UTILITY FUNCTIONS - STYLING HELPERS
 * ========================================
 * 
 * Purpose: Core utility functions for CSS class management and styling
 * 
 * Description:
 * This module provides essential utility functions for managing CSS classes
 * and styling throughout the BrandBloom Insights application. It combines
 * clsx for conditional classes and tailwind-merge for intelligent merging.
 * 
 * Key Functions:
 * - cn(): Combines clsx and tailwind-merge for smart CSS class handling
 * - Handles conditional styling and Tailwind conflicts
 * - Provides type-safe class value inputs
 * 
 * Usage Example:
 * cn("px-4 py-2", isActive && "bg-blue-500", "bg-red-500") 
 * // Result: "px-4 py-2 bg-blue-500" (bg-red-500 is intelligently removed)
 * 
 * Used by:
 * - All UI components for dynamic styling
 * - Conditional class application throughout the app
 * - Component variant and state management
 * 
 * Dependencies:
 * - clsx for conditional class logic
 * - tailwind-merge for intelligent class merging
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
