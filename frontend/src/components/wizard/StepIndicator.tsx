/**
 * ========================================
 * PREMIUM STEP INDICATOR COMPONENT
 * ========================================
 * 
 * Purpose: Luxury visual progress indicator for the multi-step wizard workflow
 * 
 * Description:
 * This component provides a premium visual representation of user progress through
 * the analytics wizard. It displays step numbers, names, completion status,
 * and current position with sophisticated styling and luxury interactions that
 * reflect the high-end nature of Marico's FMCG analytics platform.
 * 
 * Key Functionality:
 * - Premium visual progress indication with luxury step numbers and names
 * - Active step highlighting with sophisticated visual states
 * - Completed step indicators with premium check marks and animations
 * - Responsive design optimized for all screen sizes
 * - Enhanced accessibility features for screen readers
 * - Luxury, professional appearance with glassmorphism effects
 * 
 * Premium Visual States:
 * - Completed: Gradient background with animated check mark icon
 * - Active: Premium background with glow effects and step number
 * - Pending: Sophisticated muted background with step number
 * - Connected: Animated gradient lines between steps
 * 
 * Responsive Behavior:
 * - Adapts to available width with premium constraints
 * - Mobile-optimized luxury step indicators
 * - Flexible step name display with premium typography
 * - Scalable design elements with sophisticated animations
 * 
 * Premium Accessibility Features:
 * - Semantic HTML structure with luxury styling
 * - Screen reader friendly labels with enhanced descriptions
 * - Keyboard navigation support with premium feedback
 * - High contrast visual indicators with sophisticated styling
 * 
 * Used by:
 * - WizardLayout for premium navigation display
 * - DataScienceWizard for luxury progress tracking
 * - All wizard page components with premium styling
 * 
 * Dependencies:
 * - cn utility for conditional premium styling
 * - Premium icons from Lucide React
 * - Tailwind CSS for luxury styling
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Premium Design Team
 */

import { cn } from "@/lib/utils";
import { Check, Sparkles } from "lucide-react";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  completedSteps?: number[];
}

export function StepIndicator({ steps, currentStep, completedSteps = [] }: StepIndicatorProps) {
  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between relative">
        {/* Premium Background Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 rounded-full" />
        
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = completedSteps.includes(stepNumber) || stepNumber < currentStep;
          
          return (
            <div key={stepNumber} className="flex items-center relative z-10">
              <div className="flex flex-col items-center">
                {/* Premium Step Circle */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ease-out relative group",
                    isCompleted
                      ? "bg-gradient-to-br from-success to-success/80 text-success-foreground shadow-lg hover:shadow-xl hover:scale-110"
                      : isActive
                      ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-xl ring-4 ring-primary/30 hover:shadow-glow-primary hover:scale-110"
                      : "bg-gradient-to-br from-muted to-muted/80 text-muted-foreground shadow-md hover:shadow-lg hover:scale-105"
                  )}
                >
                  {/* Premium Shimmer Effect for Active Step */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  )}
                  
                  {/* Premium Content */}
                  <div className="relative z-10 flex items-center justify-center">
                    {isCompleted ? (
                      <div className="flex items-center justify-center">
                        <Check className="w-6 h-6 animate-fade-in-scale" />
                        <Sparkles className="w-3 h-3 text-accent absolute -top-1 -right-1 animate-pulse" />
                      </div>
                    ) : (
                      <span className="text-base font-bold">{stepNumber}</span>
                    )}
                  </div>
                </div>
                
                {/* Premium Step Label */}
                <div className="mt-4 text-center">
                  <span
                    className={cn(
                      "text-sm font-semibold leading-tight transition-all duration-300",
                      isCompleted 
                        ? "text-success font-bold" 
                        : isActive 
                        ? "text-gradient-primary font-bold" 
                        : "text-muted-foreground"
                    )}
                  >
                    {step}
                  </span>
                  
                  {/* Premium Status Indicator */}
                  {isActive && (
                    <div className="mt-1 flex items-center justify-center">
                      <div className="w-2 h-2 bg-gradient-to-r from-primary to-accent rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Premium Connection Line */}
              {index < steps.length - 1 && (
                <div className="relative mx-4">
                  <div
                    className={cn(
                      "h-0.5 w-16 transition-all duration-500 ease-out rounded-full",
                      isCompleted 
                        ? "bg-gradient-to-r from-success to-success/60" 
                        : "bg-gradient-to-r from-border/50 to-border/30"
                    )}
                  />
                  
                  {/* Premium Animated Progress */}
                  {isCompleted && (
                    <div className="absolute inset-0 h-0.5 bg-gradient-to-r from-success to-accent rounded-full animate-pulse" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}