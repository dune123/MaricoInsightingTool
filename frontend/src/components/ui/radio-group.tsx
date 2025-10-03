/**
 * ========================================
 * RADIO GROUP UI COMPONENT
 * ========================================
 * 
 * Purpose: Radio button group for single selection from multiple options
 * 
 * Description:
 * This is a radio group component system from shadcn/ui that provides
 * radio button functionality for selecting one option from a group
 * of mutually exclusive choices. It's built on Radix UI primitives
 * for accessibility and proper form behavior.
 * 
 * Key Features:
 * - Radio button group with single selection
 * - Accessible keyboard navigation
 * - Visual state indication (selected/unselected)
 * - Customizable styling and layout
 * - Form integration and validation
 * - Smooth focus management
 * 
 * Components:
 * - RadioGroup: Container for radio button group
 * - RadioGroupItem: Individual radio button option
 * - RadioGroupIndicator: Visual indicator for selection
 * 
 * Visual Characteristics:
 * - Circular radio buttons with borders
 * - Selected state with filled circle indicator
 * - Focus ring for keyboard navigation
 * - Consistent sizing and spacing
 * - Grid layout for organization
 * 
 * Interaction Features:
 * - Click/tap to select option
 * - Keyboard arrow key navigation
 * - Space/enter to select
 * - Tab navigation between groups
 * - Focus management
 * 
 * Accessibility Features:
 * - Proper ARIA attributes and roles
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - Focus management
 * - Selection announcement
 * 
 * Usage Examples:
 * - Form option selection
 * - Preference settings
 * - Configuration choices
 * - Survey responses
 * - Any single-choice selection needs
 * 
 * Used by:
 * - Form components
 * - Settings interfaces
 * - Configuration forms
 * - Survey components
 * 
 * Dependencies:
 * - Radix UI Radio Group primitives
 * - React forwardRef for composition
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * - Lucide Circle icon
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
