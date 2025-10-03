/**
 * ========================================
 * BRANDBLOOM INSIGHTS - ANALYSIS CLEANUP UTILITY
 * ========================================
 * 
 * Purpose: Utility functions for properly cleaning up analyses through API endpoints
 * 
 * Description:
 * This utility provides functions to properly delete analyses and their associated data
 * through the backend API instead of manually deleting folders. This ensures that
 * all references to the analysis are properly removed from the system.
 * 
 * Key Functions:
 * - cleanupAnalysis(): Deletes analysis through proper API endpoint
 * - cleanupAllAnalyses(): Deletes all analyses for a specific brand
 * - cleanupAllSystemAnalyses(): Deletes all analyses in the entire system
 * - cleanupBrandData(): Removes all brand-related data
 * 
 * Important Notes:
 * - Manual folder deletion will cause data to reappear because the backend persists
 *   analysis metadata in JSON files
 * - Always use these utility functions instead of manual folder deletion
 * - The backend maintains analysis state even when folders are manually removed
 * 
 * Used by:
 * - Development and testing scenarios
 * - Clean slate operations
 * - Debugging and troubleshooting
 * 
 * Dependencies:
 * - brandAnalysisService for API calls
 * - Console logging for operation tracking
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 * 
 * Recent Fixes:
 * - Fixed duplicate function identifier 'cleanupAllAnalyses' by renaming system-wide
 *   cleanup function to 'cleanupAllSystemAnalyses' for clarity
 * - Removed hardcoded brand-specific cleanup functions to avoid console pollution
 */

import { brandAnalysisService } from '@/analysis/mmm/services/brandAnalysisService';

/**
 * Clean up a specific analysis by ID with comprehensive localStorage cleanup
 */
export async function cleanupAnalysis(analysisId: string): Promise<boolean> {
  try {
    console.log('🧹 Cleaning up analysis:', analysisId);
    
    const result = await brandAnalysisService.deleteAnalysis(analysisId);
    
    if (result.success) {
      console.log('✅ Analysis cleaned up successfully:', analysisId);
      
      // 🆕 COMPREHENSIVE CLEANUP: Clean up localStorage
      if (result.data?.localStorage_cleanup_required && result.data?.localStorage_keys_to_clear) {
        console.log('🧹 Cleaning up localStorage for analysis:', analysisId);
        
        const keysToClean = result.data.localStorage_keys_to_clear;
        let localStorageKeysCleared = 0;
        
        keysToClean.forEach((key: string) => {
          if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            localStorageKeysCleared++;
            console.log(`✅ Cleared localStorage key: ${key}`);
          }
        });
        
        // Also clean up any other keys that might contain the analysisId
        const allLocalStorageKeys = Object.keys(localStorage);
        const additionalKeysCleared = allLocalStorageKeys.filter(key => 
          key.toLowerCase().includes(analysisId.toLowerCase())
        );
        
        additionalKeysCleared.forEach(key => {
          localStorage.removeItem(key);
          localStorageKeysCleared++;
          console.log(`✅ Cleared additional localStorage key: ${key}`);
        });
        
        if (localStorageKeysCleared > 0) {
          console.log(`🎯 localStorage cleanup complete: ${localStorageKeysCleared} keys cleared for analysis ${analysisId}`);
        } else {
          console.log(`ℹ️ No localStorage data found for analysis ${analysisId}`);
        }
      }
      
      return true;
    } else {
      console.error('❌ Failed to cleanup analysis:', analysisId, result.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error during analysis cleanup:', analysisId, error);
    return false;
  }
}

/**
 * Clean up all analyses for a specific brand
 */
export async function cleanupAllAnalyses(brandName: string): Promise<boolean> {
  try {
    console.log('🧹 Cleaning up all analyses for brand:', brandName);
    
    // First, list all analyses to find the ones for this brand
    const listResult = await brandAnalysisService.listAnalyses();
    
    if (!listResult.success || !listResult.data) {
      console.log('ℹ️ No analyses found to cleanup');
      return true;
    }
    
    const brandAnalyses = listResult.data.filter(
      analysis => analysis.brandName.toLowerCase() === brandName.toLowerCase()
    );
    
    if (brandAnalyses.length === 0) {
      console.log('ℹ️ No analyses found for brand:', brandName);
      return true;
    }
    
    console.log(`📋 Found ${brandAnalyses.length} analyses to cleanup for brand:`, brandName);
    
    // Delete each analysis
    let successCount = 0;
    for (const analysis of brandAnalyses) {
      const deleteResult = await cleanupAnalysis(analysis.analysisId);
      if (deleteResult) {
        successCount++;
      }
    }
    
    console.log(`✅ Cleaned up ${successCount}/${brandAnalyses.length} analyses for brand:`, brandName);
    return successCount === brandAnalyses.length;
    
  } catch (error) {
    console.error('❌ Error during brand analysis cleanup:', brandName, error);
    return false;
  }
}

/**
 * Clean up all analyses in the system (use with caution!)
 */
export async function cleanupAllSystemAnalyses(): Promise<boolean> {
  try {
    console.log('🧹 Cleaning up ALL analyses in the system');
    
    // List all analyses
    const listResult = await brandAnalysisService.listAnalyses();
    
    if (!listResult.success || !listResult.data) {
      console.log('ℹ️ No analyses found to cleanup');
      return true;
    }
    
    console.log(`📋 Found ${listResult.data.length} analyses to cleanup`);
    
    // Delete each analysis
    let successCount = 0;
    for (const analysis of listResult.data) {
      const deleteResult = await cleanupAnalysis(analysis.analysisId);
      if (deleteResult) {
        successCount++;
      }
    }
    
    console.log(`✅ Cleaned up ${successCount}/${listResult.data.length} analyses`);
    return successCount === listResult.data.length;
    
  } catch (error) {
    console.error('❌ Error during system-wide analysis cleanup:', error);
    return false;
  }
}

/**
 * Generic cleanup function for any brand (replaces hardcoded brand functions)
 */
export async function cleanupBrandAnalyses(brandName: string): Promise<boolean> {
  console.log(`🧹 Cleaning up analyses for brand: ${brandName}`);
  return await cleanupAllAnalyses(brandName);
}
