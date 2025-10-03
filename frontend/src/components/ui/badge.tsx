/**
 * ========================================
 * BADGE UI COMPONENT
 * ========================================
 * 
 * Purpose: Small status and label component for visual indicators
 * 
 * Description:
 * This is a badge component from shadcn/ui that provides small,
 * visually distinct labels for status indicators, categories,
 * and short text labels. It supports multiple variants and
 * is built with class-variance-authority for flexible styling.
 * 
 * Key Features:
 * - Multiple visual variants (default, secondary, destructive, outline)
 * - Consistent sizing and typography
 * - Hover effects and focus states
 * - Accessible focus management
 * - Flexible content support
 * - Customizable styling via className
 * 
 * Variants:
 * - default: Primary color with primary foreground
 * - secondary: Secondary color with secondary foreground
 * - destructive: Destructive color for warnings/errors
 * - outline: Transparent with border and foreground text
 * 
 * Visual Characteristics:
 * - Rounded pill shape for modern appearance
 * - Small text size (text-xs) for subtlety
 * - Consistent padding and spacing
 * - Smooth transition animations
 * - Focus ring for accessibility
 * 
 * Used by:
 * - Column categorization displays
 * - Status indicators
 * - Category labels
 * - Filter tags
 * - Any small label needs
 * 
 * Dependencies:
 * - class-variance-authority for variant management
 * - React for component logic
 * - cn utility for conditional styling
 * - Tailwind CSS for styling
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team (shadcn/ui)
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
