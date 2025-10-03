/**
 * Premium Button UI Component
 * 
 * Purpose: Sophisticated, premium button component with luxurious styling and interactions
 * 
 * Design Principles:
 * - Minimal but luxurious (not plain)
 * - Sophisticated color palette
 * - Premium shadows and depth
 * - Refined interactions
 * - Generous whitespace
 * - Subtle but impactful animations
 * 
 * Variants:
 * - default: Primary deep navy with premium styling
 * - secondary: Sophisticated sage green
 * - outline: Refined border with hover effects
 * - ghost: Minimal background with subtle interactions
 * - destructive: Sophisticated burgundy for destructive actions
 * - premium: Ultra-premium variant with special effects
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Design Team
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] hover:shadow-premium",
        secondary: "bg-secondary text-secondary-foreground shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] hover:shadow-premium-accent",
        outline: "border-2 border-primary/30 bg-transparent text-primary hover:bg-primary/5 hover:border-primary/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]",
        ghost: "hover:bg-muted/60 hover:text-foreground active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]",
        premium: "bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:-translate-y-1 hover:shadow-premium active:scale-[0.98]",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {/* Premium shimmer effect for luxury variants */}
        {(variant === "premium" || variant === "default" || variant === "secondary") && (
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
        )}
        
        {/* Button content */}
        <span className="relative z-10 flex items-center">
          {props.children}
        </span>
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
