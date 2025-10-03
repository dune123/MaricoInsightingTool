/**
 * ========================================
 * AVATAR UI COMPONENT
 * ========================================
 * 
 * Purpose: User profile image display with fallback support
 * 
 * Description:
 * This is an avatar component from shadcn/ui that provides a user profile
 * image display interface with fallback support for missing images. It's
 * built on Radix UI primitives for accessibility and proper avatar
 * behavior, supporting image display, fallback content, and responsive
 * sizing for user profile representations.
 * 
 * Key Features:
 * - User profile image display
 * - Fallback content support
 * - Responsive sizing
 * - Accessibility features
 * - Image loading handling
 * - Consistent styling
 * 
 * Components:
 * - Avatar: Main avatar container
 * - AvatarImage: Profile image display
 * - AvatarFallback: Fallback content display
 * 
 * Avatar Features:
 * - Radix UI integration for core functionality
 * - Image display with fallback
 * - Responsive sizing and scaling
 * - Overflow handling
 * - Accessibility support
 * - Consistent design system
 * 
 * Visual Characteristics:
 * - Circular avatar design
 * - Consistent sizing (h-10 w-10)
 * - Overflow hidden for clean edges
 * - Rounded corners
 * - Fallback background styling
 * - Proper aspect ratio maintenance
 * 
 * Fallback Support:
 * - Fallback content display
 * - Background color styling
 * - Centered content alignment
 * - Consistent sizing
 * - Text or icon support
 * - Muted background color
 * 
 * Accessibility Features:
 * - ARIA attributes and roles
 * - Screen reader support
 * - Image alt text support
 * - Fallback content handling
 * - Proper avatar semantics
 * - Focus management
 * 
 * Usage Examples:
 * - User profile displays
 * - Navigation headers
 * - User lists
 * - Comment sections
 * - User avatars
 * - Profile pictures
 * 
 * Used by:
 * - User interface elements
 * - Profile displays
 * - Navigation systems
 * - User lists
 * - Social interfaces
 * - Profile management
 * 
 * Dependencies:
 * - Radix UI Avatar primitives
 * - React forwardRef for composition
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
