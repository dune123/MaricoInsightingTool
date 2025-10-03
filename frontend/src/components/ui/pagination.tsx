/**
 * ========================================
 * PAGINATION UI COMPONENT
 * ========================================
 * 
 * Purpose: Navigation component for paginated content and data
 * 
 * Description:
 * This is a comprehensive pagination component system from shadcn/ui
 * that provides navigation controls for paginated content, data
 * tables, and multi-page interfaces. It includes previous/next
 * buttons, page numbers, and ellipsis for large page counts.
 * 
 * Key Features:
 * - Previous and next navigation buttons
 * - Page number navigation
 * - Ellipsis for large page counts
 * - Accessible navigation controls
 * - Customizable styling and layout
 * - Responsive design considerations
 * 
 * Components:
 * - Pagination: Main navigation container
 * - PaginationContent: List container for pagination items
 * - PaginationItem: Individual pagination element
 * - PaginationLink: Clickable page number link
 * - PaginationPrevious: Previous page button
 * - PaginationNext: Next page button
 * - PaginationEllipsis: Ellipsis for page ranges
 * 
 * Visual Characteristics:
 * - Centered layout with consistent spacing
 * - Button-based navigation elements
 * - Active page indication
 * - Icon support for previous/next
 * - Responsive sizing and spacing
 * 
 * Accessibility Features:
 * - Proper navigation role and labels
 * - ARIA current page indication
 * - Screen reader compatibility
 * - Keyboard navigation support
 * - Semantic HTML structure
 * 
 * Usage Examples:
 * - Data table navigation
 * - Content pagination
 * - Search result navigation
 * - Multi-page forms
 * - Any paginated interface needs
 * 
 * Used by:
 * - Data display components
 * - Table interfaces
 * - Content management systems
 * - Search result displays
 * 
 * Dependencies:
 * - React for component logic
 * - cn utility for conditional styling
 * - Button component for styling
 * - Tailwind CSS for styling
 * - Lucide icons for navigation
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
