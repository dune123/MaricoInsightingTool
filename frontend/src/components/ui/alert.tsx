/**
 * ========================================
 * ALERT UI COMPONENT
 * ========================================
 * 
 * Purpose: Informational and warning message display component
 * 
 * Description:
 * This is an alert component system from shadcn/ui that provides
 * structured display of informational messages, warnings, and
 * important notifications. It includes title, description, and
 * icon support for clear communication.
 * 
 * Key Features:
 * - Multiple visual variants (default, destructive)
 * - Icon support with proper positioning
 * - Title and description components
 * - Accessible alert role and structure
 * - Customizable styling and layout
 * - Responsive design considerations
 * 
 * Components:
 * - Alert: Main container with variant styling
 * - AlertTitle: Heading for alert content
 * - AlertDescription: Body text for alert details
 * 
 * Variants:
 * - default: Standard informational styling
 * - destructive: Error/warning styling with destructive colors
 * 
 * Visual Characteristics:
 * - Rounded corners with border styling
 * - Icon positioning with proper spacing
 * - Consistent padding and typography
 * - Variant-specific color schemes
 * - Responsive layout adjustments
 * 
 * Accessibility Features:
 * - Proper alert role for screen readers
 * - Semantic HTML structure
 * - Icon and text relationship handling
 * - Focus management considerations
 * 
 * Used by:
 * - Error message displays
 * - Warning notifications
 * - Information messages
 * - Status updates
 * - Any alert/notification needs
 * 
 * Dependencies:
 * - class-variance-authority for variant management
 * - React forwardRef for composition
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
