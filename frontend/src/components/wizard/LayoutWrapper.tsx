/**
 * ========================================
 * LAYOUT WRAPPER COMPONENT
 * ========================================
 * 
 * Purpose: Wrapper component that provides consistent layout with SideNavbar and PremiumFooter
 * 
 * Description:
 * This component wraps all pages to ensure consistent layout across the application.
 * It includes the SideNavbar for navigation and PremiumFooter for branding and information.
 * 
 * Key Features:
 * - Consistent layout across all pages
 * - SideNavbar for navigation and breadcrumbs
 * - PremiumFooter for branding and information
 * - Responsive design that adapts to different screen sizes
 * - Proper spacing and layout management
 * 
 * Used by:
 * - All main pages and wizard components
 * - Step components that need consistent layout
 * 
 * Dependencies:
 * - SideNavbar component for navigation
 * - PremiumFooter component for footer
 * - React Router for navigation context
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import { SideNavbar } from './SideNavbar';
import { PremiumFooter } from './PremiumFooter';

interface LayoutWrapperProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showFooter?: boolean;
  className?: string;
}

export function LayoutWrapper({ 
  children, 
  showSidebar = true, 
  showFooter = true,
  className = ""
}: LayoutWrapperProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Sidebar */}
        {showSidebar && (
          <aside className="hidden lg:block">
            <SideNavbar currentPath={location.pathname} />
          </aside>
        )}
        
        {/* Main Content */}
        <main className={`flex-1 flex flex-col ${className}`}>
          {children}
        </main>
      </div>
      
      {/* Footer */}
      {showFooter && (
        <footer>
          <PremiumFooter />
        </footer>
      )}
    </div>
  );
}
