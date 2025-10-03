/**
 * ========================================
 * ENHANCED ROLE SELECTION COMPONENT
 * ========================================
 * 
 * Purpose: Premium role selection interface with enhanced interactions and design
 * 
 * Description:
 * This component provides a sophisticated role selection interface that
 * allows users to choose between Brand Leader and Data Scientist roles
 * with premium design elements and enhanced user experience.
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
  Crown, 
  Brain, 
  Sparkles, 
  TrendingUp, 
  BarChart3, 
  Target,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface EnhancedRoleSelectionProps {
  onUserTypeSelect: (userType: 'brand-leader' | 'data-scientist') => void;
  selectedUserType: 'brand-leader' | 'data-scientist' | null;
}

export function EnhancedRoleSelection({ onUserTypeSelect, selectedUserType }: EnhancedRoleSelectionProps) {
  const [hoveredCard, setHoveredCard] = useState<'brand-leader' | 'data-scientist' | null>(null);

  const handleUserTypeSelect = (userType: 'brand-leader' | 'data-scientist') => {
    onUserTypeSelect(userType);
  };

  const roleData = {
    'brand-leader': {
      icon: Crown,
      title: 'Brand Leader',
      subtitle: 'Executive & Strategic',
      description: 'I\'m responsible for brand strategy and want to understand marketing effectiveness through executive-level insights.',
      features: [
        'Executive-level dashboards and reports',
        'Marketing ROI analysis and insights',
        'Strategic decision-making support',
        'KPI tracking and performance metrics',
        'Brand health monitoring'
      ],
      color: 'primary',
      accentColor: 'accent',
      buttonVariant: 'premium' as const
    },
    'data-scientist': {
      icon: Brain,
      title: 'Data Scientist',
      subtitle: 'Analytical & Technical',
      description: 'I work with advanced data analysis and want to build or review sophisticated analytical models.',
      features: [
        'Advanced statistical modeling',
        'Custom analysis workflows',
        'Detailed technical insights',
        'Machine learning algorithms',
        'Data exploration tools'
      ],
      color: 'secondary',
      accentColor: 'primary',
      buttonVariant: 'secondary' as const
    }
  };

  return (
    <div className="space-y-16">
      {/* Enhanced Role Selection Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full">
        {(['brand-leader', 'data-scientist'] as const).map((roleType) => {
          const role = roleData[roleType];
          const Icon = role.icon;
          const isSelected = selectedUserType === roleType;
          const isHovered = hoveredCard === roleType;

          return (
            <Card 
              key={roleType}
              className={`group cursor-pointer transition-all duration-700 ease-out hover:shadow-2xl hover:-translate-y-3 border-2 ${
                isSelected 
                  ? 'border-primary shadow-xl scale-105' 
                  : 'border-transparent hover:border-primary/30'
              } bg-gradient-to-br from-white to-white/95 relative overflow-hidden`}
              onMouseEnter={() => setHoveredCard(roleType)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleUserTypeSelect(roleType)}
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

              <CardHeader className="text-center pb-8 relative z-10">
                {/* Icon Container */}
                <div className={`mx-auto mb-8 w-28 h-28 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 ${
                  isHovered ? 'shadow-lg' : ''
                } ${
                  roleType === 'brand-leader' 
                    ? 'bg-gradient-to-br from-primary/10 to-accent/10' 
                    : 'bg-gradient-to-br from-secondary/10 to-primary/10'
                }`}>
                  <Icon className={`w-14 h-14 transition-colors duration-300 ${
                    roleType === 'brand-leader' 
                      ? 'text-primary group-hover:text-accent' 
                      : 'text-secondary group-hover:text-primary'
                  }`} />
                </div>

                {/* Title and Subtitle */}
                <div className="mb-4">
                  <CardTitle className={`text-4xl font-bold mb-2 ${
                    roleType === 'brand-leader' ? 'text-primary' : 'text-secondary'
                  }`}>
                    {role.title}
                  </CardTitle>
                  <Badge variant="outline" className={`text-sm font-medium ${
                    roleType === 'brand-leader' 
                      ? 'border-primary/30 text-primary' 
                      : 'border-secondary/30 text-secondary'
                  }`}>
                    {role.subtitle}
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-lg text-muted-foreground leading-relaxed font-medium mx-auto">
                  {role.description}
                </p>
              </CardHeader>

              <CardContent className="pt-0 relative z-10">
                {/* Features List */}
                <div className="space-y-4 mb-8">
                  {role.features.map((feature, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-4 text-base text-muted-foreground group-hover:text-foreground transition-colors duration-300"
                    >
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        roleType === 'brand-leader' ? 'bg-primary' : 'bg-secondary'
                      }`} />
                      <span className="font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <Button 
                  variant={role.buttonVariant}
                  size="lg"
                  className={`w-full group-hover:shadow-xl transition-all duration-300 ${
                    isHovered ? 'scale-105' : 'scale-100'
                  }`}
                  onClick={() => handleUserTypeSelect(roleType)}
                >
                  <span className="flex items-center gap-3">
                    {isSelected ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Selected
                      </>
                    ) : (
                      <>
                        {roleType === 'brand-leader' ? <Crown className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
                        Continue as {role.title}
                      </>
                    )}
                  </span>
                  {!isSelected && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />}
                </Button>
              </CardContent>

              {/* Hover Effects */}
              {isHovered && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl transition-all duration-300" />
              )}
            </Card>
          );
        })}
      </div>

      {/* Enhanced Information Section */}
      <div className="text-center space-y-8">
        <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-premium rounded-full border border-border/40 shadow-sm">
          <Sparkles className="w-5 h-5 text-accent" />
          <p className="text-base font-medium text-muted-foreground">
            Premium Analytics Experience
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mx-auto">
          {[
            {
              icon: TrendingUp,
              title: "Advanced Analytics",
              description: "Sophisticated statistical modeling and predictive insights"
            },
            {
              icon: BarChart3,
              title: "Executive Dashboards",
              description: "Clear, actionable insights for strategic decisions"
            },
            {
              icon: Target,
              title: "Custom Workflows",
              description: "Tailored analysis paths for your specific needs"
            }
          ].map((item, index) => (
            <div key={index} className="text-center space-y-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center mx-auto">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold text-primary">{item.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mx-auto">
          Choose your role to unlock a personalized analytics experience designed for Marico's premium insights platform. 
          Each role provides specialized tools and workflows optimized for your specific analytical needs.
        </p>
      </div>
    </div>
  );
}
