/**
 * ========================================
 * TOASTER UI COMPONENT
 * ========================================
 * 
 * Purpose: Toast notification renderer and manager
 * 
 * Description:
 * This is a toaster component that serves as the main renderer and manager
 * for toast notifications in the application. It integrates with the toast
 * hook system to display and manage multiple toast notifications, providing
 * a centralized location for all toast rendering and state management.
 * 
 * Key Features:
 * - Toast notification rendering
 * - Multiple toast management
 * - Toast state integration
 * - Centralized toast display
 * - Automatic toast cleanup
 * - Toast provider integration
 * 
 * Components:
 * - Toaster: Main toaster container and renderer
 * - Toast: Individual toast notification
 * - ToastTitle: Toast title display
 * - ToastDescription: Toast description display
 * - ToastClose: Toast close button
 * - ToastViewport: Toast display container
 * - ToastProvider: Toast context provider
 * 
 * Toast Management:
 * - Renders multiple toasts simultaneously
 * - Manages toast lifecycle
 * - Handles toast state updates
 * - Provides toast context
 * - Manages toast positioning
 * - Handles toast cleanup
 * 
 * Integration Features:
 * - Uses useToast hook for state
 * - Integrates with toast components
 * - Provides toast context
 * - Manages toast viewport
 * - Handles toast actions
 * - Supports toast customization
 * 
 * Visual Characteristics:
 * - Clean toast layout
 * - Consistent with design system
 * - Proper spacing and alignment
 * - Responsive design
 * - Toast stacking support
 * - Smooth animations
 * 
 * Usage Examples:
 * - Application-wide toast system
 * - Centralized notification display
 * - Toast state management
 * - Toast rendering coordination
 * - Toast context provision
 * - Toast lifecycle management
 * 
 * Used by:
 * - Main application layout
 * - Toast notification system
 * - User feedback system
 * - Error handling system
 * - Success notification system
 * - Information display system
 * 
 * Dependencies:
 * - useToast hook for state management
 * - Toast UI components
 * - ToastProvider for context
 * - ToastViewport for positioning
 * - React for rendering
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 */

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
