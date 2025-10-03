/**
 * ========================================
 * TEXTAREA UI COMPONENT
 * ========================================
 * 
 * Purpose: Multi-line text input component for longer content
 * 
 * Description:
 * This is a textarea component from shadcn/ui that provides a
 * multi-line text input field for longer content, comments,
 * and detailed text entry. It includes proper styling, focus
 * management, and accessibility features.
 * 
 * Key Features:
 * - Multi-line text input with scrollable content
 * - Consistent styling with other form components
 * - Proper focus management and keyboard navigation
 * - Disabled state handling
 * - Placeholder text support
 * - Customizable dimensions and styling
 * 
 * Visual Characteristics:
 * - Minimum height of 80px for usability
 * - Rounded corners with border styling
 * - Consistent padding and typography
 * - Focus ring for keyboard navigation
 * - Placeholder text styling
 * - Disabled state opacity
 * 
 * Accessibility Features:
 * - Proper focus indicators
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - Semantic HTML structure
 * - ARIA attribute support
 * 
 * Usage Examples:
 * - Comment input fields
 * - Description text entry
 * - Long-form content input
 * - Feedback and review forms
 * - Any multi-line text needs
 * 
 * Used by:
 * - Comment and feedback forms
 * - Description input fields
 * - Long content entry
 * - Form components requiring text
 * 
 * Dependencies:
 * - React forwardRef for composition
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * - HTML textarea element
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
