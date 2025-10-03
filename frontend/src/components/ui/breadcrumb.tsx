/**
 * ========================================
 * BREADCRUMB UI COMPONENT
 * ========================================
 * 
 * Purpose: Navigation breadcrumb with customizable separators and ellipsis
 * 
 * Description:
 * This is a breadcrumb component from shadcn/ui that provides a navigation
 * breadcrumb interface with customizable separators, ellipsis support, and
 * proper accessibility. It's built on Radix UI primitives for accessibility
 * and proper navigation behavior, supporting navigation hierarchies, links,
 * and current page indicators.
 * 
 * Key Features:
 * - Navigation breadcrumb display
 * - Customizable separators
 * - Ellipsis support for long paths
 * - Accessibility features
 * - Responsive design
 * - Link and page support
 * 
 * Components:
 * - Breadcrumb: Main breadcrumb container
 * - BreadcrumbList: Breadcrumb list wrapper
 * - BreadcrumbItem: Individual breadcrumb item
 * - BreadcrumbLink: Navigable breadcrumb link
 * - BreadcrumbPage: Current page indicator
 * - BreadcrumbSeparator: Visual separator
 * - BreadcrumbEllipsis: Ellipsis for long paths
 * 
 * Breadcrumb Features:
 * - Navigation hierarchy display
 * - Customizable separators
 * - Ellipsis for long paths
 * - Link and page support
 * - Responsive design
 * - Accessibility support
 * 
 * Navigation Features:
 * - Hierarchical navigation display
 * - Clickable navigation links
 * - Current page indication
 * - Separator customization
 * - Ellipsis for overflow
 * - Responsive behavior
 * 
 * Visual Characteristics:
 * - Clean, organized layout
 * - Consistent with design system
 * - Proper spacing and alignment
 * - Separator styling
 * - Hover effects
 * - Responsive design
 * 
 * Accessibility Features:
 * - ARIA attributes and roles
 * - Screen reader support
 * - Navigation semantics
 * - Current page indication
 * - Proper breadcrumb structure
 * - Focus management
 * 
 * Usage Examples:
 * - Website navigation
 * - File system navigation
 * - Content hierarchy
 * - Application navigation
 * - Site structure display
 * - Navigation breadcrumbs
 * 
 * Used by:
 * - Navigation systems
 * - Content management
 * - File browsers
 * - Application interfaces
 * - Website navigation
 * - Hierarchical displays
 * 
 * Dependencies:
 * - Radix UI Slot primitive
 * - React forwardRef for composition
 * - Lucide React icons for separators
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode
  }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />)
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
      className
    )}
    {...props}
  />
))
BreadcrumbList.displayName = "BreadcrumbList"

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  />
))
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean
  }
>(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      className={cn("transition-colors hover:text-foreground", className)}
      {...props}
    />
  )
})
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("font-normal text-foreground", className)}
    {...props}
  />
))
BreadcrumbPage.displayName = "BreadcrumbPage"

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("[&>svg]:size-3.5", className)}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
)
BreadcrumbEllipsis.displayName = "BreadcrumbElipssis"

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
