/**
 * ========================================
 * HOVER CARD UI COMPONENT
 * ========================================
 * 
 * Purpose: Hover-triggered information card with smooth animations
 * 
 * Description:
 * This is a hover card component from shadcn/ui that provides a hover-triggered
 * information card interface with smooth animations and positioning. It's built
 * on Radix UI primitives for accessibility and proper hover behavior, supporting
 * various alignment options and smooth enter/exit animations.
 * 
 * Key Features:
 * - Hover-triggered display
 * - Smooth animations
 * - Configurable positioning
 * - Portal-based rendering
 * - Accessible behavior
 * - Responsive design
 * 
 * Components:
 * - HoverCard: Main hover card container
 * - HoverCardTrigger: Element that triggers the hover card
 * - HoverCardContent: Hover card content display
 * 
 * Hover Features:
 * - Mouse hover activation
 * - Smooth enter/exit animations
 * - Configurable positioning
 * - Side offset control
 * - Alignment options
 * - Portal-based rendering
 * 
 * Animation Features:
 * - Fade in/out animations
 * - Zoom in/out effects
 * - Slide animations from different sides
 * - Smooth transitions
 * - State-based animations
 * - Performance-optimized
 * 
 * Visual Characteristics:
 * - Floating card design
 * - Rounded corners and borders
 * - Shadow and elevation
 * - Consistent with design system
 * - Proper spacing and padding
 * - Background and text colors
 * 
 * Positioning Features:
 * - Configurable alignment (center, start, end)
 * - Side offset control
 * - Automatic positioning
 * - Portal-based rendering
 * - Z-index management
 * - Responsive positioning
 * 
 * Accessibility Features:
 * - Proper ARIA attributes
 * - Focus management
 * - Screen reader support
 * - Keyboard navigation
 * - Portal rendering
 * - Hover behavior
 * 
 * Usage Examples:
 * - User profile previews
 * - Product information cards
 * - Contextual help
 * - Quick information display
 * - Interactive tooltips
 * - Hover-based navigation
 * 
 * Used by:
 * - User interface elements
 * - Information displays
 * - Help systems
 * - Navigation interfaces
 * - Interactive elements
 * - Content previews
 * 
 * Dependencies:
 * - Radix UI Hover Card primitives
 * - React forwardRef for composition
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"

import { cn } from "@/lib/utils"

const HoverCard = HoverCardPrimitive.Root

const HoverCardTrigger = HoverCardPrimitive.Trigger

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

export { HoverCard, HoverCardTrigger, HoverCardContent }
