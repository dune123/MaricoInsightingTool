/**
 * Minimal User Type Step Component
 * 
 * Purpose: Clean, minimal user role selection with no distractions
 * 
 * Design Principles:
 * - Minimal and focused
 * - No unnecessary visual elements
 * - Clean typography
 * - Simple interactions
 * - Maximum focus on the choice
 * 
 * Features:
 * - Two simple role selection buttons
 * - Clean, minimal styling
 * - No animations or fancy effects
 * - Focused on the essential choice
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

import React from 'react';
import { Button } from '@/components/ui/button';

interface UserTypeStepProps {
  onUserTypeSelect: (userType: 'brand-leader' | 'data-scientist') => void;
  selectedUserType: 'brand-leader' | 'data-scientist' | null;
}

export function UserTypeStep({ onUserTypeSelect, selectedUserType }: UserTypeStepProps) {
  const handleUserTypeSelect = (userType: 'brand-leader' | 'data-scientist') => {
    onUserTypeSelect(userType);
  };

  return (
    <div className="space-y-6 max-w-md">
      {/* Primary Action - Analyze Dashboards */}
      <button 
        className="group w-full h-16 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 ease-out transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
        onClick={() => handleUserTypeSelect('brand-leader')}
      >
        <span className="flex items-center justify-center space-x-3">
          <span>Analyze Dashboards</span>
          <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </span>
      </button>
      
      {/* Secondary Action - Build Models */}
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
  );
}