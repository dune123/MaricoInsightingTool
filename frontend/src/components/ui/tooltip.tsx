/**
 * ========================================
 * TOOLTIP UI COMPONENT
 * ========================================
 * 
 * Purpose: Contextual information display on hover/focus
 * 
 * Description:
 * This is a tooltip component system from shadcn/ui that provides
 * contextual information and help text that appears on hover or
 * focus. It's built on Radix UI primitives for accessibility
 * and proper positioning behavior.
 * 
 * Key Features:
 * - Contextual help and information display
 * - Automatic positioning and collision detection
 * - Smooth animations and transitions
 * - Accessible focus and hover triggers
 * - Customizable styling and content
 * - Portal rendering for proper layering
 * 
 * Components:
 * - TooltipProvider: Context provider for tooltip state
 * - Tooltip: Root component for tooltip behavior
 * - TooltipTrigger: Element that triggers the tooltip
 * - TooltipContent: Tooltip content container
 * 
 * Positioning Features:
 * - Automatic side detection (top, bottom, left, right)
 * - Collision detection and avoidance
 * - Configurable side offset
 * - Smooth slide animations
 * - Portal rendering for overlay
 * 
 * Accessibility Features:
 * - Proper ARIA attributes and roles
 * - Keyboard focus support
 * - Screen reader compatibility
 * - Focus management
 * - Hover and focus triggers
 * 
 * Visual Characteristics:
 * - Rounded corners with border styling
 * - Popover background with shadow
 * - Smooth fade and zoom animations
 * - Responsive text sizing
 * - Consistent with design system
 * 
 * Used by:
 * - Help text and explanations
 * - Additional information display
 * - Form field guidance
 * - Button and control descriptions
 * - Any contextual help needs
 * 
 * Dependencies:
 * - Radix UI Tooltip primitives
 * - React forwardRef for composition
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
