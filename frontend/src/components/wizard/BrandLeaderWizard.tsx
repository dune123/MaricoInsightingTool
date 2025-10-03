/**
 * ========================================
 * BRANDBLOOM INSIGHTS - BRAND LEADER WIZARD
 * ========================================
 * 
 * Purpose: Brand Leader specific wizard for simplified analysis workflow
 * 
 * Description:
 * This wizard is designed specifically for Brand Leaders who want to understand
 * marketing effectiveness without getting into technical details. It provides
 * a simplified, business-focused workflow.
 * 
 * Key Functionality:
 * - Simplified analysis workflow for brand leaders
 * - Business-focused insights and recommendations
 * - High-level marketing effectiveness analysis
 * - Executive summary and actionable insights
 * 
 * Component Structure:
 * - To be defined based on brand leader requirements
 * - Will likely include simplified data upload, analysis, and insights
 * - Focus on business outcomes rather than technical modeling
 * 
 * Used by:
 * - InitialWizard when user selects "Brand Leader"
 * - Routes to brand leader specific workflow
 * 
 * Dependencies:
 * - To be defined based on requirements
 * - Will likely use simplified step components
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 * 
 * Note: This is a placeholder component. The actual workflow and steps
 * will be defined based on brand leader requirements and business needs.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, BarChart3, ExternalLink, Loader2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { LayoutWrapper } from './LayoutWrapper';
import { navigateToDashboard, checkDashboardAvailability } from '@/utils/navigationUtils';

export function BrandLeaderWizard() {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleGoBack = () => {
    navigate('/');
  };

  const handleNavigateToDashboard = async () => {
    setIsNavigating(true);
    try {
      // Check if dashboard is available (development only)
      const isAvailable = await checkDashboardAvailability();
      if (!isAvailable) {
        console.warn('Dashboard not available, but proceeding anyway...');
      }
      
      // Navigate to PROJECT B
      navigateToDashboard();
    } catch (error) {
      console.error('Error navigating to dashboard:', error);
    } finally {
      setIsNavigating(false);
    }
  };

  return (
    <LayoutWrapper showSidebar={true} showFooter={true}>
      <div className="min-h-screen bg-gradient-premium overflow-hidden">
        {/* Premium Header */}
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm relative z-10">
          <div className="flex items-center justify-between px-8 py-6">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/60"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-primary">Brand Leader Portal</h1>
                  <span className="text-sm font-medium text-muted-foreground">Executive Analytics & Insights</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 px-4 py-2 bg-gradient-premium rounded-full border border-border/40 shadow-sm">
              <span className="text-sm font-semibold text-primary">Coming Soon</span>
            </div>
          </div>
        </header>

        {/* Premium Main Content */}
        <main className="flex-1 relative">
        <div className="px-8 py-12">
          <div className="w-full max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-gradient-primary mb-6 animate-fade-in-up">
                Brand Leader Analytics
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed font-medium animate-fade-in-up">
                Simplified marketing effectiveness analysis designed for business leaders and executives
              </p>
            </div>

            {/* Dashboard Access Card */}
            <Card className="card-premium shadow-xl">
              <CardHeader className="text-center pb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <BarChart3 className="w-16 h-16 text-primary" />
                </div>
                <CardTitle className="text-4xl font-bold text-primary mb-4">
                  Dashboard Analytics
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground leading-relaxed">
                  Access our advanced dashboard and analytics platform for comprehensive 
                  business insights and data visualization.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-primary mb-4">Available Features</h4>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-muted-foreground">
                        <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0"></div>
                        <span>Advanced data visualization and dashboards</span>
                      </li>
                      <li className="flex items-center gap-3 text-muted-foreground">
                        <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0"></div>
                        <span>AI-powered insights and analysis</span>
                      </li>
                      <li className="flex items-center gap-3 text-muted-foreground">
                        <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0"></div>
                        <span>Interactive chart creation and customization</span>
                      </li>
                      <li className="flex items-center gap-3 text-muted-foreground">
                        <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0"></div>
                        <span>Document upload and analysis</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-primary mb-4">Key Benefits</h4>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-muted-foreground">
                        <div className="w-3 h-3 bg-accent rounded-full flex-shrink-0"></div>
                        <span>Real-time data processing and visualization</span>
                      </li>
                      <li className="flex items-center gap-3 text-muted-foreground">
                        <div className="w-3 h-3 bg-accent rounded-full flex-shrink-0"></div>
                        <span>Custom dashboard creation and management</span>
                      </li>
                      <li className="flex items-center gap-3 text-muted-foreground">
                        <div className="w-3 h-3 bg-accent rounded-full flex-shrink-0"></div>
                        <span>AI-powered business intelligence</span>
                      </li>
                      <li className="flex items-center gap-3 text-muted-foreground">
                        <div className="w-3 h-3 bg-accent rounded-full flex-shrink-0"></div>
                        <span>Seamless data integration and analysis</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="text-center space-y-4">
                  <Button 
                    size="lg" 
                    onClick={handleNavigateToDashboard}
                    disabled={isNavigating}
                    className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 mr-4"
                  >
                    {isNavigating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Opening Dashboard...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-5 h-5 mr-2" />
                        Access Dashboard Analytics
                      </>
                    )}
                  </Button>
                  
                  <div>
                    <Button
                      onClick={handleGoBack}
                      variant="outline"
                      className="btn-premium-secondary flex items-center gap-2 mx-auto"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Choose Different Role
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      </div>
    </LayoutWrapper>
  );
}
