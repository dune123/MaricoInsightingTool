/**
 * ========================================
 * SEPARATOR UI COMPONENT
 * ========================================
 * 
 * Purpose: Visual divider component for content separation
 * 
 * Description:
 * This is a separator component from shadcn/ui that provides
 * visual dividers between content sections, form groups, and
 * interface elements. It's built on Radix UI primitives for
 * accessibility and proper semantic structure.
 * 
 * Key Features:
 * - Horizontal and vertical orientation support
 * - Accessible separator role and attributes
 * - Customizable styling and dimensions
 * - Consistent with design system colors
 * - Responsive behavior
 * - Semantic HTML structure
 * 
 * Orientation Options:
 * - horizontal: Full-width horizontal line (default)
 * - vertical: Full-height vertical line
 * 
 * Visual Characteristics:
 * - Border color for subtle appearance
 * - 1px thickness for clean separation
 * - Full width/height based on orientation
 * - Customizable via className prop
 * - Consistent with design system
 * 
 * Accessibility Features:
 * - Proper separator role when not decorative
 * - Screen reader compatibility
 * - Semantic structure support
 * - ARIA attribute handling
 * 
 * Usage Examples:
 * - Content section dividers
 * - Form group separation
 * - Navigation menu dividers
 * - List item separation
 * - Any visual separation needs
 * 
 * Used by:
 * - Layout components
 * - Form interfaces
 * - Navigation menus
 * - Content organization
 * 
 * Dependencies:
 * - Radix UI Separator primitives
 * - React forwardRef for composition
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
