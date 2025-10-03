/**
 * ========================================
 * ACCORDION UI COMPONENT
 * ========================================
 * 
 * Purpose: Expandable/collapsible content sections with smooth animations
 * 
 * Description:
 * This is an accordion component from shadcn/ui that provides expandable
 * and collapsible content sections with smooth animations and proper
 * accessibility. It's built on Radix UI primitives for accessibility
 * and proper accordion behavior, supporting multiple accordion items
 * and smooth expand/collapse animations.
 * 
 * Key Features:
 * - Expandable/collapsible sections
 * - Smooth animations
 * - Multiple accordion items
 * - Accessible behavior
 * - State management
 * - Visual indicators
 * 
 * Components:
 * - Accordion: Main accordion container
 * - AccordionItem: Individual accordion item
 * - AccordionTrigger: Expandable trigger button
 * - AccordionContent: Expandable content area
 * 
 * Accordion Features:
 * - Multiple accordion items
 * - Individual item control
 * - Smooth expand/collapse animations
 * - State persistence
 * - Visual state indicators
 * - Accessibility support
 * 
 * Animation Features:
 * - Smooth accordion animations
 * - Chevron rotation effects
 * - Content height transitions
 * - State-based animations
 * - Performance-optimized
 * - CSS-based animations
 * 
 * Visual Characteristics:
 * - Clean, organized layout
 * - Consistent with design system
 * - Border-based item separation
 * - Chevron indicators
 * - Hover effects
 * - Proper spacing and alignment
 * 
 * Interaction Features:
 * - Click to expand/collapse
 * - Hover effects and underlines
 * - Chevron rotation animation
 * - Smooth content transitions
 * - State-based styling
 * - Focus management
 * 
 * Accessibility Features:
 * - ARIA attributes and roles
 * - Focus management
 * - Screen reader support
 * - Keyboard navigation
 * - Proper accordion semantics
 * - State announcements
 * 
 * Usage Examples:
 * - FAQ sections
 * - Content organization
 * - Navigation menus
 * - Information disclosure
 * - Progressive disclosure
 * - Content categorization
 * 
 * Used by:
 * - Content organization
 * - Navigation systems
 * - Information display
 * - User interface elements
 * - Content management
 * - Progressive disclosure
 * 
 * Dependencies:
 * - Radix UI Accordion primitives
 * - React forwardRef for composition
 * - Lucide React icons for chevron
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
