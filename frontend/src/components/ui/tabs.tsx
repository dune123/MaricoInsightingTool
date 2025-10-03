/**
 * ========================================
 * TABS UI COMPONENT
 * ========================================
 * 
 * Purpose: Tabbed interface component for content organization
 * 
 * Description:
 * This is a tabs component system from shadcn/ui that provides
 * accessible tabbed interfaces for organizing content into logical
 * sections. It's built on Radix UI primitives for robust behavior
 * and proper accessibility compliance.
 * 
 * Key Features:
 * - Accessible tab navigation with proper ARIA attributes
 * - Keyboard navigation support (arrow keys, home/end)
 * - Content switching without page reload
 * - Customizable styling and layout
 * - Focus management and visual feedback
 * - Responsive design considerations
 * 
 * Components:
 * - Tabs: Root component for tab state management
 * - TabsList: Container for tab triggers
 * - TabsTrigger: Clickable tab button
 * - TabsContent: Content panel for each tab
 * 
 * Accessibility Features:
 * - Full keyboard navigation support
 * - Screen reader compatibility
 * - Proper ARIA roles and attributes
 * - Focus management between tabs
 * - Semantic HTML structure
 * 
 * Visual States:
 * - Active: Background with shadow and foreground text
 * - Inactive: Muted background with muted text
 * - Focused: Ring outline for keyboard navigation
 * - Disabled: Reduced opacity and no interaction
 * 
 * Used by:
 * - Data summary step for different views
 * - EDA step for analysis categories
 * - Model results for different result types
 * - Any content organization needs
 * 
 * Dependencies:
 * - Radix UI Tabs primitives
 * - React forwardRef for composition
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
