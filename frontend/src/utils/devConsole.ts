/**
 * ========================================
 * BRANDBLOOM INSIGHTS - DEVELOPMENT CONSOLE UTILITIES
 * ========================================
 * 
 * Purpose: Development utilities exposed to the browser console for debugging and cleanup
 * 
 * Description:
 * This module exposes utility functions to the global window object for easy access
 * during development. These functions help with debugging, cleanup, and testing
 * the application.
 * 
 * Key Functions:
 * - cleanupBrand(brandName): Clean up analysis data for any specific brand
 * - cleanupAll(): Clean up ALL analyses in the entire system
 * - listAnalyses(): List all existing analyses
 * - getState(): Get current analysis context state
 * 
 * Usage:
 * Open browser console and type:
 * - cleanupBrand('X-Men') - Clean up X-Men analysis
 * - cleanupBrand('MBL') - Clean up MBL analysis
 * - cleanupAll() - Clean up all analyses
 * - listAnalyses() - List all analyses
 * - getState() - Get current state
 * 
 * Important Notes:
 * - These functions are only available in development mode
 * - Always use these instead of manually deleting folders
 * - The backend persists analysis metadata that needs proper cleanup
 * 
 * Used by:
 * - Development and testing
 * - Debugging and troubleshooting
 * - Clean slate operations
 * 
 * Dependencies:
 * - analysisCleanup utility functions
 * - AnalysisContext for state access
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 * 
 * Recent Fixes:
 * - Removed hardcoded brand-specific cleanup functions to avoid console pollution
 * - Added generic cleanupBrand() function for any brand name
 */

import { 
  cleanupBrandAnalyses, 
  cleanupAllSystemAnalyses 
} from './analysisCleanup';

// Only expose in development mode
if (process.env.NODE_ENV === 'development') {
  
  // Cleanup functions
  (window as any).cleanupBrand = cleanupBrandAnalyses;
  (window as any).cleanupAll = cleanupAllSystemAnalyses;
  
  // Debug control functions
  (window as any).enableDebugAPI = () => {
    localStorage.setItem('bb_debug_api', 'true');
    console.log('✅ API debug logging enabled');
  };
  
  (window as any).enableDebugServices = () => {
    localStorage.setItem('bb_debug_services', 'true');
    console.log('✅ Service debug logging enabled');
  };
  
  (window as any).enableDebugVerbose = () => {
    localStorage.setItem('bb_debug_verbose', 'true');
    console.log('✅ Verbose debug logging enabled');
  };
  
  (window as any).disableAllDebug = () => {
    localStorage.removeItem('bb_debug_api');
    localStorage.removeItem('bb_debug_services');
    localStorage.removeItem('bb_debug_verbose');
    console.log('✅ All debug logging disabled - refresh page to see effect');
  };
  
  // Utility functions - DELEGATED to avoid duplicate logging
  (window as any).listAnalyses = async () => {
    try {
      const { brandAnalysisService } = await import('@/analysis/mmm/services/brandAnalysisService');
      return await brandAnalysisService.listAnalyses(); // Let the service handle logging
    } catch (error) {
      console.error('❌ Failed to list analyses:', error);
    }
  };
  
  (window as any).getState = () => {
    try {
      // This will only work if AnalysisContext is available
      const { useAnalysis } = require('@/context/AnalysisContext');
      console.log('⚠️ getState() can only be called from React components');
      console.log('💡 Use the React DevTools to inspect component state instead');
    } catch (error) {
      console.log('⚠️ AnalysisContext not available in this context');
    }
  };
  
  // Log available functions (only once per session and only if verbose debug is enabled)
  if (!(window as any).devConsoleLogged) {
    if (localStorage.getItem('bb_debug_verbose') === 'true') {
      console.log('🧹 Marico Development Console Utilities Available:');
      console.log('  - cleanupBrand(brandName) - Clean up analysis for any brand (e.g., cleanupBrand("X-Men"))');
      console.log('  - cleanupAll() - Clean up ALL analyses in the entire system');
      console.log('  - listAnalyses() - List all existing analyses');
      console.log('  - getState() - Get current analysis context state');
      console.log('');
      console.log('🔧 Debug Control Functions:');
      console.log('  - enableDebugAPI() - Enable API request/response logging');
      console.log('  - enableDebugServices() - Enable service operation logging');
      console.log('  - enableDebugVerbose() - Enable verbose debugging');
      console.log('  - disableAllDebug() - Turn off all debug logging');
      console.log('💡 Use these functions instead of manually deleting folders!');
    }
    (window as any).devConsoleLogged = true;
  }
  
} else {
  // In production, don't expose anything
  console.log('🔒 Development console utilities not available in production');
}
