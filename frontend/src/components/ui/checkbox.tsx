/**
 * ========================================
 * CHECKBOX UI COMPONENT
 * ========================================
 * 
 * Purpose: Accessible checkbox component for form inputs
 * 
 * Description:
 * This is a checkbox component from shadcn/ui that provides accessible
 * checkbox functionality with proper styling, focus management, and
 * keyboard navigation. It's built on Radix UI primitives for robust
 * behavior and accessibility compliance.
 * 
 * Key Features:
 * - Accessible checkbox input with proper ARIA attributes
 * - Visual feedback for checked/unchecked states
 * - Focus ring and keyboard navigation support
 * - Disabled state handling
 * - Customizable styling via className prop
 * - Check icon indicator for selected state
 * 
 * Accessibility Features:
 * - Full keyboard navigation support
 * - Screen reader compatibility
 * - Proper focus management
 * - ARIA state attributes
 * - Semantic HTML structure
 * 
 * Visual States:
 * - Unchecked: Border with transparent background
 * - Checked: Primary color background with check icon
 * - Focused: Ring outline for keyboard navigation
 * - Disabled: Reduced opacity and no interaction
 * 
 * Used by:
 * - Sheet selection in data upload
 * - Filter selection components
 * - Variable selection in model building
 * - Multi-select form inputs
 * - Any boolean input needs
 * 
 * Dependencies:
 * - Radix UI Checkbox primitives
 * - React forwardRef for composition
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * - Lucide Check icon
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
