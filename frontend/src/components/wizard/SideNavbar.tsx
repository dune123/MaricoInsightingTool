/**
 * ========================================
 * SIDE NAVBAR COMPONENT
 * ========================================
 * 
 * Purpose: Side navigation bar with breadcrumb functionality
 * 
 * Description:
 * This component provides a side navigation bar that shows:
 * - Home
 * - Brand Leader
 * - Data Scientist
 * - Breadcrumb trail of visited pages
 * 
 * Key Features:
 * - Dynamic breadcrumb generation
 * - Navigation to previous pages
 * - Clean, minimal design
 * - Responsive layout
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Design Team
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  User, 
  Brain, 
  ChevronRight,
  BarChart3,
  TrendingUp
} from 'lucide-react';

interface SideNavbarProps {
  currentPath?: string;
}

export function SideNavbar({ currentPath }: SideNavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Generate breadcrumb based on current path
  const generateBreadcrumb = () => {
    const path = currentPath || location.pathname;
    const breadcrumb = [];
    
    // Always start with Home
    breadcrumb.push({
      label: 'Home',
      path: '/',
      icon: Home,
      isActive: path === '/'
    });
    
    // Add Brand Leader if we're in brand leader flow
    if (path.startsWith('/brand-leader')) {
      breadcrumb.push({
        label: 'Brand Leader',
        path: '/brand-leader',
        icon: User,
        isActive: path === '/brand-leader'
      });
    }
    
    // Add Data Scientist if we're in data scientist flow
    if (path.startsWith('/data-scientist')) {
      breadcrumb.push({
        label: 'Data Scientist',
        path: '/data-scientist',
        icon: Brain,
        isActive: path === '/data-scientist'
      });
    }
    
    // Add MMM if we're in MMM flow
    if (path.startsWith('/mmm')) {
      breadcrumb.push({
        label: 'MMM Analysis',
        path: '/mmm',
        icon: BarChart3,
        isActive: path === '/mmm'
      });
    }
    
    // Add Non-MMM if we're in Non-MMM flow
    if (path.startsWith('/nonmmm')) {
      breadcrumb.push({
        label: 'Non-MMM Analysis',
        path: '/nonmmm',
        icon: TrendingUp,
        isActive: path === '/nonmmm'
      });
    }
    
    return breadcrumb;
  };
  
  const breadcrumb = generateBreadcrumb();
  
  return (
    <div className="w-72 bg-background/95 backdrop-blur border-r border-border/40 h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border/40">
        <h2 className="text-lg font-semibold text-primary">Navigation</h2>
      </div>
      
      {/* Breadcrumb */}
      <div className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {breadcrumb.map((item, index) => (
            <div key={item.path} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-3 h-3 text-muted-foreground mr-1 flex-shrink-0" />
              )}
                             <Button
                 variant={item.isActive ? "default" : "ghost"}
                 size="sm"
                 className={`w-full justify-start h-8 px-3 text-sm ${
                   item.isActive 
                     ? 'bg-primary text-primary-foreground' 
                     : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                 }`}
                 onClick={() => navigate(item.path)}
               >
                 <div className="flex items-center w-full">
                   <item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
                   <span className="flex-1 text-left">{item.label}</span>
                   {item.isActive && (
                     <Badge variant="secondary" className="text-xs px-2 py-0 flex-shrink-0 ml-2">
                       Current
                     </Badge>
                   )}
                 </div>
               </Button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-4 py-3 border-t border-border/40">
        <p className="text-xs text-muted-foreground text-center">
          Marico's Insighting Tool
        </p>
      </div>
    </div>
  );
}
