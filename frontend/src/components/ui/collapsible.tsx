/**
 * ========================================
 * COLLAPSIBLE UI COMPONENT
 * ========================================
 * 
 * Purpose: Expandable/collapsible content sections
 * 
 * Description:
 * This is a collapsible component from shadcn/ui that provides expandable
 * and collapsible content sections. It's built on Radix UI primitives
 * for accessibility and proper collapsible behavior, supporting smooth
 * animations and proper state management for content visibility.
 * 
 * Key Features:
 * - Expandable/collapsible content
 * - Smooth animations
 * - Accessible behavior
 * - State management
 * - Trigger controls
 * - Content visibility
 * 
 * Components:
 * - Collapsible: Main collapsible container
 * - CollapsibleTrigger: Toggle button for collapsible
 * - CollapsibleContent: Expandable content area
 * 
 * Collapsible Features:
 * - Content show/hide functionality
 * - Smooth expand/collapse animations
 * - State persistence
 * - Trigger-based control
 * - Content height management
 * - Accessibility support
 * 
 * Visual Characteristics:
 * - Clean, minimal design
 * - Consistent with design system
 * - Smooth animations
 * - Proper spacing and alignment
 * - Trigger button styling
 * - Content area styling
 * 
 * Accessibility Features:
 * - ARIA attributes and roles
 * - Focus management
 * - Screen reader support
 * - Keyboard navigation
 * - Proper collapsible semantics
 * - State announcements
 * 
 * Usage Examples:
 * - FAQ sections
 * - Expandable details
 * - Collapsible navigation
 * - Content organization
 * - Progressive disclosure
 * - Information hiding
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
 * - Radix UI Collapsible primitives
 * - React for rendering
 * - Tailwind CSS for styling
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
