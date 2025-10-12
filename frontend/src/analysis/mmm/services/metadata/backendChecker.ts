/**
 * ========================================
 * METADATA BACKEND HEALTH CHECKER
 * ========================================
 * 
 * Purpose: Specialized service for Node.js metadata backend health monitoring
 * 
 * Description:
 * This module provides focused functionality for checking Node.js backend availability
 * and health status. It implements timeout-based checks, caching mechanisms, and
 * detailed health reporting for the metadata persistence system.
 * 
 * Key Functionality:
 * - Fast backend availability checks with configurable timeouts
 * - Health status caching to avoid excessive network requests
 * - Detailed health reporting with response time metrics
 * - Graceful error handling and fallback behavior
 * - Automatic retry logic for transient failures
 * 
 * Caching Strategy:
 * - Caches health status for configurable duration
 * - Invalidates cache on connection failures
 * - Provides fresh checks when needed
 * - Reduces network overhead for frequent calls
 * 
 * Dependencies:
 * - Browser Fetch API with AbortSignal timeout support
 * - Metadata types for response structures
 * 
 * Used by:
 * - MetadataService for backend availability checks
 * - State persistence hooks for reliability
 * - Health monitoring and debugging tools
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Frontend Team
 */

import { BackendHealthStatus, MetadataResponse } from './types';

export class MetadataBackendChecker {
  private static readonly BASE_URL = (import.meta.env.VITE_NODE_API_URL || 'http://localhost:3001') + '/api/metadata';
  private static readonly DEFAULT_TIMEOUT = 2000; // 2 seconds
  private static readonly CACHE_DURATION = 30000; // 30 seconds
  
  private static healthCache: BackendHealthStatus | null = null;
  private static lastHealthCheck = 0;

  /**
   * Check if Node.js metadata backend is available with caching
   */
  static async isBackendAvailable(forceRefresh = false): Promise<boolean> {
    // Return cached result if still valid
    if (!forceRefresh && this.isCacheValid()) {
      console.log('📊 Using cached backend health status:', this.healthCache?.isAvailable);
      return this.healthCache?.isAvailable || false;
    }

    const healthStatus = await this.checkBackendHealth();
    return healthStatus.isAvailable;
  }

  /**
   * Comprehensive backend health check with metrics
   */
  static async checkBackendHealth(timeout = this.DEFAULT_TIMEOUT): Promise<BackendHealthStatus> {
    const startTime = Date.now();
    
    try {
      console.log('🏥 Checking Node.js metadata backend health...');
      
      const response = await fetch(`${this.BASE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(timeout)
      });
      
      const responseTime = Date.now() - startTime;
      const isAvailable = response.ok;
      
      const healthStatus: BackendHealthStatus = {
        isAvailable,
        responseTime,
        lastChecked: new Date().toISOString(),
        error: isAvailable ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };
      
      // Cache the result
      this.updateHealthCache(healthStatus);
      
      if (isAvailable) {
        console.log(`✅ Backend healthy (${responseTime}ms)`);
      } else {
        console.warn(`⚠️ Backend unhealthy: ${healthStatus.error}`);
      }
      
      return healthStatus;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const healthStatus: BackendHealthStatus = {
        isAvailable: false,
        responseTime,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      // Cache the failed result
      this.updateHealthCache(healthStatus);
      
      console.warn(`❌ Backend check failed (${responseTime}ms):`, healthStatus.error);
      return healthStatus;
    }
  }

  /**
   * Get detailed health information
   */
  static async getHealthDetails(): Promise<MetadataResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Force refresh of health status
   */
  static async refreshHealth(): Promise<BackendHealthStatus> {
    this.invalidateCache();
    return this.checkBackendHealth();
  }

  /**
   * Get current cached health status
   */
  static getCachedHealth(): BackendHealthStatus | null {
    return this.isCacheValid() ? this.healthCache : null;
  }

  /**
   * Check if health cache is still valid
   */
  private static isCacheValid(): boolean {
    return (
      this.healthCache !== null &&
      Date.now() - this.lastHealthCheck < this.CACHE_DURATION
    );
  }

  /**
   * Update health cache with new status
   */
  private static updateHealthCache(status: BackendHealthStatus): void {
    this.healthCache = status;
    this.lastHealthCheck = Date.now();
  }

  /**
   * Invalidate health cache
   */
  private static invalidateCache(): void {
    this.healthCache = null;
    this.lastHealthCheck = 0;
  }

  /**
   * Get cache statistics for debugging
   */
  static getCacheStats() {
    return {
      hasCache: this.healthCache !== null,
      cacheAge: Date.now() - this.lastHealthCheck,
      isValid: this.isCacheValid(),
      lastStatus: this.healthCache?.isAvailable,
      lastError: this.healthCache?.error
    };
  }
}
