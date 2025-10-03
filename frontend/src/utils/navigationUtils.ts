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
    // Development URLs - PROJECTB runs on root path, not /dashboard
    dashboardUrl = 'http://localhost:8082';
  } else {
    // Production URLs - Use environment variable or fallback
    dashboardUrl = import.meta.env.VITE_DASHBOARD_URL || 'https://brandbloom-dashboard.azurestaticapps.net';
  }
  
  try {
    // Open PROJECT B in a new tab while keeping current tab active
    const newWindow = window.open(dashboardUrl, '_blank', 'noopener,noreferrer');
    
    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
      // If popup was blocked, show user a message but DON'T redirect current tab
      console.warn('Popup blocked. Please allow popups for this site to open the dashboard.');
      alert(`Popup blocked! Please allow popups for this site and try again.\n\nOr manually visit: ${dashboardUrl}`);
    } else {
      // Successfully opened in new tab - don't focus it, keep current tab active
      console.log('Dashboard opened in new tab:', dashboardUrl);
    }
  } catch (error) {
    console.error('Error navigating to dashboard:', error);
    alert(`Unable to open dashboard. Please manually visit: ${dashboardUrl}`);
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
    // Production URL - Use environment variable or fallback
    return import.meta.env.VITE_DASHBOARD_URL || 'https://brandbloom-dashboard.azurestaticapps.net';
  }
};

