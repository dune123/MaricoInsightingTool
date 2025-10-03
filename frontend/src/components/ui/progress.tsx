/**
 * ========================================
 * PROGRESS UI COMPONENT
 * ========================================
 * 
 * Purpose: Visual progress indicator for loading and completion states
 * 
 * Description:
 * This is a progress component from shadcn/ui that provides a visual
 * progress bar for indicating completion status, loading progress,
 * and other percentage-based measurements. It's built on Radix UI
 * primitives for accessibility and consistent behavior.
 * 
 * Key Features:
 * - Visual progress bar with percentage display
 * - Smooth animations and transitions
 * - Accessible progress indication
 * - Customizable styling and dimensions
 * - Value-based progress calculation
 * - Responsive design considerations
 * 
 * Visual Characteristics:
 * - Rounded bar design with background track
 * - Primary color indicator for progress
 * - Smooth transition animations
 * - Consistent height and spacing
 * - Overflow handling for edge cases
 * 
 * Accessibility Features:
 * - Proper ARIA attributes for screen readers
 * - Keyboard navigation support
 * - Semantic progress indication
 * - Value announcement for assistive technology
 * 
 * Usage Examples:
 * - File upload progress
 * - Data processing status
 * - Step completion indicators
 * - Loading state visualization
 * - Any percentage-based progress
 * 
 * Used by:
 * - Data upload components
 * - Processing status displays
 * - Step completion indicators
 * - Loading state components
 * 
 * Dependencies:
 * - Radix UI Progress primitives
 * - React forwardRef for composition
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
