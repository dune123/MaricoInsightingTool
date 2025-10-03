/**
 * ========================================
 * DRAWER UI COMPONENT
 * ========================================
 * 
 * Purpose: Bottom drawer/sheet with background scaling and touch gestures
 * 
 * Description:
 * This is a drawer component from shadcn/ui that provides a bottom drawer
 * or sheet interface with background scaling effects and touch gestures.
 * It's built on Vaul for smooth drawer functionality, supporting background
 * scaling, touch interactions, and responsive design for mobile-first
 * experiences.
 * 
 * Key Features:
 * - Bottom drawer/sheet interface
 * - Background scaling effects
 * - Touch gesture support
 * - Responsive design
 * - Portal-based rendering
 * - Smooth animations
 * 
 * Components:
 * - Drawer: Main drawer container
 * - DrawerTrigger: Drawer trigger button
 * - DrawerPortal: Portal for drawer positioning
 * - DrawerOverlay: Background overlay
 * - DrawerContent: Main drawer content
 * - DrawerHeader: Drawer header section
 * - DrawerFooter: Drawer footer section
 * - DrawerTitle: Drawer title
 * - DrawerDescription: Drawer description
 * - DrawerClose: Close button
 * 
 * Drawer Features:
 * - Vaul integration for core functionality
 * - Background scaling effects
 * - Touch gesture support
 * - Smooth animations
 * - Portal-based rendering
 * - Responsive positioning
 * 
 * Visual Characteristics:
 * - Bottom-up slide animation
 * - Rounded top corners
 * - Background overlay
 * - Drag handle indicator
 * - Consistent with design system
 * - Proper spacing and alignment
 * 
 * Interaction Features:
 * - Touch drag gestures
 * - Background scaling
 * - Smooth animations
 * - Responsive behavior
 * - Portal rendering
 * - Overlay interaction
 * 
 * Mobile Features:
 * - Touch-friendly interaction
 * - Bottom sheet behavior
 * - Responsive design
 * - Mobile-first approach
 * - Touch gesture support
 * - Adaptive layouts
 * 
 * Accessibility Features:
 * - ARIA attributes and roles
 * - Focus management
 * - Screen reader support
 * - Keyboard navigation
 * - Touch gesture support
 * - Proper drawer semantics
 * 
 * Usage Examples:
 * - Mobile navigation menus
 * - Bottom sheet interfaces
 * - Mobile-first designs
 * - Touch-friendly interfaces
 * - Mobile applications
 * - Responsive web apps
 * 
 * Used by:
 * - Mobile navigation
 * - Bottom sheet interfaces
 * - Mobile applications
 * - Touch interfaces
 * - Responsive designs
 * - Mobile-first experiences
 * 
 * Dependencies:
 * - Vaul for drawer functionality
 * - React forwardRef for composition
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
        className
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
