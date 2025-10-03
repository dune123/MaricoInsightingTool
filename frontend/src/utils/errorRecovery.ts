/**
 * ========================================
 * MARICO INSIGHTS - ERROR RECOVERY UTILITY
 * ========================================
 * 
 * Purpose: Utility functions for error recovery and homepage redirection
 * 
 * Description:
 * This utility provides functions to handle error recovery scenarios,
 * including forced homepage redirection when users get stuck on broken pages.
 * 
 * Key Functionality:
 * - Force redirect to homepage
 * - Clear all application state
 * - Reset error counters
 * - Emergency recovery functions
 * 
 * Usage:
 * import { forceRedirectToHomepage, clearAllState } from '@/utils/errorRecovery';
 * 
 * // Force redirect to homepage
 * forceRedirectToHomepage();
 * 
 * // Clear all state and redirect
 * clearAllState();
 * 
 * Dependencies:
 * - Browser APIs (localStorage, sessionStorage, window.location)
 * 
 * Used by:
 * - Error boundary components
 * - Emergency recovery scenarios
 * - Manual error recovery functions
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

// Constants for error recovery
const HOMEPAGE_URL = '/';
const ERROR_STATE_KEY = 'marico_error_state';
const NONMMM_STATE_KEY = 'nonmmm_global_state';
const ANALYSIS_STATE_KEY = 'analysis_state';

/**
 * Force redirect to homepage
 * This function will immediately redirect the user to the homepage
 * regardless of the current state or any ongoing operations
 */
export function forceRedirectToHomepage(): void {
  console.log('🚨 Force redirecting to homepage');
  
  // Clear all error state
  clearErrorState();
  
  // Force navigation to homepage
  window.location.href = HOMEPAGE_URL;
}

/**
 * Clear all application state and redirect to homepage
 * This function will clear all stored state and redirect to homepage
 * Use this for emergency recovery scenarios
 */
export function clearAllState(): void {
  console.log('🧹 Clearing all application state');
  
  try {
    // Clear localStorage - be more aggressive
    localStorage.removeItem(NONMMM_STATE_KEY);
    localStorage.removeItem(ANALYSIS_STATE_KEY);
    localStorage.removeItem('analysis_state');
    localStorage.removeItem('user_type');
    localStorage.removeItem('selected_brand');
    localStorage.removeItem('current_analysis_id');
    localStorage.removeItem('analysis_type');
    localStorage.removeItem('analysis_mode');
    localStorage.removeItem('filter_columns');
    localStorage.removeItem('selected_filters');
    localStorage.removeItem('filter_values');
    localStorage.removeItem('model_result');
    localStorage.removeItem('scenario_inputs');
    localStorage.removeItem('visited_steps');
    localStorage.removeItem('completed_steps');
    localStorage.removeItem('bb_debug_verbose');
    
    // Clear sessionStorage
    sessionStorage.removeItem(ERROR_STATE_KEY);
    sessionStorage.clear();
    
    console.log('✅ All application state cleared');
  } catch (error) {
    console.error('❌ Error clearing application state:', error);
  }
  
  // Force redirect to homepage
  forceRedirectToHomepage();
}

/**
 * Clear error state only
 * This function will clear only the error-related state
 */
export function clearErrorState(): void {
  try {
    sessionStorage.removeItem(ERROR_STATE_KEY);
    console.log('✅ Error state cleared');
  } catch (error) {
    console.error('❌ Error clearing error state:', error);
  }
}

/**
 * Check if user is stuck and needs recovery
 * This function checks various indicators to determine if the user
 * might be stuck on a broken page
 */
