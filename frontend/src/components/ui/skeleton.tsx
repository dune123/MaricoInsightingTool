/**
 * ========================================
 * SKELETON UI COMPONENT
 * ========================================
 * 
 * Purpose: Loading placeholder component for content areas
 * 
 * Description:
 * This is a skeleton component from shadcn/ui that provides
 * animated loading placeholders for content areas while data
 * is being fetched or processed. It creates a smooth user
 * experience during loading states.
 * 
 * Key Features:
 * - Animated loading placeholder with pulse effect
 * - Customizable dimensions and styling
 * - Consistent with design system colors
 * - Rounded corners for modern appearance
 * - Flexible content area representation
 * - Smooth animation transitions
 * 
 * Visual Characteristics:
 * - Muted background color for subtle appearance
 * - Rounded corners for modern design
 * - Pulse animation for loading indication
 * - Customizable via className prop
 * - Responsive sizing support
 * 
 * Usage Examples:
 * - Content area placeholders
 * - Card loading states
 * - Table row placeholders
 * - Form field loading states
 * - Any loading state needs
 * 
 * Animation Features:
 * - Smooth pulse animation
 * - Configurable timing
 * - Performance optimized
 * - CSS-based animations
 * 
 * Used by:
 * - Loading state components
 * - Content placeholders
 * - Form loading displays
 * - Data fetching states
 * 
 * Dependencies:
 * - React for component logic
 * - cn utility for conditional styling
 * - Tailwind CSS for styling and animations
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
