/**
 * ========================================
 * ENHANCED ANALYSIS TYPE SELECTION COMPONENT
 * ========================================
 * 
 * Purpose: Premium analysis type selection interface with enhanced design
 * 
 * Description:
 * This component provides a sophisticated interface for selecting between
 * MMM and Non-MMM analysis types, featuring premium design elements,
 * enhanced interactions, and better visual appeal.
 * 
 * Key Features:
 * - Premium card design with sophisticated styling
 * - Enhanced hover effects and animations
 * - Better visual hierarchy and typography
 * - Interactive elements with smooth transitions
 * - Premium color schemes and shadows
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Design Team
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Sparkles, 
  Target,
  CheckCircle,
  ArrowRight,
  Brain,
  Database,
  Zap,
  Globe
} from 'lucide-react';

interface EnhancedAnalysisTypeSelectionProps {
  onAnalysisTypeSelect: (analysisType: 'mmm' | 'non-mmm') => void;
  selectedAnalysisType: 'mmm' | 'non-mmm' | null;
  userType: string;
}

export function EnhancedAnalysisTypeSelection({ 
  onAnalysisTypeSelect, 
  selectedAnalysisType, 
  userType 
}: EnhancedAnalysisTypeSelectionProps) {
  const [hoveredCard, setHoveredCard] = useState<'mmm' | 'non-mmm' | null>(null);

  const handleAnalysisTypeSelect = (analysisType: 'mmm' | 'non-mmm') => {
    onAnalysisTypeSelect(analysisType);
  };

  const analysisTypeData = {
    'mmm': {
      icon: BarChart3,
      title: 'MMM Analysis',
      subtitle: 'Marketing Mix Modeling',
      description: 'Comprehensive marketing effectiveness analysis with advanced attribution modeling and ROI optimization.',
      features: [
        'Marketing attribution modeling',
        'ROI optimization analysis',
        'Channel effectiveness insights',
        'Budget allocation recommendations',
        'Long-term impact assessment',
        'Seasonal trend analysis'
      ],
      color: 'primary',
      accentColor: 'accent',
      buttonVariant: 'premium' as const,
      benefits: [
        'Understand true marketing impact',
        'Optimize budget allocation',
        'Improve campaign performance',
        'Data-driven decision making'
      ]
    },
    'non-mmm': {
      icon: TrendingUp,
      title: 'General Analysis',
      subtitle: 'Advanced Statistical Modeling',
      description: 'Sophisticated statistical analysis and modeling for business insights and predictive analytics.',
      features: [
        'Statistical regression modeling',
        'Predictive analytics',
        'Data exploration and visualization',
        'Custom analysis workflows',
        'Machine learning algorithms',
        'Real-time insights generation'
      ],
      color: 'secondary',
      accentColor: 'primary',
      buttonVariant: 'secondary' as const,
      benefits: [
        'Advanced statistical insights',
        'Custom analytical workflows',
        'Predictive modeling capabilities',
        'Flexible analysis approaches'
      ]
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-8">
      {/* Enhanced Analysis Type Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
        {(['mmm', 'non-mmm'] as const).map((analysisType) => {
          const typeData = analysisTypeData[analysisType];
          const Icon = typeData.icon;
          const isSelected = selectedAnalysisType === analysisType;
          const isHovered = hoveredCard === analysisType;

          return (
            <Card 
              key={analysisType}
              className={`group cursor-pointer transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-2 border-2 ${
                isSelected 
                  ? 'border-primary shadow-lg scale-105' 
                  : 'border-transparent hover:border-primary/30'
              } bg-gradient-to-br from-white to-white/95 relative overflow-hidden h-80 hover:h-auto hover:z-50`}
              onMouseEnter={() => setHoveredCard(analysisType)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleAnalysisTypeSelect(analysisType)}
            >
              {/* Background Pattern */}
              <div className={`absolute inset-0 opacity-5 transition-opacity duration-500 ${
                isHovered ? 'opacity-10' : 'opacity-5'
              }`}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-xl" />
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}

              <CardHeader className="text-center pb-4 relative z-10">
                {/* Icon Container */}
                <div className={`mx-auto mb-3 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 ${
                  isHovered ? 'shadow-lg' : ''
                } bg-gradient-to-br from-primary/10 to-accent/10`}>
                  <Icon className={`w-6 h-6 transition-colors duration-300 text-primary group-hover:text-accent`} />
                </div>

                {/* Title and Subtitle */}
                <div className="mb-2">
                  <CardTitle className={`text-lg font-bold mb-1 text-primary`}>
                    {typeData.title}
                  </CardTitle>
                  <Badge variant="outline" className={`text-xs font-medium border-primary/30 text-primary`}>
                    {typeData.subtitle}
                  </Badge>
                </div>

                {/* Description - Show only on hover */}
                {isHovered && (
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium mx-auto">
                    {typeData.description}
                  </p>
                )}
              </CardHeader>

              <CardContent className="pt-0 relative z-10">
                {/* Compact view - just button */}
                {!isHovered && (
                  <Button 
                    variant={typeData.buttonVariant}
                    size="sm"
                    className="w-full"
                    onClick={() => handleAnalysisTypeSelect(analysisType)}
                  >
                    <span className="flex items-center gap-2">
                      {isSelected ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Selected
                        </>
                      ) : (
                        <>
                          {analysisType === 'mmm' ? <BarChart3 className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                          Continue
                        </>
                      )}
                    </span>
                  </Button>
                )}

                {/* Expanded view on hover */}
                {isHovered && (
                  <div className="space-y-4">
                    {/* Features List */}
                    <div className="space-y-2">
                      {typeData.features.slice(0, 3).map((feature, index) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-300"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-primary`} />
                          <span className="font-medium">{feature}</span>
                        </div>
                      ))}
                      {typeData.features.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{typeData.features.length - 3} more features
                        </div>
                      )}
                    </div>

                    {/* Benefits Section */}
                    <div className="p-2 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/20">
                      <h4 className="font-semibold text-primary mb-1 text-center text-xs">Key Benefits</h4>
                      <div className="space-y-1">
                        {typeData.benefits.slice(0, 2).map((benefit, index) => (
                          <div key={index} className="flex items-center gap-1 text-xs text-muted-foreground">
                            <div className="w-1 h-1 bg-accent rounded-full flex-shrink-0" />
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button 
                      variant={typeData.buttonVariant}
                      size="sm"
                      className="w-full group-hover:shadow-xl transition-all duration-300"
                      onClick={() => handleAnalysisTypeSelect(analysisType)}
                    >
                      <span className="flex items-center gap-2">
                        {isSelected ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Selected
                          </>
                        ) : (
                          <>
                            {analysisType === 'mmm' ? <BarChart3 className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                            Continue with {typeData.title}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                          </>
                        )}
                      </span>
                    </Button>
                  </div>
                )}
              </CardContent>

              {/* Hover Effects */}
              {isHovered && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl transition-all duration-300" />
              )}
            </Card>
          );
        })}
      </div>

      {/* Compact Information Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-premium rounded-full border border-border/40 shadow-sm">
          <Sparkles className="w-4 h-4 text-accent" />
          <p className="text-sm font-medium text-muted-foreground">
            Professional Analytics Platform
          </p>
        </div>
        
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Choose your analysis approach to unlock powerful insights and drive data-driven decision making.
        </p>
      </div>
    </div>
  );
}
