/**
 * ========================================
 * SCROLL AREA UI COMPONENT
 * ========================================
 * 
 * Purpose: Custom scrollable container with styled scrollbars
 * 
 * Description:
 * This is a scroll area component from shadcn/ui that provides
 * a custom scrollable container with styled scrollbars that
 * maintain consistent appearance across different platforms
 * and browsers. It's built on Radix UI primitives for
 * accessibility and proper scroll behavior.
 * 
 * Key Features:
 * - Custom styled scrollbars
 * - Cross-platform consistent appearance
 * - Touch-friendly scrolling support
 * - Accessible scroll behavior
 * - Customizable styling and dimensions
 * - Corner element for visual consistency
 * 
 * Components:
 * - ScrollArea: Main scrollable container
 * - ScrollBar: Custom styled scrollbar
 * - ScrollAreaViewport: Content viewport
 * - ScrollAreaCorner: Corner element for visual consistency
 * 
 * Scrollbar Features:
 * - Vertical and horizontal scrollbars
 * - Custom thumb styling with rounded appearance
 * - Touch-friendly interaction
 * - Smooth transitions and animations
 * - Consistent with design system colors
 * 
 * Visual Characteristics:
 * - Hidden overflow with custom scrollbars
 * - Border-based scrollbar styling
 * - Rounded scrollbar thumb
 * - Transparent borders for clean appearance
 * - Responsive sizing and positioning
 * 
 * Accessibility Features:
 * - Proper scroll behavior
 * - Touch and mouse interaction support
 * - Keyboard navigation compatibility
 * - Screen reader support
 * - Focus management
 * 
 * Usage Examples:
 * - Long content containers
 * - Data tables with many rows
 * - Sidebar navigation
 * - Modal content areas
 * - Any scrollable content needs
 * 
 * Used by:
 * - Data display components
 * - Navigation interfaces
 * - Content containers
 * - Modal and dialog content
 * 
 * Dependencies:
 * - Radix UI Scroll Area primitives
 * - React forwardRef for composition
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
