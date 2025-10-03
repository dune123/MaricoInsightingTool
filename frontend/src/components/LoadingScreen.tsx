/**
 * ========================================
 * MARICO INSIGHTS - LOADING SCREEN COMPONENT
 * ========================================
 * 
 * Purpose: Epic animated loading screen with Marico logo for premium user experience
 * 
 * Description:
 * This component creates a sophisticated loading screen that displays an animated
 * Marico logo at the center of a blank background. The logo features multiple
 * animation effects including rotation, scaling, and glow effects to create
 * an engaging and premium loading experience.
 * 
 * Key Features:
 * - Animated Marico logo with multiple effects
 * - Smooth fade-in and fade-out transitions
 * - Premium glow and shadow effects
 * - Responsive design for all screen sizes
 * - Configurable loading duration
 * 
 * Animation Sequence:
 * 1. Logo appears with scale and fade-in effect
 * 2. Continuous rotation and subtle pulsing
 * 3. Glow effects that pulse and change intensity
 * 4. Smooth fade-out before revealing main content
 * 
 * Used by:
 * - App.tsx for initial loading experience
 * - Main application entry point
 * 
 * Dependencies:
 * - React hooks for state management
 * - Custom CSS animations
 * - Marico logo asset
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
  duration?: number; // Duration in milliseconds
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  onLoadingComplete, 
  duration = 3000 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [logoAnimation, setLogoAnimation] = useState<'growing' | 'alive' | 'shrinking' | 'hidden'>('growing');

  useEffect(() => {
    // Phase 1: Logo grows bigger (1 second)
    const timer1 = setTimeout(() => {
      setLogoAnimation('alive');
    }, 1000);

    // Phase 2: Logo stays alive (1 second)
    const timer2 = setTimeout(() => {
      setLogoAnimation('shrinking');
    }, 2000);

    // Phase 3: Hide loading screen and call completion callback (1 second for shrinking)
    const timer3 = setTimeout(() => {
      setIsVisible(false);
      onLoadingComplete();
    }, duration);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [duration, onLoadingComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-viewport-wave">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0">
        {/* Particle-like floating elements */}
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-primary/30 rounded-full animate-particle-float-1"></div>
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-secondary/40 rounded-full animate-particle-float-2"></div>
        <div className="absolute bottom-1/3 left-1/3 w-5 h-5 bg-accent/25 rounded-full animate-particle-float-3"></div>
        <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-primary/50 rounded-full animate-particle-float-1" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/5 w-3 h-3 bg-secondary/35 rounded-full animate-particle-float-2" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-2/3 right-1/5 w-4 h-4 bg-accent/30 rounded-full animate-particle-float-3" style={{animationDelay: '3s'}}></div>
        
        {/* Larger floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gradient-to-br from-accent/10 to-transparent rounded-full animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-br from-secondary/10 to-transparent rounded-full animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Main Logo Container */}
      <div className="relative flex flex-col items-center justify-center z-40">
        {/* Logo with multiple animation layers */}
        <div className="relative">
          {/* Outer glow ring */}
          <div className={`absolute inset-0 w-32 h-32 rounded-full transition-all duration-1000 ${
            logoAnimation === 'growing' ? 'scale-0 opacity-0' : 
            logoAnimation === 'alive' ? 'scale-150 opacity-20' : 
            logoAnimation === 'shrinking' ? 'scale-200 opacity-0' :
            'scale-0 opacity-0'
          }`}>
            <div className="w-full h-full rounded-full animate-color-shift animate-spin-slow"></div>
          </div>

          {/* Middle glow ring */}
          <div className={`absolute inset-2 w-28 h-28 rounded-full transition-all duration-1000 ${
            logoAnimation === 'growing' ? 'scale-0 opacity-0' : 
            logoAnimation === 'alive' ? 'scale-125 opacity-30' : 
            logoAnimation === 'shrinking' ? 'scale-150 opacity-0' :
            'scale-0 opacity-0'
          }`}>
            <div className="w-full h-full rounded-full animate-color-shift animate-spin-reverse"></div>
          </div>

                     {/* White background layer for logo clarity */}
           <div className={`absolute inset-6 w-20 h-20 rounded-full ${
             logoAnimation === 'growing' ? 'animate-logo-grow' :
             logoAnimation === 'alive' ? 'scale-[1.4] opacity-90' :
             logoAnimation === 'shrinking' ? 'animate-logo-shrink' :
             'scale-0 opacity-0'
           }`}>
             <div className={`w-full h-full rounded-full bg-white/95 shadow-lg ${
               logoAnimation === 'alive' ? 'animate-breathing' : 'animate-white-glow'
             }`}></div>
           </div>

           {/* Main logo */}
           <div className={`relative w-32 h-32 flex items-center justify-center ${
             logoAnimation === 'growing' ? 'animate-logo-grow' :
             logoAnimation === 'alive' ? 'scale-[1.4] opacity-100' :
             logoAnimation === 'shrinking' ? 'animate-logo-shrink' :
             'scale-0 opacity-0'
           }`}>
             <img 
               src="/Marico_Logo.png" 
               alt="Marico Logo" 
               className={`w-20 h-20 object-contain drop-shadow-2xl relative z-10 ${
                 logoAnimation === 'alive' ? 'animate-breathing' : ''
               }`}
             />
           </div>

          {/* Inner glow effect */}
          <div className={`absolute inset-4 w-24 h-24 rounded-full transition-all duration-1000 ${
            logoAnimation === 'growing' ? 'scale-0 opacity-0' : 
            logoAnimation === 'alive' ? 'scale-100 opacity-40' : 
            logoAnimation === 'shrinking' ? 'scale-125 opacity-0' :
            'scale-0 opacity-0'
          }`}>
            <div className="w-full h-full rounded-full animate-color-shift animate-pulse-glow"></div>
          </div>
        </div>

        {/* Premium Main Title - Always Visible */}
        <div className="mt-12 text-center relative z-50 px-8 py-8">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-thin text-gradient-premium tracking-wider leading-[1.3] drop-shadow-lg relative z-50 animate-breathing-safe">
            Marico's
          </h1>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-thin text-gradient-secondary tracking-widest leading-[1.3] mt-3 drop-shadow-md relative z-50 pb-2 animate-breathing-safe" style={{animationDelay: '0.5s'}}>
            Insighting Tool
          </h2>
        </div>

        {/* Loading text */}
        <div className={`mt-8 transition-all duration-1000 ${
          logoAnimation === 'growing' ? 'opacity-0 translate-y-4' : 
          logoAnimation === 'alive' ? 'opacity-60 translate-y-0' : 
          logoAnimation === 'shrinking' ? 'opacity-0 -translate-y-4' :
          'opacity-0'
        }`}>
          <p className="text-sm font-light text-muted-foreground tracking-wider animate-breathing">
            MARICO INSIGHTS
          </p>
        </div>

        {/* Loading dots */}
        <div className={`mt-4 flex space-x-2 transition-all duration-1000 ${
          logoAnimation === 'growing' ? 'opacity-0' : 
          logoAnimation === 'alive' ? 'opacity-100' : 
          logoAnimation === 'shrinking' ? 'opacity-0' :
          'opacity-0'
        }`}>
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
          <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
