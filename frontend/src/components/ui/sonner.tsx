/**
 * ========================================
 * SONNER TOASTER UI COMPONENT
 * ========================================
 * 
 * Purpose: Modern toast notification system with theme support
 * 
 * Description:
 * This is a Sonner-based toast notification component from shadcn/ui
 * that provides modern, accessible toast notifications with theme
 * support and consistent styling. It integrates with the application's
 * design system and provides a clean API for user feedback.
 * 
 * Key Features:
 * - Modern toast notification system
 * - Theme-aware styling (light/dark/system)
 * - Consistent with design system colors
 * - Accessible notification delivery
 * - Customizable toast options
 * - Action and cancel button support
 * 
 * Components:
 * - Toaster: Main toast container component
 * - toast: Function for creating toast notifications
 * 
 * Toast Types:
 * - Success: Positive feedback notifications
 * - Error: Error and warning messages
 * - Info: Informational notifications
 * - Loading: Progress and status updates
 * 
 * Visual Characteristics:
 * - Background and foreground color theming
 * - Border and shadow styling
 * - Consistent with design system
 * - Responsive layout and positioning
 * - Smooth animations and transitions
 * 
 * Theme Integration:
 * - Automatic theme detection
 * - Light/dark mode support
 * - System theme preference
 * - Consistent color schemes
 * 
 * Used by:
 * - User feedback notifications
 * - Success/error messages
 * - Loading state indicators
 * - Action confirmations
 * - Any notification needs
 * 
 * Dependencies:
 * - Sonner toast library
 * - next-themes for theme management
 * - React for component logic
 * - Tailwind CSS for styling
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
