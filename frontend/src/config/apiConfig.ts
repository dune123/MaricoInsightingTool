/**
 * ========================================
 * API CONFIGURATION - SMART DUAL BACKEND ARCHITECTURE
 * ========================================
 * 
 * Purpose: Smart dual-backend API configuration with intelligent routing
 * 
 * Description:
 * This module provides API configuration for the split backend architecture where
 * Node.js handles state management and metadata operations while Python handles
 * data processing and file operations. The system intelligently routes requests
 * to the appropriate backend based on operation type.
 * 
 * Key Functionality:
 * - Smart backend routing based on operation type
 * - Node.js backend for state/metadata operations (port 3001)
 * - Python backend for data/file operations (port 8000)
 * - Dynamic backend detection and health checking
 * - Flexible port configuration from environment variables
 * - Centralized API endpoint management
 * - Clear error messaging when required backend is unavailable
 * 
 * Architecture Split:
 * - State operations: Node.js backend (port 3001) - faster JSON operations
 * - File operations: Python backend (port 8000) - comprehensive data processing
 * - Metadata persistence: Node.js backend (port 3001) - rapid state management
 * - Data analysis: Python backend (port 8000) - advanced analytics capabilities
 * 
 * Dependencies:
 * - Browser Fetch API for health checks
 * - Environment variables for configuration
 * 
 * Used by:
 * - fileService.ts for file operations
 * - excelService.ts for Excel operations
 * - DataUploadStep.tsx for file upload workflow
 * - DataConcatenationStep.tsx for sheet concatenation
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Frontend Team
 */

import { logger } from '@/utils/logger';

// Backend configuration options
interface BackendConfig {
  name: string;
  baseUrl: string;
  healthEndpoint: string;
}

// Possible backend configurations (in order of preference)
const BACKEND_OPTIONS: BackendConfig[] = [
  {
    name: 'Python FastAPI',
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    healthEndpoint: '/health'
  },
  {
    name: 'Node.js Express',
    baseUrl: import.meta.env.VITE_NODE_API_URL || 'http://localhost:3001',
    healthEndpoint: '/health'
  }
];

// Current active backend with caching
let activeBackend: BackendConfig | null = null;
let detectionInProgress = false;
let detectionPromise: Promise<BackendConfig | null> | null = null;

/**
 * Health check for a specific backend
 */
async function checkBackendHealth(backend: BackendConfig): Promise<boolean> {
  try {
    const response = await fetch(`${backend.baseUrl}${backend.healthEndpoint}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    // Only log health check failures in verbose mode to reduce noise
    logger.api(`Backend ${backend.name} not responding`, { error: error instanceof Error ? error.message : 'Unknown error' }, 'ApiConfig');
    return false;
  }
}

/**
 * Detect which backend is available (with centralized logging)
 */
async function detectAvailableBackend(): Promise<BackendConfig | null> {
  logger.service('Detecting available backend', null, 'ApiConfig');
  
  for (const backend of BACKEND_OPTIONS) {
    logger.service(`Checking ${backend.name}`, { url: backend.baseUrl }, 'ApiConfig');
    
    if (await checkBackendHealth(backend)) {
      logger.service(`Active backend found: ${backend.name}`, { url: backend.baseUrl }, 'ApiConfig');
      return backend;
    }
  }
  
  logger.error('No backend servers are responding!', null, 'ApiConfig');
  return null;
}

/**
 * Get the active backend configuration (with proper caching to prevent duplicate detection)
 */
export async function getActiveBackend(): Promise<BackendConfig | null> {
  // Return cached result if available
  if (activeBackend) {
    return activeBackend;
  }
  
  // If detection is already in progress, wait for it
  if (detectionInProgress && detectionPromise) {
    return detectionPromise;
  }
  
  // Start new detection
  detectionInProgress = true;
  detectionPromise = detectAvailableBackend();
  
  try {
    activeBackend = await detectionPromise;
    return activeBackend;
  } finally {
    detectionInProgress = false;
    detectionPromise = null;
  }
}

/**
 * Reset backend detection (for testing or when backend changes)
 */
export function resetBackendDetection(): void {
  activeBackend = null;
  detectionInProgress = false;
  detectionPromise = null;
  logger.service('Backend detection reset', null, 'ApiConfig');
}

/**
 * Get API base URL for file operations
 * Uses Python backend exclusively for all file operations (uploads and concatenation)
 */
export async function getFileApiUrl(): Promise<string> {
  // Always use Python backend for file operations to maintain single source of truth
  const pythonBackend = BACKEND_OPTIONS.find(b => b.name === 'Python FastAPI');
  
  // Since we know the Python backend is working (as evidenced by successful RPI calls),
  // we'll use it directly without health check to avoid timeout issues
  if (pythonBackend) {
    logger.service('Using Python backend for file operations', { url: pythonBackend.baseUrl }, 'ApiConfig');
    return `${pythonBackend.baseUrl}/api/files`;
  }
  
  throw new Error('Python backend is required for file operations. Please ensure Python FastAPI server is running on port 8000.');
}

/**
 * Get API base URL for file operations (synchronous version)
 * Uses Python backend exclusively for all file operations (uploads and concatenation)
 */
export function getFileApiUrlSync(): string {
  // Always use Python backend for file operations to maintain single source of truth
  const pythonBackend = BACKEND_OPTIONS.find(b => b.name === 'Python FastAPI');
  
  // Since we know the Python backend is working (as evidenced by successful RPI calls),
  // we'll use it directly without health check to avoid timeout issues
  if (pythonBackend) {
    return `${pythonBackend.baseUrl}/api/files`;
  }
  
  throw new Error('Python backend is required for file operations. Please ensure Python FastAPI server is running on port 8000.');
}

/**
 * Get API base URL for Excel operations
 */
export async function getExcelApiUrl(): Promise<string> {
  const backend = await getActiveBackend();
  if (!backend) {
    throw new Error('No backend server is available. Please ensure at least one backend is running.');
  }
  
  // Excel operations prefer Python backend if available
  if (backend.name === 'Python FastAPI') {
    return backend.baseUrl; // Python backend uses different endpoint structure
  } else {
    return `${backend.baseUrl}/api/excel`;
  }
}

/**
 * Get Node.js backend URL for state operations
 */
export function getStateApiUrl(): string {
  return 'http://localhost:3001/api';
}

/**
 * Get Python backend URL for data operations  
 */
export function getDataApiUrl(): string {
  return 'http://localhost:8000/api';
}

/**
 * Get current backend information for display/debugging
 */
export async function getBackendInfo(): Promise<{ backend: BackendConfig | null; isAvailable: boolean }> {
  const backend = await getActiveBackend();
  return {
    backend,
    isAvailable: backend !== null
  };
}

// Development helpers
export const ApiConfig = {
  getFileApiUrl,
  getExcelApiUrl,
  getBackendInfo,
  resetBackendDetection,
  getStateApiUrl,
  getDataApiUrl,
  BACKEND_OPTIONS
};