/**
 * ========================================
 * SLIDER UI COMPONENT
 * ========================================
 * 
 * Purpose: Range input component for numeric value selection
 * 
 * Description:
 * This is a slider component from shadcn/ui that provides
 * a draggable range input for selecting numeric values within
 * a specified range. It's built on Radix UI primitives for
 * accessibility and smooth interaction behavior.
 * 
 * Key Features:
 * - Draggable thumb for value selection
 * - Visual track with range indication
 * - Accessible keyboard navigation
 * - Touch and mouse interaction support
 * - Customizable styling and dimensions
 * - Smooth transitions and animations
 * 
 * Visual Components:
 * - Track: Background track showing the full range
 * - Range: Filled portion showing selected value
 * - Thumb: Draggable handle for value selection
 * - Focus ring for keyboard navigation
 * 
 * Interaction Features:
 * - Mouse drag for value selection
 * - Touch support for mobile devices
 * - Keyboard arrow key navigation
 * - Click to jump to specific position
 * - Smooth thumb movement
 * 
 * Accessibility Features:
 * - Proper ARIA attributes and roles
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - Focus management
 * - Value announcement
 * 
 * Usage Examples:
 * - Volume controls
 * - Range filters
 * - Numeric input selection
 * - Configuration sliders
 * - Any range-based input needs
 * 
 * Used by:
 * - Filter range components
 * - Configuration interfaces
 * - Volume and level controls
 * - Numeric input forms
 * 
 * Dependencies:
 * - Radix UI Slider primitives
 * - React forwardRef for composition
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
