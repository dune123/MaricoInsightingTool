/**
 * ========================================
 * NAVIGATION UTILITIES
 * ========================================
 * 
 * Purpose: Handle navigation between main app and PROJECT B (Dashboard App)
 * 
 * Description:
 * This utility provides functions to navigate between the main BrandBloom Insights
 * application and the PROJECT B dashboard application. It handles both development
 * and production environments with appropriate URL management.
 * 
 * Key Functionality:
 * - Navigate to PROJECT B dashboard application
 * - Handle development vs production URL differences
 * - Open in new tab for better user experience
 * - Fallback handling for connection issues
 * 
 * Usage:
 * - Import and use navigateToDashboard() in components
 * - Handles both localhost and production deployments
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

/**
 * Navigate to the PROJECT B Dashboard Application
 * Opens in a new tab for better user experience
 */
export const navigateToDashboard = (): void => {
  const isDevelopment = import.meta.env.DEV;
  
  let dashboardUrl: string;
  
  if (isDevelopment) {
    // Development URLs
    dashboardUrl = 'http://localhost:8082';
  } else {
    // Production URLs (Azure deployment)
    // TODO: Update with actual production URLs when deployed
    dashboardUrl = 'https://your-dashboard.azurestaticapps.net';
  }
  
  try {
    // Open PROJECT B in a new tab
    const newWindow = window.open(dashboardUrl, '_blank', 'noopener,noreferrer');
    
    if (!newWindow) {
      // Fallback if popup was blocked
      console.warn('Popup blocked, redirecting in same window');
      window.location.href = dashboardUrl;
    } else {
      // Focus the new window
      newWindow.focus();
    }
  } catch (error) {
    console.error('Error navigating to dashboard:', error);
    // Fallback: redirect in same window
    window.location.href = dashboardUrl;
  }
};

/**
 * Check if PROJECT B is available
 * Useful for showing loading states or error messages
 */
export const checkDashboardAvailability = async (): Promise<boolean> => {
  const isDevelopment = import.meta.env.DEV;
  
  if (!isDevelopment) {
    // In production, assume it's always available
    return true;
  }
  
  try {
    const dashboardUrl = 'http://localhost:8082';
    const response = await fetch(dashboardUrl, { 
      method: 'HEAD',
      mode: 'no-cors' // Avoid CORS issues
    });
    return true;
  } catch (error) {
    console.warn('Dashboard not available:', error);
    return false;
  }
};

/**
 * Get the dashboard URL for the current environment
 */
export const getDashboardUrl = (): string => {
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment) {
    return 'http://localhost:8082';
  } else {
    // Production URL - update when deployed
    return 'https://your-dashboard.azurestaticapps.net';
  }
};

