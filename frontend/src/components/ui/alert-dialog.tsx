/**
 * ========================================
 * ALERT DIALOG UI COMPONENT
 * ========================================
 * 
 * Purpose: Modal dialog for important confirmations and warnings
 * 
 * Description:
 * This is an alert dialog component from shadcn/ui that provides a modal
 * dialog interface for important confirmations, warnings, and critical
 * actions. It's built on Radix UI primitives for accessibility and proper
 * modal behavior, supporting focus trapping, escape key handling, and
 * proper ARIA attributes for critical user interactions.
 * 
 * Key Features:
 * - Modal dialog interface
 * - Focus trapping
 * - Escape key handling
 * - Accessibility support
 * - Smooth animations
 * - Action buttons
 * 
 * Components:
 * - AlertDialog: Main alert dialog container
 * - AlertDialogTrigger: Dialog trigger button
 * - AlertDialogPortal: Portal for dialog positioning
 * - AlertDialogOverlay: Background overlay
 * - AlertDialogContent: Dialog content container
 * - AlertDialogHeader: Dialog header section
 * - AlertDialogFooter: Dialog footer section
 * - AlertDialogTitle: Dialog title
 * - AlertDialogDescription: Dialog description
 * - AlertDialogAction: Primary action button
 * - AlertDialogCancel: Cancel button
 * 
 * Dialog Features:
 * - Modal behavior with focus trapping
 * - Portal-based rendering
 * - Background overlay
 * - Escape key dismissal
 * - Focus management
 * - Accessibility support
 * 
 * Animation Features:
 * - Fade in/out animations
 * - Zoom in/out effects
 * - Slide animations
 * - Smooth transitions
 * - State-based animations
 * - Performance-optimized
 * 
 * Visual Characteristics:
 * - Centered modal design
 * - Background overlay
 * - Shadow and elevation
 * - Consistent with design system
 * - Proper spacing and alignment
 * - Responsive layout
 * 
 * Accessibility Features:
 * - ARIA attributes and roles
 * - Focus trapping
 * - Screen reader support
 * - Keyboard navigation
 * - Escape key handling
 * - Proper modal semantics
 * 
 * Usage Examples:
 * - Delete confirmations
 * - Critical action warnings
 * - Important notifications
 * - User confirmations
 * - System alerts
 * - Warning dialogs
 * 
 * Used by:
 * - Critical user actions
 * - System notifications
 * - Warning interfaces
 * - Confirmation dialogs
 * - Alert systems
 * - User safety features
 * 
 * Dependencies:
 * - Radix UI Alert Dialog primitives
 * - React forwardRef for composition
 * - Button component for actions
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
