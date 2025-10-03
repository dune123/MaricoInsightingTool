/**
 * ========================================
 * POPOVER UI COMPONENT
 * ========================================
 * 
 * Purpose: Floating content panel that appears on trigger interaction
 * 
 * Description:
 * This is a popover component from shadcn/ui that provides a floating
 * content panel that appears when a trigger element is interacted with.
 * It's built on Radix UI primitives for accessibility and proper
 * positioning, supporting various alignment options and smooth animations.
 * 
 * Key Features:
 * - Floating content panel
 * - Trigger-based activation
 * - Configurable positioning
 * - Smooth animations
 * - Portal-based rendering
 * - Accessible behavior
 * 
 * Components:
 * - Popover: Main popover container
 * - PopoverTrigger: Element that triggers the popover
 * - PopoverContent: Floating content panel
 * 
 * Positioning Features:
 * - Configurable alignment (center, start, end)
 * - Side offset control
 * - Automatic positioning
 * - Portal-based rendering
 * - Z-index management
 * - Responsive positioning
 * 
 * Visual Characteristics:
 * - Floating panel design
 * - Rounded corners and borders
 * - Shadow and elevation
 * - Consistent with design system
 * - Proper spacing and padding
 * - Background and text colors
 * 
 * Animation Features:
 * - Fade in/out animations
 * - Zoom in/out effects
 * - Slide animations from different sides
 * - Smooth transitions
 * - State-based animations
 * - Performance-optimized
 * 
 * Accessibility Features:
 * - Proper ARIA attributes
 * - Focus management
 * - Screen reader support
 * - Keyboard navigation
 * - Portal rendering
 * - Escape key handling
 * 
 * Usage Examples:
 * - Tooltips with rich content
 * - Form field help text
 * - Contextual information
 * - Quick actions menu
 * - Information overlays
 * - Interactive help
 * 
 * Used by:
 * - Form components
 * - Information displays
 * - Help systems
 * - Contextual menus
 * - Interactive elements
 * - User guidance
 * 
 * Dependencies:
 * - Radix UI Popover primitives
 * - React forwardRef for composition
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
