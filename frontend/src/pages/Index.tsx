/**
 * ========================================
 * BRANDBLOOM INSIGHTS - INDEX PAGE
 * ========================================
 * 
 * Purpose: Main application page that provides direct access to user type selection
 * 
 * Description:
 * This is the main index page component that serves as the entry point
 * for the BrandBloom Insights application. It provides immediate access to
 * the user type selection (Brand Leader vs Data Scientist) without any
 * marketing content or startup animations.
 * 
 * Key Functionality:
 * - Direct user type selection interface
 * - Immediate access to Brand Leader or Data Scientist workflows
 * - Clean, focused entry point without distractions
 * 
 * Component Structure:
 * - UserTypeStep: Direct user type selection component
 * - AnalysisContext integration for state management
 * 
 * Used by:
 * - App.tsx as the main route component
 * - React Router for navigation
 * 
 * Dependencies:
 * - AnalysisContext for state management
 * - UserTypeStep for user type selection
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserTypeStep } from "@/analysis/mmm/steps/UserTypeStep";
import { useAnalysis } from "@/context/AnalysisContext";
import { LayoutWrapper } from "@/components/wizard/LayoutWrapper";
import { navigateToDashboard } from '@/utils/navigationUtils';

const Index = () => {
  const [selectedUserType, setSelectedUserType] = useState<'brand-leader' | 'data-scientist' | null>(null);
  const navigate = useNavigate();
  const { setUserType } = useAnalysis();

  const handleUserTypeSelect = (userType: 'brand-leader' | 'data-scientist') => {
    if (localStorage.getItem('bb_debug_verbose') === 'true') {
      console.log('🎯 Index: User type selected:', userType);
    }
    setSelectedUserType(userType);
    setUserType(userType);
    
    // Route to appropriate wizard based on user type selection
    if (userType === 'brand-leader') {
      if (localStorage.getItem('bb_debug_verbose') === 'true') {
        console.log('🚀 Index: Navigating to brand-leader route');
      }
      navigate('/brand-leader');
    } else if (userType === 'data-scientist') {
      if (localStorage.getItem('bb_debug_verbose') === 'true') {
        console.log('🚀 Index: Navigating to data-scientist route');
      }
      navigate('/data-scientist');
    }
  };

  return (
    <LayoutWrapper showSidebar={false} showFooter={true}>
      <div className="min-h-screen bg-gradient-premium relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute top-20 left-20 w-32 h-32 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-accent rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-secondary rounded-full blur-3xl"></div>
        </div>
        
        {/* Glassmorphed Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg">
          <div className="max-w-8xl mx-auto px-6 lg:px-12">
            <div className="flex items-center justify-between h-20">
              {/* Logo and Tagline */}
              <div className="flex items-center space-x-4">
                <img 
                  src="/Marico_Logo.png" 
                  alt="Marico Logo" 
                  className="w-12 h-12 object-contain opacity-90 hover:opacity-100 transition-opacity duration-300"
                />
                <div className="h-8 w-px bg-gradient-to-b from-transparent via-border to-transparent"></div>
                <div className="text-sm text-muted-foreground font-medium tracking-wide uppercase">
                  FMCG Intelligence Platform
                </div>
              </div>
              
              {/* Navbar Actions (Future use) */}
              <div className="flex items-center space-x-4">
                {/* Placeholder for future navigation items */}
              </div>
            </div>
          </div>
        </nav>
        
        {/* Main Content */}
        <div className="relative z-10 flex items-center justify-center p-6 lg:p-12 min-h-screen pt-32">
          <div className="w-full max-w-8xl grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          
          {/* Left Side - Welcome Text and User Selection */}
          <div className="space-y-10 animate-fade-in-up">
            {/* Main Content - Enhanced Typography */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-gradient-primary leading-[1.1] tracking-tight">
                  Welcome to<br />
                  <span className="text-4xl lg:text-5xl xl:text-6xl font-light">Marico's</span><br />
                  <span className="text-gradient-accent">Insighting Tool</span>
                </h1>
              </div>
              
              <div className="space-y-4">
                <p className="text-lg lg:text-xl text-muted-foreground font-light leading-relaxed max-w-md">
                  You must be here to:
                </p>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-px bg-gradient-to-r from-accent to-transparent"></div>
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                </div>
              </div>
            </div>
            
            {/* User Type Selection with Context */}
            <div className="pt-6">
              <div className="space-y-8">
                {/* Analyze Dashboards Section */}
                <div className="flex items-center space-x-8">
                  <div className="w-80">
                    <button 
                      className="group w-full h-16 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 ease-out transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
                      onClick={() => navigateToDashboard()}
                    >
                      <span className="flex items-center justify-center space-x-3">
                        <span>Analyze Dashboards</span>
                        <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </span>
                    </button>
                  </div>
                  
                  {/* Brand Leader Context */}
                  <div className="flex-1">
                    <div className="space-y-2">
                      <div className="font-semibold text-foreground text-lg">For Brand Leaders</div>
                      <div className="text-muted-foreground leading-relaxed">
                        Access advanced dashboard analytics and insights to drive strategic decisions
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Build Models Section */}
                <div className="flex items-center space-x-8">
                  <div className="w-80">
                    <button 
                      className="group w-full h-16 bg-background border-2 border-border text-foreground rounded-2xl text-lg font-semibold shadow-md hover:shadow-lg hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 ease-out transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
                      onClick={() => handleUserTypeSelect('data-scientist')}
                    >
                      <span className="flex items-center justify-center space-x-3">
                        <span>Build Models</span>
                        <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      </span>
                    </button>
                  </div>
                  
                  {/* Data Scientist Context */}
                  <div className="flex-1">
                    <div className="space-y-2">
                      <div className="font-semibold text-foreground text-lg">For Data Scientists</div>
                      <div className="text-muted-foreground leading-relaxed">
                        Build and deploy predictive models for advanced analytics
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Larger Video */}
          <div className="relative animate-fade-in">
            <div className="relative">
              {/* Video Container - Larger */}
              <div className="w-full h-[500px] lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-muted/20 to-muted/5 border border-border/20 relative">
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src="https://res.cloudinary.com/dpe5a0j6g/video/upload/v1756811218/social_u4859556443_An_abstract_visualization_of_flowing_data_streams_e9f11a57-391f-4786-8776-e5ef8509658f_2_ozizz6.mp4" type="video/mp4" />
                </video>
                
                {/* Subtle Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent"></div>
              </div>
              
              {/* Accent Elements */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-accent/15 to-transparent rounded-full blur-2xl animate-float"></div>
              <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-gradient-to-tr from-primary/8 to-transparent rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
              <div className="absolute top-1/2 -right-12 w-24 h-24 bg-gradient-to-l from-secondary/10 to-transparent rounded-full blur-xl animate-float" style={{animationDelay: '4s'}}></div>
            </div>
          </div>
          
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
};

export default Index;