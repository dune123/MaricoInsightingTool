/**
 * Premium Card UI Component
 * 
 * Purpose: Sophisticated, premium card component with luxurious styling and interactions
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
 * - Default: Premium white background with sophisticated shadows
 * - Interactive: Enhanced hover effects for clickable cards
 * - Elevated: More prominent shadows for important content
 * - Premium: Ultra-premium variant with special effects
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Design Team
 */

import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-border/60 bg-card text-card-foreground shadow-md transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-1",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-6 bg-gradient-premium border-b border-border/40 rounded-t-xl", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
           className={cn("text-2xl font-bold leading-none tracking-tight text-primary", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground font-medium", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
           className={cn("flex items-center p-6 pt-0 bg-muted/20 border-t border-border/40 rounded-b-xl", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
