/**
 * ========================================
 * INPUT OTP UI COMPONENT
 * ========================================
 * 
 * Purpose: One-time password input with individual character slots
 * 
 * Description:
 * This is an OTP input component from shadcn/ui that provides a one-time
 * password input interface with individual character slots, visual feedback,
 * and smooth animations. It's built on input-otp for robust OTP functionality,
 * supporting character-by-character input, visual caret indicators, and
 * proper accessibility for verification codes.
 * 
 * Key Features:
 * - Individual character input slots
 * - Visual caret indicators
 * - Smooth animations
 * - Accessibility support
 * - Character validation
 * - Visual feedback states
 * 
 * Components:
 * - InputOTP: Main OTP input container
 * - InputOTPGroup: OTP input group wrapper
 * - InputOTPSlot: Individual character input slot
 * - InputOTPSeparator: Visual separator between slots
 * 
 * OTP Features:
 * - input-otp integration for core functionality
 * - Character-by-character input
 * - Visual caret indicators
 * - Input validation
 * - Smooth transitions
 * - Responsive design
 * 
 * Visual Characteristics:
 * - Individual input slots
 * - Border-based slot design
 * - Rounded corner styling
 * - Consistent with design system
 * - Proper spacing and alignment
 * - Visual feedback states
 * 
 * Input Features:
 * - Character input validation
 * - Visual caret animation
 * - Focus state management
 * - Disabled state handling
 * - Input slot coordination
 * - Keyboard navigation
 * 
 * Animation Features:
 * - Caret blink animation
 * - Smooth transitions
 * - Focus state animations
 * - Input state changes
 * - Performance-optimized
 * - Visual feedback
 * 
 * Accessibility Features:
 * - ARIA attributes and roles
 * - Focus management
 * - Screen reader support
 * - Keyboard navigation
 * - Proper input semantics
 * - Visual indicators
 * 
 * Usage Examples:
 * - Two-factor authentication
 * - Email verification codes
 * - SMS verification codes
 * - Security codes
 * - PIN input
 * - Verification forms
 * 
 * Used by:
 * - Authentication systems
 * - Verification interfaces
 * - Security forms
 * - Two-factor authentication
 * - Email verification
 * - SMS verification
 * 
 * Dependencies:
 * - input-otp for OTP functionality
 * - React forwardRef for composition
 * - Lucide React icons for separators
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { Dot } from "lucide-react"

import { cn } from "@/lib/utils"

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
))
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-2 ring-ring ring-offset-background",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Dot />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
