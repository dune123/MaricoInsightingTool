import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Premium Wizard Layout Component
 * 
 * Purpose: Sophisticated, premium wizard layout with luxurious styling and interactions
 * 
 * Design Principles:
 * - Minimal but luxurious (not plain)
 * - Sophisticated color palette
 * - Premium shadows and depth
 * - Refined interactions
 * - Generous whitespace
 * - Subtle but impactful animations
 * 
 * Features:
 * - Premium header with sophisticated branding
 * - Minimal step indicator with premium styling
 * - Subtle navigation buttons with luxury effects
 * - Premium typography and spacing
 * - Full viewport utilization
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Design Team
 */

interface WizardLayoutProps {
  title: string;
  description?: string;
  currentStep: number;
  totalSteps: number;
  onNext?: () => void;
  onPrevious?: () => void;
  nextDisabled?: boolean;
  previousDisabled?: boolean;
  nextText?: string;
  previousText?: string;
  children: React.ReactNode;
  showStepIndicator?: boolean;
}

export function WizardLayout({
  title,
  description,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  nextDisabled = false,
  previousDisabled = false,
  nextText = 'Continue',
  previousText = 'Back',
  children,
  showStepIndicator = true,
}: WizardLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-premium">
      {/* Premium Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/60"
            >
              <Home className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gradient-primary">Marico Insights</h1>
              <span className="text-sm font-medium text-muted-foreground">Make a Difference</span>
            </div>
          </div>
          
          {showStepIndicator && (
            <div className="flex items-center gap-3 px-4 py-2 bg-gradient-premium rounded-full border border-border/40 shadow-sm">
              <span className="text-sm font-semibold text-primary">Step {currentStep}</span>
              <div className="w-px h-4 bg-border/60" />
              <span className="text-sm text-muted-foreground">of {totalSteps}</span>
            </div>
          )}
        </div>
      </header>

      {/* Premium Main Content - Full Width */}
      <main className="flex-1 px-8 py-12">
        <div className="w-full">
          {/* Premium Content Card */}
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="text-center pb-12">
              <CardTitle className="text-4xl font-bold text-gradient-primary mb-4">
                {title}
              </CardTitle>
              {description && (
                <p className="text-xl text-muted-foreground leading-relaxed font-medium">
                  {description}
                </p>
              )}
            </CardHeader>
            
            <CardContent className="animate-fade-in-up">
              {children}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Premium Navigation Footer */}
      {(onNext || onPrevious) && (
        <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
          <div className="flex items-center justify-between px-8 py-6">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={previousDisabled}
              className="gap-3 px-6"
            >
              <ChevronLeft className="h-5 w-5" />
              {previousText}
            </Button>
            
            {onNext && (
              <Button
                onClick={onNext}
                disabled={nextDisabled}
                className="btn-premium-primary gap-3 px-8"
              >
                {nextText}
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}