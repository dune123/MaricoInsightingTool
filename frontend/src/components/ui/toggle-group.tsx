/**
 * ========================================
 * TOGGLE GROUP UI COMPONENT
 * ========================================
 * 
 * Purpose: Group of toggle buttons for multi-selection or single-selection
 * 
 * Description:
 * This is a toggle group component system from shadcn/ui that provides
 * a container for multiple toggle buttons that can work together as
 * a single-selection or multi-selection group. It's built on Radix UI
 * primitives and integrates with the individual Toggle component.
 * 
 * Key Features:
 * - Group of toggle buttons with shared styling
 * - Single or multiple selection modes
 * - Consistent variant and size across group
 * - Context-based styling inheritance
 * - Accessible group behavior
 * - Flexible layout and spacing
 * 
 * Components:
 * - ToggleGroup: Container for toggle button group
 * - ToggleGroupItem: Individual toggle button within group
 * - ToggleGroupContext: Internal context for styling
 * 
 * Selection Modes:
 * - Single: Only one toggle can be active at a time
 * - Multiple: Multiple toggles can be active simultaneously
 * - Controlled by type prop on ToggleGroup
 * 
 * Styling Features:
 * - Shared variant and size across all items
 * - Context-based styling inheritance
 * - Consistent spacing and layout
 * - Flexible gap and alignment
 * - Customizable via className props
 * 
 * Visual Characteristics:
 * - Horizontal layout with consistent spacing
 * - Centered alignment by default
 * - Gap-1 spacing between items
 * - Responsive design considerations
 * - Consistent with Toggle component styling
 * 
 * Usage Examples:
 * - View mode selectors (grid/list)
 * - Filter category toggles
 * - Toolbar button groups
 * - Option selectors
 * - Any grouped toggle needs
 * 
 * Used by:
 * - View mode selectors
 * - Filter interfaces
 * - Toolbar components
 * - Option selection groups
 * 
 * Dependencies:
 * - Radix UI Toggle Group primitives
 * - Toggle component for styling
 * - class-variance-authority for variants
 * - React forwardRef and context
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
})

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
))

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
})

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
