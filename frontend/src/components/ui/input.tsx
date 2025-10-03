/**
 * Premium Input UI Component
 * 
 * Purpose: Sophisticated, premium input component with luxurious styling and interactions
 * 
 * Design Principles:
 * - Minimal but luxurious (not plain)
 * - Sophisticated color palette
 * - Premium focus states
 * - Refined interactions
 * - Generous whitespace
 * - Subtle but impactful animations
 * 
 * Features:
 * - Premium border and background styling
 * - Sophisticated focus ring with glow effect
 * - Smooth transitions and animations
 * - Consistent with premium design language
 * - Enhanced accessibility and focus states
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Design Team
 */

import * as React from "react"

import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <div className="relative group">
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-lg border-2 border-border/60 bg-background px-4 py-3 text-sm font-medium ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:border-primary/50 focus-visible:shadow-lg focus-visible:shadow-premium disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 ease-out",
            "hover:border-primary/30 hover:shadow-md hover:shadow-primary/5",
            "group-hover:bg-gradient-premium",
            className
          )}
          ref={ref}
          {...props}
        />
        
        {/* Premium focus indicator */}
        <div className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
