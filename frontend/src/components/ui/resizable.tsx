/**
 * ========================================
 * RESIZABLE UI COMPONENT
 * ========================================
 * 
 * Purpose: Resizable panel system for adjustable layouts
 * 
 * Description:
 * This is a resizable component from shadcn/ui that provides a system
 * for creating resizable panels and layouts. It's built on react-resizable-panels
 * for smooth resizing behavior and supports both horizontal and vertical
 * resizing with visual handles and proper accessibility.
 * 
 * Key Features:
 * - Resizable panel groups
 * - Individual resizable panels
 * - Resize handles with visual indicators
 * - Horizontal and vertical resizing
 * - Smooth resize behavior
 * - Responsive layout support
 * 
 * Components:
 * - ResizablePanelGroup: Container for resizable panels
 * - ResizablePanel: Individual resizable panel
 * - ResizableHandle: Resize handle with visual indicator
 * 
 * Resizing Features:
 * - Bidirectional resizing (horizontal/vertical)
 * - Visual resize handles
 * - Smooth resize animations
 * - Minimum/maximum size constraints
 * - Panel group direction support
 * - Touch and mouse interaction
 * 
 * Visual Characteristics:
 * - Clean, minimal design
 * - Visual grip indicators
 * - Border-based handles
 * - Consistent with design system
 * - Focus-visible states
 * - Proper spacing and alignment
 * 
 * Layout Features:
 * - Flexible panel sizing
 * - Direction-aware layouts
 * - Responsive behavior
 * - Panel group coordination
 * - Size constraint support
 * - Layout persistence
 * 
 * Accessibility Features:
 * - Keyboard navigation support
 * - Focus management
 * - Screen reader support
 * - ARIA attributes
 * - Visual focus indicators
 * - Touch-friendly interaction
 * 
 * Usage Examples:
 * - Split-pane layouts
 * - Resizable sidebars
 * - Adjustable content areas
 * - Dashboard layouts
 * - Editor interfaces
 * - Data visualization layouts
 * 
 * Used by:
 * - Layout components
 * - Dashboard interfaces
 * - Editor applications
 * - Data analysis tools
 * - Content management systems
 * - Administrative interfaces
 * 
 * Dependencies:
 * - react-resizable-panels for core functionality
 * - Lucide React icons for visual indicators
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import { GripVertical } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
