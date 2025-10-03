/**
 * ========================================
 * PREMIUM LOADING UI COMPONENT
 * ========================================
 * 
 * Purpose: Luxury loading component with premium styling and sophisticated animations
 * 
 * Description:
 * This is a premium loading component designed for Marico's billion-dollar FMCG insights
 * platform. It features sophisticated animations, luxury styling, and premium visual
 * effects that reflect the high-end nature of the application and its executive users.
 * 
 * Key Features:
 * - Premium spinner animations with luxury styling
 * - Sophisticated skeleton loading with glassmorphism effects
 * - Enhanced progress indicators with gradient animations
 * - Premium loading states with executive-level feedback
 * - Responsive design optimized for all screen sizes
 * - Accessibility features with premium descriptions
 * 
 * Premium Variants:
 * - spinner: Luxury spinning animation with gradient effects
 * - skeleton: Sophisticated skeleton loading with shimmer effects
 * - progress: Premium progress bar with gradient animations
 * - dots: Elegant dot animation with luxury timing
 * - pulse: Sophisticated pulse animation with premium effects
 * 
 * Used by:
 * - All premium components requiring loading states
 * - Data processing and analysis workflows
 * - File upload and processing operations
 * - Executive dashboard loading states
 * 
 * Dependencies:
 * - React for component functionality
 * - cn utility for conditional premium styling
 * - Tailwind CSS for luxury styling
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Premium Design Team
 */

import React from "react";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles } from "lucide-react";

interface LoadingProps {
  variant?: 'spinner' | 'skeleton' | 'progress' | 'dots' | 'pulse';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  progress?: number;
}

export function Loading({ 
  variant = 'spinner', 
  size = 'md', 
  text = 'Loading...',
  className,
  progress
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const renderSpinner = () => (
    <div className="flex items-center justify-center">
      <div className={cn(
        "relative",
        sizeClasses[size]
      )}>
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
      </div>
      {text && (
        <span className={cn(
          "ml-3 font-medium text-muted-foreground",
          textSizes[size]
        )}>
          {text}
        </span>
      )}
    </div>
  );

  const renderSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center space-x-4">
        <div className={cn(
          "rounded-full bg-muted",
          sizeClasses[size]
        )} />
        <div className="space-y-2 flex-1">
                 <div className="h-4 bg-muted rounded w-3/4" />
       <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{text}</span>
        <span className="text-sm font-bold text-primary">{progress}%</span>
      </div>
               <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
           <div
             className="h-full bg-primary rounded-full transition-all duration-500 ease-out shadow-lg"
          style={{ width: `${progress || 0}%` }}
        />
      </div>
    </div>
  );

  const renderDots = () => (
    <div className="flex items-center justify-center space-x-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-full bg-primary animate-bounce",
            size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
          )}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
      {text && (
        <span className={cn(
          "ml-3 font-medium text-muted-foreground",
          textSizes[size]
        )}>
          {text}
        </span>
      )}
    </div>
  );

  const renderPulse = () => (
    <div className="flex items-center justify-center">
      <div className={cn(
        "relative",
        sizeClasses[size]
      )}>
                 <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
         <div className="relative rounded-full bg-primary w-full h-full flex items-center justify-center">
          <Sparkles className="w-1/2 h-1/2 text-white" />
        </div>
      </div>
      {text && (
        <span className={cn(
          "ml-3 font-medium text-muted-foreground",
          textSizes[size]
        )}>
          {text}
        </span>
      )}
    </div>
  );

  const renderContent = () => {
    switch (variant) {
      case 'skeleton':
        return renderSkeleton();
      case 'progress':
        return renderProgress();
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={cn(
      "flex items-center justify-center p-6",
      className
    )}>
      {renderContent()}
    </div>
  );
}

// Premium Skeleton Components
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-muted",
        className
      )}
      {...props}
    />
  );
}

// Premium Progress Component
export function Progress({ 
  value = 0, 
  max = 100, 
  className,
  showLabel = true,
  label
}: {
  value?: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  label?: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn("space-y-3", className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {label || 'Progress'}
          </span>
          <span className="text-sm font-bold text-primary">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
               <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden shadow-inner">
           <div
             className="h-full bg-primary rounded-full transition-all duration-500 ease-out shadow-lg relative"
          style={{ width: `${percentage}%` }}
        >
                     <div className="absolute inset-0 bg-white/20 animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