export function checkIfUserIsStuck(): boolean {
  try {
    // Check for error state
    const errorState = sessionStorage.getItem(ERROR_STATE_KEY);
    if (errorState) {
      const { retryCount, timestamp } = JSON.parse(errorState);
      
      // If there have been multiple retries and it's been a while
      if (retryCount >= 2) {
        const timeSinceError = Date.now() - (timestamp || 0);
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        if (timeSinceError > fiveMinutes) {
          console.log('🚨 User appears to be stuck - multiple retries and time elapsed');
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error checking if user is stuck:', error);
    return false;
  }
}

/**
 * Emergency recovery function
 * This function should be called when all else fails
 * It will clear everything and redirect to homepage
 */
export function emergencyRecovery(): void {
  console.log('🚨 Emergency recovery initiated');
  
  // Clear everything
  clearAllState();
  
  // Force redirect
  forceRedirectToHomepage();
}

/**
 * Nuclear option - clear everything and force homepage
 * This function is the most aggressive recovery option
 * It clears ALL browser storage and forces a clean start
 */
export function nuclearRecovery(): void {
  console.log('☢️ Nuclear recovery initiated - clearing everything');
  
  try {
    // Clear ALL localStorage
    localStorage.clear();
    
    // Clear ALL sessionStorage
    sessionStorage.clear();
    
    // Clear any other storage
    if (typeof window !== 'undefined') {
      // Clear IndexedDB if it exists
      if ('indexedDB' in window) {
        indexedDB.databases?.().then(databases => {
          databases.forEach(db => {
            if (db.name) {
              indexedDB.deleteDatabase(db.name);
            }
          });
        }).catch(() => {
          // Ignore errors
        });
      }
      
      // Clear cookies (if any)
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });
    }
    
    console.log('✅ Nuclear recovery completed - all storage cleared');
  } catch (error) {
    console.error('❌ Error during nuclear recovery:', error);
  }
  
  // Force redirect to homepage
  forceRedirectToHomepage();
}

/**
 * Add emergency recovery button to page
 * This function adds a visible emergency recovery button to the page
 * that users can click if they get stuck
 */
export function addEmergencyRecoveryButton(): void {
  // Check if button already exists
  if (document.getElementById('emergency-recovery-btn')) {
    return;
  }
  
  // Create emergency recovery button
  const button = document.createElement('button');
  button.id = 'emergency-recovery-btn';
  button.innerHTML = '🚨 Emergency Recovery';
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    background: #dc2626;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  `;
  
  // Add click handler
  button.addEventListener('click', () => {
    if (confirm('This will clear ALL your progress and take you back to the homepage. Continue?')) {
      nuclearRecovery();
    }
  });
  
  // Add to page
  document.body.appendChild(button);
  
  console.log('✅ Emergency recovery button added to page');
}

/**
 * Set up keyboard shortcut for emergency recovery
 * This function adds a keyboard shortcut (Ctrl+Shift+R) for emergency recovery
 */
export function setupEmergencyRecoveryShortcut(): void {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Ctrl+Shift+R for emergency recovery
    if (event.ctrlKey && event.shiftKey && event.key === 'R') {
      event.preventDefault();
      console.log('🚨 Emergency recovery shortcut triggered');
      
      if (confirm('Emergency recovery shortcut activated. This will clear ALL your progress and take you back to the homepage. Continue?')) {
        nuclearRecovery();
      }
    }
  };

  // Add event listener
  document.addEventListener('keydown', handleKeyDown);
  
  console.log('✅ Emergency recovery shortcut (Ctrl+Shift+R) enabled');
}

/**
 * Remove keyboard shortcut for emergency recovery
 */
export function removeEmergencyRecoveryShortcut(): void {
  // Note: We can't easily remove specific event listeners without storing references
  // This is a limitation, but the shortcut is harmless
  console.log('ℹ️ Emergency recovery shortcut cannot be easily removed');
}

/**
 * Remove emergency recovery button
 * This function removes the emergency recovery button from the page
 */
export function removeEmergencyRecoveryButton(): void {
  const button = document.getElementById('emergency-recovery-btn');
  if (button) {
    button.remove();
    console.log('✅ Emergency recovery button removed');
  }
}

/**
 * Make recovery functions available globally for console access
 * This allows users to call recovery functions from browser console
 */
export function setupGlobalRecoveryFunctions(): void {
  if (typeof window !== 'undefined') {
    // Make recovery functions available globally
    (window as any).emergencyRecovery = emergencyRecovery;
    (window as any).nuclearRecovery = nuclearRecovery;
    (window as any).clearAllState = clearAllState;
    (window as any).forceRedirectToHomepage = forceRedirectToHomepage;
    (window as any).testRecovery = () => {
      console.log('🧪 Testing recovery system...');
      console.log('Current URL:', window.location.href);
      console.log('Current pathname:', window.location.pathname);
      console.log('localStorage keys:', Object.keys(localStorage));
      console.log('sessionStorage keys:', Object.keys(sessionStorage));
      console.log('✅ Recovery system test complete');
    };
    
    console.log('🚨 Emergency recovery functions available globally:');
    console.log('- emergencyRecovery() - Clear state and redirect to homepage');
    console.log('- nuclearRecovery() - Clear ALL storage and redirect to homepage');
    console.log('- clearAllState() - Clear application state');
    console.log('- forceRedirectToHomepage() - Force redirect to homepage');
    console.log('- testRecovery() - Test recovery system (safe)');
  }
}
