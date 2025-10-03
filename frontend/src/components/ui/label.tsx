/**
 * ========================================
 * LABEL UI COMPONENT
 * ========================================
 * 
 * Purpose: Accessible form label component for input elements
 * 
 * Description:
 * This is a label component from shadcn/ui that provides accessible
 * form labels with proper association to form controls. It's built
 * on Radix UI primitives for accessibility compliance and consistent
 * behavior across different form elements.
 * 
 * Key Features:
 * - Accessible label association with form controls
 * - Proper ARIA attributes and relationships
 * - Consistent typography and styling
 * - Peer state handling for disabled states
 * - Customizable styling via className
 * - Semantic HTML structure
 * 
 * Accessibility Features:
 * - Proper label association with form controls
 * - Screen reader compatibility
 * - Keyboard navigation support
 * - Disabled state handling
 * - ARIA relationship management
 * 
 * Visual Characteristics:
 * - Medium font weight for readability
 * - Small text size for form consistency
 * - Proper line height and spacing
 * - Peer state awareness (disabled opacity)
 * - Consistent with form design system
 * 
 * Usage Examples:
 * - Form input labels
 * - Checkbox and radio labels
 * - Select dropdown labels
 * - Any form control labeling
 * 
 * Used by:
 * - All form components
 * - Input field labels
 * - Selection component labels
 * - Form validation displays
 * 
 * Dependencies:
 * - Radix UI Label primitives
 * - class-variance-authority for styling
 * - React forwardRef for composition
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
