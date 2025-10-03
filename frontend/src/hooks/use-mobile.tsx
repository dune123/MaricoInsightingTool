/**
 * ========================================
 * USE MOBILE HOOK - RESPONSIVE UTILITIES
 * ========================================
 * 
 * Purpose: Responsive design hook for detecting mobile breakpoints
 * 
 * Description:
 * This hook provides real-time mobile breakpoint detection using the
 * matchMedia API. It enables responsive design patterns and conditional
 * rendering based on screen size for optimal user experience across devices.
 * 
 * Key Functionality:
 * - Real-time mobile breakpoint detection (768px)
 * - Event-driven updates on screen size changes
 * - SSR-safe implementation with proper hydration
 * - Performance-optimized with proper cleanup
 * - Boolean return for easy conditional logic
 * 
 * Features:
 * - Uses native matchMedia API for accurate detection
 * - Automatically updates on window resize
 * - Proper event listener cleanup to prevent memory leaks
 * - Initial state handling for server-side rendering
 * - Consistent breakpoint definition (768px)
 * 
 * Usage Examples:
 * - Conditional component rendering for mobile/desktop
 * - Responsive layout adjustments
 * - Touch-friendly interface adaptations
 * - Mobile-specific feature toggles
 * 
 * Used by:
 * - UI components requiring responsive behavior
 * - Layout components for adaptive design
 * - Navigation components for mobile optimization
 * - Any component needing mobile-specific logic
 * 
 * Dependencies:
 * - React hooks (useState, useEffect)
 * - Window.matchMedia API
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 */

import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
