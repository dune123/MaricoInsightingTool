/**
 * ========================================
 * SWITCH UI COMPONENT
 * ========================================
 * 
 * Purpose: Toggle switch component for boolean state changes
 * 
 * Description:
 * This is a switch component from shadcn/ui that provides
 * a toggle switch for boolean state changes, similar to
 * iOS-style switches. It's built on Radix UI primitives
 * for accessibility and smooth interaction behavior.
 * 
 * Key Features:
 * - Toggle switch with smooth animations
 * - Visual state indication (on/off)
 * - Accessible keyboard navigation
 * - Touch and mouse interaction support
 * - Customizable styling and dimensions
 * - Smooth transitions and transforms
 * 
 * Visual Components:
 * - Track: Background container with state colors
 * - Thumb: Movable indicator showing current state
 * - Focus ring for keyboard navigation
 * - State-specific color schemes
 * 
 * Interaction Features:
 * - Click/tap to toggle state
 * - Keyboard space/enter to toggle
 * - Smooth thumb movement animation
 * - Visual feedback for state changes
 * - Disabled state handling
 * 
 * Visual States:
 * - Checked: Primary color background with thumb on right
 * - Unchecked: Input color background with thumb on left
 * - Focused: Ring outline for keyboard navigation
 * - Disabled: Reduced opacity and no interaction
 * 
 * Accessibility Features:
 * - Proper ARIA attributes and roles
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - Focus management
 * - State announcement
 * 
 * Usage Examples:
 * - Feature toggles
 * - Settings switches
 * - Boolean preferences
 * - Enable/disable controls
 * - Any binary state needs
 * 
 * Used by:
 * - Feature toggle components
 * - Settings interfaces
 * - Configuration forms
 * - Boolean input controls
 * 
 * Dependencies:
 * - Radix UI Switch primitives
 * - React forwardRef for composition
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
