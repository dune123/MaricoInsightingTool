/**
 * ========================================
 * API ENDPOINTS - SHARED CONSTANTS
 * ========================================
 * 
 * Purpose: Centralized API endpoint definitions
 * 
 * Description:
 * Contains all API endpoint constants used throughout the application.
 * Provides type safety and single source of truth for API routes.
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

/**
 * Base API configuration
 */
export const API_BASE = {
  PYTHON_BACKEND: 'http://localhost:8000/api',
  NODE_BACKEND: 'http://localhost:3001/api'
} as const;

/**
 * File operation endpoints
 */
export const FILE_ENDPOINTS = {
  UPLOAD: '/files/upload',
  LIST: '/files/list',
  LIST_CONCATENATED: '/files/list-concatenated',
  DELETE: '/files/delete'
} as const;

/**
 * Data operation endpoints
 */
export const DATA_ENDPOINTS = {
  FILTERED: '/data/filtered',
  CONCATENATE: '/data/concatenate',
  PREVIEW: '/data/preview',
  SUMMARY: '/data/summary'
} as const;

/**
 * Analysis endpoints
 */
export const ANALYSIS_ENDPOINTS = {
  LIST: '/analyses',
  CREATE: '/analyses',
  GET: '/analyses',
  UPDATE: '/analyses',
  DELETE: '/analyses'
} as const;

/**
 * Metadata endpoints
 */
export const METADATA_ENDPOINTS = {
  SAVE_STATE: '/metadata/save-state',
  GET_STATE: '/metadata/get-state',
  DELETE_STATE: '/metadata/delete-state'
} as const;

/**
 * Brand analysis endpoints
 */
export const BRAND_ENDPOINTS = {
  EXTRACT: '/brand/extract',
  CATEGORIZE: '/brand/categorize',
  METADATA: '/brand/metadata'
} as const;

/**
 * Health check endpoints
 */
export const HEALTH_ENDPOINTS = {
  STATUS: '/health/status',
  CHECK: '/health/check'
} as const;

/**
 * Complete endpoint collections by feature
 */
export const ENDPOINTS = {
  FILES: FILE_ENDPOINTS,
  DATA: DATA_ENDPOINTS,
  ANALYSIS: ANALYSIS_ENDPOINTS,
  METADATA: METADATA_ENDPOINTS,
  BRAND: BRAND_ENDPOINTS,
  HEALTH: HEALTH_ENDPOINTS
} as const;

/**
 * Utility functions for endpoint construction
 */
export const endpointUtils = {
  /**
   * Build full URL for Python backend
   */
  python: (endpoint: string): string => {
    return `${API_BASE.PYTHON_BACKEND}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  },

  /**
   * Build full URL for Node backend
   */
  node: (endpoint: string): string => {
    return `${API_BASE.NODE_BACKEND}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  },

  /**
   * Get endpoint with parameters
   */
  withParams: (endpoint: string, params: Record<string, string | number>): string => {
    const url = new URL(endpoint, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
    return url.pathname + url.search;
  },

  /**
   * Replace path parameters in endpoint
   */
  withPathParams: (endpoint: string, params: Record<string, string | number>): string => {
    let result = endpoint;
    Object.entries(params).forEach(([key, value]) => {
      result = result.replace(`:${key}`, String(value));
    });
    return result;
  }
};
